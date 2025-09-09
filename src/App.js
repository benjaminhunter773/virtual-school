/**
 * Mesh Messenger - Main App Component
 * Cross-platform encrypted mesh messaging app
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import NavigationContainer from './navigation/NavigationContainer';
import MeshNetwork from './network/MeshNetwork';
import SignalProtocol from './crypto/SignalProtocol';
import MessageRouter from './messaging/MessageRouter';
import { MeshContext } from './context/MeshContext';

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [meshNetwork, setMeshNetwork] = useState(null);
  const [signalProtocol, setSignalProtocol] = useState(null);
  const [messageRouter, setMessageRouter] = useState(null);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Initialize the mesh messenger app
   */
  const initializeApp = async () => {
    try {
      console.log('Initializing Mesh Messenger...');
      
      // Request necessary permissions
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        throw new Error('Required permissions not granted');
      }

      // Initialize Signal Protocol for encryption
      console.log('Initializing encryption...');
      const signal = new SignalProtocol();
      await signal.initialize();
      setSignalProtocol(signal);

      // Initialize Mesh Network
      console.log('Initializing mesh network...');
      const mesh = new MeshNetwork();
      await mesh.initialize();
      setMeshNetwork(mesh);

      // Initialize Message Router
      console.log('Initializing message router...');
      const router = new MessageRouter(mesh, signal);
      setMessageRouter(router);

      // Start scanning for devices
      await mesh.startScanning();

      setIsInitialized(true);
      console.log('Mesh Messenger initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      setInitError(error.message);
      Alert.alert(
        'Initialization Error',
        `Failed to initialize the app: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Request necessary permissions for BLE and Wi-Fi
   */
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.warn('Some permissions were not granted');
        }

        return allGranted;
      } catch (error) {
        console.error('Error requesting permissions:', error);
        return false;
      }
    }
    
    // iOS permissions are handled differently
    return true;
  };

  /**
   * Cleanup on app exit
   */
  const cleanup = async () => {
    try {
      if (meshNetwork) {
        await meshNetwork.cleanup();
      }
      console.log('App cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [meshNetwork]);

  if (initError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Initialization Failed</Text>
          <Text style={styles.errorMessage}>{initError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingTitle}>Mesh Messenger</Text>
          <Text style={styles.loadingMessage}>Initializing secure mesh network...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <MeshContext.Provider
      value={{
        meshNetwork,
        signalProtocol,
        messageRouter,
        isInitialized,
      }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer />
      </SafeAreaView>
    </MeshContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  loadingMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default App;