/**
 * 🎵 FloatingMusicPlayer.js - Floating Music Player (react-native-sound)
 * 
 * ANIMA Philosophy:
 * - ANIMA 로고 하단에 플로팅 형식으로 배치
 * - react-native-sound 사용 (백그라운드 영상 재생 충돌 해결)
 * - Glassmorphic 디자인
 * - Play/Pause, Marquee 텍스트, Volume Control
 * - "Paused" 개념 (리셋은 "없음" 선택 시에만)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Slider from '@react-native-community/slider'; // ⭐ NEW: For Volume & Progress
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale } from '../../utils/responsive-utils';
import Sound from 'react-native-sound';

// ⚙️ Sound 설정 (백그라운드 재생 허용)
Sound.setCategory('Playback', true);

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format seconds to MM:SS
 * @param {number} seconds
 * @returns {string} Formatted time (e.g., "03:45")
 */
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Marquee Text Component (긴 텍스트 자동 스크롤)
// ═══════════════════════════════════════════════════════════════════════════

const MarqueeText = React.memo(({ text, style }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  // ⭐ Start marquee animation if text is too long
  useEffect(() => {
    if (textWidth > containerWidth && containerWidth > 0) {
      const distance = textWidth + 20; // Add gap

      Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: -distance,
            duration: distance * 30, // Speed: 30ms per pixel
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      translateX.setValue(0);
    }
  }, [textWidth, containerWidth, translateX]);

  return (
    <View
      style={{ flex: 1, overflow: 'hidden' }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          transform: [{ translateX }],
        }}
      >
        <Text
          style={style}
          onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
          numberOfLines={1}
        >
          {text}
        </Text>
        {textWidth > containerWidth && (
          <Text style={[style, { marginLeft: 20 }]} numberOfLines={1}>
            {text}
          </Text>
        )}
      </Animated.View>
    </View>
  );
});

MarqueeText.displayName = 'MarqueeText';

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Main Component
// ═══════════════════════════════════════════════════════════════════════════

const FloatingMusicPlayer = ({
  music_url, // URL of the music to play
  music_title, // Title to display
  visible, // Show/hide player
  onClose, // Callback when user clicks close (paused, not reset)
}) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showControls, setShowControls] = useState(false); // ⭐ NEW: Show Volume & Progress
  const [currentTime, setCurrentTime] = useState(0); // ⭐ NEW: Current playback position (seconds)
  const [duration, setDuration] = useState(0); // ⭐ NEW: Total duration (seconds)
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  // ═══════════════════════════════════════════════════════════════════════════
  // Refs
  // ═══════════════════════════════════════════════════════════════════════════
  const soundRef = useRef(null);
  const currentUrlRef = useRef(null);
  const progressIntervalRef = useRef(null); // ⭐ NEW: For setInterval

  // ═══════════════════════════════════════════════════════════════════════════
  // Load & Play Music
  // ═══════════════════════════════════════════════════════════════════════════

  const loadAndPlayMusic = useCallback(() => {
    if (!music_url) return;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎵 [FloatingMusicPlayer] Loading music...');
    console.log('   URL:', music_url);
    console.log('   Title:', music_title);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ⭐ If same URL, just resume
    if (currentUrlRef.current === music_url && soundRef.current) {
      console.log('   ✅ Resuming existing sound...');
      
      soundRef.current.play((success) => {
        if (!success) {
          console.error('   ❌ Playback failed (resume)');
        }
      });

      // ⭐ CRITICAL FIX: Start immediately, don't wait for callback!
      console.log('   ✅ Starting playback and progress tracking...');
      setIsPlaying(true);
      startProgressTracking();
      
      return;
    }

    // ⭐ Release previous sound
    if (soundRef.current) {
      console.log('   🔄 Releasing previous sound...');
      soundRef.current.release();
      soundRef.current = null;
    }

    // ⭐ Load new sound
    currentUrlRef.current = music_url;

    const sound = new Sound(music_url, '', (error) => {
      if (error) {
        console.error('   ❌ Failed to load sound:', error);
        return;
      }

      console.log('   ✅ Sound loaded successfully!');
      
      const totalDuration = sound.getDuration();
      console.log('   Duration:', totalDuration, 'seconds');

      soundRef.current = sound;

      // ⭐ Set duration state
      setDuration(totalDuration);
      setCurrentTime(0);

      // ⭐ Set volume
      sound.setVolume(volume);

      // ⭐ Loop playback
      sound.setNumberOfLoops(-1);

      // ⭐ CRITICAL FIX: Start playback and tracking IMMEDIATELY!
      sound.play((success) => {
        if (!success) {
          console.error('   ❌ Playback failed');
        }
      });

      // ⭐ Don't wait for callback - start immediately!
      console.log('   ✅ Starting playback and progress tracking...');
      setIsPlaying(true);
      startProgressTracking();
    });
  }, [music_url, music_title, volume, startProgressTracking]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Progress Tracking (Update current time every 500ms)
  // ═══════════════════════════════════════════════════════════════════════════

  const startProgressTracking = useCallback(() => {
    console.log('🎵 [FloatingMusicPlayer] Starting progress tracking...');
    
    // ⭐ Clear existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // ⭐ Update current time every 500ms
    progressIntervalRef.current = setInterval(() => {
      if (soundRef.current && soundRef.current.isPlaying()) {
        soundRef.current.getCurrentTime((seconds) => {
          // console.log('   Current time:', seconds.toFixed(2), 'seconds'); // ⭐ Optional: Uncomment for detailed logging
          setCurrentTime(seconds);
        });
      }
    }, 500);
  }, []);

  const stopProgressTracking = useCallback(() => {
    console.log('🎵 [FloatingMusicPlayer] Stopping progress tracking...');
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Play/Pause Toggle
  // ═══════════════════════════════════════════════════════════════════════════

  const handlePlayPause = useCallback(() => {
    if (!soundRef.current) return;

    if (isPlaying) {
      console.log('⏸️ [FloatingMusicPlayer] Pausing...');
      soundRef.current.pause();
      setIsPlaying(false);
      stopProgressTracking(); // ⭐ Stop tracking when paused
    } else {
      console.log('▶️ [FloatingMusicPlayer] Resuming...');
      
      soundRef.current.play((success) => {
        if (!success) {
          console.error('   ❌ Resume failed');
        }
      });

      // ⭐ CRITICAL FIX: Start immediately, don't wait for callback!
      setIsPlaying(true);
      startProgressTracking();
    }
  }, [isPlaying, startProgressTracking, stopProgressTracking]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Volume Control (Slider)
  // ═══════════════════════════════════════════════════════════════════════════

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    if (soundRef.current) {
      soundRef.current.setVolume(newVolume);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Progress Control (Slider)
  // ═══════════════════════════════════════════════════════════════════════════

  const handleProgressChange = useCallback((newTime) => {
    console.log('🎵 [FloatingMusicPlayer] Seeking to:', newTime, 'seconds');
    
    if (soundRef.current) {
      soundRef.current.setCurrentTime(newTime);
      setCurrentTime(newTime);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Close (Pause, not reset)
  // ═══════════════════════════════════════════════════════════════════════════

  const handleClose = useCallback(() => {
    console.log('✕ [FloatingMusicPlayer] Close pressed (pause)');
    
    if (soundRef.current && isPlaying) {
      soundRef.current.pause();
      setIsPlaying(false);
      stopProgressTracking(); // ⭐ Stop tracking when closed
    }

    onClose && onClose();
  }, [isPlaying, onClose, stopProgressTracking]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════════════════════

  // ⭐ Load music when URL changes
  useEffect(() => {
    if (visible && music_url) {
      loadAndPlayMusic();
    }
  }, [visible, music_url, loadAndPlayMusic]);

  // ⭐ Fade in/out animation
  useEffect(() => {
    if (visible) {
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  // ⭐ Pulse animation when playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying, pulseAnim]);

  // ⭐ Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🔄 [FloatingMusicPlayer] Cleaning up...');
      
      // Stop progress tracking
      stopProgressTracking();
      
      // Release sound
      if (soundRef.current) {
        soundRef.current.release();
        soundRef.current = null;
      }
    };
  }, [stopProgressTracking]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  if (!visible || !music_url) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Glassmorphic Background */}
      <View style={styles.glassContainer}>
        {Platform.OS === 'ios' ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={10}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(168, 237, 234, 0.2)', 'rgba(254, 214, 227, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Play/Pause Button */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Icon
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                size={scale(36)}
                color="#FFFFFF"
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Title (Marquee) */}
          <View style={styles.titleContainer}>
            <MarqueeText
              text={music_title || 'Unknown'}
              style={styles.titleText}
            />
          </View>

          {/* Expand/Collapse Button */}
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setShowControls(!showControls)}
            activeOpacity={0.7}
          >
            <Icon
              name={showControls ? 'chevron-up' : 'chevron-down'}
              size={scale(20)}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Icon name="close" size={scale(20)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Volume & Progress Controls (Expanded) */}
        {showControls && (
          <View style={styles.controlsContainer}>
            {/* Progress Slider */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <CustomText style={styles.timeText} weight="light">
                  {formatTime(currentTime)}
                </CustomText>
                <CustomText style={styles.timeText} weight="light">
                  {formatTime(duration)}
                </CustomText>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration || 1}
                value={currentTime}
                onValueChange={handleProgressChange}
                minimumTrackTintColor="#a8edea"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#FFFFFF"
              />
            </View>

            {/* Volume Slider */}
            <View style={styles.volumeSection}>
              <View style={styles.volumeHeader}>
                <Icon 
                  name={volume === 0 ? 'volume-off' : volume < 0.5 ? 'volume-medium' : 'volume-high'} 
                  size={scale(18)} 
                  color="#FFFFFF" 
                />
                <CustomText style={styles.volumeLabel} weight="light">
                  {Math.round(volume * 100)}%
                </CustomText>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor="#a8edea"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#FFFFFF"
              />
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: verticalScale(80), // ANIMA 로고 하단
    left: scale(12),
    right: scale(90),
    zIndex: 100,
  },
  glassContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    gap: scale(12),
  },
  playButton: {
    // No extra styles needed
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: scale(14),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  expandButton: {
    padding: scale(4),
  },
  closeButton: {
    padding: scale(4),
  },
  // ⭐ NEW: Controls Container (Volume & Progress)
  controlsContainer: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(12),
    gap: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  // ⭐ Progress Section
  progressSection: {
    gap: verticalScale(4),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(4),
  },
  timeText: {
    fontSize: scale(11),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // ⭐ Volume Section
  volumeSection: {
    gap: verticalScale(4),
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingHorizontal: scale(4),
  },
  volumeLabel: {
    fontSize: scale(12),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // ⭐ Slider (Common for Volume & Progress)
  slider: {
    width: '100%',
    height: 30,
  },
});

export default React.memo(FloatingMusicPlayer);
