/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 ANIMA Haptic Feedback Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides analog-like tactile feedback for digital interactions
 * Blending cutting-edge AI with nostalgic analog sensibility
 * 
 * Philosophy:
 * - "최첨단 AI + 아날로그 감성 = ANIMA의 정체성"
 * - Camera shutter-like satisfying haptic feedback
 * - User-controllable (on/off in settings)
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 * @version 1.0.0
 */

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// 📐 Haptic Configuration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Haptic options for consistent behavior
 */
const HAPTIC_OPTIONS = {
  enableVibrateFallback: true, // Fallback to vibration for older devices
  ignoreAndroidSystemSettings: false, // Respect user's system settings
};

/**
 * Haptic types mapped to use cases
 * 
 * iOS Taptic Engine types:
 * - selection: Light tick (for scrolling, swiping)
 * - impactLight: Gentle tap (for minor buttons)
 * - impactMedium: Satisfying tap (for important buttons) ← RECOMMENDED
 * - impactHeavy: Powerful tap (for camera shutter, critical actions) ← CAMERA STYLE
 * - notificationSuccess: Completion success
 * - notificationWarning: Warning alert
 * - notificationError: Error alert
 * 
 * Android: Uses vibration patterns (fallback)
 */
const HAPTIC_TYPES = {
  // Light feedback for minor interactions
  LIGHT: 'impactLight',
  
  // Medium feedback for standard interactions (MOST USED)
  MEDIUM: 'impactMedium',
  
  // Heavy feedback for important interactions (CAMERA SHUTTER STYLE)
  HEAVY: 'impactHeavy',
  
  // Selection feedback for continuous gestures
  SELECTION: 'selection',
  
  // Notification feedbacks
  SUCCESS: 'notificationSuccess',
  WARNING: 'notificationWarning',
  ERROR: 'notificationError',
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 Haptic Service Class
// ═══════════════════════════════════════════════════════════════════════════

class HapticService {
  /**
   * Internal state: Whether haptic is enabled
   * Default: true (can be controlled via Settings)
   */
  static enabled = true;

  /**
   * Enable haptic feedback
   */
  static enable() {
    this.enabled = true;
    if (__DEV__) {
      console.log('🎯 [Haptic] Enabled');
    }
  }

  /**
   * Disable haptic feedback
   */
  static disable() {
    this.enabled = false;
    if (__DEV__) {
      console.log('🎯 [Haptic] Disabled');
    }
  }

  /**
   * Check if haptic is enabled
   */
  static isEnabled() {
    return this.enabled;
  }

  /**
   * Trigger haptic feedback
   * @param {string} type - Haptic type (use HAPTIC_TYPES constants)
   * @param {object} options - Optional custom options
   */
  static trigger(type, options = {}) {
    // ✅ Check if haptic is enabled
    if (!this.enabled) {
      return;
    }

    try {
      // ✅ Trigger haptic with fallback support
      ReactNativeHapticFeedback.trigger(type, {
        ...HAPTIC_OPTIONS,
        ...options,
      });

      if (__DEV__) {
        console.log('🎯 [Haptic] Triggered:', type);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('🎯 [Haptic] Error:', error);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 💫 Convenience Methods for Common Use Cases
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Light feedback for minor interactions
   * Use cases: Scroll ticks, minor button taps
   */
  static light() {
    this.trigger(HAPTIC_TYPES.LIGHT);
  }

  /**
   * Medium feedback for standard interactions (RECOMMENDED for most buttons)
   * Use cases: Tab bar navigation, message send, persona selection
   */
  static medium() {
    this.trigger(HAPTIC_TYPES.MEDIUM);
  }

  /**
   * Heavy feedback for important interactions (CAMERA SHUTTER STYLE)
   * Use cases: Center AI Button, critical actions, photo capture
   */
  static heavy() {
    this.trigger(HAPTIC_TYPES.HEAVY);
  }

  /**
   * Selection feedback for continuous gestures
   * Use cases: Swipe through items, scrubbing timeline
   */
  static selection() {
    this.trigger(HAPTIC_TYPES.SELECTION);
  }

  /**
   * Success feedback for completed actions
   * Use cases: Message sent successfully, task completed
   */
  static success() {
    this.trigger(HAPTIC_TYPES.SUCCESS);
  }

  /**
   * Warning feedback for cautionary actions
   * Use cases: Approaching limit, unsaved changes
   */
  static warning() {
    this.trigger(HAPTIC_TYPES.WARNING);
  }

  /**
   * Error feedback for failed actions
   * Use cases: Send failed, validation error
   */
  static error() {
    this.trigger(HAPTIC_TYPES.ERROR);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎥 ANIMA Special: Camera Shutter Style
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Camera shutter-like haptic (ANIMA's signature feedback)
   * Heavy, satisfying, memorable
   * 
   * Use cases:
   * - Center AI Button press
   * - Persona selection confirmation
   * - Important state changes
   */
  static cameraShutter() {
    if (!this.enabled) return;

    if (Platform.OS === 'ios') {
      // iOS: Use impactHeavy for that satisfying "thunk"
      this.heavy();
    } else {
      // Android: Custom vibration pattern for camera-like feel
      // Pattern: [delay, vibrate, pause, vibrate]
      // Creates a "click-clack" sensation
      try {
        const Vibration = require('react-native').Vibration;
        Vibration.vibrate([0, 50, 100, 30]); // Shutter-like pattern
        
        if (__DEV__) {
          console.log('🎯 [Haptic] Camera Shutter (Android pattern)');
        }
      } catch (error) {
        // Fallback to heavy
        this.heavy();
      }
    }
  }

  /**
   * Two-stage camera shutter haptic (REAL camera feeling!)
   * Stage 1 (Half-press): Focus - lighter feedback
   * Stage 2 (Full-press): Capture - heavier feedback
   * 
   * This creates the authentic camera shutter experience:
   * - Touch down: "tick" (focus lock)
   * - Touch up: "CLACK" (capture!)
   * 
   * Use cases:
   * - Center AI Button (primary use!)
   * - Important two-stage actions
   * - Photo/media capture
   */
  
  /**
   * Stage 1: Half-press (Focus) - Call on onPressIn
   * Lighter feedback to indicate touch recognition
   */
  static cameraHalfPress() {
    if (!this.enabled) return;

    if (Platform.OS === 'ios') {
      // iOS: Medium impact for half-press
      this.medium();
      
      if (__DEV__) {
        console.log('📸 [Haptic] Camera Half-Press (Focus)');
      }
    } else {
      // Android: Light vibration for focus
      try {
        const Vibration = require('react-native').Vibration;
        Vibration.vibrate(30); // Short, light vibration
        
        if (__DEV__) {
          console.log('📸 [Haptic] Camera Half-Press (Android)');
        }
      } catch (error) {
        this.light();
      }
    }
  }

  /**
   * Stage 2: Full-press (Capture) - Call on onPress
   * Single, satisfying feedback to indicate action completion
   * Clean, decisive: "탁"
   */
  static cameraFullPress() {
    if (!this.enabled) return;

    if (Platform.OS === 'ios') {
      // iOS: Single heavy impact - clean and decisive
      this.heavy();
      
      if (__DEV__) {
        console.log('📸 [Haptic] Camera Full-Press (Capture) - 탁');
      }
    } else {
      // Android: Single strong vibration
      try {
        const Vibration = require('react-native').Vibration;
        // Single, satisfying vibration
        Vibration.vibrate(70); // Strong single vibration
        
        if (__DEV__) {
          console.log('📸 [Haptic] Camera Full-Press (Android) - 탁');
        }
      } catch (error) {
        this.heavy();
      }
    }
  }

  /**
   * Double tap haptic (like Instagram heart)
   * Quick, satisfying, playful
   */
  static doubleTap() {
    if (!this.enabled) return;

    this.medium();
    setTimeout(() => {
      this.medium();
    }, 100); // 100ms delay for double sensation
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 📤 Exports
// ═══════════════════════════════════════════════════════════════════════════

export default HapticService;
export { HAPTIC_TYPES };

