import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // ⭐ Still needed for HistoryStack
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'; // ⭐ Still needed for HistoryStack
import { useTranslation } from 'react-i18next';

// Import screens
import MainScreen from '../screens/MainScreen';
import HomeScreen from '../screens/HomeScreen';
import PersonaScreen from '../screens/PersonaScreen';
import PersonaStudioScreen from '../screens/PersonaStudioScreen'; // ⭐ Unified Persona Studio (with MessageCreationOverlay)
import MusicScreen from '../screens/MusicScreen';
import MemoryScreen from '../screens/MemoryScreen';
import HistoryScreen from '../screens/HistoryScreen'; // ⭐ NEW: Message History
import MessageDetailScreen from '../screens/MessageDetailScreen'; // ⭐ NEW: Message Detail
import PeekScreen from '../screens/PeekScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WebViewScreen from '../screens/WebViewScreen'; // ⭐ NEW: WebView for Terms, Privacy, About
import PointsScreen from '../screens/PointsScreen'; // ⭐ NEW: Points Purchase & History

// Import Custom TabBar
import CustomTabBar from '../components/navigation/CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * ⭐ PersonaStack REMOVED
 * MessageCreationScreen is now a full-screen overlay inside PersonaStudioScreen
 * No longer needs Stack Navigation
 */

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
 * ⭐ NEW: SettingsStack - Stack Navigator for Settings Tab
 * Allows navigation from SettingsScreen -> WebViewScreen, PointsScreen
 */
const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="SettingsList" 
        component={SettingsScreen}
      />
      <Stack.Screen 
        name="WebView" 
        component={WebViewScreen}
      />
      <Stack.Screen 
        name="Points" 
        component={PointsScreen}
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

      {/* Tab 1: Studio (Unified Persona & Message Creation Hub) - ⭐ Direct component */}
      <Tab.Screen 
        name="Home" 
        component={PersonaStudioScreen}
        options={{
          title: 'Studio',
          // ⭐ No dynamic tabBarStyle needed (MessageCreationOverlay covers it with z-index)
        }}
      />
      {/* Tab 2: Memory */}
      <Tab.Screen 
        name="Memory" 
        component={MemoryScreen}
        options={{
          title: t('navigation.memory') || '추억',
        }}
      />
      
      {/*
 
      <Tab.Screen 
        name="Music" 
        component={MusicScreen}
        options={{ 
          title: t('navigation.music') || '뮤직',
        }}
      />
       Tab 4: History (with Stack) */}
       
      {/* Tab 3: AI (Center) - Placeholder */}
      <Tab.Screen 
        name="AI" 
        component={HomeScreen} // Temporary placeholder
        options={{ 
          title: '',
          tabBarButton: () => null, // Hide default button (handled by CenterAIButton)
        }}
      />

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
     
      
      {/* Tab 5: Settings (with Stack) */}
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack}
        options={({ route }) => {
          // Get the currently active route name in the stack
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'SettingsList';
          
          return {
            title: t('navigation.settings') || '설정',
            // Hide tab bar when in WebView or Points screen
            tabBarStyle: (routeName === 'WebView' || routeName === 'Points')
              ? { display: 'none' } 
              : undefined,
          };
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;

