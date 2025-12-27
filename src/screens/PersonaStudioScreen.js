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
import { View, StyleSheet, TouchableOpacity, Dimensions, TextInput, BackHandler, TouchableWithoutFeedback } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconSearch from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons'; // ⭐ NEW: For create button
import { useTranslation } from 'react-i18next';
// ❌ REMOVED: Gesture, GestureDetector, runOnJS (horizontal swipe removed)
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../contexts/ThemeContext';
import { usePersona } from '../contexts/PersonaContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import PersonaSwipeViewer from '../components/persona/PersonaSwipeViewer';
import QuickActionChipsAnimated from '../components/quickaction/QuickActionChipsAnimated';
// ❌ REMOVED: PersonaSelectorButton (UI simplified - single unified list)
// ❌ REMOVED: PersonaSelectorPanel (UI simplified - single unified list)
// ❌ REMOVED: PersonaTypeSelector (UI simplified - single unified list)
import PersonaSettingsSheet from '../components/persona/PersonaSettingsSheet';
import CategorySelectionSheet from '../components/persona/CategorySelectionSheet';
import ChoicePersonaSheet from '../components/persona/ChoicePersonaSheet';
import MessageInputOverlay from '../components/message/MessageInputOverlay';
import MessageCreationOverlay from '../components/message/MessageCreationOverlay';
import ProcessingLoadingOverlay from '../components/persona/ProcessingLoadingOverlay'; // ⭐ RENAMED: Universal loading overlay
import ConfettiCannon from 'react-native-confetti-cannon';
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import HapticService from '../utils/HapticService';
import MainHelpSheet from '../components/persona/MainHelpSheet';

import { 
  createPersona,
  checkPersonaStatus,
  updatePersonaBasic,
  convertPersonaVideo,
  deletePersona,
  togglePersonaFavorite,
} from '../services/api/personaApi';
import CustomText from '../components/CustomText';
import { COLORS } from '../styles/commonstyles';

// Import Push Notification helpers
import { 
  checkNotificationPermission,
  requestNotificationPermissionWithContext,
  hasRequestedNotificationPermission
} from '../utils/pushNotification';
import NotificationPermissionSheet from '../components/NotificationPermissionSheet';

// ═══════════════════════════════════════════════════════════════════════════
// EMOTION CATEGORY CONSTANTS (from PersonaSearchOverlay)
// ═══════════════════════════════════════════════════════════════════════════
const PERSONA_CATEGORIES = [
  { key: 'all', emoji: '🌐' },
  { key: 'normal', emoji: '☀️' },
  { key: 'thanks', emoji: '🙏' },
  { key: 'apologize', emoji: '🙇' },
  { key: 'hope', emoji: '✨' },
  { key: 'cheer_up', emoji: '📣' },
  { key: 'congrats', emoji: '🎉' },
  { key: 'romantic', emoji: '💕' },
  { key: 'comfort', emoji: '🤗' },
  { key: 'sadness', emoji: '😢' },
];

const PersonaStudioScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { personas, setPersonas, selectedPersona: contextSelectedPersona, setSelectedIndex, setSelectedPersona, initializePersonas } = usePersona();
  const { user } = useUser();
  const { showToast, showAlert, setIsMessageCreationActive, showDefaultPersonas } = useAnima(); // ⭐ Default Personas setting
  const insets = useSafeAreaInsets();
  const refPersonaCount = useRef(0);
  
  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN DIMENSIONS & AVAILABLE HEIGHT CALCULATION
  // ═══════════════════════════════════════════════════════════════════════
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
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
  // ❌ REMOVED: isPanelVisible (PersonaSelectorPanel removed)
  const [isPersonaCreationOpen, setIsPersonaCreationOpen] = useState(false);
  const [isPersonaSettingsOpen, setIsPersonaSettingsOpen] = useState(false);
  // ⭐ NEW: Pre-permission for notifications
  const [showPermissionSheet, setShowPermissionSheet] = useState(false);
  const [permissionContext, setPermissionContext] = useState('persona_creation'); // ⭐ NEW: Dynamic context
  const pendingActionRef = useRef(null); // ⭐ NEW: For all pending actions (persona creation, video conversion, etc.)
  const [isCategorySelectionOpen, setIsCategorySelectionOpen] = useState(false);
  const [settingsPersona, setSettingsPersona] = useState(null);
  const nameInputRef = useRef(null);
  const searchInputRef = useRef(null); // ⭐ NEW: Search input ref
  const [searchQuery, setSearchQuery] = useState(''); // ⭐ NEW: Real-time search query
  const [selectedCategory, setSelectedCategory] = useState('all'); // ⭐ NEW: Emotion category filter
  const [isCategoryDropdownVisible, setIsCategoryDropdownVisible] = useState(false); // ⭐ NEW: Category dropdown
  const swiperRef = useRef(null);
  const savedIndexRef = useRef(0);
  const personaCreationDataRef = useRef(null);
  // ❌ REMOVED: filterMode (UI simplified - single unified list)
  const [isMessageCreationVisible, setIsMessageCreationVisible] = useState(false);
  const [isCreatingPersona, setIsCreatingPersona] = useState(false); // ⭐ Loading overlay for persona creation
  const [isConvertingVideo, setIsConvertingVideo] = useState(false); // ⭐ NEW: Loading overlay for video conversion
  const [processingMessage, setProcessingMessage] = useState(''); // ⭐ NEW: Dynamic message for processing overlay
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpSheetRef = useRef(null);
  const confettiRef = useRef(null); // ⭐ NEW: Confetti ref for completion celebration
  const [isRefreshing, setIsRefreshing] = useState(false); // ⭐ NEW: Pull-to-refresh state
  
  // Sync isMessageCreationVisible with AnimaContext (for Tab Bar blocking)
  useEffect(() => {
    setIsMessageCreationActive(isMessageCreationVisible);
  }, [isMessageCreationVisible, setIsMessageCreationActive]);
  
  // ❌ REMOVED: filterMode auto-adjust (UI simplified - single unified list)
  
  // ⭐ NEW: Android back button handler for category dropdown
  useEffect(() => {
    if (!isCategoryDropdownVisible) return;
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('[PersonaStudioScreen] 🔙 Back button pressed, closing category dropdown');
      HapticService.light();
      setIsCategoryDropdownVisible(false);
      return true; // Prevent default back behavior
    });
    
    return () => backHandler.remove();
  }, [isCategoryDropdownVisible]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // TAB NAVIGATION IS NOW BLOCKED IN CustomTabBar (via AnimaContext)
  // No need for beforeRemove or tabPress listeners here!
  // ═══════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN FOCUS HANDLER
  // ═══════════════════════════════════════════════════════════════════════
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      
      return () => {
        setIsScreenFocused(false);
        
        // Close overlay when screen loses focus
        if (isMessageCreationVisible) {
          setIsMessageCreationVisible(false);
        }
      };
    }, [isMessageCreationVisible])
  );


  
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
  // ⭐ SIMPLIFIED: FILTERED PERSONAS (searchQuery only + showDefaultPersonas setting)
  // ═══════════════════════════════════════════════════════════════════════
  const currentFilteredPersonas = useMemo(() => {
    let filtered = personasWithDefaults;
    
    // ⭐ STEP 1: Filter by showDefaultPersonas setting (from AnimaContext)
    // This determines if default personas (SAGE/Nexus) should be shown
    if (!showDefaultPersonas) {
      // Hide default personas if setting is OFF
      filtered = filtered.filter(p => p.default_yn === 'N');
    }
    
    // ⭐ STEP 2: Filter by emotion category (optional, can be removed if not needed)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category_type === selectedCategory);
    }
    
    // ⭐ STEP 3: Filter by search query (Real-time name search)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.persona_name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [personasWithDefaults, showDefaultPersonas, selectedCategory, searchQuery]);
  
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
  // ⭐ NEW: Check if current persona is video converting (메시지 작성 불가 조건)
  // ═══════════════════════════════════════════════════════════════════════
  const isVideoConverting = useMemo(() => {
    if (!currentPersona) return false;
    
    // ❌ 메시지 작성 불가: 비디오 URL이 있지만 변환이 완료되지 않음
    const isConverting = 
      currentPersona.selected_dress_video_url !== null && 
      currentPersona.selected_dress_video_convert_done === 'N';
    
    if (__DEV__ && isConverting) {
      console.log('[PersonaStudioScreen] 🎬 Video converting for:', currentPersona.persona_name);
      console.log('  - video_url:', currentPersona.selected_dress_video_url);
      console.log('  - convert_done:', currentPersona.selected_dress_video_convert_done);
    }
    
    return isConverting;
  }, [currentPersona]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  // ⭐ NEW: Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 [PersonaStudioScreen] Pull-to-refresh triggered');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    setIsRefreshing(true);
    HapticService.light();
    
    try {
      // Reload persona list from API
      await initializePersonas();
      
      HapticService.success();
      /*
      showToast({
        type: 'success',
        emoji: '✅',
        message: t('persona.refreshed'),
      });
      */
      if (__DEV__) {
        console.log('✅ [PersonaStudioScreen] Persona list refreshed');
      }
    } catch (error) {
      console.error('❌ [PersonaStudioScreen] Refresh error:', error);
      HapticService.warning();
      showToast({
        type: 'error',
        emoji: '⚠️',
        message: t('errors.generic'),
      });
    } finally {
      setIsRefreshing(false);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }, [initializePersonas, showToast, t]);
  
  // Handle persona change from PersonaSwipeViewer
  const handlePersonaChange = useCallback((newIndex) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 📍 Persona index changed:', newIndex);
      console.log('   currentFilteredPersonas length:', currentFilteredPersonas.length);
    }
    
    savedIndexRef.current = newIndex;
    setCurrentPersonaIndex(newIndex);
    setSelectedIndex(newIndex); // Update index (legacy support)
    
    // ⭐ NEW: Update actual persona object in PersonaContext
    const actualPersona = currentFilteredPersonas[newIndex];
    if (actualPersona) {
      setSelectedPersona(actualPersona);
      if (__DEV__) {
        console.log('✅ [PersonaStudioScreen] Set selectedPersona:', actualPersona.persona_name);
        console.log('   persona_key:', actualPersona.persona_key);
        console.log('   identity_name:', actualPersona.identity_name);
      }
    }
  }, [setSelectedIndex, setSelectedPersona, currentFilteredPersonas]);
  
  // ❌ REMOVED: handlePanelToggle, handlePanelClose, handlePersonaSelectFromPanel (PersonaSelectorButton/Panel removed)
  
  // Handle add persona
  const handleAddPersona = useCallback(async () => {
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
    
    console.log('[PersonaStudioScreen] ✅ User logged in, checking notification permission');
    HapticService.light();
    
    // ⭐ NEW: Check notification permission FIRST (before opening sheet)
    const hasPermission = await checkNotificationPermission();
    const hasRequested = await hasRequestedNotificationPermission();
    
    if (!hasPermission && !hasRequested) {
      console.log('⚠️  [PersonaStudioScreen] No permission, showing Pre-permission sheet');
      // Set context and show permission sheet
      setPermissionContext('persona_creation');
      pendingActionRef.current = () => setIsPersonaCreationOpen(true);
      setShowPermissionSheet(true);
      return;
    }
    
    // Permission already granted or requested, open creation sheet directly
    console.log('[PersonaStudioScreen] ✅ Permission checked, opening persona creation sheet');
    setIsPersonaCreationOpen(true);
  }, [user, showToast, t, navigation]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ MODIFIED: Permission check already done in handleAddPersona
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handlePersonaCreationStartWithPermission = useCallback(async (data) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ [PersonaStudioScreen] Persona creation started (permission already checked)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Permission already checked in handleAddPersona, proceed directly
    handlePersonaCreationStart(data);
  }, []);
  
  // ⭐ NEW: Handle "Allow" button in pre-permission sheet
  const handlePermissionAllow = useCallback(async () => {
    setShowPermissionSheet(false);
    
    // Request system permission with dynamic context
    const granted = await requestNotificationPermissionWithContext(permissionContext);
    
    if (granted) {
      showToast({ 
        type: 'success', 
        emoji: '💙', 
        message: t('notification_permission.enabled') || '알림이 활성화되었습니다' 
      });
    }
    
    // Execute pending action (open creation sheet, start video conversion, etc.)
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  }, [permissionContext, showToast, t]);
  
  // ⭐ NEW: Handle "Later" button in pre-permission sheet
  const handlePermissionDeny = useCallback(() => {
    setShowPermissionSheet(false);
    
    // Execute pending action even without permission
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  }, []);
  
  // Handle persona creation start (⭐ SIMPLIFIED: No polling, just refresh list)
  const handlePersonaCreationStart = useCallback(async (data) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ [PersonaStudioScreen] Persona creation started');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Data:', {
      name: data.name,
      gender: data.gender,
      description: data.description,
      hasFile: !!data.file,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Close creation sheet
    setIsPersonaCreationOpen(false);
    
    // ⭐ Show emotional loading overlay
    setIsCreatingPersona(true);

    console.log('user', user);
    console.log('key', user.user_key);
    
    try {
      // Call API to create persona
      const response = await createPersona(user.user_key, {
        name: data.name,
        description: data.description,
        gender: data.gender,
        photo: data.file,
      });

      console.log('response: ', response);
      
      if (!response.success) {

        setIsCreatingPersona(false);
        console.log('response.error_code : ', response.error_code);

        switch(response.error_code){
          case 'INSUFFICIENT_POINT':
            showAlert ({
              title: t('common.not_enough_point_title'),
              message: t('common.not_enough_point'),
              buttons: [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('common.confirm'),
                  style: 'primary',
                  onPress: () => {
                    navigation.navigate('Settings');
                  },
                },
              ],
            });
            break;
          default:
           throw new Error(response.error || 'Persona creation failed');
            break;  
        }

        return;
      }
      
      const { persona_key, estimate_time, persona_url, memory_key, bric_key } = response.data;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ [PersonaStudioScreen] Persona creation initiated!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Response:', {
        persona_key,
        estimate_time,
        persona_url,
        bric_key,
        memory_key,
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // ⭐ Refresh persona list immediately (new persona will appear with original_url)
      await initializePersonas();
      
      // ⭐ Hide loading overlay
      setIsCreatingPersona(false);
      
      HapticService.success();
      showToast({
        type: 'success',
        emoji: '✨',
        message: t('persona.creation.success_initiated', { name: data.name }),
      });
      
    } catch (error) {
      console.error('[PersonaStudioScreen] ❌ Persona creation error:', error);
      
      // ⭐ Hide loading overlay on error
      setIsCreatingPersona(false);

      let error_info = t('common.error');
      
      showToast({
        type: 'error',
        message: error_info,
        emoji: '⚠️',
      });
      HapticService.warning();
    }
  }, [user, showToast, t, initializePersonas]);
  
  // Handle persona creation close
  const handlePersonaCreationClose = useCallback(() => {
    HapticService.light();
    setIsPersonaCreationOpen(false);
  }, []);
  
  // ⭐ NEW: Handle check persona status (from PersonaCardView timer)
  const handleCheckPersonaStatus = useCallback(async (persona, onComplete) => {
    try {
      const statusResponse = await checkPersonaStatus(
        persona.persona_key,
        persona.history_key,
        persona.bric_key,
        persona.persona_description || ''
      );

      // ⭐ FIX: statusResponse is already the data object (not response.data)
      if (statusResponse?.status === 'completed') {
        // Persona creation complete!
        
        // ⭐ Refresh persona list first
        await initializePersonas();
        
        // ⭐ Celebrate with Confetti! 🎉
        confettiRef.current?.start();
        
        HapticService.success();
        showToast({
          type: 'success',
          emoji: '🎉',
          message: t('persona.creation.success', { name: persona.persona_name }),
        });
      } else {
        // Still processing or other status
        showToast({
          type: 'info',
          emoji: '⏳',
          message: t('persona.creation.still_processing', { name: persona.persona_name }),
        });
      }
    } catch (error) {
      console.error('[PersonaStudioScreen] Status check error:', error);
      showToast({
        type: 'error',
        emoji: '❌',
        message: t('persona.creation.errors.status_check_failed'),
      });
    } finally {
      onComplete?.();
    }
  }, [showToast, t, initializePersonas]);
  
  
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
    
    HapticService.success();
    setIsMessageCreationVisible(true); // ⭐ Open overlay instead of message mode
    
    console.log('✅ [PersonaStudioScreen] setIsMessageCreationVisible(true) called');
  }, [isScreenFocused, isMessageCreationVisible, currentPersona]);
  
  // ⭐ NEW: Close Message Creation Overlay
  const handleCloseMessageCreation = useCallback(() => {
 
    HapticService.light();
    setIsMessageCreationVisible(false);
    
    console.log('✅ [PersonaStudioScreen] setIsMessageCreationVisible(false) called');
  }, [isScreenFocused, isMessageCreationVisible]);

  // Settings (설정)
  const handleQuickSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);


  // ❌ REMOVED: handleFilterModeChange (UI simplified - single unified list)

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
  
  // ⭐ Internal function: Actual video conversion logic
  const handlePersonaVideoConvertInternal = useCallback(async (persona) => {
    if (!user?.user_key) return;
    
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🎬 Video convert requested for:', {
        persona_name: persona.persona_name,
        persona_key: persona.persona_key,
        img_url: persona.selected_dress_image_url,
        memory_key: persona.history_key,
      });
    }
    
    // ⭐ Show processing overlay
    setProcessingMessage(t('persona.video_converting_message'));
    setIsConvertingVideo(true);
    
    // Close settings sheet
    setIsPersonaSettingsOpen(false);
    
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
                selected_dress_video_url: result.data.data,
                selected_dress_video_convert_done: 'N', // Conversion in progress
                bric_convert_key: result.request_key,
              }
            : p
        ));
        
        // Update currentPersona if it's the one being converted
        if (currentPersona?.persona_key === persona.persona_key) {
          setCurrentPersona(prev => ({ 
            ...prev, 
            selected_dress_video_url: result.data.data,
            selected_dress_video_convert_done: 'N',
            bric_convert_key: result.request_key,
          }));
        }
        
        // ⭐ Hide processing overlay
        setIsConvertingVideo(false);
        
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

        setIsConvertingVideo(false);
        console.log('response.error_code : ', result.error_code);
        
        switch(result.error_code){
          case 'INSUFFICIENT_POINT':
            showAlert ({
              title: t('common.not_enough_point_title'),
              message: t('common.not_enough_point'),
              buttons: [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('common.confirm'),
                  style: 'primary',
                  onPress: () => {
                    navigation.navigate('Settings');
                  },
                },
              ],
            });
            break;
          default:
           throw new Error(result.error || 'Video conversion failed');
            break;  
        }

        return;

      }
    } catch (error) {
      console.error('[PersonaStudioScreen] ❌ Video convert error:', error);
      
      // ⭐ Hide processing overlay on error
      setIsConvertingVideo(false);
      
      showToast({
        type: 'error',
        message: error.response?.data?.message || t('errors.generic'),
        emoji: '⚠️',
      });
    }
  }, [user, currentPersona, setPersonas, showToast, t]);

  // ⭐ NEW: Wrapper function with permission check
  const handlePersonaVideoConvert = useCallback(async (persona) => {
    // Check notification permission before video conversion
    const hasPermission = await checkNotificationPermission();
    const hasRequested = await hasRequestedNotificationPermission();
    
    if (!hasPermission && !hasRequested) {
      // Set context for video conversion
      setPermissionContext('video_conversion');
      // Store persona data for later execution
      pendingActionRef.current = () => handlePersonaVideoConvertInternal(persona);
      setShowPermissionSheet(true);
      return;
    }
    
    // Permission already granted or requested, proceed with conversion
    handlePersonaVideoConvertInternal(persona);
  }, [handlePersonaVideoConvertInternal]);
  
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

  // ❌ REMOVED: personaCounts (filter modes removed, single unified list)
  
  // ❌ REMOVED: Horizontal swipe gesture for filter mode change (UI simplified) 
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
      {/* Header with Search Bar + Category */}
      <View style={styles.header}>
        {/* Title Row */}
        <View style={styles.headerTitleRow}>
          <View style={styles.headerContent}>
            <CustomText type="big" bold style={styles.headerTitle}>
              {t('navigation.title.home')}
            </CustomText>
            <CustomText type="middle" style={styles.headerSubtitle}>
              {t('navigation.subtitle.home')}
            </CustomText>
          </View>
          
          {/* Help Icon */}
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setIsHelpOpen(true)}
            activeOpacity={0.7}
          >
            <IconSearch name="help-circle-outline" size={scale(30)} color={currentTheme.mainColor} />
          </TouchableOpacity>
        </View>

        {/* ⭐ Search Bar + Category Dropdown (Row layout) */}
        <View style={styles.searchRow}>
          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: currentTheme.cardBackground }]}>
            <IconSearch name="search" size={scale(18)} color={currentTheme.textSecondary} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: currentTheme.textPrimary }]}
              placeholder={t('persona.search_placeholder')}
              placeholderTextColor={currentTheme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <IconSearch name="close-circle" size={scale(18)} color={currentTheme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* ⭐ Emotion Category Dropdown Button */}
          <TouchableOpacity
            style={[styles.categoryButton, {display: 'none', backgroundColor: currentTheme.cardBackground }]}
            onPress={() => {
              HapticService.light();
              setIsCategoryDropdownVisible(!isCategoryDropdownVisible);
            }}
            activeOpacity={0.7}
          >
            <CustomText style={[styles.categoryButtonText, { color: currentTheme.textPrimary }]}>
              {PERSONA_CATEGORIES.find(c => c.key === selectedCategory)?.emoji}
            </CustomText>
            <IconSearch 
              name={isCategoryDropdownVisible ? "chevron-up" : "chevron-down"} 
              size={scale(18)} 
              color={currentTheme.mainColor} 
            />
          </TouchableOpacity>
        </View>

        {/* ⭐ Emotion Category Dropdown Overlay (with outside click detection) */}
        {isCategoryDropdownVisible && (
          <TouchableWithoutFeedback 
            onPress={() => {
              console.log('[PersonaStudioScreen] 👆 Outside dropdown clicked, closing');
              HapticService.light();
              setIsCategoryDropdownVisible(false);
            }}
          >
            <View style={styles.categoryDropdownBackdrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.categoryDropdown}>
                  {PERSONA_CATEGORIES.map((category) => {
                    const isSelected = category.key === selectedCategory;
                    
                    return (
                      <TouchableOpacity
                        key={category.key}
                        style={[
                          styles.categoryDropdownItem,
                          isSelected && styles.categoryDropdownItemActive
                        ]}
                        onPress={() => {
                          HapticService.light();
                          setSelectedCategory(category.key);
                          setIsCategoryDropdownVisible(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <CustomText style={{ fontSize: scale(18) }}>
                          {category.emoji}
                        </CustomText>
                        <CustomText 
                          type="middle" 
                          bold={isSelected}
                          style={[
                            styles.categoryDropdownText,
                            { color: isSelected ? currentTheme.mainColor : currentTheme.textPrimary }
                          ]}
                        >
                          {t(`category_type.${category.key}`)}
                        </CustomText>
                        {isSelected && (
                          <IconSearch name="checkmark" size={scale(20)} color={currentTheme.mainColor} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
      
      {/* ❌ REMOVED: GestureDetector for horizontal swipe (UI simplified) */}
      {/* Main Container */}
      <View style={styles.container}>
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* BASE LAYER (Z-INDEX: 1) - PersonaSwipeViewer                      */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <View style={styles.baseLayer}>
          <PersonaSwipeViewer 
            key={`swiper-${currentFilteredPersonas.map(p => p.persona_key).join('-')}`} // ⭐ Force re-mount when personas change
            ref={swiperRef}
            personas={currentFilteredPersonas}
            isModeActive={true}
            isScreenFocused={isScreenFocused && !isMessageCreationVisible}
            initialIndex={currentPersonaIndex}
            availableHeight={availableHeight}
            onIndexChange={handlePersonaChange}
            modeOpacity={1} // ⭐ CRITICAL FIX: Set to 1 to make images visible!
            onChatWithPersona={handleChatWithPersona}
            onFavoriteToggle={handlePersonaFavoriteToggle}
            onCheckStatus={handleCheckPersonaStatus}
            enabled={true}
            isMessageMode={false}
            onCreatePersona={handleAddPersona}
            refreshing={isRefreshing} // ⭐ NEW: Pull-to-refresh state
            onRefresh={handleRefresh} // ⭐ NEW: Pull-to-refresh callback
          />
        </View>
        
        {/* QuickActionChips (Right Overlay) */}
        {currentFilteredPersonas.length > 0 && currentPersona?.done_yn === 'Y' && (
          <View style={styles.quickChipsOverlay}>
            <QuickActionChipsAnimated
              onDressClick={handleQuickDress}
              onHistoryClick={handleQuickHistory}
              onVideoClick={handleQuickVideo}
              onMessageClick={handleQuickMessage}
              onSettingsClick={handleQuickSettings}
              isVideoConverting={isVideoConverting} // ⭐ NEW: Pass video converting state
            />
          </View>
        )}

        {/* ❌ REMOVED: PersonaSelectorButton (UI simplified) */}
        {/* ❌ REMOVED: PersonaSelectorPanel (UI simplified) */}

        {/* ⭐ SIMPLIFIED: Create Button (replaces PersonaTypeSelector) */}
        <View style={styles.typeSelectorOverlay}>
          <View style={styles.createButtonContainer}>
            <TouchableOpacity
              style={[styles.createPersonaButton, { backgroundColor: currentTheme.mainColor }]}
              onPress={handleCreatePersona}
              activeOpacity={0.8}
            >
              <Icon name="add" size={scale(20)} color="#FFFFFF" />
              <CustomText type="small" bold style={styles.createPersonaButtonText}>
                {t('persona.create')}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

      </View>
      
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Persona Creation Sheet (Absolute positioning with max z-index) */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <View style={styles.sheetContainer}>
        <ChoicePersonaSheet
          isOpen={isPersonaCreationOpen}
          onClose={handlePersonaCreationClose}
          onCreateStart={handlePersonaCreationStartWithPermission}
        />
      </View>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Help Sheet */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <View style={styles.sheetContainer}>
        <MainHelpSheet
          ref={helpSheetRef}
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          onCreateStart={handlePersonaCreationStartWithPermission}
        />
      </View>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Processing Loading Overlay (Universal: Persona / Video / Music) */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      
      {/* Persona Creation */}
      <ProcessingLoadingOverlay
        visible={isCreatingPersona}
        message={t('persona.creation.creating')}
      />
      
      {/* Video Conversion */}
      <ProcessingLoadingOverlay
        visible={isConvertingVideo}
        message={processingMessage}
      />


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
    {/* ═════════════════════════════════════════════════════════════════ 
    <CategorySelectionSheet
      isOpen={isCategorySelectionOpen}
      currentCategory={settingsPersona?.category_type || 'normal'}
      onClose={() => setIsCategorySelectionOpen(false)}
      onSelectCategory={handleCategorySelect}
    />
    */}
    
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
    {/* Message Creation Overlay (⭐ NEW: Full-screen overlay) */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    {isMessageCreationVisible && (
      <MessageCreationOverlay
        visible={isMessageCreationVisible}
        selectedPersona={currentPersona}
        onClose={handleCloseMessageCreation}
      />
    )}
    
    {/* ═════════════════════════════════════════════════════════════════ */}
    {/* ⭐ NEW: Notification Permission Sheet (Pre-permission for persona creation) */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    <NotificationPermissionSheet
      visible={showPermissionSheet}
      context={permissionContext}
      onAllow={handlePermissionAllow}
      onDeny={handlePermissionDeny}
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
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(12),
    gap: verticalScale(10),
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(4),
  },
  headerSubtitle: {
    color: COLORS.TEXT_PRIMARY,
    display: 'none',
  },
  helpButton: {
    marginLeft: platformPadding(12),
    padding: platformPadding(8),
  },
  
  // ⭐ NEW: Search Row (Search Bar + Category Button)
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(-10),
    marginBottom: verticalScale(10),
  },
  
  // Search Bar (reduced height)
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(0),
    paddingVertical: verticalScale(0),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(14),
    paddingVertical: 0,
  },
  
  // ⭐ NEW: Emotion Category Dropdown Button
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    borderRadius: scale(10),
    gap: scale(6),
    minWidth: scale(60),
    justifyContent: 'center',
  },
  categoryButtonText: {
    fontSize: scale(18),
  },
  
  // ⭐ NEW: Category Dropdown Backdrop (for outside click detection)
  categoryDropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'transparent', // Transparent but clickable
  },
  
  // ⭐ NEW: Category Dropdown Overlay (ANIMA 감성 - 진한 블루 배경)
  categoryDropdown: {
    position: 'absolute',
    top: verticalScale(100),
    right: platformPadding(20),
    width: scale(200),
    backgroundColor: 'rgba(13, 17, 23, 0.95)', // ⭐ 진한 배경 (이미지/비디오 위에서도 잘 보임)
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.5)', // ⭐ ANIMA 감성 블루 테두리
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  categoryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14), // ⭐ 높이 증가
    gap: scale(12),
    borderBottomWidth: 1, // ⭐ 테두리 두께 증가
    borderBottomColor: 'rgba(255, 255, 255, 0.05)', // ⭐ 더 미묘한 구분선
  },
  categoryDropdownItemActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)', // ⭐ ANIMA 감성 하이라이트
  },
  categoryDropdownText: {
    flex: 1,
    marginLeft: scale(8),
  },
  moreButton: {
    marginLeft: platformPadding(2),
    padding: platformPadding(8),
    display: 'none',
  },

  // ⭐ PersonaTypeSelector Overlay (now for Create Button)
  typeSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
  },

  // ⭐ NEW: Create Button Container (replaces PersonaTypeSelector)
  createButtonContainer: {
    paddingHorizontal: platformPadding(20),
    paddingVertical: verticalScale(10),
    alignItems: 'flex-end', // Align to right (like PersonaTypeSelector create button)
  },

  // ⭐ NEW: Create Persona Button
  createPersonaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: scale(20),
    gap: scale(6),
  },

  createPersonaButtonText: {
    color: '#FFFFFF',
  },

});

export default PersonaStudioScreen;

