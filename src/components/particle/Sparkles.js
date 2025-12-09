/**
 * ✨ Sparkles / Fireworks / Fireflies Particle Effect
 * 
 * Twinkling particles appearing randomly
 * Supports multiple variants:
 * - sparkles: Golden twinkling stars ✨
 * - fireworks: Explosive colorful bursts 🎆
 * - fireflies: Soft glowing lights ✨🕯️
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { verticalScale } from '../../utils/responsive-utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Variant configurations
const VARIANTS = {
  sparkles: {
    colors: ['#FFD700', '#FFF700', '#FFEC8B', '#F0E68C', '#4FACFE'],
    icon: 'star-four-points',
    duration: 600,
    count: 20,
  },
  fireworks: {
    colors: ['#FF0000', '#FF4500', '#FFD700', '#00FF00', '#0000FF', '#FF00FF'],
    icon: 'creation',
    duration: 400, // Faster explosion
    count: 25, // More particles
  },
  fireflies: {
    colors: ['#FFFF00', '#ADFF2F', '#98FB98', '#F0E68C'],
    icon: 'circle',
    duration: 1000, // Slower, softer
    count: 15, // Fewer, more subtle
  },
};

// Single sparkle
const Sparkle = ({ delay = 0, x, y, color, size, icon, duration }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Twinkle effect: scale and opacity (variant-dependent duration)
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
          withTiming(0.5, { duration, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Rotate
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(180, {
          duration: duration * 4,
          easing: Easing.linear,
        }),
        -1,
        true
      )
    );
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.sparkleContainer,
        animatedStyle,
        {
          left: x,
          top: y,
        },
      ]}
    >
      <Icon name={icon} size={size} color={color} />
    </Animated.View>
  );
};

// Main Sparkles component
const Sparkles = ({ variant = 'sparkles' }) => {
  const config = VARIANTS[variant] || VARIANTS.sparkles;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ [Sparkles] Rendering with variant:', variant);
  console.log('  - icon:', config.icon);
  console.log('  - duration:', config.duration);
  console.log('  - count:', config.count);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Generate particles based on variant count
  const particles = Array.from({ length: config.count }, (_, i) => ({
    key: i,
    delay: Math.random() * 3000,
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    size: 15 + Math.random() * 10,
  }));

  return (
    <View style={styles.container}>
      {particles.map((particle) => (
        <Sparkle
          key={particle.key}
          delay={particle.delay}
          x={particle.x}
          y={particle.y}
          color={particle.color}
          size={particle.size}
          icon={config.icon}
          duration={config.duration}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: verticalScale(200),
    left: 0,
    right: 0,
    bottom: verticalScale(300),
    zIndex: 5,
  },
  sparkleContainer: {
    position: 'absolute',
  },
});

export default Sparkles;

