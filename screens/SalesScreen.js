import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from "@react-navigation/native";
import '../FirebaseConfig';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const App = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null); // State to track selected category
    const [cart, setCart] = useState([]); // State to track cart items
    const [selectedItem, setSelectedItem] = useState(null); // State to track selected item
    const [user, setUser] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // Search term state

    const navigation = useNavigation();

    const auth = getAuth();

    useEffect(() => {
        const fetchProducts = async () => {

            try {
                const currentUser = auth.currentUser;
            if (currentUser) {
                const firebaseId = currentUser.uid
                const response = await fetch(`http://192.168.155.11:8000/Sales/products/${firebaseId}/`);
                const data = await response.json();
                setProducts(data);
                console.log(data);

            }
            } catch (error) {
                console.error(error);
            }
        };



        const fetchUser = async () => {
            try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const firebaseId = currentUser.uid; // Get Firebase ID
                    const response = await fetch(`http://192.168.155.11:8000/Auth/get_user_role/${firebaseId}/`);
                    const data = await response.json();
                    setUser(data);
                    console.log(data);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        const fetchCategories = async () => {
            try {
                const response = await fetch('http://192.168.155.11:8000/Sales/categories/');
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchProducts();
        fetchCategories();
        fetchUser();
    }, []);


    // Filter products based on selected category
    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory
            ? product.category === selectedCategory
            : true;

        const matchesSearchTerm = product.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.name.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesCategory && matchesSearchTerm;
    });

    const handleAddToCart = (product) => {
        setCart((prevCart) => {
            const productExists = prevCart.some(item => item.id === product.id);
            if (!productExists) {
                return [...prevCart, { ...product, quantity: 1 }]; // Add item with default quantity 1
            }
            return prevCart;
        });
        setSelectedItem(product.id); // Set the selected item to highlight it
    };

    const handleIncrement = (productId) => {
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };

    const handleDecrement = (productId) => {
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
        );
    };

    const renderProduct = (product) => {
        const isOutOfStock = product.stock_quantity === 0;
        return (

            <TouchableOpacity

                style={[
                    styles.menuItem,
                    selectedItem === product.id && styles.selectedItem, // Apply highlight if selected
                ]}
                key={product.id}
                onPress={() => !isOutOfStock && handleAddToCart(product)} // Prevent adding out-of-stock items
                disabled={isOutOfStock} // Disable interaction for out-of-stock items // Add item to cart when clicked
            >
                <Image
                    source={{uri: product.image || 'https://www.store2k.com/cdn/shop/articles/store2k_blog_2_d342a3bc-141f-4ce3-a06b-bf988b9a78f4_1024x.png?v=1628237346'}}
                    style={styles.menuImage}
                />
                <View style={styles.menuDetails}>
                    <Text style={styles.menuName}>{product.name}</Text>
                    <Text style={styles.menuPrice}>${product.price}</Text>
                    <Text
                        style={[
                            styles.stockText,
                            isOutOfStock ? styles.outOfStock : styles.inStock,
                        ]}
                    >
                        {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock_quantity}`}
                    </Text>
                </View>
                <View style={styles.quantityControl}>
                    <TouchableOpacity onPress={() => handleDecrement(product.id)}>
                        <Icon name="remove-circle" size={20} color="#000"/>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>
                        {cart.find(item => item.id === product.id)?.quantity || 1}
                    </Text>
                    <TouchableOpacity onPress={() => handleIncrement(product.id)}>
                        <Icon name="add-circle" size={20} color="#000"/>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderCategoryButton = (category) => (

        <TouchableOpacity

            style={styles.categoryButton}
            key={category.id}
            onPress={() => setSelectedCategory(category.id)} // Update selected category on press
        >
            <Icon name="fast-food" size={30} color="#fff" />
            <Text style={styles.categoryText}>{category.name}</Text>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        const total = cart.reduce((total, item) => total + (item.price * item.quantity || 0), 0);
        return (
            <View style={styles.footer}>
                <Text style={styles.footerText}>Items: {cart.length}</Text>
                <Text style={styles.footerPrice}>${total ? total.toFixed(2) : '0.00'}</Text>
                <TouchableOpacity style={styles.proceedButton}
                 onPress={() => navigation.navigate('Cart', { cart,user })}
                >
                    <Text style={styles.proceedText}>Proceed New Order</Text>

                    <Icon name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity>
                    <Icon name="menu" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.headerTitle}>
                    <Text style={styles.userName}>{user.first_name}</Text>
                    <Text style={styles.role}>{user.role}</Text>
                </View>
                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={() => navigation.navigate('Barcode')}>
                        <Icon name="barcode-outline" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
                <TextInput
                    placeholder="Search Menu"
                    style={styles.searchInput}
                    value={searchTerm} // Bind search input to state
                    onChangeText={text => setSearchTerm(text)} // Update search term
                />
                <TouchableOpacity style={styles.filterButton}>
                    <Icon name="filter" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Order Status */}


            {/* Main Content */}
            <ScrollView>
                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.menuCategories}
                >
                    {categories.map(renderCategoryButton)}
                </ScrollView>
                <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => setSelectedCategory(null)} // Reset category selection
                >
                    <Text style={styles.viewAllText}>View All Products</Text>
                </TouchableOpacity>

                {/* Products */}
                <View style={styles.menuList}>
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(renderProduct) /* Display filtered products */
                    ) : (
                        <Text style={styles.noProductsText}>Product not available</Text> /* Message if no products match */
                    )}
                </View>
            </ScrollView>

            {/* Cart Summary */}
            {renderFooter()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    role: {
        fontSize: 14,
        color: '#A9A9A9',
    },
    headerIcons: {
        flexDirection: 'row',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 8,
        elevation: 2,
    },
    noProductsText: {
        fontSize: 16,
        color: '#A9A9A9',
        textAlign: 'center',
        marginTop: 20,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    filterButton: {
        backgroundColor: '#6200EE',
        padding: 8,
        borderRadius: 8,
    },
    orderStatusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    orderCard: {
        flex: 1,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        padding: 12,
        margin: 4,
    },
    orderStatusText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    orderNumber: {
        fontSize: 12,
        color: '#A9A9A9',
    },
    orderDetails: {
        fontSize: 12,
        color: '#000',
    },
    orderItems: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    menuCategories: {
        marginVertical: 16,
    },
    categoryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6200EE',
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 4,
        width: 70,
        height: 90,
    },
    categoryText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    menuList: {
        marginVertical: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8e6e6',
        borderRadius: 8,
        padding: 8,
        marginVertical: 4,
        elevation: 2,
    },
    selectedItem: {
        backgroundColor: '#E8F5E9', // Highlighted item background
        borderWidth: 2,
        borderColor: '#6200EE', // Border color for selected item
    },
    menuImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    menuDetails: {
        flex: 1,
        marginLeft: 12,
    },
    menuName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    menuPrice: {
        fontSize: 14,
        color: '#A9A9A9',
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 16,
        marginHorizontal: 8,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#6200EE',
        padding: 16,
        borderRadius: 8,
    },
    footerText: {
        color: '#fff',
        fontSize: 14,
    },
    footerPrice: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    proceedButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    proceedText: {
        color: '#fff',
        fontSize: 14,
        marginRight: 8,
    },

    outOfStockItem: {
        backgroundColor: '#FFE6E6', // Light red background for out-of-stock items
        borderColor: '#FF4D4D', // Red border
        borderWidth: 2,
    },
    // stockText: {
    //     fontSize: 12,
    //     color: '#FF4D4D', // Red color for out-of-stock text
    //     fontWeight: 'bold',
    // },
    stockText: {
        fontSize: 14,
        marginTop: 4,
    },
    inStock: {
        color: 'blue',
    },
    outOfStock: {
        color: 'red',
    },
    viewAllButton: {
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: '#007BFF',
        borderRadius: 8,
        padding: 12,
        marginTop:0,
        marginBottom:0,
        marginVertical: 8,
        alignSelf: 'center', // Center the button horizontally
    },
    viewAllText: {
        color: '#FF4D4D',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default App;
