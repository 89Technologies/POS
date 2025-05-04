import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';

const ChangePasswordModal = ({ visible, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

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
            setLoading(true);
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
            onClose();
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
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <TouchableOpacity onPress={onClose}>
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
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Change Password</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
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

export default ChangePasswordModal;