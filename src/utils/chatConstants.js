/**
 * 💬 Chat Constants - ManagerAIOverlay Configuration
 * 
 * @author JK & Hero Nexus AI
 * @description Centralized constants for chat behavior
 */

// ⏱️ Timing Constants
export const TIMING = {
  TYPING_SPEED: 30, // ms per character
  TYPING_BUFFER: 100, // ms - buffer after typing completes
  AI_CONTINUE_DELAY: 800, // ms - delay before AI continues conversation
  NOTIFICATION_AUTO_HIDE: 2000, // ms - auto-hide duration for notifications
};

// 🔄 AI Behavior Constants
export const AI_BEHAVIOR = {
  MAX_CONTINUES: 5, // Maximum number of continuous AI messages
};

// 🌟 Identity Evolution Constants
export const IDENTITY_EVOLUTION = {
  INTERVAL: 3000, // ms - interval between each evolution notification
  DISPLAY_DURATION: 2500, // ms - how long each notification is displayed
};

// 📜 Chat History Constants
export const CHAT_HISTORY = {
  INITIAL_LIMIT: 20, // ⭐ CHANGED: 100 → 20 (Load only recent 20 messages initially for better performance!)
  LOAD_MORE_LIMIT: 20, // Number of messages to load when "load more" is triggered
  MIN_MESSAGES_FOR_LEARNING: 3, // Minimum messages required to trigger background learning
};

// 🏷️ Special Markers
export const SPECIAL_MARKERS = {
  AUTO_START: '[AUTO_START]', // Marker for auto-started conversations
  CONTINUE: '[CONTINUE]', // Marker for AI continuation requests
};

// 🎨 Message Types
export const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  AI: 'ai',
  NOTIFICATION: 'notification',
  GREETING: 'greeting',
  ERROR: 'error',
};

// 📝 Field Labels for Identity Evolution (i18n-ready)
export const IDENTITY_FIELD_LABELS = {
  personality: { icon: '🎭', text: '성격' },
  speaking_style: { icon: '💬', text: '말투' },
  interests: { icon: '💫', text: '관심사' },
  name_ko: { icon: '✨', text: '이름' },
  name_en: { icon: '✨', text: '이름' },
  background: { icon: '🌟', text: '배경' },
  profession: { icon: '👔', text: '직업' },
  description: { icon: '📝', text: '설명' },
};

/**
 * Calculate typing duration based on text length
 * @param {string} text - The text to calculate duration for
 * @returns {number} Duration in milliseconds
 */
export const calculateTypingDuration = (text) => {
  return text.length * TIMING.TYPING_SPEED;
};

/**
 * Calculate total duration including buffer
 * @param {string} text - The text to calculate duration for
 * @returns {number} Total duration in milliseconds
 */
export const calculateTotalDuration = (text) => {
  return calculateTypingDuration(text) + TIMING.TYPING_BUFFER;
};

