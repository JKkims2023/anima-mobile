/**
 * 🤖 ManagerAIOverlay - Universal Manager AI Chat Overlay
 * 
 * Features:
 * - Full-screen overlay (no background video/image)
 * - Context-aware AI responses
 * - Reuses ChatMessageList & ChatInputBar
 * - Simple & Stable keyboard handling
 * - Optimized for performance
 * 
 * Context Types:
 * - 'home': Message creation, Persona creation
 * - 'music': Music generation
 * - 'point': Points & Premium membership
 * - 'settings': General settings help
 * 
 * @author JK & Hero AI
 * @version 2.0 - Simplified & Optimized
 */

import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { 
  View, 
  Modal, 
  StyleSheet, 
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
  Image, // 🆕 For image preview
  AppState, // 🎵 NEW: For background state detection
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import IconSearch from 'react-native-vector-icons/MaterialCommunityIcons';
import ChatMessageList from './ChatMessageList';
import ChatInputBar from './ChatInputBar';
import CustomText from '../CustomText';
import FloatingContentButton from './FloatingContentButton'; // 🎨 NEW: Real-time content
import IdentitySettingsSheet from './IdentitySettingsSheet'; // 🎭 NEW: Identity settings
import SpeakingPatternSheet from './SpeakingPatternSheet'; // 🗣️ NEW: Speaking pattern settings
import CreateMusicSheet from './CreateMusicSheet'; // 🎵 NEW: Create music sheet
import VideoPlayerModal from './VideoPlayerModal'; // 🎬 NEW: YouTube player
import ChatLimitBar from './ChatLimitBar'; // 💰 NEW: Daily chat limit display
import ChatLimitSheet from './ChatLimitSheet'; // 💰 NEW: Limit reached sheet
import MiniMusicWidget from './MiniMusicWidget'; // 🎵 NEW: Mini floating music widget
import HiddenYoutubePlayer from './HiddenYoutubePlayer'; // 🎵 NEW: Hidden YouTube player for audio
import { chatApi } from '../../services/api';
import { createPersona } from '../../services/api/personaApi'; // 🎭 NEW: For persona creation
import { getServiceConfig } from '../../services/api/serviceApi'; // 💰 NEW: Service config API
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useUser } from '../../contexts/UserContext';
import { useAnima } from '../../contexts/AnimaContext'; // ⭐ NEW: Alert function
import { SETTING_CATEGORIES, DEFAULT_SETTINGS } from '../../constants/aiSettings';
import { useMusicPlayer } from '../../hooks/useMusicPlayer'; // 🎵 NEW: Music player hook
import uuid from 'react-native-uuid';
import { useTheme } from '../../contexts/ThemeContext';
import ChatHelpSheet from './ChatHelpSheet';

/**
 * 🌟 IdentityEvolutionOverlay - Minimal notification for identity updates
 * 
 * @param {object} evolution - { field, value, action }
 */
const IdentityEvolutionOverlay = ({ evolution }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Fade out after 2 seconds
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 2000);
  }, []);
  
  // Field labels (i18n-ready)
  const fieldLabels = {
    personality: { icon: '🎭', text: '성격' },
    speaking_style: { icon: '💬', text: '말투' },
    interests: { icon: '💫', text: '관심사' },
    name_ko: { icon: '✨', text: '이름' },
    name_en: { icon: '✨', text: '이름' },
    background: { icon: '🌟', text: '배경' },
    profession: { icon: '👔', text: '직업' },
    description: { icon: '📝', text: '설명' },
  };
  
  const label = fieldLabels[evolution.field] || { icon: '✨', text: evolution.field };
  
  return (
    <Animated.View
      style={[
        styles.evolutionOverlay,
        {
          opacity: fadeAnim,
          transform: [
            {
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
      ]}
    >
      <CustomText type="huge" style={styles.evolutionIcon}>
        {label.icon}
      </CustomText>
      <CustomText type="medium" bold style={styles.evolutionText}>
        {label.text} 강화
      </CustomText>
    </Animated.View>
  );
};

/**
 * ManagerAIOverlay Component (Simplified)
 */
const ManagerAIOverlay = ({ 
  visible = false, 
  onClose,
  context = 'home',
  onCreateMessage,
  persona = null, // ⭐ NEW: Selected persona (from PersonaContext)
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser(); // ✅ Get user info from context
  const { showAlert } = useAnima(); // ⭐ NEW: Alert function for chat limit warnings
  const { currentTheme } = useTheme();
  // ✅ Chat state (⚡ OPTIMIZED: No more setTypingMessage spam!)
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // ⚡ Boolean only (true/false)
  const [currentTypingText, setCurrentTypingText] = useState(''); // ⚡ Complete text (set once!)
  
  // ⭐ NEW: Continuous conversation state
  const [isAIContinuing, setIsAIContinuing] = useState(false);
  const aiContinueCountRef = useRef(0); // ⭐ Use ref instead of state to avoid stale closure
  
  // ⭐ NEW: Chat history state
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [currentPersonaKey, setCurrentPersonaKey] = useState(null); // ⭐ Track current persona
  
  // 🆕 Settings state (moved to bottom sheets)
  const [showIdentitySettings, setShowIdentitySettings] = useState(false); // 🎭 Identity settings
  const [showSpeakingPattern, setShowSpeakingPattern] = useState(false); // 🗣️ Speaking pattern
  const [showCreateMusic, setShowCreateMusic] = useState(false); // 🎵 Create music sheet

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // 🆕 Vision state
  const [selectedImage, setSelectedImage] = useState(null); // Holds selected image before sending
  
  // 🌟 Identity Evolution Notification State
  const [identityEvolutionDisplay, setIdentityEvolutionDisplay] = useState(null);

  // 🆕 Help Open State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // 🎵 Music Player Hook (replaces floatingContent, showYouTubePlayer, currentVideo + handlers)
  const {
    floatingContent,
    setFloatingContent,
    showYouTubePlayer,
    currentVideo,
    handleMusicPress,
    handleMusicToggle,
    handleMusicStop,
    handleYouTubePress,
    handleYouTubeClose,
  } = useMusicPlayer();
  
  // 💰 NEW: Daily Chat Limit state (Tier System)
  const [serviceConfig, setServiceConfig] = useState(null); // Service config from /api/service
  const [loadingServiceConfig, setLoadingServiceConfig] = useState(true); // ⭐ NEW: Loading state for service config
  const [showLimitSheet, setShowLimitSheet] = useState(false); // Limit reached sheet
  const [limitReachedData, setLimitReachedData] = useState(null); // Data for limit sheet
    
  // ⭐ NEW: Load chat history when visible or persona changes
  useEffect(() => {
    const personaKey = persona?.persona_key || 'SAGE';
    
    // 🔥 CRITICAL: Only load if user is fully loaded!
    if (!user || !user.user_key) {
      console.log('⏳ [Chat History] Waiting for user context...');
      return; // ⚠️ Don't proceed without user!
    }
    
    // Load history if:
    // 1. Overlay becomes visible
    // 2. Persona changes OR persona key was reset (null)
    if (visible) {
      if (currentPersonaKey !== personaKey) {
        console.log(`🔄 [Chat History] Persona changed: ${currentPersonaKey} → ${personaKey}`);
        setCurrentPersonaKey(personaKey);
        setMessages([]); // Clear previous persona's messages
        setHistoryOffset(0); // Reset offset
        setHasMoreHistory(false); // ⭐ Reset hasMore flag
        loadChatHistory();
      }
    }
  }, [visible, user, persona?.persona_key, currentPersonaKey]);
  
  // ✅ REMOVED: Empty useEffect hooks (Line 227-233)
  // These were placeholders with no logic - safely removed!
  
  // 🆕 Load AI settings when overlay opens
  useEffect(() => {
    if (visible && user?.user_key) {
      loadAISettings();
    } else if (visible && !user?.user_key) {
      // ⚠️ User context not loaded yet, wait...
      console.log('⏳ [Settings] Waiting for user context...');
    }
  }, [visible, user?.user_key]);
  
  // 💰 NEW: Load service config (Tier limits) when overlay opens
  useEffect(() => {
    const loadServiceConfig = async () => {
      if (!visible || !user?.user_key) {
        setLoadingServiceConfig(false); // ⭐ Not loading (overlay closed or no user)
        return;
      }
      
      setLoadingServiceConfig(true); // ⭐ Start loading
      
      try {
        console.log('💰 [Service Config] Loading tier information...');
        const response = await getServiceConfig(user.user_key);
        
        console.log('response: ', response);
        if (response.data.success && response.data.data) {
          setServiceConfig(response.data.data);
          console.log(`✅ [Service Config] Loaded: ${response.data.data.userTier} (${response.data.data.dailyChatRemaining}/${response.data.data.dailyChatLimit} chats remaining)`);
        } else {
          console.warn('⚠️  [Service Config] API failed, applying Free tier fallback');
          // ⭐ Fallback: Free tier (API responded but failed)
          setServiceConfig({
            userTier: 'free',
            dailyChatLimit: 20,
            dailyChatRemaining: 20, // ⚠️ Give benefit of doubt (API error, not user's fault)
            dailyChatCount: 0,
            isOnboarding: false,
            onboardingDaysRemaining: 0
          });
        }
      } catch (error) {
        console.error('❌ [Service Config] Network error, applying Free tier fallback:', error);
        // ⭐ Fallback: Free tier (Network error, server down, etc.)
        setServiceConfig({
          userTier: 'free',
          dailyChatLimit: 20,
          dailyChatRemaining: 20, // ⚠️ Give benefit of doubt (error, not user's fault)
          dailyChatCount: 0,
          isOnboarding: false,
          onboardingDaysRemaining: 0
        });
      } finally {
        setLoadingServiceConfig(false); // ⭐ Loading complete (success or fallback)
      }
    };
    
    loadServiceConfig();
  }, [visible, user?.user_key]);
  
  // 🆕 Load AI settings when identity settings sheet opens
  useEffect(() => {
    if (showIdentitySettings && user?.user_key) {
      loadAISettings();
    }
  }, [showIdentitySettings, user?.user_key]);
  
  // 🆕 Load AI settings
  const loadAISettings = async () => {
    if (!user?.user_key) return;
    
    try {
      setLoadingSettings(true);
      const response = await chatApi.getAIPreferences(user.user_key);
      
      if (response.success) {
        setSettings({
          speech_style: response.data.speech_style || DEFAULT_SETTINGS.speech_style,
          response_style: response.data.response_style || DEFAULT_SETTINGS.response_style,
          advice_level: response.data.advice_level || DEFAULT_SETTINGS.advice_level,
        });
      }
    } catch (error) {
      console.error('[ManagerAI] Load settings error:', error);
    } finally {
      setLoadingSettings(false);
    }
  };
  
  // 🆕 Update AI setting
  const updateSetting = async (key, value) => {
    // Optimistic update
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
      console.error('[ManagerAI] Update settings error:', error);
      // Revert on error
      setSettings(settings);
      HapticService.error();
    } finally {
      setSavingSettings(false);
    }
  };
  
  // 🆕 Toggle settings (type: 'identity' | 'speaking')
  const handleToggleSettings = useCallback((type) => {
    HapticService.light();
    
    if (type === 'identity') {
      setShowIdentitySettings(true);
    } else if (type === 'speaking') {
      setShowSpeakingPattern(true);
    }
  }, []);

  const handleCreateMusic = async () => {
    setShowCreateMusic(true);
  }

  const handleCreateMessage = async () => {
    console.log('handleCreateMessage');
  }
  
  // 🗣️ NEW: Save speaking pattern
  const handleSaveSpeakingPattern = useCallback(async (pattern) => {
    if (!user?.user_key || !persona?.persona_key) {
      console.error('[SpeakingPattern] Missing user or persona key');
      return;
    }
    
    try {
      const response = await fetch(`https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/persona/identity/speaking-pattern`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona_key: persona.persona_key,
          user_key: user.user_key,
          speaking_pattern: pattern,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [SpeakingPattern] Saved successfully');
        HapticService.success();
        
        // ✨ Show notification message
        const personaName = persona.persona_name || 'AI';
        showNotificationMessage(`✨ ${personaName}의 새로운 말투가 적용되었습니다! 이제부터 더 자연스럽게 대화할게요!`, 2500);
      } else {
        throw new Error(data.error || 'Failed to save speaking pattern');
      }
    } catch (error) {
      console.error('❌ [SpeakingPattern] Save error:', error);
      HapticService.error();
      throw error;
    }
  }, [user, persona, showNotificationMessage]);

  const handleSaveCreateMusic = async (music) => {
    console.log('handleSaveCreateMusic');
  }
  
  // ⭐ NEW: Load chat history
  const loadChatHistory = useCallback(async (isLoadMore = false) => {
    if (loadingHistory) return;
    
    try {
      setLoadingHistory(true);
      const userKey = user?.user_key;
      const personaKey = persona?.persona_key || 'SAGE';
      
      if (!userKey) {
        console.log('⚠️ [Chat History] No user_key found');
        showWelcomeMessage();
        setLoadingHistory(false);
        return;
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📜 [Chat History] Loading history');
      console.log(`   user_key: ${userKey}`);
      console.log(`   persona_key: ${personaKey}`);
      console.log(`   isLoadMore: ${isLoadMore}`);
      console.log(`   offset: ${isLoadMore ? historyOffset : 0}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const response = await chatApi.getChatHistory({
        user_key: userKey,
        persona_key: personaKey,
        limit: isLoadMore ? 20 : 100,
        offset: isLoadMore ? historyOffset : 0,
      });
      
      if (response.success && response.data.messages.length > 0) {
        const historyMessages = response.data.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          text: msg.text,
          timestamp: msg.timestamp,
          // ⭐ CRITICAL: Include rich media from history
          image: msg.image || null, // User-sent image
          images: msg.images || [], // AI-generated images
          videos: msg.videos || [], // AI-generated videos
          links: msg.links || [], // AI-generated links
          music: msg.music || null, // 🎵 NEW: Music data (title, artist, duration, etc.)
          youtube: msg.youtube || null, // 🎬 NEW: YouTube video data (videoId, title, channel, etc.)
        }));
        
        console.log(`✅ [Chat History] Loaded ${historyMessages.length} messages`);
        console.log(`   Total messages in response: ${response.data.total}`);
        console.log(`   Has more: ${response.data.hasMore}`);
        
        if (isLoadMore) {
          // Prepend to existing messages
          setMessages(prev => [...historyMessages, ...prev]);
          setHistoryOffset(prev => prev + historyMessages.length);
        } else {
          // Initial load
          setMessages(historyMessages);
          setHistoryOffset(historyMessages.length);
          
          // ⚠️ DON'T auto-start if there's already conversation history
          console.log('✅ [Chat History] Loaded existing messages - skipping auto-start');
        }
        
        setHasMoreHistory(response.data.hasMore);
      } else {
        console.log('✅ [Chat History] No history found for this persona');
        showWelcomeMessage();
      }
    } catch (error) {
      console.error('❌ [Chat History] Error:', error);
      showWelcomeMessage();
    } finally {
      setLoadingHistory(false);
    }
  }, [user, persona, loadingHistory, historyOffset, showWelcomeMessage, startAIConversation]);
  
  // ⚡ OPTIMIZED: Show notification message (TypingMessageBubble handles animation!)
  const showNotificationMessage = useCallback((message, autoHideDuration = 2000) => {
    // ⚡ Start typing effect (TypingMessageBubble will handle the animation!)
    setIsTyping(true);
    setCurrentTypingText(message);
    
    // Calculate typing duration (30ms per character)
    const typingDuration = message.length * 30;
    
    // After typing completes, add to messages
    setTimeout(() => {
      const notificationMessage = {
        id: `notification-${Date.now()}`,
        role: 'assistant',
        text: message,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, notificationMessage]);
      setIsTyping(false);
      setCurrentTypingText('');
      
      // Auto-hide after duration
      if (autoHideDuration > 0) {
        setTimeout(() => {
          setMessages(prev => prev.filter(m => m.id !== notificationMessage.id));
        }, autoHideDuration);
      }
    }, typingDuration + 100); // +100ms buffer
  }, []);
  
  // ⚡ OPTIMIZED: Show welcome message (TypingMessageBubble handles animation!)
  const showWelcomeMessage = useCallback(() => {
    const greetingKey = 'managerAI.public'; //`managerAI.greeting.${context}`;
    const greeting = t(greetingKey);
    
    // ⚡ Start typing effect
    setIsTyping(true);
    setCurrentTypingText(greeting);
    
    // Calculate typing duration
    const typingDuration = greeting.length * 30;
    
    // After typing completes, add to messages
    setTimeout(() => {
      const greetingMessage = {
        id: 'greeting',
        role: 'assistant',
        text: greeting,
        timestamp: new Date().toISOString(),
      };
      
      setMessages([greetingMessage]);
      setIsTyping(false);
      setCurrentTypingText('');
    }, typingDuration + 100);
  }, [context, t]);

    // ⚡ OPTIMIZED: Show not-login message (TypingMessageBubble handles animation!)
    const showNotLoginMessage = useCallback(() => {
      const greeting = t('ai_comment.not_login');
      
      // ⚡ Start typing effect
      setIsTyping(true);
      setCurrentTypingText(greeting);
      
      // Calculate typing duration
      const typingDuration = greeting.length * 30;
      
      // After typing completes, add to messages
      setTimeout(() => {
        const greetingMessage = {
          id: uuid.v4(),
          role: 'ai',
          text: greeting,
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, greetingMessage]);
        setIsTyping(false);
        setCurrentTypingText('');
      }, typingDuration + 100);
    }, [context, t]);
  
  // ⚡ OPTIMIZED: AI auto conversation starter (TypingMessageBubble handles animation!)
  const startAIConversation = useCallback(async (userKey) => {
    console.log('🤖 [Chat] Starting AI conversation...');
    
    // ⚡ Show loading indicator
    setIsLoading(true);
    
    setTimeout(async () => {
      try {
        const response = await chatApi.sendManagerAIMessage({
          user_key: userKey,
          question: '[AUTO_START]', // Special marker for AI to start conversation
          persona_key: persona?.persona_key || null,
        });
        
        if (response.success && response.data?.answer) {
          const answer = response.data.answer;
          const richContent = response.data.rich_content || { images: [], videos: [], links: [] };
          
          // ⚡ Start typing effect
          setIsLoading(false);
          setIsTyping(true);
          setCurrentTypingText(answer);
          
          // Calculate typing duration
          const typingDuration = answer.length * 30;
          
          // After typing completes, add to messages
          setTimeout(() => {
            const aiMessage = {
              id: `ai-start-${Date.now()}`,
              role: 'assistant',
              text: answer,
              timestamp: new Date().toISOString(),
              // ⭐ NEW: Rich media content
              images: richContent.images,
              videos: richContent.videos,
              links: richContent.links,
            };
            
            setMessages(prev => [...prev, aiMessage]);
            setIsTyping(false);
            setCurrentTypingText('');
            
            // Check for continuation
            if (response.data.continue_conversation) {
              setTimeout(() => {
                handleAIContinue(userKey);
              }, 800);
            }
          }, typingDuration + 100);
        } else {
          setIsLoading(false);
          setIsTyping(false);
          setCurrentTypingText('');
        }
      } catch (error) {
        console.error('❌ [Chat] Auto start error:', error);
        setIsLoading(false);
        setIsTyping(false);
        setCurrentTypingText('');
      }
    }, 800);
  }, [persona, chatApi]);
  
  // 🆕 Handle image selection
  const handleImageSelect = useCallback(async (imageData) => {
    console.log('📷 [ManagerAIOverlay] Image selected:', {
      type: imageData.type,
      size: imageData.fileSize,
      dimensions: `${imageData.width}x${imageData.height}`,
    });
    
    // Normal image analysis mode
    // Store image temporarily
    setSelectedImage(imageData);
    
    // Success haptic feedback
    HapticService.success();
  }, []);
  
  // ⭐ NEW: Handle AI continuous conversation
  const handleAIContinue = useCallback(async (userKey) => {
    const MAX_CONTINUES = 5; // Maximum 5 continuous messages
    
    // ⭐ Check count using ref
    if (aiContinueCountRef.current >= MAX_CONTINUES) {
      console.log('⚠️ [ManagerAIOverlay] Max continuous messages reached');
      setIsAIContinuing(false);
      aiContinueCountRef.current = 0; // Reset
      setIsLoading(false);
      return;
    }
    
    // ⭐ Increment count
    aiContinueCountRef.current += 1;
    const currentCount = aiContinueCountRef.current;
    
    console.log('');
    console.log('🚀🚀🚀 [handleAIContinue] CALLED! 🚀🚀🚀');
    console.log('   userKey:', userKey);
    console.log('   aiContinueCount:', currentCount);
    console.log('');
    
    setIsAIContinuing(true);
    setIsLoading(true);
    
    try {
      console.log(`🔄 [ManagerAIOverlay] Requesting AI to continue (${currentCount}/${MAX_CONTINUES})...`);
      
      const response = await chatApi.sendManagerAIMessage({
        user_key: userKey,
        question: '[CONTINUE]', // Special marker
        persona_key: persona?.persona_key || null,
      });
      
      if (response.success && response.data?.answer) {
        const answer = response.data.answer;
        const richContent = response.data.rich_content || { images: [], videos: [], links: [] };
        
        // ⚡ Start typing effect
        setIsLoading(false);
        setIsTyping(true);
        setCurrentTypingText(answer);
        
        // Calculate typing duration
        const typingDuration = answer.length * 30;
        
        // After typing completes, add to messages
        setTimeout(() => {
          const aiMessage = {
            id: `ai-continue-${Date.now()}`,
            role: 'assistant',
            text: answer,
            timestamp: new Date().toISOString(),
            // ⭐ NEW: Rich media content
            images: richContent.images,
            videos: richContent.videos,
            links: richContent.links,
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setIsTyping(false);
          setCurrentTypingText('');
          
          // Check if AI wants to continue AGAIN
          if (response.data.continue_conversation) {
            console.log('🔄 [ManagerAIOverlay] AI wants to continue again...');
            
            // ⭐ Show TypingIndicator (same as user message send)
            setIsLoading(true);
            
            setTimeout(() => {
              handleAIContinue(userKey);
            }, 800);
          } else {
            // Conversation ended
            setIsAIContinuing(false);
            aiContinueCountRef.current = 0; // ⭐ Reset ref
            console.log('✅ [ManagerAIOverlay] AI conversation completed');
          }
        }, typingDuration + 100);
      } else {
        setIsAIContinuing(false);
        aiContinueCountRef.current = 0; // ⭐ Reset ref
        setIsLoading(false);
      }
      
    } catch (error) {
      console.log('[ManagerAIOverlay] AI continue error:', error);
      setIsAIContinuing(false);
      aiContinueCountRef.current = 0; // ⭐ Reset ref
      setIsLoading(false);
    }
  }, [persona, chatApi]); // ⭐ Removed aiContinueCount from dependencies
  
  // ✅ Send message handler
  const handleSend = useCallback(async (text) => {
    // ⭐ STEP 0: Check if service config is still loading (Race Condition Fix!)
    if (loadingServiceConfig) {
      console.warn('⏳ [Chat] Service config still loading, please wait...');
      showAlert({
        title: '잠시만 기다려주세요',
        message: '채팅 환경을 준비하고 있습니다.\n곧 준비될 거예요! ⏳',
        emoji: '⏳',
        buttons: [
          { text: '확인', style: 'primary' }
        ]
      });
      HapticService.trigger('warning');
      return;
    }
    
    HapticService.medium();
    
    // 🆕 Create Data URI from base64 (avoid temporary file path issues)
    const imageDataUri = selectedImage 
      ? `data:${selectedImage.type};base64,${selectedImage.base64}`
      : null;
    
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      // 🆕 Include selected image if available (use Data URI instead of file path)
      image: selectedImage ? {
        uri: imageDataUri, // ⭐ FIX: Use Data URI instead of temporary file path
        type: selectedImage.type,
      } : null,
    };
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 [ManagerAIOverlay] handleSend called');
    console.log('📸 [Image Debug] selectedImage:', selectedImage);
    console.log('📸 [Image Debug] imageDataUri length:', imageDataUri?.length || 0);
    console.log('📸 [Image Debug] userMessage.image:', userMessage.image);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 [ManagerAIOverlay] handleSend called');
    console.log('   user:', user ? user.user_id : 'null');
    console.log('   user_key:', user?.user_key);
    console.log('   persona:', persona ? persona.persona_name : 'null');
    console.log('   persona_key:', persona?.persona_key);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const userKey = user?.user_key;
      
      // Check if user is logged in
      if (!userKey) {
        console.log('❌ [ManagerAIOverlay] No user_key found! User not logged in.');
        
        showNotLoginMessage();

        return;
      }
      
      // 💰 CRITICAL: Check daily chat limit BEFORE sending to server!
      if (user?.user_level !== 'ultimate') {
        // ⭐ NEW: Use fallback if serviceConfig is null (should never happen after Step 6, but safety!)
        const config = serviceConfig || {
          userTier: 'free',
          dailyChatLimit: 20,
          dailyChatRemaining: 0, // ⚠️ 0 = Block! (Most strict safety measure)
          dailyChatCount: 20,
          isOnboarding: false,
          onboardingDaysRemaining: 0,
          dailyChatResetAt: new Date().toISOString()
        };
        
        const remaining = config.dailyChatRemaining || 0;
        const limit = config.dailyChatLimit || 20;
        const currentCount = config.dailyChatCount || 0;
        
        console.log(`💰 [Chat Limit] Pre-send check: ${remaining} remaining (${currentCount}/${limit})`);
        
        // ⚡ INSTANT CHECK: If no remaining chats, block immediately!
        if (remaining <= 0) {
          console.warn(`🚫 [Chat Limit] BLOCKED! No remaining chats (${currentCount}/${limit})`);
          
          // Remove user message from UI (revert optimistic update)
          setMessages(prev => prev.filter(m => m.id !== userMessage.id));
          setIsLoading(false);
          
          // Show limit sheet
          setLimitReachedData({
            tier: config.userTier || user.user_level || 'free',
            limit: limit,
            resetTime: config.dailyChatResetAt || new Date().toISOString(),
            isOnboarding: config.isOnboarding || false,
            onboardingDaysLeft: config.onboardingDaysRemaining || 0
          });
          setShowLimitSheet(true);
          
          // Haptic feedback
          HapticService.error();
          
          return; // ⚡ STOP! Don't send to server!
        }
      }
      
      const response = await chatApi.sendManagerAIMessage({
        user_key: userKey,
        question: text,
        persona_key: persona?.persona_key || null, // ⭐ NEW: Include persona_key
        // 🆕 Include image data if available
        image: selectedImage ? {
          uri: imageDataUri, // ⭐ FIX: Use Data URI for metadata storage
          data: selectedImage.base64,
          mimeType: selectedImage.type,
        } : null,
      });
      
      // 🆕 Clear selected image after sending
      setSelectedImage(null);
      
      if (response.success && response.data?.answer) {
        // ⚡ Prepare for typing effect (setup only, no setTypingMessage spam!)
        
        const answer = response.data.answer;
        const shouldContinue = response.data.continue_conversation || false; // ⭐ 미리 저장!
        const richContent = response.data.rich_content || { images: [], videos: [], links: [] }; // ⭐ Rich media
        const identityDraftPending = response.data.identity_draft_pending || null; // 🎭 NEW: Identity draft flag
        const identityEvolution = response.data.identity_evolution || null; // 🌟 NEW: Identity evolution notification
        const generatedContent = response.data.generated_content || null; // 🎨 NEW: Real-time content generation
        const musicData = response.data.music || null; // 🎵 NEW: Real-time music search result
        const youtubeData = response.data.youtube || null; // 🎬 NEW: Real-time YouTube video search result
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📩 [ManagerAIOverlay] Response received:');
        console.log('   answer length:', answer.length);
        console.log('   continue_conversation:', shouldContinue);
        console.log('   rich_content:', richContent);
        console.log('   identity_draft_pending:', identityDraftPending);
        console.log('   identity_evolution:', identityEvolution); // 🌟 NEW
        console.log('   🔍 [DEBUG] identity_evolution type:', typeof identityEvolution); // 🔧 DEBUG
        console.log('   🔍 [DEBUG] identity_evolution isArray:', Array.isArray(identityEvolution)); // 🔧 DEBUG
        console.log('   🔍 [DEBUG] identity_evolution length:', identityEvolution?.length); // 🔧 DEBUG
        console.log('   🔍 [DEBUG] identity_evolution JSON:', JSON.stringify(identityEvolution)); // 🔧 DEBUG
        console.log('   🎨 [Chat Content] generated_content:', generatedContent); // 🎨 NEW
        console.log('   🎵 [Music Search] music:', musicData); // 🎵 NEW
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // 🌟 NEW: Show identity evolution notification (supports multiple tool calls)
        if (identityEvolution) {
          const evolutions = Array.isArray(identityEvolution) ? identityEvolution : [identityEvolution];
          console.log(`🌟 [Identity Evolution] Showing ${evolutions.length} notification(s)...`);
          
          // Show each evolution sequentially with 2-second intervals
          evolutions.forEach((evolution, index) => {
            if (evolution && evolution.field) {
              setTimeout(() => {
                console.log(`   [${index + 1}/${evolutions.length}] Field: ${evolution.field}, Value: ${evolution.value}`);
                setIdentityEvolutionDisplay(evolution);
                
                // Auto-hide after 2.5 seconds
                setTimeout(() => {
                  setIdentityEvolutionDisplay(null);
                }, 2500);
                
                // Haptic feedback
                HapticService.trigger('success');
              }, index * 3000); // 3-second interval between each notification
            }
          });
        }
        
        // 🎭 NEW: Update pending identity draft state
        if (identityDraftPending) {
          console.log('🎭 [Identity Draft] Detected pending draft, updating state...');
          console.log('   Draft ID:', identityDraftPending.draft_id);
          console.log('   Target Name:', identityDraftPending.target_name);
          console.log('   Status:', identityDraftPending.status);
          setPendingIdentityDraft(identityDraftPending);
        }
        
        // 🎨 NEW: Handle real-time content generation (Pixabay is INSTANT!)
        // ✅ STRATEGY: Add image directly to AI message bubble (not floating button!)
        let generatedImageForBubble = null;
        if (generatedContent && generatedContent.content_id && generatedContent.content_url) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎨 [Chat Content] AI generated image (Pixabay)!');
          console.log('   Content ID:', generatedContent.content_id);
          console.log('   Status:', generatedContent.status);
          console.log('   Content URL:', generatedContent.content_url);
          console.log('   Metadata:', generatedContent.metadata);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          // ✅ Prepare image object for message bubble
          generatedImageForBubble = {
            url: generatedContent.content_url,
            description: generatedContent.metadata?.photographer 
              ? `📷 Photo by ${generatedContent.metadata.photographer}` 
              : '🎨 AI Generated Image',
            source: 'pixabay',
            credit: generatedContent.metadata?.pageURL || null
          };
          
          console.log('✅ [Chat Content] Image will be added to AI message bubble!');
          
          // Haptic feedback
          HapticService.trigger('success');
        }
        
        // 🎵 NEW: Handle real-time music search (instant!)
        let musicForBubble = null; // ⭐ NEW: Music data for message bubble
        if (musicData && musicData.track) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎵 [Music Search] AI recommended music!');
          console.log('   Track:', musicData.track.title);
          console.log('   Artist:', musicData.track.artist);
          console.log('   Duration:', musicData.track.duration, 's');
          console.log('   URL:', musicData.track.url);
          console.log('   Emotion:', musicData.emotion);
          console.log('   Mood:', musicData.mood || 'none');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          // ⭐ NEW: Prepare music object for message bubble (same format as history!)
          musicForBubble = {
            id: musicData.track.id || `track-${Date.now()}`,
            title: musicData.track.title,
            artist: musicData.track.artist,
            url: musicData.track.url,
            duration: musicData.track.duration,
            image: musicData.track.image,
            source: musicData.track.source || 'jamendo'
          };
          
          console.log('✅ [Music Search] Music will be added to AI message bubble!');
          console.log('🎵 [Music] User must click bubble to play (same as history)');
          
          // 🔧 FIX: Don't set floatingContent here!
          // Let user click the bubble → handleMusicPress will be called
          // This ensures consistent behavior between real-time and history messages
          
          // Haptic feedback
          HapticService.trigger('success');
        }
        
        // 🎬 NEW: Handle real-time YouTube video search (instant!)
        let youtubeForBubble = null; // ⭐ NEW: YouTube data for message bubble
        if (youtubeData && youtubeData.videoId) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎬 [YouTube Search] AI recommended video!');
          console.log('   Title:', youtubeData.title);
          console.log('   Channel:', youtubeData.channel);
          console.log('   Video ID:', youtubeData.videoId);
          console.log('   URL:', youtubeData.url);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          // ⭐ NEW: Prepare YouTube object for message bubble (same format as history!)
          youtubeForBubble = {
            videoId: youtubeData.videoId,
            title: youtubeData.title,
            channel: youtubeData.channel,
            thumbnail: youtubeData.thumbnail,
            url: youtubeData.url,
            embedUrl: youtubeData.embedUrl,
          };
          
          console.log('✅ [YouTube] Video data prepared for message bubble!');
        }
        
        // ⚡ OPTIMIZED: Start typing effect (TypingMessageBubble handles animation!)
        setIsTyping(true);
        setCurrentTypingText(answer);
        setIsLoading(false);
        
        // Calculate typing duration
        const typingDuration = answer.length * 30;
        
        // After typing completes, add to messages
        setTimeout(() => {
          const aiMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            text: answer,
            timestamp: new Date().toISOString(),
            // ⭐ NEW: Rich media content + Pixabay generated image!
            images: [
              ...richContent.images,
              ...(generatedImageForBubble ? [generatedImageForBubble] : [])
            ],
            videos: richContent.videos,
            links: richContent.links,
            music: musicForBubble, // 🎵 NEW: Music data for bubble!
            youtube: youtubeForBubble, // 🎬 NEW: YouTube data for bubble!
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setIsTyping(false);
          setCurrentTypingText('');
          
          // 💰 NEW: Update service config (chat count) after successful message
          if (serviceConfig && user?.user_level !== 'ultimate') {
            setServiceConfig(prev => ({
              ...prev,
              dailyChatCount: (prev.dailyChatCount || 0) + 1,
              dailyChatRemaining: Math.max(0, (prev.dailyChatRemaining || 0) - 1)
            }));
            console.log(`💰 [Chat Limit] UI updated: ${(serviceConfig.dailyChatCount || 0) + 1}/${serviceConfig.dailyChatLimit || 20}`);
          }
          
          // ⭐ NEW: Check if AI wants to continue talking
          console.log('🔍 [ManagerAIOverlay] Checking shouldContinue:', shouldContinue);
          if (shouldContinue) {
            console.log('🔄 [ManagerAIOverlay] AI wants to continue, calling handleAIContinue...');
            
            // ⭐ Show TypingIndicator (same as user message send)
            setIsLoading(true);
            
            setTimeout(() => {
              handleAIContinue(userKey);
            }, 800); // Small delay for natural feel
          } else {
            console.log('✋ [ManagerAIOverlay] AI finished, no continuation needed');
            aiContinueCountRef.current = 0; // ⭐ Reset counter
          }
        }, typingDuration + 100);
        
      } else {
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: t('errors.MANAGER_AI_ERROR'),
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      
    } catch (error) {
      console.log('[ManagerAIOverlay] Error:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: t('errors.MANAGER_AI_ERROR'),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [t, user, persona, handleAIContinue, selectedImage]); // ⭐ FIX: Add handleAIContinue & selectedImage dependencies
  
  const handleClose = useCallback(() => {
    // Clear floating content (music button and player)
    setFloatingContent(null);
    setIsHelpOpen(false);
    // 🆕 Helper function to trigger background learning
    const triggerBackgroundLearning = () => {
      // Only trigger if we have meaningful conversation (3+ messages)
      if (messages.length >= 3 && user?.user_key && persona?.persona_key) {
        const session_id = chatApi.getCurrentSessionId(persona.persona_key);
        
        if (session_id) {
          console.log('🧠 [ManagerAIOverlay] Triggering background learning...');
          
          // Fire-and-forget (don't wait for result)
          chatApi.closeChatSession({
            user_key: user.user_key,
            persona_key: persona.persona_key,
            session_id: session_id,
          }).catch(err => {
            console.warn('⚠️  [ManagerAIOverlay] Background learning failed (non-critical):', err.message);
          });
        }
      }
    };
    
    // ⭐ NEW: Prevent closing if AI is continuing conversation
    if (isAIContinuing || isLoading || isTyping) {
      Alert.alert(
        '💬 AI가 대화 중입니다',
        'AI가 아직 답변을 완료하지 못했습니다.\n정말 채팅을 종료하시겠습니까?',
        [
          {
            text: '계속 대화하기',
            style: 'cancel',
            onPress: () => {
              HapticService.light();
            }
          },
          {
            text: '종료',
            style: 'destructive',
            onPress: () => {
              // Clear floating content
              setFloatingContent(null);
              setIsHelpOpen(false);
              // Force stop AI conversation
              setIsAIContinuing(false);
              aiContinueCountRef.current = 0; // ⭐ Reset ref
              setIsLoading(false);
              setIsTyping(false);
              
              // 🆕 Trigger background learning before closing
              triggerBackgroundLearning();
              
              // Close overlay
              HapticService.medium();
              Keyboard.dismiss();
              setIsHelpOpen(false);
              setTimeout(() => {
                setMessages([]);
                setCurrentTypingText(''); // ⚡ FIX: Changed from setTypingMessage
                setIsTyping(false);
                setIsAIContinuing(false);
                aiContinueCountRef.current = 0;
                setCurrentPersonaKey(null); // ⭐ CRITICAL FIX: Reset persona key to force reload on reopen
              }, 200);
              
              if (onClose) {
                onClose();
              }
            }
          }
        ]
      );
      return;
    }
    
    HapticService.light();
    Keyboard.dismiss();
    
    // 🆕 Trigger background learning before closing
    triggerBackgroundLearning();
    
    // Clear messages on close
    setTimeout(() => {
      setMessages([]);
      setCurrentTypingText(''); // ⚡ FIX: Changed from setTypingMessage
      setIsTyping(false);
      setCurrentPersonaKey(null); // ⭐ CRITICAL FIX: Reset persona key to force reload on reopen
    }, 200);
    
    if (onClose) {
      onClose();
    }
  }, [onClose, isAIContinuing, isLoading, isTyping, messages, user, persona]);
  
  if (!visible) return null;
  
  return (
    <>
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      {/* ✅ Simple Dark Background (No BlurView!) */}
      <View style={styles.container}>
        <View style={styles.backdrop} />
        
        {/* ✅ KeyboardAvoidingView (Stable & Simple) */}
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View
            style={[
              styles.contentContainer,
              {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            {/* ✅ Header */}
            <View style={styles.header}>
              {/* 🆕 Left: Back Button */}
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="chevron-back" size={moderateScale(18)} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
              
              {/* Center: Persona Info */}
              <View style={styles.headerCenter}>
                <CustomText type="title" bold style={styles.headerTitle}>
                  {persona ? `${persona.persona_name}` : '💙 SAGE AI'}
                </CustomText>
                {false && (
                  <CustomText type="small" style={styles.headerSubtitle}>
                    {t('persona.identity.as', '자아')}: {persona.identity_name}
                  </CustomText>
                )}
              </View>
              {/* Help Icon */}
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => setIsHelpOpen(true)}
                activeOpacity={0.7}
              >
                <IconSearch name="help-circle-outline" size={moderateScale(28)} color={currentTheme.textPrimary} />
              </TouchableOpacity>
              
            </View>
            
            {/* 💰 NEW: Chat Limit Bar (Tier System) */}
            {serviceConfig && (
              <ChatLimitBar
                currentCount={serviceConfig.dailyChatCount || 0}
                dailyLimit={serviceConfig.dailyChatLimit || 20}
                tier={user?.user_level || 'free'}
                isOnboarding={serviceConfig.isOnboarding || false}
                onUpgradePress={() => {
                  // TODO: Navigate to upgrade screen
                  console.log('💰 [Chat Limit] Upgrade button pressed');
                  // For now, show limit sheet
                  setLimitReachedData({
                    tier: user?.user_level || 'free',
                    limit: serviceConfig.dailyChatLimit || 20,
                    resetTime: serviceConfig.dailyChatResetAt,
                    isOnboarding: serviceConfig.isOnboarding || false,
                    onboardingDaysLeft: serviceConfig.onboardingDaysRemaining || 0
                  });
                  setShowLimitSheet(true);
                }}
              />
            )}
            
            {/* ✅ Chat Messages (Scrollable) */}
            <View style={styles.chatContainer}>
              <ChatMessageList
                completedMessages={messages}
                isTyping={isTyping} // ⚡ OPTIMIZED: Boolean flag only
                currentTypingText={currentTypingText} // ⚡ OPTIMIZED: Complete text (set once!)
                messageVersion={messages.length}
                isLoading={isLoading}
                onLoadMore={() => loadChatHistory(true)} // ⭐ NEW: Load more history
                loadingHistory={loadingHistory} // ⭐ NEW: Loading indicator
                hasMoreHistory={hasMoreHistory} // ⭐ NEW: Has more to load
                personaUrl={persona?.selected_dress_image_url || persona?.original_url}
                onMusicPress={handleMusicPress} // 🎵 NEW: Music playback handler
                onYouTubePress={handleYouTubePress} // 🎬 NEW: YouTube playback handler
              />
            </View>
            
            {/* 🆕 Image Preview (if selected) */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <View style={styles.imagePreviewWrapper}>
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.selectedImagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setSelectedImage(null);
                      HapticService.light();
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name="close-circle" size={moderateScale(28)} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <CustomText type="small" style={styles.imagePreviewHint}>
                  📷 이미지와 함께 메시지를 보내세요
                </CustomText>
              </View>
            )}
            
            {/* ✅ Chat Input Bar */}
            <View style={styles.inputContainer}>
              <ChatInputBar
                onSend={handleSend}
                onImageSelect={handleImageSelect} // 🆕 Image selection callback
                disabled={loadingServiceConfig || isLoading || isTyping || isAIContinuing} // ⭐ NEW: Disable when loading config or AI is continuing
                placeholder={t('chatBottomSheet.placeholder')}
                onAISettings={handleToggleSettings} // 🆕 Toggle settings menu
                onCreateMusic={handleCreateMusic} // 🆕 Create music callback
                onCreateMessage={handleCreateMessage} // 🆕 Create message callback
                visionMode={settings.vision_mode} // 🆕 Vision mode setting
                hasSelectedImage={!!selectedImage} // 🆕 FIX: Tell ChatInputBar if image is selected
                persona={persona} // 🗣️ NEW: Pass persona for speaking pattern visibility
              />
            </View>
            
            {/* 🎵 NEW: Mini Floating Music Widget */}
            {floatingContent?.contentType === 'music' && (
              <MiniMusicWidget
                isPlaying={floatingContent.isPlaying}
                onToggle={handleMusicToggle}
                onStop={handleMusicStop}
                visible={true}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
      
      {/* 🎵 NEW: Floating YouTube Music Player (Overlay, does NOT push chat) */}
      {floatingContent?.contentType === 'music' && 
       floatingContent?.track?.source === 'youtube' && 
       floatingContent?.track?.videoId && 
       floatingContent?.showPlayer && (  // ✅ Only mount when showPlayer is true
        <HiddenYoutubePlayer
          videoId={floatingContent.track.videoId}
          isPlaying={floatingContent.isPlaying}
          visible={true}  // Always visible when mounted (animation on mount)
          topPosition={insets.top + verticalScale(52)} // Header height
          onStateChange={(state) => {
            console.log('🎵 [YouTube Player] State:', state);
            // Handle state changes if needed
            if (state === 'ended') {
              // Music ended, stop
              setFloatingContent(prev => ({
                ...prev,
                isPlaying: false
              }));
            }
          }}
          onError={(error) => {
            console.error('❌ [YouTube Player] Error:', error);
            Alert.alert(
              '재생 오류',
              '음악 재생 중 오류가 발생했습니다.',
              [{ text: '확인' }]
            );
          }}
        />
      )}
      
      {/* 🌟 Identity Evolution Notification Overlay */}
      {identityEvolutionDisplay && (
        <IdentityEvolutionOverlay evolution={identityEvolutionDisplay} />
      )}
    </Modal>
    
    {/* 🎭 Identity Settings Sheet (Independent Modal - Outside ManagerAIOverlay Modal) */}
    {persona && user && (
    <IdentitySettingsSheet
      isOpen={showIdentitySettings}
      onClose={() => setShowIdentitySettings(false)}
      settings={settings}
      onUpdateSetting={updateSetting}
      loading={loadingSettings}
      saving={savingSettings}
    />
    )}
    
    {/* 🗣️ Speaking Pattern Sheet (Independent Modal - Outside ManagerAIOverlay Modal) */}
    {persona && user && !['573db390-a505-4c9e-809f-cc511c235cbb', 'af444146-e796-468c-8e2c-0daf4f9b9248'].includes(persona.persona_key) && (
      <SpeakingPatternSheet
        isOpen={showSpeakingPattern}
        onClose={() => setShowSpeakingPattern(false)}
        personaKey={persona.persona_key}
        personaName={persona.persona_name}
        userKey={user.user_key}
        onSave={handleSaveSpeakingPattern}
      />
    )}

    {/* 🎵 Create Music Sheet (Independent Modal - Outside ManagerAIOverlay Modal) */}
    {persona && user && (
    <CreateMusicSheet
      isOpen={showCreateMusic}
      onClose={() => setShowCreateMusic(false)}
      personaKey={persona.persona_key}
      personaName={persona.persona_name}
      userKey={user.user_key}
      onSave={handleSaveCreateMusic}
    />
    )}
    
    {/* 💰 NEW: Chat Limit Sheet (Independent Modal - Outside ManagerAIOverlay Modal) */}
    {limitReachedData && (
      <ChatLimitSheet
        isOpen={showLimitSheet}
        onClose={() => setShowLimitSheet(false)}
        tier={limitReachedData.tier}
        limit={limitReachedData.limit}
        resetTime={limitReachedData.resetTime}
        canUpgrade={limitReachedData.tier !== 'ultimate'}
        onUpgrade={() => {
          setShowLimitSheet(false);
          // TODO: Navigate to TierUpgradeSheet
          console.log('💰 [Chat Limit] Navigate to upgrade screen');
        }}
        isOnboarding={limitReachedData.isOnboarding}
      />
    )}
    
    {/* 🎬 YouTube Video Player Modal (Independent Modal - Outside ManagerAIOverlay Modal) */}
    <VideoPlayerModal
      visible={showYouTubePlayer}
      videoId={currentVideo?.videoId}
      title={currentVideo?.title}
      onClose={handleYouTubeClose}
    />
    {/* 🎬 Chat Help Sheet (Independent Modal - Outside ManagerAIOverlay Modal) */}
    { isHelpOpen && (
      <ChatHelpSheet
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Simple dark background
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Header
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
    backgroundColor: COLORS.DEEP_BLUE_DARK,
    marginTop: Platform.OS === 'ios' ? 0 : -30,
  },
  backButton: {
    padding: scale(8),
    marginRight: scale(8),
    paddingLeft: scale(0),
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: scale(-10),
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: verticalScale(2),
    opacity: 0.7,
    textAlign: 'center',
    fontSize: moderateScale(11),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Chat
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  chatContainer: {
    flex: 1,
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(10),



  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Input
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  inputContainer: {
    paddingHorizontal: platformPadding(0),
    paddingTop: platformPadding(10),
    marginBottom: Platform.OS === 'ios' ? -10 : -50,
  },
  
  // 🆕 Image Preview
  imagePreviewContainer: {
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(10),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  imagePreviewWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedImagePreview: {
    width: moderateScale(120),
    height: moderateScale(120),
  },
  removeImageButton: {
    position: 'absolute',
    top: moderateScale(4),
    right: moderateScale(4),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: moderateScale(14),
  },
  imagePreviewHint: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: verticalScale(8),
    fontSize: moderateScale(12),
  },
  
  // 🌟 Identity Evolution Overlay Styles
  evolutionOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -scale(120) }, { translateY: -verticalScale(50) }],
    width: scale(240),
    height: verticalScale(100),
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: moderateScale(16),
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.6)', // Purple glow
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 9999,
  },
  evolutionIcon: {
    fontSize: moderateScale(40),
    marginBottom: verticalScale(8),
  },
  evolutionText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    letterSpacing: 0.5,
  },
  helpButton: {
    marginLeft: platformPadding(12),
    padding: platformPadding(8),
  },
  
});

export default memo(ManagerAIOverlay);
