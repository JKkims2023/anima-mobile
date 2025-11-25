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
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💙 [ANIMA] UserContext initialized');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      setLoading(true);
      
      let authResult = false;
      
      try {
        console.log('🔍 [ANIMA] Checking for saved token...');
        
        const userData = await authService.autoLogin();
        
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          authResult = true;
          
          console.log('✅ [ANIMA] Auto-login SUCCESSFUL');
          console.log('👤 [ANIMA] User:', userData.user_id);
          console.log('📧 [ANIMA] Email:', userData.user_email);
          console.log('💰 [ANIMA] Points:', userData.point);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          authResult = false;
          
          console.log('⚠️  [ANIMA] No saved token found');
          console.log('🔓 [ANIMA] User needs to login');
        }
      } catch (error) {
        console.error('❌ [ANIMA] Auto-login error:', error.message);
        setUser(null);
        setIsAuthenticated(false);
        authResult = false;
      } finally {
        setLoading(false);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💙 [ANIMA] Auth check complete');
        console.log('📊 [ANIMA] isAuthenticated:', authResult ? 'YES ✅' : 'NO 🔓');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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

      console.log('🔐 [UserContext] login response:', response);

      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        console.log('✅ [UserContext] Login successful:', response.user.user_id);
        console.log('🔑 [UserContext] Token saved to AsyncStorage');
        
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ [UserContext] Login error:', error);
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
      
      if (__DEV__) {
        console.log('[UserContext] Logout successful');
      }
      
      return true;
    } catch (error) {
      console.error('[UserContext] Logout error:', error);
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
        
        if (__DEV__) {
          console.log('[UserContext] Registration successful:', response.data.user.user_id);
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('[UserContext] Registration error:', error);
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
    
    if (__DEV__) {
      console.log('[UserContext] User info updated');
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
      const response = await authService.verifyToken();
      
      if (response.success && response.data && response.data.user) {
        setUser(response.data.user);
        
        if (__DEV__) {
          console.log('[UserContext] User info refreshed');
        }
        
        return response.data.user;
      } else {
        throw new Error('Failed to refresh user info');
      }
    } catch (error) {
      console.error('[UserContext] Refresh user error:', error);
      
      // If token is invalid, logout
      await logout();
      
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

