/**
 * Devices Screen - Show nearby devices and connection management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useMesh } from '../context/MeshContext';

const DevicesScreen = ({ navigation }) => {
  const { meshNetwork, messageRouter } = useMesh();
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (meshNetwork) {
      loadDevices();
      
      // Set up device discovery handler
      meshNetwork.onDeviceDiscovered = (device) => {
        loadDevices();
      };
      
      meshNetwork.onDeviceConnected = (device) => {
        loadDevices();
      };
      
      meshNetwork.onDeviceDisconnected = (device) => {
        loadDevices();
      };
      
      setIsScanning(meshNetwork.isScanning);
    }
  }, [meshNetwork]);

  const loadDevices = () => {
    if (!meshNetwork) return;
    
    const discovered = meshNetwork.getDiscoveredDevices();
    const connected = meshNetwork.getConnectedDevices();
    
    setDiscoveredDevices(discovered);
    setConnectedDevices(connected);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    if (meshNetwork) {
      meshNetwork.cleanupOldDevices();
      loadDevices();
    }
    
    setRefreshing(false);
  };

  const toggleScanning = async () => {
    if (!meshNetwork) return;
    
    try {
      if (isScanning) {
        await meshNetwork.stopScanning();
        setIsScanning(false);
      } else {
        await meshNetwork.startScanning();
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error toggling scanning:', error);
      Alert.alert('Error', 'Failed to toggle scanning');
    }
  };

  const connectToDevice = async (deviceId) => {
    if (!meshNetwork) return;
    
    try {
      const success = await meshNetwork.connectToDevice(deviceId);
      if (success) {
        Alert.alert('Success', 'Connected to device');
        loadDevices();
      } else {
        Alert.alert('Error', 'Failed to connect to device');
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
      Alert.alert('Error', 'Failed to connect to device');
    }
  };

  const startChat = (deviceId, deviceName) => {
    navigation.navigate('Chat', {
      deviceId,
      deviceName,
    });
  };

  const getSignalStrengthIcon = (rssi) => {
    if (rssi >= -50) return 'signal-wifi-4-bar';
    if (rssi >= -60) return 'signal-wifi-3-bar';
    if (rssi >= -70) return 'signal-wifi-2-bar';
    return 'signal-wifi-1-bar';
  };

  const getSignalStrengthColor = (rssi) => {
    if (rssi >= -50) return '#4CAF50';
    if (rssi >= -60) return '#8BC34A';
    if (rssi >= -70) return '#FF9800';
    return '#F44336';
  };

  const getProtocolIcon = (protocol) => {
    switch (protocol) {
      case 'BLE': return 'bluetooth';
      case 'WiFiDirect': return 'wifi';
      default: return 'device-hub';
    }
  };

  const renderDiscoveredDevice = ({ item }) => {
    const isConnected = connectedDevices.some(device => device.device.id === item.id);
    const timeSinceLastSeen = Date.now() - item.lastSeen;
    const isRecent = timeSinceLastSeen < 60000; // Within last minute
    
    return (
      <View style={[
        styles.deviceItem,
        { opacity: isRecent ? 1 : 0.7 }
      ]}>
        <View style={styles.deviceInfo}>
          <View style={styles.deviceHeader}>
            <Icon
              name={getProtocolIcon(item.protocol)}
              size={24}
              color="#2196F3"
            />
            <Text style={styles.deviceName}>{item.name}</Text>
            <Icon
              name={getSignalStrengthIcon(item.rssi)}
              size={20}
              color={getSignalStrengthColor(item.rssi)}
            />
          </View>
          
          <View style={styles.deviceDetails}>
            <Text style={styles.deviceId}>ID: {item.id.substring(0, 8)}...</Text>
            <Text style={styles.deviceProtocol}>{item.protocol}</Text>
            <Text style={styles.deviceRssi}>RSSI: {item.rssi} dBm</Text>
          </View>
          
          <Text style={styles.lastSeen}>
            Last seen: {Math.floor(timeSinceLastSeen / 1000)}s ago
          </Text>
        </View>
        
        <View style={styles.deviceActions}>
          {isConnected ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => startChat(item.id, item.name)}
            >
              <Icon name="chat" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.connectButton]}
              onPress={() => connectToDevice(item.id)}
            >
              <Icon name="link" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        {isConnected && (
          <View style={styles.connectedIndicator}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
          </View>
        )}
      </View>
    );
  };

  const renderConnectedDevice = ({ item }) => {
    const connectionTime = Date.now() - item.connectedAt;
    
    return (
      <View style={styles.connectedDeviceItem}>
        <View style={styles.deviceInfo}>
          <View style={styles.deviceHeader}>
            <Icon
              name={getProtocolIcon(item.protocol)}
              size={24}
              color="#4CAF50"
            />
            <Text style={styles.deviceName}>
              {item.device.name || 'Unknown Device'}
            </Text>
            <Icon name="check-circle" size={20} color="#4CAF50" />
          </View>
          
          <View style={styles.deviceDetails}>
            <Text style={styles.deviceId}>
              ID: {item.device.id.substring(0, 8)}...
            </Text>
            <Text style={styles.deviceProtocol}>{item.protocol}</Text>
            <Text style={styles.connectionTime}>
              Connected: {Math.floor(connectionTime / 1000)}s ago
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.chatButton]}
          onPress={() => startChat(item.device.id, item.device.name)}
        >
          <Icon name="chat" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Scanning Control */}
      <View style={styles.scanningControl}>
        <View style={styles.scanningInfo}>
          <Icon
            name={isScanning ? 'search' : 'search-off'}
            size={24}
            color={isScanning ? '#4CAF50' : '#9E9E9E'}
          />
          <Text style={styles.scanningText}>
            {isScanning ? 'Scanning for devices...' : 'Scanning stopped'}
          </Text>
        </View>
        <Switch
          value={isScanning}
          onValueChange={toggleScanning}
          trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
          thumbColor={isScanning ? '#fff' : '#f4f3f4'}
        />
      </View>

      {/* Connected Devices Section */}
      {connectedDevices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Connected Devices ({connectedDevices.length})
          </Text>
          <FlatList
            data={connectedDevices}
            renderItem={renderConnectedDevice}
            keyExtractor={(item) => item.device.id}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Discovered Devices Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Nearby Devices ({discoveredDevices.length})
        </Text>
        <FlatList
          data={discoveredDevices}
          renderItem={renderDiscoveredDevice}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {isScanning ? 'Searching for devices...' : 'No devices found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {isScanning
                  ? 'Make sure other devices have the app open'
                  : 'Turn on scanning to discover nearby devices'
                }
              </Text>
            </View>
          }
        />
      </View>

      {/* Network Info */}
      <View style={styles.networkInfo}>
        <Text style={styles.networkInfoText}>
          Mesh network uses Bluetooth and Wi-Fi Direct for peer-to-peer communication
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scanningControl: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scanningInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanningText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
  },
  deviceItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    position: 'relative',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  connectedDeviceItem: {
    backgroundColor: '#e8f5e8',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  deviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
  },
  deviceProtocol: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  deviceRssi: {
    fontSize: 12,
    color: '#666',
  },
  lastSeen: {
    fontSize: 11,
    color: '#999',
  },
  connectionTime: {
    fontSize: 12,
    color: '#666',
  },
  deviceActions: {
    marginLeft: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#2196F3',
  },
  chatButton: {
    backgroundColor: '#4CAF50',
  },
  connectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  networkInfo: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  networkInfoText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});

export default DevicesScreen;