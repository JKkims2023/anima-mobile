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

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SafeScreen from '../components/SafeScreen';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { usePersona } from '../contexts/PersonaContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import PersonaSwipeViewer from '../components/persona/PersonaSwipeViewer';
import MessageCreatorView from '../components/message/MessageCreatorView';
import QuickActionChipsAnimated from '../components/quickaction/QuickActionChipsAnimated';
import PersonaSelectorHorizontal from '../components/message/PersonaSelectorHorizontal';
import ChoicePersonaSheet from '../components/persona/ChoicePersonaSheet';
import AnimaLoadingOverlay from '../components/persona/AnimaLoadingOverlay';
import AnimaSuccessCard from '../components/persona/AnimaSuccessCard';
import { scale, verticalScale } from '../utils/responsive-utils';
import HapticService from '../utils/HapticService';
import { createPersona, checkPersonaStatus, getPersonaList } from '../services/api/personaApi';

const PersonaStudioScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { personas } = usePersona();
  const { user } = useUser();
  const { showToast } = useAnima();
  
  // ═══════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0);
  const [currentPersona, setCurrentPersona] = useState(null);
  const [isMessageAreaVisible, setIsMessageAreaVisible] = useState(true);
  const [isPersonaCreationOpen, setIsPersonaCreationOpen] = useState(false);
  const [isLoadingPersona, setIsLoadingPersona] = useState(false);
  const [isSuccessCardVisible, setIsSuccessCardVisible] = useState(false);
  const [createdPersona, setCreatedPersona] = useState(null);
  const savedIndexRef = useRef(0);
  const personaCreationDataRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN FOCUS HANDLER
  // ═══════════════════════════════════════════════════════════════════════
  useFocusEffect(
    useCallback(() => {
      // Screen is focused
      setIsScreenFocused(true);
      
      if (__DEV__) {
        console.log('🎯 [PersonaStudioScreen] Screen FOCUSED');
      }
      
      return () => {
        // Screen is blurred (navigated away)
        setIsScreenFocused(false);
        
        if (__DEV__) {
          console.log('🎯 [PersonaStudioScreen] Screen BLURRED');
        }
      };
    }, [])
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
  
  // Handle persona selection from PersonaSelectorHorizontal
  const handlePersonaSelect = useCallback((index) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] ✨ Persona selected at index:', index);
    }
    
    // ⭐ FIX: Get persona from personasWithDefaults using index
    const persona = personasWithDefaults[index];
    
    if (!persona) {
      console.error('[PersonaStudioScreen] ❌ Invalid index:', index);
      return;
    }
    
    if (__DEV__) {
      console.log('[PersonaStudioScreen] ✨ Persona:', persona.persona_name);
    }
    
    // ⭐ FIX: Update savedIndexRef to trigger PersonaSwipeViewer scroll
    savedIndexRef.current = index;
    setCurrentPersonaIndex(index);
    setCurrentPersona(persona);
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
  
  // Handle message preview
  const handleMessagePreview = useCallback((messageData) => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] ✨ Message preview requested:', messageData);
    }
    
    // Already handled inside MessageCreatorView
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
  
  // 4. Message Toggle (메시지 생성 영역 토글)
  const handleQuickMessage = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] 💌 Message toggle clicked');
    }
    
    setIsMessageAreaVisible(prev => !prev);
    HapticService.light();
  }, []);
  
  // 5. Settings (설정)
  const handleQuickSettings = useCallback(() => {
    if (__DEV__) {
      console.log('[PersonaStudioScreen] ⚙️ Settings clicked');
    }
    
    navigation.navigate('Settings');
  }, [navigation]);
  
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
      {/* Header */}
      <AppHeader onSettingsPress={handleSettingsPress} />
      
      <View style={styles.container}>
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* BASE LAYER (Z-INDEX: 1) - PersonaSwipeViewer                      */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={styles.baseLayer}>
          <PersonaSwipeViewer 
            key={`persona-swipe-${isScreenFocused}`}
            personas={personasWithDefaults}
            isModeActive={true}
            isScreenFocused={isScreenFocused}
            initialIndex={currentPersonaIndex}
            onIndexChange={handlePersonaChange}
            modeOpacity={null}
            onChatWithPersona={null} // Not used in studio mode
          />
        </View>
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* LAYER 2 (Z-INDEX: 10) - MessageCreatorView (Bottom Overlay)      */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {isMessageAreaVisible && (
          <View style={styles.messageOverlay}>
            <MessageCreatorView
              personas={personasWithDefaults}
              selectedPersona={currentPersona}
              onAddPersona={handleAddPersona}
              onPreview={handleMessagePreview}
              isCreating={false}
              isScreenFocused={isScreenFocused}
              showPersonaSelector={false}
            />
          </View>
        )}
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* LAYER 3 (Z-INDEX: 20) - QuickActionChips (Right Overlay)         */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={styles.quickChipsOverlay}>
          <QuickActionChipsAnimated
            onDressClick={handleQuickDress}
            onHistoryClick={handleQuickHistory}
            onVideoClick={handleQuickVideo}
            onMessageClick={handleQuickMessage}
            onSettingsClick={handleQuickSettings}
          />
        </View>
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* LAYER 4 (Z-INDEX: 30) - PersonaSelectorHorizontal (Top Overlay)  */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={styles.selectorOverlay}>
          <PersonaSelectorHorizontal
            personas={personasWithDefaults}
            selectedIndex={currentPersonaIndex}
            onSelectPersona={handlePersonaSelect}
            onAddPersona={handleAddPersona}
            isCreating={false}
            hasWaitingPersona={false}
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
    bottom: verticalScale(20), // Below AppHeader
    right: scale(16),
    zIndex: 100,
    elevation: 100, // ⭐ Android shadow
    // ⭐ SafeArea is handled inside QuickActionChipsAnimated
  },
  
  // ⭐ Z-INDEX: 50 - Persona Selector (Top)
  selectorOverlay: {
    position: 'absolute',
    top: verticalScale(10), // Just below AppHeader
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 50, // ⭐ Android shadow
    // ⭐ SafeArea top is handled inside PersonaSelectorHorizontal
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
});

export default PersonaStudioScreen;

