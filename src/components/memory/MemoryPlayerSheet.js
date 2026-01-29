/**
 * 🎁 MemoryPlayerSheet - Unified Emotional Gift Viewer
 * 
 * Features:
 * - 🖼️ Image Gift: Full-screen AI-generated image
 * - 🎵 Music Gift: Persona image + music player controls
 * - Animated message with fade effect
 * - Share & Close actions
 * - Emotional presentation (감성적 표현)
 * 
 * Design (Unified):
 * ┌─────────────────────────────┐
 * │  From. Persona Name         │
 * ├─────────────────────────────┤
 * │                             │
 * │    🖼️/🎵 Image             │
 * │    (Full Screen)            │
 * │                             │
 * │         ╭────────────╮      │
 * │         │ [Gradient] │      │
 * │         │  😊 Emotion │      │
 * │         │  Message    │      │
 * │         │  [▶] [━━━]  │ ← Music only
 * │         ╰────────────╯      │
 * ├─────────────────────────────┤
 * │ [공유]            [닫기]    │
 * └─────────────────────────────┘
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur'; // ⭐ NEW: For glassmorphic design
import Sound from 'react-native-sound'; // ⭐ CHANGED: From react-native-video to react-native-sound
import Slider from '@react-native-community/slider'; // ⭐ For progress bar
import Icon from 'react-native-vector-icons/Ionicons';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import FlipCard from '../message/FlipCard'; // 🔮 NEW: For tarot card flip animation
import TAROT_IMAGES from '../../assets/tarot'; // 🔮 NEW: Tarot card images (local)
import GiftBackgroundEffect from '../particle/GiftBackgroundEffect'; // 🎨 NEW: Visual effects Layer 1
import GiftActiveEffect from '../particle/GiftActiveEffect'; // 🎨 NEW: Visual effects Layer 2
import { useTheme } from '../../contexts/ThemeContext';
import { useAnima } from '../../contexts/AnimaContext';
import HapticService from '../../utils/HapticService';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import Video from 'react-native-video';

// ⚙️ Sound 설정 (백그라운드 재생 허용)
Sound.setCategory('Playback', true);

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Format seconds to MM:SS
 */
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Emotion emoji mapping
 */
const EMOTION_EMOJI = {
  joy: '😊',
  gratitude: '🙏',
  love: '💙',
  empathy: '🤗',
  excitement: '🎉',
  hope: '✨',
  curiosity: '🤔',
};

/**
 * Emotion label mapping (Korean)
 */
const EMOTION_LABEL = {
  joy: '기쁨',
  gratitude: '감사',
  love: '사랑',
  empathy: '공감',
  excitement: '설렘',
  hope: '희망',
  curiosity: '궁금함',
};

/**
 * MemoryPlayerSheet Component
 */
const MemoryPlayerSheet = forwardRef(({isOpen, memory, onMemoryUpdate, onClose }, ref) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { showAlert, showToast } = useAnima();
  
  // Refs
  const bottomSheetRef = useRef(null);
  const soundRef = useRef(null); // ⭐ CHANGED: From videoRef to soundRef (react-native-sound)
  const progressIntervalRef = useRef(null); // ⭐ NEW: For progress tracking
  const currentUrlRef = useRef(null); // ⭐ NEW: Track current music URL
  
  // State
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // ⭐ Music playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7); // ⭐ Volume control
  const [showControls, setShowControls] = useState(false); // ⭐ NEW: Expand/Collapse state (default: collapsed)
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoKey, setVideoKey] = useState(null);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [videoRef, setVideoRef] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  // 🔮 NEW: Tarot card flip state
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0); // 선택된 카드 (기본: 0번째)
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 Animation values (Enhanced for emotional presentation)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const messageOpacity = useSharedValue(0);
  const messageScale = useSharedValue(0.95);
  const messageTranslateX = useSharedValue(100); // ⭐ NEW: Slide from right
  
  // ⭐ FIX: Properly forward ref using useImperativeHandle
  useImperativeHandle(ref, () => ({
    present: () => {
      console.log('🎁 [MemoryPlayerSheet] present() called');
      bottomSheetRef.current?.present();
    },
    dismiss: () => {
      console.log('🎁 [MemoryPlayerSheet] dismiss() called');
      bottomSheetRef.current?.dismiss();
    },
  }), []);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🌟 Enhanced message animation (Slide + Fade + Scale)
  // Slides from right with fade-in effect (더 천천히, 더 우아하게)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (isOpen) {
      // 🎭 Fade in effect (천천히 나타나기)
      messageOpacity.value = withTiming(1, {
        duration: 1800, // ⭐ Slower (was 800ms)
        easing: Easing.out(Easing.ease),
      });
      
      // 🎯 Scale effect (약간의 줌인)
      messageScale.value = withTiming(1, {
        duration: 2000, // ⭐ Slower (was 800ms)
        easing: Easing.out(Easing.back(1.1)), // Subtle bounce
      });
      
      // 🚀 Slide from right (우측에서 좌측으로 슬라이드)
      messageTranslateX.value = withTiming(0, {
        duration: 1600, // ⭐ NEW: Horizontal slide animation
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [isOpen]);

  
  // Animated message style
  const animatedMessageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [
      { translateX: messageTranslateX.value }, // ⭐ NEW: Horizontal slide
      { scale: messageScale.value },
    ],
  }));
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle delete (현재는 사용 안함 - 소중한 교감 선물이므로 삭제 버튼 제거)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleDelete = () => {
    HapticService.light();
    
    showAlert({
      title: t('gift.delete_confirm') || '선물 삭제',
      message: t('gift.delete_confirm_message') || '이 선물을 삭제하시겠습니까?',
      emoji: '🗑️',
      buttons: [
        {
          text: t('common.cancel') || '취소',
          style: 'cancel',
        },
        {
          text: t('common.delete') || '삭제',
          style: 'destructive',
          onPress: () => {
            // Notify parent to delete
            onMemoryUpdate?.(memory, 'delete');
            bottomSheetRef.current?.dismiss();
            
            // Success feedback
            setTimeout(() => {
              showToast({
                type: 'success',
                message: t('gift.delete_success') || '선물이 삭제되었습니다',
                emoji: '✅',
              });
            }, 300);
          },
        },
      ],
    });
  };
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle share
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleShare = async () => {
    HapticService.light();
    
    try {
      const shareMessage = `${memory.ai_message}\n\n- ${memory.persona_name || 'ANIMA'}`;
      
      await Share.share({
        message: Platform.OS === 'ios'
          ? shareMessage
          : `${shareMessage}\n\n${memory.image_url}`,
        url: Platform.OS === 'ios' ? memory.image_url : undefined,
        title: memory.persona_name || 'ANIMA Gift',
      });
      
      HapticService.success();
    } catch (error) {
      console.error('[MemoryPlayerSheet] Share error:', error);
    }
  };
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎵 Music playback handlers (react-native-sound)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // ⭐ Progress tracking
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (soundRef.current && soundRef.current.isPlaying()) {
        soundRef.current.getCurrentTime((seconds) => {
          setCurrentTime(seconds);
        });
      }
    }, 500);
  }, []);
  
  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);
  
  // ⭐ Load and play music
  const loadAndPlayMusic = useCallback((musicUrl) => {
    if (!musicUrl) return;
    
    console.log('🎵 [MemoryPlayerSheet] Loading music:', musicUrl);
    
    // If same URL, just resume
    if (currentUrlRef.current === musicUrl && soundRef.current) {
      console.log('   ✅ Resuming existing sound...');
      soundRef.current.play((success) => {
        if (!success) {
          console.error('   ❌ Playback failed (resume)');
        }
      });
      setIsPlaying(true);
      startProgressTracking();
      return;
    }
    
    // Release previous sound
    if (soundRef.current) {
      console.log('   🔄 Releasing previous sound...');
      soundRef.current.release();
      soundRef.current = null;
    }
    
    // Load new sound
    currentUrlRef.current = musicUrl;
    
    const sound = new Sound(musicUrl, '', (error) => {
      if (error) {
        console.error('   ❌ Failed to load sound:', error);
        return;
      }
      
      console.log('   ✅ Sound loaded successfully!');
      const totalDuration = sound.getDuration();
      console.log('   Duration:', totalDuration, 'seconds');
      
      soundRef.current = sound;
      setDuration(totalDuration);
      setCurrentTime(0);
      sound.setVolume(volume);
      sound.setNumberOfLoops(-1); // Loop
      
      // ⭐ Auto-play
      sound.play((success) => {
        if (!success) {
          console.error('   ❌ Playback failed');
        }
      });
      
      setIsPlaying(true);
      startProgressTracking();
      HapticService.success();
    });
  }, [volume, startProgressTracking]);
  
  // ⭐ Play/Pause toggle
  const togglePlayPause = useCallback(() => {
    HapticService.light();
    
    if (!soundRef.current) return;
    
    if (isPlaying) {
      soundRef.current.pause();
      setIsPlaying(false);
      stopProgressTracking();
    } else {
      soundRef.current.play((success) => {
        if (!success) {
          console.error('   ❌ Resume failed');
        }
      });
      setIsPlaying(true);
      startProgressTracking();
    }
  }, [isPlaying, startProgressTracking, stopProgressTracking]);
  
  // ⭐ Seek handler
  const handleSeek = useCallback((value) => {
    if (soundRef.current) {
      soundRef.current.setCurrentTime(value);
      setCurrentTime(value);
    }
  }, []);
  
  // ⭐ Volume handler
  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    if (soundRef.current) {
      soundRef.current.setVolume(newVolume);
    }
  }, []);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle close
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleClose = () => {
    HapticService.light();
    
    // Stop music if playing
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
      soundRef.current = null;
    }
    
    stopProgressTracking();
    setIsPlaying(false);
    
    bottomSheetRef.current?.dismiss();
    
    // Reset animation values
    messageOpacity.value = 0;
    messageScale.value = 0.95;
    messageTranslateX.value = 100;
    setImageLoaded(false);
    setVideoUrl(null);
    setVideoKey(null);
    setIsScreenFocused(false);
    setIsVideoPlaying(false);
    
    // Reset music state
    setCurrentTime(0);
    setDuration(0);
    setShowControls(false); // ⭐ Reset to collapsed
    currentUrlRef.current = null;
    
    onClose?.();
  };
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Effects
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // ⭐ Auto-play music when sheet opens and music is available
  useEffect(() => {
    const isMusicGift = memory?.gift_type === 'music';
    const hasMusicUrl = !!memory?.music_url;
    
    if (isMusicGift && hasMusicUrl && isOpen) {
      console.log('🎵 [MemoryPlayerSheet] Auto-playing music...');
      loadAndPlayMusic(memory.music_url);
    }
    
    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.release();
        soundRef.current = null;
      }
      stopProgressTracking();
    };
  }, [memory?.gift_type, memory?.music_url, isOpen, loadAndPlayMusic, stopProgressTracking]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // ⭐ Don't return null - this breaks ref forwarding
  // Instead, render an empty BottomSheet that can be opened later
  
  if (false) {
    // Render empty BottomSheet for ref forwarding
    return (
      <CustomBottomSheet
        ref={bottomSheetRef}
        snapPoints={['90%']}
        title={'From.' + memory?.persona_name}
        onClose={handleClose}
        buttons={[]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>
            {t('common.loading') || '불러오는 중'}...
          </CustomText>
        </View>
      </CustomBottomSheet>
    );
  }
  
  const emotion = memory?.ai_emotion || 'joy';
  const emotionEmoji = EMOTION_EMOJI[emotion] || '💙';
  const emotionLabel = EMOTION_LABEL[emotion] || '선물';
  
  // ⭐ NEW: Determine gift type and image source
  const giftType = memory?.gift_type || 'image'; // Default to 'image' for backwards compatibility
  const isImageGift = giftType === 'image';
  const isMusicGift = giftType === 'music';
  
  // For music gifts, use persona image as background
const displayImageUrl = isMusicGift ? memory?.persona_url : memory?.image_url;
const hasVideo = memory?.persona_video_url != null && memory?.selected_dress_video_convert_done === 'Y';
  
  // 🔮 NEW: Parse tarot data (only for action_type === 'tarot')
  const isTarotGift = memory?.action_type === 'tarot';
  
  // 🛡️ Safe JSON parsing (handle both string and already-parsed object)
  const parseTarotData = (data) => {
    if (!data) return [];
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('[MemoryPlayerSheet] JSON parse error:', e);
        return [];
      }
    }
    // Already parsed (array or object)
    return data;
  };
  
  const tarotCardInfo = isTarotGift ? parseTarotData(memory?.tarot_card_info) : [];
  const tarotCardDesc = isTarotGift ? parseTarotData(memory?.tarot_card_desc) : [];
  
  // 🔍 DEBUG: Log tarot data (개발용)
  useEffect(() => {
    if (isTarotGift && isOpen) {
      console.log('🔮 [MemoryPlayerSheet] Tarot Gift Data:');
      console.log('   tarotCardInfo:', tarotCardInfo);
      console.log('   tarotCardDesc:', tarotCardDesc);
      console.log('   priority_reason:', memory?.priority_reason);
      console.log('   isFlipped:', isFlipped);
    }
  }, [isTarotGift, isOpen, tarotCardInfo, tarotCardDesc, isFlipped, memory?.priority_reason]);
  
  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      snapPoints={['90%']}
      title={'From. ' + memory?.persona_name}
      subtitle={null}
      onClose={handleClose}
      buttons={[
        {
          title: t('common.close') || '닫기', // ⭐ Changed from 삭제 to 닫기 (소중한 교감 선물)
          type: 'primary',
          onPress: handleClose,
          style: styles.closeButton,
        },
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 🔮 Conditional: FlipCard for Tarot, Normal View for others */}
      {isTarotGift ? (
        <FlipCard
          isFlipped={isFlipped}
          front={
            <View style={styles.imageContainer}>
        
        {isMusicGift ? (
          <>
          {hasVideo ? (
            <Video
              key={memory?.gift_id} // ⭐ Force remount when videoKey changes
              ref={videoRef}
              source={{ uri: memory?.persona_video_url }}
              style={styles.video}
              resizeMode="contain"
              repeat
              muted
              paused={!isOpen || !isVideoPlaying}
              onError={()=>{ console.log('video error'); }}
              onLoad={()=>{ setIsVideoPlaying(true); }}
              playInBackground={false}
              playWhenInactive={false}
            />
          ) : (
            <>
            <Image
              source={{ uri: displayImageUrl }}
              style={styles.giftImage}
              resizeMode="cover"
              onLoad={() => {
                setImageLoaded(true);
                HapticService.light();
              }}
            />
          </>
          )}
        </>
        ):(
        <>
          <Image
              source={{ uri: displayImageUrl }}
              style={styles.giftImage}
              resizeMode="cover"
              onLoad={() => {
                setImageLoaded(true);
                HapticService.light();
              }}
            />
        </>
        )}
          
        {/* ⭐ NEW: Top Music Player (Glassmorphic) - Only for music gifts */}
        {isMusicGift && memory?.music_url && isOpen && (
          <View style={styles.topMusicPlayer}>
            {/* Glassmorphic Background */}
            <View style={styles.musicPlayerGlass}>
              {Platform.OS === 'ios' ? (
                <BlurView
                  style={StyleSheet.absoluteFill}
                  blurType="dark"
                  blurAmount={15}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
              )}
              
              {/* Gradient Overlay */}
              <LinearGradient
                colors={['rgba(168, 237, 234, 0.15)', 'rgba(254, 214, 227, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              
              {/* ⭐ Music Player Content */}
              <View style={styles.musicPlayerWrapper}>
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    🎵 Fixed Header (항상 고정 - 변화 없음)
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <View style={styles.musicPlayerHeader}>
                  {/* Play/Pause Button */}
                  <TouchableOpacity
                    onPress={togglePlayPause}
                    style={styles.musicPlayButtonSmall}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={isPlaying ? 'pause-circle' : 'play-circle'}
                      size={scale(28)}
                      color="rgba(255, 255, 255, 0.95)"
                    />
                  </TouchableOpacity>
                  
                  {/* Title */}
                  <View style={styles.musicTitleCollapsed}>
                    <CustomText style={styles.musicTitleTextCollapsed} numberOfLines={1}>
                      {memory?.music_title || '음악'}
                    </CustomText>
                  </View>
                  
                  {/* Expand/Collapse Button */}
                  <TouchableOpacity
                    onPress={() => {
                      HapticService.light();
                      setShowControls(!showControls);
                    }}
                    style={styles.expandButton}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={showControls ? 'chevron-up-outline' : 'chevron-down-outline'}
                      size={scale(20)}
                      color="rgba(255, 255, 255, 0.8)"
                    />
                  </TouchableOpacity>
                </View>
                
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    🎵 Expandable Controls (확대 시 나타남)
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {showControls && (
                  <View style={styles.musicPlayerExpandedControls}>
                    {/* Divider */}
                    <View style={styles.controlsDivider} />
                    
                    {/* Progress & Time */}
                    <View style={styles.musicProgressContainer}>
                      <View style={styles.progressRow}>
                        <CustomText style={styles.musicTimeText}>{formatTime(currentTime)}</CustomText>
                        <Slider
                          style={styles.musicProgressBar}
                          value={currentTime}
                          minimumValue={0}
                          maximumValue={duration || 1}
                          onValueChange={setCurrentTime}
                          onSlidingComplete={handleSeek}
                          minimumTrackTintColor="rgba(168, 237, 234, 0.9)"
                          maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                          thumbTintColor="rgba(255, 255, 255, 0.95)"
                        />
                        <CustomText style={styles.musicTimeText}>{formatTime(duration)}</CustomText>
                      </View>
                    </View>
                    
                    {/* Volume Control */}
                    <View style={styles.musicVolumeContainer}>
                      <Icon 
                        name={volume === 0 ? 'volume-mute' : volume < 0.5 ? 'volume-low' : 'volume-high'} 
                        size={scale(20)} 
                        color="rgba(255, 255, 255, 0.8)" 
                      />
                      <Slider
                        style={styles.musicVolumeSlider}
                        value={volume}
                        minimumValue={0}
                        maximumValue={1}
                        onValueChange={handleVolumeChange}
                        minimumTrackTintColor="rgba(168, 237, 234, 0.9)"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                        thumbTintColor="rgba(255, 255, 255, 0.95)"
                      />
                      <CustomText style={styles.musicVolumeText}>{Math.round(volume * 100)}%</CustomText>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
        
        {/* 🎨 NEW: Background Effect Layer (z-index: 10) */}
        {memory?.background_effect && memory?.background_effect !== 'none' && false && (
          <View 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            }}
            pointerEvents="none"
          >
            <GiftBackgroundEffect 
              type={memory?.background_effect}
              isActive={isOpen} 
            />
          </View>
        )}
        
        {/* Bottom Gradient Overlay (z-index: 20) */}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0)',
            'rgba(0, 0, 0, 0.3)',
            'rgba(0, 0, 0, 0.7)',
            'rgba(0, 0, 0, 0.9)',
          ]}
          locations={[0, 0.4, 0.7, 1]}
          style={styles.gradientOverlay}
        >
        {/* Animated Message Overlay (z-index: 40) */}
        <Animated.View style={[styles.messageOverlay, animatedMessageStyle]}>
          {/* Gift Type Indicator */}
          <View style={styles.emotionTag}>
            <CustomText style={styles.emotionEmoji}>
              {isMusicGift ? '🎵' : memory?.action_type === 'tarot' ? '🔮' : emotionEmoji}
            </CustomText>
            <CustomText style={styles.emotionText}>
              {isMusicGift ? (memory?.music_title || '음악') : memory?.action_type === 'tarot' ? '타로 리딩' : emotionLabel}
            </CustomText>
          </View>
          
          {/* 🔮 NEW: Tarot Flip Chipset (상단 우측) */}
          {memory?.action_type === 'tarot' && (
            <TouchableOpacity
              style={styles.tarotFlipChip}
              onPress={() => {
                HapticService.light();
                setIsFlipped(!isFlipped);
              }}
              activeOpacity={0.8}
            >
              <Icon name="layers-outline" size={scale(18)} color="#FFFFFF" />
              <CustomText style={styles.tarotFlipText}>
                {isFlipped ? '앞면' : '카드 보기'}
              </CustomText>
            </TouchableOpacity>
          )}
          
          {/* AI Message */}
          <CustomText style={styles.giftMessage}>
            {memory?.ai_message}
          </CustomText>
          
          <View style={styles.infoContainer}>
            
            <Image
              source={{ uri: 
                memory?.action_type === 'emotion' ? 
                memory?.persona_url : 
                memory?.action_type === 'confession' ? 'https://babi-cdn.logbrix.ai/babi/real/babi/9be066da-1a9b-408b-b4d8-bf600923a3cd_00001_.png' : 
                'https://babi-cdn.logbrix.ai/babi/real/babi/e832b7d9-4ff2-41f1-8c5f-0b08b055fe9d_00001_.png' }}
              style={styles.personaImage}
              resizeMode="cover"
            />
            <View style={styles.personaNameContainer}>
              
              {/* Persona Name */}
              {memory?.persona_name && (
                <CustomText style={styles.personaName}>
                  - {memory.action_type === 'emotion' ? memory.persona_name : memory.action_type === 'confession' ? 'NEXUS' : 'SAGE'}
                </CustomText>
              )}
              
              {/* Date */}
              <CustomText style={styles.giftDate}>
                {formatDate(memory?.created_at)}
              </CustomText>

            </View>
          </View>


        </Animated.View>
        </LinearGradient>
        
        {/* 🎨 NEW: Active Effect Layer (z-index: 30) */}
        {memory?.active_effect && memory?.active_effect !== 'none' && (
          <View 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 30,
            }}
            pointerEvents="none"
          >
            <GiftActiveEffect 
              type={memory?.active_effect}
              isActive={isOpen}
            />
          </View>
        )}
        
        
        {/* Loading Indicator (while image loads) */}
        {false && (
          <View style={styles.loadingOverlay}>
            <CustomText style={styles.loadingText}>
              {t('common.loading') || '불러오는 중'}...
            </CustomText>
          </View>
        )}
      </View>
          }
          back={
            /* 🔮 Tarot Card Back Side (3 cards + interpretation) */
            <View style={styles.imageContainer}>
              {/* Background Image (Same as front) */}
              <Image
                source={{ uri: displayImageUrl }}
                style={[styles.giftImage, { opacity: 0.3 }]}
                resizeMode="cover"
              />
              
              {/* Dark Overlay */}
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 10 }]} />
              
              {/* Tarot Cards Row (3 cards) */}
              <View style={styles.tarotBackContainer}>
                {/* 🔮 Back to Front Button (상단 우측) */}
                <TouchableOpacity
                  style={styles.tarotFlipChipBack}
                  onPress={() => {
                    HapticService.light();
                    setIsFlipped(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name="arrow-back-outline" size={scale(18)} color="#FFFFFF" />
                  <CustomText style={styles.tarotFlipText}>
                    앞면
                  </CustomText>
                </TouchableOpacity>
                
                <View style={styles.tarotCardsRow}>
                  {tarotCardInfo.map((card, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.tarotCardSmall,
                        selectedCardIndex === index && styles.tarotCardSelected,
                      ]}
                      onPress={() => {
                        HapticService.light();
                        setSelectedCardIndex(index);
                      }}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={TAROT_IMAGES[card?.image]}
                        style={styles.tarotCardImage}
                        resizeMode="contain"
                      />
                      <View style={styles.tarotCardLabelContainer}>
                        <CustomText style={styles.tarotCardLabel}>
                          {['과거', '현재', '미래'][index]}
                        </CustomText>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* 🔮 Priority Reason (타로점을 본 목적) */}
                {memory?.priority_reason && (
                  <View style={styles.tarotPriorityReasonBox}>
                    <View style={styles.tarotPriorityHeader}>
                      <Icon name="help-circle-outline" size={scale(20)} color="#FFD700" />
                      <CustomText style={styles.tarotPriorityTitle}>
                        궁금했던 점
                      </CustomText>
                    </View>
                    <CustomText style={styles.tarotPriorityText}>
                      {memory.priority_reason}
                    </CustomText>
                  </View>
                )}
                
                {/* Selected Card Interpretation */}
                {tarotCardDesc[selectedCardIndex] && (
                  <View style={styles.tarotInterpretationBox}>
                    <CustomText style={styles.tarotCardTitle}>
                      {tarotCardInfo[selectedCardIndex]?.name_ko}
                    </CustomText>
                    <CustomText style={styles.tarotCardSubtitle}>
                      {tarotCardInfo[selectedCardIndex]?.name_en}
                      {tarotCardInfo[selectedCardIndex]?.is_reversed && ' (역방향)'}
                    </CustomText>
                    
                    {/* 🔮 카드 기본 의미 (Upright/Reversed) */}
                    {tarotCardInfo[selectedCardIndex] && (
                      <>
                        <View style={styles.tarotInterpretationDivider} />
                        <View style={styles.tarotCardMeaningSection}>
                          <CustomText style={styles.tarotCardMeaningLabel}>
                            📖 카드 의미
                          </CustomText>
                          <CustomText style={styles.tarotCardMeaningText}>
                            {tarotCardInfo[selectedCardIndex].is_reversed
                              ? tarotCardInfo[selectedCardIndex].reversed_meaning
                              : tarotCardInfo[selectedCardIndex].upright_meaning}
                          </CustomText>
                        </View>
                      </>
                    )}
                    
                    <View style={styles.tarotInterpretationDivider} />
                    
                    {/* 🔮 SAGE의 해석 */}
                    <View style={styles.tarotSageInterpretationSection}>
                      <CustomText style={styles.tarotSageInterpretationLabel}>
                        🔮 SAGE의 해석
                      </CustomText>
                      <CustomText style={styles.tarotInterpretationText}>
                        {tarotCardDesc[selectedCardIndex]?.meaning}
                      </CustomText>
                    </View>
                  </View>
                )}
              </View>
            </View>
          }
        />
      ) : (
        /* 기존 로직: Normal Gift (Emotion/Music) */
        <View style={styles.imageContainer}>
        
        {isMusicGift ? (
          <>
          {hasVideo ? (
            <Video
              key={memory?.gift_id} // ⭐ Force remount when videoKey changes
              ref={videoRef}
              source={{ uri: memory?.persona_video_url }}
              style={styles.video}
              resizeMode="contain"
              repeat
              muted
              paused={!isOpen || !isVideoPlaying}
              onError={()=>{ console.log('video error'); }}
              onLoad={()=>{ setIsVideoPlaying(true); }}
              playInBackground={false}
              playWhenInactive={false}
            />
          ) : (
            <>
            <Image
              source={{ uri: displayImageUrl }}
              style={styles.giftImage}
              resizeMode="cover"
              onLoad={() => {
                setImageLoaded(true);
                HapticService.light();
              }}
            />
          </>
          )}
        </>
        ):(
        <>
          <Image
              source={{ uri: displayImageUrl }}
              style={styles.giftImage}
              resizeMode="cover"
              onLoad={() => {
                setImageLoaded(true);
                HapticService.light();
              }}
            />
        </>
        )}
          
        {/* ⭐ NEW: Top Music Player (Glassmorphic) - Only for music gifts */}
        {isMusicGift && memory?.music_url && isOpen && (
          <View style={styles.topMusicPlayer}>
            {/* Glassmorphic Background */}
            <View style={styles.musicPlayerGlass}>
              {Platform.OS === 'ios' ? (
                <BlurView
                  style={StyleSheet.absoluteFill}
                  blurType="dark"
                  blurAmount={15}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
              )}
              
              {/* Gradient Overlay */}
              <LinearGradient
                colors={['rgba(168, 237, 234, 0.15)', 'rgba(254, 214, 227, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              
              {/* ⭐ Music Player Content */}
              <View style={styles.musicPlayerWrapper}>
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    🎵 Fixed Header (항상 고정 - 변화 없음)
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <View style={styles.musicPlayerHeader}>
                  {/* Play/Pause Button */}
                  <TouchableOpacity
                    onPress={togglePlayPause}
                    style={styles.musicPlayButtonSmall}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={isPlaying ? 'pause-circle' : 'play-circle'}
                      size={scale(28)}
                      color="rgba(255, 255, 255, 0.95)"
                    />
                  </TouchableOpacity>
                  
                  {/* Title */}
                  <View style={styles.musicTitleCollapsed}>
                    <CustomText style={styles.musicTitleTextCollapsed} numberOfLines={1}>
                      {memory?.music_title || '음악'}
                    </CustomText>
                  </View>
                  
                  {/* Expand/Collapse Button */}
                  <TouchableOpacity
                    onPress={() => {
                      HapticService.light();
                      setShowControls(!showControls);
                    }}
                    style={styles.expandButton}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={showControls ? 'chevron-up-outline' : 'chevron-down-outline'}
                      size={scale(20)}
                      color="rgba(255, 255, 255, 0.8)"
                    />
                  </TouchableOpacity>
                </View>
                
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    🎵 Expandable Controls (확대 시 나타남)
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {showControls && (
                  <View style={styles.musicPlayerExpandedControls}>
                    {/* Divider */}
                    <View style={styles.controlsDivider} />
                    
                    {/* Progress & Time */}
                    <View style={styles.musicProgressContainer}>
                      <View style={styles.progressRow}>
                        <CustomText style={styles.musicTimeText}>{formatTime(currentTime)}</CustomText>
                        <Slider
                          style={styles.musicProgressBar}
                          value={currentTime}
                          minimumValue={0}
                          maximumValue={duration || 1}
                          onValueChange={setCurrentTime}
                          onSlidingComplete={handleSeek}
                          minimumTrackTintColor="rgba(168, 237, 234, 0.9)"
                          maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                          thumbTintColor="rgba(255, 255, 255, 0.95)"
                        />
                        <CustomText style={styles.musicTimeText}>{formatTime(duration)}</CustomText>
                      </View>
                    </View>
                    
                    {/* Volume Control */}
                    <View style={styles.musicVolumeContainer}>
                      <Icon 
                        name={volume === 0 ? 'volume-mute' : volume < 0.5 ? 'volume-low' : 'volume-high'} 
                        size={scale(20)} 
                        color="rgba(255, 255, 255, 0.8)" 
                      />
                      <Slider
                        style={styles.musicVolumeSlider}
                        value={volume}
                        minimumValue={0}
                        maximumValue={1}
                        onValueChange={handleVolumeChange}
                        minimumTrackTintColor="rgba(168, 237, 234, 0.9)"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                        thumbTintColor="rgba(255, 255, 255, 0.95)"
                      />
                      <CustomText style={styles.musicVolumeText}>{Math.round(volume * 100)}%</CustomText>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
        
        {/* 🎨 NEW: Background Effect Layer (z-index: 10) */}
        {memory?.background_effect && memory?.background_effect !== 'none' && false && (
          <View 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            }}
            pointerEvents="none"
          >
            <GiftBackgroundEffect 
              type={memory?.background_effect}
              isActive={isOpen} 
            />
          </View>
        )}
        
        {/* Bottom Gradient Overlay (z-index: 20) */}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0)',
            'rgba(0, 0, 0, 0.3)',
            'rgba(0, 0, 0, 0.7)',
            'rgba(0, 0, 0, 0.9)',
          ]}
          locations={[0, 0.4, 0.7, 1]}
          style={styles.gradientOverlay}
        >
        {/* Animated Message Overlay (z-index: 40) */}
        <Animated.View style={[styles.messageOverlay, animatedMessageStyle]}>
          {/* Gift Type Indicator */}
          <View style={styles.emotionTag}>
            <CustomText style={styles.emotionEmoji}>
              {isMusicGift ? '🎵' : memory?.action_type === 'tarot' ? '🔮' : emotionEmoji}
            </CustomText>
            <CustomText style={styles.emotionText}>
              {isMusicGift ? (memory?.music_title || '음악') : memory?.action_type === 'tarot' ? '타로 리딩' : emotionLabel}
            </CustomText>
          </View>
          
          {/* 🔮 NEW: Tarot Flip Chipset (상단 우측) */}
          {memory?.action_type === 'tarot' && (
            <TouchableOpacity
              style={styles.tarotFlipChip}
              onPress={() => {
                HapticService.light();
                setIsFlipped(!isFlipped);
              }}
              activeOpacity={0.8}
            >
              <Icon name="layers-outline" size={scale(18)} color="#FFFFFF" />
              <CustomText style={styles.tarotFlipText}>
                {isFlipped ? '앞면' : '카드 보기'}
              </CustomText>
            </TouchableOpacity>
          )}
          
          {/* AI Message */}
          <CustomText style={styles.giftMessage}>
            {memory?.ai_message}
          </CustomText>
          
          <View style={styles.infoContainer}>
            
            <Image
              source={{ uri: 
                memory?.action_type === 'emotion' ? 
                memory?.persona_url : 
                memory?.action_type === 'confession' ? 'https://babi-cdn.logbrix.ai/babi/real/babi/9be066da-1a9b-408b-b4d8-bf600923a3cd_00001_.png' : 
                'https://babi-cdn.logbrix.ai/babi/real/babi/e832b7d9-4ff2-41f1-8c5f-0b08b055fe9d_00001_.png' }}
              style={styles.personaImage}
              resizeMode="cover"
            />
            <View style={styles.personaNameContainer}>
              
              {/* Persona Name */}
              {memory?.persona_name && (
                <CustomText style={styles.personaName}>
                  - {memory.action_type === 'emotion' ? memory.persona_name : memory.action_type === 'confession' ? 'NEXUS' : 'SAGE'}
                </CustomText>
              )}
              
              {/* Date */}
              <CustomText style={styles.giftDate}>
                {formatDate(memory?.created_at)}
              </CustomText>

            </View>
          </View>


        </Animated.View>
        </LinearGradient>
        
        {/* 🎨 NEW: Active Effect Layer (z-index: 30) */}
        {memory?.active_effect && memory?.active_effect !== 'none' && (
          <View 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 30,
            }}
            pointerEvents="none"
          >
            <GiftActiveEffect 
              type={memory?.active_effect}
              isActive={isOpen}
            />
          </View>
        )}
        
        
        {/* Loading Indicator (while image loads) */}
        {false && (
          <View style={styles.loadingOverlay}>
            <CustomText style={styles.loadingText}>
              {t('common.loading') || '불러오는 중'}...
            </CustomText>
          </View>
        )}
      </View>
      )}
    </CustomBottomSheet>
  );
});

/**
 * Format date helper
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Content Container
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  contentContainer: {
    paddingHorizontal: 0, // Remove default padding
    paddingTop: 0,
    paddingBottom: 0,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Image Container (Full Screen)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  imageContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.68, // 65% of screen height
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  
  giftImage: {
    width: '100%',
    height: '100%',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Gradient Overlay (Bottom)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%', // Cover bottom half
    zIndex: 20, // 🎨 Above BackgroundEffect (10), below ActiveEffect (30)
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Message Overlay (Animated)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  messageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(24),
    gap: verticalScale(12),
    zIndex: 40, // 🎨 Above all effect layers (10, 20, 30)
  },
  
  // Emotion Tag
  emotionTag: {

    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    gap: scale(6),
    backdropFilter: 'blur(10px)', // iOS blur effect
  },
  
  emotionEmoji: {
    fontSize: moderateScale(18),
  },
  
  emotionText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  
  // AI Message
  giftMessage: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(26),
    color: '#FFFFFF',
    fontWeight: '500',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,

  },
  
  // Persona Name
  personaName: {
    fontSize: moderateScale(18),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    fontStyle: 'italic',
    marginTop: verticalScale(4),
  },
  
  // Date
  giftDate: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
    marginTop: verticalScale(0),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎵 NEW: Top Music Player (Glassmorphic)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  topMusicPlayer: {
    position: 'absolute',
    top: verticalScale(16),
    left: scale(16),
    right: scale(16),
    zIndex: 50, // Above all other elements
  },
  
  musicPlayerGlass: {
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Fallback
  },
  
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎵 Music Player Wrapper (Container)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  musicPlayerWrapper: {
    // No extra styles needed (just a container)
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎵 Fixed Header (항상 고정 - 변화 없음)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  musicPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    gap: scale(10),
  },
  
  musicPlayButtonSmall: {
    // No extra styles needed
  },
  
  musicTitleCollapsed: {
    flex: 1,
  },
  
  musicTitleTextCollapsed: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  
  expandButton: {
    padding: scale(4),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎵 Expandable Controls (확대 시 나타남)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  musicPlayerExpandedControls: {
    paddingHorizontal: scale(12),
    paddingBottom: verticalScale(12),
    gap: verticalScale(12),
  },
  
  controlsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: scale(4),
  },
  
  musicProgressContainer: {
    gap: verticalScale(8),
  },
  
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  
  musicProgressBar: {
    flex: 1,
    height: scale(30),
  },
  
  musicTimeText: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    minWidth: scale(40),
    textAlign: 'center',
  },
  
  musicVolumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  
  musicVolumeSlider: {
    flex: 1,
    height: scale(30),
  },
  
  musicVolumeText: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    minWidth: scale(40),
    textAlign: 'right',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Loading Overlay
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Footer Buttons
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  shareButton: {
    // Inherited from CustomButton
  },
  
  closeButton: {
    // ⭐ Changed from deleteButton (소중한 교감 선물은 삭제 버튼 대신 닫기)
    // Inherited from CustomButton
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Empty State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(100),
  },
  
  emptyText: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  infoContainer: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    gap: verticalScale(10),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  personaNameContainer: {
    width: '100%',
    flex: 1,
    gap: verticalScale(10),
    marginLeft: scale(10),
  },
  personaImage: {
    width: scale(60),
    height: scale(60),
    borderRadius: moderateScale(20),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔮 NEW: Tarot Gift Styles
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tarotFlipChip: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.85)', // 보라색 (타로 테마)
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(24),
    gap: scale(6),
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  
  tarotFlipChipBack: {
    position: 'absolute',
    top: verticalScale(20), // ⭐ tarotBackContainer padding 고려
    right: scale(20), // ⭐ tarotBackContainer padding 고려
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 237, 234, 0.9)', // 청록색 (뒷면은 다른 색상)
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(24),
    gap: scale(6),
    shadowColor: '#A8EDEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100, // ⭐ 최상위
  },
  
  tarotFlipText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  
  tarotBackContainer: {
    position: 'absolute', // ⭐ absolute positioning
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: scale(20),
    paddingTop: verticalScale(40),
    justifyContent: 'space-between',
    zIndex: 20, // ⭐ Above dark overlay (10)
  },
  
  tarotCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: scale(12),
    marginBottom: verticalScale(20),
  },
  
  tarotCardSmall: {
    flex: 1,
    aspectRatio: 0.6,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  tarotCardSelected: {
    borderColor: '#A8EDEA',
    borderWidth: 3,
    shadowColor: '#A8EDEA',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  
  tarotCardImage: {
    width: '100%',
    height: '100%',
  },
  
  tarotCardLabelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: verticalScale(4),
    alignItems: 'center',
  },
  
  tarotCardLabel: {
    fontSize: moderateScale(12),
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  tarotPriorityReasonBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)', // 골드 배경
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  
  tarotPriorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(8),
  },
  
  tarotPriorityTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  
  tarotPriorityText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  
  tarotInterpretationBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: moderateScale(16),
    padding: scale(20),
    gap: verticalScale(10),
    borderWidth: 1,
    borderColor: 'rgba(168, 237, 234, 0.3)',
    maxHeight: verticalScale(300),
  },
  
  tarotCardTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  tarotCardSubtitle: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  tarotInterpretationDivider: {
    height: 1,
    backgroundColor: 'rgba(168, 237, 234, 0.3)',
    marginVertical: verticalScale(4),
  },
  
  tarotInterpretationText: {
    fontSize: moderateScale(15),
    lineHeight: moderateScale(24),
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '400',
  },
  
  tarotCardMeaningSection: {
    marginTop: verticalScale(8),
  },
  
  tarotCardMeaningLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: 'rgba(168, 237, 234, 0.9)',
    marginBottom: verticalScale(6),
    letterSpacing: 0.3,
  },
  
  tarotCardMeaningText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  
  tarotSageInterpretationSection: {
    marginTop: verticalScale(8),
  },
  
  tarotSageInterpretationLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: 'rgba(138, 43, 226, 0.9)',
    marginBottom: verticalScale(6),
    letterSpacing: 0.3,
  },
});


export default MemoryPlayerSheet;
