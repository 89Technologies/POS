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
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { shareAsync } from 'expo-sharing';

const OrderScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { cart,user = [] } = route.params || {};

    const [modalVisible, setModalVisible] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false); // Payment modal state
    const [amountEntered, setAmountEntered] = useState(""); // State for entered amount
    const [change, setChange] = useState(null); // State for change calculation
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [transactionSuccess, setTransactionSuccess] = useState(false);
    const [transactionId, setTransactionId] = useState(null);

    const [cartItems, setCartItems] = useState(cart);
    const user_cashier=user;


    // Radio button state
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [exchangeRate, setExchangeRate] = useState(null);



    const handlePrintReceipt = async () => {
        try {
            // Generate HTML for the receipt
            const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #6200EE; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .footer { margin-top: 30px; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Your Store Name</h1>
            <p>123 Store Address, City</p>
            <p>Tel: (123) 456-7890</p>
          </div>
          
          <h2>Receipt #${transactionId}</h2>
          <p>Date: ${new Date().toLocaleString()}</p>
          <p>Cashier: ${user_cashier?.first_name || 'N/A'}</p>
          <p>Customer: ${selectedCustomer?.full_name || 'Walk-in'}</p>
          
          <table>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
            ${cartItems.map(item => {
                const price = exchangeRate ? (item.price * exchangeRate).toFixed(2) : item.price.toFixed(2);
                const total = (price * item.quantity).toFixed(2);
                return `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${selectedCurrency ? selectedCurrency.toUpperCase() : '$'}${price}</td>
                  <td>${selectedCurrency ? selectedCurrency.toUpperCase() : '$'}${total}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total">
              <td colspan="3">Subtotal</td>
              <td>${selectedCurrency ? selectedCurrency.toUpperCase() : '$'}${adjustedSubtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3">Tax (5%)</td>
              <td>${selectedCurrency ? selectedCurrency.toUpperCase() : '$'}${adjustedTax.toFixed(2)}</td>
            </tr>
            <tr class="total">
              <td colspan="3">Total</td>
              <td>${selectedCurrency ? selectedCurrency.toUpperCase() : '$'}${adjustedTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3">Amount Paid</td>
              <td>${selectedCurrency ? selectedCurrency.toUpperCase() : '$'}${amountEntered}</td>
            </tr>
            <tr>
              <td colspan="3">Change</td>
              <td>${selectedCurrency ? selectedCurrency.toUpperCase() : '$'}${typeof change === "number" ? change.toFixed(2) : change}</td>
            </tr>
          </table>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Please come again</p>
          </div>
        </body>
      </html>
    `;

            // Generate PDF
            const { uri } = await Print.printToFileAsync({ html });
            console.log('PDF generated at:', uri);

            // Print the PDF
            await Print.printAsync({ uri });

            // Save PDF to device
            const pdfName = `Receipt_${transactionId}.pdf`;
            const newUri = `${FileSystem.documentDirectory}${pdfName}`;
            await FileSystem.copyAsync({ from: uri, to: newUri });

            // Share/download the PDF
            shareAsync(newUri); // Opens native share dialog
        } catch (error) {
            alert('Failed to print: ' + error.message);
            console.error(error);
        }
    };
    // Fetch customer data
    const fetchCustomers = async () => {
        setLoading(true);

        console.log('my user is----77776557-')
        console.log(user_cashier)
        try {
            const response = await fetch("http://192.168.81.95:8000/Sales/fetch_customer/");
            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                console.log(data)
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

    // Fetch exchange rate based on selected currency
    const fetchExchangeRate = async (currencyName) => {
        try {
            const response = await fetch(`http://192.168.81.95:8000/Sales/exchange_rate/${currencyName}`);
            const data = await response.json();
            console.log("Parsed Response:", data);

            if (data && data.rate) {
                setExchangeRate(parseFloat(data.rate));
            } else {
                console.error("Exchange rate not found in the response.");
                alert("Exchange rate not found. USD only transactions allowed.");
            }
        } catch (error) {
            console.error("Error fetching exchange rate:", error);
            alert("Exchange rate not found. USD only transactions allowed.");
        }
    };

    // Handle currency selection
    const handleCurrencySelection = (currencyName) => {
        setSelectedCurrency(currencyName);
        fetchExchangeRate(currencyName);
    };

    // Filter customers based on search query
    const filteredCustomers = customers.filter((customer) =>
        customer.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle modal open
    const handleModalOpen = () => {
        setModalVisible(true);
        fetchCustomers();
    };

    const removeItem = (itemIndex) => {
        const updatedCart = cartItems.filter((_, index) => index !== itemIndex);
        setCartItems(updatedCart);
    };

    // Handle payment modal open
    const handlePaymentModalOpen = () => {
        setPaymentModalVisible(true);
    };

    // Handle amount input and change calculation
    const handleAmountChange = (value) => {
        setAmountEntered(value);
        const enteredAmount = parseFloat(value);
        if (enteredAmount >= adjustedTotal) {
            setChange(enteredAmount - adjustedTotal); // Calculate the change
        } else {
            setChange("Insufficient amount"); // If entered amount is less than total
        }
    };

    // Adjust quantities
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

    const handleSubmitTransaction = async () => {
        if (!selectedCustomer || cartItems.length === 0) {
            alert("Please make sure customer and cart data are valid.");
            return;
        }

        setLoading(true); // Show loading indicator

        const transactionData = {
            customer: {
                id: selectedCustomer.id,
                first_name: selectedCustomer.full_name,
                email: selectedCustomer.email,
                loyalty_points: selectedCustomer.loyalty_points,
            },
            cashier: {
                id: user_cashier.id,
                role: user_cashier.role,
                first_name: user_cashier.first_name,
                phone_number: user_cashier.phone_number,
            },
            order_items: cartItems.map((item) => ({
                product_id: item.id,
                quantity: item.quantity,
                price: exchangeRate ? item.price * exchangeRate : item.price,
            })),
            transaction: {
                total_amount: adjustedTotal,
                date: new Date().toISOString(),
                currency: selectedCurrency,
                change: change,
                amount_paid: parseFloat(amountEntered),
            },
        };

        try {
            const response = await fetch('http://192.168.81.95:8000/Sales/create_transaction/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData),
            });

            if (response.ok) {
                const result = await response.json();
                setTransactionSuccess(true);
                setTransactionId(result.order_id);
                setPaymentModalVisible(false); // Close payment modal
            } else {
                const errorData = await response.json();
                alert("Failed to submit transaction: " + (errorData.message || "Please try again"));
            }
        } catch (error) {
            alert("Network error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // const handleSubmitTransaction = async () => {
    //     if (!selectedCustomer || cartItems.length === 0) {
    //         alert("Please make sure customer and cart data are valid.");
    //         return;
    //     }
    //
    //     const transactionData = {
    //         customer: {
    //             id: selectedCustomer.id, // Assuming `id` exists in the customer object
    //             first_name: selectedCustomer.full_name,
    //             email: selectedCustomer.email,
    //             loyalty_points: selectedCustomer.loyalty_points,
    //         },
    //         cashier: {
    //             id: user_cashier.id, // Assuming the logged-in user is the cashier
    //             role: user_cashier.role,
    //             first_name: user_cashier.first_name,
    //             phone_number: user_cashier.phone_number,
    //         },
    //         order_items: cartItems.map((item) => ({
    //             product_id: item.id,
    //             quantity: item.quantity,
    //             price: exchangeRate ? item.price * exchangeRate : item.price,
    //         })),
    //         transaction: {
    //             total_amount: adjustedTotal,
    //             date: new Date().toISOString(),
    //             currency: selectedCurrency,
    //             change: change, // Send change amount
    //             amount_paid: parseFloat(amountEntered),
    //         },
    //     };
    //
    //     try {
    //         const response = await fetch('http://192.168.81.95:8000/Sales/create_transaction/', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(transactionData),
    //         });
    //        console.log(transactionData) ;
    //         if (response.ok) {
    //             const result = await response.json();
    //             alert("Transaction submitted successfully!");
    //             console.log(result);
    //         } else {
    //             const errorData = await response.json();
    //             console.error('Error submitting transaction:', errorData);
    //             alert("Failed to submit transaction. Please try again.");
    //         }
    //     } catch (error) {
    //         console.error('Error:', error);
    //         alert("An error occurred. Please check your network connection.");
    //     }
    // };

    // Calculate adjusted subtotal, tax, and total based on exchange rate
    const adjustedSubtotal = cartItems.reduce(
        (sum, item) => {
            const itemPrice = exchangeRate ? parseFloat(item.price) * exchangeRate : parseFloat(item.price);
            return sum + itemPrice * parseInt(item.quantity);
        },
        0
    );

    const taxRate = 0.05;
    const adjustedTax = adjustedSubtotal * taxRate;
    const adjustedTotal = adjustedSubtotal + adjustedTax;

    return (
        <View style={styles.container}>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#6200EE" />
                    <Text style={styles.loadingText}>Processing Transaction...</Text>
                </View>
            )}

            <View style={styles.header}>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #2145</Text>
                <TouchableOpacity onPress={handleModalOpen}>
                    <Ionicons name="person-add-outline" size={24} color="blue" />
                </TouchableOpacity>
            </View>

            <View style={[styles.card, styles.customerCard]}>
                <Text style={styles.cardHeading}>Customer</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={20} color="#6200EE" />
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
                    cartItems.map((item, index) => {
                        // Adjust item price based on selected currency
                        const itemPrice = exchangeRate ? parseFloat(item.price) * exchangeRate : parseFloat(item.price);
                        return (
                            <View key={index} style={[styles.card, styles.itemCard]}>
                                <Image source={{ uri: item.image || 'https://www.store2k.com/cdn/shop/articles/store2k_blog_2_d342a3bc-141f-4ce3-a06b-bf988b9a78f4_1024x.png?v=1628237346' }} style={styles.itemImage} />
                                <View style={styles.itemDetails}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemPrice}>
                                        {selectedCurrency ? `${selectedCurrency.toUpperCase()} ${itemPrice.toFixed(2)}` : `$${itemPrice.toFixed(2)}`}
                                    </Text>
                                </View>
                                <View style={styles.quantityContainer}>
                                    <TouchableOpacity
                                        style={styles.quantityButton}
                                        onPress={() => decreaseQuantity(index)}
                                    >
                                        <Text style={styles.quantityText}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.quantityText1}>{item.quantity}</Text>
                                    <TouchableOpacity
                                        style={styles.quantityButton}
                                        onPress={() => increaseQuantity(index)}
                                    >
                                        <Text style={styles.quantityText}>+</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => removeItem(index)}>
                                        <Ionicons name="trash-outline" size={24} color="red" />
                                    </TouchableOpacity>

                                </View>
                            </View>
                        );
                    })
                ) : (

                    <View style={styles.noItems}>
                    <Text style={styles.noItems}>No items in the cart</Text>
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.cardHeading}>Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailText}>Subtotal</Text>
                        <Text style={styles.detailText}>
                            {selectedCurrency ? `${selectedCurrency.toUpperCase()} ${adjustedSubtotal.toFixed(2)}` : `$${adjustedSubtotal.toFixed(2)}`}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailText}>Tax (5%)</Text>
                        <Text style={styles.detailText}>
                            {selectedCurrency ? `${selectedCurrency.toUpperCase()} ${adjustedTax.toFixed(2)}` : `$${adjustedTax.toFixed(2)}`}
                        </Text>

                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={styles.detailTotalText}>Total</Text>
                        <Text style={styles.detailTotalText}>
                            {selectedCurrency ? `${selectedCurrency.toUpperCase()} ${adjustedTotal.toFixed(2)}` : `$${adjustedTotal.toFixed(2)}`}
                        </Text>
                    </View>
                    {change !== null && (
                        <View style={styles.changeContainer}>
                            <Text style={styles.changeText}>
                                Change: {typeof change === "number" ? `$${change.toFixed(2)}` : change}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Currency Selection */}
                <View style={[styles.card, styles.currencyCard]}>
                    <Text style={styles.cardHeading}>Select Currency</Text>
                    <View style={styles.radioGroup}>
                        {['usd', 'zig', 'rand'].map((currency) => (
                            <TouchableOpacity
                                key={currency}
                                style={styles.radioOption}
                                onPress={() => handleCurrencySelection(currency)}
                            >
                                <View
                                    style={[
                                        styles.radioCircle,
                                        selectedCurrency === currency && styles.radioSelected
                                    ]}
                                />
                                <Text style={styles.radioText}>{currency}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Make Sale Button */}
                <TouchableOpacity style={styles.orderButton} onPress={handlePaymentModalOpen}>
                    <Text style={styles.makeSaleButtonText}>Make Sale</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Order Button */}
            <TouchableOpacity style={styles.orderButton} onPress={handleSubmitTransaction}>
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

            {/*/!* Success Modal *!/*/}
            {/*<Modal visible={transactionSuccess} animationType="slide">*/}
            {/*    <View style={styles.successModal}>*/}
            {/*        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />*/}
            {/*        <Text style={styles.successText}>Transaction Successful!</Text>*/}
            {/*        <Text style={styles.orderIdText}>Order ID: {transactionId}</Text>*/}

            {/*        <TouchableOpacity*/}
            {/*            style={styles.printButton}*/}
            {/*            onPress={handlePrintReceipt}*/}
            {/*        >*/}
            {/*            <Ionicons name="print" size={24} color="white" />*/}
            {/*            <Text style={styles.printButtonText}>Print Receipt</Text>*/}
            {/*        </TouchableOpacity>*/}

            {/*        <TouchableOpacity*/}
            {/*            style={styles.newOrderButton}*/}
            {/*            onPress={() => {*/}
            {/*                setTransactionSuccess(false);*/}
            {/*                setCartItems([]);*/}
            {/*                setSelectedCustomer(null);*/}
            {/*                setAmountEntered("");*/}
            {/*                setChange(null);*/}
            {/*            }}*/}
            {/*        >*/}
            {/*            <Text style={styles.newOrderButtonText}>New Order</Text>*/}
            {/*        </TouchableOpacity>*/}
            {/*    </View>*/}
            {/*</Modal>*/}

            {/* Success Modal */}
            <Modal visible={transactionSuccess} animationType="slide">
                <View style={styles.successModal}>
                    <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
                    <Text style={styles.successText}>Transaction Successful!</Text>
                    <Text style={styles.orderIdText}>Order ID: {transactionId}</Text>

                    <TouchableOpacity
                        style={styles.printButton}
                        onPress={handlePrintReceipt}
                    >
                        <Ionicons name="print" size={24} color="white" />
                        <Text style={styles.printButtonText}>Print Receipt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.printButton, { backgroundColor: '#4CAF50' }]}
                        onPress={async () => {
                            await handlePrintReceipt();
                        }}
                    >
                        <Ionicons name="download" size={24} color="white" />
                        <Text style={styles.printButtonText}>Download PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.newOrderButton}
                        onPress={() => {
                            setTransactionSuccess(false);
                            setCartItems([]);
                            setSelectedCustomer(null);
                            setAmountEntered("");
                            setChange(null);
                        }}
                    >
                        <Text style={styles.newOrderButtonText}>New Order</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f7fb", // Light background for better contrast
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 20,
        paddingHorizontal: 20,
        backgroundColor: "#ffffff", // Cleaner white background
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0", // Light border color
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#333", // Darker text for readability

    },
    removeButton: {
        backgroundColor: "#FF6347",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 10,
    },
    removeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    card: {
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginBottom: 12,
        marginTop:5,
        borderRadius: 12,
        padding: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    cardHeading: {
        fontSize: 18,
        marginTop:0,
        fontWeight: "bold",
        color: "#444", // Slightly darker for contrast
        marginBottom: 12,
    },
    itemCard: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        paddingBottom: 16,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 16,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#555", // A softer color for text
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6200EE", // Highlight the price with a color
    },
    quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    quantityButton: {
        backgroundColor: "#6200EE",
        padding: 10,
        borderRadius: 10,
        marginHorizontal: 8,
    },
    quantityText: {
        fontSize: 20,
        color: "#fff",
    },
    quantityText1: {
        fontSize: 20,
        color: "#6200EE",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    infoValue: {
        flex: 1,
        fontSize: 16,
        color: "#555", // Soft color for info text
    },
    loyaltyPoints: {
        fontSize: 14,
        color: "#7E57C2",
    },
    editIcon: {
        marginLeft: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#ffffff", // White background for modal
    },
    searchInput: {
        padding: 10,
        borderColor: "#ddd",
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 16,
        color: "#333", // Darker text in input
    },
    customerItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    customerName: {
        fontSize: 16,
        marginLeft: 10,
        color: "#444", // Slightly darker text
    },
    makeSaleButton: {
        backgroundColor: "#7E57C2",
        paddingVertical: 14,
        marginBottom: 16,
        borderRadius: 12,
        alignItems: "center",
        shadowColor: "#7E57C2",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    makeSaleButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
    orderButton: {
        backgroundColor: "#6200EE",
        paddingVertical: 16,
        marginHorizontal: 20,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#6200EE",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    orderButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
    currencyCard: {
        marginBottom: 20,
    },
    sectionHeading: { fontSize: 16, fontWeight: "700", marginHorizontal: 16 },
    radioGroup: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        marginVertical: 12,
    },
    radioOption: {
        flexDirection: "row",
        alignItems: "center",
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderColor: "#7E57C2",
        borderWidth: 2,
        marginRight: 10,
    },
    radioSelected: {
        backgroundColor: "#7E57C2",
    },
    radioText: {
        fontSize: 16,
        color: "#333",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    detailText: {
        fontSize: 16,
        color: "#444", // Slightly muted text color for details
    },
    detailTotalText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333", // Darker and bolder for total
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
        marginVertical: 12,
    },
    changeContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: "#f1f1f1",
        borderRadius: 10,
    },
    changeText: {
        fontSize: 16,
        color: "#7E57C2",
    },
    noItems: {
        fontSize: 35,
        color: "#FF0000",
        alignItems: "center",fontWeight: "700",padding:10,

    },

    successModal: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    successText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 20,
        color: '#4CAF50',
    },
    orderIdText: {
        fontSize: 18,
        marginBottom: 30,
        color: '#555',
    },
    printButton: {
        flexDirection: 'row',
        backgroundColor: '#6200EE',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
        marginBottom: 20,
    },
    printButtonText: {
        color: 'white',
        fontSize: 18,
        marginLeft: 10,
        fontWeight: '600',
    },
    newOrderButton: {
        backgroundColor: '#7E57C2',
        padding: 15,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
    },
    newOrderButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },

    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#6200EE',
    },
    downloadButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },


});


export default OrderScreen;
