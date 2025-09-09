/**
 * Message Router - Store and Forward System
 * Implements epidemic routing with TTL and hop count
 * Handles message queuing, forwarding, and delivery tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

class MessageRouter {
  constructor(meshNetwork, signalProtocol) {
    this.meshNetwork = meshNetwork;
    this.signalProtocol = signalProtocol;
    
    // Message storage
    this.messageQueue = new Map(); // Messages waiting to be forwarded
    this.sentMessages = new Map();  // Messages we've sent
    this.receivedMessages = new Map(); // Messages we've received
    this.seenMessageIds = new Set(); // IDs of messages we've seen (prevent loops)
    
    // Routing configuration
    this.maxTTL = 24; // Maximum hops (24 hours worth of forwarding)
    this.maxMessageAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.forwardingProbability = 0.8; // Probability of forwarding a message
    this.maxQueueSize = 1000; // Maximum messages in queue
    
    // Super relay configuration
    this.isSuperRelay = false;
    this.superRelayThreshold = 10; // Minimum connections to become super relay
    
    this.initialize();
  }

  /**
   * Initialize the message router
   */
  async initialize() {
    try {
      // Load persistent message data
      await this.loadPersistedData();
      
      // Set up mesh network event handlers
      this.setupNetworkEventHandlers();
      
      // Start periodic cleanup and forwarding
      this.startPeriodicTasks();
      
      console.log('Message router initialized');
    } catch (error) {
      console.error('Error initializing message router:', error);
    }
  }

  /**
   * Load persisted messages and routing data
   */
  async loadPersistedData() {
    try {
      const queueData = await AsyncStorage.getItem('messageQueue');
      if (queueData) {
        const messages = JSON.parse(queueData);
        this.messageQueue = new Map(messages);
      }

      const seenData = await AsyncStorage.getItem('seenMessageIds');
      if (seenData) {
        const seenIds = JSON.parse(seenData);
        this.seenMessageIds = new Set(seenIds);
      }

      console.log(`Loaded ${this.messageQueue.size} queued messages`);
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  }

  /**
   * Persist message data to storage
   */
  async persistData() {
    try {
      await AsyncStorage.setItem(
        'messageQueue', 
        JSON.stringify(Array.from(this.messageQueue.entries()))
      );
      
      await AsyncStorage.setItem(
        'seenMessageIds', 
        JSON.stringify(Array.from(this.seenMessageIds))
      );
    } catch (error) {
      console.error('Error persisting data:', error);
    }
  }

  /**
   * Set up network event handlers
   */
  setupNetworkEventHandlers() {
    // Handle incoming messages
    this.meshNetwork.onMessageReceived = (message, protocol) => {
      this.handleIncomingMessage(message, protocol);
    };

    // Handle device connections
    this.meshNetwork.onDeviceConnected = (device) => {
      this.onDeviceConnected(device);
    };

    // Handle device disconnections
    this.meshNetwork.onDeviceDisconnected = (device) => {
      this.onDeviceDisconnected(device);
    };
  }

  /**
   * Start periodic tasks (cleanup, forwarding, etc.)
   */
  startPeriodicTasks() {
    // Cleanup old messages every 10 minutes
    setInterval(() => {
      this.cleanupOldMessages();
    }, 10 * 60 * 1000);

    // Attempt message forwarding every 30 seconds
    setInterval(() => {
      this.attemptMessageForwarding();
    }, 30 * 1000);

    // Persist data every 5 minutes
    setInterval(() => {
      this.persistData();
    }, 5 * 60 * 1000);

    // Update super relay status every minute
    setInterval(() => {
      this.updateSuperRelayStatus();
    }, 60 * 1000);
  }

  /**
   * Create and send a new message
   */
  async sendMessage(recipientId, content, messageType = 'text') {
    try {
      // Create message structure
      const message = {
        id: uuid.v4(),
        senderId: await this.getDeviceId(),
        recipientId: recipientId,
        content: content,
        type: messageType,
        timestamp: Date.now(),
        ttl: this.maxTTL,
        hops: 0,
        routingPath: [],
        encrypted: false,
        deliveryStatus: 'pending'
      };

      // Encrypt message content
      const encryptedContent = await this.signalProtocol.encryptMessage(
        recipientId, 
        JSON.stringify({
          content: content,
          type: messageType,
          timestamp: message.timestamp
        })
      );

      message.content = encryptedContent;
      message.encrypted = true;

      // Add to sent messages
      this.sentMessages.set(message.id, message);
      
      // Add to forwarding queue
      this.messageQueue.set(message.id, message);
      
      // Mark as seen to prevent receiving our own message
      this.seenMessageIds.add(message.id);

      // Attempt immediate forwarding
      await this.forwardMessage(message);

      console.log(`Message created and queued for forwarding: ${message.id}`);
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message from network
   */
  async handleIncomingMessage(networkMessage, protocol) {
    try {
      const message = this.parseNetworkMessage(networkMessage);
      
      // Check if we've seen this message before
      if (this.seenMessageIds.has(message.id)) {
        console.log(`Duplicate message ignored: ${message.id}`);
        return;
      }

      // Add to seen messages
      this.seenMessageIds.add(message.id);

      // Check if message is for us
      const deviceId = await this.getDeviceId();
      if (message.recipientId === deviceId) {
        await this.processMessageForSelf(message);
      } else {
        // Message is not for us, consider forwarding
        await this.considerForwarding(message);
      }

      console.log(`Processed incoming message: ${message.id}`);
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  /**
   * Process message intended for this device
   */
  async processMessageForSelf(message) {
    try {
      // Decrypt message if encrypted
      if (message.encrypted) {
        const decryptedData = await this.signalProtocol.decryptMessage(
          message.senderId,
          message.content
        );
        
        const originalContent = JSON.parse(decryptedData);
        message.content = originalContent.content;
        message.type = originalContent.type;
        message.originalTimestamp = originalContent.timestamp;
        message.encrypted = false;
      }

      // Add to received messages
      this.receivedMessages.set(message.id, {
        ...message,
        receivedAt: Date.now(),
        deliveryStatus: 'delivered'
      });

      // Send delivery confirmation if possible
      await this.sendDeliveryConfirmation(message);

      console.log(`Message delivered to self: ${message.id}`);
      
      // Notify UI about new message
      if (this.onMessageDelivered) {
        this.onMessageDelivered(message);
      }
    } catch (error) {
      console.error('Error processing message for self:', error);
    }
  }

  /**
   * Consider forwarding a message not intended for us
   */
  async considerForwarding(message) {
    // Check TTL
    if (message.ttl <= 0) {
      console.log(`Message TTL expired: ${message.id}`);
      return;
    }

    // Check message age
    const messageAge = Date.now() - message.timestamp;
    if (messageAge > this.maxMessageAge) {
      console.log(`Message too old: ${message.id}`);
      return;
    }

    // Probabilistic forwarding (except for super relays)
    if (!this.isSuperRelay && Math.random() > this.forwardingProbability) {
      console.log(`Message not forwarded (probability): ${message.id}`);
      return;
    }

    // Add to forwarding queue
    const forwardMessage = {
      ...message,
      ttl: message.ttl - 1,
      hops: message.hops + 1,
      routingPath: [...message.routingPath, await this.getDeviceId()]
    };

    this.messageQueue.set(forwardMessage.id, forwardMessage);
    console.log(`Message queued for forwarding: ${forwardMessage.id}`);
  }

  /**
   * Forward a specific message to connected devices
   */
  async forwardMessage(message) {
    try {
      const connectedDevices = this.meshNetwork.getConnectedDevices();
      if (connectedDevices.length === 0) {
        console.log('No connected devices to forward message to');
        return;
      }

      const networkMessage = this.createNetworkMessage(message);
      const results = await this.meshNetwork.broadcastMessage(networkMessage);

      let successCount = 0;
      results.forEach(result => {
        if (result.success) {
          successCount++;
        }
      });

      console.log(`Message forwarded to ${successCount}/${results.length} devices`);
      
      // Update message status if it's one we sent
      if (this.sentMessages.has(message.id)) {
        const sentMessage = this.sentMessages.get(message.id);
        sentMessage.deliveryStatus = successCount > 0 ? 'forwarded' : 'pending';
        sentMessage.forwardedTo = results.filter(r => r.success).map(r => r.deviceId);
      }

      return successCount;
    } catch (error) {
      console.error('Error forwarding message:', error);
      return 0;
    }
  }

  /**
   * Attempt to forward all queued messages
   */
  async attemptMessageForwarding() {
    if (this.messageQueue.size === 0) {
      return;
    }

    console.log(`Attempting to forward ${this.messageQueue.size} queued messages`);
    
    const messagesToForward = Array.from(this.messageQueue.values());
    for (const message of messagesToForward) {
      const forwardedCount = await this.forwardMessage(message);
      
      // Remove from queue if successfully forwarded or TTL expired
      if (forwardedCount > 0 || message.ttl <= 0) {
        this.messageQueue.delete(message.id);
      }
    }
  }

  /**
   * Send delivery confirmation back to sender
   */
  async sendDeliveryConfirmation(message) {
    try {
      const confirmation = {
        id: uuid.v4(),
        type: 'delivery_confirmation',
        originalMessageId: message.id,
        senderId: await this.getDeviceId(),
        recipientId: message.senderId,
        timestamp: Date.now(),
        ttl: Math.min(5, this.maxTTL), // Lower TTL for confirmations
        hops: 0,
        routingPath: [],
        encrypted: false
      };

      this.messageQueue.set(confirmation.id, confirmation);
      this.seenMessageIds.add(confirmation.id);
      
      console.log(`Delivery confirmation queued: ${confirmation.id}`);
    } catch (error) {
      console.error('Error sending delivery confirmation:', error);
    }
  }

  /**
   * Clean up old messages and seen IDs
   */
  cleanupOldMessages() {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean up message queue
    for (const [messageId, message] of this.messageQueue) {
      if (now - message.timestamp > this.maxMessageAge || message.ttl <= 0) {
        this.messageQueue.delete(messageId);
        cleanedCount++;
      }
    }

    // Limit seen message IDs (keep only recent ones)
    if (this.seenMessageIds.size > 10000) {
      const seenArray = Array.from(this.seenMessageIds);
      this.seenMessageIds = new Set(seenArray.slice(-5000));
    }

    // Limit queue size
    if (this.messageQueue.size > this.maxQueueSize) {
      const messages = Array.from(this.messageQueue.entries())
        .sort(([,a], [,b]) => b.timestamp - a.timestamp)
        .slice(0, this.maxQueueSize);
      this.messageQueue = new Map(messages);
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old messages`);
    }
  }

  /**
   * Update super relay status based on connections
   */
  updateSuperRelayStatus() {
    const connectedCount = this.meshNetwork.getConnectedDevices().length;
    const wasSuperRelay = this.isSuperRelay;
    
    this.isSuperRelay = connectedCount >= this.superRelayThreshold;
    
    if (this.isSuperRelay !== wasSuperRelay) {
      console.log(`Super relay status changed: ${this.isSuperRelay}`);
    }
  }

  /**
   * Create network message format
   */
  createNetworkMessage(message) {
    return {
      protocol: 'MeshMessenger',
      version: '1.0',
      messageId: message.id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content,
      type: message.type,
      timestamp: message.timestamp,
      ttl: message.ttl,
      hops: message.hops,
      routingPath: message.routingPath,
      encrypted: message.encrypted
    };
  }

  /**
   * Parse network message format
   */
  parseNetworkMessage(networkMessage) {
    return {
      id: networkMessage.messageId,
      senderId: networkMessage.senderId,
      recipientId: networkMessage.recipientId,
      content: networkMessage.content,
      type: networkMessage.type,
      timestamp: networkMessage.timestamp,
      ttl: networkMessage.ttl,
      hops: networkMessage.hops,
      routingPath: networkMessage.routingPath || [],
      encrypted: networkMessage.encrypted || false
    };
  }

  /**
   * Get unique device ID
   */
  async getDeviceId() {
    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = uuid.v4();
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /**
   * Handle device connection
   */
  onDeviceConnected(device) {
    console.log(`Device connected: ${device.id}`);
    // Attempt to forward queued messages to new device
    setTimeout(() => {
      this.attemptMessageForwarding();
    }, 1000);
  }

  /**
   * Handle device disconnection
   */
  onDeviceDisconnected(device) {
    console.log(`Device disconnected: ${device.id}`);
  }

  /**
   * Get message statistics
   */
  getStatistics() {
    return {
      queuedMessages: this.messageQueue.size,
      sentMessages: this.sentMessages.size,
      receivedMessages: this.receivedMessages.size,
      seenMessages: this.seenMessageIds.size,
      isSuperRelay: this.isSuperRelay,
      connectedDevices: this.meshNetwork.getConnectedDevices().length
    };
  }

  /**
   * Get all messages for a specific conversation
   */
  getConversation(otherDeviceId) {
    const messages = [];
    
    // Add sent messages
    for (const message of this.sentMessages.values()) {
      if (message.recipientId === otherDeviceId) {
        messages.push({ ...message, direction: 'sent' });
      }
    }
    
    // Add received messages
    for (const message of this.receivedMessages.values()) {
      if (message.senderId === otherDeviceId) {
        messages.push({ ...message, direction: 'received' });
      }
    }
    
    // Sort by timestamp
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  }
}

export default MessageRouter;