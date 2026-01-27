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
 * 🔮 Tarot Game API (NEW)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Send tarot chat message (information gathering conversation)
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user_key - User key
 * @param {string} params.persona_key - Persona key (SAGE)
 * @param {Array} params.conversation_history - [{role: 'user'|'assistant', content: string}, ...]
 * @param {string} params.user_message - Current user message
 * 
 * @returns {Promise<Object>} Chat response
 * @returns {boolean} response.success - Request success
 * @returns {string} response.sage_response - SAGE's response
 * @returns {boolean} response.is_ready - Ready for card selection?
 * @returns {string} [response.conversation_summary] - Summary if ready
 * @returns {Object} [response.persona] - { name, image_url, video_url }
 */
export const sendTarotChat = async ({ user_key, persona_key, conversation_history, user_message }) => {
  try {
    console.log('🔮 [gameApi] Sending tarot chat message...');
    console.log('   Message:', user_message.substring(0, 50));
    console.log('   History length:', conversation_history?.length || 0);
    
    const response = await apiClient.post(GAME_ENDPOINTS.TAROT_CHAT, {
      user_key,
      persona_key,
      conversation_history,
      user_message,
    });
    
    console.log('✅ [gameApi] SAGE response received');
    console.log('   Is ready:', response.data.is_ready);
    
    return response.data;
  } catch (error) {
    console.error('❌ [gameApi] sendTarotChat error:', error);
    return {
      success: false,
      sage_response: '음... 잠시 카드들이 조용하네. 다시 한번 말해줄래?',
      is_ready: false,
      error: error.message,
    };
  }
};

/**
 * Get tarot card interpretation
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user_key - User key
 * @param {string} params.persona_key - Persona key (SAGE)
 * @param {Array} params.selected_cards - [{id, name_ko, name_en, keywords, meaning_up}, ...]
 * @param {string} params.conversation_summary - Summary of user's question
 * @param {string} [params.user_question] - User's original question
 * 
 * @returns {Promise<Object>} Interpretation response
 * @returns {boolean} response.success - Request success
 * @returns {Object} response.interpretation - Interpretation object
 * @returns {string} response.interpretation.overall - Overall reading
 * @returns {Array} response.interpretation.card_meanings - [{card_name, position, meaning}, ...]
 * @returns {string} response.interpretation.advice - SAGE's advice
 * @returns {string} response.interpretation.summary - One-sentence summary
 * @returns {Object} [response.persona] - { name, image_url, video_url }
 */
export const interpretTarotCards = async ({ user_key, persona_key, selected_cards, conversation_summary, user_question }) => {
  try {
    console.log('🔮 [gameApi] Requesting tarot interpretation...');
    console.log('   Cards:', selected_cards.map(c => c.name_ko).join(', '));
    
    const response = await apiClient.post(GAME_ENDPOINTS.TAROT_INTERPRET, {
      user_key,
      persona_key,
      selected_cards,
      conversation_summary,
      user_question,
    });
    
    console.log('✅ [gameApi] Interpretation received');
    console.log('   Summary:', response.data.interpretation.summary);
    
    return response.data;
  } catch (error) {
    console.error('❌ [gameApi] interpretTarotCards error:', error);
    return {
      success: false,
      interpretation: {
        overall: '카드들이 복잡한 이야기를 하고 있어. 조금 더 시간을 줘봐.',
        card_meanings: selected_cards.map((card, i) => ({
          card_name: card.name_ko,
          position: i === 0 ? '과거/원인' : i === 1 ? '현재/상황' : '미래/결과',
          meaning: card.meaning_up || '중요한 의미를 담고 있어.',
        })),
        advice: '지금은 내면의 목소리에 집중해봐.',
        summary: '카드가 주는 메시지를 마음에 새겨봐',
      },
      error: error.message,
    };
  }
};

/**
 * Save tarot reading result
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user_key - User key
 * @param {string} params.persona_key - Persona key (SAGE)
 * @param {Array} params.selected_cards - [{id, name_ko, name_en}, ...]
 * @param {string} [params.conversation_summary] - Brief summary
 * @param {string} [params.interpretation_summary] - Core message (max 1000 chars)
 * @param {number} [params.conversation_turns] - Number of conversation turns
 * @param {number} [params.duration_seconds] - Total duration
 * 
 * @returns {Promise<Object>} Save result response
 * @returns {boolean} response.success - Request success
 * @returns {string} response.reading_id - Unique reading ID
 * @returns {string} response.message - Success message
 */
export const saveTarotReading = async ({ 
  user_key, 
  persona_key, 
  selected_cards, 
  conversation_summary, 
  interpretation_summary,
  conversation_turns,
  duration_seconds
}) => {
  try {
    console.log('🔮 [gameApi] Saving tarot reading...');
    console.log('   Cards:', selected_cards.map(c => c.name_ko).join(', '));
    
    const response = await apiClient.post(GAME_ENDPOINTS.TAROT_SAVE, {
      user_key,
      persona_key,
      selected_cards,
      conversation_summary,
      interpretation_summary,
      conversation_turns,
      duration_seconds,
    });
    
    console.log('✅ [gameApi] Tarot reading saved');
    console.log('   Reading ID:', response.data.reading_id);
    
    return response.data;
  } catch (error) {
    console.error('❌ [gameApi] saveTarotReading error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate tarot gift (emotional gift after reading)
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user_key - User key
 * @param {Object} params.interpretation - Full interpretation result with judgment
 * @param {string} [params.conversation_summary] - Brief summary
 * @param {Array} [params.selected_cards] - Selected tarot cards (for image generation)
 * 
 * @returns {Promise<Object>} Gift generation response
 * @returns {boolean} response.success - Request success
 * @returns {Object} response.gift - Gift object
 * @returns {string} response.gift.gift_id - Unique gift ID
 * @returns {string} response.gift.type - 'tarot_result'
 * @returns {string} response.gift.message - Gift message from SAGE
 * @returns {string} response.gift.image_url - SAGE's image URL (Tarot card + background)
 */
export const generateTarotGift = async ({ user_key, interpretation, conversation_summary, selected_cards }) => {
  try {
    console.log('🎁 [gameApi] Generating tarot gift...');
    console.log('   Judgment:', interpretation?.judgment?.outcome || 'none');
    console.log('   Cards:', selected_cards?.length || 0);
    
    const response = await apiClient.post(GAME_ENDPOINTS.TAROT_GIFT, {
      user_key,
      interpretation,
      conversation_summary,
      selected_cards,
    });
    
    console.log('✅ [gameApi] Tarot gift generated');
    console.log('   Gift ID:', response.data.gift.gift_id);
    console.log('   Message:', response.data.gift.message?.substring(0, 50));
    
    return response.data;
  } catch (error) {
    console.error('❌ [gameApi] generateTarotGift error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🙏 Confession System API (NEW)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Send confession chat message (deep listening conversation)
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user_key - User key
 * @param {string} params.persona_key - Persona key (NEXUS)
 * @param {Array} params.conversation_history - [{role: 'user'|'assistant', content: string}, ...]
 * @param {string} params.user_message - Current user message
 * 
 * @returns {Promise<Object>} Chat response
 * @returns {boolean} response.success - Request success
 * @returns {string} response.nexus_response - NEXUS's response
 * @returns {boolean} response.is_ready - Ready for listening phase?
 * @returns {string} [response.conversation_summary] - Summary if ready
 * @returns {number} response.updated_count - Updated daily chat count
 * @returns {number} response.daily_limit - Daily chat limit
 */
export const sendConfessionChat = async ({ user_key, persona_key, conversation_history, user_message }) => {
  try {
    console.log('🙏 [gameApi] Sending confession chat message...');
    console.log('   Message:', user_message.substring(0, 50));
    console.log('   History length:', conversation_history?.length || 0);
    
    const response = await apiClient.post(GAME_ENDPOINTS.CONFESSION_CHAT, {
      user_key,
      persona_key,
      conversation_history,
      user_message,
    });
    
    console.log('✅ [gameApi] NEXUS response received');
    console.log('   Is ready:', response.data.is_ready);
    console.log('   Updated count:', response.data.updated_count);
    
    return response.data;
  } catch (error) {
    console.error('❌ [gameApi] sendConfessionChat error:', error);
    return {
      success: false,
      nexus_response: '죄송합니다. 잠시 생각이 복잡해졌습니다. 다시 한번 말씀해 주시겠어요?',
      is_ready: false,
      error: error.message,
    };
  }
};

/**
 * Generate confession gift (emotional gift after confession)
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user_key - User key
 * @param {string} [params.conversation_summary] - Brief summary
 * 
 * @returns {Promise<Object>} Gift generation response
 * @returns {boolean} response.success - Request success
 * @returns {Object} response.gift - Gift object
 * @returns {string} response.gift.gift_id - Unique gift ID
 * @returns {string} response.gift.type - 'confession_hope'
 * @returns {string} response.gift.message - Gift message from NEXUS
 * @returns {string} response.gift.image_url - null (pending generation)
 * @returns {string} response.gift.image_status - 'pending'
 */
export const generateConfessionGift = async ({ user_key, conversation_summary }) => {
  try {
    console.log('🎁 [gameApi] Generating confession gift...');
    console.log('   Summary:', conversation_summary?.substring(0, 50));
    
    const response = await apiClient.post(GAME_ENDPOINTS.CONFESSION_GIFT, {
      user_key,
      conversation_summary,
    });
    
    console.log('✅ [gameApi] Confession gift generated');
    console.log('   Gift ID:', response.data.gift.gift_id);
    console.log('   Message:', response.data.gift.message?.substring(0, 50));
    
    return response.data;
  } catch (error) {
    console.error('❌ [gameApi] generateConfessionGift error:', error);
    return {
      success: false,
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
  checkGameLimit,
  saveGameResult,
  getGameStats,
  // 🔮 Tarot API
  sendTarotChat,
  interpretTarotCards,
  saveTarotReading,
  generateTarotGift,
  // 🙏 Confession API
  sendConfessionChat,
  generateConfessionGift,  // 🆕 Added confession gift
  // Future: getTattooStrategy, getNostradamusStrategy
};

export default gameApi;
