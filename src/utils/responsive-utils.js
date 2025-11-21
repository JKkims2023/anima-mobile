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
 * ✅ Android font size adjustment factor
 * Android tends to render fonts slightly larger than iOS
 * Applying 0.95 factor ensures visual consistency across platforms
 */
const ANDROID_FONT_ADJUSTMENT = 0.95;

/**
 * Calculate responsive width
 * @param {number} size - Base width value
 * @returns {number} - Width adjusted for device
 */
export const horizontalScale = (size) => {
  return Math.round(widthScale * size);
};

/**
 * Alias for horizontalScale (commonly used as 'scale')
 * @param {number} size - Base width value
 * @returns {number} - Width adjusted for device
 */
export const scale = horizontalScale;

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
 * ✅ Platform-aware: Android fonts are adjusted by 0.95 factor
 * @param {number} size - Base font size
 * @param {number} factor - Adjustment factor (default: 0.5)
 * @returns {number} - Font size adjusted for device and platform
 */
export const moderateScale = (size, factor = 0.5) => {
  const scale = widthScale >= 1 ? widthScale : widthScale + (1 - widthScale) * factor;
  const scaledSize = size * scale;
  
  // ✅ Apply Android font adjustment for consistency
  if (Platform.OS === 'android') {
    return Math.round(scaledSize * ANDROID_FONT_ADJUSTMENT);
  }
  
  return Math.round(scaledSize);
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

/**
 * Platform-aware spacing utility
 * Android needs slightly more generous spacing than iOS
 * @param {number} size - Base spacing value
 * @returns {number} - Platform-adjusted spacing
 */
export const platformSpacing = (size) => {
  if (Platform.OS === 'android') {
    // Android: 2% increase (fine-tuning for rendering engine differences)
    return Math.round(moderateScale(size) * 1.02);
  }
  return moderateScale(size);
};

/**
 * Platform-aware padding utility
 * @param {number} size - Base padding value
 * @returns {number} - Platform-adjusted padding
 */
export const platformPadding = (size) => {
  return platformSpacing(size);
};

/**
 * Platform-aware margin utility
 * @param {number} size - Base margin value
 * @returns {number} - Platform-adjusted margin
 */
export const platformMargin = (size) => {
  return platformSpacing(size);
};

/**
 * Platform-aware lineHeight utility
 * Android needs slightly more line spacing for better readability
 * @param {number} fontSize - Base font size
 * @param {number} multiplier - Line height multiplier (default: 1.3)
 * @returns {number} - Platform-adjusted lineHeight
 */
export const platformLineHeight = (fontSize, multiplier = 1.3) => {
  if (Platform.OS === 'android') {
    // Android: 5% more generous for better Korean font rendering
    return Math.round(fontSize * (multiplier * 1.05));
  }
  return Math.round(fontSize * multiplier);
};

/**
 * Debug utility: Log platform-specific metrics (development only)
 * Useful for comparing iOS and Android rendering differences
 */
export const logPlatformMetrics = () => {
  if (__DEV__) {
    console.log('📱 Platform Metrics:', {
      platform: Platform.OS,
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
      widthScale: widthScale.toFixed(2),
      heightScale: heightScale.toFixed(2),
      fontScaleFactor: getFontScaleFactor().toFixed(2),
      pixelRatio: PixelRatio.get(),
    });
  }
};


