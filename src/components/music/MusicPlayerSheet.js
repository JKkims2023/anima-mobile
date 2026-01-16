/**
 * 🎵 MusicPlayerSheet - Music Playback & Management (ANIMA Emotional Design)
 * 
 * Features:
 * - Music playback (play/pause)
 * - Heartbeat-like pulse animation
 * - Attach to message
 * - Delete (user music only)
 * - Share
 * - Real-time state sync with parent
 * 
 * ✨ ANIMA Philosophy:
 * - Warm Pink/Purple Gradient (ANIMA Signature)
 * - Large Music Icon with Gradient Background
 * - Strong Pulse Animation (Heartbeat)
 * - Gradient Play/Pause Button
 * - Gradient Action Buttons (Share, Delete)
 * - Emotional Feedback
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16 (ANIMA Emotional Design Revolution)
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
  Easing,
} from 'react-native-reanimated';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import LinearGradient from 'react-native-linear-gradient'; // ⭐ NEW: ANIMA Gradient
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
  // ✨ ANIMA: Heartbeat-like Pulse Animation (STRONG!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying && !isLoading) {
      // ⭐ STRONG Heartbeat Pulse (ANIMA Style)
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(1.05, { duration: 200, easing: Easing.in(Easing.ease) }),
          withTiming(1.12, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 400, easing: Easing.in(Easing.ease) })
        ),
        -1
      );
      
      // ⭐ Glow effect (pulsing with heartbeat)
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600 }),
          withTiming(0.2, { duration: 600 })
        ),
        -1
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isPlaying, isLoading]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle play/pause
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handlePlayPause = () => {
    HapticService.light();
    setIsPlaying(prev => !prev);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle toggle favorite
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleToggleFavorite = () => {
    HapticService.light();
    
    // Notify parent to toggle favorite
    onMusicUpdate?.(music, 'favorite');
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
      buttons={[{
        title: t('common.close'),
        type: 'primary',
        onPress: (() => {
          bottomSheetRef.current?.dismiss();
          setIsPlaying(false);
        }),
      }]}
    >
      <View style={[styles.container, { backgroundColor: currentTheme.cardBackground }]}>

        <View style={[styles.content, {width: '100%', flexDirection: 'row'}]}>
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

        {/* ✨ ANIMA: Music Info with Gradient Icon */}
        <View style={styles.infoSection}>
          {/* ✨ Music Icon with Gradient Background & Glow */}
          <View style={styles.musicIconWrapper}>
            {/* Glow Layer */}
            <Animated.View style={[styles.glowLayer, animatedGlowStyle]} />
            
            {/* Icon with Pulse & Gradient */}
            <Animated.View style={[styles.musicIconContainer, animatedIconStyle]}>
              <LinearGradient
                colors={['#FF6B9D', '#FF1493', '#A78BFA', '#8B7BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.musicIconGradient}
              >
                <Icon
                  name={music.music_type === 'vocal' ? 'mic-sharp' : 'musical-notes-sharp'}
                  size={scale(40)}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </Animated.View>
          </View>

          <View style={{marginLeft: scale(10)}}>

          <View style={{flex: 1, flexDirection: 'row'}}>
          {/* Title */}
          <CustomText type="big" bold style={[styles.musicTitle, { color: currentTheme.textPrimary }]}>
            {music.music_title || t('music.untitled')}
          </CustomText>

           {/* Favorite Button */}
           <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            activeOpacity={0.7}
          >
            <Icon
              name={music.favorite_yn === 'Y' ? 'star' : 'star-outline'}
              size={scale(22)}
              color={music.favorite_yn === 'Y' ? '#FBBF24' : currentTheme.textSecondary}
            />
          </TouchableOpacity>
          </View>

          <View style={{flex: 1, flexDirection: 'row'}}>
          {/* Meta Info */}
          <View style={styles.metaRow}>
            {/* Type Badge */}
            <View style={[styles.badge, {display: 'none', backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <CustomText style={[styles.badgeText, { color: '#A855F7' }]}>
                {music.music_type === 'vocal' ? '🎤 Vocal' : '🎹 Instrumental'}
              </CustomText>
            </View>

            {/* System Badge */}
            {music.is_default === 'Y' ? (
              <View style={[styles.badge, {marginRight: scale(10), backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <CustomText style={[styles.badgeText, { color: '#FBBF24' }]}>
                  🌟 {t('music.system')}
                </CustomText>
              </View>
            )
          : (
            <View style={[styles.badge, {marginRight: scale(10), backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
              <CustomText style={[styles.badgeText, { color: '#FBBF24' }]}>
                {t('music.filter_user')}
              </CustomText>
            </View>
          )}
          </View>

          {/* Date */}
          <CustomText style={[styles.date, { color: currentTheme.textSecondary }]}>
            {formatDate(music.created_at)}
          </CustomText>
          </View>

          </View>

        </View>
        </View>

        <View>

        <View style={{flex: 1, width: '100%', flexDirection: 'row', alignItems: 'center', gap: scale(10), marginTop: verticalScale(-20)}}>
        {/* ✨ ANIMA: Gradient Play/Pause Button */}
        <TouchableOpacity
          style={styles.playButtonWrapper}
          onPress={handlePlayPause}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF6B9D', '#FF1493', '#A78BFA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playButtonGradient}
          >
            <Icon
              name={isPlaying ? "pause" : "play"}
              size={scale(20)}
              color="#FFFFFF"
            />
          </LinearGradient>
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
            <CustomText type="small" style={[styles.timeText, { color: currentTheme.textSecondary, marginLeft: scale(18) }]}>
              {formatTime(currentTime)}
            </CustomText>
            <CustomText type="small" style={[styles.timeText, { color: currentTheme.textSecondary, marginRight: scale(3) }]}>
              {formatTime(duration)}
            </CustomText>
          </View>
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

        <View style={[styles.divider, { backgroundColor: currentTheme.borderSubtle }]} />


        {/* ✨ ANIMA: Gradient Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Share Button (Blue-Cyan Gradient) */}
          <TouchableOpacity
            style={styles.actionButtonWrapper}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3B82F6', '#06B6D4', '#14B8A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Icon name="share-social-outline" size={scale(22)} color="#FFFFFF" />
              <CustomText type="middle" bold style={styles.actionButtonText}>
                {t('music.player.share')}
              </CustomText>
            </LinearGradient>
          </TouchableOpacity>

          {/* Delete Button (Red-Orange Gradient or Gray if system) */}
          {music.is_default === 'Y' ? (
            <View style={[styles.actionButtonWrapper, styles.actionButtonDisabled]}>
              <View style={styles.actionButtonDisabledInner}>
                <Icon name="trash-outline" size={scale(22)} color="rgba(156, 163, 175, 0.5)" />
                <CustomText type="middle" style={[styles.actionButtonText, { color: 'rgba(156, 163, 175, 0.5)' }]}>
                  {t('music.player.delete')}
                </CustomText>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.actionButtonWrapper}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#EF4444', '#F97316', '#FB923C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Icon name="trash-outline" size={scale(22)} color="#FFFFFF" />
                <CustomText type="middle" bold style={styles.actionButtonText}>
                  {t('music.player.delete')}
                </CustomText>
              </LinearGradient>
            </TouchableOpacity>
          )}

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
    padding: scale(0),
    gap: verticalScale(24),
    paddingTop: verticalScale(10),
  },
  hiddenVideo: {
    width: 0,
    height: 0,
  },

  // ✨ ANIMA: Music Info with Gradient Icon
  infoSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: verticalScale(12),
  },
  musicIconWrapper: {
    position: 'relative',
    marginBottom: verticalScale(8),
  },
  glowLayer: {
    position: 'absolute',
    width: scale(140),
    height: scale(140),
    borderRadius: scale(70),
    backgroundColor: '#FF6B9D',
    top: -scale(10),
    left: -scale(10),
    zIndex: 0,
  },
  musicIconContainer: {
    width: scale(120),
    height: scale(120),
    zIndex: 1,
  },
  musicIconGradient: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B9D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  musicTitle: {
    textAlign: 'left',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    justifyContent: 'flex-start',

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
    marginLeft: verticalScale(0),
    marginBottom: verticalScale(4),
  },
  favoriteButton: {
    marginTop: verticalScale(5),
    padding: scale(8),
  },

  // ✨ ANIMA: Gradient Play/Pause Button
  playButtonWrapper: {
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B9D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: { elevation: 10 },
    }),
  },
  playButtonGradient: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress Section
  progressSection: {
    gap: verticalScale(8),
    flex: 1,
    width: '100%',
  },
  progressSlider: {
    width: '100%',
    height: verticalScale(40),
  },
  progressTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(-15),
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

  // ✨ ANIMA: Gradient Action Buttons
  actionButtons: {
    gap: verticalScale(14),
    marginTop: verticalScale(20),
  },
  actionButtonWrapper: {
    borderRadius: moderateScale(14),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(14),
    gap: scale(10),
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
  },
  actionButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonDisabledInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(14),
    gap: scale(10),
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
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
  // Divider
  divider: {
    height: 1,
    marginVertical: verticalScale(10),
  },
});

export default MusicPlayerSheet;

