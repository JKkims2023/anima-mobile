/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 QuickActionChips Component (Persona Mode)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Quick action chips for Persona mode
 * - 설정 (Settings)
 * - 스튜디오 (Studio) - with count badge
 * - 다이어리 (Diary) - with NEW badge
 * - 선물함 (Gift) - with NEW badge
 * 
 * Features:
 * - Sequential spring animation
 * - Tooltip with auto-hide
 * - Glassmorphism style (dark background for visibility)
 * - Haptic feedback
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuickAction } from '../../contexts/QuickActionContext';
import QuickActionBadge from './QuickActionBadge';
import HapticService from '../../utils/HapticService';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const QuickActionChips = ({
  onSettingsClick,
  onStudioClick,
  onDiaryClick,
  onGiftClick,
  badgeData = {}, // { studioCount, diaryHasNew, giftHasNew }
}) => {
  const insets = useSafeAreaInsets();
  const { showTooltips } = useQuickAction();
  const [visibleTooltips, setVisibleTooltips] = useState({});
  
  // ✅ Actions configuration
  const actions = [
    {
      id: 'settings',
      icon: 'cog',
      label: '설정',
      onClick: onSettingsClick,
      badge: null,
    },
    {
      id: 'studio',
      icon: 'palette',
      label: '스튜디오',
      onClick: onStudioClick,
      badge: badgeData.studioCount > 0 ? { type: 'COUNT', count: badgeData.studioCount } : null,
    },
    {
      id: 'diary',
      icon: 'book-open-variant',
      label: '다이어리',
      onClick: onDiaryClick,
      badge: badgeData.diaryHasNew ? { type: 'NEW' } : null,
    },
    {
      id: 'gift',
      icon: 'gift',
      label: '선물함',
      onClick: onGiftClick,
      badge: badgeData.giftHasNew ? { type: 'NEW' } : null,
    },
  ];
  
  // ✅ Animation values (fixed count: 4 chips)
  const opacity0 = useSharedValue(0);
  const translateX0 = useSharedValue(20);
  const scale0 = useSharedValue(0.8);
  const bounce0 = useSharedValue(0);
  
  const opacity1 = useSharedValue(0);
  const translateX1 = useSharedValue(20);
  const scale1 = useSharedValue(0.8);
  const bounce1 = useSharedValue(0);
  
  const opacity2 = useSharedValue(0);
  const translateX2 = useSharedValue(20);
  const scale2 = useSharedValue(0.8);
  const bounce2 = useSharedValue(0);
  
  const opacity3 = useSharedValue(0);
  const translateX3 = useSharedValue(20);
  const scale3 = useSharedValue(0.8);
  const bounce3 = useSharedValue(0);
  
  const chipAnimations = [
    { opacity: opacity0, translateX: translateX0, scale: scale0, bounce: bounce0 },
    { opacity: opacity1, translateX: translateX1, scale: scale1, bounce: bounce1 },
    { opacity: opacity2, translateX: translateX2, scale: scale2, bounce: bounce2 },
    { opacity: opacity3, translateX: translateX3, scale: scale3, bounce: bounce3 },
  ];
  
  // ✅ Animated styles (must be at top level)
  const animatedStyle0 = useAnimatedStyle(() => ({
    opacity: opacity0.value,
    transform: [
      { translateX: translateX0.value },
      { scale: scale0.value },
      { translateY: bounce0.value },
    ],
  }));
  
  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: opacity1.value,
    transform: [
      { translateX: translateX1.value },
      { scale: scale1.value },
      { translateY: bounce1.value },
    ],
  }));
  
  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
    transform: [
      { translateX: translateX2.value },
      { scale: scale2.value },
      { translateY: bounce2.value },
    ],
  }));
  
  const animatedStyle3 = useAnimatedStyle(() => ({
    opacity: opacity3.value,
    transform: [
      { translateX: translateX3.value },
      { scale: scale3.value },
      { translateY: bounce3.value },
    ],
  }));
  
  const animatedStyles = [animatedStyle0, animatedStyle1, animatedStyle2, animatedStyle3];
  
  // ✅ Entry animation (sequential spring)
  useEffect(() => {
    if (__DEV__) {
      console.log('[QuickActionChips] 🎬 Starting entry animation');
    }
    
    chipAnimations.forEach((anim, index) => {
      // Reset to initial values first
      anim.opacity.value = 0;
      anim.translateX.value = 20;
      anim.scale.value = 0.8;
      anim.bounce.value = 0;
      
      // Opacity
      anim.opacity.value = withDelay(
        index * 120, // 120ms delay between each chip
        withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) })
      );
      
      // TranslateX
      anim.translateX.value = withDelay(
        index * 120,
        withSpring(0, {
          damping: 15,
          stiffness: 100,
        })
      );
      
      // Scale
      anim.scale.value = withDelay(
        index * 120,
        withSpring(1, {
          damping: 12,
          stiffness: 150,
        })
      );
      
      // Bounce (infinite)
      anim.bounce.value = withDelay(
        1000 + index * 200, // Start after entry animation
        withRepeat(
          withSequence(
            withTiming(-8, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
          ),
          -1, // Infinite
          false
        )
      );
    });
    
    // Cleanup on unmount
    return () => {
      if (__DEV__) {
        console.log('[QuickActionChips] 🧹 Cleaning up animations');
      }
      chipAnimations.forEach((anim) => {
        anim.opacity.value = 0;
        anim.translateX.value = 20;
        anim.scale.value = 0.8;
        anim.bounce.value = 0;
      });
    };
  }, []);
  
  // ✅ Show tooltip on mount (if enabled)
  useEffect(() => {
    if (showTooltips) {
      const timers = actions.map((action, index) => {
        return setTimeout(() => {
          setVisibleTooltips(prev => ({ ...prev, [action.id]: true }));
          
          // Auto-hide after 3 seconds
          setTimeout(() => {
            setVisibleTooltips(prev => ({ ...prev, [action.id]: false }));
          }, 3000);
        }, 1000 + index * 120); // Show after chip appears
      });
      
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [showTooltips, actions]);
  
  // ✅ Handle chip press
  const handlePress = (action) => {
    HapticService.medium();
    action.onClick();
  };
  
  return (
    <View style={[styles.container, { top: insets.top + verticalScale(20) }]}>
      {actions.map((action, index) => {
        const animatedStyle = animatedStyles[index];
        
        return (
          <View key={action.id} style={styles.chipWrapper}>
            <AnimatedTouchable
              style={[styles.chip, animatedStyle]}
              onPress={() => handlePress(action)}
              activeOpacity={0.7}
            >
              <Icon name={action.icon} size={scale(24)} color="#FFFFFF" style={styles.icon} />
              
              {/* Badge */}
              {action.badge && (
                <QuickActionBadge type={action.badge.type} count={action.badge.count} />
              )}
            </AnimatedTouchable>
            
            {/* Tooltip */}
            {visibleTooltips[action.id] && (
              <Animated.View
                style={styles.tooltip}
                entering={withTiming({ opacity: 1 }, { duration: 300 })}
                exiting={withTiming({ opacity: 0 }, { duration: 300 })}
              >
                <Text style={styles.tooltipText}>{action.label}</Text>
              </Animated.View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: scale(20),
    flexDirection: 'column',
    gap: scale(12),
    zIndex: 100,
    ...Platform.select({
      android: { elevation: 100 },
    }),
  },
  chipWrapper: {
    position: 'relative',
  },
  chip: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Dark background for visibility
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tooltip: {
    position: 'absolute',
    left: scale(-140), // Position to the left of chip
    top: '50%',
    transform: [{ translateY: -scale(20) }],
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: scale(12),
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: scale(13),
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
});

export default QuickActionChips;

