/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💙 RelationshipChip Component (살아 숨쉬는 감정 칩)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Animated chip showing persona's feelings
 * - Pulse animation (심장 박동 효과)
 * - Scale animation (등장 애니메이션)
 * - Gradient background
 * - Shimmer loading effect
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-01
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';

/**
 * RelationshipChip Component
 * @param {Object} props
 * @param {string} props.emoji - Chip emoji (icon)
 * @param {string} props.label - Chip label text (now percentage or time)
 * @param {string} props.color - Primary color
 * @param {number} props.pulseSpeed - Pulse animation speed (seconds)
 * @param {number} props.delay - Appear animation delay (ms)
 * @param {boolean} props.isLoading - Show shimmer loading
 * @param {string} props.type - Chip type ('intimacy', 'emotion', 'relationship', 'trust', 'lastInteraction')
 * @param {Function} props.onPress - Callback when chip is pressed
 */
const RelationshipChip = ({ 
  emoji, 
  label, 
  color = '#4285F4', 
  pulseSpeed = 1.5,
  delay = 0,
  isLoading = false,
  type = 'default',
  onPress, // ⭐ NEW: Click handler
}) => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Animation Values
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const pulseAnim = useRef(new Animated.Value(1)).current; // Pulse effect (1.0 → 1.05 → 1.0)
  const appearAnim = useRef(new Animated.Value(0)).current; // Appear animation (opacity)
  const scaleAnim = useRef(new Animated.Value(0.8)).current; // Appear scale
  const shimmerAnim = useRef(new Animated.Value(0)).current; // Shimmer loading
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Start Appear Animation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  useEffect(() => {
    // Sequential appear animation with delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(appearAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, [delay]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Start Pulse Animation (Heartbeat Effect)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  useEffect(() => {
    if (isLoading) return; // No pulse during loading
    
    const pulseDuration = pulseSpeed * 1000; // Convert to ms
    
    const startPulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: pulseDuration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: pulseDuration / 2,
          useNativeDriver: true,
        }),
      ]).start(() => startPulse()); // Loop
    };
    
    // Start pulse after appear animation
    setTimeout(() => {
      startPulse();
    }, delay + 400);
    
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [pulseSpeed, isLoading, delay]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Start Shimmer Animation (Loading State)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  useEffect(() => {
    if (!isLoading) return;
    
    const startShimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => startShimmer());
    };
    
    startShimmer();
    
    return () => {
      shimmerAnim.stopAnimation();
    };
  }, [isLoading]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // Combined transform for pulse + appear
  const animatedStyle = {
    opacity: appearAnim,
    transform: [
      { scale: Animated.multiply(scaleAnim, pulseAnim) },
    ],
  };
  
  // Shimmer position
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });
  
  return (
    <Animated.View style={[styles.chipContainer, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress || isLoading}
      >
        <LinearGradient
          colors={[
            `${color}30`, // 30% opacity
            `${color}20`, // 20% opacity
            `${color}30`, // 30% opacity
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {/* Shimmer Overlay (Loading State) */}
          {isLoading && (
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0)',
                  'rgba(255, 255, 255, 0.3)',
                  'rgba(255, 255, 255, 0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          )}
          
          {/* Content - Vertical Layout (Icon on top, value below) */}
          <View style={styles.content}>
            {/* Emoji/Icon */}
            <CustomText style={styles.emoji}>
              {emoji}
            </CustomText>
            
            {/* Label (Percentage or Time) */}
            <CustomText type="small" bold style={[styles.label, { color }]}>
              {label}
            </CustomText>
          </View>
          
          {/* Border Highlight */}
          <View style={[styles.border, { borderColor: `${color}50` }]} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chipContainer: {
    // Container for animation
    flex:1
  },
  gradient: {
    // ⭐ NEW: Vertical layout (icon on top, value below)
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(14),
    overflow: 'hidden',
    minWidth: scale(57), // Ensure consistent width
    // Shadow
    backgroundColor: 'rgba(5, 16, 83, 0.8)',

  },
  content: {
    // ⭐ NEW: Vertical layout
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(0),
    zIndex: 2, // Above shimmer
    backgroundColor: 'transparent',

  },
  emoji: {
    fontSize: scale(20), // ⭐ Larger icon
    lineHeight: scale(24),
    marginBottom: verticalScale(4),
  },
  label: {
    fontSize: scale(11), // ⭐ Slightly smaller for numbers
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: scale(12),
    zIndex: 1, // Below content, above shimmer
  },
  shimmerOverlay: {

    position: 'absolute',
    top: 0,
    left: -100,
    right: -100,
    bottom: 0,
    zIndex: 0, // Behind everything
  },
  shimmerGradient: {
    flex: 1,
  },
});

export default RelationshipChip;

