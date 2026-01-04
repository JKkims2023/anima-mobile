/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💙 EmotionFloatingEffect Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Instagram-style floating emoji effect for emotion chip
 * - Emojis float upward like hearts
 * - Auto-start/stop based on focus state
 * - Multiple emojis at different speeds
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-04
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';

/**
 * Single floating emoji instance
 */
const FloatingEmoji = ({ emoji, delay, duration, offsetX, isFocused }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (!isFocused) {
      // Stop animation when not focused
      translateY.stopAnimation();
      opacity.stopAnimation();
      translateY.setValue(0);
      opacity.setValue(0);
      return;
    }
    
    // Start animation after delay
    const timer = setTimeout(() => {
      // Reset position
      translateY.setValue(0);
      opacity.setValue(0);
      
      // Start floating animation (loop)
      Animated.loop(
        Animated.parallel([
          // Float upward
          Animated.timing(translateY, {
            toValue: -verticalScale(100), // Float up 100 units
            duration: duration,
            useNativeDriver: true,
          }),
          // Fade in then fade out
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.8, // Fade in
              duration: duration * 0.2, // 20% of total duration
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0, // Fade out
              duration: duration * 0.8, // 80% of total duration
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }, delay);
    
    return () => {
      clearTimeout(timer);
      translateY.stopAnimation();
      opacity.stopAnimation();
    };
  }, [isFocused, delay, duration]);
  
  return (
    <Animated.View
      style={[
        styles.floatingEmoji,
        {
          transform: [
            { translateY },
            { translateX: scale(offsetX) }, // Horizontal offset for variety
          ],
          opacity,
        },
      ]}
    >
      <CustomText style={styles.emojiText}>{emoji}</CustomText>
    </Animated.View>
  );
};

/**
 * EmotionFloatingEffect Component
 * @param {Object} props
 * @param {string} props.emoji - Emoji to float (e.g., '😊', '😐', '😢')
 * @param {boolean} props.isFocused - Whether screen is focused (controls animation)
 * @param {number} props.count - Number of floating emojis (default: 3)
 */
const EmotionFloatingEffect = ({ emoji, isFocused = true, count = 3 }) => {
  // Generate random delays and durations for natural effect
  const floatingEmojis = Array.from({ length: count }, (_, index) => ({
    id: index,
    delay: Math.random() * 2000, // 0-2s delay
    duration: 2000 + Math.random() * 1000, // 2-3s duration
    offsetX: (Math.random() - 0.5) * 20, // -10 to +10 horizontal offset
  }));
  
  return (
    <View style={styles.container} pointerEvents="none">
      {floatingEmojis.map((config) => (
        <FloatingEmoji
          key={config.id}
          emoji={emoji}
          delay={config.delay}
          duration={config.duration}
          offsetX={config.offsetX}
          isFocused={isFocused}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject, // Cover entire parent
    alignItems: 'center',
    justifyContent: 'flex-end', // Start from bottom
    overflow: 'visible', // Allow emojis to overflow
  },
  floatingEmoji: {
    position: 'absolute',
    bottom: 0, // Start from bottom
  },
  emojiText: {
    fontSize: scale(20),
    lineHeight: scale(24),
  },
});

export default EmotionFloatingEffect;

