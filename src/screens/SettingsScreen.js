/**
 * Settings Screen - App configuration and network settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useMesh } from '../context/MeshContext';
import TestRunner from '../testing/TestRunner';

const SettingsScreen = () => {
  const { meshNetwork, messageRouter } = useMesh();
  const [deviceName, setDeviceName] = useState('');
  const [isSuperRelay, setIsSuperRelay] = useState(false);
  const [autoForwarding, setAutoForwarding] = useState(true);
  const [maxTTL, setMaxTTL] = useState('24');
  const [forwardingProbability, setForwardingProbability] = useState('0.8');
  const [deviceId, setDeviceId] = useState('');
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadSettings();
    loadStats();
  }, [messageRouter]);

  const loadSettings = async () => {
    try {
      const savedDeviceName = await AsyncStorage.getItem('deviceName');
      const savedAutoForwarding = await AsyncStorage.getItem('autoForwarding');
      const savedMaxTTL = await AsyncStorage.getItem('maxTTL');
      const savedForwardingProb = await AsyncStorage.getItem('forwardingProbability');
      const savedDeviceId = await AsyncStorage.getItem('deviceId');

      setDeviceName(savedDeviceName || 'My Device');
      setAutoForwarding(savedAutoForwarding !== 'false');
      setMaxTTL(savedMaxTTL || '24');
      setForwardingProbability(savedForwardingProb || '0.8');
      setDeviceId(savedDeviceId || '');

      if (messageRouter) {
        setIsSuperRelay(messageRouter.isSuperRelay);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadStats = () => {
    if (messageRouter) {
      const statistics = messageRouter.getStatistics();
      setStats(statistics);
    }
  };

  const saveDeviceName = async (name) => {
    try {
      await AsyncStorage.setItem('deviceName', name);
      setDeviceName(name);
    } catch (error) {
      console.error('Error saving device name:', error);
    }
  };

  const saveAutoForwarding = async (enabled) => {
    try {
      await AsyncStorage.setItem('autoForwarding', enabled.toString());
      setAutoForwarding(enabled);
    } catch (error) {
      console.error('Error saving auto forwarding setting:', error);
    }
  };

  const saveMaxTTL = async (ttl) => {
    try {
      const numTTL = parseInt(ttl, 10);
      if (numTTL > 0 && numTTL <= 100) {
        await AsyncStorage.setItem('maxTTL', ttl);
        setMaxTTL(ttl);
        if (messageRouter) {
          messageRouter.maxTTL = numTTL;
        }
      } else {
        Alert.alert('Invalid TTL', 'TTL must be between 1 and 100');
      }
    } catch (error) {
      console.error('Error saving max TTL:', error);
    }
  };

  const saveForwardingProbability = async (prob) => {
    try {
      const numProb = parseFloat(prob);
      if (numProb >= 0 && numProb <= 1) {
        await AsyncStorage.setItem('forwardingProbability', prob);
        setForwardingProbability(prob);
        if (messageRouter) {
          messageRouter.forwardingProbability = numProb;
        }
      } else {
        Alert.alert('Invalid Probability', 'Probability must be between 0 and 1');
      }
    } catch (error) {
      console.error('Error saving forwarding probability:', error);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all messages, keys, and reset the app. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data cleared. Please restart the app.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const exportKeys = () => {
    Alert.alert(
      'Export Keys',
      'This feature would export your encryption keys for backup. This is a security-sensitive operation.',
      [{ text: 'OK' }]
    );
  };

  const runTests = async () => {
    Alert.alert(
      'Running Tests',
      'This will run automated tests to verify app functionality. Check the console for results.',
      [{ text: 'OK' }]
    );

    try {
      const testRunner = new TestRunner();
      const results = await testRunner.runAllTests();
      
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      
      Alert.alert(
        'Test Results',
        `Tests completed: ${passed}/${total} passed`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Error', error.message);
    }
  };

  const simulateMessage = async () => {
    if (!messageRouter) {
      Alert.alert('Error', 'Message router not initialized');
      return;
    }

    try {
      // Create a test message to ourselves
      const testRecipient = deviceId || 'test-recipient';
      const message = await messageRouter.sendMessage(
        testRecipient, 
        'This is a test message sent at ' + new Date().toLocaleTimeString()
      );
      
      Alert.alert(
        'Test Message Sent',
        `Message ID: ${message.id.substring(0, 8)}...\nRecipient: ${testRecipient.substring(0, 8)}...`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send test message: ' + error.message);
    }
  };

  const renderSettingItem = (title, subtitle, content) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingContent}>{content}</View>
    </View>
  );

  const renderStatsItem = (label, value, icon, color) => (
    <View style={styles.statsItem}>
      <Icon name={icon} size={24} color={color} />
      <View style={styles.statsContent}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsLabel}>{label}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Device Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Settings</Text>
        
        {renderSettingItem(
          'Device Name',
          'Name shown to other devices',
          <TextInput
            style={styles.textInput}
            value={deviceName}
            onChangeText={setDeviceName}
            onBlur={() => saveDeviceName(deviceName)}
            placeholder="Enter device name"
          />
        )}

        {renderSettingItem(
          'Device ID',
          'Your unique device identifier',
          <Text style={styles.deviceIdText}>{deviceId}</Text>
        )}

        {renderSettingItem(
          'Super Relay Mode',
          isSuperRelay ? 'Active - forwarding more messages' : 'Inactive',
          <View style={styles.superRelayStatus}>
            <Icon
              name={isSuperRelay ? 'router' : 'device-hub'}
              size={24}
              color={isSuperRelay ? '#4CAF50' : '#9E9E9E'}
            />
            <Text style={[
              styles.superRelayText,
              { color: isSuperRelay ? '#4CAF50' : '#9E9E9E' }
            ]}>
              {isSuperRelay ? 'Active' : 'Inactive'}
            </Text>
          </View>
        )}
      </View>

      {/* Network Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Settings</Text>
        
        {renderSettingItem(
          'Auto Forwarding',
          'Automatically forward messages through mesh',
          <Switch
            value={autoForwarding}
            onValueChange={saveAutoForwarding}
            trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
            thumbColor={autoForwarding ? '#fff' : '#f4f3f4'}
          />
        )}

        {renderSettingItem(
          'Max TTL (Hops)',
          'Maximum number of hops for messages',
          <TextInput
            style={styles.numberInput}
            value={maxTTL}
            onChangeText={setMaxTTL}
            onBlur={() => saveMaxTTL(maxTTL)}
            keyboardType="numeric"
            placeholder="24"
          />
        )}

        {renderSettingItem(
          'Forwarding Probability',
          'Probability of forwarding messages (0.0 - 1.0)',
          <TextInput
            style={styles.numberInput}
            value={forwardingProbability}
            onChangeText={setForwardingProbability}
            onBlur={() => saveForwardingProbability(forwardingProbability)}
            keyboardType="numeric"
            placeholder="0.8"
          />
        )}
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Statistics</Text>
        <View style={styles.statsContainer}>
          {renderStatsItem(
            'Connected Devices',
            stats.connectedDevices || 0,
            'device-hub',
            '#4CAF50'
          )}
          {renderStatsItem(
            'Queued Messages',
            stats.queuedMessages || 0,
            'schedule',
            '#FF9800'
          )}
          {renderStatsItem(
            'Messages Sent',
            stats.sentMessages || 0,
            'send',
            '#2196F3'
          )}
          {renderStatsItem(
            'Messages Received',
            stats.receivedMessages || 0,
            'inbox',
            '#9C27B0'
          )}
        </View>
      </View>

      {/* Security */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        <TouchableOpacity style={styles.button} onPress={exportKeys}>
          <Icon name="vpn-key" size={24} color="#2196F3" />
          <Text style={styles.buttonText}>Export Encryption Keys</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.encryptionInfo}>
          <Icon name="lock" size={20} color="#4CAF50" />
          <Text style={styles.encryptionText}>
            All messages use end-to-end encryption with the Signal protocol
          </Text>
        </View>
      </View>

      {/* Testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Testing & Debug</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={runTests}
        >
          <Icon name="bug-report" size={24} color="#2196F3" />
          <Text style={styles.buttonText}>Run Component Tests</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={simulateMessage}
        >
          <Icon name="send" size={24} color="#4CAF50" />
          <Text style={styles.buttonText}>Send Test Message</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearAllData}
        >
          <Icon name="delete-forever" size={24} color="#F44336" />
          <Text style={[styles.buttonText, styles.dangerText]}>
            Clear All Data
          </Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Mesh Messenger v1.0.0{'\n'}
          Secure peer-to-peer messaging using Bluetooth and Wi-Fi Direct{'\n'}
          Messages are end-to-end encrypted and routed through the mesh network
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  settingContent: {
    marginLeft: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 120,
    fontSize: 14,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 60,
    fontSize: 14,
    textAlign: 'center',
  },
  deviceIdText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  superRelayStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  superRelayText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingVertical: 8,
  },
  statsContent: {
    marginLeft: 12,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  dangerButton: {
    backgroundColor: '#fef7f7',
  },
  dangerText: {
    color: '#F44336',
  },
  encryptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#e8f5e8',
  },
  encryptionText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 8,
    flex: 1,
  },
  aboutText: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
});

export default SettingsScreen;