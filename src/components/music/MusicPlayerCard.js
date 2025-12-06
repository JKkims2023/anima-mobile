/**
 * 🎵 MusicPlayerCard Component
 * 
 * Shows selected music player with controls
 * Play/Pause, Progress bar, and action buttons (Delete, Share, Attach)
 * 
 * @author JK & Hero Nexus AI
 */

import React, { memo, useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

const CARD_HEIGHT = verticalScale(180);

/**
 * MusicPlayerCard Component
 */
const MusicPlayerCard = memo(({
  music,
  onDelete,
  onShare,
  onAttachToMessage,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const audioRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsPlaying(false);
    };
  }, [music?.music_key]);

  const handlePlayPause = () => {
    HapticService.light();
    setIsPlaying(!isPlaying);
  };

  const handleDelete = () => {
    HapticService.warning();
    onDelete?.(music);
  };

  const handleShare = () => {
    HapticService.light();
    onShare?.(music);
  };

  const handleAttachToMessage = () => {
    HapticService.success();
    onAttachToMessage?.(music);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { height: CARD_HEIGHT }]}>
      {/* Background Glow */}
      <View style={styles.glowLayer} />

      {/* Audio Player (Hidden) */}
      {music?.music_url && (
        <Video
          ref={audioRef}
          source={{ uri: music.music_url }}
          paused={!isPlaying}
          repeat={true}
          playInBackground={false}
          playWhenInactive={false}
          onProgress={(data) => setCurrentTime(data.currentTime)}
          onLoad={(data) => setDuration(data.duration)}
          onEnd={() => setIsPlaying(false)}
          audioOnly={true}
          style={{ height: 0, width: 0 }}
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <CustomText type="big" bold style={styles.title} numberOfLines={1}>
          {music?.music_title || 'Untitled'}
        </CustomText>

        {/* Type Badge */}
        <View style={styles.typeBadge}>
          <Icon
            name={music?.music_type === 'vocal' ? 'microphone' : 'music'}
            size={scale(14)}
            color={currentTheme.mainColor || COLORS.MAIN_COLOR}
          />
          <CustomText type="small" style={styles.typeText}>
            {t(`music.types.${music?.music_type || 'instrumental'}`)}
          </CustomText>
        </View>

        {/* Player Controls */}
        <View style={styles.playerControls}>
          {/* Play/Pause Button */}
          <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseButton}>
            <Icon
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={scale(48)}
              color={currentTheme.mainColor || COLORS.MAIN_COLOR}
            />
          </TouchableOpacity>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                    backgroundColor: currentTheme.mainColor || COLORS.MAIN_COLOR,
                  },
                ]}
              />
            </View>
            <View style={styles.timeContainer}>
              <CustomText type="small" style={styles.timeText}>
                {formatTime(currentTime)}
              </CustomText>
              <CustomText type="small" style={styles.timeText}>
                {formatTime(duration)}
              </CustomText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Icon name="trash-can-outline" size={scale(20)} color="#FF4444" />
            <CustomText type="small" style={[styles.actionText, { color: '#FF4444' }]}>
              {t('music.player.delete')}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Icon name="share-variant" size={scale(20)} color={COLORS.TEXT_SECONDARY} />
            <CustomText type="small" style={styles.actionText}>
              {t('music.player.share')}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleAttachToMessage} style={styles.actionButton}>
            <Icon name="link-variant" size={scale(20)} color={currentTheme.mainColor || COLORS.MAIN_COLOR} />
            <CustomText type="small" style={[styles.actionText, { color: currentTheme.mainColor || COLORS.MAIN_COLOR }]}>
              {t('music.player.attach_to_message')}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

MusicPlayerCard.displayName = 'MusicPlayerCard';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: scale(16),
    marginVertical: scale(12),
    borderRadius: scale(20),
    overflow: 'hidden',
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(62, 80, 180, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(62, 80, 180, 0.3)',
    borderRadius: scale(20),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: scale(8),
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    marginBottom: scale(12),
  },
  typeText: {
    color: COLORS.TEXT_SECONDARY,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
    marginBottom: scale(16),
  },
  playPauseButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    flex: 1,
  },
  progressBar: {
    height: scale(4),
    backgroundColor: 'rgba(62, 80, 180, 0.2)',
    borderRadius: scale(2),
    overflow: 'hidden',
    marginBottom: scale(6),
  },
  progressFill: {
    height: '100%',
    borderRadius: scale(2),
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: scale(11),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(62, 80, 180, 0.2)',
  },
  actionButton: {
    alignItems: 'center',
    gap: scale(4),
  },
  actionText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: scale(11),
  },
});

export default MusicPlayerCard;

