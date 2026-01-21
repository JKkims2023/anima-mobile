/**
 * 📜 MessageHistoryListItem - History List Card
 * 
 * Features:
 * - Card style with persona thumbnail
 * - Message title, date, stats
 * - Reply count badge
 * - Favorite indicator
 * - Press animation
 * 
 * Design: Clean, scannable, efficient
 * 
 * @author JK & Hero Nexus AI
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * MessageHistoryListItem Component
 */
const MessageHistoryListItem = ({ message, onPress }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  // Extract data
  const {
    message_title = '',
    message_content = '',
    persona_name = 'Unknown',
    persona_image_url = '',
    created_at = '',
    share_count = 0,
    favorite_yn = 'N',
    reply_count = 0, // New: reply count from JOIN query
  } = message || {};

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
        { backgroundColor: 'transparent' }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Persona Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {persona_image_url ? (
          <FastImage
            source={{ uri: persona_image_url }}
            style={styles.thumbnail}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Icon name="person" size={scale(32)} color={currentTheme.textSecondary} />
          </View>
        )}
        
        {/* Favorite Indicator */}
        {favorite_yn === 'Y' && (
          <View style={styles.favoriteIndicator}>
            <Icon name="star" size={scale(14)} color={COLORS.gold} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title & Reply Badge */}
        <View style={styles.titleRow}>
          <CustomText
            style={[styles.title, { color: currentTheme.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            maxLength={10}
          >
            {message_title || t('history.untitled')}
          </CustomText>
          
        </View>

        {/* Persona Name */}
        <CustomText
          style={[styles.personaName, { color: currentTheme.textSecondary }]}
          numberOfLines={1}
        >
          {persona_name}
        </CustomText>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Icon name="calendar-outline" size={scale(14)} color={currentTheme.textSecondary} />
            <CustomText style={[styles.statText, { color: currentTheme.textSecondary }]}>
              {formatDate(created_at)}
            </CustomText>
          </View>

          <View style={styles.stat}>
            <Icon name="share-social-outline" size={scale(14)} color={currentTheme.textSecondary} />
            <CustomText style={[styles.statText, { color: currentTheme.textSecondary }]}>
              {share_count}
            </CustomText>
          </View>

          {/* Reply Count Badge */}
          {reply_count > 0 && (
            <View style={styles.replyBadge}>
              <Icon name="chatbubble" size={scale(12)} color="#FFFFFF" />
              <CustomText style={styles.replyCount}>{reply_count}</CustomText>
            </View>
          )}
        </View>
        {favorite_yn === 'Y' && (
          <View style={[styles.stat, { marginTop: verticalScale(4) }]}>
            <Icon name="star" size={scale(14)} color={COLORS.gold} />
            <CustomText style={[styles.statText, { color: COLORS.gold }]}>
              {t('history.favorite')}
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
  
  // Thumbnail
  thumbnailContainer: {
    position: 'relative',
    marginRight: scale(12),
  },
  thumbnail: {
    width: scale(70),
    height: scale(70),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  thumbnailPlaceholder: {
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
  replyBadge: {
    minWidth:verticalScale(40),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neonBlue,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(12),
    gap: scale(4),
  },
  replyCount: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  personaName: {
    fontSize: moderateScale(13),
    marginBottom: verticalScale(6),
    display: 'none',
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

  // Arrow
  arrow: {
    marginLeft: scale(8),
  },
});

export default React.memo(MessageHistoryListItem);

