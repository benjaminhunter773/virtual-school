/**
 * Home Screen - Main dashboard showing mesh network status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useMesh } from '../context/MeshContext';

const HomeScreen = ({ navigation }) => {
  const { meshNetwork, messageRouter } = useMesh();
  const [recentMessages, setRecentMessages] = useState([]);
  const [networkStats, setNetworkStats] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (messageRouter) {
      loadRecentMessages();
      loadNetworkStats();
      
      // Set up message delivery handler
      messageRouter.onMessageDelivered = (message) => {
        loadRecentMessages();
      };
    }
  }, [messageRouter]);

  const loadRecentMessages = () => {
    if (!messageRouter) return;
    
    // Get recent messages from all conversations
    const allMessages = [];
    const conversations = new Set();
    
    // Collect unique conversation partners
    for (const message of messageRouter.sentMessages.values()) {
      conversations.add(message.recipientId);
    }
    for (const message of messageRouter.receivedMessages.values()) {
      conversations.add(message.senderId);
    }
    
    // Get latest message from each conversation
    conversations.forEach(partnerId => {
      const conversation = messageRouter.getConversation(partnerId);
      if (conversation.length > 0) {
        allMessages.push({
          ...conversation[conversation.length - 1],
          partnerId,
        });
      }
    });
    
    // Sort by timestamp (most recent first)
    allMessages.sort((a, b) => b.timestamp - a.timestamp);
    
    setRecentMessages(allMessages.slice(0, 10)); // Show only 10 most recent
  };

  const loadNetworkStats = () => {
    if (!messageRouter) return;
    
    const stats = messageRouter.getStatistics();
    setNetworkStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadRecentMessages();
    loadNetworkStats();
    setRefreshing(false);
  };

  const navigateToDevices = () => {
    navigation.navigate('Devices');
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  const openChat = (partnerId, partnerName) => {
    navigation.navigate('Chat', {
      deviceId: partnerId,
      deviceName: partnerName || 'Unknown Device',
    });
  };

  const renderMessageItem = ({ item }) => {
    const isOutgoing = item.direction === 'sent';
    const partnerName = item.partnerId.substring(0, 8) + '...';
    
    return (
      <TouchableOpacity
        style={styles.messageItem}
        onPress={() => openChat(item.partnerId, partnerName)}
      >
        <View style={styles.messageHeader}>
          <Text style={styles.partnerName}>{partnerName}</Text>
          <Text style={styles.messageTime}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.messageContent}>
          <Icon
            name={isOutgoing ? 'send' : 'inbox'}
            size={16}
            color={isOutgoing ? '#4CAF50' : '#2196F3'}
            style={styles.messageIcon}
          />
          <Text style={styles.messageText} numberOfLines={1}>
            {typeof item.content === 'string' ? item.content : 'Encrypted message'}
          </Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(item.deliveryStatus) }
          ]} />
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'forwarded': return '#FF9800';
      case 'pending': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const renderStatsCard = (title, value, icon, color) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={24} color={color} />
      <View style={styles.statsContent}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesh Network Status</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={navigateToDevices}
          >
            <Icon name="devices" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={navigateToSettings}
          >
            <Icon name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Network Statistics */}
      <View style={styles.statsContainer}>
        {renderStatsCard(
          'Connected',
          networkStats.connectedDevices || 0,
          'device-hub',
          '#4CAF50'
        )}
        {renderStatsCard(
          'Queued',
          networkStats.queuedMessages || 0,
          'schedule',
          '#FF9800'
        )}
        {renderStatsCard(
          'Sent',
          networkStats.sentMessages || 0,
          'send',
          '#2196F3'
        )}
        {renderStatsCard(
          'Received',
          networkStats.receivedMessages || 0,
          'inbox',
          '#9C27B0'
        )}
      </View>

      {/* Super Relay Status */}
      {networkStats.isSuperRelay && (
        <View style={styles.superRelayBanner}>
          <Icon name="router" size={20} color="#fff" />
          <Text style={styles.superRelayText}>Super Relay Active</Text>
        </View>
      )}

      {/* Recent Messages */}
      <View style={styles.messagesContainer}>
        <Text style={styles.sectionTitle}>Recent Messages</Text>
        <FlatList
          data={recentMessages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="message" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Start a conversation with nearby devices
              </Text>
            </View>
          }
        />
      </View>

      {/* Start Chat FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={navigateToDevices}
      >
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsContent: {
    marginLeft: 12,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statsTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  superRelayBanner: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 4,
  },
  superRelayText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  messageItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
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
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default HomeScreen;