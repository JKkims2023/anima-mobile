/**
 * 🖼️ BackgroundListItem - User-Created Background List Item
 * 
 * Features:
 * - Thumbnail display (media_url)
 * - Video badge (convert_done_yn)
 * - Date & tags (emotion_tag, location_tag)
 * - Card-based design (consistent with MusicListItem)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-21
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

/**
 * Format date helper
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const BackgroundListItem = ({ background, onPress }) => {
  const { currentTheme } = useTheme();

  // Determine if this is a video background
  const isVideo = background.video_url && background.convert_done_yn === 'Y';
  const mediaUrl = background.media_url;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: currentTheme.cardBackground }
      ]}
      onPress={() => onPress?.(background)}
      activeOpacity={0.7}
    >
      {/* Left: Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <FastImage
          source={{ uri: mediaUrl }}
          style={styles.thumbnail}
          resizeMode={FastImage.resizeMode.cover}
        />
        
        {/* Video Badge */}
        {isVideo && (
          <View style={styles.videoBadge}>
            <Icon name="videocam" size={scale(14)} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Right: Info */}
      <View style={styles.infoContainer}>
        {/* Tags */}
        <View style={styles.tagsRow}>
          {background.emotion_tag && (
            <View style={[styles.tag, { backgroundColor: 'rgba(168, 237, 234, 0.15)' }]}>
              <CustomText style={styles.tagText}>
                {background.emotion_tag}
              </CustomText>
            </View>
          )}
          {background.location_tag && (
            <View style={[styles.tag, { backgroundColor: 'rgba(254, 214, 227, 0.15)' }]}>
              <Icon name="location" size={scale(12)} color={COLORS.neonPink} />
              <CustomText style={styles.tagText}>
                {background.location_tag}
              </CustomText>
            </View>
          )}   
        </View>

        {/* Date */}
        <CustomText style={[styles.date, { color: currentTheme.textSecondary }]}>
          {formatDate(background.created_at)}
        </CustomText>

        {/* Type Badge */}
        <View style={styles.typeRow}>
          <View style={[styles.typeBadge, { backgroundColor: isVideo ? 'rgba(106, 90, 205, 0.2)' : 'rgba(60, 179, 113, 0.2)' }]}>
            <Icon 
              name={isVideo ? "videocam" : "image"} 
              size={scale(12)} 
              color={isVideo ? '#9D4EDD' : '#3CB371'} 
            />
            <CustomText style={[styles.typeText, { color: isVideo ? '#9D4EDD' : '#3CB371' }]}>
              {isVideo ? 'Video' : 'Image'}
            </CustomText>
          </View>
        </View>
      </View>

      {/* Arrow Icon */}
      <Icon 
        name="chevron-forward" 
        size={scale(20)} 
        color={currentTheme.textSecondary} 
        style={styles.arrowIcon}
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
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(12),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Thumbnail
  thumbnailContainer: {
    width: scale(70),
    height: scale(70),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    marginRight: scale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: moderateScale(4),
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
  },
  
  // Info
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: verticalScale(6),
  },
  tagsRow: {
    flexDirection: 'row',
    gap: scale(6),
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    gap: scale(4),
  },
  tagText: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  date: {
    fontSize: moderateScale(12),
    fontWeight: '400',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    gap: scale(4),
  },
  typeText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  
  // Arrow
  arrowIcon: {
    marginLeft: scale(8),
  },
});

export default BackgroundListItem;
