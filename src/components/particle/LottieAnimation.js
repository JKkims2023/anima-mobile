/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎬 LottieAnimation - Lottie JSON Animation Player (Infinite Loop)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Play Lottie JSON animations infinitely
 * - Centralized animation source management
 * - Used by ActiveEffect as Layer 2
 * 
 * Features:
 * - Infinite loop (loop={true})
 * - Auto-play on mount
 * - Smooth fade-in animation
 * - Full-screen overlay with centered content
 * 
 * Available Animations:
 * - birthday_cupcake: 🎂 Birthday celebration
 * - cheers_toast: 🍻 Cheers & toast
 * - confetti: 🎉 Confetti celebration
 * - fiery_passion: 🔥 Passionate fire
 * - food_beverage: 🍽️ Food & beverage
 * - love_hearts: 💕 Romantic hearts
 * - martini: 🍸 Martini glass
 * - mug_beer: 🍺 Beer mug
 * - sushi: 🍣 Sushi
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-27
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Animation Source Mapping (9 Animations)
// ═══════════════════════════════════════════════════════════════════════════

const ANIMATION_SOURCES = {
  birthday_cupcake: require('../../assets/animations/Birthday-Cupcake.json'),
  cheers_toast: require('../../assets/animations/cheers-toast.json'),
  confetti_lottie: require('../../assets/animations/Confetti.json'), // ⚠️ Renamed to avoid conflict
  fiery_passion: require('../../assets/animations/Firery-Passion.json'),
  food_beverage: require('../../assets/animations/Food-Beverage.json'),
  love_hearts_lottie: require('../../assets/animations/love-hearts.json'), // ⚠️ Renamed to avoid conflict
  martini: require('../../assets/animations/Martini.json'),
  mug_beer: require('../../assets/animations/Mug-Beerjson.json'),
  sushi: require('../../assets/animations/Sushi.json'),
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎬 LottieAnimation Component
// ═══════════════════════════════════════════════════════════════════════════

const LottieAnimation = ({ type }) => {
  const lottieRef = useRef(null);
  const opacity = useSharedValue(0);
  
  // Get animation source
  const source = ANIMATION_SOURCES[type];
  
  // ⚠️ If invalid type, return null
  if (!source) {
    console.warn(`[LottieAnimation] Invalid animation type: ${type}`);
    return null;
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎬 [LottieAnimation] Rendering');
  console.log('   Type:', type);
  console.log('   Source:', source ? 'Loaded' : 'Not Found');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Auto-play on mount
  useEffect(() => {
    console.log('🎬 [LottieAnimation] Starting animation...');
    lottieRef.current?.play();
    
    // Fade in
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, [type]);
  
  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LottieView
        ref={lottieRef}
        source={source}
        loop={true} // ✅ 무한 반복!
        style={styles.lottie}
        autoPlay={false} // Manual control with ref.play()
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100, // Above background, below UI
  },
  lottie: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.6,
  },
});

export default LottieAnimation;
