/**
 * Chat API Service
 * 
 * Features:
 * - Manager AI chat (ANIMA v2.0)
 * - Persona chat
 * - Memory chat
 * - Public AI chat
 * 
 * Uses:
 * - Manager AI (SAGE) communication with RAG & session management
 * - Persona chat interface
 * - Memory-based conversations
 * 
 * Version: 2.0 (ANIMA Chat API)
 */

import apiClient from './apiClient';
import { CHAT_ENDPOINTS } from '../../config/api.config';
import { logError } from './errorHandler';

// Session management (in-memory)
// ⭐ FIX: Store sessions per persona to prevent cross-talk
let sessionsByPersona = {};

/**
 * Send message to Manager AI (SAGE) - ANIMA v2.0
 * 
 * Features:
 * - RAG (Retrieval-Augmented Generation) with Pinecone knowledge base
 * - Session management for conversation continuity
 * - Tier-based AI model selection
 * - User preferences integration
 * - 🆕 Vision support (image analysis)
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.question - User's question/message
 * @param {string} params.user_key - User key
 * @param {string} params.persona_key - Persona key (default: 'SAGE')
 * @param {boolean} params.newSession - Force new session (default: false)
 * @param {Object} params.image - Optional image data { data: base64, mimeType: string }
 * @returns {Promise<Object>} - AI response with metadata
 */
export const sendManagerAIMessage = async ({ 
  question, 
  user_key, 
  persona_key = 'SAGE',
  newSession = false,
  image = null, // 🆕 Image data
}) => {
  try {
    // ⭐ FIX: Get session_id for this specific persona
    let currentSessionId = sessionsByPersona[persona_key];
    
    // Reset session if requested
    if (newSession) {
      currentSessionId = null;
      delete sessionsByPersona[persona_key];
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`💬 [ANIMA Chat] Sending message`);
    console.log(`   persona_key: ${persona_key}`);
    console.log(`   session_id: ${currentSessionId || 'NEW'}`);
    if (image) {
      console.log(`   📷 image: ${image.mimeType}, ${(image.data.length / 1024).toFixed(1)}KB`);
    }
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Call ANIMA v2.0 Chat API
    const requestBody = {
      user_key,
      message: question,
      session_id: currentSessionId,
      persona_key,
    };
    
    // 🆕 Include image data if present
    if (image) {
      requestBody.image = image;
    }
    
    const response = await apiClient.post(CHAT_ENDPOINTS.ANIMA_CHAT, requestBody);

    console.log('[ANIMA Chat] Response:', response.data);

    // ⭐ FIX: Save session_id for THIS persona only
    if (response.data.data?.session_id) {
      sessionsByPersona[persona_key] = response.data.data.session_id;
      console.log(`✅ [ANIMA Chat] Session saved for persona: ${persona_key}`);
      console.log(`   Session ID: ${response.data.data.session_id}`);
    }

    // Map response to expected format (backward compatibility)
    return {
      success: true,
      data: {
        // Core response
        answer: response.data.data?.message || '',
        
        // ⭐ NEW: Continuous conversation support
        continue_conversation: response.data.data?.continue_conversation || false,
        
        // ⭐ NEW: Rich media content (images, videos, links)
        rich_content: response.data.data?.rich_content || {
          images: [],
          videos: [],
          links: [],
        },
        
        // Metadata (new in v2.0)
        session_id: response.data.data?.session_id,
        model: response.data.data?.model,
        tier: response.data.data?.tier,
        knowledge_used: response.data.data?.knowledge_used || [],
        
        // 🌟 NEW: Identity evolution notification
        identity_evolution: response.data.data?.identity_evolution || null,
        
        // 🎨 NEW: Real-time chat content generation
        generated_content: response.data.data?.generated_content || null,
        
        // 🎵 NEW: Real-time music search result
        music: response.data.data?.music || null,
        
        // 🎬 NEW: Real-time YouTube video search result
        youtube: response.data.data?.youtube || null,
        
        // 😴 NEW (2026-01-13): Real-time user emotion from LLM
        user_emotion: response.data.data?.user_emotion || null,
        
        // Performance metrics
        response_time_ms: response.data.metadata?.response_time_ms,
        tokens: response.data.metadata?.tokens,
        cost: response.data.metadata?.cost,
      },
    };
  } catch (error) {
    logError('ANIMA Chat', error);
    return {
      success: false,
      error: error.response?.data || { error_code: 'ANIMA_CHAT_ERROR' },
    };
  }
};

/**
 * Reset current session (start new conversation)
 * ⭐ FIX: Support resetting specific persona session
 */
export const resetManagerAISession = (persona_key = null) => {
  if (persona_key) {
    delete sessionsByPersona[persona_key];
    console.log(`[ANIMA Chat] Session reset for persona: ${persona_key}`);
  } else {
    sessionsByPersona = {};
    console.log('[ANIMA Chat] All sessions reset');
  }
};

/**
 * Get current session ID for a specific persona
 * ⭐ FIX: Support getting persona-specific session
 */
export const getCurrentSessionId = (persona_key = null) => {
  if (persona_key) {
    return sessionsByPersona[persona_key] || null;
  }
  // Backward compatibility: return first available session
  return Object.values(sessionsByPersona)[0] || null;
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

/**
 * Get AI preferences for user
 * 
 * @param {string} user_key - User key
 * @returns {Promise<Object>} - User's AI preferences
 */
export const getAIPreferences = async (user_key) => {
  try {
    const response = await apiClient.get(`/api/user/ai-preferences?user_key=${user_key}`);
    
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    logError('Get AI Preferences', error);
    return {
      success: false,
      error: error.response?.data || { error_code: 'GET_PREFERENCES_ERROR' },
    };
  }
};

/**
 * Update AI preferences for user
 * 
 * @param {string} user_key - User key
 * @param {Object} settings - AI settings
 * @param {string} settings.speech_style - Speech style (formal/friendly/casual/sibling)
 * @param {string} settings.response_style - Response style (warm/motivational/logical/humorous)
 * @param {string} settings.advice_level - Advice level (minimal/gentle/active/strong)
 * @returns {Promise<Object>} - Updated preferences
 */
export const updateAIPreferences = async (user_key, settings) => {
  try {
    const response = await apiClient.post('/api/user/ai-preferences', {
      user_key,
      ...settings,
    });
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    logError('Update AI Preferences', error);
    return {
      success: false,
      error: error.response?.data || { error_code: 'UPDATE_PREFERENCES_ERROR' },
    };
  }
};

/**
 * ⭐ NEW: Get chat history for a user and persona
 * 
 * @param {Object} params
 * @param {string} params.user_key - User key
 * @param {string} params.persona_key - Persona key (defaults to SAGE)
 * @param {number} params.limit - Number of messages to fetch (default 100)
 * @param {number} params.offset - Offset for pagination (default 0)
 * @returns {Promise<Object>} - Chat history
 */
export const getChatHistory = async ({ user_key, persona_key = 'SAGE', limit = 100, offset = 0 }) => {
  try {
    const params = new URLSearchParams({
      user_key,
      persona_key,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    const response = await apiClient.get(`/api/anima/chat/history?${params}`);
    
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    logError('Get Chat History', error);
    return {
      success: false,
      error: error.response?.data || { error_code: 'GET_HISTORY_ERROR' },
      data: { messages: [], hasMore: false, total: 0 },
    };
  }
};

/**
 * 🆕 Close chat session and trigger background learning
 * 
 * Called when user closes the chat overlay.
 * Triggers relationship memory analysis and update (background, non-blocking).
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user_key - User key
 * @param {string} params.persona_key - Persona key
 * @param {string} params.session_id - Session ID
 * @returns {Promise<Object>} - Immediate success response
 */
export const closeChatSession = async ({ user_key, persona_key, session_id }) => {
  try {
    console.log('👋 [ChatAPI] Closing chat session (background learning)...');
    console.log(`   Session: ${session_id}`);
    
    // Call background learning API (don't wait for result)
    const response = await apiClient.post('/api/anima/chat/close', {
      user_key,
      persona_key,
      session_id,
    });
    
    console.log('✅ [ChatAPI] Chat close request sent');
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // Fail silently - don't affect UX
    console.warn('⚠️  [ChatAPI] Chat close failed (non-critical):', error.message);
    return {
      success: true, // Return success anyway
      data: { message: 'Chat closed (learning skipped)' },
    };
  }
};

/**
 * 🎁 Get pending emotional gifts for user
 * @param {Object} params
 * @param {string} params.user_key
 * @param {string} params.persona_key
 * @returns {Promise<Object>}
 */
export const getPendingGifts = async ({ user_key, persona_key }) => {
  try {
    console.log('🎁 [ChatAPI] Getting pending gifts...');
    const response = await apiClient.get('/api/gifts/pending', {
      params: { user_key, persona_key },
    });
    return { success: true, gifts: response.data.gifts || [] };
  } catch (error) {
    logError('Get Pending Gifts', error);
    return { success: false, gifts: [] };
  }
};

/**
 * 🎁 Record user's reaction to a gift
 * @param {Object} params
 * @param {string} params.gift_id
 * @param {string} params.reaction - 'loved' | 'liked' | 'viewed' | 'saved'
 * @returns {Promise<Object>}
 */
export const reactToGift = async ({ gift_id, reaction }) => {
  try {
    console.log(`❤️  [ChatAPI] Reacting to gift: ${reaction}`);
    const response = await apiClient.post('/api/gifts/react', {
      gift_id,
      reaction,
    });
    return { success: true, data: response.data };
  } catch (error) {
    logError('React to Gift', error);
    return { success: false, error: error.response?.data };
  }
};

/**
 * 🎁 Create test gift (for testing only)
 * @param {Object} params
 * @param {string} params.user_key
 * @param {string} params.persona_key
 * @param {string} params.emotion
 * @param {string} params.personalMessage
 * @returns {Promise<Object>}
 */
export const createTestGift = async ({ user_key, persona_key, emotion, personalMessage }) => {
  try {
    console.log('🎁 [ChatAPI] Creating test gift...');
    const response = await apiClient.post('/api/gifts/test/create', {
      user_key,
      persona_key,
      emotion,
      personalMessage,
    });
    return { success: true, gift_id: response.data.gift_id };
  } catch (error) {
    logError('Create Test Gift', error);
    return { success: false, error: error.response?.data };
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Real-time Chat Content Generation APIs
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Check daily content generation limit
 * @param {string} user_key - User key
 * @returns {Promise<Object>} - Limit info { allowed, limit, used, remaining }
 */
export const checkChatContentLimit = async (user_key) => {
  try {
    console.log('🎨 [ChatAPI] Checking content limit:', user_key);
    const response = await apiClient.get(`/chat-content/check-limit?user_key=${user_key}`);
    console.log('✅ [ChatAPI] Limit check result:', response.data);
    return response.data;
  } catch (error) {
    logError('Check Chat Content Limit', error);
    throw error;
  }
};

/**
 * Get content generation status
 * @param {string} content_id - Content ID
 * @returns {Promise<Object>} - Status info { status, content_url, ... }
 */
export const getChatContentStatus = async (content_id) => {
  try {
    const response = await apiClient.get(`/chat-content/status?content_id=${content_id}`);
    return response.data;
  } catch (error) {
    logError('Get Chat Content Status', error);
    throw error;
  }
};

/**
 * Mark content as clicked/viewed
 * @param {string} content_id - Content ID
 * @returns {Promise<Object>} - Success response
 */
export const markContentAsClicked = async (content_id) => {
  try {
    const response = await apiClient.post('/chat-content/mark-clicked', { content_id });
    return response.data;
  } catch (error) {
    logError('Mark Content As Clicked', error);
    // Non-critical error, don't throw
    return { success: false };
  }
};

export default {
  sendManagerAIMessage,
  resetManagerAISession,
  getCurrentSessionId,
  getChatHistory,
  closeChatSession,
  getPendingGifts, // 🎁 Emotional Gifts
  reactToGift, // 🎁 Emotional Gifts
  createTestGift, // 🎁 Emotional Gifts (for testing)
  checkChatContentLimit, // 🎨 NEW: Real-time Content
  getChatContentStatus, // 🎨 NEW: Real-time Content
  markContentAsClicked, // 🎨 NEW: Real-time Content
  sendPersonaMessage,
  sendMemoryMessage,
  sendPublicAIMessage,
  getAIPreferences,
  updateAIPreferences,
};

