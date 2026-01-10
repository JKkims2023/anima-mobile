/**
 * 🎭 useIdentitySettings Hook - AI Identity & Speaking Settings Management
 * 
 * Features:
 * - Load AI preferences (speech_style, response_style, advice_level)
 * - Update AI settings with optimistic updates
 * - Toggle Identity/Speaking/Music creation sheets
 * - Handle loading/saving states
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-05
 */

import { useState, useEffect, useCallback } from 'react';
import { chatApi } from '../services/api';
import { DEFAULT_SETTINGS } from '../constants/aiSettings';
import HapticService from '../utils/HapticService';

/**
 * useIdentitySettings Hook
 * 
 * @param {boolean} visible - Overlay visibility
 * @param {object} user - User object (with user_key)
 * @returns {object} Identity settings state and functions
 */
const useIdentitySettings = (visible, user) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Sheet visibility states
  const [showIdentitySettings, setShowIdentitySettings] = useState(false);
  const [showSpeakingPattern, setShowSpeakingPattern] = useState(false);
  const [showCreateMusic, setShowCreateMusic] = useState(false);
  
  // Load AI settings when overlay opens
  useEffect(() => {
    if (visible && user?.user_key) {
      loadAISettings();
    } else if (visible && !user?.user_key) {
      console.log('⏳ [useIdentitySettings] Waiting for user context...');
    }
  }, [visible, user?.user_key]);
  
  // Reload settings when identity settings sheet opens
  useEffect(() => {
    if (showIdentitySettings && user?.user_key) {
      loadAISettings();
    }
  }, [showIdentitySettings, user?.user_key]);
  
  /**
   * Load AI settings from server
   */
  const loadAISettings = useCallback(async () => {
    if (!user?.user_key) return;
    
    try {
      setLoadingSettings(true);
      const response = await chatApi.getAIPreferences(user.user_key);

      console.log('JK response: ', response);
      
      if (response.success) {
        setSettings({
          speech_style: response.data.speech_style || DEFAULT_SETTINGS.speech_style,
          response_style: response.data.response_style || DEFAULT_SETTINGS.response_style,
          advice_level: response.data.advice_level || DEFAULT_SETTINGS.advice_level,
        });
        console.log('✅ [useIdentitySettings] Loaded AI preferences');
      }
    } catch (error) {
      console.error('[useIdentitySettings] Load settings error:', error);
    } finally {
      setLoadingSettings(false);
    }
  }, [user?.user_key]);
  
  /**
   * Update AI setting
   * 
   * @param {string} key - Setting key (speech_style, response_style, advice_level)
   * @param {string} value - New value
   */
  const updateSetting = useCallback(async (key, value) => {
    // Optimistic update
    const previousSettings = settings;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    HapticService.light();
    
    try {
      setSavingSettings(true);
      const response = await chatApi.updateAIPreferences(user.user_key, newSettings);
      
      if (response.success) {
        HapticService.success();

      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('[useIdentitySettings] Update settings error:', error);
      // Revert on error
      setSettings(previousSettings);
      HapticService.error();
    } finally {
      setSavingSettings(false);
    }
  }, [settings, user?.user_key]);
  
  /**
   * Toggle settings sheet
   * 
   * @param {string} type - 'identity' | 'speaking' | 'music'
   */
  const handleToggleSettings = useCallback((type) => {
    HapticService.light();
    
    if (type === 'identity') {
      setShowIdentitySettings(true);
    } else if (type === 'speaking') {
      setShowSpeakingPattern(true);
    } else if (type === 'music') {
      setShowCreateMusic(true);
    }
  }, []);
  
  return {
    // Settings
    settings,
    loadingSettings,
    savingSettings,
    
    // Sheet visibility
    showIdentitySettings,
    setShowIdentitySettings,
    showSpeakingPattern,
    setShowSpeakingPattern,
    showCreateMusic,
    setShowCreateMusic,
    
    // Functions
    loadAISettings,
    updateSetting,
    handleToggleSettings,
  };
};

export default useIdentitySettings;

