/**
 * ❄️ Snow Particle Effect
 * 
 * Gentle snowflakes falling from top
 * Perfect for winter and peaceful messages
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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

// Single snowflake
const Snowflake = ({ delay = 0, startX, size }) => {
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
      <Icon name="snowflake" size={size} color="#FFFFFF" />
    </Animated.View>
  );
};

// Main Snow component
const Snow = () => {
  // Generate 25 snowflakes
  const snowflakes = Array.from({ length: 25 }, (_, i) => ({
    key: i,
    delay: Math.random() * 4000,
    startX: Math.random() * SCREEN_WIDTH,
    size: 15 + Math.random() * 10,
  }));

  return (
    <View style={styles.container}>
      {snowflakes.map((snowflake) => (
        <Snowflake
          key={snowflake.key}
          delay={snowflake.delay}
          startX={snowflake.startX}
          size={snowflake.size}
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

