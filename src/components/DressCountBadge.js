/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🦄 DressCountBadge Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dress count badge with rotation animation for creating state
 * 
 * Features:
 * - Shows dress count number
 * - Rotates when dress is being created (done_yn === 'N')
 * - Smooth animations with Reanimated
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-04
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import CustomText from './CustomText';
import { scale } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

const DressCountBadge = ({ count = 0, isRotating = false }) => {
  const rotationAnim = useSharedValue(0);

  useEffect(() => {
    if (isRotating) {
      // Start continuous rotation
      rotationAnim.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1, // Infinite loop
        false
      );
    } else {
      // Stop rotation smoothly (reset to 0)
      rotationAnim.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    }
  }, [isRotating, rotationAnim]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationAnim.value}deg` }]
  }));

  // Don't render if count is 0
  if (count === 0) return null;

  return (
    <Animated.View style={[styles.badgeContainer, rotationStyle]}>
      <CustomText style={styles.badgeText}>{count}</CustomText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    top: -scale(5),
    right: -scale(5),
    backgroundColor: '#A78BFA', // 🦄 라벤더 (드레스 테마 컬러)
    borderRadius: scale(10),
    minWidth: scale(20),
    height: scale(20),
    paddingHorizontal: scale(4),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: scale(11),
    fontWeight: 'bold',
    lineHeight: scale(13),
  },
});

export default React.memo(DressCountBadge);

