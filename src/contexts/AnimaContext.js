/**
 * 💙 AnimaContext - Global Alert & Toast Manager
 * 
 * Features:
 * - Global Toast (with duplicate prevention)
 * - Global Alert
 * - Simple API (showToast, showAlert)
 * 
 * Usage:
 * const { showToast, showAlert } = useAnima();
 * 
 * showToast({ type: 'success', message: '저장되었습니다!', emoji: '✅' });
 * showAlert({ title: '로그아웃', message: '떠나실 건가요?', ... });
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import AnimaToast from '../components/AnimaToast';
import AnimaAlert from '../components/AnimaAlert';

// ✅ Create Context
const AnimaContext = createContext();

/**
 * AnimaProvider Component
 */
export const AnimaProvider = ({ children }) => {
  // ✅ Toast state
  const [toast, setToast] = useState({
    visible: false,
    type: 'info',
    message: '',
    emoji: null,
  });

  // ✅ Alert state
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    emoji: null,
    buttons: [],
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Toast Functions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Show Toast
   * @param {Object} config - Toast configuration
   * @param {string} config.type - 'success' | 'error' | 'warning' | 'info'
   * @param {string} config.message - Toast message
   * @param {string} config.emoji - Optional emoji
   */
  const showToast = useCallback((config) => {
    // ✅ Prevent duplicates: Hide existing toast first
    if (toast.visible) {
      setToast((prev) => ({ ...prev, visible: false }));
      
      // Wait for animation to complete before showing new toast
      setTimeout(() => {
        setToast({
          visible: true,
          type: config.type || 'info',
          message: config.message || '',
          emoji: config.emoji || null,
        });
      }, 100);
    } else {
      // Show immediately
      setToast({
        visible: true,
        type: config.type || 'info',
        message: config.message || '',
        emoji: config.emoji || null,
      });
    }
  }, [toast.visible]);

  /**
   * Hide Toast
   */
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Alert Functions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Show Alert
   * @param {Object} config - Alert configuration
   * @param {string} config.title - Alert title
   * @param {string} config.message - Alert message
   * @param {string} config.emoji - Optional emoji
   * @param {Array} config.buttons - Buttons array
   *   [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', style: 'primary', onPress: () => {} }]
   */
  const showAlert = useCallback((config) => {
    setAlert({
      visible: true,
      title: config.title || '',
      message: config.message || '',
      emoji: config.emoji || null,
      buttons: config.buttons || [{ text: 'OK', style: 'primary' }],
    });
  }, []);

  /**
   * Hide Alert
   */
  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  // ✅ Context value
  const value = {
    showToast,
    hideToast,
    showAlert,
    hideAlert,
  };

  return (
    <AnimaContext.Provider value={value}>
      {children}
      
      {/* Global Toast */}
      <AnimaToast
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        emoji={toast.emoji}
        onHide={hideToast}
      />

      {/* Global Alert */}
      <AnimaAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        emoji={alert.emoji}
        buttons={alert.buttons}
        onClose={hideAlert}
      />
    </AnimaContext.Provider>
  );
};

/**
 * useAnima Hook
 * 
 * @returns {{ showToast, hideToast, showAlert, hideAlert }}
 */
export const useAnima = () => {
  const context = useContext(AnimaContext);
  
  if (!context) {
    throw new Error('useAnima must be used within AnimaProvider');
  }
  
  return context;
};

export default AnimaContext;

