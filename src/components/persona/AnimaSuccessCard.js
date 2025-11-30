/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎉 AnimaSuccessCard Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Success celebration card for persona creation completion
 * 
 * Features:
 * - Beautiful confetti animation
 * - Persona preview with scale animation
 * - Emotional messaging with i18n
 * - Modern, celebratory UI
 * - Haptic feedback
 * 
 * Design Principles:
 * ✅ Consistent spacing (scale/verticalScale)
 * ✅ Typography hierarchy (CustomText)
 * ✅ Color system (COLORS + theme)
 * ✅ Smooth animations (reanimated)
 * ✅ Emotional feedback (haptic)
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-30
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Image, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  withRepeat,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';

const AnimaSuccessCard = ({
  visible = false,
  personaName = '',
  personaImageUrl = '',
  onClose,
  onGoToStudio,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.5);
  const imageScaleAnim = useSharedValue(0.8);
  const glowAnim = useSharedValue(0);
  const confettiScale = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);

  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATED STYLES
  // ═══════════════════════════════════════════════════════════════════════

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScaleAnim.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const animatedConfettiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confettiScale.value }],
    opacity: confettiOpacity.value,
  }));

  // ═══════════════════════════════════════════════════════════════════════
  // ENTRANCE/EXIT ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (visible) {
      // Success haptic
      HapticService.success();

      // Overlay fade in
      fadeAnim.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });

      // Card scale entrance
      scaleAnim.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
      );

      // Image scale entrance (delayed)
      imageScaleAnim.value = withDelay(
        200,
        withSpring(1, {
          damping: 10,
          stiffness: 100,
        })
      );

      // Glow pulsation
      glowAnim.value = withDelay(
        300,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );

      // Confetti animation
      confettiScale.value = withDelay(
        100,
        withSequence(
          withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
          withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
        )
      );
      confettiOpacity.value = withDelay(
        100,
        withSequence(
          withTiming(1, { duration: 300 }),
          withDelay(2000, withTiming(0, { duration: 500 }))
        )
      );
    } else {
      // Exit animation
      fadeAnim.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) });
      scaleAnim.value = withTiming(0.8, { duration: 200, easing: Easing.in(Easing.ease) });
    }
  }, [visible]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <Animated.View style={[styles.overlay, animatedOverlayStyle]}>
        {/* Blur Background */}
        {Platform.OS === 'ios' ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(0,0,0,0.95)"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.95)' }]} />
        )}

        {/* Confetti Icons (Top Layer) */}
        <Animated.View style={[styles.confettiContainer, animatedConfettiStyle]} pointerEvents="none">
          <Icon name="party-popper" size={moderateScale(48)} color={COLORS.DEEP_BLUE_LIGHT} style={[styles.confetti, styles.confetti1]} />
          <Icon name="star" size={moderateScale(36)} color="#FFD700" style={[styles.confetti, styles.confetti2]} />
          <Icon name="heart" size={moderateScale(32)} color="#FF6B9D" style={[styles.confetti, styles.confetti3]} />
          <Icon name="star-four-points" size={moderateScale(40)} color={COLORS.DEEP_BLUE_LIGHT} style={[styles.confetti, styles.confetti4]} />
          <Icon name="creation" size={moderateScale(44)} color="#06B6D4" style={[styles.confetti, styles.confetti5]} />
        </Animated.View>

        {/* Content Card */}
        <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.15)', 'rgba(6, 182, 212, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            {/* Glow Effect */}
            <Animated.View style={[styles.glowEffect, animatedGlowStyle]} />

            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <Icon name="check-circle" size={moderateScale(72)} color="#4ADE80" />
            </View>

            {/* Title */}
            <CustomText type="title" bold style={styles.title}>
              {t('persona.success.title')}
            </CustomText>

            {/* Persona Image */}
            {personaImageUrl && (
              <Animated.View style={[styles.personaImageContainer, animatedImageStyle]}>
                <Image
                  source={{ uri: personaImageUrl }}
                  style={styles.personaImage}
                  resizeMode="cover"
                />
                <View style={styles.imageGlowBorder} />
              </Animated.View>
            )}

            {/* Persona Name */}
            {personaName && (
              <CustomText type="large" bold style={styles.personaName}>
                {personaName}
              </CustomText>
            )}

            {/* Description */}
            <CustomText type="normal" style={styles.description}>
              {t('persona.success.description')}
            </CustomText>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <CustomButton
                title={t('persona.success.go_to_studio')}
                onPress={() => {
                  HapticService.success();
                  onGoToStudio?.();
                }}
                style={styles.primaryButton}
                leftIcon={<Icon name="home" size={moderateScale(20)} color={COLORS.TEXT_PRIMARY} />}
              />
              
              <CustomButton
                title={t('common.close')}
                onPress={() => {
                  HapticService.light();
                  onClose?.();
                }}
                style={styles.secondaryButton}
                type="secondary"
              />
            </View>

            {/* Tip */}
            <View style={styles.tipContainer}>
              <Icon name="lightbulb-on" size={moderateScale(16)} color={COLORS.DEEP_BLUE_LIGHT} />
              <CustomText type="small" style={styles.tipText}>
                {t('persona.success.tip')}
              </CustomText>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
  },
  confetti1: {
    top: '15%',
    left: '10%',
  },
  confetti2: {
    top: '20%',
    right: '15%',
  },
  confetti3: {
    bottom: '25%',
    left: '20%',
  },
  confetti4: {
    bottom: '30%',
    right: '10%',
  },
  confetti5: {
    top: '35%',
    left: '50%',
  },
  cardContainer: {
    width: scale(340),
    borderRadius: scale(24),
    overflow: 'hidden',
  },
  gradientCard: {
    padding: scale(32),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: scale(24),
  },
  glowEffect: {
    position: 'absolute',
    width: scale(250),
    height: scale(250),
    borderRadius: scale(125),
    backgroundColor: '#4ADE80',
    top: scale(-80),
    opacity: 0.2,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: scale(60),
    elevation: 20,
  },
  iconContainer: {
    marginBottom: verticalScale(16),
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(20),
    textAlign: 'center',
  },
  personaImageContainer: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    marginBottom: verticalScale(16),
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.DEEP_BLUE_LIGHT,
    shadowColor: COLORS.DEEP_BLUE_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: scale(15),
    elevation: 10,
  },
  personaImage: {
    width: '100%',
    height: '100%',
  },
  imageGlowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: scale(60),
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  personaName: {
    color: COLORS.DEEP_BLUE_LIGHT,
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },
  description: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: verticalScale(28),
    textAlign: 'center',
    lineHeight: scale(22),
  },
  buttonContainer: {
    width: '100%',
    gap: verticalScale(12),
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
    marginTop: verticalScale(20),
  },
  tipText: {
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
});

export default AnimaSuccessCard;

