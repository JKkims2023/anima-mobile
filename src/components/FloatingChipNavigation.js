/**
 * 💎 FloatingChipNavigation Component
 * 
 * Horizontal scrollable chip navigation for effect groups
 * Replaces accordion with more intuitive, emotional design
 * 
 * Design Features:
 * - Horizontal scroll with snap
 * - Selected chip: Gradient + Neon glow + Underline
 * - Smooth spring animations
 * - Haptic feedback
 * - Auto-scroll to selected chip
 * - Glassmorphism + ANIMA design philosophy
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from './CustomText';
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import { useTheme } from '../contexts/ThemeContext';
import HapticService from '../utils/HapticService';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const FloatingChipNavigation = ({ 
  groups,           // Array of group objects with id, emoji, title
  selectedGroupId,  // Currently selected group ID
  onSelectGroup,    // Callback when chip is pressed
}) => {
  const { currentTheme: theme } = useTheme();
  const scrollViewRef = useRef(null);
  const chipRefs = useRef({}); // Store refs for each chip for auto-scroll

  // Auto-scroll to selected chip when selection changes
  useEffect(() => {
    if (chipRefs.current[selectedGroupId] && scrollViewRef.current) {
      chipRefs.current[selectedGroupId].measureLayout(
        scrollViewRef.current,
        (x) => {
          scrollViewRef.current.scrollTo({ 
            x: Math.max(0, x - scale(20)), // Scroll to chip with 20px padding
            animated: true 
          });
        },
        () => {} // Error callback (ignore)
      );
    }
  }, [selectedGroupId]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToAlignment="center"
        decelerationRate="fast"
      >
        {groups.map((group, index) => (
          <ChipItem
            key={group.id}
            group={group}
            isSelected={selectedGroupId === group.id}
            onPress={() => {
              HapticService.light();
              onSelectGroup(group.id);
            }}
            chipRef={(ref) => { chipRefs.current[group.id] = ref; }}
            theme={theme}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ChipItem Component (Individual Chip)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ChipItem = ({ group, isSelected, onPress, chipRef, theme }) => {
  // Animation values
  const scale = useSharedValue(isSelected ? 1 : 0.95);
  const opacity = useSharedValue(isSelected ? 1 : 0.7);
  const glowOpacity = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1 : 0.95, {
      damping: 15,
      stiffness: 300,
    });
    opacity.value = withTiming(isSelected ? 1 : 0.7, { duration: 200 });
    glowOpacity.value = withTiming(isSelected ? 1 : 0, { duration: 300 });
  }, [isSelected]);

  const chipAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const underlineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scaleX: glowOpacity.value }],
  }));

  return (
    <AnimatedTouchableOpacity
      ref={chipRef}
      style={[styles.chip, chipAnimatedStyle]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Background (changes based on selection) */}
      {isSelected ? (
        // ⭐ Selected: Gradient + Glow
        <>
          {/* Neon Glow Layer */}
          <Animated.View style={[styles.glowLayer, glowAnimatedStyle]} />
          
          {/* Gradient Background */}
          <AnimatedLinearGradient
            colors={['#4FACFE', '#00F2FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chipGradient}
          >
            <View style={styles.chipContent}>
              <CustomText type="big" style={styles.chipEmoji}>
                {typeof group.emoji === 'function' ? group.emoji() : group.emoji}
              </CustomText>
              <CustomText type="normal" bold style={styles.chipLabelSelected}>
                {typeof group.title === 'function' ? group.title() : group.title}
              </CustomText>
            </View>
          </AnimatedLinearGradient>

          {/* Underline */}
          <Animated.View 
            style={[
              styles.underline, 
              { backgroundColor: '#00F2FE' },
              underlineAnimatedStyle
            ]} 
          />
        </>
      ) : (
        // ⚪ Default: Glassmorphism
        <View style={[styles.chipDefault, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.chipContent}>
            <CustomText type="big" style={styles.chipEmoji}>
              {typeof group.emoji === 'function' ? group.emoji() : group.emoji}
            </CustomText>
            <CustomText type="title" style={[styles.chipLabel, { color: theme.textSecondary }]}>
              {typeof group.title === 'function' ? group.title() : group.title}
            </CustomText>
          </View>
        </View>
      )}
    </AnimatedTouchableOpacity>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(20),
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    gap: scale(12), // Space between chips
    alignItems: 'center',
  },

  // ─────────────────────────────────────────────────────────────
  // Chip Container
  // ─────────────────────────────────────────────────────────────
  chip: {
    position: 'relative', // For glow layer
  },

  // ─────────────────────────────────────────────────────────────
  // Glow Layer (Neon effect for selected chip)
  // ─────────────────────────────────────────────────────────────
  glowLayer: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: scale(24),
    backgroundColor: '#4FACFE',
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },

  // ─────────────────────────────────────────────────────────────
  // Gradient Background (Selected Chip)
  // ─────────────────────────────────────────────────────────────
  chipGradient: {
    borderRadius: scale(20),
    paddingVertical: platformPadding(10),
    paddingHorizontal: platformPadding(16),
  },

  // ─────────────────────────────────────────────────────────────
  // Default Background (Unselected Chip)
  // ─────────────────────────────────────────────────────────────
  chipDefault: {
    borderRadius: scale(20),
    paddingVertical: platformPadding(10),
    paddingHorizontal: platformPadding(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    // Glassmorphism shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // ─────────────────────────────────────────────────────────────
  // Chip Content (Emoji + Label)
  // ─────────────────────────────────────────────────────────────
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  chipEmoji: {
    fontSize: scale(20),
    lineHeight: scale(24),
  },
  chipLabel: {
    fontSize: scale(18),
    lineHeight: scale(18),
  },
  chipLabelSelected: {
    fontSize: scale(18),
    lineHeight: scale(18),
    color: '#FFFFFF',
  },

  // ─────────────────────────────────────────────────────────────
  // Underline (Selected Chip)
  // ─────────────────────────────────────────────────────────────
  underline: {
    position: 'absolute',
    bottom: -verticalScale(6),
    left: '20%',
    right: '20%',
    height: verticalScale(3),
    borderRadius: verticalScale(2),
    // Neon glow for underline
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default React.memo(FloatingChipNavigation);

