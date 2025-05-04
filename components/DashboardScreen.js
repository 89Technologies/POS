import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment'; // Import moment library for date/time handling
import { useNavigation } from '@react-navigation/native';

const App = () => {
    const [currentDate, setCurrentDate] = useState(moment().format('DD MMMM YYYY, dddd'));
    const navigation = useNavigation();

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentDate(moment().format('DD MMMM YYYY, dddd'));
        }, 1000); // Update every second

        return () => clearInterval(intervalId); // Clear interval on component unmount
    }, []);

    return (
        <ImageBackground source={require('../assets/images/hex.jpg')} style={styles.container}>
            <ImageBackground source={require('../assets/images/pos.jpg')} style={styles.header}>
                <Text style={styles.headerText}>COLLEN-POS</Text>
                <Text style={styles.dateText}>{currentDate}</Text>
            </ImageBackground>

            <View style={styles.menuContainer}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('sales')} // Correct placement of onPress
                >
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="shopping-cart" size={30} color="#009688" />
                    </View>
                    <Text style={styles.menuText}>Make Sale</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('productAdd')}
                >
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="local-shipping" size={30} color="#f44336" />
                    </View>
                    <Text style={styles.menuText}>Inventory</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}
                                  onPress={() => navigation.navigate('Supplier')}
                >

                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="receipt-long" size={30} color="#2196F3" />
                    </View>
                    <Text style={styles.menuText}>Suppliers</Text>
                </TouchableOpacity>Supplier

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="payment" size={30} color="#9C27B0" />
                    </View>
                    <Text style={styles.menuText}>Payments & Receipts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="attach-money" size={30} color="#FF9800" />
                    </View>
                    <Text style={styles.menuText}>Expense</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}
                  onPress={() => navigation.navigate('LowStockScreen')}
                >
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="warning" size={30} color="#FF5722" />
                    </View>
                    <Text style={styles.menuText}>Low Stocks</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="category" size={30} color="#4CAF50" />
                    </View>
                    <Text style={styles.menuText}>Categories</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="list" size={30} color="#00BCD4" />
                    </View>
                    <Text style={styles.menuText}>Products</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="person" size={30} color="#673AB7" />
                    </View>
                    <Text style={styles.menuText}>Customers</Text>
                </TouchableOpacity>



                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="settings" size={30} color="#607D8B" />
                    </View>
                    <Text style={styles.menuText}>Receipt Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}
                                  onPress={() => navigation.navigate('PurchaseOrderDetail')}
                >
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="summarize" size={30} color="#FFC107" />
                    </View>
                    <Text style={styles.menuText}>Purchase orders</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="shopping-basket" size={30} color="#009688" />
                    </View>
                    <Text style={styles.menuText}>Sales Order</Text>
                </TouchableOpacity>


                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <MaterialIcons name="more-horiz" size={30} color="#9C27B0" />
                    </View>
                    <Text style={styles.menuText}>More</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    header: {
        padding: 20,
        height:200,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    headerText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
    },
    dateText: {
        fontSize: 16,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
    },
    menuContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        padding: 20,
    },
    menuItem: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 20,
    },
    menuIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    menuText: {
        fontSize: 12,
        textAlign: 'center',
        flexWrap: 'wrap',
    },
});

export default App;
