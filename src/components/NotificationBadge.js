/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 NotificationBadge Component (악마의 디테일!)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Red circular badge with 'N' text for new notifications
 * Usage: Overlay on QuickActionChip (History chip)
 * 
 * Features:
 * - Red circular background
 * - White 'N' text (New!)
 * - Position: absolute (top-right corner)
 * - Scale animation for attention
 * - Shadow for depth
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-04
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import CustomText from './CustomText';
import { scale } from '../utils/responsive-utils';

const NotificationBadge = ({ visible = true }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ⭐ Mount animation (scale up)
  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // ⭐ Continuous pulse animation for attention
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => {
        pulse.stop();
      };
    } else {
      // ⭐ Unmount animation (scale down)
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
        },
      ]}
    >
      <CustomText type="small" bold style={styles.badgeText}>
        N
      </CustomText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -scale(4),
    right: -scale(4),
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: '#FF3B30', // ⭐ iOS Red (vibrant!)
    justifyContent: 'center',
    alignItems: 'center',
    // ⭐ Border for better visibility
    borderWidth: 2,
    borderColor: '#FFFFFF',
    // ⭐ Shadow for depth
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 8,
    // ⭐ Ensure badge is above everything
    zIndex: 1000,
  },
  badgeText: {
    fontSize: scale(10),
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: scale(12),
    textAlign: 'center',
  },
});

export default NotificationBadge;

