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
    if (__DEV__) {
      console.log('🎭 [PersonaAPI] Fetching persona list for:', userKey);
    }

    const response = await apiClient.post(PERSONA_ENDPOINTS.LIST, {
      user_key: userKey,
    });

    if (__DEV__) {
      console.log('🎭 [PersonaAPI] Response:', response);
    }

    // Handle both response.data.data and response.data
    const personas = response.data?.data.data || [];

    console.log('data.data.data', response.data.data.data);

    if (__DEV__) {
      console.log('🎭 [PersonaAPI] Personas loaded:', personas.length);
    }

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
    if (__DEV__) {
      console.log('🎭 [PersonaAPI] Fetching persona dashboard:', personaKey);
    }

    const response = await apiClient.post(PERSONA_ENDPOINTS.DASHBOARD, {
      persona_key: personaKey,
    });

    if (__DEV__) {
      console.log('🎭 [PersonaAPI] Dashboard response:', response);
    }

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
    if (__DEV__) {
      console.log('🎭 [PersonaAPI] Creating persona:', {
        userKey,
        name: personaData.name,
        gender: personaData.gender,
        hasPhoto: !!personaData.photo,
      });
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('user_key', userKey);
    formData.append('name', personaData.name);
    formData.append('selectedType', personaData.gender); // 'male' or 'female'
    
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

    if (__DEV__) {
      console.log('🎭 [PersonaAPI] Persona created:', response.data);
    }

    return response.data || {};
  } catch (error) {
    if (__DEV__) {
      console.error('🎭 [PersonaAPI] Error creating persona:', error);
    }
    logError('Persona Creation', error);
    throw error;
  }
};

/**
 * Check persona creation status
 * @param {string} personaKey - Persona's unique key
 * @returns {Promise<Object>} Status information
 */
export const checkPersonaStatus = async (personaKey) => {
  try {
    const response = await apiClient.post(PERSONA_ENDPOINTS.CHECK_STATUS, {
      persona_key: personaKey,
    });

    return response.data || {};
  } catch (error) {
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

    return response.data?.data || response.data || [];
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

export default {
  getPersonaList,
  getPersonaDashboard,
  createPersona,
  checkPersonaStatus,
  getPersonaDressList,
  updatePersonaDressCode,
};

