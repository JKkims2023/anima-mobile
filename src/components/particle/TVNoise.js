/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📺 TVNoise - Analog TV Static Effect (Horizontal Lines)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Simulate old analog TV static/snow noise
 * - Black & white horizontal lines flickering (ㅡㅡㅡ ㅡ ㅡㅡ)
 * - Retro/vintage atmosphere
 * 
 * Variants:
 * - weak: 20 lines, opacity 0.15-0.3, slow flicker
 * - medium: 35 lines, opacity 0.2-0.5, medium flicker (recommended)
 * - strong: 50 lines, opacity 0.3-0.7, fast flicker
 * 
 * Technical:
 * - Horizontal lines (width: 30-300px, height: 1-3px)
 * - Each line has independent opacity animation
 * - Random grayscale colors (#000, #333, #666, #999, #ccc, #fff)
 * - Uses react-native-reanimated for smooth performance
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-10 (Retro Effect System - Horizontal Lines)
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// Grayscale colors for analog TV noise
// ═══════════════════════════════════════════════════════════════════════════
const GRAYSCALE_COLORS = [
  '#000000', // Black
  '#333333', // Dark gray
  '#666666', // Medium gray
  '#999999', // Light gray
  '#cccccc', // Very light gray
  '#ffffff', // White
];

// ═══════════════════════════════════════════════════════════════════════════
// Configuration per variant
// ⭐ NEW: Horizontal lines instead of pixels for authentic TV static
// ═══════════════════════════════════════════════════════════════════════════
const VARIANT_CONFIG = {
  weak: {
    count: 20, // ⭐ Fewer lines for weak
    minOpacity: 0.15,
    maxOpacity: 0.3,
    minDuration: 150,
    maxDuration: 300,
    lineWidth: { min: 30, max: 100 }, // ⭐ Horizontal line width
    lineHeight: { min: 1, max: 2 },   // ⭐ Very thin (1-2px)
  },
  medium: {
    count: 35, // ⭐ More lines for medium
    minOpacity: 0.2,
    maxOpacity: 0.5,
    minDuration: 100,
    maxDuration: 250,
    lineWidth: { min: 50, max: 200 }, // ⭐ Longer lines
    lineHeight: { min: 1, max: 3 },   // ⭐ Thin lines
  },
  strong: {
    count: 50, // ⭐ Many lines for strong
    minOpacity: 0.3,
    maxOpacity: 0.7,
    minDuration: 80,
    maxDuration: 200,
    lineWidth: { min: 80, max: 300 }, // ⭐ Very long lines
    lineHeight: { min: 1, max: 3 },   // ⭐ Thin but visible
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Single Noise Line Component (Horizontal Line for TV Static)
// ═══════════════════════════════════════════════════════════════════════════
const NoiseLine = ({ x, y, color, width, height, minOpacity, maxOpacity, duration, delay }) => {
  const opacity = useSharedValue(minOpacity);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(maxOpacity, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        true // ⭐ Reverse for smooth flicker
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.line,
        animatedStyle,
        {
          left: x,
          top: y,
          width,  // ⭐ Horizontal length (30-300px)
          height, // ⭐ Thin line (1-3px)
          backgroundColor: color,
        },
      ]}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main TVNoise Component
// ═══════════════════════════════════════════════════════════════════════════
const TVNoise = ({ variant = 'medium' }) => {
  console.log(`📺 [TVNoise] Rendering with variant: ${variant}`);

  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.medium;

  // Generate random horizontal lines once (authentic TV static)
  const lines = useMemo(() => {
    const generated = [];
    for (let i = 0; i < config.count; i++) {
      generated.push({
        id: `line-${i}`,
        x: Math.random() * SCREEN_WIDTH * 0.3, // ⭐ Start from left ~30% area
        y: Math.random() * SCREEN_HEIGHT,
        color: GRAYSCALE_COLORS[Math.floor(Math.random() * GRAYSCALE_COLORS.length)],
        width: Math.random() * (config.lineWidth.max - config.lineWidth.min) + config.lineWidth.min,
        height: Math.random() * (config.lineHeight.max - config.lineHeight.min) + config.lineHeight.min,
        duration: Math.random() * (config.maxDuration - config.minDuration) + config.minDuration,
        delay: Math.random() * 500, // Stagger start times
      });
    }
    return generated;
  }, [variant]);

  return (
    <View style={styles.container} pointerEvents="none">
      {lines.map((line) => (
        <NoiseLine
          key={line.id}
          x={line.x}
          y={line.y}
          color={line.color}
          width={line.width}
          height={line.height}
          minOpacity={config.minOpacity}
          maxOpacity={config.maxOpacity}
          duration={line.duration}
          delay={line.delay}
        />
      ))}
    </View>
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
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 50, // Layer 2 (Active)
  },
  line: {
    position: 'absolute',
    borderRadius: 0, // ⭐ Sharp edges for authentic TV static lines
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════
export default React.memo(TVNoise);

