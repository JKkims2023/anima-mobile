/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 SlideMenu - Curved Slide Menu with Blur Effect
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Beautiful S-curve from top-left to bottom-right
 * - Blur effect on left side (transparent)
 * - Solid background on right side (menu area)
 * - Smooth slide animation (left → right open, right → left close)
 * - No visual inconsistency with PersonaStudioScreen
 * 
 * Design:
 * - Curve: Cubic Bezier (smooth S-curve)
 * - Left side: Blur effect (C) → Semi-transparent (B) for testing
 * - Background: #0F172A (same as PersonaStudioScreen)
 * - Animation: translateX
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-06
 */

import React, { useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur'; // ⭐ For iOS blur
import Svg, { Path, Defs, Mask, Rect, G } from 'react-native-svg';
import { scale, verticalScale } from '../utils/responsive-utils';
import Icon from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SlideMenu = ({ visible, onClose }) => {
  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATION
  // ═══════════════════════════════════════════════════════════════════════
  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current; // Start off-screen (left)
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Open: left → right
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0, // Slide to visible position
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close: right → left
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: -SCREEN_WIDTH, // Slide off-screen (left)
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && translateX._value === -SCREEN_WIDTH) {
    // Don't render when completely closed
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SVG CURVE PATH
  // ═══════════════════════════════════════════════════════════════════════
  // Curve from top-left (0, 0) to bottom-right (40% from right, bottom)
  const curveWidth = SCREEN_WIDTH * 0.8; // 80% of screen width for menu
  const curveEndX = SCREEN_WIDTH * 0.6; // 60% from left (40% from right)
  
  // S-curve path (Cubic Bezier)
  // M: Move to start point
  // C: Cubic bezier curve (control point 1, control point 2, end point)
  // L: Line to
  const curvePath = `
    M 0 0
    C ${curveWidth * 0.3} ${SCREEN_HEIGHT * 0.2}, ${curveWidth * 0.5} ${SCREEN_HEIGHT * 0.6}, ${curveEndX} ${SCREEN_HEIGHT}
    L ${SCREEN_WIDTH} ${SCREEN_HEIGHT}
    L ${SCREEN_WIDTH} 0
    Z
  `;

  return (
    <>
      {/* Backdrop (for closing on outside click) */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
            pointerEvents: visible ? 'auto' : 'none',
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Slide Menu Container */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateX }],
          },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        {/* ═════════════════════════════════════════════════════════════ */}
        {/* CURVED BACKGROUND (SVG) */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <View style={styles.backgroundContainer}>
          <Svg
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            style={StyleSheet.absoluteFillObject}
          >
            <Defs>
              {/* Curve mask */}
              <Mask id="curveMask">
                <Path
                  d={curvePath}
                  fill="white" // White = visible area in mask
                />
              </Mask>
            </Defs>

            {/* Background (masked by curve) */}
            <G mask="url(#curveMask)">
              {/* Solid background (right side - menu area) */}
              <Rect
                x={curveEndX}
                y={0}
                width={SCREEN_WIDTH - curveEndX}
                height={SCREEN_HEIGHT}
                fill="#0F172A" // ⭐ Same as PersonaStudioScreen
                opacity={1}
              />
              
              {/* Semi-transparent background (left side - blur area) */}
              {/* ⭐ Version C: Blur (will be replaced with BlurView below) */}
              {/* ⭐ Version B: Semi-transparent (for testing) */}
              <Rect
                x={0}
                y={0}
                width={curveEndX}
                height={SCREEN_HEIGHT}
                fill="#0F172A"
                opacity={0.85} // ⭐ 85% opacity for semi-transparent effect (B)
              />
            </G>

            {/* Curve border (optional, for visual guide) */}
            <Path
              d={curvePath}
              fill="none"
              stroke="rgba(96, 165, 250, 0.3)" // ANIMA blue border
              strokeWidth={2}
            />
          </Svg>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* BLUR EFFECT (LEFT SIDE) - iOS only for now */}
          {/* ⭐ Version C: Blur effect */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {Platform.OS === 'ios' && (
            <BlurView
              style={[
                styles.blurContainer,
                {
                  width: curveEndX,
                },
              ]}
              blurType="dark" // Dark blur
              blurAmount={30} // Blur intensity
              reducedTransparencyFallbackColor="#0F172A"
            />
          )}
        </View>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* CLOSE BUTTON (Top Right) */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Icon name="close" size={scale(28)} color="#FFFFFF" />
        </TouchableOpacity>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* MENU CONTENT (TO BE ADDED) */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <View style={styles.contentContainer}>
          {/* Menu items will be added here */}
        </View>
      </Animated.View>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
    zIndex: 9998,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 9999,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: SCREEN_HEIGHT,
    // Width is set dynamically based on curve
  },
  closeButton: {
    position: 'absolute',
    top: verticalScale(60), // Below status bar
    right: scale(20),
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  contentContainer: {
    flex: 1,
    paddingTop: verticalScale(120), // Below close button
    paddingHorizontal: scale(20),
    // Menu content will be styled here
  },
});

export default SlideMenu;

