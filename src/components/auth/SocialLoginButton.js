/**
 * 🔐 SocialLoginButton - Animated Social Login Button
 * 
 * Features:
 * - Google / Apple login buttons
 * - Particle effect on press (Phase 2)
 * - Ripple animation
 * - Platform-specific styling
 * 
 * Props:
 * - provider: 'google' | 'apple'
 * - onPress: Function
 * - disabled: Boolean
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, moderateScale } from '../../utils/responsive-utils';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SocialLoginButton = ({ provider, onPress, disabled = false }) => {
  const scaleValue = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // ✅ Button configuration
  const config = {
    google: {
      icon: 'google',
      text: 'Continue with Google',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      iconColor: '#DB4437',
    },
    apple: {
      icon: 'apple',
      text: 'Continue with Apple',
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
    },
  };

  const buttonConfig = config[provider];

  // ✅ Press animation
  const handlePressIn = () => {
    scaleValue.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(1, { duration: 200 });
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0, { duration: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <AnimatedTouchable
      style={[
        styles.button,
        { backgroundColor: buttonConfig.backgroundColor },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.9}
    >
      {/* ✅ Glow effect layer */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            backgroundColor:
              provider === 'google'
                ? 'rgba(66, 133, 244, 0.2)'
                : 'rgba(255, 255, 255, 0.2)',
          },
          glowStyle,
        ]}
      />

      {/* ✅ Button content */}
      <Icon
        name={buttonConfig.icon}
        size={moderateScale(24)}
        color={buttonConfig.iconColor}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          { color: buttonConfig.textColor },
          disabled && styles.textDisabled,
        ]}
      >
        {buttonConfig.text}
      </Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(16),
    paddingHorizontal: scale(24),
    borderRadius: scale(16),
    marginBottom: scale(12),
    // ✅ Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 4,
    // ✅ Border for definition
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: scale(16),
  },
  icon: {
    marginRight: scale(12),
  },
  text: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textDisabled: {
    opacity: 0.5,
  },
});

export default SocialLoginButton;

