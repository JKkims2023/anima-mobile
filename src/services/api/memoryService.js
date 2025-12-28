/**
 * 🎵 Music Service
 * 
 * Handles all music-related API calls
 * - List music (default + user-created)
 * - Search and sort music
 * 
 * API Endpoints:
 * - POST /api/music/list
 * - POST /api/music/create (future)
 * - POST /api/music/poll (future)
 * - POST /api/music/delete (future)
 * 
 * @author JK & Hero Nexus AI
 */

import { MEMORY_ENDPOINTS } from '../../config/api.config';
import apiClient from './apiClient';

/**
 * 📋 List Memory
 * @param {string} user_key
 * @param {Object} options
 * @param {string} options.search_keyword - Optional: search keyword
 * @param {string} options.music_type - Optional: 'all' | 'instrumental' | 'vocal'
 * @param {string} options.sort_by - Optional: 'created_desc' | 'created_asc' | 'type_inst' | 'type_vocal'
 * @param {number} options.page - Default: 1
 * @param {number} options.limit - Default: 20
 * @returns {Promise<{success: boolean, data?: {music_list, total, page, limit, has_more}, errorCode?: string}>}
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
 * 🗑️ Delete Emotional Gift
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


export default {
  listMemory,
  deleteMemory,
};

