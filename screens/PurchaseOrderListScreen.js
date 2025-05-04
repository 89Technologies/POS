import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
// import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const PurchaseOrderListScreen = () => {
    const { currentUser } = useAuth();
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPurchaseOrders = async () => {
        try {
            const response = await axios.get(`http://your-backend-url/api/purchase-orders/${currentUser.uid}/`);
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch purchase orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchaseOrders();
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => navigation.navigate('PurchaseOrderDetail', {
                poId: item.id,
                firebaseId: currentUser.uid
            })}
        >
            <View style={styles.itemContent}>
                <Text style={styles.poNumber}>PO #{item.po_number}</Text>
                <Text style={styles.supplier}>{item.supplier_name}</Text>
                <Text style={styles.date}>Order Date: {new Date(item.order_date).toLocaleDateString()}</Text>
                <Text style={styles.total}>Total: ${item.total_cost.toFixed(2)}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text>No purchase orders found</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('CreatePurchaseOrder')}
            >
                <MaterialIcons name="add" size={30} color="white" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 15,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    itemContent: {
        flex: 1,
    },
    poNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    supplier: {
        fontSize: 14,
        color: '#444',
        marginBottom: 5,
    },
    date: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    total: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007bff',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#007bff',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
});

export default PurchaseOrderListScreen;