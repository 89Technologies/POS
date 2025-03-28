import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as yup from 'yup';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileUpdateScreen = ({ navigation }) => {
    const [userData, setUserData] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Validation schema
    const profileSchema = yup.object().shape({
        name: yup.string().required('Name is required'),
        email: yup.string().email('Invalid email').required('Email is required'),
        bio: yup.string().max(200, 'Bio must be less than 200 characters'),
        phone: yup.string().matches(/^[0-9]{10}$/, 'Invalid phone number'),
    });

    // Fetch user data on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                // Mock data for demo
                const mockUserData = {
                    id: 1,
                    name: 'John Doe',
                    email: 'john@example.com',
                    bio: 'Mobile developer passionate about React Native',
                    phone: '1234567890',
                    profileImage: 'https://randomuser.me/api/portraits/men/1.jpg'
                };

                setUserData(mockUserData);
                setProfileImage(mockUserData.profileImage);
                setIsLoading(false);
            } catch (error) {
                Alert.alert('Error', 'Failed to load profile');
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Request image picker permissions
    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Allow access to photos to upload profile pictures');
            }
        })();
    }, []);

    // Pick an image from gallery
    const pickImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            // Simulate API call
            Alert.alert('Success', 'Profile updated!');
            setUserData({ ...userData, ...values, profileImage });
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !userData) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: '#6a11cb' }]}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#6a11cb' }]}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Back Button */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Update Profile</Text>
                </View>

                {/* Profile Picture */}
                <View style={styles.profileImageContainer}>
                    <TouchableOpacity onPress={pickImage}>
                        <Image
                            source={{ uri: profileImage || 'https://via.placeholder.com/150' }}
                            style={styles.profileImage}
                        />
                        <Text style={styles.changePhotoText}>Change Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <Formik
                    initialValues={{
                        name: userData?.name || '',
                        email: userData?.email || '',
                        bio: userData?.bio || '',
                        phone: userData?.phone || '',
                    }}
                    validationSchema={profileSchema}
                    onSubmit={handleSubmit}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <View style={styles.formContainer}>
                            <TextInput
                                label="Full Name"
                                mode="outlined"
                                style={styles.input}
                                theme={{ colors: { primary: '#fff', text: '#fff', placeholder: 'rgba(255,255,255,0.7)' } }}
                                onChangeText={handleChange('name')}
                                onBlur={handleBlur('name')}
                                value={values.name}
                                error={touched.name && !!errors.name}
                            />
                            {touched.name && errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                            <TextInput
                                label="Email"
                                mode="outlined"
                                style={styles.input}
                                theme={{ colors: { primary: '#fff', text: '#fff', placeholder: 'rgba(255,255,255,0.7)' } }}
                                onChangeText={handleChange('email')}
                                onBlur={handleBlur('email')}
                                value={values.email}
                                keyboardType="email-address"
                                error={touched.email && !!errors.email}
                            />
                            {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                            <TextInput
                                label="Phone"
                                mode="outlined"
                                style={styles.input}
                                theme={{ colors: { primary: '#fff', text: '#fff', placeholder: 'rgba(255,255,255,0.7)' } }}
                                onChangeText={handleChange('phone')}
                                onBlur={handleBlur('phone')}
                                value={values.phone}
                                keyboardType="phone-pad"
                                error={touched.phone && !!errors.phone}
                            />
                            {touched.phone && errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

                            <TextInput
                                label="Bio"
                                mode="outlined"
                                style={[styles.input, { height: 100 }]}
                                theme={{ colors: { primary: '#fff', text: '#fff', placeholder: 'rgba(255,255,255,0.7)' } }}
                                onChangeText={handleChange('bio')}
                                onBlur={handleBlur('bio')}
                                value={values.bio}
                                multiline
                                numberOfLines={4}
                                error={touched.bio && !!errors.bio}
                            />
                            {touched.bio && errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#6a11cb" />
                                ) : (
                                    <Text style={styles.buttonText}>Update Profile</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </Formik>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
    header: {
        alignItems: 'center',
        marginTop: 50,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#fff',
    },
    changePhotoText: {
        color: '#fff',
        marginTop: 10,
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 10,
        color: '#fff',
    },
    button: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#6a11cb',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ffeb3b',
        marginBottom: 10,
        marginLeft: 10,
    },
});

export default ProfileUpdateScreen;