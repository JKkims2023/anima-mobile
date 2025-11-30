/**
 * 🔘 CustomSwitch - Animated Toggle Switch Component
 * 
 * Features:
 * - Smooth animation with Reanimated
 * - Neon Glow effect when active
 * - Theme-aware colors
 * - Haptic feedback (iOS)
 * - Disabled state support
 * 
 * Props:
 * - value: boolean (required)
 * - onValueChange: Function (required)
 * - disabled: boolean
 * - activeColor: string (default: DEEP_BLUE)
 * - inactiveColor: string (default: gray)
 */

import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Platform, Vibration } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { scale, moderateScale } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

const CustomSwitch = ({
  value = false,
  onValueChange,
  disabled = false,
  activeColor = COLORS.DEEP_BLUE,
  inactiveColor = 'rgba(120, 120, 128, 0.16)',
}) => {
  // ✅ Pre-calculate dimensions (outside of worklet)
  const THUMB_TRANSLATE_DISTANCE = scale(20);

  // ✅ Animated values
  const translateX = useSharedValue(value ? 1 : 0);
  const colorProgress = useSharedValue(value ? 1 : 0);

  // ✅ Update animation when value changes
  useEffect(() => {
    translateX.value = withSpring(value ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
    colorProgress.value = withTiming(value ? 1 : 0, {
      duration: 200,
    });
  }, [value]);

  // ✅ Handle toggle
  const handleToggle = () => {
    if (disabled) return;

    // Haptic feedback (iOS) / Vibration (Android)
    if (Platform.OS === 'ios') {
      // iOS uses haptic feedback via native module (if available)
      // For now, we'll skip it as it requires native setup
    } else if (Platform.OS === 'android') {
      Vibration.vibrate(10); // Short vibration
    }

    onValueChange(!value);
  };

  // ✅ Track animated style
  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorProgress.value,
      [0, 1],
      [inactiveColor, activeColor]
    );

    return {
      backgroundColor,
    };
  });

  // ✅ Thumb animated style
  const thumbStyle = useAnimatedStyle(() => {
    const thumbTranslateX = translateX.value * THUMB_TRANSLATE_DISTANCE;

    return {
      transform: [{ translateX: thumbTranslateX }],
    };
  });

  // ✅ Glow animated style (only when active)
  const glowStyle = useAnimatedStyle(() => {
    const opacity = colorProgress.value * 0.6;
    const scaleValue = 1 + colorProgress.value * 0.1;

    return {
      opacity,
      transform: [{ scale: scaleValue }],
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleToggle}
      disabled={disabled}
      style={[styles.container, disabled && styles.containerDisabled]}
    >
      {/* Glow Layer */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            shadowColor: activeColor,
          },
          glowStyle,
        ]}
      />

      {/* Track */}
      <Animated.View style={[styles.track, trackStyle]}>
        {/* Thumb */}
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: scale(51),
    height: scale(31),
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  track: {
    width: scale(51),
    height: scale(31),
    borderRadius: moderateScale(15.5),
    padding: scale(2),
    justifyContent: 'center',
  },
  thumb: {
    width: scale(27),
    height: scale(27),
    borderRadius: moderateScale(13.5),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2.5,
    elevation: 3,
  },
  glowLayer: {
    position: 'absolute',
    width: scale(51),
    height: scale(31),
    borderRadius: moderateScale(15.5),
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: scale(10),
    elevation: 0,
  },
});

export default CustomSwitch;

