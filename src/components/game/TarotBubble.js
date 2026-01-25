/**
 * 🔮 TarotBubble - Tarot Chat Bubble Component
 * 
 * Features:
 * - Left bubble (Persona)
 * - Right bubble (User)
 * - Fade in/out animation
 * - PersonaThoughtBubble style
 * 
 * @author JK & Hero NEXUS
 * @date 2026-01-23
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';

/**
 * TarotBubble Component
 * 
 * @param {string} position - 'left' | 'right'
 * @param {string} message - Message text
 * @param {boolean} visible - Show/hide
 */
const TarotBubble = ({ 
  position = 'left', 
  message = '', 
  visible = false 
}) => {
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  
  // Fade in/out animation
  useEffect(() => {
    if (visible && message) {
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, message]);
  
  if (!message) return null;
  
  const isLeft = position === 'left';
  
  return (
    <Animated.View 
      style={[
        styles.container,
        isLeft ? styles.leftContainer : styles.rightContainer,
        { opacity: bubbleOpacity }
      ]}
    >
      {/* Bubble Wrapper */}
      <View style={styles.bubbleWrapper}>
        {/* Main Bubble */}
        <View style={[
          styles.mainBubble,
          isLeft ? styles.leftBubble : styles.rightBubble
        ]}>
          {/* Text Container */}
          <View style={styles.textContainer}>
            <CustomText 
              type="small" 
              style={styles.bubbleText}
              numberOfLines={3}
            >
              {message}
            </CustomText>
          </View>
        </View>
        
        {/* Tail Bubbles */}
        {isLeft ? (
          <>
            <View style={[styles.tailBubble1, styles.leftTail1]} />
            <View style={[styles.tailBubble2, styles.leftTail2]} />
          </>
        ) : (
          <>
            <View style={[styles.tailBubble1, styles.rightTail1]} />
            <View style={[styles.tailBubble2, styles.rightTail2]} />
          </>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // ═══════════════════════════════════════════════════════════════════════════
  // Container
  // ═══════════════════════════════════════════════════════════════════════════
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? verticalScale(120) : verticalScale(80),
    zIndex: 100,
  },
  
  leftContainer: {
    left: scale(15),
  },
  
  rightContainer: {
    right: scale(15),
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Bubble Wrapper
  // ═══════════════════════════════════════════════════════════════════════════
  bubbleWrapper: {
    position: 'relative',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Main Bubble (100% PersonaThoughtBubble 스타일)
  // ═══════════════════════════════════════════════════════════════════════════
  mainBubble: {
    width: scale(120), // Fixed width like PersonaThoughtBubble
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // Exact same
    borderRadius: scale(20), // Exact same
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: Platform.OS === 'ios' ? scale(10) : scale(10),
    paddingVertical: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  leftBubble: {
    // Persona - same as PersonaThoughtBubble
  },
  
  rightBubble: {
    // User - slight variation
    backgroundColor: 'rgba(66, 133, 244, 0.65)',
  },
  
  textContainer: {
    padding: scale(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  bubbleText: {
    fontSize: scale(14), // Exact same as PersonaThoughtBubble
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: scale(20), // Exact same
    fontWeight: '500',
    fontStyle: 'italic', // Exact same
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Tail Bubbles (100% PersonaThoughtBubble 스타일)
  // ═══════════════════════════════════════════════════════════════════════════
  tailBubble1: {
    position: 'absolute',
    bottom: verticalScale(-10), // Exact same
    width: scale(12), // Exact same
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  tailBubble2: {
    position: 'absolute',
    bottom: verticalScale(-18), // Exact same
    width: scale(8), // Exact same
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Left tail (Persona) - like PersonaThoughtBubble (right side)
  leftTail1: {
    right: scale(15), // Exact same as PersonaThoughtBubble
  },
  
  leftTail2: {
    right: scale(8), // Exact same as PersonaThoughtBubble
  },
  
  // Right tail (User) - mirror for user side
  rightTail1: {
    left: scale(15),
    backgroundColor: 'rgba(66, 133, 244, 0.65)',
  },
  
  rightTail2: {
    left: scale(8),
    backgroundColor: 'rgba(66, 133, 244, 0.65)',
  },
});

export default TarotBubble;
