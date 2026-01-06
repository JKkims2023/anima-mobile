/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔒 LimitedModeChips Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Visual progress indicator for LIMITED MODE (자아 수집 진행 상황)
 * 
 * Features:
 * - 4 identity fields as chip UI (🎭 AI 이름, 👤 사용자 이름, 💫 AI 성격, 💬 AI 말투)
 * - Glassmorphism style with ANIMA gradient
 * - Sequential fade-in animation
 * - Pulse effect when field is completed
 * - Gray (incomplete) vs Colorful (completed)
 * - Horizontal scroll
 * 
 * Props:
 * - requiredFields: Array of { field_name, label, emoji, completed }
 * - onFieldPress: Optional callback (for future enhancement)
 * 
 * @author Hero Nexus AI
 * @date 2026-01-06
 */

import React, { useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LimitedModeChips = ({ requiredFields = [] }) => {
  // Animation values for each chip (sequential fade-in)
  const chipOpacities = useMemo(
    () => requiredFields.map(() => useSharedValue(0)),
    [requiredFields.length]
  );

  // Pulse animation for completed chips
  const chipScales = useMemo(
    () => requiredFields.map(() => useSharedValue(1)),
    [requiredFields.length]
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Sequential fade-in animation on mount
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    chipOpacities.forEach((opacity, index) => {
      opacity.value = withDelay(
        index * 150, // Sequential delay
        withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        })
      );
    });
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Pulse animation when field is completed
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    requiredFields.forEach((field, index) => {
      if (field.completed) {
        // Pulse animation: scale up and down once
        chipScales[index].value = withSequence(
          withTiming(1.2, { duration: 200, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 200, easing: Easing.in(Easing.cubic) })
        );
      }
    });
  }, [requiredFields]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Color configuration
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const FIELD_COLORS = {
    name_ko: {
      gradient: ['#FF6B9D', '#C44569'], // 🎭 Pink gradient (AI 이름)
      glow: 'rgba(255, 107, 157, 0.3)',
    },
    speaking_pattern_user: {
      gradient: ['#6C5CE7', '#A29BFE'], // 👤 Purple gradient (사용자 이름)
      glow: 'rgba(108, 92, 231, 0.3)',
    },
    personality: {
      gradient: ['#00B894', '#55EFC4'], // 💫 Green gradient (AI 성격)
      glow: 'rgba(0, 184, 148, 0.3)',
    },
    speaking_style: {
      gradient: ['#FDA7DF', '#F8B500'], // 💬 Orange-pink gradient (AI 말투)
      glow: 'rgba(253, 167, 223, 0.3)',
    },
  };

  const GRAY_GRADIENT = ['#4A5568', '#2D3748']; // Gray for incomplete
  const GRAY_GLOW = 'rgba(74, 85, 104, 0.2)';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {requiredFields.map((field, index) => {
          const isCompleted = field.completed;
          const colors = FIELD_COLORS[field.field_name] || FIELD_COLORS.name_ko;
          const gradient = isCompleted ? colors.gradient : GRAY_GRADIENT;
          const glowColor = isCompleted ? colors.glow : GRAY_GLOW;

          // Animated style for each chip
          const chipAnimatedStyle = useAnimatedStyle(() => ({
            opacity: chipOpacities[index]?.value || 0,
            transform: [{ scale: chipScales[index]?.value || 1 }],
          }));

          return (
            <Animated.View key={field.field_name} style={[styles.chipWrapper, chipAnimatedStyle]}>
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.chip,
                  isCompleted && styles.chipCompleted,
                  { shadowColor: glowColor },
                ]}
              >
                {/* Emoji Icon */}
                <CustomText style={styles.emoji}>{field.emoji}</CustomText>

                {/* Label */}
                <CustomText style={[styles.label, !isCompleted && styles.labelGray]}>
                  {field.label}
                </CustomText>

                {/* Status indicator (checkmark or empty box) */}
                <CustomText style={styles.statusIcon}>
                  {isCompleted ? '✅' : '⬜'}
                </CustomText>
              </LinearGradient>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Progress text */}
      <View style={styles.progressContainer}>
        <CustomText style={styles.progressText}>
          {requiredFields.filter((f) => f.completed).length} / {requiredFields.length} 완료
        </CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    backgroundColor: 'rgba(15, 23, 42, 0.95)', // Dark background with slight transparency
  },
  scrollContent: {
    paddingRight: scale(16),
  },
  chipWrapper: {
    marginRight: scale(12),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: scale(24),
    // Glassmorphism effect
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Shadow for glow effect
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8, // Android shadow
  },
  chipCompleted: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: scale(20),
    marginRight: scale(8),
  },
  label: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: scale(8),
  },
  labelGray: {
    opacity: 0.6,
  },
  statusIcon: {
    fontSize: scale(16),
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  progressText: {
    fontSize: scale(12),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default LimitedModeChips;

