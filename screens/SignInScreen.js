import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import axios from 'axios'; // Add axios for making API requests
import '../FirebaseConfig';

const SignInScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showSuccessIcon, setShowSuccessIcon] = useState(false);
    const [modalVisible, setModalVisible] = useState(false); // State for modal visibility
    const [resetEmail, setResetEmail] = useState(''); // State for email input in modal
    const [isLoading, setIsLoading] = useState(false); // State for loading spinner

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setIsLoading(true); // Show spinner
        const auth = getAuth();

        try {
            // navigation.navigate('HomeScreen');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setShowSuccessIcon(true);
            setTimeout(() => {
                setShowSuccessIcon(false);
                setIsLoading(false); // Hide spinner

                // Fetch Firebase ID and send to backend to get the role
                const firebaseId = userCredential.user.uid;
                fetchUserRole(firebaseId); // Call the function to fetch role
            }, 1000); // Delay the role fetching to show success icon for 1 second
        } catch (error) {
            // navigation.navigate('HomeScreen');
            setIsLoading(false); // Hide spinner on error
            let errorMessage = 'An error occurred. Please try again.';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No user found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This user account has been disabled.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many login attempts. Please try again later.';
                    break;
                default:
                    errorMessage = error.message;
            }
            Alert.alert('Sign-In Failed', errorMessage);
        }
    };

    const fetchUserRole = async (firebaseId) => {
        // navigation.navigate('HomeScreen');
        try {
            // Make a request to your backend to fetch the user role

            // const firebaseId='403qgdQrroZfj1rtekQwATLF09I3';
            const response = await axios.get(`http://192.168.51.77:8000/Auth/get_user_role/${firebaseId}`);
            // const response = await axios.get(`http://192.168.51.77:8000/Auth/get_user_role/${firebaseId}`);
            const role = response.data.role;
            const token = response.data.token;
            console.log("my token")
            console.log(token)
            console.log(role)

            // Navigate based on the user's role
            if (role === 'cashier') {
                navigation.navigate('HomeScreen');
            } else if (role === 'admin') {
                navigation.navigate('Settings');
            } else if (role === 'manager') {
                // navigation.navigate('PatientHomeScreen');
                navigation.navigate('HomeScreen');
            } else {
                Alert.alert('Error', 'Role not found.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch user role.');
            //
        }
    };

    const handlePasswordReset = async () => {
        if (!resetEmail) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }

        const auth = getAuth();
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            Alert.alert('Success', 'Password reset email sent!');
            setModalVisible(false); // Close the modal after success
            setResetEmail(''); // Clear the input
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <View style={styles.container}>
            {!showSuccessIcon ? (
                <>
                    <Image
                        source={require('../assets/images/signin.jpg')}
                        style={styles.image}
                        resizeMode="contain"
                    />

                    <Text style={styles.title}>Let’s Sign You In</Text>
                    <Text style={styles.subtitle}>Welcome back! You’ve been missed.</Text>

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

                    {/* Sign In Button */}
                    <TouchableOpacity onPress={handleSignIn} style={styles.button}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>SIGN IN</Text>
                        )}
                    </TouchableOpacity>

                    {/* Forgot Password Link */}
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <View style={styles.signupContainer}>
                        <Text style={styles.signupText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                            <Text style={styles.signupLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View style={styles.successContainer}>
                    <Icon name="check-circle" size={80} color="green" />
                    <Text style={styles.successText}>Login Success</Text>
                </View>
            )}

            {/* Password Reset Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Reset Password</Text>
                        <Text style={styles.modalSubtitle}>
                            Enter your email to receive a password reset link.
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            value={resetEmail}
                            onChangeText={setResetEmail}
                        />
                        <TouchableOpacity onPress={handlePasswordReset} style={styles.modalButton}>
                            <Text style={styles.modalButtonText}>Send Reset Link</Text>
                        </TouchableOpacity>
                        <Pressable onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalClose}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
    image: { width: '100%', height: 200, marginBottom: 20, alignSelf: 'center' },
    title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
    subtitle: { textAlign: 'center', fontSize: 14, color: '#888', marginBottom: 30 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 20,
        paddingHorizontal: 10,
        backgroundColor: '#f9f9f9',
    },
    icon: { marginRight: 10 },
    input: { flex: 1, height: 50, fontSize: 14 },
    button: {
        height: 50,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 20,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    forgotPassword: { marginTop: 15 },
    forgotPasswordText: { fontSize: 14, color: '#007bff', textAlign: 'center' },
    signupContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    signupText: { fontSize: 14, color: '#888' },
    signupLink: { fontSize: 14, color: '#007bff', fontWeight: 'bold' },
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    successText: { fontSize: 18, color: 'green', marginTop: 10, fontWeight: 'bold' },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
    modalInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        fontSize: 14,
    },
    modalButton: {
        width: '100%',
        backgroundColor: '#007bff',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    modalClose: { color: '#007bff', fontSize: 14, fontWeight: 'bold', marginTop: 10 },
});

export default SignInScreen;
