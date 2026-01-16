/**
 * 🕯️ Comfort Light Particle Effect
 * 
 * Warm, gentle light particles floating slowly
 * Perfect for comfort and consolation messages
 * 
 * ⚡ Performance Optimized:
 * - useMemo for stable particle generation (no re-renders)
 * - Pre-calculated color & drift values
 * - Consistent with Web version
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Warm light colors
const COLORS = ['#FFE5B4', '#FFDAB9', '#FFEFD5', '#FFF8DC', '#FFEBCD'];

// Single light particle
const LightParticle = ({ delay = 0, startX, startY, size, color, driftAmount }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // Gentle float up
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, {
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        false
      )
    );

    // Drift slowly (⚡ use pre-calculated driftAmount)
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(driftAmount, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    // Pulse gently (더 부드럽게)
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    // Fade in/out (더 부드럽게)
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.7, {
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );
  }, [delay, driftAmount]); // ⚡ Add deps for stability

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.lightParticle,
        animatedStyle,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          backgroundColor: color, // ⚡ Use stable color from props
        },
      ]}
    />
  );
};

// Main ComfortLight component
const ComfortLight = () => {
  // ⚡ Performance: Generate particles ONCE on mount (stable across re-renders)
  const lights = useMemo(() => {
    console.log('🕯️ [ComfortLight Native] Generating particles (useMemo - only once!)');
    return Array.from({ length: 15 }, (_, i) => ({
      key: i,
      delay: Math.random() * 3000,
      startX: Math.random() * SCREEN_WIDTH,
      startY: SCREEN_HEIGHT * 0.3 + Math.random() * (SCREEN_HEIGHT * 0.7),
      size: 40 + Math.random() * 60,
      color: COLORS[Math.floor(Math.random() * COLORS.length)], // ⚡ Pre-calculate color
      driftAmount: Math.random() * 30 - 15, // ⚡ Pre-calculate drift
    }));
  }, []); // ⭐ Empty deps: generate only once

  return (
    <View style={styles.container}>
      {lights.map((light) => (
        <LightParticle
          key={light.key}
          delay={light.delay}
          startX={light.startX}
          startY={light.startY}
          size={light.size}
          color={light.color}
          driftAmount={light.driftAmount}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightParticle: {
    position: 'absolute',
    borderRadius: 9999,
    shadowColor: '#FFE5B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
});

export default ComfortLight;

