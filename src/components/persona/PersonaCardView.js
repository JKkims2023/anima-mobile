/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎴 PersonaCardView Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Regular persona full-screen view with flip animation
 * 
 * Features:
 * - Full screen layout (like Manager SAGE)
 * - Front: Persona info (video/image, name, stats)
 * - Back: Memories (180° flip animation)
 * - Tap to flip
 * - Haptic feedback
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */

import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import FastImage from 'react-native-fast-image';
import { BlurView } from '@react-native-community/blur';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale } from '../../utils/responsive-utils';
import CustomText from '../CustomText';
import HapticService from '../../utils/HapticService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// PersonaChatView is now rendered in PersonaSwipeViewer (outside FlatList)

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * PersonaCardView Component
 * @param {Object} props
 * @param {Object} props.persona - Persona data
 * @param {boolean} props.isActive - Whether this persona is currently active/selected
 * @param {boolean} props.isScreenFocused - Whether the screen is focused (for video playback)
 * @param {Animated.Value} props.modeOpacity - Opacity animation value from parent (for mode transition)
 * @param {number} props.availableHeight - Available height (excluding header, tabbar, etc.)
 * @param {Function} props.onCheckStatus - Callback when user clicks "Check Status" button
 */
const PersonaCardView = ({ 
  persona, 
  isActive = false, 
  isScreenFocused = true,
  modeOpacity,
  typingMessage = null,
  isLoading = false,
  chatInputBottom = 0,
  availableHeight = SCREEN_HEIGHT,
  onCheckStatus, // ⭐ NEW: Callback for status check
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [modeOpacityValue, setModeOpacityValue] = useState(1);
  const [remainingSeconds, setRemainingSeconds] = useState(null); // ⭐ NEW: Countdown timer
  const [isCheckingStatus, setIsCheckingStatus] = useState(false); // ⭐ NEW: Loading state for check button
  const flipAnim = useRef(new Animated.Value(0)).current;
  const videoOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  
  const HEADER_HEIGHT = verticalScale(80); // 헤더 높이 (타이틀 + 서브타이틀 + 패딩)
  const TAB_BAR_HEIGHT = verticalScale(60); // 탭바 높이
  
  const availableHeight_local = SCREEN_HEIGHT  - HEADER_HEIGHT - insets.bottom - TAB_BAR_HEIGHT;
  
  // ✅ Listen to modeOpacity changes to pause video when mode is switching
  useEffect(() => {
    if (!modeOpacity) {
      setModeOpacityValue(1); // Default to visible if no modeOpacity
      return;
    }
    
    const listenerId = modeOpacity.addListener(({ value }) => {
      setModeOpacityValue(value);
    });
    
    return () => {
      modeOpacity.removeListener(listenerId);
    };
  }, [modeOpacity]);

  // ⭐ NEW: Timer logic for persona creation
  useEffect(() => {
    // Only run if persona is incomplete
    if (persona?.done_yn !== 'N') {
      setRemainingSeconds(null);
      return;
    }

    // Calculate remaining time based on server data
    const calculateRemainingTime = () => {
      if (!persona.created_date || !persona.estimate_time) {
        console.warn('[PersonaCardView] Missing created_date or estimate_time:', persona);
        return 0;
      }

      const now = Date.now();
      const createdDate = new Date(persona.created_date).getTime();
      const elapsedSeconds = Math.floor((now - createdDate) / 1000);
      const remaining = Math.max(0, persona.estimate_time - elapsedSeconds);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⏳ [PersonaCardView] Timer Update:', persona.persona_name);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Created:', new Date(persona.created_date).toLocaleString());
      console.log('Estimate:', persona.estimate_time, 'seconds');
      console.log('Elapsed:', elapsedSeconds, 'seconds');
      console.log('Remaining:', remaining, 'seconds');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return remaining;
    };

    // Initial calculation
    setRemainingSeconds(calculateRemainingTime());

    // Update every second
    const interval = setInterval(() => {
      setRemainingSeconds(calculateRemainingTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [persona?.done_yn, persona?.created_date, persona?.estimate_time, persona?.persona_name]);

  // ✅ Determine media source (Video or Image) - Memoized
  const { hasVideo, videoUrl, imageUrl } = useMemo(() => {
    const hasVideo = 
      persona?.selected_dress_video_url !== null && 
      persona?.selected_dress_video_convert_done === 'Y';
    
    const videoUrl = hasVideo ? persona.selected_dress_video_url : null;
    const imageUrl = persona?.selected_dress_image_url || persona?.original_url;
    
    // ⭐ DEBUG: Log image URL for incomplete personas
    if (persona?.done_yn === 'N') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🖼️ [PersonaCardView] Image URL for incomplete persona:');
      console.log('  - Persona:', persona.persona_name);
      console.log('  - selected_dress_image_url:', persona?.selected_dress_image_url);
      console.log('  - original_url:', persona?.original_url);
      console.log('  - Final imageUrl:', imageUrl);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    return { hasVideo, videoUrl, imageUrl };
  }, [
    persona?.selected_dress_video_url,
    persona?.selected_dress_video_convert_done,
    persona?.selected_dress_image_url,
    persona?.original_url,
    persona?.done_yn,
    persona?.persona_name,
  ]);

  // ✅ Control container opacity based on isActive and isScreenFocused
  useEffect(() => {
    const shouldShow = isActive && isScreenFocused && modeOpacityValue > 0;
    containerOpacity.setValue(shouldShow ? 1 : 0);
    
    if (__DEV__) {
      console.log('[PersonaCardView] 🎨 Container Opacity:', persona.persona_name, {
        shouldShow,
        isActive,
        isScreenFocused,
        modeOpacityValue,
        containerOpacity: shouldShow ? 1 : 0,
      });
    }
  }, [isActive, isScreenFocused, modeOpacityValue, containerOpacity, persona.persona_name]);

  // ✅ Handle video load
  const handleVideoLoad = () => {
    if (__DEV__) {
      console.log('[PersonaCardView] 🎬 Video Loaded:', persona.persona_name);
    }
    setVideoLoaded(true);
    // Fade in video (instant for now to debug)
    videoOpacity.setValue(1);
    
    if (__DEV__) {
      console.log('[PersonaCardView] 🎥 Video Opacity Set to 1:', persona.persona_name);
    }
  };

  // ✅ Log screen focus changes (for debugging video playback)
  useEffect(() => {
    const isPaused = !isScreenFocused || !isActive;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎥 [PersonaCardView] Screen focus changed:', persona.persona_name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Props:');
    console.log('  - isScreenFocused:', isScreenFocused);
    console.log('  - isActive:', isActive);
    console.log('  - hasVideo:', hasVideo);
    console.log('Computed:');
    console.log('  - Video paused:', isPaused, isPaused ? '⏸️ PAUSED' : '▶️ PLAYING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, [isScreenFocused, isActive, persona.persona_name, hasVideo]);

  // ✅ Only log when actually rendering (isActive = true)
  if (__DEV__ && isActive) {
    console.log('[PersonaCardView] 🎬 Active Render:', persona.persona_name, {
      hasVideo,
      videoUrl: videoUrl ? '✅ Yes' : '❌ No',
      convert_done: persona?.selected_dress_video_convert_done,
      isScreenFocused,
      paused: !isScreenFocused || !isActive,
      modeOpacityValue,
      videoOpacity: videoOpacity._value,
      videoLoaded,
      willRenderVideo: isActive && hasVideo && modeOpacityValue > 0,
    });
  }

  // ✅ Handle card flip
  const handleFlip = () => {
    // 🎯 Haptic feedback
    HapticService.light();

    const toValue = isFlipped ? 0 : 1;

    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    setIsFlipped(!isFlipped);
  };

  // ✅ Interpolate rotation
  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={[styles.container, { height: availableHeight_local }]} pointerEvents="box-none">
      {/* 1. Background Image (FastImage) - Always visible for smooth loading */}
      <FastImage
        source={{ 
          uri: imageUrl, 
          priority: FastImage.priority.high,
          cache: FastImage.cacheControl.immutable,
        }}
        style={styles.backgroundMedia}
        resizeMode={FastImage.resizeMode.cover}
        pointerEvents="none"
      />

      {/* 2. Video Layer (Always render if hasVideo, control with opacity and paused) */}
      {hasVideo && (
        <Animated.View 
          style={[
            styles.videoContainer, 
            { 
              height: availableHeight_local,
              opacity: Animated.multiply(containerOpacity, videoOpacity)
            }
          ]} 
          pointerEvents="none"
        >
          <Video
            key={`video-${persona.persona_key}`}
            source={{ uri: videoUrl }}
            poster={imageUrl}
            posterResizeMode="cover"
            style={styles.backgroundMedia}
            resizeMode="cover"
            repeat
            muted
            paused={!isScreenFocused || !isActive}
            playInBackground={true}
            playWhenInactive={true}
            ignoreSilentSwitch="ignore"
            onLoad={handleVideoLoad}
            onError={(error) => {
              if (__DEV__) {
                console.error('[PersonaCardView] Video Error:', persona.persona_name, error);
              }
            }}
          />
        </Animated.View>
      )}

      {/* ⭐ NEW: Incomplete Persona UI (Blur + Timer + Check Button) */}
      {persona?.done_yn === 'N' && remainingSeconds !== null && (
        <View style={styles.incompleteOverlay}>
          <BlurView
            style={styles.blurContainer}
            blurType="light"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.3)"
          />
          <View style={styles.timerContainer}>
            <CustomText type="title" bold style={styles.generatingText}>
              ⏳ {t('persona.creation.generating')}
            </CustomText>
            
            {remainingSeconds > 0 ? (
              <CustomText type="big" bold style={styles.timerText}>
                {t('persona.creation.remaining_time', { time: remainingSeconds })}
              </CustomText>
            ) : (
              <TouchableOpacity
                style={[
                  styles.checkButton,
                  isCheckingStatus && styles.checkButtonDisabled
                ]}
                onPress={() => {
                  if (!isCheckingStatus && onCheckStatus) {
                    HapticService.success();
                    setIsCheckingStatus(true);
                    onCheckStatus(persona, () => setIsCheckingStatus(false));
                  }
                }}
                disabled={isCheckingStatus}
                activeOpacity={0.7}
              >
                {isCheckingStatus ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <CustomText type="middle" bold style={styles.checkButtonText}>
                    {t('persona.creation.check_status')}
                  </CustomText>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* 3. Chat Overlay - Removed (now rendered in PersonaSwipeViewer) */}
    </View>
  );
};

const styles = StyleSheet.create({
  // ═══════════════════════════════════════════════════════════════════════════
  // Main Container
  // ═══════════════════════════════════════════════════════════════════════════
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    // ✅ Removed height: SCREEN_HEIGHT to match SAGE behavior
    // This allows chatOverlay bottom positioning to work correctly
    backgroundColor: '#000000',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Background Media (FastImage) - Always visible
  // ═══════════════════════════════════════════════════════════════════════════
  backgroundMedia: {
    /*
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    */
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    ...(Platform.OS === 'android' && {
      elevation: 0,
    }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Video Container (Fades in over image)
  // ═══════════════════════════════════════════════════════════════════════════
  videoContainer: {
 //   position: 'absolute',
 //   top: 0,
 //   left: 0,
    width: SCREEN_WIDTH,
//    height: SCREEN_HEIGHT,
    zIndex: 1,
    ...(Platform.OS === 'android' && {
      elevation: 1,
    }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Overlay Container (Flip-able)
  // ═══════════════════════════════════════════════════════════════════════════
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.35, // 35% of screen height
    zIndex: 10,
    ...(Platform.OS === 'android' && {
      elevation: 10,
    }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Info Card (Front and Back)
  // ═══════════════════════════════════════════════════════════════════════════
  infoCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },

  backCard: {
    // Additional styles for back card
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Gradient Overlay (for text readability)
  // ═══════════════════════════════════════════════════════════════════════════
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: -1,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Front Content
  // ═══════════════════════════════════════════════════════════════════════════
  infoContent: {
    flex: 1,
    padding: scale(20),
    justifyContent: 'flex-end',
  },

  nameText: {
    marginBottom: verticalScale(8),
    fontSize: scale(28),
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  descriptionText: {
    marginBottom: verticalScale(15),
    fontSize: scale(14),
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Stats
  // ═══════════════════════════════════════════════════════════════════════════
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: verticalScale(15),
    paddingTop: verticalScale(15),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },

  statItem: {
    alignItems: 'center',
  },

  statLabel: {
    fontSize: scale(11),
    color: '#E0E0E0',
    marginBottom: verticalScale(5),
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  statValue: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: '#4FC3F7',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Back Content
  // ═══════════════════════════════════════════════════════════════════════════
  backContent: {
    flex: 1,
    padding: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },

  backTitle: {
    marginBottom: verticalScale(10),
    fontSize: scale(24),
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  backSubtitle: {
    marginBottom: verticalScale(30),
    fontSize: scale(14),
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  comingSoon: {
    fontSize: scale(16),
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Flip Hint
  // ═══════════════════════════════════════════════════════════════════════════
  flipHint: {
    position: 'absolute',
    bottom: scale(20),
    right: scale(20),
    fontSize: scale(11),
    color: '#B0B0B0',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Incomplete Persona UI
  // ═══════════════════════════════════════════════════════════════════════════
  incompleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(30),
  },
  generatingText: {
    fontSize: scale(24),
    color: '#FFFFFF',
    marginBottom: verticalScale(20),
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  timerText: {
    fontSize: scale(40),
    color: '#4FC3F7',
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  checkButton: {
    backgroundColor: '#4FC3F7',
    paddingHorizontal: scale(40),
    paddingVertical: verticalScale(15),
    borderRadius: scale(30),
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    minWidth: scale(200),
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#666666',
    shadowColor: '#666666',
  },
  checkButtonText: {
    fontSize: scale(18),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

// ✅ Memoize PersonaCardView to prevent unnecessary re-renders
// Only re-render when persona_key, isActive, or isScreenFocused changes
export default memo(PersonaCardView, (prevProps, nextProps) => {
  // Return true if props are equal (prevent re-render)
  // Return false if props are different (allow re-render)
  return (
    prevProps.persona.persona_key === nextProps.persona.persona_key &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isScreenFocused === nextProps.isScreenFocused // ⭐ CRITICAL: Check isScreenFocused for video control
  );
});

