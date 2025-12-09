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
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconSearch from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../contexts/ThemeContext';
import { usePersona } from '../contexts/PersonaContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import PersonaSwipeViewer from '../components/persona/PersonaSwipeViewer';
import QuickActionChipsAnimated from '../components/quickaction/QuickActionChipsAnimated';
import PersonaSelectorButton from '../components/persona/PersonaSelectorButton';
import PersonaSelectorPanel from '../components/persona/PersonaSelectorPanel';
import PersonaSearchOverlay from '../components/persona/PersonaSearchOverlay';
import PersonaTypeSelector from '../components/persona/PersonaTypeSelector';
import PersonaSettingsSheet from '../components/persona/PersonaSettingsSheet';
import CategorySelectionSheet from '../components/persona/CategorySelectionSheet';
import ChoicePersonaSheet from '../components/persona/ChoicePersonaSheet';
import MessageInputOverlay from '../components/message/MessageInputOverlay';
import MessageCreationOverlay from '../components/message/MessageCreationOverlay';
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
import CustomText from '../components/CustomText';
import { COLORS } from '../styles/commonstyles';


const PersonaStudioScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { personas, setPersonas, selectedPersona: contextSelectedPersona, initializePersonas } = usePersona();
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
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isPersonaCreationOpen, setIsPersonaCreationOpen] = useState(false);
  const [isPersonaSettingsOpen, setIsPersonaSettingsOpen] = useState(false);
  const [isCategorySelectionOpen, setIsCategorySelectionOpen] = useState(false);
  const [settingsPersona, setSettingsPersona] = useState(null);
  const nameInputRef = useRef(null);
  const [isSearchOverlayVisible, setIsSearchOverlayVisible] = useState(false);
  const swiperRef = useRef(null);
  const savedIndexRef = useRef(0);
  const personaCreationDataRef = useRef(null);
  const [filterMode, setFilterMode] = useState('default'); // 'default' | 'user' | 'favorite'
  const [isMessageCreationVisible, setIsMessageCreationVisible] = useState(false);
  
  // Sync isMessageCreationVisible with AnimaContext (for Tab Bar blocking)
  useEffect(() => {
    setIsMessageCreationActive(isMessageCreationVisible);
  }, [isMessageCreationVisible, setIsMessageCreationActive]);
  
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
    
    try {
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
      
      HapticService.success();
      
      // ⭐ NEW: Refresh persona list immediately (incomplete persona will appear with timer)
      await initializePersonas();
      
      showToast({
        type: 'success',
        emoji: '✨',
        message: t('persona.creation.started_toast', { name: data.name, time: estimate_time }),
      });
      
    } catch (error) {
      console.error('[PersonaStudioScreen] ❌ Persona creation error:', error);
      
      showToast({
        type: 'error',
        message: t('persona.creation.errors.creation_failed'),
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
        HapticService.success();
        showToast({
          type: 'success',
          emoji: '🎉',
          message: t('persona.creation.success', { name: persona.persona_name }),
        });

        // Refresh persona list
        await initializePersonas();
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
  
  // Settings (설정)
  const handleQuickSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);
  
  // Search (검색) - Persona search only
  const handleSearchOpen = useCallback(() => {
    HapticService.light();
    setIsSearchOverlayVisible(true);
  }, []);
  
  const handleSearchClose = useCallback(() => {
    setIsSearchOverlayVisible(false);
  }, []);
  
  const handleSearchSelectPersona = useCallback((persona, index) => {
    if (swiperRef.current) {
      swiperRef.current.scrollToIndex({ index, animated: true });
    }
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
            {t('navigation.title.home')}
          </CustomText>
          <CustomText type="middle" style={styles.headerSubtitle}>
            {t('navigation.subtitle.home')}
          </CustomText>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchOpen}
          activeOpacity={0.7}
        >
          <IconSearch name="search-outline" size={scale(24)} color={currentTheme.mainColor} />
        </TouchableOpacity>
      </View>
      
      {/* Container */}
      <View style={styles.container}>
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* BASE LAYER (Z-INDEX: 1) - PersonaSwipeViewer                      */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={styles.baseLayer}>
          <PersonaSwipeViewer 
            ref={swiperRef}
            personas={currentFilteredPersonas}
            isModeActive={true}
            isScreenFocused={isScreenFocused && !isMessageCreationVisible}
            initialIndex={currentPersonaIndex}
            availableHeight={availableHeight}
            onIndexChange={handlePersonaChange}
            modeOpacity={null}
            onChatWithPersona={handleChatWithPersona}
            onFavoriteToggle={handlePersonaFavoriteToggle}
            onCheckStatus={handleCheckPersonaStatus}
            enabled={true}
            isMessageMode={false}
            onCreatePersona={handleAddPersona}
          />
        </View>
        
        {/* QuickActionChips (Right Overlay) */}
        {currentFilteredPersonas.length > 0 && (
          <View style={styles.quickChipsOverlay}>
            <QuickActionChipsAnimated
              onDressClick={handleQuickDress}
              onHistoryClick={handleQuickHistory}
              onVideoClick={handleQuickVideo}
              onMessageClick={handleQuickMessage}
              onSettingsClick={handleQuickSettings}
            />
          </View>
        )}

        {filterMode !== 'default' && (
        <PersonaSelectorButton
            isPersonaMode={false}
            onPress={handlePanelToggle}
        />
        )}
        
        {/* PersonaSelectorPanel (Slide from Right) */}
        <PersonaSelectorPanel
          visible={isPanelVisible}
          personas={currentFilteredPersonas}
          onSelectPersona={handlePersonaSelectFromPanel}
          onClose={handlePanelClose}
          onViewAll={handleAddPersona}
          onCreatePersona={handleAddPersona}
        />

        {/* PersonaTypeSelector */}
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
    
    {/* Persona Search Overlay */}
    <PersonaSearchOverlay
      visible={isSearchOverlayVisible}
      personas={currentFilteredPersonas}
      onClose={handleSearchClose}
      onSelectPersona={handleSearchSelectPersona}
      currentPersonaKey={currentPersona?.persona_key}
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
    display: 'none',
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

