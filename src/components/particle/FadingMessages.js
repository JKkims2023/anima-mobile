/**
 * 💬✨ Fading Messages Effect (React Native)
 * 
 * Sequential fade-in/fade-out messages for emotional storytelling
 * Perfect for poetic, cinematic expressions
 * 
 * Animation Flow:
 * - Fade in (1s) → Hold (3s) → Fade out (1s) → Next message
 * - Infinite loop through all messages
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import CustomText from '../CustomText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FadingMessages = ({ words = ['사랑해', '고마워', '함께해줘서', '고마워요'] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animation sequence: Fade In → Hold → Fade Out → Next
    const fadeDuration = 1000;   // 1s fade in/out
    const holdDuration = 3000;   // 3s hold
    const totalDuration = fadeDuration + holdDuration + fadeDuration; // 5s total

    const animateMessage = () => {
      opacity.value = withSequence(
        // Fade in (1s)
        withTiming(1, { duration: fadeDuration, easing: Easing.inOut(Easing.ease) }),
        // Hold (3s)
        withDelay(holdDuration, withTiming(1, { duration: 0 })),
        // Fade out (1s)
        withTiming(0, { duration: fadeDuration, easing: Easing.inOut(Easing.ease) })
      );
    };

    // Start first animation
    animateMessage();

    // Set up interval for message rotation
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, totalDuration);

    return () => clearInterval(intervalId);
  }, [words.length]);

  // Trigger animation when index changes
  useEffect(() => {
    const fadeDuration = 1000;
    const holdDuration = 3000;

    opacity.value = 0; // Reset to invisible
    opacity.value = withSequence(
      withTiming(1, { duration: fadeDuration, easing: Easing.inOut(Easing.ease) }),
      withDelay(holdDuration, withTiming(1, { duration: 0 })),
      withTiming(0, { duration: fadeDuration, easing: Easing.inOut(Easing.ease) })
    );
  }, [currentIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const currentMessage = words[currentIndex] || words[0];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.messageContainer, animatedStyle]}>
        <CustomText style={styles.messageText}>
          {currentMessage}
        </CustomText>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 5,
    pointerEvents: 'none',
  },
  messageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH - 80,
  },
  messageText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.5,
    // ⭐ Multi-layer text shadow for maximum readability
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
    // Note: React Native doesn't support multiple text shadows like CSS
    // Using strong single shadow for readability
  },
});

export default React.memo(FadingMessages, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.words) === JSON.stringify(nextProps.words);
});

