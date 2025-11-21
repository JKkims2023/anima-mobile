/**
 * ChatHeightToggle Component
 * 
 * Features:
 * - Toggle between 'tall' and 'medium' chat height
 * - Floating button (above chat overlay)
 * - Animated icon rotation
 * - Haptic feedback (optional)
 * 
 * Usage:
 * <ChatHeightToggle
 *   height="medium"
 *   onToggle={() => setChatHeight(h => h === 'tall' ? 'medium' : 'tall')}
 * />
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { moderateScale, verticalScale } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';

const ChatHeightToggle = ({ height = 'medium', onToggle }) => {
  const { currentTheme } = useTheme();
  const rotation = new Animated.Value(height === 'tall' ? 1 : 0);

  // ✅ Animated icon rotation (180deg)
  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleToggle = () => {
    // Animate icon rotation
    Animated.spring(rotation, {
      toValue: height === 'tall' ? 0 : 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    onToggle();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: currentTheme.primaryColor || '#3B82F6',
        },
      ]}
      onPress={handleToggle}
      activeOpacity={0.8}
    >
      <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
        <Icon
          name={height === 'tall' ? 'expand-more' : 'expand-less'}
          size={moderateScale(28)}
          color="#FFFFFF"
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: verticalScale(80), // ✅ Below persona chips area
    right: moderateScale(20),
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    // ✅ Shadow for visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20, // ✅ Above chat overlay
  },
});

export default ChatHeightToggle;

