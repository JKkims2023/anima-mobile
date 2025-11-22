/**
 * PersonaChatView Component (SAGE-BASED ARCHITECTURE)
 * 
 * Features:
 * - Persona-specific chat interface
 * - Memory-based chat history (instant switch, no DB call)
 * - Keyboard-aware input bar
 * - Height control (tall/medium)
 * - Optimized typing effect (60fps)
 * - 100% SAGE architecture for consistency
 * 
 * Architecture:
 * 1. Video/Image Background (Z-Index: 0) - From parent
 * 2. Chat Overlay (Z-Index: 10) - Animated position
 *    - ChatMessageList (Scrollable)
 *    - ChatInputBar (Fixed bottom, keyboard-aware)
 * 3. ChatHeightToggle (Z-Index: 20)
 * 
 * @author JK & Hero AI
 * @date 2024-11-22
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { chatApi, errorHandler } from '../../services/api';
import { getUserKey } from '../../utils/storage';
import ChatMessageList from './ChatMessageList';
import ChatInputBar from './ChatInputBar';
import ChatHeightToggle from './ChatHeightToggle';
import { verticalScale } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../contexts/ChatContext';
import { useQuickAction } from '../../contexts/QuickActionContext';
import { 
  TAB_BAR, 
  CHAT_INPUT, 
  KEYBOARD,
  calculateChatInputBottom, 
  calculateChatOverlayTop 
} from '../../constants/layout';

const PersonaChatView = ({ 
  persona, 
  isPreview = false, 
  modeOpacity,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  const { isQuickMode } = useQuickAction();
  const {
    currentPersonaChat,
    addPersonaMessage,
    setPersonaTypingMessage,
  } = useChat();
  
  const [modeOpacityValue, setModeOpacityValue] = useState(1);
  
  // ✅ Listen to modeOpacity changes
  useEffect(() => {
    if (!modeOpacity) {
      setModeOpacityValue(1);
      return;
    }
    
    const listenerId = modeOpacity.addListener(({ value }) => {
      setModeOpacityValue(value);
    });
    
    return () => {
      modeOpacity.removeListener(listenerId);
    };
  }, [modeOpacity]);
  
  // ✅ Typing message: isolated state (SAME AS SAGE)
  const [typingFullText, setTypingFullText] = useState(null);
  const [typingCurrentText, setTypingCurrentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Typing Effect Refs (requestAnimationFrame for 60fps)
  const animationFrameRef = useRef(null);
  const typingStartTimeRef = useRef(null);
  
  // UI State
  const [chatHeight, setChatHeight] = useState('medium');
  const [isChatVisible, setIsChatVisible] = useState(true);
  
  // ✅ Animated value for smooth position transitions (SAME AS SAGE)
  const platformAdjustment = Platform.OS === 'android' ? 30 : 10;
  const initialBottom = TAB_BAR.BASE_HEIGHT + insets.bottom - CHAT_INPUT.MIN_HEIGHT - platformAdjustment;
  const inputBottomAnim = useRef(new Animated.Value(initialBottom)).current;

  // ✅ Calculate chat top position dynamically (SAME AS SAGE)
  const chatTopPosition = useMemo(() => {
    return calculateChatOverlayTop(chatHeight, isKeyboardVisible);
  }, [isKeyboardVisible, chatHeight]);
  
  // ✅ Calculate chat input bottom position (SAME AS SAGE)
  const chatInputBottom = useMemo(() => {
    return calculateChatInputBottom(isKeyboardVisible, keyboardHeight, insets.bottom);
  }, [isKeyboardVisible, keyboardHeight, insets.bottom]);

  // ✅ Initialize with greeting message (SAME AS SAGE)
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    if (isPreview || !persona) {
      hasInitialized.current = false;
      return;
    }
    
    if (hasInitialized.current) return;
    if (currentPersonaChat.completed.length > 0) return; // Already has messages
    
    hasInitialized.current = true;
    
    // Clear any existing typing state
    setTypingFullText(null);
    setTypingCurrentText('');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    const greetingText = `안녕하세요! 저는 ${persona.persona_name}입니다. 무엇을 도와드릴까요? 😊`;
    
    const typingTimer = setTimeout(() => {
      typingStartTimeRef.current = null;
      setTypingFullText(greetingText);
      setTypingCurrentText('');
    }, 300);
    
    return () => {
      clearTimeout(typingTimer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPreview, persona, currentPersonaChat.completed.length]);

  // ✅ Typing Effect (SAME AS SAGE - 60fps with requestAnimationFrame)
  useEffect(() => {
    if (!typingFullText || typingFullText.trim() === '') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      typingStartTimeRef.current = null;
      setTypingCurrentText('');
      return;
    }
    
    const fullText = typingFullText;
    const typingSpeed = 15; // ms per character
    
    const typeNextChar = (timestamp) => {
      if (!typingStartTimeRef.current) {
        typingStartTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - typingStartTimeRef.current;
      const targetIndex = Math.floor(elapsed / typingSpeed);
      
      if (targetIndex < fullText.length) {
        const currentText = fullText.substring(0, targetIndex + 1);
        setTypingCurrentText(currentText);
        animationFrameRef.current = requestAnimationFrame(typeNextChar);
      } else {
        // Typing complete
        setTypingCurrentText('');
        setTypingFullText(null);
        typingStartTimeRef.current = null;
        animationFrameRef.current = null;
        
        // Add completed message to context
        if (persona && persona.persona_key) {
          addPersonaMessage(persona.persona_key, {
            role: 'ai',
            text: fullText,
          });
        }
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(typeNextChar);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      typingStartTimeRef.current = null;
    };
  }, [typingFullText, persona, addPersonaMessage]);

  // ✅ Update typing message in context (for display)
  useEffect(() => {
    if (persona && persona.persona_key) {
      setPersonaTypingMessage(persona.persona_key, typingCurrentText);
    }
  }, [persona, typingCurrentText, setPersonaTypingMessage]);

  // ✅ Animate input bar position (SAME AS SAGE)
  useEffect(() => {
    Animated.timing(inputBottomAnim, {
      toValue: chatInputBottom,
      duration: KEYBOARD.ANIMATION_DURATION,
      useNativeDriver: false,
    }).start();
  }, [chatInputBottom, inputBottomAnim]);

  // ✅ Handle send message (SAME AS SAGE)
  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading || typingFullText || !persona) {
      return;
    }
    
    // Add user message immediately
    addPersonaMessage(persona.persona_key, {
      role: 'user',
      text: text.trim(),
    });
    
    setIsLoading(true);

    try {
      const userKey = await getUserKey();
      
      const response = await chatApi.sendPersonaMessage({
        persona_key: persona.persona_key,
        question: text.trim(),
        user_key: userKey,
      });

      if (response.success) {
        const aiResponse = response.data?.data || response.data?.message || 'I understand your question.';
        
        // Start typing effect
        setTimeout(() => {
          typingStartTimeRef.current = null;
          setTypingFullText(aiResponse);
          setTypingCurrentText('');
        }, 500);
      } else {
        const errorMessage = errorHandler.getErrorMessage(response.error, t);
        addPersonaMessage(persona.persona_key, {
          role: 'ai',
          text: errorMessage,
        });
      }
    } catch (error) {
      console.error('❌ [PersonaChatView] Error:', error);
      addPersonaMessage(persona.persona_key, {
        role: 'ai',
        text: t('errors.generic') || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, isLoading, typingFullText, persona, addPersonaMessage]);

  // ✅ Handle chat height toggle (SAME AS SAGE)
  const handleToggleChatHeight = useCallback((newHeight) => {
    setChatHeight(newHeight);
  }, []);

  // ✅ Handle chat visibility toggle (SAME AS SAGE)
  const handleToggleChatVisibility = useCallback(() => {
    setIsChatVisible(prev => !prev);
  }, []);

  // ✅ Skip rendering if preview mode, quick action mode (isQuickMode=false), or no persona
  if (isPreview || !isQuickMode || !persona) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      {/* Chat Overlay (Messages + Input) - SAME AS SAGE */}
      {isChatVisible && (
        <View
          style={[
            styles.chatOverlay,
            {
              top: chatTopPosition,
              bottom: chatInputBottom + (CHAT_INPUT.MIN_HEIGHT * 2) + CHAT_INPUT.BOTTOM_PADDING,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Messages (FlashList) */}
          <View style={styles.messagesContainer} pointerEvents="auto">
            <ChatMessageList
              key={`persona-${persona.persona_key}-v${currentPersonaChat.version}`}
              completedMessages={currentPersonaChat.completed}
              typingMessage={typingCurrentText}
              messageVersion={currentPersonaChat.version}
              isLoading={isLoading}
            />
          </View>
        </View>
      )}

      {/* Input Bar - SAME AS SAGE */}
      {isChatVisible && (
        <Animated.View
          style={[
            styles.inputBarContainer,
            {
              bottom: inputBottomAnim,
            },
          ]}
          pointerEvents="auto"
        >
          <ChatInputBar
            onSend={handleSendMessage}
            disabled={isLoading || !!typingFullText}
            placeholder={t('persona.input_placeholder') || `${persona.persona_name}에게 메시지 보내기...`}
            onToggleChatHeight={handleToggleChatHeight}
            onToggleChatVisibility={handleToggleChatVisibility}
            chatHeight={chatHeight}
            isChatVisible={isChatVisible}
          />
        </Animated.View>
      )}

      {/* Height Toggle Button - SAME AS SAGE */}
      {isChatVisible && (
        <ChatHeightToggle
          chatHeight={chatHeight}
          onToggle={handleToggleChatHeight}
          currentTheme={currentTheme}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  chatOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
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
    zIndex: 200,
    ...(Platform.OS === 'android' && {
      elevation: 200,
    }),
  },
});

export default PersonaChatView;
