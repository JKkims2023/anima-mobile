/**
 * 🎵 MusicControlBar - Compact Music Player Controls
 * 
 * Features:
 * - Play/Pause button
 * - Progress bar with seek
 * - Volume control
 * - Time display
 * - Compact design for MessageDetailOverlay
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
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
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';

/**
 * MusicControlBar Component
 * 
 * @param {string} musicUrl - Music file URL
 * @param {boolean} isPlaying - External playing state
 * @param {function} onPlayingChange - Callback when playing state changes
 */
const MusicControlBar = ({ musicUrl, isPlaying = false, onPlayingChange }) => {
  const { currentTheme } = useTheme();
  
  // Refs
  const videoRef = useRef(null);

  // State
  const [localIsPlaying, setLocalIsPlaying] = useState(isPlaying);
  const [volume, setVolume] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with external isPlaying prop
  useEffect(() => {
    setLocalIsPlaying(isPlaying);
  }, [isPlaying]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Pulse animation for play button
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (localIsPlaying && !isLoading) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 500 }),
          withTiming(1.0, { duration: 500 })
        ),
        -1
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [localIsPlaying, isLoading]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle play/pause
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handlePlayPause = () => {
    HapticService.light();
    const newState = !localIsPlaying;
    setLocalIsPlaying(newState);
    onPlayingChange?.(newState);
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
    console.error('[MusicControlBar] Video error:', error);
    setIsLoading(false);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle progress slider
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
  // Handle volume slider
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
  // Get volume icon
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const getVolumeIcon = () => {
    if (volume === 0) return 'volume-mute';
    if (volume < 0.5) return 'volume-low';
    return 'volume-high';
  };

  if (!musicUrl || musicUrl === 'none') return null;

  return (
    <View 
      style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}
      pointerEvents="auto"
    >
      {/* Hidden Audio Player */}
      <Video
        ref={videoRef}
        source={{ uri: musicUrl }}
        audioOnly
        paused={!localIsPlaying}
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

      {/* Top Row: Play/Pause + Progress Bar */}
      <View style={styles.topRow}>
        {/* Play/Pause Button */}
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: currentTheme.mainColor }]}
          onPress={handlePlayPause}
          activeOpacity={0.8}
        >
          <Animated.View style={animatedIconStyle}>
            <Icon
              name={localIsPlaying ? "pause" : "play"}
              size={scale(20)}
              color="#FFFFFF"
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Slider
            style={styles.progressSlider}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onValueChange={handleProgressSliderChange}
            onSlidingComplete={handleProgressSliderComplete}
            minimumTrackTintColor={currentTheme.mainColor}
            maximumTrackTintColor={`${currentTheme.mainColor}40`}
            thumbTintColor={currentTheme.mainColor}
          />
          <View style={styles.progressTimeRow}>
            <CustomText type="tiny" style={[styles.timeText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
              {formatTime(currentTime)}
            </CustomText>
            <CustomText type="tiny" style={[styles.timeText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
              {formatTime(duration)}
            </CustomText>
          </View>
        </View>
      </View>

      {/* Bottom Row: Volume Control */}
      <View style={styles.bottomRow}>
        <Icon name={getVolumeIcon()} size={scale(18)} color={currentTheme.mainColor} />
        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={handleVolumeChange}
          minimumTrackTintColor={currentTheme.mainColor}
          maximumTrackTintColor={`${currentTheme.mainColor}40`}
          thumbTintColor={currentTheme.mainColor}
        />
        <CustomText type="tiny" style={[styles.volumeText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
          {Math.round(volume * 100)}%
        </CustomText>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <CustomText type="tiny" style={[styles.loadingText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
            Loading...
          </CustomText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: verticalScale(100),
    left: scale(16),
    right: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    gap: verticalScale(10),
    zIndex: 999, // ⭐ CRITICAL: Highest priority for touch events
    elevation: 999, // ⭐ Android highest priority
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  hiddenVideo: {
    width: 0,
    height: 0,
  },

  // Top Row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  playButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 4 },
    }),
  },
  progressSection: {
    flex: 1,
    gap: verticalScale(4),
  },
  progressSlider: {
    width: '100%',
    height: verticalScale(24),
  },
  progressTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(4),
  },
  timeText: {
    fontSize: moderateScale(10),
  },

  // Bottom Row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    paddingHorizontal: scale(4),
  },
  volumeSlider: {
    flex: 1,
    height: verticalScale(24),
  },
  volumeText: {
    fontSize: moderateScale(10),
    minWidth: scale(32),
    textAlign: 'right',
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: moderateScale(12),
  },
  loadingText: {
    fontSize: moderateScale(11),
  },
});

export default MusicControlBar;

