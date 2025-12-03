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

import { MUSIC_ENDPOINTS } from '../../config/api.config';
import apiClient from './apiClient';

/**
 * 📋 List Music
 * @param {string} user_key
 * @param {Object} options
 * @param {string} options.search_keyword - Optional: search keyword
 * @param {string} options.music_type - Optional: 'all' | 'instrumental' | 'vocal'
 * @param {string} options.sort_by - Optional: 'created_desc' | 'created_asc' | 'type_inst' | 'type_vocal'
 * @param {number} options.page - Default: 1
 * @param {number} options.limit - Default: 20
 * @returns {Promise<{success: boolean, data?: {music_list, total, page, limit, has_more}, errorCode?: string}>}
 */
export async function listMusic(user_key, options = {}) {
  console.log('🎵 [musicService] Listing music for user:', user_key, options);
  
  try {
    const response = await apiClient.post(MUSIC_ENDPOINTS.LIST, {
      user_key,
      search_keyword: options.search_keyword || null,
      music_type: options.music_type || 'all',
      sort_by: options.sort_by || 'created_desc',
      page: options.page || 1,
      limit: options.limit || 20,
    });

    console.log('🎵 [musicService] List music result:', response);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        errorCode: response.errorCode || 'MUSIC_LIST_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [musicService] listMusic error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

export default {
  listMusic,
};

