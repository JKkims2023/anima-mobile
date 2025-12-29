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

import React, { useState, useRef, useEffect, useMemo, memo, forwardRef, useImperativeHandle } from 'react';
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
// import FastImage from 'react-native-fast-image'; // ⭐ TEMP: Testing with native Image
import { BlurView } from '@react-native-community/blur';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale } from '../../utils/responsive-utils';
import CustomText from '../CustomText';
import HapticService from '../../utils/HapticService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../styles/commonstyles';
import PostcardBack from './PostcardBack'; // ⭐ NEW: Postcard component
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
 * @param {Function} props.onFlipChange - Callback when card flips (true = postcard visible, false = persona visible)
 */
const PersonaCardView = forwardRef(({ 
  persona, 
  isActive = false, 
  isScreenFocused = true,
  modeOpacity,
  typingMessage = null,
  isLoading = false,
  chatInputBottom = 0,
  availableHeight = SCREEN_HEIGHT,
  onCheckStatus, // ⭐ NEW: Callback for status check
  onFlipChange, // ⭐ NEW: Callback for flip state change
}, ref) => {
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
  const timerIntervalRef = useRef(null); // ⭐ NEW: Ref to store interval ID for cleanup
  
  const HEADER_HEIGHT = verticalScale(80); // 헤더 높이 (타이틀 + 서브타이틀 + 패딩)
  const TAB_BAR_HEIGHT = verticalScale(60); // 탭바 높이
  
  const availableHeight_local = SCREEN_HEIGHT  - HEADER_HEIGHT - insets.bottom - TAB_BAR_HEIGHT;
  
  // ✅ Listen to modeOpacity changes to pause video when mode is switching
  useEffect(() => {
    if (!modeOpacity) {
      setModeOpacityValue(1); // Default to visible if no modeOpacity
      return;
    }
    
    // ⭐ Handle both Animated.Value and number
    if (typeof modeOpacity === 'number') {
      setModeOpacityValue(modeOpacity);
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
    /*
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏱️  [PersonaCardView] TIMER USEEFFECT TRIGGERED');
    console.log('  - Persona:', persona?.persona_name);
    console.log('  - persona_key:', persona?.persona_key);
    console.log('  - done_yn:', persona?.done_yn);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    */
    // ⭐ CRITICAL: Clear any existing interval IMMEDIATELY
    if (timerIntervalRef.current) {
     // console.log('  - 🧹 Clearing previous interval:', timerIntervalRef.current);
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // ⭐ CRITICAL FIX: Reset state when persona changes or is complete
    if (persona?.done_yn !== 'N') {
     // console.log('  - ✅ Persona complete, resetting state');
      setRemainingSeconds(null);
      setIsCheckingStatus(false);
      return;
    }

    // Calculate remaining time based on server data
    const calculateRemainingTime = () => {
      if (!persona.created_date || !persona.estimate_time) {
     //   console.warn('[PersonaCardView] Missing created_date or estimate_time:', persona);
        return 0;
      }

      const now = Date.now();
      const createdDate = new Date(persona.created_date).getTime();
      const elapsedSeconds = Math.floor((now - createdDate) / 1000);
      const remaining = Math.max(0, persona.estimate_time - elapsedSeconds);

      return remaining;
    };

    // Initial calculation
    const initialRemaining = calculateRemainingTime();

    setRemainingSeconds(initialRemaining);

    // ⭐ FIX: Stop timer if already at 0
    if (initialRemaining === 0) {
     // console.log('  - ⏹️  Timer already at 0, not starting interval');
      return;
    }

    // Update every second
    timerIntervalRef.current = setInterval(() => {
      const remaining = calculateRemainingTime();
      setRemainingSeconds(remaining);
      
      // ⭐ FIX: Stop interval when reaching 0
      if (remaining === 0) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }, 1000);

    return () => {

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [
    persona?.persona_key, // ⭐ CRITICAL FIX: Reset when persona changes!
    persona?.done_yn, 
    persona?.created_date, 
    persona?.estimate_time, 
    persona?.persona_name
  ]);

  // ✅ Determine media source (Video or Image) - Memoized
  const { hasVideo, videoUrl, imageUrl } = useMemo(() => {
    const hasVideo = 
      persona?.selected_dress_video_url !== null && 
      persona?.selected_dress_video_convert_done === 'Y';
    
    const videoUrl = hasVideo ? persona.selected_dress_video_url : null;
    
    // ⭐ CRITICAL FIX: Use original_url when persona is still being created!
    // - done_yn === 'N' means AI is still generating the persona
    // - selected_dress_image_url exists but the file is not on server yet (404)
    // - Must use original_url (user uploaded photo) until done_yn === 'Y'
    const imageUrl = persona?.done_yn === 'N' 
      ? persona?.original_url 
      : (persona?.selected_dress_image_url || persona?.original_url);
    
    
    return { hasVideo, videoUrl, imageUrl };
  }, [
    persona?.selected_dress_video_url,
    persona?.selected_dress_video_convert_done,
    persona?.selected_dress_image_url,
    persona?.original_url,
    persona?.done_yn,
    persona?.persona_name,
  ]);

  // ✅ Control container opacity based on isScreenFocused only
  // ⚠️ CRITICAL FIX: isActive should NOT control image visibility!
  // - isActive is for video playback control
  // - All FlatList items should be visible (opacity = 1)
  // - Only isScreenFocused and modeOpacityValue should control visibility
  useEffect(() => {
    const shouldShow = isScreenFocused && modeOpacityValue > 0;
    const opacityValue = shouldShow ? 1 : 0;
    containerOpacity.setValue(opacityValue);
    /*
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 [PersonaCardView] Container Opacity UPDATE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Persona:', persona.persona_name);
    console.log('isScreenFocused:', isScreenFocused);
    console.log('modeOpacityValue:', modeOpacityValue);
    console.log('shouldShow:', shouldShow);
    console.log('→ containerOpacity set to:', opacityValue);
    console.log('hasVideo:', hasVideo);
    console.log('videoUrl:', videoUrl);
    console.log('imageUrl:', imageUrl);
    console.log('isActive:', isActive);
    console.log('done_yn:', persona?.done_yn);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    */
  }, [isScreenFocused, modeOpacityValue, persona.persona_name]);

  // ✅ Handle video load
  const handleVideoLoad = () => {
    if (__DEV__) {
   //   console.log('[PersonaCardView] 🎬 Video Loaded:', persona.persona_name);
    }
    setVideoLoaded(true);
    // Fade in video (instant for now to debug)
    videoOpacity.setValue(1);
    
    if (__DEV__) {
     // console.log('[PersonaCardView] 🎥 Video Opacity Set to 1:', persona.persona_name);
    }
  };

  // ✅ Log screen focus changes (for debugging video playback)
  useEffect(() => {
    const isPaused = !isScreenFocused || !isActive;
   
  }, [isScreenFocused, isActive, persona.persona_name, hasVideo]);



  // ✅ Handle card flip
  // ⭐ Flip to Back (for postcard view)
  const flipToBack = () => {
    if (isFlipped) return; // Already flipped
    HapticService.medium();
    
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    setIsFlipped(true);
    
    // ⭐ Notify parent about flip state change
    if (onFlipChange) {
      onFlipChange(true); // true = postcard visible
    }
  };

  // ⭐ Flip to Front (back to persona view)
  const flipToFront = () => {
    if (!isFlipped) return; // Already on front
    HapticService.light();
    
    Animated.timing(flipAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    setIsFlipped(false);
    
    // ⭐ Notify parent about flip state change
    if (onFlipChange) {
      onFlipChange(false); // false = persona visible
    }
  };

  // ⭐ Toggle flip (legacy method)
  const handleFlip = () => {
    if (isFlipped) {
      flipToFront();
    } else {
      flipToBack();
    }
  };

  // ⭐ Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    flipToBack,
    flipToFront,
    isFlipped,
  }));

  // ✅ Interpolate rotation for FULL SCREEN flip
  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'], // ⭐ 360deg for complete rotation
  });

  // ⭐ Front Animated Style (iOS + Android compatible)
  const frontAnimatedStyle = {
    transform: [{ rotateY: frontRotation }],
    backfaceVisibility: 'hidden', // ⭐ iOS CRITICAL FIX!
    zIndex: isFlipped ? 1 : 2,
  };

  // ⭐ Back Animated Style (iOS + Android compatible)
  const backAnimatedStyle = {
    transform: [{ rotateY: backRotation }],
    backfaceVisibility: 'hidden', // ⭐ iOS CRITICAL FIX!
    zIndex: isFlipped ? 2 : 1,
  };

  return (
    <View style={[styles.flipContainer, { height: availableHeight_local }]}>
      {/* ⭐ FRONT VIEW - Original Persona Card */}
      <Animated.View 
        style={[
          styles.container, 
          { height: availableHeight_local },
          frontAnimatedStyle
        ]}
        pointerEvents={isFlipped ? 'none' : 'box-none'}
      >
        {/* 1. Background Image (Native Image) - Testing if FastImage is the issue */}
        <Image
          source={{ uri: imageUrl }}
          style={styles.backgroundMedia}
          resizeMode="cover"
          onLoad={() => {
       //     console.log('✅ [PersonaCardView] Image LOADED:', persona.persona_name, imageUrl);
          }}
          onError={(error) => {
       //     console.error('❌ [PersonaCardView] Image ERROR:', persona.persona_name, imageUrl, error);
          }}
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
             //   console.error('[PersonaCardView] Video Error:', persona.persona_name, error);
              }
            }}
          />
        </Animated.View>
      )}

      {/* ⭐ NEW: Incomplete Persona UI (Blur + Timer + Check Button) */}
      {/* ⭐ CRITICAL FIX: Always render, control visibility with opacity/pointerEvents */}
      {(() => {
        const shouldShowBlur = persona?.done_yn === 'N';
        
        /*
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 [PersonaCardView] BLUR CHECK');
        console.log('  - Persona:', persona?.persona_name);
        console.log('  - persona_key:', persona?.persona_key);
        console.log('  - done_yn:', persona?.done_yn);
        console.log('  - shouldShowBlur:', shouldShowBlur);
        console.log('  - remainingSeconds:', remainingSeconds);
        console.log('  - isCheckingStatus:', isCheckingStatus);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        */
        // ⭐ ULTIMATE FIX: Control BlurView with blurAmount (0 = no blur)
        // BlurView is a Native component - conditional rendering doesn't work with FlashList
        // Solution: Always render, but set blurAmount=0 to disable blur effect
        return (
          <View 
            style={[
              styles.incompleteOverlay,
              !shouldShowBlur && { opacity: 0, pointerEvents: 'none' }
            ]}
          >
            <BlurView
              style={styles.blurContainer}
              blurType="light"
              blurAmount={shouldShowBlur ? 30 : 0} // ⭐ CRITICAL: Dynamic blur control
              reducedTransparencyFallbackColor={
                shouldShowBlur 
                  ? "rgba(255, 255, 255, 0.3)" 
                  : "transparent"
              }
            />
            {shouldShowBlur && (
            <View style={styles.timerContainer}>
              <CustomText type="title" bold style={styles.generatingText}>
                ⏳ {t('persona.creation.generating')}
              </CustomText>
              
              {remainingSeconds > 0 ? (
                <CustomText type="title" bold style={styles.timerText}>
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
                      onCheckStatus(persona, () => {
                        setIsCheckingStatus(false);
                      });
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
            )}
          </View>
        );
      })()}

        {/* 3. Chat Overlay - Removed (now rendered in PersonaSwipeViewer) */}
      </Animated.View>

      {/* ⭐ BACK VIEW - Postcard */}
      <Animated.View 
        style={[
          styles.backContainer,
          { height: availableHeight_local },
          backAnimatedStyle
        ]}
        pointerEvents={isFlipped ? 'box-none' : 'none'}
      >
        <PostcardBack
          persona={persona}
          onClose={flipToFront}
          isVisible={isFlipped} // ⭐ NEW: Pass flip state to trigger animation
        />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  // ═══════════════════════════════════════════════════════════════════════════
  // Flip Container (Perspective for 3D effect)
  // ═══════════════════════════════════════════════════════════════════════════
  flipContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: '#000000',
    overflow: 'visible', // ⭐ iOS CRITICAL: Allow 3D transformation
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Main Container (Front View)
  // ═══════════════════════════════════════════════════════════════════════════
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Back Container (Postcard View)
  // ═══════════════════════════════════════════════════════════════════════════
  backContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    backgroundColor: '#000000',
    overflow: 'hidden',
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
    fontSize: scale(20),
    color: '#FFFFFF',
    fontWeight: '400',
//    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  checkButton: {
    backgroundColor: COLORS.DEEP_BLUE,
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

// ✅ CRITICAL FIX: Remove React.memo comparison function
// Problem: memo was blocking re-renders even when done_yn changed in API data
// - New refresh: API returns correct data, but memo blocks render
// - Manual update: setState forces render, memo is bypassed
// Solution: Remove memo or use simpler comparison
// For now: DISABLE memo to ensure BlurView always updates correctly
export default PersonaCardView;

