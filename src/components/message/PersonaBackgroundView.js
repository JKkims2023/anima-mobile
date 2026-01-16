/**
 * 🎬 PersonaBackgroundView Component
 * 
 * Displays persona image or video as background
 * Based on ManagerAIView.js
 * 
 * Features:
 * - Video playback for personas with video
 * - Image fallback
 * - Aspect ratio handling
 * - Screen focus-aware video control
 */

import React, { useRef, useEffect, useState, memo } from 'react';
import { View, StyleSheet, Image, Animated as RNAnimated } from 'react-native';
import Video from 'react-native-video';
import FastImage from 'react-native-fast-image';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const PersonaBackgroundView = memo(({
  persona,
  isScreenFocused = true,
  opacity = 1,
  showOverlay = false, // ⭐ NEW: Control gradient overlay
  videoKey, // ⭐ NEW: Unique key for forcing video remount
}) => {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Determine media URL
  const hasVideo = persona?.selected_dress_video_url && persona?.selected_dress_video_convert_done === 'Y';
  const videoUrl = hasVideo ? persona.selected_dress_video_url : null;
  const imageUrl = persona?.selected_dress_image_url || persona?.original_url || persona?.default_image;

  // Reset video state when persona or videoKey changes
  useEffect(() => {
    setVideoError(false);
    setVideoLoaded(false);
    setIsPlaying(false);

    console.log('[PersonaBackgroundView] persona:', persona);
    console.log('[PersonaBackgroundView] hasVideo:', hasVideo);
    console.log('[PersonaBackgroundView] videoUrl:', videoUrl);
    console.log('[PersonaBackgroundView] imageUrl:', imageUrl);
  }, [persona?.persona_key, videoKey]);

  // Video control based on screen focus
  useEffect(() => {
    if (videoRef.current && hasVideo && !videoError && isScreenFocused) {
      // Force restart video when screen is focused
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.seek(0);
          setIsPlaying(true);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isScreenFocused, hasVideo, videoError, videoKey]);

  const handleVideoError = (error) => {
    console.error('[PersonaBackgroundView] Video error:', error);
    setVideoError(true);
    setIsPlaying(false);
  };

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    // Auto-play after load
    if (isScreenFocused) {
      setIsPlaying(true);
    }
  };

  return (
    <RNAnimated.View style={[styles.container, { opacity }]}>
      {/* ✅ Always show image as base layer */}
      <FastImage
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode={FastImage.resizeMode.cover}
      />

      {/* ✅ Video layer on top (if available) */}
      {hasVideo && !videoError && (
        <Video
          key={videoKey || videoUrl} // ⭐ Force remount when videoKey changes
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode="cover"
          repeat
          muted
          paused={!isScreenFocused || !isPlaying}
          onError={handleVideoError}
          onLoad={handleVideoLoad}
          playInBackground={false}
          playWhenInactive={false}
        />
      )}
      
      {/* Gradient overlay for better text readability (optional) */}
      {showOverlay && <View style={styles.gradientOverlay} />}
    </RNAnimated.View>
  );
});

PersonaBackgroundView.displayName = 'PersonaBackgroundView';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.BG_PRIMARY,
//    marginTop: Platform.OS === 'ios' ? verticalScale(115) : verticalScale(88),

  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  //  backgroundColor: 'rgba(0, 0, 0, 0.3)', // 30% dark overlay for text readability
  },
});

export default PersonaBackgroundView;

