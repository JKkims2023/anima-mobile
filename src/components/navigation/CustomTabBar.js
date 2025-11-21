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
import { TAB_BAR } from '../../constants/layout';
import { scale, verticalScale } from '../../utils/responsive-utils';
import CustomText from '../CustomText';
import CenterAIButton from './CenterAIButton';

/**
 * CustomTabBar Component
 * @param {Object} props - React Navigation TabBar props
 */
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // ✅ Tab configuration
  const tabs = [
    { key: 'Home', icon: 'home', label: '홈' },
    { key: 'Explore', icon: 'compass', label: '탐색' },
    { key: 'AI', icon: null, label: '' }, // Center AI button
    { key: 'Room', icon: 'chatbubbles', label: '방' },
    { key: 'Settings', icon: 'settings', label: '설정' },
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
          state="sage" // Default to SAGE (Manager AI)
          onPress={() => {
            // TODO: Open PersonaBottomSheet
            console.log('💙 [CenterAIButton] Pressed');
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
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[index].key,
              canPreventDefault: true,
            });
            
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(state.routes[index].name);
            }
          };
          
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
                color={isFocused ? (currentTheme.primary || '#4285F4') : (currentTheme.textSecondary || '#888')}
              />
              <CustomText
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? (currentTheme.primary || '#4285F4') : (currentTheme.textSecondary || '#888'),
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

