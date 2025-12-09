/**
 * 📋 EffectListView Component
 * 
 * Displays a list of effects for the selected group
 * Used in combination with FloatingChipNavigation
 * 
 * Design Features:
 * - Clean, scrollable list
 * - Selected effect: Border + Neon glow
 * - Smooth animations
 * - Haptic feedback
 * - NEW/Recommended badges
 * - Glassmorphism cards
 * 
 * @author JK & Hero Nexus AI
 */

import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from './CustomText';
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import { useTheme } from '../contexts/ThemeContext';
import HapticService from '../utils/HapticService';

const EffectListView = ({ 
  items,            // Array of effect items from selected group
  selectedValue,    // Currently selected effect ID
  onSelect,         // Callback when effect is selected
}) => {
  const { currentTheme: theme } = useTheme();

  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {/* Emoji */}
        <CustomText style={styles.emptyEmoji}>✨</CustomText>
        
        {/* Title */}
        <CustomText type="title" bold style={{ color: theme.textPrimary, marginTop: verticalScale(12) }}>
          선택안됨
        </CustomText>
        
        {/* Description */}
        <CustomText 
          type="normal" 
          style={{ 
            color: theme.textSecondary, 
            marginTop: verticalScale(8),
            textAlign: 'center',
            lineHeight: scale(20),
          }}
        >
          위의 그룹에서{'\n'}원하는 효과를 선택해주세요
        </CustomText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {items.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.effectItem,
            { 
              backgroundColor: theme.bgSecondary || theme.cardBackground,
              borderColor: selectedValue === item.id ? theme.mainColor : 'rgba(255, 255, 255, 0.1)',
            },
            selectedValue === item.id && styles.effectItemSelected,
          ]}
          onPress={() => {
            HapticService.success();
            onSelect(item.id);
          }}
          activeOpacity={0.7}
        >
          {/* Left: Emoji + Info */}
          <View style={styles.effectLeft}>
            {/* Emoji Container */}
            <View style={styles.emojiContainer}>
              <CustomText type="big" style={styles.effectEmoji}>
                {typeof item.emoji === 'function' ? item.emoji() : item.emoji}
              </CustomText>
            </View>

            {/* Info Container */}
            <View style={styles.effectInfo}>
              {/* Label + Badges */}
              <View style={styles.labelRow}>
                <CustomText type="title" bold style={{ color: theme.textPrimary }}>
                  {typeof item.label === 'function' ? item.label() : item.label}
                </CustomText>
                
                {/* NEW Badge */}
                {item.isNew && (
                  <View style={[styles.badge, styles.badgeNew, { backgroundColor: theme.mainColor, display: 'none' }]}>
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
    </ScrollView>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(0),
    paddingVertical: verticalScale(10),
    gap: verticalScale(10), // Space between items
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyEmoji: {
    fontSize: scale(48),
    lineHeight: scale(56),
  },

  // ─────────────────────────────────────────────────────────────
  // Effect Item
  // ─────────────────────────────────────────────────────────────
  effectItem: {
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
  effectItemSelected: {
    // Neon glow for selected item
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // ─────────────────────────────────────────────────────────────
  // Left Side (Emoji + Info)
  // ─────────────────────────────────────────────────────────────
  effectLeft: {
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
  effectEmoji: {
    fontSize: scale(24),
    lineHeight: scale(28),
  },
  effectInfo: {
    flex: 1,
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

  // ─────────────────────────────────────────────────────────────
  // Right Side (Check Icon)
  // ─────────────────────────────────────────────────────────────
  checkIconContainer: {
    marginLeft: scale(8),
  },
});

export default React.memo(EffectListView);

