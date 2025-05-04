import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Button,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import api from '../api/api';

const OrderScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { cart = [] } = route.params || {};

    const [modalVisible, setModalVisible] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false); // Payment modal state
    const [amountEntered, setAmountEntered] = useState(""); // State for entered amount
    const [change, setChange] = useState(null); // State for change calculation
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    const [cartItems, setCartItems] = useState(cart);

    // Calculate subtotal, tax, and total
    const subtotal = cartItems.reduce(
        (sum, item) => sum + parseFloat(item.price) * parseInt(item.quantity),
        0
    );
    const taxRate = 0.05;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch(http://192.168.143.194:8000/Sales/fetch_customer/);
            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                setCustomers(data || []);
            } else {
                alert("The server did not return valid JSON.");
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
            alert("Unable to fetch customers. Please check your connection or try again later.");
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter((customer) =>
        customer.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleModalOpen = () => {
        setModalVisible(true);
        fetchCustomers();
    };

    const handlePaymentModalOpen = () => {
        setPaymentModalVisible(true); // Open the payment modal
    };

    const handleAmountChange = (value) => {
        setAmountEntered(value);
        const enteredAmount = parseFloat(value);
        if (enteredAmount >= total) {
            setChange(enteredAmount - total);
        } else {
            setChange("Insufficient amount");
        }
    };

    const increaseQuantity = (itemIndex) => {
        const updatedCart = cartItems.map((item, index) => {
            if (index === itemIndex) {
                return { ...item, quantity: item.quantity + 1 };
            }
            return item;
        });
        setCartItems(updatedCart);
    };

    const decreaseQuantity = (itemIndex) => {
        const updatedCart = cartItems.map((item, index) => {
            if (index === itemIndex && item.quantity > 1) {
                return { ...item, quantity: item.quantity - 1 };
            }
            return item;
        });
        setCartItems(updatedCart);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #2145</Text>
                <TouchableOpacity onPress={handleModalOpen}>
                    <Ionicons name="person-add-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <View style={[styles.card, styles.customerCard]}>
                <Text style={styles.cardHeading}>Customer</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={20} color="#7E57C2" />
                    <Text style={styles.infoValue}>
                        {selectedCustomer ? selectedCustomer.full_name : "Tap to select a customer"}
                    </Text>
                    {selectedCustomer && (
                        <Text style={styles.loyaltyPoints}>
                            Loyalty Points: {selectedCustomer.loyalty_points}
                        </Text>
                    )}
                    <TouchableOpacity style={styles.editIcon} onPress={handleModalOpen}>
                        <Ionicons name="create-outline" size={20} color="#7E57C2" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Customer Modal */}
            <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {loading ? (
                        <ActivityIndicator size="large" color="#7E57C2" />
                    ) : (
                        <>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer) => (
                                    <TouchableOpacity
                                        key={customer.id}
                                        onPress={() => {
                                            setSelectedCustomer(customer);
                                            setModalVisible(false);
                                        }}
                                        style={styles.customerItem}
                                    >
                                        <Ionicons name="person-circle-outline" size={20} color="#7E57C2" />
                                        <Text style={styles.customerName}>
                                            {customer.full_name} - Loyalty Points: {customer.loyalty_points}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text>No customers found</Text>
                            )}
                        </>
                    )}
                    <Button title="Close" onPress={() => setModalVisible(false)} />
                </View>
            </Modal>

            <ScrollView style={styles.scrollableSection} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeading}>Items</Text>
                {cartItems.length > 0 ? (
                    cartItems.map((item, index) => (
                        <View key={index} style={[styles.card, styles.itemCard]}>
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemPrice}>${item.price}</Text>
                            </View>
                            <View style={styles.quantityContainer}>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={() => decreaseQuantity(index)}
                                >
                                    <Text style={styles.quantityText}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.quantityText}>{item.quantity}</Text>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={() => increaseQuantity(index)}
                                >
                                    <Text style={styles.quantityText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text>No items in the cart</Text>
                )}

                <View style={styles.card}>
                    <Text style={styles.cardHeading}>Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailText}>Subtotal</Text>
                        <Text style={styles.detailText}>${subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailText}>Tax (5%)</Text>
                        <Text style={styles.detailText}>${tax.toFixed(2)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={styles.detailTotalText}>Total</Text>
                        <Text style={styles.detailTotalText}>${total.toFixed(2)}</Text>
                    </View>
                    {/* Change Field */}
                    {change !== null && (
                        <View style={styles.changeContainer}>
                            <Text style={styles.changeText}>
                                Change: {typeof change === "number" ? $${change.toFixed(2)} : change}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Make Sale Button */}
                <TouchableOpacity style={styles.makeSaleButton} onPress={handlePaymentModalOpen}>
                    <Text style={styles.makeSaleButtonText}>Make Sale</Text>
                </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={styles.orderButton} onPress={handlePaymentModalOpen}>
                <Text style={styles.orderButtonText}>Order</Text>
            </TouchableOpacity>

            {/* Payment Modal */}
            <Modal visible={paymentModalVisible} animationType="slide" onRequestClose={() => setPaymentModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <Text style={styles.cardHeading}>Enter Payment</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter amount"
                        keyboardType="numeric"
                        value={amountEntered}
                        onChangeText={handleAmountChange}
                    />
                    <Button title="Close" onPress={() => setPaymentModalVisible(false)} />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F8F8" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 16 },
    headerTitle: { fontSize: 18, fontWeight: "600" },
    card: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 16, marginVertical: 8, marginHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    customerCard: { paddingVertical: 8, paddingHorizontal: 12 },
    cardHeading: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
    infoRow: { flexDirection: "row", alignItems: "center" },
    infoValue: { fontSize: 14, fontWeight: "500", marginLeft: 8 },
    editIcon: { marginLeft: "auto" },
    scrollableSection: { flex: 1 },
    sectionHeading: { fontSize: 16, fontWeight: "700", marginHorizontal: 16 },
    itemCard: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    itemImage: { width: 50, height: 50, borderRadius: 8 },
    itemDetails: { flex: 1, marginLeft: 16 },
    itemName: { fontSize: 14, fontWeight: "500" },
    itemPrice: { fontSize: 14, color: "#A0A0A0" },
    quantityContainer: { flexDirection: "row", alignItems: "center" },
    quantityButton: { width: 30, height: 30, justifyContent: "center", alignItems: "center", backgroundColor: "#F0F0F0", borderRadius: 5 },
    quantityText: { fontSize: 16, fontWeight: "500", marginHorizontal: 8 },
    detailRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
    detailText: { fontSize: 14, color: "#A0A0A0" },
    detailTotalText: { fontSize: 16, fontWeight: "600" },
    divider: { borderBottomWidth: 1, borderBottomColor: "#E0E0E0", marginVertical: 8 },
    orderButton: { backgroundColor: "#7E57C2", borderRadius: 10, padding: 16, marginHorizontal: 16, marginBottom: 16, alignItems: "center" },
    orderButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
    modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    input: { height: 40, borderColor: "#ccc", borderWidth: 1, marginBottom: 20, borderRadius: 5, paddingHorizontal: 10, width: "80%" },
    changeText: { fontSize: 18, fontWeight: "700", marginBottom: 20, color: "#7E57C2" },
    changeContainer: { marginTop: 10 },
    customerItem: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#f9f9f9", borderRadius: 10, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, elevation: 1, width: "100%", justifyContent: "space-between" },
    customerName: { fontSize: 16, fontWeight: "500", padding: 10, backgroundColor: "#f0f0f0", marginBottom: 5, borderRadius: 8, flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "space-between" },
    loyaltyPoints: { fontSize: 14, color: "#7E57C2", fontWeight: "500", marginLeft: 8 },
    makeSaleButton: { backgroundColor: "#7E57C2", borderRadius: 5, paddingVertical: 8, marginTop: 12, alignItems: "center", marginHorizontal: 16 },
    makeSaleButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});

export default OrderScreen;