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
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ⭐ NEW: SafeArea
import { BlurView } from '@react-native-community/blur'; // ⭐ For iOS blur
import Svg, { Path, Defs, Mask, Rect, G, ClipPath } from 'react-native-svg';
import { scale, verticalScale } from '../utils/responsive-utils';
import Icon from 'react-native-vector-icons/Ionicons';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView); // ⭐ NEW: Animated BlurView

const SlideMenu = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets(); // ⭐ SafeArea for status bar
  
  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATION
  // ═══════════════════════════════════════════════════════════════════════
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current; // ⭐ Start off-screen (RIGHT)
  const backdropOpacity = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    if (visible) {
      // ⭐ Open: right → left
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
      // ⭐ Close: left → right
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: SCREEN_WIDTH, // ⭐ Slide off-screen (RIGHT)
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

  if (!visible && translateX._value === SCREEN_WIDTH) {
    // Don't render when completely closed
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SVG CURVE PATH (⭐ REVISED: Full screen coverage)
  // ⭐ Cover from status bar (0,0) to bottom
  // ═══════════════════════════════════════════════════════════════════════
  // Curve from top-left (0, 0) to bottom-right (25% from left, bottom)
  const svgHeight = SCREEN_HEIGHT; // ⭐ Full screen height (no SafeArea adjustment)
  const menuStartX = SCREEN_WIDTH * 0.25; // ⭐ Menu starts at 25% from left
  const curveControlX1 = SCREEN_WIDTH * 0.55; // ⭐ First control point X
  const curveControlY1 = svgHeight * 0.55; // ⭐ First control point Y
  const curveControlX2 = SCREEN_WIDTH * 0.75; // ⭐ Second control point X
  const curveControlY2 = svgHeight * 0.75; // ⭐ Second control point Y
  const curveEndX = menuStartX; // ⭐ End at menu start X
  const curveEndY = svgHeight * 1.25; // ⭐ End at bottom
  
  // ⭐ Smooth S-curve path (Cubic Bezier)
  // M: Move to start point (top-left)
  // C: Cubic bezier curve (CP1, CP2, end point)
  // L: Line to (right edge, then back to top)
  // Z: Close path
  const curvePath = `
    M 0 0
    C ${curveControlX1} ${curveControlY1}, ${curveControlX2} ${curveControlY2}, ${curveEndX} ${curveEndY}
    L ${SCREEN_WIDTH} ${svgHeight}
    L ${SCREEN_WIDTH} 0
    Z
  `;

  // ═══════════════════════════════════════════════════════════════════════════
// STYLES (⭐ Full screen coverage - cover status bar & header)
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0, // ⭐ Cover from top (status bar)
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
      zIndex: 9998,
    },
    container: {
      position: 'absolute',
      top: 0, // ⭐ Cover from top (status bar)
      left: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT, // ⭐ Full screen height (no SafeArea)
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
      // ⭐ top is set dynamically with SafeAreaInsets in JSX
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
      // ⭐ paddingTop will be set dynamically in JSX (SafeArea + close button space)
      paddingHorizontal: scale(20),
      // Menu content will be styled here
    },
  });


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
      {/* ⭐ Full screen coverage (no paddingTop - cover header) */}
      <Animated.View
        style={[
          styles.container,
          {
            // ⭐ No paddingTop - start from 0,0 to cover header
            transform: [{ translateX }],
          },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        {/* ═════════════════════════════════════════════════════════════ */}
        {/* CURVED BACKGROUND (SVG) */}
        {/* ⭐ Full screen coverage */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <View style={styles.backgroundContainer}>
          <Svg
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT} // ⭐ Full screen (cover header)
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
            <Defs>
              {/* ⭐ NEW: ClipPath for iOS BlurView */}
              <ClipPath id="curveClip">
                <Path d={curvePath} />
              </ClipPath>
            </Defs>
            
            <G mask="url(#curveMask)">
              {/* Solid background (right side - menu area) */}
              <Rect
                x={menuStartX}
                y={0}
                width={SCREEN_WIDTH - menuStartX}
                height={svgHeight} // ⭐ SafeArea adjusted
                fill="#0F172A" // ⭐ Same as PersonaStudioScreen
                opacity={1}
              />
              
              {/* Semi-transparent background (left side - blur area) */}
              {/* ⭐ Version B: Semi-transparent (for both platforms) */}
              <Rect
                x={0}
                y={0}
                width={menuStartX}
                height={svgHeight} // ⭐ SafeArea adjusted
                fill="#0F172A"
                opacity={1} // ⭐ 85% opacity for semi-transparent effect (B)
              />
            </G>

          </Svg>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ⭐ REMOVED: BlurView (conflicted with SVG mask on iOS) */}
          {/* Will use different approach for blur effect later */}
          {/* ═════════════════════════════════════════════════════════════ */}
        </View>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* CLOSE BUTTON (Top Right) */}
        {/* ⭐ SafeArea aware */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <TouchableOpacity
          style={[
            styles.closeButton,
            {
              top: insets.top + verticalScale(10), // ⭐ Below status bar
            },
          ]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Icon name="close" size={scale(28)} color="#FFFFFF" />
        </TouchableOpacity>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* MENU CONTENT (TO BE ADDED) */}
        {/* ⭐ SafeArea aware paddingTop */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <View 
          style={[
            styles.contentContainer,
            {
              paddingTop: insets.top + verticalScale(70), // ⭐ SafeArea + close button space
            },
          ]}
        >
          {/* Menu items will be added here */}
        </View>
      </Animated.View>
    </>
  );
};



export default SlideMenu;

