/**
 * PersonaScreen - 자아 갤러리 (채팅 없음 - 정보 카드만)
 * 
 * Features:
 * - Vertical swipe navigation
 * - Full-screen 자아 videos
 * - 자아 information cards
 * - "이 자아로 대화하기" button → Navigate to SAGE tab
 * - Right-side pagination indicator
 * - Quick Action Chips (항상 표시)
 * 
 * @author JK & Hero AI
 * @date 2024-11-22
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeScreen from '../components/SafeScreen';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { usePersona } from '../contexts/PersonaContext';
import { useQuickAction } from '../contexts/QuickActionContext';
import PersonaSwipeViewer from '../components/persona/PersonaSwipeViewer';
import QuickActionChips from '../components/quickaction/QuickActionChipsAnimated';

const PersonaScreen = () => {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { personas } = usePersona();
  
  const handleSettingsPress = () => {
    console.log('Settings pressed');
  };
  
  // ✅ Filter out SAGE (Manager AI)
  const personasOnly = useMemo(() => {
    return personas.filter(p => !p.isManager);
  }, [personas]);
  
  // ✅ Handle "이 자아로 대화하기" button
  const handleChatWithPersona = (persona) => {
    if (__DEV__) {
      console.log('[PersonaScreen] 💬 Chat with 자아:', persona.persona_name);
    }
    
    // Navigate to SAGE tab (Home) with selected persona
    navigation.navigate('Home', {
      selectedPersona: persona,
    });
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
        {/* ✅ 자아 Swipe Viewer (Info cards only - NO CHAT) */}
        <PersonaSwipeViewer 
          personas={personasOnly} 
          isModeActive={true}
          modeOpacity={null}
          onChatWithPersona={handleChatWithPersona}
        />
        
        {/* ✅ Quick Action Chips (항상 표시 - 정보 영역 위) */}
        <QuickActionChips
          onSettingsClick={() => console.log('Settings clicked')}
          onStudioClick={() => console.log('Studio clicked')}
          onDiaryClick={() => console.log('Diary clicked')}
          onGiftClick={() => console.log('Gift clicked')}
        />
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PersonaScreen;

