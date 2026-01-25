/**
 * 🔮 TarotGameView - Tarot Fortune Telling Game (완전 재설계)
 * 
 * Features:
 * - Phase 1: 독백 버블 (PersonaThoughtBubble 스타일, 자동 순환)
 * - Phase 2: 대화 (ManagerAI 스타일, LLM 연동)
 * - Phase 3-5: 카드 선택 & 해석 (기존 애니메이션 유지)
 * - Card Area / Chat Area 분리 레이아웃
 * 
 * Privacy:
 * - 최소 정보만 저장 (요약본만)
 * - 하루 1회 제한
 * 
 * Phases:
 * 1. monologue: SAGE 독백 (10-20개 멘트 자동 순환)
 * 2. conversation: 사용자와 대화 (정보 수집, {{TAROT_READY}} 감지)
 * 3. selection: 카드 선택 (9장 그리드, 3장 선택)
 * 4. reveal: 카드 공개 (순차 플립)
 * 5. interpretation: 타로 해석 (LLM 해석 + 대화)
 * 
 * @author JK & Hero NEXUS
 * @version 2.0.0 - Complete Redesign
 * @date 2026-01-24
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ImageBackground,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  FlatList,
  TouchableWithoutFeedback,
  Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import TarotInputBar from '../chat/TarotInputBar';
import TarotCard from './TarotCard';
import HapticService from '../../utils/HapticService';
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS } from '../../styles/commonstyles';
import gameApi from '../../services/api/gameApi';

// 🎴 Data
import TAROT_CARDS from '../../data/tarotCards.json';
import TAROT_MONOLOGUES from '../../data/tarotMonologues.json';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CardWrapper - Fade out animation for unselected cards
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
const CardWrapper = ({ children, isTransitioning, isSelected }) => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    if (isTransitioning && !isSelected) {
      opacity.value = withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      });
      scale.value = withTiming(0.8, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isTransitioning, isSelected]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * TarotGameView Component
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
const TarotGameView = ({
  visible,
  onClose,
  onLimitClose,
  persona,
  user,
}) => {
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const refFirstLoad = useRef(false);
  const monologueTimerRef = useRef(null);
  const conversationStartTimeRef = useRef(null);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [gamePhase, setGamePhase] = useState('monologue');
  // 'monologue' | 'conversation' | 'selection' | 'reveal' | 'interpretation'
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 1: Monologue (독백)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [monologueMessage, setMonologueMessage] = useState('');
  const [monologueOpacity] = useState(new RNAnimated.Value(0));
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 2: Conversation (대화)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [conversationHistory, setConversationHistory] = useState([]);
  const [conversationSummary, setConversationSummary] = useState('');
  const [conversationTurns, setConversationTurns] = useState(0);
  const [isWaitingForSage, setIsWaitingForSage] = useState(false);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 3-5: Cards
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [revealedCards, setRevealedCards] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 5: Interpretation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [interpretation, setInterpretation] = useState(null);
  const [isLoadingInterpretation, setIsLoadingInterpretation] = useState(false);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UI State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const keyboardHeight = useRef(new RNAnimated.Value(0)).current;
  const scrollViewRef = useRef(null);
  
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Card Area Visible (Phase 3, 4, 5)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const cardAreaVisible = gamePhase === 'selection' || gamePhase === 'reveal' || gamePhase === 'interpretation';
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Initialize on mount
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (visible) {
      console.log('🔮 [TarotGameView] Component mounted');
      console.log('   Persona:', persona?.persona_name);
      console.log('   User:', user?.user_key);
      HapticService.medium();
      refFirstLoad.current = true;
      conversationStartTimeRef.current = Date.now();
      
      // Start monologue
      setGamePhase('monologue');
      startMonologue();
    }
    
    return () => {
      if (visible) {
        console.log('🔮 [TarotGameView] Component unmounting');
        stopMonologue();
      }
      refFirstLoad.current = false;
    };
  }, [visible]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Keyboard listeners
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardShowListener = Keyboard.addListener(showEvent, (e) => {
      const keyboardTop = e.endCoordinates.height;
      refFirstLoad.current = false;
      RNAnimated.timing(keyboardHeight, {
        toValue: Platform.OS === 'ios' ? keyboardTop - scale(35) : scale(-50),
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
    
    const keyboardHideListener = Keyboard.addListener(hideEvent, (e) => {
      RNAnimated.timing(keyboardHeight, {
        toValue: Platform.OS === 'ios' ? 0 : scale(-50),
        duration: Platform.OS === 'ios' ? 0 : 250,
        useNativeDriver: false,
      }).start();
    });
    
    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [keyboardHeight]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 1: Monologue System
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const startMonologue = useCallback(() => {
    console.log('💭 [Tarot] Starting monologue...');
    
    let currentIndex = 0;
    const totalMessages = TAROT_MONOLOGUES.length;
    
    // Show first message
    setMonologueMessage(TAROT_MONOLOGUES[0]);
    RNAnimated.timing(monologueOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    // Timer: 4초마다 메시지 변경
    monologueTimerRef.current = setInterval(() => {
      // Fade out
      RNAnimated.timing(monologueOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change message
        currentIndex = (currentIndex + 1) % totalMessages;
        setMonologueMessage(TAROT_MONOLOGUES[currentIndex]);
        
        // Fade in
        RNAnimated.timing(monologueOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 4000); // 4초 간격
  }, [monologueOpacity]);
  
  const stopMonologue = useCallback(() => {
    console.log('💭 [Tarot] Stopping monologue...');
    if (monologueTimerRef.current) {
      clearInterval(monologueTimerRef.current);
      monologueTimerRef.current = null;
    }
    
    // Fade out
    RNAnimated.timing(monologueOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [monologueOpacity]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 2: Conversation System
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleSend = useCallback(async (message) => {
    if (!message.trim()) return;
    
    console.log('💬 [Tarot] User message:', message);
    Keyboard.dismiss();
    
    // Phase 1 → 2 전환 (첫 입력)
    if (gamePhase === 'monologue') {
      stopMonologue();
      setGamePhase('conversation');
      
      // 첫 메시지: SAGE 인사
      const sageGreeting = {
        role: 'assistant',
        content: '안녕! 나는 SAGE야. 타로 카드를 통해 너의 미래를 볼 수 있어. 무엇이 궁금한지 편하게 말해줘 🔮',
      };
      setConversationHistory([sageGreeting]);
    }
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
    };
    setConversationHistory(prev => [...prev, userMessage]);
    setConversationTurns(prev => prev + 1);
    
    // Wait for SAGE
    setIsWaitingForSage(true);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Call API
      const response = await gameApi.sendTarotChat({
        user_key: user?.user_key,
        persona_key: persona?.persona_key || '573db390-a505-4c9e-809f-cc511c235cbb', // SAGE
        conversation_history: [...conversationHistory, userMessage],
        user_message: message,
      });
      
      console.log('✅ [Tarot] SAGE response:', response.sage_response);
      console.log('   Is ready:', response.is_ready);
      
      // Add SAGE response
      const sageMessage = {
        role: 'assistant',
        content: response.sage_response,
      };
      setConversationHistory(prev => [...prev, sageMessage]);
      
      // Check if ready
      if (response.is_ready) {
        console.log('🎴 [Tarot] Ready for card selection!');
        setConversationSummary(response.conversation_summary || message);
        
        // Wait 2s, then show cards
        setTimeout(() => {
          initializeCards();
          setGamePhase('selection');
        }, 2000);
      }
      
      setIsWaitingForSage(false);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('❌ [Tarot] sendTarotChat error:', error);
      setIsWaitingForSage(false);
      
      // Fallback response
      const fallbackMessage = {
        role: 'assistant',
        content: '음... 잠시 카드들이 조용하네. 다시 한번 말해줄래?',
      };
      setConversationHistory(prev => [...prev, fallbackMessage]);
    }
  }, [gamePhase, user, persona, conversationHistory, stopMonologue]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 3: Card Selection
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const initializeCards = useCallback(() => {
    console.log('🎴 [Tarot] Initializing cards...');
    
    // Shuffle and select 9 cards
    const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 9);
    setAvailableCards(selected);
    setSelectedCards([]);
    setRevealedCards([]);
    
    console.log('🎴 [Tarot] 9 cards initialized');
  }, []);
  
  const handleCardSelect = useCallback((card) => {
    console.log('🎴 [Tarot] Card selected:', card.name_ko);
    HapticService.light();
    
    setSelectedCards(prev => {
      if (prev.some(c => c.id === card.id)) {
        // Deselect
        console.log('   → Deselecting');
        return prev.filter(c => c.id !== card.id);
      }
      
      if (prev.length >= 3) {
        // Max 3
        console.log('   → Already 3 cards!');
        HapticService.error();
        return prev;
      }
      
      // Add
      console.log('   → Adding');
      return [...prev, card];
    });
  }, []);
  
  const handleConfirmSelection = useCallback(() => {
    if (selectedCards.length !== 3) return;
    
    console.log('✨ [Tarot] Confirming selection:', selectedCards.map(c => c.name_ko));
    HapticService.medium();
    
    // Start transition
    setIsTransitioning(true);
    
    // Phase 3 → 4
    setTimeout(() => {
      setGamePhase('reveal');
      setIsTransitioning(false);
    }, 800);
  }, [selectedCards]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 4: Card Reveal (Sequential Flip)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (gamePhase === 'reveal' && selectedCards.length === 3) {
      console.log('🔮 [Tarot] Starting card reveal...');
      
      const flipCard = (index) => {
        setTimeout(() => {
          setRevealedCards(prev => [...prev, selectedCards[index].id]);
          HapticService.light();
          
          // Last card flipped → Generate interpretation
          if (index === 2) {
            setTimeout(() => {
              console.log('🔮 [Tarot] All cards revealed! Generating interpretation...');
              setGamePhase('interpretation');
              generateInterpretation();
            }, 1000);
          }
        }, index * 800);
      };
      
      flipCard(0);
      flipCard(1);
      flipCard(2);
    }
  }, [gamePhase, selectedCards]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 5: Interpretation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const generateInterpretation = useCallback(async () => {
    console.log('🔮 [Tarot] Generating interpretation...');
    setIsLoadingInterpretation(true);
    
    try {
      const response = await gameApi.interpretTarotCards({
        user_key: user?.user_key,
        persona_key: persona?.persona_key || '573db390-a505-4c9e-809f-cc511c235cbb',
        selected_cards: selectedCards,
        conversation_summary: conversationSummary,
        user_question: conversationHistory.find(m => m.role === 'user')?.content || '',
      });
      
      console.log('✅ [Tarot] Interpretation received');
      setInterpretation(response.interpretation);
      setIsLoadingInterpretation(false);
      
      // Save reading
      const duration = Math.floor((Date.now() - conversationStartTimeRef.current) / 1000);
      await gameApi.saveTarotReading({
        user_key: user?.user_key,
        persona_key: persona?.persona_key || '573db390-a505-4c9e-809f-cc511c235cbb',
        selected_cards: selectedCards.map(c => ({ id: c.id, name_ko: c.name_ko, name_en: c.name_en })),
        conversation_summary: conversationSummary,
        interpretation_summary: response.interpretation.summary,
        conversation_turns: conversationTurns,
        duration_seconds: duration,
      });
      
      console.log('💾 [Tarot] Reading saved');
      
    } catch (error) {
      console.error('❌ [Tarot] generateInterpretation error:', error);
      setIsLoadingInterpretation(false);
      
      // Fallback
      setInterpretation({
        overall: '카드들이 복잡한 이야기를 하고 있어. 조금 더 시간이 필요해.',
        card_meanings: selectedCards.map((card, i) => ({
          card_name: card.name_ko,
          position: i === 0 ? '과거/원인' : i === 1 ? '현재/상황' : '미래/결과',
          meaning: card.meaning_up || '중요한 의미를 담고 있어.',
        })),
        advice: '지금은 내면의 목소리에 집중해봐.',
        summary: '카드가 전하는 메시지를 천천히 받아들여봐',
      });
    }
  }, [user, persona, selectedCards, conversationSummary, conversationHistory, conversationTurns]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle Close
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleClose = useCallback(() => {
    console.log('🔮 [Tarot] Closing...');
    HapticService.light();
    
    // Stop monologue
    stopMonologue();
    
    // Reset state
    setGamePhase('monologue');
    setMonologueMessage('');
    setConversationHistory([]);
    setConversationSummary('');
    setConversationTurns(0);
    setAvailableCards([]);
    setSelectedCards([]);
    setRevealedCards([]);
    setInterpretation(null);
    
    onClose();
  }, [onClose, stopMonologue]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Background
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const hasVideo = persona?.selected_dress_video_url && 
                   persona?.selected_dress_video_convert_done === 'Y';
  const backgroundImageUrl = persona?.selected_dress_image_url || 
                             persona?.persona_image_url || 
                             persona?.original_url;
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Background */}
        {hasVideo ? (
          <Video
            source={{ uri: persona?.selected_dress_video_url }}
            style={styles.background}
            resizeMode="contain"
            repeat={true}
            muted={true}
            playInBackground={false}
            playWhenInactive={false}
            onError={(error) => console.error('🔮 [Tarot] Video error:', error)}
          />
        ) : (
          <ImageBackground
            source={{ uri: backgroundImageUrl }}
            style={styles.background}
            resizeMode="contain"
          />
        )}
        
        {/* Content */}
        <View style={styles.contentWrapper}>
          <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                <Icon name="chevron-back" size={moderateScale(28)} color="#FFF" />
              </TouchableOpacity>
              
              <View style={styles.headerCenter}>
                <CustomText type="title" bold style={styles.headerTitle}>
                  🔮 {persona?.persona_name || 'SAGE'}
                </CustomText>
              </View>
              
              <TouchableOpacity style={styles.helpButton} onPress={() => HapticService.light()}>
                <Icon name="help-circle-outline" size={moderateScale(28)} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            {/* Card Area (조건부 표시) */}
            {cardAreaVisible && (
              <View style={[
                styles.cardArea,
                gamePhase === 'interpretation' && styles.cardAreaCompact,
              ]}>
                {/* Phase 3: Selection */}
                {gamePhase === 'selection' && (
                  <View style={styles.cardSelectionContainer}>
                    <FlatList
                      data={availableCards}
                      keyExtractor={(item) => item.id.toString()}
                      numColumns={3}
                      scrollEnabled={false}
                      contentContainerStyle={styles.cardGrid}
                      renderItem={({ item, index }) => {
                        const isCardSelected = selectedCards.some(c => c.id === item.id);
                        return (
                          <CardWrapper
                            key={item.id}
                            isTransitioning={isTransitioning}
                            isSelected={isCardSelected}
                          >
                            <TarotCard
                              card={item}
                              isFront={false}
                              isSelected={isCardSelected}
                              onPress={() => handleCardSelect(item)}
                              disabled={isTransitioning}
                              delay={index * 150}
                            />
                          </CardWrapper>
                        );
                      }}
                    />
                    
                    {/* Confirm Button */}
                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        { display: selectedCards.length === 3 ? 'flex' : 'none' }
                      ]}
                      onPress={handleConfirmSelection}
                      disabled={selectedCards.length !== 3}
                      activeOpacity={0.8}
                    >
                      <CustomText type="middle" bold style={styles.confirmButtonText}>
                        ✨ 운명 확인하기 ✨
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Phase 4: Reveal */}
                {gamePhase === 'reveal' && (
                  <View style={styles.revealContainer}>
                    <View style={styles.revealTitleContainer}>
                      <CustomText type="title" bold style={styles.revealTitle}>
                        🔮 운명의 카드 🔮
                      </CustomText>
                    </View>
                    
                    <View style={styles.revealCardsContainer}>
                      {selectedCards.map((card, index) => (
                        <View key={card.id} style={styles.revealCardWrapper}>
                          <TarotCard
                            card={card}
                            isFront={revealedCards.includes(card.id)}
                            isSelected={false}
                            disabled={true}
                          />
                          <CustomText style={styles.cardPositionLabel}>
                            {index === 0 ? '과거' : index === 1 ? '현재' : '미래'}
                          </CustomText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Phase 5: Interpretation (Small cards) */}
                {gamePhase === 'interpretation' && (
                  <View style={styles.interpretationCardsContainer}>
                    {selectedCards.map((card, index) => (
                      <View key={card.id} style={styles.interpretationCardWrapper}>
                        <TarotCard
                          card={card}
                          isFront={true}
                          isSelected={false}
                          disabled={true}
                        />
                        <CustomText style={styles.cardPositionLabelSmall}>
                          {index === 0 ? '과거' : index === 1 ? '현재' : '미래'}
                        </CustomText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
            
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              {/* Chat Area (항상 표시, 크기 동적) */}
              <View style={[
                styles.chatArea,
                cardAreaVisible && styles.chatAreaCompact,
              ]}>
                {/* Phase 1: Monologue */}
                {gamePhase === 'monologue' && (
                  <View style={styles.monologueContainer}>
                    <RNAnimated.View style={[styles.monologueBubble, { opacity: monologueOpacity }]}>
                      <View style={styles.bubbleWrapper}>
                        <View style={styles.mainBubble}>
                          <CustomText type="small" style={styles.bubbleText}>
                            {monologueMessage}
                          </CustomText>
                        </View>
                        
                        {/* Tail bubbles */}
                        <View style={[styles.tailBubble, styles.tail1]} />
                        <View style={[styles.tailBubble, styles.tail2]} />
                      </View>
                    </RNAnimated.View>
                  </View>
                )}
                
                {/* Phase 2: Conversation */}
                {(gamePhase === 'conversation' || gamePhase === 'selection' || gamePhase === 'reveal') && (
                  <ScrollView
                    ref={scrollViewRef}
                    style={styles.conversationContainer}
                    contentContainerStyle={styles.conversationContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {conversationHistory.map((msg, index) => (
                      <View
                        key={index}
                        style={[
                          styles.messageBubble,
                          msg.role === 'user' ? styles.userMessageBubble : styles.sageMessageBubble
                        ]}
                      >
                        <CustomText style={styles.messageText}>
                          {msg.content}
                        </CustomText>
                      </View>
                    ))}
                    
                    {isWaitingForSage && (
                      <View style={[styles.messageBubble, styles.sageMessageBubble]}>
                        <CustomText style={styles.messageText}>
                          ...
                        </CustomText>
                      </View>
                    )}
                  </ScrollView>
                )}
                
                {/* Phase 5: Interpretation */}
                {gamePhase === 'interpretation' && (
                  <ScrollView
                    style={styles.interpretationContainer}
                    contentContainerStyle={styles.interpretationContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {isLoadingInterpretation && (
                      <View style={styles.loadingContainer}>
                        <CustomText style={styles.loadingText}>
                          🔮 {persona?.persona_name || 'SAGE'}가 카드를 해석하고 있어요...
                        </CustomText>
                      </View>
                    )}
                    
                    {interpretation && (
                      <View style={styles.interpretationMessage}>
                        {/* Overall */}
                        <View style={styles.interpretationSection}>
                          <CustomText type="middle" bold style={styles.sectionTitle}>
                            🔮 전체 해석
                          </CustomText>
                          <CustomText style={styles.sectionText}>
                            {interpretation.overall}
                          </CustomText>
                        </View>
                        
                        {/* Card Meanings */}
                        {interpretation.card_meanings?.map((cardMeaning, index) => (
                          <View key={index} style={styles.interpretationSection}>
                            <CustomText type="middle" bold style={styles.sectionTitle}>
                              🎴 {cardMeaning.card_name} ({cardMeaning.position})
                            </CustomText>
                            <CustomText style={styles.sectionText}>
                              {cardMeaning.meaning}
                            </CustomText>
                          </View>
                        ))}
                        
                        {/* Advice */}
                        <View style={styles.interpretationSection}>
                          <CustomText type="middle" bold style={styles.sectionTitle}>
                            💙 {persona?.persona_name || 'SAGE'}의 조언
                          </CustomText>
                          <CustomText style={styles.sectionText}>
                            {interpretation.advice}
                          </CustomText>
                        </View>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
            
            {/* Input Bar */}
            <RNAnimated.View 
              style={[
                styles.inputContainer,
                { marginBottom: refFirstLoad.current ? (Platform.OS === 'ios' ? 0 : -50) : keyboardHeight }
              ]}
            >
              <TarotInputBar
                onSend={handleSend}
                disabled={isWaitingForSage || isLoadingInterpretation || gamePhase === 'reveal'}
                placeholder={
                  gamePhase === 'monologue'
                    ? "무엇이 궁금한가요?"
                    : gamePhase === 'conversation'
                    ? "SAGE와 대화하세요..."
                    : gamePhase === 'selection'
                    ? "질문을 입력하세요..."
                    : "타로 결과에 대해 이야기해봐요"
                }
                persona={persona}
                currentEmotion="curious"
                onImageSelect={null}
                onSettingsPress={null}
                onCreateMusic={null}
                onCreateMessage={null}
                visionMode={false}
                hasSelectedImage={false}
              />
            </RNAnimated.View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  background: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  
  contentWrapper: {
    flex: 1,
  },
  
  content: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  
  backButton: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  
  headerTitle: {
    color: '#FFF',
    fontSize: moderateScale(20),
  },
  
  helpButton: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Card Area
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  cardArea: {
    height: SCREEN_HEIGHT * 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  
  cardAreaCompact: {
    height: SCREEN_HEIGHT * 0.25,
  },
  
  cardSelectionContainer: {
    flex: 1,
    paddingVertical: verticalScale(20),
  },
  
  cardGrid: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(10),
  },
  
  cardWrapper: {
    width: '33.333%',
    padding: scale(5),
    alignItems: 'center',
  },
  
  confirmButton: {
    position: 'absolute',
    bottom: verticalScale(20),
    left: scale(40),
    right: scale(40),
    backgroundColor: 'rgba(123, 31, 162, 0.9)',
    paddingVertical: verticalScale(16),
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.6)',
  },
  
  confirmButtonText: {
    color: '#FFF',
    fontSize: moderateScale(16),
  },
  
  revealContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  revealTitleContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  
  revealTitle: {
    color: '#FFF',
    fontSize: moderateScale(22),
  },
  
  revealCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(15),
  },
  
  revealCardWrapper: {
    alignItems: 'center',
  },
  
  cardPositionLabel: {
    color: '#FFF',
    fontSize: moderateScale(14),
    marginTop: verticalScale(10),
  },
  
  interpretationCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(10),
    paddingVertical: verticalScale(10),
  },
  
  interpretationCardWrapper: {
    alignItems: 'center',
    transform: [{ scale: 0.6 }],
  },
  
  cardPositionLabelSmall: {
    color: '#FFF',
    fontSize: moderateScale(12),
    marginTop: verticalScale(5),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Chat Area
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  chatArea: {
    flex: 1,
  },
  
  chatAreaCompact: {
    flex: 0.5,
  },
  
  // Monologue
  monologueContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  monologueBubble: {
    position: 'absolute',
    top: verticalScale(100),
    left: scale(40),
  },
  
  bubbleWrapper: {
    position: 'relative',
  },
  
  mainBubble: {
    width: scale(120),
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: scale(20),
    paddingHorizontal: scale(15),
    paddingVertical: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  bubbleText: {
    color: '#FFF',
    fontSize: scale(14),
    lineHeight: scale(20),
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  tailBubble: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: scale(50),
  },
  
  tail1: {
    width: scale(10),
    height: scale(10),
    bottom: verticalScale(-8),
    left: scale(12),
  },
  
  tail2: {
    width: scale(7),
    height: scale(7),
    bottom: verticalScale(-14),
    left: scale(6),
  },
  
  // Conversation
  conversationContainer: {
    flex: 1,
  },
  
  conversationContent: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(20),
    gap: verticalScale(12),
  },
  
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderRadius: scale(20),
    marginBottom: verticalScale(8),
  },
  
  userMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(66, 133, 244, 0.85)',
    borderTopRightRadius: scale(4),
  },
  
  sageMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(123, 31, 162, 0.85)',
    borderTopLeftRadius: scale(4),
  },
  
  messageText: {
    color: '#FFF',
    fontSize: moderateScale(15),
    lineHeight: moderateScale(22),
  },
  
  // Interpretation
  interpretationContainer: {
    flex: 1,
  },
  
  interpretationContent: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(20),
  },
  
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  
  loadingText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
  
  interpretationMessage: {
    gap: verticalScale(20),
  },
  
  interpretationSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: scale(16),
    borderRadius: scale(12),
    gap: verticalScale(10),
  },
  
  sectionTitle: {
    color: '#FFD700',
    fontSize: moderateScale(16),
  },
  
  sectionText: {
    color: '#FFF',
    fontSize: moderateScale(15),
    lineHeight: moderateScale(22),
  },
  
  // Input Bar
  inputContainer: {
    backgroundColor: 'transparent',
  },
});

export default TarotGameView;
