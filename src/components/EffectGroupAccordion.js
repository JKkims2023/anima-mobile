/**
 * 🎨 EffectGroupAccordion Component
 * 
 * Single accordion group for effect selection panels
 * Supports two types:
 * - 'standalone': Single item without accordion (e.g., "None")
 * - 'group': Multiple items with expand/collapse animation
 * 
 * Design Features:
 * - Smooth accordion animation (300ms)
 * - Glassmorphism card design
 * - Consistent spacing and typography
 * - Haptic feedback on interactions
 * - Theme-aware styling
 * - "NEW" badge for new effects
 * - "⭐" badge for recommended effects
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from './CustomText';
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import { useTheme } from '../contexts/ThemeContext';
import HapticService from '../utils/HapticService';

const EffectGroupAccordion = ({ 
  group, 
  isOpen, 
  onToggle, 
  selectedValue,
  onSelect,
}) => {
  const { currentTheme: theme } = useTheme();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STANDALONE TYPE (no accordion)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (group.type === 'standalone') {
    return (
      <View style={styles.standaloneContainer}>
        {group.items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.option,
              { 
                backgroundColor: theme.cardBackground,
                borderColor: selectedValue === item.id ? theme.mainColor : 'transparent',
              },
              selectedValue === item.id && styles.optionSelected,
            ]}
            onPress={() => {
              HapticService.success();
              onSelect(item.id);
            }}
            activeOpacity={0.7}
          >
            {/* Left: Emoji + Info */}
            <View style={styles.optionLeft}>
              <View style={styles.emojiContainer}>
                <CustomText type="big" style={styles.optionEmoji}>
                  {typeof item.emoji === 'function' ? item.emoji() : item.emoji}
                </CustomText>
              </View>
              <View style={styles.optionInfo}>
                <CustomText type="normal" bold style={{ color: theme.textPrimary }}>
                  {typeof item.label === 'function' ? item.label() : item.label}
                </CustomText>
                <CustomText type="small" style={{ color: theme.textSecondary, marginTop: verticalScale(2) }}>
                  {typeof item.description === 'function' ? item.description() : item.description}
                </CustomText>
              </View>
            </View>

            {/* Right: Check Icon */}
            {selectedValue === item.id && (
              <Icon name="check-circle" size={scale(24)} color={theme.mainColor} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GROUP TYPE (with accordion)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Animation values
  const rotateAnim = useSharedValue(isOpen ? 180 : 0);
  const heightAnim = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    rotateAnim.value = withTiming(isOpen ? 180 : 0, { 
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design standard easing
    });
    heightAnim.value = withTiming(isOpen ? 1 : 0, { 
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    });
  }, [isOpen]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: heightAnim.value,
    maxHeight: heightAnim.value * 1000, // Large enough for content
    overflow: 'hidden',
  }));

  return (
    <View style={styles.container}>
      {/* ─────────────────────────────────────────────────────── */}
      {/* Group Header (클릭하면 펼침/접힘) */}
      {/* ─────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[
          styles.header,
          { backgroundColor: theme.cardBackground },
        ]}
        onPress={() => {
          HapticService.light();
          onToggle();
        }}
        activeOpacity={0.7}
      >
        {/* Left: Emoji + Title + Description */}
        <View style={styles.headerLeft}>
          <View style={styles.groupEmojiContainer}>
            <CustomText type="title" style={styles.groupEmoji}>
              {typeof group.emoji === 'function' ? group.emoji() : group.emoji}
            </CustomText>
          </View>
          <View style={styles.headerTextContainer}>
            <CustomText type="normal" bold style={{ color: theme.textPrimary }}>
              {typeof group.title === 'function' ? group.title() : group.title}
            </CustomText>
            <CustomText 
              type="small" 
              style={{ 
                color: theme.textSecondary, 
                marginTop: verticalScale(2),
              }}
            >
              {typeof group.description === 'function' ? group.description() : group.description}
            </CustomText>
          </View>
        </View>

        {/* Right: Chevron Icon */}
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-down" size={scale(24)} color={theme.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      {/* ─────────────────────────────────────────────────────── */}
      {/* Group Content (펼쳐졌을 때만 표시) */}
      {/* ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <Animated.View style={[styles.content, contentStyle]}>
          {group.items.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.option,
                { 
                  backgroundColor: theme.bgSecondary,
                  borderColor: selectedValue === item.id ? theme.mainColor : 'transparent',
                },
                selectedValue === item.id && styles.optionSelected,
                index === group.items.length - 1 && styles.optionLast, // Last item: no margin bottom
              ]}
              onPress={() => {
                HapticService.success();
                onSelect(item.id);
              }}
              activeOpacity={0.7}
            >
              {/* Left: Emoji + Info */}
              <View style={styles.optionLeft}>
                <View style={styles.emojiContainer}>
                  <CustomText type="big" style={styles.optionEmoji}>
                    {typeof item.emoji === 'function' ? item.emoji() : item.emoji}
                  </CustomText>
                </View>
                <View style={styles.optionInfo}>
                  {/* Label + Badges */}
                  <View style={styles.labelRow}>
                    <CustomText type="normal" bold style={{ color: theme.textPrimary }}>
                      {typeof item.label === 'function' ? item.label() : item.label}
                    </CustomText>
                    {/* NEW Badge */}
                    {item.isNew && (
                      <View style={[styles.badge, styles.badgeNew, { backgroundColor: theme.mainColor }]}>
                        <CustomText type="tiny" bold style={{ color: '#fff' }}>
                          NEW
                        </CustomText>
                      </View>
                    )}
                    {/* Recommended Badge */}
                    {item.recommended && (
                      <View style={styles.badgeRecommended}>
                        <CustomText type="small">⭐</CustomText>
                      </View>
                    )}
                  </View>
                  {/* Description */}
                  <CustomText 
                    type="small" 
                    style={{ 
                      color: theme.textSecondary, 
                      marginTop: verticalScale(2),
                    }}
                  >
                    {typeof item.description === 'function' ? item.description() : item.description}
                  </CustomText>
                </View>
              </View>

              {/* Right: Check Icon */}
              {selectedValue === item.id && (
                <View style={styles.checkIconContainer}>
                  <Icon name="check-circle" size={scale(24)} color={theme.mainColor} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styles = StyleSheet.create({
  // ─────────────────────────────────────────────────────────────
  // Standalone Container
  // ─────────────────────────────────────────────────────────────
  standaloneContainer: {
    marginBottom: verticalScale(12),
  },

  // ─────────────────────────────────────────────────────────────
  // Group Container
  // ─────────────────────────────────────────────────────────────
  container: {
    marginBottom: verticalScale(16), // Space between groups
  },

  // ─────────────────────────────────────────────────────────────
  // Group Header
  // ─────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: platformPadding(14),
    paddingHorizontal: platformPadding(16),
    borderRadius: scale(12),
    // Glassmorphism shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scale(12),
  },
  groupEmojiContainer: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEmoji: {
    fontSize: scale(28),
    lineHeight: scale(32),
  },
  headerTextContainer: {
    flex: 1,
  },

  // ─────────────────────────────────────────────────────────────
  // Group Content
  // ─────────────────────────────────────────────────────────────
  content: {
    marginTop: verticalScale(8), // Space between header and items
    gap: verticalScale(8), // Space between items
  },

  // ─────────────────────────────────────────────────────────────
  // Option Item
  // ─────────────────────────────────────────────────────────────
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: platformPadding(14),
    paddingHorizontal: platformPadding(16),
    borderRadius: scale(12),
    borderWidth: 2,
    // Glassmorphism shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  optionSelected: {
    // Neon glow for selected item
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  optionLast: {
    marginBottom: 0, // Remove margin for last item
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scale(12),
  },
  emojiContainer: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: {
    fontSize: scale(24),
    lineHeight: scale(28),
  },
  optionInfo: {
    flex: 1,
  },
  checkIconContainer: {
    marginLeft: scale(8),
  },

  // ─────────────────────────────────────────────────────────────
  // Label Row (Label + Badges)
  // ─────────────────────────────────────────────────────────────
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },

  // ─────────────────────────────────────────────────────────────
  // Badges
  // ─────────────────────────────────────────────────────────────
  badge: {
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: scale(4),
  },
  badgeNew: {
    // Background color set dynamically (theme.mainColor)
  },
  badgeRecommended: {
    // No background, just emoji
  },
});

export default React.memo(EffectGroupAccordion);

