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
 * 🎮 Game Management API (NEW)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Check if user can play a game (daily limit check)
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user_key - User key
 * @param {string} params.game_type - 'fortress', 'tarot', 'confession'
 * 
 * @returns {Promise<Object>} Limit check response
 * @returns {boolean} response.success - Request success
 * @returns {boolean} response.data.can_play - Can user play?
 * @returns {number} response.data.daily_limit - Daily limit for user's tier
 * @returns {number} response.data.current_count - Games played today
 * @returns {number} response.data.remaining - Remaining games today
 * @returns {string} response.data.tier - User's service tier
 * @returns {string} response.data.message - User-friendly message
 */
export const checkGameLimit = async ({ user_key, game_type }) => {
  try {
    console.log(`🎮 [gameApi] Checking ${game_type} limit for user: ${user_key}`);
    
    const response = await apiClient.post(GAME_ENDPOINTS.CHECK_LIMIT, {
      user_key,
      game_type,
    });
    
    console.log(`✅ [gameApi] Limit check: can_play=${response.data.data.can_play}, remaining=${response.data.data.remaining}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ [gameApi] checkGameLimit error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Save game result
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user_key - User key
 * @param {string} params.persona_key - Persona key
 * @param {string} params.game_type - 'fortress', 'tarot', 'confession'
 * @param {string} params.game_result - 'win', 'lose', 'draw', 'completed'
 * @param {Object} [params.game_data] - Game-specific data (JSON)
 * 
 * @returns {Promise<Object>} Save result response
 * @returns {boolean} response.success - Request success
 * @returns {string} response.data.record_id - Created record ID
 * @returns {string} response.data.message - Success message
 */
export const saveGameResult = async ({ user_key, persona_key, game_type, game_result, game_data }) => {
  try {
    console.log(`🎮 [gameApi] Saving ${game_type} result: ${game_result}`);
    
    const response = await apiClient.post(GAME_ENDPOINTS.SAVE_RESULT, {
      user_key,
      persona_key,
      game_type,
      game_result,
      game_data,
    });
    
    console.log(`✅ [gameApi] Game result saved: ${response.data.data.record_id}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ [gameApi] saveGameResult error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get game statistics
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user_key - User key
 * @param {string} params.persona_key - Persona key
 * @param {string} params.game_type - 'fortress', 'tarot', 'confession'
 * 
 * @returns {Promise<Object>} Stats response
 * @returns {boolean} response.success - Request success
 * @returns {number} response.data.wins - Total wins
 * @returns {number} response.data.losses - Total losses
 * @returns {number} response.data.draws - Total draws
 * @returns {number} response.data.total_games - Total games played
 * @returns {string} response.data.win_rate - Win rate percentage
 * @returns {string} response.data.record_text - "3승 2패" format
 * @returns {Object} [response.data.additional_stats] - Game-specific stats
 */
export const getGameStats = async ({ user_key, persona_key, game_type }) => {
  try {
    console.log(`🎮 [gameApi] Getting ${game_type} stats for ${user_key} vs ${persona_key}`);
    
    const response = await apiClient.get(
      `${GAME_ENDPOINTS.STATS}?user_key=${user_key}&persona_key=${persona_key}&game_type=${game_type}`
    );
    
    console.log(`✅ [gameApi] Stats: ${response.data.data.record_text}, win_rate=${response.data.data.win_rate}%`);
    
    return response.data;
  } catch (error) {
    console.error('❌ [gameApi] getGameStats error:', error);
    return {
      success: false,
      error: error.message,
      data: {
        wins: 0,
        losses: 0,
        draws: 0,
        total_games: 0,
        win_rate: '0.0',
        record_text: '0승 0패',
      }
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
  checkGameLimit,
  saveGameResult,
  getGameStats,
  // Future: getTattooStrategy, getNostradamusStrategy
};

export default gameApi;
