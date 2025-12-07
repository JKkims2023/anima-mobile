/**
 * 🎵 MusicPlayerSheet - Music Playback & Management
 * 
 * Features:
 * - Music playback (play/pause)
 * - Simple pulse animation (no tempo sync)
 * - Attach to message
 * - Delete (user music only)
 * - Share
 * - Real-time state sync with parent
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnima } from '../../contexts/AnimaContext';
import HapticService from '../../utils/HapticService';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

/**
 * MusicPlayerSheet Component
 */
const MusicPlayerSheet = forwardRef(({ music, onMusicUpdate }, ref) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { showAlert, showToast } = useAnima();
  
  // Refs
  const bottomSheetRef = useRef(null);
  const videoRef = useRef(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(1.0); // 0.0 ~ 1.0
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    present: () => {
      bottomSheetRef.current?.present();
      // Auto-play on open
      setIsPlaying(true);
    },
    dismiss: () => {
      bottomSheetRef.current?.dismiss();
      // Pause on close
      setIsPlaying(false);
    },
  }));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Pulse animation for play button
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isPlaying && !isLoading) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1.0, { duration: 500 })
        ),
        -1
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying, isLoading]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle play/pause
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handlePlayPause = () => {
    HapticService.light();
    setIsPlaying(prev => !prev);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle delete
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleDelete = () => {
    HapticService.light();

    // Prevent deletion of system music
    if (music?.is_default === 'Y') {
      showToast({
        type: 'warning',
        message: t('music.toast.cannot_delete_default'),
        emoji: '⚠️',
      });
      return;
    }

    showAlert({
      title: t('music.player.delete_confirm'),
      message: t('music.player.delete_confirm_message'),
      emoji: '🗑️',
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('music.player.delete'),
          style: 'destructive',
          onPress: () => {
            // Notify parent to delete
            onMusicUpdate?.(music, 'delete');
            bottomSheetRef.current?.dismiss();
          },
        },
      ],
    });
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle share
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleShare = async () => {
    HapticService.light();

    try {
      await Share.share({
        message: Platform.OS === 'ios'
          ? `${music.music_title}\n\n${music.music_url}`
          : music.music_url,
        url: Platform.OS === 'ios' ? music.music_url : undefined,
        title: music.music_title,
      });
    } catch (error) {
      console.error('[MusicPlayerSheet] Share error:', error);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Video callbacks
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleVideoLoad = (data) => {
    setIsLoading(false);
    setDuration(data.duration);
  };

  const handleVideoProgress = (data) => {
    if (!isSeeking) {
      setCurrentTime(data.currentTime);
    }
  };

  const handleVideoError = (error) => {
    console.error('[MusicPlayerSheet] Video error:', error);
    setIsLoading(false);
    showToast({
      type: 'error',
      message: t('common.error'),
      emoji: '❌',
    });
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle progress slider change
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleProgressSliderChange = (value) => {
    setCurrentTime(value);
    setIsSeeking(true);
  };

  const handleProgressSliderComplete = (value) => {
    videoRef.current?.seek(value);
    setIsSeeking(false);
    HapticService.light();
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle volume slider change
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleVolumeChange = (value) => {
    setVolume(value);
    HapticService.light();
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Format time (seconds to mm:ss)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Format date
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Get volume icon
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const getVolumeIcon = () => {
    if (volume === 0) return 'volume-mute';
    if (volume < 0.5) return 'volume-low';
    return 'volume-high';
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!music) return null;

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      snapPoints={['75%']}
      title={t('music.player.title') || '음원 재생'}
      onClose={() => setIsPlaying(false)}
      showCloseButton
    >
      <View style={[styles.container, { backgroundColor: currentTheme.cardBackground }]}>
        {/* Hidden Audio Player */}
        {music.music_url && (
          <Video
            ref={videoRef}
            source={{ uri: music.music_url }}
            audioOnly
            paused={!isPlaying}
            repeat
            playInBackground
            playWhenInactive
            volume={volume}
            onLoad={handleVideoLoad}
            onProgress={handleVideoProgress}
            onError={handleVideoError}
            progressUpdateInterval={250}
            style={styles.hiddenVideo}
          />
        )}

        {/* Music Info */}
        <View style={styles.infoSection}>
          {/* Music Icon with Pulse */}
          <Animated.View style={[styles.musicIconContainer, animatedIconStyle]}>
            <View style={[
              styles.musicIcon,
              { backgroundColor: 'rgba(59, 130, 246, 0.15)' }
            ]}>
              <Icon
                name={isPlaying ? "musical-notes" : "musical-note"}
                size={scale(48)}
                color={currentTheme.mainColor}
              />
            </View>
          </Animated.View>

          {/* Title */}
          <CustomText type="big" bold style={[styles.musicTitle, { color: currentTheme.textPrimary }]}>
            {music.music_title || t('music.untitled')}
          </CustomText>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            {/* Type Badge */}
            <View style={[styles.badge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <CustomText style={[styles.badgeText, { color: '#A855F7' }]}>
                {music.music_type === 'vocal' ? '🎤 Vocal' : '🎹 Instrumental'}
              </CustomText>
            </View>

            {/* System Badge */}
            {music.is_default === 'Y' && (
              <View style={[styles.badge, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <CustomText style={[styles.badgeText, { color: '#FBBF24' }]}>
                  🌟 {t('music.system')}
                </CustomText>
              </View>
            )}
          </View>

          {/* Date */}
          <CustomText style={[styles.date, { color: currentTheme.textSecondary }]}>
            {formatDate(music.created_at)}
          </CustomText>
        </View>

        {/* Play/Pause Button */}
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: currentTheme.mainColor }]}
          onPress={handlePlayPause}
          activeOpacity={0.8}
        >
          <Icon
            name={isPlaying ? "pause" : "play"}
            size={scale(32)}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <Slider
            style={styles.progressSlider}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onValueChange={handleProgressSliderChange}
            onSlidingComplete={handleProgressSliderComplete}
            minimumTrackTintColor={currentTheme.mainColor}
            maximumTrackTintColor={`${currentTheme.mainColor}30`}
            thumbTintColor={currentTheme.mainColor}
          />
          <View style={styles.progressTimeRow}>
            <CustomText type="small" style={[styles.timeText, { color: currentTheme.textSecondary }]}>
              {formatTime(currentTime)}
            </CustomText>
            <CustomText type="small" style={[styles.timeText, { color: currentTheme.textSecondary }]}>
              {formatTime(duration)}
            </CustomText>
          </View>
        </View>

        {/* Volume Control */}
        <View style={styles.volumeSection}>
          <Icon name={getVolumeIcon()} size={scale(24)} color={currentTheme.mainColor} />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={handleVolumeChange}
            minimumTrackTintColor={currentTheme.mainColor}
            maximumTrackTintColor={`${currentTheme.mainColor}30`}
            thumbTintColor={currentTheme.mainColor}
          />
          <CustomText type="small" style={[styles.volumeText, { color: currentTheme.textSecondary }]}>
            {Math.round(volume * 100)}%
          </CustomText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Share */}
          <CustomButton
            title={t('music.player.share')}
            onPress={handleShare}
            leftIcon={<Icon name="share-social-outline" size={scale(20)} color="#FFFFFF" />}
            style={[styles.actionButton, { backgroundColor: 'rgba(59, 130, 246, 0.8)' }]}
          />

          {/* Delete */}
          <CustomButton
            title={t('music.player.delete')}
            onPress={handleDelete}
            leftIcon={<Icon name="trash-outline" size={scale(20)} color="#FFFFFF" />}
            style={[
              styles.actionButton,
              { 
                backgroundColor: music.is_default === 'Y' 
                  ? 'rgba(156, 163, 175, 0.5)' 
                  : 'rgba(239, 68, 68, 0.8)' 
              }
            ]}
            disabled={music.is_default === 'Y'}
          />

          {/* System Music Notice */}
          {music.is_default === 'Y' && (
            <View style={styles.noticeContainer}>
              <Icon name="information-circle-outline" size={scale(16)} color={currentTheme.textSecondary} />
              <CustomText type="small" style={[styles.noticeText, { color: currentTheme.textSecondary }]}>
                {t('music.toast.cannot_delete_default')}
              </CustomText>
            </View>
          )}
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <CustomText style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
              {t('music.loading')}...
            </CustomText>
          </View>
        )}
      </View>
    </CustomBottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: scale(20),
    gap: verticalScale(24),
  },
  hiddenVideo: {
    width: 0,
    height: 0,
  },

  // Music Info
  infoSection: {
    alignItems: 'center',
    gap: verticalScale(12),
  },
  musicIconContainer: {
    marginBottom: verticalScale(8),
  },
  musicIcon: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicTitle: {
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
  },
  badgeText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  date: {
    fontSize: moderateScale(13),
    marginTop: verticalScale(4),
  },

  // Play/Pause Button
  playButton: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },

  // Progress Section
  progressSection: {
    gap: verticalScale(8),
  },
  progressSlider: {
    width: '100%',
    height: verticalScale(40),
  },
  progressTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(4),
  },
  timeText: {
    fontSize: moderateScale(12),
  },

  // Volume Section
  volumeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    paddingHorizontal: scale(4),
  },
  volumeSlider: {
    flex: 1,
    height: verticalScale(40),
  },
  volumeText: {
    fontSize: moderateScale(12),
    minWidth: scale(40),
    textAlign: 'right',
  },

  // Action Buttons
  actionButtons: {
    gap: verticalScale(12),
  },
  actionButton: {
    paddingVertical: verticalScale(14),
  },

  // System Music Notice
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderRadius: moderateScale(8),
  },
  noticeText: {
    fontSize: moderateScale(12),
    textAlign: 'center',
  },

  // Loading
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    fontSize: moderateScale(14),
  },
});

export default MusicPlayerSheet;

