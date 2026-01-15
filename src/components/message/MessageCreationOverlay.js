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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import messageApi from '../../services/api/messageApi'; // ⭐ NEW: Message validation API

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
import EmotionPresetBottomSheet from '../EmotionPresetBottomSheet'; // ⭐ NEW: Emotion presets
import ProcessingLoadingOverlay from '../persona/ProcessingLoadingOverlay'; // ⭐ NEW: Universal loading overlay for validation & creation
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IconSearch from 'react-native-vector-icons/Ionicons';
import IconCreate from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../styles/commonstyles';
import MessageHelpSheet from '../persona/MessageHelpSheet';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg'; // ⭐ NEW: For gradient title

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════
import { 
  TEXT_ANIMATION_GROUPS, 
  BACKGROUND_EFFECT_GROUPS, // ⭐ NEW: Layer 1
  ACTIVE_EFFECT_GROUPS,      // ⭐ NEW: Layer 2 (기존 PARTICLE)
} from '../../constants/effect-groups';

// ═══════════════════════════════════════════════════════════════════════════
// Text Animation: Fixed 'slide_cross' (no constants needed)
// ═══════════════════════════════════════════════════════════════════════════
// ⭐ REMOVED: TEXT_EFFECTS constant (text animation is now fixed to 'slide_cross')

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
  const { showAlert, showToast, setHasNewMessage, setCreatedMessageUrl, createdMessageUrl, setMessageCreateHandler } = useAnima();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // ═══════════════════════════════════════════════════════════════════════════
  // Refs
  // ═══════════════════════════════════════════════════════════════════════════
  const contentInputRef = useRef(null);
  const helpSheetRef = useRef(null);
  const emotionPresetSheetRef = useRef(null); // ⭐ NEW: Emotion presets
  const backgroundEffectSheetRef = useRef(null); // ⭐ NEW: Layer 1 (배경 효과)
  const activeEffectSheetRef = useRef(null); // ⭐ NEW: Layer 2 (액티브 효과, 기존 particleEffectSheetRef)
  const wordInputSheetRef = useRef(null); // ⭐ NEW: Custom words input sheet
  const musicSelectionOverlayRef = useRef(null); // ⭐ NEW: Music selection overlay ref

  // ═══════════════════════════════════════════════════════════════════════════
  // State Management (2-Layer System)
  // ═══════════════════════════════════════════════════════════════════════════
  const [messageContent, setMessageContent] = useState('');
  // ⭐ Text Animation: Fixed to 'slide_cross' (no user selection)
  
  // ⭐ 2-Layer Effect States
  const [backgroundEffect, setBackgroundEffect] = useState('none'); // ⭐ NEW: Layer 1 (배경 효과)
  const [activeEffect, setActiveEffect] = useState('none'); // ⭐ NEW: Layer 2 (액티브 효과, 기존 particleEffect)
  const [customWords, setCustomWords] = useState([]); // ⭐ User's custom words for active effects
  const [pendingActiveEffect, setPendingActiveEffect] = useState(null); // ⭐ NEW: Temporarily store effect until words are confirmed
  
  const [bgMusic, setBgMusic] = useState('none');
  const [bgMusicUrl, setBgMusicUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(''); // ⭐ NEW: Dynamic message for ProcessingLoadingOverlay
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // ⭐ NEW: Chip Tooltip Visibility (ANIMA's Ultimate Kindness)
  const [chipTooltips, setChipTooltips] = useState({
    preset: true,
    background: true,
    active: true,
    music: true,
  });

  // ⭐ Load chip tooltips from AsyncStorage
  useEffect(() => {
    const loadTooltips = async () => {
      try {
        const stored = await AsyncStorage.getItem('@anima_chip_tooltips');
        if (stored) {
          setChipTooltips(JSON.parse(stored));
        }
      } catch (error) {
        console.error('[MessageCreationOverlay] Failed to load tooltips:', error);
      }
    };
    loadTooltips();
  }, []);

  // ⭐ Hide chip tooltip (permanent)
  const hideChipTooltip = useCallback(async (chipKey) => {
    const newTooltips = { ...chipTooltips, [chipKey]: false };
    setChipTooltips(newTooltips);
    try {
      await AsyncStorage.setItem('@anima_chip_tooltips', JSON.stringify(newTooltips));
    } catch (error) {
      console.error('[MessageCreationOverlay] Failed to save tooltips:', error);
    }
  }, [chipTooltips]);
  
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
      console.log('   0초: 📷 Background + ⬆️ Gradient + 🎨 Particle (동시!)');
      console.log('   0.8초: Gradient 완료');
      console.log('   1.8초: ➡️ Content Slide In (600ms)');
      console.log('   2.4초: 🎪 Chips Bounce In (순차)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
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
      
      // ⬆️ Step 2: Gradient Fade In (즉시 시작, 800ms 동안)
      gradientOpacity.value = withDelay(
        0, 
        withTiming(1, { 
          duration: 800, 
          easing: Easing.out(Easing.ease) 
        })
      );
      
      // ➡️ Step 3: Content 슬라이드 인 (1.8초 후, 600ms 동안)
      contentTranslateX.value = withDelay(
        1000,
        withSpring(0, { 
          damping: 15, 
          stiffness: 100 
        })
      );
      contentOpacity.value = withDelay(
        1400,
        withTiming(1, { duration: 800 })
      );
      
      // 🎪 Step 4: Chips 순차적 바운스 (2.4초 후)
      const chipDelay = 1000;
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
      
      // 🎨 Particle Effect: Gradient와 동시에 표시 (즉시 시작)
      particleOpacity.value = withDelay(
        0,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
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

  // ⭐ Register message create handler in AnimaContext (for CustomTabBar)
  useEffect(() => {
    if (visible && setMessageCreateHandler) {
      console.log('[MessageCreationOverlay] 🎯 Registering message create handler...');
      // Register handleGenerateURL as the global message create handler
      setMessageCreateHandler(() => handleGenerateURL);
      
      return () => {
        console.log('[MessageCreationOverlay] 🎯 Unregistering message create handler...');
        setMessageCreateHandler(null);
      };
    }
  }, [visible, setMessageCreateHandler, handleGenerateURL]);

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
  // ⭐ ANIMA Logo Overlay Animation (Background Layer)
  // ═══════════════════════════════════════════════════════════════════════════
  const animaLogoTranslateX = useSharedValue(-100);
  const animaLogoOpacity = useSharedValue(0);
  const soulConnectionTranslateX = useSharedValue(-100);
  const soulConnectionOpacity = useSharedValue(0);

  // ⭐ Trigger ANIMA logo animation on mount (when visible)
  useEffect(() => {
    if (visible) {
      console.log('🎬 [MessageCreationOverlay] Starting ANIMA logo animation');
      
      // Reset values
      animaLogoTranslateX.value = -100;
      animaLogoOpacity.value = 0;
      soulConnectionTranslateX.value = -100;
      soulConnectionOpacity.value = 0;

      // ANIMA logo: slide in from left (1.2s, smooth)
      animaLogoTranslateX.value = withTiming(0, { 
        duration: 1200, 
        easing: Easing.out(Easing.ease) 
      });
      animaLogoOpacity.value = withTiming(1, { 
        duration: 1200, 
        easing: Easing.out(Easing.ease) 
      });

      // Soul Connection: slide in with delay (300ms)
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
    }
  }, [visible]);

  const animaLogoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animaLogoTranslateX.value }],
    opacity: animaLogoOpacity.value,
  }));

  const soulConnectionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: soulConnectionTranslateX.value }],
    opacity: soulConnectionOpacity.value,
  }));

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
  // Text Animation: Fixed 'slide_cross' effect
  // ═══════════════════════════════════════════════════════════════════════════
  const textTranslateX = useSharedValue(0); // ✅ Only for slide_cross
  const textOpacity = useSharedValue(1); // ✅ Only for slide_cross

  // ⭐ Fixed 'slide_cross' animation: Trigger on messageContent change
  useEffect(() => {
    if (!messageContent) {
      // Reset animation values when content is empty
      textTranslateX.value = 0;
      textOpacity.value = 1;
      return;
    }

    console.log('[MessageCreationOverlay] 🎬 Text slide animation triggered');

    // ⭐ CRITICAL: Cancel any ongoing animations first
    cancelAnimation(textOpacity);
    cancelAnimation(textTranslateX);

    // ⭐ Start from completely off-screen (left side)
    textTranslateX.value = -SCREEN_WIDTH;
    textOpacity.value = 0;

    // ⭐ Slide in from left with spring animation
    textTranslateX.value = withSpring(0, { damping: 15, stiffness: 100 });
    textOpacity.value = withTiming(1, { duration: 600 });

    console.log('   ✅ Slide animation applied');
  }, [messageContent]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateX: textTranslateX.value }],
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // Helper: Filter Non-Empty Groups (Memoized)
  // ═══════════════════════════════════════════════════════════════════════════
  const filterNonEmptyGroups = useCallback((groups) => {
    return groups.filter(group => group.items && group.items.length > 0);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Text Animation: Fixed 'slide_cross' (no user selection needed)
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ REMOVED: handleTextEffectClick (text animation is now fixed)

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ NEW: Emotion Preset Handler
  // ═══════════════════════════════════════════════════════════════════════════
  const handleEmotionPresetPress = useCallback(() => {
    console.log('[MessageCreationOverlay] Opening emotion preset sheet');
    Keyboard.dismiss();
    HapticService.light();
    hideChipTooltip('preset'); // ⭐ Hide tooltip after first use
    emotionPresetSheetRef.current?.present();
  }, [hideChipTooltip]);

  const handlePresetSelect = useCallback((preset) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💝 [MessageCreationOverlay] Applying Emotion Preset:', preset.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ⭐ Apply all effects from preset (text animation is fixed, no need to set)
    setBackgroundEffect(preset.effects.backgroundEffect);
    setActiveEffect(preset.effects.activeEffect);
    setCustomWords(preset.effects.customWords || []);
    // Note: bgMusic is 'none' by default, user can select later

    // ⭐ Show success feedback
    HapticService.success();
    showToast({
      type: 'success',
      message: t('emotion_presets.applied'),
      emoji: '✨',
    });
  }, [showToast, t]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Selection Panel (2-Layer System)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleBackgroundEffectChipPress = useCallback(() => {
    console.log('[MessageCreationOverlay] Opening background effect sheet (Layer 1)');
    Keyboard.dismiss();
    HapticService.light();
    hideChipTooltip('background'); // ⭐ Hide tooltip after first use
    backgroundEffectSheetRef.current?.present();
  }, [hideChipTooltip]);

  const handleActiveEffectChipPress = useCallback(() => {
    console.log('[MessageCreationOverlay] Opening active effect sheet (Layer 2)');
    Keyboard.dismiss();
    HapticService.light();
    hideChipTooltip('active'); // ⭐ Hide tooltip after first use
    activeEffectSheetRef.current?.present();
  }, [hideChipTooltip]);

  const handleBgMusicChipPress = useCallback(() => {
    console.log('[MessageCreationOverlay] Opening music selection');
    Keyboard.dismiss();
    HapticService.light();
    hideChipTooltip('music'); // ⭐ Hide tooltip after first use
    musicSelectionOverlayRef.current?.present(); // ⭐ NEW: ref-based
  }, [hideChipTooltip]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Effect Selection (2-Layer System)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleBackgroundEffectSelect = useCallback((effectId) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌌 [MessageCreationOverlay] Background Effect Selected (Layer 1):', effectId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    setBackgroundEffect(effectId);
    HapticService.selection();
    backgroundEffectSheetRef.current?.dismiss();
    setShowChipsGuide(false); // Hide chips guide
  }, []);

  const handleActiveEffectSelect = useCallback((effectId) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ [MessageCreationOverlay] Active Effect Selected (Layer 2):', effectId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ⭐ Check if this effect requires custom words/messages
    const requiresCustomWords = effectId === 'floating_words' || effectId === 'scrolling_words' || effectId === 'fading_messages';

    if (requiresCustomWords) {
      console.log('💬 [MessageCreationOverlay] Effect requires custom input, opening word input sheet');
      console.log('   🔍 Effect type:', effectId);
      console.log('   🔍 Effect NOT applied yet, waiting for user confirmation');
      setPendingActiveEffect(effectId); // ⭐ FIXED: Store temporarily, don't apply yet!
      HapticService.selection();
      activeEffectSheetRef.current?.dismiss();
      // Small delay to ensure active sheet is fully dismissed
      setTimeout(() => {
        wordInputSheetRef.current?.present();
      }, 300);
      return;
    }

    // ⭐ Normal effects: Apply immediately
    setActiveEffect(effectId);
    HapticService.selection();
    activeEffectSheetRef.current?.dismiss();
    setShowChipsGuide(false); // Hide chips guide
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Save Custom Words
  // ═══════════════════════════════════════════════════════════════════════════
  const handleWordsSave = useCallback((words) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 [MessageCreationOverlay] Custom Words Saved:', words);
    console.log('  - pendingActiveEffect:', pendingActiveEffect);
    console.log('  - Words:', words);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    setCustomWords(words);
    
    // ⭐ CRITICAL FIX: Now apply the pending effect!
    if (pendingActiveEffect) {
      console.log('✅ [MessageCreationOverlay] Applying pending effect:', pendingActiveEffect);
      setActiveEffect(pendingActiveEffect);
      setPendingActiveEffect(null); // Clear pending state
    }
    
    HapticService.success();
    setShowChipsGuide(false); // Hide chips guide
  }, [pendingActiveEffect]);

  const handleMusicSelect = useCallback((music) => {
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
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Message Input
  // ═══════════════════════════════════════════════════════════════════════════
  const handleContentSave = useCallback((value) => {
    setMessageContent(value);
    contentInputRef.current?.dismiss();
  }, []);

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
  // ⭐ Fallback 감성 메시지 (LLM 생성 실패 시에만 사용)
  // ═══════════════════════════════════════════════════════════════════════════
  const FALLBACK_VALIDATION_MESSAGE = useMemo(() => ({
    title: '조금만 수정해주세요 ✨',
    message: `메시지에 조금 걱정되는 부분이 있어요.\n\nANIMA는 긍정적이고 건강한 소통을 지향합니다.\n\n다시 한번 생각해보고 작성해주실래요?\n함께 멋진 메시지를 만들어봐요! 💫`
  }), []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ Message Validation (LLM-based content safety check)
  // ✅ ARCHITECTURE FIX: Use messageApi service instead of direct fetch
  // ═══════════════════════════════════════════════════════════════════════════
  const validateMessage = useCallback(async (content) => {
    try {
      console.log('🛡️ [MessageCreationOverlay] Starting message validation...');
      
      const result = await messageApi.validateMessage(content);
      
      console.log('✅ [MessageCreationOverlay] Validation result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ [MessageCreationOverlay] Validation error:', error);
      // ⭐ Fail-safe: messageApi already handles this, but double-check
      return { 
        safe: true, 
        feedback: { 
          title: t('message.validation.error_title') || '메시지 검증 오류', 
          message: t('message.validation.error_message') || '메시지 검증 중 문제가 발생했습니다.' 
        } 
      };
    }
  }, [t]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Proceed Generation (실제 메시지 생성)
  // ═══════════════════════════════════════════════════════════════════════════
  const proceedGeneration = useCallback(async () => {
    try {
      setIsCreating(true);
      setProcessingMessage(t('message.validation.validating') || '메시지 검증 중...'); // ⭐ NEW: Show validation message
      HapticService.success();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 [MessageCreationOverlay] PROCEED GENERATION');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');


      console.log('messageContent:', messageContent);
      console.log('JK')
      
      const validation = await validateMessage(messageContent);
      
      console.log('📊 [MessageCreationOverlay] Validation result:', validation);
      
      if (!validation.safe) {
        // ═══════════════════════════════════════════════════════════════
        // ⚠️ Validation Failed: Show LLM-generated emotional feedback
        // ═══════════════════════════════════════════════════════════════
        console.log('❌ [MessageCreationOverlay] Validation failed!');
        console.log('   Category:', validation.category);
        console.log('   Feedback:', validation.feedback);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        setIsCreating(false);
        setProcessingMessage(''); // ⭐ Clear processing message
        HapticService.warning();
        
        // ⭐ Use LLM-generated feedback (or fallback)
        const feedbackMessage = validation.feedback || FALLBACK_VALIDATION_MESSAGE;
        
        showAlert({
          title: feedbackMessage.title,
          emoji: feedbackMessage.emoji || '💙', // ⭐ Use backend emoji or default
          message: feedbackMessage.message,
          buttons: [
            {
              text: t('common.rewrite') || '다시 작성하기',
              style: 'primary',
              onPress: () => {
                console.log('[MessageCreationOverlay] User will rewrite message');
                HapticService.light();
                // ⭐ Focus on content input for rewrite
                setTimeout(() => {
                  contentInputRef.current?.present();
                }, 300);
              }
            }
          ]
        });
        
        return;
      }
      

      // ═══════════════════════════════════════════════════════════════
      // ✅ Validation Passed: Proceed with message creation
      // ═══════════════════════════════════════════════════════════════
      console.log('✅ [MessageCreationOverlay] Validation passed! Creating message...');
      setProcessingMessage(t('message.creation.creating') || '메시지 생성 중...'); // ⭐ NEW: Change to creation message

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
        text_animation: 'slide_cross', // ⭐ Fixed: 슬라이드 효과 (좌→우)
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
          title: t('message.create_done_alert.title') || '메시지 생성 완료!',
          emoji: '🎉',
          message: t('message.create_done_alert.description') || '메시지가 성공적으로 생성되었습니다.\n지금 바로 공유하시겠습니까?',
          buttons: [

            {
              text: t('common.confirm') || '확인',
              style: 'primary',
              onPress: () => {

                onClose();

              }
            }
          ]
        });
      }
    } catch (error) {
      console.error('[MessageCreationOverlay] Create message error:', error);
      showAlert({
        title: t('common.error_title') || '오류발생',
        emoji: '❌',
        message: t('common.error') || '메시지 생성에 실패했습니다.',
        buttons: [
          {
            text: t('common.confirm') || '확인',
            style: 'primary',
            onPress: () => {
              // Focus on content input
              onClose();
            }
          }
        ]
      });
    } finally {
      setIsCreating(false);
      setProcessingMessage(''); // ⭐ Clear processing message
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
          onPress: async () => {
            // ═══════════════════════════════════════════════════════════════
            // 🛡️ NEW: Step 4 - Message Content Validation (ANIMA's Guardian)
            // ═══════════════════════════════════════════════════════════════
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🛡️ [MessageCreationOverlay] Starting content validation...');
            
            setIsCreating(true); // ⭐ Show loading
            HapticService.light();

            console.log('messageContent:', messageContent);
            console.log('JK')
            
            const validation = await validateMessage(messageContent);
            
            console.log('📊 [MessageCreationOverlay] Validation result:', validation);
            
            if (!validation.safe) {
              // ═══════════════════════════════════════════════════════════════
              // ⚠️ Validation Failed: Show LLM-generated emotional feedback
              // ═══════════════════════════════════════════════════════════════
              console.log('❌ [MessageCreationOverlay] Validation failed!');
              console.log('   Category:', validation.category);
              console.log('   Feedback:', validation.feedback);
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              
              setIsCreating(false);
              HapticService.warning();
              
              // ⭐ Use LLM-generated feedback (or fallback)
              const feedbackMessage = validation.feedback || FALLBACK_VALIDATION_MESSAGE;
              
              showAlert({
                title: feedbackMessage.title,
                emoji: feedbackMessage.emoji || '💙', // ⭐ Use backend emoji or default
                message: feedbackMessage.message,
                buttons: [
                  {
                    text: t('message.validation.rewrite_button') || '다시 작성하기',
                    style: 'primary',
                    onPress: () => {
                      console.log('[MessageCreationOverlay] User will rewrite message');
                      HapticService.light();
                      // ⭐ Focus on content input for rewrite
                      setTimeout(() => {
                        contentInputRef.current?.present();
                      }, 300);
                    }
                  }
                ]
              });
              
              return;
            }
            
            // ═══════════════════════════════════════════════════════════════
            // ✅ Validation Passed: Proceed with message creation
            // ═══════════════════════════════════════════════════════════════
            console.log('✅ [MessageCreationOverlay] Validation passed! Proceeding...');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            await proceedGeneration();
          }
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
    validateMessage, // ⭐ Validation function
    FALLBACK_VALIDATION_MESSAGE, // ⭐ Fallback message (LLM 실패 시)
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Share Message
  // ═══════════════════════════════════════════════════════════════════════════
  const handleShareMessage = useCallback(async (shareUrl) => {
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
  }, [messageContent]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Music Playback Toggle
  // ═══════════════════════════════════════════════════════════════════════════
  const handleToggleMusic = useCallback(() => {
    setIsMusicPlaying((prev) => !prev);
    HapticService.light();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Video Key for forcing remount
  // ═══════════════════════════════════════════════════════════════════════════
  const videoKey = useMemo(() => {
    return selectedPersona?.persona_key || 'default';
  }, [selectedPersona?.persona_key]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ Memoized BottomSheet Items (Performance Optimization)
  // ═══════════════════════════════════════════════════════════════════════════
  const backgroundEffectItems = useMemo(() => {
    const group = BACKGROUND_EFFECT_GROUPS.find(g => g.id === selectedBackgroundGroup);
    return group ? group.items : [];
  }, [selectedBackgroundGroup]);

  const activeEffectItems = useMemo(() => {
    const group = ACTIVE_EFFECT_GROUPS.find(g => g.id === selectedActiveGroup);
    return group ? group.items : [];
  }, [selectedActiveGroup]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ Memoized FloatingChipNavigation Groups (Performance Optimization)
  // ═══════════════════════════════════════════════════════════════════════════
  const backgroundChipGroups = useMemo(() => {
    return filterNonEmptyGroups(BACKGROUND_EFFECT_GROUPS).map(group => ({
      id: group.id,
      emoji: group.emoji || (group.items && group.items[0]?.emoji),
      title: group.title || (group.items && group.items[0]?.label),
    }));
  }, [filterNonEmptyGroups]);

  const activeChipGroups = useMemo(() => {
    return filterNonEmptyGroups(ACTIVE_EFFECT_GROUPS).map(group => ({
      id: group.id,
      emoji: group.emoji || (group.items && group.items[0]?.emoji),
      title: group.title || (group.items && group.items[0]?.label),
    }));
  }, [filterNonEmptyGroups]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ Memoized Dynamic Styles (Performance Optimization)
  // ═══════════════════════════════════════════════════════════════════════════
  const headerStyle = useMemo(() => ({
    marginTop: insets.top + (Platform.OS === 'ios' ? verticalScale(10) : verticalScale(25))
  }), [insets.top]);

  const contentContainerStyle = useMemo(() => ({
    paddingBottom: insets.bottom + platformPadding(40)
  }), [insets.bottom]);

  const quickChipsContainerStyle = useMemo(() => ({
    top: insets.top + verticalScale(120)
  }), [insets.top]);

  const stepGuideChipsStyle = useMemo(() => ({
    top: insets.top + verticalScale(120)
  }), [insets.top]);

  const floatingMusicButtonStyle = useMemo(() => ({
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    top: insets.top + verticalScale(100),
  }), [insets.top]);

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
      {/* 🎨 ANIMA Logo Overlay (Background Layer - Top Left) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <View style={styles.animaLogoContainer}>
        {/* ANIMA - Gradient Text (SVG) */}
        <Animated.View style={animaLogoAnimatedStyle}>
          <Svg height={scale(30)} width={scale(105)}>
            <Defs>
              <SvgLinearGradient id="bgAnimaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FF7FA3" stopOpacity="1" />
                <Stop offset="100%" stopColor="#A78BFA" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <SvgText
              fill="url(#bgAnimaGradient)"
              fontSize={scale(30)}
              fontWeight="bold"
              x="0"
              y={scale(25)}
              letterSpacing="0.5"
            >
              ANIMA
            </SvgText>
          </Svg>
        </Animated.View>

        {/* Soul Connection - Subtitle */}
        <Animated.View style={soulConnectionAnimatedStyle}>
          <CustomText style={styles.animaLogoSubtitle}>
            - Soul Connection
          </CustomText>
        </Animated.View>
      </View>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🌌 Layer 1: Background Effect (배경 레이어) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
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

            {/* ⭐ One-line Gradient Title: ANIMA + Soul Connection */}
            <View style={styles.titleRow}>
              {/* ANIMA - Gradient Text (SVG) */}
              <Svg height={scale(26)} width={scale(165)}>
                <Defs>
                  <SvgLinearGradient id="animaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FF7FA3" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#A78BFA" stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <SvgText
                  fill="url(#animaGradient)"
                  fontSize={scale(26)}
                  fontWeight="bold"
                  x="0"
                  y={scale(22)}
                  letterSpacing="0.5"
                >
                  {t('navigation.title.message_mode')}
                </SvgText>
              </Svg>

            </View>

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
                {/* ⭐ Simple Text Display with fixed slide animation */}
                <CustomText type="title" style={styles.content}>
                  {messageContent || '클릭하여 메시지를 입력하세요'}
                </CustomText>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
      </View>

      {/* ⭐ Quick Action Chips with Sequential Bounce Animation (2-Layer System + Emotion Preset) */}
      <Animated.View style={[
        styles.quickChipsContainer, 
        quickChipsContainerStyle,
        chipsContainerAnimatedStyle
      ]}>


        {false && (
          <>
        {/* 🌌 Chip 1: Background Effect (Layer 1) */}
        <Animated.View style={chip1AnimatedStyle}>
          <View style={styles.chipWithTooltip}>
            {/* ⭐ Tooltip Label */}
            {chipTooltips.background && (
              <View style={styles.chipTooltip}>
                <CustomText style={styles.chipTooltipText} numberOfLines={1}>
                  {t('chip_tooltips.background')}
                </CustomText>
                <View style={styles.chipTooltipArrow} />
              </View>
            )}
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
          </View>
        </Animated.View>
        </>
        )}
        {/* ✨ Chip 2: Active Effect (Layer 2) */}
        <Animated.View style={chip2AnimatedStyle}>
          <View style={styles.chipWithTooltip}>
            {/* ⭐ Tooltip Label */}
            {chipTooltips.active && (
              <View style={styles.chipTooltip}>
                <CustomText style={styles.chipTooltipText} numberOfLines={1}>
                  {t('chip_tooltips.active')}
                </CustomText>
                <View style={styles.chipTooltipArrow} />
              </View>
            )}
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
          </View>
        </Animated.View>

        {/* 🎵 Chip 3: Background Music */}
        <Animated.View style={chip3AnimatedStyle}>
          <View style={styles.chipWithTooltip}>
            {/* ⭐ Tooltip Label */}
            {chipTooltips.music && (
              <View style={styles.chipTooltip}>
                <CustomText style={styles.chipTooltipText} numberOfLines={1}>
                  {t('chip_tooltips.music')}
                </CustomText>
                <View style={styles.chipTooltipArrow} />
              </View>
            )}
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
          </View>
        </Animated.View>

        {/* 📤 Chip 4: Share (Only visible after message creation) */}
        {false && (
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
          groups={backgroundChipGroups}
          selectedGroupId={selectedBackgroundGroup}
          onSelectGroup={(groupId) => {
            setSelectedBackgroundGroup(groupId);
            console.log('[MessageCreationOverlay] Background group changed:', groupId);
          }}
        />

        {/* ⭐ Effect List View (Bottom) */}
        <EffectListView
          items={backgroundEffectItems}
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
          groups={activeChipGroups}
          selectedGroupId={selectedActiveGroup}
          onSelectGroup={(groupId) => {
            setSelectedActiveGroup(groupId);
            console.log('[MessageCreationOverlay] Active group changed:', groupId);
          }}
        />

        {/* ⭐ Effect List View (Bottom) */}
        <EffectListView
          items={activeEffectItems}
          selectedValue={activeEffect}
          onSelect={handleActiveEffectSelect}
        />
      </CustomBottomSheet>

      {/* ⭐ Custom Words/Messages Input Overlay (Modal-based for Korean input stability) */}
      <WordInputOverlay
        ref={wordInputSheetRef}
        initialWords={customWords}
        onSave={handleWordsSave}
        title={pendingActiveEffect === 'fading_messages' ? '나만의 문장 입력' : '나만의 단어 입력'}
        placeholder={pendingActiveEffect === 'fading_messages' ? '문장 입력 (최대 30자)' : '단어 입력 (최대 15자)'}
        maxLength={pendingActiveEffect === 'fading_messages' ? 30 : 15}
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
              floatingMusicButtonStyle
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
      {/* 💝 Emotion Preset Sheet (ANIMA's Ultimate Kindness) */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <EmotionPresetBottomSheet
        sheetRef={emotionPresetSheetRef}
        onPresetSelect={handlePresetSelect}
      />

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

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ⭐ Processing Loading Overlay (Validation & Creation) */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <ProcessingLoadingOverlay
        visible={isCreating}
        message={processingMessage}
      />

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
  // ⭐ NEW: Gradient Title Row (ANIMA + Soul Connection)
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center', // ✅ 수직 중앙 정렬
    gap: scale(6), // ✅ 간격 줄임
    marginLeft: scale(0), // ✅ 좌측으로 20px 이동
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
  // ⭐ NEW: Emotion Preset Chip (Golden highlight for ANIMA's kindness)
  emotionPresetChip: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)', // Gold tint
    borderColor: '#FFD700', // Gold border
    borderWidth: 2,
  },
  // ⭐ NEW: Chip with Tooltip Container
  chipWithTooltip: {
    position: 'relative', // ⭐ Changed: relative positioning to keep chip fixed
    width: 'auto',
  },
  // ⭐ NEW: Chip Tooltip Label (Absolute positioned to not affect chip position)
  chipTooltip: {
    position: 'absolute', // ⭐ Absolute positioning
    top: verticalScale(10),
    right: scale(60), // ⭐ Position to the left of chip (chip width + margin)
    alignSelf: 'center', // ⭐ Center vertically (without height constraint)
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 'auto',
    ...Platform.select({
      android: { elevation: 4 },
    }),
  },
  chipTooltipText: {
    fontSize: scale(14),
    color: '#FFFFFF',
    fontWeight: '600',
    width: 'auto',
  },
  chipTooltipArrow: {
    marginLeft: scale(4), // ⭐ Position arrow at the end
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderTopColor: 'transparent',
    borderBottomWidth: 5,
    borderBottomColor: 'transparent',
    borderLeftWidth: 5,
    borderLeftColor: 'rgba(0, 0, 0, 0.9)',
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
  // ⭐ ANIMA Logo Overlay (Background Layer)
  animaLogoContainer: {
    position: 'absolute',
    top: verticalScale(120), // ⭐ 헤더 아래 (약간의 여유 공간)
    left: scale(20),
    zIndex: 15, // ⭐ BackgroundEffect(10)와 ActiveEffect(50) 사이
    elevation: 15,
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
});

export default MessageCreationOverlay;


