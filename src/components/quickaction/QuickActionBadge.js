/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏷️ QuickActionBadge Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Badge component for Quick Action Chips
 * - NEW badge (red gradient)
 * - COUNT badge (number)
 * - Pulse animation
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { scale } from '../../utils/responsive-utils';

const QuickActionBadge = ({ type = 'NEW', count = 0 }) => {
  const pulseScale = useSharedValue(1);
  
  // ✅ Pulse animation
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite
      false
    );
  }, [pulseScale]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  
  // ✅ NEW badge
  if (type === 'NEW') {
    return (
      <Animated.View style={[styles.badge, styles.newBadge, animatedStyle]}>
        <Text style={styles.newText}>NEW</Text>
      </Animated.View>
    );
  }
  
  // ✅ COUNT badge
  if (type === 'COUNT' && count > 0) {
    return (
      <Animated.View style={[styles.badge, styles.countBadge, animatedStyle]}>
        <Text style={styles.countText}>{count > 99 ? '99+' : count}</Text>
      </Animated.View>
    );
  }
  
  return null;
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: scale(-6),
    right: scale(-6),
    minWidth: scale(22),
    minHeight: scale(22),
    borderRadius: scale(11),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    // Shadow for visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  newBadge: {
    backgroundColor: '#EF4444', // Red
    paddingHorizontal: scale(6),
  },
  countBadge: {
    backgroundColor: '#EF4444', // Red
    paddingHorizontal: scale(4),
  },
  newText: {
    color: '#FFFFFF',
    fontSize: scale(9),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: scale(10),
    fontWeight: '700',
  },
});

export default QuickActionBadge;

