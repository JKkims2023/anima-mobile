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
import { scale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const PersonaBackgroundView = memo(({
  persona,
  isScreenFocused = true,
  opacity = 1,
}) => {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Determine media URL
  const hasVideo = persona?.selected_dress_video_url && persona?.selected_dress_video_convert_yn === 'Y';
  const videoUrl = hasVideo ? persona.selected_dress_video_url : null;
  const imageUrl = persona?.selected_dress_image_url || persona?.original_url || persona?.default_image;

  // Reset video error when persona changes
  useEffect(() => {
    setVideoError(false);
    setVideoLoaded(false);
  }, [persona?.persona_key]);

  // Video control based on screen focus
  useEffect(() => {
    if (videoRef.current && hasVideo && !videoError) {
      if (isScreenFocused) {
        videoRef.current.seek(0); // Restart video
      }
    }
  }, [isScreenFocused, hasVideo, videoError]);

  const handleVideoError = (error) => {
    console.error('[PersonaBackgroundView] Video error:', error);
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  return (
    <RNAnimated.View style={[styles.container, { opacity }]}>
      {hasVideo && !videoError ? (
        <>
          {/* Video */}
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            resizeMode="cover"
            repeat
            muted
            paused={!isScreenFocused}
            onError={handleVideoError}
            onLoad={handleVideoLoad}
          />
          
          {/* Image fallback while video loads */}
          {!videoLoaded && imageUrl && (
            <FastImage
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode={FastImage.resizeMode.contain}
            />
          )}
        </>
      ) : (
        // Image only
        <FastImage
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode={FastImage.resizeMode.contain}
        />
      )}
      
      {/* Gradient overlay for better text readability */}
      <View style={styles.gradientOverlay} />
    </RNAnimated.View>
  );
});

PersonaBackgroundView.displayName = 'PersonaBackgroundView';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.BG_PRIMARY,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // 30% dark overlay for text readability
  },
});

export default PersonaBackgroundView;

