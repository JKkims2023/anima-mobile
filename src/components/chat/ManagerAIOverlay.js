/**
 * 🤖 ManagerAIOverlay - Universal Manager AI Chat Overlay
 * 
 * Features:
 * - Full-screen overlay (no background video/image)
 * - Context-aware AI responses
 * - Reuses ChatMessageList & ChatInputBar
 * - Keyboard-aware positioning
 * - Dark blur background
 * 
 * Context Types:
 * - 'home': Message creation, Persona creation
 * - 'music': Music generation
 * - 'point': Points & Premium membership
 * - 'settings': General settings help
 * 
 * @author JK & Hero AI
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { 
  View, 
  Modal, 
  Animated, 
  Dimensions, 
  StyleSheet, 
  TouchableOpacity,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import ChatMessageList from './ChatMessageList';
import ChatInputBar from './ChatInputBar';
import CustomText from '../CustomText';
import { chatApi } from '../../services/api';
import { getUserKey } from '../../utils/storage';
import { verticalScale, scale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { TAB_BAR } from '../../constants/layout';
import HapticService from '../../utils/HapticService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ManagerAIOverlay Component
 */
const ManagerAIOverlay = ({ 
  visible = false, 
  onClose,
  context = 'home', // 'home' | 'music' | 'point' | 'settings'
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  // ✅ Chat state
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageVersion, setMessageVersion] = useState(0); // ✅ For ChatMessageList optimization
  const [keyboardHeight, setKeyboardHeight] = useState(0); // ✅ Manual keyboard tracking
  
  // ✅ Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const inputBottomAnim = useRef(new Animated.Value(0)).current;
  
  // ✅ Context titles
  const contextTitles = {
    home: t('managerAI.context.home') || '메시지 & 페르소나 생성 도우미',
    music: t('managerAI.context.music') || '음원 생성 도우미',
    point: t('managerAI.context.point') || '포인트 & 프리미엄 안내',
    settings: t('managerAI.context.settings') || '설정 도우미',
  };
  
  // ✅ Show/Hide animations
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);
  
  // ✅ Keyboard event listeners (Safe - only when visible)
  useEffect(() => {
    if (!visible) return;
    
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates.height;
        setKeyboardHeight(height);
        Animated.timing(inputBottomAnim, {
          toValue: height,
          duration: Platform.OS === 'ios' ? 250 : 200,
          useNativeDriver: false,
        }).start();
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        Animated.timing(inputBottomAnim, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? 250 : 200,
          useNativeDriver: false,
        }).start();
      }
    );
    
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [visible, inputBottomAnim]);
  
  // ✅ Initialize with greeting message
  useEffect(() => {
    if (visible && messages.length === 0) {
      const greetingKey = `managerAI.greeting.${context}`;
      const greeting = t(greetingKey);
      
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        text: greeting,
        timestamp: new Date().toISOString(),
      }]);
      setMessageVersion(prev => prev + 1); // ✅ Increment version
    }
  }, [visible, context, messages.length, t]);
  
  // ✅ Send message handler
  const handleSend = useCallback(async (text) => {
    HapticService.medium();
    
    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessageVersion(prev => prev + 1); // ✅ Increment version
    setIsLoading(true);
    
    try {
      const userKey = await getUserKey();
      
      // ✅ Call Manager AI API (sendManagerAIMessage)
      const response = await chatApi.sendManagerAIMessage({
        user_key: userKey || 'guest',
        question: text,
        // TODO: Backend에서 context 파라미터 지원 추가 필요
        // context: context, // 'home' | 'music' | 'point' | 'settings'
      });

      console.log('response', response);
      
      if (response.success && response.data?.data) {
        // Start typing effect
        setIsTyping(true);
        setTypingMessage('');
        
        // Simulate typing
        const answer = response.data.data;
        let currentIndex = 0;
        
        const typeInterval = setInterval(() => {
          if (currentIndex < answer.length) {
            setTypingMessage(answer.substring(0, currentIndex + 1));
            currentIndex++;
          } else {
            clearInterval(typeInterval);
            
            // Add final message
            const aiMessage = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              text: answer,
              timestamp: new Date().toISOString(),
            };
            
            setMessages(prev => [...prev, aiMessage]);
            setMessageVersion(prev => prev + 1); // ✅ Increment version
            setIsTyping(false);
            setTypingMessage('');
          }
        }, 30); // Typing speed
        
      } else {
        // Error handling
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: t('errors.MANAGER_AI_ERROR'),
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setMessageVersion(prev => prev + 1); // ✅ Increment version
      }
      
    } catch (error) {
      console.error('[ManagerAIOverlay] Error:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: t('errors.MANAGER_AI_ERROR'),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setMessageVersion(prev => prev + 1); // ✅ Increment version
    } finally {
      setIsLoading(false);
    }
  }, [context, t]);
  
  // ✅ Handle close
  const handleClose = useCallback(() => {
    HapticService.light();
    Keyboard.dismiss();
    
    // Reset keyboard state
    setKeyboardHeight(0);
    inputBottomAnim.setValue(0);
    
    // Clear messages on close (fresh start next time)
    setTimeout(() => {
      setMessages([]);
      setTypingMessage('');
      setIsTyping(false);
      setMessageVersion(0); // ✅ Reset version
    }, 300);
    
    if (onClose) {
      onClose();
    }
  }, [onClose, inputBottomAnim]);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* ✅ Backdrop Blur */}
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={20}
          reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.9)"
        />
        
        {/* ✅ Dark Overlay */}
        <View style={styles.darkOverlay} />
        
        {/* ✅ Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              paddingTop: insets.top,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* ✅ Header */}
          <View style={styles.header}>
              {/* Title */}
              <View style={styles.headerLeft}>
                <CustomText type="big" bold style={styles.headerTitle}>
                  💙 SAGE AI
                </CustomText>
                <CustomText type="small" style={[styles.headerSubtitle, { display: 'none' }]}>
                  {contextTitles[context]}
                </CustomText>
              </View>
              
              {/* Close Button */}
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close-circle" size={moderateScale(32)} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            
            {/* ✅ Chat Messages */}
            <View style={styles.chatContainer}>
              <ChatMessageList
                completedMessages={messages}
                typingMessage={isTyping ? typingMessage : null}
                messageVersion={messageVersion}
                isLoading={isLoading}
              />
            </View>
          
          {/* ✅ Chat Input Bar (Animated with keyboard) */}
          <Animated.View
            style={[
              styles.inputContainer,
              {
                bottom: inputBottomAnim,
              },
            ]}
          >
            <ChatInputBar
              onSend={handleSend}
              disabled={isLoading || isTyping}
              placeholder={t('chatBottomSheet.placeholder')}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    paddingHorizontal: platformPadding(20),
    paddingVertical: platformPadding(12), // ✅ Optimized padding
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
    backgroundColor: COLORS.DEEP_BLUE_DARK,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(4),
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
  },
  closeButton: {
    padding: scale(8),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Chat
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  chatContainer: {
    flex: 1,
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(10),
    paddingBottom: verticalScale(70), // ✅ Space for input bar
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Input (Animated with keyboard)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: platformPadding(0),
    backgroundColor: 'transparent',
  },
});

export default memo(ManagerAIOverlay);

