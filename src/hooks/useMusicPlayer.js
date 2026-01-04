/**
 * 🎵 useMusicPlayer - Music Player Hook
 * 
 * Features:
 * - YouTube music playback
 * - Floating music widget control
 * - YouTube video modal
 * - Music player state management
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-04
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import HapticService from '../utils/HapticService';

/**
 * useMusicPlayer Hook
 * 
 * @returns {Object} Music player state and handlers
 */
export const useMusicPlayer = () => {
  // 🎨 Floating content state (music/image/video)
  const [floatingContent, setFloatingContent] = useState(null);
  
  // 🎬 YouTube Video Player state
  const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  
  // 🎵 Handle music press from chat bubble
  const handleMusicPress = useCallback(async (musicData) => {
    if (!musicData || !musicData.url) {
      console.error('❌ [Music Press] Invalid music data:', musicData);
      return;
    }
    
    console.log('🎵 [Music Press] Clicked from chat bubble');
    console.log('   Track:', musicData.title);
    console.log('   Artist:', musicData.artist);
    console.log('   URL:', musicData.url);
    console.log('   Source (original):', musicData.source);
    
    // 🔧 Detect YouTube URL and correct source
    let actualSource = musicData.source;
    if (musicData.url.includes('youtube.com') || musicData.url.includes('youtu.be')) {
      console.log('🔧 [Music Press] YouTube URL detected! Correcting source to "youtube"');
      actualSource = 'youtube';
    }
    console.log('   Source (corrected):', actualSource);
    
    // 🎬 Check if source is YouTube
    if (actualSource === 'youtube') {
      console.log('🎵 [Music Press] YouTube source detected! Using Hidden Player...');
      
      // Extract videoId from YouTube URL
      let videoId = null;
      
      // Pattern 1: youtube.com/watch?v=VIDEO_ID
      if (musicData.url.includes('youtube.com/watch')) {
        const match = musicData.url.match(/[?&]v=([^&]+)/);
        if (match && match[1]) {
          videoId = match[1];
          console.log('✅ [Music Press] Extracted videoId from youtube.com:', videoId);
        }
      }
      // Pattern 2: youtu.be/VIDEO_ID
      else if (musicData.url.includes('youtu.be/')) {
        const match = musicData.url.match(/youtu\.be\/([^?]+)/);
        if (match && match[1]) {
          videoId = match[1];
          console.log('✅ [Music Press] Extracted videoId from youtu.be:', videoId);
        }
      }
      
      if (videoId) {
        console.log('✅ [Music Press] VideoId extracted:', videoId);
        
        // 🎵 If currently playing this track, pause
        if (floatingContent?.track?.url === musicData.url && floatingContent?.isPlaying) {
          console.log('⏸️  [Music Press] Pausing current YouTube track...');
          setFloatingContent(prev => ({
            ...prev,
            isPlaying: false
          }));
          HapticService.trigger('impactMedium');
          return;
        }
        
        // 🎵 If paused (same track), resume
        if (floatingContent?.track?.url === musicData.url && !floatingContent?.isPlaying) {
          console.log('▶️  [Music Press] Resuming YouTube track...');
          setFloatingContent(prev => ({
            ...prev,
            isPlaying: true
          }));
          HapticService.trigger('impactMedium');
          return;
        }
        
        // Set floating content for YouTube music
        setFloatingContent({
          contentType: 'music',
          status: 'completed',
          track: {
            id: musicData.id || `youtube-${Date.now()}`,
            title: musicData.title,
            artist: musicData.artist,
            url: musicData.url,
            duration: musicData.duration,
            image: musicData.image,
            source: 'youtube',
            videoId: videoId, // Store videoId for HiddenYoutubePlayer
          },
          isPlaying: false,      // Don't auto-play
          showPlayer: false      // Don't show player yet (only show widget)
        });
        
        HapticService.trigger('impactMedium');
        console.log('✅ [Music Press] YouTube music ready to play!');
        return;
      } else {
        console.error('❌ [Music Press] Failed to extract videoId from URL:', musicData.url);
        Alert.alert(
          '재생 불가',
          'YouTube 음악을 불러올 수 없습니다.',
          [{ text: '확인' }]
        );
        return;
      }
    }
    
    // 🚫 Non-YouTube music is no longer supported
    console.warn('⚠️ [Music Press] Only YouTube music is supported');
    Alert.alert(
      '지원하지 않는 음원',
      'YouTube 음악만 재생 가능합니다.',
      [{ text: '확인' }]
    );
  }, [floatingContent]);
  
  // 🎵 Handle music toggle (show/hide player for YouTube)
  const handleMusicToggle = useCallback(async () => {
    if (!floatingContent) return;
    
    // Handle music player toggle
    if (floatingContent.contentType === 'music' && floatingContent.track) {
      console.log('🎵 [Music Toggle] Button clicked');
      console.log('   isPlaying:', floatingContent.isPlaying);
      console.log('   showPlayer:', floatingContent.showPlayer);
      console.log('   Track:', floatingContent.track.title);
      console.log('   Source:', floatingContent.track.source);
      
      // Haptic feedback
      HapticService.trigger('impactMedium');
      
      // Handle YouTube music (Toggle player visibility)
      if (floatingContent.track.source === 'youtube') {
        console.log('🎵 [Music Toggle] YouTube music - toggling player visibility');
        setFloatingContent(prev => ({
          ...prev,
          showPlayer: !prev.showPlayer  // Toggle player visibility
        }));
        return;
      }
    }
  }, [floatingContent]);
  
  // 🎵 Handle music stop (long press)
  const handleMusicStop = useCallback(() => {
    console.log('🛑 [Music Stop] Stopping music (long press)...');
    
    // Clear floating content (hide widget and player)
    setFloatingContent(null);
    
    // Haptic feedback
    HapticService.trigger('impactMedium');
    
    console.log('✅ [Music Stop] Widget hidden');
  }, []);
  
  // 🎬 Handle YouTube video press
  const handleYouTubePress = useCallback((youtubeData) => {
    if (!youtubeData || !youtubeData.videoId) {
      console.error('❌ [YouTube Press] Invalid video data:', youtubeData);
      return;
    }
    
    console.log('🎬 [YouTube Press] Opening video player');
    console.log('   Title:', youtubeData.title);
    console.log('   Video ID:', youtubeData.videoId);
    
    // Haptic feedback
    HapticService.trigger('impactMedium');
    
    // Set video data and open player
    setCurrentVideo({
      videoId: youtubeData.videoId,
      title: youtubeData.title,
      channel: youtubeData.channel,
    });
    setShowYouTubePlayer(true);
  }, []);
  
  // 🎬 Handle YouTube player close
  const handleYouTubeClose = useCallback(() => {
    console.log('🎬 [YouTube] Closing player');
    setShowYouTubePlayer(false);
    HapticService.trigger('impactLight');
  }, []);
  
  // Return states and handlers
  return {
    // States
    floatingContent,
    setFloatingContent,
    showYouTubePlayer,
    currentVideo,
    
    // Handlers
    handleMusicPress,
    handleMusicToggle,
    handleMusicStop,
    handleYouTubePress,
    handleYouTubeClose,
  };
};

export default useMusicPlayer;

