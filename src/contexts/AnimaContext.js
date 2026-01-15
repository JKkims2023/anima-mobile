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

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import AnimaToast from '../components/AnimaToast';
import AnimaAlert from '../components/AnimaAlert';

// ✅ Create Context
const AnimaContext = createContext();

/**
 * AnimaProvider Component
 */
export const AnimaProvider = ({ children }) => {
  // 🔥 PERFORMANCE DEBUG: Render counter
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  if (__DEV__) {
    console.log(`🔥 [AnimaContext] Render #${renderCountRef.current}`);
  }
  
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

  // ⭐ New Message Badge state
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [createdMessageUrl, setCreatedMessageUrl] = useState('');
  
  // ⭐ Message Creation Active state (for Tab Bar blocking)
  const [isMessageCreationActive, setIsMessageCreationActive] = useState(false);
  
  // ⭐ NEW: Message Create Handler (from MessageCreationOverlay)
  const [messageCreateHandler, setMessageCreateHandler] = useState(null);
  
  // ⭐ NEW: Show Default Personas setting
  const [showDefaultPersonas, setShowDefaultPersonas] = useState(true); // Default: true (show all 3 modes)
  
  // ⭐ NEW: Tab Badge states
  const [hasMemoryBadge, setHasMemoryBadge] = useState(false); // Memory tab badge (gift_image, gift_music)
  const [hasMusicBadge, setHasMusicBadge] = useState(false); // Music tab badge (create_music)
  const [hasHomeBadge, setHasHomeBadge] = useState(false); // 💙 NEW: Home tab badge (persona_heart_update)
  
  // ⭐ Load showDefaultPersonas and badges from AsyncStorage on mount
  useEffect(() => {
    loadDefaultPersonasSetting();
    loadTabBadges();
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ NEW: Listen for Push notifications and activate badges
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    console.log('[AnimaContext] 🔔 Registering push event listener for badges...');
    
    const subscription = DeviceEventEmitter.addListener('ANIMA_PUSH_RECEIVED', async (data) => {
      const { order_type } = data;
      
      console.log('[AnimaContext] 🔔 Push received for badge activation!');
      console.log('   order_type:', order_type);
      
      // Activate badge based on order_type
      if (order_type === 'gift_image' || order_type === 'gift_music') {
        console.log('[AnimaContext] 🔔 Activating Memory badge...');
        setHasMemoryBadge(true);
        try {
          await AsyncStorage.setItem('@anima_memory_tab_badge', 'true');
          console.log('[AnimaContext] ✅ Memory badge activated (real-time)!');
        } catch (error) {
          console.error('[AnimaContext] Failed to save memory badge:', error);
        }
      } else if (order_type === 'create_music') {
        console.log('[AnimaContext] 🔔 Activating Music badge...');
        setHasMusicBadge(true);
        try {
          await AsyncStorage.setItem('@anima_music_tab_badge', 'true');
          console.log('[AnimaContext] ✅ Music badge activated (real-time)!');
        } catch (error) {
          console.error('[AnimaContext] Failed to save music badge:', error);
        }
      } else if (order_type === 'persona_heart_update') {
        // 💙 NEW: Home tab badge for Persona Heart updates
        console.log('[AnimaContext] 💙 Activating Home badge (Persona Heart)...');
        setHasHomeBadge(true);
        try {
          await AsyncStorage.setItem('@anima_home_tab_badge', 'true');
          console.log('[AnimaContext] ✅ Home badge activated (real-time)!');
        } catch (error) {
          console.error('[AnimaContext] Failed to save home badge:', error);
        }
      }
    });
    
    return () => {
      console.log('[AnimaContext] 🔔 Removing push event listener for badges...');
      subscription.remove();
    };
  }, []);
  
  const loadDefaultPersonasSetting = async () => {
    try {
      const stored = await AsyncStorage.getItem('@anima_show_default_personas');
      
      if (stored !== null) {
        setShowDefaultPersonas(stored === 'true');
        if (__DEV__) {
          console.log('[AnimaContext] Loaded showDefaultPersonas:', stored === 'true');
        }
      } else {
        // First launch: default to true
        setShowDefaultPersonas(true);
        await AsyncStorage.setItem('@anima_show_default_personas', 'true');
        if (__DEV__) {
          console.log('[AnimaContext] First launch: showDefaultPersonas = true');
        }
      }
    } catch (error) {
      console.error('[AnimaContext] Failed to load showDefaultPersonas:', error);
      setShowDefaultPersonas(true); // Fallback to true
    }
  };
  
  // ⭐ Update showDefaultPersonas and save to AsyncStorage
  const updateShowDefaultPersonas = useCallback(async (value) => {
    setShowDefaultPersonas(value);
    
    try {
      await AsyncStorage.setItem('@anima_show_default_personas', value.toString());
      if (__DEV__) {
        console.log('[AnimaContext] Saved showDefaultPersonas:', value);
      }
    } catch (error) {
      console.error('[AnimaContext] Failed to save showDefaultPersonas:', error);
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tab Badge Functions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Load tab badges from AsyncStorage
   */
  const loadTabBadges = async () => {
    try {
      const memoryBadge = await AsyncStorage.getItem('@anima_memory_tab_badge');
      const musicBadge = await AsyncStorage.getItem('@anima_music_tab_badge');
      const homeBadge = await AsyncStorage.getItem('@anima_home_tab_badge'); // 💙 NEW
      
      setHasMemoryBadge(memoryBadge === 'true');
      setHasMusicBadge(musicBadge === 'true');
      setHasHomeBadge(homeBadge === 'true'); // 💙 NEW
      
      if (__DEV__) {
        console.log('[AnimaContext] Loaded tab badges:', {
          memory: memoryBadge === 'true',
          music: musicBadge === 'true',
          home: homeBadge === 'true', // 💙 NEW
        });
      }
    } catch (error) {
      console.error('[AnimaContext] Failed to load tab badges:', error);
    }
  };
  
  /**
   * Set Memory tab badge
   */
  const setMemoryBadge = useCallback(async () => {
    setHasMemoryBadge(true);
    try {
      await AsyncStorage.setItem('@anima_memory_tab_badge', 'true');
      if (__DEV__) {
        console.log('[AnimaContext] 🔔 Memory badge activated!');
      }
    } catch (error) {
      console.error('[AnimaContext] Failed to set memory badge:', error);
    }
  }, []);
  
  /**
   * Clear Memory tab badge
   */
  const clearMemoryBadge = useCallback(async () => {
    setHasMemoryBadge(false);
    try {
      await AsyncStorage.removeItem('@anima_memory_tab_badge');
      if (__DEV__) {
        console.log('[AnimaContext] ✅ Memory badge cleared!');
      }
    } catch (error) {
      console.error('[AnimaContext] Failed to clear memory badge:', error);
    }
  }, []);
  
  /**
   * Set Music tab badge
   */
  const setMusicBadge = useCallback(async () => {
    setHasMusicBadge(true);
    try {
      await AsyncStorage.setItem('@anima_music_tab_badge', 'true');
      if (__DEV__) {
        console.log('[AnimaContext] 🔔 Music badge activated!');
      }
    } catch (error) {
      console.error('[AnimaContext] Failed to set music badge:', error);
    }
  }, []);
  
  /**
   * Clear Music tab badge
   */
  const clearMusicBadge = useCallback(async () => {
    setHasMusicBadge(false);
    try {
      await AsyncStorage.removeItem('@anima_music_tab_badge');
      if (__DEV__) {
        console.log('[AnimaContext] ✅ Music badge cleared!');
      }
    } catch (error) {
      console.error('[AnimaContext] Failed to clear music badge:', error);
    }
  }, []);
  
  /**
   * 💙 NEW: Set Home tab badge
   */
  const setHomeBadge = useCallback(async () => {
    setHasHomeBadge(true);
    try {
      await AsyncStorage.setItem('@anima_home_tab_badge', 'true');
      if (__DEV__) {
        console.log('[AnimaContext] 💙 Home badge activated!');
      }
    } catch (error) {
      console.error('[AnimaContext] Failed to set home badge:', error);
    }
  }, []);
  
  /**
   * 💙 NEW: Clear Home tab badge
   */
  const clearHomeBadge = useCallback(async () => {
    setHasHomeBadge(false);
    try {
      await AsyncStorage.removeItem('@anima_home_tab_badge');
      if (__DEV__) {
        console.log('[AnimaContext] ✅ Home badge cleared!');
      }
    } catch (error) {
      console.error('[AnimaContext] Failed to clear home badge:', error);
    }
  }, []);

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
    // ✅ Use functional update to avoid dependency on toast.visible
    setToast((prev) => {
      // Prevent duplicates: If toast is currently visible, hide it first
      if (prev.visible) {
        // Hide existing toast
        setTimeout(() => {
          setToast({
            visible: true,
            type: config.type || 'info',
            message: config.message || '',
            emoji: config.emoji || null,
          });
        }, 100);
        
        return { ...prev, visible: false };
      } else {
        // Show immediately
        return {
          visible: true,
          type: config.type || 'info',
          message: config.message || '',
          emoji: config.emoji || null,
        };
      }
    });
  }, []); // ✅ No dependencies - function is stable!

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

  // ✅ Context value (🔥 PERFORMANCE FIX: Memoized to prevent unnecessary re-renders!)
  const value = React.useMemo(() => ({
    showToast,
    hideToast,
    showAlert,
    hideAlert,
    hasNewMessage,
    setHasNewMessage,
    createdMessageUrl,
    setCreatedMessageUrl,
    isMessageCreationActive,
    setIsMessageCreationActive,
    messageCreateHandler,
    setMessageCreateHandler,
    showDefaultPersonas,
    updateShowDefaultPersonas,
    // Tab Badges
    hasMemoryBadge,
    hasMusicBadge,
    hasHomeBadge, // 💙 NEW
    setMemoryBadge,
    clearMemoryBadge,
    setMusicBadge,
    clearMusicBadge,
    setHomeBadge, // 💙 NEW
    clearHomeBadge, // 💙 NEW
  }), [
    showToast,
    hideToast,
    showAlert,
    hideAlert,
    hasNewMessage,
    setHasNewMessage,
    createdMessageUrl,
    setCreatedMessageUrl,
    isMessageCreationActive,
    setIsMessageCreationActive,
    messageCreateHandler,
    setMessageCreateHandler,
    showDefaultPersonas,
    updateShowDefaultPersonas,
    hasMemoryBadge,
    hasMusicBadge,
    hasHomeBadge,
    setMemoryBadge,
    clearMemoryBadge,
    setMusicBadge,
    clearMusicBadge,
    setHomeBadge,
    clearHomeBadge,
  ]);

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

