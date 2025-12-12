/**
 * ❄️ Snow / Sakura / Leaves / Beer Bottles Particle Effect
 * 
 * Gentle particles falling from top
 * Supports multiple variants:
 * - snow: White snowflakes ❄️
 * - sakura: Pink cherry blossoms 🌸
 * - leaves: Orange/brown autumn leaves 🍂
 * - beer_bottles: Beer bottles & drinks 🍺🍻🍾🍷 (emoji)
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Variant configurations
const VARIANTS = {
  snow: {
    icon: 'snowflake',
    color: '#FFFFFF',
    useEmoji: false,
  },
  sakura: {
    icon: 'flower',
    color: '#FFB7C5', // Pink cherry blossom
    useEmoji: false,
  },
  leaves: {
    icon: 'leaf',
    color: '#D2691E', // Chocolate brown / autumn orange
    useEmoji: false,
  },
  beer_bottles: {
    emojis: ['🍺', '🍻', '🍾', '🍷', '🥂', '🍶'], // ⭐ Beer, wine, sake, champagne
    useEmoji: true,
  },
};

// Single particle (snowflake / sakura / leaf / emoji)
const Snowflake = ({ delay = 0, startX, size, icon, color, emoji, useEmoji = false }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    // Fall down slowly
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + 50, {
          duration: 5000 + Math.random() * 3000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Drift left/right
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.random() * 50 - 25, {
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    // Rotate slowly
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, {
          duration: 4000 + Math.random() * 2000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.snowflakeContainer,
        animatedStyle,
        {
          left: startX,
        },
      ]}
    >
      {useEmoji ? (
        <Text style={{ fontSize: size }}>
          {emoji}
        </Text>
      ) : (
        <Icon name={icon} size={size} color={color} />
      )}
    </Animated.View>
  );
};

// Main Snow component
const Snow = ({ variant = 'snow' }) => {
  const config = VARIANTS[variant] || VARIANTS.snow;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❄️ [Snow] Rendering with variant:', variant);
  console.log('  - useEmoji:', config.useEmoji);
  if (config.useEmoji) {
    console.log('  - emojis:', config.emojis);
  } else {
    console.log('  - icon:', config.icon);
    console.log('  - color:', config.color);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Generate 25 particles (or 30 for beer bottles for more festive effect)
  const particleCount = config.useEmoji ? 30 : 25;
  const particles = Array.from({ length: particleCount }, (_, i) => {
    // For emoji variants, randomly select an emoji for each particle
    const emoji = config.useEmoji 
      ? config.emojis[Math.floor(Math.random() * config.emojis.length)]
      : null;
    
    return {
      key: i,
      delay: Math.random() * 4000,
      startX: Math.random() * SCREEN_WIDTH,
      size: config.useEmoji ? (25 + Math.random() * 15) : (15 + Math.random() * 10), // Larger for emojis
      emoji,
    };
  });

  return (
    <View style={styles.container}>
      {particles.map((particle) => (
        <Snowflake
          key={particle.key}
          delay={particle.delay}
          startX={particle.startX}
          size={particle.size}
          icon={config.icon}
          color={config.color}
          emoji={particle.emoji}
          useEmoji={config.useEmoji}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  snowflakeContainer: {
    position: 'absolute',
  },
});

export default Snow;

