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
      <View style={[styles.wordBubble, { 
        backgroundColor: 'rgba(0, 0, 0, 0.85)', // ⭐ FIXED: Much darker (was 0.4, now 0.85)
        borderColor: color,
        borderWidth: 3, // ⭐ Thicker border
      }]}>
        <CustomText 
          style={[styles.wordText, { 
            fontSize: size,
            color: '#FFFFFF', // ⭐ FIXED: White text (was color)
          }]}
        >
          {word}
        </CustomText>
      </View>
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
  wordBubble: {
    paddingHorizontal: 16, // ⭐ Slightly bigger
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 3, // ⭐ Thicker border (was 2)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // ⭐ Stronger shadow
    shadowOpacity: 0.8, // ⭐ Stronger shadow (was 0.4)
    shadowRadius: 10, // ⭐ Stronger shadow (was 6)
    elevation: 8, // ⭐ Stronger elevation (was 5)
  },
  wordText: {
    fontWeight: '900', // ⭐ Bolder (was '800')
    letterSpacing: 1.2, // ⭐ Slightly more spacing
    textShadowColor: 'rgba(0, 0, 0, 0.9)', // ⭐ Stronger text shadow (was 0.5)
    textShadowOffset: { width: 0, height: 2 }, // ⭐ Stronger shadow (was 1)
    textShadowRadius: 4, // ⭐ Stronger shadow (was 3)
  },
});

// ⭐ Memoize to prevent unnecessary re-renders
export default React.memo(ScrollingWords, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.words) === JSON.stringify(nextProps.words);
});

