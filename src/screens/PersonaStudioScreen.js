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
import { View, StyleSheet, TouchableOpacity, Dimensions, TextInput, BackHandler, TouchableWithoutFeedback, DeviceEventEmitter } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconSearch from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons'; // ⭐ NEW: For create button
import { useTranslation } from 'react-i18next';
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg'; // ⭐ NEW: For gradient title
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../contexts/ThemeContext';
import { usePersona } from '../contexts/PersonaContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import PersonaSwipeViewer from '../components/persona/PersonaSwipeViewer';
import QuickActionChipsAnimated from '../components/quickaction/QuickActionChipsAnimated';
import PersonaSettingsSheet from '../components/persona/PersonaSettingsSheet';
import PersonaManagerSheet from '../components/persona/PersonaManagerSheet';
import ChoicePersonaSheet from '../components/persona/ChoicePersonaSheet';
import MessageInputOverlay from '../components/message/MessageInputOverlay';
import MessageCreationOverlay from '../components/message/MessageCreationOverlay';
import ProcessingLoadingOverlay from '../components/persona/ProcessingLoadingOverlay'; // ⭐ RENAMED: Universal loading overlay
import ConfettiCannon from 'react-native-confetti-cannon';
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import HapticService from '../utils/HapticService';
import MainHelpSheet from '../components/persona/MainHelpSheet';
import DressManageSheer from '../components/persona/DressManageSheer';
import PersonaShareSheet from '../components/persona/PersonaShareSheet';
import SlideMenu from '../components/SlideMenu'; // ⭐ NEW: Slide menu
import TierUpgradeSheet from '../components/tier/TierUpgradeSheet'; // ⭐ NEW: Tier upgrade sheet

import { 
  createPersona,
  createDress,
  checkPersonaStatus,
  updatePersonaBasic,
  convertPersonaVideo,
  deletePersona,
  togglePersonaFavorite,
} from '../services/api/personaApi';
import CustomText from '../components/CustomText';
import { COLORS } from '../styles/commonstyles';
import amountService from '../services/api/amountService';

// Import Push Notification helpers
import { 
  checkNotificationPermission,
  requestNotificationPermissionWithContext,
  hasRequestedNotificationPermission
} from '../utils/pushNotification';
import NotificationPermissionSheet from '../components/NotificationPermissionSheet';


const PersonaStudioScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { personas, setPersonas, selectedPersona: contextSelectedPersona, setSelectedIndex, setSelectedPersona, initializePersonas } = usePersona();
  const { user } = useUser();
  const { showToast, showAlert, setIsMessageCreationActive, showDefaultPersonas, clearHomeBadge } = useAnima(); // ⭐ Default Personas setting
  const insets = useSafeAreaInsets();
  const refPersonaCount = useRef(0);
  
  // 🔥 PERFORMANCE DEBUG: Render counter
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  if (__DEV__) {
    const timestamp = Date.now();
    console.log(`🔥 [PersonaStudioScreen] Render #${renderCountRef.current} @ ${timestamp}`);
  }
  
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
  const [currentPersona, setCurrentPersonaInternal] = useState(null);
  
  // 🔥 DEBUG: Wrapper to track setCurrentPersona calls
  const setCurrentPersona = useCallback((valueOrUpdater) => {
    if (__DEV__) {
      const timestamp = Date.now();
      if (typeof valueOrUpdater === 'function') {
        console.log(`🔥 [PersonaStudioScreen] setCurrentPersona called (updater function) @ ${timestamp}`);
      } else {
        console.log(`🔥 [PersonaStudioScreen] setCurrentPersona called (direct value):`, valueOrUpdater?.persona_name, `@ ${timestamp}`);
      }
      // 스택 트레이스 출력 (호출 위치 확인)
      console.trace('   Call stack:');
    }
    setCurrentPersonaInternal(valueOrUpdater);
  }, []);
  // ❌ REMOVED: chipsRefreshKey (no longer needed - data is in persona list!)
  // ❌ REMOVED: isPanelVisible (PersonaSelectorPanel removed)
  const [isPersonaCreationOpen, setIsPersonaCreationOpen] = useState(false);
  const [isPersonaSettingsOpen, setIsPersonaSettingsOpen] = useState(false);
  const [isPersonaManagerOpen, setIsPersonaManagerOpen] = useState(false);
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
  const [isPostcardVisible, setIsPostcardVisible] = useState(false); // ⭐ NEW: Postcard flip state
  const [isCreatingPersona, setIsCreatingPersona] = useState(false); // ⭐ Loading overlay for persona creation
  const [isConvertingVideo, setIsConvertingVideo] = useState(false); // ⭐ NEW: Loading overlay for video conversion
  const [processingMessage, setProcessingMessage] = useState(''); // ⭐ NEW: Dynamic message for processing overlay
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpSheetRef = useRef(null);
  const confettiRef = useRef(null); // ⭐ NEW: Confetti ref for completion celebration
  const [isRefreshing, setIsRefreshing] = useState(false); // ⭐ NEW: Pull-to-refresh state
  const [isDressManagementOpen, setIsDressManagementOpen] = useState(false);
  const [dressManagementData, setDressManagementData] = useState(null);
  // ⭐ NEW: Persona dress states (for badge count & rotation)
  const [personaDressStates, setPersonaDressStates] = useState({});
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSlideMenuOpen, setIsSlideMenuOpen] = useState(false); // ⭐ NEW: Slide menu state
  const [isManagerAIChatOpen, setIsManagerAIChatOpen] = useState(false); // ⭐ NEW: Track ManagerAI overlay state for performance
  const [showTierUpgrade, setShowTierUpgrade] = useState(false); // ⭐ NEW: Track tier upgrade state for performance
  // Sync isMessageCreationVisible with AnimaContext (for Tab Bar blocking)
  useEffect(() => {
    setIsMessageCreationActive(isMessageCreationVisible);
  }, [isMessageCreationVisible, setIsMessageCreationActive]);
  
  // ❌ REMOVED: filterMode auto-adjust (UI simplified - single unified list)
  
  // ⭐ Android back button handler for slide menu, postcard, and category dropdown
  useEffect(() => {
    if (!isSlideMenuOpen && !isCategoryDropdownVisible && !isPostcardVisible) return;
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // ⭐ Priority 1: Close slide menu
      if (isSlideMenuOpen) {
        console.log('[PersonaStudioScreen] 🔙 Back button pressed, closing slide menu');
        HapticService.light();
        setIsSlideMenuOpen(false);
        return true; // Prevent default back behavior
      }
      
      // ⭐ Priority 2: Close postcard (flip to front)
      if (isPostcardVisible) {
        console.log('[PersonaStudioScreen] 🔙 Back button pressed, flipping postcard to front');
        HapticService.light();
        
        // Get current persona and flip to front
        const currentPersona = currentFilteredPersonas[currentPersonaIndex];
        if (currentPersona) {
          const cardRef = personaCardRefs.current[currentPersona.persona_key];
          if (cardRef && cardRef.flipToFront) {
            cardRef.flipToFront();
          }
        }
        return true; // Prevent default back behavior
      }
      
      // ⭐ Priority 3: Close category dropdown
      if (isCategoryDropdownVisible) {
        console.log('[PersonaStudioScreen] 🔙 Back button pressed, closing category dropdown');
        HapticService.light();
        setIsCategoryDropdownVisible(false);
        return true; // Prevent default back behavior
      }
      
      return false; // Allow default back behavior
    });
    
    return () => backHandler.remove();
  }, [isSlideMenuOpen, isCategoryDropdownVisible, isPostcardVisible, currentFilteredPersonas, currentPersonaIndex, personaCardRefs]);
  
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏠 [PersonaStudioScreen] User from useUser():');
    console.log('   user:', user);
    console.log('   user?.user_key:', user?.user_key);
    console.log('   typeof user:', typeof user);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, [user]);
  // ═══════════════════════════════════════════════════════════════════════
  // TAB NAVIGATION IS NOW BLOCKED IN CustomTabBar (via AnimaContext)
  // No need for beforeRemove or tabPress listeners here!
  // ═══════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN FOCUS HANDLER (⚡ OPTIMIZED: No automatic refresh!)
  // ═══════════════════════════════════════════════════════════════════════
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      
      // 💙 NEW: Clear Home badge when screen is focused
      clearHomeBadge();
      
      // ⚡ REMOVED: Automatic chips refresh (now only refreshes on pull-to-refresh or chat close)
      // Relationship data is already in persona list, no need to refresh on every focus!
      
      return () => {
        setIsScreenFocused(false);
        
        // Close overlay when screen loses focus
        if (isMessageCreationVisible) {
          setIsMessageCreationVisible(false);
        }
      };
    }, [isMessageCreationVisible, clearHomeBadge])
  );

  // ═══════════════════════════════════════════════════════════════════════
  // 🔔 PUSH NOTIFICATION EVENT LISTENER
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    console.log('[PersonaStudioScreen] 🔔 Registering push event listener...');
    
    const subscription = DeviceEventEmitter.addListener('ANIMA_PUSH_RECEIVED', async (data) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[PersonaStudioScreen] 🔔 Push received!');
      console.log('   order_type:', data.order_type);
      console.log('   persona_key:', data.persona_key);
      console.log('   persona_name:', data.persona_name);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const { order_type } = data;
      
      switch (order_type) {
        case 'create_persona':
          // ✅ 완전 초기화 + 스크롤 최상단
          console.log('[PersonaStudioScreen] 🎨 create_persona: Full reset + scroll to top');
          
          // ✅ FIX: Get latest personas immediately!
          const latestPersonas = await initializePersonas();
          
          // ✅ FIX: Use latest personas DIRECTLY to update Context!
          // This ensures CustomTabBar gets the correct data immediately!
          if (latestPersonas && latestPersonas.length > 0) {
            const targetPersona = latestPersonas[0];
            
            // ✅ Synchronize ALL states with latest data directly!
            savedIndexRef.current = 0;
            setCurrentPersonaIndex(0);
            setSelectedIndex(0);
            setSelectedPersona(targetPersona); // ← 최신 데이터 즉시 Context 업데이트!
            
            if (__DEV__) {
              console.log('[PersonaStudioScreen] ✅ Index synchronized with LATEST data');
              console.log('   Persona:', targetPersona.persona_name);
              console.log('   done_yn:', targetPersona.done_yn);
            }
            
            // ✅ FIX: Scroll to top immediately (no animation, no delay)
            if (swiperRef.current) {
              swiperRef.current.scrollToIndex({ index: 0, animated: false });
            }
          }
          
          HapticService.success();
          showToast({
            type: 'success',
            emoji: '✨',
            message: t('persona.creation.completed'),
          });
          break;
          
        case 'create_dress':
        case 'convert_video':
          // ✅ 리로드 (인덱스/스크롤 유지)
          console.log(`[PersonaStudioScreen] 👗 ${order_type}: Reload (keep index & scroll)`);
          
          // Save current index
          const savedIndex = currentPersonaIndex;
          
          // ✅ FIX: Get latest personas immediately!
          const latestPersonasReload = await initializePersonas();
          
          // ✅ Wait for React to update Context and trigger re-renders
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // ✅ FIX: Use latest personas DIRECTLY to update Context!
          if (latestPersonasReload && latestPersonasReload.length > 0) {
            // Restore index (ensure it's within bounds)
            const validIndex = Math.min(savedIndex, latestPersonasReload.length - 1);
            const targetPersona = latestPersonasReload[validIndex];
            
            // ✅ Synchronize ALL states with latest data directly!
            savedIndexRef.current = validIndex;
            setCurrentPersonaIndex(validIndex);
            setSelectedIndex(validIndex);
            setSelectedPersona(targetPersona); // ← 최신 데이터 즉시 Context 업데이트!
            
            if (__DEV__) {
              console.log('[PersonaStudioScreen] ✅ Index restored with LATEST data');
              console.log('   Persona:', targetPersona?.persona_name);
              console.log('   persona_key:', targetPersona?.persona_key);
              console.log('   done_yn:', targetPersona?.done_yn);
              console.log('   selected_dress_video_url:', targetPersona?.selected_dress_video_url);
              console.log('   selected_dress_video_convert_done:', targetPersona?.selected_dress_video_convert_done);
              console.log('   Restored index:', validIndex);
              console.log('   Latest personas count:', latestPersonasReload.length);
            }
            
            // ✅ FIX: Scroll to restored position immediately (no animation, no delay)
            if (swiperRef.current) {
              swiperRef.current.scrollToIndex({ index: validIndex, animated: false });
            }
          }
          
          HapticService.success();
          showToast({
            type: 'success',
            emoji: order_type === 'create_dress' ? '👗' : '🎬',
            message: order_type === 'create_dress' 
              ? t('persona.dress.created')
              : t('persona.video.converted'),
          });
          break;
          
        case 'persona_heart_update':
          // 💙 NEW: Persona Heart Update (AI Interests, Next Questions)
          console.log('[PersonaStudioScreen] 💙 persona_heart_update: Refresh heart display');
          
          // ✅ Trigger refresh for PersonaHeartDisplay (self-fetching component)
          // No explicit refresh needed here - PersonaHeartDisplay handles its own data
          // Badge will be cleared when PersonaHeartDisplay is viewed
          
          HapticService.success();
          showToast({
            type: 'success',
            emoji: '💙',
            message: t('persona.heart_updated') || '페르소나가 당신에 대해 더 알게 되었어요!',
          });
          break;
          
        case 'persona_heart_update':
          // 💙 NEW: Persona Heart Update (AI Interests, Next Questions)
          console.log('[PersonaStudioScreen] 💙 persona_heart_update: Heart data updated');
          
          // ✅ PersonaHeartDisplay will self-fetch when opened
          // No explicit refresh needed here - badge will guide user to view
          
          HapticService.success();
          showToast({
            type: 'success',
            emoji: '💙',
            message: t('persona.heart_updated') || '페르소나가 당신에 대해 더 알게 되었어요!',
          });
          break;
          
        default:
          console.log('[PersonaStudioScreen] ⚠️ Unknown order_type:', order_type);
          break;
      }
    });
    
    return () => {
      console.log('[PersonaStudioScreen] 🔔 Removing push event listener...');
      subscription.remove();
    };
  }, [initializePersonas, setSelectedPersona, setSelectedIndex, showToast, t]); // 🔥 REMOVED: currentPersonaIndex (uses savedIndexRef instead!)

  
  // ═══════════════════════════════════════════════════════════════════════
  // USER PERSONAS (Loaded from Database via PersonaContext)
  // ═══════════════════════════════════════════════════════════════════════
  // ✅ All personas (including SAGE/Nexus) are now loaded from DB
  // ✅ No hardcoded DEFAULT_PERSONAS needed
  const personasWithDefaults = useMemo(() => {
    // Filter out Manager AI only (SAGE/Nexus are now from DB)
    const userPersonas = personas.filter(p => !p.isManager);
    
    return userPersonas;
  }, [personas]);
  
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

  // ⚡ OPTIMIZED: Stable key for PersonaSwipeViewer (only changes when persona list actually changes)
  const personasKey = useMemo(() => {
    return `swiper-${currentFilteredPersonas.map(p => p.persona_key).join('-')}`;
  }, [currentFilteredPersonas]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // UPDATE CURRENT PERSONA WHEN PERSONA LIST CHANGES (e.g., add/delete)
  // ═══════════════════════════════════════════════════════════════════════
  // 🔥 PERFORMANCE FIX: Only update when persona LIST changes, not on every index change
  // Index changes are now handled directly in handlePersonaChange to prevent double renders
  useEffect(() => {
    if (currentFilteredPersonas.length > 0) {
      const validIndex = Math.min(currentPersonaIndex, currentFilteredPersonas.length - 1);
      const targetPersona = currentFilteredPersonas[validIndex];
      
      // ✅ Only update if persona actually changed (prevents unnecessary renders)
      if (currentPersona?.persona_key !== targetPersona?.persona_key) {
        setCurrentPersona(targetPersona);
        
        if (__DEV__) {
          console.log('[PersonaStudioScreen] 🔄 Current persona updated (list changed):');
          console.log('   Index:', validIndex);
          console.log('   Persona:', targetPersona?.persona_name);
        }
      }
    }
  }, [currentFilteredPersonas]); // 🔥 CRITICAL: Removed currentPersonaIndex dependency!
  
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
  // ⭐ NEW: Current persona dress state (for badge count & rotation)
  // ═══════════════════════════════════════════════════════════════════════
  const currentDressState = useMemo(() => {
    if (!currentPersona) return { count: 0, hasCreating: false };
    
    const state = personaDressStates[currentPersona.persona_key];
    
    // 상태가 있으면 사용, 없으면 폴백 (currentPersona.dress_count)
    return {
      count: state?.count ?? currentPersona?.dress_count ?? 0,
      hasCreating: state?.hasCreating ?? false
    };
  }, [personaDressStates, currentPersona?.persona_key, currentPersona?.dress_count]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  // ✅ MOVED: Handle persona change (MUST be defined before handleRefresh!)
  const handlePersonaChange = useCallback((newIndex) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 📍 Persona index changed:', newIndex);
      console.log('   currentFilteredPersonas length:', currentFilteredPersonas?.length);
    }
    
    savedIndexRef.current = newIndex;
    setCurrentPersonaIndex(newIndex);
    setSelectedIndex(newIndex); // Update index (legacy support)
    
    // 🔥 PERFORMANCE FIX: Update BOTH selectedPersona AND currentPersona together
    // This prevents the useEffect from triggering an additional render
    const actualPersona = currentFilteredPersonas?.[newIndex];
    if (actualPersona) {
      setSelectedPersona(actualPersona); // ← PersonaContext update
      setCurrentPersona(actualPersona);  // ← Local state update (prevents useEffect trigger!)
      
      if (__DEV__) {
        console.log('✅ [PersonaStudioScreen] Set selectedPersona:', actualPersona.persona_name);
        console.log('   persona_key:', actualPersona.persona_key);
        console.log('   identity_name:', actualPersona.identity_name);
      }
    }
  }, [setSelectedIndex, setSelectedPersona, currentFilteredPersonas]);
  
  // ⭐ NEW: Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 [PersonaStudioScreen] Pull-to-refresh triggered');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ✅ FIX: Save current index before refresh (to restore after)
    const savedIndex = currentPersonaIndex;
    
    setIsRefreshing(true);
    HapticService.light();
    
    try {
      // ✅ FIX: Get latest personas immediately!
      const latestPersonasRefresh = await initializePersonas();
      
      // ✅ FIX: Use latest personas DIRECTLY to update Context!
      if (latestPersonasRefresh && latestPersonasRefresh.length > 0 && savedIndex >= 0) {
        // Restore index (ensure it's within bounds)
        const validIndex = Math.min(savedIndex, latestPersonasRefresh.length - 1);
        const targetPersona = latestPersonasRefresh[validIndex];
        
        // ✅ Synchronize ALL states with latest data directly!
        savedIndexRef.current = validIndex;
        setCurrentPersonaIndex(validIndex);
        setSelectedIndex(validIndex);
        setSelectedPersona(targetPersona); // ← 최신 데이터 즉시 Context 업데이트!
        
        // 🔥 FIX: Update settingsPersona if PersonaSettingsSheet is open
        if (settingsPersona && settingsPersona.persona_key) {
          const updatedSettingsPersona = latestPersonasRefresh.find(
            p => p.persona_key === settingsPersona.persona_key
          );
          if (updatedSettingsPersona) {
            setSettingsPersona(updatedSettingsPersona);
            if (__DEV__) {
              console.log('[PersonaStudioScreen] 🔄 Updated settingsPersona with latest data');
              console.log('   AI Interests:', updatedSettingsPersona.ai_interests ? JSON.parse(updatedSettingsPersona.ai_interests).length : 0);
              console.log('   AI Questions:', updatedSettingsPersona.ai_next_questions ? JSON.parse(updatedSettingsPersona.ai_next_questions).length : 0);
            }
          }
        }
        
        if (__DEV__) {
          console.log('[PersonaStudioScreen] 🎯 Index restored after refresh:', validIndex);
          console.log('   Persona:', targetPersona?.persona_name);
          console.log('   done_yn:', targetPersona?.done_yn);
          console.log('   Latest personas count:', latestPersonasRefresh?.length);
        }
        
        // ✅ FIX: Scroll to restored position immediately (no animation, no delay)
        if (swiperRef.current) {
          swiperRef.current.scrollToIndex({ index: validIndex, animated: false });
        }
      }
      
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
  }, [initializePersonas, showToast, t, currentPersonaIndex, setSelectedPersona, setSelectedIndex, settingsPersona]);
  
  // ❌ REMOVED: Duplicate handlePersonaChange (now defined above handleRefresh)
  
  // ❌ REMOVED: handlePanelToggle, handlePanelClose, handlePersonaSelectFromPanel (PersonaSelectorButton/Panel removed)
  
  // Handle add persona
  const handleAddPersona = useCallback(async () => {
     
    // ⭐ Check if user is logged in
    if (!user || !user.user_key) {
      console.log('[PersonaStudioScreen] ⚠️ User not logged in, redirecting to Settings');
      showAlert({
        type: 'warning',
        message: t('common.login_guide.description'),
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
      HapticService.warning();
      return;
    }
    
    console.log('personas.length: ', personas.length);
    console.log('personas: ', personas);
    console.log('user: ', user);
    

    const level = user.user_level;

    const max_persona_count = level === 'basic' ? 1 : level === 'premium' ? 5 : 10;


    if((personas.length - 2) >= max_persona_count){

      showAlert({
        title: t('persona.creation.max_limit_title'),
        message: t('persona.creation.max_limit'),
        buttons: [
          {
            text: t('common.cancel'),
            style: 'outline',
          },
          {
            text: t('common.confirm'),
            style: 'primary',
            onPress: () => {
              setIsPersonaCreationOpen(true);
            },
          },
        ],
      });
      return;
    }
    
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

  // Handle add persona
  const handleAddDress = useCallback(async () => {
    console.log('[PersonaStudioScreen] 📸 Add dress requested');
    
    /*
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
*/
    // Permission already granted or requested, open creation sheet directly
    console.log('[PersonaStudioScreen] ✅ Permission checked, opening persona dress sheet');
    setIsDressManagementOpen(true);
  }, [user, showToast, t, navigation]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ MODIFIED: Permission check already done in handleAddPersona
  // ⚠️ useCallback REMOVED to fix closure issue - direct function always uses latest user
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handlePersonaCreationStartWithPermission = async (data) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ [PersonaStudioScreen] Persona creation started (permission already checked)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Permission already checked in handleAddPersona, proceed directly
    // ⚠️ handlePersonaCreationStart is now a regular function, always uses latest user
    handlePersonaCreationStart(data);
  };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ MODIFIED: Permission check already done in handleAddPersona
  // ⚠️ useCallback REMOVED to fix closure issue - direct function always uses latest user
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handlePersonaDressStartWithPermission = async (data) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ [PersonaStudioScreen] Persona dress started (permission already checked)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Permission already checked in handleAddPersona, proceed directly
    handleDressCreationStart(data);
  };

  
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
  // ⚠️ useCallback REMOVED to fix closure issue - direct function always uses latest user
  const handlePersonaCreationStart = async (data) => {
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
    console.log('🔍 [DEBUG] user at function start:', user); // ⭐ DEBUG
    console.log('🔍 [DEBUG] user.user_key:', user?.user_key); // ⭐ DEBUG
    
    // Close creation sheet
    setIsPersonaCreationOpen(false);
    
    // ⭐ Show emotional loading overlay
    setIsCreatingPersona(true);

    if(!user){
      setIsCreatingPersona(false);
      console.log('❌ [ERROR] why user is not found?');
      console.log('❌ [ERROR] typeof user:', typeof user); // ⭐ DEBUG
      console.log('❌ [ERROR] user value:', user); // ⭐ DEBUG
      navigation.navigate('Settings');
      HapticService.warning();
      showAlert({
        title: t('common.login_guide.title'),
        message: t('common.login_guide.description'),
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
      return;
    }

    console.log('✅ [SUCCESS] user', user);
    console.log('✅ [SUCCESS] key', user.user_key);
    
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
      
      // ✅ FIX: Full reload with index synchronization (same as push notification)
      const latestPersonas = await initializePersonas();
      
      // ✅ Wait for React to update Context and trigger re-renders
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (latestPersonas && latestPersonas.length > 0) {
        // New persona should be at index 0 (most recent)
        const targetPersona = latestPersonas[0];
        
        // ✅ Synchronize ALL states with latest data
        savedIndexRef.current = 0;
        setCurrentPersonaIndex(0);
        setSelectedIndex(0);
        setSelectedPersona(targetPersona);
        
        if (__DEV__) {
          console.log('[PersonaStudioScreen] ✅ New persona created, reset to index 0');
          console.log('   New persona:', targetPersona.persona_name);
          console.log('   Total personas:', latestPersonas.length);
        }
        
        // ✅ Scroll to top (no animation)
        if (swiperRef.current) {
          swiperRef.current.scrollToIndex({ index: 0, animated: false });
        }
      }
      
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
  }; // ⚠️ useCallback REMOVED - now regular function

  // Handle dress creation start (⭐ SIMPLIFIED: No polling, just refresh list)
  // ⚠️ useCallback REMOVED to fix closure issue - direct function always uses latest user
  const handleDressCreationStart = async (data) => {

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ [PersonaStudioScreen] Persona dress started');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Data:', {
      name: data.name,
      gender: data.gender,
      description: data.description,
      hasFile: !!data.file,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Close creation sheet
    setIsDressManagementOpen(false);
    
    // ⭐ Show emotional loading overlay
    setIsCreatingPersona(true);
//    setIsCreatingDress(true);

    console.log('currentPersona: ', currentPersona);
    
    // ⭐ NEW: Update dress state (생성 시작 → count +1, hasCreating = true)
    if (currentPersona?.persona_key) {
      const currentCount = personaDressStates[currentPersona.persona_key]?.count ?? currentPersona.dress_count ?? 0;
      handleDressStateUpdate(currentPersona.persona_key, {
        count: currentCount + 1,
        hasCreating: true // ⭐ 회전 시작!
      });
    }
    
    try {
      // Call API to create persona
      const response = await createDress(user.user_key, {
        persona_key: currentPersona?.persona_key,
        name: data.name,
        description: data.description,
        gender: data.gender,
        selected_dress_image_url: currentPersona?.selected_dress_image_url,
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
  };
  
  // Handle persona creation close
  const handlePersonaCreationClose = useCallback(() => {
    HapticService.light();
    setIsPersonaCreationOpen(false);
  }, []);

  // Handle persona dress close
  const handlePersonaDressClose = useCallback(() => {
    HapticService.light();
    setIsDressManagementOpen(false);
  }, []);
  
  // ⭐ NEW: Handle dress state update (from DressManageSheer)
  const handleDressStateUpdate = useCallback((personaKey, dressState) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 👗 Dress state update:', {
        personaKey,
        count: dressState.count,
        hasCreating: dressState.hasCreating
      });
    }
    
    setPersonaDressStates(prev => {
      // ⚡ OPTIMIZATION: 값이 같으면 업데이트 안 함 (리렌더링 방지!)
      if (prev[personaKey]?.count === dressState.count && 
          prev[personaKey]?.hasCreating === dressState.hasCreating) {
        return prev; // ⭐ 동일한 객체 반환 = 리렌더링 없음!
      }
      
      return {
        ...prev,
        [personaKey]: {
          count: dressState.count,
          hasCreating: dressState.hasCreating,
          lastUpdated: Date.now()
        }
      };
    });
  }, []);
  
  // ⭐ Handle dress updated (로컬 상태 즉시 갱신)
  const handleDressUpdated = useCallback((dressData) => {
    console.log('[PersonaStudioScreen] 👗 Dress updated, refreshing local state...');
    console.log('  Dress data:', dressData);
    console.log('  Current persona:', currentPersona?.persona_key);
    
    if (!currentPersona) {
      console.log('[PersonaStudioScreen] ⚠️ No current persona, skipping update');
      return;
    }
    
    // Update personas array
    setPersonas(prevPersonas => {
      const updatedPersonas = prevPersonas.map(p => {
        if (p.persona_key === currentPersona.persona_key) {
          console.log('[PersonaStudioScreen] ✅ Updating persona:', p.persona_key);

          console.log('dressData: ', dressData);
          return {
            ...p,
            selected_dress_image_url: dressData.selected_dress_image_url,
            selected_dress_video_url: dressData.selected_dress_video_url,
            selected_dress_persona_comment: dressData.persona_comment,
            persona_comment_checked: dressData.persona_comment_checked,
            selected_dress_video_convert_done: dressData.convert_done_yn,

            history_key: dressData.history_key,
            persona_url: dressData.selected_dress_image_url, // ⭐ Main image also updated

          };
        }
        return p;
      });
      
      console.log('[PersonaStudioScreen] 📊 Personas updated, count:', updatedPersonas.length);
      return updatedPersonas;
    });
    
    // Update currentPersona ref
    setCurrentPersona(prev => {
      if (prev && prev.persona_key === currentPersona.persona_key) {
        console.log('[PersonaStudioScreen] ✅ Updating currentPersona');
        return {
          ...prev,
          selected_dress_video_url: dressData.selected_dress_video_url,
          selected_dress_persona_comment: dressData.persona_comment,
          persona_comment_checked: dressData.persona_comment_checked,
          selected_dress_video_convert_done: dressData.convert_done_yn,

          history_key: dressData.history_key,
          persona_url: dressData.selected_dress_image_url, // ⭐ Main image also updated

        };
      }
      return prev;
    });
    
    console.log('[PersonaStudioScreen] ✅ Local state updated successfully!');
  }, [currentPersona]);
  
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
  
  
  // 2. Memory History (추억/히스토리)
  // ⭐ Ref for PersonaCardView (to control flip animation)
  const personaCardRefs = useRef({});

  const handleQuickHistory = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 📚 Memory history clicked');
    }
    
    HapticService.medium();

    // Get current persona
    const currentPersona = currentFilteredPersonas[currentPersonaIndex];

    console.log('currentPersonaIndex: ', currentPersonaIndex);
    console.log('currentFilteredPersonas: ', currentFilteredPersonas);
    console.log('currentPersona: ', currentPersona);

    if (!currentPersona) {
      console.warn('[PersonaStudioScreen] No current persona for history');
      return;
    }
    
    // Check if persona has persona_comment (from dress creation)
    const hasComment = currentPersona.selected_dress_persona_comment && currentPersona.selected_dress_persona_comment.trim() !== '';
    
    if (!hasComment) {
      // Show alert if no memory yet
      showAlert({
        title: t('postcard.no_memory_title'),
        message: t('postcard.no_memory_message'),
        emoji: '💭',
        buttons: [
          {
            text: t('common.confirm'),
            onPress: () => {},
          },
        ],
      });
      return;
    }
    
    // Trigger flip animation on current PersonaCardView
    const cardRef = personaCardRefs.current[currentPersona.persona_key];
    if (cardRef && cardRef.flipToBack) {
      if (__DEV__) {
        console.log('[PersonaStudioScreen] 🔄 Flipping persona card to postcard view');
      }
      cardRef.flipToBack();
    } else {
      console.warn('[PersonaStudioScreen] PersonaCardView ref not found:', currentPersona.persona_key);
    }
  }, [currentFilteredPersonas, currentPersonaIndex, showAlert, t]);

  // ⭐ Handle postcard flip state change
  const handlePostcardFlipChange = useCallback((isFlipped) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 📮 Postcard flip state changed:', isFlipped);
    }
    setIsPostcardVisible(isFlipped);
    HapticService.light();
  }, []);
  
  // ⭐ NEW: Handle comment marked as read (update local state without re-fetching)
  const handleMarkAsRead = useCallback((personaKey) => {
    if (__DEV__) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ [PersonaStudioScreen] Comment marked as read!');
      console.log('   persona_key:', personaKey);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    // ⭐ Update personas list (local state only, no re-fetch!)
    setPersonas(prevPersonas => prevPersonas.map(p => 
      p.persona_key === personaKey
        ? { ...p, persona_comment_checked: 'Y' } // ⭐ Mark as read!
        : p
    ));
    
    // ⭐ Update currentPersona if it's the one being read
    if (currentPersona?.persona_key === personaKey) {
      setCurrentPersona(prev => ({ ...prev, persona_comment_checked: 'Y' }));
    }
    
    if (__DEV__) {
      console.log('✅ [PersonaStudioScreen] Local state updated, badge will disappear!');
    }
  }, [currentPersona, setPersonas]);
  
  // 3. Video Conversion (비디오 변환)
  const handleQuickVideo =  async () => {
    
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🎬 Video conversion clicked');
    }
    
    try{

      let video_amount = 0;
      
      console.log('currentPersona: ', currentPersona);
      console.log('currentPersona?.selected_dress_video_url: ', currentPersona?.selected_dress_video_url);

      if (currentPersona?.selected_dress_video_url !== null) {

        showAlert({
          title: t('persona.settings.video_already_converted_title'),
          message: t('persona.settings.video_already_converted_message'),
          emoji: '✅',
        });
        return;
      }

      const serviceData = await amountService.getServiceData({
        user_key: user?.user_key,
      });

      if (!serviceData.success) {
        HapticService.warning();
        console.log('[PersonaStudioScreen] Service data fetch failed');
        return;

      }else{
        
        video_amount = serviceData.data.video_amount;
      
      }

      showAlert({
        title: t('persona.settings.video_convert_confirm_title'),
        message: t('persona.settings.video_convert_confirm_message', { cost: video_amount.toLocaleString() }),
        emoji: '♥️',
        buttons: [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.confirm'),
            style: 'primary',
            onPress: () => {
              handlePersonaVideoConvert(currentPersona);
              // ⚠️ Don't close here - close after video conversion starts
            },
          },
        ],
      });

    } catch (error) {
      console.error('[PersonaSettingsSheet] Video convert error:', error);
      HapticService.warning();
      showToast({
        type: 'error',
        message: error.message,
          emoji: '⚠️',
      });
    }

  };
  
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

  const handleShareClick = useCallback(() => {
    setIsShareOpen(true);
  }, [isShareOpen]);

  const handlePersonaShare = useCallback(async (type) => {
    console.log('type: ', type);
  }, []);

  const handleDeleteClick  = () => {
    console.log('handleDeleteClick');

    if(currentPersona?.default_yn === 'Y') {
      showAlert({
        title: t('persona.default_persona_delete_confirm_title'),
        message: t('persona.default_persona_delete_confirm_message'),
        emoji: '⚠️',
        buttons: [
          { text: t('common.confirm'), style: 'primary' },
        ],
      });
      return;
    }

    showAlert({
      title: t('persona.settings.delete_confirm_title'),
      message: t('persona.settings.delete_confirm_message',{name: currentPersona?.persona_name}),
      emoji: '🗑️',
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), style: 'primary', onPress: () => { handlePersonaDelete() } },
      ],
    });
  };

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
    setIsManagerAIChatOpen(true); // ⭐ NEW: Mark ManagerAI as open (for performance)

    if(persona?.default_yn === 'Y') {

    //  setIsPersonaManagerOpen(true);
    setIsPersonaSettingsOpen(true);

    }else{

      setIsPersonaSettingsOpen(true);
    }
 
    
    console.log('✅ State updated: isPersonaSettingsOpen = true');
  }, [isPersonaSettingsOpen]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // PERSONA SETTINGS HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleSettingsClose = useCallback(() => {
    setIsManagerAIChatOpen(false); // ⭐ NEW: Mark ManagerAI as closed (resume performance)
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

  const handleShowTier = useCallback(() => {
    setShowTierUpgrade(true);
  }, []);
  
  
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

    console.log('hasPermission: ', hasPermission);
    console.log('hasRequested: ', hasRequested);
    
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
  
  const handlePersonaDelete = async () => {
    
    console.log('handlePersonaDelete');

    console.log('user: ', user);
    if (!user?.user_key) return;

    console.log('currentPersona: ', currentPersona);
    console.log('please');

    if(currentPersona?.default_yn === 'Y') {
      showAlert({
        title: t('persona.default_persona_delete_confirm_title'),
        message: t('persona.default_persona_delete_confirm_message'),
        emoji: '⚠️',
        buttons: [
          { text: t('common.confirm'), style: 'primary' },
        ],
      });
      console.log('default persona delete');
      return;
    }

    console.log('currentPersona?.default_yn: ', currentPersona?.default_yn);
    
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 🗑️ Delete requested for:', {
        persona_name: currentPersona?.persona_name,
        persona_key: currentPersona?.persona_key,
      });
    }
    
    try {
      const result = await deletePersona(
        currentPersona?.persona_key,
        user.user_key
      );

      if (result.success) {
        // ✅ Close settings sheet immediately
        setIsPersonaSettingsOpen(false);
        
        // ✅ FIX: Reload personas from DB (same as push notification logic)
        const deletedPersonaKey = currentPersona?.persona_key;
        const currentIndex = currentPersonaIndex;
        
        // Get latest personas from DB
        const latestPersonas = await initializePersonas();
        
        // ✅ Wait for React to update Context and trigger re-renders
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (latestPersonas && latestPersonas.length > 0) {
          // Calculate new index after deletion
          // If we deleted the last item, move to the new last item
          // Otherwise, stay at the same index (which now shows the next item)
          const newIndex = Math.min(currentIndex, latestPersonas.length - 1);
          const targetPersona = latestPersonas[newIndex];
          
          // ✅ Synchronize ALL states with latest data
          savedIndexRef.current = newIndex;
          setCurrentPersonaIndex(newIndex);
          setSelectedIndex(newIndex);
          setSelectedPersona(targetPersona);
          
          if (__DEV__) {
            console.log('[PersonaStudioScreen] ✅ Persona deleted, index updated');
            console.log('   Deleted persona:', deletedPersonaKey);
            console.log('   Previous index:', currentIndex);
            console.log('   New index:', newIndex);
            console.log('   New persona:', targetPersona?.persona_name);
            console.log('   Remaining personas:', latestPersonas.length);
          }
          
          // ✅ Scroll to new position (no animation)
          if (swiperRef.current) {
            swiperRef.current.scrollToIndex({ index: newIndex, animated: false });
          }
        } else {
          // No personas left
          if (__DEV__) {
            console.log('[PersonaStudioScreen] ⚠️ No personas remaining after delete');
          }
          savedIndexRef.current = 0;
          setCurrentPersonaIndex(0);
          setSelectedIndex(0);
          setSelectedPersona(null);
        }
        
        showToast({
          type: 'success',
          message: t('persona.settings.deleted'),
          emoji: '✅',
        });
        
        if (__DEV__) {
          console.log('[PersonaStudioScreen] ✅ Delete completed with index sync');
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
  };
  
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
            {/* ⭐ One-line Gradient Title: ANIMA + Soul Connection */}
            <View style={styles.titleRow}>
              {/* ANIMA - Gradient Text (SVG) */}
              <Svg height={scale(30)} width={scale(105)}>
                <Defs>
                  <LinearGradient id="animaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FF7FA3" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#A78BFA" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <SvgText
                  fill="url(#animaGradient)"
                  fontSize={scale(26)}
                  fontWeight="bold"
                  x="0"
                  y={scale(22)}
                  letterSpacing="0.5"
                >
                  ANIMA
                </SvgText>
              </Svg>
              
              {/* Soul Connection - Subtitle */}
              <CustomText style={styles.soulConnection}>
                - Soul Connection
              </CustomText>
            </View>
          </View>
          
          {/* Help Icon */}
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setIsHelpOpen(true)}
            activeOpacity={0.7}
          >
            <IconSearch name="help-circle-outline" size={scale(30)} color={currentTheme.mainColor} />
          </TouchableOpacity>
          
          {/* ⭐ NEW: Hamburger Menu Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              HapticService.light();
              setIsSlideMenuOpen(true);
            }}
            activeOpacity={0.7}
          >
            <IconSearch name="menu" size={scale(30)} color={currentTheme.mainColor} />
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
        </View>


      </View>
      
      {/* ❌ REMOVED: GestureDetector for horizontal swipe (UI simplified) */}
      {/* Main Container */}
      <View style={styles.container}>
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* BASE LAYER (Z-INDEX: 1) - PersonaSwipeViewer                      */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <View style={styles.baseLayer}>
          <PersonaSwipeViewer 
            key={personasKey} // ⚡ OPTIMIZED: Stable memoized key!
            ref={swiperRef}
            personas={currentFilteredPersonas}
            isModeActive={true}
            isScreenFocused={isScreenFocused && !isMessageCreationVisible}
            isScreenActive={!isManagerAIChatOpen} // ⭐ NEW: Deactivate background animations when ManagerAI is open (performance!)
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
            onRefresh={handleRefresh} // ⭐ NEW: Pull-to-refresh callback (this refreshes everything!)
            personaCardRefs={personaCardRefs} // ⭐ NEW: Pass refs for flip control (postcard view)
            onPostcardFlipChange={handlePostcardFlipChange} // ⭐ NEW: Callback for postcard flip state change
            isPostcardVisible={isPostcardVisible} // ⭐ NEW: Pass postcard visibility state
            user={user} // ⭐ CRITICAL FIX: Pass user from PersonaStudioScreen for chips!
            onMarkAsRead={handleMarkAsRead} // ⭐ NEW: Callback for comment marked as read (badge removal!)
            // ⚡ REMOVED: chipsRefreshKey (no longer needed!)
          />
        </View>
        
        {/* QuickActionChips (Right Overlay) */}
        {currentFilteredPersonas.length > 0 && currentPersona?.done_yn === 'Y' && !isPostcardVisible && (
          <View style={styles.quickChipsOverlay}>
            <QuickActionChipsAnimated
              onDressClick={handleAddDress}
              onHistoryClick={handleQuickHistory}
              onVideoClick={handleQuickVideo}
              onMessageClick={handleQuickMessage}//{handleQuickMessage}
              onSettingsClick={handleQuickSettings}
              onShareClick={handleShareClick}
              onDeleteClick={handleDeleteClick}
              isVideoConverting={isVideoConverting} // ⭐ NEW: Pass video converting state
              currentPersona={currentPersona}
              currentDressState={currentDressState} // ⭐ NEW: Dress state for badge
            />
          </View>
        )}

        {/* ⭐ SIMPLIFIED: Create Button (replaces PersonaTypeSelector) */}
        {!isPostcardVisible && (
          <View style={styles.typeSelectorOverlay}>
            <View style={styles.createButtonContainer}>
              <TouchableOpacity
                style={[styles.createPersonaButton, {  }]}
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
        )}

      </View>
      
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Persona Creation Sheet (Absolute positioning with max z-index) */}
      {/* ⚡ PERFORMANCE FIX: Conditional mounting to prevent memory/CPU waste */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {isPersonaCreationOpen && (
        <View style={styles.sheetContainer}>
          <ChoicePersonaSheet
            isOpen={isPersonaCreationOpen}
            onClose={handlePersonaCreationClose}
            onCreateStart={handlePersonaCreationStartWithPermission}
          />
        </View>
      )}

      {/* ⚡ PERFORMANCE FIX: Conditional mounting - CRITICAL! */}
      {/* This was causing 5-8MB memory + 5% CPU waste when closed */}
      {isDressManagementOpen && (
        <View style={styles.sheetContainer}>
          <DressManageSheer
            isOpen={isDressManagementOpen}
            onClose={handlePersonaDressClose}
            onCreateStart={handlePersonaDressStartWithPermission}
            onDressUpdated={handleDressUpdated} // ⭐ 드레스 변경 시 로컬 상태 갱신
            onDressStateUpdate={handleDressStateUpdate} // ⭐ NEW: 드레스 상태 업데이트 (badge용)
            personaKey={currentPersona?.persona_key}
            currentPersona={currentPersona} // ⭐ 현재 페르소나 전체 정보
          />
        </View>
      )}
      
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Help Sheet */}
      {/* ⚡ PERFORMANCE FIX: Conditional mounting */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {isHelpOpen && (
        <View style={styles.sheetContainer}>
          <MainHelpSheet
            ref={helpSheetRef}
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
            onCreateStart={handlePersonaCreationStartWithPermission}
          />
        </View>
      )}

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
    {/* ⚡ PERFORMANCE FIX: Conditional mounting */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    {isPersonaSettingsOpen && (
      <PersonaSettingsSheet
        isOpen={isPersonaSettingsOpen}
        persona={settingsPersona}
        onClose={handleSettingsClose}
        onNameChange={handlePersonaNameChange}
        onCategoryChange={handlePersonaCategoryChange}
        onVideoConvert={handlePersonaVideoConvert}
        onDelete={handlePersonaDelete}
      />
    )}
    
    {/* ⚡ PERFORMANCE FIX: Conditional mounting */}
    {isPersonaManagerOpen && (
      <PersonaManagerSheet
        isOpen={isPersonaManagerOpen}
        persona={settingsPersona}
        onClose={() => setIsPersonaManagerOpen(false)}
      />
    )}

    {/* ⚡ PERFORMANCE FIX: Conditional mounting */}
    {isShareOpen && (
      <PersonaShareSheet
        isOpen={isShareOpen}
        persona={settingsPersona}
        onHandleShare={handlePersonaShare}
        onClose={() => setIsShareOpen(false)}
      />
    )}
    
    
    {/* ═════════════════════════════════════════════════════════════════ */}
    {/* MessageInputOverlay for Name Change (Always rendered, ref-based) */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    <MessageInputOverlay
      ref={nameInputRef}
      title={t('persona.settings.change_name')}
      placeholder={t('persona.creation.name_placeholder')}
      initialValue={settingsPersona?.persona_name || ''}
      maxLength={15}
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
    {/* ⚡ PERFORMANCE FIX: Conditional mounting */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    {showPermissionSheet && (
      <NotificationPermissionSheet
        visible={showPermissionSheet}
        context={permissionContext}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />
    )}
    
    {/* ═════════════════════════════════════════════════════════════════ */}
    {/* ⭐ NEW: Slide Menu (Curved menu from left) */}
    {/* ⚡ PERFORMANCE: Conditional mounting to save memory when closed */}
    {/* ═════════════════════════════════════════════════════════════════ */}
    {isSlideMenuOpen && (
      <SlideMenu
        visible={isSlideMenuOpen}
        onShowTier={handleShowTier}
        onClose={() => {
          HapticService.light();
          setIsSlideMenuOpen(false);
        }}
      />
    )}

    {showTierUpgrade && (
      <TierUpgradeSheet
        isOpen={showTierUpgrade}
        onClose={() => setShowTierUpgrade(false)}
        currentTier={user.user_level || 'basic'}
        userKey={user.user_key}
        onUpgradeSuccess={(newTier) => {
          console.log('✅ [ManagerAIOverlay] Tier upgraded to:', newTier);
          // ⭐ Reload service config to update chat limits
          // (This will be handled by useChatLimit hook on next render)

        }}
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
  },

  templateItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  //  bottom: Platform.OS === 'ios' ? verticalScale(120) : verticalScale(100),
    top: verticalScale(20),
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
  // ⭐ NEW: Gradient Title Row (ANIMA + Soul Connection)
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center', // ✅ 수직 중앙 정렬
    gap: scale(6), // ✅ 간격 줄임
    marginLeft: scale(0), // ✅ 좌측으로 20px 이동
  },
  // ⭐ NEW: Soul Connection Subtitle
  soulConnection: {
    fontSize: scale(16),
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginTop: scale(2), // ✅ 위로 약간 올림 (정확한 정렬)
    letterSpacing: 0.3,
    marginLeft: scale(-20), // ✅ 좌측으로 20px 이동
  },
  helpButton: {
    marginLeft: platformPadding(12),
    padding: platformPadding(8),
  },
  // ⭐ NEW: Hamburger Menu Button
  menuButton: {
    marginLeft: platformPadding(0),
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
    bottom: verticalScale(150),
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
    paddingVertical: verticalScale(16),
    borderRadius: scale(26),
    gap: scale(6),

    backgroundColor: 'rgba(0, 0, 0, 0.65)', // Dark background for visibility
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },

  createPersonaButtonText: {
    color: '#FFFFFF',
    display: 'none',
  },

});

export default PersonaStudioScreen;

