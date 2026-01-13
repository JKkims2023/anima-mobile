/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎭 Persona API Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles all persona-related API calls
 * 
 * Features:
 * - Persona list management
 * - Persona detail retrieval
 * - Persona creation/update/deletion
 * - Consistent with api.config.js structure
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */

import apiClient from './apiClient';
import { PERSONA_ENDPOINTS } from '../../config/api.config';
import { logError } from './errorHandler';

/**
 * Get persona list for a user
 * @param {string} userKey - User's unique key
 * @returns {Promise<Array>} List of personas
 */
export const getPersonaList = async (userKey) => {
  try {

    console.log('🎭 [PersonaAPI] Getting persona list:', PERSONA_ENDPOINTS.LIST);
    const response = await apiClient.post(PERSONA_ENDPOINTS.LIST, {
      user_key: userKey,
    });

    // Handle both response.data.data and response.data
    const personas = response.data?.data.data || [];

    return personas;
  } catch (error) {
    if (__DEV__) {
      console.error('🎭 [PersonaAPI] Error fetching persona list:', error);
    }
    logError('Persona List', error);
    throw error;
  }
};

/**
 * Get persona dashboard data
 * @param {string} personaKey - Persona's unique key
 * @returns {Promise<Object>} Persona dashboard data
 */
export const getPersonaDashboard = async (personaKey) => {
  try {
    const response = await apiClient.post(PERSONA_ENDPOINTS.DASHBOARD, {
      persona_key: personaKey,
    });

    return response.data || {};
  } catch (error) {
    if (__DEV__) {
      console.error('🎭 [PersonaAPI] Error fetching persona dashboard:', error);
    }
    logError('Persona Dashboard', error);
    throw error;
  }
};

/**
 * Create a new persona
 * @param {string} userKey - User's unique key
 * @param {Object} personaData - Persona creation data
 * @param {string} personaData.name - Persona name
 * @param {string} personaData.gender - Gender ('male' or 'female')
 * @param {Object} personaData.photo - Photo object { uri, type, name }
 * @returns {Promise<Object>} Creation result with persona_key and estimate_time
 */
export const createPersona = async (userKey, personaData) => {
  try {
    // Prepare FormData
    const formData = new FormData();
    formData.append('user_key', userKey);
    formData.append('name', personaData.name);
    formData.append('description', personaData.description);
    formData.append('selectedType', personaData.gender); // 'male' or 'female'
    
    // ✅ selectedOptions 추가 (서버가 기대함)
    formData.append('selectedOptions', JSON.stringify({
      gender: personaData.gender,
      style: '',
      outfit: '',
    }));
    
    // Append photo file
    if (personaData.photo) {
      formData.append('photo', {
        uri: personaData.photo.uri,
        type: personaData.photo.type || 'image/jpeg',
        name: personaData.photo.name || 'photo.jpg',
      });
    }

    const response = await apiClient.post(PERSONA_ENDPOINTS.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data || {};
  } catch (error) {
    if (__DEV__) {
      console.error('🎭 [PersonaAPI] Error creating persona:', error);
      console.error('🎭 [PersonaAPI] Error response:', error.response?.data);
    }
    logError('Persona Creation', error);
    throw error;
  }
};

/**
 * Create a new persona
 * @param {string} userKey - User's unique key
 * @param {Object} personaData - Persona creation data
 * @param {string} personaData.name - Persona name
 * @param {string} personaData.gender - Gender ('male' or 'female')
 * @param {Object} personaData.photo - Photo object { uri, type, name }
 * @returns {Promise<Object>} Creation result with persona_key and estimate_time
 */
export const createDress = async (userKey, personaData) => {
  try {

    // Prepare FormData
    const formData = new FormData();
    formData.append('user_key', userKey);
    formData.append('persona_key', personaData.persona_key);
    formData.append('name', personaData.name);
    formData.append('description', personaData.description);
    formData.append('selectedType', personaData.gender); // 'male' or 'female'
    formData.append('selected_dress_image_url', personaData.selected_dress_image_url); // 'male' or 'female'
    
    // ✅ selectedOptions 추가 (서버가 기대함)
    formData.append('selectedOptions', JSON.stringify({
      gender: personaData.gender,
      style: '',
      outfit: '',
    }));
    


    const response = await apiClient.post(PERSONA_ENDPOINTS.CREATE_DRESS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data || {};
  } catch (error) {
    if (__DEV__) {
      console.error('🎭 [PersonaAPI] Error creating persona:', error);
      console.error('🎭 [PersonaAPI] Error response:', error.response?.data);
    }
    logError('Dress Creation', error);
    throw error;
  }
};

/**
 * Check persona creation status
 * @param {string} personaKey - Persona's unique key
 * @returns {Promise<Object>} Status information
 */
export const checkPersonaStatus = async (personaKey, memoryKey, bricKey, promptText) => {
  try {
    const response = await apiClient.post(PERSONA_ENDPOINTS.CHECK_STATUS, {
      persona_key: personaKey,
      memory_key: memoryKey,
      bric_key: bricKey,
      prompt_text: promptText,
    });

    return response.data || {};
  } catch (error) {
    console.error('[personaApi] checkPersonaStatus error:', error?.message);
    logError('Persona Status Check', error);
    throw error;
  }
};

/**
 * Get persona dress list (outfits)
 * @param {string} personaKey - Persona's unique key
 * @returns {Promise<Array>} List of dresses
 */
export const getPersonaDressList = async (personaKey) => {
  try {
    const response = await apiClient.post(PERSONA_ENDPOINTS.DRESS_LIST, {
      persona_key: personaKey,
    });

    return response.data || { success: false, data: [] };
  } catch (error) {
    logError('Persona Dress List', error);
    throw error;
  }
};

/**
 * Update persona dress code (change outfit)
 * @param {string} personaKey - Persona's unique key
 * @param {string} historyKey - History/memory key for the outfit
 * @returns {Promise<Object>} Update result
 */
export const updatePersonaDressCode = async (personaKey, historyKey) => {
  try {
    const response = await apiClient.post(PERSONA_ENDPOINTS.UPDATE_DRESS_CODE, {
      persona_key: personaKey,
      history_key: historyKey,
    });

    return response.data || {};
  } catch (error) {
    logError('Update Dress Code', error);
    throw error;
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 📱 Update Persona Basic Info (Mobile Optimized)
 * ═══════════════════════════════════════════════════════════════════════
 * @param {string} personaKey - Persona key
 * @param {string} userKey - User key
 * @param {string} personaName - New persona name (optional)
 * @param {string} categoryType - New category type (optional)
 * @returns {Promise<object>} Updated persona data
 */
export const updatePersonaBasic = async (personaKey, userKey, personaName, categoryType) => {
  try {
    const response = await apiClient.post(PERSONA_ENDPOINTS.UPDATE_BASIC, {
      persona_key: personaKey,
      user_key: userKey,
      persona_name: personaName,
      category_type: categoryType,
    });

    return response.data || {};
  } catch (error) {
    logError('Update Persona Basic', error);
    throw error;
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🎬 Convert Persona Image to Video
 * ═══════════════════════════════════════════════════════════════════════
 * @param {string} personaKey - Persona key
 * @param {string} userKey - User key
 * @param {string} imgUrl - Image URL to convert
 * @param {string} memoryKey - Memory key (optional)
 * @returns {Promise<object>} Conversion result with request_key and estimate_time
 */
export const convertPersonaVideo = async (personaKey, userKey, imgUrl, memoryKey) => {
  try {
    const response = await apiClient.post(PERSONA_ENDPOINTS.UPGRADE, {
      persona_key: personaKey,
      user_key: userKey,
      img_url: imgUrl,
      memory_key: memoryKey,
    });

    return response.data || {};
  } catch (error) {
    logError('Convert Persona Video', error);
    throw error;
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🗑️ Delete Persona (Soft Delete)
 * ═══════════════════════════════════════════════════════════════════════
 * @param {string} personaKey - Persona key
 * @param {string} userKey - User key
 * @returns {Promise<object>} Deletion result
 */
export const deletePersona = async (personaKey, userKey) => {
  try {
    const response = await apiClient.post(PERSONA_ENDPOINTS.REMOVE, {
      persona_key: personaKey,
      user_key: userKey,
    });

    return response.data || {};
  } catch (error) {
    logError('Delete Persona', error);
    throw error;
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * ⭐ Toggle Persona Favorite
 * ═══════════════════════════════════════════════════════════════════════
 * @param {string} personaKey - Persona key
 * @param {string} userKey - User key
 * @returns {Promise<object>} { success: boolean, favorite_yn: 'Y'|'N' }
 */
export const togglePersonaFavorite = async (personaKey, userKey) => {
  try {
  
    const response = await apiClient.post(PERSONA_ENDPOINTS.FAVORITE, {
      persona_key: personaKey,
      user_key: userKey,
    });

    return response.data || {};
  } catch (error) {
    logError('Toggle Persona Favorite', error);
    throw error;
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 👗 Update Persona Dress (복장 변경)
 * ═══════════════════════════════════════════════════════════════════════
 * @param {string} personaKey - Persona key
 * @param {object} dressData - Dress data { media_url, video_url, memory_key }
 * @returns {Promise<object>} { success: boolean }
 */
export const updatePersonaDress = async (personaKey, dressData) => {
  try {
  
    const response = await apiClient.post(PERSONA_ENDPOINTS.UPDATE_DRESS, {
      persona_key: personaKey,
      selected_dress_image_url: dressData.media_url,
      selected_dress_video_url: dressData.video_url,
      history_key: dressData.memory_key,
    });


    return response.data || {};
  } catch (error) {
    logError('Update Persona Dress', error);
    throw error;
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 📖 Update Persona Comment Checked
 * ═══════════════════════════════════════════════════════════════════════
 * @param {string} personaKey - Persona key
 * @param {string} userKey - User key
 * @returns {Promise<object>} { success: boolean }
 */
export const updatePersonaCommentChecked = async (personaKey, userKey) => {

  const response = await apiClient.post(PERSONA_ENDPOINTS.UPDATE_COMMENT_CHECKED, {
    persona_key: personaKey,
    user_key: userKey,
  });

  return response.data || {};
};

/**
 * Create persona identity (Soul Creator)
 * 
 * @param {string} userKey - User's unique key
 * @param {string} personaKey - Persona's unique key
 * @param {Object} identityData - Identity data
 * @param {string} identityData.persona_name - Persona name
 * @param {Array<string>} identityData.user_nicknames - How AI calls user (array)
 * @param {string} identityData.speech_style - Speech style (friendly/formal/casual/sibling)
 * @param {string} identityData.identity - Persona identity/role
 * @param {string} identityData.hobby - Persona hobbies
 * @param {string} identityData.favorite - What persona likes
 * @returns {Promise<Object>} Creation result
 */
export const createPersonaIdentity = async (userKey, personaKey, identityData) => {
  try {
    const response = await apiClient.post(PERSONA_ENDPOINTS.CREATE_IDENTITY, {
      user_key: userKey,
      persona_key: personaKey,
      persona_name: identityData.persona_name,
      user_nicknames: identityData.user_nicknames,
      relationship_type: identityData.relationship_type, // 🆕 우리의 관계
      speaking_style: identityData.speaking_style,
      identity: identityData.identity,
      hobby: identityData.hobby,
      favorite: identityData.favorite,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    if (__DEV__) {
      console.error('🎭 [PersonaAPI] Error creating persona identity:', error);
    }
    logError('Create Persona Identity', error);
    return {
      success: false,
      error: error.response?.data || { error_code: 'CREATE_IDENTITY_ERROR' },
    };
  }
};

/**
 * Get real-time PersonaHeartDisplay data
 * @param {string} userKey - User's unique key
 * @param {string} personaKey - Persona's unique key
 * @returns {Promise<Object>} Heart display data (recent_moment, ai_interests, ai_next_questions)
 */
export const getPersonaHeartData = async (userKey, personaKey) => {
  try {
    if (__DEV__) {
      console.log('💖 [PersonaAPI] Getting heart display data:', { userKey, personaKey });
    }
    
    const response = await apiClient.get(`${PERSONA_ENDPOINTS.HEART_DISPLAY}?user_key=${userKey}&persona_key=${personaKey}`);
    
    if (response.data?.success) {
      if (__DEV__) {
        console.log('💖 [PersonaAPI] Heart data received:');
        console.log('   Recent moment:', response.data.data.recent_moment ? '✅' : '❌');
        console.log('   AI Interests:', response.data.data.ai_interests?.length || 0);
        console.log('   AI Questions:', response.data.data.ai_next_questions?.length || 0);
      }
      
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      throw new Error(response.data?.message || 'Failed to fetch heart data');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('💖 [PersonaAPI] Error fetching heart data:', error);
    }
    logError('Get Persona Heart Data', error);
    return {
      success: false,
      error: error.response?.data || { error_code: 'HEART_DATA_ERROR' },
    };
  }
};

export default {
  getPersonaList,
  getPersonaDashboard,
  createPersona,
  checkPersonaStatus,
  getPersonaDressList,
  updatePersonaDressCode,
  updatePersonaBasic,
  convertPersonaVideo,
  deletePersona,
  togglePersonaFavorite,
  updatePersonaDress,
  updatePersonaCommentChecked,
  createPersonaIdentity,
  getPersonaHeartData, // ⭐ NEW
};

