/**
 * ManagerAIChatView Component
 * 
 * Features:
 * - Video background (full screen)
 * - Chat overlay (animated position)
 * - Keyboard-aware input bar
 * - Height control (tall/medium)
 * - Manager AI (SAGE) chat integration
 * 
 * Architecture:
 * 1. Video Background (Z-Index: 0)
 * 2. Chat Overlay (Z-Index: 10) - Animated position
 *    - ChatMessageList (Scrollable)
 *    - ChatInputBar (Fixed bottom, keyboard-aware)
 * 3. ChatHeightToggle (Z-Index: 20)
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { View, Animated, Dimensions, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { useTranslation } from 'react-i18next';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { chatApi, errorHandler } from '../../services/api';
import { getUserKey } from '../../utils/storage';
import ChatMessageList from './ChatMessageList';
import ChatInputBar from './ChatInputBar';
import ChatHeightToggle from './ChatHeightToggle';
import { verticalScale } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import { usePersona } from '../../contexts/PersonaContext';
import { useQuickAction } from '../../contexts/QuickActionContext';
import { useChat } from '../../contexts/ChatContext';
import { 
  TAB_BAR, 
  CHAT_INPUT, 
  CHAT_OVERLAY, 
  KEYBOARD,
  calculateChatInputBottom, 
  calculateChatOverlayTop 
} from '../../constants/layout';

/**
 * ✅ Memoized Video Background Component
 * Prevents re-render during typing effect
 * - Dynamic key based on videoUrl to force re-render on URL change
 * - Pauses when mode is hidden (modeOpacityValue === 0)
 * - Fade animation on videoUrl change
 */
const VideoBackground = memo(({ videoUrl, modeOpacityValue = 1 }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [currentVideoUrl, setCurrentVideoUrl] = useState(videoUrl);
  
  // ✅ Fade animation on videoUrl change
  useEffect(() => {
    if (currentVideoUrl === videoUrl) return;
    
    if (__DEV__) {
      console.log('[VideoBackground] URL changed, starting fade animation:', {
        from: currentVideoUrl.substring(0, 30) + '...',
        to: videoUrl.substring(0, 30) + '...',
      });
    }
    
    // Fade Out → Change URL → Fade In
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Change URL after fade out
    setTimeout(() => {
      setCurrentVideoUrl(videoUrl);
    }, 300);
  }, [videoUrl, currentVideoUrl, fadeAnim]);
  
  if (__DEV__) {
    console.log('[VideoBackground] Rendering with:', {
      videoUrl: currentVideoUrl.substring(0, 50) + '...',
      modeOpacityValue,
      paused: modeOpacityValue === 0,
    });
  }
  
  return (
    <Animated.View style={[styles.videoBackground, { opacity: fadeAnim }]}>
      <Video
        key={`manager-video-${currentVideoUrl}`}
        source={{ uri: currentVideoUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        muted
        paused={modeOpacityValue === 0}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        onLoad={() => {
          if (__DEV__) {
            console.log('[VideoBackground] Video Loaded:', currentVideoUrl.substring(0, 50) + '...');
          }
        }}
        onError={(error) => {
          if (__DEV__) {
            console.error('[VideoBackground] Error:', error);
          }
        }}
      />
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if videoUrl or modeOpacityValue changes
  return (
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.modeOpacityValue === nextProps.modeOpacityValue
  );
});

VideoBackground.displayName = 'VideoBackground';

const ManagerAIChatView = ({ videoUrl, isPreview = false, modeOpacity, chatOpacity }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();
  const insets = useSafeAreaInsets(); // ✅ Get safe area insets
  const { mode, personas } = usePersona(); // ✅ Get mode and personas for dynamic greeting
  const { isQuickMode } = useQuickAction(); // ✅ Get quick mode state
  const { setSageState } = useChat(); // ✅ Get AI state setter
  const [modeOpacityValue, setModeOpacityValue] = useState(1);
  const [chatOpacityValue, setChatOpacityValue] = useState(1);
  
  // ✅ Listen to modeOpacity changes
  useEffect(() => {
    if (!modeOpacity) {
      setModeOpacityValue(1); // Default to visible if no modeOpacity
      return;
    }
    
    const listenerId = modeOpacity.addListener(({ value }) => {
      setModeOpacityValue(value);
    });
    
    return () => {
      modeOpacity.removeListener(listenerId);
    };
  }, [modeOpacity]);
  
  // ✅ Listen to chatOpacity changes
  useEffect(() => {
    if (!chatOpacity) {
      setChatOpacityValue(1); // Default to visible if no chatOpacity
      return;
    }
    
    const listenerId = chatOpacity.addListener(({ value }) => {
      setChatOpacityValue(value);
    });
    
    return () => {
      chatOpacity.removeListener(listenerId);
    };
  }, [chatOpacity]);
  
  // ✅ All hooks must be called before any return statement
  // Chat State (OPTIMIZED: Isolated typing message to prevent re-renders)
  // ✅ Completed messages: Map structure for per-persona history
  // Key: videoUrl (unique per persona), Value: messages array
  const completedMessagesMapRef = useRef(new Map());
  
  // ✅ Current persona's messages (derived from Map)
  const [currentMessages, setCurrentMessages] = useState([]);
  
  // ✅ Load messages for current videoUrl
  useEffect(() => {
    const messages = completedMessagesMapRef.current.get(videoUrl) || [];
    setCurrentMessages(messages);
    
    if (__DEV__) {
      console.log('[ManagerAIChatView] 📝 Loaded messages for:', {
        videoUrl: videoUrl.substring(0, 50) + '...',
        messageCount: messages.length,
      });
    }
  }, [videoUrl]);
  
  // ✅ Typing message: isolated state (only TypingMessage component re-renders)
  const [typingFullText, setTypingFullText] = useState(null); // Full text to type
  const [typingCurrentText, setTypingCurrentText] = useState(''); // Current typing text (updates frequently)
  
  // ✅ Render trigger (incremented only when message is completed)
  const [messageVersion, setMessageVersion] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Typing Effect Refs (requestAnimationFrame for 60fps)
  const animationFrameRef = useRef(null);
  const typingStartTimeRef = useRef(null);
  
  // UI State
  const [chatHeight, setChatHeight] = useState('medium'); // 'tall' | 'medium'
  const [isChatVisible, setIsChatVisible] = useState(true); // Chat visibility
  
  // ✅ Animated value for smooth position transitions
  // Initialize lower: Tab Bar height - InputBar height
  // Platform-specific adjustment for perfect positioning
  const platformAdjustment = Platform.OS === 'android' ? 30 : 10; // Android: 30px down, iOS: 10px down
  const initialBottom = TAB_BAR.BASE_HEIGHT + insets.bottom - CHAT_INPUT.MIN_HEIGHT - platformAdjustment;
  const inputBottomAnim = useRef(new Animated.Value(initialBottom)).current;

  // ✅ Calculate chat top position dynamically (MEMOIZED to prevent re-renders)
  // Uses centralized layout constants for consistency
  const chatTopPosition = useMemo(() => {
    // Use helper function from layout constants
    return calculateChatOverlayTop(chatHeight, isKeyboardVisible);
  }, [isKeyboardVisible, chatHeight]); // ✅ Only recalculate when these change
  
  // ✅ Calculate chat input bottom position (NEW: Pure keyboard height aware)
  const chatInputBottom = useMemo(() => {
    const result = calculateChatInputBottom(isKeyboardVisible, keyboardHeight, insets.bottom);
    if (__DEV__) {
      console.log('[ManagerAIChatView] 📏 chatInputBottom:', result);
    }
    return result;
  }, [isKeyboardVisible, keyboardHeight, insets.bottom]);
  
  // ✅ Calculate chatOverlayBottom (for comparison with Persona)
  const chatOverlayBottom = chatInputBottom + (CHAT_INPUT.MIN_HEIGHT * 2) + CHAT_INPUT.BOTTOM_PADDING;
  
  if (__DEV__) {
    console.log('[ManagerAIChatView] 📏 chatOverlayBottom:', chatOverlayBottom);
    console.log('[ManagerAIChatView] 📏 Calculation:', `${chatInputBottom} + (${CHAT_INPUT.MIN_HEIGHT} * 2) + ${CHAT_INPUT.BOTTOM_PADDING} = ${chatOverlayBottom}`);
  }

  // ✅ Initialize with greeting message (with typing effect)
  const hasInitialized = useRef(false);
  const lastPreviewState = useRef(isPreview);
  
  useEffect(() => {
    // ✅ Skip if in preview mode
    if (isPreview) {
      hasInitialized.current = false; // Reset when going to preview
      return;
    }
    
    // ✅ Initialize only once when not in preview, or when coming back from preview
    const wasInPreview = lastPreviewState.current && !isPreview;
    if (hasInitialized.current && !wasInPreview) return;
    
    hasInitialized.current = true;
    lastPreviewState.current = isPreview;
    
    // ✅ Clear any existing typing state
    setTypingFullText(null);
    setTypingCurrentText('');
    
    // ✅ Clear existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // ✅ Dynamic greeting based on mode and personas count
    let greetingText;
    if (mode === 'sage' && personas.length === 1) {
      // SAGE mode with no personas
      greetingText = '안녕하세요! SAGE입니다. 아직 페르소나가 없으시네요. 중앙 버튼을 눌러 첫 페르소나를 생성해보세요! ✨';
    } else {
      // Default greeting
      greetingText = t('manager_ai.greeting') || '안녕하세요! SAGE입니다. 무엇을 도와드릴까요?';
    }
    
    // ✅ Start typing effect after 300ms
    const typingTimer = setTimeout(() => {
      typingStartTimeRef.current = null; // Will be set in useEffect
      setTypingFullText(greetingText);
      setTypingCurrentText('');
    }, 300);
    
    return () => {
      clearTimeout(typingTimer);
    };
  }, [t, mode, personas.length, isPreview]);

  // ✅ Typing Effect (OPTIMIZED: requestAnimationFrame for 60fps, isolated state)
  useEffect(() => {
    if (!typingFullText) {
      // Reset when not typing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      typingStartTimeRef.current = null;
      setTypingCurrentText('');
      return;
    }
    
    const TYPING_SPEED = 15; // 15ms per character (SAGE style)
    const fullText = typingFullText;
    
    // ✅ requestAnimationFrame for 60fps typing effect
    const typeNextChar = (timestamp) => {
      // ✅ Initialize start time on first frame
      if (!typingStartTimeRef.current) {
        typingStartTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - typingStartTimeRef.current;
      const targetIndex = Math.floor(elapsed / TYPING_SPEED);
      
      if (targetIndex < fullText.length) {
        // ✅ Update typing current text (only TypingMessage component re-renders)
        const currentText = fullText.substring(0, targetIndex + 1);
        setTypingCurrentText(currentText); // ✅ This triggers only TypingMessage re-render
        
        // Schedule next frame
        animationFrameRef.current = requestAnimationFrame(typeNextChar);
      } else {
        // ✅ Typing complete: add to completed messages
        const completedMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: fullText,
          timestamp: Date.now(),
        };
        
        // ✅ Update messages for current videoUrl
        const currentMessages = completedMessagesMapRef.current.get(videoUrl) || [];
        const updatedMessages = [...currentMessages, completedMessage];
        completedMessagesMapRef.current.set(videoUrl, updatedMessages);
        
        // ✅ Update current messages state
        setCurrentMessages(updatedMessages);
        
        // ✅ Trigger FlashList re-render (only once)
        setMessageVersion(v => v + 1);
        
        // ✅ Reset AI state to 'greeting' after typing completes
        setSageState('greeting');
        
        // ✅ Clear typing state
        setTypingFullText(null);
        setTypingCurrentText('');
        typingStartTimeRef.current = null;
        animationFrameRef.current = null;
      }
    };
    
    // Start typing animation
    animationFrameRef.current = requestAnimationFrame(typeNextChar);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      typingStartTimeRef.current = null;
    };
  }, [typingFullText]); // ✅ Only depend on typingFullText (not typingCurrentText)
  
  // ✅ Animate input bar position smoothly (keyboard-aware + tab bar-aware)
  useEffect(() => {
    Animated.timing(inputBottomAnim, {
      toValue: chatInputBottom,
      duration: KEYBOARD.ANIMATION_DURATION,
      useNativeDriver: false, // Can't use native driver for 'bottom'
    }).start();
  }, [chatInputBottom, inputBottomAnim]);

  // ✅ Send message to Manager AI (with typing effect - OPTIMIZED)
  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading || typingFullText) return;
    
    // 1. Add user message immediately to completed messages
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };
    
    // ✅ Update messages for current videoUrl
    const currentMessages = completedMessagesMapRef.current.get(videoUrl) || [];
    const updatedMessages = [...currentMessages, userMessage];
    completedMessagesMapRef.current.set(videoUrl, updatedMessages);
    
    // ✅ Update current messages state
    setCurrentMessages(updatedMessages);
    
    // ✅ Trigger FlashList re-render (only once)
    setMessageVersion(v => v + 1);
    
    // ✅ Set AI state to 'thinking'
    setSageState('thinking');
    setIsLoading(true);

    try {
      // 2. Get user key from storage
      const userKey = await getUserKey();
      
      // 3. Call Manager AI API
      const response = await chatApi.sendManagerAIMessage({
        question: text.trim(),
        user_key: userKey,
      });

      if (response.success) {
        const aiResponse = response.data?.data || response.data?.message || 'I understand your question. Let me help you with that.';
        
        // ✅ Set AI state to 'talking'
        setSageState('talking');
        
        // 4. Start typing effect after brief delay (isolated state)
        setTimeout(() => {
          setTypingFullText(aiResponse);
          setTypingCurrentText('');
        }, 500);
      } else {
        // Handle API error (add to completed messages immediately)
        const errorMessage = errorHandler.getErrorMessage(response.error, t);
        
        // ✅ Set AI state to 'error'
        setSageState('error');
        
        const errorAiMessage = {
          id: `error-${Date.now()}`,
          role: 'ai',
          text: errorMessage,
          timestamp: Date.now(),
        };
        
        // ✅ Update messages for current videoUrl
        const currentMessages = completedMessagesMapRef.current.get(videoUrl) || [];
        const updatedMessages = [...currentMessages, errorAiMessage];
        completedMessagesMapRef.current.set(videoUrl, updatedMessages);
        setCurrentMessages(updatedMessages);
        
        // ✅ Trigger FlashList re-render
        setMessageVersion(v => v + 1);
        
        // ✅ Reset to greeting after 3 seconds
        setTimeout(() => setSageState('greeting'), 3000);
      }
    } catch (error) {
      console.error('❌ [Manager AI] Error:', error);
      
      // ✅ Set AI state to 'error'
      setSageState('error');
      
      const errorAiMessage = {
        id: `error-${Date.now()}`,
        role: 'ai',
        text: t('errors.generic') || 'An unexpected error occurred. Please try again.',
        timestamp: Date.now(),
      };
      
      // ✅ Update messages for current videoUrl
      const currentMessages = completedMessagesMapRef.current.get(videoUrl) || [];
      const updatedMessages = [...currentMessages, errorAiMessage];
      completedMessagesMapRef.current.set(videoUrl, updatedMessages);
      setCurrentMessages(updatedMessages);
      
      // ✅ Trigger FlashList re-render
      setMessageVersion(v => v + 1);
      
      // ✅ Reset to greeting after 3 seconds
      setTimeout(() => setSageState('greeting'), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [t, isLoading, typingFullText, setSageState, videoUrl]);

  // ✅ Toggle chat height (tall ⇄ medium)
  const handleToggleChatHeight = useCallback(() => {
    setChatHeight((prev) => (prev === 'tall' ? 'medium' : 'tall'));
  }, []);

  // ✅ Toggle chat visibility (show ⇄ hide)
  const handleToggleChatVisibility = useCallback(() => {
    setIsChatVisible((prev) => !prev);
  }, []);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // ✅ Conditional rendering: Preview mode vs Full mode
  return (
    <View style={styles.container}>
      {/* 1. Video Background (Always shown) */}
      {modeOpacityValue > 0 && (
        <VideoBackground videoUrl={videoUrl} modeOpacityValue={modeOpacityValue} />
      )}

      {/* 2. Chat UI (Only when NOT preview AND in Chat Mode - isQuickMode=true) */}
      {!isPreview && isQuickMode && (
        <Animated.View
          style={[
            styles.chatUIContainer,
            {
              opacity: chatOpacityValue, // ✅ Apply chat opacity value
            },
          ]}
          pointerEvents="box-none"
        >
          {/* 2-1. Chat Overlay (Messages Only) */}
          {isChatVisible && (
            <View
              style={[
                styles.chatOverlay,
                {
                  top: chatTopPosition, // ✅ Memoized value
                  // ✅ Reserve space for InputBar
                  // chatInputBottom already accounts for position, add InputBar height + small padding
                  bottom: chatOverlayBottom, // ✅ Use calculated value for comparison
             //     backgroundColor: currentTheme.chatOverlayBackground || 'rgba(0, 0, 0, 0.3)',
                },
              ]}
              pointerEvents="box-none"
            >
              {/* Messages (FlashList) */}
              <View style={styles.messagesContainer} pointerEvents="auto">
                <ChatMessageList
                  completedMessages={currentMessages}
                  typingMessage={typingCurrentText}
                  messageVersion={messageVersion}
                  isLoading={isLoading}
                />
              </View>
            </View>
          )}

          {/* 2-2. Input Bar (Separate Animated View for Keyboard + Tab Bar aware) */}
          <Animated.View
            style={[
              styles.inputBarContainer, 
              {
                // ✅ PERFECT: Dynamic positioning with smooth animation
                // Normal: bottom = TAB_BAR.TOTAL_HEIGHT + safeBottom + padding
                // Keyboard: bottom = keyboardHeight + padding
                // Animated transition between states
                bottom: inputBottomAnim,
              },
            ]}
            pointerEvents="box-none"
          >
            <View pointerEvents="auto">
              <ChatInputBar
                onSend={handleSendMessage}
                disabled={isLoading}
                placeholder={t('manager_ai.input_placeholder')}
                onToggleChatHeight={handleToggleChatHeight}
                onToggleChatVisibility={handleToggleChatVisibility}
                chatHeight={chatHeight}
                isChatVisible={isChatVisible}
              />
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  chatUIContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    ...(Platform.OS === 'android' && {
      elevation: 0,
    }),
  },
  chatOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    // ✅ bottom is set dynamically in component (60px + insets.bottom)
    borderTopLeftRadius: verticalScale(20),
    borderTopRightRadius: verticalScale(20),
    overflow: 'hidden',
    zIndex: 10,
    ...(Platform.OS === 'android' && {
      elevation: 10,
    }),
  },
  messagesContainer: {
    flex: 1,
  },
  inputBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20, // ✅ Above chat overlay
    // ✅ bottom is controlled by Animated.Value (keyboardHeight)
    ...(Platform.OS === 'android' && {
      elevation: 20,
    }),
  },
});

export default ManagerAIChatView;

