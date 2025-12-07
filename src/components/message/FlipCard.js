/**
 * 🎴 FlipCard Component
 * 
 * 180° flip animation for message front/back view
 * - Front: Message content
 * - Back: Reply list
 * 
 * Uses react-native-reanimated for smooth 3D rotation
 * 
 * @author JK & Hero Nexus AI
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

/**
 * FlipCard Component
 */
const FlipCard = ({ 
  isFlipped, 
  front, 
  back, 
  style = {} 
}) => {
  // ✅ Flip rotation value (0 = front, 1 = back)
  const flipRotation = useSharedValue(0);

  // Update rotation when isFlipped changes
  React.useEffect(() => {
    flipRotation.value = withTiming(isFlipped ? 1 : 0, {
      duration: 500,
    });
  }, [isFlipped]);

  // ✅ Front card animated style
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipRotation.value,
      [0, 1],
      [0, 180]
    );

    const opacity = interpolate(
      flipRotation.value,
      [0, 0.5, 1],
      [1, 0, 0]
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  // ✅ Back card animated style
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipRotation.value,
      [0, 1],
      [-180, 0]
    );

    const opacity = interpolate(
      flipRotation.value,
      [0, 0.5, 1],
      [0, 0, 1]
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  return (
    <>
      {/* Front (메시지) */}
      <Animated.View style={[styles.card, style, frontAnimatedStyle]}>
        {front}
      </Animated.View>

      {/* Back (댓글) */}
      <Animated.View style={[styles.card, styles.cardBack, style, backAnimatedStyle]}>
        {back}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardBack: {
    // Back card is positioned behind front
  },
});

export default FlipCard;

