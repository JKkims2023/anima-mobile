/**
 * 💡 NeonInputBottomSheet - NeonInput for BottomSheet
 * 
 * BottomSheet 내부에서 사용하는 NeonInput 래퍼
 * @gorhom/bottom-sheet의 BottomSheetTextInput을 사용
 * 
 * Features:
 * - Neon glow on focus (ANIMA Deep Blue)
 * - Breathing animation while typing
 * - Success/Error state with animated icons
 * - Smooth transitions
 * - BottomSheet 키보드 최적화
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { scale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const NeonInputBottomSheet = ({
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
    if (isFocused && !error && !success) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.ease }),
          withTiming(0.6, { duration: 800, easing: Easing.ease })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isFocused, error, success, glowOpacity]);

  // ✅ Breathing animation when typing
  useEffect(() => {
    if (value && value.length > 0 && isFocused) {
      breathingScale.value = withRepeat(
        withSequence(
          withTiming(1.01, { duration: 1000, easing: Easing.ease }),
          withTiming(1, { duration: 1000, easing: Easing.ease })
        ),
        -1,
        true
      );
    } else {
      breathingScale.value = withTiming(1, { duration: 300 });
    }
  }, [value, isFocused, breathingScale]);

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

          {/* ✅ BottomSheetTextInput (키보드 최적화) */}
          <BottomSheetTextInput
            style={[
              styles.input,
              leftIcon && styles.inputWithLeftIcon,
              (success || error) && styles.inputWithRightIcon,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            secureTextEntry={secureTextEntry}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={!disabled}
            {...props}
          />

          {/* ✅ Right icon (success/error) */}
          {(success || error) && (
            <Icon
              name={success ? 'check-circle' : 'alert-circle'}
              size={moderateScale(20)}
              color={success ? '#10B981' : '#EF4444'}
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
    color: '#E5E7EB',
    marginBottom: scale(8),
  },
  labelError: {
    color: '#EF4444',
  },
  inputWrapper: {
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: scale(12),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: scale(12),
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    minHeight: scale(48),
  },
  inputDisabled: {
    opacity: 0.5,
  },
  leftIcon: {
    marginRight: scale(12),
  },
  rightIcon: {
    marginLeft: scale(12),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(15),
    color: '#FFFFFF',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    paddingVertical: scale(12),
    // ✅ Android specific fixes
    ...(Platform.OS === 'android' && {
      paddingTop: scale(12),
      paddingBottom: scale(12),
      textAlignVertical: 'center',
    }),
  },
  inputWithLeftIcon: {
    marginLeft: 0,
  },
  inputWithRightIcon: {
    marginRight: 0,
  },
  errorText: {
    fontSize: moderateScale(12),
    color: '#EF4444',
    marginTop: scale(4),
    marginLeft: scale(4),
  },
});

export default NeonInputBottomSheet;

