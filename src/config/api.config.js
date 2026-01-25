/**
 * 🔧 API Configuration
 * 
 * All API endpoints and configuration for idol-companion backend
 * 
 * IMPORTANT:
 * - DO NOT hardcode API URLs in components!
 * - Always use these constants
 * - Environment-specific URLs should use .env files
 */

import { Platform } from "react-native";

// ==================== Base URL ====================

/**
 * API Base URL
 * Production: idol-companion backend URL
 * Development: Can be overridden with environment variable
 */
//export const API_BASE_URL = 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app';

// ⚠️ DEVELOPMENT MODE: Mac의 IP를 여기에 입력하세요!
// 터미널에서 확인: ipconfig getifaddr en0
const MAC_LOCAL_IP = '14.138.121.2';  // ← 여기를 수정하세요!

/*
// 자동 감지: 에뮬레이터 vs 실제 디바이스
export const API_BASE_URL =  false
  ? Platform.OS === 'android' 
    ? `http://${MAC_LOCAL_IP}:3000`  // Android (에뮬레이터 + 실제 디바이스 모두 작동!)
    : `http://${MAC_LOCAL_IP}:3000`  // iOS
  : 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app';  // Production
*/

//export const API_BASE_URL = `http://${MAC_LOCAL_IP}:3000`;
export const API_BASE_URL = process.env.LIVE_API_BASE_URL || 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app';


// ==================== API Endpoints ====================

/**
 * Amount Endpoints
 */
export const AMOUNT_ENDPOINTS = {
  GET_SERVICE_DATA: API_BASE_URL + '/api/service',
};
/**
 * Authentication Endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: API_BASE_URL + '/api/auth/login',
  REGISTER: API_BASE_URL + '/api/auth/register',
  VERIFY_TOKEN: API_BASE_URL + '/api/auth/verify-token',
  SEND_VERIFICATION_EMAIL: API_BASE_URL + '/api/auth/send-verification-email',
  VERIFY_EMAIL_CODE: API_BASE_URL + '/api/auth/verify-email-code',
  APPROVE_TERMS: API_BASE_URL + '/api/auth/approve-terms',
  WITHDRAW: API_BASE_URL + '/api/auth/withdraw',
  SEND_PASSWORD_RESET_EMAIL: API_BASE_URL + '/api/auth/send-password-reset-email',
  RESET_PASSWORD: API_BASE_URL + '/api/auth/reset-password',
  SOCIAL_LOGIN: API_BASE_URL + '/api/auth/social-login', // ⭐ Social login (Google, Apple, etc.)
};

/**
 * Persona Endpoints
 */
export const PERSONA_ENDPOINTS = {
  LIST: API_BASE_URL + '/api/persona/persona-list',
  CREATE: API_BASE_URL + '/api/persona/create',
  CREATE_IDENTITY: API_BASE_URL + '/api/persona/identity/create-client-side', // 🎭 Soul Creator: Create persona identity
  CREATE_DRESS: API_BASE_URL + '/api/persona/create-dress',
  DASHBOARD: API_BASE_URL + '/api/persona/dashboard',
  CHECK_STATUS: API_BASE_URL + '/api/persona/check-status',
  CHECK_STATUS_FIRST: API_BASE_URL + '/api/persona/check-status-first',
  UPDATE_SETTINGS: API_BASE_URL + '/api/persona/update-settings',
  UPDATE_BASIC: API_BASE_URL + '/api/persona/update-basic', // ⭐ Mobile optimized: name, category
  UPDATE_STATUS: API_BASE_URL + '/api/persona/update-status',
  REMOVE: API_BASE_URL + '/api/persona/remove-persona',
  UPGRADE: API_BASE_URL + '/api/persona/upgrade', // ⭐ Video conversion
  FAVORITE: API_BASE_URL + '/api/persona/favorite', // ⭐ Toggle favorite
  UPDATE_DRESS: API_BASE_URL + '/api/persona/update-dress', // 👗 Update persona dress
  DRESS_LIST: API_BASE_URL + '/api/persona/dress-list',
  UPDATE_DRESS_CODE: API_BASE_URL + '/api/persona/update-dress-code',
  HASHTAGS: API_BASE_URL + '/api/persona/hashtags',
  NOTIFICATION_STREAM: API_BASE_URL + '/api/persona/notification-stream',
  UPGRADE_MEMORY: API_BASE_URL + '/api/persona/upgrade-memory',
  CREATE_MEMORY: API_BASE_URL + '/api/persona/create-memory',
  CREATE_FOOD_MEMORY: API_BASE_URL + '/api/persona/create-food-memory',
  RELATIONSHIP_STATUS: API_BASE_URL + '/api/anima/persona/relationship-status',
  UPDATE_COMMENT_CHECKED: API_BASE_URL + '/api/persona/mark-comment-read',
  HEART_DISPLAY: API_BASE_URL + '/api/persona/heart-display', // 💖 Real-time heart display data
  EMOTION_STATS: API_BASE_URL + '/api/persona/emotion-stats', // 😊 Emotion statistics (2026-01-19)
};

/**
 * Chat Endpoints
 */
export const CHAT_ENDPOINTS = {
  // ⭐ ANIMA v2.0 Chat API (New!)
  ANIMA_CHAT: API_BASE_URL + '/api/anima/chat',
  
  // Legacy endpoints (deprecated)
  MANAGER_QUESTION: API_BASE_URL + '/api/chat/manager-question',
  PERSONA_CHAT: API_BASE_URL + '/api/chat/persona-chat',
  MEMORY_CHAT: API_BASE_URL + '/api/chat/memory-chat',
  PUBLIC: API_BASE_URL + '/api/chat/public',
  PUBLIC_AI: API_BASE_URL + '/api/chat/public-ai',
  SPEAKING_PATTERN: API_BASE_URL + '/api/persona/identity/speaking-pattern',
};

/**
 * Memory Endpoints
 */
export const MEMORY_ENDPOINTS = {
  STORY: API_BASE_URL + '/api/memory/story',
  CHECK_STATUS: API_BASE_URL + '/api/memory/check-status',
  CONVERT_TO_VIDEO: API_BASE_URL + '/api/memory/convert-to-video',
  PUBLIC: API_BASE_URL + '/api/memory/public',
  REMOVE: API_BASE_URL + '/api/memory/remove-memory',
  SETTINGS: API_BASE_URL + '/api/memory/settings',
  SHARE: API_BASE_URL + '/api/memory/share',
  TOGGLE_PUBLIC: API_BASE_URL + '/api/memory/toggle-public',
  LIST: API_BASE_URL + '/api/memory/gift',
  DELETE: API_BASE_URL + '/api/memory/delete-gift', // 🆕 Delete emotional gift
};

/**
 * Diary Endpoints
 */
export const DIARY_ENDPOINTS = {
  LIST: API_BASE_URL + '/api/diary/list',
  READ: API_BASE_URL + '/api/diary/read',
  REACTION: API_BASE_URL + '/api/diary/reaction',
  TIMELINE: API_BASE_URL + '/api/diary/timeline',
};

/**
 * Peek Endpoints (Public Personas)
 */
export const PEEK_ENDPOINTS = {
  LIST: API_BASE_URL + '/api/peek/list',
  OWNER_INFO: '/api/peek/owner-info',
  FAVORITES: API_BASE_URL + '/api/peek/favorites',
  RECOMMEND: API_BASE_URL + '/api/peek/recommend',
  REVIEW: API_BASE_URL + '/api/peek/review',
  REVIEW_CHECK: API_BASE_URL + '/api/peek/review-check',
};

/**
 * Profile Endpoints
 */
export const PROFILE_ENDPOINTS = {
  CHECK_STATUS: API_BASE_URL + '/api/profile/check-status',
  UPDATE_NAME: API_BASE_URL + '/api/profile/update-name',
  UPLOAD_IMAGE: API_BASE_URL + '/api/profile/upload-image',
};

/**
 * Learning Endpoints
 */
export const LEARNING_ENDPOINTS = {
  LIST: API_BASE_URL + '/api/learning/list',
  SAVE: API_BASE_URL + '/api/learning/save',
  DELETE: API_BASE_URL + '/api/learning/delete',
  EXTRACT_URL: API_BASE_URL + '/api/learning/extract-url',
  EXTRACT_FILE: API_BASE_URL + '/api/learning/extract-file',
  SEARCH_GOOGLE: API_BASE_URL + '/api/learning/search-google',
  SEARCH_WIKI: API_BASE_URL + '/api/learning/search-wiki',
};

/**
 * Mission Endpoints
 */
export const MISSION_ENDPOINTS = {
  DAILY_STATUS: API_BASE_URL + '/api/mission/daily-status',
  UPDATE: API_BASE_URL + '/api/mission/update',
};

/**
 * User Endpoints
 */
export const USER_ENDPOINTS = {
  UPDATE_PROFILE: API_BASE_URL + '/api/user/update-profile',
};

/**
 * Payment Endpoints
 */
export const PAYMENT_ENDPOINTS = {
  CHARGE: API_BASE_URL + '/api/payment/charge',
};

/**
 * Study Endpoints
 */
export const STUDY_ENDPOINTS = {
  LIST: API_BASE_URL + '/api/study/list',
  DETAIL: API_BASE_URL + '/api/study/detail',
  VIEW: API_BASE_URL + '/api/study/view',
  FAVORITE: API_BASE_URL + '/api/study/favorite',
  STATS: API_BASE_URL + '/api/study/stats',
};

/**
 * Message Endpoints
 */
export const MESSAGE_ENDPOINTS = {
 // CREATE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/create',
 CREATE: API_BASE_URL + '/api/message/create',
  LIST: API_BASE_URL + '/api/message/list',
  PUBLIC: API_BASE_URL + '/api/message/public',
  VERIFY_PASSWORD: API_BASE_URL + '/api/message/verify-password',
  REUSE: API_BASE_URL + '/api/message/reuse',
  DELETE: API_BASE_URL + '/api/message/delete',
  SHARE: API_BASE_URL + '/api/message/share',
  FAVORITE: API_BASE_URL + '/api/message/favorite',
  REPLY: API_BASE_URL + '/api/message/reply', // ⭐ Reply to message
  REPLIES: API_BASE_URL + '/api/message/replies', // ⭐ Get replies list
  VALIDATE: API_BASE_URL + '/api/validate-message', // ⭐ Message content validation (LLM-based)
};

/**
 * Music Endpoints
 */
export const MUSIC_ENDPOINTS = {
  LIST: API_BASE_URL + '/api/music/list',
  CREATE: API_BASE_URL + '/api/music/create',
  CHECK_STATUS: API_BASE_URL + '/api/music/check-status',
  DELETE: API_BASE_URL + '/api/music/delete',
  FAVORITE: API_BASE_URL + '/api/music/favorite',
};

/**
 * 🎮 Game Endpoints
 */
export const GAME_ENDPOINTS = {
  FORTRESS_STRATEGY: API_BASE_URL + '/api/game/fortress-strategy', // 🏰 Fortress game AI strategy
  CHECK_LIMIT: API_BASE_URL + '/api/game/check-limit', // 🎮 Check daily game limit
  SAVE_RESULT: API_BASE_URL + '/api/game/save-result', // 💾 Save game result
  STATS: API_BASE_URL + '/api/game/stats', // 📊 Get game statistics
  // 🔮 Tarot Game Endpoints
  TAROT_CHAT: API_BASE_URL + '/api/tarot/chat', // 💬 Tarot conversation (SAGE Q&A)
  TAROT_INTERPRET: API_BASE_URL + '/api/tarot/interpret', // 🎴 Tarot card interpretation
  TAROT_SAVE: API_BASE_URL + '/api/tarot/save-reading', // 💾 Save tarot reading
  TAROT_GIFT: API_BASE_URL + '/api/tarot/gift', // 🎁 Generate tarot gift (emotional gift)
};

/**
 * Point Endpoints
 */
export const POINT_ENDPOINTS = {
  PURCHASE: API_BASE_URL + '/api/points/purchase', // ⚠️ Virtual purchase (dev/test)
  HISTORY: API_BASE_URL + '/api/points/history',
};

/**
 * IAP (In-App Purchase) Endpoints
 */
export const IAP_ENDPOINTS = {
  VERIFY: API_BASE_URL + '/api/iap/verify', // ✅ Real IAP receipt verification
};

/**
 * Subscription (구독형 IAP) Endpoints
 */
export const SUBSCRIPTION_ENDPOINTS = {
  VERIFY: API_BASE_URL + '/api/subscription/verify', // ✅ 구독 구매 검증
  STATUS: API_BASE_URL + '/api/subscription/status', // ✅ 구독 상태 확인
  CANCEL: API_BASE_URL + '/api/subscription/cancel', // ✅ 구독 취소 (클라이언트 요청)
  WEBHOOK_ANDROID: API_BASE_URL + '/api/subscription/webhook/android', // 🔔 Google Play Webhook
  WEBHOOK_IOS: API_BASE_URL + '/api/subscription/webhook/ios', // 🔔 App Store Webhook
};


/**
 * FCM (Firebase Cloud Messaging) Endpoints
 */
export const FCM_ENDPOINTS = {
  UPDATE_TOKEN: API_BASE_URL + '/api/fcm/token', // ⭐ Update FCM push token
};

/**
 * Health Check
 */
export const HEALTH_ENDPOINT = API_BASE_URL + '/api/health';

// ==================== API Configuration ====================

/**
 * HTTP Request Timeout (milliseconds)
 */
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * Retry Configuration
 */
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryOn: [408, 429, 500, 502, 503, 504], // HTTP status codes to retry
};

/**
 * Request Headers
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// ==================== Export All ====================

export default {
  API_BASE_URL,
  API_TIMEOUT,
  API_RETRY_CONFIG,
  DEFAULT_HEADERS,
  
  // Endpoints
  AUTH_ENDPOINTS,
  PERSONA_ENDPOINTS,
  CHAT_ENDPOINTS,
  MEMORY_ENDPOINTS,
  DIARY_ENDPOINTS,
  PEEK_ENDPOINTS,
  PROFILE_ENDPOINTS,
  LEARNING_ENDPOINTS,
  MISSION_ENDPOINTS,
  USER_ENDPOINTS,
  PAYMENT_ENDPOINTS,
  STUDY_ENDPOINTS,
  MESSAGE_ENDPOINTS,
  MUSIC_ENDPOINTS,
  FCM_ENDPOINTS, // ⭐ NEW: FCM endpoints
  POINT_ENDPOINTS, // ⭐ NEW: Point endpoints
  IAP_ENDPOINTS, // ⭐ NEW: IAP endpoints
  SUBSCRIPTION_ENDPOINTS, // 🎖️ NEW: Subscription endpoints
  HEALTH_ENDPOINT,
  AMOUNT_ENDPOINTS,
};

