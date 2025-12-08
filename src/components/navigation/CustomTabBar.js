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

import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { usePersona } from '../../contexts/PersonaContext';
import { useQuickAction } from '../../contexts/QuickActionContext';
import { TAB_BAR } from '../../constants/layout';
import { scale, verticalScale } from '../../utils/responsive-utils';
import CustomText from '../CustomText';
import CenterAIButton from './CenterAIButton';
import CenterAIActionSheet from '../CenterAIActionSheet';
import ManagerAIOverlay from '../chat/ManagerAIOverlay'; // ⭐ Manager AI Overlay
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';

/**
 * CustomTabBar Component
 * @param {Object} props - React Navigation TabBar props
 */
const CustomTabBar = ({ state, descriptors, navigation, ...props }) => {
  // ⭐ ALL HOOKS MUST BE AT THE TOP (React Rules of Hooks)
  const { currentTheme } = useTheme();
  const { setSelectedIndex, selectedPersona, selectedIndex, mode, switchMode } = usePersona();
  const { isQuickMode, toggleQuickMode } = useQuickAction();
  const { t } = useTranslation();
  const actionSheetRef = useRef(null);
  const [isManagerOverlayVisible, setIsManagerOverlayVisible] = useState(false);
  const insets = useSafeAreaInsets();
  
  // ⭐ Check if we should hide the tab bar (for MessageDetail screen)
  // Method 1: Check props.style
  const shouldHideFromProps = props.style?.display === 'none';
  
  // Method 2: Check current route in History stack
  const historyRoute = state.routes.find(route => route.name === 'History');
  const currentHistoryRouteName = historyRoute 
    ? getFocusedRouteNameFromRoute(historyRoute) 
    : null;
  const shouldHideFromRoute = currentHistoryRouteName === 'MessageDetail';
  
  // Hide if either method indicates we should
  const shouldHideTabBar = shouldHideFromProps || shouldHideFromRoute;
  
  // ⭐ Return null if tab bar should be hidden
  if (shouldHideTabBar) {
    return null;
  }
  
  // ✅ Get current context based on active tab
  const getCurrentContext = () => {
    const currentRouteName = state.routes[state.index]?.name || 'Home';
    const contextMap = {
      'Home': 'home',
      'Music': 'music',
      'History': 'history',
      'Settings': 'settings',
      'Persona': 'home', // Fallback to home context
      'AI': 'home', // Fallback to home context
    };
    return contextMap[currentRouteName] || 'home';
  };
  
  // ✅ Handle Center AI Button Press
  const handleCenterButtonPress = () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💙 [CenterAIButton] Pressed');
    console.log('📋 [CenterAIButton] Current Tab:', state.routes[state.index]?.name);
    console.log('📋 [CenterAIButton] Context:', getCurrentContext());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ✅ Haptic feedback
    HapticService.cameraFullPress();
    
    // ✅ Open Manager AI Overlay (Universal Chat)
    setIsManagerOverlayVisible(true);
  };
  
  // ✅ Handle Overlay Close
  const handleOverlayClose = () => {
    setIsManagerOverlayVisible(false);
  }; 
  // ✅ Tab configuration (Simplified - SAGE and Persona as separate tabs)
  const tabs = [
    { 
      key: 'SAGE',
      icon: 'mail-outline',
      label: t('navigation.home') || '홈',
      route: 'Home', // Navigate to Home (SAGE)
    },
    { 
      key: 'History',
      icon: 'time-outline',
      label: t('navigation.history') || '히스토리',
      route: 'History', // Navigate to History screen
    },
    { key: 'AI', icon: null, label: '' }, // Center AI button
    { 
      key: 'Music',
      icon: 'musical-notes',
      label: t('navigation.music') || '스튜디오',
      route: 'Music', // Navigate to Music screen
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
          onPress={handleCenterButtonPress}
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
      
      {/* ✅ CenterAIActionSheet - DISABLED (Using ManagerAIOverlay instead) */}
      {/* <CenterAIActionSheet
        ref={actionSheetRef}
        onClose={() => actionSheetRef.current?.dismiss()}
      /> */}
      
      {/* ✅ ManagerAIOverlay - Universal AI Chat */}
      <ManagerAIOverlay
        visible={isManagerOverlayVisible}
        onClose={handleOverlayClose}
        context={getCurrentContext()}
      />
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
    // ✅ zIndex, elevation 제거 (BottomSheet가 위로 올라가도록)
  },
  
  centerPlaceholder: {
    flex: 1, // Reserve space for center button
  },
});

export default CustomTabBar;

