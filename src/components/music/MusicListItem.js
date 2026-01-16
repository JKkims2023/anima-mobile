/**
 * 🎵 MusicListItem - Music History List Card
 * 
 * Features:
 * - Unified card design with MessageHistoryListItem
 * - Music icon with consistent 70x70 thumbnail
 * - Type badge, date, status
 * - Favorite indicator
 * - Creating status support
 * - Press animation
 * 
 * Design: Clean, scannable, efficient, CONSISTENT! 💙
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * MusicListItem Component
 */
const MusicListItem = ({ music, onPress }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  // Extract data
  const {
    music_title = '',
    music_type = 'instrumental',
    is_default = 'N',
    favorite_yn = 'N',
    status = 'completed',
    estimated_time = 0,
    created_at = '',
  } = music || {};

  // Status checks
  const isCreating = status === 'creating' || status === 'pending' || status === 'processing';
  const isFavorite = favorite_yn === 'Y';
  const isSystem = is_default === 'Y';

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: currentTheme.backgroundColor }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Music Icon (70x70 - same as MessageHistoryListItem) */}
      <View style={styles.thumbnailContainer}>
        <View style={[
          styles.thumbnail,
          { backgroundColor: isCreating ? 'rgba(251, 146, 60, 0.15)' : 'rgba(59, 130, 246, 0.15)' }
        ]}>
          <Icon
            name={
              isCreating 
                ? "hourglass-outline" 
                : music_type === 'vocal' 
                  ? "mic-sharp" 
                  : "musical-notes-sharp"
            }
            size={scale(32)}
            color={isCreating ? '#FB923C' : currentTheme.mainColor}
          />
        </View>
        
        {/* Favorite Indicator (same position as MessageHistoryListItem) */}
        {isFavorite && (
          <View style={styles.favoriteIndicator}>
            <Icon name="star" size={scale(14)} color={COLORS.gold} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <CustomText
            style={[styles.title, { color: currentTheme.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {music_title || t('music.untitled')}
          </CustomText>
        </View>

        {/* Type (similar to persona name in MessageHistoryListItem) */}
        <CustomText
          style={[styles.typeText, { color: currentTheme.textSecondary }]}
          numberOfLines={1}
        >
          {music_type === 'vocal' ? '🎤 Vocal' : '🎹 Instrumental'}
        </CustomText>

        {/* Stats Row (same layout as MessageHistoryListItem) */}
        <View style={styles.statsRow}>
          {/* Date */}
          <View style={styles.stat}>
            <Icon name="calendar-outline" size={scale(14)} color={currentTheme.textSecondary} />
            <CustomText style={[styles.statText, { color: currentTheme.textSecondary }]}>
              {formatDate(created_at)}
            </CustomText>
          </View>

          {/* System Badge */}
          {isSystem && (
            <View style={styles.systemBadge}>
              <Icon name="shield-checkmark" size={scale(12)} color="#A855F7" />
              <CustomText style={styles.systemText}>System</CustomText>
            </View>
          )}

          {/* Creating Status Badge */}
          {isCreating && (
            <View style={styles.creatingBadge}>
              <Icon name="hourglass" size={scale(12)} color="#FFFFFF" />
              <CustomText style={styles.creatingText}>
                {estimated_time}s
              </CustomText>
            </View>
          )}
        </View>

        {/* Favorite Badge (similar to MessageHistoryListItem) */}
        {isFavorite && (
          <View style={[styles.stat, { marginTop: verticalScale(4) }]}>
            <Icon name="star" size={scale(14)} color={COLORS.gold} />
            <CustomText style={[styles.statText, { color: COLORS.gold }]}>
              {t('music.favorite')}
            </CustomText>
          </View>
        )}
      </View>

      {/* Arrow */}
      <Icon
        name="chevron-forward"
        size={scale(20)}
        color={currentTheme.textSecondary}
        style={styles.arrow}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Thumbnail (70x70 - UNIFIED!)
  thumbnailContainer: {
    position: 'relative',
    marginRight: scale(12),
  },
  thumbnail: {
    width: scale(70),
    height: scale(70),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: scale(-4),
    right: scale(-4),
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  title: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginRight: scale(8),
  },
  typeText: {
    fontSize: moderateScale(13),
    marginBottom: verticalScale(6),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  statText: {
    fontSize: moderateScale(12),
  },

  // Badges
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(12),
    gap: scale(4),
  },
  systemText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#A855F7',
  },
  creatingBadge: {
    minWidth: verticalScale(40),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FB923C',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(12),
    gap: scale(4),
  },
  creatingText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Arrow
  arrow: {
    marginLeft: scale(8),
  },
});

export default React.memo(MusicListItem);
