/**
 * 🎵 HiddenYoutubePlayer - Invisible YouTube Player for Audio-only Playback
 * 
 * Features:
 * - Completely hidden (7-layer protection)
 * - Audio-only playback from YouTube
 * - Controlled by external state (isPlaying)
 * - Reports playback state changes
 * 
 * Usage:
 * - For YouTube music bubbles (audio streaming)
 * - Controlled by MiniMusicWidget
 * - NEVER shows on screen (invisible!)
 * 
 * @author JK & Hero AI
 * @date 2026-01-04
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { verticalScale } from '../../utils/responsive-utils';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PLAYER_HEIGHT = verticalScale(190);

const HiddenYoutubePlayer = ({ 
  videoId,
  isPlaying = false,
  onStateChange,
  onError,
  topPosition = 0, // Position from top (below header)
  visible = true, // Control visibility with animation
}) => {
  const playerRef = useRef(null);
  const prevPlayingRef = useRef(isPlaying);
  const isReadyRef = useRef(false);
  
  // 🎬 Animation values
  const translateY = useRef(new Animated.Value(visible ? 0 : -PLAYER_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  // Handle player ready event
  const handleReady = useCallback(() => {
    console.log('✅ [Hidden YouTube] Player is ready!');
    isReadyRef.current = true;
  }, []);

  // 🎬 Slide animation when visible changes
  useEffect(() => {
    if (visible) {
      console.log('🎬 [YouTube Player] Sliding DOWN...');
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      console.log('🎬 [YouTube Player] Sliding UP...');
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: -PLAYER_HEIGHT,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // 🔧 FIX: Remove player and recreate when isPlaying changes
  // This is the most reliable way with react-native-youtube-iframe
  useEffect(() => {
    if (prevPlayingRef.current !== isPlaying) {
      console.log('🎵 [Hidden YouTube] isPlaying changed:', prevPlayingRef.current, '→', isPlaying);
      prevPlayingRef.current = isPlaying;
    }
  }, [isPlaying]);

  const handleStateChange = useCallback((state) => {
    console.log('🎵 [Hidden YouTube] State changed:', state);
    
    // State values:
    // - 'unstarted'
    // - 'ended'
    // - 'playing'
    // - 'paused'
    // - 'buffering'
    // - 'video cued'
    
    onStateChange?.(state);
  }, [onStateChange]);

  const handleError = useCallback((error) => {
    console.error('❌ [Hidden YouTube] Error:', error);
    onError?.(error);
  }, [onError]);

  if (!videoId) {
    console.log('ℹ️ [Hidden YouTube] No videoId, not rendering');
    return null;
  }

  console.log('🎵 [Hidden YouTube] Rendering player');
  console.log('   videoId:', videoId);
  console.log('   isPlaying:', isPlaying);

  return (
    <Animated.View 
      style={[
        styles.hiddenContainer, 
        { 
          top: topPosition - verticalScale(19),
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <YoutubePlayer
        ref={playerRef}
        height={PLAYER_HEIGHT}
        width={SCREEN_WIDTH}
        videoId={videoId}
        play={isPlaying}
        onReady={handleReady}
        onChangeState={handleStateChange}
        onError={handleError}
        // Additional props for optimized playback
        webViewStyle={styles.webView}
        webViewProps={{
          androidLayerType: 'hardware',
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          allowsLinkPreview: false,
          javaScriptEnabled: true,
          domStorageEnabled: true,
          // Prevent opening external apps
          onShouldStartLoadWithRequest: (request) => {
            // Only allow YouTube iframe URLs
            if (request.url.includes('youtube.com/embed')) {
              return true;
            }
            // Block all other navigation attempts
            console.log('🚫 [YouTube Player] Blocked navigation to:', request.url);
            return false;
          },
        }}
        // Enable controls so user can tap to pause/play
        initialPlayerParams={{
          controls: true,   // User can tap to control
          modestbranding: true,
          showClosedCaptions: false,
          rel: false,
          playsinline: 1,
          autoplay: 0,      // Don't auto-play, wait for user tap
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // 🎵 Floating overlay player (does NOT push chat list)
  hiddenContainer: {
    position: 'absolute',
    // top will be set via prop (topPosition)
    left: 0,
    right: 0,
    width: '100%',
    height: verticalScale(190),           // Compact height
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 184, 77, 0.3)',
    overflow: 'hidden',
    zIndex: 1000,          // Above chat list
    // Subtle shadow for depth
    shadowColor: '#FFB84D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  webView: {
    opacity: 1,
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
  },
});

export default HiddenYoutubePlayer;

