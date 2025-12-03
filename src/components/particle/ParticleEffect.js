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
        return <Confetti />;
      case 'hearts':
        return <Hearts />;
      case 'snow':
        return <Snow />;
      case 'sparkles':
        return <Sparkles />;
      case 'comfort_light':
        return <ComfortLight />;
      case 'hope_star':
        return <HopeStar />;
      case 'rain_soft':
        return <RainSoft />;
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

export default ParticleEffect;

