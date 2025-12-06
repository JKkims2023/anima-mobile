/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 MessageModeQuickActionChips Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Quick action chips for Message Mode (when user is creating a message)
 * - Sequential fade-in animation
 * - Same design as QuickActionChipsAnimated
 * - 4 actions: Back, History, Music, Preview
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-30
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
import HapticService from '../../utils/HapticService';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * MessageModeQuickActionChips Component
 * @param {Function} onBackClick - Navigate back to explore mode
 * @param {Function} onHistoryClick - Show message history
 * @param {Function} onMusicClick - Navigate to music screen
 * @param {Function} onPreviewClick - Preview message
 */
const MessageModeQuickActionChips = ({
  onBackClick,
  onHistoryClick,
  onMusicClick,
  onPreviewClick,
}) => {
  const actions = [
    { id: 'back', icon: 'arrow-left', label: '돌아가기', onClick: onBackClick },
  //  { id: 'history', icon: 'history', label: '히스토리', onClick: onHistoryClick },
  //  { id: 'music', icon: 'music', label: '뮤직', onClick: onMusicClick },
//    { id: 'preview', icon: 'eye', label: '미리보기', onClick: onPreviewClick },
  ];
  
  // ✅ Animation values (individual for each chip)
  const opacity0 = useSharedValue(0);
  const opacity1 = useSharedValue(0);
  const opacity2 = useSharedValue(0);
  const opacity3 = useSharedValue(0);
  
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
  
  const animatedStyles = [animatedStyle0, animatedStyle1, animatedStyle2, animatedStyle3];
  const opacityValues = [opacity0, opacity1, opacity2, opacity3];
  
  // ✅ Entry animation (fade in)
  useEffect(() => {
    if (__DEV__) {
      console.log('[MessageModeQuickActionChips] 🎬 Starting fade-in animation');
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
        console.log('[MessageModeQuickActionChips] 🌅 Starting fade-out animation');
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
    action.onClick?.();
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
    gap: verticalScale(12),
    alignItems: 'center',
  
  },
  chipWrapper: {
    alignItems: 'center',
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
  label: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontWeight: '400',
    display: 'none',
  },
});

export default MessageModeQuickActionChips;

