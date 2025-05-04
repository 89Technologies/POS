import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword, signOut } from 'firebase/auth';
// import PrinterSettingsModal from '../Modals/PrinterSettingsModal';

const SettingsMain = ({ navigation }) => {
    const [settings, setSettings] = useState({
        darkMode: false,
        notifications: true,
        biometricLogin: false,
        syncData: true,
        printerSettings: {
            type: 'Bluetooth',
            paperSize: '80mm',
            ipAddress: '',
            port: '9100',
            deviceId: null
        }
    });

    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showPrinterModal, setShowPrinterModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            const auth = getAuth();
            await signOut(auth);
            navigation.reset({
                index: 0,
                routes: [{ name: 'SignIn' }],
            });
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
        } finally {
            Alert.alert('Logged out', 'You have been successfully logged out');
            setIsLoggingOut(false);
        }
    };

    const confirmLogout = () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: handleLogout
                }
            ]
        );
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password should be at least 6 characters');
            return;
        }

        try {
            setIsChangingPassword(true);
            const auth = getAuth();
            const user = auth.currentUser;

            // Reauthenticate user
            const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
            );

            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            Alert.alert('Success', 'Password changed successfully');
            setShowChangePasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error changing password:', error);
            let errorMessage = 'Failed to change password';
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Current password is incorrect';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'This operation requires recent authentication. Please log out and log in again.';
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setIsChangingPassword(false);
        }
    };

    // const handleSavePrinterSettings = (newSettings) => {
    //     setSettings({
    //         ...settings,
    //         printerSettings: newSettings
    //     });
    //     setShowPrinterModal(false);
    // };

    const settingsOptions = [
        {
            title: "Account",
            icon: "person-outline",
            items: [
                {
                    name: "Change Password",
                    icon: "lock-closed-outline",
                    action: () => setShowChangePasswordModal(true)
                },
            ]
        },
        {
            title: "Appearance",
            icon: "color-palette-outline",
            items: [
                {
                    name: "Dark Mode",
                    icon: "moon-outline",
                    rightComponent: (
                        <Switch
                            value={settings.darkMode}
                            onValueChange={(value) => setSettings({...settings, darkMode: value})}
                        />
                    )
                },
                {
                    name: "Language",
                    icon: "language-outline",
                    value: "English",
                    action: () => navigation.navigate('Language')
                },
            ]
        },
        {
            title: "POS Settings",
            icon: "receipt-outline",
            items: [
                {
                    name: "Printer Settings",
                    icon: "print-outline",
                    value: `${settings.printerSettings.type} (${settings.printerSettings.paperSize})`,
                    action: () => setShowPrinterModal(true)
                },
                {
                    name: "Receipt Layout",
                    icon: "document-text-outline",
                    // action: () => navigation.navigate('ReceiptLayout')
                },
            ]
        },
        {
            title: "About",
            icon: "information-circle-outline",
            items: [
                {
                    name: "Terms & Conditions",
                    icon: "document-text-outline",
                    action: () => navigation.navigate('Terms')
                },
                {
                    name: "App Version",
                    icon: "logo-react",
                    value: "1.0.0",
                    disabled: true
                }
            ]
        }
    ];

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.header}>Settings</Text>

                {settingsOptions.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name={section.icon} size={20} color="#666" />
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                        </View>

                        <View style={styles.sectionItems}>
                            {section.items.map((item, itemIndex) => (
                                <TouchableOpacity
                                    key={itemIndex}
                                    style={styles.item}
                                    onPress={item.action}
                                    disabled={item.disabled}
                                >
                                    <View style={styles.itemLeft}>
                                        <Ionicons name={item.icon} size={22} color="#444" />
                                        <Text style={styles.itemText}>{item.name}</Text>
                                    </View>

                                    <View style={styles.itemRight}>
                                        {item.value && <Text style={styles.itemValue}>{item.value}</Text>}
                                        {item.rightComponent || (
                                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout Button Section */}
                <View style={[styles.section, { marginTop: 20 }]}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={confirmLogout}
                        disabled={isLoggingOut}
                    >
                        <View style={styles.logoutButtonContent}>
                            {isLoggingOut ? (
                                <ActivityIndicator color="#d9534f" />
                            ) : (
                                <>
                                    <Ionicons name="log-out-outline" size={22} color="#d9534f" />
                                    <Text style={styles.logoutButtonText}>Logout</Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                visible={showChangePasswordModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowChangePasswordModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity
                                onPress={() => setShowChangePasswordModal(false)}
                                disabled={isChangingPassword}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Current Password</Text>
                            <TextInput
                                style={styles.input}
                                secureTextEntry
                                placeholder="Enter current password"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>New Password</Text>
                            <TextInput
                                style={styles.input}
                                secureTextEntry
                                placeholder="Enter new password (min 6 chars)"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <TextInput
                                style={styles.input}
                                secureTextEntry
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isChangingPassword && styles.buttonDisabled]}
                            onPress={handleChangePassword}
                            disabled={isChangingPassword}
                        >
                            {isChangingPassword ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Change Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Printer Settings Modal */}
            {/*<PrinterSettingsModal*/}
            {/*    visible={showPrinterModal}*/}
            {/*    onClose={() => setShowPrinterModal(false)}*/}
            {/*    currentSettings={settings.printerSettings}*/}
            {/*    onSave={handleSavePrinterSettings}*/}
            {/*/>*/}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#333',
    },
    section: {
        marginBottom: 24,
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    sectionTitle: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
    },
    sectionItems: {
        paddingHorizontal: 8,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemText: {
        marginLeft: 12,
        fontSize: 15,
        color: '#333',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemValue: {
        marginRight: 8,
        fontSize: 14,
        color: '#888',
    },
    logoutButton: {
        padding: 16,
    },
    logoutButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutButtonText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#d9534f',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        marginBottom: 5,
        fontSize: 14,
        color: '#666',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#99c2ff',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SettingsMain;