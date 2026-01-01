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

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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
import Video from 'react-native-video'; // ⭐ NEW: For music playback
import Slider from '@react-native-community/slider'; // ⭐ NEW: For progress bar
import Icon from 'react-native-vector-icons/Ionicons';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import GiftBackgroundEffect from '../particle/GiftBackgroundEffect'; // 🎨 NEW: Visual effects Layer 1
import GiftActiveEffect from '../particle/GiftActiveEffect'; // 🎨 NEW: Visual effects Layer 2
import { useTheme } from '../../contexts/ThemeContext';
import { useAnima } from '../../contexts/AnimaContext';
import HapticService from '../../utils/HapticService';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
const MemoryPlayerSheet = forwardRef(({ memory, onMemoryUpdate, onClose }, ref) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { showAlert, showToast } = useAnima();
  
  // Refs
  const bottomSheetRef = useRef(null);
  const videoRef = useRef(null); // ⭐ NEW: For music playback
  
  // State
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // ⭐ NEW: Music playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  
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
    if (imageLoaded) {
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
  }, [imageLoaded]);
  
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
  // 🎵 Music playback handlers
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const togglePlayPause = () => {
    HapticService.light();
    setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.seek(value);
      setCurrentTime(value);
    }
  };
  
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle close
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleClose = () => {
    HapticService.light();
    
    // Stop music if playing
    if (isPlaying) {
      setIsPlaying(false);
    }
    
    bottomSheetRef.current?.dismiss();
    
    // Reset animation values
    messageOpacity.value = 0;
    messageScale.value = 0.95;
    messageTranslateX.value = 100;
    setImageLoaded(false);
    
    // Reset music state
    setCurrentTime(0);
    setDuration(0);
    
    onClose?.();
  };
  
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
      {/* Full-Screen Gift Image (or Persona Image for Music) */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: displayImageUrl }}
          style={styles.giftImage}
          resizeMode="cover"
          onLoad={() => {
            setImageLoaded(true);
            HapticService.light();
          }}
        />
        
        {/* ⭐ NEW: Hidden audio player for music gifts */}
        {isMusicGift && memory?.music_url && (
          <Video
            ref={videoRef}
            source={{ uri: memory?.music_url }}
            audioOnly={true}
            paused={!isPlaying}
            onLoad={(data) => {
              setDuration(data.duration);
              setMusicLoading(false);
              setImageLoaded(true); // Trigger animation
              HapticService.light();
            }}
            onProgress={(data) => {
              if (!isSeeking) {
                setCurrentTime(data.currentTime);
              }
            }}
            onEnd={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            style={{ height: 0, width: 0 }} // Hidden
          />
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
              isActive={imageLoaded} 
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
        />
        
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
              isActive={imageLoaded}
            />
          </View>
        )}
        
        {/* Animated Message Overlay (z-index: 40) */}
        <Animated.View style={[styles.messageOverlay, animatedMessageStyle]}>
          {/* Gift Type Indicator */}
          <View style={styles.emotionTag}>
            <CustomText style={styles.emotionEmoji}>
              {isMusicGift ? '🎵' : emotionEmoji}
            </CustomText>
            <CustomText style={styles.emotionText}>
              {isMusicGift ? (memory?.music_title || '음악') : emotionLabel}
            </CustomText>
          </View>
          
          {/* ⭐ NEW: Music Player Controls (only for music gifts) */}
          {isMusicGift && memory?.music_url && (
            <View style={styles.musicControls}>
              {/* Play/Pause Button */}
              <TouchableOpacity
                onPress={togglePlayPause}
                style={styles.playButton}
                activeOpacity={0.8}
              >
                <Icon
                  name={isPlaying ? 'pause-circle' : 'play-circle'}
                  size={scale(56)}
                  color="rgba(255, 255, 255, 0.95)"
                />
              </TouchableOpacity>
              
              {/* Progress Bar & Time */}
              <View style={styles.progressContainer}>
                <CustomText style={styles.timeText}>{formatTime(currentTime)}</CustomText>
                <Slider
                  style={styles.progressBar}
                  value={currentTime}
                  minimumValue={0}
                  maximumValue={duration || 0}
                  onValueChange={(value) => {
                    setIsSeeking(true);
                    setCurrentTime(value);
                  }}
                  onSlidingComplete={(value) => {
                    setIsSeeking(false);
                    handleSeek(value);
                  }}
                  minimumTrackTintColor="rgba(255, 255, 255, 0.9)"
                  maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                  thumbTintColor="rgba(255, 255, 255, 0.95)"
                />
                <CustomText style={styles.timeText}>{formatTime(duration)}</CustomText>
              </View>
            </View>
          )}
          
          {/* AI Message */}
          <CustomText style={styles.giftMessage}>
            {memory?.ai_message}
          </CustomText>
          
          <View style={styles.infoContainer}>
            
            <Image
              source={{ uri: memory?.persona_url }}
              style={styles.personaImage}
              resizeMode="cover"
            />
            <View style={styles.personaNameContainer}>
              
              {/* Persona Name */}
              {memory?.persona_name && (
                <CustomText style={styles.personaName}>
                  - {memory.persona_name}
                </CustomText>
              )}
              
              {/* Date */}
              <CustomText style={styles.giftDate}>
                {formatDate(memory?.created_at)}
              </CustomText>

            </View>
          </View>


        </Animated.View>
        
        {/* Loading Indicator (while image loads) */}
        {!imageLoaded && (
          <View style={styles.loadingOverlay}>
            <CustomText style={styles.loadingText}>
              {t('common.loading') || '불러오는 중'}...
            </CustomText>
          </View>
        )}
      </View>
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
    height: '50%', // Cover bottom half
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
    fontSize: moderateScale(17),
    lineHeight: moderateScale(26),
    color: '#FFFFFF',
    fontWeight: '500',
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
  // 🎵 NEW: Music Player Controls
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  musicControls: {
    width: '100%',
    alignItems: 'center',
    gap: verticalScale(12),
    marginVertical: verticalScale(12),
  },
  
  playButton: {
    width: scale(64),
    height: scale(64),
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  
  progressBar: {
    flex: 1,
    height: scale(40),
  },
  
  timeText: {
    fontSize: moderateScale(12),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    minWidth: scale(40),
    textAlign: 'center',
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
});


export default MemoryPlayerSheet;
