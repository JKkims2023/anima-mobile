/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 PersonaCreationLoadingOverlay Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Emotional loading overlay for persona creation
 * 
 * Features:
 * - Breathing circle animation (scale + glow)
 * - Sparkles particles
 * - Gradient text
 * - Fade in/out transition
 * - Emotional messaging
 * 
 * @author JK & Hero Nexus
 * @date 2025-12-09
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import Sparkles from '../particle/Sparkles';
import { scale, verticalScale } from '../../utils/responsive-utils';

const PersonaCreationLoadingOverlay = ({ visible, message }) => {
  const { t } = useTranslation();
  
  // Animations
  const overlayOpacity = useSharedValue(0);
  const circleScale = useSharedValue(0.8);
  const circleOpacity = useSharedValue(0.6);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (visible) {
      // Fade in overlay
      overlayOpacity.value = withTiming(1, { duration: 300 });
      
      // Breathing circle animation
      circleScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite
        false
      );
      
      circleOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      
      // Glow pulse
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Fade out overlay
      overlayOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: circleOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
    >
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        {/* Sparkles Background */}
        <Sparkles isActive={visible} />

        {/* Center Content */}
        <View style={styles.centerContent}>
          {/* Glow Circle (Background) */}
          <Animated.View style={[styles.glowCircle, glowAnimatedStyle]}>
            <LinearGradient
              colors={['rgba(96, 165, 250, 0.3)', 'rgba(147, 51, 234, 0.3)', 'rgba(236, 72, 153, 0.3)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCircle}
            />
          </Animated.View>

          {/* Breathing Circle */}
          <Animated.View style={[styles.breathingCircle, circleAnimatedStyle]}>
            <LinearGradient
              colors={['rgba(96, 165, 250, 0.8)', 'rgba(147, 51, 234, 0.8)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCircle}
            />
          </Animated.View>

          {/* Center Icon */}
          <View style={styles.iconContainer}>
            <CustomText style={styles.icon}>✨</CustomText>
          </View>
        </View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <CustomText type="title" bold style={styles.mainMessage}>
            {message || t('persona.creation.creating')}
          </CustomText>
          <CustomText type="middle" style={styles.subMessage}>
            {t('persona.creation.please_wait')}
          </CustomText>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: scale(200),
    height: scale(200),
  },
  glowCircle: {
    position: 'absolute',
    width: scale(180),
    height: scale(180),
    borderRadius: scale(90),
    overflow: 'hidden',
  },
  breathingCircle: {
    position: 'absolute',
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    overflow: 'hidden',
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: scale(50),
  },
  messageContainer: {
    marginTop: verticalScale(40),
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  mainMessage: {
    fontSize: scale(20),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: verticalScale(8),
    textShadowColor: 'rgba(96, 165, 250, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subMessage: {
    fontSize: scale(14),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default PersonaCreationLoadingOverlay;

