/**
 * 🔐 Authentication Service
 * 
 * All authentication-related API calls for idol-companion backend
 * 
 * Features:
 * - Login
 * - Register
 * - Email verification
 * - Token verification
 * - Logout
 * 
 * IMPORTANT: This service uses ONLY idol-companion API endpoints!
 */

import { post } from './client';
import { saveToken, removeToken, getToken } from './client';
import { AUTH_ENDPOINTS } from '@/config/api.config';

// ==================== Login ====================

/**
 * User login
 * 
 * @param {string} userId - User ID or email
 * @param {string} userPw - Password
 * @returns {Promise<object>} Login response with token and user info
 * 
 * Response format:
 * {
 *   success: true,
 *   message: "Login successful",
 *   data: {
 *     token: "JWT token",
 *     user: { idx, user_key, user_id, user_email, ... }
 *   }
 * }
 * 
 * Error codes:
 * - AUTH_LOGIN_001: Missing fields
 * - AUTH_LOGIN_002: User not found
 * - AUTH_LOGIN_003: Incorrect password
 */
export const login = async (userId, userPw) => {
  try {
    // Validate input
    if (!userId || !userPw) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'User ID and password are required',
        errorCode: 'AUTH_LOGIN_001',
      };
    }
    
    // Trim input
    const trimmedUserId = userId.trim();
    const trimmedUserPw = userPw.trim();
    
    // Make API request
    const response = await post(AUTH_ENDPOINTS.LOGIN, {
      userId: trimmedUserId,
      userPw: trimmedUserPw,
    });
    
    // Check response
    if (response.success && response.data && response.data.token) {
      // Save token to AsyncStorage
      await saveToken(response.data.token);
      
      if (__DEV__) {
        console.log('[AuthService] Login successful for user:', response.data.user.user_id);
      }
      
      return response;
    } else {
      throw {
        code: 'API_ERROR',
        message: response.message || 'Login failed',
        errorCode: response.errorCode,
      };
    }
  } catch (error) {
    console.error('[AuthService] Login error:', error);
    throw error;
  }
};

// ==================== Register ====================

/**
 * User registration
 * 
 * @param {string} userId - User ID (4-20 chars, alphanumeric)
 * @param {string} userEmail - Email address
 * @param {string} userPw - Password (min 8 chars, uppercase + lowercase + number)
 * @param {string} userPwConfirm - Password confirmation
 * @param {string} verificationCode - Email verification code
 * @returns {Promise<object>} Registration response with token and user info
 * 
 * Response format:
 * {
 *   success: true,
 *   message: "Registration completed successfully",
 *   data: {
 *     token: "JWT token",
 *     user: { idx, user_key, user_id, user_email, user_point }
 *   }
 * }
 * 
 * Error codes:
 * - AUTH_REGISTER_001: Missing fields
 * - AUTH_REGISTER_002: Invalid user ID format
 * - AUTH_REGISTER_003: Invalid email format
 * - AUTH_REGISTER_004: Password mismatch
 * - AUTH_REGISTER_005: Password too weak
 * - AUTH_REGISTER_006: Email not verified
 * - AUTH_REGISTER_007: Email already taken
 * - AUTH_REGISTER_008: ID already taken
 * - AUTH_REGISTER_009: Email verification not complete
 * - AUTH_REGISTER_010: Verification code expired
 */
export const register = async (userId, userEmail, userPw, userPwConfirm, verificationCode) => {
  try {
    // Validate input
    if (!userId || !userEmail || !userPw || !userPwConfirm || !verificationCode) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'All fields are required',
        errorCode: 'AUTH_REGISTER_001',
      };
    }
    
    // Validate user ID format (4-20 chars, alphanumeric)
    const userIdRegex = /^[a-zA-Z0-9]{4,20}$/;
    if (!userIdRegex.test(userId)) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'User ID must be 4-20 characters, alphanumeric only',
        errorCode: 'AUTH_REGISTER_002',
      };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        errorCode: 'AUTH_REGISTER_003',
      };
    }
    
    // Check password match
    if (userPw !== userPwConfirm) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Passwords do not match',
        errorCode: 'AUTH_REGISTER_004',
      };
    }
    
    // Validate password strength (min 8 chars, uppercase + lowercase + number)
    if (userPw.length < 8) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters',
        errorCode: 'AUTH_REGISTER_005',
      };
    }
    
    if (!/[a-z]/.test(userPw) || !/[A-Z]/.test(userPw) || !/[0-9]/.test(userPw)) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Password must contain uppercase, lowercase, and numbers',
        errorCode: 'AUTH_REGISTER_005',
      };
    }
    
    // Make API request
    const response = await post(AUTH_ENDPOINTS.REGISTER, {
      userId: userId.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      userPw,
      userPwConfirm,
      verificationCode: verificationCode.trim(),
    });
    
    // Check response
    if (response.success && response.data && response.data.token) {
      // Save token to AsyncStorage
      await saveToken(response.data.token);
      
      if (__DEV__) {
        console.log('[AuthService] Registration successful for user:', response.data.user.user_id);
      }
      
      return response;
    } else {
      throw {
        code: 'API_ERROR',
        message: response.message || 'Registration failed',
        errorCode: response.errorCode,
      };
    }
  } catch (error) {
    console.error('[AuthService] Registration error:', error);
    throw error;
  }
};

// ==================== Email Verification ====================

/**
 * Send email verification code
 * 
 * @param {string} userEmail - Email address
 * @returns {Promise<object>} Response
 */
export const sendVerificationEmail = async (userEmail) => {
  try {
    // Validate email
    if (!userEmail || !userEmail.trim()) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Email is required',
      };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      };
    }
    
    // Make API request
    const response = await post(AUTH_ENDPOINTS.SEND_VERIFICATION_EMAIL, {
      userEmail: userEmail.trim().toLowerCase(),
    });
    
    if (__DEV__) {
      console.log('[AuthService] Verification email sent to:', userEmail);
    }
    
    return response;
  } catch (error) {
    console.error('[AuthService] Send verification email error:', error);
    throw error;
  }
};

/**
 * Verify email code
 * 
 * @param {string} userEmail - Email address
 * @param {string} verificationCode - Verification code
 * @returns {Promise<object>} Response
 */
export const verifyEmailCode = async (userEmail, verificationCode) => {
  try {
    // Validate input
    if (!userEmail || !verificationCode) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Email and verification code are required',
      };
    }
    
    // Make API request
    const response = await post(AUTH_ENDPOINTS.VERIFY_EMAIL_CODE, {
      userEmail: userEmail.trim().toLowerCase(),
      verificationCode: verificationCode.trim(),
    });
    
    if (__DEV__) {
      console.log('[AuthService] Email verification successful');
    }
    
    return response;
  } catch (error) {
    console.error('[AuthService] Verify email code error:', error);
    throw error;
  }
};

// ==================== Token Verification ====================

/**
 * Verify JWT token and get user info
 * 
 * @returns {Promise<object>} User info
 * 
 * Response format:
 * {
 *   success: true,
 *   message: "Token is valid",
 *   data: {
 *     user: { idx, user_key, user_id, user_email, ... }
 *   }
 * }
 * 
 * Error codes:
 * - AUTH_TOKEN_001: Missing token
 * - AUTH_TOKEN_002: Invalid token
 * - AUTH_TOKEN_003: Token expired
 * - AUTH_TOKEN_004: User not found
 */
export const verifyToken = async () => {
  try {
    // Get token from AsyncStorage
    const token = await getToken();
    
    if (!token) {
      throw {
        code: 'AUTH_ERROR',
        message: 'No token found',
        errorCode: 'AUTH_TOKEN_001',
      };
    }
    
    // Make API request
    const response = await post(AUTH_ENDPOINTS.VERIFY_TOKEN, {
      token,
      requestId: `mobile-${Date.now()}`, // For debugging
    });
    
    if (response.success && response.data && response.data.user) {
      if (__DEV__) {
        console.log('[AuthService] Token verified for user:', response.data.user.user_id);
      }
      
      return response;
    } else {
      throw {
        code: 'AUTH_ERROR',
        message: response.message || 'Token verification failed',
        errorCode: response.errorCode,
      };
    }
  } catch (error) {
    console.error('[AuthService] Token verification error:', error);
    
    // Remove invalid token
    await removeToken();
    
    throw error;
  }
};

// ==================== Logout ====================

/**
 * User logout (remove token)
 * 
 * @returns {Promise<boolean>} True if logout successful
 */
export const logout = async () => {
  try {
    // Remove token from AsyncStorage
    await removeToken();
    
    if (__DEV__) {
      console.log('[AuthService] Logout successful');
    }
    
    return true;
  } catch (error) {
    console.error('[AuthService] Logout error:', error);
    throw error;
  }
};

// ==================== Auto Login ====================

/**
 * Check if user can auto-login (has valid token)
 * 
 * @returns {Promise<object|null>} User info if auto-login successful, null otherwise
 */
export const autoLogin = async () => {
  try {
    const token = await getToken();
    
    if (!token) {
      if (__DEV__) {
        console.log('[AuthService] No token found for auto-login');
      }
      return null;
    }
    
    // Verify token
    const response = await verifyToken();
    
    if (response.success && response.data && response.data.user) {
      if (__DEV__) {
        console.log('[AuthService] Auto-login successful for user:', response.data.user.user_id);
      }
      
      return response.data.user;
    }
    
    return null;
  } catch (error) {
    console.error('[AuthService] Auto-login error:', error);
    return null;
  }
};

// ==================== Export ====================

export default {
  login,
  register,
  sendVerificationEmail,
  verifyEmailCode,
  verifyToken,
  logout,
  autoLogin,
};

