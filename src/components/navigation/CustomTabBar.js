/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📱 CustomTabBar Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Custom TabBar with CenterAIButton
 * 
 * Layout:
 * [Home] [Explore] [CenterAI (elevated)] [Room] [Settings]
 * 
 * Features:
 * - 5 tabs with center AI button
 * - Safe Area support
 * - Dark theme integration
 * - Smooth animations
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { usePersona } from '../../contexts/PersonaContext';
import { useQuickAction } from '../../contexts/QuickActionContext';
import { TAB_BAR } from '../../constants/layout';
import { scale, verticalScale } from '../../utils/responsive-utils';
import CustomText from '../CustomText';
import CenterAIButton from './CenterAIButton';
import HapticService from '../../utils/HapticService';

/**
 * CustomTabBar Component
 * @param {Object} props - React Navigation TabBar props
 */
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { currentTheme } = useTheme();
  const { setSelectedIndex, selectedPersona, selectedIndex, mode, switchMode } = usePersona();
  const { isQuickMode, toggleQuickMode } = useQuickAction();
  const insets = useSafeAreaInsets();
  
  // ✅ Tab configuration (Simplified - SAGE and Persona as separate tabs)
  const tabs = [
    { 
      key: 'SAGE',
      icon: 'flash',
      label: 'SAGE',
      route: 'Home', // Navigate to Home (SAGE)
    },
    { 
      key: 'Persona',
      icon: 'people',
      label: '페르소나',
      route: 'Persona', // Navigate to Persona screen
    },
    { key: 'AI', icon: null, label: '' }, // Center AI button
    { 
      key: 'QuickAction',
      icon: isQuickMode ? 'apps' : 'chatbubbles', // Toggle icon (반전: true=선택, false=채팅)
      label: isQuickMode ? '선택' : '채팅',
      isActive: !isQuickMode, // Active when in chat mode (반전)
      onPress: toggleQuickMode, // Toggle quick action mode
    },
    { 
      key: 'Settings',
      icon: 'settings',
      label: '설정',
      route: 'Settings',
    },
  ];
  
  // ✅ Calculate tab bar height with Safe Area
  const tabBarHeight = TAB_BAR.BASE_HEIGHT + insets.bottom;
  
  return (
    <View
      style={[
        styles.container,
        {
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          backgroundColor: currentTheme.background || '#121212',
          borderTopColor: currentTheme.border || '#2C2C2C',
        },
      ]}
    >
      {/* Center AI Button (elevated, positioned absolutely) */}
      <View style={styles.centerButtonContainer}>
        <CenterAIButton
          state={selectedPersona?.isManager ? 'sage' : 'persona'}
          personaVideoUrl={
            selectedPersona?.selected_dress_video_url && 
            selectedPersona?.selected_dress_video_convert_yn === 'Y' 
              ? selectedPersona.selected_dress_video_url 
              : null
          }
          personaImageUrl={selectedPersona?.selected_dress_image_url || selectedPersona?.original_url}
          personaName={selectedPersona?.persona_name}
          onPress={() => {
            // 🎯 Always navigate to Manager SAGE (Index 0)
            // Regardless of current persona
            setSelectedIndex(0);
            
            if (__DEV__) {
              console.log('💙 [CenterAIButton] Pressed → Manager SAGE (Index 0)');
            }
            
            // TODO: Future - Open Manager Functions Bottom Sheet
            // openManagerFunctionsSheet();
          }}
        />
      </View>
      
      {/* Regular Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[state.routes[index].key];
          
          // Center AI button is handled separately
          if (tab.key === 'AI') {
            return <View key={tab.key} style={styles.centerPlaceholder} />;
          }
          
          // ✅ Custom onPress for tabs
          const onPress = () => {
            // 🎯 Haptic feedback for tab navigation
            HapticService.medium();
            
            // Fourth tab: Quick Action toggle (Chat ↔ Quick)
            if (index === 3 && tab.onPress) {
              tab.onPress();
              return;
            }
            
            // Normal tabs: Navigate to route
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[index].key,
              canPreventDefault: true,
            });
            
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(state.routes[index].name);
            }
          };
          
          // ✅ Fourth tab (Quick Action) uses tab.isActive, others use isFocused
          const isActive = index === 3 ? tab.isActive : isFocused;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.icon}
                size={TAB_BAR.REGULAR_ICON_SIZE}
                color={isActive ? (currentTheme.primary || '#4285F4') : (currentTheme.textSecondary || '#888')}
              />
              <CustomText
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? (currentTheme.primary || '#4285F4') : (currentTheme.textSecondary || '#888'),
                  },
                ]}
              >
                {tab.label}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    position: 'relative',
  },
  
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(8),
  },
  
  tabLabel: {
    fontSize: scale(10),
    marginTop: verticalScale(4),
    fontWeight: '500',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Center AI Button
  // ═══════════════════════════════════════════════════════════════════════════
  centerButtonContainer: {
    position: 'absolute',
    top: -TAB_BAR.CENTER_BUTTON_ELEVATION, // Elevate above tab bar
    left: '50%',
    marginLeft: -(TAB_BAR.CENTER_BUTTON_SIZE / 2), // Center horizontally
    zIndex: 10,
  },
  
  centerPlaceholder: {
    flex: 1, // Reserve space for center button
  },
});

export default CustomTabBar;

