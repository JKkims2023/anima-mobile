import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

// Import screens
import MainScreen from '../screens/MainScreen';
import HomeScreen from '../screens/HomeScreen';
import PersonaScreen from '../screens/PersonaScreen';
import PersonaStudioScreen from '../screens/PersonaStudioScreen'; // ⭐ NEW: Unified Persona Studio
import MusicScreen from '../screens/MusicScreen';
import HistoryScreen from '../screens/HistoryScreen'; // ⭐ NEW: Message History
import MessageDetailScreen from '../screens/MessageDetailScreen'; // ⭐ NEW: Message Detail
import PeekScreen from '../screens/PeekScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import Custom TabBar
import CustomTabBar from '../components/navigation/CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * HistoryStack - Stack Navigator for History Tab
 * Allows navigation from HistoryScreen -> MessageDetailScreen
 */
const HistoryStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="HistoryList" 
        component={HistoryScreen}
      />
      <Stack.Screen 
        name="MessageDetail" 
        component={MessageDetailScreen}
      />
    </Stack.Navigator>
  );
};

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

      {/* Tab 1: Studio (Unified Persona & Message Creation Hub) */}
      <Tab.Screen 
        name="Home" 
        component={PersonaStudioScreen}
        options={{ 
          title: 'Studio',
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
       
      {/* Tab 3: AI (Center) - Placeholder */}
      <Tab.Screen 
        name="AI" 
        component={HomeScreen} // Temporary placeholder
        options={{ 
          title: '',
          tabBarButton: () => null, // Hide default button (handled by CenterAIButton)
        }}
      />
      
      {/* Tab 4: History (with Stack) */}
      <Tab.Screen 
        name="History" 
        component={HistoryStack}
        options={({ route }) => {
          // Get the currently active route name in the stack
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'HistoryList';
          
          return {
            title: t('navigation.history') || '히스토리',
            // Hide tab bar when in MessageDetail screen
            tabBarStyle: routeName === 'MessageDetail' 
              ? { display: 'none' } 
              : undefined,
          };
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

