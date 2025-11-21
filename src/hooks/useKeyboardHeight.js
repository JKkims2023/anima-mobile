/**
 * useKeyboardHeight Hook
 * 
 * SIMPLIFIED VERSION - Returns pure keyboard height
 * Position calculation is handled by layout.js helpers
 * 
 * Features:
 * - iOS/Android platform-specific keyboard events
 * - Pure keyboard height (no TabBar adjustment)
 * - Duration fallback for Android
 * - Memory leak prevention (cleanup)
 * 
 * Returns:
 * - keyboardHeight: number - Pure keyboard height (0 when hidden)
 * - isKeyboardVisible: boolean - Keyboard visibility state
 * 
 * Usage:
 * const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 * @updated 2024-11-21 - Simplified to return pure keyboard height
 */

import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export const useKeyboardHeight = () => {
  // ✅ Pure keyboard height state (no adjustment, no animation)
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // ✅ Platform-specific event selection
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    // Keyboard Show Listener
    const showListener = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates.height;
      
      if (__DEV__) {
        console.log('⌨️ [Keyboard] Show:', {
          platform: Platform.OS,
          height: height,
          note: 'Pure keyboard height (no adjustment)',
        });
      }
      
      setKeyboardHeight(height);
      setIsKeyboardVisible(true);
    });

    // Keyboard Hide Listener
    const hideListener = Keyboard.addListener(hideEvent, () => {
      if (__DEV__) {
        console.log('⌨️ [Keyboard] Hide:', {
          platform: Platform.OS,
          height: 0,
        });
      }
      
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    // ✅ Cleanup: Prevent memory leaks
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return { 
    keyboardHeight, 
    isKeyboardVisible,
  };
};

export default useKeyboardHeight;

