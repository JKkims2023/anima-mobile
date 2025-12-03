/**
 * ✨ Sparkles Particle Effect
 * 
 * Twinkling sparkles appearing randomly
 * Perfect for joy and celebration messages
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sparkle colors
const COLORS = ['#FFD700', '#FFF700', '#FFEC8B', '#F0E68C', '#4FACFE'];

// Single sparkle
const Sparkle = ({ delay = 0, x, y, color, size }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Twinkle effect: scale and opacity (부드럽게 개선)
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0.5, { duration: 600, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) })
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
          duration: 2400,
          easing: Easing.linear,
        }),
        -1,
        true
      )
    );
  }, []);

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
      <Icon name="star-four-points" size={size} color={color} />
    </Animated.View>
  );
};

// Main Sparkles component
const Sparkles = () => {
  // Generate 20 sparkles
  const sparkles = Array.from({ length: 20 }, (_, i) => ({
    key: i,
    delay: Math.random() * 3000,
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 15 + Math.random() * 10,
  }));

  return (
    <View style={styles.container}>
      {sparkles.map((sparkle) => (
        <Sparkle
          key={sparkle.key}
          delay={sparkle.delay}
          x={sparkle.x}
          y={sparkle.y}
          color={sparkle.color}
          size={sparkle.size}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sparkleContainer: {
    position: 'absolute',
  },
});

export default Sparkles;

