/**
 * 🔐 Authentication API Service
 * 
 * Handles all authentication-related API calls:
 * - Email verification (send code, verify code)
 * - Registration
 * - Login
 * - Token verification
 * - Token storage (AsyncStorage)
 * - Auto-login
 * 
 * All endpoints use idol-companion backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, AUTH_ENDPOINTS } from '../../config/api.config';

// ==================== Constants ====================

const TOKEN_STORAGE_KEY = '@anima_auth_token';
const USER_STORAGE_KEY = '@anima_user_data';

// ==================== Token Storage Functions ====================

/**
 * Save token to AsyncStorage
 * @param {string} token - JWT token
 */
async function saveToken(token) {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    console.log('✅ [authService] Token saved to storage');
  } catch (error) {
    console.error('❌ [authService] Failed to save token:', error);
    throw error;
  }
}

/**
 * Get token from AsyncStorage
 * @returns {Promise<string|null>} Token or null
 */
async function getToken() {
  try {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    return token;
  } catch (error) {
    console.error('❌ [authService] Failed to get token:', error);
    return null;
  }
}

/**
 * Remove token from AsyncStorage
 */
async function removeToken() {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    console.log('✅ [authService] Token removed from storage');
  } catch (error) {
    console.error('❌ [authService] Failed to remove token:', error);
    throw error;
  }
}

/**
 * Save user data to AsyncStorage
 * @param {Object} user - User data
 */
async function saveUser(user) {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    console.log('✅ [authService] User data saved to storage');
  } catch (error) {
    console.error('❌ [authService] Failed to save user data:', error);
    throw error;
  }
}

/**
 * Get user data from AsyncStorage
 * @returns {Promise<Object|null>} User data or null
 */
async function getUser() {
  try {
    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('❌ [authService] Failed to get user data:', error);
    return null;
  }
}

/**
 * Remove user data from AsyncStorage
 */
async function removeUser() {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    console.log('✅ [authService] User data removed from storage');
  } catch (error) {
    console.error('❌ [authService] Failed to remove user data:', error);
    throw error;
  }
}

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
      data: data.data
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
      errorCode: ''
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
 * @returns {Promise<{success: boolean, errorCode?: string, data?: Object, user?: Object, token?: string}>}
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
    // ✅ Save token and user to AsyncStorage (if provided)
    if (result.data.token) {
      await saveToken(result.data.token);
    }
    if (result.data.user) {
      await saveUser(result.data.user);
    }

    return {
      success: true,
      data: result.data,
      user: result.data.user,
      token: result.data.token,
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
 * @returns {Promise<{success: boolean, errorCode?: string, data?: Object, user?: Object, token?: string}>}
 */
export async function login(userId, password) {
  const result = await apiFetch(AUTH_ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      userPw: password,
    }),
  });

  if (result.success) {
    console.log('🔐 [authService] login result:', result);
    console.log('🔐 [authService] login result.data:', result.data);
    console.log('🔐 [authService] login result.data.user:', result.data.user);
    console.log('🔐 [authService] login result.data.token:', result.data.token);

    // ✅ Save token and user to AsyncStorage
    if (result.data.token) {
      await saveToken(result.data.token);
    }
    if (result.data.user) {
      await saveUser(result.data.user);
    }

    return {
      success: true,
      data: result.data,
      user: result.data.user,
      token: result.data.token,
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
    body: JSON.stringify({ token }),
  });

  if (result.success) {
    // ✅ Update user data in storage
    if (result.data.user) {
      await saveUser(result.data.user);
    }

    return {
      success: true,
      data: result.data,
      user: result.data.user,
    };
  }

  return {
    success: false,
    errorCode: result.data?.errorCode || 'AUTH_TOKEN_002',
  };
}

// ==================== Auto Login ====================

/**
 * Auto-login using saved token
 * @returns {Promise<Object|null>} User data or null
 */
export async function autoLogin() {
  try {
    console.log('🔍 [authService] Checking for saved token...');
    
    const token = await getToken();
    
    if (!token) {
      console.log('⚠️  [authService] No saved token found');
      return null;
    }

    console.log('✅ [authService] Token found, verifying...');
    
    const result = await verifyToken(token);
    
    if (result.success && result.user) {
      console.log('✅ [authService] Auto-login successful:', result.user.user_id);
      return result.user;
    } else {
      console.log('❌ [authService] Token invalid, removing...');
      await removeToken();
      await removeUser();
      return null;
    }
  } catch (error) {
    console.error('❌ [authService] Auto-login error:', error);
    await removeToken();
    await removeUser();
    return null;
  }
}

// ==================== Logout ====================

/**
 * Logout user (remove token and user data)
 */
export async function logout() {
  try {
    await removeToken();
    await removeUser();
    console.log('✅ [authService] Logout successful');
  } catch (error) {
    console.error('❌ [authService] Logout error:', error);
    throw error;
  }
}

// ==================== Export All ====================

export default {
  // Email verification
  sendVerificationEmail,
  verifyEmailCode,
  
  // Auth
  register,
  login,
  logout,
  verifyToken,
  autoLogin,
  
  // Token management
  saveToken,
  getToken,
  removeToken,
  
  // User data management
  saveUser,
  getUser,
  removeUser,
};
