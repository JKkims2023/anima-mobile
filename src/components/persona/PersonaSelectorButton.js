/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 PersonaSelectorButton Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Floating button for persona selection (top-right)
 * - SAGE mode: [👥] icon → "Select Persona"
 * - Persona mode: [🏠] icon → "Return to SAGE"
 * - Smooth rotation animation on mode change
 * - Haptic feedback on press
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';

/**
 * PersonaSelectorButton Component
 * @param {Object} props
 * @param {boolean} props.isPersonaMode - Whether in Persona mode (true) or SAGE mode (false)
 * @param {Function} props.onPress - Callback when button is pressed
 */
const PersonaSelectorButton = ({ isPersonaMode = false, onPress }) => {
  const insets = useSafeAreaInsets();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // ✅ Rotate animation on mode change
  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isPersonaMode ? 0 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isPersonaMode, rotateAnim]);
  
  // ✅ Handle press with haptic feedback
  const handlePress = () => {
    HapticService.selection();
    
    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (onPress) {
      onPress();
    }
  };
  
  // ✅ Rotation interpolation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  return (
    <View
      style={[
        styles.container,
        {
 //         top: verticalScale(20),
 //         transform: [{ rotate }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isPersonaMode ? '#10B981' : '#3B82F6',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Icon
          name={isPersonaMode ? 'home' : 'account-group'}
          size={scale(28)}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
//    right: scale(20),
//    zIndex: 200,
    position: 'absolute',
    top: verticalScale(20),
    right: scale(20),
    zIndex: 200,
    display: 'none',
  },
  button: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    // ✅ Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // ✅ Border for definition
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default PersonaSelectorButton;

