/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 StatusIndicator Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * AI status indicator with glassmorphism design
 * - Shows AI name and current state
 * - Animated status dot (breathing effect)
 * - Glassmorphism background
 * - State-based colors (greeting/thinking/talking/error)
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale } from '../../utils/responsive-utils';

/**
 * StatusIndicator Component
 * @param {Object} props
 * @param {string} props.name - AI name (e.g., "Manager AI - SAGE", "Sofia")
 * @param {string} props.state - AI state: 'greeting' | 'thinking' | 'talking' | 'error'
 */
const StatusIndicator = ({ name = 'Manager AI - SAGE', state = 'greeting' }) => {
  const insets = useSafeAreaInsets();
  const dotScale = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(0.7)).current;
  
  // ✅ Breathing animation for status dot
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dotScale, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dotScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    
    animation.start();
    
    return () => animation.stop();
  }, [dotScale, dotOpacity]);
  
  // ✅ State-based colors
  const getStateColor = () => {
    switch (state) {
      case 'thinking':
        return '#F59E0B'; // Amber
      case 'talking':
        return '#3B82F6'; // Blue
      case 'error':
        return '#EF4444'; // Red
      default: // greeting
        return '#10B981'; // Green
    }
  };
  
  const getStateText = () => {
    switch (state) {
      case 'thinking':
        return 'Thinking...';
      case 'talking':
        return 'Talking...';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };
  
  return (
    <View style={[styles.container, { top: verticalScale(20) }]}>
      {/* Animated Status Dot */}
      <Animated.View
        style={[
          styles.statusDot,
          {
            backgroundColor: getStateColor(),
            transform: [{ scale: dotScale }],
            opacity: dotOpacity,
            shadowColor: getStateColor(),
          },
        ]}
      />
      
      {/* AI Name */}
      <Text style={[styles.name, { display: state === 'thinking' || state === 'talking' ? 'none' : 'flex' }]}>{name}</Text>
      
      {/* State Text (optional) */}
      {getStateText() && (
        <Text style={styles.stateText}>{getStateText()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(18),
    borderRadius: scale(24),
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // ✅ Stronger background (0.15 → 0.25)
    borderWidth: 1.5, // ✅ Thicker border
    borderColor: 'rgba(255, 255, 255, 0.35)', // ✅ Stronger border (0.2 → 0.35)
    // ✅ Enhanced shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 100,
  },
  statusDot: {
    width: scale(10), // ✅ Slightly larger dot (8 → 10)
    height: scale(10),
    borderRadius: scale(5),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
  },
  name: {
    fontSize: scale(16), // ✅ Larger font (14 → 16)
    fontWeight: '700', // ✅ Bold (500 → 700)
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)', // ✅ Stronger shadow (0.2 → 0.4)
    textShadowOffset: { width: 0, height: 2 }, // ✅ Larger offset (1 → 2)
    textShadowRadius: 4, // ✅ Larger radius (2 → 4)
  },
  stateText: {
    fontSize: scale(13), // ✅ Larger font (12 → 13)
    fontWeight: '600', // ✅ Semi-bold (400 → 600)
    color: 'rgba(255, 255, 255, 0.95)', // ✅ Brighter (0.9 → 0.95)
    textShadowColor: 'rgba(0, 0, 0, 0.4)', // ✅ Stronger shadow (0.2 → 0.4)
    textShadowOffset: { width: 0, height: 2 }, // ✅ Larger offset (1 → 2)
    textShadowRadius: 4, // ✅ Larger radius (2 → 4)
  },
});

export default StatusIndicator;

