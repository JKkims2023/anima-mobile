import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device screen information
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base screen size (design standard) - Based on iPhone X
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Calculate screen ratio
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

/**
 * Calculate responsive width
 * @param {number} size - Base width value
 * @returns {number} - Width adjusted for device
 */
export const horizontalScale = (size) => {
  return Math.round(widthScale * size);
};

/**
 * Calculate responsive height
 * @param {number} size - Base height value
 * @returns {number} - Height adjusted for device
 */
export const verticalScale = (size) => {
  return Math.round(heightScale * size);
};

/**
 * Calculate responsive font size (with limiting factor to prevent excessive scaling)
 * @param {number} size - Base font size
 * @param {number} factor - Adjustment factor (default: 0.5)
 * @returns {number} - Font size adjusted for device
 */
export const moderateScale = (size, factor = 0.5) => {
  const scale = widthScale >= 1 ? widthScale : widthScale + (1 - widthScale) * factor;
  return Math.round(size * scale);
};

/**
 * Get font scale factor based on device information
 * Some Android devices show fonts larger, so apply correction
 */
export const getFontScaleFactor = () => {
  const fontScale = PixelRatio.getFontScale();
  if (Platform.OS === 'android' && fontScale > 1) {
    // Reduce if system font size is large on Android
    return 1 / (fontScale * 0.9);
  }
  return 1;
};

/**
 * Adjust font size for device and platform
 * @param {number} size - Base font size
 * @returns {number} - Adjusted font size
 */
export const adaptiveFontSize = (size) => {
  return Math.round(moderateScale(size) * getFontScaleFactor());
};

/**
 * Check if device screen width is small
 * @returns {boolean} - true if screen width is small
 */
export const isSmallDevice = () => {
  return SCREEN_WIDTH < 375;
};

/**
 * Check if device screen is large
 * @returns {boolean} - true if screen is large
 */
export const isLargeDevice = () => {
  return SCREEN_WIDTH >= 414;
};

/**
 * Font measurement consistency settings
 * @returns {Object} - Settings to solve font scaling issues on Android
 */
export const fontSettings = {
  allowFontScaling: false, // Don't respond to system font size settings
  maxFontSizeMultiplier: 1, // Limit maximum font multiplier
};

/**
 * Provide consistent shadow styles
 * @param {number} elevation - Shadow height
 * @returns {Object} - Shadow style object for platform
 */
export const getShadowStyle = (elevation = 2) => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: 0.1 + elevation * 0.03,
      shadowRadius: elevation * 0.5,
    };
  } else {
    return {
      elevation: elevation,
    };
  }
};


