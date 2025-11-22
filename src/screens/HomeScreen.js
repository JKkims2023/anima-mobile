import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import SafeScreen from '../components/SafeScreen';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { useQuickAction } from '../contexts/QuickActionContext';
import { ChatProvider, useChat } from '../contexts/ChatContext';
import ManagerAIView from '../components/persona/ManagerAIView';
import QuickActionChipsSage from '../components/quickaction/QuickActionChipsSageAnimated';
import StatusIndicator from '../components/status/StatusIndicator';
import RecommendationBadge from '../components/status/RecommendationBadge';

/**
 * HomeScreen Content (needs to be inside ChatProvider)
 */
const HomeScreenContent = () => {
  const { currentTheme } = useTheme();
  const { isQuickMode, getBadgeData } = useQuickAction();
  const { sageAiState } = useChat(); // ✅ Get SAGE AI state
  
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
        {/* ✅ SAGE (Manager AI) */}
        <ManagerAIView 
          persona={{ isManager: true, persona_name: 'SAGE' }}
          isActive={true}
          modeOpacity={null}
          chatOpacity={chatOpacity}
        />
        
        {/* ✅ Status Indicator (Top-Left) - Dynamic state */}
        <StatusIndicator 
          name="Manager AI - SAGE"
          state={sageAiState}
        />
        
        {/* ✅ Recommendation Badge (Top-Right) */}
        <RecommendationBadge 
          title="✨ SAGE 추천"
          subtitle="완벽한 페르소나와의 만남, SAGE가 추천합니다"
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
const HomeScreen = () => {
  return (
    <ChatProvider>
      <HomeScreenContent />
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

