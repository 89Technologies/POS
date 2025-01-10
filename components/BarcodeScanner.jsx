// // import React, { useState, useEffect } from 'react';
// // import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// // import { BarCodeScanner } from 'expo-barcode-scanner';
//
// const BarcodeScanner = ({ navigation }) => {
//     const [hasPermission, setHasPermission] = useState(null);
//     const [scanned, setScanned] = useState(false);
//
//     useEffect(() => {
//         // Request camera permissions
//         const getBarCodeScannerPermissions = async () => {
//             const { status } = await BarCodeScanner.requestPermissionsAsync();
//             setHasPermission(status === 'granted');
//         };
//
//         getBarCodeScannerPermissions();
//     }, []);
//
//     const handleBarCodeScanned = ({ type, data }) => {
//         setScanned(true);
//         Alert.alert(`Barcode Scanned`, `Type: ${type}\nData: ${data}`);
//         navigation.goBack(); // Navigate back after scanning
//     };
//
//     if (hasPermission === null) {
//         return <Text>Requesting for camera permission...</Text>;
//     }
//
//     if (hasPermission === false) {
//         return <Text>No access to camera. Please grant camera permission in settings.</Text>;
//     }
//
//     return (
//         <View style={styles.container}>
//             <BarCodeScanner
//                 onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
//                 style={StyleSheet.absoluteFillObject}
//             />
//             {scanned && (
//                 <TouchableOpacity
//                     style={styles.scanAgainButton}
//                     onPress={() => setScanned(false)}
//                 >
//                     <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
//                 </TouchableOpacity>
//             )}
//         </View>
//     );
// };
//
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     scanAgainButton: {
//         position: 'absolute',
//         bottom: 20,
//         backgroundColor: '#000',
//         padding: 10,
//         borderRadius: 5,
//     },
//     scanAgainText: {
//         color: '#fff',
//         fontSize: 16,
//     },
// });
//
// export default BarcodeScanner;
// //