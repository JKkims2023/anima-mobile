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
  KeyboardAvoidingView,
  ScrollView,
  FlatList,
  Keyboard,
  Animated as RNAnimated,
  Image, // ✅ For SAGE avatar
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
import { scale, moderateScale, verticalScale, platformPadding, platformLineHeight } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS } from '../../styles/commonstyles';
import gameApi from '../../services/api/gameApi';
import { useTranslation } from 'react-i18next';

// 🎴 Data
import TAROT_CARDS from '../../data/tarotCards.json';
import TAROT_MONOLOGUES from '../../data/tarotMonologues.json';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 TypingIndicator - Animated Dots (신비로운 ... 효과)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TypingIndicator = () => {
  const dot1Opacity = useRef(new RNAnimated.Value(0.3)).current;
  const dot2Opacity = useRef(new RNAnimated.Value(0.3)).current;
  const dot3Opacity = useRef(new RNAnimated.Value(0.3)).current;
  
  useEffect(() => {
    const duration = 600; // 느리고 우아하게
    const delay = 200;
    
    const animate = () => {
      RNAnimated.sequence([
        RNAnimated.parallel([
          RNAnimated.timing(dot1Opacity, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          RNAnimated.timing(dot2Opacity, {
            toValue: 0.3,
            duration,
            useNativeDriver: true,
          }),
          RNAnimated.timing(dot3Opacity, {
            toValue: 0.3,
            duration,
            useNativeDriver: true,
          }),
        ]),
        RNAnimated.parallel([
          RNAnimated.timing(dot1Opacity, {
            toValue: 0.3,
            duration,
            useNativeDriver: true,
          }),
          RNAnimated.timing(dot2Opacity, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          RNAnimated.timing(dot3Opacity, {
            toValue: 0.3,
            duration,
            useNativeDriver: true,
          }),
        ]),
        RNAnimated.parallel([
          RNAnimated.timing(dot1Opacity, {
            toValue: 0.3,
            duration,
            useNativeDriver: true,
          }),
          RNAnimated.timing(dot2Opacity, {
            toValue: 0.3,
            duration,
            useNativeDriver: true,
          }),
          RNAnimated.timing(dot3Opacity, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate()); // Loop infinitely
    };
    
    animate();
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);
  
  return (
    <View style={styles.typingIndicatorContainer}>
      <RNAnimated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
      <RNAnimated.View style={[styles.typingDot, { opacity: dot2Opacity }]} />
      <RNAnimated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
    </View>
  );
};

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
  const monologueTimerRef = useRef(null);
  const conversationStartTimeRef = useRef(null);
  const { t } = useTranslation();
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
  const [isTarotReady, setIsTarotReady] = useState(false); // 🔮 TAROT_READY 상태
  
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
  const [interpretationMessages, setInterpretationMessages] = useState([]); // 🔮 순차 표시용
  const [activeCardIndex, setActiveCardIndex] = useState(-1); // 🔮 현재 활성 카드 (glow 효과)
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null); // 🔮 Overlay용 선택된 카드
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UI State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const scrollViewRef = useRef(null);
  const interpretationScrollViewRef = useRef(null); // ✅ NEW: Interpretation ScrollView ref
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // 🎨 NEW: Message animation tracking
  const messageAnimations = useRef({}).current; // { [index]: Animated.Value }
  
  // 🎨 NEW: Interpretation fade-in animation
  const interpretationOpacity = useRef(new RNAnimated.Value(0)).current;
  const interpretationScale = useRef(new RNAnimated.Value(0.95)).current;
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 Entrance Animations (신비로운 순차 진입 애니메이션)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const backgroundOpacity = useSharedValue(0);
  const backButtonOpacity = useSharedValue(0);
  const backButtonTranslateX = useSharedValue(-20);
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.9);
  const helpButtonOpacity = useSharedValue(0);
  const helpButtonTranslateX = useSharedValue(20);
  const monologueBubbleOpacity = useSharedValue(0);
  const monologueBubbleTranslateY = useSharedValue(-30);
  const inputBarOpacity = useSharedValue(0);
  const inputBarTranslateY = useSharedValue(50);
  
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
      conversationStartTimeRef.current = Date.now();
      
      // Start monologue
      setGamePhase('monologue');
      startMonologue();
      
      // 🎨 순차적 진입 애니메이션 트리거
      // 1. Background (0ms) - 부드러운 페이드 인
      backgroundOpacity.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
      
      // 2. Header 요소들 (200-400ms) - 순차 페이드 + 슬라이드
      // Back Button (200ms)
      backButtonOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
      );
      backButtonTranslateX.value = withDelay(
        200,
        withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
      );
      
      // Title (300ms) - 약간의 스케일 효과
      titleOpacity.value = withDelay(
        300,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
      );
      titleScale.value = withDelay(
        300,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) })
      );
      
      // Help Button (400ms)
      helpButtonOpacity.value = withDelay(
        400,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
      );
      helpButtonTranslateX.value = withDelay(
        400,
        withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
      );
      
      // 3. Monologue Bubble (600ms) - 페이드 + 위→아래 슬라이드
      monologueBubbleOpacity.value = withDelay(
        600,
        withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) })
      );
      monologueBubbleTranslateY.value = withDelay(
        600,
        withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
      );
      
      // 4. Input Bar (800ms) - 페이드 + 아래→위 슬라이드
      inputBarOpacity.value = withDelay(
        800,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
      );
      inputBarTranslateY.value = withDelay(
        800,
        withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
      );
    } else {
      // 종료 시 애니메이션 리셋 (빠르게)
      backgroundOpacity.value = withTiming(0, { duration: 200 });
      backButtonOpacity.value = 0;
      backButtonTranslateX.value = -20;
      titleOpacity.value = 0;
      titleScale.value = 0.9;
      helpButtonOpacity.value = 0;
      helpButtonTranslateX.value = 20;
      monologueBubbleOpacity.value = 0;
      monologueBubbleTranslateY.value = -30;
      inputBarOpacity.value = 0;
      inputBarTranslateY.value = 50;
    }
    
    return () => {
      if (visible) {
        console.log('🔮 [TarotGameView] Component unmounting');
        stopMonologue();
      }
    };
  }, [visible, startMonologue, stopMonologue, backgroundOpacity, backButtonOpacity, backButtonTranslateX, titleOpacity, titleScale, helpButtonOpacity, helpButtonTranslateX, monologueBubbleOpacity, monologueBubbleTranslateY, inputBarOpacity, inputBarTranslateY]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 Animate new messages (신비로운 Fade-in)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    conversationHistory.forEach((msg, index) => {
      // Only animate SAGE messages (not user messages)
      if (msg.role === 'assistant' && !messageAnimations[index]) {
        // Create new animation for this message
        const opacity = new RNAnimated.Value(0);
        const scale = new RNAnimated.Value(0.95);
        messageAnimations[index] = { opacity, scale };
        
        // Trigger animation (느리고 신비롭게)
        RNAnimated.parallel([
          RNAnimated.timing(opacity, {
            toValue: 1,
            duration: 800, // 느리게
            useNativeDriver: true,
          }),
          RNAnimated.timing(scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }, [conversationHistory, messageAnimations]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 Animate interpretation (신비로운 Fade-in)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (interpretation) {
      // Reset and animate
      interpretationOpacity.setValue(0);
      interpretationScale.setValue(0.95);
      
      RNAnimated.parallel([
        RNAnimated.timing(interpretationOpacity, {
          toValue: 1,
          duration: 1000, // 더 느리게 (1초)
          useNativeDriver: true,
        }),
        RNAnimated.timing(interpretationScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [interpretation, interpretationOpacity, interpretationScale]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Android Keyboard Handling (Modal + statusBarTranslucent 이슈)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    
    const showListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);
  
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
      
      /*
      // 첫 메시지: SAGE 인사
      const sageGreeting = {
        role: 'assistant',
        content: '안녕! 나는 SAGE야. 타로 카드를 통해 너의 미래를 볼 수 있어. 무엇이 궁금한지 편하게 말해줘 🔮',
      };
      setConversationHistory([sageGreeting]);
      */
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
      
      // Add SAGE response (🔮 Remove {{TAROT_READY}} marker)
      const sageMessage = {
        role: 'assistant',
        content: response.sage_response.replace(/\{\{TAROT_READY\}\}/g, '').trim(),
      };
      setConversationHistory(prev => [...prev, sageMessage]);
      
      // Check if ready
      if (response.is_ready) {
        console.log('🎴 [Tarot] Ready for card selection!');
        setConversationSummary(response.conversation_summary || message); // ✅ 서버: conversation_summary
        setIsTarotReady(true); // 🔮 활성화: 버튼 반짝이기 시작!
        
        // ⚠️ 자동 진행 제거! 사용자가 버튼 클릭할 때까지 대기
        // (버튼 클릭 핸들러에서 처리)
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
  // 🔮 Tarot Ready Button Handler
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleTarotReadyPress = useCallback(() => {
    console.log('🔮 [Tarot] Tarot button pressed!');
    HapticService.medium();
    
    // 1. 채팅 UI만 초기화 (Summary와 Turns는 유지 - 서버로 전달 필요)
    console.log('🔮 [Tarot] Clearing conversation UI...');
    setConversationHistory([]); // ✅ UI만 초기화
    // ⚠️ conversationSummary는 유지! (서버로 전달 필요)
    // ⚠️ conversationTurns는 유지! (서버로 전달 필요)
    setIsTarotReady(false);
    
    // 2. 카드 초기화 및 표시
    initializeCards();
    setGamePhase('selection');
  }, [initializeCards]);
  
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
  
  // 🔮 순차적 해석 표시 (2초 ... 효과 포함)
  useEffect(() => {
    if (!interpretation || gamePhase !== 'interpretation') return;
    
    console.log('🔮 [Tarot] Starting sequential interpretation display...');
    setInterpretationMessages([]);
    setActiveCardIndex(-1);
    setIsLoadingInterpretation(false); // ✅ 초기화
    
    const delays = [];
    let currentDelay = 500; // 첫 메시지 딜레이
    
    // ═══════════════════════════════════════════════════════════════════
    // 1. 첫 번째 카드 해석
    // ═══════════════════════════════════════════════════════════════════
    // 1-1) Show loading (... 효과)
    delays.push(setTimeout(() => {
      setIsLoadingInterpretation(true);
    }, currentDelay));
    currentDelay += 2000; // ✅ 2초 대기
    
    // 1-2) Show message
    delays.push(setTimeout(() => {
      setIsLoadingInterpretation(false);
      if (interpretation.card_meanings[0]) {
        setActiveCardIndex(0);
        setInterpretationMessages(prev => [...prev, {
          type: 'card',
          cardIndex: 0,
          content: `🎴 ${interpretation.card_meanings[0].card_name} (${interpretation.card_meanings[0].position})\n\n${interpretation.card_meanings[0].meaning}`,
        }]);
        HapticService.light();
      }
    }, currentDelay));
    currentDelay += 1000; // 다음 로딩까지 간격
    
    // ═══════════════════════════════════════════════════════════════════
    // 2. 두 번째 카드 해석
    // ═══════════════════════════════════════════════════════════════════
    // 2-1) Show loading
    delays.push(setTimeout(() => {
      setIsLoadingInterpretation(true);
    }, currentDelay));
    currentDelay += 2000; // ✅ 2초 대기
    
    // 2-2) Show message
    delays.push(setTimeout(() => {
      setIsLoadingInterpretation(false);
      if (interpretation.card_meanings[1]) {
        setActiveCardIndex(1);
        setInterpretationMessages(prev => [...prev, {
          type: 'card',
          cardIndex: 1,
          content: `🎴 ${interpretation.card_meanings[1].card_name} (${interpretation.card_meanings[1].position})\n\n${interpretation.card_meanings[1].meaning}`,
        }]);
        HapticService.light();
      }
    }, currentDelay));
    currentDelay += 1000;
    
    // ═══════════════════════════════════════════════════════════════════
    // 3. 세 번째 카드 해석
    // ═══════════════════════════════════════════════════════════════════
    // 3-1) Show loading
    delays.push(setTimeout(() => {
      setIsLoadingInterpretation(true);
    }, currentDelay));
    currentDelay += 2000; // ✅ 2초 대기
    
    // 3-2) Show message
    delays.push(setTimeout(() => {
      setIsLoadingInterpretation(false);
      if (interpretation.card_meanings[2]) {
        setActiveCardIndex(2);
        setInterpretationMessages(prev => [...prev, {
          type: 'card',
          cardIndex: 2,
          content: `🎴 ${interpretation.card_meanings[2].card_name} (${interpretation.card_meanings[2].position})\n\n${interpretation.card_meanings[2].meaning}`,
        }]);
        HapticService.light();
      }
    }, currentDelay));
    currentDelay += 1000;
    
    // ═══════════════════════════════════════════════════════════════════
    // 4. 전체 해석
    // ═══════════════════════════════════════════════════════════════════
    // 4-1) Show loading
    delays.push(setTimeout(() => {
      setIsLoadingInterpretation(true);
    }, currentDelay));
    currentDelay += 2000; // ✅ 2초 대기
    
    // 4-2) Show message
    delays.push(setTimeout(() => {
      setIsLoadingInterpretation(false);
      setActiveCardIndex(-1);
      setInterpretationMessages(prev => [...prev, {
        type: 'overall',
        content: `🔮 전체 해석\n\n${interpretation.overall}`,
      }]);
      HapticService.light();
    }, currentDelay));
    currentDelay += 1000;
    
    // ═══════════════════════════════════════════════════════════════════
    // 5. 페르소나 조언
    // ═══════════════════════════════════════════════════════════════════
    // 5-1) Show loading
    delays.push(setTimeout(() => {
      setIsLoadingInterpretation(true);
    }, currentDelay));
    currentDelay += 2000; // ✅ 2초 대기
    
    // 5-2) Show message
    delays.push(setTimeout(() => {
      setIsLoadingInterpretation(false);
      setInterpretationMessages(prev => [...prev, {
        type: 'advice',
        content: `💙 ${persona?.persona_name || 'SAGE'}의 조언\n\n${interpretation.advice}`,
      }]);
      HapticService.medium();
    }, currentDelay));
    
    // Cleanup
    return () => {
      delays.forEach(timeout => clearTimeout(timeout));
    };
  }, [interpretation, gamePhase, persona]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ Auto-scroll to bottom when interpretation messages update
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (interpretationMessages.length > 0 && interpretationScrollViewRef.current) {
      // Delay scroll slightly to ensure content is rendered
      setTimeout(() => {
        interpretationScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [interpretationMessages]);
  
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
  // 🎨 Animated Styles (신비로운 진입 효과)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));
  
  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backButtonOpacity.value,
    transform: [{ translateX: backButtonTranslateX.value }],
  }));
  
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));
  
  const helpButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: helpButtonOpacity.value,
    transform: [{ translateX: helpButtonTranslateX.value }],
  }));
  
  const monologueBubbleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: monologueBubbleOpacity.value,
    transform: [{ translateY: monologueBubbleTranslateY.value }],
  }));
  
  const inputBarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: inputBarOpacity.value,
    transform: [{ translateY: inputBarTranslateY.value }],
  }));
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={[styles.container,{}]}>
        {/* ✅ KeyboardAvoidingView (ManagerAIOverlay 패턴) */}
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -insets.bottom : 0}
        >
          <View style={[styles.contentContainer, {
            paddingTop: insets.top,
            // ✅ Android만 paddingBottom 적용 (TarotInputBar가 자체 insets.bottom 가짐)
            paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0,
          }]}>
            {/* Background (🎨 Fade In) */}
            <Animated.View style={[styles.backgroundWrapper, backgroundAnimatedStyle]}>
              {true ? (
                <Video
                  source={{ uri: 'https://babi-cdn.logbrix.ai/babi/real/babi/47efe62b-109f-419f-8484-3ac175cabccf_00001_.mp4' }}
                  style={styles.background}
                  resizeMode="cover"
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
                  resizeMode="cover"
                />
              )}
            </Animated.View>
            
            <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              {/* 🎨 Back Button (200ms) */}
              <Animated.View style={backButtonAnimatedStyle}>
                <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                  <Icon name="chevron-back" size={moderateScale(28)} color="#FFF" />
                </TouchableOpacity>
              </Animated.View>
              
              {/* 🎨 Title (300ms) */}
              <View style={styles.headerCenter}>
                <Animated.View style={titleAnimatedStyle}>
                  <CustomText type="title" bold style={styles.headerTitle}>
                    {t('game.tarot.title')}
                  </CustomText>
                </Animated.View>
              </View>
              
              {/* 🎨 Help Button (400ms) */}
              <Animated.View style={helpButtonAnimatedStyle}>
                <TouchableOpacity style={styles.helpButton} onPress={() => HapticService.light()}>
                  <Icon name="help-circle-outline" size={moderateScale(28)} color="#FFF" />
                </TouchableOpacity>
              </Animated.View>
            </View>
            
            {/* Card Area (조건부 표시) */}
            {cardAreaVisible && (
              <View 
                style={[
                  styles.cardArea,
                  // ✅ reveal/interpretation 모두 상단 배치
                  (gamePhase === 'reveal' || gamePhase === 'interpretation') && styles.cardAreaTop,
                ]}
                pointerEvents={gamePhase === 'interpretation' ? 'box-none' : 'auto'} // ✅ interpretation 단계: 카드 영역 외 터치 이벤트 통과
              >
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
                              delay={index * 100} // 🌙 150ms → 100ms (9장: 0-800ms, 부드럽고 신비로운 등장)
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
                
                {/* Phase 5: Interpretation (Small cards with glow effect + clickable) */}
                {gamePhase === 'interpretation' && (
                  <View style={styles.interpretationCardsContainer}>
                    {selectedCards.map((card, index) => {
                      const isActive = activeCardIndex === index;
                      const cardMeaning = interpretation?.card_meanings?.[index];
                      return (
                        <TouchableOpacity
                          key={card.id} 
                          style={[
                            styles.interpretationCardWrapper,
                            isActive && styles.interpretationCardActive, // 🌟 Glow effect
                          ]}
                          onPress={() => {
                            HapticService.light();
                            setSelectedCardForDetail({ card, meaning: cardMeaning, position: index });
                          }}
                          activeOpacity={0.8}
                        >
                          <TarotCard
                            card={card}
                            isFront={true}
                            isSelected={false}
                            disabled={true}
                          />
                          <CustomText style={[
                            styles.cardPositionLabelSmall,
                            isActive && styles.cardPositionLabelActive, // 🌟 Active label
                          ]}>
                            {index === 0 ? '과거' : index === 1 ? '현재' : '미래'}
                          </CustomText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
            
            {/* ✅ Chat Area (스크롤 가능) */}
            <View style={styles.chatArea}>
                {/* Phase 1: Monologue (🎨 600ms) */}
                {gamePhase === 'monologue' && (
                  <View style={styles.monologueContainer}>
                    {/* ⭐ Animated.View에 monologueBubble 스타일 병합 */}
                    <Animated.View style={[styles.monologueBubble, monologueBubbleAnimatedStyle]}>
                      <RNAnimated.View style={{ opacity: monologueOpacity }}>
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
                    </Animated.View>
                  </View>
                )}
                
                {/* Phase 2: Conversation */}
                {(gamePhase === 'conversation' || gamePhase === 'selection' || gamePhase === 'reveal') && (
                  <ScrollView
                    ref={scrollViewRef}
                    style={styles.conversationContainer}
                    contentContainerStyle={styles.conversationContent}
                    keyboardShouldPersistTaps="handled"
                    onScrollBeginDrag={() => Keyboard.dismiss()}
                  >
                    {conversationHistory.map((msg, index) => {
                      // 🎨 Get animation values for SAGE messages
                      const animation = messageAnimations[index];
                      const isAssistant = msg.role === 'assistant';
                      
                      // User messages: No animation (instant)
                      if (!isAssistant) {
                        return (
                          <View
                            key={index}
                            style={[styles.messageBubble, styles.userMessageBubble]}
                          >
                            <CustomText style={styles.messageText}>
                              {msg.content}
                            </CustomText>
                          </View>
                        );
                      }
                      
                      // SAGE messages: Fade-in + Scale animation
                      return (
                        <RNAnimated.View
                          key={index}
                          style={[
                            styles.messageBubble,
                            styles.sageMessageBubble,
                            animation && {
                              opacity: animation.opacity,
                              transform: [{ scale: animation.scale }],
                            },
                          ]}
                        >
                          <CustomText style={styles.messageText}>
                            {msg.content}
                          </CustomText>
                        </RNAnimated.View>
                      );
                    })}
                    
                    {/* 🎨 Typing Indicator (신비로운 ... 애니메이션) */}
                    {isWaitingForSage && (
                      <View style={styles.messageRow}>
                        {/* ✅ SAGE 아바타 */}
                        <Image
                          source={{ uri: 'https://babi-cdn.logbrix.ai/babi/real/babi/e832b7d9-4ff2-41f1-8c5f-0b08b055fe9d_00001_.png' }}
                          style={styles.sageAvatar}
                        />
                        {/* ✅ 작은 버블 (TypingIndicator만) */}
                        <View style={styles.typingIndicatorBubble}>
                          <TypingIndicator />
                        </View>
                      </View>
                    )}
                  </ScrollView>
                )}
                
                {/* Phase 5: Interpretation (🔮 순차 메시지 방식) */}
                {gamePhase === 'interpretation' && (
                  <ScrollView
                    ref={interpretationScrollViewRef} // ✅ NEW: Auto-scroll ref
                   // style={styles.interpretationContainer}
                   style={{ flex: 1, marginTop: Platform.OS === 'ios' ? verticalScale(230) : verticalScale(210) }}
                   contentContainerStyle={[
                      styles.interpretationContent,
                      {  } // ✅ Card Area 아래부터 시작
                    ]}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true} // ✅ 명시적 스크롤 활성화
                    showsVerticalScrollIndicator={true}
                  >
                    {/* 🔮 순차적 메시지 표시 (채팅 버블 스타일 + SAGE 아바타) */}
                    {interpretationMessages.map((msg, index) => (
                      <View key={index} style={styles.messageRow}>
                        {/* ✅ SAGE 아바타 (ManagerAIOverlay 스타일) */}
                        <Image
                          source={{ uri: 'https://babi-cdn.logbrix.ai/babi/real/babi/e832b7d9-4ff2-41f1-8c5f-0b08b055fe9d_00001_.png' }}
                          style={styles.sageAvatar}
                        />
                        {/* Message Bubble */}
                        <View style={[styles.messageBubble, styles.sageMessageBubble]}>
                          <CustomText style={styles.messageText}>
                            {msg.content}
                          </CustomText>
                        </View>
                      </View>
                    ))}
                    
                    {/* 🎨 Typing Indicator (최하단 - 마지막 라인) */}
                    {isLoadingInterpretation && (
                      <View style={styles.messageRow}>
                        {/* ✅ SAGE 아바타 */}
                        <Image
                          source={{ uri: 'https://babi-cdn.logbrix.ai/babi/real/babi/e832b7d9-4ff2-41f1-8c5f-0b08b055fe9d_00001_.png' }}
                          style={styles.sageAvatar}
                        />
                        {/* ✅ 작은 버블 (TypingIndicator만) */}
                        <View style={styles.typingIndicatorBubble}>
                          <TypingIndicator />
                        </View>
                      </View>
                    )}
                  </ScrollView>
                )}
            </View>
            
            {/* ✅ Input Bar (🎨 800ms - 아래에서 위로) */}
            <Animated.View style={inputBarAnimatedStyle}>
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
                isTarotReady={isTarotReady} // 🔮 NEW
                onTarotReadyPress={handleTarotReadyPress} // 🔮 NEW
              />
            </Animated.View>
          </View>
          </View>
        </KeyboardAvoidingView>
      </View>
      
      {/* 🔮 Card Detail Overlay */}
      {selectedCardForDetail && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedCardForDetail(null)}
        >
          <View style={styles.cardDetailOverlay}>
            <TouchableOpacity 
              style={styles.cardDetailBackdrop}
              onPress={() => {
                HapticService.light();
                setSelectedCardForDetail(null);
              }}
              activeOpacity={1}
            >
              <View style={styles.cardDetailContainer}>
                <View style={styles.cardDetailContent}>
                  {/* Close Button */}
                  <TouchableOpacity
                    style={styles.cardDetailCloseButton}
                    onPress={() => {
                      HapticService.light();
                      setSelectedCardForDetail(null);
                    }}
                  >
                    <Icon name="close" size={moderateScale(24)} color="#FFF" />
                  </TouchableOpacity>
                  
                  {/* Large Card */}
                  <View style={styles.cardDetailCardContainer}>
                    <TarotCard
                      card={selectedCardForDetail.card}
                      isFront={true}
                      isSelected={false}
                      disabled={true}
                    />
                  </View>
                  
                  {/* Card Info */}
                  <View style={styles.cardDetailInfo}>
                    <CustomText type="title" bold style={styles.cardDetailTitle}>
                      {selectedCardForDetail.card.name_ko}
                    </CustomText>
                    <CustomText style={styles.cardDetailPosition}>
                      {selectedCardForDetail.position === 0 ? '과거/원인' : 
                       selectedCardForDetail.position === 1 ? '현재/상황' : '미래/결과'}
                    </CustomText>
                    
                    {selectedCardForDetail.meaning && (
                      <View style={styles.cardDetailMeaningContainer}>
                        <CustomText style={styles.cardDetailMeaning}>
                          {selectedCardForDetail.meaning.meaning}
                        </CustomText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // ✅ KeyboardAvoidingView (ManagerAIOverlay 패턴)
  keyboardView: {
    flex: 1,
  },
  
  // ✅ Content Container (SafeArea 적용)
  contentContainer: {
    flex: 1,
  },
  
  // 🎨 Background Wrapper (Animated)
  backgroundWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  
  content: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  
  backButton: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(-10),
  },
  
  headerCenter: {
    flex: 1,

  },
  
  headerTitle: {
    color: '#FFF',
    fontSize: moderateScale(18),
    fontStyle:'italic'
  },
  
  helpButton: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Card Area (✅ JK님의 제안: 전체 화면 오버레이 + padding으로 Header/Input 회피)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  cardArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: verticalScale(60), // ✅ Header 영역 (50 + 여백)
    paddingBottom: verticalScale(80), // ✅ Input 영역 (~70-80)
    justifyContent: 'center', // ✅ 중앙 배치 (9장/3장 모두)
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 10,
  },
  
  cardAreaTop: {
    // ✅ interpretation 단계: 상단 배치 (height: 카드 크기만큼만, 약 150)
    justifyContent: 'flex-start', // ✅ 상단 정렬
    paddingTop: verticalScale(60),
    paddingBottom: 0, // ✅ 하단 padding 제거
    height: verticalScale(210), // ✅ JK님과의 약속: 카드 크기만큼 (60 padding + 150 카드 영역)
    bottom: 'auto', // ✅ cardArea의 bottom: 0 무효화 → 전체 화면 차지 X
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
    justifyContent: 'center', // ✅ 중앙 배치 (원본 복원)
    alignItems: 'center',
  },
  
  revealTitleContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20), // ✅ 원본 복원
  },
  
  revealTitle: {
    color: '#FFF',
    fontSize: moderateScale(22), // ✅ 원본 복원
  },
  
  revealCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: scale(10), // ✅ cardGrid와 동일 (9장 기준)
  },
  
  revealCardWrapper: {
    width: '33.333%', // ✅ cardWrapper와 동일 (9장 중 1장 크기)
    padding: scale(5), // ✅ cardWrapper와 동일 (카드 간격)
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
//    alignItems: 'flex-start',
    alignItems: 'center',


//    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(10),
    marginLeft: scale(10),
  },
  
  interpretationCardWrapper: {
    width: '33.333%', // ✅ 고정 크기 (작은 카드)
//    marginHorizontal: scale(6), // ✅ 카드 간격
    marginLeft: scale(10),
    alignItems: 'center',

  },
  
  interpretationCardActive: {
    // 🌟 신비스러운 Glow 효과
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 15,
  },
  
  cardPositionLabelSmall: {
    color: '#FFF',
    fontSize: moderateScale(12),
    marginTop: verticalScale(5),
  },
  
  cardPositionLabelActive: {
    color: '#FFD700', // 🌟 골드 컬러
    fontWeight: 'bold',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Chat Area
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  chatArea: {
    flex: 1, // ✅ Chat Area (스크롤 가능)
  },
  
  // chatAreaCompact: {
  //   flex: 0.5, // ✅ 제거: Card Area가 absolute이므로 불필요
  // },
  
  // Monologue
  monologueContainer: {
    flex: 1,
    position: 'relative', // ⭐ absolute positioning 기준점
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  monologueBubble: {
    position: 'absolute',
    top: verticalScale(20),
    right: scale(20),
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
//    shadowColor: '#000',
//    shadowOffset: { width: 0, height: 2 },
//    shadowOpacity: 0.25,
//    shadowRadius: 4,
//    elevation: 5,
  },
  
  bubbleText: {
    color: '#FFF',
    fontSize: scale(15),
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
  
  // ✅ Message Row (SAGE 아바타 + 버블)
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
    paddingRight: scale(50), // ✅ 우측 여백 (ManagerAIOverlay 스타일)
  },
  
  // ✅ SAGE 아바타 (ManagerAIOverlay 스타일)
  sageAvatar: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginRight: scale(8),
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // ✅ Placeholder color
  },
  
  // ✅ Typing Indicator Bubble (작고 신비로운)
  typingIndicatorBubble: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: scale(20),
    backgroundColor: 'rgba(123, 31, 162, 0.85)',
    borderTopLeftRadius: scale(4),
    alignSelf: 'flex-start',
    minWidth: scale(60), // ✅ 최소 너비 (작게)
  },
  
  messageBubble: {
    flex: 1, // ✅ 남은 공간 채우기
    maxWidth: '90%',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderRadius: scale(20),
  },
  
  userMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(66, 133, 244, 0.85)',
    borderTopRightRadius: scale(4),
  },
  
  sageMessageBubble: {
    backgroundColor: 'rgba(123, 31, 162, 0.85)',
    borderTopLeftRadius: scale(4),
  },
  
  messageText: {
    color: '#FFF',
    fontSize: moderateScale(15),
    lineHeight: platformLineHeight(moderateScale(16)), // ✅ Platform-aware lineHeight
  },
  
  // Interpretation
  interpretationContainer: {
//    flex: 1,
//    minHeight: verticalScale(300), // ✅ 최소 높이 보장
    backgroundColor: 'blue',
  },
  
  interpretationContent: {
    flexGrow: 1, 
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(20),
    paddingBottom: verticalScale(100), // ✅ 하단 여백 확보 (키보드 영역)
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
  
  // 🎨 Typing Indicator (신비로운 ... 애니메이션)
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: verticalScale(8),
  },
  
  typingDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#FFF',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔮 Card Detail Overlay
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  cardDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  cardDetailBackdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  cardDetailContainer: {
    width: '85%',
    maxHeight: '80%',
  },
  
  cardDetailContent: {
    backgroundColor: 'rgba(123, 31, 162, 0.95)',
    borderRadius: scale(20),
    padding: scale(20),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  
  cardDetailCloseButton: {
    position: 'absolute',
    top: scale(10),
    right: scale(10),
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  
  cardDetailCardContainer: {
    marginBottom: verticalScale(20),
    transform: [{ scale: 1.2 }],
  },
  
  cardDetailInfo: {
    alignItems: 'center',
    width: '100%',
  },
  
  cardDetailTitle: {
    color: '#FFD700',
    fontSize: moderateScale(24),
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  
  cardDetailPosition: {
    color: '#FFF',
    fontSize: moderateScale(16),
    marginBottom: verticalScale(16),
    opacity: 0.8,
    textAlign: 'center',
  },
  
  cardDetailMeaningContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: scale(15),
    padding: scale(15),
  },
  
  cardDetailMeaning: {
    color: '#FFF',
    fontSize: moderateScale(15),
    lineHeight: platformLineHeight(22),
    textAlign: 'center',
  },
});

export default TarotGameView;
