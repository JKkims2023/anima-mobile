/**
 * ⭐ Hope Star Particle Effect
 * 
 * Stars rising from bottom, symbolizing hope and dreams
 * Perfect for encouragement and hope messages
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Star colors (warm, hopeful)
const COLORS = ['#FFD700', '#FFA500', '#FFEA00', '#FFB347', '#4FACFE'];

// Single star
const Star = ({ delay = 0, startX, size, color }) => {
  const translateY = useSharedValue(SCREEN_HEIGHT + 50);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Rise up gracefully
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, {
          duration: 5000 + Math.random() * 2000,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      )
    );

    // Gentle drift
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.random() * 40 - 20, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    // Scale up as it rises
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.2, {
          duration: 5000,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      )
    );

    // Fade in then fade out
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.9, {
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    // Rotate slowly
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, {
          duration: 4000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.starContainer,
        animatedStyle,
        {
          left: startX,
        },
      ]}
    >
      <Icon name="star" size={size} color={color} />
    </Animated.View>
  );
};

// Main HopeStar component
const HopeStar = () => {
  // Generate 15 stars
  const stars = Array.from({ length: 15 }, (_, i) => ({
    key: i,
    delay: Math.random() * 4000,
    startX: Math.random() * SCREEN_WIDTH,
    size: 20 + Math.random() * 15,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <Star
          key={star.key}
          delay={star.delay}
          startX={star.startX}
          size={star.size}
          color={star.color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  starContainer: {
    position: 'absolute',
  },
});

export default HopeStar;

