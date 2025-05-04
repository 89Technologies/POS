import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BluetoothSerial from 'react-native-bluetooth-serial'; // For Bluetooth
import ThermalPrinterModule from 'react-native-thermal-printer'; // For WiFi

const PrinterSettingsModal = ({ visible, onClose, currentSettings, onSave }) => {
    const [printerType, setPrinterType] = useState(currentSettings.type);
    const [paperSize, setPaperSize] = useState(currentSettings.paperSize);
    const [ipAddress, setIpAddress] = useState(currentSettings.ipAddress || '');
    const [port, setPort] = useState(currentSettings.port || '9100');
    const [bluetoothDevices, setBluetoothDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(currentSettings.deviceId || null);
    const [isScanning, setIsScanning] = useState(false);


    useEffect(() => {
        const checkBluetooth = async () => {
            if (printerType === 'Bluetooth') {
                try {
                    const enabled = await BluetoothSerial.isEnabled();
                    if (!enabled) {
                        await BluetoothSerial.requestEnable();
                    }
                    setIsBluetoothEnabled(true);
                } catch (error) {
                    console.error('Bluetooth error:', error);
                    Alert.alert('Error', 'Bluetooth is required for printer connection');
                }
            }
        };

        checkBluetooth();
    }, [printerType]);
    // Scan for Bluetooth devices

    const scanBluetoothDevices = async () => {
        try {
            setIsScanning(true);
            const enabled = await BluetoothSerial.isEnabled();
            if (!enabled) {
                await BluetoothSerial.requestEnable();
            }
            const devices = await BluetoothSerial.list();
            setBluetoothDevices(devices);
        } catch (error) {
            console.error('Scan error:', error);
            Alert.alert('Error', 'Failed to scan for Bluetooth devices');
        } finally {
            setIsScanning(false);
        }
    };

    // Test printer connection
    const testPrinter = async () => {
        try {
            if (printerType === 'Bluetooth' && !selectedDevice) {
                Alert.alert('Error', 'Please select a Bluetooth device');
                return;
            }

            if (printerType === 'WiFi' && (!ipAddress || !port)) {
                Alert.alert('Error', 'Please enter IP address and port');
                return;
            }

            // Test connection based on printer type
            if (printerType === 'Bluetooth') {
                await BluetoothSerial.connect(selectedDevice);
                await BluetoothSerial.write('Printer test successful!\n');
                Alert.alert('Success', 'Bluetooth printer test successful');
            } else {
                await ThermalPrinterModule.printSample(ipAddress, parseInt(port));
                Alert.alert('Success', 'WiFi printer test successful');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to printer');
        }
    };

    // Save settings
    const handleSave = () => {
        const settings = {
            type: printerType,
            paperSize,
            ...(printerType === 'WiFi' && { ipAddress, port }),
            ...(printerType === 'Bluetooth' && { deviceId: selectedDevice }),
        };
        onSave(settings);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Printer Settings</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Printer Type</Text>
                        <View style={styles.radioGroup}>
                            <TouchableOpacity
                                style={styles.radioButton}
                                onPress={() => setPrinterType('Bluetooth')}
                            >
                                <Ionicons
                                    name={printerType === 'Bluetooth' ? 'radio-button-on' : 'radio-button-off'}
                                    size={20}
                                    color="#007AFF"
                                />
                                <Text style={styles.radioLabel}>Bluetooth</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.radioButton}
                                onPress={() => setPrinterType('WiFi')}
                            >
                                <Ionicons
                                    name={printerType === 'WiFi' ? 'radio-button-on' : 'radio-button-off'}
                                    size={20}
                                    color="#007AFF"
                                />
                                <Text style={styles.radioLabel}>WiFi</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Paper Size</Text>
                        <View style={styles.radioGroup}>
                            <TouchableOpacity
                                style={styles.radioButton}
                                onPress={() => setPaperSize('80mm')}
                            >
                                <Ionicons
                                    name={paperSize === '80mm' ? 'radio-button-on' : 'radio-button-off'}
                                    size={20}
                                    color="#007AFF"
                                />
                                <Text style={styles.radioLabel}>80mm</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.radioButton}
                                onPress={() => setPaperSize('58mm')}
                            >
                                <Ionicons
                                    name={paperSize === '58mm' ? 'radio-button-on' : 'radio-button-off'}
                                    size={20}
                                    color="#007AFF"
                                />
                                <Text style={styles.radioLabel}>58mm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {printerType === 'WiFi' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Network Settings</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Printer IP Address"
                                value={ipAddress}
                                onChangeText={setIpAddress}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Port (default: 9100)"
                                value={port}
                                onChangeText={setPort}
                                keyboardType="numeric"
                            />
                        </View>
                    )}

                    {printerType === 'Bluetooth' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Bluetooth Devices</Text>
                            <TouchableOpacity
                                style={styles.scanButton}
                                onPress={scanBluetoothDevices}
                                disabled={isScanning}
                            >
                                <Text style={styles.scanButtonText}>
                                    {isScanning ? 'Scanning...' : 'Scan for Devices'}
                                </Text>
                            </TouchableOpacity>

                            <FlatList
                                data={bluetoothDevices}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.deviceItem,
                                            selectedDevice === item.id && styles.selectedDevice
                                        ]}
                                        onPress={() => setSelectedDevice(item.id)}
                                    >
                                        <Text>{item.name}</Text>
                                        {selectedDevice === item.id && (
                                            <Ionicons name="checkmark" size={20} color="#007AFF" />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    <TouchableOpacity style={styles.testButton} onPress={testPrinter}>
                        <Text style={styles.testButtonText}>Test Printer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Settings</Text>
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
        maxHeight: '80%',
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
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    radioGroup: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    radioLabel: {
        marginLeft: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    scanButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    scanButtonText: {
        color: 'white',
    },
    deviceItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    selectedDevice: {
        backgroundColor: '#f0f7ff',
    },
    testButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    testButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default PrinterSettingsModal;