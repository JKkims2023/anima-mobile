/**
 * ANIMA Safe Area Utilities
 * 
 * Cross-platform safe area helpers for Android & iOS
 * - Handles notches, punch-holes, display cutouts
 * - Supports gesture navigation bars
 * - Works with foldable devices
 * 
 * Based on react-native-safe-area-context 5.6.2+
 * Compatible with React Native 0.79+
 * 
 * Created by JK & Hero AI
 */

import { Platform } from 'react-native';

/**
 * Get safe padding style for a specific edge
 * @param {Object} insets - Safe area insets from useSafeAreaInsets()
 * @param {('top'|'bottom'|'left'|'right')} edge - Edge to apply padding
 * @param {number} minValue - Minimum padding value (default: 0)
 * @returns {Object} - Style object with padding
 * 
 * @example
 * const insets = useSafeAreaInsets();
 * const style = getSafePadding(insets, 'top', 20); // At least 20px
 */
export const getSafePadding = (insets, edge, minValue = 0) => {
  const value = Math.max(insets[edge] || 0, minValue);
  return {
    [`padding${edge.charAt(0).toUpperCase() + edge.slice(1)}`]: value,
  };
};

/**
 * Get safe padding style for multiple edges
 * @param {Object} insets - Safe area insets
 * @param {Object} edges - Object with edge: minValue pairs
 * @returns {Object} - Style object with multiple paddings
 * 
 * @example
 * const style = getSafeMultiPadding(insets, { top: 20, bottom: 10 });
 */
export const getSafeMultiPadding = (insets, edges = {}) => {
  const style = {};
  Object.entries(edges).forEach(([edge, minValue]) => {
    const value = Math.max(insets[edge] || 0, minValue);
    style[`padding${edge.charAt(0).toUpperCase() + edge.slice(1)}`] = value;
  });
  return style;
};

/**
 * Get safe area insets with fallback values
 * Useful for preventing layout shift during initial render
 * 
 * @param {Object} insets - Safe area insets (may be undefined initially)
 * @param {Object} fallback - Fallback insets
 * @returns {Object} - Insets object
 * 
 * @example
 * const insets = getSafeInsets(useSafeAreaInsets(), { top: 40, bottom: 20 });
 */
export const getSafeInsets = (insets, fallback = {}) => {
  if (!insets) {
    return {
      top: fallback.top || 0,
      bottom: fallback.bottom || 0,
      left: fallback.left || 0,
      right: fallback.right || 0,
    };
  }
  return insets;
};

/**
 * Check if device has notch or display cutout
 * @param {Object} insets - Safe area insets
 * @returns {boolean}
 * 
 * @example
 * const hasNotch = hasDisplayCutout(insets);
 */
export const hasDisplayCutout = (insets) => {
  if (!insets) return false;
  
  // If top inset is significantly larger than status bar height
  // it likely has a notch/punch-hole
  const statusBarHeight = Platform.OS === 'android' ? 24 : 20;
  return insets.top > statusBarHeight + 10;
};

/**
 * Check if device uses gesture navigation (bottom home indicator)
 * @param {Object} insets - Safe area insets
 * @returns {boolean}
 * 
 * @example
 * const hasGestures = hasGestureNavigation(insets);
 */
export const hasGestureNavigation = (insets) => {
  if (!insets) return false;
  
  // iOS: home indicator is ~34px
  // Android: gesture bar is ~24px
  return insets.bottom > 20;
};

/**
 * Get safe area edge values for use in styles
 * @param {Object} insets - Safe area insets
 * @returns {Object} - Object with top, bottom, left, right values
 * 
 * @example
 * const edges = getSafeEdges(insets);
 * <View style={{ marginTop: edges.top }} />
 */
export const getSafeEdges = (insets) => {
  return {
    top: insets?.top || 0,
    bottom: insets?.bottom || 0,
    left: insets?.left || 0,
    right: insets?.right || 0,
  };
};

/**
 * Get minimum safe area based on platform
 * Useful for development/testing when safe area context is not available
 * 
 * @returns {Object} - Minimum safe area insets
 */
export const getMinimumSafeArea = () => {
  return Platform.select({
    ios: {
      top: 47, // Status bar + notch
      bottom: 34, // Home indicator
      left: 0,
      right: 0,
    },
    android: {
      top: 24, // Status bar
      bottom: 24, // Gesture bar
      left: 0,
      right: 0,
    },
    default: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  });
};

/**
 * Get safe area style for absolute positioned elements
 * @param {Object} insets - Safe area insets
 * @param {('top'|'bottom'|'left'|'right')} position - Position edge
 * @param {number} offset - Additional offset
 * @returns {Object} - Style object
 * 
 * @example
 * const style = getSafeAbsolutePosition(insets, 'top', 20);
 * <View style={[{ position: 'absolute' }, style]} />
 */
export const getSafeAbsolutePosition = (insets, position, offset = 0) => {
  const value = (insets?.[position] || 0) + offset;
  return { [position]: value };
};

/**
 * Calculate content height considering safe areas
 * @param {number} screenHeight - Screen height
 * @param {Object} insets - Safe area insets
 * @param {number} additionalOffset - Additional offset (e.g., header height)
 * @returns {number} - Available content height
 * 
 * @example
 * const contentHeight = getSafeContentHeight(Dimensions.get('window').height, insets, 60);
 */
export const getSafeContentHeight = (screenHeight, insets, additionalOffset = 0) => {
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  return screenHeight - top - bottom - additionalOffset;
};

/**
 * Log safe area insets for debugging
 * @param {Object} insets - Safe area insets
 * @param {string} label - Label for the log
 */
export const logSafeArea = (insets, label = 'Safe Area') => {
  if (__DEV__) {
    console.log(`📱 ${label}:`, {
      platform: Platform.OS,
      top: insets?.top || 0,
      bottom: insets?.bottom || 0,
      left: insets?.left || 0,
      right: insets?.right || 0,
      hasNotch: hasDisplayCutout(insets),
      hasGestures: hasGestureNavigation(insets),
    });
  }
};

