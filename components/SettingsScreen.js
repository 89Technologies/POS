import { View, Text, FlatList, TouchableOpacity, Linking, Image, Share, ActivityIndicator, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigation } from '@react-navigation/native';




export default function ActionButton() {
    const navigation = useNavigation();
    const [business, setBusiness] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCompanyData()
    }, [])

    const fetchCompanyData = async () => {
        try {
            const response = await axios.get('http://192.168.155.11:8000/Sales/company/')
            setBusiness(response.data)
        } catch (error) {
            console.error("Error fetching company data:", error)
        } finally {
            setLoading(false)
        }
    }

    const actionButtonMenu = [
        {
            id: 1,
            name: 'Call',
            icon: require('../assets/images/call.png'),
            url: 'tel:' + business?.phone
        },
        // {
        //     id: 2,
        //     name: 'Message',
        //     // icon: require('../assets/images/message.png'),
        //     url: 'sms:' + business?.phone
        // },
        {
            id: 3,
            name: 'Location',
            icon: require('../assets/images/pin.png'),
            url: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(
                `${business?.address}, ${business?.city}, ${business?.country}`
            )
        },
        {
            id: 4,
            name: 'Share',
            icon: require('../assets/images/share.png'),
            action: () => Share.share({
                message: `${business?.name}\nAddress: ${business?.address}, ${business?.city}\nContact: ${business?.phone}\nWebsite: ${business?.website}`
            })
        },
        {
            id: 5,
            name: 'Web',
            icon: require('../assets/images/web.png'),
            url: business?.website
        },
        {
            id: 6,
            name: 'Email',
            icon: require('../assets/images/mail.png'),
            url: `mailto:${business?.email}?subject=Inquiry about ${business?.name}`
        },
        {
            id: 7,
            name: 'Settings',
            icon: require('../assets/images/settings.jpg'),
            action: () => navigation.navigate('SettingsMain')
        },
        // {
        //     id: 8,
        //     name: 'About',
        //     icon: require('../assets/images/question.jpg'),
        //     action: () => navigation.navigate('About')
        // },
    ]

    const handleAction = (item) => {
        if (item.action) {
            item.action()
        } else if (item.url) {
            Linking.openURL(item.url).catch(err => console.error("Couldn't load page", err))
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading company info...</Text>
            </View>
        )
    }

    if (!business) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>No business information available</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Company Header */}
            <View style={styles.companyHeader}>
                {business.logo_url ? (
                    <Image
                        source={{ uri: business.logo_url }}
                        style={styles.logo}
                        resizeMode="contain"
                        onError={(e) => console.log('Failed to load logo:', e.nativeEvent.error)}
                    />
                ) : (
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>{business.name.charAt(0)}</Text>
                    </View>
                )}
                <Text style={styles.companyName}>{business.name}</Text>
                {business.address && (
                    <Text style={styles.companyAddress}>
                        {business.address}, {business.city}
                    </Text>
                )}
            </View>

            {/* Action Buttons */}
            <FlatList
                data={actionButtonMenu}
                numColumns={4}
                columnWrapperStyle={styles.buttonRow}
                contentContainerStyle={styles.buttonContainer}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.buttonItem}
                        onPress={() => handleAction(item)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.buttonIconContainer}>
                            <Image
                                source={item.icon}
                                style={styles.buttonIcon}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.buttonText}>{item.name}</Text>
                    </TouchableOpacity>
                )}
                keyExtractor={item => item.id.toString()}
            />

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>© {new Date().getFullYear()} {business.name}</Text>
                <Text style={styles.footerText}>v1.0.0</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        color: '#6c757d',
        fontSize: 16,
    },
    errorText: {
        color: '#dc3545',
        fontSize: 16,
    },
    companyHeader: {
        alignItems: 'center',
        marginVertical: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    logoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
    },
    companyName: {
        fontSize: 22,
        fontWeight: '600',
        color: '#212529',
        textAlign: 'center',
        marginBottom: 4,
    },
    companyAddress: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        maxWidth: '80%',
    },
    buttonContainer: {
        flexGrow: 1,
        paddingBottom: 16,
    },
    buttonRow: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    buttonItem: {
        alignItems: 'center',
        width: '22%',
    },
    buttonIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonIcon: {
        width: 30,
        height: 30,
    },
    buttonText: {
        fontFamily: 'outfit-medium',
        fontSize: 12,
        color: '#495057',
        textAlign: 'center',
    },
    footer: {
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#6c757d',
        marginVertical: 2,
    },
})