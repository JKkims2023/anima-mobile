/**
 * 🎆 Fireworks Particle Effect
 * 
 * Dynamic fireworks exploding from bottom
 * "파파팡" multiple explosions for celebration
 * 
 * Uses: react-native-confetti-cannon
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fireworks colors (vibrant celebration colors)
const COLORS = [
  '#FF0000', // Red
  '#FF4500', // Orange Red
  '#FFD700', // Gold
  '#00FF00', // Green
  '#00CED1', // Turquoise
  '#0000FF', // Blue
  '#FF00FF', // Magenta
  '#FF1493', // Deep Pink
];

const Fireworks = () => {
  const explosion1Ref = useRef(null);
  const explosion2Ref = useRef(null);
  const explosion3Ref = useRef(null);

  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎆 [Fireworks] Initializing "파파팡" explosions');
    console.log('  - Screen Width:', SCREEN_WIDTH);
    console.log('  - Screen Height:', SCREEN_HEIGHT);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 🎆 "파파팡" Triple explosions with longer delays
    const timers = [];

    // First explosion (center-left)
    timers.push(setTimeout(() => {
      console.log('💥 [Fireworks] Explosion 1: Center-Left');
      explosion1Ref.current?.start();
    }, 0));

    // Second explosion (center) - 더 긴 간격
    timers.push(setTimeout(() => {
      console.log('💥 [Fireworks] Explosion 2: Center');
      explosion2Ref.current?.start();
    }, 700));

    // Third explosion (center-right) - 더 긴 간격
    timers.push(setTimeout(() => {
      console.log('💥 [Fireworks] Explosion 3: Center-Right');
      explosion3Ref.current?.start();
    }, 1400));

    return () => {
      console.log('🌙 [Fireworks] Cleanup timers');
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* ⭐ Explosion 1: Left side - 화면 하단 좌측에서 팡! 터져서 위로! */}
      <ConfettiCannon
        ref={explosion1Ref}
        count={150}
        origin={{ x: SCREEN_WIDTH * 0.3, y: 0 }} // ⭐ CRITICAL: y=0 = 화면 하단!
        explosionSpeed={700}
        fallSpeed={2500}
        colors={COLORS}
        autoStart={false}
        fadeOut={true}
      />

      {/* ⭐ Explosion 2: Center - 화면 하단 중앙에서 팡! 터져서 위로! */}
      <ConfettiCannon
        ref={explosion2Ref}
        count={180}
        origin={{ x: SCREEN_WIDTH * 0.5, y: 0 }} // ⭐ CRITICAL: y=0 = 화면 하단!
        explosionSpeed={750}
        fallSpeed={2600}
        colors={COLORS}
        autoStart={false}
        fadeOut={true}
      />

      {/* ⭐ Explosion 3: Right side - 화면 하단 우측에서 팡! 터져서 위로! */}
      <ConfettiCannon
        ref={explosion3Ref}
        count={150}
        origin={{ x: SCREEN_WIDTH * 0.7, y: 0 }} // ⭐ CRITICAL: y=0 = 화면 하단!
        explosionSpeed={700}
        fallSpeed={2500}
        colors={COLORS}
        autoStart={false}
        fadeOut={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
});

// ⭐ Memoize to prevent unnecessary re-renders (performance optimization)
export default React.memo(Fireworks);

