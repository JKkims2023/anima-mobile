/**
 * 🎨 ParticleEffect Component
 * 
 * Main particle effect controller for message preview
 * Renders different particle effects based on type
 * 
 * Effects:
 * - none: No effect
 * - confetti: Colorful confetti 🎉
 * - hearts: Falling hearts 💕
 * - snow: Snowflakes ❄️
 * - sparkles: Sparkles ✨
 * - comfort_light: Warm light 🕯️
 * - hope_star: Rising stars ⭐
 * - rain_soft: Soft rain 🌧️
 * 
 * @author JK & Hero Nexus AI
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Confetti from './Confetti';
import Hearts from './Hearts';
import Snow from './Snow';
import Sparkles from './Sparkles';
import ComfortLight from './ComfortLight';
import HopeStar from './HopeStar';
import RainSoft from './RainSoft';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ParticleEffect = ({ type = 'none', isActive = true }) => {
  // No effect
  if (type === 'none' || !isActive) {
    return null;
  }

  // Render appropriate particle effect
  const renderParticleEffect = () => {
    switch (type) {
      case 'confetti':
        return <Confetti key="confetti" />;
      case 'hearts':
        return <Hearts key="hearts" />;
      case 'snow':
        return <Snow key="snow" />;
      case 'sparkles':
        return <Sparkles key="sparkles" />;
      case 'comfort_light':
        return <ComfortLight key="comfort_light" />;
      case 'hope_star':
        return <HopeStar key="hope_star" />;
      case 'rain_soft':
        return <RainSoft key="rain_soft" />;
      default:
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
    zIndex: 5, // Above gradient overlay (z-2), below content (z-3)
  },
});

// ⭐ Memoize to prevent unnecessary re-renders
export default React.memo(ParticleEffect, (prevProps, nextProps) => {
  // Only re-render if type or isActive changes
  return prevProps.type === nextProps.type && prevProps.isActive === nextProps.isActive;
});

