/**
 * 🎨 Memory Service
 * 
 * Handles all memory-related API calls
 * - List user backgrounds (for message creation)
 * 
 * API Endpoints:
 * - POST /api/memory/list-user-backgrounds
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-21
 */

import apiClient from './apiClient';

/**
 * 📋 List User Backgrounds
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
  listUserBackgrounds,
};
