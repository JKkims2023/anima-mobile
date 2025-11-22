/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 RecommendationBadge Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * SAGE recommendation badge (top-right)
 * - Shows "✨ SAGE 추천" badge
 * - Subtitle text
 * - Fade-in animation
 * - Text shadow for visibility
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale } from '../../utils/responsive-utils';

/**
 * RecommendationBadge Component
 * @param {Object} props
 * @param {string} props.title - Badge title (e.g., "✨ SAGE 추천")
 * @param {string} props.subtitle - Subtitle text
 */
const RecommendationBadge = ({ 
  title = '✨ SAGE 추천', 
  subtitle = '완벽한 페르소나와의 만남, SAGE가 추천합니다' 
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  
  // ✅ Fade-in + Slide-down animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + verticalScale(20),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Title */}
      <Text style={styles.title}>{title}</Text>
      
      {/* Subtitle */}
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: scale(20),
    alignItems: 'flex-end',
    zIndex: 100,
    maxWidth: '60%',
  },
  title: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
    marginBottom: verticalScale(4),
  },
  subtitle: {
    fontSize: scale(12),
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
    textAlign: 'right',
    lineHeight: scale(16),
  },
});

export default RecommendationBadge;

