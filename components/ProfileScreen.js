import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { TextInput, Avatar, Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { getAuth } from 'firebase/auth';

const ProfileUpdateScreen = ({ navigation }) => {
    const auth = getAuth();
    const user = auth.currentUser;

    const [profile, setProfile] = useState({
        full_name: '',
        phone_number: '',
        assigned_section: '',
        employee_id:'',
        cashier_branch: '',
        profile_pic_url: null,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [localImageUri, setLocalImageUri] = useState(null);
    const [hasPermission, setHasPermission] = useState(null);

    useEffect(() => {
        if (!user) {
            Alert.alert('Authentication Required', 'Please sign in to access your profile', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
            return;
        }

        const initialize = async () => {
            // Request media library permissions
            if (Constants.platform.ios) {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                setHasPermission(status === 'granted');
                if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Please allow photo access in settings');
                }
            } else {
                setHasPermission(true);
            }

            await fetchProfile();
        };

        initialize();
    }, [user?.uid]);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const timestamp = new Date().getTime(); // Cache busting
            const response = await fetch(
                `http://192.168.170.172:8000/Sales/update_profile/${user.uid}/?_=${timestamp}`,
                {
                    headers: {
                        'Cache-Control': 'no-cache',
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to load profile');

            const data = await response.json();
            setProfile(data);

            // Add cache busting to image URL
            if (data.profile_pic_url) {
                setLocalImageUri(`${data.profile_pic_url}?${timestamp}`);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to load profile data');
            console.error('Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async () => {
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Please enable photo access in settings');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]?.uri) {
                setLocalImageUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to select image');
            console.error('Image picker error:', error);
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;

        setIsUpdating(true);
        try {
            const formData = new FormData();

            // Append profile data
            formData.append('full_name', profile.full_name || '');
            formData.append('phone_number', profile.phone_number || '');
            formData.append('assigned_section', profile.assigned_section || '');
            formData.append('employee_id', profile.employee_id || '');

            // Only append image if it's new/changed
            if (localImageUri && !localImageUri.includes(profile.profile_pic_url)) {
                const fileInfo = await FileSystem.getInfoAsync(localImageUri);
                if (fileInfo.exists) {
                    const fileType = localImageUri.split('.').pop();
                    formData.append('profile_pic', {
                        uri: localImageUri,
                        name: `profile_${user.uid}.${fileType}`,
                        type: `image/${fileType}`,
                    });
                }
            }

            const response = await fetch(
                `http://192.168.170.172:8000/Sales/update_profile/${user.uid}/`,
                {
                    method: 'PATCH',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Update failed');
            }

            const updatedProfile = await response.json();
            setProfile(updatedProfile);

            // Update local image with fresh URL
            if (updatedProfile.profile_pic_url) {
                const newTimestamp = new Date().getTime();
                setLocalImageUri(`${updatedProfile.profile_pic_url}?${newTimestamp}`);
            }

            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update profile');
            console.error('Update error:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (!user || isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3F51B5" />
                <Text style={styles.loadingText}>Loading your profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.header}>
                <Text style={styles.title}>Update Your Account Profile</Text>
                <Text style={styles.subtitle}>Keep your information current</Text>
            </View>

            <View style={styles.avatarSection}>
                <TouchableOpacity
                    onPress={pickImage}
                    activeOpacity={0.7}
                    style={styles.avatarTouchable}
                >
                    <Avatar.Image
                        size={140}
                        source={localImageUri ? { uri: localImageUri } : require('../assets/images/hex.jpg')}
                        style={styles.avatarImage}
                    />
                    <View style={styles.cameraBadge}>
                        <Avatar.Icon
                            size={40}
                            icon="camera"
                            style={styles.cameraIcon}
                        />
                    </View>
                </TouchableOpacity>
                <Text style={styles.avatarHint}>Tap to change profile photo</Text>
            </View>

            <View style={styles.formSection}>
                <TextInput
                    label="Full Name"
                    value={profile.full_name || ''}
                    onChangeText={(text) => setProfile({...profile, full_name: text})}
                    mode="outlined"
                    style={styles.inputField}
                    theme={{ colors: { primary: '#3F51B5' } }}
                    left={<TextInput.Icon name="account" color="#666" />}
                    placeholder="Enter your full name"
                />

                <TextInput
                    label="Phone Number"
                    value={profile.phone_number || ''}
                    onChangeText={(text) => setProfile({...profile, phone_number: text})}
                    mode="outlined"
                    style={styles.inputField}
                    keyboardType="phone-pad"
                    theme={{ colors: { primary: '#3F51B5' } }}
                    left={<TextInput.Icon name="phone" color="#666" />}
                    placeholder="Enter phone number"
                />

                <TextInput
                    label="Assigned Section"
                    value={profile.assigned_section || ''}
                    onChangeText={(text) => setProfile({...profile, assigned_section: text})}
                    mode="outlined"
                    style={styles.inputField}
                    theme={{ colors: { primary: '#3F51B5' } }}
                    left={<TextInput.Icon name="map-marker" color="#666" />}
                    placeholder="Your work section"
                />
                <TextInput
                    label="Employee id"
                    value={profile.employee_id || ''}
                    onChangeText={(text) => setProfile({...profile, employee_id: text})}
                    mode="outlined"
                    style={styles.inputField}
                    theme={{ colors: { primary: '#3F51B5' } }}
                    left={<TextInput.Icon name="map-marker" color="#666" />}
                    placeholder="Your Employee id"
                />

                <TextInput
                    label="Branch"
                    value={profile.cashier_branch ? profile.cashier_branch.name : 'Not assigned'}
                    mode="outlined"
                    style={styles.inputField}
                    theme={{ colors: { primary: '#3F51B5' } }}
                    left={<TextInput.Icon name="store" color="#666" />}
                    disabled
                />

                <Button
                    mode="contained"
                    onPress={handleUpdateProfile}
                    style={styles.updateButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                    loading={isUpdating}
                    disabled={isUpdating}
                    icon="content-save"
                >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F5F7FA',
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        marginTop: 20,
        color: '#555',
        fontSize: 16,
        fontWeight: '500',
    },
    header: {
        marginBottom: 28,
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        color: '#7F8C8D',
        fontWeight: '500',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarTouchable: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarImage: {
        backgroundColor: '#E0E0E0',
        borderWidth: 3,
        borderColor: '#3F51B5',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 4,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    cameraIcon: {
        backgroundColor: '#3F51B5',
    },
    avatarHint: {
        fontSize: 14,
        color: '#7F8C8D',
        fontStyle: 'italic',
    },
    formSection: {
        marginBottom: 24,
    },
    inputField: {
        marginBottom: 20,
        backgroundColor: 'white',
        fontSize: 16,
    },
    updateButton: {
        marginTop: 28,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#3F51B5',
        elevation: 3,
        shadowColor: '#3F51B5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    buttonContent: {
        height: 50,
    },
    buttonLabel: {
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

export default ProfileUpdateScreen;