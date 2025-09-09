# Mesh Messenger Testing Guide

This guide provides comprehensive testing scenarios and procedures for validating the mesh messenger app functionality.

## 🧪 Test Environment Setup

### Hardware Requirements

**Minimum Test Setup (2-3 devices):**
- 2-3 Android/iOS devices with Bluetooth 4.0+
- Devices should support BLE and Wi-Fi Direct (Android)
- Different device models recommended for compatibility testing

**Recommended Test Setup (5-10 devices):**
- Mix of Android and iOS devices
- Different Bluetooth versions (4.0, 4.1, 4.2, 5.0+)
- Various device manufacturers (Samsung, Google, Apple, etc.)
- Different Android versions and iOS versions

**Large Scale Testing (10+ devices):**
- University campus or office environment
- Multiple floors/buildings for range testing
- Mix of stationary and mobile devices
- Different network conditions

### Software Setup

1. **Development Build Installation:**
   ```bash
   # Install debug build on all test devices
   npm run android  # For Android devices
   npm run ios      # For iOS devices
   ```

2. **Enable Developer Options:**
   - Android: Enable USB debugging, keep screen on
   - iOS: Trust developer certificate
   - Enable location services and Bluetooth permissions

3. **Testing Tools:**
   - Install network monitoring apps
   - Battery monitoring tools
   - Bluetooth scanner apps for verification

## 📱 Functional Testing

### 1. Basic Connectivity Tests

#### Test Case 1.1: Device Discovery
**Objective:** Verify devices can discover each other via BLE/Wi-Fi Direct

**Steps:**
1. Install app on 2 devices (Device A, Device B)
2. Open app on both devices
3. Navigate to "Devices" screen
4. Enable scanning on both devices
5. Wait 30 seconds

**Expected Results:**
- Both devices appear in each other's discovered devices list
- Signal strength (RSSI) values are displayed
- Connection protocol (BLE/Wi-Fi Direct) is shown
- Device names are visible

**Pass Criteria:**
- Discovery happens within 30 seconds
- RSSI values are reasonable (-30 to -80 dBm)
- No crashes or errors

#### Test Case 1.2: Device Connection
**Objective:** Verify devices can establish connections

**Steps:**
1. From Device A, tap "Connect" on Device B
2. Wait for connection establishment
3. Verify connection status on both devices
4. Check "Connected Devices" section

**Expected Results:**
- Connection establishes within 10 seconds
- Both devices show "Connected" status
- Connection indicator turns green
- Devices appear in connected devices list

#### Test Case 1.3: Encryption Key Exchange
**Objective:** Verify Signal protocol key exchange

**Steps:**
1. Connect two devices (A and B)
2. Monitor debug logs for key exchange
3. Verify encryption keys are generated
4. Check secure storage of keys

**Expected Results:**
- X3DH key agreement completes successfully
- Identity keys, prekeys, and signed prekeys are generated
- Keys are stored securely (Android Keystore/iOS Keychain)
- No plaintext keys in logs

### 2. Messaging Tests

#### Test Case 2.1: Direct Messaging
**Objective:** Test encrypted message exchange between connected devices

**Steps:**
1. Connect Device A and Device B
2. Open chat screen from A to B
3. Send message: "Hello from Device A"
4. Verify message appears on Device B
5. Reply from Device B: "Hello back from Device B"
6. Verify reply appears on Device A

**Expected Results:**
- Messages appear within 5 seconds
- Encryption badge is visible on messages
- Delivery status shows "Delivered"
- Message timestamps are correct
- No plaintext messages in network traffic

#### Test Case 2.2: Message Encryption Verification
**Objective:** Verify messages are properly encrypted

**Steps:**
1. Set up packet capture on network interface
2. Send messages between devices
3. Analyze captured traffic
4. Verify message content is encrypted

**Expected Results:**
- No plaintext message content in network traffic
- Only encrypted payloads are transmitted
- Message metadata is minimal
- Signal protocol headers are present

#### Test Case 2.3: Store-and-Forward Messaging
**Objective:** Test message routing through intermediate devices

**Setup:**
- 3 devices in a line: A ←→ B ←→ C
- A and C cannot connect directly
- B is connected to both A and C

**Steps:**
1. Send message from A to C
2. Monitor message propagation through B
3. Verify message delivery to C
4. Check message status updates

**Expected Results:**
- Message routes through B to reach C
- Delivery status shows "Forwarded" then "Delivered"
- Message arrives within 30 seconds
- TTL decreases with each hop
- B cannot decrypt the message content

### 3. Network Resilience Tests

#### Test Case 3.1: Connection Recovery
**Objective:** Test automatic reconnection after disconnection

**Steps:**
1. Connect devices A and B
2. Send messages to establish working connection
3. Turn off Bluetooth on Device B for 30 seconds
4. Turn Bluetooth back on
5. Verify automatic reconnection
6. Send test messages

**Expected Results:**
- Connection automatically re-establishes
- Queued messages are delivered after reconnection
- No message loss occurs
- Connection status updates correctly

#### Test Case 3.2: Multi-Hop Message Delivery
**Objective:** Test message delivery across multiple hops

**Setup:**
- 4+ devices in chain: A ←→ B ←→ C ←→ D
- Only adjacent devices can connect

**Steps:**
1. Send message from A to D
2. Monitor hop count and routing path
3. Verify message delivery
4. Test reverse direction (D to A)

**Expected Results:**
- Message successfully routes through intermediate devices
- Hop count increments correctly
- TTL decrements with each hop
- Message delivers within reasonable time (< 2 minutes)

#### Test Case 3.3: Network Partition Recovery
**Objective:** Test message delivery after network splits and rejoins

**Setup:**
- 5 devices: A-B-C-D-E in a line
- Create partition by disconnecting C

**Steps:**
1. Send message from A to E (should fail)
2. Reconnect C to restore network
3. Verify message eventually delivers
4. Check message queue management

**Expected Results:**
- Message queues properly during partition
- Message delivers after network heals
- No duplicate messages
- Queue size remains manageable

## 🔋 Performance Testing

### 4. Battery Usage Tests

#### Test Case 4.1: Idle Battery Consumption
**Objective:** Measure battery usage during idle operation

**Steps:**
1. Fully charge test device
2. Open app and connect to 2-3 nearby devices
3. Leave app running for 8 hours
4. Measure battery consumption

**Expected Results:**
- Battery drain < 5% per hour during idle
- App doesn't cause device overheating
- Background operation is stable

#### Test Case 4.2: Active Messaging Battery Impact
**Objective:** Measure battery usage during active messaging

**Steps:**
1. Set up continuous messaging between devices
2. Send 1 message per minute for 2 hours
3. Monitor battery usage
4. Compare with baseline idle consumption

**Expected Results:**
- Minimal additional battery drain for messaging
- Battery usage scales reasonably with message volume
- No memory leaks or CPU spikes

### 5. Scalability Tests

#### Test Case 5.1: Many Connected Devices
**Objective:** Test performance with multiple simultaneous connections

**Steps:**
1. Connect one device to 10+ other devices
2. Monitor connection stability
3. Send messages to various connected devices
4. Check performance metrics

**Expected Results:**
- App handles 10+ connections without crashes
- Message delivery remains reliable
- UI remains responsive
- Memory usage stays within limits

#### Test Case 5.2: High Message Volume
**Objective:** Test system behavior under high message load

**Steps:**
1. Set up 5 devices in mesh network
2. Send 100 messages rapidly from each device
3. Monitor message queue sizes
4. Verify all messages eventually deliver

**Expected Results:**
- Message queues don't overflow
- No messages are lost
- System remains stable under load
- TTL prevents infinite loops

## 🌐 Real-World Testing

### 6. Range and Coverage Tests

#### Test Case 6.1: Maximum Range Testing
**Objective:** Determine effective communication range

**Steps:**
1. Start with devices adjacent (1 meter apart)
2. Gradually increase distance
3. Test message delivery at each distance
4. Note maximum reliable range

**Expected Results:**
- BLE range: 10-30 meters in open space
- Wi-Fi Direct range: 50-200 meters
- Range varies with environment and obstacles
- Connection quality degrades gracefully

#### Test Case 6.2: Obstacle Penetration
**Objective:** Test signal penetration through obstacles

**Test Environments:**
- Indoor: walls, floors, furniture
- Outdoor: trees, buildings, vehicles
- Mixed: indoor-to-outdoor scenarios

**Steps:**
1. Establish baseline connection in open space
2. Introduce obstacles between devices
3. Test message delivery through obstacles
4. Document signal degradation

**Expected Results:**
- Messages deliver through typical building materials
- Signal strength decreases predictably
- Connection may require multiple hops through obstacles

### 7. Environmental Testing

#### Test Case 7.1: Urban Environment
**Objective:** Test in high-density urban environment

**Test Locations:**
- Coffee shops, restaurants
- University campuses
- Shopping centers
- Public transportation

**Steps:**
1. Deploy devices in busy urban areas
2. Test message propagation across the area
3. Monitor interference from other devices
4. Verify mesh network formation

**Expected Results:**
- Mesh network forms in high-density areas
- Messages propagate across urban environment
- Interference is manageable
- Super relay nodes emerge naturally

#### Test Case 7.2: Rural/Low-Density Testing
**Objective:** Test in sparse network conditions

**Steps:**
1. Deploy devices with large gaps between them
2. Test store-and-forward with mobile devices
3. Verify message persistence during isolation
4. Test eventual delivery as network reconnects

**Expected Results:**
- Messages queue properly during isolation
- Mobile devices act as message carriers
- Messages deliver when network reconnects
- TTL prevents messages from expiring too quickly

## 🔒 Security Testing

### 8. Encryption and Privacy Tests

#### Test Case 8.1: Message Confidentiality
**Objective:** Verify messages cannot be read by unauthorized parties

**Steps:**
1. Set up packet capture on intermediate device
2. Route encrypted messages through the device
3. Attempt to decrypt captured messages
4. Verify content remains confidential

**Expected Results:**
- Intermediate devices cannot decrypt messages
- Only intended recipients can read content
- No plaintext leakage in logs or memory
- Forward secrecy is maintained

#### Test Case 8.2: Key Management Security
**Objective:** Verify encryption keys are properly protected

**Steps:**
1. Attempt to extract keys from device storage
2. Test key rotation and cleanup
3. Verify secure key deletion
4. Test key recovery scenarios

**Expected Results:**
- Keys are stored in secure hardware when available
- Old keys are properly deleted
- Key rotation occurs regularly
- No keys accessible to other apps

### 9. Attack Resistance Tests

#### Test Case 9.1: Message Flooding Attack
**Objective:** Test resilience against message flooding

**Steps:**
1. Create malicious device that sends many messages
2. Connect to mesh network
3. Flood network with messages
4. Monitor network performance and stability

**Expected Results:**
- Rate limiting prevents network saturation
- Legitimate messages still deliver
- Malicious device can be identified and blocked
- Network remains stable

#### Test Case 9.2: Replay Attack Prevention
**Objective:** Verify protection against message replay

**Steps:**
1. Capture legitimate encrypted messages
2. Attempt to replay messages later
3. Verify messages are rejected
4. Test with different replay timings

**Expected Results:**
- Replayed messages are detected and rejected
- Message counters prevent replay attacks
- No duplicate message delivery
- Replay detection logs security events

## 📊 Performance Benchmarks

### 10. Baseline Performance Metrics

#### Test Case 10.1: Message Latency Benchmarking
**Objective:** Establish baseline message delivery times

**Test Scenarios:**
- Direct connection (1 hop)
- 2-hop delivery through 1 intermediate
- 3-hop delivery through 2 intermediates
- 5-hop delivery through 4 intermediates

**Measurements:**
- Time from send to delivery confirmation
- Network conditions and signal strength
- Device specifications and battery levels

**Target Benchmarks:**
- 1 hop: < 2 seconds
- 2 hops: < 10 seconds  
- 3 hops: < 30 seconds
- 5 hops: < 2 minutes

#### Test Case 10.2: Throughput Testing
**Objective:** Measure maximum message throughput

**Steps:**
1. Send messages continuously between devices
2. Measure messages per second delivered
3. Test with different message sizes
4. Monitor resource usage

**Target Benchmarks:**
- Small messages (< 100 bytes): 10+ per second
- Medium messages (< 1KB): 5+ per second
- Large messages (< 10KB): 1+ per second

## 🛠️ Debugging and Diagnostics

### 11. Debug Testing

#### Test Case 11.1: Debug Logging Verification
**Objective:** Verify comprehensive debug logging

**Steps:**
1. Enable debug mode in app
2. Perform various operations
3. Review log output
4. Verify log completeness and usefulness

**Expected Results:**
- All major operations are logged
- Error conditions are clearly logged
- Performance metrics are captured
- Sensitive data is not logged

#### Test Case 11.2: Error Recovery Testing
**Objective:** Test graceful handling of error conditions

**Error Scenarios:**
- Bluetooth adapter disabled/enabled
- App backgrounded/foregrounded
- Device memory pressure
- Network interface changes
- Corrupted message data

**Expected Results:**
- App handles errors gracefully
- User receives appropriate feedback
- System recovers automatically when possible
- No data corruption or loss

## 📋 Test Execution Checklist

### Pre-Test Setup
- [ ] All test devices charged to 100%
- [ ] Latest app version installed on all devices
- [ ] Permissions granted (Bluetooth, Location)
- [ ] Test environment documented
- [ ] Baseline measurements recorded

### During Testing
- [ ] Document all test steps and results
- [ ] Capture screenshots/videos of issues
- [ ] Monitor device performance metrics
- [ ] Note environmental conditions
- [ ] Record timing measurements

### Post-Test Analysis
- [ ] Analyze performance metrics
- [ ] Document bugs and issues found
- [ ] Compare results to benchmarks
- [ ] Generate test report
- [ ] Plan follow-up testing if needed

## 📈 Test Reporting

### Test Report Template

```
# Mesh Messenger Test Report

## Test Summary
- **Test Date:** [Date]
- **Test Environment:** [Environment description]
- **Devices Tested:** [Device list]
- **Test Duration:** [Duration]
- **Tester:** [Name]

## Test Results Summary
- **Total Test Cases:** [Number]
- **Passed:** [Number]
- **Failed:** [Number]
- **Blocked:** [Number]

## Performance Metrics
- **Average Message Latency:** [Time]
- **Maximum Range Achieved:** [Distance]
- **Battery Usage:** [Percentage per hour]
- **Connection Success Rate:** [Percentage]

## Issues Found
1. [Issue description]
   - **Severity:** [High/Medium/Low]
   - **Steps to Reproduce:** [Steps]
   - **Expected vs Actual:** [Description]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Next Steps
- [Action items]
```

This comprehensive testing guide ensures thorough validation of the mesh messenger app across all critical functionality, performance, and security aspects.