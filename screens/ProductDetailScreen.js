import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
    RefreshControl
} from 'react-native';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';

const PurchaseOrdersScreen = () => {
    // Main states
    const [view, setView] = useState('list'); // 'list', 'create', 'detail'
    const [firebaseId, setFirebaseId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Purchase order list states
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);

    // Purchase order creation states
    const [purchaseOrder, setPurchaseOrder] = useState({
        supplier: null,
        expected_delivery_date: null,
        notes: '',
        items: []
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdOrder, setCreatedOrder] = useState(null);

    // Data lists
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [currentItem, setCurrentItem] = useState({
        product: null,
        quantity: '1',
        cost_price: '',
        notes: ''
    });

    // Initialize auth and fetch data
    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
            setFirebaseId(user.uid);
            fetchData(user.uid);
        }
    }, []);

    // Filter orders based on search query
    useEffect(() => {
        if (!searchQuery) {
            setFilteredOrders(purchaseOrders);
            return;
        }
        const filtered = purchaseOrders.filter(po =>
            po.po_number.includes(searchQuery) ||
            po.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredOrders(filtered);
    }, [searchQuery, purchaseOrders]);

    const fetchData = async (firebaseUserId) => {
        try {
            setRefreshing(true);
            await Promise.all([
                fetchPurchaseOrders(firebaseUserId),
                fetchSuppliers(firebaseUserId),
                fetchProducts(firebaseUserId)
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setRefreshing(false);
        }
    };

    const fetchPurchaseOrders = async (firebaseUserId) => {
        try {
            const response = await fetch(`http://your-backend-url/api/purchase-orders/${firebaseUserId}/`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch purchase orders');
            }

            setPurchaseOrders(data);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            Alert.alert('Error', error.message);
        }
    };

    const fetchSuppliers = async (firebaseUserId) => {
        try {
            const response = await fetch(`http://your-backend-url/api/suppliers/${firebaseUserId}/`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch suppliers');
            }

            setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            Alert.alert('Error', error.message);
        }
    };

    const fetchProducts = async (firebaseUserId) => {
        try {
            const response = await fetch(`http://your-backend-url/api/products/${firebaseUserId}/`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch products');
            }

            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            Alert.alert('Error', error.message);
        }
    };

    const handleCreatePurchaseOrder = async () => {
        if (!firebaseId) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        if (!purchaseOrder.supplier || purchaseOrder.items.length === 0) {
            Alert.alert('Error', 'Supplier and at least one item are required');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`http://your-backend-url/api/purchase-orders/${firebaseId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    supplier: purchaseOrder.supplier.id,
                    expected_delivery_date: purchaseOrder.expected_delivery_date,
                    notes: purchaseOrder.notes,
                    items: purchaseOrder.items.map(item => ({
                        product: item.product.id,
                        quantity: item.quantity,
                        cost_price: item.cost_price,
                        notes: item.notes
                    }))
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create purchase order');
            }

            Alert.alert(
                'Success',
                'Purchase order created successfully',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setCreatedOrder(data);
                            setSuccess(true);
                            fetchPurchaseOrders(firebaseId);
                            resetForm();
                        }
                    }
                ]
            );

        } catch (error) {
            Alert.alert(
                'Error',
                error.message,
                [
                    {
                        text: 'Retry',
                        onPress: handleCreatePurchaseOrder
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        if (!currentItem.product || !currentItem.cost_price) {
            Alert.alert('Error', 'Product and cost price are required');
            return;
        }

        setPurchaseOrder({
            ...purchaseOrder,
            items: [...purchaseOrder.items, {
                ...currentItem,
                id: Date.now().toString()
            }]
        });

        setCurrentItem({
            product: null,
            quantity: '1',
            cost_price: '',
            notes: ''
        });
    };

    const handleRemoveItem = (itemId) => {
        setPurchaseOrder({
            ...purchaseOrder,
            items: purchaseOrder.items.filter(item => item.id !== itemId)
        });
    };

    const generatePDF = async (orderId) => {
        try {
            const response = await fetch(
                `http://your-backend-url/api/purchase-orders/${firebaseId}/${orderId}/generate-pdf/`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/pdf',
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate PDF');
            }

            // Here you would handle the PDF file (open in viewer, download, etc.)
            Alert.alert('Success', 'PDF generated successfully');

        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const resetForm = () => {
        setPurchaseOrder({
            supplier: null,
            expected_delivery_date: null,
            notes: '',
            items: []
        });
        setSuccess(false);
        setCreatedOrder(null);
        setView('list');
    };

    const viewOrderDetails = (order) => {
        setPurchaseOrder({
            ...order,
            supplier: { id: order.supplier, name: order.supplier_name }
        });
        setView('detail');
    };

    const renderOrderItem = ({ item }) => (
        <View style={styles.orderItem}>
            <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>PO #{item.po_number}</Text>
                <Text style={styles.orderSupplier}>{item.supplier_name}</Text>
                <Text style={styles.orderDate}>
                    {new Date(item.order_date).toLocaleDateString()}
                </Text>
                <Text style={styles.orderTotal}>Total: ${item.total_cost.toFixed(2)}</Text>
            </View>
            <View style={styles.orderActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => viewOrderDetails(item)}
                >
                    <Icon name="visibility" size={20} color="#4e73df" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => generatePDF(item.id)}
                >
                    <Icon name="picture-as-pdf" size={20} color="#e74a3b" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderOrderList = () => (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search purchase orders..."
                    placeholderTextColor="#adb5bd"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setView('create')}
                >
                    <Icon name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredOrders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchData(firebaseId)}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No purchase orders found</Text>
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );

    const renderOrderForm = () => (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formCard}>
                <Text style={styles.formTitle}>Create Purchase Order</Text>

                {/* Supplier Selection */}
                <TouchableOpacity
                    style={styles.inputGroup}
                    onPress={() => setShowSupplierDropdown(true)}
                >
                    <Icon name="local-shipping" size={24} color="#6c757d" style={styles.inputIcon} />
                    <Text style={styles.dropdownText}>
                        {purchaseOrder.supplier?.name || 'Select Supplier*'}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color="#6c757d" />
                </TouchableOpacity>

                {/* Expected Delivery Date */}
                <View style={styles.inputGroup}>
                    <Icon name="event" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputField}
                        placeholder="Expected Delivery Date (YYYY-MM-DD)"
                        value={purchaseOrder.expected_delivery_date}
                        onChangeText={(text) => setPurchaseOrder({...purchaseOrder, expected_delivery_date: text})}
                    />
                </View>

                {/* Notes */}
                <View style={styles.inputGroup}>
                    <Icon name="notes" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.inputField, styles.multilineInput]}
                        placeholder="Notes"
                        multiline
                        numberOfLines={4}
                        value={purchaseOrder.notes}
                        onChangeText={(text) => setPurchaseOrder({...purchaseOrder, notes: text})}
                    />
                </View>

                {/* Items Section */}
                <Text style={styles.sectionTitle}>Order Items</Text>

                {/* Current Items List */}
                {purchaseOrder.items.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                            <Text style={styles.itemName}>{item.product.name}</Text>
                            <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                                <Icon name="delete" size={20} color="#e74a3b" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.itemDetails}>
                            <Text>Quantity: {item.quantity}</Text>
                            <Text>Unit Price: ${item.cost_price}</Text>
                            <Text>Total: ${(item.quantity * item.cost_price).toFixed(2)}</Text>
                        </View>
                        {item.notes && (
                            <Text style={styles.itemNotes}>Notes: {item.notes}</Text>
                        )}
                    </View>
                ))}

                {/* Add New Item Form */}
                <Text style={styles.sectionTitle}>Add New Item</Text>

                {/* Product Selection */}
                <TouchableOpacity
                    style={styles.inputGroup}
                    onPress={() => setShowProductDropdown(true)}
                >
                    <Icon name="inventory" size={24} color="#6c757d" style={styles.inputIcon} />
                    <Text style={styles.dropdownText}>
                        {currentItem.product?.name || 'Select Product*'}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color="#6c757d" />
                </TouchableOpacity>

                {/* Quantity */}
                <View style={styles.inputGroup}>
                    <Icon name="format-list-numbered" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputField}
                        placeholder="Quantity*"
                        keyboardType="numeric"
                        value={currentItem.quantity}
                        onChangeText={(text) => setCurrentItem({...currentItem, quantity: text})}
                    />
                </View>

                {/* Cost Price */}
                <View style={styles.inputGroup}>
                    <Icon name="attach-money" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputField}
                        placeholder="Cost Price*"
                        keyboardType="numeric"
                        value={currentItem.cost_price}
                        onChangeText={(text) => setCurrentItem({...currentItem, cost_price: text})}
                    />
                </View>

                {/* Item Notes */}
                <View style={styles.inputGroup}>
                    <Icon name="notes" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.inputField, styles.multilineInput]}
                        placeholder="Item Notes"
                        multiline
                        numberOfLines={2}
                        value={currentItem.notes}
                        onChangeText={(text) => setCurrentItem({...currentItem, notes: text})}
                    />
                </View>

                {/* Add Item Button */}
                <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={handleAddItem}
                >
                    <Icon name="add" size={20} color="#fff" />
                    <Text style={styles.addItemButtonText}>Add Item</Text>
                </TouchableOpacity>

                {/* Submit Order Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.buttonDisabled]}
                    onPress={handleCreatePurchaseOrder}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Icon name="save" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}> Create Purchase Order</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={resetForm}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>

            {/* Supplier Dropdown Modal */}
            <Modal
                visible={showSupplierDropdown}
                transparent
                animationType="slide"
                onRequestClose={() => setShowSupplierDropdown(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Supplier</Text>
                        <FlatList
                            data={suppliers}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setPurchaseOrder({...purchaseOrder, supplier: item});
                                        setShowSupplierDropdown(false);
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{item.name}</Text>
                                    {purchaseOrder.supplier?.id === item.id && (
                                        <Icon name="check" size={20} color="#4BB543" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowSupplierDropdown(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Product Dropdown Modal */}
            <Modal
                visible={showProductDropdown}
                transparent
                animationType="slide"
                onRequestClose={() => setShowProductDropdown(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Product</Text>
                        <FlatList
                            data={products}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setCurrentItem({...currentItem, product: item});
                                        setShowProductDropdown(false);
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>
                                        {item.name} (${item.price})
                                    </Text>
                                    {currentItem.product?.id === item.id && (
                                        <Icon name="check" size={20} color="#4BB543" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowProductDropdown(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );

    const renderOrderDetail = () => (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                    <TouchableOpacity onPress={() => setView('list')}>
                        <Icon name="arrow-back" size={24} color="#4e73df" />
                    </TouchableOpacity>
                    <Text style={styles.detailTitle}>PO #{purchaseOrder.po_number}</Text>
                    <TouchableOpacity onPress={() => generatePDF(purchaseOrder.id)}>
                        <Icon name="picture-as-pdf" size={24} color="#e74a3b" />
                    </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Supplier:</Text>
                    <Text style={styles.detailValue}>{purchaseOrder.supplier_name}</Text>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Order Date:</Text>
                    <Text style={styles.detailValue}>
                        {new Date(purchaseOrder.order_date).toLocaleDateString()}
                    </Text>
                </View>

                {purchaseOrder.expected_delivery_date && (
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Expected Delivery:</Text>
                        <Text style={styles.detailValue}>
                            {new Date(purchaseOrder.expected_delivery_date).toLocaleDateString()}
                        </Text>
                    </View>
                )}

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(purchaseOrder.status) }
                    ]}>
                        <Text style={styles.statusText}>{purchaseOrder.status_display}</Text>
                    </View>
                </View>

                <Text style={styles.itemsTitle}>Order Items</Text>
                {purchaseOrder.items.map((item, index) => (
                    <View key={item.id || index} style={styles.detailItem}>
                        <Text style={styles.itemName}>{index + 1}. {item.product_name}</Text>
                        <View style={styles.itemRow}>
                            <Text>Quantity: {item.quantity}</Text>
                            <Text>Unit Price: ${item.cost_price}</Text>
                            <Text>Total: ${(item.quantity * item.cost_price).toFixed(2)}</Text>
                        </View>
                        {item.notes && (
                            <Text style={styles.itemNotes}>Notes: {item.notes}</Text>
                        )}
                    </View>
                ))}

                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Order Total:</Text>
                    <Text style={styles.totalAmount}>
                        ${purchaseOrder.items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0).toFixed(2)}
                    </Text>
                </View>

                {purchaseOrder.notes && (
                    <View style={styles.notesSection}>
                        <Text style={styles.notesLabel}>Notes:</Text>
                        <Text style={styles.notesText}>{purchaseOrder.notes}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return '#6c757d';
            case 'sent': return '#17a2b8';
            case 'partial': return '#ffc107';
            case 'completed': return '#28a745';
            case 'cancelled': return '#dc3545';
            default: return '#6c757d';
        }
    };

    switch (view) {
        case 'create':
            return renderOrderForm();
        case 'detail':
            return renderOrderDetail();
        default:
            return renderOrderList();
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f5f7fa',
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginRight: 10,
    },
    addButton: {
        backgroundColor: '#4e73df',
        width: 50,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderItem: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    orderInfo: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },
    orderSupplier: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 5,
    },
    orderDate: {
        fontSize: 12,
        color: '#6c757d',
        marginBottom: 5,
    },
    orderTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4e73df',
    },
    orderActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        marginLeft: 15,
    },
    listContent: {
        paddingBottom: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#6c757d',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#f5f7fa',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 25,
        textAlign: 'center',
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e9ecef',
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    inputField: {
        flex: 1,
        height: '100%',
        fontSize: 16,
    },
    dropdownText: {
        flex: 1,
        fontSize: 16,
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 15,
        color: '#4e73df',
    },
    itemCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
    },
    itemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    itemNotes: {
        fontStyle: 'italic',
        color: '#6c757d',
    },
    addItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4e73df',
        padding: 15,
        borderRadius: 15,
        marginTop: 10,
        marginBottom: 20,
    },
    addItemButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4e73df',
        padding: 15,
        borderRadius: 15,
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#adb5bd',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
    cancelButton: {
        backgroundColor: '#6c757d',
        padding: 15,
        borderRadius: 15,
        marginTop: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 10,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    dropdownItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownItemText: {
        fontSize: 16,
    },
    closeButton: {
        padding: 15,
        backgroundColor: '#4e73df',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    closeButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
    },
    detailCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        width: '100%',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    detailSection: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    detailLabel: {
        fontWeight: '600',
        width: 120,
    },
    detailValue: {
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    itemsTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 15,
        color: '#4e73df',
    },
    detailItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    totalLabel: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    totalAmount: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#4e73df',
    },
    notesSection: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    notesLabel: {
        fontWeight: '600',
        marginBottom: 5,
    },
    notesText: {
        color: '#6c757d',
    },
});

export default PurchaseOrdersScreen;