/**
 * 💰 Service API
 * 
 * Get service configuration and tier information
 * 
 * Features:
 * - Tier limits (chat, dress, image, music, video)
 * - User's current tier status
 * - Onboarding bonus status
 * - All tiers comparison
 * 
 * @author JK & Hero Nexus
 * @version 1.0.0
 */

import apiClient from './apiClient';
import { AMOUNT_ENDPOINTS } from '../../config/api.config';
import { logError } from './errorHandler';

/**
 * Get service configuration
 * 
 * Returns user's tier info, limits, and all tiers config
 * 
 * @param {string} user_key - User key
 * @returns {Promise<Object>} Service config data
 */
export const getServiceConfig = async (user_key) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 [Service API] Fetching service config');
    console.log(`   user_key: ${user_key}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await apiClient.post(AMOUNT_ENDPOINTS.GET_SERVICE_DATA, {
      user_key
    });

    console.log('response: ', response);

    if (response.data.success) {
      console.log('✅ [Service API] Config loaded successfully');
      console.log(`   Tier: ${response.data.data.userTier}`);
      console.log(`   Daily Chats: ${response.data.data.dailyChatRemaining}/${response.data.data.dailyChatLimit}`);
      console.log(`   Onboarding: ${response.data.data.isOnboarding ? 'Yes' : 'No'}`);
    } else {
      console.warn('⚠️  [Service API] API returned success: false', response.data.errorCode);
    }

    return response;
  } catch (error) {
    console.error('❌ [Service API] Error:', error.message);
    logError(error, 'getServiceConfig');
    
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Export default for convenience
 */
export default {
  getServiceConfig
};

