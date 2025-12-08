/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 MessageCreationScreen - 메시지 생성 전용 화면
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - PersonaStudioScreen에서 분리된 메시지 생성 전용 화면
 * - 페르소나 선택 후 navigation.push로 진입
 * - 메시지 입력 + 효과 설정 + URL 생성을 한 화면에서 처리
 * 
 * Features:
 * - 선택된 페르소나 배경 (Image/Video)
 * - 메시지 제목 & 내용 입력
 * - 텍스트 애니메이션 선택 (그룹화 아코디언)
 * - 파티클 효과 선택 (그룹화 아코디언)
 * - 배경 음악 선택 (그룹화)
 * - URL 생성 버튼
 * - 뒤로가기 버튼 (navigation.goBack)
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-08
 */

import React, { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Keyboard,
  BackHandler,
  Platform,
  Share, // ⭐ For sharing
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';

// ═══════════════════════════════════════════════════════════════════════════
// Contexts & Services
// ═══════════════════════════════════════════════════════════════════════════
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext'; // ⭐ For Alert & Badge
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import HapticService from '../utils/HapticService';
import messageService from '../services/api/messageService'; // ⭐ Default import

// ═══════════════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════════════
import CustomText from '../components/CustomText';
import PersonaBackgroundView from '../components/message/PersonaBackgroundView'; // ⭐ ADD
import ParticleEffect from '../components/particle/ParticleEffect';
import MessageInputOverlay from '../components/message/MessageInputOverlay';
import MusicSelectionOverlay from '../components/music/MusicSelectionOverlay';
import EffectGroupAccordion from '../components/EffectGroupAccordion';
import CustomBottomSheet from '../components/CustomBottomSheet'; // ⭐ Common BottomSheet component
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // ⭐ For header icons
import { COLORS } from '../styles/commonstyles';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════
import { TEXT_ANIMATION_GROUPS, PARTICLE_EFFECT_GROUPS } from '../constants/effect-groups';

const MessageCreationScreen = ({ navigation, route }) => {
  const { selectedPersona } = route.params || {};
  const { theme } = useTheme();
  const { user } = useUser();
  const { showAlert, setHasNewMessage, setCreatedMessageUrl, createdMessageUrl } = useAnima(); // ⭐ For Alert & Badge
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔍 디버깅: 화면 마운트 확인
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    console.log('🎯 [MessageCreationScreen] ===== MOUNTED =====');
    console.log('🎯 [MessageCreationScreen] selectedPersona:', selectedPersona?.persona_name);
    console.log('🎯 [MessageCreationScreen] navigation exists:', !!navigation);
    console.log('🎯 [MessageCreationScreen] navigation.getParent exists:', !!navigation.getParent);
    
    if (navigation.getParent) {
      const parent = navigation.getParent();
      console.log('🎯 [MessageCreationScreen] parent navigator exists:', !!parent);
      console.log('🎯 [MessageCreationScreen] parent navigator id:', parent?.getId?.());
    }

    return () => {
      console.log('🎯 [MessageCreationScreen] ===== UNMOUNTED =====');
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Hide tab bar on mount (더 강력한 방법)
  // ═══════════════════════════════════════════════════════════════════════════
  useLayoutEffect(() => {
    console.log('🔵 [MessageCreationScreen] useLayoutEffect - START');
    console.log('🔵 [MessageCreationScreen] navigation:', !!navigation);
    console.log('🔵 [MessageCreationScreen] navigation.getParent:', !!navigation.getParent);
    
    try {
      const parent = navigation.getParent();
      console.log('🔵 [MessageCreationScreen] parent:', !!parent);
      
      if (parent) {
        console.log('🔵 [MessageCreationScreen] Calling parent.setOptions({ tabBarStyle: { display: "none" } })');
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
        console.log('✅ [MessageCreationScreen] Tab bar hide command sent!');
      } else {
        console.warn('⚠️ [MessageCreationScreen] Parent navigator not found!');
      }
    } catch (error) {
      console.error('❌ [MessageCreationScreen] Error hiding tab bar:', error);
    }

    return () => {
      console.log('🔵 [MessageCreationScreen] useLayoutEffect - CLEANUP');
      try {
        const parent = navigation.getParent();
        if (parent) {
          setTimeout(() => {
            console.log('🔵 [MessageCreationScreen] Restoring tab bar...');
            parent.setOptions({
              tabBarStyle: undefined,
            });
            console.log('✅ [MessageCreationScreen] Tab bar restore command sent!');
          }, 100);
        }
      } catch (error) {
        console.error('❌ [MessageCreationScreen] Error restoring tab bar:', error);
      }
    };
  }, [navigation]);

  // ⭐ 추가: useFocusEffect로도 처리
  useEffect(() => {
    console.log('🟢 [MessageCreationScreen] Setting up focus listener');
    
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🟢 [MessageCreationScreen] Screen FOCUSED!');
      try {
        const parent = navigation.getParent();
        if (parent) {
          console.log('🟢 [MessageCreationScreen] Focus listener - hiding tab bar');
          parent.setOptions({
            tabBarStyle: { display: 'none' },
          });
          console.log('✅ [MessageCreationScreen] Tab bar hide command sent (from focus)!');
        } else {
          console.warn('⚠️ [MessageCreationScreen] Parent navigator not found in focus listener!');
        }
      } catch (error) {
        console.error('❌ [MessageCreationScreen] Error in focus listener:', error);
      }
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('🔴 [MessageCreationScreen] Screen BLURRED (leaving)!');
    });

    return () => {
      console.log('🟢 [MessageCreationScreen] Removing focus/blur listeners');
      unsubscribe();
      unsubscribeBlur();
    };
  }, [navigation]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Refs
  // ═══════════════════════════════════════════════════════════════════════════
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const textAnimationSheetRef = useRef(null); // ⭐ Text Animation BottomSheet
  const particleEffectSheetRef = useRef(null); // ⭐ Particle Effect BottomSheet

  // ═══════════════════════════════════════════════════════════════════════════
  // State Management
  // ═══════════════════════════════════════════════════════════════════════════
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [textAnimation, setTextAnimation] = useState('fade_in');
  const [particleEffect, setParticleEffect] = useState('none');
  const [bgMusic, setBgMusic] = useState('none');
  const [bgMusicUrl, setBgMusicUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // ⭐ Selection Panel State
  const [showMusicSelection, setShowMusicSelection] = useState(false); // ⭐ Music selection modal
  
  // ⭐ Accordion Group State
  const [openTextGroups, setOpenTextGroups] = useState({});
  const [openParticleGroups, setOpenParticleGroups] = useState({});
  
  // ⭐ Track if accordion has been interacted with (to ignore defaultOpen)
  const [textAccordionTouched, setTextAccordionTouched] = useState(false);
  const [particleAccordionTouched, setParticleAccordionTouched] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // Android Back Button Handler
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ Track which sheet is open (for Android back button)
  const [isTextSheetOpen, setIsTextSheetOpen] = useState(false);
  const [isParticleSheetOpen, setIsParticleSheetOpen] = useState(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('[MessageCreationScreen] Android back button pressed');
      
      // 1️⃣ If music selection is open, close it
      if (showMusicSelection) {
        console.log('[MessageCreationScreen] Closing music selection');
        handleMusicClose();
        return true;
      }
      
      // 2️⃣ If text animation sheet is open, close it
      if (isTextSheetOpen) {
        console.log('[MessageCreationScreen] Closing text animation sheet');
        textAnimationSheetRef.current?.dismiss();
        return true;
      }
      
      // 3️⃣ If particle effect sheet is open, close it
      if (isParticleSheetOpen) {
        console.log('[MessageCreationScreen] Closing particle effect sheet');
        particleEffectSheetRef.current?.dismiss();
        return true;
      }
      
      // 4️⃣ Otherwise, navigate back
      console.log('[MessageCreationScreen] Navigating back');
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [showMusicSelection, isTextSheetOpen, isParticleSheetOpen, navigation]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Text Animation Values & Logic
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ⭐ Typing Animation State
  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const typingIndexRef = useRef(0);
  const typingIntervalRef = useRef(null);
  const cursorIntervalRef = useRef(null);

  // ⭐ Animation Shared Values
  const textOpacity = useSharedValue(1);
  const textScale = useSharedValue(1);
  const textTranslateX = useSharedValue(0);
  const textTranslateY = useSharedValue(0);
  const textRotate = useSharedValue(0);

  // ⭐ Trigger Animation: 2초 후 효과 발생
  useEffect(() => {
    if (!messageContent) return;

    console.log('[MessageCreationScreen] 🎬 Text animation changed:', textAnimation);

    // ⭐ Typing Animation (special case)
    if (textAnimation === 'typing') {
      typingIndexRef.current = 0;
      setTypingText('');

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
      }, 2000); // ⭐ 2초 후 시작

      return () => {
        clearTimeout(typingTimeout);
        clearInterval(typingIntervalRef.current);
        clearInterval(cursorIntervalRef.current);
      };
    }

    // ⭐ Other Animations: Reset & Trigger after 2 seconds
    setTypingText(messageContent);

    // Reset all values
    textOpacity.value = 1;
    textScale.value = 1;
    textTranslateX.value = 0;
    textTranslateY.value = 0;
    textRotate.value = 0;

    switch (textAnimation) {
      // ═══════════════════════════════════════════════════════════
      // Group 1: Gentle (부드러운) 💙
      // ═══════════════════════════════════════════════════════════
      case 'fade_in':
        textOpacity.value = 0;
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 800 }));
        break;

      case 'breath':
        textScale.value = withDelay(2000, 
          withSequence(
            withTiming(1.05, { duration: 1000 }),
            withTiming(0.95, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          )
        );
        break;

      case 'blur_focus':
        // Simulated with opacity + scale
        textOpacity.value = 0.3;
        textScale.value = 0.95;
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 1000 }));
        textScale.value = withDelay(2000, withTiming(1, { duration: 1000 }));
        break;

      // ═══════════════════════════════════════════════════════════
      // Group 2: Dynamic (역동적인) ⚡
      // ═══════════════════════════════════════════════════════════
      case 'letter_drop':
        textTranslateY.value = -100;
        textOpacity.value = 0;
        textTranslateY.value = withDelay(2000, withSpring(0, { damping: 8 }));
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 400 }));
        break;

      case 'rotate_in':
        textRotate.value = 180;
        textOpacity.value = 0;
        textRotate.value = withDelay(2000, withSpring(0, { damping: 10 }));
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 600 }));
        break;

      // ═══════════════════════════════════════════════════════════
      // Group 3: Impactful (임팩트) 💥
      // ═══════════════════════════════════════════════════════════
      case 'scale_in':
        textScale.value = 0;
        textScale.value = withDelay(2000, withSpring(1, { damping: 10 }));
        break;

      case 'split':
        textScale.value = 0;
        textTranslateX.value = withDelay(2000,
          withSequence(
            withTiming(-50, { duration: 300 }),
            withTiming(0, { duration: 300 })
          )
        );
        textScale.value = withDelay(2000, withSpring(1, { damping: 8 }));
        break;

      case 'glow_pulse':
        textScale.value = withDelay(2000,
          withSequence(
            withTiming(1.2, { duration: 400 }),
            withTiming(1, { duration: 400 })
          )
        );
        textOpacity.value = withDelay(2000,
          withSequence(
            withTiming(0.7, { duration: 400 }),
            withTiming(1, { duration: 400 })
          )
        );
        break;

      // ═══════════════════════════════════════════════════════════
      // Group 4: Playful (경쾌한) 🎨
      // ═══════════════════════════════════════════════════════════
      case 'slide_cross':
        textTranslateX.value = -300;
        textTranslateX.value = withDelay(2000, withSpring(0, { damping: 12 }));
        break;

      case 'wave':
        textTranslateY.value = withDelay(2000,
          withSequence(
            withTiming(-10, { duration: 200 }),
            withTiming(10, { duration: 200 }),
            withTiming(-10, { duration: 200 }),
            withTiming(0, { duration: 200 })
          )
        );
        break;

      case 'stagger':
        textTranslateX.value = -50;
        textOpacity.value = 0;
        textTranslateX.value = withDelay(2000, withSpring(0, { damping: 15 }));
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 600 }));
        break;

      case 'flip':
        textRotate.value = 90;
        textOpacity.value = 0;
        textRotate.value = withDelay(2000, withSpring(0, { damping: 12 }));
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 300 }));
        break;

      case 'rainbow':
        textScale.value = withDelay(2000,
          withSequence(
            withTiming(1.1, { duration: 300 }),
            withTiming(0.9, { duration: 300 }),
            withTiming(1, { duration: 300 })
          )
        );
        break;

      default:
        // fade_in as default
        textOpacity.value = 0;
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 800 }));
        break;
    }
  }, [textAnimation, messageContent]);

  // ⭐ Animated Styles
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
  // Handlers: Selection Panel
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ Chip Press Handlers
  const handleTextAnimationChipPress = () => {
    console.log('[MessageCreationScreen] Opening text animation sheet');
    Keyboard.dismiss();
    HapticService.light();
    textAnimationSheetRef.current?.present();
  };

  const handleParticleEffectChipPress = () => {
    console.log('[MessageCreationScreen] Opening particle effect sheet');
    Keyboard.dismiss();
    HapticService.light();
    particleEffectSheetRef.current?.present();
  };

  const handleBgMusicChipPress = () => {
    console.log('[MessageCreationScreen] Opening music selection');
    Keyboard.dismiss();
    HapticService.light();
    setShowMusicSelection(true);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Effect Selection
  // ═══════════════════════════════════════════════════════════════════════════
  const handleTextAnimationSelect = (effectId) => {
    setTextAnimation(effectId);
    HapticService.selection();
    textAnimationSheetRef.current?.dismiss();
  };

  const handleParticleEffectSelect = (effectId) => {
    setParticleEffect(effectId);
    HapticService.selection();
    particleEffectSheetRef.current?.dismiss();
  };

  const handleMusicSelect = (music) => {
    console.log('[MessageCreationScreen] Music selected:', music);
    
    if (music.music_key === 'none') {
      setBgMusic('none');
      setBgMusicUrl('');
    } else {
      setBgMusic(music.music_key || music.id);
      setBgMusicUrl(music.music_url || music.url || '');
    }
    
    setShowMusicSelection(false);
    HapticService.selection();
  };
  
  const handleMusicClose = () => {
    setShowMusicSelection(false);
    HapticService.light();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Accordion Toggle (⭐ Only one group can be open at a time)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleToggleTextGroup = (groupId) => {
    console.log('[MessageCreationScreen] 🔄 Toggle text group:', groupId);
    setTextAccordionTouched(true); // ⭐ Mark as touched
    setOpenTextGroups((prev) => {
      console.log('[MessageCreationScreen] 📊 Previous state:', prev);
      const isCurrentlyOpen = prev[groupId];
      console.log('[MessageCreationScreen] 📊 isCurrentlyOpen:', isCurrentlyOpen);
      const newState = { [groupId]: !isCurrentlyOpen };
      console.log('[MessageCreationScreen] 📊 New state:', newState);
      return newState;
    });
    HapticService.light();
  };

  const handleToggleParticleGroup = (groupId) => {
    console.log('[MessageCreationScreen] 🔄 Toggle particle group:', groupId);
    setParticleAccordionTouched(true); // ⭐ Mark as touched
    setOpenParticleGroups((prev) => {
      console.log('[MessageCreationScreen] 📊 Previous state:', prev);
      const isCurrentlyOpen = prev[groupId];
      console.log('[MessageCreationScreen] 📊 isCurrentlyOpen:', isCurrentlyOpen);
      const newState = { [groupId]: !isCurrentlyOpen };
      console.log('[MessageCreationScreen] 📊 New state:', newState);
      return newState;
    });
    HapticService.light();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Message Input
  // ═══════════════════════════════════════════════════════════════════════════
  const handleTitleSave = (value) => {
    setMessageTitle(value);
    titleInputRef.current?.dismiss();
  };

  const handleContentSave = (value) => {
    setMessageContent(value);
    contentInputRef.current?.dismiss();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Generate URL
  // ═══════════════════════════════════════════════════════════════════════════
  const handleGenerateURL = async () => {
    if (!messageTitle.trim()) {
      Alert.alert(t('common.error'), '제목을 입력해주세요.');
      return;
    }
    if (!messageContent.trim()) {
      Alert.alert(t('common.error'), '내용을 입력해주세요.');
      return;
    }

    try {
      setIsCreating(true);
      HapticService.success();

      const response = await messageService.createMessage({
        user_key: user?.user_key,
        persona_key: selectedPersona?.persona_key,
        memory_key: selectedPersona?.history_key,
        message_title: messageTitle,
        message_content: messageContent,
        text_animation: textAnimation,
        particle_effect: particleEffect,
        bg_music: bgMusic || 'none',
        bg_music_url: bgMusicUrl,
        effect_config: null,
        persona_name: selectedPersona?.persona_name,
        persona_image_url: selectedPersona?.persona_image_url,
        persona_video_url: selectedPersona?.persona_video_url,
        has_password: 'N',
        public_yn: 'Y',
      });

      if (response.data.success && response.data.data.short_code) {
        console.log('✅ [MessageCreationScreen] Message created successfully');
        
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
                console.log('[MessageCreationScreen] User chose to share later');
              }
            },
            {
              text: '공유하기',
              style: 'primary',
              onPress: () => {
                console.log('[MessageCreationScreen] User chose to share now');
                handleShareMessage(shareUrl);
              }
            }
          ]
        });
      }
    } catch (error) {
      console.error('[MessageCreationScreen] Create message error:', error);
      Alert.alert(t('common.error'), '메시지 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Share Message
  // ═══════════════════════════════════════════════════════════════════════════
  const handleShareMessage = async (shareUrl) => {
    try {
      HapticService.light();
      await Share.share({
        message: Platform.OS === 'ios' 
          ? `${messageTitle}\n\n${shareUrl}`
          : shareUrl,
        url: Platform.OS === 'ios' ? shareUrl : undefined,
        title: messageTitle || 'ANIMA Message',
      });
      console.log('✅ [MessageCreationScreen] Message shared');
    } catch (error) {
      console.error('[MessageCreationScreen] Share error:', error);
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
  // Render
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🎨 [MessageCreationScreen] ===== RENDER =====');
  console.log('🎨 [MessageCreationScreen] messageTitle:', messageTitle);
  console.log('🎨 [MessageCreationScreen] particleEffect:', particleEffect);
  console.log('🎨 [MessageCreationScreen] bgMusic:', bgMusic);

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor || COLORS.BACKGROUND }}>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Background: Persona Image/Video (using PersonaBackgroundView) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <PersonaBackgroundView
        persona={selectedPersona}
        isScreenFocused={true}
        opacity={1}
        videoKey={videoKey}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Particle Effect */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {particleEffect && particleEffect !== 'none' && (
        <ParticleEffect type={particleEffect} isActive={true} />
      )}

      {/* Header (PersonaStudioScreen 패턴) */}
      <View style={[styles.header, { paddingTop: insets.top + verticalScale(20) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={scale(24)} color={theme.textPrimary || '#FFFFFF'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <CustomText type="big" bold style={[styles.headerTitle, { color: theme.textPrimary || '#FFFFFF' }]}>
            {t('navigation.title.message_mode')}
          </CustomText>
          <CustomText type="middle" style={[styles.headerSubtitle, { color: theme.textSecondary || 'rgba(255,255,255,0.7)' }]}>
            {t('navigation.subtitle.message_mode')}
          </CustomText>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentWrapper}>
        {/* URL 생성 플로팅 버튼 (우측 상단) */}
        <TouchableOpacity
          onPress={handleGenerateURL}
          disabled={isCreating}
          style={[
            styles.urlFloatingButton, 
            { 
              backgroundColor: theme.mainColor,
              top: insets.top + verticalScale(20), // ⭐ Safe Area 적용
            }
          ]}
        >
          {isCreating ? (
            <Icon name="loading" size={scale(20)} color="#fff" />
          ) : (
            <Icon name="link-variant" size={scale(20)} color="#fff" />
          )}
        </TouchableOpacity>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        >
          <View style={[styles.contentContainer, { paddingBottom: insets.bottom + platformPadding(40) }]}>
            {/* Title */}
            <TouchableOpacity onPress={() => titleInputRef.current?.present()}>
              <CustomText type="big" bold style={styles.title}>
                {messageTitle || '제목을 입력하세요'}
              </CustomText>
            </TouchableOpacity>

            {/* Content with Animation */}
            <TouchableOpacity onPress={() => contentInputRef.current?.present()}>
              <Animated.View style={animatedTextStyle}>
                <CustomText type="title" style={styles.content}>
                  {textAnimation === 'typing' ? (
                    <>
                      {typingText}
                      {showCursor && <CustomText style={styles.cursor}>▌</CustomText>}
                    </>
                  ) : (
                    messageContent || typingText || '내용을 입력하세요'
                  )}
                </CustomText>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Action Chips (Right Side) - MessageHistoryChips 스타일 */}
      <View style={[styles.quickChipsContainer, { top: insets.top + verticalScale(120) }]}>
        {/* Text Animation Chip */}
        <TouchableOpacity
          style={[
            styles.quickChip,
            textAnimation !== 'fade_in' && { backgroundColor: 'rgba(59, 130, 246, 0.2)' }
          ]}
          onPress={handleTextAnimationChipPress}
          activeOpacity={0.7}
        >
          <Icon name="format-text" size={scale(20)} color={theme.mainColor} />
        </TouchableOpacity>

        {/* Particle Effect Chip */}
        <TouchableOpacity
          style={[
            styles.quickChip,
            particleEffect !== 'none' && { backgroundColor: 'rgba(59, 130, 246, 0.2)' }
          ]}
          onPress={handleParticleEffectChipPress}
          activeOpacity={0.7}
        >
          <Icon name="shimmer" size={scale(20)} color={theme.mainColor} />
        </TouchableOpacity>

        {/* Background Music Chip */}
        <TouchableOpacity
          style={[
            styles.quickChip,
            bgMusic !== 'none' && { backgroundColor: 'rgba(59, 130, 246, 0.2)' }
          ]}
          onPress={handleBgMusicChipPress}
          activeOpacity={0.7}
        >
          <Icon name="music-note" size={scale(20)} color={theme.mainColor} />
        </TouchableOpacity>

        {/* ⭐ Share Chip (Only visible after message creation) */}
        {createdMessageUrl && (
          <TouchableOpacity
            style={[
              styles.quickChip,
              { backgroundColor: 'rgba(76, 175, 80, 0.3)' } // ⭐ 초록색 하이라이트
            ]}
            onPress={() => handleShareMessage(createdMessageUrl)}
            activeOpacity={0.7}
          >
            <Icon name="share-variant" size={scale(20)} color="#4CAF50" />
          </TouchableOpacity>
        )}
      </View>

      {/* ⭐ Text Animation BottomSheet */}
      <CustomBottomSheet
        ref={textAnimationSheetRef}
        title={t('message_preview.text_animation')}
        snapPoints={['70%']}
        enableDynamicSizing={false}
        onDismiss={() => {
          console.log('[MessageCreationScreen] Text animation sheet dismissed');
          setIsTextSheetOpen(false);
        }}
        onChange={(index) => {
          setIsTextSheetOpen(index >= 0);
        }}
      >
        {filterNonEmptyGroups(TEXT_ANIMATION_GROUPS).map((group) => {
          // ⭐ If accordion has been touched, ignore defaultOpen
          const isOpen = textAccordionTouched 
            ? (openTextGroups[group.id] === true)
            : (openTextGroups[group.id] !== undefined ? openTextGroups[group.id] : group.defaultOpen);
          
          console.log('[MessageCreationScreen] 🎨 Rendering text group:', group.id, 'isOpen:', isOpen, 'touched:', textAccordionTouched, 'state:', openTextGroups[group.id], 'defaultOpen:', group.defaultOpen);
          
          return (
            <EffectGroupAccordion
              key={group.id}
              group={group}
              isOpen={isOpen}
              onToggle={() => handleToggleTextGroup(group.id)}
              selectedValue={textAnimation}
              onSelect={handleTextAnimationSelect}
            />
          );
        })}
      </CustomBottomSheet>

      {/* ⭐ Particle Effect BottomSheet */}
      <CustomBottomSheet
        ref={particleEffectSheetRef}
        title={t('message_preview.particle_effect')}
        snapPoints={['70%']}
        enableDynamicSizing={false}
        onDismiss={() => {
          console.log('[MessageCreationScreen] Particle effect sheet dismissed');
          setIsParticleSheetOpen(false);
        }}
        onChange={(index) => {
          setIsParticleSheetOpen(index >= 0);
        }}
      >
        {filterNonEmptyGroups(PARTICLE_EFFECT_GROUPS).map((group) => {
          // ⭐ If accordion has been touched, ignore defaultOpen
          const isOpen = particleAccordionTouched 
            ? (openParticleGroups[group.id] === true)
            : (openParticleGroups[group.id] !== undefined ? openParticleGroups[group.id] : group.defaultOpen);
          
          console.log('[MessageCreationScreen] 🎨 Rendering particle group:', group.id, 'isOpen:', isOpen, 'touched:', particleAccordionTouched, 'state:', openParticleGroups[group.id], 'defaultOpen:', group.defaultOpen);
          
          return (
            <EffectGroupAccordion
              key={group.id}
              group={group}
              isOpen={isOpen}
              onToggle={() => handleToggleParticleGroup(group.id)}
              selectedValue={particleEffect}
              onSelect={handleParticleEffectSelect}
            />
          );
        })}
      </CustomBottomSheet>

      {/* Message Input Overlays */}
      <MessageInputOverlay
        ref={titleInputRef}
        title="제목 입력"
        placeholder="메시지 제목을 입력하세요"
        leftIcon="text"
        initialValue={messageTitle}
        maxLength={50}
        multiline={false}
        onSave={handleTitleSave}
      />

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

      {/* Music Selection Overlay */}
      <MusicSelectionOverlay
        visible={showMusicSelection}
        onClose={handleMusicClose}
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
                backgroundColor: theme.mainColor,
                top: insets.top + verticalScale(70),
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
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // Header (PersonaStudioScreen 패턴)
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(16),
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // 약간의 배경
  },
  backButton: {
    marginRight: scale(12),
    padding: scale(8),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    marginBottom: scale(2),
  },
  headerSubtitle: {
    fontSize: scale(13),
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
    textAlign: 'left',
    color: '#FFFFFF',
    lineHeight: scale(24),
  },
  cursor: {
    color: '#FFFFFF',
  },
  urlFloatingButton: {
    position: 'absolute',
    // ⚠️ top is set inline with insets.top
    right: scale(20),
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
    right: scale(16), // ⭐ MessageHistoryChips와 동일
    gap: verticalScale(10), // ⭐ MessageHistoryChips와 동일
    zIndex: 100,
    elevation: 100,
  },
  quickChip: {
    width: scale(52), // ⭐ MessageHistoryChips와 동일 (50 → 52)
    height: scale(52),
    borderRadius: scale(26), // ⭐ (25 → 26)
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // ⭐ MessageHistoryChips와 동일
    borderWidth: 1.5, // ⭐ MessageHistoryChips와 동일 (추가)
    borderColor: 'rgba(255, 255, 255, 0.3)', // ⭐ MessageHistoryChips와 동일 (추가)
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, // ⭐ MessageHistoryChips와 동일 (0.3 → 0.4)
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 }, // ⭐ MessageHistoryChips와 동일
    }),
  },
  // ⭐ Selection Panel styles removed (CustomBottomSheet handles styling)
});

export default MessageCreationScreen;

