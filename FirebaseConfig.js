// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB0m-F-uxEKtZkSkhnK7BENhSfsaWwyRUU",
    authDomain: "pos-system-86a26.firebaseapp.com",
    projectId: "pos-system-86a26",
    storageBucket: "pos-system-86a26.firebasestorage.app",
    messagingSenderId: "189335791332",
    appId: "1:189335791332:web:fe33ed13dc8f8ad9186ef1",
    measurementId: "G-V6TT041C63"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage for persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { auth };




