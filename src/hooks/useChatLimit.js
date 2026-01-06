/**
 * 💰 useChatLimit Hook - Daily Chat Limit Management
 * 
 * Features:
 * - Load service config (tier limits)
 * - Check chat limit before sending
 * - Update chat count after sending
 * - Show limit reached sheet
 * - Handle loading/fallback states
 * 
 * Tiers:
 * - Free: 20 chats/day
 * - Basic: 50 chats/day
 * - Premium: 200 chats/day
 * - Ultimate: Unlimited
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-05
 */

import { useState, useEffect, useCallback } from 'react';
import { getServiceConfig } from '../services/api/serviceApi';
import HapticService from '../utils/HapticService';

/**
 * useChatLimit Hook
 * 
 * @param {boolean} visible - Overlay visibility
 * @param {object} user - User object (with user_key)
 * @param {function} showAlert - AnimaAlert function
 * @returns {object} Chat limit state and functions
 */
const useChatLimit = (visible, user, showAlert) => {
  const [serviceConfig, setServiceConfig] = useState(null);
  const [loadingServiceConfig, setLoadingServiceConfig] = useState(true);
  const [showLimitSheet, setShowLimitSheet] = useState(false);
  const [limitReachedData, setLimitReachedData] = useState(null);
  
  // ⭐ Load service config when overlay opens
  useEffect(() => {
    const loadServiceConfig = async () => {
      if (!visible || !user?.user_key) {
        setLoadingServiceConfig(false);

        setServiceConfig({
          userTier: 'free',
          dailyChatLimit: 0,
          dailyChatRemaining: 0,
          dailyChatCount: 0,
          isOnboarding: false,
          onboardingDaysRemaining: 0
        });

        return;
      }
      
      setLoadingServiceConfig(true);
      
      try {
        console.log('💰 [useChatLimit] Loading tier information...');
        const response = await getServiceConfig(user.user_key);
        
        console.log('response: ', response);
        if (response.data.success && response.data.data) {
          setServiceConfig(response.data.data);
          console.log(`✅ [useChatLimit] Loaded: ${response.data.data.userTier} (${response.data.data.dailyChatRemaining}/${response.data.data.dailyChatLimit} chats remaining)`);
        } else {
          console.warn('⚠️  [useChatLimit] API failed, applying Free tier fallback');
          // Fallback: Free tier
          setServiceConfig({
            userTier: 'free',
            dailyChatLimit: 20,
            dailyChatRemaining: 20,
            dailyChatCount: 0,
            isOnboarding: false,
            onboardingDaysRemaining: 0
          });
        }
      } catch (error) {
        console.error('❌ [useChatLimit] Network error, applying Free tier fallback:', error);
        // Fallback: Free tier
        setServiceConfig({
          userTier: 'free',
          dailyChatLimit: 20,
          dailyChatRemaining: 20,
          dailyChatCount: 0,
          isOnboarding: false,
          onboardingDaysRemaining: 0
        });
      } finally {
        setLoadingServiceConfig(false);
      }
    };
    
    loadServiceConfig();
  }, [visible, user?.user_key]);
  
  /**
   * Check if user can send message (before sending)
   * 
   * @param {string} userMessageId - User message ID (for revert)
   * @returns {object} { allowed: boolean, config: object }
   */
  const checkLimit = useCallback((userMessageId) => {
    // Still loading
    if (loadingServiceConfig) {
      console.warn('⏳ [useChatLimit] Service config still loading, please wait...');
      if (showAlert) {
        showAlert({
          title: '잠시만 기다려주세요',
          message: '채팅 환경을 준비하고 있습니다.\n곧 준비될 거예요! ⏳',
          emoji: '⏳',
          buttons: [{ text: '확인', style: 'primary' }]
        });
      }
      HapticService.trigger('warning');
      return { allowed: false, reason: 'loading' };
    }
    
    // Ultimate users: unlimited
    if (user?.user_level === 'ultimate') {
      return { allowed: true, reason: 'ultimate' };
    }
    
    // Use fallback if config is null (safety!)
    const config = serviceConfig || {
      userTier: 'free',
      dailyChatLimit: 20,
      dailyChatRemaining: 0, // Strict: block if null
      dailyChatCount: 20,
      isOnboarding: false,
      onboardingDaysRemaining: 0,
      dailyChatResetAt: new Date().toISOString()
    };
    
    const remaining = config.dailyChatRemaining || 0;
    const limit = config.dailyChatLimit || 20;
    const currentCount = config.dailyChatCount || 0;
    
    console.log(`💰 [useChatLimit] Pre-send check: ${remaining} remaining (${currentCount}/${limit})`);
    
    // No remaining chats: block!
    if (remaining <= 0) {
      console.warn(`🚫 [useChatLimit] BLOCKED! No remaining chats (${currentCount}/${limit})`);
      
      // Prepare limit sheet data
      const limitData = {
        tier: config.userTier || user?.user_level || 'free',
        limit: limit,
        resetTime: config.dailyChatResetAt || new Date().toISOString(),
        isOnboarding: config.isOnboarding || false,
        onboardingDaysLeft: config.onboardingDaysRemaining || 0,
        userMessageId: userMessageId // For revert
      };
      
      // Haptic feedback
      HapticService.error();
      
      return { 
        allowed: false, 
        reason: 'limit_reached',
        limitData: limitData
      };
    }
    
    // OK to send
    return { allowed: true, config: config };
  }, [loadingServiceConfig, serviceConfig, user, showAlert]);
  
  /**
   * Increment chat count (after successful send)
   */
  const incrementChatCount = useCallback(() => {
    if (serviceConfig && user?.user_level !== 'ultimate') {
      setServiceConfig(prev => ({
        ...prev,
        dailyChatCount: (prev.dailyChatCount || 0) + 1,
        dailyChatRemaining: Math.max(0, (prev.dailyChatRemaining || 0) - 1)
      }));
      console.log(`💰 [useChatLimit] Count updated: ${(serviceConfig.dailyChatCount || 0) + 1}/${serviceConfig.dailyChatLimit || 20}`);
    }
  }, [serviceConfig, user]);
  
  /**
   * Show limit reached sheet
   */
  const showLimitReachedSheet = useCallback((limitData) => {
    setLimitReachedData(limitData);
    setShowLimitSheet(true);
  }, []);
  
  return {
    // State
    serviceConfig,
    loadingServiceConfig,
    showLimitSheet,
    setShowLimitSheet,
    limitReachedData,
    
    // Functions
    checkLimit,
    incrementChatCount,
    showLimitReachedSheet,
  };
};

export default useChatLimit;

