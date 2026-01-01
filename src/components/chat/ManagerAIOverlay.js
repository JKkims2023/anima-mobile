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
import Sound from 'react-native-sound'; // 🎵 NEW: Music playback
import ChatMessageList from './ChatMessageList';
import ChatInputBar from './ChatInputBar';
import CustomText from '../CustomText';
import FloatingContentButton from './FloatingContentButton'; // 🎨 NEW: Real-time content
import IdentitySettingsSheet from './IdentitySettingsSheet'; // 🎭 NEW: Identity settings
import SpeakingPatternSheet from './SpeakingPatternSheet'; // 🗣️ NEW: Speaking pattern settings
import CreateMusicSheet from './CreateMusicSheet'; // 🎵 NEW: Create music sheet
import VideoPlayerModal from './VideoPlayerModal'; // 🎬 NEW: YouTube player
import { chatApi } from '../../services/api';
import { createPersona } from '../../services/api/personaApi'; // 🎭 NEW: For persona creation
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useUser } from '../../contexts/UserContext';
import { SETTING_CATEGORIES, DEFAULT_SETTINGS } from '../../constants/aiSettings';
import uuid from 'react-native-uuid';
// 🎵 Enable playback in silence mode (iOS)
Sound.setCategory('Playback');
// 🗑️ TEMPORARILY DISABLED: Identity Guide (during refactoring)
// import IdentityGuideModal from './IdentityGuideModal'; // 🎭 NEW: Identity guide (Modal-based)
// import AsyncStorage from '@react-native-async-storage/async-storage'; // 🎭 NEW: For "Don't show again"

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
  
  // ✅ Chat state (Simplified)
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageVersion, setMessageVersion] = useState(0);
  
  // ⭐ NEW: Continuous conversation state
  const [isAIContinuing, setIsAIContinuing] = useState(false);
  const aiContinueCountRef = useRef(0); // ⭐ Use ref instead of state to avoid stale closure
  
  // 🎵 NEW: Music player state
  const soundInstanceRef = useRef(null); // Sound instance for music playback
  
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
  
  // 🎁 NEW: Emotional Gifts state
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftData, setGiftData] = useState(null);
  const [giftReacting, setGiftReacting] = useState(false);
  
  // 🌟 Identity Evolution Notification State
  const [identityEvolutionDisplay, setIdentityEvolutionDisplay] = useState(null);
  
  // 🎨 NEW: Real-time Content Generation state
  const [floatingContent, setFloatingContent] = useState(null); // { contentId, status, contentType, url }
  
  // 🎬 NEW: YouTube Video Player state
  const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null); // { videoId, title }
    
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
        
        // 🎁 Check for emotional gifts!
        checkForGifts();
      }
    }
  }, [visible, user, persona?.persona_key, currentPersonaKey]);

  useEffect(() => {

  }, [user]);

  useEffect(() => {

  }, [persona]);
  
  // 🆕 Load AI settings when overlay opens
  useEffect(() => {
    if (visible && user?.user_key) {
      loadAISettings();
    } else if (visible && !user?.user_key) {
      // ⚠️ User context not loaded yet, wait...
      console.log('⏳ [Settings] Waiting for user context...');
    }
  }, [visible, user?.user_key]);
  
  // 🎵 NEW: Cleanup sound instance on unmount
  useEffect(() => {
    return () => {
      // Release sound resources when component unmounts
      if (soundInstanceRef.current) {
        console.log('🗑️  [Music Player] Releasing sound resources...');
        soundInstanceRef.current.stop();
        soundInstanceRef.current.release();
        soundInstanceRef.current = null;
      }
    };
  }, []);
  
  // 🎵 NEW: Cleanup previous sound when new music arrives or content cleared
  useEffect(() => {
    // When new music arrives (track.id changes) or content cleared, stop previous sound
    const currentTrackId = floatingContent?.track?.id;
    
    if (soundInstanceRef.current) {
      // Always stop and release previous sound when track changes
      console.log('🗑️  [Music Player] Cleaning up previous sound (new track or cleared)...');
      soundInstanceRef.current.stop();
      soundInstanceRef.current.release();
      soundInstanceRef.current = null;
      
      // Also reset playing state
      if (floatingContent?.isPlaying) {
        setFloatingContent(prev => prev ? ({ ...prev, isPlaying: false }) : null);
      }
    }
  }, [floatingContent?.track?.id]); // Re-run when track ID changes (new music)
  
  // 🎵 NEW: Handle app state changes (pause music when app goes to background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('📱 [AppState] App state changed:', nextAppState);
      
      // If app goes to background or inactive, pause music
      if ((nextAppState === 'background' || nextAppState === 'inactive') && soundInstanceRef.current) {
        console.log('⏸️  [Music Player] App backgrounded, pausing music...');
        soundInstanceRef.current.pause();
        
        // Update UI state
        setFloatingContent(prev => prev ? ({ ...prev, isPlaying: false }) : null);
      }
    };
    
    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Cleanup
    return () => {
      subscription?.remove();
    };
  }, []); // Only run once on mount
  
  // 🗑️ TEMPORARILY DISABLED: Identity Guide check (during refactoring)
  /*
  useEffect(() => {
    const checkAndShowIdentityGuide = async () => {
      if (!visible || !persona) return;
      
      // Only for user-created personas (not SAGE/NEXUS)
      const isUserCreatedPersona = !ANIMA_CORE_PERSONAS.includes(persona.persona_key);
      if (!isUserCreatedPersona) return;
      
      // Check if persona has identity
      const hasIdentity = persona.identity_name && persona.identity_name.trim() !== '';
      if (hasIdentity) return; // Has identity, no need for guide
      
      console.log('🎭 [Identity Guide] User-created persona without identity detected');
      console.log('   Persona:', persona.persona_name);
      console.log('   Checking AsyncStorage preference...');
      
      // Check if user has disabled the guide
      try {
        const dontShowKey = `identity_guide_dont_show_${persona.persona_key}`;
        const dontShow = await AsyncStorage.getItem(dontShowKey);
        
        if (dontShow === 'true') {
          console.log('ℹ️  [Identity Guide] User disabled guide for this persona');
          return;
        }
        
        // Show guide after a short delay (let chat load first)
        console.log('✅ [Identity Guide] Showing guide...');
        setTimeout(() => {
          setShowIdentityGuide(true);
          HapticService.light();
        }, 1500); // 1.5초 후 표시
        
      } catch (error) {
        console.error('❌ [Identity Guide] Error checking AsyncStorage:', error);
      }
    };
    
    checkAndShowIdentityGuide();
  }, [visible, persona]);
  */
  
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
          setMessageVersion(historyMessages.length);
          
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
  
  // 🎁 NEW: Check for emotional gifts
  const checkForGifts = useCallback(async () => {
    if (!user?.user_key) return;
    
    try {
      console.log('🎁 [Gift Check] Checking for pending gifts...');
      
      const personaKey = persona?.persona_key || 'SAGE';
      const result = await chatApi.getPendingGifts({
        user_key: user.user_key,
        persona_key: personaKey,
      });
      
      if (result.success && result.gifts && result.gifts.length > 0) {
        console.log('🎁 [Gift Check] Found gift!', result.gifts[0]);
        setGiftData(result.gifts[0]);
        
        // Show gift modal after a short delay (let chat load first)
        setTimeout(() => {
          setShowGiftModal(true);
          HapticService.success();
        }, 1000);
      } else {
        console.log('ℹ️  [Gift Check] No pending gifts');
      }
    } catch (error) {
      console.error('❌ [Gift Check] Error:', error);
      // Fail silently - gifts are nice-to-have, not critical
    }
  }, [user, persona]);
  
  // ⭐ NEW: Show notification message with typing effect (for feedback)
  const showNotificationMessage = useCallback((message, autoHideDuration = 2000) => {
    // Type out message
    setIsTyping(true);
    setTypingMessage('');
    
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex < message.length) {
        setTypingMessage(message.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        
        const notificationMessage = {
          id: `notification-${Date.now()}`,
          role: 'assistant',
          text: message,
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, notificationMessage]);
        setIsTyping(false);
        
        // Auto-hide after duration
        if (autoHideDuration > 0) {
          setTimeout(() => {
            setMessages(prev => prev.filter(m => m.id !== notificationMessage.id));
          }, autoHideDuration);
        }
      }
    }, 30);
    
    return () => clearInterval(typeInterval);
  }, []);
  
  // ⭐ NEW: Show welcome message with typing effect
  const showWelcomeMessage = useCallback(() => {

    const greetingKey = 'managerAI.public'; //`managerAI.greeting.${context}`;
    const greeting = t(greetingKey);
        
    // Type out greeting
    setIsTyping(true);
    setTypingMessage('');
    
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex < greeting.length) {
        setTypingMessage(greeting.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        
        const greetingMessage = {
          id: 'greeting',
          role: 'assistant',
          text: greeting,
          timestamp: new Date().toISOString(),
        };
        
        setMessages([greetingMessage]);
        setMessageVersion(1);
        setIsTyping(false);
        setTypingMessage('');
      }
    }, 30);
  }, [context, t]);

    // ⭐ NEW: Show welcome message with typing effect
    const showNotLoginMessage = useCallback(() => {

      
      const greeting = t('ai_comment.not_login');
          
      // Type out greeting
      setIsTyping(true);
      setTypingMessage('');
      
      let currentIndex = 0;
      const typeInterval = setInterval(() => {
        if (currentIndex < greeting.length) {
          setTypingMessage(greeting.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          
          const greetingMessage = {
            id: uuid.v4(),
            role: 'ai',
            text: greeting,
            timestamp: new Date().toISOString(),
          };
          
          setMessages(prev => [...prev, greetingMessage]);
          setMessageVersion(prev => prev + 1);

          setIsTyping(false);
          setTypingMessage('');
        }
      }, 30);
    }, [context, t]);
  
  // ⭐ NEW: AI auto conversation starter
  const startAIConversation = useCallback(async (userKey) => {
    console.log('🤖 [Chat] Starting AI conversation...');
    
    // Show loading with animated dots
    setIsLoading(true);
    setIsTyping(true);
    setTypingMessage('');
    
    // Animate dots
    let dots = '';
    const dotInterval = setInterval(() => {
      dots = dots.length < 3 ? dots + '.' : '';
      setTypingMessage(dots);
    }, 300);
    
    setTimeout(async () => {
      clearInterval(dotInterval);
      
      try {
        const response = await chatApi.sendManagerAIMessage({
          user_key: userKey,
          question: '[AUTO_START]', // Special marker for AI to start conversation
          persona_key: persona?.persona_key || null,
        });
        
        if (response.success && response.data?.answer) {
          const answer = response.data.answer;
          const richContent = response.data.rich_content || { images: [], videos: [], links: [] };
          
          // Type out the response
          setTypingMessage('');
          let currentIndex = 0;
          
          const typeInterval = setInterval(() => {
            if (currentIndex < answer.length) {
              setTypingMessage(answer.substring(0, currentIndex + 1));
              currentIndex++;
            } else {
              clearInterval(typeInterval);
              
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
              setMessageVersion(prev => prev + 1);
              setIsTyping(false);
              setTypingMessage('');
              setIsLoading(false);
              
              // Check for continuation
              if (response.data.continue_conversation) {
                setTimeout(() => {
                  handleAIContinue(userKey);
                }, 800);
              }
            }
          }, 30);
        } else {
          setIsLoading(false);
          setIsTyping(false);
          setTypingMessage('');
        }
      } catch (error) {
        console.error('❌ [Chat] Auto start error:', error);
        setIsLoading(false);
        setIsTyping(false);
        setTypingMessage('');
      }
    }, 800);
  }, [persona, chatApi]);
  
  // 🎵 NEW: Handle music press from chat bubble
  const handleMusicPress = useCallback(async (musicData) => {
    if (!musicData || !musicData.url) {
      console.error('❌ [Music Press] Invalid music data:', musicData);
      return;
    }
    
    console.log('🎵 [Music Press] Clicked from chat bubble');
    console.log('   Track:', musicData.title);
    console.log('   Artist:', musicData.artist);
    console.log('   URL:', musicData.url);
    
    // Haptic feedback
    HapticService.trigger('impactMedium');
    
    // 🎵 If currently playing this track, pause
    if (floatingContent?.track?.url === musicData.url && floatingContent?.isPlaying && soundInstanceRef.current) {
      console.log('⏸️  [Music Press] Pausing current track...');
      soundInstanceRef.current.pause();
      
      setFloatingContent(prev => ({
        ...prev,
        isPlaying: false
      }));
      
      return;
    }
    
    // 🎵 If paused (same track), resume
    if (floatingContent?.track?.url === musicData.url && !floatingContent?.isPlaying && soundInstanceRef.current) {
      console.log('▶️  [Music Press] Resuming track...');
      soundInstanceRef.current.play((success) => {
        if (!success) {
          console.log('❌ [Music Press] Playback failed');
          setFloatingContent(prev => ({
            ...prev,
            isPlaying: false
          }));
        }
      });
      
      setFloatingContent(prev => ({
        ...prev,
        isPlaying: true
      }));
      
      return;
    }
    
    // 🎵 Different track or first time: Stop current and load new
    if (soundInstanceRef.current) {
      console.log('🗑️  [Music Press] Stopping current track to play new one...');
      soundInstanceRef.current.stop();
      soundInstanceRef.current.release();
      soundInstanceRef.current = null;
    }
    
    // Load and play new track
    console.log('🔄 [Music Press] Loading new track from URL...');
    
    const sound = new Sound(
      musicData.url,
      null,
      (error) => {
        if (error) {
          console.log('❌ [Music Press] Failed to load music:', error);
          Alert.alert(
            '음악 재생 실패',
            '음악을 불러올 수 없습니다. 다시 시도해주세요.',
            [{ text: '확인' }]
          );
          return;
        }
        
        console.log('✅ [Music Press] Music loaded successfully!');
        console.log(`   Duration: ${Math.floor(sound.getDuration() / 60)}:${String(Math.floor(sound.getDuration() % 60)).padStart(2, '0')}`);
        
        soundInstanceRef.current = sound;
        
        sound.play((success) => {
          if (success) {
            console.log('✅ [Music Press] Playback finished successfully');
            setFloatingContent(prev => ({
              ...prev,
              isPlaying: false
            }));
            sound.release();
            soundInstanceRef.current = null;
          } else {
            console.log('❌ [Music Press] Playback failed');
            setFloatingContent(prev => ({
              ...prev,
              isPlaying: false
            }));
          }
        });
        
        // Update/create floating content state
        setFloatingContent({
          contentType: 'music',
          status: 'completed',
          track: {
            id: musicData.id || `track-${Date.now()}`,
            title: musicData.title,
            artist: musicData.artist,
            url: musicData.url,
            duration: musicData.duration,
            image: musicData.image,
            source: musicData.source || 'unknown'
          },
          isPlaying: true
        });
      }
    );
  }, [floatingContent]);
  
  // 🎬 NEW: Handle YouTube video press
  const handleYouTubePress = useCallback((youtubeData) => {
    if (!youtubeData || !youtubeData.videoId) {
      console.error('❌ [YouTube Press] Invalid video data:', youtubeData);
      return;
    }
    
    console.log('🎬 [YouTube Press] Opening video player');
    console.log('   Title:', youtubeData.title);
    console.log('   Video ID:', youtubeData.videoId);
    
    // Haptic feedback
    HapticService.trigger('impactMedium');
    
    // Set video data and open player
    setCurrentVideo({
      videoId: youtubeData.videoId,
      title: youtubeData.title,
      channel: youtubeData.channel,
    });
    setShowYouTubePlayer(true);
  }, []);
  
  // 🎬 NEW: Handle YouTube player close
  const handleYouTubeClose = useCallback(() => {
    console.log('🎬 [YouTube] Closing player');
    setShowYouTubePlayer(false);
    HapticService.trigger('impactLight');
  }, []);
  
  // 🎨 NEW: Handle floating content button press (Check status on click)
  const handleFloatingContentPress = useCallback(async () => {
    if (!floatingContent) return;
    
    // 🎵 NEW: Handle music player toggle (instant playback!)
    if (floatingContent.contentType === 'music' && floatingContent.track) {
      console.log('🎵 [Music Player] Button clicked');
      console.log('   isPlaying:', floatingContent.isPlaying);
      console.log('   Track:', floatingContent.track.title);
      console.log('   URL:', floatingContent.track.url);
      
      // Haptic feedback
      HapticService.trigger('impactMedium');
      
      // 🎵 If currently playing, pause
      if (floatingContent.isPlaying && soundInstanceRef.current) {
        console.log('⏸️  [Music Player] Pausing...');
        soundInstanceRef.current.pause();
        
        setFloatingContent(prev => ({
          ...prev,
          isPlaying: false
        }));
        
        return;
      }
      
      // 🎵 If paused (sound exists), resume
      if (!floatingContent.isPlaying && soundInstanceRef.current) {
        console.log('▶️  [Music Player] Resuming...');
        soundInstanceRef.current.play((success) => {
          if (!success) {
            console.log('❌ [Music Player] Playback failed');
            // Reset state on failure
            setFloatingContent(prev => ({
              ...prev,
              isPlaying: false
            }));
          }
        });
        
        setFloatingContent(prev => ({
          ...prev,
          isPlaying: true
        }));
        
        return;
      }
      
      // 🎵 First time: Load and play music from URL
      console.log('🔄 [Music Player] Loading music from URL...');
      
      const sound = new Sound(
        floatingContent.track.url,
        null, // null for URL (not local file)
        (error) => {
          if (error) {
            console.log('❌ [Music Player] Failed to load music:', error);
            Alert.alert(
              '음악 재생 실패',
              '음악을 불러올 수 없습니다. 다시 시도해주세요.',
              [{ text: '확인' }]
            );
            return;
          }
          
          // Success: Music loaded
          console.log('✅ [Music Player] Music loaded successfully!');
          console.log(`   Duration: ${Math.floor(sound.getDuration() / 60)}:${String(Math.floor(sound.getDuration() % 60)).padStart(2, '0')}`);
          
          // Store sound instance
          soundInstanceRef.current = sound;
          
          // Play music
          sound.play((success) => {
            if (success) {
              console.log('✅ [Music Player] Playback finished successfully');
              // Reset state when playback completes
              setFloatingContent(prev => ({
                ...prev,
                isPlaying: false
              }));
              // Release resources
              sound.release();
              soundInstanceRef.current = null;
            } else {
              console.log('❌ [Music Player] Playback failed');
              setFloatingContent(prev => ({
                ...prev,
                isPlaying: false
              }));
            }
          });
          
          // Update state to playing
          setFloatingContent(prev => ({
            ...prev,
            isPlaying: true
          }));
        }
      );
      
      return; // ⭐ Early return to avoid image logic
    }
    
    // 🎨 EXISTING: Handle image content (unchanged)
    console.log('👁️  [Floating Content] Button clicked');
    console.log('   Content ID:', floatingContent.contentId);
    console.log('   Current Status:', floatingContent.status);
    console.log('   Image URL:', floatingContent.url);
    
    // ✅ Pixabay provides URL immediately - no need to check status!
    if (floatingContent.status === 'completed' && floatingContent.url) {
      console.log('✅ [Floating Content] Image ready INSTANTLY!');
      console.log('   URL:', floatingContent.url);
      
      // Haptic feedback
      HapticService.trigger('success');
      
      // Mark as clicked
      try {
        await chatApi.markContentAsClicked(floatingContent.contentId);
      } catch (error) {
        console.error('❌ Failed to mark as clicked (non-critical):', error);
      }
      
      // Show fullscreen image viewer
      setSelectedMediaUrl(floatingContent.url);
      setShowMediaViewer(true);
      
      // Hide floating button after viewing
      setFloatingContent(null);
      
      return;
    }
    
    // ⏸️ Fallback: If somehow status is still processing (shouldn't happen with Pixabay)
    if (floatingContent.status === 'processing' || floatingContent.status === 'pending') {
      console.log('⚠️ [Floating Content] Still processing (unexpected for Pixabay)...');
      
      Alert.alert(
        '⏳ 이미지 준비 중',
        '잠시만 기다려주세요!',
        [{ text: '확인' }]
      );
      
      HapticService.trigger('impactLight');
      return;
    }
    
    // ❌ Failed status
    if (floatingContent.status === 'failed') {
      console.error('❌ [Floating Content] Generation failed');
      
      Alert.alert(
        '❌ 생성 실패',
        '이미지 생성에 실패했습니다.\n다시 시도해주세요.',
        [
          {
            text: '닫기',
            onPress: () => setFloatingContent(null)
          }
        ]
      );
      
      HapticService.trigger('notificationError');
    }
  }, [floatingContent, chatApi]);
  
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
  
  /*
  // 🗑️ DISABLED: Create persona from identity draft (복잡한 플로우 비활성화)
  const createPersonaFromDraft = useCallback(async (imageData) => {
    try {
      setIsLoading(true);
      console.log('🎭 [Persona Creation] Starting persona creation...');
      
      const userKey = user?.user_key;
      if (!userKey) {
        console.error('❌ [Persona Creation] No user_key found!');
        Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
        setIsLoading(false);
        return;
      }
      
      // Get identity data from draft
      const identityData = pendingIdentityDraft.identity_data || {};
      
      // Call persona creation API
      console.log('📤 [Persona Creation] Calling createPersona API...');
      const response = await createPersona(userKey, {
        name: pendingIdentityDraft.target_name,
        description: identityData.description || `${pendingIdentityDraft.target_name} 페르소나`,
        gender: 'male', // Default, can be enhanced later
        photo: {
          uri: imageData.uri,
          type: imageData.type,
          base64: imageData.base64,
        },
        identity_draft_id: pendingIdentityDraft.draft_id,
      });
      
      console.log('📥 [Persona Creation] API Response:', response);
      
      if (response.success) {
        console.log('✅ [Persona Creation] Persona creation initiated!');
        console.log('   Persona Key:', response.data?.persona_key);
        console.log('   Estimate Time:', response.data?.estimate_time);
        
        // Send confirmation message to AI
        console.log('📤 [Persona Creation] Sending confirmation message...');
        const confirmResponse = await chatApi.sendManagerAIMessage({
          user_key: userKey,
          question: `[PERSONA_CREATION_IMAGE_UPLOADED:${pendingIdentityDraft.target_name}]`,
          persona_key: persona?.persona_key || 'SAGE',
        });
        
        if (confirmResponse.success && confirmResponse.data?.answer) {
          // Display AI's completion message
          const completionMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            text: confirmResponse.data.answer,
            timestamp: new Date().toISOString(),
          };
          
          setMessages(prev => [...prev, completionMessage]);
          setMessageVersion(prev => prev + 1);
          
          console.log('✅ [Persona Creation] Completion message displayed');
        }
        
        // Clear pending draft state
        setPendingIdentityDraft(null);
        
        // Success haptic
        HapticService.success();
        
      } else {
        console.error('❌ [Persona Creation] Failed:', response.error);
        Alert.alert(
          '페르소나 생성 실패',
          response.error || '페르소나 생성 중 오류가 발생했습니다.',
          [{ text: '확인', style: 'default' }]
        );
      }
      
    } catch (error) {
      console.error('❌ [Persona Creation] Error:', error);
      Alert.alert(
        '오류 발생',
        '페르소나 생성 중 오류가 발생했습니다.',
        [{ text: '확인', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [pendingIdentityDraft, user, persona, chatApi]);
  */
  
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
        setIsTyping(true);
        setTypingMessage('');
        
        const answer = response.data.answer;
        const richContent = response.data.rich_content || { images: [], videos: [], links: [] };
        let currentIndex = 0;
        
        const typeInterval = setInterval(() => {
          if (currentIndex < answer.length) {
            setTypingMessage(answer.substring(0, currentIndex + 1));
            currentIndex++;
          } else {
            clearInterval(typeInterval);
            
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
            setMessageVersion(prev => prev + 1);
            setIsTyping(false);
            setTypingMessage('');
            setIsLoading(false);
            
            // Check if AI wants to continue AGAIN
            if (response.data.continue_conversation) {
              console.log('🔄 [ManagerAIOverlay] AI wants to continue again...');
              
              // ⭐ Show TypingIndicator (same as user message send)
              setIsLoading(true);
              setIsTyping(false);
              setTypingMessage('');
              
              setTimeout(() => {
                handleAIContinue(userKey);
              }, 800);
            } else {
              // Conversation ended
              setIsAIContinuing(false);
              aiContinueCountRef.current = 0; // ⭐ Reset ref
              console.log('✅ [ManagerAIOverlay] AI conversation completed');
            }
          }
        }, 30);
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
    setMessageVersion(prev => prev + 1);
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
        setIsTyping(true);
        setTypingMessage('');
        
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
          
          // Set floating content state (music is ready instantly!)
          setFloatingContent({
            contentType: 'music',
            status: 'completed', // ⭐ Music is instant (no processing)
            track: musicData.track,
            alternatives: musicData.alternatives || [],
            emotion: musicData.emotion,
            mood: musicData.mood,
            reasoning: musicData.reasoning,
            isPlaying: false // Initially not playing
          });
          
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
        
        let currentIndex = 0;
        
        const typeInterval = setInterval(() => {
          if (currentIndex < answer.length) {
            setTypingMessage(answer.substring(0, currentIndex + 1));
            currentIndex++;
          } else {
            clearInterval(typeInterval);
            
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
            setMessageVersion(prev => prev + 1);
            setIsTyping(false);
            setTypingMessage('');
            
            // ⭐ NEW: Check if AI wants to continue talking
            console.log('🔍 [ManagerAIOverlay] Checking shouldContinue:', shouldContinue);
            if (shouldContinue) {
              console.log('🔄 [ManagerAIOverlay] AI wants to continue, calling handleAIContinue...');
              
              // ⭐ Show TypingIndicator (same as user message send)
              setIsLoading(true);
              setIsTyping(false);
              setTypingMessage('');
              
              setTimeout(() => {
                handleAIContinue(userKey);
              }, 800); // Small delay for natural feel
            } else {
              console.log('✋ [ManagerAIOverlay] AI finished, no continuation needed');
              aiContinueCountRef.current = 0; // ⭐ Reset counter
            }
          }
        }, 30);
        
      } else {
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: t('errors.MANAGER_AI_ERROR'),
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setMessageVersion(prev => prev + 1);
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
      setMessageVersion(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [t, user, persona, handleAIContinue, selectedImage]); // ⭐ FIX: Add handleAIContinue & selectedImage dependencies
  
  // ✅ Handle close (Simplified)
  // 🎁 NEW: Handle gift reaction
  const handleGiftReaction = useCallback(async (reaction) => {
    if (!giftData || giftReacting) return;
    
    try {
      setGiftReacting(true);
      console.log(`❤️  [Gift Reaction] Reacting with: ${reaction}`);
      
      await chatApi.reactToGift({
        gift_id: giftData.gift_id,
        reaction,
      });
      
      console.log('✅ [Gift Reaction] Reaction recorded');
      HapticService.success();
      
      // Close modal
      setShowGiftModal(false);
      setGiftData(null);
      
    } catch (error) {
      console.log('❌ [Gift Reaction] Error:', error);
      Alert.alert(
        t('common.error'),
        t('common.errorMessage')
      );
    } finally {
      setGiftReacting(false);
    }
  }, [giftData, giftReacting, t]);
  
  // 🎁 NEW: Close gift modal without reaction
  const handleGiftClose = useCallback(() => {
    // Mark as viewed
    if (giftData) {
      handleGiftReaction('viewed');
    } else {
      setShowGiftModal(false);
    }
  }, [giftData, handleGiftReaction]);
  
  // 🗑️ TEMPORARILY DISABLED: Identity Guide handlers (during refactoring)
  /*
  const handleIdentityGuideDontShow = useCallback(async () => {
    if (!persona) return;
    
    try {
      const dontShowKey = `identity_guide_dont_show_${persona.persona_key}`;
      await AsyncStorage.setItem(dontShowKey, 'true');
      
      console.log('✅ [Identity Guide] "Don\'t show again" preference saved');
      HapticService.success();
      
      // Close modal
      setShowIdentityGuide(false);
      
    } catch (error) {
      console.error('❌ [Identity Guide] Error saving preference:', error);
    }
  }, [persona]);
  
  const handleIdentityGuideClose = useCallback(() => {
    console.log('ℹ️  [Identity Guide] Guide closed (will show again next time)');
    HapticService.light();
    setShowIdentityGuide(false);
  }, []);
  */
  
  const handleClose = useCallback(() => {
    // 🎵 NEW: Stop and cleanup music when closing chat
    if (soundInstanceRef.current) {
      console.log('🗑️  [Music Player] Stopping music on chat close...');
      soundInstanceRef.current.stop();
      soundInstanceRef.current.release();
      soundInstanceRef.current = null;
    }
    
    // Clear floating content (music button)
    setFloatingContent(null);
    
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
              // 🎵 NEW: Stop music when force closing
              if (soundInstanceRef.current) {
                console.log('🗑️  [Music Player] Stopping music on force close...');
                soundInstanceRef.current.stop();
                soundInstanceRef.current.release();
                soundInstanceRef.current = null;
              }
              setFloatingContent(null);
              
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
              
              setTimeout(() => {
                setMessages([]);
                setTypingMessage('');
                setIsTyping(false);
                setIsAIContinuing(false);
                aiContinueCountRef.current = 0;
                setMessageVersion(0);
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
      setTypingMessage('');
      setIsTyping(false);
      setMessageVersion(0);
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
                <Icon name="chevron-back" size={moderateScale(28)} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
              
              {/* Center: Persona Info */}
              <View style={styles.headerCenter}>
                <CustomText type="big" bold style={styles.headerTitle}>
                  {persona ? `${persona.persona_name}` : '💙 SAGE AI'}
                </CustomText>
                {false && (
                  <CustomText type="small" style={styles.headerSubtitle}>
                    {t('persona.identity.as', '자아')}: {persona.identity_name}
                  </CustomText>
                )}
              </View>
              
              {/* 🆕 Right: Music Player Button (Fixed Position!) */}
              <TouchableOpacity 
                onPress={() => {
                  if (floatingContent?.contentType === 'music') {
                    handleFloatingContentPress();
                  } else {
                    // No music loaded
                    HapticService.light();
                  }
                }}
                style={[
                  styles.headerMusicButton,
                  floatingContent?.contentType === 'music' && floatingContent?.isPlaying && styles.headerMusicButtonActive
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={!floatingContent || floatingContent.contentType !== 'music'}
              >
                <Icon 
                  name={
                    floatingContent?.contentType === 'music' && floatingContent?.isPlaying
                      ? "pause-circle" 
                      : "musical-notes"
                  } 
                  size={moderateScale(28)} 
                  color={
                    floatingContent?.contentType === 'music' 
                      ? (floatingContent?.isPlaying ? '#10B981' : COLORS.PRIMARY) 
                      : 'rgba(255, 255, 255, 0.3)'
                  } 
                />
              </TouchableOpacity>
            </View>
            
            {/* ✅ Chat Messages (Scrollable) */}
            <View style={styles.chatContainer}>
              <ChatMessageList
                completedMessages={messages}
                typingMessage={isTyping ? typingMessage : null}
                messageVersion={messageVersion}
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
                disabled={isLoading || isTyping || isAIContinuing} // ⭐ NEW: Also disable when AI is continuing
                placeholder={t('chatBottomSheet.placeholder')}
                onAISettings={handleToggleSettings} // 🆕 Toggle settings menu
                onCreateMusic={handleCreateMusic} // 🆕 Create music callback
                onCreateMessage={handleCreateMessage} // 🆕 Create message callback
                visionMode={settings.vision_mode} // 🆕 Vision mode setting
                hasSelectedImage={!!selectedImage} // 🆕 FIX: Tell ChatInputBar if image is selected
                persona={persona} // 🗣️ NEW: Pass persona for speaking pattern visibility
              />
            </View>
            
            {/* 🎨 NEW: Floating Content Button */}
            {/* 🎵 NEW: Floating Content Button - DISABLED (using header button instead) */}
            {/* {(() => {
              // ✅ ONLY show floating button for MUSIC (images are in chat bubble now!)
              if (floatingContent && floatingContent.contentType === 'music') {
                return (
                  <FloatingContentButton
                    contentType={floatingContent.contentType}
                    status={floatingContent.status}
                    isPlaying={floatingContent.isPlaying || false}
                    onPress={handleFloatingContentPress}
                    onRetry={() => {
                      setFloatingContent(null);
                      Alert.alert(
                        '🔄 재시도',
                        '다시 요청해주세요!',
                        [{ text: '확인' }]
                      );
                    }}
                  />
                );
              }
              return null;
            })()} */}
          </View>
        </KeyboardAvoidingView>
      </View>
      
      {/* 🗑️ TEMPORARILY DISABLED: Identity Guide Modal (during refactoring) */}
      {/* <IdentityGuideModal
        visible={showIdentityGuide}
        personaName={persona?.persona_name || 'AI'}
        onDontShowAgain={handleIdentityGuideDontShow}
        onClose={handleIdentityGuideClose}
      /> */}
      
      {/* 🎁 Emotional Gift Modal */}
      {false && (
        <Modal
          visible={showGiftModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleGiftClose}
        >
          <View style={styles.giftModalOverlay}>
            <View style={styles.giftModalContainer}>
              {/* Header */}
              <View style={styles.giftModalHeader}>
                <CustomText style={styles.giftModalTitle}>
                  🎁 {persona?.persona_name || 'SAGE'}님의 선물
                </CustomText>
                <TouchableOpacity onPress={handleGiftClose} style={styles.giftCloseButton}>
                  <Icon name="close" size={moderateScale(24)} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {/* Gift Image */}
              <View style={styles.giftImageContainer}>
                {giftData.image_url ? (
                  <Image 
                    source={{ uri: giftData.image_url }}
                    style={styles.giftImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.giftImagePlaceholder}>
                    <Icon name="gift" size={moderateScale(80)} color="rgba(255,255,255,0.3)" />
                  </View>
                )}
              </View>
              
              {/* AI Message */}
              <ScrollView style={styles.giftMessageContainer}>
                <CustomText style={styles.giftEmotion}>
                  {giftData.ai_emotion === 'joy' && '😊 기쁨'}
                  {giftData.ai_emotion === 'gratitude' && '🙏 감사'}
                  {giftData.ai_emotion === 'love' && '💙 사랑'}
                  {giftData.ai_emotion === 'empathy' && '🤗 공감'}
                  {giftData.ai_emotion === 'excitement' && '🎉 설렘'}
                  {giftData.ai_emotion === 'hope' && '✨ 희망'}
                </CustomText>
                <CustomText style={styles.giftMessage}>
                  {giftData.ai_message}
                </CustomText>
              </ScrollView>
              
              {/* Reaction Buttons */}
              <View style={styles.giftReactionContainer}>
                <TouchableOpacity 
                  style={[styles.giftReactionButton, styles.giftReactionLoved]}
                  onPress={() => handleGiftReaction('loved')}
                  disabled={giftReacting}
                >
                  <Icon name="heart" size={moderateScale(24)} color="#fff" />
                  <CustomText style={styles.giftReactionText}>사랑해요</CustomText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.giftReactionButton, styles.giftReactionLiked]}
                  onPress={() => handleGiftReaction('liked')}
                  disabled={giftReacting}
                >
                  <Icon name="thumbs-up" size={moderateScale(24)} color="#fff" />
                  <CustomText style={styles.giftReactionText}>좋아요</CustomText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.giftReactionButton, styles.giftReactionSaved]}
                  onPress={() => handleGiftReaction('saved')}
                  disabled={giftReacting}
                >
                  <Icon name="bookmark" size={moderateScale(24)} color="#fff" />
                  <CustomText style={styles.giftReactionText}>저장</CustomText>
                </TouchableOpacity>
              </View>
              
              {giftReacting && (
                <View style={styles.giftLoadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </View>
          </View>
        </Modal>
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
    
    {/* 🎬 YouTube Video Player Modal (Independent Modal - Outside ManagerAIOverlay Modal) */}
    <VideoPlayerModal
      visible={showYouTubePlayer}
      videoId={currentVideo?.videoId}
      title={currentVideo?.title}
      onClose={handleYouTubeClose}
    />
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
  headerMusicButton: {
    padding: scale(8),
    marginLeft: scale(8),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerMusicButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
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
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎁 Emotional Gift Modal
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  giftModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  giftModalContainer: {
    width: '100%',
    maxWidth: moderateScale(400),
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderRadius: moderateScale(24),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  giftModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  giftModalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#fff',
  },
  giftCloseButton: {
    padding: moderateScale(4),
  },
  giftImageContainer: {
    width: '100%',
    height: verticalScale(300),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftImage: {
    width: '100%',
    height: '100%',
  },
  giftImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftMessageContainer: {
    maxHeight: verticalScale(200),
    padding: moderateScale(20),
  },
  giftEmotion: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: verticalScale(8),
    fontWeight: '500',
  },
  giftMessage: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    color: '#fff',
  },
  giftReactionContainer: {
    flexDirection: 'row',
    padding: moderateScale(20),
    gap: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  giftReactionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    gap: moderateScale(6),
  },
  giftReactionLoved: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  giftReactionLiked: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  giftReactionSaved: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  giftReactionText: {
    color: '#fff',
    fontSize: moderateScale(13),
    fontWeight: '500',
  },
  giftLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default memo(ManagerAIOverlay);
