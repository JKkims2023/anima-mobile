/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 QuickActionContext
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages Quick Action Mode state
 * - Toggle between Chat Mode and Quick Action Mode
 * - User preference for tooltips
 * - Badge data management
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QuickActionContext = createContext();

const STORAGE_KEYS = {
  SHOW_TOOLTIPS: '@anima_show_quick_tooltips',
};

export const QuickActionProvider = ({ children }) => {
  // ✅ Quick Mode state (default: true = Chat Mode, false = Quick Action Mode)
  const [isQuickMode, setIsQuickMode] = useState(true);
  
  // ✅ Tooltip preference (default: true for first-time users)
  const [showTooltips, setShowTooltips] = useState(true);
  
  // ✅ Badge data (managed by ref to prevent re-renders)
  const badgeDataRef = useRef({
    // Persona badges
    studioCount: 0, // 스튜디오 카운트
    diaryHasNew: false, // 다이어리 NEW
    giftHasNew: false, // 선물함 NEW
    
    // SAGE badges
    notificationHasNew: false, // 알림 NEW
  });
  
  // ✅ Load tooltip preference from storage
  const loadTooltipPreference = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SHOW_TOOLTIPS);
      if (stored !== null) {
        setShowTooltips(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[QuickActionContext] Failed to load tooltip preference:', error);
    }
  }, []);
  
  // ✅ Save tooltip preference to storage
  const saveTooltipPreference = useCallback(async (value) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHOW_TOOLTIPS, JSON.stringify(value));
      setShowTooltips(value);
    } catch (error) {
      console.error('[QuickActionContext] Failed to save tooltip preference:', error);
    }
  }, []);
  
  // ✅ Toggle Quick Mode
  const toggleQuickMode = useCallback(() => {
    setIsQuickMode(prev => {
      const newValue = !prev;
      if (__DEV__) {
        console.log('[QuickActionContext] 🔄 Mode toggled:', newValue ? 'Quick Mode' : 'Chat Mode');
      }
      return newValue;
    });
  }, []);
  
  // ✅ Update badge data (without triggering re-render)
  const updateBadgeData = useCallback((updates) => {
    badgeDataRef.current = {
      ...badgeDataRef.current,
      ...updates,
    };
    
    if (__DEV__) {
      console.log('[QuickActionContext] 📊 Badge data updated:', badgeDataRef.current);
    }
  }, []);
  
  // ✅ Get current badge data
  const getBadgeData = useCallback(() => {
    return badgeDataRef.current;
  }, []);
  
  const value = {
    // State
    isQuickMode,
    showTooltips,
    
    // Actions
    toggleQuickMode,
    loadTooltipPreference,
    saveTooltipPreference,
    updateBadgeData,
    getBadgeData,
  };
  
  return (
    <QuickActionContext.Provider value={value}>
      {children}
    </QuickActionContext.Provider>
  );
};

export const useQuickAction = () => {
  const context = useContext(QuickActionContext);
  if (!context) {
    throw new Error('useQuickAction must be used within QuickActionProvider');
  }
  return context;
};

export default QuickActionContext;

