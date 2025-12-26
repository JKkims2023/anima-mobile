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
  
  // ⭐ NEW: Chat history state
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [currentPersonaKey, setCurrentPersonaKey] = useState(null); // ⭐ Track current persona
  
  // 🆕 Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // 🆕 Vision state
  const [selectedImage, setSelectedImage] = useState(null); // Holds selected image before sending
  
  // ⭐ NEW: Load chat history when visible or persona changes
  useEffect(() => {
    const personaKey = persona?.persona_key || 'SAGE';
    
    // Load history if:
    // 1. Overlay becomes visible
    // 2. Persona changes OR persona key was reset (null)
    if (visible && user?.user_key) {
      if (currentPersonaKey !== personaKey) {
        console.log(`🔄 [Chat History] Persona changed: ${currentPersonaKey} → ${personaKey}`);
        setCurrentPersonaKey(personaKey);
        setMessages([]); // Clear previous persona's messages
        setHistoryOffset(0); // Reset offset
        setHasMoreHistory(false); // ⭐ Reset hasMore flag
        loadChatHistory();
      }
    }
  }, [visible, user?.user_key, persona?.persona_key, currentPersonaKey]);

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
  
  // ⭐ NEW: Show welcome message with typing effect
  const showWelcomeMessage = useCallback(() => {
    const greetingKey = `managerAI.greeting.${context}`;
    const greeting = t(greetingKey);
    
    console.log('👋 [Chat] Showing welcome message');
    
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
  
  // 🆕 Handle image selection
  const handleImageSelect = useCallback((imageData) => {
    console.log('📷 [ManagerAIOverlay] Image selected:', {
      type: imageData.type,
      size: imageData.fileSize,
      dimensions: `${imageData.width}x${imageData.height}`,
    });
    
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
      // 🆕 Include selected image if available
      image: selectedImage ? {
        uri: selectedImage.uri,
        type: selectedImage.type,
      } : null,
    };
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 [ManagerAIOverlay] handleSend called');
    console.log('📸 [Image Debug] selectedImage:', selectedImage);
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
        // 🆕 Include image data if available
        image: selectedImage ? {
          uri: selectedImage.uri, // ⭐ CRITICAL: Include URI for history
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
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📩 [ManagerAIOverlay] Response received:');
        console.log('   answer length:', answer.length);
        console.log('   continue_conversation:', shouldContinue);
        console.log('   rich_content:', richContent);
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
              // ⭐ NEW: Rich media content
              images: richContent.images,
              videos: richContent.videos,
              links: richContent.links,
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
  }, [t, user, persona, handleAIContinue, selectedImage]); // ⭐ FIX: Add handleAIContinue & selectedImage dependencies
  
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
              aiContinueCountRef.current = 0; // ⭐ Reset ref
              setIsLoading(false);
              setIsTyping(false);
              
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
                onLoadMore={() => loadChatHistory(true)} // ⭐ NEW: Load more history
                loadingHistory={loadingHistory} // ⭐ NEW: Loading indicator
                hasMoreHistory={hasMoreHistory} // ⭐ NEW: Has more to load
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
                onAISettings={handleToggleSettings} // 🆕 Toggle settings panel
                visionMode={settings.vision_mode} // 🆕 Vision mode setting
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
});

export default memo(ManagerAIOverlay);
