/**
 * 💰 Amount Service
 * 
 * Handles all music-related API calls
 * - Get service data
 * 
 * API Endpoints:
 * - POST /api/service
 * 
 * @author JK & Hero Nexus AI
 */

import { AMOUNT_ENDPOINTS } from '../../config/api.config';
import apiClient from './apiClient';


/**
 * 🔍 Get Service Data
 * @param {string} user_key - User key
 * @returns {Promise<{success: boolean, data?: {video_amount, chat_amount, music_amount, memory_amount}, errorCode?: string}>}
 */
export async function getServiceData(user_key) {

  try {

    console.log('🔍 [amountService] Get service data request:', AMOUNT_ENDPOINTS.GET_SERVICE_DATA);

    const response = await apiClient.post(AMOUNT_ENDPOINTS.GET_SERVICE_DATA, {
      user_key,
    });

    console.log('🔍 [amountService] Get service data result:', response);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        errorCode: response.data.errorCode || 'AMOUNT_GET_SERVICE_DATA_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [amountService] getServiceData error:', error);
    return {
      success: false,
      errorCode: 'AMOUNT_GET_SERVICE_DATA_ERROR',
    };
  }
}


export default {
  getServiceData,
};

