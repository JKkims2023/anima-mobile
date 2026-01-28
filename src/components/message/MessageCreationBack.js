/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💌 MessageCreationBack Component - 메시지 생성 뒷면 (플립 뷰)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ✅ Phase 1: Background (Image/Video)
 * - PersonaBackgroundView 컴포넌트로 배경 표시
 * - video/image 자동 판단 및 표시
 * - videoKey로 remount 지원
 * 
 * ✅ Phase 2: Effects (ActiveEffect)
 * - ActiveEffect (Layer 2) 추가
 * - 기본 파티클 효과 적용
 * - 페이드 인 애니메이션 (800ms)
 * 
 * ✅ Phase 3: ANIMA Logo Animation
 * - 좌측 상단 로고 배치
 * - SVG 그라데이션 텍스트 (ANIMA)
 * - "Soul Connection" 서브타이틀
 * - 좌→우 슬라이드 애니메이션 (1200ms)
 * - 순차적 등장 (300ms 딜레이)
 * 
 * ✅ Phase 4: Bottom Gradient + Content
 * - 하단 그라데이션 (3단계, 페이드 인 800ms)
 * - 컨텐츠 영역 (좌→우 슬라이드, 1000ms 딜레이, 감성적!)
 * - 터치 인터랙션 (MessageInputOverlay 연결)
 * - ✨ NEW: 컨텐츠 변경 시 감성적 재애니메이션 (좌→우, 800ms)
 * 
 * ✅ Phase 5: Quick Action Chips
 * - 우측 칩셋 (3개)
 * - 순차적 바운스 (1000ms 딜레이, 100ms 간격)
 * - Chip 1: Heart (예: 이모션 프리셋)
 * - Chip 2: Shimmer (Active Effect)
 * - Chip 3: Music Note (Background Music)
 * 
 * ✅ Phase 6: BackgroundEffect (Layer 1)
 * - 구조 추가 (현재 비활성화, 나중에 확장 가능)
 * - aurora, gradient_waves 등 효과 준비
 * 
 * ✅ Phase 7: Close Button (Glassmorphic Floating)
 * - 상단 우측 배치
 * - 반투명 원형 (rgba(0,0,0,0.5))
 * - X 아이콘 (close-circle, white)
 * - 페이드 인 + 스케일 (1400ms 딜레이, 마지막 등장)
 * - onClose 호출 + haptic feedback
 * 
 * ✅ Business Logic Integration:
 * - MessageInputOverlay 연결
 * - messageContent state 관리
 * - handleContentSave 콜백 구현
 * - 컨텐츠 영역 클릭 시 입력 오버레이 오픈
 * - messageContentRef (stale closure 방지)
 * 
 * ✅ CustomTabBar Integration:
 * - AnimaContext 연결 (setMessageCreateHandler, showAlert, setHasNewMessage, setCreatedMessageUrl)
 * - handleGenerateURL 구현 (3단계 클라이언트 검증)
 *   1️⃣ Content Required Check
 *   2️⃣ Effects Check (optional confirmation)
 *   3️⃣ Final Confirmation
 * - proceedGeneration 구현 (LLM 검증 + 메시지 생성)
 *   ⭐ validateMessage (LLM) - 1번만 실행!
 *   ⭐ messageService.createMessage (API)
 * - useEffect로 handler 등록 (isVisible일 때)
 * - Cleanup 시 handler 해제
 * - messageContentRef를 사용하여 최신 값 접근
 * - ProcessingLoadingOverlay로 로딩 상태 표시
 * 
 * ⭐ 개선점:
 * - LLM 검증 중복 제거 (기존 MessageCreationOverlay는 2번 실행되는 버그 있음)
 * - 클라이언트 검증과 서버 검증 명확히 분리
 * - API 비용 절감 (LLM 검증 1번만 실행)
 * 
 * 🎉 FULL MESSAGE CREATION LOGIC COMPLETE!
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-15
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, BackHandler, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import PersonaBackgroundView from './PersonaBackgroundView';
import BackgroundEffect from '../particle/BackgroundEffect'; // ⭐ Layer 1
import ActiveEffect from '../particle/ActiveEffect'; // ⭐ Layer 2
import CustomText from '../CustomText';
import { useTranslation } from 'react-i18next';
import MessageInputOverlay from './MessageInputOverlay'; // ⭐ NEW: Message input
import { useAnima } from '../../contexts/AnimaContext'; // ⭐ NEW: For CustomTabBar integration
import { useUser } from '../../contexts/UserContext'; // ⭐ NEW: For user data
import messageApi from '../../services/api/messageApi'; // ⭐ NEW: Message validation
import messageService from '../../services/api/messageService'; // ⭐ NEW: Message creation
import ProcessingLoadingOverlay from '../persona/ProcessingLoadingOverlay'; // ⭐ NEW: Loading overlay
import EffectCategorySheet from './EffectCategorySheet'; // 🎨 P1: Step 1 - Category selection
import EffectDetailModal from './EffectDetailModal'; // 🎨 P1: Step 2 - Effect selection
import { 
  EFFECT_CATEGORIES, 
  getEffectById, 
  getCategoryByEffectId,
  requiresConfiguration 
} from '../../constants/effect-categories'; // 🎨 P1: Category-based system
import BackgroundEffectCategorySheet from './BackgroundEffectCategorySheet'; // 🌌 Background Effect: Step 1
import BackgroundEffectDetailModal from './BackgroundEffectDetailModal'; // 🌌 Background Effect: Step 2
import { getCategoryByEffectId as getBackgroundCategoryById } from '../../constants/background-effect-categories'; // 🌌 Background Effect: Helper
import WordInputOverlay from './WordInputOverlay'; // 🎨 P1: Custom words input
import MusicCategorySheet from './MusicCategorySheet'; // 🎵 P0: Music System - Step 1
import UserMusicListModal from './UserMusicListModal'; // 🎵 P0: Music System - Step 2
import FloatingMusicPlayer from './FloatingMusicPlayer'; // 🎵 P0: Music System - Player
import CustomBottomSheet from '../CustomBottomSheet'; // 🎵 P0: Music System - Player
import MessageHistorySheet from './MessageHistorySheet'; // 📜 NEW: Message history selection
import BackgroundSelectionSheet from './BackgroundSelectionSheet'; // 🖼️ NEW: Background selection
import AnimationSelectionModal from './AnimationSelectionModal'; // 🎬 NEW: Lottie animation selection
import { useTheme } from '../../contexts/ThemeContext';
import Video from 'react-native-video';
import Image from 'react-native-fast-image';

const MessageCreationBack = ({
  persona,
  onClose,
  onUpgradeTier,
  isVisible = false,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { setMessageCreateHandler, showAlert, setHasNewMessage, setCreatedMessageUrl, setIsMessageCreationActive, setHasMessageContent } = useAnima(); // ⭐ NEW: Context integration + hasMessageContent
  const { user } = useUser(); // ⭐ NEW: User 
  const { theme,currentTheme } = useTheme();
  const validationFeedbackSheetRef = useRef(null); // ⭐ NEW: Validation feedback with persona voice 💙
 
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[MessageCreationBack] 🎬 Component Render:');
  console.log('   isVisible:', isVisible);
  console.log('   persona_key:', persona?.persona_key);
  console.log('   persona_name:', persona?.persona_name);
  console.log('   has_video:', !!persona?.selected_dress_video_url);
  console.log('   has_image:', !!persona?.selected_dress_image_url);
  console.log('   setMessageCreateHandler exists:', !!setMessageCreateHandler);
  console.log('   🔍 Modal States:');
  console.log('      isDetailModalVisible:', isDetailModalVisible);
  console.log('      selectedCategory:', selectedCategory?.name || 'null');
  console.log('      isCategorySheetVisible:', isCategorySheetVisible);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ═══════════════════════════════════════════════════════════════════════════
  // Refs
  // ═══════════════════════════════════════════════════════════════════════════
  const contentInputRef = useRef(null);
  const wordInputRef = useRef(null); // 🎨 P1: Custom words input
  const messageContentRef = useRef(''); // 🔧 CRITICAL: Avoid stale closure
  const isFirstMountRef = useRef(true); // 🎨 NEW: Skip animation on first mount

  // ═══════════════════════════════════════════════════════════════════════════
  // State Management
  // ═══════════════════════════════════════════════════════════════════════════
  const [messageContent, setMessageContent] = useState('');
  const [isCreating, setIsCreating] = useState(false); // ⭐ Loading state
  const [processingMessage, setProcessingMessage] = useState(''); // ⭐ Loading message
  
  // ⭐ Effect states
  const [backgroundEffect, setBackgroundEffect] = useState('none'); // Layer 1
  const [activeEffect, setActiveEffect] = useState('none'); // Layer 2
  const [customWords, setCustomWords] = useState([]); // Custom words
  const [bgMusic, setBgMusic] = useState('none');
  const [bgMusicUrl, setBgMusicUrl] = useState('');
  const [bgMusicTitle, setBgMusicTitle] = useState(''); // 🎵 P0: Music title
  
  // 🎨 P1: 2-Step Selection States (Active Effect)
  const [isCategorySheetVisible, setIsCategorySheetVisible] = useState(false); // Step 1: Category selection
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false); // Step 2: Effect selection
  const [selectedCategory, setSelectedCategory] = useState(null); // Currently selected category
  const [pendingEffectConfig, setPendingEffectConfig] = useState(null); // Pending effect that needs configuration
  
  // 🌌 Background Effect: 2-Step Selection States
  const [isBackgroundCategorySheetVisible, setIsBackgroundCategorySheetVisible] = useState(false); // Step 1
  const [isBackgroundDetailModalVisible, setIsBackgroundDetailModalVisible] = useState(false); // Step 2
  const [selectedBackgroundCategory, setSelectedBackgroundCategory] = useState(null); // Selected category
  
  // 🎵 P0: Music System - 2-Step Selection States
  const [isMusicCategorySheetVisible, setIsMusicCategorySheetVisible] = useState(false); // Step 1: Category selection
  const [isUserMusicListVisible, setIsUserMusicListVisible] = useState(false); // Step 2: Custom music list
  
  // 🎬 NEW: Lottie Animation Selection State
  const [lottieAnimation, setLottieAnimation] = useState('none'); // Selected lottie animation
  const [isAnimationModalVisible, setIsAnimationModalVisible] = useState(false); // Animation selection modal
  
  // 📜 NEW: Message History Selection State
  const [isMessageHistorySheetVisible, setIsMessageHistorySheetVisible] = useState(false); // Message history list
  
  // 🖼️ NEW: User Background Selection State
  const [isUserBackgroundSheetVisible, setIsUserBackgroundSheetVisible] = useState(false); // User background list
  const [customBackground, setCustomBackground] = useState(null); // Selected custom background (memory object)
  
  // ⭐ Validation Feedback State (for CustomBottomSheet)
  const [validationFeedback, setValidationFeedback] = useState(null); // {feedback, persona}

  // ⭐ VideoKey: Force video remount when background changes
  // Changed from useMemo to useState for manual control when background changes
  const [videoKey, setVideoKey] = useState(() => 
    `${persona?.persona_key || 'default'}-${Date.now()}`
  );

  // ⭐ tempPersona: Apply custom background to persona (without modifying original)
  const tempPersona = useMemo(() => {
    if (customBackground) {
      console.log('[MessageCreationBack] 🖼️ Applying custom background:', {
        memory_key: customBackground.memory_key,
        media_url: customBackground.media_url,
        video_url: customBackground.video_url,
        convert_done_yn: customBackground.convert_done_yn,
      });
      
      return {
        ...persona,
        selected_dress_image_url: customBackground.media_url,
        selected_dress_video_url: customBackground.video_url,
        selected_dress_video_convert_done: customBackground.convert_done_yn,
      };
    }
    return persona; // Return original persona if no custom background
  }, [persona, customBackground]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase 2+3+4+5: Animation Values
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ ANIMA Logo Animation (좌측 상단, 좌→우 슬라이드)
  const animaLogoTranslateX = useSharedValue(-100);
  const animaLogoOpacity = useSharedValue(0);
  const soulConnectionTranslateX = useSharedValue(-100);
  const soulConnectionOpacity = useSharedValue(0);
  
  // ⭐ Effects Animation (BackgroundEffect + ActiveEffect)
  const particleOpacity = useSharedValue(0);
  
  // ⭐ Gradient Animation (하단 그라데이션)
  const gradientOpacity = useSharedValue(0);
  
  // ⭐ Content Animation (메시지 영역, 좌→우 슬라이드, 감성적!)
  const contentTranslateX = useSharedValue(-300); // ⭐ 좌측 밖에서 시작
  const contentOpacity = useSharedValue(0);
  
  // ⭐ Chips Animation (우측 칩셋, 순차 바운스)
  const chipsOpacity = useSharedValue(0);
  const chip1TranslateY = useSharedValue(100);
  const chip2TranslateY = useSharedValue(100);
  const chip3TranslateY = useSharedValue(100);
  const chip4TranslateY = useSharedValue(100); // ⭐ NEW: Message history chip
  const chip5TranslateY = useSharedValue(100); // ⭐ NEW: User background chip
  
  // ⭐ Close Button Animation (상단 우측, Glassmorphic)
  const closeButtonOpacity = useSharedValue(0);
  const closeButtonScale = useSharedValue(0.8);

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase 2~5: Sequential Animation (ANIMA Logo + Effects + Gradient + Content + Chips)
  // ⭐ CRITICAL: Reset customBackground on close (cleanup)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isVisible) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✨ [MessageCreationBack] Starting sequential animation');
      console.log('   🎬 Timeline:');
      console.log('   0초: 📷 Background + 🎨 Effects + ⬆️ Gradient (동시!)');
      console.log('   0초: 🎬 ANIMA Logo (좌→우 슬라이드, 1200ms)');
      console.log('   300ms: 💬 Soul Connection (좌→우 슬라이드, 1200ms)');
      console.log('   1000ms: 📝 Content (좌→우 슬라이드, 800ms, 감성적!)');
      console.log('   1000ms: 🎪 Chips (순차 바운스, 100ms 간격)');
      console.log('   1400ms: ❌ Close Button (페이드 인 + 스케일, 600ms)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Step 0: Reset all values
      animaLogoTranslateX.value = -100;
      animaLogoOpacity.value = 0;
      soulConnectionTranslateX.value = -100;
      soulConnectionOpacity.value = 0;
      particleOpacity.value = 0;
      gradientOpacity.value = 0;
      contentTranslateX.value = -300; // ⭐ CHANGED: 좌측 밖에서 시작 (감성적!)
      contentOpacity.value = 0;
      chipsOpacity.value = 0;
      chip1TranslateY.value = 100;
      chip2TranslateY.value = 100;
      chip3TranslateY.value = 100;
      chip4TranslateY.value = 100; // ⭐ NEW
      chip5TranslateY.value = 100; // ⭐ NEW
      closeButtonOpacity.value = 0;
      closeButtonScale.value = 0.8;
      
      // Step 1: ANIMA logo (좌→우 슬라이드, 1200ms, 즉시 시작)
      animaLogoTranslateX.value = withTiming(0, { 
        duration: 1200, 
        easing: Easing.out(Easing.ease) 
      });
      animaLogoOpacity.value = withTiming(1, { 
        duration: 1200, 
        easing: Easing.out(Easing.ease) 
      });
      
      // Step 2: Soul Connection (좌→우 슬라이드, 300ms 딜레이)
      soulConnectionTranslateX.value = withDelay(
        300,
        withTiming(0, { 
          duration: 1200, 
          easing: Easing.out(Easing.ease) 
        })
      );
      soulConnectionOpacity.value = withDelay(
        300,
        withTiming(1, { 
          duration: 1200, 
          easing: Easing.out(Easing.ease) 
        })
      );
      
      // Step 3: Effects (Particle) + Gradient - 동시 시작 (800ms)
      particleOpacity.value = withTiming(1, { 
        duration: 800, 
        easing: Easing.out(Easing.ease) 
      });
      gradientOpacity.value = withTiming(1, { 
        duration: 800, 
        easing: Easing.out(Easing.ease) 
      });
      
      // Step 4: Content (좌→우 슬라이드, 1000ms 딜레이, 감성적!)
      contentTranslateX.value = withDelay(
        1000,
        withTiming(0, { 
          duration: 800, 
          easing: Easing.out(Easing.cubic) // ⭐ 감성적 Easing!
        })
      );
      contentOpacity.value = withDelay(
        1000, // ⭐ 동시에 시작 (1400 → 1000)
        withTiming(1, { 
          duration: 800, 
          easing: Easing.out(Easing.ease) 
        })
      );
      
      // Step 5: Chips (순차 바운스, 1000ms 딜레이)
      const chipDelay = 1000;
      const chipInterval = 100;
      
      chipsOpacity.value = withDelay(chipDelay, withTiming(1, { duration: 200 }));
      
      chip1TranslateY.value = withDelay(
        chipDelay,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      
      chip2TranslateY.value = withDelay(
        chipDelay + chipInterval,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      
      chip3TranslateY.value = withDelay(
        chipDelay + chipInterval * 2,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      
      // ⭐ NEW: Chip 4 (Message history)
      chip4TranslateY.value = withDelay(
        chipDelay + chipInterval * 3,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      
      // ⭐ NEW: Chip 5 (User background)
      chip5TranslateY.value = withDelay(
        chipDelay + chipInterval * 4,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      
      // Step 6: Close Button (Glassmorphic, 1400ms 딜레이, 마지막 등장)
      closeButtonOpacity.value = withDelay(
        1400,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
      );
      closeButtonScale.value = withDelay(
        1400,
        withSpring(1, { damping: 12 })
      );

      
    } else {
      // Reset on close (smooth fade-out + cleanup)
      console.log('🌙 [MessageCreationBack] Closing with fade-out');
      animaLogoOpacity.value = withTiming(0, { duration: 400 });
      soulConnectionOpacity.value = withTiming(0, { duration: 400 });
      particleOpacity.value = withTiming(0, { duration: 400 });
      gradientOpacity.value = withTiming(0, { duration: 400 });
      contentOpacity.value = withTiming(0, { duration: 400 });
      chipsOpacity.value = withTiming(0, { duration: 400 });
      closeButtonOpacity.value = withTiming(0, { duration: 400 });
      
      // ⭐ CRITICAL: Reset custom background on close
      console.log('🔄 [MessageCreationBack] Resetting customBackground to null');
      setCustomBackground(null);
    }
  }, [isVisible]);

  // ⭐ Animated Styles for ANIMA Logo
  const animaLogoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animaLogoTranslateX.value }],
    opacity: animaLogoOpacity.value,
  }));

  const soulConnectionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: soulConnectionTranslateX.value }],
    opacity: soulConnectionOpacity.value,
  }));

  // ⭐ Animated Style for Effects (Particle)
  const particleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));

  // ⭐ Animated Style for Gradient
  const gradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  // ⭐ Animated Style for Content
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: contentTranslateX.value }],
  }));

  // ⭐ Animated Styles for Chips
  const chipsContainerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chipsOpacity.value,
  }));

  const chip1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chip1TranslateY.value }],
  }));

  const chip2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chip2TranslateY.value }],
  }));

  const chip3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chip3TranslateY.value }],
  }));
  
  // ⭐ NEW: Animated Styles for Chip 4 & 5
  const chip4AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chip4TranslateY.value }],
  }));
  
  const chip5AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chip5TranslateY.value }],
  }));

  // ⭐ Animated Style for Close Button
  const closeButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: closeButtonOpacity.value,
    transform: [{ scale: closeButtonScale.value }],
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Message Input
  // ═══════════════════════════════════════════════════════════════════════════
  const handleContentSave = useCallback((value) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 [MessageCreationBack] handleContentSave CALLED!');
    console.log('   value:', value);
    console.log('   value length:', value.length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    setMessageContent(value);
    messageContentRef.current = value; // 🔧 FIX: Update ref immediately!
    setHasMessageContent(value.trim().length > 0); // ⭐ NEW: Update CenterAI Button state!
    contentInputRef.current?.dismiss();
  }, [setHasMessageContent]);

  // 🎨 P1: 2-Step Selection Handlers
  
  // Step 1: Open category sheet
  const handleOpenCategorySheet = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 [MessageCreationBack] Opening Category Sheet!');
    console.log('   Current active effect:', activeEffect);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    HapticService.light();
    setIsCategorySheetVisible(true);
  }, [activeEffect]);

  // Step 1: Close category sheet
  const handleCloseCategorySheet = useCallback(() => {
    console.log('🎨 [MessageCreationBack] Closing Category Sheet');
    setIsCategorySheetVisible(false);
  }, []);

  // Step 1: Handle category selection
  const handleSelectCategory = useCallback((category) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 [MessageCreationBack] Category selected!');
    console.log('   Category:', category.name, category.emoji);
    console.log('   Category ID:', category.id);
    console.log('   Type:', category.type);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ⭐ Type: 'direct' (없음) → 즉시 적용
    if (category.type === 'direct') {
      console.log('   Direct type - applying immediately');
      setActiveEffect('none');
      setCustomWords([]);
      setLottieAnimation('none'); // 🎬 Reset lottie
      setIsCategorySheetVisible(false);
      HapticService.success();
      return;
    }
    
    // 🎬 Special: 'lottie' category → AnimationSelectionModal
    if (category.id === 'lottie') {
      console.log('   🎬 Lottie category - opening AnimationSelectionModal');
      setSelectedCategory(category);
      setIsCategorySheetVisible(false);
      
      setTimeout(() => {
        console.log('   Opening AnimationSelectionModal (after parent closed)');
        setIsAnimationModalVisible(true);
      }, 250);
      return;
    }
    
    // ⭐ Type: 'modal' → 상세 모달 열기 (EffectDetailModal)
    console.log('   Modal type - opening EffectDetailModal');
    console.log('   Platform:', Platform.OS);
    
    setSelectedCategory(category);
    
    // ✅ iOS FIX: Close parent modal first (iOS doesn't support modal nesting well)
    // Android: Works fine with nested modals, but we'll keep consistent behavior
    console.log('   Closing parent category sheet for smooth transition');
    setIsCategorySheetVisible(false);
    
    // 250ms 딜레이로 부모 모달이 완전히 닫힌 후 자식 모달 열기
    setTimeout(() => {
      console.log('   Opening EffectDetailModal (after parent closed)');
      setIsDetailModalVisible(true);
    }, 250);
  }, []);

  // Step 2: Close detail modal
  const handleCloseDetailModal = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 [MessageCreationBack] Closing Detail Modal (AbsoluteView)');
    console.log('   Parent category sheet stays closed (as requested)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    setIsDetailModalVisible(false);
    setSelectedCategory(null);
    // ✅ Parent modal stays closed (JK님 요청사항)
  }, []);

  // Step 2: Handle effect selection
  const handleSelectEffect = useCallback((effect) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 [MessageCreationBack] Effect selected!');
    console.log('   Effect:', effect ? `${effect.name} ${effect.emoji}` : 'None');
    console.log('   DB Value:', effect?.dbValue || 'none');
    console.log('   Requires Configuration:', effect?.requiresConfiguration);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ⭐ Special: 설정이 필요한 효과 (텍스트 효과)
    if (effect?.requiresConfiguration) {
      console.log('   ⚙️ Opening word input overlay for custom words...');
      setPendingEffectConfig(effect); // 임시 저장
      
      // 🔧 FIX: 모달과 부모 시트 모두 닫기
      setIsDetailModalVisible(false);
      setIsCategorySheetVisible(false);
      
      // 단어 입력 오버레이 열기 (100ms 딜레이로 부드럽게)
      setTimeout(() => {
        wordInputRef.current?.present();
      }, 100);
      
      return;
    }
    
    // 일반 효과: 즉시 적용
    setActiveEffect(effect?.dbValue || 'none');
    
    // 텍스트 효과가 아니면 customWords 초기화
    if (!requiresConfiguration(effect?.id)) {
      setCustomWords([]);
    }
    
    // 🔧 FIX: 효과 선택 완료 → 모달과 부모 시트 모두 닫기
    setIsDetailModalVisible(false);
    setIsCategorySheetVisible(false);
    
    // Haptic feedback
    HapticService.success();
  }, []);

  // 🌌 Background Effect: 2-Step Selection Handlers
  
  // Step 1: Open background category sheet
  const handleOpenBackgroundCategorySheet = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌌 [MessageCreationBack] Opening Background Category Sheet!');
    console.log('   Current background effect:', backgroundEffect);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    HapticService.light();
    setIsBackgroundCategorySheetVisible(true);
  }, [backgroundEffect]);

  // Step 1: Handle background category selection
  const handleSelectBackgroundCategory = useCallback((category) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌌 [MessageCreationBack] Background Category selected!');
    console.log('   Category:', category.name, category.emoji);
    console.log('   ID:', category.id);
    console.log('   Platform:', Platform.OS);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ⭐ Special: '없음' 선택 시 즉시 적용
    if (category.id === 'none') {
      console.log('   None selected - applying immediately');
      setBackgroundEffect('none');
      setIsBackgroundCategorySheetVisible(false);
      HapticService.success();
      return;
    }
    
    // ⭐ 일반 카테고리 → 방향 선택 모달 열기
    console.log('   Category selected - opening detail modal');
    setSelectedBackgroundCategory(category);
    
    // ✅ iOS FIX: Close parent modal first (same as EffectCategorySheet)
    console.log('   Closing parent category sheet for smooth transition');
    setIsBackgroundCategorySheetVisible(false);
    
    // 250ms 딜레이로 부모 모달이 완전히 닫힌 후 자식 모달 열기
    setTimeout(() => {
      console.log('   Opening BackgroundEffectDetailModal (AbsoluteView)');
      setIsBackgroundDetailModalVisible(true);
    }, 250);
  }, []);

  // Step 2: Handle background effect selection (direction)
  const handleSelectBackgroundEffect = useCallback((effectId) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌌 [MessageCreationBack] Background Effect selected!');
    console.log('   Effect ID:', effectId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    setBackgroundEffect(effectId);
    
    // 🔧 FIX: 모달과 부모 시트 모두 닫기
    setIsBackgroundDetailModalVisible(false);
    setIsBackgroundCategorySheetVisible(false);
    setSelectedBackgroundCategory(null);
    
    HapticService.success();
  }, []);

  // Close handlers
  const handleCloseBackgroundCategorySheet = useCallback(() => {
    console.log('🌌 [MessageCreationBack] Closing Background Category Sheet');
    setIsBackgroundCategorySheetVisible(false);
  }, []);

  const handleCloseBackgroundDetailModal = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌌 [MessageCreationBack] Closing Background Detail Modal (AbsoluteView)');
    console.log('   Parent category sheet stays closed (as requested)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    setIsBackgroundDetailModalVisible(false);
    setSelectedBackgroundCategory(null);
    // ✅ Parent modal stays closed (same as EffectCategorySheet)
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎵 P0: Music System Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  // Step 1: Open Music Category Sheet
  const handleOpenMusicCategorySheet = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎵 [MessageCreationBack] Opening Music Category Sheet!');
    console.log('   Current music:', bgMusic);
    console.log('   Current music URL:', bgMusicUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    HapticService.light();
    setIsMusicCategorySheetVisible(true);
  }, [bgMusic, bgMusicUrl]);

  // Step 2: Handle music selection (from category or custom list)
  const handleSelectMusic = useCallback((music_key, music_url, music_title) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎵 [MessageCreationBack] Music selected!');
    console.log('   music_key:', music_key);
    console.log('   music_url:', music_url);
    console.log('   music_title:', music_title);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (music_key === 'none') {
      console.log('   None selected - applying immediately');
      setBgMusic('none');
      setBgMusicUrl('');
      setBgMusicTitle('');
      handleMusicPlayerClose();
      HapticService.success();
      return;
    }
    setBgMusic(music_key);
    setBgMusicUrl(music_url || '');
    setBgMusicTitle(music_title || '');
    
    HapticService.success();
  }, []);

  // Step 2: Open User Music List Modal (커스텀 선택)
  const handleOpenUserMusicList = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎵 [MessageCreationBack] Opening User Music List Modal!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    setIsUserMusicListVisible(true);
  }, []);

  // Close handlers
  const handleCloseMusicCategorySheet = useCallback(() => {
    console.log('🎵 [MessageCreationBack] Closing Music Category Sheet');
    setIsMusicCategorySheetVisible(false);
  }, []);

  const handleCloseUserMusicList = useCallback(() => {
    console.log('🎵 [MessageCreationBack] Closing User Music List Modal');
    setIsUserMusicListVisible(false);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 NEW: Lottie Animation Selection Handlers
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Handle animation selection
  const handleSelectAnimation = useCallback((animation) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 [MessageCreationBack] Animation selected!');
    console.log('   Name:', animation.name);
    console.log('   DB Value:', animation.dbValue);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    setLottieAnimation(animation.dbValue);
    setActiveEffect(animation.dbValue); // ✅ ActiveEffect에 전달
    setCustomWords([]); // Clear custom words (애니메이션은 단어 불필요)
    setIsAnimationModalVisible(false);
    setSelectedCategory(null);
    HapticService.success();
  }, []);
  
  // Close animation modal
  const handleCloseAnimationModal = useCallback(() => {
    console.log('🎬 [MessageCreationBack] Closing Animation Modal');
    setIsAnimationModalVisible(false);
    setSelectedCategory(null);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 📜 NEW: Message History Selection Handlers
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Open message history sheet
  const handleOpenMessageHistorySheet = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📜 [MessageCreationBack] Opening Message History Sheet!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    HapticService.light();
    setIsMessageHistorySheetVisible(true);
  }, []);
  
  // Handle message selection from history
  const handleSelectMessageFromHistory = useCallback((message) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📜 [MessageCreationBack] Message selected from history!');
    console.log('   message_title:', message.message_title);
    console.log('   message_content:', message.message_content);
    console.log('   effect_config:', message.effect_config);
    console.log('   bg_music:', message.bg_music);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ⭐ Apply message settings to current state
    setMessageContent(message.message_content || '');
    messageContentRef.current = message.message_content || '';
    
    // ⭐ Parse effect_config (JSON or already parsed object)
    let effectConfig = {};
    try {
      // ⭐ Check if effect_config is already an object or a string
      if (typeof message.effect_config === 'string') {
        effectConfig = JSON.parse(message.effect_config);
      } else if (typeof message.effect_config === 'object' && message.effect_config !== null) {
        effectConfig = message.effect_config; // Already parsed!
      } else {
        effectConfig = {};
      }
      
      console.log('✅ [MessageCreationBack] Parsed effect_config:', effectConfig);
    } catch (error) {
      console.error('[MessageCreationBack] Failed to parse effect_config:', error);
      effectConfig = {};
    }
    
    // ⭐ Apply background effect (Layer 1)
    setBackgroundEffect(effectConfig.background_effect || 'none');
    
    // ⭐ Apply active effect (Layer 2)
    setActiveEffect(effectConfig.active_effect || message.particle_effect || 'none');
    
    // ⭐ Apply custom words (for text effects)
    setCustomWords(effectConfig.custom_words || []);
    
    // ⭐ Apply background music
    setBgMusic(message.bg_music || 'none');
    setBgMusicUrl(message.bg_music_url || '');
    setBgMusicTitle(message.ai_music_key ? 'AI Generated Music' : ''); // ⭐ TODO: Get actual title
    
    // ⭐ Close sheet
    setIsMessageHistorySheetVisible(false);
    
    HapticService.success();
    /*
    showAlert({
      title: t('message.history.applied_title') || '설정 적용 완료!',
      emoji: '✅',
      message: t('message.history.applied_message') || '이전 메시지의 설정이 적용되었습니다.\n내용을 수정하여 새로운 메시지를 만들어보세요!',
      buttons: [
        {
          text: t('common.confirm') || '확인',
          style: 'primary',
          onPress: () => {
            // ⭐ Focus on content input for editing
            setTimeout(() => {
              contentInputRef.current?.present();
            }, 300);
          }
        }
      ]
    });
    */
  }, [t, showAlert]);
  
  // Close message history sheet
  const handleCloseMessageHistorySheet = useCallback(() => {
    console.log('📜 [MessageCreationBack] Closing Message History Sheet');
    setIsMessageHistorySheetVisible(false);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🖼️ NEW: User Background Selection Handlers (일단 칩만, 기능은 추후)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Open user background sheet
  const handleOpenUserBackgroundSheet = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖼️ [MessageCreationBack] Opening user background sheet');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    HapticService.light();
    setIsUserBackgroundSheetVisible(true);
  }, []);

  // Handle background selection
  const handleSelectBackground = useCallback((memory) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖼️ [MessageCreationBack] Background selected!');
    console.log('   memory_key:', memory.memory_key);
    console.log('   media_url:', memory.media_url);
    console.log('   video_url:', memory.video_url);
    console.log('   convert_done_yn:', memory.convert_done_yn);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Apply custom background
    setCustomBackground(memory);
    
    // ⭐ Force video remount by updating videoKey
    const newVideoKey = `${persona?.persona_key}-${memory.memory_key}-${Date.now()}`;
    console.log('[MessageCreationBack] 🔄 Updating videoKey:', newVideoKey);
    setVideoKey(newVideoKey);
    
    HapticService.success();
  }, [persona?.persona_key]);

  // Handle reset to original persona background
  const handleResetBackground = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 [MessageCreationBack] Reset to original background');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Clear custom background
    setCustomBackground(null);
    
    // ⭐ Force video remount by updating videoKey
    const newVideoKey = `${persona?.persona_key || 'default'}-${Date.now()}`;
    console.log('[MessageCreationBack] 🔄 Updating videoKey:', newVideoKey);
    setVideoKey(newVideoKey);
    
    HapticService.light();
  }, [persona?.persona_key]);

  // Handle music player close (pause, not reset)
  const handleMusicPlayerClose = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎵 [MessageCreationBack] Music player close pressed (pause)');
    console.log('   Music will remain paused, not reset');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // ⭐ No state change - just pause (handled by FloatingMusicPlayer internally)
    // Music stays "active" (bgMusic !== 'none'), just paused
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════

  // 🎨 P1: Custom words save handler
  const handleWordsSave = useCallback((words) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 [MessageCreationBack] Custom words saved!');
    console.log('   Words:', words);
    console.log('   Pending effect:', pendingEffectConfig?.name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 단어 저장
    setCustomWords(words);
    
    // 효과 적용
    if (pendingEffectConfig) {
      setActiveEffect(pendingEffectConfig.dbValue);
      setPendingEffectConfig(null);
    }
    
    // 오버레이 닫기
    wordInputRef.current?.dismiss();
    
    // Haptic feedback
    HapticService.success();
  }, [pendingEffectConfig]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 CRITICAL: Sync messageContentRef with state (avoid stale closure)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    console.log('[MessageCreationBack] 🔄 Syncing messageContentRef with state');
    console.log('   messageContent:', messageContent);
    messageContentRef.current = messageContent;
  }, [messageContent]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ NEW: Cleanup all message states when component closes
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isVisible) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[MessageCreationBack] 🧹 Cleaning up - resetting ALL message states');
      console.log('   Current messageContent:', messageContent);
      console.log('   Current messageContentRef:', messageContentRef.current);
      console.log('   → Resetting to empty...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // ⭐ Reset ALL message-related states
      setHasMessageContent(false); // CenterAI Button state
      setMessageContent(''); // ⭐ Message content state
      messageContentRef.current = ''; // ⭐ Message content ref (stale closure prevention)
    }
  }, [isVisible, messageContent, setHasMessageContent]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 NEW: 감성적 텍스트 애니메이션 (좌→우 슬라이드 + 페이드 인)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // ⭐ Skip on first mount (already handled by isVisible effect)
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      console.log('[MessageCreationBack] 🎨 First mount, skipping text animation');
      return;
    }

    // ⭐ Skip if content is empty (no animation needed)
    if (!messageContent.trim()) {
      console.log('[MessageCreationBack] 🎨 Content is empty, skipping text animation');
      return;
    }

    // ⭐ Skip if not visible
    if (!isVisible) {
      console.log('[MessageCreationBack] 🎨 Not visible, skipping text animation');
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ [MessageCreationBack] 감성적 텍스트 애니메이션 시작!');
    console.log('   messageContent:', messageContent.substring(0, 50) + '...');
    console.log('   Animation: 좌측 밖 (-300) → 우측 (0)');
    console.log('   Duration: 800ms (감성적!)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Step 1: 초기화 (좌측 밖, 투명)
    contentTranslateX.value = -300; // ⭐ 좌측 밖에서 시작
    contentOpacity.value = 0;

    // Step 2: 짧은 딜레이 후 애니메이션 시작 (100ms)
    setTimeout(() => {
      // ⭐ 좌→우 슬라이드 (부드럽게!)
      contentTranslateX.value = withTiming(0, {
        duration: 800,
        easing: Easing.out(Easing.cubic), // ⭐ 감성적 Easing
      });

      // ⭐ 페이드 인 (동시에!)
      contentOpacity.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      });
    }, 500); // ⭐ 짧은 딜레이 (애니메이션 준비)

  }, [messageContent, isVisible]); // ⭐ messageContent 변경 시 트리거

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ Fallback 감성 메시지 (LLM 생성 실패 시에만 사용)
  // ═══════════════════════════════════════════════════════════════════════════
  const FALLBACK_VALIDATION_MESSAGE = useMemo(() => ({
    title: '조금만 수정해주세요 ✨',
    message: `메시지에 조금 걱정되는 부분이 있어요.\n\nANIMA는 긍정적이고 건강한 소통을 지향합니다.\n\n다시 한번 생각해보고 작성해주실래요?\n함께 멋진 메시지를 만들어봐요! 💫`
  }), []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ Message Validation (LLM-based content safety check)
  // ═══════════════════════════════════════════════════════════════════════════
  const validateMessage = useCallback(async (content) => {
    try {
      console.log('💙 [MessageCreationBack] Starting message validation (Persona Voice)...');
      
      const result = await messageApi.validateMessage(
        content,
        persona?.persona_key, // ⭐ Persona Key for voice/tone
        user?.user_key        // ⭐ User Key for relationship data
      );
      
      console.log('✅ [MessageCreationBack] Validation result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ [MessageCreationBack] Validation error:', error);
      // ⭐ Fail-safe: Return safe by default
      return { 
        safe: true, 
        feedback: { 
          title: t('message.validation.error_title') || '메시지 검증 오류', 
          message: t('message.validation.error_message') || '메시지 검증 중 문제가 발생했습니다.' 
        } 
      };
    }
  }, [t, persona, user]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ Proceed Generation (실제 메시지 생성 - LLM 검증 포함)
  // ═══════════════════════════════════════════════════════════════════════════
  const proceedGeneration = useCallback(async () => {
    try {
      setIsCreating(true);
      setProcessingMessage(t('message.validation.validating') || '메시지 검증 중...');
      HapticService.success();

      // 🔧 CRITICAL FIX: Use ref to get latest messageContent
      const currentContent = messageContentRef.current;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 [MessageCreationBack] PROCEED GENERATION');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('   messageContent (REF):', currentContent);
      
      // ═══════════════════════════════════════════════════════════════
      // Step 1: LLM Validation
      // ═══════════════════════════════════════════════════════════════
      const validation = await validateMessage(currentContent);
      
      console.log('📊 [MessageCreationBack] Validation result:', validation);
      
      if(validation.success){
        
        if (!validation.safe) {
          // ⚠️ Validation Failed
          console.log('❌ [MessageCreationBack] Validation failed!');
          console.log('   Category:', validation.category);
          console.log('   Feedback:', validation.feedback);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          setIsCreating(false);
          setProcessingMessage('');
          HapticService.warning();
          

          /*
          showAlert({
            title: feedbackMessage.title,
            emoji: feedbackMessage.emoji || '💙',
            message: feedbackMessage.message,
            buttons: [
              {
                text: t('message.validation.rewrite_button') || '다시 작성하기',
                style: 'primary',
                onPress: () => {
                  console.log('[MessageCreationBack] User will rewrite message');
                  HapticService.light();
                  // ⭐ Focus on content input for rewrite
                  setTimeout(() => {
                    contentInputRef.current?.present();
                  }, 300);
                }
              }
            ]
          });
          */

          // ⭐ Use LLM-generated feedback (or fallback)
          const feedbackMessage = validation.feedback || FALLBACK_VALIDATION_MESSAGE;
      
          // ⭐ Store validation feedback for CustomBottomSheet
          setValidationFeedback({
              feedback: feedbackMessage,
              persona: validation.persona // ⭐ Persona info (name, image_url, video_url)
          });
          
          // ⭐ Open CustomBottomSheet with persona voice feedback
          setTimeout(() => {
              validationFeedbackSheetRef.current?.present();
          }, 100);
      
          
          return;
        }
        // ═══════════════════════════════════════════════════════════════
        // ✅ Validation Passed: Proceed with message creation
        // ═══════════════════════════════════════════════════════════════
        console.log('✅ [MessageCreationBack] Validation passed! Creating message...');
        setProcessingMessage(t('message.creation.creating') || '메시지 생성 중...');

        // ⭐ Generate title from first 30 chars of content
        const autoTitle = currentContent.length > 30 
          ? currentContent.substring(0, 30) + '...'
          : currentContent;

        // ⭐ Build effect_config with 2-Layer System
        const effectConfig = {
          background_effect: backgroundEffect !== 'none' ? backgroundEffect : null,
          active_effect: activeEffect !== 'none' ? activeEffect : null,
          custom_words: customWords.length > 0 ? customWords : null,
        };

        console.log('customBackground', customBackground);


        const response = await messageService.createMessage({
          user_key: user?.user_key,
          persona_key: persona?.persona_key,
          // ⭐ CRITICAL: Use custom background's memory_key if selected
          memory_key: customBackground 
            ? customBackground.memory_key 
            : persona?.history_key,
          message_title: autoTitle,
          message_content: currentContent,
          text_animation: 'slide_cross', // ⭐ Fixed: 슬라이드 효과
          particle_effect: activeEffect, // ⭐ 2-Layer System: activeEffect (backward compatibility)
          bg_music: bgMusic || 'none',
          bg_music_url: bgMusicUrl,
          effect_config: effectConfig, // ⭐ 2-Layer System
          persona_name: persona?.persona_name,
          // ⭐ CRITICAL: Apply custom background if selected, otherwise use original persona
          persona_image_url: customBackground 
            ? customBackground.media_url 
            : persona?.selected_dress_image_url,
          persona_video_url: customBackground 
            ? customBackground.video_url 
            : persona?.selected_dress_video_url,
          has_password: 'N',
          public_yn: 'Y',
        });

        if (response.data.success && response.data.data.short_code) {
          console.log('✅ [MessageCreationBack] Message created successfully');
          
          const shareUrl = `https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/m/${persona?.persona_key}/${response.data.data.short_code}`;
          
          // ⭐ Update Context (Badge + URL)
          setHasNewMessage(true);
          setCreatedMessageUrl(shareUrl);
          
          // ⭐ Show AnimaAlert (with share option)
          HapticService.success();
          showAlert({
            title: t('message.create_done_alert.title') || '메시지 생성 완료!',
            emoji: '🎉',
            message: t('message.create_done_alert.description') || '메시지가 성공적으로 생성되었습니다.\n지금 바로 공유하시겠습니까?',
            buttons: [
              {
                text: t('common.confirm') || '확인',
                style: 'primary',
                onPress: () => {
                  console.log('[MessageCreationBack] User acknowledged, closing...');
                  onClose(); // ⭐ Close the back view
                }
              }
            ]
          });
        }
  
      }else{

        console.log('validation', validation);

        if(validation.errorCode === 'MESSAGE_LIMIT_EXCEEDED'){
          showAlert({
            title: t('message.validation.limit_exceeded_title'),
            emoji: '❌',
            message: t('message.validation.limit_exceeded_message', { tier: user?.user_level, count: validation?.limit_count, time_until_reset: validation?.time_until_reset }),
            buttons: [
              {
                text: t('common.cancel'),
                style: 'cancel',
                onPress: () => {
                  
                }
              },
              {
                text: t('common.confirm'),
                style: 'primary',
                onPress: () => {
                  onUpgradeTier();
                  onClose();
                }
              }
            ]
          });
          return;
        }
        else{
          showAlert({
            title: t('common.error_title'),
            emoji: '❌',
            message: t('common.error'),
            buttons: [
              {
                text: t('common.confirm'),
                style: 'primary',
                onPress: () => {
                  onClose();
                }
              }
            ]
          });
          return;
        }
      }
      
    } catch (error) {
      console.error('[MessageCreationBack] Create message error:', error);
      showAlert({
        title: t('common.error_title') || '오류발생',
        emoji: '❌',
        message: t('common.error') || '메시지 생성에 실패했습니다.',
        buttons: [
          {
            text: t('common.confirm') || '확인',
            style: 'primary',
            onPress: () => {
              console.log('[MessageCreationBack] Error acknowledged');
            }
          }
        ]
      });
    } finally {
      setIsCreating(false);
      setProcessingMessage('');
    }
  }, [
    messageContentRef,
    customWords,
    user,
    persona,
    customBackground, // ⭐ ADDED: For custom background branch decision
    backgroundEffect,
    activeEffect,
    bgMusic,
    bgMusicUrl,
    validateMessage,
    setHasNewMessage,
    setCreatedMessageUrl,
    showAlert,
    t,
    onClose,
    onUpgradeTier,
    FALLBACK_VALIDATION_MESSAGE
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Generate URL (CustomTabBar Integration)
  // ⭐ 개선: 클라이언트 검증만 수행, LLM 검증은 proceedGeneration()에서!
  // ═══════════════════════════════════════════════════════════════════════════
  const handleGenerateURL = useCallback(() => {
    // 🔧 CRITICAL FIX: Use ref to get latest messageContent (avoid stale closure!)
    const currentContent = messageContentRef.current;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 [MessageCreationBack] GENERATE URL CLICKED (via CustomTabBar)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 [DEBUG] Current messageContent (REF):', currentContent);
    console.log('📊 [DEBUG] messageContent length:', currentContent.length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 1️⃣ CLIENT VALIDATION: Content Required
    // ═══════════════════════════════════════════════════════════════════════════
    if (!currentContent.trim()) {
      console.log('❌ [MessageCreationBack] Content is empty!');
      
      HapticService.warning();
      showAlert({
        title: t('message.validation.content_required'),
        emoji: '✍️',
        message: t('message.errors.content_required_description'),
        buttons: [
          { 
            text: t('common.confirm'), 
            style: 'cancel',
            onPress: () => {
              setTimeout(() => {
                contentInputRef.current?.present();
              }, 300);
            }
          }
        ]
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2️⃣ CLIENT VALIDATION: Effects Check (Optional, can skip)
    // ═══════════════════════════════════════════════════════════════════════════
    const hasEffects = backgroundEffect !== 'none' || activeEffect !== 'none' || bgMusic !== 'none';
    
    if (!hasEffects) {
      console.log('⚠️ [MessageCreationBack] No effects selected (will ask user)');
      
      // Build status message
      const statusMessage = `
📝 ${t('message.validation.status_content')}: ${t('message.validation.status_complete')}
🌌 ${t('message.validation.status_background')}: ${t('message.validation.status_not_selected')}
✨ ${t('message.validation.status_particle')}: ${t('message.validation.status_not_selected')}
🎵 ${t('message.validation.status_music')}: ${t('message.validation.status_not_selected')}
      `.trim();
      
      HapticService.light();
      showAlert({
        title: t('message.validation.confirm_title'),
        emoji: '📝',
        message: `${t('message.validation.confirm_partial')}`,
        buttons: [
          { 
            text: t('message.validation.button_cancel'), 
            style: 'cancel',
            onPress: () => HapticService.light()
          },
          { 
            text: t('message.validation.button_create'), 
            style: 'primary',
            onPress: () => {
              console.log('[MessageCreationBack] User confirmed creation without effects');
              proceedGeneration(); // ⭐ LLM 검증은 여기서!
            }
          }
        ]
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3️⃣ FINAL CONFIRMATION: Show selected effects
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('✅ [MessageCreationBack] Effects selected, showing final confirmation');
    
    // Build detailed status (simplified for now, full effect labels in Phase 2)
    const detailedStatus = `
📝 ${t('message.validation.status_content')}: ${t('message.validation.status_complete')}
🌌 ${t('message.validation.status_background')}: ${backgroundEffect !== 'none' ? backgroundEffect : t('message.validation.status_not_selected')}
✨ ${t('message.validation.status_particle')}: ${activeEffect !== 'none' ? activeEffect : t('message.validation.status_not_selected')}
🎵 ${t('message.validation.status_music')}: ${bgMusic !== 'none' ? bgMusic : t('message.validation.status_not_selected')}
    `.trim();
    
    HapticService.warning();
    showAlert({
      title: t('message.validation.final_confirm_title'),
      emoji: '⚠️',
      message: `${t('message.validation.final_confirm_message')}`,
      buttons: [
        { 
          text: t('message.validation.button_recheck'), 
          style: 'cancel',
          onPress: () => HapticService.light()
        },
        { 
          text: t('message.validation.button_create'), 
          style: 'destructive',
          onPress: () => {
            console.log('[MessageCreationBack] User confirmed final creation');
            proceedGeneration(); // ⭐ LLM 검증은 여기서!
          }
        }
      ]
    });
  }, [
    messageContentRef,
    backgroundEffect,
    activeEffect,
    bgMusic,
    showAlert,
    t,
    proceedGeneration
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 CRITICAL: Store handler in ref to avoid recreating on every render
  // ═══════════════════════════════════════════════════════════════════════════
  const handleGenerateURLRef = useRef(null);
  
  useEffect(() => {
    handleGenerateURLRef.current = handleGenerateURL;
  }, [handleGenerateURL]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 CRITICAL: Register message create handler with CustomTabBar
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 [MessageCreationBack] useEffect (Registration) triggered!');
    console.log('   isVisible:', isVisible);
    console.log('   setMessageCreateHandler exists:', !!setMessageCreateHandler);
    console.log('   setIsMessageCreationActive exists:', !!setIsMessageCreationActive);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (isVisible && setMessageCreateHandler && setIsMessageCreationActive) {
      console.log('[MessageCreationBack] 🎯 Registering message create handler...');
      
      // 🔧 SAME AS MessageCreationOverlay: Create wrapper that calls latest ref
      const wrapperHandler = () => {
        console.log('[MessageCreationBack] 🎯 Handler called from CustomTabBar!');
        if (handleGenerateURLRef.current) {
          handleGenerateURLRef.current();
        } else {
          console.error('[MessageCreationBack] ❌ handleGenerateURLRef.current is NULL!');
        }
      };
      
      // ⭐ CRITICAL FIX: Register handler FIRST!
      setMessageCreateHandler(() => wrapperHandler);
      console.log('[MessageCreationBack] ✅ Handler registered successfully!');
      
      // ⭐ CRITICAL FIX: Then activate message creation mode!
      // This ensures handler is ready BEFORE CustomTabBar icon changes!
      setIsMessageCreationActive(true);
      console.log('[MessageCreationBack] ✅ Message creation mode activated (CustomTabBar will update)');
      
      return () => {
        console.log('[MessageCreationBack] 🎯 Cleaning up: unregistering handler and deactivating mode...');
        // ⭐ Cleanup in reverse order
        setIsMessageCreationActive(false);
        setMessageCreateHandler(null);
        console.log('[MessageCreationBack] ✅ Cleanup complete!');
      };
    } else {
      if (!isVisible) {
        console.log('[MessageCreationBack] ⚠️ Not visible, skipping registration');
      }
      if (!setMessageCreateHandler) {
        console.log('[MessageCreationBack] ⚠️ setMessageCreateHandler is NULL!');
      }
      if (!setIsMessageCreationActive) {
        console.log('[MessageCreationBack] ⚠️ setIsMessageCreationActive is NULL!');
      }
    }
  }, [isVisible, setMessageCreateHandler, setIsMessageCreationActive]); // ⭐ Add setIsMessageCreationActive!

  // ⭐ Android Back Button Handler (ANIMA 표준 처리)
  useEffect(() => {
    if (!isVisible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('[MessageCreationBack] 🔙 Back button pressed, closing message creation back');
      HapticService.medium();
      onClose();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [isVisible, onClose, onUpgradeTier]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render: Phase 1~5 - Background + Effects + ANIMA Logo + Gradient + Content + Chips
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🎬 Phase 1: Background (Image/Video) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <PersonaBackgroundView
        persona={tempPersona} // ⭐ Use tempPersona (applies custom background if selected)
        isScreenFocused={isVisible} // ⭐ Control video playback based on visibility
        opacity={1} // ⭐ Full opacity (no fade)
        videoKey={videoKey} // ⭐ Force remount when background changes
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🌌 Phase 6: BackgroundEffect (Layer 1 - 배경 레이어) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {backgroundEffect && backgroundEffect !== 'none' && (
        <BackgroundEffect 
          type={backgroundEffect}
          isActive={isVisible}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ✨ Phase 2: ActiveEffect (Layer 2 - 액티브 레이어) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Animated.View 
        style={[
          styles.effectsLayer,
          particleAnimatedStyle
        ]}
        pointerEvents="none"
      >
        {/* ⭐ ActiveEffect (Layer 2) - 기본 효과만 표시 (테스트용) */}
        <ActiveEffect 
          type={activeEffect === 'none' ? null : activeEffect} // 🎨 P1: Dynamic effect from state
          isActive={isVisible && activeEffect !== 'none'}
          customWords={activeEffect === 'fading_messages' ? customWords : []} // 🎨 P1: Custom words for text effect
        />
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🎨 Phase 3: ANIMA Logo Animation (Top-Left) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <View style={styles.animaLogoContainer}>
        {/* ANIMA - Gradient Text (SVG) */}
        <Animated.View style={animaLogoAnimatedStyle}>
          <Svg height={scale(30)} width={scale(105)}>
            <Defs>
              {/* ✨ 2. Next.js와 동일한 그라디언트 색상으로 변경합니다. */}
              <SvgLinearGradient id="animaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="rgb(255, 255, 255)" stopOpacity="1" />
                <Stop offset="100%" stopColor="#06B6D4" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <SvgText
              fill="url(#animaGradient)"
              // ✨ 3. Next.js와 동일한 폰트 사이즈와 속성으로 변경합니다.
              fontSize={scale(30)} // '22px'에 해당하는 scale 값
              fontWeight="bold"  // '700'
              x="0"
              y={scale(25)}      // 폰트 사이즈에 맞춰 y 위치 조절
              letterSpacing="0.5"// '0.3px'
            >
              Create
            </SvgText>
          </Svg>
        </Animated.View>

        {/* Soul Connection - Subtitle */}
        <Animated.View style={soulConnectionAnimatedStyle}>
          <CustomText style={styles.animaLogoSubtitle}>
            - Soul Message
          </CustomText>
        </Animated.View>
      </View>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 📊 Phase 4: Bottom Gradient + Content */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Animated.View style={[
        styles.gradientContainer,
        gradientAnimatedStyle
      ]}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        >
          <Animated.View style={[
            styles.contentContainer, 
            { paddingBottom: Platform.OS === 'ios' ? insets.bottom + platformPadding(25) : verticalScale(50) },
            contentAnimatedStyle
          ]}>
            <ScrollView style={{ maxHeight: verticalScale(150)}} showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={() => {
              console.log('[MessageCreationBack] 💬 Content area clicked, opening MessageInputOverlay');
              HapticService.light();
              contentInputRef.current?.present();
            }}>
              <CustomText type="title" italic style={styles.content}>
                {messageContent || t('message.creation.empty')}
              </CustomText>
            </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🎪 Phase 5: Quick Action Chips (Right Side) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Animated.View style={[
        styles.quickChipsContainer,
        { top: insets.top + verticalScale(120) },
        chipsContainerAnimatedStyle
      ]}>
        {/* Chip 1: Placeholder (예: 이모션 프리셋) */}
        {/* Chip 1: Background Effect 🌌 - ⚠️ DISABLED (당분간 제공 안함) */}
        <Animated.View style={[chip1AnimatedStyle, { display: 'none' }]}>
          <TouchableOpacity
            style={[
              styles.quickChip,
              backgroundEffect !== 'none' && { backgroundColor: 'rgba(176, 224, 230, 0.25)' }
            ]}
            onPress={handleOpenBackgroundCategorySheet}
            activeOpacity={0.7}
          >
            <Icon name="weather-sunny" size={scale(20)} color="#B0E0E6" />
          </TouchableOpacity>
        </Animated.View>

        {/* Chip 2: Active Effect */}
        <Animated.View style={chip2AnimatedStyle}>
          <TouchableOpacity
            style={styles.quickChip}
            onPress={handleOpenCategorySheet}
            activeOpacity={0.7}
          >
            <Icon name="shimmer" size={scale(20)} color="gold" />
            
            {/* ⭐ NEW: Badge when effect is selected */}
            {activeEffect !== 'none' && (
              <View style={styles.chipBadge}>
                <Icon name="check-circle" size={scale(14)} color="#4CAF50" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Chip 3: Background Music */}
        <Animated.View style={chip3AnimatedStyle}>
          <TouchableOpacity
            style={[
              styles.quickChip,
              bgMusic !== 'none' && { backgroundColor: 'rgba(255, 105, 180, 0.25)' }
            ]}
            onPress={handleOpenMusicCategorySheet}
            activeOpacity={0.7}
          >
            <Icon name="music-note" size={scale(20)} color="#FF69B4" />
            
            {/* ⭐ NEW: Badge when music is selected */}
            {bgMusic !== 'none' && (
              <View style={styles.chipBadge}>
                <Icon name="check-circle" size={scale(14)} color="#4CAF50" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
        
        {/* ⭐ NEW: Chip 4: Message History */}
        <Animated.View style={chip4AnimatedStyle}>
          <TouchableOpacity
            style={styles.quickChip}
            onPress={handleOpenMessageHistorySheet}
            activeOpacity={0.7}
          >
            <Icon name="clock-time-ten-outline" size={scale(20)} color="#9D4EDD" />
          </TouchableOpacity>
        </Animated.View>
        
        {/* ⭐ NEW: Chip 5: User Background (Coming Soon) */}
        <Animated.View style={chip5AnimatedStyle}>
          <TouchableOpacity
            style={styles.quickChip}
            onPress={handleOpenUserBackgroundSheet}
            activeOpacity={0.7}
          >
            <Icon name="image-outline" size={scale(20)} color="#06B6D4" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ❌ Phase 7: Close Button (Glassmorphic Floating) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Animated.View style={[
        styles.closeButtonContainer,
        { top: insets.top +  Platform.OS === 'ios' ? verticalScale(-20) : verticalScale(20) },
        closeButtonAnimatedStyle
      ]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            console.log('[MessageCreationBack] ❌ Close button pressed');
            HapticService.medium();
            onClose();
          }}
          activeOpacity={0.7}
        >
          <Icon name="close-circle" size={scale(28)} color="rgba(255, 255, 255, 0.9)" />
        </TouchableOpacity>
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 💬 Message Input Overlay (Business Logic) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <MessageInputOverlay
        ref={contentInputRef}
        title={t('message.input.title') || '내용 입력'}
        placeholder={t('message.input.placeholder') || '메시지 내용을 입력하세요'}
        leftIcon="text"
        initialValue={messageContent}
        maxLength={500}
        multiline={true}
        onSave={handleContentSave}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🎨 P1: 2-Step Selection System */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      
      {/* Step 1: Category Selection */}
      <EffectCategorySheet
        visible={isCategorySheetVisible}
        onClose={handleCloseCategorySheet}
        onSelectCategory={handleSelectCategory}
      />
      
      {/* Step 2: Effect Detail Modal */}
      <EffectDetailModal
        visible={isDetailModalVisible}
        onClose={handleCloseDetailModal}
        category={selectedCategory}
        currentEffect={getEffectById(activeEffect)}
        onSelectEffect={handleSelectEffect}
      />
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🎬 NEW: Lottie Animation Selection Modal */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimationSelectionModal
        visible={isAnimationModalVisible}
        onClose={handleCloseAnimationModal}
        onSelectAnimation={handleSelectAnimation}
        currentAnimation={lottieAnimation}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🌌 Background Effect: 2-Step Selection System */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      
      {/* Step 1: Background Category Selection */}
      <BackgroundEffectCategorySheet
        visible={isBackgroundCategorySheetVisible}
        currentEffect={backgroundEffect}
        onSelectCategory={handleSelectBackgroundCategory}
        onClose={handleCloseBackgroundCategorySheet}
      />
      
      {/* Step 2: Background Direction Selection Modal */}
      <BackgroundEffectDetailModal
        visible={isBackgroundDetailModalVisible}
        category={selectedBackgroundCategory}
        currentEffectId={backgroundEffect}
        onSelectEffect={handleSelectBackgroundEffect}
        onClose={handleCloseBackgroundDetailModal}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🎨 P1: Custom Words Input Overlay (for fading_messages) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <WordInputOverlay
        ref={wordInputRef}
        title={t('message.word.title') || '단어 입력'}
        subtitle={t('message.word.subtitle') || '메시지에 표시할 단어를 입력하세요 (최대 5개)'}
        placeholder={t('message.word.placeholder') || '예: 사랑해, 영원히, 함께'}
        maxWords={5}
        initialWords={customWords}
        onSave={handleWordsSave}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🎵 P0: Music System - Step 1: Category Selection */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <MusicCategorySheet
        visible={isMusicCategorySheetVisible}
        onClose={handleCloseMusicCategorySheet}
        onSelectMusic={handleSelectMusic}
        onOpenCustomModal={handleOpenUserMusicList}
        currentMusicKey={bgMusic}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🎵 P0: Music System - Step 2: User Music List */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <UserMusicListModal
        visible={isUserMusicListVisible}
        onClose={handleCloseUserMusicList}
        onSelectMusic={handleSelectMusic}
        currentMusicKey={bgMusic}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🎵 P0: Music System - Floating Player (ANIMA 로고 하단) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <FloatingMusicPlayer
        music_url={bgMusicUrl}
        music_title={bgMusicTitle}
        visible={bgMusic !== 'none' && bgMusicUrl !== ''}
        onClose={handleMusicPlayerClose}
      />

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 📜 NEW: Message History Sheet (Previous Messages) */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <MessageHistorySheet
        visible={isMessageHistorySheetVisible}
        onClose={handleCloseMessageHistorySheet}
        onSelectMessage={handleSelectMessageFromHistory}
      />

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 🖼️ NEW: Background Selection Sheet (User-Created Backgrounds) */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <BackgroundSelectionSheet
        isOpen={isUserBackgroundSheetVisible}
        onClose={() => setIsUserBackgroundSheetVisible(false)}
        onSelectBackground={handleSelectBackground}
        onResetBackground={handleResetBackground}
        currentBackground={customBackground}
      />

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 💙 Validation Feedback (Persona Voice with Image/Video) */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <CustomBottomSheet
        ref={validationFeedbackSheetRef}
        snapPoints={['60%']}
        title={'From. ' + persona?.persona_name}
        buttons={[
          {
            title: t('common.rewrite'),
            type: 'primary',
            onPress: () => {
              validationFeedbackSheetRef.current?.dismiss();
              HapticService.light();
              // Focus on content input for rewrite
              setTimeout(() => {
                contentInputRef.current?.present();
              }, 300);
            }
          }
        ]}
      >
        {validationFeedback && (
          <View style={{
            flex: 1,
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(20),
            paddingBottom: verticalScale(20),
          }}>
            {/* Title */}
            <CustomText style={{
              fontSize: scale(18),
              fontWeight: '700',
              color: 'white',
              marginBottom: verticalScale(20),
              textAlign: 'center',
            }}>
              {validationFeedback.feedback.title || '💙'}
            </CustomText>

            {/* Content: Persona Image/Video (Left) + Message (Right) */}
            <View style={{
              flexDirection: 'row',
              gap: scale(16),
              marginBottom: verticalScale(24),
            }}>
              {/* Left: Persona Image/Video */}
              {persona?.persona_key && (
                <View style={{
                  width: scale(100),
                  height: scale(100),
                  borderRadius: scale(12),
                  overflow: 'hidden',
                  backgroundColor: currentTheme.border,
                }}>
                <Image
                    source={{ uri: persona?.selected_dress_image_url }}
                    style={{ width: '100%', height: '100%', backgroundColor:'blue' }}
                    resizeMode="cover"
                />
                </View>
              )}

              {/* Right: Feedback Message */}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <CustomText style={{
                  fontSize: scale(15),
                  lineHeight: scale(22),
                  color: currentTheme.textSecondary,
                }}>
                  {validationFeedback.feedback.message}
                </CustomText>
              </View>
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
              <CustomText type='middle' bold style={{
               
              }}>
                {t('common.rejected_message_description')}
              </CustomText>
            </View>

          </View>
        )}
      </CustomBottomSheet>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ⭐ Processing Loading Overlay (Validation & Creation) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <ProcessingLoadingOverlay
        visible={isCreating}
        message={processingMessage}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles (Phase 1~5: Complete Animation System)
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // ⭐ Fallback background
  },
  // ⭐ Effects Layer (for ActiveEffect)
  effectsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50, // ⭐ Above background (0), below ANIMA logo (100)
    ...Platform.select({
      android: { elevation: 50 },
    }),
  },
  // ⭐ ANIMA Logo Container (Top-Left)
  animaLogoContainer: {
    position: 'absolute',
    top: verticalScale(20), // ⭐ 헤더 아래 (약간의 여유 공간)
    left: scale(20),
    zIndex: 100, // ⭐ Above everything
    elevation: 100,
    flexDirection: 'column',
    gap: verticalScale(4),
  },
  animaLogoSubtitle: {
    fontSize: scale(18),
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // ⭐ Gradient Container (Bottom)
  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999, // ⭐ Top layer (for content)
    ...Platform.select({
      android: { elevation: 99999 },
    }),
  },
  gradient: {
    justifyContent: 'flex-end',
    marginTop: 'auto',
    height: 'auto',
  },
  contentContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(-20),

  },
  content: {
    fontSize: scale(16),
    textAlign: 'left',
    color: '#FFFFFF',
    lineHeight: scale(24),
    marginTop:'auto',
    fontStyle: 'italic',

  },
  // ⭐ Quick Chips Container (Right Side)
  quickChipsContainer: {
    position: 'absolute',
    right: scale(16),
    gap: verticalScale(10),
    zIndex: 200, // ⭐ Above gradient
    elevation: 200,
  },
  quickChip: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  // ⭐ NEW: Badge indicator (top-right overlay)
  chipBadge: {
    position: 'absolute',
    top: scale(-2),
    right: scale(-2),
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 6 },
    }),
  },
  // ⭐ Close Button (Glassmorphic Floating)
  closeButtonContainer: {
    position: 'absolute',
    right: scale(20), // ⭐ 상단 우측
    zIndex: 300, // ⭐ 모든 것 위에 (최상단)
    elevation: 300,
  },
  closeButton: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // ⭐ 반투명 검정
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    ...Platform.select({
      android: { elevation: 10 },
    }),
  },
});

export default MessageCreationBack;
