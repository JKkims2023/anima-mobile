/**
 * 💬➡️ Scrolling Words Particle Effect
 * 
 * User's custom words scrolling from left to right
 * Random heights for dynamic visual effect
 * Perfect for personalized emotional messages
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
import CustomText from '../CustomText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Word colors (bright colors for visibility)
const COLORS = [
  '#FF6B9D', // Pink
  '#4ECDC4', // Turquoise
  '#FFE66D', // Yellow
  '#A8E6CF', // Mint
  '#FF8FAB', // Rose
  '#B5E7F0', // Sky Blue
];

// Single scrolling word
const ScrollingWord = ({ delay = 0, word, startY, duration, size, color }) => {
  const translateX = useSharedValue(-50); // Start from slightly left
  const opacity = useSharedValue(1); // ⭐ FIXED: Always visible (like FloatingWords)

  useEffect(() => {
    // Scroll from left to right
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_WIDTH + 100, { // End at right (off-screen)
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.wordContainer,
        animatedStyle,
        {
          top: startY,
        },
      ]}
    >
      {/* ⭐ Removed View wrapper (wordBubble) - no background/border needed! */}
      <CustomText 
        style={[styles.wordText, { 
          fontSize: size + 4, // ⭐ Slightly bigger
          color: color, // ⭐ Use vibrant color directly
        }]}
      >
        {word}
      </CustomText>
    </Animated.View>
  );
};

// Main ScrollingWords component
const ScrollingWords = ({ words = ['사랑해', '고마워'] }) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💬➡️ [ScrollingWords] Rendering with words:', words);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Generate scrolling word particles
  const wordParticles = Array.from({ length: 10 }, (_, i) => ({
    key: i,
    word: words[Math.floor(Math.random() * words.length)],
    delay: i * 1000, // 1 second apart
    startY: Math.random() * (SCREEN_HEIGHT * 0.6) + (SCREEN_HEIGHT * 0.2), // Random height (20% ~ 80%)
    duration: 6000 + Math.random() * 2000, // 6~8 seconds
    size: 20, // Same size for consistency
    color: COLORS[i % COLORS.length], // ⭐ FIXED: Different color for each word (순차적으로)
  }));

  return (
    <View style={styles.container}>
      {wordParticles.map((particle) => (
        <ScrollingWord
          key={particle.key}
          word={particle.word}
          delay={particle.delay}
          startY={particle.startY}
          duration={particle.duration}
          size={particle.size}
          color={particle.color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor removed - transparent
  },
  wordContainer: {
    position: 'absolute',
    left: 0,
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
export default React.memo(ScrollingWords, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.words) === JSON.stringify(nextProps.words);
});

