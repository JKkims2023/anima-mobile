/**
 * 🌧️ Rain Soft Particle Effect
 * 
 * Gentle rain drops falling slowly
 * Perfect for sadness, longing, and remembrance messages
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
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Rain drop colors (soft blue/gray)
const COLORS = ['#B0C4DE', '#ADD8E6', '#87CEEB', '#A8D8EA', '#B0E0E6'];

// Single rain drop
const RainDrop = ({ delay = 0, startX, length }) => {
  const translateY = useSharedValue(-length);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    // Fall down gently
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + 50, {
          duration: 2000 + Math.random() * 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Fade in/out subtly
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.7, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.rainDrop,
        animatedStyle,
        {
          left: startX,
          height: length,
          backgroundColor: COLORS[Math.floor(Math.random() * COLORS.length)],
        },
      ]}
    />
  );
};

// Main RainSoft component
const RainSoft = () => {
  // Generate 30 rain drops
  const rainDrops = Array.from({ length: 30 }, (_, i) => ({
    key: i,
    delay: Math.random() * 2000,
    startX: Math.random() * SCREEN_WIDTH,
    length: 20 + Math.random() * 30,
  }));

  return (
    <View style={styles.container}>
      {rainDrops.map((drop) => (
        <RainDrop
          key={drop.key}
          delay={drop.delay}
          startX={drop.startX}
          length={drop.length}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rainDrop: {
    position: 'absolute',
    width: 2,
    borderRadius: 1,
  },
});

export default RainSoft;

