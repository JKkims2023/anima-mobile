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
import { useAnima } from '../../contexts/AnimaContext'; // ⭐ For new message badge
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
  const { setSelectedIndex, selectedPersona, selectedPersonaRef, selectedIndex, mode, switchMode } = usePersona(); // 🔥 NEW: Add selectedPersonaRef
  const { isQuickMode, toggleQuickMode } = useQuickAction();
  const { hasNewMessage, isMessageCreationActive, showAlert, hasMemoryBadge, hasMusicBadge, hasHomeBadge } = useAnima(); // ⭐ Get badge state and message creation state from Context


  const { t } = useTranslation();
  const actionSheetRef = useRef(null);
  const [isManagerOverlayVisible, setIsManagerOverlayVisible] = useState(false);
  const insets = useSafeAreaInsets();
  
  // 🔥 PERFORMANCE DEBUG: Render counter with timestamp
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  if (__DEV__) {
    const timestamp = Date.now();
    console.log(`🔥 [CustomTabBar] Render #${renderCountRef.current} @ ${timestamp}`);
  }
  
  // ⭐ Check if we should hide the tab bar (for MessageDetail & MessageCreation screens)
  // Method 1: Check props.style
  const shouldHideFromProps = props.style?.display === 'none';
  
  // Method 2: Check current route in History stack
  const historyRoute = state.routes.find(route => route.name === 'History');
  const currentHistoryRouteName = historyRoute 
    ? getFocusedRouteNameFromRoute(historyRoute) 
    : null;
  const shouldHideFromHistory = currentHistoryRouteName === 'MessageDetail';
  
  // Method 3: Check current route in Home (PersonaStack) stack
  const homeRoute = state.routes.find(route => route.name === 'Home');
  const currentHomeRouteName = homeRoute 
    ? getFocusedRouteNameFromRoute(homeRoute) 
    : null;
  const shouldHideFromHome = currentHomeRouteName === 'MessageCreation';
  
  // Hide if any method indicates we should
  const shouldHideTabBar = shouldHideFromProps || shouldHideFromHistory || shouldHideFromHome;
  
  // ⭐ Debug log
  if (__DEV__) {
   // console.log('🔍 [CustomTabBar] shouldHideTabBar:', shouldHideTabBar);
   // console.log('🔍 [CustomTabBar] currentHomeRouteName:', currentHomeRouteName);
   // console.log('🔍 [CustomTabBar] currentHistoryRouteName:', currentHistoryRouteName);
  }
  
  // ⭐ Return null if tab bar should be hidden
  if (shouldHideTabBar) {
   // console.log('✅ [CustomTabBar] Hiding tab bar!');
    return null;
  }
  
  // ✅ Get current context based on active tab
  const getCurrentContext = () => {
    const currentRouteName = state.routes[state.index]?.name || 'Home';
    const contextMap = {
      'Home': 'home',
   //   'History': 'history',
      'Memory': 'memory',
      'Music': 'music',
      'Settings': 'settings',
      'Persona': 'home', // Fallback to home context
      'AI': 'home', // Fallback to home context
    };
    return contextMap[currentRouteName] || 'home';
  };
  
  // ✅ Handle Center AI Button Press
  const handleCenterButtonPress = () => {
    
    // ✅ Haptic feedback
    HapticService.cameraFullPress();
    
    // 🔥 CRITICAL FIX: Use ref for IMMEDIATE access to latest persona
    // This bypasses React's render cycle delay and ensures we ALWAYS have the most current data
    const latestPersona = selectedPersonaRef.current || selectedPersona;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [CustomTabBar] Center AI Button pressed');
    console.log('   selectedPersona (state):', selectedPersona?.persona_name, '/', selectedPersona?.done_yn);
    console.log('   selectedPersonaRef (ref):', latestPersona?.persona_name, '/', latestPersona?.done_yn);
    console.log('   Using:', latestPersona?.persona_name);
    console.log('   persona_key:', latestPersona?.persona_key);
    console.log('   done_yn:', latestPersona?.done_yn);
    console.log('   identity_key:', latestPersona?.identity_key);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ✅ Open Manager AI Overlay (Universal Chat)
    if(latestPersona?.done_yn === 'N') {
      showAlert({
        emoji: '⌛',
        title: t('persona.creation.still_processing_title') || '페르소나 생성 중',
        message: t('persona.creation.still_processing_message') || '페르소나 생성 중입니다. 잠시 후 다시 시도해주세요.',
        buttons: [
          { text: t('common.confirm'), style: 'primary', onPress: () => {} },
        ],
      });
    } else {
      setIsManagerOverlayVisible(true);
    }
  };
  
  // ✅ Handle Overlay Close
  const handleOverlayClose = () => {
    setIsManagerOverlayVisible(false);
  }; 
  // ✅ Tab configuration (Simplified - SAGE and Persona as separate tabs)
  const tabs = [
    { 
      key: 'SAGE',
      icon: 'person',
      label: t('navigation.home') || '홈',
      route: 'Home', // Navigate to Home (SAGE)
    },
    /*
    { 
      key: 'History',
      icon: 'time-outline',
      label: t('navigation.history') || '히스토리',
      route: 'History', // Navigate to History screen
    },
    */
    { 
      key: 'Memory',
      icon: 'gift-sharp',
      label: t('navigation.memory') || '메모리',
      route: 'Memory', // Navigate to Memory screen
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
            // ⭐ CRITICAL FIX: Block navigation if message creation is active
            if (isMessageCreationActive && !isFocused) {
              /*
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('🚨 [CustomTabBar] TAB PRESS BLOCKED!');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('  - isMessageCreationActive:', isMessageCreationActive);
              console.log('  - Target tab:', tab.label);
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              */
              HapticService.warning();
              
              // Show confirmation dialog
              showAlert({
                title: t('message.alert.exit_message_creation'),
                emoji: '⚠️',
                message: t('message.alert.exit_message_creation_description'),
                buttons: [
                  {
                    text: t('message.alert.continue_writing'),
                    style: 'cancel',
                    onPress: () => {
              //        console.log('[CustomTabBar] ✅ User chose to continue writing');
                      HapticService.light();
                    }
                  },
                  {
                    text: t('message.alert.exit'),
                    style: 'destructive',
                    onPress: () => {
              //        console.log('[CustomTabBar] ✅ User confirmed exit, navigating to:', tab.label);
                      HapticService.medium();
                      
                      // Navigate to target tab
                      navigation.navigate(state.routes[index].name);
                    }
                  }
                ]
              });
              
              return; // ⭐ Stop here!
            }
            
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
              <View style={styles.iconContainer}>
                <Icon
                  name={tab.icon}
                  size={TAB_BAR.REGULAR_ICON_SIZE}
                  color={isActive ? (currentTheme.primary || '#4285F4') : (currentTheme.textSecondary || '#888')}
                />
                {/* 💙 NEW: Home Badge for Home tab (persona_heart_update) */}
                {tab.key === 'Home' && hasHomeBadge && (
                  <View style={styles.newMessageBadge}>
                    <CustomText style={styles.newMessageBadgeText}>N</CustomText>
                  </View>
                )}
                {/* ⭐ New Message Badge for History tab */}
                {tab.key === 'History' && hasNewMessage && (
                  <View style={styles.newMessageBadge}>
                    <CustomText style={styles.newMessageBadgeText}>N</CustomText>
                  </View>
                )}
                {/* ⭐ NEW: Memory Badge for Memory tab (gift_image, gift_music) */}
                {tab.key === 'Memory' && hasMemoryBadge && (
                  <View style={styles.newMessageBadge}>
                    <CustomText style={styles.newMessageBadgeText}>N</CustomText>
                  </View>
                )}
                {/* ⭐ NEW: Music Badge for Music tab (create_music) */}
                {tab.key === 'Music' && hasMusicBadge && (
                  <View style={styles.newMessageBadge}>
                    <CustomText style={styles.newMessageBadgeText}>N</CustomText>
                  </View>
                )}
              </View>
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
      {/* 🔥 PERFORMANCE FIX: Only mount when visible (prevents unnecessary renders!) */}
      {isManagerOverlayVisible && (
        <ManagerAIOverlay
          visible={isManagerOverlayVisible}
          onClose={handleOverlayClose}
          context={getCurrentContext()}
          persona={selectedPersonaRef.current} // 🔥 FIXED: Use ref for latest data
        />
      )}
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
  
  iconContainer: {
    position: 'relative',
  },
  
  tabLabel: {
    fontSize: scale(10),
    marginTop: verticalScale(4),
    fontWeight: '500',
  },
  
  // ⭐ New Message Badge
  newMessageBadge: {
    position: 'absolute',
    top: scale(-4),
    right: scale(-8),
    backgroundColor: '#FF4444',
    borderRadius: scale(8),
    minWidth: scale(16),
    height: scale(20),
    paddingHorizontal: scale(4),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  
  newMessageBadgeText: {
    fontSize: scale(10),

    marginBottom: verticalScale(4),
    color: '#FFFFFF',
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

