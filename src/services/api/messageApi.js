/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💌 Message API Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles all message-related API calls
 * 
 * Features:
 * - Message creation/update/deletion
 * - Message content validation (LLM-based)
 * - Message sharing
 * - Message favorites
 * - Consistent with api.config.js structure
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-15
 */

import apiClient from './apiClient';
import { MESSAGE_ENDPOINTS } from '../../config/api.config';
import { logError } from './errorHandler';

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🛡️ Validate Message Content (LLM-based Safety Check)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Uses Claude 3.5 Sonnet via OpenRouter to perform content safety validation.
 * The LLM checks for inappropriate themes (violence, sexual content, hate speech, etc.)
 * and generates empathetic feedback messages in the user's language.
 * 
 * @param {string} messageContent - Message content to validate
 * @returns {Promise<Object>} Validation result
 * @returns {boolean} result.safe - Whether the content is safe
 * @returns {string} result.category - Category of violation (if unsafe)
 * @returns {Object} result.feedback - LLM-generated feedback message
 * @returns {string} result.feedback.title - Emotional title (15 chars max)
 * @returns {string} result.feedback.message - Empathetic feedback message (3-4 lines)
 * 
 * @example
 * const result = await validateMessage("안녕하세요!");
 * if (result.safe) {
 *   // Proceed with message creation
 * } else {
 *   // Show feedback: result.feedback.title, result.feedback.message
 * }
 */
export const validateMessage = async (messageContent) => {
  try {
    if (__DEV__) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🛡️ [MessageAPI] Validating message content');
      console.log('   Length:', messageContent?.length || 0);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    const response = await apiClient.post(MESSAGE_ENDPOINTS.VALIDATE, {
      message_content: messageContent,
    });
    
    if (__DEV__) {
      console.log('✅ [MessageAPI] Validation result:');
      console.log('   Safe:', response.data?.safe);
      console.log('   Category:', response.data?.category);
      console.log('   Has feedback:', !!response.data?.feedback);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    return response.data || { 
      safe: true, // Fail-safe: Allow message if API fails
      feedback: {
        title: '메시지 검증 오류',
        message: '메시지 검증 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }
    };
  } catch (error) {
    if (__DEV__) {
      console.error('❌ [MessageAPI] Message validation error:', error);
    }
    logError('Message Validation', error);
    
    // ⭐ Fail-safe: Return safe=true on error to avoid blocking users
    return {
      safe: true,
      feedback: {
        title: '메시지 검증 오류',
        message: '메시지 검증 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }
    };
  }
};

/**
 * Create a new message
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} Creation result
 */
export const createMessage = async (messageData) => {
  try {
    const response = await apiClient.post(MESSAGE_ENDPOINTS.CREATE, messageData);
    return response.data || {};
  } catch (error) {
    if (__DEV__) {
      console.error('💌 [MessageAPI] Error creating message:', error);
    }
    logError('Message Creation', error);
    throw error;
  }
};

/**
 * Get message list
 * @param {string} userKey - User's unique key
 * @returns {Promise<Array>} List of messages
 */
export const getMessageList = async (userKey) => {
  try {
    const response = await apiClient.post(MESSAGE_ENDPOINTS.LIST, {
      user_key: userKey,
    });
    return response.data || [];
  } catch (error) {
    if (__DEV__) {
      console.error('💌 [MessageAPI] Error fetching message list:', error);
    }
    logError('Message List', error);
    throw error;
  }
};

/**
 * Delete a message
 * @param {string} messageKey - Message's unique key
 * @param {string} userKey - User's unique key
 * @returns {Promise<Object>} Deletion result
 */
export const deleteMessage = async (messageKey, userKey) => {
  try {
    const response = await apiClient.post(MESSAGE_ENDPOINTS.DELETE, {
      message_key: messageKey,
      user_key: userKey,
    });
    return response.data || {};
  } catch (error) {
    if (__DEV__) {
      console.error('💌 [MessageAPI] Error deleting message:', error);
    }
    logError('Message Deletion', error);
    throw error;
  }
};

/**
 * Toggle message favorite
 * @param {string} messageKey - Message's unique key
 * @param {string} userKey - User's unique key
 * @returns {Promise<Object>} Toggle result
 */
export const toggleMessageFavorite = async (messageKey, userKey) => {
  try {
    const response = await apiClient.post(MESSAGE_ENDPOINTS.FAVORITE, {
      message_key: messageKey,
      user_key: userKey,
    });
    return response.data || {};
  } catch (error) {
    if (__DEV__) {
      console.error('💌 [MessageAPI] Error toggling favorite:', error);
    }
    logError('Toggle Message Favorite', error);
    throw error;
  }
};

export default {
  validateMessage, // ⭐ Primary export for MessageCreationOverlay
  createMessage,
  getMessageList,
  deleteMessage,
  toggleMessageFavorite,
};
