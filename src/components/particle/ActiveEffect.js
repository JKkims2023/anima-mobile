/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ✨ ActiveEffect - Layer 2 (Dynamic Active Effects)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Dynamic, engaging effects that draw attention
 * - Higher z-index (above background effects)
 * - Active animations that enhance message emotion
 * 
 * Effects:
 * - none: No effect
 * 
 * 💕 Love & Romance:
 * - hearts: Falling hearts 💕
 * - neon_hearts: Neon hearts 💖 (uses Hearts component)
 * 
 * 🎉 Celebration & Joy:
 * - confetti: Colorful confetti 🎉
 * - sparkles: Sparkles ✨
 * - fireworks: Fireworks 🎆 (bottom-up burst)
 * 
 * 🌿 Nature & Season:
 * - snow: Snowflakes ❄️
 * - rain_soft: Soft rain 🌧️
 * - sakura: Cherry blossoms 🌸 (uses Snow component with pink tint)
 * - leaves: Falling leaves 🍂 (uses Snow component with orange tint)
 * 
 * 🕯️ Comfort & Hope:
 * - comfort_light: Warm light 🕯️
 * - hope_star: Rising stars ⭐
 * - fireflies: Fireflies ✨ (uses Sparkles component with soft glow)
 * 
 * 💬 Custom Words:
 * - floating_words: User's custom words floating upward
 * - scrolling_words: User's custom words scrolling left to right
 * 
 * 2-Layer System Architecture:
 * - This is Layer 2 (z-index: 50)
 * - Works with Layer 1 (BackgroundEffect, z-index: 10)
 * - Can be combined for rich emotional expressions
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-10 (2-Layer System)
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Confetti from './Confetti';
import Fireworks from './Fireworks'; // ⭐ NEW: Dynamic fireworks
import Hearts from './Hearts';
import Snow from './Snow';
import Sparkles from './Sparkles';
import ComfortLight from './ComfortLight';
import HopeStar from './HopeStar';
import RainSoft from './RainSoft';
import FloatingWords from './FloatingWords'; // ⭐ NEW: Custom words floating up
import ScrollingWords from './ScrollingWords'; // ⭐ NEW: Custom words scrolling

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ActiveEffect = ({ type = 'none', isActive = true, customWords = [] }) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ [ActiveEffect] Rendering (Layer 2)');
  console.log('  - type:', type);
  console.log('  - isActive:', isActive);
  console.log('  - customWords:', customWords);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // No effect
  if (type === 'none' || !isActive) {
    console.log('🌙 [ParticleEffect] No effect or inactive');
    return null;
  }

  // Render appropriate particle effect
  const renderParticleEffect = () => {
    switch (type) {
      // ─────────────────────────────────────────────────────────────────────
      // 💕 Love & Romance
      // ─────────────────────────────────────────────────────────────────────
      case 'hearts':
        return <Hearts key="hearts" variant="normal" />;
      case 'neon_hearts':
        // ⭐ New: Use Hearts component with neon styling
        return <Hearts key="neon_hearts" variant="neon" />;
      
      // ─────────────────────────────────────────────────────────────────────
      // 🎉 Celebration & Joy
      // ─────────────────────────────────────────────────────────────────────
      case 'confetti':
        return <Confetti key="confetti" />;
      case 'sparkles':
        return <Sparkles key="sparkles" variant="sparkles" />;
      case 'fireworks':
        // ⭐ NEW: Use Fireworks component for "파파팡" dynamic explosions
        console.log('🎆 [ParticleEffect] Using Fireworks component (react-native-confetti-cannon)');
        return <Fireworks key="fireworks" />;
      
      // ─────────────────────────────────────────────────────────────────────
      // 🌿 Nature & Season
      // ─────────────────────────────────────────────────────────────────────
      case 'snow':
        return <Snow key="snow" variant="snow" />;
      case 'rain_soft':
        return <RainSoft key="rain_soft" />;
      case 'sakura':
        // ⭐ New: Use Snow component for cherry blossom petals
        return <Snow key="sakura" variant="sakura" />;
      case 'leaves':
        // ⭐ New: Use Snow component for falling leaves
        return <Snow key="leaves" variant="leaves" />;
      
      // ─────────────────────────────────────────────────────────────────────
      // 🕯️ Comfort & Hope
      // ─────────────────────────────────────────────────────────────────────
      case 'comfort_light':
        return <ComfortLight key="comfort_light" />;
      case 'hope_star':
        return <HopeStar key="hope_star" />;
      case 'fireflies':
        // ⭐ New: Use Sparkles component for fireflies effect
        return <Sparkles key="fireflies" variant="fireflies" />;
      
      // ─────────────────────────────────────────────────────────────────────
      // 💬 Custom Words (Personal)
      // ─────────────────────────────────────────────────────────────────────
      case 'floating_words':
        // ⭐ NEW: User's custom words floating up
        console.log('💬 [ParticleEffect] Using FloatingWords with:', customWords);
        return <FloatingWords key="floating_words" words={customWords.length > 0 ? customWords : ['사랑해', '고마워']} />;
      
      case 'scrolling_words':
        // ⭐ NEW: User's custom words scrolling left to right
        console.log('💬➡️ [ParticleEffect] Using ScrollingWords with:', customWords);
        return <ScrollingWords key="scrolling_words" words={customWords.length > 0 ? customWords : ['사랑해', '고마워']} />;
      
      default:
        console.warn(`[ParticleEffect] Unknown particle type: ${type}`);
        return null;
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {renderParticleEffect()}
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
    zIndex: 50, // ⭐ Layer 2: Above BackgroundEffect (z-index: 10), below content
  },
});

// ⭐ Memoize to prevent unnecessary re-renders
export default React.memo(ActiveEffect, (prevProps, nextProps) => {
  // Only re-render if type, isActive, or customWords changes
  return (
    prevProps.type === nextProps.type && 
    prevProps.isActive === nextProps.isActive &&
    JSON.stringify(prevProps.customWords) === JSON.stringify(nextProps.customWords) // ⭐ CRITICAL FIX
  );
});

