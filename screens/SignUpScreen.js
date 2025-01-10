import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser, getAuth } from 'firebase/auth';
import { auth } from '../FirebaseConfig'; // Import Firebase config

const SignUpScreen = ({ navigation }) => {
    const [full_name, setUsername] = useState('');
    const [phone_number, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('');
    const [branch, setBranch] = useState('');

    const handleSignUp = async () => {
        if (!full_name || !phone_number || !email || !password || !confirmPassword || !role || !branch) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            const firebaseUserId = userCredential.user.uid;


            await sendEmailVerification(firebaseUser);

            Alert.alert(
                'Verification Email Sent',
                'Please verify your email to complete the signup process.'
            );

            const checkEmailVerified = async () => {
                await firebaseUser.reload();
                return firebaseUser.emailVerified;
            };

            let isVerified = false;
            const maxAttempts = 6;
            let attempts = 0;

            while (!isVerified && attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
                isVerified = await checkEmailVerified();
                attempts += 1;
            }

            if (!isVerified) {
                await deleteUser(firebaseUser);
                Alert.alert('Error', 'Email not verified in time. Your account has been deleted.');
                return;
            }

            // Send user data to backend after email verification
            const userData = {
                first_name: full_name,
                phone_number,
                email,
                role,
                branch,
                firebase_user_id:firebaseUserId,
                password,
            };

            const response = await fetch('http://192.168.102.194:8000/Auth/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const result = await response.json();
            if (!response.ok) {
                // Profile creation failed in backend, delete user in Firebase
                await deleteUser(firebaseUser);
                Alert.alert('Error', 'Profile creation failed in backend. Your account has been deleted.');
                return;
            }

            Alert.alert('Success', 'Account created successfully!');
            navigation.navigate('SignIn');
        } catch (error) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    Alert.alert('Error', 'This email is already in use.');
                    break;
                case 'auth/invalid-email':
                    Alert.alert('Error', 'Invalid email address.');
                    break;
                case 'auth/weak-password':
                    Alert.alert('Error', 'Password is too weak.');
                    break;
                default:
                    Alert.alert('Error', `Something went wrong: ${error.message}`);
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Let’s Get Started</Text>
            <Text style={styles.subtitle}>Create an account to continue!</Text>

            <View style={styles.inputContainer}>
                <Icon name="user" size={20} color="#888" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={full_name}
                    onChangeText={setUsername}
                />
            </View>
            <View style={styles.inputContainer}>
                <Icon name="phone" size={20} color="#888" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                    value={phone_number}
                    onChangeText={setPhone}
                />
            </View>
            <View style={styles.inputContainer}>
                <Icon name="envelope" size={20} color="#888" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>
            <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#888" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>
            <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#888" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
            </View>
            <View style={styles.inputContainer}>
                <Icon name="user" size={20} color="#888" style={styles.icon} />
                <Picker
                    selectedValue={role}
                    onValueChange={(itemValue) => setRole(itemValue)}
                    style={styles.dropdown}
                >
                    <Picker.Item label="Select Role" value="" />
                    <Picker.Item label="Cashier" value="cashier" />
                    <Picker.Item label="Manager" value="manager" />
                    <Picker.Item label="Admin" value="admin" />
                </Picker>
            </View>
            <View style={styles.inputContainer}>
                <Icon name="building" size={20} color="#888" style={styles.icon} />
                <Picker
                    selectedValue={branch}
                    onValueChange={(itemValue) => setBranch(itemValue)}
                    style={styles.dropdown}
                >
                    <Picker.Item label="Select Branch" value="" />
                    <Picker.Item label="Branch 1" value="branch1" />
                    <Picker.Item label="Branch 2" value="branch2" />
                    <Picker.Item label="Branch 3" value="branch3" />
                </Picker>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                <Text style={styles.buttonText}>SIGN UP</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.signInText}>
                    Already have an account? <Text style={styles.signInLink}>Sign In</Text>
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    dropdown: {
        flex: 1,
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    signInText: {
        textAlign: 'center',
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    signInLink: {
        color: '#007bff',
        fontWeight: 'bold',
    },
});

export default SignUpScreen;
