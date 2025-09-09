/**
 * Chat Screen - Individual conversation interface
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useMesh } from '../context/MeshContext';

const ChatScreen = ({ route, navigation }) => {
  const { deviceId, deviceName } = route.params;
  const { messageRouter } = useMesh();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (messageRouter) {
      loadMessages();
      
      // Set up message delivery handler
      messageRouter.onMessageDelivered = (message) => {
        if (message.senderId === deviceId) {
          loadMessages();
        }
      };
    }
  }, [messageRouter, deviceId]);

  useEffect(() => {
    // Check if device is connected
    if (messageRouter && messageRouter.meshNetwork) {
      const connectedDevices = messageRouter.meshNetwork.getConnectedDevices();
      const connected = connectedDevices.some(device => device.id === deviceId);
      setIsConnected(connected);
    }
  }, [messageRouter, deviceId]);

  const loadMessages = () => {
    if (!messageRouter) return;
    
    const conversation = messageRouter.getConversation(deviceId);
    setMessages(conversation);
    
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      if (flatListRef.current && conversation.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !messageRouter) {
      return;
    }

    try {
      const message = await messageRouter.sendMessage(deviceId, inputText.trim());
      setInputText('');
      loadMessages();
      
      // Show success feedback
      if (message) {
        console.log('Message sent:', message.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Send Error',
        'Failed to send message. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const getMessageStatusIcon = (message) => {
    if (message.direction !== 'sent') return null;
    
    switch (message.deliveryStatus) {
      case 'delivered':
        return <Icon name="done-all" size={16} color="#4CAF50" />;
      case 'forwarded':
        return <Icon name="done" size={16} color="#FF9800" />;
      case 'pending':
        return <Icon name="schedule" size={16} color="#9E9E9E" />;
      default:
        return <Icon name="schedule" size={16} color="#9E9E9E" />;
    }
  };

  const getMessageStatusText = (message) => {
    if (message.direction !== 'sent') return '';
    
    switch (message.deliveryStatus) {
      case 'delivered': return 'Delivered';
      case 'forwarded': return 'Forwarded';
      case 'pending': return 'Pending';
      default: return 'Sending';
    }
  };

  const renderMessage = ({ item, index }) => {
    const isOutgoing = item.direction === 'sent';
    const showTimestamp = index === 0 || 
      (messages[index - 1] && 
       new Date(item.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000); // 5 minutes

    return (
      <View style={styles.messageContainer}>
        {showTimestamp && (
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        )}
        <View style={[
          styles.messageBubble,
          isOutgoing ? styles.outgoingBubble : styles.incomingBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOutgoing ? styles.outgoingText : styles.incomingText
          ]}>
            {typeof item.content === 'string' ? item.content : 'Encrypted message'}
          </Text>
          
          {item.encrypted && (
            <View style={styles.encryptionBadge}>
              <Icon name="lock" size={12} color="#4CAF50" />
            </View>
          )}
          
          {isOutgoing && (
            <View style={styles.messageStatus}>
              {getMessageStatusIcon(item)}
              <Text style={styles.statusText}>
                {getMessageStatusText(item)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Connection Status */}
      <View style={[
        styles.connectionStatus,
        { backgroundColor: isConnected ? '#4CAF50' : '#FF9800' }
      ]}>
        <Icon
          name={isConnected ? 'wifi' : 'wifi-off'}
          size={16}
          color="#fff"
        />
        <Text style={styles.connectionText}>
          {isConnected ? 'Connected directly' : 'Routing through mesh'}
        </Text>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="message" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Send a message to start the conversation
            </Text>
            <View style={styles.encryptionInfo}>
              <Icon name="lock" size={16} color="#4CAF50" />
              <Text style={styles.encryptionText}>
                Messages are end-to-end encrypted
              </Text>
            </View>
          </View>
        }
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { opacity: inputText.trim() ? 1 : 0.5 }
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Mesh Info */}
      <View style={styles.meshInfo}>
        <Text style={styles.meshInfoText}>
          Messages are forwarded through the mesh network
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  timestamp: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    position: 'relative',
  },
  outgoingBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  incomingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  outgoingText: {
    color: '#fff',
  },
  incomingText: {
    color: '#333',
  },
  encryptionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    marginLeft: 4,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  meshInfo: {
    backgroundColor: '#fff',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  meshInfoText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
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
  },
  encryptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  encryptionText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ChatScreen;