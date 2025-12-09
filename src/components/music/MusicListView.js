/**
 * 🎵 MusicListView Component
 * 
 * Displays a list of music for the selected group
 * Used in combination with FloatingChipNavigation
 * 
 * Design Features:
 * - Simplified music info (제목, 타입, 생성일만)
 * - Play button for preview
 * - Select button
 * - Clean, scrollable list
 * 
 * @author JK & Hero Nexus AI
 */

import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import HapticService from '../../utils/HapticService';

const MusicListView = ({ 
  items,            // Array of music items from selected group
  selectedValue,    // Currently selected music key
  onSelect,         // Callback when music is selected
  onPlay,           // Callback when play button is pressed
  playingMusicKey,  // Currently playing music key
}) => {
  const { currentTheme: theme } = useTheme();
  const { t } = useTranslation();

  // Get music type icon
  const getMusicTypeIcon = (type) => {
    if (type === 'none') return '🚫';
    return type === 'vocal' ? '🎤' : '🎵';
  };

  // Get music type label
  const getMusicTypeLabel = (type) => {
    if (type === 'none') return t('music.type.none', '음원 없음');
    return type === 'vocal' 
      ? t('music.type.vocal', '보컬')
      : t('music.type.instrumental', '순수음원');
  };

  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {/* Emoji */}
        <CustomText style={styles.emptyEmoji}>🎵</CustomText>
        
        {/* Title */}
        <CustomText type="title" bold style={{ color: theme.textPrimary, marginTop: verticalScale(12) }}>
          음원 없음
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
          이 그룹에는 음원이 없습니다
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
      {items.map((music, index) => {
        const isSelected = selectedValue === music.music_key;
        const isPlaying = playingMusicKey === music.music_key;
        const isNone = music.music_key === 'none';

        return (
          <TouchableOpacity
            key={music.music_key}
            style={[
              styles.musicItem,
              { 
                backgroundColor: theme.bgSecondary || theme.cardBackground,
                borderColor: isSelected ? theme.mainColor : 'rgba(255, 255, 255, 0.1)',
              },
              isSelected && styles.musicItemSelected,
            ]}
            onPress={() => {
              // Row 클릭 → 재생 (음원 없음은 재생 불가)
              if (!isNone && onPlay) {
                onPlay(music);
              }
            }}
            activeOpacity={0.7}
          >
            {/* Left: Type Icon */}
            <View style={styles.iconContainer}>
              <CustomText type="big" style={styles.musicEmoji}>
                {getMusicTypeIcon(music.music_type)}
              </CustomText>
            </View>

            {/* Center: Music Info */}
            <View style={styles.musicInfo}>
              {/* Title */}
              <CustomText type="title" bold style={{ color: theme.textPrimary }} numberOfLines={1}>
                {music.music_title}
              </CustomText>
              
              {/* Type */}
              <CustomText 
                type="small" 
                style={{ 
                  color: theme.textSecondary, 
                  marginTop: verticalScale(2),
                }}
              >
                {getMusicTypeLabel(music.music_type)}
              </CustomText>
              
              {/* Created Date (음원 없음은 제외) */}
              {!isNone && (
                <CustomText 
                  type="tiny" 
                  style={{ 
                    color: theme.textTertiary, 
                    marginTop: verticalScale(2),
                  }}
                >
                  {new Date(music.created_at).toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </CustomText>
              )}
            </View>

            {/* Right: Play + Select Buttons */}
            <View style={styles.musicActions}>
              {/* Play Button (음원 없음은 숨김) */}
              {!isNone && (
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: theme.mainColor }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    HapticService.light();
                    onPlay && onPlay(music);
                  }}
                >
                  <Icon 
                    name={isPlaying ? 'stop' : 'play'} 
                    size={scale(16)} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              )}

              {/* Select Button */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  HapticService.success();
                  onSelect && onSelect(music);
                }}
                style={{ marginLeft: isNone ? 0 : scale(8) }}
              >
                <Icon 
                  name={isSelected ? 'check-circle' : 'checkbox-blank-circle-outline'} 
                  size={scale(28)} 
                  color={isSelected ? theme.mainColor : theme.textTertiary} 
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}
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
    gap: verticalScale(10),
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
  // Music Item
  // ─────────────────────────────────────────────────────────────
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  musicItemSelected: {
    // Neon glow for selected item
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // ─────────────────────────────────────────────────────────────
  // Left Side (Icon)
  // ─────────────────────────────────────────────────────────────
  iconContainer: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  musicEmoji: {
    fontSize: scale(24),
    lineHeight: scale(28),
  },

  // ─────────────────────────────────────────────────────────────
  // Center (Music Info)
  // ─────────────────────────────────────────────────────────────
  musicInfo: {
    flex: 1,
  },

  // ─────────────────────────────────────────────────────────────
  // Right Side (Actions)
  // ─────────────────────────────────────────────────────────────
  musicActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: scale(12),
  },
  playButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(MusicListView);

