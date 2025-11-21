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
 */
const VideoBackground = memo(({ videoUrl }) => {
  return (
    <Video
      source={{ uri: videoUrl }}
      style={styles.videoBackground}
      resizeMode="cover"
      repeat
      muted
      onError={(error) => {
        if (__DEV__) {
          console.error('[VideoBackground] Error:', error);
        }
      }}
    />
  );
});

VideoBackground.displayName = 'VideoBackground';

const ManagerAIChatView = ({ videoUrl }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();
  const insets = useSafeAreaInsets(); // ✅ Get safe area insets
  
  // Chat State
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Typing Effect States (Web peek page style)
  const [currentTypingMessage, setCurrentTypingMessage] = useState('');
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const typingTimerRef = useRef(null);
  
  // UI State
  const [chatHeight, setChatHeight] = useState('medium'); // 'tall' | 'medium'
  const [isChatVisible, setIsChatVisible] = useState(true); // Chat visibility
  
  // ✅ Animated value for smooth position transitions
  // Initialize lower: Tab Bar height - InputBar height
  const initialBottom = TAB_BAR.BASE_HEIGHT + insets.bottom - CHAT_INPUT.MIN_HEIGHT;
  const inputBottomAnim = useRef(new Animated.Value(initialBottom)).current;

  // ✅ Calculate chat top position dynamically (MEMOIZED to prevent re-renders)
  // Uses centralized layout constants for consistency
  const chatTopPosition = useMemo(() => {
    // Use helper function from layout constants
    return calculateChatOverlayTop(chatHeight, isKeyboardVisible);
  }, [isKeyboardVisible, chatHeight]); // ✅ Only recalculate when these change
  
  // ✅ Calculate chat input bottom position (NEW: Pure keyboard height aware)
  const chatInputBottom = useMemo(() => {
    return calculateChatInputBottom(isKeyboardVisible, keyboardHeight, insets.bottom);
  }, [isKeyboardVisible, keyboardHeight, insets.bottom]);

  // ✅ Initialize with greeting message (with typing effect)
  useEffect(() => {
    const greetingText = t('manager_ai.greeting') || 'Hello! I\'m SAGE, your AI companion. How can I help you today?';
    
    // 1. Add empty message
    const greetingMessage = {
      id: 'greeting-1',
      role: 'ai',
      text: '',
      timestamp: Date.now(),
    };
    setMessages([greetingMessage]);
    
    // 2. Start typing effect after 300ms
    setTimeout(() => {
      setIsTyping(true);
      setCurrentTypingMessage(greetingText);
      setCurrentTypingIndex(0);
      setCurrentTypingText('');
    }, 300);
  }, [t]);

  // ✅ Typing Effect (Web peek page style: 15ms per character)
  useEffect(() => {
    if (!isTyping || currentTypingMessage === '') return;
    
    const TYPING_SPEED = 15; // 15ms per character (SAGE style)
    
    if (currentTypingIndex < currentTypingMessage.length) {
      typingTimerRef.current = setTimeout(() => {
        const nextChar = currentTypingMessage[currentTypingIndex];
        const newText = currentTypingText + nextChar;
        
        setCurrentTypingText(newText);
        setCurrentTypingIndex(prev => prev + 1);
        
        // Update last message with new text
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              text: newText,
            };
          }
          return updated;
        });
      }, TYPING_SPEED);
      
      return () => {
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
      };
    } else {
      // Typing complete
      setIsTyping(false);
      setCurrentTypingMessage('');
      setCurrentTypingIndex(0);
      setCurrentTypingText('');
    }
  }, [isTyping, currentTypingMessage, currentTypingIndex, currentTypingText]);
  
  // ✅ Animate input bar position smoothly (keyboard-aware + tab bar-aware)
  useEffect(() => {
    Animated.timing(inputBottomAnim, {
      toValue: chatInputBottom,
      duration: KEYBOARD.ANIMATION_DURATION,
      useNativeDriver: false, // Can't use native driver for 'bottom'
    }).start();
  }, [chatInputBottom, inputBottomAnim]);

  // ✅ Send message to Manager AI (with typing effect)
  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading || isTyping) return;
    
    // 1. Add user message immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
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
        
        // 4. Add empty AI message
        const aiMessageId = `ai-${Date.now()}`;
        const emptyAiMessage = {
          id: aiMessageId,
          role: 'ai',
          text: '',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, emptyAiMessage]);
        
        // 5. Start typing effect after brief delay
        setTimeout(() => {
          setIsTyping(true);
          setCurrentTypingMessage(aiResponse);
          setCurrentTypingIndex(0);
          setCurrentTypingText('');
        }, 500);
      } else {
        // Handle API error
        const errorMessage = errorHandler.getErrorMessage(response.error, t);
        
        const errorAiMessage = {
          id: `error-${Date.now()}`,
          role: 'ai',
          text: errorMessage,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorAiMessage]);
      }
    } catch (error) {
      console.error('❌ [Manager AI] Error:', error);
      const errorAiMessage = {
        id: `error-${Date.now()}`,
        role: 'ai',
        text: t('errors.generic') || 'An unexpected error occurred. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [t, isLoading, isTyping]);

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
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* 1. Video Background (Memoized - No re-render during typing) */}
      <VideoBackground videoUrl={videoUrl} />

      {/* 2. Chat Overlay (Messages Only) */}
      {isChatVisible && (
        <View
          style={[
            styles.chatOverlay,
            {
              top: chatTopPosition, // ✅ Memoized value
              // ✅ Reserve space for InputBar
              // chatInputBottom already accounts for position, add InputBar height + small padding
              bottom: chatInputBottom + (CHAT_INPUT.MIN_HEIGHT * 2) + CHAT_INPUT.BOTTOM_PADDING,
              backgroundColor: currentTheme.chatOverlayBackground || 'rgba(0, 0, 0, 0.3)',
            },
          ]}
        >
          {/* 2-1. Messages (FlashList) */}
          <View style={styles.messagesContainer}>
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              isTyping={isTyping}
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
      >
        <ChatInputBar
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder={t('manager_ai.input_placeholder')}
          onToggleChatHeight={handleToggleChatHeight}
          onToggleChatVisibility={handleToggleChatVisibility}
          chatHeight={chatHeight}
          isChatVisible={isChatVisible}
        />
      </Animated.View>

      {/* 3. Height Toggle Button (only when chat is visible) */}
      {isChatVisible && (
        <ChatHeightToggle
          height={chatHeight}
          onToggle={handleToggleChatHeight}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
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
  },
});

export default ManagerAIChatView;

