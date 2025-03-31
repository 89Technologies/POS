import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image
} from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const ProductDetailScreen = ({ route, navigation }) => {
    // Get the full product object passed from navigation
    const { product } = route.params;

    // Safely format the price for display
    const formattedPrice = typeof product.price === 'number'
        ? product.price.toFixed(2)
        : parseFloat(product.price || 0).toFixed(2);

    // Stock status configuration
    const isLowStock = product.stock_quantity < 10;
    const stockIcon = isLowStock ? "warning" : "checkmark-circle";
    const stockColor = isLowStock ? "#ff5252" : "#4CAF50";

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            {/* Product Image Card */}
            <Card style={styles.imageCard}>
                <Card.Cover
                    source={product.image
                        ? { uri: product.image }
                        : require('../assets/images/grocery.jpg')}
                    style={styles.productImage}
                    resizeMode="contain"
                />
            </Card>

            {/* Product Details Card */}
            <Card style={styles.detailsCard}>
                <Card.Content>
                    <Title style={styles.productName}>{product.name}</Title>

                    {/* Product Code */}
                    <View style={styles.detailRow}>
                        <MaterialIcons name="tag" size={20} color="#666" />
                        <Text style={styles.detailText}>Code: {product.product_code}</Text>
                    </View>

                    {/* Price and Stock */}
                    <View style={[styles.detailRow, styles.priceStockRow]}>
                        <View style={styles.priceContainer}>
                            <MaterialIcons name="attach-money" size={20} color="#2E7D32" />
                            <Text style={styles.priceText}>${formattedPrice}</Text>
                        </View>

                        <View style={[
                            styles.stockContainer,
                            isLowStock ? styles.lowStock : styles.normalStock
                        ]}>
                            <Ionicons name={stockIcon} size={20} color={stockColor} />
                            <Text style={styles.stockText}>
                                {product.stock_quantity} in stock
                            </Text>
                        </View>
                    </View>

                    {/* Barcode */}
                    <View style={styles.detailRow}>
                        <MaterialIcons name="barcode" size={20} color="#666" />
                        <Text style={styles.detailText}>{product.barcode}</Text>
                    </View>

                    {/* Category */}
                    {product.category && (
                        <View style={styles.detailRow}>
                            <MaterialIcons name="category" size={20} color="#666" />
                            <Text style={styles.detailText}>{product.category.name}</Text>
                        </View>
                    )}

                    {/* Description */}
                    {product.description && (
                        <View style={styles.descriptionContainer}>
                            <MaterialIcons name="description" size={20} color="#666" style={styles.descriptionIcon} />
                            <Text style={styles.descriptionText}>{product.description}</Text>
                        </View>
                    )}
                </Card.Content>
            </Card>

            {/* Back Button */}
            <Button
                mode="contained"
                style={styles.backButton}
                labelStyle={styles.buttonLabel}
                onPress={() => navigation.goBack()}
            >
                Back to Products
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 24,
        backgroundColor: '#f8f9fa',
    },
    imageCard: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 2,
        backgroundColor: 'white',
    },
    productImage: {
        height: 300,
        backgroundColor: '#f5f5f5',
    },
    detailsCard: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 2,
        backgroundColor: 'white',
    },
    productName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    priceStockRow: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceText: {
        marginLeft: 6,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    stockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    lowStock: {
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
    },
    normalStock: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    stockText: {
        marginLeft: 6,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    descriptionContainer: {
        flexDirection: 'row',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    descriptionIcon: {
        marginTop: 2,
    },
    descriptionText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    backButton: {
        marginTop: 8,
        borderRadius: 8,
        paddingVertical: 8,
        backgroundColor: '#6200ee',
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default ProductDetailScreen;