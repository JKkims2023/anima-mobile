/**
 * 💌 Message Service
 * 
 * API functions for message creation and management
 */

import { MESSAGE_ENDPOINTS } from '../../config/api.config';
import { apiFetch } from '../../utils/api-utils';

/**
 * Create a new message
 * @param {Object} data
 * @param {string} data.user_key
 * @param {string} data.persona_key
 * @param {string} data.memory_key (optional)
 * @param {string} data.message_title
 * @param {string} data.message_content
 * @param {string} data.message_password (optional)
 * @param {string} data.public_yn (optional, default: 'Y')
 * @returns {Promise<{success: boolean, data?: object, errorCode?: string}>}
 */
export async function createMessage(data) {
  console.log('📤 [messageService] Creating message:', {
    persona_key: data.persona_key,
    memory_key: data.memory_key,
    has_password: !!data.message_password,
  });

  try {
    const response = await apiFetch(MESSAGE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('✅ [messageService] Message created:', response);
    return response;
  } catch (error) {
    console.error('❌ [messageService] createMessage error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: error.message,
    };
  }
}

/**
 * Get user's message list
 * @param {Object} params
 * @param {string} params.user_key
 * @param {number} params.page (optional, default: 1)
 * @param {number} params.limit (optional, default: 20)
 * @param {string} params.persona_key (optional) - Filter by persona
 * @returns {Promise<{success: boolean, data?: array, pagination?: object, errorCode?: string}>}
 */
export async function getMessageList(params) {
  console.log('📜 [messageService] Fetching message list:', params);

  try {
    const response = await apiFetch(MESSAGE_ENDPOINTS.LIST, {
      method: 'POST',
      body: JSON.stringify(params),
    });

    console.log('✅ [messageService] Message list fetched:', response.data?.length || 0, 'messages');
    return response;
  } catch (error) {
    console.error('❌ [messageService] getMessageList error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: error.message,
    };
  }
}

/**
 * Get public message
 * @param {string} persona_key
 * @param {string} short_code
 * @param {string} password (optional)
 * @returns {Promise<{success: boolean, data?: object, requiresPassword?: boolean, errorCode?: string}>}
 */
export async function getPublicMessage(persona_key, short_code, password = null) {
  console.log('🌐 [messageService] Fetching public message:', { persona_key, short_code, has_password: !!password });

  try {
    let url = `${MESSAGE_ENDPOINTS.PUBLIC}/${persona_key}/${short_code}`;
    if (password) {
      url += `?password=${encodeURIComponent(password)}`;
    }

    const response = await apiFetch(url, {
      method: 'GET',
    });

    console.log('✅ [messageService] Public message fetched:', response);
    return response;
  } catch (error) {
    console.error('❌ [messageService] getPublicMessage error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: error.message,
    };
  }
}

/**
 * Verify message password
 * @param {string} persona_key
 * @param {string} short_code
 * @param {string} password
 * @returns {Promise<{success: boolean, valid?: boolean, errorCode?: string}>}
 */
export async function verifyMessagePassword(persona_key, short_code, password) {
  console.log('🔐 [messageService] Verifying message password');

  try {
    const response = await apiFetch(MESSAGE_ENDPOINTS.VERIFY_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ persona_key, short_code, password }),
    });

    console.log('✅ [messageService] Password verification result:', response.valid);
    return response;
  } catch (error) {
    console.error('❌ [messageService] verifyMessagePassword error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: error.message,
    };
  }
}

/**
 * Reuse existing message (create duplicate with new URL)
 * @param {Object} data
 * @param {string} data.user_key
 * @param {string} data.message_key
 * @param {string} data.message_password (optional) - New password
 * @returns {Promise<{success: boolean, data?: object, errorCode?: string}>}
 */
export async function reuseMessage(data) {
  console.log('🔄 [messageService] Reusing message:', data.message_key);

  try {
    const response = await apiFetch(MESSAGE_ENDPOINTS.REUSE, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('✅ [messageService] Message reused:', response);
    return response;
  } catch (error) {
    console.error('❌ [messageService] reuseMessage error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: error.message,
    };
  }
}

/**
 * Delete message
 * @param {string} user_key
 * @param {string} message_key
 * @returns {Promise<{success: boolean, errorCode?: string}>}
 */
export async function deleteMessage(user_key, message_key) {
  console.log('🗑️ [messageService] Deleting message:', message_key);

  try {
    const response = await apiFetch(MESSAGE_ENDPOINTS.DELETE, {
      method: 'POST',
      body: JSON.stringify({ user_key, message_key }),
    });

    console.log('✅ [messageService] Message deleted');
    return response;
  } catch (error) {
    console.error('❌ [messageService] deleteMessage error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: error.message,
    };
  }
}

/**
 * Share message (increment shared_count)
 * @param {string} message_key
 * @returns {Promise<{success: boolean, data?: object, errorCode?: string}>}
 */
export async function shareMessage(message_key) {
  console.log('📤 [messageService] Sharing message:', message_key);

  try {
    const response = await apiFetch(MESSAGE_ENDPOINTS.SHARE, {
      method: 'POST',
      body: JSON.stringify({ message_key }),
    });

    console.log('✅ [messageService] Message shared, count:', response.data?.shared_count);
    return response;
  } catch (error) {
    console.error('❌ [messageService] shareMessage error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: error.message,
    };
  }
}

export default {
  createMessage,
  getMessageList,
  getPublicMessage,
  verifyMessagePassword,
  reuseMessage,
  deleteMessage,
  shareMessage,
};

