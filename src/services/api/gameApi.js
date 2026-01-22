/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎮 Game API Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles all game-related API calls:
 * - Fortress game strategy requests
 * - Future: Tattoo, Nostradamus games
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-22
 */

import apiClient from './apiClient';
import { GAME_ENDPOINTS } from '../../config/api.config';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🏰 Fortress Game API
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Get AI strategy for Fortress game
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user_key - User key
 * @param {string} params.persona_key - Persona key
 * @param {Object} params.game_state - Current game state
 * @param {Array} params.game_state.terrain_points - [[x,y], ...] terrain coordinates
 * @param {number} params.game_state.wind - Wind speed (-10 ~ 10)
 * @param {Object} params.game_state.user_tank - { x, y, hp }
 * @param {Object} params.game_state.ai_tank - { x, y, hp }
 * @param {number} params.game_state.distance - Distance between tanks
 * @param {Object} [params.game_state.last_user_shot] - { angle, power, result }
 * 
 * @returns {Promise<Object>} Strategy response
 * @returns {boolean} response.success - Request success
 * @returns {Object} response.strategy - { angle, power, reasoning? }
 * @returns {string} response.taunt_message - Persona's taunt message
 * @returns {Object} [response.persona] - { name, image_url, video_url }
 * 
 * @example
 * const result = await gameApi.getFortressStrategy({
 *   user_key: 'user_123',
 *   persona_key: 'persona_456',
 *   game_state: {
 *     terrain_points: [[0,200], [100,180], ...],
 *     wind: 5,
 *     user_tank: { x: 120, y: 180, hp: 100 },
 *     ai_tank: { x: 680, y: 190, hp: 70 },
 *     distance: 560,
 *     last_user_shot: { angle: 45, power: 80, result: 'hit' }
 *   }
 * });
 * 
 * console.log(result.strategy.angle); // 42
 * console.log(result.strategy.power); // 78
 * console.log(result.taunt_message); // "바보, ㅋㅋㅋ 이렇게 쏘는 거야!"
 */
export const getFortressStrategy = async ({ user_key, persona_key, game_state }) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏰 [gameApi] Requesting Fortress strategy...');
    console.log('   Distance:', game_state.distance);
    console.log('   Wind:', game_state.wind);
    console.log('   User HP:', game_state.user_tank?.hp);
    console.log('   AI HP:', game_state.ai_tank?.hp);
    
    const response = await apiClient.post(GAME_ENDPOINTS.FORTRESS_STRATEGY, {
      user_key,
      persona_key,
      game_state,
    });
    
    console.log('✅ [gameApi] Strategy received:');
    console.log('   Angle:', response.data.strategy.angle);
    console.log('   Power:', response.data.strategy.power);
    console.log('   Taunt:', response.data.taunt_message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response.data;
  } catch (error) {
    console.error('❌ [gameApi] getFortressStrategy error:', error);
    
    // Return fallback strategy on error
    return {
      success: false,
      strategy: {
        angle: 45,
        power: 80,
      },
      taunt_message: '내 차례야!',
      error: error.message,
    };
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Export gameApi object (for consistency with other API services)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
const gameApi = {
  getFortressStrategy,
  // Future: getTattooStrategy, getNostradamusStrategy
};

export default gameApi;
