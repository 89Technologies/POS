import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MyAccountScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.name}>John Doe</Text>
                <Text style={styles.email}>johndoe@gmahhhhhhhhhil.com</Text>
            </View>

            {/* Menu Options */}
            <TouchableOpacity style={styles.menuItem}>
                <Icon name="shopping-cart" size={24} color="#555" />
                <Text style={styles.menuText}>My Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
                <Icon name="location-on" size={24} color="#555" />
                <Text style={styles.menuText}>My Address</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
                <Icon name="notifications" size={24} color="#555" />
                <Text style={styles.menuText}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
                <Icon name="logout" size={24} color="#555" />
                <Text style={styles.menuText}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    header: { alignItems: 'center', marginBottom: 20 },
    name: { fontSize: 22, fontWeight: 'bold' },
    email: { fontSize: 16, color: '#888', marginTop: 5 },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    menuText: { marginLeft: 15, fontSize: 16, color: '#555' },
});

export default MyAccountScreen;
