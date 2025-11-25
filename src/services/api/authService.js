/**
 * 🔐 Authentication API Service
 * 
 * Handles all authentication-related API calls:
 * - Email verification (send code, verify code)
 * - Registration
 * - Login
 * - Token verification
 * 
 * All endpoints use idol-companion backend
 */

import { API_BASE_URL, AUTH_ENDPOINTS } from '../../config/api.config';

// ==================== Helper Functions ====================

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
  try {
    console.log('🔐 [authService] apiFetch endpoint:', endpoint);
    console.log('🔐 [authService] apiFetch options:', options);
    const response = await fetch(`${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    console.log('🔐 [authService] data:', data);
    return {
      success: data.success,
      status: data.errorCode,
    };
  } catch (error) {
    console.error('[API Fetch Error]', error);
    return {
      success: false,
      error: {
        errorCode: 'NETWORK_001',
        message: 'Network error occurred',
      },
    };
  }
}

// ==================== Email Verification ====================

/**
 * Send verification code to email
 * @param {string} email - User email
 * @param {string} language - Language code (ko, en)
 * @returns {Promise<{success: boolean, errorCode?: string, code?: string}>}
 */
export async function sendVerificationEmail(email, language = 'ko') {

  console.log('🔐 [authService] Sending verification email to:', email);
  console.log('🔐 [authService] AUTH_ENDPOINTS.SEND_VERIFICATION_EMAIL:', AUTH_ENDPOINTS.SEND_VERIFICATION_EMAIL);
  const result = await apiFetch(AUTH_ENDPOINTS.SEND_VERIFICATION_EMAIL, {
    method: 'POST',
    body: JSON.stringify({
      email,
      userId: email, // Use email as userId for backend compatibility
      language,
    }),
  });

  console.log('🔐 [authService] result:', result);

  if (result.success) {
    return {
      success: true,
      code: result.data.code, // Only returned in development mode
    };
  }

  return {
    success: false,
    errorCode: result.data?.errorCode || 'EMAIL_VERIFY_005',
  };
}

/**
 * Verify email code
 * @param {string} email - User email
 * @param {string} code - 5-digit verification code
 * @returns {Promise<{success: boolean, errorCode?: string}>}
 */
export async function verifyEmailCode(email, code) {
  const result = await apiFetch(AUTH_ENDPOINTS.VERIFY_EMAIL_CODE, {
    method: 'POST',
    body: JSON.stringify({
      email,
      code,
    }),
  });

  if (result.success) {
    return {
      success: true,
    };
  }

  return {
    success: false,
    errorCode: result.data?.errorCode || 'EMAIL_VERIFY_105',
  };
}

// ==================== Registration ====================

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {string} userData.userEmail - User email
 * @param {string} userData.userPw - User password
 * @param {string} userData.userPwConfirm - Password confirmation
 * @param {string} userData.verificationCode - Email verification code
 * @returns {Promise<{success: boolean, errorCode?: string, data?: Object}>}
 */
export async function register(userData) {
  const result = await apiFetch(AUTH_ENDPOINTS.REGISTER, {
    method: 'POST',
    body: JSON.stringify({
      userId: userData.userEmail, // Use email as userId
      userEmail: userData.userEmail,
      userPw: userData.userPw,
      userPwConfirm: userData.userPwConfirm,
      verificationCode: userData.verificationCode,
    }),
  });

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errorCode: result.data?.errorCode || 'AUTH_REGISTER_008',
  };
}

// ==================== Login ====================

/**
 * Login user
 * @param {string} userId - User ID or email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, errorCode?: string, data?: Object}>}
 */
export async function login(userId, password) {
  const result = await apiFetch(AUTH_ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      password,
    }),
  });

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errorCode: result.data?.errorCode || 'AUTH_LOGIN_004',
  };
}

// ==================== Token Verification ====================

/**
 * Verify authentication token
 * @param {string} token - JWT token
 * @returns {Promise<{success: boolean, errorCode?: string, data?: Object}>}
 */
export async function verifyToken(token) {
  const result = await apiFetch(AUTH_ENDPOINTS.VERIFY_TOKEN, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errorCode: result.data?.errorCode || 'AUTH_TOKEN_002',
  };
}

// ==================== Export All ====================

export default {
  sendVerificationEmail,
  verifyEmailCode,
  register,
  login,
  verifyToken,
};
