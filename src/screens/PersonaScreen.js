/**
 * PersonaScreen - Persona list with vertical swipe (TikTok/YouTube Shorts style)
 * 
 * Features:
 * - Vertical swipe navigation
 * - Full-screen persona videos
 * - Chat UI with Quick Action mode
 * - Right-side pagination indicator
 * 
 * @author JK & Hero AI
 * @date 2024-11-22
 */

import React, { useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import SafeScreen from '../components/SafeScreen';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { usePersona } from '../contexts/PersonaContext';
import { useQuickAction } from '../contexts/QuickActionContext';
import { ChatProvider, useChat } from '../contexts/ChatContext';
import PersonaSwipeViewer from '../components/persona/PersonaSwipeViewer';
import QuickActionChips from '../components/quickaction/QuickActionChipsAnimated';
import StatusIndicator from '../components/status/StatusIndicator';

/**
 * PersonaScreen Content (needs to be inside ChatProvider)
 */
const PersonaScreenContent = () => {
  const { currentTheme } = useTheme();
  const { personas } = usePersona();
  const { isQuickMode, getBadgeData } = useQuickAction();
  const { activePersonaName, activePersonaAiState } = useChat(); // ✅ Get active persona state
  
  const handleSettingsPress = () => {
    console.log('Settings pressed');
  };
  
  // ✅ Filter out SAGE (Manager AI)
  const personasOnly = useMemo(() => {
    return personas.filter(p => !p.isManager);
  }, [personas]);
  
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
        {/* ✅ Persona Swipe Viewer (Vertical) */}
        <PersonaSwipeViewer 
          personas={personasOnly} 
          isModeActive={true}
          modeOpacity={null}
          chatOpacity={null}
        />
        
        {/* ✅ Status Indicator (Top-Left) - Dynamic name and state */}
        {activePersonaName && (
          <StatusIndicator 
            name={activePersonaName}
            state={activePersonaAiState}
          />
        )}
        
        {/* ✅ Quick Action Chips (Only when Quick Action Mode is active - isQuickMode=false) */}
        {!isQuickMode && (
          <QuickActionChips
            onSettingsClick={() => console.log('Settings clicked')}
            onStudioClick={() => console.log('Studio clicked')}
            onDiaryClick={() => console.log('Diary clicked')}
            onGiftClick={() => console.log('Gift clicked')}
          />
        )}
      </View>
    </SafeScreen>
  );
};

/**
 * PersonaScreen - Wrapped with ChatProvider
 */
const PersonaScreen = () => {
  return (
    <ChatProvider>
      <PersonaScreenContent />
    </ChatProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PersonaScreen;

