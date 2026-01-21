/**
 * 🎨 Memory Service
 * 
 * Handles all memory-related API calls
 * - List memory (for MemoryScreen)
 * - Delete memory
 * - List user backgrounds (for message creation)
 * 
 * API Endpoints:
 * - POST /api/memory/list
 * - POST /api/memory/delete
 * - POST /api/memory/list-user-backgrounds
 * 
 * @author JK & Hero Nexus AI
 */

import { MEMORY_ENDPOINTS } from '../../config/api.config';
import apiClient from './apiClient';

/**
 * 📋 List Memory (기존 함수 - MemoryScreen에서 사용)
 * @param {string} user_key
 * @param {Object} options
 * @param {string} options.sort_by - Optional: 'created_desc' | 'created_asc'
 * @param {number} options.page - Default: 1
 * @param {number} options.limit - Default: 10
 * @returns {Promise<{success: boolean, data?: Object, errorCode?: string}>}
 */
export async function listMemory(user_key, options = {}) {
  console.log('🎵 [memoryService] Listing memory for user:', user_key, options);
  
  try {
    const response = await apiClient.post(MEMORY_ENDPOINTS.LIST, {
      user_key,
      sort_by: options.sort_by || 'created_desc',
      page: options.page || 1,
      limit: options.limit || 10,
    });

    console.log('🎵 [memoryService] List memory result:', response);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        errorCode: response.errorCode || 'MEMORY_LIST_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [memoryService] listMemory error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * 🗑️ Delete Memory (기존 함수 - MemoryScreen에서 사용)
 * @param {string} gift_id - Gift ID
 * @param {string} user_key - User key
 * @returns {Promise<{success: boolean, errorCode?: string}>}
 */
export async function deleteMemory(gift_id, user_key) {
  console.log('🗑️ [memoryService] Deleting gift:', gift_id, user_key);
  
  try {
    const response = await apiClient.post(MEMORY_ENDPOINTS.DELETE, {
      gift_id,
      user_key,
    });

    console.log('🗑️ [memoryService] Delete gift result:', response);

    if (response.data.success) {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        errorCode: response.data.errorCode || 'GIFT_DELETE_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [memoryService] deleteMemory error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * 📋 List User Backgrounds (신규 함수 - MessageCreationBack에서 사용)
 * 
 * 사용자가 생성한 드레스(메모리)를 배경으로 사용하기 위해 조회
 * 
 * @param {string} user_key - 사용자 키
 * @returns {Promise<{success: boolean, data?: Array, errorCode?: string}>}
 */
export async function listUserBackgrounds(user_key) {
  console.log('🎨 [memoryService] Listing user backgrounds:', { user_key });
  
  try {
    const response = await apiClient.post('/api/memory/list-user-backgrounds', {
      user_key,
    });

    console.log('🎨 [memoryService] List backgrounds result:', response);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data || [],
      };
    } else {
      return {
        success: false,
        errorCode: response.data.error_code || 'MEMORY_LIST_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [memoryService] listUserBackgrounds error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

export default {
  listMemory,          // ⭐ 기존 함수 (MemoryScreen)
  deleteMemory,        // ⭐ 기존 함수 (MemoryScreen)
  listUserBackgrounds, // ⭐ 신규 함수 (MessageCreationBack)
};
