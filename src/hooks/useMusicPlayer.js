/**
 * 🎵 useMusicPlayer - Music Player Hook
 * 
 * Features:
 * - YouTube music playback (direct player, no floating widget)
 * - YouTube video player
 * - Mutual exclusivity (music/video)
 * - Simplified state management
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-05
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
  // 🎵 YouTube Music Player state (HiddenYoutubePlayer)
  const [floatingContent, setFloatingContent] = useState(null);
  
  // 🎬 YouTube Video Player state (MiniYoutubeVideoPlayer)
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
      console.log('🎵 [Music Press] YouTube source detected! Opening player...');
      
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
        
        // ⭐ Close YouTube video player if open (mutual exclusivity!)
        if (showYouTubePlayer) {
          console.log('🎬 [Music Press] Closing video player (mutual exclusivity)');
          setShowYouTubePlayer(false);
          setCurrentVideo(null);
        }
        
        // ⭐ Open music player directly (no floating widget!)
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
          isPlaying: true,      // ⭐ Auto-play!
          showPlayer: true      // ⭐ Show player immediately!
        });
        
        HapticService.trigger('impactMedium');
        console.log('✅ [Music Press] YouTube music player opened and playing!');
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
  }, [showYouTubePlayer]);
  
  // 🎵 Handle music close (close button)
  const handleMusicClose = useCallback(() => {
    console.log('🛑 [Music Close] Closing music player...');
    
    // Clear floating content (hide player)
    setFloatingContent(null);
    
    // Haptic feedback
    HapticService.trigger('impactMedium');
    
    console.log('✅ [Music Close] Music player closed');
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
    
    // ⭐ Close music player if open (mutual exclusivity!)
    if (floatingContent) {
      console.log('🎵 [YouTube Press] Closing music player (mutual exclusivity)');
      setFloatingContent(null);
    }
    
    // Haptic feedback
    HapticService.trigger('impactMedium');
    
    // Set video data and open player
    setCurrentVideo({
      videoId: youtubeData.videoId,
      title: youtubeData.title,
      channel: youtubeData.channel,
    });
    setShowYouTubePlayer(true);
  }, [floatingContent]);
  
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
    handleMusicClose, // ⭐ Renamed from handleMusicStop
    handleYouTubePress,
    handleYouTubeClose,
  };
};

export default useMusicPlayer;
