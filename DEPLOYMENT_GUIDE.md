# Mesh Messenger Deployment Guide

This guide covers deployment, optimization, and production considerations for the mesh messenger app.

## 🚀 Production Deployment

### 1. Build Configuration

#### Android Production Build

1. **Generate Signing Key:**
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore mesh-messenger-release.keystore -alias mesh-messenger -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Gradle (android/app/build.gradle):**
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               if (project.hasProperty('MESH_RELEASE_STORE_FILE')) {
                   storeFile file(MESH_RELEASE_STORE_FILE)
                   storePassword MESH_RELEASE_STORE_PASSWORD
                   keyAlias MESH_RELEASE_KEY_ALIAS
                   keyPassword MESH_RELEASE_KEY_PASSWORD
               }
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled enableProguardInReleaseBuilds
               proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
           }
       }
   }
   ```

3. **Build Release APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

#### iOS Production Build

1. **Configure Xcode:**
   - Set up Apple Developer account
   - Create App ID with required capabilities
   - Configure provisioning profiles
   - Set up code signing

2. **Build Archive:**
   ```bash
   cd ios
   xcodebuild -workspace MeshMessenger.xcworkspace -scheme MeshMessenger -configuration Release -archivePath MeshMessenger.xcarchive archive
   ```

3. **Export IPA:**
   ```bash
   xcodebuild -exportArchive -archivePath MeshMessenger.xcarchive -exportPath . -exportOptionsPlist ExportOptions.plist
   ```

### 2. Security Hardening

#### Code Obfuscation

**Android (ProGuard/R8):**
```proguard
# Keep Signal protocol classes
-keep class org.whispersystems.** { *; }
-keep class libsignal.** { *; }

# Keep React Native classes
-keep class com.facebook.react.** { *; }

# Obfuscate mesh networking classes
-keep class com.meshmessenger.network.** { *; }
```

**iOS (Xcode Build Settings):**
- Enable "Strip Debug Symbols During Copy"
- Set "Deployment Postprocessing" to YES
- Configure symbol stripping

#### Certificate Pinning

```javascript
// Add to MeshNetwork.js
const TRUSTED_CERTIFICATES = [
  'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  // Add your certificate hashes
];

const validateCertificate = (certificate) => {
  const hash = sha256(certificate);
  return TRUSTED_CERTIFICATES.includes(hash);
};
```

#### Key Management

```javascript
// Enhanced key storage
import { KeychainAccess, BiometricAuth } from 'react-native-security';

class SecureKeyStorage {
  async storeKey(keyId, keyData) {
    const options = {
      accessControl: 'BiometryAny',
      authenticatePrompt: 'Authenticate to access encryption keys',
      showModal: true,
    };
    
    await KeychainAccess.setItem(keyId, keyData, options);
  }
  
  async retrieveKey(keyId) {
    return await KeychainAccess.getItem(keyId);
  }
}
```

### 3. Performance Optimization

#### Battery Optimization

```javascript
// Adaptive scanning intervals
class AdaptiveMeshNetwork extends MeshNetwork {
  constructor() {
    super();
    this.scanningStrategy = new AdaptiveScanningStrategy();
  }
  
  async startAdaptiveScanning() {
    const interval = this.scanningStrategy.calculateInterval({
      connectedDevices: this.connectedDevices.size,
      batteryLevel: await getBatteryLevel(),
      messageQueueSize: this.messageQueue.size,
      timeOfDay: new Date().getHours(),
    });
    
    this.scanInterval = interval;
    await this.startScanning();
  }
}

class AdaptiveScanningStrategy {
  calculateInterval({ connectedDevices, batteryLevel, messageQueueSize, timeOfDay }) {
    let baseInterval = 30000; // 30 seconds
    
    // Reduce frequency if battery is low
    if (batteryLevel < 20) {
      baseInterval *= 2;
    }
    
    // Increase frequency if we have messages to send
    if (messageQueueSize > 0) {
      baseInterval /= 2;
    }
    
    // Reduce frequency during night hours
    if (timeOfDay < 6 || timeOfDay > 22) {
      baseInterval *= 1.5;
    }
    
    // Reduce frequency if we have many connections
    if (connectedDevices > 5) {
      baseInterval *= 1.2;
    }
    
    return Math.max(15000, Math.min(300000, baseInterval)); // 15s - 5min range
  }
}
```

#### Memory Optimization

```javascript
// Message queue with LRU eviction
class OptimizedMessageRouter extends MessageRouter {
  constructor(meshNetwork, signalProtocol) {
    super(meshNetwork, signalProtocol);
    this.maxQueueSize = 500;
    this.maxSeenMessages = 2000;
    this.messageAccessTimes = new Map();
  }
  
  addToQueue(message) {
    // Evict oldest messages if queue is full
    if (this.messageQueue.size >= this.maxQueueSize) {
      this.evictOldestMessages(50); // Remove 50 oldest messages
    }
    
    this.messageQueue.set(message.id, message);
    this.messageAccessTimes.set(message.id, Date.now());
  }
  
  evictOldestMessages(count) {
    const sortedMessages = Array.from(this.messageAccessTimes.entries())
      .sort(([,a], [,b]) => a - b)
      .slice(0, count);
    
    sortedMessages.forEach(([messageId]) => {
      this.messageQueue.delete(messageId);
      this.messageAccessTimes.delete(messageId);
    });
  }
}
```

#### Network Optimization

```javascript
// Smart message prioritization
class PriorityMessageQueue {
  constructor() {
    this.highPriority = new Map(); // Delivery confirmations, system messages
    this.normalPriority = new Map(); // Regular messages
    this.lowPriority = new Map(); // Forwarded messages
  }
  
  addMessage(message, priority = 'normal') {
    const queue = this.getQueueByPriority(priority);
    queue.set(message.id, message);
  }
  
  getNextMessage() {
    if (this.highPriority.size > 0) {
      const [id, message] = this.highPriority.entries().next().value;
      this.highPriority.delete(id);
      return message;
    }
    
    if (this.normalPriority.size > 0) {
      const [id, message] = this.normalPriority.entries().next().value;
      this.normalPriority.delete(id);
      return message;
    }
    
    if (this.lowPriority.size > 0) {
      const [id, message] = this.lowPriority.entries().next().value;
      this.lowPriority.delete(id);
      return message;
    }
    
    return null;
  }
}
```

## 📊 Monitoring and Analytics

### 1. Performance Monitoring

```javascript
// Performance metrics collection
class MeshMetrics {
  constructor() {
    this.metrics = {
      messageLatency: [],
      connectionSuccess: 0,
      connectionFailures: 0,
      batteryUsage: [],
      networkDensity: [],
      messageDeliveryRate: 0,
    };
  }
  
  recordMessageLatency(sendTime, deliveryTime) {
    const latency = deliveryTime - sendTime;
    this.metrics.messageLatency.push(latency);
    
    // Keep only last 100 measurements
    if (this.metrics.messageLatency.length > 100) {
      this.metrics.messageLatency.shift();
    }
  }
  
  recordConnectionAttempt(success) {
    if (success) {
      this.metrics.connectionSuccess++;
    } else {
      this.metrics.connectionFailures++;
    }
  }
  
  getAverageLatency() {
    const latencies = this.metrics.messageLatency;
    if (latencies.length === 0) return 0;
    
    const sum = latencies.reduce((a, b) => a + b, 0);
    return sum / latencies.length;
  }
  
  getConnectionSuccessRate() {
    const total = this.metrics.connectionSuccess + this.metrics.connectionFailures;
    if (total === 0) return 1;
    
    return this.metrics.connectionSuccess / total;
  }
}
```

### 2. Error Reporting

```javascript
// Crash reporting and error tracking
class ErrorReporter {
  static reportError(error, context) {
    const errorReport = {
      error: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      deviceInfo: getDeviceInfo(),
      appVersion: getAppVersion(),
    };
    
    // Store locally for later transmission
    this.storeErrorReport(errorReport);
    
    // Attempt to send via mesh network
    this.sendErrorReport(errorReport);
  }
  
  static async storeErrorReport(report) {
    try {
      const storedReports = await AsyncStorage.getItem('errorReports') || '[]';
      const reports = JSON.parse(storedReports);
      reports.push(report);
      
      // Keep only last 50 reports
      if (reports.length > 50) {
        reports.shift();
      }
      
      await AsyncStorage.setItem('errorReports', JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to store error report:', e);
    }
  }
}
```

### 3. Usage Analytics

```javascript
// Privacy-preserving usage analytics
class PrivateAnalytics {
  constructor() {
    this.sessionStart = Date.now();
    this.events = [];
  }
  
  trackEvent(eventName, properties = {}) {
    // Hash sensitive data
    const hashedProperties = this.hashSensitiveData(properties);
    
    this.events.push({
      event: eventName,
      properties: hashedProperties,
      timestamp: Date.now() - this.sessionStart, // Relative timestamp
    });
  }
  
  hashSensitiveData(data) {
    const sensitiveFields = ['deviceId', 'messageId', 'recipientId'];
    const hashed = { ...data };
    
    sensitiveFields.forEach(field => {
      if (hashed[field]) {
        hashed[field] = sha256(hashed[field]).substring(0, 8);
      }
    });
    
    return hashed;
  }
  
  generateReport() {
    return {
      sessionDuration: Date.now() - this.sessionStart,
      events: this.events,
      deviceType: getDeviceType(),
      appVersion: getAppVersion(),
    };
  }
}
```

## 🔧 Configuration Management

### 1. Environment Configuration

```javascript
// config/index.js
const config = {
  development: {
    debug: true,
    maxConnections: 5,
    scanInterval: 10000,
    messageRetention: 24 * 60 * 60 * 1000, // 1 day
    logLevel: 'debug',
  },
  
  production: {
    debug: false,
    maxConnections: 10,
    scanInterval: 30000,
    messageRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
    logLevel: 'error',
  },
  
  testing: {
    debug: true,
    maxConnections: 3,
    scanInterval: 5000,
    messageRetention: 60 * 60 * 1000, // 1 hour
    logLevel: 'debug',
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

### 2. Feature Flags

```javascript
// Feature flag system for gradual rollouts
class FeatureFlags {
  constructor() {
    this.flags = new Map();
    this.loadFlags();
  }
  
  async loadFlags() {
    try {
      const storedFlags = await AsyncStorage.getItem('featureFlags');
      if (storedFlags) {
        const flags = JSON.parse(storedFlags);
        Object.entries(flags).forEach(([key, value]) => {
          this.flags.set(key, value);
        });
      }
      
      // Set default flags
      this.setDefaultFlags();
    } catch (error) {
      console.error('Error loading feature flags:', error);
      this.setDefaultFlags();
    }
  }
  
  setDefaultFlags() {
    const defaults = {
      'wifi-direct': true,
      'super-relay': true,
      'message-compression': false,
      'voice-messages': false,
      'group-messaging': false,
    };
    
    Object.entries(defaults).forEach(([key, value]) => {
      if (!this.flags.has(key)) {
        this.flags.set(key, value);
      }
    });
  }
  
  isEnabled(flagName) {
    return this.flags.get(flagName) || false;
  }
  
  async setFlag(flagName, enabled) {
    this.flags.set(flagName, enabled);
    await this.saveFlags();
  }
  
  async saveFlags() {
    const flagsObject = Object.fromEntries(this.flags);
    await AsyncStorage.setItem('featureFlags', JSON.stringify(flagsObject));
  }
}
```

## 🌐 Distribution Strategy

### 1. Beta Testing

#### TestFlight (iOS)
```bash
# Upload to TestFlight
xcodebuild -exportArchive \
  -archivePath MeshMessenger.xcarchive \
  -exportPath . \
  -exportOptionsPlist ExportOptions.plist

# Upload using altool
xcrun altool --upload-app \
  --type ios \
  --file "MeshMessenger.ipa" \
  --username "developer@example.com" \
  --password "@keychain:AC_PASSWORD"
```

#### Google Play Internal Testing
```bash
# Upload to Google Play Console
bundletool build-apks \
  --bundle=app-release.aab \
  --output=mesh-messenger.apks \
  --ks=mesh-messenger-release.keystore \
  --ks-pass=pass:$KEYSTORE_PASSWORD \
  --ks-key-alias=mesh-messenger \
  --key-pass=pass:$KEY_PASSWORD
```

### 2. Sideloading Distribution

For regions with restricted app stores or for testing:

```bash
# Create self-distributing APK with auto-updater
./gradlew assembleSelfDistributing

# Generate QR code for easy distribution
qrencode -t PNG -o mesh-messenger-download.png "https://example.com/mesh-messenger.apk"
```

### 3. Over-the-Air Updates via Mesh

```javascript
// Mesh-based app updates
class MeshUpdater {
  constructor(meshNetwork) {
    this.meshNetwork = meshNetwork;
    this.currentVersion = getAppVersion();
  }
  
  async checkForUpdates() {
    // Broadcast version query
    const versionQuery = {
      type: 'version_query',
      currentVersion: this.currentVersion,
    };
    
    await this.meshNetwork.broadcastMessage(versionQuery);
  }
  
  async handleVersionResponse(response) {
    if (this.isNewerVersion(response.version, this.currentVersion)) {
      // Request update chunks
      await this.requestUpdate(response.version);
    }
  }
  
  async requestUpdate(version) {
    // Implementation for downloading app updates via mesh
    // This would involve chunking the APK/IPA and requesting pieces
    // from multiple mesh nodes
  }
}
```

## 🔒 Security Considerations

### 1. Code Integrity

```javascript
// App integrity verification
class IntegrityChecker {
  async verifyAppIntegrity() {
    const expectedHash = await this.getExpectedAppHash();
    const currentHash = await this.calculateAppHash();
    
    if (expectedHash !== currentHash) {
      throw new Error('App integrity check failed');
    }
  }
  
  async calculateAppHash() {
    // Calculate hash of critical app components
    const criticalFiles = [
      'SignalProtocol.js',
      'MeshNetwork.js', 
      'MessageRouter.js'
    ];
    
    const hashes = await Promise.all(
      criticalFiles.map(file => this.hashFile(file))
    );
    
    return sha256(hashes.join(''));
  }
}
```

### 2. Anti-Tampering

```javascript
// Root/jailbreak detection
class SecurityChecker {
  async checkDeviceSecurity() {
    const checks = [
      this.checkRootAccess(),
      this.checkDebuggingEnabled(),
      this.checkEmulator(),
      this.checkHooks(),
    ];
    
    const results = await Promise.all(checks);
    const isCompromised = results.some(result => result === true);
    
    if (isCompromised) {
      throw new Error('Device security compromised');
    }
  }
  
  async checkRootAccess() {
    // Platform-specific root detection
    if (Platform.OS === 'android') {
      return this.checkAndroidRoot();
    } else {
      return this.checkIOSJailbreak();
    }
  }
}
```

## 📈 Scaling Considerations

### 1. Network Scalability

```javascript
// Hierarchical mesh structure for large networks
class HierarchicalMesh {
  constructor() {
    this.nodeType = 'regular'; // regular, relay, super-relay
    this.cluster = null;
    this.clusterHead = null;
  }
  
  async joinCluster() {
    const nearbyNodes = await this.discoverNearbyNodes();
    const clusterHeads = nearbyNodes.filter(node => node.type === 'cluster-head');
    
    if (clusterHeads.length > 0) {
      // Join existing cluster
      this.cluster = clusterHeads[0].clusterId;
      this.clusterHead = clusterHeads[0].id;
    } else if (this.shouldBecomeClusterHead()) {
      // Become cluster head
      this.becomeClusterHead();
    }
  }
  
  shouldBecomeClusterHead() {
    // Logic to determine if this node should become a cluster head
    // Based on factors like connectivity, battery, processing power
    return this.connectionCount > 5 && this.batteryLevel > 50;
  }
}
```

### 2. Message Routing Optimization

```javascript
// Geographic routing for large-scale deployment
class GeographicRouter {
  constructor() {
    this.routingTable = new Map();
    this.locationCache = new Map();
  }
  
  async routeMessage(message, targetLocation) {
    const currentLocation = await this.getCurrentLocation();
    const nextHop = this.findClosestNode(targetLocation);
    
    if (nextHop) {
      await this.forwardMessage(message, nextHop);
    } else {
      // Fall back to epidemic routing
      await this.epidemicForward(message);
    }
  }
  
  findClosestNode(targetLocation) {
    let closestNode = null;
    let minDistance = Infinity;
    
    for (const [nodeId, nodeLocation] of this.locationCache) {
      const distance = this.calculateDistance(nodeLocation, targetLocation);
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = nodeId;
      }
    }
    
    return closestNode;
  }
}
```

This deployment guide provides comprehensive coverage of production deployment, security hardening, performance optimization, and scaling considerations for the mesh messenger app. The implementation focuses on real-world deployment challenges and provides practical solutions for each aspect of the deployment process.

<function_calls>
<invoke name="todo_write">
<parameter name="merge">true