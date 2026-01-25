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
  BackHandler, // ✅ For loading overlay back button blocking
  Animated as RNAnimated,
  Image, // ✅ For SAGE avatar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur'; // ✅ For card detail overlay blur
import LinearGradient from 'react-native-linear-gradient'; // ✅ For loading overlay
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat, // ⭐ For loading animation
  withSequence, // ⭐ For loading animation
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
import { useAnima } from '../../contexts/AnimaContext'; // 💰 For chat limit alerts
import useChatLimit from '../../hooks/useChatLimit'; // 💰 Chat limit hook
import FloatingChatLimitButton from '../chat/FloatingChatLimitButton'; // 💰 Floating chat limit button
import ChatLimitSheet from '../chat/ChatLimitSheet'; // 💰 Limit reached sheet
import TierUpgradeSheet from '../tier/TierUpgradeSheet'; // 💰 Tier upgrade sheet

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
  const { showAlert } = useAnima(); // 💰 For chat limit alerts
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💰 Chat Limit (useChatLimit Hook - ManagerAI와 100% 동일!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const {
    serviceConfig,
    loadingServiceConfig,
    showLimitSheet,
    setShowLimitSheet,
    limitReachedData,
    checkLimit,
    incrementChatCount,
    showLimitReachedSheet,
  } = useChatLimit(visible, user, showAlert);
  
  // 💰 FloatingChatLimitButton Tooltip State (Back button 우선순위!)
  const [isLimitTooltipOpen, setIsLimitTooltipOpen] = useState(false);
  const limitTooltipRef = useRef(null);
  
  // 💰 Tier Upgrade Sheet State
  const [showTierUpgrade, setShowTierUpgrade] = useState(false);
  
  // 🔥 [HOOK LOG] useChatLimit state changes
  useEffect(() => {
    console.log(`🎣 [Tarot HOOK] useChatLimit changed:`, {
      hasServiceConfig: !!serviceConfig,
      loadingServiceConfig,
      showLimitSheet,
      hasLimitData: !!limitReachedData
    });
  }, [serviceConfig, loadingServiceConfig, showLimitSheet, limitReachedData]);
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
  const [isLoadingInterpretation, setIsLoadingInterpretation] = useState(false); // 🔮 API 호출 중 (Loading Overlay)
  const [isShowingTyping, setIsShowingTyping] = useState(false); // 🔮 순차 해석 중 ... 효과
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
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💰 CRITICAL: Check chat limit BEFORE sending (Phase 1 & 2만!)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (gamePhase === 'monologue' || gamePhase === 'conversation') {
      const limitCheck = checkLimit('tarot-user-message');
      
      if (!limitCheck.allowed) {
        if (limitCheck.reason === 'loading') {
          // Already showed alert in checkLimit
          return;
        } else if (limitCheck.reason === 'limit_reached') {
          // Show limit sheet
          showLimitReachedSheet(limitCheck.limitData);
          return; // ⚡ STOP! Don't send to server!
        }
      }
      console.log('✅ [Tarot] Chat limit check passed');
    }
    
    // Optimistic UI update
    setConversationHistory(prev => [...prev, userMessage]);
    setConversationTurns(prev => prev + 1);
    
    // Wait for SAGE
    setIsWaitingForSage(true);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Call API (서버 측에서도 차감!)
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
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 💰 CRITICAL: Increment chat count after successful response (Phase 1 & 2만!)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (gamePhase === 'monologue' || gamePhase === 'conversation') {
        incrementChatCount();
        console.log('💰 [Tarot] Chat count incremented');
      }
      
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
      
      // Add with reversed status (50% chance)
      const isReversed = Math.random() < 0.5;
      const cardWithReversed = {
        ...card,
        is_reversed: isReversed,  // 🔮 50% 확률로 역방향
      };
      
      console.log('   → Adding', isReversed ? '(역방향)' : '(정방향)');
      return [...prev, cardWithReversed];
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
  const revealStartedRef = useRef(false); // ✅ 중복 실행 방지
  
  useEffect(() => {
    if (gamePhase === 'reveal' && selectedCards.length === 3 && !revealStartedRef.current) {
      console.log('🔮 [Tarot] Starting card reveal...');
      revealStartedRef.current = true; // ✅ Mark as started
      
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
    
    // Reset ref when leaving reveal phase
    if (gamePhase !== 'reveal') {
      revealStartedRef.current = false;
    }
  }, [gamePhase, selectedCards, generateInterpretation]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 5: Interpretation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // 🔮 Loading Overlay Animation
  const loadingOverlayOpacity = useSharedValue(0);
  const loadingCircleScale = useSharedValue(0.8);
  const loadingCircleOpacity = useSharedValue(0.6);
  const loadingGlowOpacity = useSharedValue(0.3);
  const loadingRotation = useSharedValue(0); // ⭐ NEW: 회전 애니메이션
  
  // 🎨 Loading Animation Effect (분리하여 항상 작동하도록)
  useEffect(() => {
    if (isLoadingInterpretation) {
      console.log('🎨 [Tarot] Starting loading animation...');
      
      // Fade in overlay
      loadingOverlayOpacity.value = withTiming(1, { duration: 300 });
      
      // Breathing circle
      loadingCircleScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      
      loadingCircleOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      
      // Glow pulse
      loadingGlowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      
      // ⭐ Rotation (slow continuous spin)
      loadingRotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      console.log('🎨 [Tarot] Stopping loading animation...');
      
      // Fade out overlay
      loadingOverlayOpacity.value = withTiming(0, { duration: 300 });
      
      // Reset values
      loadingCircleScale.value = 0.8;
      loadingCircleOpacity.value = 0.6;
      loadingGlowOpacity.value = 0.3;
      loadingRotation.value = 0;
    }
  }, [isLoadingInterpretation]);
  
  const generateInterpretation = useCallback(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔮 [Tarot] Generating interpretation...');
    console.log('   user_key:', user?.user_key);
    console.log('   persona_key:', persona?.persona_key);
    console.log('   selected_cards:', selectedCards.length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    setIsLoadingInterpretation(true);
    
    try {
      console.log('📡 [Tarot] Calling API...');
      const response = await gameApi.interpretTarotCards({
        user_key: user?.user_key,
        persona_key: persona?.persona_key || '573db390-a505-4c9e-809f-cc511c235cbb',
        selected_cards: selectedCards,
        conversation_summary: conversationSummary,
        user_question: conversationHistory.find(m => m.role === 'user')?.content || '',
      });
      
      console.log('✅ [Tarot] API Response received');
      
      console.log('✅ [Tarot] Interpretation received');
      setInterpretation(response.interpretation);
      setIsLoadingInterpretation(false); // ⭐ Animation stops automatically via useEffect
      
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
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [Tarot] generateInterpretation error:', error);
      console.error('   error.message:', error.message);
      console.error('   error.response:', error.response?.data);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      setIsLoadingInterpretation(false); // ⭐ Animation stops automatically via useEffect
      
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
  // 🛡️ Loading Overlay - Block Back Button (Android)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (!isLoadingInterpretation) return;
    
    console.log('🛡️ [Tarot] Loading overlay - Back button BLOCKED');
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('⚠️ [Tarot] User tried to exit during interpretation!');
      HapticService.warning();
      // ⭐ Return true to prevent back navigation
      return true;
    });
    
    return () => {
      console.log('✅ [Tarot] Loading overlay - Back button UNBLOCKED');
      backHandler.remove();
    };
  }, [isLoadingInterpretation]);
  
  // 🔮 순차적 해석 표시 (2초 ... 효과 포함)
  useEffect(() => {
    if (!interpretation || gamePhase !== 'interpretation') return;
    
    console.log('🔮 [Tarot] Starting sequential interpretation display...');
    setInterpretationMessages([]);
    setActiveCardIndex(-1);
    setIsShowingTyping(false); // ✅ 초기화
    
    const delays = [];
    let currentDelay = 500; // 첫 메시지 딜레이
    
    // ═══════════════════════════════════════════════════════════════════
    // 1. 첫 번째 카드 해석
    // ═══════════════════════════════════════════════════════════════════
    // 1-1) Show typing (... 효과)
    delays.push(setTimeout(() => {
      setIsShowingTyping(true);
    }, currentDelay));
    currentDelay += 2000; // ✅ 2초 대기
    
    // 1-2) Show message
    delays.push(setTimeout(() => {
      setIsShowingTyping(false);
      if (interpretation.card_meanings[0]) {
        setActiveCardIndex(0);
        setInterpretationMessages(prev => [...prev, {
          type: 'card',
          cardIndex: 0,
          is_reversed: selectedCards[0]?.is_reversed || false, // 🔮 역방향 정보
          content: `🎴 ${interpretation.card_meanings[0].card_name} (${interpretation.card_meanings[0].position})\n\n${interpretation.card_meanings[0].meaning}`,
        }]);
        HapticService.light();
      }
    }, currentDelay));
    currentDelay += 1000; // 다음 로딩까지 간격
    
    // ═══════════════════════════════════════════════════════════════════
    // 2. 두 번째 카드 해석
    // ═══════════════════════════════════════════════════════════════════
    // 2-1) Show typing
    delays.push(setTimeout(() => {
      setIsShowingTyping(true);
    }, currentDelay));
    currentDelay += 2000; // ✅ 2초 대기
    
    // 2-2) Show message
    delays.push(setTimeout(() => {
      setIsShowingTyping(false);
      if (interpretation.card_meanings[1]) {
        setActiveCardIndex(1);
        setInterpretationMessages(prev => [...prev, {
          type: 'card',
          cardIndex: 1,
          is_reversed: selectedCards[1]?.is_reversed || false, // 🔮 역방향 정보
          content: `🎴 ${interpretation.card_meanings[1].card_name} (${interpretation.card_meanings[1].position})\n\n${interpretation.card_meanings[1].meaning}`,
        }]);
        HapticService.light();
      }
    }, currentDelay));
    currentDelay += 1000;
    
    // ═══════════════════════════════════════════════════════════════════
    // 3. 세 번째 카드 해석
    // ═══════════════════════════════════════════════════════════════════
    // 3-1) Show typing
    delays.push(setTimeout(() => {
      setIsShowingTyping(true);
    }, currentDelay));
    currentDelay += 2000; // ✅ 2초 대기
    
    // 3-2) Show message
    delays.push(setTimeout(() => {
      setIsShowingTyping(false);
      if (interpretation.card_meanings[2]) {
        setActiveCardIndex(2);
        setInterpretationMessages(prev => [...prev, {
          type: 'card',
          cardIndex: 2,
          is_reversed: selectedCards[2]?.is_reversed || false, // 🔮 역방향 정보
          content: `🎴 ${interpretation.card_meanings[2].card_name} (${interpretation.card_meanings[2].position})\n\n${interpretation.card_meanings[2].meaning}`,
        }]);
        HapticService.light();
      }
    }, currentDelay));
    currentDelay += 1000;
    
    // ═══════════════════════════════════════════════════════════════════
    // 4. 전체 해석
    // ═══════════════════════════════════════════════════════════════════
    // 4-1) Show typing
    delays.push(setTimeout(() => {
      setIsShowingTyping(true);
    }, currentDelay));
    currentDelay += 2000; // ✅ 2초 대기
    
    // 4-2) Show message
    delays.push(setTimeout(() => {
      setIsShowingTyping(false);
      setActiveCardIndex(-1);
      setInterpretationMessages(prev => [...prev, {
        type: 'overall',
        content: `🔮 전체 해석\n\n${interpretation.overall}`,
      }]);
      HapticService.medium();
    }, currentDelay));
    currentDelay += 1000;
    
    // ═══════════════════════════════════════════════════════════════════
    // 5. 페르소나 조언
    // ═══════════════════════════════════════════════════════════════════
    // 5-1) Show typing
    delays.push(setTimeout(() => {
      setIsShowingTyping(true);
    }, currentDelay));
    currentDelay += 2000; // ✅ 2초 대기
    
    // 5-2) Show message
    delays.push(setTimeout(() => {
      setIsShowingTyping(false);
      setInterpretationMessages(prev => [...prev, {
        type: 'advice',
        content: `💙 ${persona?.persona_name || 'SAGE'}의 조언\n\n${interpretation.advice}`,
      }]);
      HapticService.medium();
    }, currentDelay));
    currentDelay += 1000;
    
    // ═══════════════════════════════════════════════════════════════════
    // 6. 결론 (judgment.short_answer) 🆕
    // ═══════════════════════════════════════════════════════════════════
    if (interpretation.judgment && interpretation.judgment.short_answer) {
      // 6-1) Show typing
      delays.push(setTimeout(() => {
        setIsShowingTyping(true);
      }, currentDelay));
      currentDelay += 2000; // ✅ 2초 대기
      
      // 6-2) Show message
      delays.push(setTimeout(() => {
        setIsShowingTyping(false);
        setInterpretationMessages(prev => [...prev, {
          type: 'judgment',
          content: `✨ 결론\n\n${interpretation.judgment.short_answer}`,
        }]);
        HapticService.success(); // ✅ 마지막 메시지는 success 햅틱
      }, currentDelay));
    }
    
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
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎯 PRIORITY ORDER (Top to Bottom) - ManagerAI와 동일!
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // 💰 PRIORITY 0: FloatingChatLimitButton Tooltip (HIGHEST PRIORITY!)
    if (isLimitTooltipOpen) {
      if (limitTooltipRef.current?.closeTooltip) {
        limitTooltipRef.current.closeTooltip();
      }
      HapticService.light();
      return; // ⭐ Event handled!
    }
    
    // 🎖️ PRIORITY 1: Tier Upgrade Sheet
    if (showTierUpgrade) {
      setShowTierUpgrade(false);
      HapticService.light();
      return; // ⭐ Event handled!
    }
    
    // 🛡️ PRIORITY 2: Prevent closing during interpretation generation
    if (isLoadingInterpretation) {
      console.log('⚠️ [Tarot] Cannot close during interpretation!');
      HapticService.warning();
      return; // ⭐ Block close!
    }
    
    console.log('🔮 [Tarot] Closing...');
    HapticService.light();
    
    // Stop monologue
    stopMonologue();
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎁 Generate Tarot Gift (if interpretation exists)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (interpretation) {
      try {
        console.log('🎁 [Tarot] User closing - Generating tarot gift...');
        
        // ⚠️ Don't await - let it run in background
        gameApi.generateTarotGift({
          user_key: user?.user_key,
          interpretation: interpretation,
          conversation_summary: conversationSummary,
        }).then(() => {
          console.log('✅ [Tarot] Tarot gift generated successfully (background)!');
        }).catch((giftError) => {
          console.warn('⚠️ [Tarot] Gift generation failed (non-critical):', giftError.message);
        });
        
      } catch (giftError) {
        // ⚠️ Don't block close on gift generation error
        console.warn('⚠️ [Tarot] Gift generation error (non-critical):', giftError.message);
      }
    }
    
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
  }, [onClose, stopMonologue, isLoadingInterpretation, isLimitTooltipOpen, showTierUpgrade]);
  
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
  
  // 🔮 Loading Overlay Animated Styles
  const loadingOverlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loadingOverlayOpacity.value,
  }));
  
  const loadingCircleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loadingCircleScale.value }],
    opacity: loadingCircleOpacity.value,
  }));
  
  const loadingGlowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loadingGlowOpacity.value,
    transform: [{ rotate: `${loadingRotation.value}deg` }], // ⭐ Slow rotation
  }));
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <>
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
              
              {/* 🎨 Help Button (400ms) - Removed for FloatingChatLimitButton */}
              {/* 
              <Animated.View style={helpButtonAnimatedStyle}>
                <TouchableOpacity style={styles.helpButton} onPress={() => HapticService.light()}>
                  <Icon name="help-circle-outline" size={moderateScale(28)} color="#FFF" />
                </TouchableOpacity>
              </Animated.View>
              */}
            </View>
            
            {/* 💰 FloatingChatLimitButton (ManagerAI와 100% 동일!) */}
            {serviceConfig && (
              <FloatingChatLimitButton
                currentCount={serviceConfig.dailyChatCount || 0}
                dailyLimit={serviceConfig.dailyChatLimit || 0}
                tier={user?.user_level || 'free'}
                isOnboarding={serviceConfig.isOnboarding || false}
                onUpgradePress={() => {
                  HapticService.light();
                  setShowTierUpgrade(true);
                }}
                onBuyPointPress={() => {
                  console.log('💰 [Tarot] Buy point button pressed');
                }}
                onTooltipVisibilityChange={setIsLimitTooltipOpen}
                tooltipVisibleRef={limitTooltipRef}
              />
            )}
            
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
                
                {/* Phase 4 & 5: Reveal + Interpretation (통합하여 깜빡임 방지) */}
                {(gamePhase === 'reveal' || gamePhase === 'interpretation') && (
                  <View style={styles.interpretationCardsContainer}>
                    {selectedCards.map((card, index) => {
                      const isActive = activeCardIndex === index;
                      const cardMeaning = interpretation?.card_meanings?.[index];
                      const isRevealed = revealedCards.includes(card.id);
                      const isClickable = gamePhase === 'interpretation';
                      
                      return (
                        <TouchableOpacity
                          key={card.id} 
                          style={[
                            styles.interpretationCardWrapper,
                            isActive && styles.interpretationCardActive, // 🌟 Glow effect
                          ]}
                          onPress={() => {
                            if (isClickable) {
                              HapticService.light();
                              setSelectedCardForDetail({ card, meaning: cardMeaning, position: index });
                            }
                          }}
                          activeOpacity={isClickable ? 0.8 : 1}
                          disabled={!isClickable}
                        >
                          <TarotCard
                            card={card}
                            isFront={isRevealed}
                            isSelected={false}
                            disabled={true}
                          />
                          <CustomText bold style={[
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
                      
                      // SAGE messages: Fade-in + Scale animation + Avatar
                      return (
                        <View key={index} style={styles.messageRow}>
                          {/* SAGE Avatar */}
                          <Image
                            source={{ uri: 'https://babi-cdn.logbrix.ai/babi/real/babi/e832b7d9-4ff2-41f1-8c5f-0b08b055fe9d_00001_.png' }}
                            style={styles.sageAvatar}
                          />
                          
                          {/* SAGE Message Bubble */}
                          <RNAnimated.View
                            style={[
                              styles.messageBubble,
                              styles.sageMessageBubbleNormal,  // ✅ 다크 버블
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
                        </View>
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
                        {/* Message Bubble - 🔮 역방향 카드는 보라색! */}
                        <View style={[
                          styles.messageBubble,
                          msg.is_reversed 
                            ? styles.sageMessageBubbleReversed  // 💜 역방향 → 보라색
                            : styles.sageMessageBubbleNormal    // ⚫ 정방향 → 다크
                        ]}>
                          <CustomText style={styles.messageText}>
                            {msg.content}
                          </CustomText>
                        </View>
                      </View>
                    ))}
                    
                    {/* 🎨 Typing Indicator (순차 해석 중 ... 효과) */}
                    {isShowingTyping && (
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
      
      {/* 🔮 Card Detail Overlay - iOS 호환 버전 */}
      {selectedCardForDetail && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
          onRequestClose={() => setSelectedCardForDetail(null)}
        >
          <View style={styles.cardDetailOverlay}>
            {/* Blur Background (iOS만, Android는 반투명) */}
            {Platform.OS === 'ios' ? (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType="dark"
                blurAmount={20}
                reducedTransparencyFallbackColor="rgba(0,0,0,0.95)"
              />
            ) : (
              <View style={styles.cardDetailAndroidBackground} />
            )}
            
            {/* Content (Blur 위에 배치) */}
            <View style={styles.cardDetailMainContainer}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.cardDetailCloseBtn}
                onPress={() => {
                  HapticService.light();
                  setSelectedCardForDetail(null);
                }}
              >
                <Icon name="close-circle" size={moderateScale(32)} color="#FFF" />
              </TouchableOpacity>

              {/* Card Image */}
              <View style={styles.cardDetailCardSection}>
                <View style={styles.cardDetailCardBox}>
                  <TarotCard
                    card={selectedCardForDetail.card}
                    isFront={true}
                    isSelected={false}
                    disabled={true}
                  />
                </View>
              </View>

              {/* Card Name */}
              <View style={styles.cardDetailNameSection}>
                <CustomText style={styles.cardDetailName}>
                  {selectedCardForDetail.card.name_ko}
                </CustomText>
              </View>

              {/* Card Meaning */}
              <View style={styles.cardDetailMeaningSection}>
                <CustomText style={styles.cardDetailSectionLabel}>📖 카드 의미</CustomText>
                <CustomText style={styles.cardDetailMeaningText}>
                  {selectedCardForDetail.card.upright_meaning}
                </CustomText>
              </View>

              {/* Position */}
              <View style={styles.cardDetailPositionSection}>
                <CustomText style={styles.cardDetailSectionIcon}>🎴</CustomText>
                <CustomText style={styles.cardDetailPositionText}>
                  {selectedCardForDetail.position === 0 ? '과거/원인' : 
                   selectedCardForDetail.position === 1 ? '현재/상황' : '미래/결과'}
                </CustomText>
              </View>

              {/* SAGE Interpretation (Scrollable) */}
              {selectedCardForDetail.meaning && (
                <View style={styles.cardDetailInterpretationSection}>
                  <CustomText style={styles.cardDetailSectionLabel}>🔮 SAGE의 해석</CustomText>
                  <ScrollView 
                    style={styles.cardDetailInterpretationScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    <CustomText style={styles.cardDetailInterpretationText}>
                      {selectedCardForDetail.meaning.meaning}
                    </CustomText>
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
      
      {/* 🔮 Loading Overlay (Interpretation 생성 중) */}
      {isLoadingInterpretation && (
        <Animated.View style={[styles.loadingOverlay, loadingOverlayAnimatedStyle]} pointerEvents="box-only">
          {/* Center Content */}
          <View style={styles.loadingCenterContent}>
            {/* Glow Circle (Background) */}
            <Animated.View style={[styles.loadingGlowCircle, loadingGlowAnimatedStyle]}>
              <LinearGradient
                colors={['rgba(96, 165, 250, 0.3)', 'rgba(147, 51, 234, 0.3)', 'rgba(236, 72, 153, 0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loadingGradientCircle}
              />
            </Animated.View>

            {/* Breathing Circle */}
            <Animated.View style={[styles.loadingBreathingCircle, loadingCircleAnimatedStyle]}>
              <LinearGradient
                colors={['rgba(96, 165, 250, 0.8)', 'rgba(147, 51, 234, 0.8)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loadingGradientCircle}
              />
            </Animated.View>

            {/* Center Icon */}
            <View style={styles.loadingIconContainer}>
              <CustomText style={styles.loadingIcon}>🔮</CustomText>
            </View>
            
            {/* ⭐ Sparkles (작은 별 파티클) */}
            <View style={styles.loadingSparklesContainer}>
              {[...Array(8)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.loadingSpark,
                    {
                      opacity: loadingCircleOpacity, // 같은 opacity 애니메이션 사용
                      transform: [
                        { rotate: `${i * 45}deg` },
                        { translateX: scale(80) },
                      ],
                    },
                  ]}
                >
                  <CustomText style={styles.loadingSparkText}>✨</CustomText>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Message */}
          <View style={styles.loadingMessageContainer}>
            <CustomText type="title" bold style={styles.loadingMainMessage}>
              카드를 해석하고 있어요...
            </CustomText>
            <CustomText type="middle" style={styles.loadingSubMessage}>
              잠시만 기다려주세요
            </CustomText>
          </View>
        </Animated.View>
      )}
    </Modal>
    
    {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        💰 Chat Limit Sheet (ManagerAI와 100% 동일!)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
    {limitReachedData && (
      <ChatLimitSheet
        isOpen={showLimitSheet}
        onClose={() => setShowLimitSheet(false)}
        tier={limitReachedData.tier}
        limit={limitReachedData.limit}
        resetTime={limitReachedData.resetTime}
        canUpgrade={limitReachedData.tier !== 'ultimate'}
        onUpgrade={() => {
          setShowLimitSheet(false);
          setShowTierUpgrade(true);
        }}
        isOnboarding={limitReachedData.isOnboarding}
      />
    )}
    
    {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        💰 Tier Upgrade Sheet (ManagerAI와 100% 동일!)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
    {user && (
      <TierUpgradeSheet
        isOpen={showTierUpgrade}
        onClose={() => setShowTierUpgrade(false)}
        currentTier={user.user_level || 'basic'}
        userKey={user.user_key}
        onUpgradeSuccess={(newTier) => {
          console.log('✅ [Tarot] Tier upgraded to:', newTier);
        }}
      />
    )}
  </>
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
    fontSize: moderateScale(14),
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // ⚫ 다크 반투명 (통일!)
    borderTopLeftRadius: scale(4),
    alignSelf: 'flex-start',
    minWidth: scale(60), // ✅ 최소 너비 (작게)
  },
  
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
    paddingHorizontal: scale(12),
  },
  
  sageAvatar: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(24),
    marginRight: scale(8),
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
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
  
  sageMessageBubbleNormal: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // ⚫ 다크 반투명 (생각 버블 통일)
    borderTopLeftRadius: scale(4),
  },
  
  sageMessageBubbleReversed: {
    backgroundColor: 'rgba(123, 31, 162, 0.85)', // 💜 보라색 (역방향 강조)
    borderTopLeftRadius: scale(4),
  },
  
  messageText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    lineHeight: platformLineHeight(moderateScale(18)), // ✅ Platform-aware lineHeight
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
    paddingVertical: verticalScale(0),
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
  // 🔮 Card Detail Overlay - 최종 개선 버전
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  cardDetailOverlay: {
    flex: 1,
  },
  
  // Android용 어두운 반투명 배경 (가독성 향상)
  cardDetailAndroidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)', // 거의 불투명 (가독성)
  },
  
  cardDetailMainContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingHorizontal: scale(16),
    paddingBottom: scale(20),
  },
  
  // Close Button (우상단, 최소 여백)
  cardDetailCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
    right: scale(16),
    zIndex: 1000,
    padding: scale(4),
  },
  
  // Card Section
  cardDetailCardSection: {
    alignItems: 'center',
    marginTop: verticalScale(42),
    marginBottom: verticalScale(22),
  },
  
  cardDetailCardBox: {
    width: scale(150),
    aspectRatio: 0.6,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  
  // Card Name
  cardDetailNameSection: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 더 어둡게 (가독성)
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    marginBottom: verticalScale(8),
  },
  
  cardDetailName: {
    color: '#FFD700',
    fontSize: Platform.OS === 'ios' ? moderateScale(17) : moderateScale(22),
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Keywords (Row)
  cardDetailKeywordsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 더 어둡게
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: verticalScale(8),
  },
  
  cardDetailKeyword: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  
  // Position
  cardDetailPositionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 더 어둡게
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: verticalScale(8),
  },
  
  cardDetailSectionIcon: {
    fontSize: moderateScale(16),
    marginRight: scale(8),
  },
  
  cardDetailPositionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: moderateScale(15),
    fontWeight: '500',
  },
  
  // Card Meaning
  cardDetailMeaningSection: {
    padding: scale(16),
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 더 어둡게
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    marginBottom: verticalScale(8),
  },
  
  cardDetailSectionLabel: {
    color: '#FFD700',
    fontSize: moderateScale(15),
    fontWeight: '600',
    marginBottom: verticalScale(8),
  },
  
  cardDetailMeaningText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: moderateScale(14),
    lineHeight: platformLineHeight(22),
  },
  
  // SAGE Interpretation (Scrollable)
  cardDetailInterpretationSection: {
    flex: 1,
    padding: scale(16),
    backgroundColor: 'rgba(138, 43, 226, 0.25)', // 더 불투명하게
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: 'rgba(138, 43, 226, 0.6)', // 테두리도 더 진하게
    maxHeight: verticalScale(200),
  },
  
  cardDetailInterpretationScroll: {

    flex:1,

  },
  
  cardDetailInterpretationText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: moderateScale(14),
    lineHeight: platformLineHeight(24),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔮 Loading Overlay (Interpretation 생성 중)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  
  loadingCenterContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: scale(200),
    height: scale(200),
  },
  
  loadingGlowCircle: {
    position: 'absolute',
    width: scale(180),
    height: scale(180),
    borderRadius: scale(90),
    overflow: 'hidden',
  },
  
  loadingBreathingCircle: {
    position: 'absolute',
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    overflow: 'hidden',
  },
  
  loadingGradientCircle: {
    width: '100%',
    height: '100%',
  },
  
  loadingIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: scale(100),
    height: scale(100),
  },
  
  loadingIcon: {
    fontSize: scale(20),
  },
  
  // ⭐ Sparkles Container
  loadingSparklesContainer: {
    position: 'absolute',
    width: scale(200),
    height: scale(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingSpark: {
    position: 'absolute',
  },
  
  loadingSparkText: {
    fontSize: scale(12),
    opacity: 0.7,
  },
  
  loadingMessageContainer: {
    marginTop: verticalScale(40),
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  
  loadingMainMessage: {
    fontSize: scale(20),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: verticalScale(8),
    textShadowColor: 'rgba(96, 165, 250, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  
  loadingSubMessage: {
    fontSize: scale(14),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default TarotGameView;
