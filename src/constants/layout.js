/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 ANIMA Layout Constants
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Centralized layout dimensions and spacing values
 * Used across the app for consistent UI measurements
 * 
 * @created 2024
 * @updated 2024-11-21 - Added CENTER_AI_BUTTON support
 */

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// 📐 Tab Bar Dimensions
// ═══════════════════════════════════════════════════════════════════════════

export const TAB_BAR = {
  // Base tab bar height (without center button elevation)
  BASE_HEIGHT: 60,
  
  // Center AI button elevation (how much it sticks up above tab bar)
  CENTER_BUTTON_ELEVATION: 12,
  
  // Total tab bar reserved space (BASE_HEIGHT + CENTER_BUTTON_ELEVATION)
  TOTAL_HEIGHT: 72, // 60 + 12
  
  // Center AI button size
  CENTER_BUTTON_SIZE: 64,
  CENTER_BUTTON_ICON_SIZE: 56,
  
  // Regular tab icon size
  REGULAR_ICON_SIZE: 24,
  
  // Tab bar padding
  HORIZONTAL_PADDING: 16,
  VERTICAL_PADDING: 8,
};

// ═══════════════════════════════════════════════════════════════════════════
// 💬 Chat Input Dimensions
// ═══════════════════════════════════════════════════════════════════════════

export const CHAT_INPUT = {
  // Minimum height (single line)
  MIN_HEIGHT: 48,
  
  // Maximum height (multi-line)
  MAX_HEIGHT: 120,
  
  // Padding from bottom (spacing between input and tab bar)
  BOTTOM_PADDING: 8,
  
  // Internal padding
  HORIZONTAL_PADDING: 16,
  VERTICAL_PADDING: 12,
  
  // Button sizes
  BUTTON_SIZE: 40,
  ICON_SIZE: 24,
  
  // Border
  BORDER_RADIUS: 24,
  BORDER_WIDTH: 1,
};

// ═══════════════════════════════════════════════════════════════════════════
// ⌨️ Keyboard Behavior
// ═══════════════════════════════════════════════════════════════════════════

export const KEYBOARD = {
  // Animation duration (ms)
  ANIMATION_DURATION: Platform.OS === 'ios' ? 250 : 200,
  
  // Easing
  ANIMATION_EASING: 'ease-out',
  
  // Minimum space above keyboard
  MIN_CLEARANCE: 8,
  
  // iOS specific
  IOS_EXTRA_PADDING: 0,
  
  // Android specific
  ANDROID_EXTRA_PADDING: 0,
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎥 Video & Chat Overlay
// ═══════════════════════════════════════════════════════════════════════════

export const CHAT_OVERLAY = {
  // Chat height modes (percentage from top)
  HEIGHT_MODES: {
    TALL: 0.10,   // 10% from top (keyboard active or tall mode)
    MEDIUM: 0.35, // 35% from top (default, shows more video)
    SHORT: 0.50,  // 50% from top (minimal chat)
  },
  
  // Border radius
  BORDER_RADIUS: 24,
  
  // Shadow
  SHADOW_ELEVATION: 12,
  SHADOW_OPACITY: 0.3,
  SHADOW_RADIUS: 16,
};

// ═══════════════════════════════════════════════════════════════════════════
// 📱 Screen Dimensions
// ═══════════════════════════════════════════════════════════════════════════

export const SCREEN = {
  WIDTH: SCREEN_WIDTH,
  HEIGHT: SCREEN_HEIGHT,
  
  // Responsive breakpoints
  IS_SMALL_DEVICE: SCREEN_WIDTH < 375,
  IS_MEDIUM_DEVICE: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  IS_LARGE_DEVICE: SCREEN_WIDTH >= 414,
  
  // Safe margins
  HORIZONTAL_MARGIN: 16,
  VERTICAL_MARGIN: 16,
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Common Spacing
// ═══════════════════════════════════════════════════════════════════════════

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate chat input bottom position
 * @param {boolean} isKeyboardVisible - Whether keyboard is visible
 * @param {number} keyboardHeight - Height of keyboard (pure, not adjusted)
 * @param {number} safeBottomInset - Safe area bottom inset
 * @returns {number} Bottom position for chat input
 */
export const calculateChatInputBottom = (
  isKeyboardVisible,
  keyboardHeight,
  safeBottomInset
) => {
  if (isKeyboardVisible && keyboardHeight > 0) {
    // ✅ Keyboard is visible: position InputBar lower (subtract input height to go down)
    return keyboardHeight - CHAT_INPUT.MIN_HEIGHT;
  } else {
    // ✅ Normal state: position InputBar lower (subtract input height to go down)
    return TAB_BAR.BASE_HEIGHT + safeBottomInset - CHAT_INPUT.MIN_HEIGHT;
  }
};

/**
 * Calculate chat overlay top position
 * @param {string} heightMode - 'tall', 'medium', or 'short'
 * @param {boolean} isKeyboardVisible - Whether keyboard is visible
 * @returns {number} Top position for chat overlay
 */
export const calculateChatOverlayTop = (heightMode = 'medium', isKeyboardVisible = false) => {
  // When keyboard is visible, always use tall mode for maximum space
  if (isKeyboardVisible) {
    return SCREEN.HEIGHT * CHAT_OVERLAY.HEIGHT_MODES.TALL;
  }
  
  // Otherwise use specified mode
  const mode = heightMode.toLowerCase();
  const percentage = CHAT_OVERLAY.HEIGHT_MODES[mode.toUpperCase()] || CHAT_OVERLAY.HEIGHT_MODES.MEDIUM;
  
  return SCREEN.HEIGHT * percentage;
};

/**
 * Get safe area adjusted tab bar height
 * @param {number} safeBottomInset - Safe area bottom inset
 * @returns {number} Total tab bar height including safe area
 */
export const getTabBarHeight = (safeBottomInset = 0) => {
  return TAB_BAR.TOTAL_HEIGHT + safeBottomInset;
};

// ═══════════════════════════════════════════════════════════════════════════
// 📦 Default Export
// ═══════════════════════════════════════════════════════════════════════════

export default {
  TAB_BAR,
  CHAT_INPUT,
  KEYBOARD,
  CHAT_OVERLAY,
  SCREEN,
  SPACING,
  calculateChatInputBottom,
  calculateChatOverlayTop,
  getTabBarHeight,
};

