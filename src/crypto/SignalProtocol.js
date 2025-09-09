/**
 * Signal Protocol Implementation for End-to-End Encryption
 * Uses X3DH (Extended Triple Diffie-Hellman) for key agreement
 * and Double Ratchet for message encryption
 */

import * as libsignal from 'libsignal-protocol-javascript';
import CryptoJS from 'react-native-crypto-js';
import { randomBytes } from 'react-native-randombytes';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SignalProtocol {
  constructor() {
    this.store = new SignalProtocolStore();
    this.registrationId = null;
    this.identityKeyPair = null;
    this.preKeys = [];
    this.signedPreKey = null;
  }

  /**
   * Initialize the Signal protocol for this device
   * Generate identity keys, prekeys, and signed prekey
   */
  async initialize() {
    try {
      // Generate registration ID
      this.registrationId = libsignal.KeyHelper.generateRegistrationId();
      
      // Generate identity key pair
      this.identityKeyPair = await libsignal.KeyHelper.generateIdentityKeyPair();
      
      // Store identity key pair
      await this.store.put('identityKey', this.identityKeyPair);
      await this.store.put('registrationId', this.registrationId);
      
      // Generate prekeys (batch of 100)
      const preKeys = await libsignal.KeyHelper.generatePreKeys(0, 100);
      this.preKeys = preKeys;
      
      // Store prekeys
      for (const preKey of preKeys) {
        await this.store.storePreKey(preKey.keyId, preKey.keyPair);
      }
      
      // Generate signed prekey
      this.signedPreKey = await libsignal.KeyHelper.generateSignedPreKey(
        this.identityKeyPair, 
        0
      );
      
      // Store signed prekey
      await this.store.storeSignedPreKey(0, this.signedPreKey.keyPair);
      
      console.log('Signal Protocol initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Signal Protocol:', error);
      return false;
    }
  }

  /**
   * Get public key bundle for key exchange
   * This is shared with other devices to establish encrypted sessions
   */
  async getPublicKeyBundle() {
    if (!this.identityKeyPair) {
      await this.loadStoredKeys();
    }

    return {
      registrationId: this.registrationId,
      identityKey: this.identityKeyPair.pubKey,
      signedPreKey: {
        keyId: this.signedPreKey.keyId,
        publicKey: this.signedPreKey.keyPair.pubKey,
        signature: this.signedPreKey.signature
      },
      preKey: {
        keyId: this.preKeys[0].keyId,
        publicKey: this.preKeys[0].keyPair.pubKey
      }
    };
  }

  /**
   * Load stored keys from device storage
   */
  async loadStoredKeys() {
    try {
      this.identityKeyPair = await this.store.get('identityKey');
      this.registrationId = await this.store.get('registrationId');
      
      if (!this.identityKeyPair || !this.registrationId) {
        await this.initialize();
      }
    } catch (error) {
      console.error('Error loading stored keys:', error);
      await this.initialize();
    }
  }

  /**
   * Process prekey bundle from another device and create session
   */
  async processPreKeyBundle(recipientId, preKeyBundle) {
    try {
      const address = new libsignal.SignalProtocolAddress(recipientId, 1);
      
      // Build session from prekey bundle
      const sessionBuilder = new libsignal.SessionBuilder(this.store, address);
      await sessionBuilder.processPreKey(preKeyBundle);
      
      console.log(`Session established with ${recipientId}`);
      return true;
    } catch (error) {
      console.error('Error processing prekey bundle:', error);
      return false;
    }
  }

  /**
   * Encrypt message for specific recipient
   */
  async encryptMessage(recipientId, message) {
    try {
      const address = new libsignal.SignalProtocolAddress(recipientId, 1);
      const sessionCipher = new libsignal.SessionCipher(this.store, address);
      
      const ciphertext = await sessionCipher.encrypt(message);
      
      return {
        type: ciphertext.type,
        body: ciphertext.body,
        registrationId: ciphertext.registrationId
      };
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw error;
    }
  }

  /**
   * Decrypt message from specific sender
   */
  async decryptMessage(senderId, ciphertext) {
    try {
      const address = new libsignal.SignalProtocolAddress(senderId, 1);
      const sessionCipher = new libsignal.SessionCipher(this.store, address);
      
      let plaintext;
      if (ciphertext.type === 3) { // PreKeyWhisperMessage
        plaintext = await sessionCipher.decryptPreKeyWhisperMessage(ciphertext.body);
      } else { // WhisperMessage
        plaintext = await sessionCipher.decryptWhisperMessage(ciphertext.body);
      }
      
      return plaintext;
    } catch (error) {
      console.error('Error decrypting message:', error);
      throw error;
    }
  }

  /**
   * Generate message authentication code for integrity
   */
  generateMAC(message, key) {
    return CryptoJS.HmacSHA256(message, key).toString();
  }

  /**
   * Verify message authentication code
   */
  verifyMAC(message, mac, key) {
    const expectedMAC = this.generateMAC(message, key);
    return expectedMAC === mac;
  }
}

/**
 * Signal Protocol Store Implementation
 * Handles storage of keys and session data
 */
class SignalProtocolStore {
  constructor() {
    this.store = {};
  }

  async get(key, defaultValue) {
    try {
      const value = await AsyncStorage.getItem(`signal_${key}`);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Error getting from store:', error);
      return defaultValue;
    }
  }

  async put(key, value) {
    try {
      await AsyncStorage.setItem(`signal_${key}`, JSON.stringify(value));
      return Promise.resolve();
    } catch (error) {
      console.error('Error putting to store:', error);
      return Promise.reject(error);
    }
  }

  async remove(key) {
    try {
      await AsyncStorage.removeItem(`signal_${key}`);
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing from store:', error);
      return Promise.reject(error);
    }
  }

  // Identity Key Store
  async getIdentityKeyPair() {
    return this.get('identityKey');
  }

  async getLocalRegistrationId() {
    return this.get('registrationId');
  }

  async saveIdentity(identifier, identityKey) {
    const existing = await this.get(`identity_${identifier}`);
    await this.put(`identity_${identifier}`, identityKey);
    return existing !== identityKey;
  }

  async isTrustedIdentity(identifier, identityKey, direction) {
    const trusted = await this.get(`identity_${identifier}`);
    return trusted === null || trusted === identityKey;
  }

  // PreKey Store
  async loadPreKey(keyId) {
    return this.get(`prekey_${keyId}`);
  }

  async storePreKey(keyId, keyPair) {
    return this.put(`prekey_${keyId}`, keyPair);
  }

  async removePreKey(keyId) {
    return this.remove(`prekey_${keyId}`);
  }

  // Signed PreKey Store
  async loadSignedPreKey(keyId) {
    return this.get(`signed_prekey_${keyId}`);
  }

  async storeSignedPreKey(keyId, keyPair) {
    return this.put(`signed_prekey_${keyId}`, keyPair);
  }

  async removeSignedPreKey(keyId) {
    return this.remove(`signed_prekey_${keyId}`);
  }

  // Session Store
  async loadSession(identifier) {
    return this.get(`session_${identifier}`);
  }

  async storeSession(identifier, record) {
    return this.put(`session_${identifier}`, record);
  }

  async removeSession(identifier) {
    return this.remove(`session_${identifier}`);
  }

  async removeAllSessions(identifier) {
    // In a real implementation, you'd iterate through all sessions
    // for the given identifier and remove them
    return this.remove(`session_${identifier}`);
  }

  async getDeviceIds(identifier) {
    return this.get(`devices_${identifier}`, []);
  }
}

export default SignalProtocol;