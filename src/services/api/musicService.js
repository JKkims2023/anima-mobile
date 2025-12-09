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

/**
 * 🎵 Create Music
 * @param {Object} params
 * @param {string} params.music_title - Music title
 * @param {string} params.music_type - 'instrumental' | 'vocal'
 * @param {string} params.prompt - Music style/prompt
 * @param {string} params.lyrics - Lyrics prompt (for vocal)
 * @returns {Promise<{success: boolean, data?: {music_key, request_key, estimated_time, status}, errorCode?: string}>}
 */
export async function createMusic(params) {
  console.log('🎵 [musicService] Creating music:', params);
  
  try {
    const response = await apiClient.post(MUSIC_ENDPOINTS.CREATE, {
      user_key: params.user_key,
      music_title: params.music_title,
      music_type: params.music_type,
      prompt: params.prompt,
      lyrics: params.lyrics,
    });

    console.log('🎵 [musicService] Create music result:', response);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        errorCode: response.data.errorCode || 'MUSIC_CREATE_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [musicService] createMusic error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * 🔍 Check Music Status
 * @param {string} music_key - Music key
 * @returns {Promise<{success: boolean, data?: {music_key, status, music_url?, progress}, errorCode?: string}>}
 */
export async function checkMusicStatus(music_key, request_key) {

  try {
    const response = await apiClient.post(MUSIC_ENDPOINTS.CHECK_STATUS, {
      music_key,
      request_key,
    });

    console.log('🔍 [musicService] Check status result:', response);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        errorCode: response.data.errorCode || 'MUSIC_STATUS_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [musicService] checkMusicStatus error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * 🗑️ Delete Music
 * @param {string} music_key - Music key
 * @returns {Promise<{success: boolean, errorCode?: string}>}
 */
export async function deleteMusic(music_key) {
  console.log('🗑️ [musicService] Deleting music:', music_key);
  
  try {
    const response = await apiClient.post(MUSIC_ENDPOINTS.DELETE, {
      user_key: (await require('./authService').default.getUserKey()),
      music_key,
    });

    console.log('🗑️ [musicService] Delete music result:', response);

    if (response.data.success) {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        errorCode: response.data.errorCode || 'MUSIC_DELETE_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [musicService] deleteMusic error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * ⭐ Toggle Music Favorite
 * @param {string} music_key - Music key
 * @param {string} user_key - User key
 * @returns {Promise<{success: boolean, data?: {favorite_yn}, errorCode?: string}>}
 */
export async function toggleFavorite(music_key, user_key) {
  console.log('⭐ [musicService] Toggling favorite:', music_key, user_key);
  
  try {
    const response = await apiClient.post(MUSIC_ENDPOINTS.FAVORITE, {
      music_key,
      user_key,
    });

    console.log('⭐ [musicService] Toggle favorite result:', response);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        errorCode: response.data.errorCode || 'MUSIC_FAVORITE_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [musicService] toggleFavorite error:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

export default {
  listMusic,
  createMusic,
  checkMusicStatus,
  deleteMusic,
  toggleFavorite,
};

