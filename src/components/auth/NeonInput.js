/**
 * 💡 NeonInput - Input Field with Neon Glow Effect
 * 
 * Features:
 * - Neon glow on focus (ANIMA Deep Blue)
 * - Breathing animation while typing
 * - Success/Error state with animated icons
 * - Smooth transitions
 * 
 * Props:
 * - label: String
 * - value: String
 * - onChangeText: Function
 * - placeholder: String
 * - secureTextEntry: Boolean
 * - error: String | null
 * - success: Boolean
 * - leftIcon: String (icon name)
 * - disabled: Boolean
 */

import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const NeonInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error = null,
  success = false,
  leftIcon,
  disabled = false,
  ...props
}) => {
  const glowOpacity = useSharedValue(0);
  const breathingScale = useSharedValue(1);
  const [isFocused, setIsFocused] = React.useState(false);

  // ✅ Neon glow animation on focus
  useEffect(() => {
    if (isFocused && !error) {
      glowOpacity.value = withTiming(1, { duration: 300 });
      // ✅ Breathing effect while focused
      breathingScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
      breathingScale.value = withTiming(1, { duration: 300 });
    }
  }, [isFocused, error]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: breathingScale.value }],
  }));

  // ✅ Border color based on state
  const getBorderColor = () => {
    if (error) return '#EF4444'; // Red
    if (success) return '#10B981'; // Green
    if (isFocused) return COLORS.DEEP_BLUE;
    return 'rgba(156, 163, 175, 0.3)'; // Gray
  };

  return (
    <View style={styles.container}>
      {/* ✅ Label */}
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
        </Text>
      )}

      {/* ✅ Input container with neon glow */}
      <View style={styles.inputWrapper}>
        {/* ✅ Neon glow layer */}
        <Animated.View
          style={[
            styles.glowLayer,
            {
              borderColor: COLORS.DEEP_BLUE,
              shadowColor: COLORS.DEEP_BLUE,
            },
            glowStyle,
          ]}
        />

        {/* ✅ Input field */}
        <View
          style={[
            styles.inputContainer,
            { borderColor: getBorderColor() },
            disabled && styles.inputDisabled,
          ]}
        >
          {/* ✅ Left icon */}
          {leftIcon && (
            <Icon
              name={leftIcon}
              size={moderateScale(20)}
              color={isFocused ? COLORS.DEEP_BLUE : '#9CA3AF'}
              style={styles.leftIcon}
            />
          )}

          {/* ✅ Text input */}
          <TextInput
            style={[
              styles.input,
              Platform.OS === 'android' && styles.inputAndroid,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={secureTextEntry}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={!disabled}
            {...props}
          />

          {/* ✅ Right icon (success/error) */}
          {success && (
            <Icon
              name="check-circle"
              size={moderateScale(20)}
              color="#10B981"
              style={styles.rightIcon}
            />
          )}
          {error && (
            <Icon
              name="alert-circle"
              size={moderateScale(20)}
              color="#EF4444"
              style={styles.rightIcon}
            />
          )}
        </View>
      </View>

      {/* ✅ Error message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(16),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scale(8),
    letterSpacing: 0.3,
  },
  labelError: {
    color: '#EF4444',
  },
  inputWrapper: {
    position: 'relative',
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: scale(16),
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: scale(12),
    elevation: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    borderWidth: 2,
    paddingHorizontal: scale(16),
    minHeight: scale(56),
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  leftIcon: {
    marginRight: scale(12),
  },
  rightIcon: {
    marginLeft: scale(12),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(16),
    color: '#1F2937',
    paddingVertical: Platform.OS === 'ios' ? scale(16) : scale(12),
  },
  inputAndroid: {
    paddingVertical: scale(8),
  },
  errorText: {
    fontSize: moderateScale(12),
    color: '#EF4444',
    marginTop: scale(6),
    marginLeft: scale(4),
  },
});

export default NeonInput;

