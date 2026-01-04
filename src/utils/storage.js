/**
 * AsyncStorage Utility
 * 
 * Features:
 * - Promise-based async storage wrapper
 * - Type-safe storage with JSON serialization
 * - Error handling
 * 
 * Uses:
 * - Token storage (auth)
 * - User preferences
 * - Cache management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@anima_auth_token',
  USER_KEY: '@anima_user_key',
  USER_ID: '@anima_user_id',
  USER_EMAIL: '@anima_user_email',
  LANGUAGE: '@anima_language',
  THEME: '@anima_theme',
  FIRST_LAUNCH: '@anima_first_launch',
  PERSONA_COMMENT_READ_PREFIX: '@anima_persona_comment_read_', // ⭐ NEW: For SAGE/NEXUS (1:N personas)
};

/**
 * Get item from AsyncStorage
 * @param {string} key - Storage key
 * @returns {Promise<string|null>} - Stored value or null
 */
export const getItem = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    console.error(`[Storage] Error getting ${key}:`, error);
    return null;
  }
};

/**
 * Get JSON item from AsyncStorage
 * @param {string} key - Storage key
 * @returns {Promise<any|null>} - Parsed JSON or null
 */
export const getJsonItem = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`[Storage] Error getting JSON ${key}:`, error);
    return null;
  }
};

/**
 * Set item to AsyncStorage
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @returns {Promise<boolean>} - Success status
 */
export const setItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`[Storage] Error setting ${key}:`, error);
    return false;
  }
};

/**
 * Set JSON item to AsyncStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified)
 * @returns {Promise<boolean>} - Success status
 */
export const setJsonItem = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`[Storage] Error setting JSON ${key}:`, error);
    return false;
  }
};

/**
 * Remove item from AsyncStorage
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} - Success status
 */
export const removeItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[Storage] Error removing ${key}:`, error);
    return false;
  }
};

/**
 * Clear all AsyncStorage items
 * @returns {Promise<boolean>} - Success status
 */
export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing all:', error);
    return false;
  }
};

/**
 * Get auth token from storage
 * @returns {Promise<string|null>} - Auth token or null
 */
export const getAuthToken = async () => {
  return await getItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Set auth token to storage
 * @param {string} token - Auth token
 * @returns {Promise<boolean>} - Success status
 */
export const setAuthToken = async (token) => {
  return await setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

/**
 * Remove auth token from storage
 * @returns {Promise<boolean>} - Success status
 */
export const removeAuthToken = async () => {
  return await removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Get user key from storage
 * @returns {Promise<string|null>} - User key or null
 */
export const getUserKey = async () => {
  return await getItem(STORAGE_KEYS.USER_KEY);
};

/**
 * Set user key to storage
 * @param {string} userKey - User key
 * @returns {Promise<boolean>} - Success status
 */
export const setUserKey = async (userKey) => {
  return await setItem(STORAGE_KEYS.USER_KEY, userKey);
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ⭐ Persona Comment Read Status (for SAGE/NEXUS - 1:N personas)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * SAGE and NEXUS are shared personas (1:N relationship).
 * We cannot use DB's persona_comment_checked for them.
 * Instead, we store read status in AsyncStorage per user.
 */

/**
 * Mark persona comment as read in AsyncStorage
 * @param {string} userKey - User key
 * @param {string} personaKey - Persona key (SAGE/NEXUS)
 * @returns {Promise<boolean>} - Success status
 */
export const setPersonaCommentRead = async (userKey, personaKey) => {
  try {
    const key = `${STORAGE_KEYS.PERSONA_COMMENT_READ_PREFIX}${userKey}_${personaKey}`;
    await AsyncStorage.setItem(key, 'Y');
    console.log(`✅ [Storage] Persona comment marked as read: ${personaKey}`);
    return true;
  } catch (error) {
    console.error(`[Storage] Error setting persona comment read:`, error);
    return false;
  }
};

/**
 * Check if persona comment has been read
 * @param {string} userKey - User key
 * @param {string} personaKey - Persona key (SAGE/NEXUS)
 * @returns {Promise<boolean>} - True if read, false if unread
 */
export const isPersonaCommentRead = async (userKey, personaKey) => {
  try {
    const key = `${STORAGE_KEYS.PERSONA_COMMENT_READ_PREFIX}${userKey}_${personaKey}`;
    const value = await AsyncStorage.getItem(key);
    return value === 'Y';
  } catch (error) {
    console.error(`[Storage] Error checking persona comment read:`, error);
    return false; // Default to unread on error
  }
};

/**
 * Remove persona comment read status (for testing/reset)
 * @param {string} userKey - User key
 * @param {string} personaKey - Persona key (SAGE/NEXUS)
 * @returns {Promise<boolean>} - Success status
 */
export const removePersonaCommentRead = async (userKey, personaKey) => {
  try {
    const key = `${STORAGE_KEYS.PERSONA_COMMENT_READ_PREFIX}${userKey}_${personaKey}`;
    await AsyncStorage.removeItem(key);
    console.log(`🗑️ [Storage] Persona comment read status removed: ${personaKey}`);
    return true;
  } catch (error) {
    console.error(`[Storage] Error removing persona comment read:`, error);
    return false;
  }
};

export default {
  getItem,
  getJsonItem,
  setItem,
  setJsonItem,
  removeItem,
  clearAll,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getUserKey,
  setUserKey,
  setPersonaCommentRead,
  isPersonaCommentRead,
  removePersonaCommentRead,
  STORAGE_KEYS,
};

