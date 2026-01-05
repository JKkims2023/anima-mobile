/**
 * 🎬 MiniYoutubeVideoPlayer - Mini YouTube Video Player (Floating Overlay)
 * 
 * Features:
 * - Floating overlay (same as YouTube Music!)
 * - Slides down from top
 * - Close button
 * - Controlled by external state (isPlaying)
 * - 100% identical position/size as HiddenYoutubePlayer
 * 
 * Usage:
 * - For YouTube video bubbles
 * - Floats above chat (does NOT push chat list)
 * - Close button to hide
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-05
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import Icon from 'react-native-vector-icons/Ionicons';
import { verticalScale, moderateScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PLAYER_HEIGHT = verticalScale(190); // ⭐ 100% identical to HiddenYoutubePlayer!

const MiniYoutubeVideoPlayer = ({ 
  videoId,
  title,
  onClose,
  topPosition = 0, // Position from top (below header)
  visible = true, // Control visibility with animation
}) => {
  const playerRef = useRef(null);
  const isReadyRef = useRef(false);
  
  // 🎬 Animation values
  const translateY = useRef(new Animated.Value(visible ? 0 : -PLAYER_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  // Handle player ready event
  const handleReady = useCallback(() => {
    console.log('✅ [Mini YouTube Video] Player is ready!');
    isReadyRef.current = true;
  }, []);

  // 🎬 Slide animation when visible changes
  useEffect(() => {
    if (visible) {
      console.log('🎬 [YouTube Video] Sliding DOWN...');
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
      console.log('🎬 [YouTube Video] Sliding UP...');
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

  const handleStateChange = useCallback((state) => {
    console.log('🎬 [Mini YouTube Video] State changed:', state);
  }, []);

  const handleError = useCallback((error) => {
    console.error('❌ [Mini YouTube Video] Error:', error);
  }, []);
  
  const handleClose = useCallback(() => {
    HapticService.light();
    onClose?.();
  }, [onClose]);

  if (!videoId) {
    console.log('ℹ️ [Mini YouTube Video] No videoId, not rendering');
    return null;
  }

  console.log('🎬 [Mini YouTube Video] Rendering player');
  console.log('   videoId:', videoId);
  console.log('   title:', title);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          top: topPosition - verticalScale(19), // ⭐ 100% identical to HiddenYoutubePlayer!
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      {/* 🎬 YouTube Player */}
      <YoutubePlayer
        ref={playerRef}
        height={PLAYER_HEIGHT}
        width={SCREEN_WIDTH}
        videoId={videoId}
        play={true} // Auto-play when opened
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
            console.log('🚫 [YouTube Video] Blocked navigation to:', request.url);
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
          autoplay: 1,      // Auto-play for video!
        }}
      />
      
      {/* ❌ Close Button (Top-Right) */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="close-circle" size={moderateScale(32)} color="rgba(255, 255, 255, 0.9)" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // 🎬 Floating overlay player (100% identical to HiddenYoutubePlayer!)
  container: {
    position: 'absolute',
    // top will be set via prop (topPosition)
    left: 0,
    right: 0,
    width: '100%',
    height: verticalScale(190),           // ⭐ 100% identical!
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.3)', // Blue for video
    overflow: 'hidden',
    zIndex: 1000,          // Above chat list
    // Subtle shadow for depth
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  webView: {
    opacity: 1,
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
  },
  // ❌ Close Button
  closeButton: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    zIndex: 1001, // Above player
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: moderateScale(16),
    padding: moderateScale(4),
  },
});

export default MiniYoutubeVideoPlayer;

