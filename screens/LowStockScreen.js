import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    ActivityIndicator,
    Animated,
    Easing,
    TouchableOpacity,
    RefreshControl
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import { getAuth } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';

const LowStockScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const auth = getAuth();
    const user = auth.currentUser;

    // Animation setup
    const spinAnim = useRef(new Animated.Value(0)).current;
    const refreshInterval = useRef(null);

    useEffect(() => {
        if (user) {
            fetchLowStockProducts();
            startAnimation();
            // Set up auto-refresh every 30 seconds
            refreshInterval.current = setInterval(fetchLowStockProducts, 30000);
        }

        return () => {
            if (refreshInterval.current) {
                clearInterval(refreshInterval.current);
            }
        };
    }, [user]);

    const startAnimation = () => {
        spinAnim.setValue(0);
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
                easing: Easing.linear
            })
        ).start();
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const fetchLowStockProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `http://192.168.170.172:8000/Sales/low_stock/${user.uid}/`
            );

            if (!response.ok) throw new Error('Failed to fetch low stock products');

            const data = await response.json();
            // Convert price to number if it comes as string
            const processedData = data.map(item => ({
                ...item,
                price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
            }));
            setProducts(processedData);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchLowStockProducts();
    };

    const handleProductPress = (product) => {
        navigation.navigate('ProductDetailScreen', { product });
    };

    const renderProduct = ({ item }) => {
        // Safely format price
        const formattedPrice = typeof item.price === 'number'
            ? item.price.toFixed(2)
            : parseFloat(item.price || 0).toFixed(2);

        return (
            <TouchableOpacity onPress={() => handleProductPress(item)}>
                <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>
                        <View style={styles.imageContainer}>
                            {item.image ? (
                                <Image
                                    source={{ uri: item.image }}
                                    style={styles.image}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Image
                                    source={require('../assets/images/grocery.jpg')}
                                    style={styles.image}
                                    resizeMode="contain"
                                />
                            )}
                        </View>

                        <View style={styles.details}>
                            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                            <Text style={styles.code}>Code: {item.product_code}</Text>
                            <Text style={styles.price}>${formattedPrice}</Text>
                        </View>

                        <View style={styles.stockAlert}>
                            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                <MaterialIcons name="warning" size={26} color="#ff5252" />
                            </Animated.View>
                            <Text style={styles.stockText}>{item.stock_quantity} left</Text>
                        </View>
                    </Card.Content>
                </Card>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={40} color="#f44336" />
                <Text style={styles.errorText}>{error}</Text>
                <Button
                    mode="contained"
                    onPress={fetchLowStockProducts}
                    style={styles.retryButton}
                    labelStyle={styles.buttonLabel}
                >
                    Try Again
                </Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#6200ee']}
                        tintColor="#6200ee"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="check-circle" size={50} color="#4CAF50" />
                        <Text style={styles.emptyText}>All products have sufficient stock!</Text>
                        <Button
                            mode="outlined"
                            onPress={fetchLowStockProducts}
                            style={styles.refreshButton}
                        >
                            Refresh
                        </Button>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    errorText: {
        fontSize: 16,
        color: '#f44336',
        marginVertical: 20,
        textAlign: 'center',
    },
    retryButton: {
        width: '60%',
        marginTop: 10,
        backgroundColor: '#6200ee',
    },
    buttonLabel: {
        color: 'white',
        fontSize: 16,
    },
    listContent: {
        padding: 10,
        paddingBottom: 20,
    },
    card: {
        marginBottom: 12,
        elevation: 2,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    imageContainer: {
        width: 70,
        height: 70,
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    details: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    code: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    price: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2E7D32',
    },
    stockAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    stockText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f44336',
        marginLeft: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#f8f9fa',
    },
    emptyText: {
        fontSize: 18,
        color: '#4CAF50',
        marginVertical: 20,
        textAlign: 'center',
    },
    refreshButton: {
        width: '50%',
        borderColor: '#6200ee',
    },
});

export default LowStockScreen;