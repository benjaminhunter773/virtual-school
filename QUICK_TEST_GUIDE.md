# 🚀 Quick Test Guide - Mesh Messenger

This guide will walk you through testing the mesh messenger app step by step, from setup to advanced scenarios.

## 📋 Prerequisites

### Required Hardware
- **2-3 Android or iOS devices** with Bluetooth 4.0+
- **USB cables** for each device
- **Computer** with development environment

### Required Software
- **Node.js 18+** ([Download here](https://nodejs.org/))
- **React Native development environment**
  - **Android**: Android Studio + Android SDK
  - **iOS**: Xcode (macOS only)
- **Git** for version control

## 🛠️ Step 1: Environment Setup

### 1.1 Install Dependencies

```bash
# Clone or navigate to the project directory
cd mesh-messenger

# Run the setup script
./setup-test.sh

# Or manually install:
npm install

# For iOS (macOS only):
cd ios && pod install && cd ..
```

### 1.2 Enable Developer Mode on Devices

**Android:**
1. Go to **Settings > About Phone**
2. Tap **Build Number** 7 times to enable Developer Options
3. Go to **Settings > Developer Options**
4. Enable **USB Debugging**
5. Enable **Stay Awake** (keeps screen on while charging)

**iOS:**
1. Connect device to Mac
2. Open Xcode
3. Go to **Window > Devices and Simulators**
4. Trust the developer certificate when prompted

### 1.3 Connect Devices

```bash
# Check connected Android devices
adb devices

# Should show your devices:
# List of devices attached
# ABC123DEF456    device
# GHI789JKL012    device
```

## 🧪 Step 2: Basic Functionality Tests

### 2.1 Install and Launch App

**Install on all test devices:**

```bash
# For Android (run for each connected device)
npm run android

# For iOS (select device in Xcode or use specific device)
npm run ios
```

**Expected Result:** App launches successfully on all devices showing the main screen.

### 2.2 Test App Initialization

1. **Open the app** on all devices
2. **Grant permissions** when prompted:
   - Location access
   - Bluetooth access
   - Nearby devices (Android 12+)
3. **Check the home screen** shows:
   - "Mesh Network Status" header
   - Network statistics (all zeros initially)
   - "No messages yet" in recent messages

**✅ Success Criteria:**
- App opens without crashes
- All permissions granted
- Home screen displays correctly

### 2.3 Test Built-in Component Tests

1. **Navigate to Settings** (gear icon in top right)
2. **Scroll to "Testing & Debug" section**
3. **Tap "Run Component Tests"**
4. **Check console output** for test results

**Expected Output:**
```
🧪 Starting Mesh Messenger Tests...

🔐 Testing Signal Protocol Encryption...
  ✅ PASS: Signal Protocol Initialization - Both instances initialized successfully
  ✅ PASS: Public Key Bundle Generation - Key bundles generated with identity keys
  ✅ PASS: Session Establishment - Sessions established between devices
  ✅ PASS: Message Encryption/Decryption - Original: "Hello, this is a test message!", Decrypted: "Hello, this is a test message!"

📊 Test Results Summary:
Total Tests: 12
Passed: 12 ✅
Failed: 0 ❌
Success Rate: 100.0%
```

## 🔗 Step 3: Device Discovery Tests

### 3.1 Test Device Scanning

1. **Open "Devices" screen** on all devices (+ button or navigation)
2. **Enable scanning** using the toggle switch
3. **Wait 30 seconds** for devices to discover each other
4. **Verify devices appear** in the "Nearby Devices" list

**Expected Results:**
- Devices discover each other within 30 seconds
- Device names, protocols (BLE), and signal strength shown
- Signal strength shows reasonable values (-30 to -80 dBm)

**Troubleshooting:**
- If devices don't appear: Check Bluetooth is enabled on both devices
- If still not working: Try restarting Bluetooth or moving devices closer
- Check permissions are granted for location and Bluetooth

### 3.2 Test Device Connection

1. **On Device A**, tap **"Connect"** button next to Device B
2. **Wait for connection** (should take < 10 seconds)
3. **Verify connection status**:
   - Device B appears in "Connected Devices" section
   - Connection indicator turns green
   - Both devices show each other as connected

**✅ Success Criteria:**
- Connection establishes within 10 seconds
- Both devices show connection status
- No error messages or crashes

## 💬 Step 4: Messaging Tests

### 4.1 Test Direct Messaging

1. **On Device A**, tap the **chat button** next to connected Device B
2. **Type a test message**: "Hello from Device A!"
3. **Send the message**
4. **On Device B**, verify:
   - Message appears in chat
   - Shows encryption lock icon
   - Timestamp is correct
   - Delivery status shows "Delivered"

5. **Reply from Device B**: "Hello back from Device B!"
6. **Verify reply appears on Device A**

**Expected Results:**
- Messages appear within 5 seconds
- All messages show encryption indicators
- Conversation flows naturally in both directions
- Delivery status updates correctly

### 4.2 Test Message Encryption

1. **Send several messages** between devices
2. **Check message indicators**:
   - 🔒 Lock icon appears on messages
   - Connection status shows "Connected directly" (green)
   - Settings show "End-to-end encrypted" status

**Verification:**
- All messages should show encryption badges
- No plaintext should be visible in logs
- Messages are unreadable to intermediate devices

## 🌐 Step 5: Mesh Network Tests

### 5.1 Test Store-and-Forward (3+ Devices Required)

**Setup:**
- **Device A** and **Device C** should NOT be able to connect directly
- **Device B** should connect to both A and C
- Physical arrangement: A ←→ B ←→ C

**Test Steps:**
1. **Connect A to B** and **B to C** (but not A to C directly)
2. **From Device A**, send message to Device C
3. **Monitor message routing**:
   - Message should appear as "Forwarded" on Device A
   - Message should route through Device B
   - Message should appear as "Delivered" when it reaches Device C

**Expected Results:**
- Message successfully routes through Device B
- Delivery status progresses: Pending → Forwarded → Delivered
- Message arrives at Device C within 30 seconds
- Device B cannot read the message content (still encrypted)

### 5.2 Test Network Statistics

1. **Navigate to Home screen** on all devices
2. **Check network statistics**:
   - Connected devices count
   - Messages sent/received
   - Queued messages
   - Super relay status (if applicable)

**Expected Values:**
- Connected devices: Number of active connections
- Sent/received: Matches actual message count
- Queued: Should be 0 or low for delivered messages
- Super relay: Activates on devices with 5+ connections

## 🔋 Step 6: Performance Tests

### 6.1 Test Battery Usage

1. **Fully charge one test device**
2. **Run app for 2 hours** with active connections
3. **Monitor battery drain**:
   - Should be < 10% per hour during active use
   - Should be < 5% per hour when idle

### 6.2 Test Message Volume

1. **Send 20 messages rapidly** between devices
2. **Verify all messages deliver**
3. **Check app remains responsive**
4. **Monitor memory usage** (should remain stable)

## 🔍 Step 7: Advanced Testing

### 7.1 Test Network Resilience

1. **Establish connections** between multiple devices
2. **Turn off Bluetooth** on one device for 30 seconds
3. **Turn Bluetooth back on**
4. **Verify automatic reconnection**
5. **Test message delivery** after reconnection

### 7.2 Test Range Limits

1. **Start with devices close together** (1 meter)
2. **Gradually increase distance**
3. **Test message delivery** at each distance
4. **Note maximum reliable range**:
   - BLE: Usually 10-30 meters in open space
   - Wi-Fi Direct: 50-200 meters (Android only)

### 7.3 Test in Different Environments

**Indoor Testing:**
- Test through walls and floors
- Test in crowded areas (cafes, offices)
- Note signal degradation

**Outdoor Testing:**
- Test in open areas
- Test around obstacles (buildings, trees)
- Test while walking/moving

## 🐛 Troubleshooting Common Issues

### App Won't Start
```bash
# Clear React Native cache
npx react-native start --reset-cache

# Clean and rebuild
cd android && ./gradlew clean && cd ..
npm run android
```

### Bluetooth Permissions Issues
- **Android**: Check Location permission is granted
- **iOS**: Check Bluetooth permission in Settings
- **Both**: Restart Bluetooth service

### Devices Not Discovering
1. **Check Bluetooth is enabled** on both devices
2. **Verify app permissions** are granted
3. **Try moving devices closer** (< 5 meters)
4. **Restart scanning** using toggle switch
5. **Check device compatibility** (BLE 4.0+ required)

### Messages Not Delivering
1. **Verify devices are connected** (green indicator)
2. **Check message queue** in Settings statistics
3. **Verify encryption keys** are established
4. **Check TTL hasn't expired** (default 24 hops)

### Performance Issues
1. **Close other Bluetooth apps**
2. **Restart devices** if memory is low
3. **Check battery optimization** settings
4. **Reduce number of connections** if needed

## 📊 Test Results Documentation

### Create Test Report

Document your test results:

```
# Test Report - [Date]

## Environment
- Devices: [List device models and OS versions]
- Location: [Indoor/Outdoor/Mixed]
- Duration: [Test duration]

## Results
- Device Discovery: [Success rate and timing]
- Message Delivery: [Success rate and latency]
- Range Testing: [Maximum reliable distance]
- Battery Usage: [Percentage per hour]

## Issues Found
- [List any bugs or problems encountered]

## Recommendations
- [Suggestions for improvements]
```

### Performance Benchmarks

Track these metrics:
- **Discovery Time**: < 30 seconds
- **Connection Time**: < 10 seconds
- **Message Latency**: 
  - Direct (1 hop): < 2 seconds
  - 2 hops: < 10 seconds
  - 3+ hops: < 30 seconds
- **Battery Usage**: < 5% per hour idle
- **Range**: 10-30m BLE, 50-200m Wi-Fi Direct

## 🎉 Success Criteria

Your mesh messenger is working correctly if:

✅ **All devices discover each other reliably**
✅ **Messages encrypt and decrypt properly**
✅ **Store-and-forward routing works through intermediate devices**
✅ **Battery usage is reasonable**
✅ **App remains stable during extended testing**
✅ **Network statistics are accurate**
✅ **Reconnection works after disconnections**

## 🚀 Next Steps

Once basic testing is complete:

1. **Test with more devices** (5-10) for larger mesh networks
2. **Test in different environments** (urban, rural, indoor, outdoor)
3. **Conduct longer-term testing** (days/weeks)
4. **Test edge cases** (low battery, memory pressure, interference)
5. **Performance optimization** based on test results

## 📞 Getting Help

If you encounter issues:

1. **Check the console logs** for error messages
2. **Review the TESTING_GUIDE.md** for detailed scenarios
3. **Check GitHub issues** for known problems
4. **Run the built-in component tests** for diagnostics

Happy testing! 🎉