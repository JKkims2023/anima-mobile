import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import RoomScreen from '../screens/RoomScreen';
import TrainingScreen from '../screens/TrainingScreen';
import PeekScreen from '../screens/PeekScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import Custom TabBar
import CustomTabBar from '../components/navigation/CustomTabBar';

const Tab = createBottomTabNavigator();

/**
 * TabNavigator - Bottom Tab Navigation with CenterAIButton
 * 5 Tabs: Home, Explore (Room), AI (Center), Training (Peek), Settings
 * 
 * Features:
 * - Custom TabBar with elevated center AI button
 * - Safe Area aware
 * - Dark theme support
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */
const TabNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Tab 1: Home */}
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: t('navigation.home') || '홈',
        }}
      />
      
      {/* Tab 2: Explore (Room) */}
      <Tab.Screen 
        name="Explore" 
        component={RoomScreen}
        options={{ 
          title: t('navigation.room') || '탐색',
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
      
      {/* Tab 4: Room (Training/Peek) */}
      <Tab.Screen 
        name="Room" 
        component={PeekScreen}
        options={{ 
          title: t('navigation.peek') || '방',
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

