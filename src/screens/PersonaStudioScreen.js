/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 PersonaStudioScreen - Unified Persona & Message Creation Hub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Vertical swipe: Switch personas (PersonaSwipeViewer)
 * - Horizontal swipe: Switch dresses (future)
 * - Message creation overlay (bottom)
 * - Quick action chips (right side)
 * - Persona selector (top)
 * - Perfect SafeArea handling
 * - Z-INDEX layering for optimal UX
 * 
 * Layer Structure:
 * - BASE LAYER (Z-1): PersonaSwipeViewer (full screen)
 * - LAYER 2 (Z-10): MessageCreatorView (bottom overlay)
 * - LAYER 3 (Z-20): QuickActionChips (right overlay)
 * - LAYER 4 (Z-30): PersonaSelectorHorizontal (top overlay)
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-30
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, BackHandler, PanResponder, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import SafeScreen from '../components/SafeScreen';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { usePersona } from '../contexts/PersonaContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import PersonaSwipeViewer from '../components/persona/PersonaSwipeViewer';
import MessageCreatorView from '../components/message/MessageCreatorView';
import QuickActionChipsAnimated from '../components/quickaction/QuickActionChipsAnimated';
import MessageModeQuickActionChips from '../components/message/MessageModeQuickActionChips'; // ⭐ NEW
import PersonaSelectorButton from '../components/persona/PersonaSelectorButton'; // ⭐ Button for panel toggle
import PersonaSelectorPanel from '../components/persona/PersonaSelectorPanel'; // ⭐ NEW: Slide panel
import PersonaSearchOverlay from '../components/persona/PersonaSearchOverlay'; // ⭐ NEW: Persona search overlay
import MessageSearchOverlay from '../components/message/MessageSearchOverlay'; // ⭐ NEW: Message search overlay
import ChoicePersonaSheet from '../components/persona/ChoicePersonaSheet';
import AnimaLoadingOverlay from '../components/persona/AnimaLoadingOverlay';
import AnimaSuccessCard from '../components/persona/AnimaSuccessCard';
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import HapticService from '../utils/HapticService';
import { createPersona, checkPersonaStatus, getPersonaList } from '../services/api/personaApi';
import { listMessages } from '../services/api/messageService';
import CustomText from '../components/CustomText';
import { COLORS } from '../styles/commonstyles';
import GradientOverlay from '../components/GradientOverlay';


const PersonaStudioScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { personas } = usePersona();
  const { user } = useUser();
  const { showToast, showAlert } = useAnima();

  // ═══════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0);
  const [currentPersona, setCurrentPersona] = useState(null);
  const [isMessageMode, setIsMessageMode] = useState(false); // ⭐ Message mode toggle
  const [isPanelVisible, setIsPanelVisible] = useState(false); // ⭐ NEW: PersonaSelectorPanel toggle
  const [isPersonaCreationOpen, setIsPersonaCreationOpen] = useState(false);
  const [isLoadingPersona, setIsLoadingPersona] = useState(false);
  const [isSuccessCardVisible, setIsSuccessCardVisible] = useState(false);
  const [createdPersona, setCreatedPersona] = useState(null);
  const [isSearchOverlayVisible, setIsSearchOverlayVisible] = useState(false); // ⭐ Persona search overlay
  const [isMessageSearchVisible, setIsMessageSearchVisible] = useState(false); // ⭐ Message search overlay
  const [messages, setMessages] = useState([]); // ⭐ Message history
  const [selectedMessage, setSelectedMessage] = useState(null); // ⭐ Selected message for editing
  const swiperRef = useRef(null); // ⭐ NEW: Ref for PersonaSwipeViewer
  const savedIndexRef = useRef(0);
  const personaCreationDataRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════
  // FADE ANIMATIONS (Explore Mode ⇄ Message Mode)
  // ═══════════════════════════════════════════════════════════════════════
  const exploreModeOpacity = useSharedValue(1); // ⭐ Explore mode UI opacity
  const messageModeOpacity = useSharedValue(0); // ⭐ Message mode UI opacity
  
  // ═══════════════════════════════════════════════════════════════════════
  // PAN RESPONDER (Left/Right Swipe for Mode Toggle)
  // ═══════════════════════════════════════════════════════════════════════
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false, // Don't capture immediately
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // Only capture if horizontal movement is significant
          const { dx, dy } = gestureState;
          const isHorizontal = Math.abs(dx) > Math.abs(dy); // Horizontal swipe?
          const isSignificant = Math.abs(dx) > 30; // At least 30px
          
          console.log('[PanResponder] Move check:', { dx, dy, isHorizontal, isSignificant, isMessageMode });
          
          return isHorizontal && isSignificant;
        },
        onPanResponderGrant: (evt, gestureState) => {
          console.log('[PanResponder] Gesture granted');
        },
        onPanResponderRelease: (evt, gestureState) => {
          const { dx, vx } = gestureState;
          const swipeThreshold = 80; // 80px 이상 스와이프
          const velocityThreshold = 0.5; // 또는 빠른 속도
          
          console.log('[PanResponder] Swipe detected:', { dx, vx, isMessageMode });
          
          // 왼쪽으로 스와이프 (← 메시지 모드 진입)
          if ((dx < -swipeThreshold || vx < -velocityThreshold) && !isMessageMode) {
            console.log('[PanResponder] ← Left swipe detected, entering Message Mode');
            handleQuickMessage();
          }
          // 오른쪽으로 스와이프 (→ 일반 모드 복귀)
          else if ((dx > swipeThreshold || vx > velocityThreshold) && isMessageMode) {
            console.log('[PanResponder] → Right swipe detected, exiting Message Mode');
            handleExitMessageMode();
          }
        },
      }),
    [isMessageMode, handleQuickMessage, handleExitMessageMode]
  );
  
  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN FOCUS HANDLER
  // ═══════════════════════════════════════════════════════════════════════
  useFocusEffect(
    
    useCallback(() => {
      // Screen is focused
      setIsScreenFocused(true);

      const onBackPress = () => {
        // Message Mode인 경우 먼저 닫기
        console.log('🎯 [PersonaStudioScreen] Back button pressed, isMessageMode:', isMessageMode);
        if (isMessageMode) {

            showAlert({
              title: t('message.alert.exit_message_mode'),
              message: t('message.alert.exit_message_mode_description'),
              buttons: [
                { text: t('message.alert.cancel'), style: 'cancel' },
                { text: t('message.alert.exit'), onPress: () => setIsMessageMode(false) },
              ],
            });
            return true;
        }
        
        return false;
    };

    // 백 버튼 이벤트 및 앱 상태 리스너 등록
    const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      
      return () => {
        // Screen is blurred (navigated away)
        setIsScreenFocused(false);
        backHandlerSubscription.remove();
        
        if (__DEV__) {
          console.log('🎯 [PersonaStudioScreen] Screen BLURRED');
        }
      };
    }, [])
  );

  useEffect(() => {
    console.log('🎯 [PersonaStudioScreen] isMessageMode:', isMessageMode);

    const onBackPress = () => {
        // Message Mode인 경우 먼저 닫기
        console.log('🎯 [PersonaStudioScreen] Back button pressed, isMessageMode:', isMessageMode);
        if (isMessageMode) {
            showAlert({
              title: t('message.alert.exit_message_mode'),
              message: t('message.alert.exit_message_mode_description'),
              buttons: [
                { text: t('message.alert.cancel'), style: 'cancel' },
                { text: t('message.alert.exit'), onPress: () => setIsMessageMode(false) },
              ],
            });
            return true;
        }
        
        return false;
    };
    const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      console.log('🎯 [PersonaStudioScreen] isMessageMode unmounted');
      backHandlerSubscription.remove();
    };
  }, [isMessageMode]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // DEFAULT PERSONAS (SAGE, Nexus)
  // ═══════════════════════════════════════════════════════════════════════
  const DEFAULT_PERSONAS = useMemo(() => [
    {
      persona_key: 'default_sage',
      persona_name: 'SAGE',
      persona_gender: 'male',
      persona_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/f91b1fb7-d162-470d-9a43-2ee5835ee0bd_00001_.png',
      selected_dress_video_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/46fb3532-e41a-4b96-8105-a39e64f39407_00001_.mp4',
      selected_dress_video_convert_done: 'Y',
      selected_dress_image_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/f91b1fb7-d162-470d-9a43-2ee5835ee0bd_00001_.png',
      isDefault: true,
      done_yn: 'Y', // ⭐ FIX: Add done_yn to prevent loading indicator
      dress_count: 0,
    },
    {
      persona_key: 'default_nexus',
      persona_name: 'Nexus',
      persona_gender: 'female',
      persona_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/29e7b9c3-b2a2-4559-8021-a8744ef509cd_00001_.png',
      selected_dress_video_url: null, // ⭐ FIX: Temporarily disable video due to URL error
      selected_dress_video_convert_done: 'N',
      selected_dress_image_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/29e7b9c3-b2a2-4559-8021-a8744ef509cd_00001_.png',
      isDefault: true,
      done_yn: 'Y', // ⭐ FIX: Add done_yn to prevent loading indicator
      dress_count: 0,
    },
  ], []);
  
  // ═══════════════════════════════════════════════════════════════════════
  // COMBINED PERSONAS (Default + User Personas)
  // ═══════════════════════════════════════════════════════════════════════
  const personasWithDefaults = useMemo(() => {
    // ⭐ FIX: Filter out Manager AI AND default personas to prevent key duplicates
    const userPersonas = personas.filter(p => 
      !p.isManager && 
      p.persona_key !== 'default_sage' && 
      p.persona_key !== 'default_nexus'
    );
    
    return [...DEFAULT_PERSONAS, ...userPersonas];
  }, [personas, DEFAULT_PERSONAS]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // UPDATE CURRENT PERSONA ON INDEX CHANGE
  // ═══════════════════════════════════════════════════════════════════════
  useMemo(() => {
    if (personasWithDefaults.length > 0) {
      const validIndex = Math.min(currentPersonaIndex, personasWithDefaults.length - 1);
      setCurrentPersona(personasWithDefaults[validIndex]);
    }
  }, [currentPersonaIndex, personasWithDefaults]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  // Handle persona change from PersonaSwipeViewer
  const handlePersonaChange = useCallback((newIndex) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 📍 Persona index changed:', newIndex);
    }
    
    savedIndexRef.current = newIndex;
    setCurrentPersonaIndex(newIndex);
  }, []);
  
  // ⭐ NEW: Handle panel toggle (PersonaSelectorButton click)
  const handlePanelToggle = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🎭 Panel toggle clicked, current state:', isPanelVisible);
    }
    
    HapticService.selection();
    setIsPanelVisible(prev => !prev);
  }, [isPanelVisible]);
  
  // ⭐ NEW: Handle panel close
  const handlePanelClose = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 📪 Panel closed');
    }
    
    HapticService.light();
    setIsPanelVisible(false);
  }, []);
  
  // ⭐ NEW: Handle persona selection from PersonaSelectorPanel
  const handlePersonaSelectFromPanel = useCallback((persona) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] ✨ Persona selected from panel:', persona.persona_name);
    }
    
    // Find index of selected persona
    const index = personasWithDefaults.findIndex(p => p.persona_key === persona.persona_key);
    
    if (index === -1) {
      console.error('[PersonaStudioScreen] ❌ Persona not found:', persona.persona_key);
      return;
    }
    
    if (__DEV__) {
      console.log('[PersonaStudioScreen] ✨ Persona index:', index);
    }
    
    // Update current persona
    savedIndexRef.current = index;
    setCurrentPersonaIndex(index);
    setCurrentPersona(persona);
    
    // Close panel
    setIsPanelVisible(false);
    
    HapticService.success();
  }, [personasWithDefaults]);
  
  // Handle add persona
  const handleAddPersona = useCallback(() => {
    console.log('[PersonaStudioScreen] 📸 Add persona requested');
    
    // ⭐ Check if user is logged in
    if (!user || !user.user_key) {
      console.log('[PersonaStudioScreen] ⚠️ User not logged in, redirecting to Settings');
      showToast({
        type: 'warning',
        message: t('errors.login_required'),
        emoji: '🔐',
      });
      HapticService.warning();
      navigation.navigate('Settings');
      return;
    }
    
    console.log('[PersonaStudioScreen] ✅ User logged in, opening persona creation sheet');
    HapticService.light();
    setIsPersonaCreationOpen(true);
  }, [user, showToast, t, navigation]);
  
  // Handle persona creation start
  const handlePersonaCreationStart = useCallback(async (data) => {
    console.log('[PersonaStudioScreen] ✨ Persona creation started:', {
      name: data.name,
      gender: data.gender,
      hasFile: !!data.file,
    });
    
    // Close creation sheet
    setIsPersonaCreationOpen(false);
    
    // Store data for reference
    personaCreationDataRef.current = data;
    
    try {
      // Show loading overlay
      setIsLoadingPersona(true);
      
      // Call API to create persona
      const response = await createPersona(user.user_key, {
        name: data.name,
        gender: data.gender,
        photo: data.file,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Persona creation failed');
      }
      
      const { persona_key, estimate_time, persona_url } = response.data;
      
      console.log('[PersonaStudioScreen] ✅ Persona creation initiated:', {
        persona_key,
        estimate_time,
        persona_url,
      });
      
      // Start polling for persona status
      const checkInterval = Math.max(estimate_time * 1000 / 10, 3000); // Check every 10% of estimate_time, min 3s
      let checkCount = 0;
      const maxChecks = Math.ceil((estimate_time + 30) / (checkInterval / 1000)); // estimate_time + 30s buffer
      
      const pollingInterval = setInterval(async () => {
        checkCount++;
        
        try {
          const statusResponse = await checkPersonaStatus(persona_key);
          
          console.log('[PersonaStudioScreen] 📊 Status check:', {
            checkCount,
            maxChecks,
            done_yn: statusResponse.data?.done_yn,
          });
          
          if (statusResponse.data?.done_yn === 'Y') {
            // Persona creation complete!
            clearInterval(pollingInterval);
            setIsLoadingPersona(false);
            
            // Set created persona data
            setCreatedPersona({
              persona_key,
              persona_name: data.name,
              persona_url: statusResponse.data.persona_url || persona_url,
            });
            
            // Show success card
            setIsSuccessCardVisible(true);
            
            HapticService.success();
            
            // Refresh persona list
            // PersonaContext will handle this automatically on screen focus
          } else if (checkCount >= maxChecks) {
            // Timeout
            clearInterval(pollingInterval);
            setIsLoadingPersona(false);
            
            showToast({
              type: 'warning',
              message: t('persona.creation.errors.creation_timeout'),
              emoji: '⏰',
            });
          }
        } catch (error) {
          console.error('[PersonaStudioScreen] ❌ Status check error:', error);
          // Continue polling on error (might be temporary)
        }
      }, checkInterval);
      
    } catch (error) {
      console.error('[PersonaStudioScreen] ❌ Persona creation error:', error);
      setIsLoadingPersona(false);
      
      showToast({
        type: 'error',
        message: t('persona.creation.errors.creation_failed'),
        emoji: '⚠️',
      });
      HapticService.warning();
    }
  }, [user, showToast, t]);
  
  // Handle persona creation close
  const handlePersonaCreationClose = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 📪 Persona creation closed');
    }
    
    HapticService.light();
    setIsPersonaCreationOpen(false);
  }, []);
  
  // Handle success card close
  const handleSuccessCardClose = useCallback(() => {
    console.log('[PersonaStudioScreen] 🎉 Success card closed');
    setIsSuccessCardVisible(false);
    setCreatedPersona(null);
  }, []);
  
  // Handle go to studio (after success)
  const handleGoToStudio = useCallback(() => {
    console.log('[PersonaStudioScreen] 🏠 Going to studio');
    setIsSuccessCardVisible(false);
    setCreatedPersona(null);
    // Already on studio screen, just refresh
    HapticService.success();
  }, []);
  
  // Handle settings
  const handleSettingsPress = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] ⚙️ Settings pressed');
    }
    
    navigation.navigate('Settings');
  }, [navigation]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // QUICK ACTION CHIP HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  // 1. Dressing Room (드레스 선택)
  const handleQuickDress = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 👗 Dressing room clicked');
    }
    
    // TODO: Open DressingRoomSheet for horizontal dress swipe
  }, []);
  
  // 2. Memory History (추억/히스토리)
  const handleQuickHistory = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 📚 Memory history clicked');
    }
    
    // TODO: Navigate to memory history view
  }, []);
  
  // 3. Video Conversion (비디오 변환)
  const handleQuickVideo = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🎬 Video conversion clicked');
    }
    
    // TODO: Trigger video conversion for current persona
  }, []);
  
  // 4. Message Toggle (메시지 모드 진입)
  const handleQuickMessage = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 💌 Entering Message Mode');
    }
    
    HapticService.success();
    setIsMessageMode(true);
    
    // Fade out explore mode UI
    exploreModeOpacity.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
    
    // Fade in message mode UI (with slight delay for smooth transition)
    messageModeOpacity.value = withDelay(
      150,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      })
    );
  }, [exploreModeOpacity, messageModeOpacity]);
  
  // 4-1. Exit Message Mode (탐색 모드로 복귀)
  const handleExitMessageMode = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🔙 Exiting Message Mode');
    }
    
    HapticService.light();
    
    // Fade out message mode UI
    messageModeOpacity.value = withTiming(0, {
      duration: 300,
      easing: Easing.in(Easing.ease),
    });
    
    // Fade in explore mode UI (with slight delay)
    exploreModeOpacity.value = withDelay(
      150,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      }, () => {
        // Reset isMessageMode after animation completes
        runOnJS(setIsMessageMode)(false);
      })
    );
  }, [exploreModeOpacity, messageModeOpacity]);
  
  // 4-2. Message History (메시지 히스토리)
  const handleMessageHistory = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 📜 Message history clicked');
    }
    
    HapticService.light();
    // TODO: Open MessageHistoryBottomSheet
    showToast({
      type: 'info',
      message: '메시지 히스토리 기능 준비 중입니다',
      emoji: '📜',
    });
  }, [showToast]);
  
  // 4-3. Message Music (뮤직으로 이동)
  const handleMessageMusic = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🎵 Navigate to Music');
    }
    
    HapticService.light();
    navigation.navigate('Music');
  }, [navigation]);
  
  // 4-4. Message Preview (메시지 미리보기)
  const handleMessagePreview = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 👁️ Message preview clicked');
    }
    
    HapticService.light();
    // TODO: Trigger preview in MessageCreatorView
    showToast({
      type: 'info',
      message: '미리보기 기능은 MessageCreatorView에서 처리됩니다',
      emoji: '👁️',
    });
  }, [showToast]);
  
  // 5. Settings (설정)
  const handleQuickSettings = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] ⚙️ Settings clicked');
    }
    
    navigation.navigate('Settings');
  }, [navigation]);
  
  // 6. Search (검색)
  // Load messages when entering message mode
  const loadMessages = useCallback(async () => {
    if (!user?.user_key) {
      console.log('[PersonaStudioScreen] 📋 No user_key, skipping message load');
      return;
    }
    
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 📋 Loading messages for user:', user.user_key);
    }
    
    try {
      const result = await listMessages(user.user_key, 1, 50);

      console.log('[PersonaStudioScreen] 📋 Loaded messages result:', result);

      console.log('[PersonaStudioScreen] 📋 Loaded messages:', result.data);
      if (result.success && result.data) {
        setMessages(result.data || []);
        if (__DEV__) {
          console.log('[PersonaStudioScreen] 📋 Loaded messages:', result.data.length);
        }
      }
    } catch (error) {
      console.error('[PersonaStudioScreen] ❌ Failed to load messages:', error);
    }
  }, [user]);
  
  const handleSearchOpen = useCallback(async () => {
    HapticService.light();
    
    if (isMessageMode) {
      // Message search mode
      if (__DEV__) {
        console.log('[PersonaStudioScreen] 🔍 Opening message search');
      }
      
      // Load messages if not already loaded
      if (messages.length === 0) {
        await loadMessages();
      }
      
      setIsMessageSearchVisible(true);
    } else {
      // Persona search mode
      if (__DEV__) {
        console.log('[PersonaStudioScreen] 🔍 Opening persona search');
      }
      
      setIsSearchOverlayVisible(true);
    }
  }, [isMessageMode, messages.length, loadMessages]);
  
  const handleSearchClose = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🔍 Search overlay closed');
    }
    
    setIsSearchOverlayVisible(false);
  }, []);
  
  const handleMessageSearchClose = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🔍 Message search overlay closed');
    }
    
    setIsMessageSearchVisible(false);
  }, []);
  
  const handleSearchSelectPersona = useCallback((persona, index) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🔍 Search selected persona:', persona.persona_name, 'at index:', index);
    }
    
    // Navigate to the selected persona in PersonaSwipeViewer
    if (swiperRef.current) {
      swiperRef.current.scrollToIndex({ index, animated: true });
    }
  }, []);
  
  const handleSearchSelectMessage = useCallback((message) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🔍 Search selected message:', message.message_title);
    }
    
    // Set selected message for MessageCreatorView
    setSelectedMessage(message);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <>
    <SafeScreen 
      backgroundColor={currentTheme.backgroundColor}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: true, bottom: false }}
      keyboardAware={false}
    >
      {/* Header with Search Icon */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <CustomText type="big" bold style={styles.headerTitle}>
            {isMessageMode ? t('navigation.title.message_mode') : t('navigation.title.home')}
          </CustomText>
          <CustomText type="small" style={styles.headerSubtitle}>
            {isMessageMode ? t('navigation.subtitle.message_mode') : t('navigation.subtitle.home')}
          </CustomText>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchOpen}
          activeOpacity={0.7}
        >
          <Icon name="magnify" size={scale(24)} color={currentTheme.mainColor} />
        </TouchableOpacity>
      </View>
      
      {/* ⭐ Container with PanResponder for Left/Right Swipe */}
      <View 
        style={styles.container}
        {...panResponder.panHandlers}
      >
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* BASE LAYER (Z-INDEX: 1) - PersonaSwipeViewer                      */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={styles.baseLayer}>
          <PersonaSwipeViewer 
            ref={swiperRef}
            key={`persona-swipe-${isScreenFocused}`}
            personas={personasWithDefaults}
            isModeActive={true}
            isScreenFocused={isScreenFocused}
            initialIndex={currentPersonaIndex}
            onIndexChange={(index) => {
              if (__DEV__) {
                console.log('[PersonaStudioScreen] 🔄 Persona changed to index:', index, 'isMessageMode:', isMessageMode);
              }
              handlePersonaChange(index);
            }}
            modeOpacity={null}
            onChatWithPersona={null} // Not used in studio mode
            enabled={!isMessageMode} // ⭐ Disable swipe in message mode
            isMessageMode={isMessageMode}
          />
        </View>
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* EXPLORE MODE UI (Fade Out when entering Message Mode)             */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <Animated.View 
          style={[
            styles.exploreModeContainer, 
            { opacity: isMessageMode ? 0 : 1 }
          ]}
          pointerEvents="box-none" // ⭐ Always pass through touches to PersonaSwipeViewer
        >
          {/* QuickActionChips (Right Overlay) */}
          <View 
            style={styles.quickChipsOverlay}
            pointerEvents={isMessageMode ? 'none' : 'auto'} // ⭐ Control touch per child
          >
            <QuickActionChipsAnimated
              onDressClick={handleQuickDress}
              onHistoryClick={handleQuickHistory}
              onVideoClick={handleQuickVideo}
              onMessageClick={handleQuickMessage}
              onSettingsClick={handleQuickSettings}
            />
          </View>
        </Animated.View>
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* MESSAGE MODE UI (Fade In when entering Message Mode)              */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {isMessageMode && (
          <Animated.View 
            style={[
              styles.messageModeContainer, 
              { opacity: messageModeOpacity }
            ]}
            pointerEvents="box-none" // ⭐ Always pass through touches to PersonaSwipeViewer (disabled in message mode)
          >
            {/* MessageModeQuickActionChips (Right Overlay) */}
            <View 
              style={styles.messageModeQuickChipsOverlay}
              pointerEvents={isMessageMode ? 'box-none' : 'none'} // ⭐ box-none: pass through container, but children receive touch
            >
              <MessageModeQuickActionChips
                onBackClick={handleExitMessageMode}
                onHistoryClick={handleMessageHistory}
                onMusicClick={handleMessageMusic}
                onPreviewClick={handleMessagePreview}
              />
            </View>
            
            {/* MessageCreatorView (Bottom Overlay) */}
            <View 
              style={styles.messageOverlay}
              pointerEvents={isMessageMode ? 'box-none' : 'none'} // ⭐ box-none: allow swipe gesture to pass through
            >

              <MessageCreatorView
                personas={personasWithDefaults}
                selectedPersona={currentPersona}
                selectedMessage={selectedMessage}
                onAddPersona={handleAddPersona}
                onPreview={handleMessagePreview}
                isCreating={false}
                isScreenFocused={isScreenFocused}
                showPersonaSelector={false}
              />

            </View>
          </Animated.View>
        )}


        {!isMessageMode && (
        <View style={styles.bottomLayer}>

            <GradientOverlay>
                <View style={{flexDirection: 'row', padding: platformPadding(0), paddingBottom: platformPadding(20)}}>

                <View style={{alignItems: 'center', justifyContent: 'center', marginRight: scale(10)}}>
                <PersonaSelectorButton
                    isPersonaMode={false} // Always show "Select Persona" icon
                    onPress={handlePanelToggle}
                />
                </View>
                <View style={{flex: 1, marginLeft: platformPadding(10)}}>
                    <CustomText type="big" bold >
                        {currentPersona?.persona_name}
                    </CustomText>
                    <CustomText type="title" style={{}}>
                        {t('navigation.subtitle.home')}
                    </CustomText>
                </View>

                </View>

            </GradientOverlay>

        </View>
        )}
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* PersonaSelectorPanel (Slide from Right) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <PersonaSelectorPanel
          visible={isPanelVisible && !isMessageMode}
          personas={personasWithDefaults}
          onSelectPersona={handlePersonaSelectFromPanel}
          onClose={handlePanelClose}
          onViewAll={handleAddPersona}
          onCreatePersona={handleAddPersona}
        />
      </View>
      
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Persona Creation Sheet (Absolute positioning with max z-index) */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <View style={styles.sheetContainer}>
        <ChoicePersonaSheet
          isOpen={isPersonaCreationOpen}
          onClose={handlePersonaCreationClose}
          onCreateStart={handlePersonaCreationStart}
        />
      </View>
    </SafeScreen>
    
    {/* ═════════════════════════════════════════════════════════════════ */}
    {/* Loading Overlay (Outside SafeScreen for highest z-index)         */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    <AnimaLoadingOverlay
      visible={isLoadingPersona}
      personaName={personaCreationDataRef.current?.name || ''}
      estimateTime={60}
    />
    
    {/* ═════════════════════════════════════════════════════════════════ */}
    {/* Success Card (Outside SafeScreen for highest z-index)            */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    <AnimaSuccessCard
      visible={isSuccessCardVisible}
      personaName={createdPersona?.persona_name || ''}
      personaImageUrl={createdPersona?.persona_url || ''}
      onClose={handleSuccessCardClose}
      onGoToStudio={handleGoToStudio}
    />
    
    {/* ═════════════════════════════════════════════════════════════════ */}
    {/* Persona Search Overlay */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    <PersonaSearchOverlay
      visible={isSearchOverlayVisible}
      personas={personasWithDefaults}
      onClose={handleSearchClose}
      onSelectPersona={handleSearchSelectPersona}
      currentPersonaKey={currentPersona?.persona_key}
    />
    
    {/* ═════════════════════════════════════════════════════════════════ */}
    {/* Message Search Overlay */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    <MessageSearchOverlay
      visible={isMessageSearchVisible}
      messages={messages}
      onClose={handleMessageSearchClose}
      onSelectMessage={handleSearchSelectMessage}
    />
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative', // ⭐ Enable absolute positioning for overlays
  },
  
  // ⭐ Z-INDEX: 1 - Base Layer (PersonaSwipeViewer)
  baseLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  
  // ⭐ Explore Mode Container (All overlays for explore mode)
  exploreModeContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    pointerEvents: 'box-none', // Allow touches to pass through container but not children
  },
  
  // ⭐ Message Mode Container (All overlays for message mode)
  messageModeContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3, // Above explore mode
    pointerEvents: 'box-none',
  },
  
  // ⭐ Z-INDEX: 10 - Message Creator Overlay (Bottom)
  messageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(200), // ⭐ FIX: Explicit height for absolute positioning
    zIndex: 10,
    elevation: 10, // ⭐ Android shadow (helps with layering)
    // ⭐ SafeArea bottom is handled inside MessageCreatorView
  },
  
  // ⭐ Z-INDEX: 100 - Quick Action Chips (Right) - HIGHEST
  quickChipsOverlay: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? verticalScale(120) : verticalScale(100),
    right: scale(10),
    zIndex: 100,
    elevation: 100, // ⭐ Android shadow

    // ⭐ SafeArea is handled inside QuickActionChipsAnimated
  },

    // ⭐ Z-INDEX: 100 - Quick Action Chips (Right) - HIGHEST
   messageModeQuickChipsOverlay: {
    position: 'absolute',
    top: verticalScale(20), // Below AppHeader
    right: scale(0),
    zIndex: 100,
    elevation: 100, // ⭐ Android shadow
     // ⭐ SafeArea is handled inside QuickActionChipsAnimated
     },
  
  // ⭐ Z-INDEX: 200 - PersonaSelectorButton (Top Right)
  selectorButtonOverlay: {
    position: 'absolute',
    top: 0,
    right: 190,
    zIndex: 1200,
    elevation: 200,
    pointerEvents: 'box-none',

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

  bottomLayer: {
    position: 'absolute',
    backgroundColor: 'red',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

  header: {
    flexDirection: 'row', // ⭐ Horizontal layout for title + search button
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(16),
    paddingHorizontal: platformPadding(20),
  },
  headerContent: {
    flex: 1, // ⭐ Take remaining space
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(4),
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
  },
  searchButton: {
    marginLeft: platformPadding(12),
    padding: platformPadding(8),
  },

});

export default PersonaStudioScreen;

