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
import { View, StyleSheet, BackHandler, PanResponder, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IconSearch from 'react-native-vector-icons/Ionicons';
import IconMore from 'react-native-vector-icons/MaterialIcons';
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
import PersonaTypeSelector from '../components/persona/PersonaTypeSelector'; // ⭐ NEW: Elegant chip style selector
import PersonaSettingsSheet from '../components/persona/PersonaSettingsSheet'; // ⭐ NEW: Persona settings sheet
import CategorySelectionSheet from '../components/persona/CategorySelectionSheet'; // ⭐ NEW: Category selection sheet
import ChoicePersonaSheet from '../components/persona/ChoicePersonaSheet';
import AnimaLoadingOverlay from '../components/persona/AnimaLoadingOverlay';
import AnimaSuccessCard from '../components/persona/AnimaSuccessCard';
import MessageInputOverlay from '../components/message/MessageInputOverlay';
import MessageCreationOverlay from '../components/message/MessageCreationOverlay'; // ⭐ NEW: Overlay for message creation
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import HapticService from '../utils/HapticService';
import { 
  createPersona, 
  checkPersonaStatus, 
  getPersonaList,
  updatePersonaBasic,
  convertPersonaVideo,
  deletePersona,
  togglePersonaFavorite,
} from '../services/api/personaApi';
import { listMessages } from '../services/api/messageService';
import CustomText from '../components/CustomText';
import { COLORS } from '../styles/commonstyles';
import GradientOverlay from '../components/GradientOverlay';


const PersonaStudioScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { personas, setPersonas, selectedPersona: contextSelectedPersona } = usePersona(); // ⭐ ADD: setPersonas for local update
  const { user } = useUser();
  const { showToast, showAlert, setIsMessageCreationActive } = useAnima(); // ⭐ For Tab Bar blocking
  const insets = useSafeAreaInsets();
  const refPersonaCount = useRef(0);
  
  // ═══════════════════════════════════════════════════════════════════════
  // AVAILABLE HEIGHT CALCULATION (Same as HistoryScreen)
  // ═══════════════════════════════════════════════════════════════════════
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const TAB_BAR_HEIGHT = verticalScale(60); // 탭바 높이
  
  const availableHeight = SCREEN_HEIGHT - insets.top - insets.bottom - TAB_BAR_HEIGHT - TAB_BAR_HEIGHT;
  
  if (__DEV__) {
    console.log('[PersonaStudioScreen] Height calculation:', {
      SCREEN_HEIGHT,
      'insets.top': insets.top,
      'insets.bottom': insets.bottom,
      TAB_BAR_HEIGHT,
      availableHeight,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0);
  const [currentPersona, setCurrentPersona] = useState(null);
  const [isMessageMode, setIsMessageMode] = useState(false); // ⭐ Message mode toggle
  const [isPanelVisible, setIsPanelVisible] = useState(false); // ⭐ NEW: PersonaSelectorPanel toggle
  const [isPersonaCreationOpen, setIsPersonaCreationOpen] = useState(false);
  const [isPersonaSettingsOpen, setIsPersonaSettingsOpen] = useState(false); // ⭐ NEW: Settings sheet
  const [isCategorySelectionOpen, setIsCategorySelectionOpen] = useState(false); // ⭐ NEW: Category sheet
  const [isLoadingPersona, setIsLoadingPersona] = useState(false);
  const [isSuccessCardVisible, setIsSuccessCardVisible] = useState(false);
  const [createdPersona, setCreatedPersona] = useState(null);
  const [settingsPersona, setSettingsPersona] = useState(null); // ⭐ NEW: Persona being edited
  const nameInputRef = useRef(null); // ⭐ FIX: Use ref like ChoicePersonaSheet
  const [isSearchOverlayVisible, setIsSearchOverlayVisible] = useState(false); // ⭐ Persona search overlay
  const [isMessageSearchVisible, setIsMessageSearchVisible] = useState(false); // ⭐ Message search overlay
  const [messages, setMessages] = useState([]); // ⭐ Message history
  const [selectedMessage, setSelectedMessage] = useState(null); // ⭐ Selected message for editing
  const swiperRef = useRef(null); // ⭐ NEW: Ref for PersonaSwipeViewer
  const savedIndexRef = useRef(0);
  const personaCreationDataRef = useRef(null);
  const [filterMode, setFilterMode] = useState('default'); // 'default' | 'user' | 'favorite'
  const [showQuickActionChips, setShowQuickActionChips] = useState(false);
  const [showWriteMessageActionChips, setShowWriteMessageActionChips] = useState(false);
  const [isMessageCreationVisible, setIsMessageCreationVisible] = useState(false); // ⭐ NEW: Message Creation Overlay
  
  // ⭐ Sync isMessageCreationVisible with AnimaContext (for Tab Bar blocking)
  useEffect(() => {
    setIsMessageCreationActive(isMessageCreationVisible);
    console.log('[PersonaStudioScreen] 🔄 Syncing isMessageCreationActive:', isMessageCreationVisible);
  }, [isMessageCreationVisible, setIsMessageCreationActive]);
  
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
          
          
          return isHorizontal && isSignificant;
        },
        onPanResponderGrant: (evt, gestureState) => {
          console.log('[PanResponder] Gesture granted');
        },
        onPanResponderRelease: (evt, gestureState) => {
          const { dx, vx } = gestureState;
          const swipeThreshold = 80; // 80px 이상 스와이프
          const velocityThreshold = 0.5; // 또는 빠른 속도
          
          
          // 왼쪽으로 스와이프 (← 메시지 모드 진입)
          if ((dx < -swipeThreshold || vx < -velocityThreshold) && !isMessageMode) {

            handleQuickMessage();
          }
          // 오른쪽으로 스와이프 (→ 일반 모드 복귀)
          else if ((dx > swipeThreshold || vx > velocityThreshold) && isMessageMode) {

            handleExitMessageMode();
          }
        },
      }),
    [isMessageMode, handleQuickMessage, handleExitMessageMode]
  );
  
  // ═══════════════════════════════════════════════════════════════════════
  // TAB NAVIGATION IS NOW BLOCKED IN CustomTabBar (via AnimaContext)
  // No need for beforeRemove or tabPress listeners here!
  // ═══════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN FOCUS HANDLER
  // ═══════════════════════════════════════════════════════════════════════
  useFocusEffect(
    
    useCallback(() => {
      // Screen is focused
      setIsScreenFocused(true);
      console.log('[PersonaStudioScreen] 🟢 Screen FOCUSED');

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
        
        // ⭐ CRITICAL FIX: Close overlay when screen loses focus
        if (isMessageCreationVisible) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('⚠️ [PersonaStudioScreen] Screen BLURRED while overlay is open!');
          console.log('   Force closing overlay to prevent navigation bugs');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          setIsMessageCreationVisible(false);
        }
        
        if (__DEV__) {
          console.log('🎯 [PersonaStudioScreen] Screen BLURRED');
        }
      };
    }, [isMessageMode, isMessageCreationVisible])
  );

  useEffect(() => {


    const onBackPress = () => {
        // Message Mode인 경우 먼저 닫기

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

    if (!isMessageMode) {
        setSelectedMessage(null);
    }

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
    
 //   return [...DEFAULT_PERSONAS, ...userPersonas];
 return [...userPersonas];
  }, [personas, DEFAULT_PERSONAS]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // FILTERED PERSONAS (Based on filterMode: 'default' | 'user' | 'favorite')
  // ═══════════════════════════════════════════════════════════════════════
  const currentFilteredPersonas = useMemo(() => {
    if (filterMode === 'favorite') {
      // Show all personas where favorite_yn === 'Y'
      return personasWithDefaults.filter(p => p.favorite_yn === 'Y');
    } else if (filterMode === 'user') {
      // Show user-created personas (default_yn === 'N')
      return personasWithDefaults.filter(p => p.default_yn === 'N');
    } else {
      // Show default personas (default_yn === 'Y')
      return personasWithDefaults.filter(p => p.default_yn === 'Y');
    }
  }, [personasWithDefaults, filterMode]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // UPDATE CURRENT PERSONA ON INDEX CHANGE
  // ═══════════════════════════════════════════════════════════════════════
  useMemo(() => {
    if (currentFilteredPersonas.length > 0) {
      const validIndex = Math.min(currentPersonaIndex, currentFilteredPersonas.length - 1);
      setCurrentPersona(currentFilteredPersonas[validIndex]);
    }
  }, [currentPersonaIndex, currentFilteredPersonas]);
  
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
    
    // Find index of selected persona in currentFilteredPersonas
    const index = currentFilteredPersonas.findIndex(p => p.persona_key === persona.persona_key);
    
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
  }, [currentFilteredPersonas]);
  
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
      description: data.description,
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
        description: data.description,
        gender: data.gender,
        photo: data.file,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Persona creation failed');
      }
      
      const { persona_key, estimate_time, persona_url, memory_key, bric_key } = response.data;
      
      console.log('[PersonaStudioScreen] ✅ Persona creation initiated:', {
        persona_key,
        estimate_time,
        persona_url,
        bric_key,
        memory_key,
      });
      
      // Start polling for persona status
      const checkInterval = Math.max(estimate_time * 1000 / 10, 3000); // Check every 10% of estimate_time, min 3s
      let checkCount = 0;
      const maxChecks = Math.ceil((estimate_time + 30) / (checkInterval / 1000)); // estimate_time + 30s buffer
      
      const pollingInterval = setInterval(async () => {
        checkCount++;
        
        try {
          
          const statusResponse = await checkPersonaStatus(persona_key, memory_key, bric_key, data.description);
          
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
  
  // 4. Message Toggle (메시지 모드 진입) - ⭐ NEW: Opens MessageCreationOverlay
  const handleQuickMessage = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 [PersonaStudioScreen] OPENING MESSAGE CREATION OVERLAY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Current State:');
    console.log('  - isScreenFocused:', isScreenFocused);
    console.log('  - isMessageCreationVisible (before):', isMessageCreationVisible);
    console.log('  - currentPersona:', currentPersona?.persona_name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    HapticService.success();
    setIsMessageCreationVisible(true); // ⭐ Open overlay instead of message mode
    
    console.log('✅ [PersonaStudioScreen] setIsMessageCreationVisible(true) called');
  }, [isScreenFocused, isMessageCreationVisible, currentPersona]);
  
  // ⭐ NEW: Close Message Creation Overlay
  const handleCloseMessageCreation = useCallback(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔙 [PersonaStudioScreen] CLOSING MESSAGE CREATION OVERLAY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Current State:');
    console.log('  - isScreenFocused:', isScreenFocused);
    console.log('  - isMessageCreationVisible (before):', isMessageCreationVisible);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    HapticService.light();
    setIsMessageCreationVisible(false);
    
    console.log('✅ [PersonaStudioScreen] setIsMessageCreationVisible(false) called');
  }, [isScreenFocused, isMessageCreationVisible]);

  // ⭐ NEW: Handle Message Creation Exit with Confirmation
  const handleExitMessageCreationWithConfirmation = useCallback(() => {
    console.log('[PersonaStudioScreen] 🚪 Exit request with confirmation');
    
    showAlert({
      title: t('message.alert.exit_message_creation'),
      emoji: '⚠️',
      message: t('message.alert.exit_message_creation_description'),
      buttons: [
        {
          text: t('message.alert.continue_writing'),
          style: 'cancel',
          onPress: () => {
            console.log('[PersonaStudioScreen] User chose to continue writing');
            HapticService.light();
          }
        },
        {
          text: t('message.alert.exit'),
          style: 'destructive',
          onPress: () => {
            console.log('[PersonaStudioScreen] User confirmed exit');
            HapticService.medium();
            handleCloseMessageCreation();
          }
        }
      ]
    });
  }, [showAlert, handleCloseMessageCreation, t]);
  
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
  
  const handleMoreOpen = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🔍 Opening more');
    }
    
  }, []);
  
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


  const handleFilterModeChange = useCallback((mode) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🎭 Filter mode changed:', mode);
    }
    
    HapticService.light();
    setFilterMode(mode);
    
    // Reset to first persona when filter changes
    setCurrentPersonaIndex(0);
  }, []);

  const handleCreatePersona = useCallback(() => {
    

    handleAddPersona();

  }, [handleAddPersona]);
  
  const handleChatWithPersona = useCallback((persona) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️ [PersonaStudioScreen] SETTINGS SHEET OPEN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Persona:', persona?.persona_name);
    console.log('Current isPersonaSettingsOpen:', isPersonaSettingsOpen);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    HapticService.light();
    setSettingsPersona(persona);
    setIsPersonaSettingsOpen(true);
    
    console.log('✅ State updated: isPersonaSettingsOpen = true');
  }, [isPersonaSettingsOpen]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // PERSONA SETTINGS HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleSettingsClose = useCallback(() => {
    setIsPersonaSettingsOpen(false);
    setSettingsPersona(null);
  }, []);
  
  const handlePersonaNameChange = useCallback((persona) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 📝 Name change requested for:', persona.persona_name);
    }
    
    // ⭐ Open MessageInputOverlay using ref (like ChoicePersonaSheet)
    HapticService.light();
    nameInputRef.current?.present();
  }, []);
  
  const handlePersonaNameSave = useCallback(async (newName) => {
    if (!settingsPersona || !user?.user_key || !newName) return;
    
    try {
      if (__DEV__) {
        console.log('[PersonaStudioScreen] 🔄 Updating persona name:', {
          persona_key: settingsPersona.persona_key,
          old_name: settingsPersona.persona_name,
          new_name: newName,
        });
      }

      const result = await updatePersonaBasic(
        settingsPersona.persona_key,
        user.user_key,
        newName,
        null // category_type not changed
      );

      if (result.success) {
        // ✅ UPDATE LOCAL ARRAY ONLY (No re-rendering!)
        setPersonas(prev => prev.map(p => 
          p.persona_key === settingsPersona.persona_key
            ? { ...p, persona_name: newName }
            : p
        ));
        
        // Update currentPersona if it's the one being edited
        if (currentPersona?.persona_key === settingsPersona.persona_key) {
          setCurrentPersona(prev => ({ ...prev, persona_name: newName }));
        }
        
        // ✅ Close settings sheet after successful update
        setIsPersonaSettingsOpen(false);
        
        showToast({
          type: 'success',
          message: t('persona.settings.name_changed'),
          emoji: '✅',
        });
        
        if (__DEV__) {
          console.log('[PersonaStudioScreen] ✅ Name changed (local update only)');
        }
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('[PersonaStudioScreen] ❌ Name change error:', error);
      showToast({
        type: 'error',
        message: t('errors.generic'),
        emoji: '⚠️',
      });
    }
  }, [settingsPersona, currentPersona, user, setPersonas, showToast, t]);
  
  const handlePersonaCategoryChange = useCallback((persona) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🏷️ Category change requested for:', {
        persona_name: persona.persona_name,
        current_category: persona.category_type,
      });
    }
    
    // Open category selection sheet
    HapticService.light();
    setIsCategorySelectionOpen(true);
  }, []);
  
  const handleCategorySelect = useCallback(async (newCategoryType) => {
    if (!settingsPersona || !user?.user_key) return;
    
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🔄 Updating persona category:', {
        persona_key: settingsPersona.persona_key,
        old_category: settingsPersona.category_type,
        new_category: newCategoryType,
      });
    }
    
    try {
      const result = await updatePersonaBasic(
        settingsPersona.persona_key,
        user.user_key,
        null, // name not changed
        newCategoryType
      );

      if (result.success) {
        // ✅ UPDATE LOCAL ARRAY ONLY (No re-rendering!)
        setPersonas(prev => prev.map(p => 
          p.persona_key === settingsPersona.persona_key
            ? { ...p, category_type: newCategoryType }
            : p
        ));
        
        // Update currentPersona if it's the one being edited
        if (currentPersona?.persona_key === settingsPersona.persona_key) {
          setCurrentPersona(prev => ({ ...prev, category_type: newCategoryType }));
        }
        
        // ✅ Close both sheets after successful update
        setIsCategorySelectionOpen(false);
        setIsPersonaSettingsOpen(false);
        
        showToast({
          type: 'success',
          message: t('persona.settings.category_changed'),
          emoji: '✅',
        });
        
        if (__DEV__) {
          console.log('[PersonaStudioScreen] ✅ Category changed (local update only)');
        }
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('[PersonaStudioScreen] ❌ Category change error:', error);
      showToast({
        type: 'error',
        message: t('errors.generic'),
        emoji: '⚠️',
      });
    }
  }, [settingsPersona, currentPersona, user, setPersonas, showToast, t]);
  
  const handlePersonaVideoConvert = useCallback(async (persona) => {
    if (!user?.user_key) return;
    
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🎬 Video convert requested for:', {
        persona_name: persona.persona_name,
        persona_key: persona.persona_key,
        img_url: persona.selected_dress_image_url,
        memory_key: persona.history_key,
      });
    }
    
    try {
      const result = await convertPersonaVideo(
        persona.persona_key,
        user.user_key,
        persona.selected_dress_image_url,
        persona.history_key // memory_key
      );

      if (result.success) {
        // ✅ UPDATE LOCAL ARRAY ONLY (No re-rendering!)
        setPersonas(prev => prev.map(p => 
          p.persona_key === persona.persona_key
            ? { 
                ...p, 
                selected_dress_video_convert_done: 'N', // Conversion in progress
                bric_convert_key: result.request_key,
              }
            : p
        ));
        
        // Update currentPersona if it's the one being converted
        if (currentPersona?.persona_key === persona.persona_key) {
          setCurrentPersona(prev => ({ 
            ...prev, 
            selected_dress_video_convert_done: 'N',
            bric_convert_key: result.request_key,
          }));
        }
        
        // ✅ Close settings sheet after successful conversion start
        setIsPersonaSettingsOpen(false);
        
        showToast({
          type: 'success',
          message: t('persona.settings.video_converting'),
          emoji: '🎬',
        });
        
        if (__DEV__) {
          console.log('[PersonaStudioScreen] ✅ Video conversion started (local update only):', {
            request_key: result.request_key,
            estimate_time: result.estimate_time,
          });
        }
      } else {
        throw new Error(result.message || 'Video conversion failed');
      }
    } catch (error) {
      console.error('[PersonaStudioScreen] ❌ Video convert error:', error);
      showToast({
        type: 'error',
        message: error.response?.data?.message || t('errors.generic'),
        emoji: '⚠️',
      });
    }
  }, [user, currentPersona, setPersonas, showToast, t]);
  
  const handlePersonaDelete = useCallback(async (persona) => {
    if (!user?.user_key) return;
    
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🗑️ Delete requested for:', {
        persona_name: persona.persona_name,
        persona_key: persona.persona_key,
      });
    }
    
    try {
      const result = await deletePersona(
        persona.persona_key,
        user.user_key
      );

      if (result.success) {
        // ✅ UPDATE LOCAL ARRAY ONLY (Remove item)
        setPersonas(prev => prev.filter(p => p.persona_key !== persona.persona_key));
        
        // If deleted persona was current, reset to first persona
        if (currentPersona?.persona_key === persona.persona_key) {
          setCurrentPersona(null);
          setCurrentPersonaIndex(0);
        }
        
        // ✅ Close settings sheet after successful deletion
        setIsPersonaSettingsOpen(false);
        
        showToast({
          type: 'success',
          message: t('persona.settings.deleted'),
          emoji: '✅',
        });
        
        if (__DEV__) {
          console.log('[PersonaStudioScreen] ✅ Persona deleted (local update only)');
        }
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (error) {
      console.error('[PersonaStudioScreen] ❌ Delete error:', error);
      showToast({
        type: 'error',
        message: error.response?.data?.message || t('errors.generic'),
        emoji: '⚠️',
      });
    }
  }, [user, currentPersona, setPersonas, showToast, t]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // FAVORITE TOGGLE HANDLER
  // ═══════════════════════════════════════════════════════════════════════
  const handlePersonaFavoriteToggle = useCallback(async (persona) => {
    // ⭐ FIX: Allow favorite toggle for ALL personas (including default personas)
    if (!user?.user_key || !persona) return;
    
    if (__DEV__) {
      console.log('[PersonaStudioScreen] ⭐ Favorite toggle requested for:', {
        persona_name: persona.persona_name,
        persona_key: persona.persona_key,
        current_favorite: persona.favorite_yn,
        is_default: persona.default_yn,
      });
    }
    
    try {
      const result = await togglePersonaFavorite(
        persona.persona_key,
        user.user_key
      );

      if (result.success) {
        const newFavoriteYn = result.favorite_yn;
        
        // ✅ UPDATE LOCAL ARRAY ONLY (No re-rendering!)
        setPersonas(prev => prev.map(p => 
          p.persona_key === persona.persona_key
            ? { ...p, favorite_yn: newFavoriteYn }
            : p
        ));
        
        // Update currentPersona if it's the one being toggled
        if (currentPersona?.persona_key === persona.persona_key) {
          setCurrentPersona(prev => ({ ...prev, favorite_yn: newFavoriteYn }));
        }
        
        showToast({
          type: 'success',
          message: newFavoriteYn === 'Y' 
            ? t('persona.favorite_added')
            : t('persona.favorite_removed'),
          emoji: newFavoriteYn === 'Y' ? '⭐' : '✅',
        });
        
        if (__DEV__) {
          console.log('[PersonaStudioScreen] ✅ Favorite toggled (local update only):', newFavoriteYn);
        }
      } else {
        throw new Error(result.message || 'Favorite toggle failed');
      }
    } catch (error) {
      console.error('[PersonaStudioScreen] ❌ Favorite toggle error:', error);
      showToast({
        type: 'error',
        message: t('errors.generic'),
        emoji: '⚠️',
      });
    }
  }, [user, currentPersona, setPersonas, showToast, t]);

  // ⭐ Calculate counts for all filter modes
  const personaCounts = useMemo(() => {
    const defaultPersonas = personasWithDefaults.filter(p => p.default_yn === 'Y');
    const userPersonas = personasWithDefaults.filter(p => p.default_yn === 'N');
    const favoritePersonas = personasWithDefaults.filter(p => p.favorite_yn === 'Y');
    
    return {
      default: defaultPersonas.length,
      user: userPersonas.length,
      favorite: favoritePersonas.length,
    };
  }, [personasWithDefaults]); 
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
          <CustomText type="middle" style={styles.headerSubtitle}>
            {isMessageMode ? t('navigation.subtitle.message_mode') : t('navigation.subtitle.home')}
          </CustomText>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchOpen}
          activeOpacity={0.7}
        >
          <IconSearch name="search-outline" size={scale(24)} color={currentTheme.mainColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={handleMoreOpen}
          activeOpacity={0.7}
        >
          <IconMore name="more-vert" size={scale(24)} color={currentTheme.mainColor} />
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
          {/* ⭐ DEBUG: Log PersonaSwipeViewer props */}
          {(() => {
            const calculatedIsScreenFocused = isScreenFocused && !isMessageCreationVisible;
            console.log('🎥 [PersonaStudioScreen] PersonaSwipeViewer isScreenFocused:', calculatedIsScreenFocused, {
              isScreenFocused,
              isMessageCreationVisible,
            });
            return null;
          })()}
          <PersonaSwipeViewer 
            ref={swiperRef}
            key={`persona-swipe-${isScreenFocused}`}
            personas={currentFilteredPersonas} // ⭐ FIX: Pass already filtered personas
            isModeActive={true}
            isScreenFocused={isScreenFocused && !isMessageCreationVisible} // ⭐ Pause video when overlay is open
            initialIndex={currentPersonaIndex}
            availableHeight={availableHeight}
            onIndexChange={(index) => {
              if (__DEV__) {
                console.log('[PersonaStudioScreen] 🔄 Persona changed to index:', index, 'isMessageMode:', isMessageMode);
              }
              handlePersonaChange(index);
            }}
            modeOpacity={null}
            onChatWithPersona={handleChatWithPersona} // Not used in studio mode
            onFavoriteToggle={handlePersonaFavoriteToggle} // ⭐ Favorite toggle
            enabled={!isMessageMode} // ⭐ Disable swipe in message mode
            isMessageMode={isMessageMode}
            onCreatePersona={handleAddPersona}
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
          {/* QuickActionChips (Right Overlay) - Only show when personas exist */}
          {currentFilteredPersonas.length > 0 && (
            <View 
              style={styles.quickChipsOverlay}
              pointerEvents={isMessageMode ? 'none' : 'auto'} // ⭐ Control touch per child
            >
              <QuickActionChipsAnimated
                onDressClick={handleQuickDress}
                onHistoryClick={handleQuickHistory}
                onVideoClick={handleQuickVideo}
                onMessageClick={handleQuickMessage} // ⭐ Opens MessageCreationOverlay
                onSettingsClick={handleQuickSettings}
              />
            </View>
          )}
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
              style={[styles.messageModeQuickChipsOverlay, { }]}
              pointerEvents={isMessageMode ? 'box-none' : 'none'} // ⭐ box-none: pass through container, but children receive touch
            >
              <MessageModeQuickActionChips
                onBackClick={handleExitMessageMode}
                onHistoryClick={handleMessageHistory}
                onMusicClick={handleMessageMusic}
                onPreviewClick={handleMessagePreview}
                showQuickActionChips={showQuickActionChips}
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


        {false && (
        <View style={styles.bottomLayer}>

            <GradientOverlay>
                <View style={{flexDirection: 'row', padding: platformPadding(0), paddingBottom: platformPadding(20)}}>

                <View style={{flex: 1, marginLeft: platformPadding(10)}}>
                    <CustomText type="big" bold >
                        {currentPersona?.persona_name}
                    </CustomText>
                    <CustomText type="title" style={{}}>
                        {t('category_type.' + currentPersona?.category_type + '_desc')}
                    </CustomText>
                </View>

                </View>

            </GradientOverlay>

        </View>
        )}

        {filterMode !== 'default' && (
        <PersonaSelectorButton
            isPersonaMode={false} // Always show "Select Persona" icon
            onPress={handlePanelToggle}
        />
        )}
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* PersonaSelectorPanel (Slide from Right) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <PersonaSelectorPanel
          visible={isPanelVisible && !isMessageMode}
          personas={currentFilteredPersonas} // ⭐ FIX: Pass already filtered personas
          onSelectPersona={handlePersonaSelectFromPanel}
          onClose={handlePanelClose}
          onViewAll={handleAddPersona}
          onCreatePersona={handleAddPersona}
        />

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* PersonaTypeSelector (Only in Explore Mode) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {!isMessageMode && (
          <View style={styles.typeSelectorOverlay}>
            <PersonaTypeSelector
              isUserMode={filterMode === 'user'}
              isFavoriteMode={filterMode === 'favorite'}
              defaultCount={personaCounts.default}
              userCount={personaCounts.user}
              favoriteCount={personaCounts.favorite}
              onTypeChange={handleFilterModeChange}
              onCreatePress={handleCreatePersona}
              showCreateButton={true}
            />
          </View>
        )}

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
    {/* Persona Settings Sheet (Outside SafeScreen for proper z-index) */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    <PersonaSettingsSheet
      isOpen={isPersonaSettingsOpen}
      persona={settingsPersona}
      onClose={handleSettingsClose}
      onNameChange={handlePersonaNameChange}
      onCategoryChange={handlePersonaCategoryChange}
      onVideoConvert={handlePersonaVideoConvert}
      onDelete={handlePersonaDelete}
    />
    
    {/* ═════════════════════════════════════════════════════════════════ */}
    {/* Category Selection Sheet */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    <CategorySelectionSheet
      isOpen={isCategorySelectionOpen}
      currentCategory={settingsPersona?.category_type || 'normal'}
      onClose={() => setIsCategorySelectionOpen(false)}
      onSelectCategory={handleCategorySelect}
    />
    
    {/* ═════════════════════════════════════════════════════════════════ */}
    {/* MessageInputOverlay for Name Change (Always rendered, ref-based) */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    <MessageInputOverlay
      ref={nameInputRef}
      title={t('persona.settings.change_name')}
      placeholder={t('persona.creation.name_placeholder')}
      initialValue={settingsPersona?.persona_name || ''}
      maxLength={20}
      leftIcon="account-edit"
      onSave={handlePersonaNameSave}
    />
    
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
      personas={currentFilteredPersonas} // ⭐ FIX: Pass already filtered personas
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
    
    {/* ═════════════════════════════════════════════════════════════════ */}
    {/* Message Creation Overlay (⭐ NEW: Full-screen overlay) */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    {isMessageCreationVisible && (
      <MessageCreationOverlay
        visible={isMessageCreationVisible}
        selectedPersona={currentPersona}
        onClose={handleCloseMessageCreation}
      />
    )}
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

  firstLaunchLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    padding: platformPadding(20),
    backgroundColor: COLORS.BACKGROUND_COLOR,
  },

  templateContainer: {

    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'blue',
  },

  templateItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
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
    right: scale(10),
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
    color: COLORS.TEXT_PRIMARY,
  },
  searchButton: {
    marginLeft: platformPadding(12),
    padding: platformPadding(8),
  },
  moreButton: {
    marginLeft: platformPadding(2),
    padding: platformPadding(8),
    display: 'none',
  },

  // ⭐ PersonaTypeSelector Overlay
  typeSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
  },

});

export default PersonaStudioScreen;

