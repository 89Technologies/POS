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

const ProductsScreen = () => {
    // Main states
    const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'transfer'
    const [firebaseId, setFirebaseId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Product list states
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);

    // Product creation/edit states
    const [product, setProduct] = useState({
        id: null,
        name: '',
        price: '',
        description: '',
        stock_quantity: '1',
        category: null
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdProduct, setCreatedProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Stock transfer states
    const [transferProduct, setTransferProduct] = useState(null);
    const [transferQuantity, setTransferQuantity] = useState('');
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [transferLoading, setTransferLoading] = useState(false);
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);

    // Initialize auth and fetch data
    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
            setFirebaseId(user.uid);
            fetchData(user.uid);
        }
    }, []);

    // Filter products based on search query
    useEffect(() => {
        if (!searchQuery) {
            setFilteredProducts(products);
            return;
        }
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode.includes(searchQuery) ||
            p.product_code.includes(searchQuery)
        );
        setFilteredProducts(filtered);
    }, [searchQuery, products]);

    const fetchData = async (firebaseUserId) => {
        try {
            setRefreshing(true);
            await Promise.all([
                fetchProducts(firebaseUserId),
                fetchCategories(),
                fetchBranches(firebaseUserId)
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setRefreshing(false);
        }
    };

    const fetchProducts = async (firebaseUserId) => {
        try {
            const response = await fetch(`http://192.168.51.77:8000/Sales/products/${firebaseUserId}/`);
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

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://192.168.51.77:8000/Sales/categories/');
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            Alert.alert('Error', 'Failed to load categories');
        }
    };

    const fetchBranches = async (firebaseUserId) => {
        try {
            const response = await fetch(`http://192.168.51.77:8000/Sales/branches/${firebaseUserId}/`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch branches');
            }

            setBranches(data);
        } catch (error) {
            console.error('Error fetching branches:', error);
            Alert.alert('Error', error.message || 'Failed to load branches');
        }
    };

    const handleCreateProduct = async () => {
        // Basic validation
        if (!firebaseId) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        if (!product.name || !product.price) {
            Alert.alert('Error', 'Product name and price are required');
            return;
        }

        try {
            setLoading(true);

            const url = product.id
                ? `http://192.168.51.77:8000/Sales/update_products/${product.id}/`
                : `http://192.168.51.77:8000/Sales/Add_products/${firebaseId}/`;

            const method = product.id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...product,
                    category: product.category?.id
                })
            });

            const data = await response.json();

            // Handle duplicate product response (HTTP 409 Conflict)
            if (response.status === 409) {
                Alert.alert(
                    'Product Exists',
                    `A similar product already exists:\n\nName: ${data.existing_product.name}\nBarcode: ${data.existing_product.barcode}`,
                    [
                        {
                            text: 'Edit Existing',
                            onPress: () => startEditProduct(data.existing_product)
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        }
                    ]
                );
                return;
            }

            // Handle other errors
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save product');
            }

            // Success handling
            Alert.alert(
                'Success',
                product.id ? 'Product updated successfully' : 'Product created successfully',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setCreatedProduct(data.product || data);
                            setSuccess(true);
                            fetchProducts(firebaseId);
                            if (!product.id) resetForm(); // Clear form after creation
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
                        onPress: handleCreateProduct
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

    const handleDeleteProduct = async (productId) => {
        try {
            Alert.alert(
                'Confirm Delete',
                'Are you sure you want to delete this product?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            const response = await fetch(
                                `http://192.168.51.77:8000/Sales/products/${productId}/delete/`,
                                { method: 'DELETE' }
                            );

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || 'Failed to delete product');
                            }

                            // Show success message using the animated modal
                            Alert.alert('Product deleted successfully');
                            showSuccessMessage('Product deleted successfully', { id: productId });


                            // Refresh the product list
                            fetchProducts(firebaseId);
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };
    const handleTransferStock = async () => {
        if (!transferProduct) return;

        const quantity = parseInt(transferQuantity);
        if (!selectedBranch) {
            Alert.alert('Error', 'Please select a branch');
            return;
        }
        if (!quantity || quantity <= 0) {
            Alert.alert('Error', 'Please enter a valid quantity');
            return;
        }
        if (quantity > parseInt(transferProduct.stock_quantity)) {
            Alert.alert('Error', 'Not enough stock available');
            return;
        }

        try {
            setTransferLoading(true);

            const response = await fetch(
                `http://192.168.51.77:8000/Sales/transfer_stock/${transferProduct.id}/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add authorization header if needed
                        // 'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        target_branch: selectedBranch.id,
                        quantity: quantity,
                        firebaseId: firebaseId,
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to transfer stock');
            }

            Alert.alert(
                'Success',
                data.product_created
                    ? 'Stock transferred successfully (new product created in target branch)'
                    : 'Stock transferred successfully'
            );
            setView('list');
            fetchProducts(firebaseId);  // Refresh product list

        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setTransferLoading(false);
        }
    };

    const resetForm = () => {
        setProduct({
            id: null,
            name: '',
            price: '',
            description: '',
            stock_quantity: '1',
            category: null
        });
        setSuccess(false);
        setCreatedProduct(null);
        setView('list');
    };

    const startEditProduct = (product) => {
        setProduct({
            id: product.id,
            name: product.name,
            price: product.price.toString(),
            description: product.description,
            stock_quantity: product.stock_quantity.toString(),
            category: product.category
        });
        setView('edit');
    };

    const startTransfer = (product) => {
        setTransferProduct(product);
        setSelectedBranch(null);
        setTransferQuantity('');
        setView('transfer');
    };

    const renderProductItem = ({ item }) => (
        <View style={styles.productItem}>
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDetail}>Price: ${item.price}</Text>
                <Text style={styles.productDetail}>Stock: {item.stock_quantity}</Text>
                <Text style={styles.productDetail}>Barcode: {item.barcode}</Text>
            </View>
            <View style={styles.productActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startEditProduct(item)}
                >
                    <Icon name="edit" size={20} color="#4e73df" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startTransfer(item)}
                >
                    <Icon name="transfer-within-a-station" size={20} color="#ffc107" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteProduct(item.id)}
                >
                    <Icon name="delete" size={20} color="#e74a3b" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderProductList = () => (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
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
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchData(firebaseId)}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No products found</Text>
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );

    const renderProductForm = () => (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formCard}>
                <Text style={styles.formTitle}>
                    {product.id ? 'Edit Product' : 'Add New Product'}
                </Text>

                <View style={styles.inputGroup}>
                    <Icon name="local-offer" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputField}
                        placeholder="Product Name*"
                        value={product.name}
                        onChangeText={(text) => setProduct({...product, name: text})}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Icon name="attach-money" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputField}
                        placeholder="Price*"
                        keyboardType="numeric"
                        value={product.price}
                        onChangeText={(text) => setProduct({...product, price: text})}
                    />
                </View>

                <TouchableOpacity
                    style={styles.inputGroup}
                    onPress={() => setShowCategoryDropdown(true)}
                >
                    <Icon name="category" size={24} color="#6c757d" style={styles.inputIcon} />
                    <Text style={styles.categoryText}>
                        {product.category?.name || 'Select Category'}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color="#6c757d" />
                </TouchableOpacity>

                <View style={styles.inputGroup}>
                    <Icon name="description" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.inputField, styles.multilineInput]}
                        placeholder="Description"
                        multiline
                        numberOfLines={4}
                        value={product.description}
                        onChangeText={(text) => setProduct({...product, description: text})}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Icon name="storage" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputField}
                        placeholder="Stock Quantity"
                        keyboardType="numeric"
                        value={product.stock_quantity}
                        onChangeText={(text) => setProduct({...product, stock_quantity: text})}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.buttonDisabled]}
                    onPress={handleCreateProduct}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Icon name={product.id ? "save" : "add-shopping-cart"} size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>
                                {product.id ? " Update Product" : " Create Product"}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={resetForm}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>

            {/* Category Dropdown Modal */}
            <Modal
                visible={showCategoryDropdown}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCategoryDropdown(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Category</Text>
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.categoryItem}
                                    onPress={() => {
                                        setProduct({...product, category: item});
                                        setShowCategoryDropdown(false);
                                    }}
                                >
                                    <Text style={styles.categoryItemText}>{item.name}</Text>
                                    {product.category?.id === item.id && (
                                        <Icon name="check" size={20} color="#4BB543" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowCategoryDropdown(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );

    const renderTransferView = () => (
        <View style={styles.container}>
            <View style={styles.transferHeader}>
                <TouchableOpacity onPress={() => setView('list')}>
                    <Icon name="arrow-back" size={24} color="#4e73df" />
                </TouchableOpacity>
                <Text style={styles.transferTitle}>Transfer Stock</Text>
            </View>

            <View style={styles.transferProductInfo}>
                <Text style={styles.transferProductName}>{transferProduct?.name}</Text>
                <Text style={styles.transferProductDetail}>
                    Current Stock: {transferProduct?.stock_quantity}
                </Text>
                <Text style={styles.transferProductDetail}>
                    Barcode: {transferProduct?.barcode}
                </Text>
            </View>

            <View style={styles.transferInputGroup}>
                <Icon name="format-list-numbered" size={24} color="#6c757d" style={styles.inputIcon} />
                <TextInput
                    style={styles.inputField}
                    placeholder="Quantity to transfer"
                    keyboardType="numeric"
                    value={transferQuantity}
                    onChangeText={setTransferQuantity}
                />
            </View>

            <TouchableOpacity
                style={styles.branchSelector}
                onPress={() => setShowBranchDropdown(true)}
            >
                <Icon name="store" size={24} color="#6c757d" style={styles.inputIcon} />
                <Text style={styles.branchText}>
                    {selectedBranch?.name || 'Select Target Branch'}
                </Text>
                <Icon name="arrow-drop-down" size={24} color="#6c757d" />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.submitButton, (!selectedBranch || !transferQuantity) && styles.buttonDisabled]}
                onPress={handleTransferStock}
                disabled={!selectedBranch || !transferQuantity || transferLoading}
            >
                {transferLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>Transfer Stock</Text>
                )}
            </TouchableOpacity>

            {/* Branch Selection Modal */}
            <Modal
                visible={showBranchDropdown}
                transparent
                animationType="slide"
                onRequestClose={() => setShowBranchDropdown(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Target Branch</Text>
                        <FlatList
                            data={branches.filter(b => b.id !== transferProduct?.branch?.id)}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.branchItem}
                                    onPress={() => {
                                        setSelectedBranch(item);
                                        setShowBranchDropdown(false);
                                    }}
                                >
                                    <Text style={styles.branchItemText}>{item.name}</Text>
                                    {selectedBranch?.id === item.id && (
                                        <Icon name="check" size={20} color="#4BB543" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowBranchDropdown(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );

    const renderSuccessView = () => (
        <View style={styles.successContainer}>
            <Animatable.View animation="bounceIn" style={styles.successCard}>
                <View style={styles.checkmarkCircle}>
                    <Icon name="check" size={50} color="#fff" />
                </View>

                <Text style={styles.successTitle}>
                    {product.id ? 'Product Updated!' : 'Product Created!'}
                </Text>

                <View style={styles.productDetails}>
                    <Text style={styles.productName}>{createdProduct.name}</Text>
                    <View style={styles.detailRow}>
                        <Icon name="fingerprint" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>Barcode: {createdProduct.barcode}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="category" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>Category: {createdProduct.category_name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="warehouse" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>Stock: {createdProduct.stock_quantity}</Text>
                    </View>
                    {createdProduct.barcode_image_url && (
                        <Image
                            source={{ uri: createdProduct.barcode_image_url }}
                            style={styles.barcodeImage}
                        />
                    )}
                </View>

                <TouchableOpacity
                    style={styles.newProductButton}
                    onPress={resetForm}
                >
                    <Text style={styles.newProductButtonText}>
                        <Icon name="arrow-back" size={18} /> Back to Products
                    </Text>
                </TouchableOpacity>
            </Animatable.View>
        </View>
    );

    switch (view) {
        case 'create':
        case 'edit':
            return renderProductForm();
        case 'success':
            return renderSuccessView();
        case 'transfer':
            return renderTransferView();
        default:
            return renderProductList();
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
    productItem: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },
    productDetail: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 3,
    },
    productActions: {
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
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    categoryText: {
        flex: 1,
        fontSize: 16,
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
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f7fa',
    },
    successCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        width: '90%',
        alignItems: 'center',
    },
    checkmarkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4BB543',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 10,
    },
    productDetails: {
        width: '100%',
        marginVertical: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    detailText: {
        fontSize: 16,
        color: '#6c757d',
        marginLeft: 10,
    },
    barcodeImage: {
        width: '100%',
        height: 120,
        marginTop: 20,
        resizeMode: 'contain',
    },
    newProductButton: {
        backgroundColor: '#6c757d',
        padding: 15,
        borderRadius: 15,
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
    },
    newProductButtonText: {
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
    categoryItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryItemText: {
        fontSize: 16,
    },
    branchItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    branchItemText: {
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
    transferInputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e9ecef',
        height: 50,
    },
    branchSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e9ecef',
        height: 50,
    },
    branchText: {
        flex: 1,
        fontSize: 16,
    },
    transferHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    transferTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginLeft: 15,
    },
    transferProductInfo: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    transferProductName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    transferProductDetail: {
        fontSize: 16,
        color: '#6c757d',
        marginBottom: 5,
    },
});

export default ProductsScreen;