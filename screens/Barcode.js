import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Vibration, Linking, Platform } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const ExpoBarcodeScannerScreen = ({ navigation }) => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [barcodeData, setBarcodeData] = useState(null);
    const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
    const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getBarCodeScannerPermissions();
    }, []);

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        setBarcodeData({ type, data });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Uncomment to navigate automatically after scan
        // navigation.navigate('ProductDetails', { barcodeData: data });
    };

    const toggleFlash = () => {
        setFlashMode(
            flashMode === Camera.Constants.FlashMode.off
                ? Camera.Constants.FlashMode.torch
                : Camera.Constants.FlashMode.off
        );
    };

    const switchCamera = () => {
        setCameraType(
            cameraType === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
        );
    };

    const resetScanner = () => {
        setScanned(false);
        setBarcodeData(null);
    };

    if (hasPermission === null) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Requesting for camera permission...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>No access to camera</Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={() => Linking.openSettings()}
                >
                    <Text style={styles.permissionButtonText}>Open Settings</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                style={styles.camera}
                type={cameraType}
                flashMode={flashMode}
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                barCodeScannerSettings={{
                    barCodeTypes: [
                        BarCodeScanner.Constants.BarCodeType.qr,
                        BarCodeScanner.Constants.BarCodeType.ean13,
                        BarCodeScanner.Constants.BarCodeType.upcA,
                        BarCodeScanner.Constants.BarCodeType.code128,
                        BarCodeScanner.Constants.BarCodeType.code39,
                    ],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.topOverlay}>
                        <Text style={styles.instruction}>Align the barcode within the frame</Text>
                    </View>

                    <View style={styles.middleOverlay}>
                        <View style={styles.leftAndRightOverlay} />
                        <View style={styles.scanFrame}>
                            <View style={[styles.corner, styles.topLeftCorner]} />
                            <View style={[styles.corner, styles.topRightCorner]} />
                            <View style={[styles.corner, styles.bottomLeftCorner]} />
                            <View style={[styles.corner, styles.bottomRightCorner]} />
                        </View>
                        <View style={styles.leftAndRightOverlay} />
                    </View>

                    <View style={styles.bottomOverlay}>
                        {scanned && barcodeData ? (
                            <View style={styles.barcodeDataContainer}>
                                <View style={styles.barcodeData}>
                                    <Text style={styles.barcodeType}>Type: {barcodeData.type}</Text>
                                    <Text style={styles.barcodeText} numberOfLines={1}>{barcodeData.data}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={resetScanner}
                                >
                                    <Text style={styles.resetButtonText}>Scan Again</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.button} onPress={toggleFlash}>
                                    <Ionicons
                                        name={flashMode === Camera.Constants.FlashMode.off ? 'flash-off' : 'flash'}
                                        size={30}
                                        color="white"
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.button} onPress={switchCamera}>
                                    <Ionicons name="camera-reverse" size={30} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Camera>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
    },
    permissionText: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    permissionButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    topOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    middleOverlay: {
        flex: 2,
        flexDirection: 'row',
    },
    bottomOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 30,
    },
    instruction: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    leftAndRightOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: 'white',
    },
    topLeftCorner: {
        top: 0,
        left: 0,
        borderLeftWidth: 3,
        borderTopWidth: 3,
    },
    topRightCorner: {
        top: 0,
        right: 0,
        borderRightWidth: 3,
        borderTopWidth: 3,
    },
    bottomLeftCorner: {
        bottom: 0,
        left: 0,
        borderLeftWidth: 3,
        borderBottomWidth: 3,
    },
    bottomRightCorner: {
        bottom: 0,
        right: 0,
        borderRightWidth: 3,
        borderBottomWidth: 3,
    },
    barcodeDataContainer: {
        width: '90%',
        alignItems: 'center',
    },
    barcodeData: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        marginBottom: 15,
    },
    barcodeType: {
        fontSize: 14,
        color: 'black',
        marginBottom: 5,
    },
    barcodeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    button: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 15,
        borderRadius: 30,
    },
    resetButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
    },
    resetButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ExpoBarcodeScannerScreen;