/**
 * 🎯 AnimaOverlayAlert - Emotional Alert Modal
 * 
 * Features:
 * - Center modal (requires user action)
 * - Neon Glow border
 * - Fade + Scale animation
 * - Backdrop blur
 * - Emoji support
 * - 1-2 buttons (Cancel / Confirm)
 * 
 * Usage:
 * showAlert({
 *   title: '로그아웃',
 *   message: '떠나실 건가요? 🥺',
 *   emoji: '🚪',
 *   buttons: [
 *     { text: '취소', style: 'cancel' },
 *     { text: '확인', style: 'primary', onPress: () => {} },
 *   ]
 * })
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform, BackHandler, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import CustomText from './CustomText';
import CustomButton from './CustomButton';
import { scale, moderateScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';
import Modal from 'react-native-modal'; // ✨ react-native-modal에서 import

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALERT_WIDTH = Math.min(SCREEN_WIDTH - scale(64), scale(340));

/**
 * AnimaOverlayAlert Component
 */
const AnimaOverlayAlert = ({ visible, title, message, emoji, image, buttons = [], onClose }) => {
  // ✅ Animated values
  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  // ✅ Show/Hide animation
  useEffect(() => {
    if (visible) {
      // Show
      backdropOpacity.value = withTiming(1, {
        duration: 200,
      });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, {
        duration: 200,
      });
    } else {
      // Hide
      backdropOpacity.value = withTiming(0, {
        duration: 200,
      });
      scale.value = withTiming(0.8, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, {
        duration: 200,
      });
    }


    if (Platform.OS !== 'android') {
      return; // iOS는 처리 불필요
    }
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      
      if (visible) {
        
        onClose();
        return true; // ✅ 이벤트 소비 (부모로 전달 안됨)
      }
      
      return false; // ✅ 이벤트 전파 (부모가 처리)

    });
    
    return () => {
      backHandler.remove();
    };
  
  }, [visible]);

  // ✅ Backdrop animated style
  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  // ✅ Alert animated style
  const alertStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  // ✅ Handle backdrop press
  const handleBackdropPress = () => {
    // Only close if there's a cancel button
    const hasCancelButton = buttons.some(btn => btn.style === 'cancel');
    if (hasCancelButton) {
      onClose();
    }
  };

  // ✅ Handle button press
  const handleButtonPress = (button) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <Modal
      isVisible={visible}
      visible={visible}
      transparent={true}
      animationType="none"
      onBackdropPress={handleBackdropPress}

    >
    <View
      style={[styles.container, ]}
    >
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleBackdropPress}
        style={styles.backdrop}
      >
        <Animated.View style={[styles.backdropOverlay, backdropStyle]} />
      </TouchableOpacity>

      {/* Alert Container */}
      <View style={styles.alertContainer} pointerEvents="box-none">
        <Animated.View style={[styles.alertWrapper, alertStyle]}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={styles.alertTouchable}
          >
            {/* Glow Layer */}
            <View style={styles.glowLayer} />

            {/* Alert Content */}
            <View style={styles.alert}>
              {/* Emoji */}
              {emoji && (
                <View style={styles.emojiContainer}>
                  <CustomText type="big" style={styles.emoji}>
                    {emoji}
                  </CustomText>
                </View>
              )}

              {/* Title */}
              {title && (
                <CustomText type="title" bold style={styles.title}>
                  {title}
                </CustomText>
              )}

              {/* Image */}
              {image && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.image} />
                </View>
              )}

              {/* Message */}
              {message && (
                <CustomText type="normal" style={styles.message}>
                  {message}
                </CustomText>
              )}

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                {buttons.map((button, index) => {
                  const isCancel = button.style === 'cancel';
                  const isPrimary = button.style === 'primary' || button.style === 'destructive';
                  const isDestructive = button.style === 'destructive';

                  return (
                    <CustomButton
                      key={index}
                      title={button.text}
                      type={isPrimary ? 'primary' : 'outline'}
                      onPress={() => handleButtonPress(button)}
                      style={[
                        styles.button,
                        buttons.length === 2 && styles.buttonHalf,
                        isDestructive && styles.buttonDestructive,
                      ]}
                      textStyle={[
                        isCancel && styles.buttonCancelText,
                        isDestructive && styles.buttonDestructiveText,
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Backdrop
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Alert Container
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  alertContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  alertWrapper: {
    width: ALERT_WIDTH,
  },
  alertTouchable: {
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: COLORS.DEEP_BLUE,
    shadowColor: COLORS.DEEP_BLUE,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: scale(16),
    elevation: 0,
    opacity: 0.7,
  },
  alert: {
    backgroundColor: 'rgba(30, 30, 46, 0.95)',
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    paddingHorizontal: platformPadding(24),
    paddingTop: platformPadding(28),
    paddingBottom: platformPadding(24),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  emojiContainer: {
    alignItems: 'center',
    marginBottom: scale(16),
  },
  emoji: {
    fontSize: moderateScale(30),
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: scale(12),
    fontSize: Platform.OS === 'ios' ? scale(16) : scale(16),
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: scale(12),
    marginBottom: scale(20),
    borderWidth: 1,
    alignSelf: 'center',
    width: scale(100),
    height: scale(100),
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderRadius: moderateScale(50),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    overflow: 'hidden',
  
  },
  message: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: scale(24),
    lineHeight: scale(22),
    fontSize: Platform.OS === 'ios' ? scale(14) : scale(14),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Buttons
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  buttonsContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },
  button: {
    flex: 1,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonCancelText: {
    color: COLORS.TEXT_SECONDARY,
  },
  buttonDestructive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  buttonDestructiveText: {
    color: '#FFFFFF',
  },
});

export default AnimaOverlayAlert;

