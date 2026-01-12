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
 * @param {string} props.label - Chip label text (now percentage or time) - null for emotion chip
 * @param {string} props.color - Primary color
 * @param {number} props.pulseSpeed - Pulse animation speed (seconds)
 * @param {number} props.delay - Appear animation delay (ms)
 * @param {boolean} props.isLoading - Show shimmer loading
 * @param {string} props.type - Chip type ('intimacy', 'emotion', 'relationship', 'trust', 'lastInteraction')
 * @param {Function} props.onPress - Callback when chip is pressed
 * @param {boolean} props.isEmotionChip - Special flag for emotion chip (larger, animated, no label)
 * @param {boolean} props.isFocused - Screen focus state (for animation control)
 * @param {Function} props.onLayout - Callback for chip layout (for positioning floating effect)
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
  isEmotionChip = false, // ⭐ NEW: Emotion chip flag
  isFocused = true, // ⭐ NEW: Focus state
  onLayout, // ⭐ NEW: Layout callback
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
  // Start Pulse Animation (Heartbeat Effect) - ⭐ Focus-aware!
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  useEffect(() => {
    if (isLoading || !isFocused) {
      // ⚠️ Stop animation when loading or not focused (battery optimization!)
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1.0); // Reset to normal size
      return;
    }
    
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
      ]).start(() => {
        // ⭐ Only loop if still focused
        if (isFocused) {
          startPulse();
        }
      });
    };
    
    // Start pulse after appear animation
    const timer = setTimeout(() => {
      if (isFocused) {
        startPulse();
      }
    }, delay + 400);
    
    return () => {
      clearTimeout(timer);
      pulseAnim.stopAnimation();
    };
  }, [pulseSpeed, isLoading, delay, isFocused]); // ⭐ Add isFocused dependency
  
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
    <View 
      style={[styles.chipContainer]}
      onLayout={onLayout} // ⭐ NEW: Report layout to parent
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress || isLoading}
      >
        
        <View
          colors={[
            `${color}30`, // 30% opacity
            `${color}20`, // 20% opacity
            `${color}30`, // 30% opacity
          ]}
         
          style={[styles.gradient, { }]}
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
  
            {/* Emoji/Icon */}
            <CustomText style={[
              styles.emoji, 
              isEmotionChip && styles.emotionEmoji // ⭐ Larger for emotion chip
            ]}>
              {emoji}
            </CustomText>
            
            {/* Label (Percentage or Time) - Hide if null (emotion chip) */}
            {label && (
              <CustomText type="small" bold style={[styles.label, { color }]}>
                {label}
              </CustomText>
            )}

            
          {/* Border Highlight */}
          <View style={[styles.border, { borderColor: `${color}50` }]} />
        </View>
      </TouchableOpacity>
    </View>
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
    paddingVertical: verticalScale(12), // ⭐ Increased from 8 to 12 for better emoji visibility
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
  emotionEmoji: {
    // ⭐ NEW: Emotion chip emoji (1.5x larger!)
    fontSize: scale(32), // 20 * 1.6 = 32
    lineHeight: scale(46),
    marginBottom: 0, // No label below, so no margin
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

