/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ✨ AnimaLoadingOverlay Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Full-screen loading overlay for persona creation with smart polling
 * 
 * Features:
 * - Progressive loading animation
 * - Smart polling (dynamic interval based on estimate_time)
 * - Emotional messaging with i18n
 * - Modern, beautiful UI with blur effects
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

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Modal, ActivityIndicator, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';

const AnimaLoadingOverlay = ({
  visible = false,
  personaName = '',
  estimateTime = 60, // seconds
  onComplete,
  onError,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  // States
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('persona.loading.analyzing');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const rotateAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);
  const progressAnim = useSharedValue(0);

  // Refs
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATED STYLES
  // ═══════════════════════════════════════════════════════════════════════

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const animatedIconRotate = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnim.value, [0, 100], [0, 100], Extrapolate.CLAMP)}%`,
  }));

  // ═══════════════════════════════════════════════════════════════════════
  // ENTRANCE/EXIT ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (visible) {
      // Entrance animation
      fadeAnim.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      scaleAnim.value = withSpring(1, { damping: 15, stiffness: 150 });

      // Continuous rotate animation for icon
      rotateAnim.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1, // infinite
        false
      );

      // Glow pulsation
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      HapticService.success();
      startTimeRef.current = Date.now();
    } else {
      // Exit animation
      fadeAnim.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) });
      scaleAnim.value = withTiming(0.8, { duration: 200, easing: Easing.in(Easing.ease) });
    }
  }, [visible]);

  // ═══════════════════════════════════════════════════════════════════════
  // PROGRESS SIMULATION & STATUS MESSAGES
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!visible) {
      // Reset on close
      setProgress(0);
      setElapsedTime(0);
      setStatusMessage('persona.loading.analyzing');
      progressAnim.value = 0;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // Progress simulation (90% over estimateTime, last 10% during polling)
    const updateInterval = (estimateTime * 1000) / 90; // 90% of total time
    let currentProgress = 0;

    intervalRef.current = setInterval(() => {
      if (currentProgress < 90) {
        currentProgress += 1;
        setProgress(currentProgress);
        progressAnim.value = withTiming(currentProgress, { duration: updateInterval });

        // Update status messages
        if (currentProgress === 10) {
          setStatusMessage('persona.loading.processing');
        } else if (currentProgress === 30) {
          setStatusMessage('persona.loading.generating');
        } else if (currentProgress === 60) {
          setStatusMessage('persona.loading.finalizing');
        } else if (currentProgress === 80) {
          setStatusMessage('persona.loading.almost_done');
        }
      }

      // Update elapsed time
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [visible, estimateTime]);

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

        {/* Content Card */}
        <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.1)', 'rgba(6, 182, 212, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            {/* Glow Effect */}
            <Animated.View style={[styles.glowEffect, animatedGlowStyle]} />

            {/* Icon */}
            <Animated.View style={[styles.iconContainer, animatedIconRotate]}>
              <Icon name="creation" size={moderateScale(64)} color={COLORS.DEEP_BLUE_LIGHT} />
            </Animated.View>

            {/* Title */}
            <CustomText type="title" bold style={styles.title}>
              {t('persona.loading.title')}
            </CustomText>

            {/* Persona Name */}
            {personaName && (
              <CustomText type="large" style={styles.personaName}>
                {personaName}
              </CustomText>
            )}

            {/* Status Message */}
            <CustomText type="normal" style={styles.statusMessage}>
              {t(statusMessage)}
            </CustomText>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View style={[styles.progressBarFill, animatedProgressStyle]} />
              </View>
              <CustomText type="small" style={styles.progressText}>
                {progress}%
              </CustomText>
            </View>

            {/* Elapsed Time */}
            <CustomText type="small" style={styles.elapsedTime}>
              {t('persona.loading.elapsed_time', { time: elapsedTime })}
            </CustomText>

            {/* Tip */}
            <View style={styles.tipContainer}>
              <Icon name="lightbulb-on" size={moderateScale(16)} color={COLORS.DEEP_BLUE_LIGHT} />
              <CustomText type="small" style={styles.tipText}>
                {t('persona.loading.tip')}
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
  cardContainer: {
    width: scale(320),
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
    width: scale(200),
    height: scale(200),
    borderRadius: scale(100),
    backgroundColor: COLORS.DEEP_BLUE_LIGHT,
    top: scale(-50),
    opacity: 0.2,
    shadowColor: COLORS.DEEP_BLUE_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: scale(50),
    elevation: 20,
  },
  iconContainer: {
    marginBottom: verticalScale(16),
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  personaName: {
    color: COLORS.DEEP_BLUE_LIGHT,
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  statusMessage: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: verticalScale(24),
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: verticalScale(16),
  },
  progressBarBackground: {
    width: '100%',
    height: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(4),
    overflow: 'hidden',
    marginBottom: verticalScale(8),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.DEEP_BLUE_LIGHT,
    borderRadius: scale(4),
  },
  progressText: {
    color: COLORS.TEXT_TERTIARY,
    textAlign: 'center',
  },
  elapsedTime: {
    color: COLORS.TEXT_TERTIARY,
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  tipText: {
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
});

export default AnimaLoadingOverlay;

