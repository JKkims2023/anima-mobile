/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 PersonaTypeSelector - Elegant Chip Style Type Selector
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Gradient background (dark → transparent)
 * - Two chips: Default / User
 * - Active chip: underline + background
 * - Create button on right
 * - Count display
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-07
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
  defaultCount = 0,
  userCount = 0,
  onTypeChange,
  onCreatePress,
  showCreateButton = true,
}) => {
  const { t } = useTranslation();
  const { currentTheme: theme } = useTheme();

  const handleDefaultPress = () => {
    if (!isUserMode) return; // Already selected
    HapticService.light();
    onTypeChange?.(false);
  };

  const handleUserPress = () => {
    if (isUserMode) return; // Already selected
    HapticService.light();
    onTypeChange?.(true);
  };

  const handleCreate = () => {
    HapticService.light();
    onCreatePress?.();
  };

  return (
    <View style={styles.container}>
      {/* ⭐ Gradient Background (Dark → Transparent) */}
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.6)',
          'rgba(0, 0, 0, 0.4)',
          'rgba(0, 0, 0, 0.0)',
        ]}
        locations={[0, 0.5, 1]}
        style={styles.gradientBackground}
      />

      {/* ⭐ Content */}
      <View style={styles.content}>
        {/* Left: Type Chips */}
        <View style={styles.chipsContainer}>
          {/* Default Chip */}
          <TouchableOpacity
            style={[
              styles.chip,
              !isUserMode && [
                styles.chipActive,
                { backgroundColor: `${theme.mainColor}20`, borderColor: theme.mainColor },
              ],
            ]}
            onPress={handleDefaultPress}
            activeOpacity={0.7}
          >
            <CustomText
              type="body"
              bold={!isUserMode}
              style={[
                styles.chipText,
                { color: !isUserMode ? theme.mainColor : theme.textSecondary },
              ]}
            >
              🌐 {t('message.select_default_mode')}
            </CustomText>
            <CustomText
              type="small"
              style={[
                styles.chipCount,
                { color: !isUserMode ? theme.mainColor : theme.textSecondary },
              ]}
            >
              ({defaultCount})
            </CustomText>
            {!isUserMode && <View style={[styles.chipUnderline, { backgroundColor: theme.mainColor }]} />}
          </TouchableOpacity>

          {/* User Chip */}
          <TouchableOpacity
            style={[
              styles.chip,
              isUserMode && [
                styles.chipActive,
                { backgroundColor: `${theme.mainColor}20`, borderColor: theme.mainColor },
              ],
            ]}
            onPress={handleUserPress}
            activeOpacity={0.7}
          >
            <CustomText
              type="body"
              bold={isUserMode}
              style={[
                styles.chipText,
                { color: isUserMode ? theme.mainColor : theme.textSecondary },
              ]}
            >
              👤 {t('message.select_user_mode')}
            </CustomText>
            <CustomText
              type="small"
              style={[
                styles.chipCount,
                { color: isUserMode ? theme.mainColor : theme.textSecondary },
              ]}
            >
              ({userCount})
            </CustomText>
            {isUserMode && <View style={[styles.chipUnderline, { backgroundColor: theme.mainColor }]} />}
          </TouchableOpacity>
        </View>

        {/* Right: Create Button */}
        {showCreateButton && isUserMode && (
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
  },

  // ⭐ Chips
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },

  chip: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(10),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  chipActive: {
    borderWidth: 2,
  },

  chipText: {
    marginRight: scale(4),
  },

  chipCount: {
    opacity: 0.8,
  },

  chipUnderline: {
    position: 'absolute',
    bottom: 0,
    left: platformPadding(16),
    right: platformPadding(16),
    height: 2,
    borderRadius: 1,
  },

  // ⭐ Create Button
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: platformPadding(14),
    paddingVertical: platformPadding(8),
    borderRadius: scale(20),
    gap: scale(4),
  },

  createButtonText: {
    color: '#FFFFFF',
  },
});

export default PersonaTypeSelector;

