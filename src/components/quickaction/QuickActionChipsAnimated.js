/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 QuickActionChipsAnimated Component (Persona Mode)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Quick action chips with SAFE animations
 * - Simple fade-in animation only (no complex transforms)
 * - Sequential appearance
 * - Glassmorphism style
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HapticService from '../../utils/HapticService';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const QuickActionChipsAnimated = ({
  onDressClick,      // ⭐ 1. Dressing Room
  onHistoryClick,    // ⭐ 2. Memory History
  onVideoClick,      // ⭐ 3. Video Conversion
  onMessageClick,    // ⭐ 4. Message Toggle
  onSettingsClick,   // ⭐ 5. Settings
}) => {
  const insets = useSafeAreaInsets();
  
  const actions = [
    { id: 'dress', icon: 'hanger', label: '드레스', onClick: onDressClick },
    { id: 'history', icon: 'history', label: '추억', onClick: onHistoryClick },
    { id: 'video', icon: 'video-vintage', label: '영상', onClick: onVideoClick },
    { id: 'message', icon: 'message-text', label: '메시지', onClick: onMessageClick },
    { id: 'settings', icon: 'cog', label: '설정', onClick: onSettingsClick },
  ];
  
  // ✅ Animation values (individual for each chip)
  const opacity0 = useSharedValue(0);
  const opacity1 = useSharedValue(0);
  const opacity2 = useSharedValue(0);
  const opacity3 = useSharedValue(0);
  const opacity4 = useSharedValue(0);
  
  // ✅ Animated styles (must be at top level)
  const animatedStyle0 = useAnimatedStyle(() => ({
    opacity: opacity0.value,
  }));
  
  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: opacity1.value,
  }));
  
  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
  }));
  
  const animatedStyle3 = useAnimatedStyle(() => ({
    opacity: opacity3.value,
  }));
  
  const animatedStyle4 = useAnimatedStyle(() => ({
    opacity: opacity4.value,
  }));
  
  const animatedStyles = [animatedStyle0, animatedStyle1, animatedStyle2, animatedStyle3, animatedStyle4];
  const opacityValues = [opacity0, opacity1, opacity2, opacity3, opacity4];
  
  // ✅ Entry animation (fade in)
  useEffect(() => {
    if (__DEV__) {
      console.log('[QuickActionChipsAnimated] 🎬 Starting fade-in animation');
    }
    
    opacityValues.forEach((opacity, index) => {
      // Reset to 0
      opacity.value = 0;
      
      // Fade in with delay
      opacity.value = withDelay(
        index * 100, // 100ms delay between each chip
        withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.ease),
        })
      );
    });
    
    // ✅ Exit animation on unmount (fade out in reverse order)
    return () => {
      if (__DEV__) {
        console.log('[QuickActionChipsAnimated] 🌅 Starting fade-out animation');
      }
      
      opacityValues.forEach((opacity, index) => {
        // Fade out in reverse order (last chip fades out first)
        const reverseIndex = opacityValues.length - 1 - index;
        opacity.value = withDelay(
          reverseIndex * 80, // 80ms delay (faster than entry)
          withTiming(0, {
            duration: 200,
            easing: Easing.in(Easing.ease),
          })
        );
      });
    };
  }, []);
  
  const handlePress = (action) => {
    HapticService.medium();
    action.onClick();
  };
  
  return (
    <View style={styles.container}>
      {actions.map((action, index) => {
        const animatedStyle = animatedStyles[index];
        
        return (
          <View key={action.id} style={styles.chipWrapper}>
            <AnimatedTouchable
              style={[styles.chip, animatedStyle]}
              onPress={() => handlePress(action)}
              activeOpacity={0.7}
            >
              <Icon name={action.icon} size={scale(24)} color="#FFFFFF" />
              <Text style={styles.label}>{action.label}</Text>
            </AnimatedTouchable>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // ⭐ FIX: Remove position absolute (handled by parent)
    gap: verticalScale(12),
    alignItems: 'flex-end',

  },
  chipWrapper: {
    alignItems: 'flex-end',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(24),
    gap: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    // ✅ Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '600',
  },
});

export default QuickActionChipsAnimated;

