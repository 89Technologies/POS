import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { DataTable, Button, TextInput, Modal, Portal, Provider } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as Print from 'expo-print';
import { getAuth } from 'firebase/auth';

const API_BASE_URL = 'http://192.168.170.172:8000/Sales';

const PurchaseOrderScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [visible, setVisible] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [formData, setFormData] = useState({
        supplier_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        notes: '',
        items: [{ product_id: '', quantity: '1', cost_price: '0' }]
    });

    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '$0.00';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
    };

    const getFirebaseId = () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Authentication Required', 'Please login to access this feature');
                navigation.navigate('Login');
                return null;
            }
            return user.uid;
        } catch (error) {
            console.error('Firebase auth error:', error);
            Alert.alert('Error', 'Failed to authenticate user');
            return null;
        }
    };

    const fetchData = async () => {
        const firebaseId = getFirebaseId();
        if (!firebaseId) return;

        setLoading(true);
        try {
            const [ordersRes, suppliersRes, productsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/purchase-orders/${firebaseId}/`),
                axios.get(`${API_BASE_URL}/suppliers/${firebaseId}/`),
                axios.get(`${API_BASE_URL}/products/${firebaseId}/`)
            ]);

            setOrders(ordersRes.data.map(order => ({
                ...order,
                total_cost: order.total_cost || 0,
                po_number: order.po_number || 'N/A',
                supplier: order.supplier || 'N/A'
            })));

            setSuppliers(suppliersRes.data);
            setProducts(productsRes.data.map(product => ({
                ...product,
                cost_price: product.cost_price || 0
            })));
        } catch (error) {
            console.error('Data fetch error:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to fetch data. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchData);
        return unsubscribe;
    }, [navigation]);

    const handleInputChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, name, value) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [name]: value };

            if (name === 'product_id') {
                const product = products.find(p => p.id === value);
                newItems[index].cost_price = product?.cost_price?.toString() || '0';
            }

            return { ...prev, items: newItems };
        });
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { product_id: '', quantity: '1', cost_price: '0' }]
        }));
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleEdit = async (order) => {
        const firebaseId = getFirebaseId();
        if (!firebaseId) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/purchase-orders/detail/${order.id}/${firebaseId}/`);
            setCurrentOrder(response.data);
            setFormData({
                supplier_id: response.data.supplier_id || '',
                order_date: response.data.order_date || new Date().toISOString().split('T')[0],
                expected_delivery_date: response.data.expected_delivery_date || '',
                notes: response.data.notes || '',
                items: response.data.items?.map(item => ({
                    product_id: item.product_id || '',
                    quantity: item.quantity?.toString() || '1',
                    cost_price: item.cost_price?.toString() || '0'
                })) || [{ product_id: '', quantity: '1', cost_price: '0' }]
            });
            setVisible(true);
        } catch (error) {
            console.error('Order details error:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to load order details. Please try again.');
        }
    };

    const handleSubmit = async () => {
        const firebaseId = getFirebaseId();
        if (!firebaseId) return;

        setProcessing(true);
        try {
            const payload = {
                ...formData,
                items: formData.items.map(item => ({
                    product_id: item.product_id,
                    quantity: parseInt(item.quantity || '1'),
                    cost_price: parseFloat(item.cost_price || '0')
                }))
            };

            const endpoint = currentOrder
                ? `${API_BASE_URL}/purchase-orders/update/${currentOrder.id}/${firebaseId}/`
                : `${API_BASE_URL}/purchase-orders/create/${firebaseId}/`;

            const method = currentOrder ? 'put' : 'post';

            await axios[method](endpoint, payload);

            Alert.alert('Success', `Purchase order ${currentOrder ? 'updated' : 'created'} successfully`);
            setVisible(false);
            fetchData();
        } catch (error) {
            console.error('Submit error:', error.response?.data || error.message);
            Alert.alert('Error', `Failed to ${currentOrder ? 'update' : 'create'} purchase order. Please try again.`);
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        const firebaseId = getFirebaseId();
        if (!firebaseId) return;

        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this purchase order?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_BASE_URL}/purchase-orders/delete/${id}/${firebaseId}/`);
                            Alert.alert('Success', 'Purchase order deleted successfully');
                            fetchData();
                        } catch (error) {
                            console.error('Delete error:', error.response?.data || error.message);
                            Alert.alert('Error', 'Failed to delete purchase order. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const generatePdf = async (orderId) => {
        const firebaseId = getFirebaseId();
        if (!firebaseId) return;

        try {
            const pdfUri = `${API_BASE_URL}/purchase-orders/pdf/${orderId}/${firebaseId}/`;
            await Print.printAsync({ uri: pdfUri });
        } catch (error) {
            console.error('PDF generation error:', error);
            Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Loading purchase orders...</Text>
            </View>
        );
    }

    return (
        <Provider>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Purchase Orders</Text>
                    <Button
                        mode="contained"
                        onPress={() => {
                            setCurrentOrder(null);
                            setFormData({
                                supplier_id: '',
                                order_date: new Date().toISOString().split('T')[0],
                                expected_delivery_date: '',
                                notes: '',
                                items: [{ product_id: '', quantity: '1', cost_price: '0' }]
                            });
                            setVisible(true);
                        }}
                        style={styles.addButton}
                        labelStyle={styles.buttonLabel}
                    >
                        Create New
                    </Button>
                </View>

                <ScrollView style={styles.scrollView}>
                    <DataTable style={styles.dataTable}>
                        <DataTable.Header style={styles.tableHeader}>
                            <DataTable.Title style={styles.tableHeaderCell}>
                                <Text style={styles.tableHeaderText}>PO Number</Text>
                            </DataTable.Title>
                            <DataTable.Title style={styles.tableHeaderCell}>
                                <Text style={styles.tableHeaderText}>Supplier</Text>
                            </DataTable.Title>
                            <DataTable.Title numeric style={styles.tableHeaderCell}>
                                <Text style={styles.tableHeaderText}>Total</Text>
                            </DataTable.Title>
                            <DataTable.Title style={styles.tableHeaderCell}>
                                <Text style={styles.tableHeaderText}>Actions</Text>
                            </DataTable.Title>
                        </DataTable.Header>

                        {orders.map(order => (
                            <DataTable.Row key={order.id} style={styles.tableRow}>
                                <DataTable.Cell>
                                    <Text style={styles.tableCellText}>{order.po_number}</Text>
                                </DataTable.Cell>
                                <DataTable.Cell>
                                    <Text style={styles.tableCellText}>{order.supplier}</Text>
                                </DataTable.Cell>
                                <DataTable.Cell numeric>
                                    <Text style={styles.tableCellText}>{formatCurrency(order.total_cost)}</Text>
                                </DataTable.Cell>
                                <DataTable.Cell>
                                    <View style={styles.actions}>
                                        <Button
                                            icon="file-pdf"
                                            onPress={() => generatePdf(order.id)}
                                            compact
                                            style={styles.pdfButton}
                                            labelStyle={styles.actionButtonText}
                                        />
                                        <Button
                                            icon="pencil"
                                            onPress={() => handleEdit(order)}
                                            compact
                                            style={styles.editButton}
                                            labelStyle={styles.actionButtonText}
                                        />
                                        <Button
                                            icon="delete"
                                            onPress={() => handleDelete(order.id)}
                                            compact
                                            style={styles.deleteButton}
                                            labelStyle={styles.actionButtonText}
                                        />
                                    </View>
                                </DataTable.Cell>
                            </DataTable.Row>
                        ))}
                    </DataTable>
                </ScrollView>

                <Portal>
                    <Modal
                        visible={visible}
                        onDismiss={() => !processing && setVisible(false)}
                        contentContainerStyle={styles.modal}
                    >
                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {currentOrder ? 'Edit Purchase Order' : 'Create New Purchase Order'}
                            </Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Supplier*</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={formData.supplier_id}
                                        onValueChange={(value) => handleInputChange('supplier_id', value)}
                                        style={styles.picker}
                                        dropdownIconColor="#6200ee"
                                    >
                                        <Picker.Item label="Select Supplier" value="" />
                                        {suppliers.map(supplier => (
                                            <Picker.Item
                                                key={supplier.id}
                                                label={`${supplier.name}`}
                                                value={supplier.id}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Order Date*</Text>
                                <TextInput
                                    value={formData.order_date}
                                    onChangeText={(text) => handleInputChange('order_date', text)}
                                    style={styles.input}
                                    mode="outlined"
                                    theme={{ colors: { primary: '#6200ee', text: '#333333' } }}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Expected Delivery Date</Text>
                                <TextInput
                                    value={formData.expected_delivery_date}
                                    onChangeText={(text) => handleInputChange('expected_delivery_date', text)}
                                    style={styles.input}
                                    mode="outlined"
                                    placeholder="YYYY-MM-DD"
                                    theme={{ colors: { primary: '#6200ee', text: '#333333' } }}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Notes</Text>
                                <TextInput
                                    value={formData.notes}
                                    onChangeText={(text) => handleInputChange('notes', text)}
                                    style={styles.input}
                                    mode="outlined"
                                    multiline
                                    numberOfLines={3}
                                    theme={{ colors: { primary: '#6200ee', text: '#333333' } }}
                                />
                            </View>

                            <Text style={styles.sectionTitle}>Items*</Text>
                            {formData.items.map((item, index) => (
                                <View key={index} style={styles.itemContainer}>
                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Product*</Text>
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={item.product_id}
                                                onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                                                style={styles.picker}
                                                dropdownIconColor="#6200ee"
                                            >
                                                <Picker.Item label="Select Product" value="" />
                                                {products.map(product => (
                                                    <Picker.Item
                                                        key={product.id}
                                                        label={`${product.name} (${formatCurrency(product.cost_price)})`}
                                                        value={product.id}
                                                    />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Quantity*</Text>
                                        <TextInput
                                            value={item.quantity}
                                            onChangeText={(text) => handleItemChange(index, 'quantity', text)}
                                            style={styles.input}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            theme={{ colors: { primary: '#6200ee', text: '#333333' } }}
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Unit Price*</Text>
                                        <TextInput
                                            value={item.cost_price}
                                            onChangeText={(text) => handleItemChange(index, 'cost_price', text)}
                                            style={styles.input}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            theme={{ colors: { primary: '#6200ee', text: '#333333' } }}
                                        />
                                    </View>

                                    {index > 0 && (
                                        <Button
                                            mode="contained"
                                            onPress={() => removeItem(index)}
                                            style={styles.removeButton}
                                            labelStyle={styles.buttonLabel}
                                            disabled={processing}
                                        >
                                            Remove Item
                                        </Button>
                                    )}
                                </View>
                            ))}

                            <Button
                                mode="contained"
                                onPress={addItem}
                                style={styles.addItemButton}
                                labelStyle={styles.buttonLabel}
                                disabled={processing}
                            >
                                Add Another Item
                            </Button>

                            <View style={styles.modalButtons}>
                                <Button
                                    mode="contained"
                                    onPress={() => setVisible(false)}
                                    style={[styles.button, styles.cancelButton]}
                                    labelStyle={styles.buttonLabel}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={handleSubmit}
                                    style={[styles.button, styles.submitButton]}
                                    labelStyle={styles.buttonLabel}
                                    loading={processing}
                                    disabled={processing}
                                >
                                    {currentOrder ? 'Update Order' : 'Create Order'}
                                </Button>
                            </View>
                        </ScrollView>
                    </Modal>
                </Portal>
            </View>
        </Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6200ee',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
    },
    addButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    scrollView: {
        flex: 1,
        width:'100%',
    },
    dataTable: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
    },
    tableHeader: {
        backgroundColor: '#6200ee',
    },
    tableHeaderCell: {
        justifyContent: 'center',
    },
    tableHeaderText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    tableRow: {
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    tableCellText: {
        color: '#333333',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        

    },
    pdfButton: {
        backgroundColor: '#2196F3',
        marginHorizontal: 2,
        borderRadius: 4,
    },
    editButton: {
        backgroundColor: '#FF9800',
        marginHorizontal: 2,
        borderRadius: 4,
    },
    deleteButton: {
        backgroundColor: '#F44336',
        marginHorizontal: 2,
        borderRadius: 4,
    },
    modal: {
        backgroundColor: 'white',
        margin: 10,  // Reduced from 20
        borderRadius: 8,
        maxHeight: '95%',  // Increased from 90%
        width: '95%',  // Added to control width
        alignSelf: 'center',  // Center the modal
    },
    modalContent: {
        padding: 15,  // Reduced from 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333333',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333333',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 4,
        overflow: 'hidden',
    },
    picker: {
        backgroundColor: '#ffffff',
        color: '#333333',
    },
    input: {
        backgroundColor: '#ffffff',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        color: '#333333',
    },
    itemContainer: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    removeButton: {
        marginTop: 8,
        backgroundColor: '#F44336',
    },
    addItemButton: {
        marginTop: 8,
        marginBottom: 16,
        backgroundColor: '#4CAF50',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    button: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 4,
    },
    cancelButton: {
        backgroundColor: '#9E9E9E',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
    },
    actionButtonText: {
        color: '#ffffff',
    },
    buttonLabel: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
});

export default PurchaseOrderScreen;