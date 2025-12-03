/**
 * 💌 Message Service
 * 
 * Handles all message-related API calls
 * - Create message
 * - List messages
 * - Public message retrieval
 * - Verify password
 * - Reuse/Delete/Share
 * 
 * API Endpoints:
 * - POST /api/message/create
 * - POST /api/message/list
 * - GET /api/message/public/[persona_key]/[short_code]
 * - POST /api/message/verify-password
 * - POST /api/message/reuse
 * - POST /api/message/delete
 * - POST /api/message/share
 * 
 * @author JK & Hero AI
 */

import { MESSAGE_ENDPOINTS } from '../../config/api.config';
import apiClient from './apiClient';


/**
 * 🎁 Create Message
 * @param {Object} params
 * @param {string} params.user_key
 * @param {string} params.persona_key
 * @param {string} params.memory_key - Optional: specific dress/memory
 * @param {string} params.message_title
 * @param {string} params.message_content
 * @param {string} params.persona_name - Snapshot
 * @param {string} params.persona_image_url - Snapshot
 * @param {string} params.persona_video_url - Snapshot
 * @param {string} params.message_password - Optional
 * @param {string} params.has_password - 'Y' | 'N'
 * @param {string} params.text_animation - fade_in, typing, scale_in, slide_cross
 * @param {string} params.particle_effect - confetti, hearts, snow, sparkles, comfort_light, hope_star, rain_soft, none
 * @param {string} params.bg_music - birthday, romantic, christmas, ai_generated, none, etc.
 * @param {string} params.bg_music_url - Optional: AI generated music URL
 * @param {Object} params.effect_config - Optional: Complex effect configuration
 * @returns {Promise<{success: boolean, data?: {message_key, share_url, short_code}, errorCode?: string}>}
 */
export async function createMessage(params) {
  console.log('💌 [messageService] Creating message:', params);
  
  try {
    
    console.log('💌 [messageService] Creating message:', MESSAGE_ENDPOINTS.CREATE);

    const response = await apiClient.post(MESSAGE_ENDPOINTS.CREATE, {
      user_key: params.user_key,
      persona_key: params.persona_key,
      memory_key: params.memory_key || null,
      message_title: params.message_title,
      message_content: params.message_content,
      message_password: params.message_password || null,
      public_yn: params.public_yn || 'Y',
      // ⭐ Effect configuration (NEW)
      text_animation: params.text_animation || 'fade_in',
      particle_effect: params.particle_effect || 'none',
      bg_music: params.bg_music || 'none',
      bg_music_url: params.bg_music_url || null,
      effect_config: params.effect_config || null,
      // ⭐ Persona snapshots (for display)
      persona_name: params.persona_name || null,
      persona_image_url: params.persona_image_url || null,
      persona_video_url: params.persona_video_url || null,
      // ⭐ Password protection
      has_password: params.has_password || 'N',
    });

    

    console.log('💌 [messageService] Create message result:', response);

    if (response.data.success) {
      return {
        success: true,
        data: response.data,
      };
    } else {
      return {
        success: false,
        errorCode: response.errorCode || 'MESSAGE_CREATE_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [messageService] createMessage error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * 📋 List Messages
 * @param {string} user_key
 * @param {number} page - Default: 1
 * @param {number} limit - Default: 10
 * @returns {Promise<{success: boolean, data?: {messages, total, page, limit}, errorCode?: string}>}
 */
export async function listMessages(user_key, page = 1, limit = 200) {
  console.log('📋 [messageService] Listing messages for user:', user_key);
  
  try {
    const response = await apiClient.post(MESSAGE_ENDPOINTS.LIST, {
      user_key,
      page,
      limit,
    });

    console.log('📋 [messageService] List messages result:', response);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        errorCode: response.errorCode || 'MESSAGE_LIST_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [messageService] listMessages error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * 🔓 Get Public Message
 * @param {string} persona_key
 * @param {string} short_code
 * @returns {Promise<{success: boolean, data?: Object, errorCode?: string}>}
 */
export async function getPublicMessage(persona_key, short_code) {
  console.log('🔓 [messageService] Getting public message:', persona_key, short_code);
  
  try {
    const url = `${MESSAGE_ENDPOINTS.PUBLIC}/${persona_key}/${short_code}`;
    const response = await apiClient(url, {
      method: 'GET',
    });

    console.log('🔓 [messageService] Get public message result:', response);

    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    } else {
      return {
        success: false,
        errorCode: response.errorCode || 'MESSAGE_PUBLIC_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [messageService] getPublicMessage error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * 🔐 Verify Password
 * @param {string} message_key
 * @param {string} password
 * @returns {Promise<{success: boolean, data?: Object, errorCode?: string}>}
 */
export async function verifyPassword(message_key, password) {
  console.log('🔐 [messageService] Verifying password for message:', message_key);
  
  try {
    const response = await apiClient(MESSAGE_ENDPOINTS.VERIFY_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ message_key, password }),
    });

    console.log('🔐 [messageService] Verify password result:', response);

    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    } else {
      return {
        success: false,
        errorCode: response.errorCode || 'PASSWORD_VERIFY_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [messageService] verifyPassword error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * 🔄 Reuse Message
 * @param {string} message_key
 * @returns {Promise<{success: boolean, data?: {new_message_key, share_url}, errorCode?: string}>}
 */
export async function reuseMessage(message_key) {
  console.log('🔄 [messageService] Reusing message:', message_key);
  
  try {
    const response = await apiClient(MESSAGE_ENDPOINTS.REUSE, {
      method: 'POST',
      body: JSON.stringify({ message_key }),
    });

    console.log('🔄 [messageService] Reuse message result:', response);

    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    } else {
      return {
        success: false,
        errorCode: response.errorCode || 'MESSAGE_REUSE_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [messageService] reuseMessage error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * 🗑️ Delete Message
 * @param {string} message_key
 * @returns {Promise<{success: boolean, errorCode?: string}>}
 */
export async function deleteMessage(message_key) {
  console.log('🗑️ [messageService] Deleting message:', message_key);
  
  try {
    const response = await apiClient(MESSAGE_ENDPOINTS.DELETE, {
      method: 'POST',
      body: JSON.stringify({ message_key }),
    });

    console.log('🗑️ [messageService] Delete message result:', response);

    if (response.success) {
      return { success: true };
    } else {
      return {
        success: false,
        errorCode: response.errorCode || 'MESSAGE_DELETE_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [messageService] deleteMessage error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * 📤 Increment Share Count
 * @param {string} message_key
 * @returns {Promise<{success: boolean, errorCode?: string}>}
 */
export async function incrementShareCount(message_key) {
  console.log('📤 [messageService] Incrementing share count:', message_key);
  
  try {
    const response = await apiClient(MESSAGE_ENDPOINTS.SHARE, {
      method: 'POST',
      body: JSON.stringify({ message_key }),
    });

    console.log('📤 [messageService] Increment share result:', response);

    if (response.success) {
      return { success: true };
    } else {
      return {
        success: false,
        errorCode: response.errorCode || 'MESSAGE_SHARE_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [messageService] incrementShareCount error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

export default {
  createMessage,
  listMessages,
  getPublicMessage,
  verifyPassword,
  reuseMessage,
  deleteMessage,
  incrementShareCount,
};
