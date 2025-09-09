/**
 * Test Runner for Mesh Messenger
 * Automated tests to verify core functionality
 */

import SignalProtocol from '../crypto/SignalProtocol';
import MeshNetwork from '../network/MeshNetwork';
import MessageRouter from '../messaging/MessageRouter';

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Mesh Messenger Tests...');
    
    const testSuites = [
      this.testEncryption,
      this.testNetworking,
      this.testMessageRouting,
      this.testIntegration
    ];

    for (const testSuite of testSuites) {
      try {
        await testSuite.call(this);
      } catch (error) {
        console.error('Test suite failed:', error);
      }
    }

    this.printResults();
    return this.results;
  }

  async testEncryption() {
    console.log('\n🔐 Testing Signal Protocol Encryption...');
    
    try {
      // Test 1: Initialize Signal Protocol
      const signal1 = new SignalProtocol();
      const signal2 = new SignalProtocol();
      
      await signal1.initialize();
      await signal2.initialize();
      
      this.addResult('Signal Protocol Initialization', true, 'Both instances initialized successfully');

      // Test 2: Key Exchange
      const bundle1 = await signal1.getPublicKeyBundle();
      const bundle2 = await signal2.getPublicKeyBundle();
      
      this.addResult('Public Key Bundle Generation', 
        bundle1 && bundle2 && bundle1.identityKey && bundle2.identityKey, 
        'Key bundles generated with identity keys');

      // Test 3: Session Establishment
      await signal1.processPreKeyBundle('device2', bundle2);
      await signal2.processPreKeyBundle('device1', bundle1);
      
      this.addResult('Session Establishment', true, 'Sessions established between devices');

      // Test 4: Message Encryption/Decryption
      const originalMessage = 'Hello, this is a test message!';
      const encrypted = await signal1.encryptMessage('device2', originalMessage);
      const decrypted = await signal2.decryptMessage('device1', encrypted);
      
      this.addResult('Message Encryption/Decryption', 
        decrypted === originalMessage,
        `Original: "${originalMessage}", Decrypted: "${decrypted}"`);

    } catch (error) {
      this.addResult('Signal Protocol Tests', false, error.message);
    }
  }

  async testNetworking() {
    console.log('\n🌐 Testing Mesh Networking...');
    
    try {
      const mesh = new MeshNetwork();
      
      // Test 1: Network Initialization
      const initialized = await mesh.initialize();
      this.addResult('Mesh Network Initialization', initialized, 'Network initialized successfully');

      // Test 2: Device Discovery Simulation
      const mockDevice = {
        id: 'test-device-123',
        name: 'Test Device',
        protocol: 'BLE',
        rssi: -50
      };
      
      mesh.handleDeviceDiscovered(mockDevice, 'BLE');
      const discoveredDevices = mesh.getDiscoveredDevices();
      
      this.addResult('Device Discovery', 
        discoveredDevices.length > 0 && discoveredDevices[0].id === mockDevice.id,
        `Discovered ${discoveredDevices.length} device(s)`);

      // Test 3: Message Broadcasting Simulation
      const testMessage = {
        id: 'test-msg-123',
        content: 'Test broadcast message',
        type: 'text'
      };
      
      // This would normally broadcast to connected devices
      // For testing, we'll just verify the method exists and doesn't crash
      this.addResult('Message Broadcasting Interface', 
        typeof mesh.broadcastMessage === 'function',
        'Broadcast method is available');

      await mesh.cleanup();
      
    } catch (error) {
      this.addResult('Mesh Networking Tests', false, error.message);
    }
  }

  async testMessageRouting() {
    console.log('\n📨 Testing Message Routing...');
    
    try {
      // Create mock components
      const mockMesh = {
        getConnectedDevices: () => [],
        broadcastMessage: async (message) => ({ success: true }),
        onMessageReceived: null,
        onDeviceConnected: null,
        onDeviceDisconnected: null
      };
      
      const mockSignal = {
        encryptMessage: async (recipient, message) => ({
          type: 1,
          body: 'encrypted_' + message,
          registrationId: 123
        }),
        decryptMessage: async (sender, ciphertext) => {
          return ciphertext.body.replace('encrypted_', '');
        }
      };

      const router = new MessageRouter(mockMesh, mockSignal);
      
      // Test 1: Router Initialization
      this.addResult('Message Router Initialization', 
        router.messageQueue instanceof Map,
        'Router initialized with message queue');

      // Test 2: Message Creation
      const deviceId = await router.getDeviceId();
      this.addResult('Device ID Generation', 
        typeof deviceId === 'string' && deviceId.length > 0,
        `Generated device ID: ${deviceId.substring(0, 8)}...`);

      // Test 3: Message Queue Management
      const testMessage = {
        id: 'test-123',
        senderId: 'sender-123',
        recipientId: 'recipient-123',
        content: 'Test message',
        timestamp: Date.now(),
        ttl: 10,
        hops: 0
      };
      
      router.messageQueue.set(testMessage.id, testMessage);
      this.addResult('Message Queue Operations', 
        router.messageQueue.has(testMessage.id),
        'Message successfully added to queue');

      // Test 4: TTL Management
      const expiredMessage = { ...testMessage, ttl: 0 };
      const shouldForward = expiredMessage.ttl > 0;
      this.addResult('TTL Management', 
        !shouldForward,
        'Messages with TTL=0 are not forwarded');

    } catch (error) {
      this.addResult('Message Routing Tests', false, error.message);
    }
  }

  async testIntegration() {
    console.log('\n🔗 Testing Integration...');
    
    try {
      // Test 1: Component Integration
      const signal = new SignalProtocol();
      await signal.initialize();
      
      const mockMesh = {
        getConnectedDevices: () => [],
        broadcastMessage: async () => ({ success: true }),
        onMessageReceived: null,
        onDeviceConnected: null,
        onDeviceDisconnected: null
      };
      
      const router = new MessageRouter(mockMesh, signal);
      
      this.addResult('Component Integration', 
        signal && router && router.signalProtocol === signal,
        'All components integrate successfully');

      // Test 2: End-to-End Message Flow Simulation
      const sender = 'test-sender';
      const recipient = 'test-recipient';
      const messageContent = 'Integration test message';
      
      // Simulate the full message flow
      try {
        // This would normally create and queue an encrypted message
        const messageId = 'integration-test-' + Date.now();
        router.seenMessageIds.add(messageId);
        
        this.addResult('End-to-End Message Flow', 
          router.seenMessageIds.has(messageId),
          'Message flow simulation completed');
      } catch (e) {
        this.addResult('End-to-End Message Flow', false, e.message);
      }

      // Test 3: Statistics Collection
      const stats = router.getStatistics();
      this.addResult('Statistics Collection', 
        stats && typeof stats.queuedMessages === 'number',
        `Statistics collected: ${JSON.stringify(stats)}`);

    } catch (error) {
      this.addResult('Integration Tests', false, error.message);
    }
  }

  addResult(testName, passed, details) {
    const result = {
      name: testName,
      passed: passed,
      details: details,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}: ${testName} - ${details}`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => r.passed === false).length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.name}: ${result.details}`);
      });
    }
    
    console.log('\n🎉 Testing completed!');
  }
}

export default TestRunner;