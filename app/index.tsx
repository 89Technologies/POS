import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import HomeScreen from '../screens/HomeScreen';
import SalesScreen from '../screens/SalesScreen';
import SettingsScreen from "@/screens/SettingsScreen";
import CartScreen from '../screens/CartScreen';
import ProfileScreen from "../../../../../Videos/POS System/POS/components/ProfileScreen";
import Mysplashscreen from '../screens/Mysplashscreen';
import productAdd from '../screens/productAdd';
import LowStockScreen from '../screens/LowStockScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SettingsMain from '../screens/SettingsMain';
import Supplier from '../screens/Supplier';
// purchase order

import PurchaseOrderListScreen from '../screens/PurchaseOrderListScreen';
import PurchaseOrderDetailScreen from '../screens/PurchaseOrderDetailScreen';
// import CreatePurchaseOrderScreen from '../screens/CreatePurchaseOrderScreen';


const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        // <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Mysplashscreen"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#007bff', // Purple header
                        elevation: 0, // Remove shadow on Android
                        shadowOpacity: 0, // Remove shadow on iOS
                    },
                    headerTintColor: '#fff', // White text color
                    headerTitleStyle: {
                        fontWeight: 'bold',
                        fontSize: 20,
                    },
                    headerTitleAlign: 'center', // Center align title
                }}
            >
                {/* Splash Screen - No Header */}
                <Stack.Screen
                    name="Mysplashscreen"
                    component={Mysplashscreen}
                    options={{ headerShown: false }}
                />

                {/* Auth Screens */}
                <Stack.Screen
                    name="SignIn"
                    component={SignInScreen}
                    options={{ title: 'Sign In' }}
                />
                <Stack.Screen
                    name="SignUp"
                    component={SignUpScreen}
                    options={{ title: 'Create Account' }}
                />

                {/* Main App Screens */}
                <Stack.Screen
                    name="HomeScreen"
                    component={HomeScreen}
                    options={{ headerShown: false }}
                    // options={{ title: 'Dashboard' }}
                />

                <Stack.Screen
                    name="Supplier"
                    component={Supplier}
                    options={{ title: 'Suppier Screen' }}
                />


                <Stack.Screen
                    name="SettingsMain"
                    component={SettingsMain}
                    options={{ title: 'Settings' }}
                />

                <Stack.Screen
                    name="sales"
                    component={SalesScreen}
                    options={{ title: 'Sales' }}
                />
                <Stack.Screen
                    name="Cart"
                    component={CartScreen}
                    options={{ title: 'Shopping Cart' }}
                />
                <Stack.Screen
                    name="LowStockScreen"
                    component={LowStockScreen}
                    options={{ title: 'Low Stock Alert' }}
                />
                <Stack.Screen
                    name="ProductDetailScreen"
                    component={ProductDetailScreen}
                    options={{ title: 'Product Details' }}
                />
                <Stack.Screen
                    name="productAdd"
                    component={productAdd}
                    options={{ title: 'Add Product' }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ title: 'Settings' }}
                />

                <Stack.Screen
                    name="PurchaseOrders"
                    component={PurchaseOrderListScreen}
                    options={{ title: 'Purchase Orders' }}
                />
                <Stack.Screen
                    name="PurchaseOrderDetail"
                    component={PurchaseOrderDetailScreen}
                    options={{ title: 'Purchase Order' }}
                />
                {/*<Stack.Screen*/}
                {/*    name="CreatePurchaseOrder"*/}
                {/*    component={CreatePurchaseOrderScreen}*/}
                {/*    options={{ title: 'Create Purchase Order' }}*/}
                {/*/>*/}

            </Stack.Navigator>

    );
};

export default AppNavigator;




// Add these screens to your Stack.Navigator
