/**
 * Chat API Service
 * 
 * Features:
 * - Manager AI chat
 * - Persona chat
 * - Memory chat
 * - Public AI chat
 * 
 * Uses:
 * - Manager AI (SAGE) communication
 * - Persona chat interface
 * - Memory-based conversations
 */

import apiClient from './apiClient';
import { CHAT_ENDPOINTS } from '../../config/api.config';
import { logError } from './errorHandler';

/**
 * Send message to Manager AI (SAGE)
 * @param {Object} params - Request parameters
 * @param {string} params.question - User's question
 * @param {string} params.user_key - User key (optional if logged in)
 * @returns {Promise<Object>} - AI response
 */
export const sendManagerAIMessage = async ({ question, user_key }) => {
  try {
    const response = await apiClient.post(CHAT_ENDPOINTS.MANAGER_QUESTION, {
      question,
      user_key,
    });

    console.log('response', response);
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logError('Manager AI Chat', error);
    return {
      success: false,
      error: error.response?.data || { error_code: 'MANAGER_AI_ERROR' },
    };
  }
};

/**
 * Send message to Persona AI
 * @param {Object} params - Request parameters
 * @param {string} params.persona_key - Persona key
 * @param {string} params.question - User's question
 * @param {string} params.user_key - User key
 * @returns {Promise<Object>} - AI response
 */
export const sendPersonaMessage = async ({ persona_key, question, user_key }) => {
  try {
    const response = await apiClient.post(CHAT_ENDPOINTS.PERSONA_CHAT, {
      persona_key,
      question,
      user_key,
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logError('Persona Chat', error);
    return {
      success: false,
      error: error.response?.data || { error_code: 'PERSONA_CHAT_ERROR' },
    };
  }
};

/**
 * Send message to Memory-based AI chat
 * @param {Object} params - Request parameters
 * @param {string} params.history_key - Memory history key
 * @param {string} params.persona_key - Persona key
 * @param {string} params.question - User's question
 * @param {string} params.user_key - User key
 * @returns {Promise<Object>} - AI response
 */
export const sendMemoryMessage = async ({ history_key, persona_key, question, user_key }) => {
  try {
    const response = await apiClient.post(CHAT_ENDPOINTS.MEMORY_CHAT, {
      history_key,
      persona_key,
      question,
      user_key,
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logError('Memory Chat', error);
    return {
      success: false,
      error: error.response?.data || { error_code: 'MEMORY_CHAT_ERROR' },
    };
  }
};

/**
 * Send message to Public AI (Peek page)
 * @param {Object} params - Request parameters
 * @param {string} params.persona_key - Persona key
 * @param {string} params.question - User's question
 * @param {string} params.session_id - Session ID (optional)
 * @returns {Promise<Object>} - AI response
 */
export const sendPublicAIMessage = async ({ persona_key, question, session_id }) => {
  try {

    console.log('sendPublicAIMessage', { persona_key, question, session_id });
    const response = await apiClient.post(CHAT_ENDPOINTS.PUBLIC_AI, {
      persona_key,
      question,
      session_id,
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logError('Public AI Chat', error);
    return {
      success: false,
      error: error.response?.data || { error_code: 'PUBLIC_AI_ERROR' },
    };
  }
};

export default {
  sendManagerAIMessage,
  sendPersonaMessage,
  sendMemoryMessage,
  sendPublicAIMessage,
};

