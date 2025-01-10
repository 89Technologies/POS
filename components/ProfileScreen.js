import React from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // For icons

export default function PaymentScreen() {
    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Image
                    source={{ uri: "https://via.placeholder.com/40" }}
                    style={styles.profileImage}
                />
                <Text style={styles.headerText}>Payments</Text>
                <Ionicons name="qr-code-outline" size={24} color="white" />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#6e6e6e" />
                <TextInput
                    placeholder="Search ATMs, Payments, Fines"
                    placeholderTextColor="#6e6e6e"
                    style={styles.searchInput}
                />
            </View>

            {/* Favorites */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Favorites</Text>
                <View style={styles.iconRow}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="add-outline" size={24} color="white" />
                        <Text style={styles.iconLabel}>Add</Text>
                    </View>
                    <View style={styles.iconContainer}>
                        <Ionicons name="game-controller-outline" size={24} color="white" />
                        <Text style={styles.iconLabel}>Games</Text>
                    </View>
                    <View style={styles.iconContainer}>
                        <Ionicons name="receipt-outline" size={24} color="white" />
                        <Text style={styles.iconLabel}>Bills</Text>
                    </View>
                    <View style={styles.iconContainer}>
                        <Ionicons name="call-outline" size={24} color="white" />
                        <Text style={styles.iconLabel}>Phone</Text>
                    </View>
                    <View style={styles.iconContainer}>
                        <Ionicons name="heart-outline" size={24} color="white" />
                        <Text style={styles.iconLabel}>Charity</Text>
                    </View>
                </View>
            </View>

            {/* Transfer Options */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transfer options</Text>
                <View style={styles.row}>
                    <View style={styles.optionCard}>
                        <Ionicons name="swap-horizontal-outline" size={24} color="white" />
                        <Text style={styles.optionText}>Card to card</Text>
                    </View>
                    <View style={styles.optionCard}>
                        <Ionicons name="wallet-outline" size={24} color="white" />
                        <Text style={styles.optionText}>To account</Text>
                    </View>
                    <View style={styles.optionCard}>
                        <Ionicons name="bank-outline" size={24} color="white" />
                        <Text style={styles.optionText}>Bank transfer</Text>
                    </View>
                </View>
            </View>

            {/* Recent Transfers */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent transfers</Text>
                <View style={styles.row}>
                    {["Henry", "Lora", "John", "Meg", "Lee"].map((name) => (
                        <View key={name} style={styles.recentContainer}>
                            <Image
                                source={{ uri: "https://via.placeholder.com/50" }}
                                style={styles.recentImage}
                            />
                            <Text style={styles.recentName}>{name}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Payment Options */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment options</Text>
                <View style={styles.row}>
                    <View style={styles.optionCard}>
                        <Ionicons name="car-outline" size={24} color="white" />
                        <Text style={styles.optionText}>Transport</Text>
                    </View>
                    <View style={styles.optionCard}>
                        <Ionicons name="tv-outline" size={24} color="white" />
                        <Text style={styles.optionText}>Internet & TV</Text>
                    </View>
                    <View style={styles.optionCard}>
                        <Ionicons name="call-outline" size={24} color="white" />
                        <Text style={styles.optionText}>Phone</Text>
                    </View>
                    <View style={styles.optionCard}>
                        <Ionicons name="game-controller-outline" size={24} color="white" />
                        <Text style={styles.optionText}>Games</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
        padding: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerText: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1e1e1e",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    searchInput: {
        color: "white",
        marginLeft: 8,
        flex: 1,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 8,
    },
    iconRow: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    iconContainer: {
        alignItems: "center",
    },
    iconLabel: {
        color: "white",
        fontSize: 12,
        marginTop: 4,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    optionCard: {
        backgroundColor: "#1e1e1e",
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        flex: 1,
        marginHorizontal: 4,
    },
    optionText: {
        color: "white",
        fontSize: 12,
        marginTop: 8,
    },
    recentContainer: {
        alignItems: "center",
        marginHorizontal: 8,
    },
    recentImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    recentName: {
        color: "white",
        fontSize: 12,
        marginTop: 4,
    },
});
