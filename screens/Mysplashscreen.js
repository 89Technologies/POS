import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { ActivityIndicator } from 'react-native';

const Mysplashscreen = ({ navigation }) => {
    const fadeAnim = new Animated.Value(0); // Initial opacity: 0

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1, // Final opacity: 1
            duration: 2000, // Duration of animation
            useNativeDriver: true,
        }).start();

        // Navigate to the next screen after 3 seconds
        const timeout = setTimeout(() => {
            navigation.replace('SignIn'); // Replace 'Home' with your next screen name
        }, 10000);

        // Cleanup the timeout when the component unmounts
        return () => clearTimeout(timeout);
    }, [fadeAnim, navigation]);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
                <LottieView
                    source={require('../assets/animations/animation1.json')} // Replace with your animation JSON
                    autoPlay
                    loop
                    style={styles.animation}
                />
                <Text style={styles.title}>POS System</Text>
            </Animated.View>
            <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#03bafc', // POS theme color
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    animation: {
        width: 300,
        height: 300,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 10,
    },
    spinner: {
        marginTop: 20,
    },
});

export default Mysplashscreen;
