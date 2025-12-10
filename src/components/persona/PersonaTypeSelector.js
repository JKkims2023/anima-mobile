/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 PersonaTypeSelector - Single Toggle Chip Style Selector
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Gradient background (dark → transparent)
 * - Single chip: Toggles between Default → User → Favorite
 * - Active chip: border + background + color
 * - Create button on right (user mode only)
 * - Count display for current mode
 * - Next icon (→) for visual feedback
 * 
 * Mobile Optimized: Single chip design for narrow screens
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-08
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';

const PersonaTypeSelector = ({
  isUserMode = false, // false: 기본 제공, true: 사용자 생성
  isFavoriteMode = false, // ⭐ NEW: Favorite filter mode
  defaultCount = 0,
  userCount = 0,
  favoriteCount = 0, // ⭐ NEW: Favorite count
  onTypeChange,
  onCreatePress,
  showCreateButton = true,
}) => {
  const { t } = useTranslation();
  const { currentTheme: theme } = useTheme();

  // ⭐ Cycle through modes: default -> user -> favorite -> default
  const handleModeToggle = () => {
    HapticService.light();
    
    if (!isUserMode && !isFavoriteMode) {
      // Currently default, switch to user
      onTypeChange?.('user');
    } else if (isUserMode && !isFavoriteMode) {
      // Currently user, switch to favorite
      onTypeChange?.('favorite');
    } else {
      // Currently favorite, switch to default
      onTypeChange?.('default');
    }
  };

  const handleCreate = () => {
    HapticService.light();
    onCreatePress?.();
  };

  // ⭐ Get current mode info
  const getCurrentModeInfo = () => {
    if (isFavoriteMode) {
      return {
        emoji: '⭐',
        label: t('persona.favorite'),
        count: favoriteCount,
      };
    } else if (isUserMode) {
      return {
        emoji: '✨',
        label: t('message.select_user_mode'),
        count: userCount,
      };
    } else {
      return {
        emoji: '🆓',
        label: t('message.select_default_mode'),
        count: defaultCount,
      };
    }
  };

  const currentMode = getCurrentModeInfo();

  return (
    <View style={styles.container}>
      {/* ⭐ Gradient Background (Dark → Transparent) */}
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.8)',
          'rgba(0, 0, 0, 0.4)',
          'rgba(0, 0, 0, 0.0)',
        ]}
        locations={[0, 0.5, 1]}
        style={styles.gradientBackground}
      />

      {/* ⭐ Content */}
      <View style={styles.content}>
        {/* Single Mode Chip (Toggles on Click) */}
        <TouchableOpacity
          style={[
            styles.singleChip,
            { backgroundColor: `${theme.mainColor}20`, borderColor: theme.mainColor },
          ]}
          onPress={handleModeToggle}
          activeOpacity={0.7}
        >
          <View style={styles.chipContent}>
            <CustomText
              type="title"
              bold
              style={[
                styles.chipText,
                { color: 'white' },
              ]}
            >
              {currentMode.emoji} {currentMode.label}
            </CustomText>
            <CustomText
              type="small"
              style={[
                styles.chipCount,
                { color: 'white' },
              ]}
            >
              ({currentMode.count})
            </CustomText>
          </View>
          
          {/* Next Icon */}
          <Icon name="chevron-right" size={scale(20)} color="white" />
        </TouchableOpacity>

        {/* Right: Create Button */}
        {showCreateButton && isUserMode && !isFavoriteMode && (
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.mainColor }]}
            onPress={handleCreate}
            activeOpacity={0.8}
          >
            <Icon name="add" size={scale(20)} color="#FFFFFF" />
            <CustomText type="small" bold style={styles.createButtonText}>
              {t('persona.create')}
            </CustomText>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },

  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(100),
    zIndex: 1,
  },

  content: {
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(16),
    paddingTop: platformPadding(16),
    paddingBottom: platformPadding(12),
    gap: scale(12),
  },

  // ⭐ Single Chip (Toggleable)
  singleChip: {

    flexDirection: 'row',
    alignItems: 'center',
    width: 'auto',
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(12),
    borderRadius: scale(24),
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',

  },

  chipText: {
    marginRight: scale(4),
  },

  chipCount: {
    opacity: 0.8,
  },

  // ⭐ Create Button
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: platformPadding(14),
    paddingVertical: platformPadding(14),
    borderRadius: scale(24),
    gap: scale(4),
    marginRight: scale(12),
  },

  createButtonText: {
    color: '#FFFFFF',
    display: 'none',
  },
});

export default PersonaTypeSelector;

