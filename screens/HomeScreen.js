import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/FontAwesome';
import DashboardScreen from '../components/DashboardScreen';
import ProfileScreen from '../components/ProfileScreen';
import SettingScreen from '../components/SettingsScreen';

// Example Screens for Tabs
const DashboardTab = () => (
    <View style={styles.container}>
        <DashboardScreen /> {/* Use imported component */}
    </View>
);

const ProfileTab = () => (
    <View style={styles.container}>
        <ProfileScreen /> {/* Use imported component */}
    </View>
);

const SettingsTab = () => (
    <View style={styles.container}>
        <SettingScreen /> {/* Use imported component */}
    </View>
);

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = 'dashboard';
                    } else if (route.name === 'Profile') {
                        iconName = 'user';
                    } else if (route.name === 'Settings') {
                        iconName = 'cog';
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007bff',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardTab} />
            <Tab.Screen name="Profile" component={ProfileTab} />
            <Tab.Screen name="Settings" component={SettingsTab} />
        </Tab.Navigator>
    );
};

// Dedicated Screen for Notifications
const NotificationsScreen = () => (
    <View style={styles.container}>
        <Text style={styles.text}>Notifications</Text>
    </View>
);

// Dedicated Screen for Support
const SupportScreen = () => (
    <View style={styles.container}>
        <Text style={styles.text}>Support</Text>
    </View>
);

const Drawer = createDrawerNavigator();

const HomeScreen = () => {
    return (
        <Drawer.Navigator
            screenOptions={{
                drawerActiveTintColor: '#007bff',
                drawerInactiveTintColor: 'gray',
                headerShown: true,
            }}
        >
            <Drawer.Screen
                name="Home"
                component={BottomTabNavigator}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Icon name="home" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Icon name="bell" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Support"
                component={SupportScreen}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Icon name="life-ring" size={size} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: { fontSize: 20, fontWeight: 'bold' },
});

export default HomeScreen;
