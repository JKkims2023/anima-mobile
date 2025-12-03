/**
 * 🎉 Confetti Particle Effect
 * 
 * Colorful confetti falling from top
 * Perfect for celebration messages
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

// Confetti colors
const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#C7CEEA', '#FFDAC1'];

// Single confetti piece
const ConfettiPiece = ({ delay = 0, color, startX }) => {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Fall down
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + 50, {
          duration: 3000 + Math.random() * 2000,
          easing: Easing.linear,
        }),
        -1, // Infinite
        false
      )
    );

    // Swing left/right
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.random() * 60 - 30, {
          duration: 1500 + Math.random() * 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true // Reverse
      )
    );

    // Rotate
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, {
          duration: 2000 + Math.random() * 1000,
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
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        animatedStyle,
        {
          left: startX,
          backgroundColor: color,
        },
      ]}
    />
  );
};

// Main Confetti component
const Confetti = () => {
  // Generate 30 confetti pieces
  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    key: i,
    delay: Math.random() * 2000,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    startX: Math.random() * SCREEN_WIDTH,
  }));

  return (
    <View style={styles.container}>
      {confettiPieces.map((piece) => (
        <ConfettiPiece
          key={piece.key}
          delay={piece.delay}
          color={piece.color}
          startX={piece.startX}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

export default Confetti;

