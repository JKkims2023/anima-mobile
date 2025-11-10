import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Feather';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import RoomScreen from '../screens/RoomScreen';
import TrainingScreen from '../screens/TrainingScreen';
import PeekScreen from '../screens/PeekScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import theme
import { useTheme } from '../contexts/ThemeContext';
import CustomText from '../components/CustomText';

const Tab = createBottomTabNavigator();

/**
 * TabNavigator - Bottom Tab Navigation
 * 5 Tabs: Home, Room, Training, Peek, Settings
 */
const TabNavigator = () => {
  const { t, i18n } = useTranslation();
  const { currentTheme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Header settings
        headerShown: false,
        
        // Tab bar style
        tabBarStyle: {
          backgroundColor: currentTheme.backgroundColor,
          borderTopWidth: 1,
          borderTopColor: currentTheme.borderColor,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 8,
        },
        
        // Tab bar label style
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: i18n.language === 'ko' 
            ? 'NotoSansKR-Regular' 
            : 'InterDisplay-Regular',
        },
        
        // Active tab color
        tabBarActiveTintColor: currentTheme.mainColor,
        
        // Inactive tab color
        tabBarInactiveTintColor: currentTheme.menuIconColor,
        
        // Tab bar icon
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Room':
              iconName = 'heart';
              break;
            case 'Training':
              iconName = 'book';
              break;
            case 'Peek':
              iconName = 'eye';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'circle';
          }
          
          return (
            <Icon 
              name={iconName} 
              size={22} 
              color={color}
              style={{
                strokeWidth: focused ? 2.5 : 2,
              }}
            />
          );
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: t('navigation.home'), // "홈"
        }}
      />
      <Tab.Screen 
        name="Room" 
        component={RoomScreen}
        options={{ 
          title: t('navigation.room'), // "룸"
        }}
      />
      <Tab.Screen 
        name="Training" 
        component={TrainingScreen}
        options={{ 
          title: t('navigation.training'), // "다이어리"
        }}
      />
      <Tab.Screen 
        name="Peek" 
        component={PeekScreen}
        options={{ 
          title: t('navigation.peek'), // "엿보기"
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: t('navigation.settings'), // "설정"
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;

