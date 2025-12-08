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
  const translateY = useSharedValue(SCREEN_HEIGHT + 50);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0.9);

  useEffect(() => {
    // Rise up from bottom
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, {
          duration: riseDuration, // ⭐ Each word has different speed
          easing: Easing.linear,
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

    // Subtle pulse
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(pulseScale, { // ⭐ Each word has different pulse size
          duration: pulseDuration, // ⭐ Each word has different pulse speed
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    // Fade in
    opacity.value = withDelay(
      delay,
      withTiming(0.9, {
        duration: 500,
      })
    );
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
      <View style={[styles.wordBubble, { 
        backgroundColor: 'rgba(0, 0, 0, 0.85)', // ⭐ FIXED: Much darker (was 0.3, now 0.85)
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

// Main FloatingWords component
const FloatingWords = ({ words = ['사랑해', '고마워'] }) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💬 [FloatingWords] Rendering with words:', words);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Generate word particles (3-5 instances per word)
  const wordParticles = Array.from({ length: 15 }, (_, i) => ({
    key: i,
    word: words[Math.floor(Math.random() * words.length)],
    delay: Math.random() * 4000,
    startX: Math.random() * SCREEN_WIDTH,
    size: 18,
    color: COLORS[i % COLORS.length],
    // ⭐ NEW: Each word has unique animation properties!
    riseDuration: 5000 + Math.random() * 4000,      // 5~9초 (각자 다름!)
    swingAmplitude: (Math.random() * 40 - 20),      // -20 ~ 20 (각자 다름!)
    swingDuration: 2000 + Math.random() * 3000,     // 2~5초 (각자 다름!)
    pulseScale: 1.05 + Math.random() * 0.15,        // 1.05~1.2 (각자 다름!)
    pulseDuration: 1500 + Math.random() * 2000,     // 1.5~3.5초 (각자 다름!)
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
  wordBubble: {
    paddingHorizontal: 14, // ⭐ Slightly bigger
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 3, // ⭐ Thicker border (was 1.5)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // ⭐ Stronger shadow
    shadowOpacity: 0.8, // ⭐ Stronger shadow (was 0.3)
    shadowRadius: 8, // ⭐ Stronger shadow (was 4)
    elevation: 6, // ⭐ Stronger elevation (was 3)
  },
  wordText: {
    fontWeight: '900', // ⭐ Bolder (was '700')
    letterSpacing: 1, // ⭐ More spacing (was 0.5)
    textShadowColor: 'rgba(0, 0, 0, 0.9)', // ⭐ Stronger text shadow (was 0.3)
    textShadowOffset: { width: 0, height: 2 }, // ⭐ Stronger shadow (was 1)
    textShadowRadius: 4, // ⭐ Stronger shadow (was 2)
  },
});

// ⭐ Memoize to prevent unnecessary re-renders
export default React.memo(FloatingWords, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.words) === JSON.stringify(nextProps.words);
});

