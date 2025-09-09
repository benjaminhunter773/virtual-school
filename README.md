# Mesh Messenger - Cross-Platform Encrypted Mesh Network App

A secure, serverless messaging app that uses short-range signals (Bluetooth/BLE, Wi-Fi Direct) to create a store-and-forward mesh network for global message delivery without relying on central servers.

## 🔐 Key Features

- **End-to-End Encryption**: Uses Signal protocol (X3DH + Double Ratchet) for message security
- **Mesh Networking**: Store-and-forward routing with epidemic flooding
- **Cross-Platform**: React Native app supporting iOS and Android
- **Offline Operation**: Works without internet or cellular connectivity
- **Super Relay Nodes**: High-traffic devices accelerate message delivery
- **TTL Management**: Time-to-live prevents infinite message loops

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Device A      │    │   Device B      │    │   Device C      │
│                 │    │  (Super Relay)  │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ React Native│ │    │ │ React Native│ │    │ │ React Native│ │
│ │     UI      │ │    │ │     UI      │ │    │ │     UI      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Message Router│ │◄──►│ │Message Router│ │◄──►│ │Message Router│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Signal Crypto│ │    │ │Signal Crypto│ │    │ │Signal Crypto│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Mesh Network │ │    │ │Mesh Network │ │    │ │Mesh Network │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        └──BLE/WiFi Direct───────┼────────BLE/WiFi Direct─┘
                                 │
                    ┌─────────────────┐
                    │   Device D      │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │ React Native│ │
                    │ │     UI      │ │
                    │ └─────────────┘ │
                    │ ┌─────────────┐ │
                    │ │Message Router│ │
                    │ └─────────────┘ │
                    │ ┌─────────────┐ │
                    │ │Signal Crypto│ │
                    │ └─────────────┘ │
                    │ ┌─────────────┐ │
                    │ │Mesh Network │ │
                    │ └─────────────┘ │
                    └─────────────────┘
```

## 📱 Installation & Setup

### Prerequisites

- Node.js 18+
- React Native development environment
- Android Studio (for Android)
- Xcode (for iOS)

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install iOS dependencies (iOS only)
cd ios && pod install && cd ..
```

### 2. Platform-Specific Setup

#### Android Setup

1. Add permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
```

2. Enable location services for BLE scanning
3. Target SDK 31+ for latest Bluetooth permissions

#### iOS Setup

1. Add permissions to `ios/MeshMessenger/Info.plist`:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app uses Bluetooth to communicate with nearby devices in the mesh network</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app uses Bluetooth to advertise as a mesh network node</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location access is required for Bluetooth Low Energy scanning</string>
```

### 3. Run the App

```bash
# Android
npm run android

# iOS
npm run ios
```

## 🔧 Core Components

### 1. SignalProtocol (`src/crypto/SignalProtocol.js`)

Implements end-to-end encryption using the Signal protocol:

- **X3DH Key Agreement**: Establishes shared secrets between devices
- **Double Ratchet**: Provides forward secrecy and break-in recovery
- **Key Management**: Secure storage and rotation of encryption keys

```javascript
// Initialize encryption
const signal = new SignalProtocol();
await signal.initialize();

// Encrypt message
const encrypted = await signal.encryptMessage(recipientId, message);

// Decrypt message
const decrypted = await signal.decryptMessage(senderId, encrypted);
```

### 2. MeshNetwork (`src/network/MeshNetwork.js`)

Handles device discovery and communication:

- **BLE Management**: Scanning, advertising, and connections
- **Wi-Fi Direct**: Peer-to-peer connections (Android)
- **Device Discovery**: Automatic detection of mesh nodes
- **Connection Management**: Maintains active connections

```javascript
// Initialize network
const mesh = new MeshNetwork();
await mesh.initialize();

// Start scanning
await mesh.startScanning();

// Send message to device
await mesh.sendMessageToDevice(deviceId, message);
```

### 3. MessageRouter (`src/messaging/MessageRouter.js`)

Implements store-and-forward mesh routing:

- **Epidemic Routing**: Floods messages through the network
- **TTL Management**: Prevents infinite loops
- **Message Queue**: Stores messages for forwarding
- **Super Relay Logic**: Prioritizes high-traffic nodes

```javascript
// Initialize router
const router = new MessageRouter(meshNetwork, signalProtocol);

// Send message
const message = await router.sendMessage(recipientId, content);

// Get conversation
const messages = router.getConversation(deviceId);
```

## 🧪 Testing Scenarios

### Local Testing (2-3 devices)

1. **Basic Connectivity**:
   - Install app on 2-3 devices
   - Enable Bluetooth and location
   - Verify devices discover each other
   - Test direct message exchange

2. **Encryption Verification**:
   - Send messages between devices
   - Verify messages show encryption badge
   - Check that intermediate devices cannot read content

3. **Store-and-Forward**:
   - Set up 3 devices in a line (A-B-C)
   - Ensure A and C cannot connect directly
   - Send message from A to C through B
   - Verify message delivery

### Network Testing (5-10 devices)

1. **Mesh Formation**:
   - Deploy devices in overlapping coverage areas
   - Verify mesh network forms automatically
   - Test message propagation across multiple hops

2. **Super Relay Testing**:
   - Identify devices with high connectivity
   - Verify super relay status activation
   - Test improved message delivery performance

3. **Reliability Testing**:
   - Test message delivery with devices moving
   - Verify reconnection after disconnection
   - Test message persistence during network partitions

### Large-Scale Testing (10+ devices)

1. **Urban Deployment**:
   - Deploy in high-density areas (cafes, universities)
   - Test message propagation across buildings
   - Monitor battery usage and performance

2. **Range Testing**:
   - Test maximum effective range
   - Verify multi-hop message delivery
   - Test in various environments (indoor/outdoor)

3. **Load Testing**:
   - Send multiple messages simultaneously
   - Test with high message volumes
   - Monitor queue management and TTL expiration

## ⚡ Optimization Guidelines

### Battery Optimization

1. **Scanning Intervals**:
   ```javascript
   // Implement adaptive scanning
   const scanInterval = connectedDevices > 0 ? 60000 : 30000;
   setInterval(startScanning, scanInterval);
   ```

2. **Connection Management**:
   - Limit simultaneous connections (5-10 max)
   - Implement connection priority based on signal strength
   - Use connection pooling for frequently contacted devices

3. **Message Queuing**:
   ```javascript
   // Limit queue size and implement LRU eviction
   if (messageQueue.size > MAX_QUEUE_SIZE) {
     const oldestMessage = getOldestMessage();
     messageQueue.delete(oldestMessage.id);
   }
   ```

### Network Optimization

1. **Adaptive TTL**:
   ```javascript
   // Adjust TTL based on network density
   const adaptiveTTL = Math.min(MAX_TTL, connectedDevices * 2);
   ```

2. **Smart Forwarding**:
   ```javascript
   // Reduce forwarding probability in dense networks
   const forwardingProb = Math.max(0.3, 1.0 / Math.sqrt(connectedDevices));
   ```

3. **Message Prioritization**:
   - Prioritize delivery confirmations
   - Implement message importance levels
   - Use exponential backoff for retransmission

### Performance Optimization

1. **Database Optimization**:
   - Index messages by timestamp and recipient
   - Implement periodic cleanup of old messages
   - Use batch operations for multiple updates

2. **Memory Management**:
   - Limit in-memory message cache
   - Implement lazy loading for conversation history
   - Use weak references for temporary objects

## 🔒 Security Considerations

### Encryption Best Practices

1. **Key Management**:
   - Store keys in secure hardware (Android Keystore, iOS Keychain)
   - Implement key rotation policies
   - Use separate keys for different conversations

2. **Forward Secrecy**:
   - Delete old message keys after use
   - Implement regular key ratcheting
   - Prevent key recovery from compromised devices

3. **Metadata Protection**:
   - Minimize routing metadata exposure
   - Use padding to prevent traffic analysis
   - Implement dummy traffic for anonymity

### Network Security

1. **Authentication**:
   - Verify device identity before key exchange
   - Implement device reputation system
   - Use challenge-response for initial handshake

2. **Anti-Spam Measures**:
   - Rate limiting for message forwarding
   - Proof-of-work for message submission
   - Reputation-based message filtering

3. **Privacy Protection**:
   - Avoid logging sensitive information
   - Implement secure deletion of old data
   - Use random device identifiers

## 📊 Monitoring & Analytics

### Network Health Metrics

```javascript
const metrics = {
  connectedDevices: mesh.getConnectedDevices().length,
  messageDeliveryRate: deliveredMessages / sentMessages,
  averageHopCount: totalHops / deliveredMessages,
  networkDensity: connections / possibleConnections,
  batteryUsage: getBatteryUsageStats()
};
```

### Performance Monitoring

1. **Message Latency**: Track time from send to delivery
2. **Network Coverage**: Monitor reachable device percentage  
3. **Resource Usage**: CPU, memory, and battery consumption
4. **Error Rates**: Connection failures and message drops

## 🚀 Deployment

### Production Build

```bash
# Android
cd android && ./gradlew assembleRelease

# iOS
cd ios && xcodebuild -workspace MeshMessenger.xcworkspace -scheme MeshMessenger -configuration Release
```

### Distribution

1. **Android**: Generate signed APK for sideloading
2. **iOS**: Use TestFlight for beta distribution
3. **Updates**: Implement over-the-air updates via mesh network

## 🛠️ Troubleshooting

### Common Issues

1. **Bluetooth Permission Denied**:
   - Check app permissions in device settings
   - Ensure location services are enabled
   - Restart Bluetooth service

2. **Devices Not Discovering**:
   - Verify Bluetooth is enabled on both devices
   - Check compatibility (BLE vs Classic Bluetooth)
   - Ensure apps are in foreground

3. **Messages Not Delivering**:
   - Check message TTL hasn't expired
   - Verify encryption keys are synchronized
   - Monitor network connectivity

### Debug Mode

Enable debug logging:

```javascript
// Add to App.js
if (__DEV__) {
  global.DEBUG_MESH = true;
  console.log('Mesh debugging enabled');
}
```

## 📈 Future Enhancements

1. **Media Support**: Image and file sharing through mesh
2. **Voice Messages**: Compressed audio transmission
3. **Group Messaging**: Multi-recipient encrypted conversations
4. **Digital Payments**: Peer-to-peer token exchange
5. **Mesh Internet**: Bridge to internet through gateway nodes
6. **AI Integration**: Smart message routing and spam detection

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check the troubleshooting guide
- Review the documentation

---

**⚠️ Security Notice**: This is a prototype implementation. For production use, conduct thorough security audits and penetration testing.