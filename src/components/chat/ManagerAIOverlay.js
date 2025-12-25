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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import ChatMessageList from './ChatMessageList';
import ChatInputBar from './ChatInputBar';
import CustomText from '../CustomText';
import { chatApi } from '../../services/api';
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useUser } from '../../contexts/UserContext';
import { SETTING_CATEGORIES, DEFAULT_SETTINGS } from '../../constants/aiSettings';

/**
 * ManagerAIOverlay Component (Simplified)
 */
const ManagerAIOverlay = ({ 
  visible = false, 
  onClose,
  context = 'home',
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
  
  // 🆕 Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
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

  useEffect(() => {
    console.log('user: ', user);
  }, [user]);

  useEffect(() => {
    console.log('persona: ', persona);
  }, [persona]);
  
  // 🆕 Load AI settings when overlay opens
  useEffect(() => {
    if (visible && user?.user_key) {
      loadAISettings();
    }
  }, [visible, user?.user_key]);
  
  // 🆕 Load AI settings
  const loadAISettings = async () => {
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
  
  // 🆕 Toggle settings panel
  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
    HapticService.light();
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
              id: `ai-continue-${Date.now()}`,
              role: 'assistant',
              text: answer,
              timestamp: new Date().toISOString(),
            };
            
            setMessages(prev => [...prev, aiMessage]);
            setMessageVersion(prev => prev + 1);
            setIsTyping(false);
            setTypingMessage('');
            setIsLoading(false);
            
            // Check if AI wants to continue AGAIN
            if (response.data.continue_conversation) {
              console.log('🔄 [ManagerAIOverlay] AI wants to continue again...');
              
              // ⭐ Show typing animation with dots
              setIsTyping(true);
              setTypingMessage('');
              
              // Animate dots
              let dots = '';
              const dotInterval = setInterval(() => {
                dots = dots.length < 3 ? dots + '.' : '';
                setTypingMessage(dots);
              }, 300);
              
              setTimeout(() => {
                clearInterval(dotInterval);
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
      console.error('[ManagerAIOverlay] AI continue error:', error);
      setIsAIContinuing(false);
      aiContinueCountRef.current = 0; // ⭐ Reset ref
      setIsLoading(false);
    }
  }, [persona, chatApi]); // ⭐ Removed aiContinueCount from dependencies
  
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
        console.error('❌ [ManagerAIOverlay] No user_key found! User not logged in.');
        
        // Show user-friendly error message
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: '⚠️ 로그인 정보를 찾을 수 없습니다. 앱을 재시작해주세요.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setMessageVersion(prev => prev + 1);
        setIsLoading(false);
        return;
      }
      
      const response = await chatApi.sendManagerAIMessage({
        user_key: userKey,
        question: text,
        persona_key: persona?.persona_key || null, // ⭐ NEW: Include persona_key
      });
      
      if (response.success && response.data?.answer) {
        setIsTyping(true);
        setTypingMessage('');
        
        const answer = response.data.answer;
        const shouldContinue = response.data.continue_conversation || false; // ⭐ 미리 저장!
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📩 [ManagerAIOverlay] Response received:');
        console.log('   answer length:', answer.length);
        console.log('   continue_conversation:', shouldContinue);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
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
            
            // ⭐ NEW: Check if AI wants to continue talking
            console.log('🔍 [ManagerAIOverlay] Checking shouldContinue:', shouldContinue);
            if (shouldContinue) {
              console.log('🔄 [ManagerAIOverlay] AI wants to continue, calling handleAIContinue...');
              
              // ⭐ Show typing animation with dots
              setIsLoading(true);
              setIsTyping(true);
              setTypingMessage('');
              
              // Animate dots
              let dots = '';
              const dotInterval = setInterval(() => {
                dots = dots.length < 3 ? dots + '.' : '';
                setTypingMessage(dots);
              }, 300);
              
              setTimeout(() => {
                clearInterval(dotInterval);
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
  }, [t, user, persona, handleAIContinue]); // ⭐ FIX: Add handleAIContinue dependency
  
  // ✅ Handle close (Simplified)
  const handleClose = useCallback(() => {
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
              // Force stop AI conversation
              setIsAIContinuing(false);
              setAiContinueCount(0);
              setIsLoading(false);
              setIsTyping(false);
              
              // Close overlay
              HapticService.medium();
              Keyboard.dismiss();
              
              setTimeout(() => {
                setMessages([]);
                setTypingMessage('');
                setIsTyping(false);
                setMessageVersion(0);
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
  }, [onClose, isAIContinuing, isLoading, isTyping]);
  
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
                  {persona ? `🎭 ${persona.persona_name}` : '💙 SAGE AI'}
                </CustomText>
                {persona?.identity_name && (
                  <CustomText type="small" style={styles.headerSubtitle}>
                    {t('persona.identity.as', '자아')}: {persona.identity_name}
                  </CustomText>
                )}
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
            
            {/* 🆕 Settings Panel */}
            {showSettings && (
              <View style={styles.settingsPanel}>
                <View style={styles.settingsPanelHeader}>
                  <CustomText type="medium" bold style={styles.settingsPanelTitle}>
                    🎭 AI 성격 설정
                  </CustomText>
                  <TouchableOpacity
                    onPress={handleToggleSettings}
                    style={styles.settingsCloseButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="close" size={moderateScale(24)} color={COLORS.TEXT_PRIMARY} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView
                  style={styles.settingsPanelScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {loadingSettings ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                      <CustomText type="small" style={styles.loadingText}>
                        설정 불러오는 중...
                      </CustomText>
                    </View>
                  ) : (
                    <>
                      {SETTING_CATEGORIES.map((category) => (
                        <View key={category.key} style={styles.settingCategory}>
                          <CustomText type="small" bold style={styles.categoryTitle}>
                            {category.title}
                          </CustomText>
                          <View style={styles.optionsRow}>
                            {category.options.map((option) => {
                              const isSelected = settings[category.key] === option.id;
                              return (
                                <TouchableOpacity
                                  key={option.id}
                                  style={[
                                    styles.optionChip,
                                    isSelected && styles.optionChipSelected,
                                  ]}
                                  onPress={() => updateSetting(category.key, option.id)}
                                  disabled={savingSettings}
                                  activeOpacity={0.7}
                                >
                                  <CustomText style={styles.optionEmoji}>
                                    {option.emoji}
                                  </CustomText>
                                  <CustomText
                                    type="small"
                                    style={[
                                      styles.optionName,
                                      isSelected && styles.optionNameSelected,
                                    ]}
                                  >
                                    {option.name}
                                  </CustomText>
                                  {isSelected && (
                                    <CustomText style={styles.checkmark}>✓</CustomText>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      ))}
                      
                      {savingSettings && (
                        <View style={styles.savingIndicator}>
                          <ActivityIndicator size="small" color="#FFF" />
                          <CustomText type="small" style={styles.savingText}>
                            저장 중...
                          </CustomText>
                        </View>
                      )}
                    </>
                  )}
                </ScrollView>
              </View>
            )}
            
            {/* ✅ Chat Input Bar */}
            <View style={styles.inputContainer}>
              <ChatInputBar
                onSend={handleSend}
                disabled={isLoading || isTyping || isAIContinuing} // ⭐ NEW: Also disable when AI is continuing
                placeholder={t('chatBottomSheet.placeholder')}
                onAISettings={handleToggleSettings} // 🆕 Toggle settings panel
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
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: verticalScale(4),
    opacity: 0.7,
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
  // Settings Panel
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  settingsPanel: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? verticalScale(70) : verticalScale(60),
    left: 0,
    right: 0,
    backgroundColor: COLORS.DEEP_BLUE_DARK,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    maxHeight: verticalScale(400),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  settingsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(20),
    paddingVertical: platformPadding(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  settingsPanelTitle: {
    color: COLORS.TEXT_PRIMARY,
  },
  settingsCloseButton: {
    padding: scale(4),
  },
  settingsPanelScroll: {
    maxHeight: verticalScale(300),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
    gap: moderateScale(12),
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
  },
  
  // Setting Category
  settingCategory: {
    paddingHorizontal: platformPadding(20),
    paddingVertical: platformPadding(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(12),
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  
  // Option Chip
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(20),
    paddingHorizontal: platformPadding(12),
    paddingVertical: platformPadding(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: moderateScale(6),
  },
  optionChipSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  optionEmoji: {
    fontSize: moderateScale(16),
  },
  optionName: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: moderateScale(13),
  },
  optionNameSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: moderateScale(14),
    color: '#3B82F6',
  },
  
  // Saving indicator
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    gap: moderateScale(8),
  },
  savingText: {
    color: '#22C55E',
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
