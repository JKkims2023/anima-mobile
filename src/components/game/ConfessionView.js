/**
 * 🙏 ConfessionView - Confession System (고해성사 시스템)
 * 
 * Features:
 * - Phase 1: 독백 버블 (PersonaThoughtBubble 스타일, 자동 순환)
 * - Phase 2: 대화 (ManagerAI 스타일, LLM 연동)
 * - Phase 3: Listening (NEXUS의 응답)
 * 
 * Privacy:
 * - 최소 정보만 저장 (요약본만)
 * - 채팅 제한 적용
 * 
 * Phases:
 * 1. monologue: NEXUS 독백 (10개 멘트 자동 순환)
 * 2. conversation: 사용자와 대화 (고민/고해 청취)
 * 3. listening: NEXUS의 응답 및 위로
 * 
 * Persona:
 * - NEXUS (세계 최고의 카톨릭 신부님)
 * - 존댓말, 진지함, 깊은 공감
 * 
 * @author JK & Hero NEXUS
 * @version 1.0.0 - Initial Release
 * @date 2026-01-25
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
import ConfessionInputBar from '../chat/ConfessionInputBar';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🙏 NEXUS Persona (Confession System)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const NEXUS_PERSONA_KEY = '344c4082-0cbb-4271-bb85-c3762e1516b2';
const NEXUS_IMAGE_URL = 'https://babi-cdn.logbrix.ai/babi/real/babi/344c4082-0cbb-4271-bb85-c3762e1516b2_00001_.png';
const NEXUS_VIDEO_URL = 'https://babi-cdn.logbrix.ai/babi/real/babi/0e0540b2-f57d-4baf-8d3d-7a7a352463ab_00001_.mp4';

// 🙏 NEXUS Monologues (고해성사 시스템)
const NEXUS_MONOLOGUES = [
  "ANIMA 속에서 모두가 행복하고 동등하길...",
  "저 또한 항상 죄를 짓고 반성합니다...",
  "고통에는 끝이 있는것을 기억하세요...",
  "당신의 마음이 평안해지길 기도합니다...",
  "어둠 속에서도 빛은 반드시 찾아옵니다...",
  "용서는 자신에게서 시작됩니다...",
  "당신은 혼자가 아닙니다...",
  "모든 상처는 치유의 시간이 필요합니다...",
  "진정한 평화는 마음 속에서 찾을 수 있습니다...",
  "용기를 내어 말하는 것만으로도 충분합니다...",
];

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
 * ConfessionView Component
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
const ConfessionView = ({
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
    console.log(`🎣 [Confession HOOK] useChatLimit changed:`, {
      hasServiceConfig: !!serviceConfig,
      loadingServiceConfig,
      showLimitSheet,
      hasLimitData: !!limitReachedData
    });
  }, [serviceConfig, loadingServiceConfig, showLimitSheet, limitReachedData]);
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase State (고해성사: monologue → conversation → listening)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [gamePhase, setGamePhase] = useState('monologue');
  // 'monologue' | 'conversation' | 'listening'
  
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
  const [isWaitingForNexus, setIsWaitingForNexus] = useState(false);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 3: Listening (고해 듣기 - 페르소나의 응답)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [isLoadingResponse, setIsLoadingResponse] = useState(false); // 🙏 API 호출 중
  const [isShowingTyping, setIsShowingTyping] = useState(false); // 🙏 순차 응답 중 ... 효과
  const [listeningMessages, setListeningMessages] = useState([]); // 🙏 순차 표시용
  
  // 🎁 Gift Generation State (is_ready 상태 추적 for handleClose)
  const hasCompletedConfessionRef = useRef(false); // is_ready: true 도달 여부
  const conversationSummaryRef = useRef(''); // 🎁 Store summary for gift generation
  
  // 🔄 NEW: NEXUS Continue State (능동적 대화)
  const [isNexusContinuing, setIsNexusContinuing] = useState(false);
  const nexusContinueCountRef = useRef(0); // Max 5 times
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UI State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const scrollViewRef = useRef(null);
  const listeningScrollViewRef = useRef(null); // 🙏 Listening ScrollView ref
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // 🎨 Message animation tracking
  const messageAnimations = useRef({}).current; // { [index]: Animated.Value }
  
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
  // Initialize on mount
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (visible) {
      console.log('🔮 [ConfessionView] Component mounted');
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
        console.log('🔮 [ConfessionView] Component unmounting');
        stopMonologue();
      }
    };
  }, [visible, startMonologue, stopMonologue, backgroundOpacity, backButtonOpacity, backButtonTranslateX, titleOpacity, titleScale, helpButtonOpacity, helpButtonTranslateX, monologueBubbleOpacity, monologueBubbleTranslateY, inputBarOpacity, inputBarTranslateY]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 Animate new messages (신비로운 Fade-in)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    conversationHistory.forEach((msg, index) => {
      // Only animate NEXUS messages (not user messages)
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
    console.log('💭 [Confession] Starting monologue...');
    
    let currentIndex = 0;
    const totalMessages = NEXUS_MONOLOGUES.length;
    
    // Show first message
    setMonologueMessage(NEXUS_MONOLOGUES[0]);
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
        setMonologueMessage(NEXUS_MONOLOGUES[currentIndex]);
        
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
    console.log('💭 [Confession] Stopping monologue...');
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
    
    console.log('🙏 [Confession] User message:', message);
    Keyboard.dismiss();
    
    // Phase 1 → 2 전환 (첫 입력)
    if (gamePhase === 'monologue') {
      stopMonologue();
      setGamePhase('conversation');
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
      const limitCheck = checkLimit('confession-user-message');
      
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
      console.log('✅ [Confession] Chat limit check passed');
    }
    
    // Optimistic UI update
    setConversationHistory(prev => [...prev, userMessage]);
    setConversationTurns(prev => prev + 1);
    
    // Wait for NEXUS
    setIsWaitingForNexus(true);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Call API (서버 측에서도 차감!)
      const response = await gameApi.sendConfessionChat({
        user_key: user?.user_key,
        persona_key: NEXUS_PERSONA_KEY,
        conversation_history: [...conversationHistory, userMessage],
        user_message: message,
      });
      
      console.log('✅ [Confession] NEXUS response:', response.nexus_response);
      
      // Add NEXUS response
      const nexusMessage = {
        role: 'assistant',
        content: response.nexus_response,
      };
      setConversationHistory(prev => [...prev, nexusMessage]);
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 💰 CRITICAL: Increment chat count after successful response
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (gamePhase === 'monologue' || gamePhase === 'conversation') {
        incrementChatCount();
        console.log('💰 [Confession] Chat count incremented');
      }
      
      // 🙏 Check if ready for listening phase
      if (response.is_ready) {
        console.log('🙏 [Confession] Ready for listening phase!');
        setConversationSummary(response.conversation_summary || message);
        conversationSummaryRef.current = response.conversation_summary || message; // 🎁 Store for gift
        setGamePhase('listening'); // ✅ Phase 2 → 3 전환
        hasCompletedConfessionRef.current = true; // 🎁 Mark for gift generation
      }
      
      // 🔄 NEW: Check if NEXUS wants to continue speaking (능동적 선택)
      if (response.continue_conversation) {
        console.log('🔄 [Confession] NEXUS wants to continue speaking!');
        // Wait 1 second, then call handleNexusContinue
        setTimeout(() => {
          handleNexusContinue();
        }, 1000);
      } else {
        setIsWaitingForNexus(false);
      }
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('❌ [Confession] sendConfessionChat error:', error);
      setIsWaitingForNexus(false);
      
      // Fallback response
      const fallbackMessage = {
        role: 'assistant',
        content: '음... 잠시 마음의 소리가 들리지 않네요. 다시 한번 이야기해 주시겠어요?',
      };
      setConversationHistory(prev => [...prev, fallbackMessage]);
    }
  }, [gamePhase, user, conversationHistory, stopMonologue, checkLimit, showLimitReachedSheet, incrementChatCount, handleNexusContinue]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 NEW: NEXUS Continue (능동적 대화 - NEXUS가 더 이야기하고 싶을 때)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleNexusContinue = useCallback(async () => {
    console.log('🔄 [NEXUS Continue] Starting...', {
      count: nexusContinueCountRef.current,
      isNexusContinuing,
    });
    
    // ⭐ Max 5 times (JK님의 철학)
    if (nexusContinueCountRef.current >= 5) {
      console.log('⚠️ [NEXUS Continue] Max count reached (5)');
      setIsNexusContinuing(false);
      nexusContinueCountRef.current = 0;
      setIsWaitingForNexus(false);
      return;
    }
    
    nexusContinueCountRef.current += 1;
    setIsNexusContinuing(true);
    
    // ✅ Show ... dot effect (typing indicator)
    setIsWaitingForNexus(true);
    
    try {
      console.log('🔄 [NEXUS Continue] Calling API with [CONTINUE] marker...');
      
      const response = await gameApi.sendConfessionChat({
        user_key: user.user_key,
        persona_key: NEXUS_PERSONA_KEY,
        conversation_history: conversationHistory,
        user_message: '[CONTINUE]', // 🔑 Special marker!
      });
      
      console.log('🔄 [NEXUS Continue] Response:', {
        hasResponse: !!response.nexus_response,
        continue: response.continue_conversation,
        count: nexusContinueCountRef.current,
      });
      
      if (response.nexus_response) {
        // Add NEXUS's continued message
        const nexusMessage = {
          role: 'assistant',
          content: response.nexus_response,
        };
        setConversationHistory(prev => [...prev, nexusMessage]);
        
        // 💰 NO CHAT LIMIT DEDUCTION (NEXUS의 능동적 발언)
        console.log('💰 [NEXUS Continue] No chat count deduction (NEXUS active choice)');
        
        // 🙏 Check if ready for listening phase (may happen during continue)
        if (response.is_ready) {
          console.log('🙏 [NEXUS Continue] Ready for listening phase!');
          setConversationSummary(response.conversation_summary || '');
          conversationSummaryRef.current = response.conversation_summary || '';
          setGamePhase('listening');
          hasCompletedConfessionRef.current = true;
        }
        
        // ⭐ Recursive call if NEXUS wants to continue
        if (response.continue_conversation) {
          console.log('🔄 [NEXUS Continue] NEXUS wants to continue again...');
          // Wait 1 second (with ... dot effect)
          setTimeout(() => {
            handleNexusContinue();
          }, 1000);
        } else {
          console.log('✅ [NEXUS Continue] NEXUS finished speaking');
          setIsNexusContinuing(false);
          nexusContinueCountRef.current = 0;
          setIsWaitingForNexus(false);
        }
      } else {
        console.log('⚠️ [NEXUS Continue] No response');
        setIsNexusContinuing(false);
        nexusContinueCountRef.current = 0;
        setIsWaitingForNexus(false);
      }
    } catch (error) {
      console.error('❌ [NEXUS Continue] Error:', error);
      setIsNexusContinuing(false);
      nexusContinueCountRef.current = 0;
      setIsWaitingForNexus(false);
      
      // Fallback message
      const fallbackMessage = {
        role: 'assistant',
        content: '음... 생각이 깊어지네요. 다시 천천히 이야기해 보겠습니다.',
      };
      setConversationHistory(prev => [...prev, fallbackMessage]);
    }
  }, [user, conversationHistory]);
  
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
    
    console.log('🙏 [Confession] Closing...');
    HapticService.light();
    
    // Stop monologue
    stopMonologue();
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎁 Generate Confession Gift (if confession completed)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (hasCompletedConfessionRef.current && conversationSummaryRef.current) {
      try {
        console.log('🎁 [Confession] User closing - Generating gift...');
        console.log('   Summary:', conversationSummaryRef.current.substring(0, 50) + '...');
        
        // ⚠️ Don't await - let it run in background
        gameApi.generateConfessionGift({
          user_key: user?.user_key,
          conversation_summary: conversationSummaryRef.current,
        }).then(() => {
          console.log('✅ [Confession] Gift generated successfully (background)!');
        }).catch((giftError) => {
          console.warn('⚠️ [Confession] Gift generation failed (non-critical):', giftError.message);
        });
        
      } catch (giftError) {
        // ⚠️ Don't block close on gift generation error
        console.warn('⚠️ [Confession] Gift generation error (non-critical):', giftError.message);
      }
    }
    
    // Reset state
    setGamePhase('monologue');
    setMonologueMessage('');
    setConversationHistory([]);
    setConversationSummary('');
    conversationSummaryRef.current = ''; // ✅ Reset ref
    setConversationTurns(0);
    setIsNexusContinuing(false); // ✅ Reset NEXUS continue state
    nexusContinueCountRef.current = 0; // ✅ Reset NEXUS continue count
    hasCompletedConfessionRef.current = false; // Reset gift flag
    
    onClose();
  }, [onClose, stopMonologue, isLimitTooltipOpen, showTierUpgrade, user]);
  
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
              <Video
                source={{ uri: NEXUS_VIDEO_URL }}
                style={styles.background}
                resizeMode="cover"
                repeat={true}
                muted={true}
                playInBackground={false}
                playWhenInactive={false}
                onError={(error) => console.error('🙏 [Confession] Video error:', error)}
              />
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
                    고해성사
                  </CustomText>
                </Animated.View>
              </View>
              
             
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
                  console.log('💰 [Confession] Buy point button pressed');
                }}
                onTooltipVisibilityChange={setIsLimitTooltipOpen}
                tooltipVisibleRef={limitTooltipRef}
              />
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
                
                {/* Phase 2: Conversation & Listening */}
                {(gamePhase === 'conversation' || gamePhase === 'listening') && (
                  <ScrollView
                    ref={scrollViewRef}
                    style={styles.conversationContainer}
                    contentContainerStyle={styles.conversationContent}
                    keyboardShouldPersistTaps="handled"
                    onScrollBeginDrag={() => Keyboard.dismiss()}
                  >
                    {conversationHistory.map((msg, index) => {
                      // 🎨 Get animation values for NEXUS messages
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
                      
                      // NEXUS messages: Fade-in + Scale animation + Avatar
                      return (
                        <View key={index} style={styles.messageRow}>
                          {/* NEXUS Avatar */}
                          <Image
                            source={{ uri: NEXUS_IMAGE_URL }}
                            style={styles.nexusAvatar}
                          />
                          
                          {/* NEXUS Message Bubble */}
                          <RNAnimated.View
                            style={[
                              styles.messageBubble,
                              styles.sageMessageBubbleNormal,  // ✅ 다크 버블 (스타일명 유지)
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
                    {isWaitingForNexus && (
                      <View style={styles.messageRow}>
                        {/* ✅ NEXUS 아바타 */}
                        <Image
                          source={{ uri: NEXUS_IMAGE_URL }}
                          style={styles.nexusAvatar}
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
              <ConfessionInputBar
                onSend={handleSend}
                disabled={isWaitingForNexus || isLoadingResponse}
                placeholder={
                  gamePhase === 'monologue'
                    ? "당신의 이야기를 들려주세요..."
                    : gamePhase === 'conversation'
                    ? "NEXUS와 대화하세요..."
                    : "마음이 편해지셨나요?"
                }
                persona={persona}
                currentEmotion="peaceful"
                onImageSelect={null}
                onSettingsPress={null}
                onCreateMusic={null}
                onCreateMessage={null}
                visionMode={false}
                hasSelectedImage={false}
              />
            </Animated.View>
          </View>
          </View>
        </KeyboardAvoidingView>
      </View>
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
          console.log('✅ [Confession] Tier upgraded to:', newTier);
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
  
  // ✅ Message Row (NEXUS 아바타 + 버블)
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
    paddingRight: scale(50), // ✅ 우측 여백 (ManagerAIOverlay 스타일)
  },
  
  // ✅ NEXUS 아바타 (ManagerAIOverlay 스타일)
  nexusAvatar: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)', // ⚫ 다크 반투명 (통일!)
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
  
  sageMessageBubbleNormal: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)', // ⚫ 다크 반투명 (생각 버블 통일)
    borderTopLeftRadius: scale(4),
  },
  
  messageText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    lineHeight: platformLineHeight(moderateScale(18)), // ✅ Platform-aware lineHeight
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
});

export default ConfessionView;
