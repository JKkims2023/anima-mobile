/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 MessageCreationOverlay - Full Screen Overlay for Message Creation
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Full-screen overlay with fade-in animation
 * - Covers entire screen including tab bar (z-index: 9999)
 * - Integrated into PersonaStudioScreen as conditional rendering
 * - Replaces Stack Navigation approach
 * 
 * Features:
 * - Fade-in animation (300ms, emotional)
 * - Persona background (Image/Video)
 * - Message title & content input
 * - Text animation selection (grouped accordion)
 * - Particle effect selection (grouped accordion)
 * - Background music selection (grouped)
 * - URL generation button
 * - Share button (after message creation)
 * - Android back button support
 * 
 * Design Pattern:
 * - Matches PersonaStudioScreen's overlay architecture
 * - Same as PersonaSearchOverlay, AnimaLoadingOverlay
 * - State-based visibility control
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-08
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Keyboard,
  BackHandler,
  Platform,
  Share,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';

// ═══════════════════════════════════════════════════════════════════════════
// Contexts & Services
// ═══════════════════════════════════════════════════════════════════════════
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useAnima } from '../../contexts/AnimaContext';
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import messageService from '../../services/api/messageService';

// ═══════════════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════════════
import CustomText from '../CustomText';
import PersonaBackgroundView from './PersonaBackgroundView';
import BackgroundEffect from '../particle/BackgroundEffect'; // ⭐ NEW: Layer 1
import ActiveEffect from '../particle/ActiveEffect'; // ⭐ NEW: Layer 2 (기존 ParticleEffect)
import MessageInputOverlay from './MessageInputOverlay';
import MusicSelectionOverlay from '../music/MusicSelectionOverlay';
import EffectGroupAccordion from '../EffectGroupAccordion';
import FloatingChipNavigation from '../FloatingChipNavigation'; // ⭐ NEW: Chip-based navigation
import EffectListView from '../EffectListView'; // ⭐ NEW: Effect list display
import CustomBottomSheet from '../CustomBottomSheet';
import WordInputOverlay from './WordInputOverlay'; // ⭐ FIXED: Modal-based for Korean input stability // ⭐ NEW: Custom words input
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IconSearch from 'react-native-vector-icons/Ionicons';
import IconCreate from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../styles/commonstyles';
import MessageHelpSheet from '../persona/MessageHelpSheet';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════
import { 
  TEXT_ANIMATION_GROUPS, 
  BACKGROUND_EFFECT_GROUPS, // ⭐ NEW: Layer 1
  ACTIVE_EFFECT_GROUPS,      // ⭐ NEW: Layer 2 (기존 PARTICLE)
} from '../../constants/effect-groups';

// ═══════════════════════════════════════════════════════════════════════════
// ⭐ NEW: Text Effect Click System (4 Core Effects)
// ═══════════════════════════════════════════════════════════════════════════
const TEXT_EFFECTS = [
  { id: 'typing', label: '타이핑', emoji: '⌨️', description: '타이핑하듯 등장' },
  { id: 'fade_in', label: '페이드인', emoji: '✨', description: '부드럽게 나타남' },
  { id: 'slide_cross', label: '슬라이드', emoji: '➡️', description: '좌측에서 등장' },
  { id: 'breath', label: '숨쉬기', emoji: '💓', description: '살아 숨쉬듯 변화' },
];

/**
 * MessageCreationOverlay Component
 * 
 * @param {boolean} visible - Overlay visibility (controlled by parent)
 * @param {object} selectedPersona - Selected persona object
 * @param {function} onClose - Callback when overlay should close
 */
const MessageCreationOverlay = ({ visible, selectedPersona, onClose }) => {
  const { theme,currentTheme } = useTheme();
  const { user } = useUser();
  const { showAlert, setHasNewMessage, setCreatedMessageUrl, createdMessageUrl } = useAnima();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // ═══════════════════════════════════════════════════════════════════════════
  // Refs
  // ═══════════════════════════════════════════════════════════════════════════
  const contentInputRef = useRef(null);
  const helpSheetRef = useRef(null);
  const backgroundEffectSheetRef = useRef(null); // ⭐ NEW: Layer 1 (배경 효과)
  const activeEffectSheetRef = useRef(null); // ⭐ NEW: Layer 2 (액티브 효과, 기존 particleEffectSheetRef)
  const wordInputSheetRef = useRef(null); // ⭐ NEW: Custom words input sheet
  const musicSelectionOverlayRef = useRef(null); // ⭐ NEW: Music selection overlay ref

  // ═══════════════════════════════════════════════════════════════════════════
  // State Management (2-Layer System)
  // ═══════════════════════════════════════════════════════════════════════════
  const [messageContent, setMessageContent] = useState('');
  const [textAnimation, setTextAnimation] = useState('typing'); // ⭐ 기본값: 타이핑
  const [textEffectIndex, setTextEffectIndex] = useState(0); // ⭐ NEW: Current text effect index (0-6)
  
  // ⭐ 2-Layer Effect States
  const [backgroundEffect, setBackgroundEffect] = useState('none'); // ⭐ NEW: Layer 1 (배경 효과)
  const [activeEffect, setActiveEffect] = useState('none'); // ⭐ NEW: Layer 2 (액티브 효과, 기존 particleEffect)
  const [customWords, setCustomWords] = useState([]); // ⭐ User's custom words for active effects
  
  const [bgMusic, setBgMusic] = useState('none');
  const [bgMusicUrl, setBgMusicUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  // ⭐ BottomSheet Open States
  const [isBackgroundSheetOpen, setIsBackgroundSheetOpen] = useState(false); // ⭐ NEW: Layer 1 sheet
  const [isActiveSheetOpen, setIsActiveSheetOpen] = useState(false); // ⭐ NEW: Layer 2 sheet (기존 isParticleSheetOpen)
  
  // ⭐ Floating Chip Navigation States
  const [selectedBackgroundGroup, setSelectedBackgroundGroup] = useState('none'); // ⭐ NEW: Layer 1 group
  const [selectedActiveGroup, setSelectedActiveGroup] = useState('none'); // ⭐ NEW: Layer 2 group (기존 selectedParticleGroup)
  
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  // ═══════════════════════════════════════════════════════════════════════════
  // Sequential Animation (악마의 디테일 🎨)
  // ═══════════════════════════════════════════════════════════════════════════
  const overlayOpacity = useSharedValue(0); // 전체 오버레이
  const gradientOpacity = useSharedValue(0); // 하단 그라디언트
  const contentTranslateX = useSharedValue(300); // 텍스트 영역 (우측에서 시작)
  const contentOpacity = useSharedValue(0); // 텍스트 영역 투명도
  const chip1TranslateY = useSharedValue(100); // 첫 번째 칩
  const chip2TranslateY = useSharedValue(100); // 두 번째 칩
  const chip3TranslateY = useSharedValue(100); // 세 번째 칩
  const chip4TranslateY = useSharedValue(100); // 네 번째 칩 (공유)
  const chipsOpacity = useSharedValue(0); // 칩셋 전체 투명도
  
  // ⭐ Step Guide Animations
  const guideContentOpacity = useSharedValue(0); // 컨텐츠 가이드
  const guideContentTranslateY = useSharedValue(-10); // 컨텐츠 가이드 위치
  const guideChipsOpacity = useSharedValue(0); // 칩셋 가이드
  const guideChipsTranslateX = useSharedValue(-10); // 칩셋 가이드 위치
  
  // ⭐ Content Shake Animation (for validation feedback)
  const contentShakeX = useSharedValue(0); // 컨텐츠 영역 흔들림
  
  // ⭐ Particle Effect Animation (별도 제어)
  const particleOpacity = useSharedValue(0); // 파티클 투명도

  useEffect(() => {
    if (visible) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✨ [MessageCreationOverlay] Starting sequential animation');
      console.log('   🎬 Timeline:');
      console.log('   0초: 📷 Background Fade In (300ms)');
      console.log('   1초: ⬆️ Gradient Fade In (800ms)');
      console.log('   1.8초: ➡️ Content Slide In (600ms)');
      console.log('   2.4초: 🎪 Chips Bounce In (순차)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // ⭐ Reset initial render flag when overlay opens
      isInitialRenderRef.current = true;
      
      // 📷 Step 0: Reset all values
      overlayOpacity.value = 0;
      gradientOpacity.value = 0;
      contentTranslateX.value = 300;
      contentOpacity.value = 0;
      chip1TranslateY.value = 100;
      chip2TranslateY.value = 100;
      chip3TranslateY.value = 100;
      chip4TranslateY.value = 100;
      chipsOpacity.value = 0;
      
      // 📷 Step 1: Background 부드럽게 표시 (300ms)
      overlayOpacity.value = withTiming(1, { 
        duration: 300, 
        easing: Easing.out(Easing.ease) 
      });
      
      // ⬆️ Step 2: Gradient Fade In (1초 후, 800ms 동안)
      gradientOpacity.value = withDelay(
        1000, 
        withTiming(1, { 
          duration: 800, 
          easing: Easing.out(Easing.ease) 
        })
      );
      
      // ➡️ Step 3: Content 슬라이드 인 (1.8초 후, 600ms 동안)
      contentTranslateX.value = withDelay(
        1800,
        withSpring(0, { 
          damping: 15, 
          stiffness: 100 
        })
      );
      contentOpacity.value = withDelay(
        1800,
        withTiming(1, { duration: 400 })
      );
      
      // 🎪 Step 4: Chips 순차적 바운스 (2.4초 후)
      const chipDelay = 2400;
      const chipInterval = 100; // 각 칩 사이 간격
      
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
      
      chip4TranslateY.value = withDelay(
        chipDelay + chipInterval * 3,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      
      // 🎨 Particle Effect: Gradient와 동시에 표시 (1초 후)
      particleOpacity.value = withDelay(
        1000,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
      );
      
      // 🎪 Step 5: Step Guide 표시 (3.2초 후 - 모든 애니메이션 완료 후)
      const guideDelay = 3200;
      
      guideContentOpacity.value = withDelay(
        guideDelay,
        withSequence(
          withTiming(1, { duration: 300 }),
          withDelay(300, withTiming(0.7, { duration: 200 })),
          withDelay(300, withTiming(1, { duration: 200 })),
          withDelay(300, withTiming(0.7, { duration: 200 })),
          withDelay(300, withTiming(1, { duration: 200 }))
        )
      );
      
      guideContentTranslateY.value = withDelay(
        guideDelay,
        withSpring(0, { damping: 10, stiffness: 100 })
      );
      
    } else {
      console.log('🌙 [MessageCreationOverlay] Closing with fade-out (400ms)');
      overlayOpacity.value = withTiming(0, { 
        duration: 400, // ⭐ 2배로 증가 (더 부드러운 닫힘)
        easing: Easing.in(Easing.ease) 
      });
      particleOpacity.value = withTiming(0, { duration: 400 });
    }
  }, [visible]);

  // Animated Styles
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const gradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [
      { translateX: contentTranslateX.value },
      { translateX: contentShakeX.value }, // ⭐ Shake animation for validation
    ],
  }));

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

  const chip4AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chip4TranslateY.value }],
  }));

  // ⭐ Particle Effect Animated Style
  const particleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));

  // ⭐ Step Guide Animated Styles
  const guideContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: guideContentOpacity.value,
    transform: [{ translateY: guideContentTranslateY.value }],
  }));

  const guideChipsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: guideChipsOpacity.value,
    transform: [{ translateX: guideChipsTranslateX.value }],
  }));

  // ⭐ Guide Visibility Logic
  const [showContentGuide, setShowContentGuide] = useState(true);
  const [showChipsGuide, setShowChipsGuide] = useState(false);

  useEffect(() => {
    if (messageContent) {
      // 컨텐츠 입력 시 첫 번째 가이드 숨김
      setShowContentGuide(false);
      guideContentOpacity.value = withTiming(0, { duration: 200 });
      
      // 두 번째 가이드 표시
      setShowChipsGuide(true);
      guideChipsOpacity.value = withDelay(
        300,
        withSequence(
          withTiming(1, { duration: 300 }),
          withDelay(300, withTiming(0.7, { duration: 200 })),
          withDelay(300, withTiming(1, { duration: 200 })),
          withDelay(300, withTiming(0.7, { duration: 200 })),
          withDelay(300, withTiming(1, { duration: 200 }))
        )
      );
      guideChipsTranslateX.value = withDelay(300, withSpring(0, { damping: 10 }));
    }
  }, [messageContent]);

  useEffect(() => {
    // 효과 선택 시 두 번째 가이드 숨김 (2-Layer System)
    if (backgroundEffect !== 'none' || activeEffect !== 'none' || bgMusic !== 'none') {
      setShowChipsGuide(false);
      guideChipsOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [backgroundEffect, activeEffect, bgMusic]);

  // ⭐ Active Effect Debug & Immediate Show (Layer 2)
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ [MessageCreationOverlay] Active Effect State Changed (Layer 2)');
    console.log('  - activeEffect:', activeEffect);
    console.log('  - Will render:', activeEffect && activeEffect !== 'none');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ⭐ CRITICAL FIX: When active effect is selected, show immediately (no delay)
    if (activeEffect && activeEffect !== 'none') {
      console.log('✨ [MessageCreationOverlay] Showing active effect immediately!');
      particleOpacity.value = withTiming(1, { duration: 300 });
    } else {
      console.log('🌙 [MessageCreationOverlay] Hiding active effect');
      particleOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [activeEffect]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Android Back Button Handler (with confirmation)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('[MessageCreationOverlay] Android back button pressed');
      
      // 1️⃣ If background effect sheet is open, close it
      if (isBackgroundSheetOpen) {
        console.log('[MessageCreationOverlay] Closing background effect sheet');
        backgroundEffectSheetRef.current?.dismiss();
        return true;
      }
      
      // 2️⃣ If active effect sheet is open, close it
      if (isActiveSheetOpen) {
        console.log('[MessageCreationOverlay] Closing active effect sheet');
        activeEffectSheetRef.current?.dismiss();
        return true;
      }
      
      // 3️⃣ Otherwise, show confirmation dialog before closing
      console.log('[MessageCreationOverlay] Showing exit confirmation');
      HapticService.medium();
      
      showAlert({
        title: t('message.alert.exit_message_creation'),
        emoji: '⚠️',
        message: t('message.alert.exit_message_creation_description'),
        buttons: [
          {
            text: t('message.alert.continue_writing'),
            style: 'cancel',
            onPress: () => {
              console.log('[MessageCreationOverlay] User chose to continue writing');
              HapticService.light();
            }
          },
          {
            text: t('message.alert.exit'),
            style: 'destructive',
            onPress: () => {
              console.log('[MessageCreationOverlay] User confirmed exit');
              HapticService.medium();
              onClose();
            }
          }
        ]
      });
      
      return true;
    });

    return () => backHandler.remove();
  }, [visible, isBackgroundSheetOpen, isActiveSheetOpen, onClose, showAlert, t]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Text Animation Values & Logic
  // ═══════════════════════════════════════════════════════════════════════════
  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const typingIndexRef = useRef(0);
  const typingIntervalRef = useRef(null);
  const cursorIntervalRef = useRef(null);
  const isInitialRenderRef = useRef(true); // ⭐ NEW: Track initial render

  const textOpacity = useSharedValue(1);
  const textScale = useSharedValue(1);
  const textTranslateX = useSharedValue(0);
  const textTranslateY = useSharedValue(0);
  const textRotate = useSharedValue(0);

  // ⭐ Trigger Animation: 초기 렌더링 시에만 2초 딜레이, 이후 즉시 실행
  useEffect(() => {
    if (!messageContent) return;

    console.log('[MessageCreationOverlay] 🎬 Text animation changed:', textAnimation);
    console.log('   🔍 isInitialRender:', isInitialRenderRef.current);

    // ⭐ Typing Animation (special case)
    if (textAnimation === 'typing') {
      typingIndexRef.current = 0;
      setTypingText('');

      // ⭐ CRITICAL: Cancel all ongoing animations (especially infinite breath)
      cancelAnimation(textOpacity);
      cancelAnimation(textScale);
      cancelAnimation(textTranslateX);
      cancelAnimation(textTranslateY);
      
      // ⭐ Reset all values to default (prevent ghost animations)
      textOpacity.value = 1;
      textScale.value = 1;
      textTranslateX.value = 0;
      textTranslateY.value = 0;
      
      console.log('   🛑 All animations canceled for typing');

      // ⭐ 초기 렌더링: 2초 딜레이 (시퀀스 애니메이션 대기)
      // ⭐ 효과 변경: 즉시 실행 (0ms)
      const typingDelay = isInitialRenderRef.current ? 2000 : 0;
      console.log('   ⏱️ Typing delay:', typingDelay, 'ms');

      const typingTimeout = setTimeout(() => {
        typingIntervalRef.current = setInterval(() => {
          typingIndexRef.current += 1;
          if (typingIndexRef.current <= messageContent.length) {
            setTypingText(messageContent.substring(0, typingIndexRef.current));
          } else {
            clearInterval(typingIntervalRef.current);
          }
        }, 50);

        cursorIntervalRef.current = setInterval(() => {
          setShowCursor((prev) => !prev);
        }, 500);
      }, typingDelay); // ⭐ Dynamic delay

      // ⭐ Mark as no longer initial render
      isInitialRenderRef.current = false;

      return () => {
        clearTimeout(typingTimeout);
        clearInterval(typingIntervalRef.current);
        clearInterval(cursorIntervalRef.current);
      };
    }

    // ⭐ Other Animations: Cancel ongoing & Reset values
    setTypingText(messageContent);

    // ⭐ CRITICAL: Cancel all ongoing animations first
    cancelAnimation(textOpacity);
    cancelAnimation(textScale);
    cancelAnimation(textTranslateX);
    cancelAnimation(textTranslateY);
    
    console.log('   🛑 All animations canceled for:', textAnimation);

    // ⭐ Reset all values to default
    textOpacity.value = 1;
    textScale.value = 1;
    textTranslateX.value = 0;
    textTranslateY.value = 0;
    textRotate.value = 0;

    switch (textAnimation) {
      case 'fade_in':
        textOpacity.value = 0;
        textOpacity.value = withTiming(1, { duration: 800 }); // ⭐ NO DELAY
        break;

      case 'slide_cross':
        // ⭐ Start from completely off-screen (left side)
        textTranslateX.value = -SCREEN_WIDTH;
        textOpacity.value = 0;
        textTranslateX.value = withSpring(0, { damping: 15 }); // ⭐ NO DELAY
        textOpacity.value = withTiming(1, { duration: 600 }); // ⭐ NO DELAY
        break;

      case 'breath':
        // ⭐ Natural Breathing Pattern (Infinite loop with 2-second rest)
        // Pattern: Normal → Contract → Normal → [2s Rest] → Repeat
        textScale.value = withRepeat(
          withSequence(
            withTiming(0.95, { duration: 500, easing: Easing.inOut(Easing.ease) }), // Contract (500ms)
            withTiming(1.0, { duration: 500, easing: Easing.inOut(Easing.ease) }),  // Return to normal (500ms)
            withDelay(2000, withTiming(1.0, { duration: 0 })) // 2-second rest (keep size 1.0)
          ),
          -1, // ⭐ Infinite loop
          false
        );
        break;

      default:
        // ⭐ Default to fade-in (NO DELAY)
        textOpacity.value = 0;
        textOpacity.value = withTiming(1, { duration: 800 });
        break;
    }
  }, [textAnimation, messageContent]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textAnimation === 'typing' ? 1 : textOpacity.value,
    transform: [
      { scale: textScale.value },
      { translateX: textTranslateX.value },
      { translateY: textTranslateY.value },
      { rotate: `${textRotate.value}deg` },
    ],
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // Helper: Filter Non-Empty Groups
  // ═══════════════════════════════════════════════════════════════════════════
  const filterNonEmptyGroups = (groups) => {
    return groups.filter(group => group.items && group.items.length > 0);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ NEW: Text Effect Click Handler (Simple & Clear)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleTextEffectClick = useCallback(() => {
    if (!messageContent) return; // Only allow if content exists

    setTextEffectIndex((prev) => {
      const newIndex = (prev + 1) % TEXT_EFFECTS.length;
      const newEffect = TEXT_EFFECTS[newIndex];
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👆 [Click] Text Effect Changed: ${newEffect.label} (${newIndex + 1}/${TEXT_EFFECTS.length})`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // ⭐ Immediately set new effect (NO DELAY)
      setTextAnimation(newEffect.id);
      
      // ⭐ Haptic feedback
      HapticService.selection();
      
      return newIndex;
    });
  }, [messageContent]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Selection Panel (2-Layer System)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleBackgroundEffectChipPress = () => {
    console.log('[MessageCreationOverlay] Opening background effect sheet (Layer 1)');
    Keyboard.dismiss();
    HapticService.light();
    backgroundEffectSheetRef.current?.present();
  };

  const handleActiveEffectChipPress = () => {
    console.log('[MessageCreationOverlay] Opening active effect sheet (Layer 2)');
    Keyboard.dismiss();
    HapticService.light();
    activeEffectSheetRef.current?.present();
  };

  const handleBgMusicChipPress = () => {
    console.log('[MessageCreationOverlay] Opening music selection');
    Keyboard.dismiss();
    HapticService.light();
    musicSelectionOverlayRef.current?.present(); // ⭐ NEW: ref-based
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Effect Selection (2-Layer System)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleBackgroundEffectSelect = (effectId) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌌 [MessageCreationOverlay] Background Effect Selected (Layer 1):', effectId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    setBackgroundEffect(effectId);
    HapticService.selection();
    backgroundEffectSheetRef.current?.dismiss();
    setShowChipsGuide(false); // Hide chips guide
  };

  const handleActiveEffectSelect = (effectId) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ [MessageCreationOverlay] Active Effect Selected (Layer 2):', effectId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ⭐ Check if this effect requires custom words
    const requiresCustomWords = effectId === 'floating_words' || effectId === 'scrolling_words';

    if (requiresCustomWords) {
      console.log('💬 [MessageCreationOverlay] Effect requires custom words, opening word input sheet');
      setActiveEffect(effectId); // ⭐ CRITICAL FIX: Set immediately!
      HapticService.selection();
      activeEffectSheetRef.current?.dismiss();
      // Small delay to ensure active sheet is fully dismissed
      setTimeout(() => {
        wordInputSheetRef.current?.present();
      }, 300);
      return;
    }

    setActiveEffect(effectId);
    HapticService.selection();
    activeEffectSheetRef.current?.dismiss();
    setShowChipsGuide(false); // Hide chips guide
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Save Custom Words
  // ═══════════════════════════════════════════════════════════════════════════
  const handleWordsSave = (words) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 [MessageCreationOverlay] Custom Words Saved:', words);
    console.log('  - Current activeEffect:', activeEffect);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    setCustomWords(words);
    // ⭐ FIXED: No need to set activeEffect again, already set in handleActiveEffectSelect
    HapticService.success();
    setShowChipsGuide(false); // Hide chips guide
  };

  const handleMusicSelect = (music) => {
    console.log('[MessageCreationOverlay] Music selected:', music);
    
    if (music.music_key === 'none') {
      setBgMusic('none');
      setBgMusicUrl('');
    } else {
      setBgMusic(music.music_key || music.id);
      setBgMusicUrl(music.music_url || music.url || '');
    }
    
    HapticService.selection();
    setShowChipsGuide(false); // Hide chips guide
    // Bottomsheet will dismiss automatically via onSelect in MusicSelectionOverlay
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Message Input
  // ═══════════════════════════════════════════════════════════════════════════
  const handleContentSave = (value) => {
    setMessageContent(value);
    contentInputRef.current?.dismiss();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Trigger Shake Animation
  // ═══════════════════════════════════════════════════════════════════════════
  const triggerContentShake = useCallback(() => {
    contentShakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [contentShakeX]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Proceed Generation (실제 메시지 생성)
  // ═══════════════════════════════════════════════════════════════════════════
  const proceedGeneration = useCallback(async () => {
    try {
      setIsCreating(true);
      HapticService.success();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 [MessageCreationOverlay] PROCEED GENERATION');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // ⭐ Generate title from first 30 chars of content
      const autoTitle = messageContent.length > 30 
        ? messageContent.substring(0, 30) + '...'
        : messageContent;

      // ⭐ Build effect_config with 2-Layer System
      const effectConfig = {
        background_effect: backgroundEffect !== 'none' ? backgroundEffect : null,
        active_effect: activeEffect !== 'none' ? activeEffect : null,
        custom_words: customWords.length > 0 ? customWords : null,
      };

      const response = await messageService.createMessage({
        user_key: user?.user_key,
        persona_key: selectedPersona?.persona_key,
        memory_key: selectedPersona?.history_key,
        message_title: autoTitle, // ⭐ 자동 생성된 제목
        message_content: messageContent,
        text_animation: 'typing', // ⭐ 항상 타이핑 효과
        particle_effect: activeEffect, // ⭐ 2-Layer System: activeEffect (backward compatibility)
        bg_music: bgMusic || 'none',
        bg_music_url: bgMusicUrl,
        effect_config: effectConfig, // ⭐ 2-Layer System: background_effect, active_effect, custom_words
        persona_name: selectedPersona?.persona_name,
        persona_image_url: selectedPersona?.selected_dress_image_url,
        persona_video_url: selectedPersona?.selected_dress_video_url,
        has_password: 'N',
        public_yn: 'Y',
      });

      if (response.data.success && response.data.data.short_code) {
        console.log('✅ [MessageCreationOverlay] Message created successfully');
        
        const shareUrl = `https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/m/${selectedPersona?.persona_key}/${response.data.data.short_code}`;
        
        // ⭐ Update Context (Badge + URL)
        setHasNewMessage(true);
        setCreatedMessageUrl(shareUrl);
        
        // ⭐ Show AnimaAlert (with share option)
        HapticService.success();
        showAlert({
          title: '메시지 생성 완료!',
          emoji: '🎉',
          message: '메시지가 성공적으로 생성되었습니다.\n지금 바로 공유하시겠습니까?',
          buttons: [
            {
              text: '나중에',
              style: 'cancel',
              onPress: () => {
                console.log('[MessageCreationOverlay] User chose to share later');
              }
            },
            {
              text: '공유하기',
              style: 'primary',
              onPress: () => {
                console.log('[MessageCreationOverlay] User chose to share now');
                handleShareMessage(shareUrl);
              }
            }
          ]
        });
      }
    } catch (error) {
      console.error('[MessageCreationOverlay] Create message error:', error);
      Alert.alert(t('common.error'), '메시지 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  }, [
    messageContent,
    customWords,
    user,
    selectedPersona,
    backgroundEffect, // ⭐ 2-Layer System: Layer 1
    activeEffect, // ⭐ 2-Layer System: Layer 2
    bgMusic,
    bgMusicUrl,
    setHasNewMessage,
    setCreatedMessageUrl,
    showAlert,
    t
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Generate URL (3단계 벨리데이션)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleGenerateURL = useCallback(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 [MessageCreationOverlay] GENERATE URL CLICKED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 1️⃣ VALIDATION: Content Required
    // ═══════════════════════════════════════════════════════════════════════════
    if (!messageContent.trim()) {
      console.log('❌ [MessageCreationOverlay] Content is empty!');
      
      // Shake animation
      triggerContentShake();
      
      // Warning haptic + Toast
      HapticService.warning();
      showAlert({
        title: t('message.validation.content_required'),
        emoji: '✍️',
        message: t('message.validation.content_required'),
        buttons: [
          { 
            text: t('common.confirm'), 
            style: 'cancel',
            onPress: () => {
              // Focus on content input
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
    // 2️⃣ VALIDATION: Partial Selection (Content only, no effects) - 2-Layer System
    // ═══════════════════════════════════════════════════════════════════════════
    const hasEffects = backgroundEffect !== 'none' || activeEffect !== 'none' || bgMusic !== 'none';
    
    if (!hasEffects) {
      console.log('⚠️ [MessageCreationOverlay] No effects selected (partial)');
      
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
        message: `${t('message.validation.confirm_partial')}\n\n${statusMessage}`,
        buttons: [
          { 
            text: t('message.validation.button_cancel'), 
            style: 'cancel',
            onPress: () => HapticService.light()
          },
          { 
            text: t('message.validation.button_create'), 
            style: 'primary',
            onPress: () => proceedGeneration()
          }
        ]
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3️⃣ VALIDATION: Final Confirmation (All options selected) - 2-Layer System
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('✅ [MessageCreationOverlay] All options selected, showing final confirmation');
    
    // Get effect labels for display
    const backgroundLabel = BACKGROUND_EFFECT_GROUPS
      .flatMap(g => g.items)
      .find(item => item.id === backgroundEffect)?.label || backgroundEffect;
    
    const activeLabel = ACTIVE_EFFECT_GROUPS
      .flatMap(g => g.items)
      .find(item => item.id === activeEffect)?.label || activeEffect;
    
    const musicLabel = bgMusic !== 'none' ? bgMusic : t('message.validation.status_not_selected');
    
    // Build detailed status message
    const detailedStatus = `
📝 ${t('message.validation.status_content')}: ${t('message.validation.status_complete')}
🌌 ${t('message.validation.status_background')}: ${backgroundLabel !== 'none' ? backgroundLabel : t('message.validation.status_not_selected')}
✨ ${t('message.validation.status_particle')}: ${activeLabel !== 'none' ? activeLabel : t('message.validation.status_not_selected')}
${(activeEffect === 'floating_words' || activeEffect === 'scrolling_words') && customWords.length > 0 
  ? `   💬 ${t('message.validation.status_custom_words')}: ${customWords.join(', ')}`
  : ''}
🎵 ${t('message.validation.status_music')}: ${musicLabel}
    `.trim();
    
    HapticService.warning(); // Important warning
    showAlert({
      title: t('message.validation.final_confirm_title'),
      emoji: '⚠️',
      message: `${t('message.validation.final_confirm_message')}\n\n${detailedStatus}`,
      buttons: [
        { 
          text: t('message.validation.button_recheck'), 
          style: 'cancel',
          onPress: () => HapticService.light()
        },
        { 
          text: t('message.validation.button_create'), 
          style: 'destructive',
          onPress: () => proceedGeneration()
        }
      ]
    });
  }, [
    messageContent,
    backgroundEffect, // ⭐ 2-Layer System: Layer 1
    activeEffect, // ⭐ 2-Layer System: Layer 2
    bgMusic,
    customWords,
    triggerContentShake,
    showAlert,
    t,
    proceedGeneration,
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Share Message
  // ═══════════════════════════════════════════════════════════════════════════
  const handleShareMessage = async (shareUrl) => {
    try {
      HapticService.light();
      
      // ⭐ Generate auto title from content (same as message creation)
      const autoTitle = messageContent.length > 30 
        ? messageContent.substring(0, 30) + '...'
        : messageContent;
      
      await Share.share({
        message: Platform.OS === 'ios' 
          ? `${autoTitle}\n\n${shareUrl}`
          : shareUrl,
        url: Platform.OS === 'ios' ? shareUrl : undefined,
        title: autoTitle || 'ANIMA Message',
      });
      console.log('✅ [MessageCreationOverlay] Message shared');
    } catch (error) {
      console.error('[MessageCreationOverlay] Share error:', error);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Music Playback Toggle
  // ═══════════════════════════════════════════════════════════════════════════
  const handleToggleMusic = () => {
    setIsMusicPlaying((prev) => !prev);
    HapticService.light();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Video Key for forcing remount
  // ═══════════════════════════════════════════════════════════════════════════
  const videoKey = useMemo(() => {
    return selectedPersona?.persona_key || 'default';
  }, [selectedPersona?.persona_key]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render: Don't render if not visible (conditional in parent, but extra safety)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Background: Persona Image/Video */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <PersonaBackgroundView
        persona={selectedPersona}
        isScreenFocused={true}
        opacity={1}
        videoKey={videoKey}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🌌 Layer 1: Background Effect (배경 레이어) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {(() => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌌 [MessageCreationOverlay] Background Effect Render Check');
        console.log('  - backgroundEffect:', backgroundEffect);
        console.log('  - isBackgroundSheetOpen:', isBackgroundSheetOpen);
        console.log('  - isActive will be:', !isBackgroundSheetOpen);
        console.log('  - Condition (backgroundEffect && backgroundEffect !== "none"):', backgroundEffect && backgroundEffect !== 'none');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return null;
      })()}
      {backgroundEffect && backgroundEffect !== 'none' && (
        <BackgroundEffect 
          type={backgroundEffect} 
          isActive={!isBackgroundSheetOpen} // ⭐ 바텀시트 열릴 때 비활성화
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ✨ Layer 2: Active Effect (액티브 레이어) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeEffect && activeEffect !== 'none' && (
        <Animated.View 
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50, // ⭐ Layer 2: Above BackgroundEffect (z-index: 10)
            },
            particleAnimatedStyle
          ]}
          pointerEvents="none"
        >
          <ActiveEffect 
            type={activeEffect} 
            isActive={!isActiveSheetOpen} // ⭐ 바텀시트 열릴 때 비활성화
            customWords={customWords} // ⭐ Pass custom words for floating_words and scrolling_words
          />
        </Animated.View>
      )}

      {/* Header */}
      <View style={[styles.header, { marginTop: insets.top + Platform.OS === 'ios' ? verticalScale(10) : verticalScale(25) }]}>
    
        <View style={{flex: 1, flexDirection: 'row', marginTop: Platform.OS === 'ios' ? verticalScale(20) : verticalScale(0)}}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Icon name="arrow-left" size={scale(24)} color={theme.textPrimary || '#FFFFFF'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <CustomText type="big" bold style={[styles.headerTitle, { color: theme.textPrimary || '#FFFFFF' }]}>
            {t('navigation.title.message_mode')}
          </CustomText>
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => {setIsHelpOpen(true);}}>
            <IconSearch name="help-circle-outline" size={scale(30)} color={currentTheme.mainColor} />
          </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentWrapper}>
       

      {/* ⭐ Gradient Overlay with Sequential Animation */}
      <Animated.View style={[
        { 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex:99999
        },
        gradientAnimatedStyle
      ]}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        >

           {/* URL 생성 플로팅 버튼 (우측 상단) */}
          <TouchableOpacity
            onPress={handleGenerateURL}
            disabled={isCreating}
            style={[
              styles.urlFloatingButton, 
              { 
                backgroundColor: 'rgba(0, 0, 0, 0.7)',

              }
            ]}
          >
            {isCreating ? (
              <IconCreate name="checkmark" size={scale(30)} color="#fff" />
            ) : (
              <IconCreate name="create" size={scale(30)} color="#fff" />
            )}
          </TouchableOpacity>
          
          {/* ⭐ Step 1 Guide: 컨텐츠 클릭 가이드 */}
          {showContentGuide && !messageContent && (
            <Animated.View style={[
              styles.stepGuide,
              { 
                marginBottom: verticalScale(8),
                marginLeft: scale(20),
              },
              guideContentAnimatedStyle
            ]}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => contentInputRef.current?.present()}>
              <CustomText style={styles.guideEmoji}>👇</CustomText>
              <CustomText style={styles.guideText}>클릭</CustomText>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ⭐ Content with Slide Animation */}
          <Animated.View style={[
            styles.contentContainer, 
            { paddingBottom: insets.bottom + platformPadding(40) },
            contentAnimatedStyle
          ]}>
            {/* ⭐ Title 제거 - 제목과 본문 통합 */}
            
            {/* Content with Animation */}
            <TouchableOpacity onPress={() => contentInputRef.current?.present()}>
              <Animated.View style={animatedTextStyle}>
                {/* ⭐ Standard Text Display */}
                <CustomText type="title" style={styles.content}>
                  {typingText ? (
                    <>
                      {typingText}
                      {showCursor && <CustomText style={styles.cursor}>▌</CustomText>}
                    </>
                  ) : (
                    '클릭하여 메시지를 입력하세요'
                  )}
                </CustomText>
              </Animated.View>
            </TouchableOpacity>
            
            {/* ⭐ NEW: Text Effect Change Button (Replaces swipe) */}
            {typingText && (
              <TouchableOpacity 
                style={styles.effectChangeButton}
                onPress={handleTextEffectClick}
                activeOpacity={0.7}
              >
                <CustomText style={styles.effectChangeButtonText}>
                  👆 {TEXT_EFFECTS[textEffectIndex].emoji} {TEXT_EFFECTS[textEffectIndex].label}
                </CustomText>
              </TouchableOpacity>
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>
      </View>

      {/* ⭐ Step 2 Guide: 효과 설정 가이드 */}
      {showChipsGuide && messageContent && (
        <Animated.View style={[
          styles.stepGuideChips,
          { top: insets.top + verticalScale(120) },
          guideChipsAnimatedStyle
        ]}>
          <CustomText style={styles.guideEmoji}>👉</CustomText>
          <CustomText style={styles.guideText}>효과 설정</CustomText>
        </Animated.View>
      )}

      {/* ⭐ Quick Action Chips with Sequential Bounce Animation (2-Layer System) */}
      <Animated.View style={[
        styles.quickChipsContainer, 
        { top: insets.top + verticalScale(120) },
        chipsContainerAnimatedStyle
      ]}>
        {/* 🌌 Chip 1: Background Effect (Layer 1) */}
        <Animated.View style={chip1AnimatedStyle}>
          <TouchableOpacity
            style={[
              styles.quickChip,
              backgroundEffect !== 'none' && { backgroundColor: 'rgba(102, 126, 234, 0.25)' }
            ]}
            onPress={handleBackgroundEffectChipPress}
            activeOpacity={0.7}
          >
            <Icon name="creation" size={scale(20)} color="#667eea" />
          </TouchableOpacity>
        </Animated.View>

        {/* ✨ Chip 2: Active Effect (Layer 2) */}
        <Animated.View style={chip2AnimatedStyle}>
          <TouchableOpacity
            style={[
              styles.quickChip,
              activeEffect !== 'none' && { backgroundColor: 'rgba(255, 215, 0, 0.2)' }
            ]}
            onPress={handleActiveEffectChipPress}
            activeOpacity={0.7}
          >
            <Icon name="shimmer" size={scale(20)} color="gold" />
          </TouchableOpacity>
        </Animated.View>

        {/* 🎵 Chip 3: Background Music */}
        <Animated.View style={chip3AnimatedStyle}>
          <TouchableOpacity
            style={[
              styles.quickChip,
              bgMusic !== 'none' && { backgroundColor: 'rgba(255, 0, 0, 0.2)' }
            ]}
            onPress={handleBgMusicChipPress}
            activeOpacity={0.7}
          >
            <Icon name="music-note" size={scale(20)} color="red" />
          </TouchableOpacity>
        </Animated.View>

        {/* 📤 Chip 4: Share (Only visible after message creation) */}
        {createdMessageUrl && (
          <Animated.View style={chip4AnimatedStyle}>
            <TouchableOpacity
              style={[
                styles.quickChip,
                { backgroundColor: 'rgba(76, 175, 80, 0.3)' }
              ]}
              onPress={() => handleShareMessage(createdMessageUrl)}
              activeOpacity={0.7}
            >
              <Icon name="share-variant" size={scale(20)} color="#4CAF50" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* 🌌 Background Effect BottomSheet (Layer 1 - Floating Chip Navigation) */}
      <CustomBottomSheet
        ref={backgroundEffectSheetRef}
        title={t('message_preview.background_effect')}
        snapPoints={['70%']}
        enableDynamicSizing={false}
        onDismiss={() => {
          console.log('[MessageCreationOverlay] Background effect sheet dismissed');
          setIsBackgroundSheetOpen(false);
        }}
        onChange={(index) => {
          setIsBackgroundSheetOpen(index >= 0);
        }}
        buttons={[
          {
            title: t('common.close'),
            type: 'primary',
            onPress: () => {
              backgroundEffectSheetRef.current?.dismiss();
              HapticService.light();
            }
          }
        ]}
      >
        {/* ⭐ Floating Chip Navigation (Top) */}
        <FloatingChipNavigation
          groups={filterNonEmptyGroups(BACKGROUND_EFFECT_GROUPS).map(group => ({
            id: group.id,
            emoji: group.emoji || (group.items && group.items[0]?.emoji),
            title: group.title || (group.items && group.items[0]?.label),
          }))}
          selectedGroupId={selectedBackgroundGroup}
          onSelectGroup={(groupId) => {
            setSelectedBackgroundGroup(groupId);
            console.log('[MessageCreationOverlay] Background group changed:', groupId);
          }}
        />

        {/* ⭐ Effect List View (Bottom) */}
        <EffectListView
          items={(() => {
            const group = BACKGROUND_EFFECT_GROUPS.find(g => g.id === selectedBackgroundGroup);
            return group ? group.items : [];
          })()}
          selectedValue={backgroundEffect}
          onSelect={handleBackgroundEffectSelect}
        />
      </CustomBottomSheet>

      {/* ✨ Active Effect BottomSheet (Layer 2 - Floating Chip Navigation) */}
      <CustomBottomSheet
        ref={activeEffectSheetRef}
        title={t('message_preview.active_effect')}
        snapPoints={['70%']}
        enableDynamicSizing={false}
        onDismiss={() => {
          console.log('[MessageCreationOverlay] Active effect sheet dismissed');
          setIsActiveSheetOpen(false);
        }}
        onChange={(index) => {
          setIsActiveSheetOpen(index >= 0);
        }}
        buttons={[
          {
            title: t('common.close'),
            type: 'primary',
            onPress: () => {
              activeEffectSheetRef.current?.dismiss();
              HapticService.light();
            }
          }
        ]}
      >
        {/* ⭐ Floating Chip Navigation (Top) */}
        <FloatingChipNavigation
          groups={filterNonEmptyGroups(ACTIVE_EFFECT_GROUPS).map(group => ({
            id: group.id,
            emoji: group.emoji || (group.items && group.items[0]?.emoji),
            title: group.title || (group.items && group.items[0]?.label),
          }))}
          selectedGroupId={selectedActiveGroup}
          onSelectGroup={(groupId) => {
            setSelectedActiveGroup(groupId);
            console.log('[MessageCreationOverlay] Active group changed:', groupId);
          }}
        />

        {/* ⭐ Effect List View (Bottom) */}
        <EffectListView
          items={(() => {
            const group = ACTIVE_EFFECT_GROUPS.find(g => g.id === selectedActiveGroup);
            return group ? group.items : [];
          })()}
          selectedValue={activeEffect}
          onSelect={handleActiveEffectSelect}
        />
      </CustomBottomSheet>

      {/* ⭐ Custom Words Input Overlay (Modal-based for Korean input stability) */}
      <WordInputOverlay
        ref={wordInputSheetRef}
        initialWords={customWords}
        onSave={handleWordsSave}
        title="나만의 단어 입력"
        placeholder="단어 입력 (최대 15자)"
      />

      {/* Message Input Overlays */}
      <MessageInputOverlay
        ref={contentInputRef}
        title="내용 입력"
        placeholder="메시지 내용을 입력하세요"
        leftIcon="text"
        initialValue={messageContent}
        maxLength={500}
        multiline={true}
        onSave={handleContentSave}
      />

      {/* Music Selection Overlay (ref-based) */}
      <MusicSelectionOverlay
        ref={musicSelectionOverlayRef}
        onSelect={handleMusicSelect}
        selectedMusicKey={bgMusic}
      />

      {/* Background Music Player (Hidden) */}
      {bgMusic && bgMusic !== 'none' && bgMusicUrl && (
        <>
          <Video
            source={{ uri: bgMusicUrl }}
            audioOnly
            repeat
            paused={!isMusicPlaying}
            volume={1.0}
          />
          <TouchableOpacity
            onPress={handleToggleMusic}
            style={[
              styles.floatingMusicButton,
              { 
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                top: insets.top + verticalScale(100),
              }
            ]}
          >
            <Icon 
              name={isMusicPlaying ? 'pause' : 'play'} 
              size={scale(20)} 
              color="#fff" 
            />
          </TouchableOpacity>
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Help Sheet */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <View style={styles.sheetContainer}>
        <MessageHelpSheet
          ref={helpSheetRef}
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}

        />
      </View>

    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // ⭐ 탭바 위에 완전히 덮음
    elevation: 999,
    backgroundColor: COLORS.BACKGROUND || '#000',
  },
  header: {
    position: 'absolute',
    top: verticalScale(15),
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(16),
    zIndex: 1000,
  
  },
  backButton: {
    marginRight: scale(0),
    padding: scale(8),
    marginLeft: scale(-15),
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    marginTop: Platform.OS === 'ios' ? verticalScale(3) : verticalScale(3),
  },
  headerTitle: {
    marginBottom: scale(2),
  },
  headerSubtitle: {
    fontSize: scale(13),
    display: 'none',
  },
  contentWrapper: {
    flex: 1,
  },
  gradient: {
    justifyContent: 'flex-end',
    marginTop: 'auto',
    height: 'auto',
  },
  contentContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  title: {
    marginBottom: verticalScale(16),
    textAlign: 'left',
    color: '#FFFFFF',
  },
  content: {
    fontSize: scale(18),
    textAlign: 'left',
    color: '#FFFFFF',
    lineHeight: scale(24),
  },
  cursor: {
    color: '#FFFFFF',
  },
  urlFloatingButton: {
    marginLeft: 'auto',
    marginRight: scale(20),
    marginBottom: scale(20),
    borderRadius: scale(40),
    padding: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingMusicButton: {
    position: 'absolute',

    left: scale(20),
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickChipsContainer: {
    position: 'absolute',
    right: scale(16),
    gap: verticalScale(10),
    zIndex: 100,
    elevation: 100,
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
  // ⭐ Step Guide Styles
  stepGuide: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
  },
  stepGuideChips: {
    position: 'absolute',
    right: scale(80), // 칩셋 왼쪽
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  guideEmoji: {
    fontSize: scale(18),
    marginRight: scale(6),
  },
  guideText: {
    fontSize: scale(18),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // ⭐ NEW: Text Effect Change Button (Click to change)
  effectChangeButton: {
    marginTop: verticalScale(12),
    alignSelf: 'flex-start', // ⭐ 클릭 가이드와 동일한 위치 (좌측)
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  effectChangeButtonText: {
    fontSize: scale(18), // ⭐ 클릭 가이드와 동일한 크기
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // ⭐ Z-INDEX: 999999 - Bottom Sheet Container (HIGHEST PRIORITY)
  sheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 999, // ⭐ Android maximum elevation
    pointerEvents: 'box-none', // ⭐ Allow touches to pass through when sheet is closed
  },
  helpButton: {
    marginLeft: platformPadding(12),
    padding: platformPadding(8),
  },
});

export default MessageCreationOverlay;


