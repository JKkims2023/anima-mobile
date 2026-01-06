/**
 * 👤 User Context
 * 
 * Global user state management
 * 
 * Features:
 * - Current user state
 * - Auto-login on app start
 * - Login/Logout handlers
 * - User info update
 * 
 * IMPORTANT: This is the ONLY place to manage user state!
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authService from '../services/api/authService';

// ==================== Create Context ====================

const UserContext = createContext();

// ==================== Provider ====================

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state for auto-login
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ==================== Auto Login ====================

  /**
   * Try auto-login on app start
   */
  useEffect(() => {
    const checkAutoLogin = async () => {
      setLoading(true);
      
      let authResult = false;
      
      try {
        
        const userData = await authService.autoLogin();
        
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          authResult = true;

          // ⭐ NEW: Update FCM token on server after auto-login
          if (userData.user_key) {
            try {
              const { updateFCMTokenOnServer } = require('../services/fcmTokenService');
              await updateFCMTokenOnServer(userData.user_key);
            } catch (error) {
              console.log('[ANIMA] FCM token update failed (non-critical):', error.message);
            }
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          authResult = false;
      
        }
      } catch (error) {
        console.log('❌ [ANIMA] Auto-login error:', error.message);
        setUser(null);
        setIsAuthenticated(false);
        authResult = false;
      } finally {
        setLoading(false);
      }
    };
    
    checkAutoLogin();
  }, []);

  // ==================== Login Handler ====================

  /**
   * Handle user login
   * 
   * @param {string} userId - User ID or email
   * @param {string} password - Password
   * @returns {Promise<object>} Login response
   */
  const login = useCallback(async (userId, password) => {
    try {
      const response = await authService.login(userId, password);

      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.log('❌ [UserContext] Login error:', error);
      throw error;
    }
  }, []);

  // ==================== Logout Handler ====================

  /**
   * Handle user logout
   * 
   * @returns {Promise<boolean>} True if logout successful
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      
      setUser(null);
      setIsAuthenticated(false);
      
      return true;
    } catch (error) {
      console.log('[UserContext] Logout error:', error);
      throw error;
    }
  }, []);

  // ==================== Register Handler ====================

  /**
   * Handle user registration
   * 
   * @param {string} userId - User ID
   * @param {string} userEmail - Email
   * @param {string} userPw - Password
   * @param {string} userPwConfirm - Password confirmation
   * @param {string} verificationCode - Email verification code
   * @returns {Promise<object>} Registration response
   */
  const register = useCallback(async (userId, userEmail, userPw, userPwConfirm, verificationCode) => {
    try {
      const response = await authService.register(
        userId,
        userEmail,
        userPw,
        userPwConfirm,
        verificationCode
      );
      
      if (response.success && response.data && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.log('[UserContext] Registration error:', error);
      throw error;
    }
  }, []);

  // ==================== Update User Info ====================

  /**
   * Update user info in context
   * (Use this when user info changes from API calls)
   * 
   * @param {object} newUserInfo - Updated user info
   */
  const updateUser = useCallback((newUserInfo) => {
    setUser(prevUser => ({
      ...prevUser,
      ...newUserInfo,
    }));
    
  }, []);

  // ==================== Set Authenticated User ====================

  /**
   * Set user and mark as authenticated
   * (Use this for social login or when user data comes from external auth)
   * 
   * @param {object} userData - Complete user data
   */
  const setAuthenticatedUser = useCallback(async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
      
    // ⭐ NEW: Update FCM token on server after authentication
    if (userData.user_key) {
      try {
        const { updateFCMTokenOnServer } = require('../services/fcmTokenService');
        await updateFCMTokenOnServer(userData.user_key);
      } catch (error) {
        console.log('[UserContext] FCM token update failed (non-critical):', error.message);
      }
    }
  }, []);

  // ==================== Refresh User Info ====================

  /**
   * Refresh user info from server
   * 
   * @returns {Promise<object>} Updated user info
   */
  const refreshUser = useCallback(async () => {
    try {
      // ⭐ Step 1: Get token from storage
      const token = await authService.getToken();
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      // ⭐ Step 2: Verify token with API
      const response = await authService.verifyToken(token);
      
      if (response.success && response.data && response.data.user) {
        setUser(response.data.user);
          
        return response.data.user;
      } else {
        throw new Error('Failed to refresh user info');
      }
    } catch (error) {
      console.log('[UserContext] Refresh user error:', error);
      
      // ⭐ Only logout if token is ACTUALLY invalid (401 error)
      // Don't logout on network errors or other issues
      if (error.message.includes('token') || error.message.includes('Invalid') || error.message.includes('Expired')) {

        await logout();
      }
      
      throw error;
    }
  }, [logout]);

  // ==================== Context Value ====================

  const value = {
    // State
    user,
    loading,
    isAuthenticated,
    
    // Actions
    login,
    logout,
    register,
    updateUser,
    refreshUser,
    setAuthenticatedUser, // ⭐ Social login용
  };

  // ==================== Render ====================

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// ==================== Custom Hook ====================

/**
 * useUser Hook
 * 
 * Access user context
 * 
 * @returns {object} User context value
 * 
 * Usage:
 * const { user, isAuthenticated, login, logout } = useUser();
 */
export const useUser = () => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  
  return context;
};

// ==================== Export ====================

export default {
  UserProvider,
  useUser,
};

