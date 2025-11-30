/**
 * 🍞 AnimaToast - Emotional Toast Notification
 * 
 * Features:
 * - Auto dismiss (3 seconds)
 * - Slide animation from top
 * - Neon Glow effect
 * - Single instance (no duplicates)
 * - Emoji support
 * - Types: success, info, warning, error
 * 
 * Usage:
 * showToast({ type: 'success', message: '저장되었습니다!', emoji: '✅' })
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from './CustomText';
import { scale, moderateScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = SCREEN_WIDTH - scale(32);

/**
 * AnimaToast Component
 */
const AnimaToast = ({ visible, type = 'info', message, emoji, onHide }) => {
  const insets = useSafeAreaInsets();
  
  // ✅ Animated values
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);

  // ✅ Get toast config based on type
  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'rgba(34, 197, 94, 0.15)', // Green
          borderColor: '#22C55E',
          glowColor: '#22C55E',
          icon: 'check-circle',
          iconColor: '#22C55E',
          defaultEmoji: '✅',
        };
      case 'error':
        return {
          bgColor: 'rgba(239, 68, 68, 0.15)', // Red
          borderColor: '#EF4444',
          glowColor: '#EF4444',
          icon: 'alert-circle',
          iconColor: '#EF4444',
          defaultEmoji: '❌',
        };
      case 'warning':
        return {
          bgColor: 'rgba(251, 191, 36, 0.15)', // Amber
          borderColor: '#FBBF24',
          glowColor: '#FBBF24',
          icon: 'alert',
          iconColor: '#FBBF24',
          defaultEmoji: '⚠️',
        };
      case 'info':
      default:
        return {
          bgColor: 'rgba(59, 130, 246, 0.15)', // Blue
          borderColor: COLORS.DEEP_BLUE,
          glowColor: COLORS.DEEP_BLUE,
          icon: 'information',
          iconColor: COLORS.DEEP_BLUE,
          defaultEmoji: '💙',
        };
    }
  };

  const config = getConfig();

  // ✅ Show/Hide animation
  useEffect(() => {
    if (visible) {
      // Show
      translateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, {
        duration: 300,
      });

      // Auto hide after 3 seconds
      setTimeout(() => {
        hideToast();
      }, 3000);
    } else {
      // Hide
      translateY.value = withTiming(-200, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, {
        duration: 200,
      });
    }
  }, [visible]);

  // ✅ Hide toast
  const hideToast = () => {
    translateY.value = withSequence(
      // Bounce effect
      withTiming(-10, { duration: 100 }),
      withTiming(-200, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      }, () => {
        runOnJS(onHide)();
      })
    );
    opacity.value = withTiming(0, {
      duration: 200,
    });
  };

  // ✅ Container animated style
  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  // ✅ Don't render if not visible
  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + scale(16),
        },
        containerStyle,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideToast}
        style={styles.touchable}
      >
        {/* Glow Layer */}
        <View
          style={[
            styles.glowLayer,
            {
              borderColor: config.glowColor,
              shadowColor: config.glowColor,
            },
          ]}
        />

        {/* Toast Content */}
        <View
          style={[
            styles.toast,
            {
              backgroundColor: config.bgColor,
              borderColor: config.borderColor,
            },
          ]}
        >
          {/* Left: Emoji or Icon */}
          <View style={styles.iconContainer}>
            {emoji ? (
              <CustomText type="big" style={styles.emoji}>
                {emoji}
              </CustomText>
            ) : (
              <Icon
                name={config.icon}
                size={moderateScale(24)}
                color={config.iconColor}
              />
            )}
          </View>

          {/* Center: Message */}
          <View style={styles.messageContainer}>
            <CustomText type="normal" style={styles.message} numberOfLines={2}>
              {message}
            </CustomText>
          </View>

          {/* Right: Close Button */}
          <TouchableOpacity
            onPress={hideToast}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name="close"
              size={moderateScale(18)}
              color="rgba(255, 255, 255, 0.6)"
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: scale(16),
    right: scale(16),
    zIndex: 9999,
    alignItems: 'center',
  },
  touchable: {
    width: TOAST_WIDTH,
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: scale(12),
    elevation: 0,
    opacity: 0.6,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(14),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    minHeight: scale(64),
  },
  iconContainer: {
    width: scale(32),
    height: scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  emoji: {
    fontSize: moderateScale(24),
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    marginLeft: scale(8),
    padding: scale(4),
  },
});

export default AnimaToast;

