/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌌 BackgroundEffect - Layer 1 (Ambient Background Effects)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Soft, ambient effects that fill the entire screen background
 * - Sets the emotional mood/atmosphere
 * - Low z-index (behind active effects)
 * - Gentle, slow animations
 * 
 * Effects:
 * 1. Aurora - Mystical aurora borealis lights
 * 2. Neon Light - Vibrant neon glow
 * 3. Gradient Flow - Dreamy flowing gradients
 * 4. Fog - Mysterious misty atmosphere
 * 5. Shimmer - Gentle sparkling ambiance
 * 
 * Design Principles:
 * - Does not distract from message content
 * - Enhances emotional connection
 * - Smooth, seamless loops
 * - Performance optimized (low fps acceptable)
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-10 (2-Layer System)
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

const BackgroundEffect = ({ type, isActive = true }) => {
  console.log(`🌌 [BackgroundEffect] Rendering: type=${type}, isActive=${isActive}`);

  if (!type || type === 'none' || !isActive) {
    console.log(`🌌 [BackgroundEffect] Effect hidden: ${type}`);
    return null;
  }

  switch (type) {
    case 'aurora':
      return <Aurora />;
    case 'neon_light':
      return <NeonLight />;
    case 'gradient_flow':
      return <GradientFlow />;
    case 'fog':
      return <Fog />;
    case 'shimmer':
      return <Shimmer />;
    default:
      console.warn(`🌌 [BackgroundEffect] Unknown effect type: ${type}`);
      return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Effect 1: Aurora (오로라) 🌌
// ═══════════════════════════════════════════════════════════════════════════

const Aurora = () => {
  const opacity = useSharedValue(0.3);
  const translateY = useSharedValue(0);

  useEffect(() => {
    console.log('🌌 [Aurora] Starting animation');
    
    // Opacity pulsing (slow, gentle)
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Vertical flow (very slow)
    translateY.value = withRepeat(
      withTiming(80, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#4facfe']}
        locations={[0, 0.33, 0.66, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Effect 2: Neon Light (네온 라이트) 💡
// ═══════════════════════════════════════════════════════════════════════════

const NeonLight = () => {
  const opacity = useSharedValue(0.4);
  const scale = useSharedValue(1);

  useEffect(() => {
    console.log('💡 [NeonLight] Starting animation');
    
    // Pulsing glow
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Subtle scale pulse
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={['#ff0080', '#ff8c00', '#40e0d0']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Effect 3: Gradient Flow (그라디언트 흐름) 🌈
// ═══════════════════════════════════════════════════════════════════════════

const GradientFlow = () => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    console.log('🌈 [GradientFlow] Starting animation');
    
    // Horizontal flow
    translateX.value = withRepeat(
      withTiming(100, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Gentle opacity pulse
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={['#a8edea', '#fed6e3', '#a6c1ee', '#fbc2eb']}
        locations={[0, 0.33, 0.66, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Effect 4: Fog (안개) 🌫️
// ═══════════════════════════════════════════════════════════════════════════

const Fog = () => {
  const opacity = useSharedValue(0.3);
  const translateX = useSharedValue(0);

  useEffect(() => {
    console.log('🌫️ [Fog] Starting animation');
    
    // Very slow horizontal drift
    translateX.value = withRepeat(
      withTiming(50, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Subtle opacity variation
    opacity.value = withRepeat(
      withTiming(0.5, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={['#3b3f5c', '#2c2e3e', '#3b3f5c']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Effect 5: Shimmer (반짝임) ✨
// ═══════════════════════════════════════════════════════════════════════════

const Shimmer = () => {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    console.log('✨ [Shimmer] Starting animation');
    
    // Gentle twinkling
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={['#ffeaa7', '#fdcb6e', '#fab1a0', '#fd79a8']}
        locations={[0, 0.33, 0.66, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10, // ⭐ Layer 1: Behind active effects (z-index: 50)
  },
  gradient: {
    flex: 1,
  },
});

export default BackgroundEffect;

