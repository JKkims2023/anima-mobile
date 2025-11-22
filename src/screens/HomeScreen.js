import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import SafeScreen from '../components/SafeScreen';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { usePersona } from '../contexts/PersonaContext';
import { useQuickAction } from '../contexts/QuickActionContext';
import { ChatProvider } from '../contexts/ChatContext';
import ManagerAIView from '../components/persona/ManagerAIView';
import PersonaSwipeViewer from '../components/persona/PersonaSwipeViewer';
// import QuickActionChips from '../components/quickaction/QuickActionChips';
// import QuickActionChipsSage from '../components/quickaction/QuickActionChipsSage';
import QuickActionChips from '../components/quickaction/QuickActionChipsSimple';
import QuickActionChipsSage from '../components/quickaction/QuickActionChipsSageSimple';
import { moderateScale, verticalScale } from '../utils/responsive-utils';

/**
 * HomeScreen - Main entry point with Manager AI
 * 
 * Architecture:
 * - SAGE Mode: ManagerAIChatView (fullscreen)
 * - Persona Mode: PersonaSwipeViewer (personas only, no SAGE)
 * 
 * ✅ Complete separation for perfect UX and performance
 * ✅ Smooth transition animation between modes
 */
const HomeScreen = () => {
  const { currentTheme } = useTheme();
  const { mode, personas } = usePersona();
  const { isQuickMode, getBadgeData } = useQuickAction();
  
  // ✅ Animation values for smooth mode transition
  const sageOpacity = useRef(new Animated.Value(mode === 'sage' ? 1 : 0)).current;
  const sageScale = useRef(new Animated.Value(mode === 'sage' ? 1 : 0.95)).current;
  const personaOpacity = useRef(new Animated.Value(mode === 'persona' ? 1 : 0)).current;
  const personaScale = useRef(new Animated.Value(mode === 'persona' ? 1 : 0.95)).current;
  
  // ✅ Animate mode transition
  useEffect(() => {
    const duration = 300; // 300ms smooth transition
    
    if (mode === 'sage') {
      // Fade in SAGE, fade out Persona
      Animated.parallel([
        Animated.timing(sageOpacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(sageScale, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(personaOpacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(personaScale, {
          toValue: 0.95,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade in Persona, fade out SAGE
      Animated.parallel([
        Animated.timing(personaOpacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(personaScale, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(sageOpacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(sageScale, {
          toValue: 0.95,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [mode]); // ✅ Only depend on mode (animation values are refs, don't need to be in deps)
  
  const handleSettingsPress = () => {
    // TODO: Open settings modal/sheet
    console.log('Settings pressed');
  };
  
  // ✅ Filter out SAGE for persona mode (Memoized to prevent recalculation)
  const personasOnly = useMemo(() => {
    return personas.filter(p => !p.isManager);
  }, [personas]);
  
  return (
    <ChatProvider>
      <SafeScreen 
        backgroundColor={currentTheme.backgroundColor}
        statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
        edges={{ top: true, bottom: false }}
        keyboardAware={false}
      >
        {/* Header */}
        <AppHeader onSettingsPress={handleSettingsPress} />
        
        <View style={styles.container}>
          {/* ✅ SAGE Mode with smooth transition */}
          <Animated.View
            style={[
              styles.contentArea,
              {
                opacity: sageOpacity,
                transform: [{ scale: sageScale }],
                position: mode === 'sage' ? 'relative' : 'absolute',
                width: '100%',
                height: '100%',
              },
            ]}
            pointerEvents={mode === 'sage' ? 'auto' : 'none'}
          >
            <ManagerAIView 
              persona={{ isManager: true, persona_name: 'SAGE' }}
              isActive={mode === 'sage'}
              modeOpacity={sageOpacity}
            />
          </Animated.View>
          
          {/* ✅ Persona Mode with smooth transition */}
          <Animated.View
            style={[
              styles.contentArea,
              {
                opacity: personaOpacity,
                transform: [{ scale: personaScale }],
                position: mode === 'persona' ? 'relative' : 'absolute',
                width: '100%',
                height: '100%',
              },
            ]}
            pointerEvents={mode === 'persona' ? 'auto' : 'none'}
          >
            <PersonaSwipeViewer 
              personas={personasOnly} 
              isModeActive={mode === 'persona'}
              modeOpacity={personaOpacity}
            />
          </Animated.View>
          
          {/* ✅ Quick Action Chips (Only when Quick Action Mode is active - isQuickMode=false) */}
          {!isQuickMode && mode === 'persona' && (
            <QuickActionChips
              onSettingsClick={() => console.log('Settings clicked')}
              onStudioClick={() => console.log('Studio clicked')}
              onDiaryClick={() => console.log('Diary clicked')}
              onGiftClick={() => console.log('Gift clicked')}
            />
          )}
          
          {!isQuickMode && mode === 'sage' && (
            <QuickActionChipsSage
              onSettingsClick={() => console.log('Settings clicked')}
              onNotificationClick={() => console.log('Notification clicked')}
            />
          )}
        </View>
      </SafeScreen>
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

