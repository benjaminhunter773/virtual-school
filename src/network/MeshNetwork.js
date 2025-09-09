/**
 * Mesh Network Module
 * Handles Bluetooth/BLE and Wi-Fi Direct communication
 * Implements device discovery and message forwarding
 */

import BleManager from 'react-native-ble-manager';
import WifiP2P from 'react-native-wifi-p2p';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import uuid from 'react-native-uuid';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

class MeshNetwork {
  constructor() {
    this.isScanning = false;
    this.discoveredDevices = new Map();
    this.connectedDevices = new Map();
    this.messageQueue = new Map();
    this.seenMessages = new Set();
    
    // Service UUID for mesh messenger
    this.SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
    this.CHARACTERISTIC_UUID = '87654321-4321-4321-4321-cba987654321';
    
    this.onDeviceDiscovered = null;
    this.onMessageReceived = null;
    this.onDeviceConnected = null;
    this.onDeviceDisconnected = null;
  }

  /**
   * Initialize the mesh network
   * Set up BLE and Wi-Fi Direct
   */
  async initialize() {
    try {
      // Initialize BLE
      await this.initializeBLE();
      
      // Initialize Wi-Fi Direct (Android only)
      if (Platform.OS === 'android') {
        await this.initializeWiFiDirect();
      }
      
      console.log('Mesh network initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing mesh network:', error);
      return false;
    }
  }

  /**
   * Initialize Bluetooth Low Energy
   */
  async initializeBLE() {
    try {
      await BleManager.start({ showAlert: false });
      
      // Set up event listeners
      this.setupBLEEventListeners();
      
      // Start advertising as a mesh node
      await this.startAdvertising();
      
      console.log('BLE initialized successfully');
    } catch (error) {
      console.error('Error initializing BLE:', error);
      throw error;
    }
  }

  /**
   * Initialize Wi-Fi Direct (Android only)
   */
  async initializeWiFiDirect() {
    try {
      const isEnabled = await WifiP2P.isWifiP2pEnabled();
      if (!isEnabled) {
        console.warn('Wi-Fi Direct is not enabled');
        return;
      }

      // Set up Wi-Fi Direct event listeners
      this.setupWiFiDirectEventListeners();
      
      console.log('Wi-Fi Direct initialized successfully');
    } catch (error) {
      console.error('Error initializing Wi-Fi Direct:', error);
      throw error;
    }
  }

  /**
   * Set up BLE event listeners
   */
  setupBLEEventListeners() {
    // Device discovered
    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral) => {
      this.handleDeviceDiscovered(peripheral, 'BLE');
    });

    // Device connected
    bleManagerEmitter.addListener('BleManagerConnectPeripheral', (peripheral) => {
      this.handleDeviceConnected(peripheral, 'BLE');
    });

    // Device disconnected
    bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', (peripheral) => {
      this.handleDeviceDisconnected(peripheral, 'BLE');
    });

    // Characteristic value updated (message received)
    bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', (data) => {
      this.handleMessageReceived(data, 'BLE');
    });
  }

  /**
   * Set up Wi-Fi Direct event listeners
   */
  setupWiFiDirectEventListeners() {
    // Peers discovered
    WifiP2P.onPeersAvailable((peers) => {
      peers.forEach(peer => {
        this.handleDeviceDiscovered(peer, 'WiFiDirect');
      });
    });

    // Connection info changed
    WifiP2P.onConnectionInfoAvailable((connectionInfo) => {
      if (connectionInfo.groupFormed) {
        console.log('Wi-Fi Direct group formed:', connectionInfo);
      }
    });
  }

  /**
   * Start advertising this device as a mesh node
   */
  async startAdvertising() {
    try {
      // Create service and characteristic for mesh communication
      const serviceData = {
        serviceUUID: this.SERVICE_UUID,
        characteristics: [
          {
            uuid: this.CHARACTERISTIC_UUID,
            properties: ['read', 'write', 'notify'],
            permissions: ['readable', 'writeable'],
          }
        ]
      };

      // Note: Actual BLE advertising setup depends on native implementation
      console.log('Started advertising as mesh node');
    } catch (error) {
      console.error('Error starting advertising:', error);
    }
  }

  /**
   * Start scanning for nearby mesh devices
   */
  async startScanning() {
    if (this.isScanning) {
      return;
    }

    try {
      this.isScanning = true;
      
      // Start BLE scanning
      await BleManager.scan([this.SERVICE_UUID], 30, false);
      
      // Start Wi-Fi Direct discovery (Android only)
      if (Platform.OS === 'android') {
        await WifiP2P.discoverPeers();
      }
      
      console.log('Started scanning for mesh devices');
    } catch (error) {
      console.error('Error starting scan:', error);
      this.isScanning = false;
    }
  }

  /**
   * Stop scanning for devices
   */
  async stopScanning() {
    try {
      this.isScanning = false;
      await BleManager.stopScan();
      
      if (Platform.OS === 'android') {
        await WifiP2P.stopPeerDiscovery();
      }
      
      console.log('Stopped scanning for mesh devices');
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  }

  /**
   * Handle device discovery
   */
  handleDeviceDiscovered(device, protocol) {
    const deviceId = device.id || device.deviceAddress;
    const deviceInfo = {
      id: deviceId,
      name: device.name || device.deviceName || 'Unknown',
      protocol: protocol,
      rssi: device.rssi || 0,
      lastSeen: Date.now(),
      device: device
    };

    this.discoveredDevices.set(deviceId, deviceInfo);
    
    if (this.onDeviceDiscovered) {
      this.onDeviceDiscovered(deviceInfo);
    }

    console.log(`Discovered ${protocol} device:`, deviceInfo.name);
  }

  /**
   * Handle device connection
   */
  handleDeviceConnected(device, protocol) {
    const deviceId = device.id || device.deviceAddress;
    this.connectedDevices.set(deviceId, { device, protocol, connectedAt: Date.now() });
    
    if (this.onDeviceConnected) {
      this.onDeviceConnected({ id: deviceId, protocol });
    }

    console.log(`Connected to ${protocol} device:`, deviceId);
  }

  /**
   * Handle device disconnection
   */
  handleDeviceDisconnected(device, protocol) {
    const deviceId = device.id || device.deviceAddress;
    this.connectedDevices.delete(deviceId);
    
    if (this.onDeviceDisconnected) {
      this.onDeviceDisconnected({ id: deviceId, protocol });
    }

    console.log(`Disconnected from ${protocol} device:`, deviceId);
  }

  /**
   * Connect to a discovered device
   */
  async connectToDevice(deviceId) {
    try {
      const deviceInfo = this.discoveredDevices.get(deviceId);
      if (!deviceInfo) {
        throw new Error('Device not found');
      }

      if (deviceInfo.protocol === 'BLE') {
        await BleManager.connect(deviceId);
        await BleManager.retrieveServices(deviceId);
      } else if (deviceInfo.protocol === 'WiFiDirect') {
        await WifiP2P.connect(deviceInfo.device);
      }

      console.log(`Connected to device: ${deviceId}`);
      return true;
    } catch (error) {
      console.error(`Error connecting to device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Send message to specific device
   */
  async sendMessageToDevice(deviceId, message) {
    try {
      const connection = this.connectedDevices.get(deviceId);
      if (!connection) {
        throw new Error('Device not connected');
      }

      const messageData = JSON.stringify(message);
      
      if (connection.protocol === 'BLE') {
        const data = Buffer.from(messageData, 'utf8').toJSON().data;
        await BleManager.write(
          deviceId,
          this.SERVICE_UUID,
          this.CHARACTERISTIC_UUID,
          data
        );
      } else if (connection.protocol === 'WiFiDirect') {
        // Wi-Fi Direct message sending would be implemented here
        // This requires socket communication over Wi-Fi Direct
        console.log('Wi-Fi Direct message sending not yet implemented');
      }

      console.log(`Message sent to device ${deviceId}`);
      return true;
    } catch (error) {
      console.error(`Error sending message to device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast message to all connected devices
   */
  async broadcastMessage(message) {
    const results = [];
    
    for (const [deviceId] of this.connectedDevices) {
      try {
        const success = await this.sendMessageToDevice(deviceId, message);
        results.push({ deviceId, success });
      } catch (error) {
        console.error(`Error broadcasting to device ${deviceId}:`, error);
        results.push({ deviceId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Handle received message
   */
  handleMessageReceived(data, protocol) {
    try {
      const messageData = Buffer.from(data.value).toString('utf8');
      const message = JSON.parse(messageData);

      // Check if we've seen this message before (prevent loops)
      if (this.seenMessages.has(message.id)) {
        console.log('Duplicate message received, ignoring');
        return;
      }

      this.seenMessages.add(message.id);
      
      if (this.onMessageReceived) {
        this.onMessageReceived(message, protocol);
      }

      console.log(`Message received via ${protocol}:`, message);
    } catch (error) {
      console.error('Error handling received message:', error);
    }
  }

  /**
   * Get list of discovered devices
   */
  getDiscoveredDevices() {
    return Array.from(this.discoveredDevices.values());
  }

  /**
   * Get list of connected devices
   */
  getConnectedDevices() {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Clean up old discovered devices
   */
  cleanupOldDevices(maxAge = 300000) { // 5 minutes
    const now = Date.now();
    for (const [deviceId, deviceInfo] of this.discoveredDevices) {
      if (now - deviceInfo.lastSeen > maxAge) {
        this.discoveredDevices.delete(deviceId);
      }
    }
  }

  /**
   * Disconnect from all devices and cleanup
   */
  async cleanup() {
    try {
      await this.stopScanning();
      
      // Disconnect from all BLE devices
      for (const [deviceId, connection] of this.connectedDevices) {
        if (connection.protocol === 'BLE') {
          await BleManager.disconnect(deviceId);
        }
      }

      this.connectedDevices.clear();
      this.discoveredDevices.clear();
      this.seenMessages.clear();
      
      console.log('Mesh network cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export default MeshNetwork;