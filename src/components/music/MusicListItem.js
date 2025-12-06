/**
 * 🎵 MusicListItem Component
 * 
 * Individual music item in the list
 * Click to select and play in MusicPlayerCard
 * 
 * @author JK & Hero Nexus AI
 */

import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

/**
 * MusicListItem Component
 */
const MusicListItem = memo(({ music, isSelected = false, onPress }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  const handlePress = () => {
    HapticService.light();
    onPress?.(music);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const isDefault = music?.is_default === 'Y';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && {
          backgroundColor: `${currentTheme.mainColor || COLORS.MAIN_COLOR}15`,
          borderColor: currentTheme.mainColor || COLORS.MAIN_COLOR,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Left: Icon */}
      <View style={styles.iconContainer}>
        <Icon
          name={music?.music_type === 'vocal' ? 'microphone' : 'music'}
          size={scale(24)}
          color={isSelected ? currentTheme.mainColor || COLORS.MAIN_COLOR : COLORS.TEXT_SECONDARY}
        />
      </View>

      {/* Center: Info */}
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <CustomText
            type="normal"
            bold
            style={[
              styles.title,
              isSelected && { color: currentTheme.mainColor || COLORS.MAIN_COLOR },
            ]}
            numberOfLines={1}
          >
            {music?.music_title || 'Untitled'}
          </CustomText>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <CustomText type="small" style={styles.defaultText}>
                Default
              </CustomText>
            </View>
          )}
        </View>
        <View style={styles.metaRow}>
          <CustomText type="small" style={styles.metaText}>
            {t(`music.types.${music?.music_type || 'instrumental'}`)}
          </CustomText>
          <CustomText type="small" style={styles.metaText}>
            •
          </CustomText>
          <CustomText type="small" style={styles.metaText}>
            {formatDate(music?.created_at)}
          </CustomText>
        </View>
      </View>

      {/* Right: Selected Indicator */}
      {isSelected && (
        <Icon
          name="check-circle"
          size={scale(24)}
          color={currentTheme.mainColor || COLORS.MAIN_COLOR}
        />
      )}
    </TouchableOpacity>
  );
});

MusicListItem.displayName = 'MusicListItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    marginHorizontal: scale(16),
    marginBottom: scale(10),
    borderRadius: scale(12),
    backgroundColor: 'rgba(30, 30, 46, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(62, 80, 180, 0.2)',
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(62, 80, 180, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  infoContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(4),
    gap: scale(8),
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  defaultBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  defaultText: {
    color: COLORS.MAIN_COLOR,
    fontSize: scale(10),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  metaText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: scale(11),
  },
});

export default MusicListItem;

