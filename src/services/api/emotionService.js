/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 😊 Emotion Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Service for fetching persona emotion statistics
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-19
 */

import { PERSONA_ENDPOINTS } from '../../config/api.config';
import apiClient from './apiClient';

/**
 * Get emotion statistics for a persona
 * @param {string} user_key - User key
 * @param {string} persona_key - Persona key
 * @returns {Promise<{success: boolean, data?: Object, errorCode?: string}>}
 */
export async function getEmotionStats(user_key, persona_key) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('😊 [emotionService] Fetching emotion stats...');
  console.log('   User:', user_key?.substring(0, 8) + '...');
  console.log('   Persona:', persona_key?.substring(0, 8) + '...');
  
  try {
    const response = await apiClient.post(PERSONA_ENDPOINTS.EMOTION_STATS, {
      user_key,
      persona_key,
    });
    
    console.log('😊 [emotionService] Response received:', response.data);
    
    if (response.data.success) {
      console.log('✅ [emotionService] Emotion stats fetched successfully');
      console.log(`   Total conversations: ${response.data.data.total_conversations}`);
      console.log(`   Primary emotion: ${response.data.data.primary_emotion?.emoji} ${response.data.data.primary_emotion?.label}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      console.error('❌ [emotionService] API returned error:', response.data.message);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return {
        success: false,
        errorCode: response.data.errorCode || 'EMOTION_STATS_ERROR',
      };
    }
  } catch (error) {
    console.error('❌ [emotionService] Failed to fetch emotion stats:', error);
    console.error('   Error message:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

const emotionService = {
  getEmotionStats,
};

export default emotionService;
