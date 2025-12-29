/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 QuickActionChipsAnimated Component (Persona Mode)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Quick action chips with SAFE animations
 * - Simple fade-in animation only (no complex transforms)
 * - Sequential appearance
 * - Glassmorphism style
 * - Video converting indicator (hourglass + rotation)
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../styles/commonstyles';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedIcon = Animated.createAnimatedComponent(Icon);

const QuickActionChipsAnimated = ({
  onDressClick,      // ⭐ 1. Dressing Room
  onHistoryClick,    // ⭐ 2. Memory History
  onVideoClick,      // ⭐ 3. Video Conversion
  onMessageClick,    // ⭐ 4. Message Toggle (Opens MessageCreationOverlay)
  onSettingsClick,   // ⭐ 5. Settings
  onMusicClick,      // ⭐ 6. Music
  onShareClick,      // ⭐ 7. Share
  isVideoConverting = false, // ⭐ NEW: Video converting state
  currentPersona = null,
}) => {
  console.log('currentPersona: ', currentPersona);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  const actions = [
    { id: 'video', icon: 'video-vintage', label: '영상', onClick: onVideoClick },
//    { id: 'settings', icon: 'cog', label: '설정', onClick: onSettingsClick },
//    { id: 'share', icon: 'share', label: t('common.share'), onClick: onShareClick },
    { id: 'history', icon: 'history', label: '추억', onClick: onHistoryClick },
//    {id: 'music', icon: 'music', label: '뮤직', onClick: onMusicClick},
//    { id: 'message', icon: 'message-text', label: '메시지', onClick: onMessageClick },
  ];
  
  // ⭐ Rotation animation for hourglass (continuous)
  const hourglassRotation = useSharedValue(0);
  
  // ⭐ Tooltip animation
  const tooltipOpacity = useSharedValue(0);
  const tooltipTranslateX = useSharedValue(-10);
  
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
  
  // ⭐ Hourglass rotation animation (continuous when converting)
  const hourglassAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${hourglassRotation.value}deg` }],
  }));
  
  // ⭐ Tooltip animation style
  const tooltipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ translateX: tooltipTranslateX.value }],
  }));
  
  // ⭐ Start/stop hourglass rotation based on isVideoConverting
  useEffect(() => {
    if (isVideoConverting) {
      console.log('[QuickActionChipsAnimated] 🔄 Starting hourglass rotation');
      // Infinite rotation: 0 → 360 → 0 → 360...
      hourglassRotation.value = withRepeat(
        withTiming(360, {
          duration: 2000, // 2초에 한 바퀴
          easing: Easing.linear,
        }),
        -1, // Infinite
        false // No reverse
      );
    } else {
      // Stop rotation and reset to 0
      hourglassRotation.value = withTiming(0, { duration: 300 });
    }
  }, [isVideoConverting]);
  
  // ⭐ Auto-hide tooltip after 3 seconds
  useEffect(() => {
    if (showTooltip) {
      // Show tooltip
      tooltipOpacity.value = withTiming(1, { duration: 200 });
      tooltipTranslateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        tooltipOpacity.value = withTiming(0, { duration: 200 });
        tooltipTranslateX.value = withTiming(-10, { duration: 200 });
        setTimeout(() => setShowTooltip(false), 200);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);
  
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
  
  // ⭐ Handle message button click (with video converting check)
  const handleMessageClick = () => {
    if (isVideoConverting) {
      // Show tooltip instead of opening overlay
      console.log('[QuickActionChipsAnimated] ⏳ Video converting, showing tooltip');
      HapticService.warning();
      setShowTooltip(true);
      return;
    }
    
    // Normal flow: open message creation overlay
    console.log('[QuickActionChipsAnimated] ✅ Opening message creation overlay');
    HapticService.medium();
    if (onMessageClick) {
      onMessageClick();
    } else {
      console.warn('[QuickActionChipsAnimated] onMessageClick missing');
    }
  };
  
  return (
    <>
    <View style={styles.container}>
      {actions.map((action, index) => {
        const animatedStyle = animatedStyles[index];
        
        return (
          <View key={action.id} style={[styles.chipWrapper, { display: action.id === 'video' ? currentPersona?.selected_dress_video_url === null ? 'flex' : 'none' : 'flex' }]}>
            <TouchableOpacity
              style={[styles.chip, animatedStyle]}
              onPress={() => handlePress(action)}
              activeOpacity={0.7}
            >
              <Icon name={action.icon} size={scale(24)} color="#FFFFFF" />
              <Text style={styles.label}>{action.label}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
    
    {/* ⭐ Message Creation Button with Video Converting Indicator */}
    <View style={styles.messageButtonContainer}>
      {/* ⭐ Tooltip (Left side) */}
      {showTooltip && (
        <Animated.View style={[styles.tooltip, tooltipAnimatedStyle]}>
          <CustomText style={styles.tooltipText}>
            {t('persona.video_converting_tooltip')}
          </CustomText>
          <View style={styles.tooltipArrow} />
        </Animated.View>
      )}
      
      {/* Message Button */}
      <TouchableOpacity
        onPress={handleMessageClick}
        activeOpacity={0.7}
      >
        <View 
          style={[
            styles.chip, 
            {
              backgroundColor: isVideoConverting 
                ? 'rgba(255, 165, 0, 0.3)' // ⭐ Orange tint when converting
                : COLORS.DEEP_BLUE_LIGHT,  
              borderWidth: 3,
              borderColor: isVideoConverting
                ? 'rgba(255, 165, 0, 0.5)' // ⭐ Orange border when converting
                : 'rgba(255, 255, 255, 0.3)',
              width: scale(70), 
              height: scale(70), 
              borderRadius: scale(50), 
              marginTop: verticalScale(20), 
              marginBottom: verticalScale(20), 
              alignItems: 'center', 
              justifyContent: 'center'
            }
          ]}
        >
          {/* ⭐ Conditional Icon: Hourglass (rotating) or Pencil */}
          {isVideoConverting ? (
            <AnimatedIcon 
              name="timer-sand" 
              size={scale(32)} 
              color="#FFA500" 
              style={hourglassAnimatedStyle}
            />
          ) : (
            <Icon name="pencil-outline" size={scale(32)} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    // ⭐ FIX: Remove position absolute (handled by parent)
    gap: verticalScale(12),
    alignItems: 'center',
    marginTop: verticalScale(20),


  },
  chipWrapper: {
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'column',
    alignItems: 'center',
//    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(24),
    gap: scale(8),
    marginRight: scale(10),
//    borderWidth: 1,
//    borderColor: 'rgba(255, 255, 255, 0.1)',
    // ✅ Shadow for depth
//    shadowColor: '#000',
//    shadowOffset: { width: 0, height: 4 },
//    shadowOpacity: 0.3,
//    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontWeight: '400',
  },
  // ⭐ NEW: Message Button Container (for tooltip positioning)
  messageButtonContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ⭐ NEW: Tooltip (Left side of message button)
  tooltip: {
    position: 'absolute',
    right: scale(85), // Position to the left of button (button width + margin)
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: scale(180),
  },
  tooltipText: {
    fontSize: scale(12),
    color: '#FFA500',
    fontWeight: '600',
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    right: scale(-6),
    top: '50%',
    marginTop: scale(-6),
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderTopColor: 'transparent',
    borderBottomWidth: 6,
    borderBottomColor: 'transparent',
    borderLeftWidth: 6,
    borderLeftColor: 'rgba(0, 0, 0, 0.9)',
  },
});

export default QuickActionChipsAnimated;

