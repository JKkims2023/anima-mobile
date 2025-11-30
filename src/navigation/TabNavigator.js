import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

// Import screens
import MainScreen from '../screens/MainScreen';
import HomeScreen from '../screens/HomeScreen';
import PersonaScreen from '../screens/PersonaScreen';
import MusicScreen from '../screens/MusicScreen';
import PeekScreen from '../screens/PeekScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import Custom TabBar
import CustomTabBar from '../components/navigation/CustomTabBar';

const Tab = createBottomTabNavigator();

/**
 * TabNavigator - Bottom Tab Navigation with CenterAIButton
 * 5 Tabs: SAGE (Home), Persona, AI (Center), Quick Action Toggle, Settings
 * 
 * Features:
 * - Custom TabBar with elevated center AI button
 * - Separate SAGE and Persona tabs for intuitive UX
 * - Safe Area aware
 * - Dark theme support
 * 
 * @author JK & Hero AI
 * @date 2024-11-22
 */
const TabNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // ✅ Keep screens mounted when switching tabs (prevents video pause)
        unmountOnBlur: false,
      }}
      // ✅ Prevent detaching inactive screens (for video playback control)
      detachInactiveScreens={false}
    >

      {/* Tab 1: SAGE (Manager AI) */}
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'SAGE',
        }}
      />
      
      {/* Tab 2: Persona */}
      <Tab.Screen 
        name="Persona" 
        component={PersonaScreen}
        options={{ 
          title: t('navigation.persona') || '자아',
        }}
      />
      
      {/* Tab 3: AI (Center) - Placeholder */}
      <Tab.Screen 
        name="AI" 
        component={HomeScreen} // Temporary placeholder
        options={{ 
          title: '',
          tabBarButton: () => null, // Hide default button (handled by CenterAIButton)
        }}
      />
      
      {/* Tab 4: Music (AI Music) */}
      <Tab.Screen 
        name="Music" 
        component={MusicScreen}
        options={{ 
          title: t('navigation.music') || '뮤직',
        }}
      />
      
      {/* Tab 5: Settings */}
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: t('navigation.settings') || '설정',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;

