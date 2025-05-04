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

const SuppliersScreen = () => {
    // Main states
    const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'detail', 'success'
    const [firebaseId, setFirebaseId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Supplier list states
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // Supplier creation/edit states
    const [supplier, setSupplier] = useState({
        id: null,
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '',
        payment_terms: '',
        notes: '',
        is_active: true
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdSupplier, setCreatedSupplier] = useState(null);
    const [branches, setBranches] = useState([]);
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

    // Filter suppliers based on search query
    useEffect(() => {
        if (!searchQuery) {
            setFilteredSuppliers(suppliers);
            return;
        }
        const filtered = suppliers.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.contact_person && s.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
            s.phone.includes(searchQuery)
        );
        setFilteredSuppliers(filtered);
    }, [searchQuery, suppliers]);

    const fetchData = async (firebaseUserId) => {
        try {
            setRefreshing(true);
            await Promise.all([
                fetchSuppliers(firebaseUserId),
                fetchBranches(firebaseUserId)
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setRefreshing(false);
        }
    };

    const fetchSuppliers = async (firebaseUserId) => {
        try {
            const response = await fetch(`http://192.168.170.172:8000/Sales/suppliers/${firebaseUserId}/`);
            const data = await response.json();

            console.log('suppliers', data)
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch suppliers');
            }

            setSuppliers(data.suppliers || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            Alert.alert('Error', error.message);
        }
    };

    const fetchBranches = async (firebaseUserId) => {
        try {
            const response = await fetch(`http://192.168.170.172:8000/Sales/getbranches/${firebaseUserId}/`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch branches');
            }

            setBranches(data.branches || []);
        } catch (error) {
            console.error('Error fetching branches:', error);
            Alert.alert('Error', error.message || 'Failed to load branches');
        }
    };

    const handleCreateSupplier = async () => {
        // Basic validation
        if (!firebaseId) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        if (!supplier.name || !supplier.phone) {
            Alert.alert('Error', 'Supplier name and phone are required');
            return;
        }

        try {
            setLoading(true);

            const url = supplier.id
                ? `http://192.168.170.172:8000/Sales/suppliers/${firebaseId}/${supplier.id}/update/`
                : `http://192.168.170.172:8000/Sales/suppliers/${firebaseId}/create/`;

            const method = supplier.id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(supplier)
            });

            const data = await response.json();

            // Handle duplicate supplier response (HTTP 409 Conflict)
            if (response.status === 409) {
                Alert.alert('Supplier Exists', data.error);
                return;
            }

            // Handle other errors
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save supplier');
            }

            // Success handling
            Alert.alert(
                'Success',
                supplier.id ? 'Supplier updated successfully' : 'Supplier created successfully',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setCreatedSupplier(data.supplier || data);
                            setSuccess(true);
                            fetchSuppliers(firebaseId);
                            if (!supplier.id) resetForm(); // Clear form after creation
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
                        onPress: handleCreateSupplier
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

    const handleDeleteSupplier = async (supplierId) => {
        try {
            Alert.alert(
                'Confirm Delete',
                'Are you sure you want to delete this supplier?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            const response = await fetch(
                                `http://192.168.170.172:8000/Sales/suppliers/${firebaseId}/${supplierId}/delete/`,
                                { method: 'DELETE' }
                            );

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || 'Failed to delete supplier');
                            }

                            Alert.alert('Success', 'Supplier deleted successfully');
                            fetchSuppliers(firebaseId);
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const resetForm = () => {
        setSupplier({
            id: null,
            name: '',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
            tax_id: '',
            payment_terms: '',
            notes: '',
            is_active: true
        });
        setSuccess(false);
        setCreatedSupplier(null);
        setView('list');
    };

    const startEditSupplier = (supplier) => {
        setSupplier({
            id: supplier.id,
            name: supplier.name,
            contact_person: supplier.contact_person || '',
            email: supplier.email || '',
            phone: supplier.phone,
            address: supplier.address || '',
            tax_id: supplier.tax_id || '',
            payment_terms: supplier.payment_terms || '',
            notes: supplier.notes || '',
            is_active: supplier.is_active
        });
        setView('edit');
    };

    const viewSupplierDetails = (supplier) => {
        setSelectedSupplier(supplier);
        setView('detail');
    };

    const renderSupplierItem = ({ item }) => (
        <TouchableOpacity
            style={styles.supplierItem}
            onPress={() => viewSupplierDetails(item)}
        >
            <View style={styles.supplierInfo}>
                <Text style={styles.supplierName}>{item.name}</Text>
                {item.contact_person && (
                    <Text style={styles.supplierDetail}>Contact: {item.contact_person}</Text>
                )}
                <Text style={styles.supplierDetail}>Phone: {item.phone}</Text>
                <Text style={styles.supplierDetail}>
                    Status: {item.is_active ? 'Active' : 'Inactive'}
                </Text>
            </View>
            <View style={styles.supplierActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        startEditSupplier(item);
                    }}
                >
                    <Icon name="edit" size={20} color="#4e73df" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteSupplier(item.id);
                    }}
                >
                    <Icon name="delete" size={20} color="#e74a3b" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderSupplierList = () => (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search suppliers..."
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
                data={filteredSuppliers}
                renderItem={renderSupplierItem}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchData(firebaseId)}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No suppliers found</Text>
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );

    const renderSupplierForm = () => (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formCard}>
                <Text style={styles.formTitle}>
                    {supplier.id ? 'Edit Supplier' : 'Add New Supplier'}
                </Text>

                <View style={styles.inputGroup}>
                    <Icon name="business" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputField}
                        placeholder="Supplier Name*"
                        value={supplier.name}
                        onChangeText={(text) => setSupplier({...supplier, name: text})}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Icon name="person" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputField}
                        placeholder="Contact Person"
                        value={supplier.contact_person}
                        onChangeText={(text) => setSupplier({...supplier, contact_person: text})}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Icon name="email" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputField}
                        placeholder="Email"
                        keyboardType="email-address"
                        value={supplier.email}
                        onChangeText={(text) => setSupplier({...supplier, email: text})}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Icon name="phone" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputField}
                        placeholder="Phone*"
                        keyboardType="phone-pad"
                        value={supplier.phone}
                        onChangeText={(text) => setSupplier({...supplier, phone: text})}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Icon name="location-on" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.inputField, styles.multilineInput]}
                        placeholder="Address"
                        multiline
                        numberOfLines={3}
                        value={supplier.address}
                        onChangeText={(text) => setSupplier({...supplier, address: text})}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Icon name="receipt" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputField}
                        placeholder="Tax ID"
                        value={supplier.tax_id}
                        onChangeText={(text) => setSupplier({...supplier, tax_id: text})}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Icon name="payment" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.inputField, styles.multilineInput]}
                        placeholder="Payment Terms"
                        multiline
                        numberOfLines={2}
                        value={supplier.payment_terms}
                        onChangeText={(text) => setSupplier({...supplier, payment_terms: text})}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Icon name="notes" size={24} color="#6c757d" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.inputField, styles.multilineInput]}
                        placeholder="Notes"
                        multiline
                        numberOfLines={3}
                        value={supplier.notes}
                        onChangeText={(text) => setSupplier({...supplier, notes: text})}
                    />
                </View>

                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Active Supplier</Text>
                    <TouchableOpacity
                        style={[styles.switchButton, supplier.is_active ? styles.switchActive : styles.switchInactive]}
                        onPress={() => setSupplier({...supplier, is_active: !supplier.is_active})}
                    >
                        <Text style={styles.switchText}>
                            {supplier.is_active ? 'YES' : 'NO'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.buttonDisabled]}
                    onPress={handleCreateSupplier}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Icon name={supplier.id ? "save" : "add-business"} size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>
                                {supplier.id ? " Update Supplier" : " Create Supplier"}
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
        </ScrollView>
    );

    const renderSupplierDetail = () => (
        <ScrollView style={styles.detailContainer}>
            <View style={styles.detailHeader}>
                <TouchableOpacity onPress={() => setView('list')}>
                    <Icon name="arrow-back" size={24} color="#4e73df" />
                </TouchableOpacity>
                <Text style={styles.detailTitle}>Supplier Details</Text>
            </View>

            <View style={styles.detailCard}>
                <Text style={styles.detailName}>{selectedSupplier.name}</Text>

                <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <View style={styles.detailRow}>
                        <Icon name="person" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>
                            Contact: {selectedSupplier.contact_person || 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="phone" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>Phone: {selectedSupplier.phone}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="email" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>Email: {selectedSupplier.email || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Address</Text>
                    <View style={styles.detailRow}>
                        <Icon name="location-on" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>
                            {selectedSupplier.address || 'N/A'}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Business Details</Text>
                    <View style={styles.detailRow}>
                        <Icon name="receipt" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>Tax ID: {selectedSupplier.tax_id || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="payment" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>Payment Terms: {selectedSupplier.payment_terms || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="business" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>Status: {selectedSupplier.is_active ? 'Active' : 'Inactive'}</Text>
                    </View>
                </View>

                {selectedSupplier.notes && (
                    <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>Additional Notes</Text>
                        <Text style={styles.notesText}>{selectedSupplier.notes}</Text>
                    </View>
                )}
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                        setSupplier({
                            id: selectedSupplier.id,
                            name: selectedSupplier.name,
                            contact_person: selectedSupplier.contact_person,
                            email: selectedSupplier.email,
                            phone: selectedSupplier.phone,
                            address: selectedSupplier.address,
                            tax_id: selectedSupplier.tax_id,
                            payment_terms: selectedSupplier.payment_terms,
                            notes: selectedSupplier.notes,
                            is_active: selectedSupplier.is_active
                        });
                        setView('edit');
                    }}
                >
                    <Icon name="edit" size={20} color="#fff" />
                    <Text style={styles.editButtonText}>Edit Supplier</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderSuccessView = () => (
        <View style={styles.successContainer}>
            <Animatable.View animation="bounceIn" style={styles.successCard}>
                <View style={styles.checkmarkCircle}>
                    <Icon name="check" size={50} color="#fff" />
                </View>

                <Text style={styles.successTitle}>
                    {supplier.id ? 'Supplier Updated!' : 'Supplier Created!'}
                </Text>

                <View style={styles.supplierDetails}>
                    <Text style={styles.supplierName}>{createdSupplier.name}</Text>
                    <View style={styles.detailRow}>
                        <Icon name="person" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>
                            Contact: {createdSupplier.contact_person || 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="phone" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>Phone: {createdSupplier.phone}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="email" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>
                            Email: {createdSupplier.email || 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="business" size={20} color="#6c757d" />
                        <Text style={styles.detailText}>
                            Status: {createdSupplier.is_active ? 'Active' : 'Inactive'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.newSupplierButton}
                    onPress={resetForm}
                >
                    <Text style={styles.newSupplierButtonText}>
                        <Icon name="arrow-back" size={18} /> Back to Suppliers
                    </Text>
                </TouchableOpacity>
            </Animatable.View>
        </View>
    );

    switch (view) {
        case 'create':
        case 'edit':
            return renderSupplierForm();
        case 'success':
            return renderSuccessView();
        case 'detail':
            return renderSupplierDetail();
        default:
            return renderSupplierList();
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
    supplierItem: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    supplierInfo: {
        flex: 1,
    },
    supplierName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },
    supplierDetail: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 3,
    },
    supplierActions: {
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
    supplierDetails: {
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
    newSupplierButton: {
        backgroundColor: '#6c757d',
        padding: 15,
        borderRadius: 15,
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
    },
    newSupplierButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
    },
    switchButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 15,
    },
    switchActive: {
        backgroundColor: '#4BB543',
    },
    switchInactive: {
        backgroundColor: '#e74a3b',
    },
    switchText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // Detail View Styles
    detailContainer: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    detailTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginLeft: 15,
    },
    detailCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        margin: 15,
        padding: 20,
    },
    detailName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    detailSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    notesText: {
        fontSize: 14,
        color: '#6c757d',
        lineHeight: 20,
    },
    actionButtons: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    editButton: {
        backgroundColor: '#4e73df',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
});

export default SuppliersScreen;