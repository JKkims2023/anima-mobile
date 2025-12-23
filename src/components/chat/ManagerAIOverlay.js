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

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  View, 
  Modal, 
  StyleSheet, 
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import ChatMessageList from './ChatMessageList';
import ChatInputBar from './ChatInputBar';
import CustomText from '../CustomText';
import { chatApi } from '../../services/api';
import { scale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useUser } from '../../contexts/UserContext';

/**
 * ManagerAIOverlay Component (Simplified)
 */
const ManagerAIOverlay = ({ 
  visible = false, 
  onClose,
  context = 'home',
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
  
  // ✅ Initialize with greeting message (Only once when visible changes)
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
      setMessageVersion(1);
    }
  }, [visible, context, t]);
  
  // ✅ Send message handler
  const handleSend = useCallback(async (text) => {
    HapticService.medium();
    
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessageVersion(prev => prev + 1);
    setIsLoading(true);
    
    try {
      const userKey = user?.user_key;
      
      // Check if user is logged in
      if (!userKey) {
        console.error('❌ [ManagerAIOverlay] No user_key found! User not logged in.');
        setIsLoading(false);
        return;
      }
      
      const response = await chatApi.sendManagerAIMessage({
        user_key: userKey,
        question: text,
      });
      
      if (response.success && response.data?.answer) {
        setIsTyping(true);
        setTypingMessage('');
        
        const answer = response.data.answer;
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
            };
            
            setMessages(prev => [...prev, aiMessage]);
            setMessageVersion(prev => prev + 1);
            setIsTyping(false);
            setTypingMessage('');
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
      console.error('[ManagerAIOverlay] Error:', error);
      
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
  }, [t]);
  
  // ✅ Handle close (Simplified)
  const handleClose = useCallback(() => {
    HapticService.light();
    Keyboard.dismiss();
    
    // Clear messages on close
    setTimeout(() => {
      setMessages([]);
      setTypingMessage('');
      setIsTyping(false);
      setMessageVersion(0);
    }, 200);
    
    if (onClose) {
      onClose();
    }
  }, [onClose]);
  
  if (!visible) return null;
  
  return (
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
              <View style={styles.headerLeft}>
                <CustomText type="big" bold style={styles.headerTitle}>
                  💙 SAGE AI
                </CustomText>
              </View>
              
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close-circle" size={moderateScale(32)} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            
            {/* ✅ Chat Messages (Scrollable) */}
            <View style={styles.chatContainer}>
              <ChatMessageList
                completedMessages={messages}
                typingMessage={isTyping ? typingMessage : null}
                messageVersion={messageVersion}
                isLoading={isLoading}
              />
            </View>
            
            {/* ✅ Chat Input Bar */}
            <View style={styles.inputContainer}>
              <ChatInputBar
                onSend={handleSend}
                disabled={isLoading || isTyping}
                placeholder={t('chatBottomSheet.placeholder')}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
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
    paddingHorizontal: platformPadding(20),
    paddingVertical: platformPadding(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
    backgroundColor: COLORS.DEEP_BLUE_DARK,
    marginTop: Platform.OS === 'ios' ? 0 : -30,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
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


  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Input
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  inputContainer: {
    paddingHorizontal: platformPadding(0),
    paddingTop: platformPadding(10),
    marginBottom: Platform.OS === 'ios' ? -10 : -50,
  },
});

export default memo(ManagerAIOverlay);
