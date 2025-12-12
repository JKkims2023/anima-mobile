/**
 * 💬 Floating Words Particle Effect
 * 
 * User's custom words floating up from bottom
 * Perfect for personalized emotional messages
 * 
 * Based on Hearts.js pattern
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
import CustomText from '../CustomText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Word colors (soft pastel colors for readability)
const COLORS = [
  '#FFB7C5', // Soft Pink
  '#B5E7F0', // Soft Blue
  '#FFE5A0', // Soft Yellow
  '#C8E6C9', // Soft Green
  '#F8BBD0', // Light Pink
  '#B2DFDB', // Light Teal
];

// Single floating word
const FloatingWord = ({ 
  delay = 0, 
  word, 
  startX, 
  size, 
  color,
  riseDuration,     // ⭐ NEW: Each word has different rise speed
  swingAmplitude,   // ⭐ NEW: Each word has different swing range
  swingDuration,    // ⭐ NEW: Each word has different swing speed
  pulseScale,       // ⭐ NEW: Each word has different pulse size
  pulseDuration,    // ⭐ NEW: Each word has different pulse speed
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT + 50); // ⭐ Start from below screen
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1); // ⭐ FIXED: Start at full size (was 0)
  const opacity = useSharedValue(0.9);

  useEffect(() => {
    // Rise up from bottom
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, {
          duration: riseDuration, // ⭐ Each word has different speed (12~22s, same as web)
          easing: Easing.inOut(Easing.ease), // ⭐ Smooth easing (same as web's easeInOut)
        }),
        -1,
        false
      )
    );

    // Gentle swing left/right
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(swingAmplitude, { // ⭐ Each word has different amplitude
          duration: swingDuration, // ⭐ Each word has different swing speed
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    // Subtle pulse (1.0 ↔ pulseScale)
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(pulseScale, { // ⭐ Each word has different pulse size
            duration: pulseDuration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: pulseDuration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    // Already visible (no fade in needed)
    opacity.value = 0.9;
  }, [delay, riseDuration, swingAmplitude, swingDuration, pulseScale, pulseDuration]);

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
        styles.wordContainer,
        animatedStyle,
        {
          left: startX,
        },
      ]}
    >
      {/* ⭐ Removed View wrapper (wordBubble) - no background/border needed! */}
      <CustomText 
        style={[styles.wordText, { 
          fontSize: size + 1, // ⭐ Slightly bigger (same as web)
          color: color, // ⭐ Use vibrant color directly
        }]}
      >
        {word}
      </CustomText>
    </Animated.View>
  );
};

// Main FloatingWords component
const FloatingWords = ({ words = ['사랑해', '고마워'] }) => {
  // Generate word particles (2-3 instances per word, optimized for performance)
  const wordParticles = Array.from({ length: 12 }, (_, i) => ({
    key: i,
    word: words[Math.floor(Math.random() * words.length)],
    delay: Math.random() * 4000,
    startX: Math.random() * SCREEN_WIDTH,
    size: 18,
    color: COLORS[i % COLORS.length],
    // Each word has unique animation properties for natural, organic movement (same as web)
    riseDuration: 12000 + Math.random() * 10000,    // 12~22s (slow, natural rise - same as web)
    swingAmplitude: (Math.random() * 20 - 10),      // -10 ~ 10 (gentle sway - same as web)
    swingDuration: 5000 + Math.random() * 5000,     // 5~10s (slow swing - same as web)
    pulseScale: 1.03 + Math.random() * 0.07,        // 1.03~1.1 (subtle pulse - same as web)
    pulseDuration: 3000 + Math.random() * 4000,     // 3~7s (slow pulse - same as web)
  }));

  return (
    <View style={styles.container}>
      {wordParticles.map((particle) => (
        <FloatingWord
          key={particle.key}
          word={particle.word}
          delay={particle.delay}
          startX={particle.startX}
          size={particle.size}
          color={particle.color}
          riseDuration={particle.riseDuration}           // ⭐ Pass unique animation properties
          swingAmplitude={particle.swingAmplitude}
          swingDuration={particle.swingDuration}
          pulseScale={particle.pulseScale}
          pulseDuration={particle.pulseDuration}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wordContainer: {
    position: 'absolute',
  },
  wordText: {
    fontWeight: '900',
    letterSpacing: 1.5,
    // ⭐ Multi-layer text shadow for strong visibility (no background/border!)
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15, // ⭐ Very strong blur shadow
    // ⭐ Note: React Native doesn't support multiple text shadows like web,
    // but strong single shadow + elevation provides similar effect
    elevation: 10, // ⭐ Strong elevation for Android
    shadowColor: '#000', // ⭐ iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    paddingHorizontal: 4, // ⭐ Minimal padding
    paddingVertical: 2,
  },
});

// ⭐ Memoize to prevent unnecessary re-renders
export default React.memo(FloatingWords, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.words) === JSON.stringify(nextProps.words);
});

