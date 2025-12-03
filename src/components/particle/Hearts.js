/**
 * 💕 Hearts Particle Effect
 * 
 * Floating hearts rising from bottom
 * Perfect for love and appreciation messages
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

// Heart colors
const COLORS = ['#FF6B9D', '#FFC2D1', '#FF8FAB', '#FFB3C1', '#FF69B4'];

// Single heart
const HeartPiece = ({ delay = 0, color, startX, size }) => {
  const translateY = useSharedValue(SCREEN_HEIGHT + 50);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    // Rise up
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, {
          duration: 4000 + Math.random() * 2000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Swing left/right
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.random() * 40 - 20, {
          duration: 2000 + Math.random() * 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    // Scale pulse
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.2, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    // Fade in
    opacity.value = withDelay(
      delay,
      withTiming(0.8, {
        duration: 500,
      })
    );
  }, []);

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
        styles.heartContainer,
        animatedStyle,
        {
          left: startX,
        },
      ]}
    >
      <Icon name="heart" size={size} color={color} />
    </Animated.View>
  );
};

// Main Hearts component
const Hearts = () => {
  // Generate 20 hearts
  const hearts = Array.from({ length: 20 }, (_, i) => ({
    key: i,
    delay: Math.random() * 3000,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    startX: Math.random() * SCREEN_WIDTH,
    size: 20 + Math.random() * 15,
  }));

  return (
    <View style={styles.container}>
      {hearts.map((heart) => (
        <HeartPiece
          key={heart.key}
          delay={heart.delay}
          color={heart.color}
          startX={heart.startX}
          size={heart.size}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heartContainer: {
    position: 'absolute',
  },
});

export default Hearts;

