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

// ==================== Base URL ====================

/**
 * API Base URL
 * Production: idol-companion backend URL
 * Development: Can be overridden with environment variable
 */
export const API_BASE_URL = process.env.API_BASE_URL || 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app';

// ==================== API Endpoints ====================

/**
 * Amount Endpoints
 */
export const AMOUNT_ENDPOINTS = {
  GET_SERVICE_DATA: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/service',
};
/**
 * Authentication Endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/auth/login',
  REGISTER: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/auth/register',
  VERIFY_TOKEN: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/auth/verify-token',
  SEND_VERIFICATION_EMAIL: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/auth/send-verification-email',
  VERIFY_EMAIL_CODE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/auth/verify-email-code',
  APPROVE_TERMS: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/auth/approve-terms',
  WITHDRAW: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/auth/withdraw',
  SEND_PASSWORD_RESET_EMAIL: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/auth/send-password-reset-email',
  RESET_PASSWORD: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/auth/reset-password',
  SOCIAL_LOGIN: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/auth/social-login', // ⭐ Social login (Google, Apple, etc.)
};

/**
 * Persona Endpoints
 */
export const PERSONA_ENDPOINTS = {
  LIST: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/persona/persona-list',
  CREATE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/persona/create',
  DASHBOARD: '/api/persona/dashboard',
  CHECK_STATUS: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/persona/check-status',
  CHECK_STATUS_FIRST: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/persona/check-status-first',
  UPDATE_SETTINGS: '/api/persona/update-settings',
  UPDATE_BASIC: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/persona/update-basic', // ⭐ Mobile optimized: name, category
  UPDATE_STATUS: '/api/persona/update-status',
  REMOVE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/persona/remove-persona',
  UPGRADE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/persona/upgrade', // ⭐ Video conversion
  FAVORITE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/persona/favorite', // ⭐ Toggle favorite
  DRESS_LIST: '/api/persona/dress-list',
  UPDATE_DRESS_CODE: '/api/persona/update-dress-code',
  HASHTAGS: '/api/persona/hashtags',
  NOTIFICATION_STREAM: '/api/persona/notification-stream',
  UPGRADE_MEMORY: '/api/persona/upgrade-memory',
  CREATE_MEMORY: '/api/persona/create-memory',
  CREATE_FOOD_MEMORY: '/api/persona/create-food-memory',
};

/**
 * Chat Endpoints
 */
export const CHAT_ENDPOINTS = {
  MANAGER_QUESTION: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/chat/manager-question',
  PERSONA_CHAT: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/chat/persona-chat',
  MEMORY_CHAT: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/chat/memory-chat',
  PUBLIC: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/chat/public',
  PUBLIC_AI: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/chat/public-ai',
};

/**
 * Memory Endpoints
 */
export const MEMORY_ENDPOINTS = {
  STORY: '/api/memory/story',
  CHECK_STATUS: '/api/memory/check-status',
  CONVERT_TO_VIDEO: '/api/memory/convert-to-video',
  PUBLIC: '/api/memory/public',
  REMOVE: '/api/memory/remove-memory',
  SETTINGS: '/api/memory/settings',
  SHARE: '/api/memory/share',
  TOGGLE_PUBLIC: '/api/memory/toggle-public',
};

/**
 * Diary Endpoints
 */
export const DIARY_ENDPOINTS = {
  LIST: '/api/diary/list',
  READ: '/api/diary/read',
  REACTION: '/api/diary/reaction',
  TIMELINE: '/api/diary/timeline',
};

/**
 * Peek Endpoints (Public Personas)
 */
export const PEEK_ENDPOINTS = {
  LIST: '/api/peek/list',
  OWNER_INFO: '/api/peek/owner-info',
  FAVORITES: '/api/peek/favorites',
  RECOMMEND: '/api/peek/recommend',
  REVIEW: '/api/peek/review',
  REVIEW_CHECK: '/api/peek/review-check',
};

/**
 * Profile Endpoints
 */
export const PROFILE_ENDPOINTS = {
  CHECK_STATUS: '/api/profile/check-status',
  UPDATE_NAME: '/api/profile/update-name',
  UPLOAD_IMAGE: '/api/profile/upload-image',
};

/**
 * Learning Endpoints
 */
export const LEARNING_ENDPOINTS = {
  LIST: '/api/learning/list',
  SAVE: '/api/learning/save',
  DELETE: '/api/learning/delete',
  EXTRACT_URL: '/api/learning/extract-url',
  EXTRACT_FILE: '/api/learning/extract-file',
  SEARCH_GOOGLE: '/api/learning/search-google',
  SEARCH_WIKI: '/api/learning/search-wiki',
};

/**
 * Mission Endpoints
 */
export const MISSION_ENDPOINTS = {
  DAILY_STATUS: '/api/mission/daily-status',
  UPDATE: '/api/mission/update',
};

/**
 * User Endpoints
 */
export const USER_ENDPOINTS = {
  UPDATE_PROFILE: '/api/user/update-profile',
};

/**
 * Payment Endpoints
 */
export const PAYMENT_ENDPOINTS = {
  CHARGE: '/api/payment/charge',
};

/**
 * Study Endpoints
 */
export const STUDY_ENDPOINTS = {
  LIST: '/api/study/list',
  DETAIL: '/api/study/detail',
  VIEW: '/api/study/view',
  FAVORITE: '/api/study/favorite',
  STATS: '/api/study/stats',
};

/**
 * Message Endpoints
 */
export const MESSAGE_ENDPOINTS = {
 // CREATE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/create',
 CREATE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/create',
  LIST: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/list',
  PUBLIC: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/public',
  VERIFY_PASSWORD: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/verify-password',
  REUSE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/reuse',
  DELETE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/delete',
  SHARE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/share',
  FAVORITE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/favorite',
  REPLY: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/reply', // ⭐ Reply to message
  REPLIES: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/message/replies', // ⭐ Get replies list
};

/**
 * Music Endpoints
 */
export const MUSIC_ENDPOINTS = {
  LIST: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/music/list',
  CREATE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/music/create',
  CHECK_STATUS: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/music/check-status',
  DELETE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/music/delete',
  FAVORITE: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/music/favorite',
};

/**
 * Health Check
 */
export const HEALTH_ENDPOINT = '/api/health';

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
  HEALTH_ENDPOINT,
  AMOUNT_ENDPOINTS,
};

