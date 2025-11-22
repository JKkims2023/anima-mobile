import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import SafeScreen from '../components/SafeScreen';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { useQuickAction } from '../contexts/QuickActionContext';
import { usePersona } from '../contexts/PersonaContext';
import { ChatProvider, useChat } from '../contexts/ChatContext';
import ManagerAIView from '../components/persona/ManagerAIView';
import QuickActionChipsSage from '../components/quickaction/QuickActionChipsSageAnimated';
import StatusIndicator from '../components/status/StatusIndicator';
import PersonaSelectorButton from '../components/persona/PersonaSelectorButton';
import PersonaSelectorPanel from '../components/persona/PersonaSelectorPanel';

/**
 * HomeScreen Content (needs to be inside ChatProvider)
 */
const HomeScreenContent = ({ route }) => {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { isQuickMode, getBadgeData } = useQuickAction();
  const { personas } = usePersona();
  const { sageAiState } = useChat(); // ✅ Get SAGE AI state
  
  // ✅ Persona selection state
  const [selectedPersona, setSelectedPersona] = useState(null); // null = SAGE mode
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true); // ✅ Track screen focus
  
  // ✅ Handle screen focus/blur (for video playback control)
  useFocusEffect(
    useCallback(() => {
      // Screen is focused
      setIsScreenFocused(true);
      
      if (__DEV__) {
        console.log('🎯 [HomeScreen] Screen FOCUSED');
      }
      
      return () => {
        // Screen is blurred (navigated away)
        setIsScreenFocused(false);
        
        if (__DEV__) {
          console.log('🎯 [HomeScreen] Screen BLURRED');
        }
      };
    }, [])
  );
  
  // ✅ Handle navigation params (from Persona tab)
  useEffect(() => {
    if (route?.params?.selectedPersona) {
      const persona = route.params.selectedPersona;
      setSelectedPersona(persona);
      
      if (__DEV__) {
        console.log('[HomeScreen] 🎯 Persona selected from navigation:', persona.persona_name);
      }
      
      // Clear params after handling
      navigation.setParams({ selectedPersona: undefined });
    }
  }, [route?.params?.selectedPersona, navigation]);
  
  // ✅ Animation values for Quick Mode transition (Chat UI fade)
  const chatOpacity = useRef(new Animated.Value(isQuickMode ? 1 : 0)).current;
  
  // ✅ Animate Quick Mode transition (Chat UI fade in/out)
  useEffect(() => {
    const duration = 250; // 250ms smooth transition
    
    Animated.timing(chatOpacity, {
      toValue: isQuickMode ? 1 : 0, // Fade in when Chat Mode (isQuickMode=true)
      duration,
      useNativeDriver: true,
    }).start();
  }, [isQuickMode, chatOpacity]);
  
  const handleSettingsPress = () => {
    console.log('Settings pressed');
  };
  
  // ✅ Handle floating button press
  const handleFloatingButtonPress = () => {
    if (selectedPersona) {
      // Persona mode → Return to SAGE
      setSelectedPersona(null);
      if (__DEV__) {
        console.log('[HomeScreen] 🏠 Returning to SAGE');
      }
    } else {
      // SAGE mode → Toggle persona selector panel
      setIsPanelVisible(prev => !prev);
      if (__DEV__) {
        console.log('[HomeScreen] 👥 Toggling persona selector:', !isPanelVisible);
      }
    }
  };
  
  // ✅ Handle persona selection
  const handleSelectPersona = (persona) => {
    setSelectedPersona(persona);
    setIsPanelVisible(false);
    if (__DEV__) {
      console.log('[HomeScreen] ✨ Persona selected:', {
        name: persona.persona_name,
        videoUrl: persona.selected_dress_video_url?.substring(0, 50) + '...',
        isManager: persona.isManager,
      });
    }
  };
  
  // ✅ Handle panel close
  const handleClosePanel = () => {
    setIsPanelVisible(false);
  };
  
  // ✅ Handle view all (navigate to Persona tab)
  const handleViewAll = () => {
    setIsPanelVisible(false);
    navigation.navigate('Persona');
  };
  
  // ✅ Filter personas (exclude SAGE)
  const availablePersonas = personas.filter(p => !p.isManager);
  
  // ✅ Default SAGE persona with video URL
  const DEFAULT_SAGE_PERSONA = {
    isManager: true,
    persona_name: 'SAGE',
    persona_key: 'SAGE',
    selected_dress_video_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/46fb3532-e41a-4b96-8105-a39e64f39407_00001_.mp4',
    selected_dress_video_convert_done: 'Y', // ✅ Mark as video ready
  };
  
  return (
    <SafeScreen 
      backgroundColor={currentTheme.backgroundColor}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: true, bottom: false }}
      keyboardAware={false}
    >
      {/* Header */}
      <AppHeader onSettingsPress={handleSettingsPress} />
      
      <View style={styles.container}>
        {/* ✅ SAGE or Persona View */}
        <ManagerAIView 
          persona={selectedPersona || DEFAULT_SAGE_PERSONA}
          isActive={true}
          isScreenFocused={isScreenFocused}
          modeOpacity={null}
          chatOpacity={chatOpacity}
        />
        
        {/* ✅ Status Indicator (Top-Left) - Dynamic state */}
        <StatusIndicator 
          name={
            selectedPersona 
              ? `${selectedPersona.persona_name} (Persona)` 
              : 'Manager AI - SAGE'
          }
          state={sageAiState}
        />
        
        {/* ✅ Persona Selector Button (Top-Right) */}
        <PersonaSelectorButton
          isPersonaMode={!!selectedPersona}
          onPress={handleFloatingButtonPress}
        />
        
        {/* ✅ Persona Selector Panel */}
        <PersonaSelectorPanel
          visible={isPanelVisible}
          personas={availablePersonas}
          onSelectPersona={handleSelectPersona}
          onClose={handleClosePanel}
          onViewAll={handleViewAll}
        />
        
        {/* ✅ Quick Action Chips (Only when Quick Action Mode is active - isQuickMode=false) */}
        {!isQuickMode && (
          <QuickActionChipsSage
            onSettingsClick={() => console.log('Settings clicked')}
            onNotificationClick={() => console.log('Notification clicked')}
          />
        )}
      </View>
    </SafeScreen>
  );
};

/**
 * HomeScreen - SAGE (Manager AI) Screen
 * Wrapped with ChatProvider
 */
const HomeScreen = ({ route }) => {
  return (
    <ChatProvider>
      <HomeScreenContent route={route} />
    </ChatProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
});

export default HomeScreen;

