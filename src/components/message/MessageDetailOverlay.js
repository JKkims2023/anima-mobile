/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 MessageDetailOverlay - Full Screen Overlay for Message Viewing
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Full-screen overlay with fade-in animation
 * - Covers entire screen including tab bar (z-index: 9999)
 * - Replaces Stack Navigation (MessageDetailScreen)
 * - Based on MessageCreationOverlay architecture
 * 
 * Features:
 * - Sequential animations (Background → Gradient → Content → Chips)
 * - Persona background (Image/Video)
 * - 14 text animations (fade_in, typing, scale_in, slide_cross, breath, etc.)
 * - Particle effects (including floating_words, scrolling_words with customWords)
 * - Background music playback
 * - Quick Action Chips (Comment, Favorite, Share, Delete)
 * - 180° Flip Card (Message ⟷ Reply List)
 * - Android back button support
 * 
 * Design Pattern:
 * - Overlay architecture (same as MessageCreationOverlay)
 * - State-based visibility control
 * - Real-time sync with HistoryScreen (onMessageUpdate callback)
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-09
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Platform,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';

// ═══════════════════════════════════════════════════════════════════════════
// Contexts & Services
// ═══════════════════════════════════════════════════════════════════════════
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useAnima } from '../../contexts/AnimaContext';
import { scale, verticalScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import messageService from '../../services/api/messageService';

// ═══════════════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════════════
import CustomText from '../CustomText';
import PersonaBackgroundView from './PersonaBackgroundView';
import ParticleEffect from '../particle/ParticleEffect';
import MessageHistoryChips from './MessageHistoryChips';
import FlipCard from './FlipCard';
import ReplyListView from './ReplyListView';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../styles/commonstyles';

/**
 * MessageDetailOverlay Component
 * 
 * @param {boolean} visible - Overlay visibility (controlled by parent)
 * @param {object} message - Complete message object from HistoryScreen
 * @param {function} onClose - Callback when overlay should close
 * @param {function} onMessageUpdate - Callback when message is updated (favorite, delete)
 */
const MessageDetailOverlay = ({ visible, message, onClose, onMessageUpdate }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { showAlert, showToast } = useAnima();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // ═══════════════════════════════════════════════════════════════════════════
  // Refs
  // ═══════════════════════════════════════════════════════════════════════════
  const musicPlayerRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // State Management
  // ═══════════════════════════════════════════════════════════════════════════
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false); // ⭐ 180° flip for comment view

  // ═══════════════════════════════════════════════════════════════════════════
  // Extract message data
  // ═══════════════════════════════════════════════════════════════════════════
  const {
    message_title = '',
    message_content = '',
    persona_key,
    persona_name = 'Unknown',
    persona_image_url,
    persona_video_url,
    convert_yn = 'N',
    text_animation = 'fade_in',
    particle_effect = 'none',
    bg_music = 'none',
    bg_music_url = null,
    effect_config = null,
  } = message || {};

  // ⭐ Extract customWords from effect_config
  const customWords = effect_config?.custom_words || [];

  // ⭐ Create persona object for PersonaBackgroundView
  const persona = {
    persona_key,
    persona_name,
    selected_dress_image_url: persona_image_url,
    selected_dress_video_url: persona_video_url,
    selected_dress_video_convert_yn: convert_yn || 'N',
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Sequential Animation (악마의 디테일 🎨)
  // ═══════════════════════════════════════════════════════════════════════════
  const overlayOpacity = useSharedValue(0); // 전체 오버레이
  const gradientOpacity = useSharedValue(0); // 하단 그라디언트
  const contentTranslateX = useSharedValue(300); // 텍스트 영역 (우측에서 시작)
  const contentOpacity = useSharedValue(0); // 텍스트 영역 투명도
  const chip1TranslateY = useSharedValue(100); // 첫 번째 칩
  const chip2TranslateY = useSharedValue(100); // 두 번째 칩
  const chip3TranslateY = useSharedValue(100); // 세 번째 칩
  const chip4TranslateY = useSharedValue(100); // 네 번째 칩
  const chipsOpacity = useSharedValue(0); // 칩셋 전체 투명도

  // ⭐ Particle Effect Animation (별도 제어)
  const particleOpacity = useSharedValue(0); // 파티클 투명도

  useEffect(() => {
    if (visible) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✨ [MessageDetailOverlay] Starting sequential animation');
      console.log('   🎬 Timeline:');
      console.log('   0초: 📷 Background Fade In (300ms)');
      console.log('   1초: ⬆️ Gradient Fade In (800ms)');
      console.log('   1.8초: ➡️ Content Slide In (600ms)');
      console.log('   2.4초: 🎪 Chips Bounce In (순차)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // 📷 Step 0: Reset all values
      overlayOpacity.value = 0;
      gradientOpacity.value = 0;
      contentTranslateX.value = 300;
      contentOpacity.value = 0;
      chip1TranslateY.value = 100;
      chip2TranslateY.value = 100;
      chip3TranslateY.value = 100;
      chip4TranslateY.value = 100;
      chipsOpacity.value = 0;
      
      // 📷 Step 1: Background 부드럽게 표시 (300ms)
      overlayOpacity.value = withTiming(1, { 
        duration: 300, 
        easing: Easing.out(Easing.ease) 
      });
      
      // ⬆️ Step 2: Gradient Fade In (1초 후, 800ms 동안)
      gradientOpacity.value = withDelay(
        1000, 
        withTiming(1, { 
          duration: 800, 
          easing: Easing.out(Easing.ease) 
        })
      );
      
      // ➡️ Step 3: Content 슬라이드 인 (1.8초 후, 600ms 동안)
      contentTranslateX.value = withDelay(
        1800,
        withSpring(0, { 
          damping: 15, 
          stiffness: 100 
        })
      );
      contentOpacity.value = withDelay(
        1800,
        withTiming(1, { duration: 400 })
      );
      
      // 🎪 Step 4: Chips 순차적 바운스 (2.4초 후)
      const chipDelay = 2400;
      const chipInterval = 100; // 각 칩 사이 간격
      
      chipsOpacity.value = withDelay(chipDelay, withTiming(1, { duration: 200 }));
      
      chip1TranslateY.value = withDelay(
        chipDelay,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      
      chip2TranslateY.value = withDelay(
        chipDelay + chipInterval,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      
      chip3TranslateY.value = withDelay(
        chipDelay + chipInterval * 2,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      
      chip4TranslateY.value = withDelay(
        chipDelay + chipInterval * 3,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      
      // 🎨 Particle Effect: Gradient와 동시에 표시 (1초 후)
      particleOpacity.value = withDelay(
        1000,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
      );
      
    } else {
      console.log('🌙 [MessageDetailOverlay] Closing with fade-out (400ms)');
      overlayOpacity.value = withTiming(0, { 
        duration: 400,
        easing: Easing.in(Easing.ease) 
      });
      particleOpacity.value = withTiming(0, { duration: 400 });
    }
  }, [visible]);

  // Animated Styles
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const gradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: contentTranslateX.value }],
  }));

  const chipsContainerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chipsOpacity.value,
  }));

  const chip1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chip1TranslateY.value }],
  }));

  const chip2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chip2TranslateY.value }],
  }));

  const chip3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chip3TranslateY.value }],
  }));

  const chip4AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chip4TranslateY.value }],
  }));

  // ⭐ Particle Effect Animated Style
  const particleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // Text Animation Values & Logic (14 effects)
  // ═══════════════════════════════════════════════════════════════════════════
  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const typingIndexRef = useRef(0);
  const typingIntervalRef = useRef(null);
  const cursorIntervalRef = useRef(null);

  const textOpacity = useSharedValue(1);
  const textScale = useSharedValue(1);
  const textTranslateX = useSharedValue(0);
  const textTranslateY = useSharedValue(0);
  const textRotate = useSharedValue(0);

  // ⭐ Trigger Animation: 2초 후 효과 발생
  useEffect(() => {
    if (!message_content) return;

    console.log('[MessageDetailOverlay] 🎬 Text animation:', text_animation);

    // ⭐ Typing Animation (special case)
    if (text_animation === 'typing') {
      typingIndexRef.current = 0;
      setTypingText('');

      const typingTimeout = setTimeout(() => {
        typingIntervalRef.current = setInterval(() => {
          typingIndexRef.current += 1;
          if (typingIndexRef.current <= message_content.length) {
            setTypingText(message_content.substring(0, typingIndexRef.current));
          } else {
            clearInterval(typingIntervalRef.current);
          }
        }, 50);

        cursorIntervalRef.current = setInterval(() => {
          setShowCursor((prev) => !prev);
        }, 500);
      }, 2000);

      return () => {
        clearTimeout(typingTimeout);
        clearInterval(typingIntervalRef.current);
        clearInterval(cursorIntervalRef.current);
      };
    }

    // ⭐ Other Animations: Reset & Trigger after 2 seconds
    setTypingText(message_content);

    // Reset all values
    textOpacity.value = 1;
    textScale.value = 1;
    textTranslateX.value = 0;
    textTranslateY.value = 0;
    textRotate.value = 0;

    switch (text_animation) {
      case 'fade_in':
        textOpacity.value = 0;
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 800 }));
        break;

      case 'breath':
        textScale.value = withDelay(2000, 
          withSequence(
            withTiming(1.05, { duration: 1000 }),
            withTiming(0.95, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          )
        );
        break;

      case 'blur_focus':
        textOpacity.value = 0.3;
        textScale.value = 0.95;
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 1000 }));
        textScale.value = withDelay(2000, withTiming(1, { duration: 1000 }));
        break;

      case 'letter_drop':
        textTranslateY.value = -100;
        textOpacity.value = 0;
        textTranslateY.value = withDelay(2000, withSpring(0, { damping: 8 }));
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 400 }));
        break;

      case 'rotate_in':
        textRotate.value = 180;
        textOpacity.value = 0;
        textRotate.value = withDelay(2000, withSpring(0, { damping: 10 }));
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 600 }));
        break;

      case 'scale_in':
        textScale.value = 0;
        textScale.value = withDelay(2000, withSpring(1, { damping: 10 }));
        break;

      case 'split':
        textScale.value = 0;
        textTranslateX.value = withDelay(2000,
          withSequence(
            withTiming(-50, { duration: 300 }),
            withTiming(0, { duration: 300 })
          )
        );
        textScale.value = withDelay(2000, withSpring(1, { damping: 8 }));
        break;

      case 'glow_pulse':
        textScale.value = withDelay(2000,
          withSequence(
            withTiming(1.2, { duration: 400 }),
            withTiming(1, { duration: 400 })
          )
        );
        textOpacity.value = withDelay(2000,
          withSequence(
            withTiming(0.7, { duration: 400 }),
            withTiming(1, { duration: 400 })
          )
        );
        break;

      case 'slide_cross':
        textTranslateX.value = -300;
        textTranslateX.value = withDelay(2000, withSpring(0, { damping: 12 }));
        break;

      case 'wave':
        textTranslateY.value = withDelay(2000,
          withSequence(
            withTiming(-10, { duration: 200 }),
            withTiming(10, { duration: 200 }),
            withTiming(-10, { duration: 200 }),
            withTiming(0, { duration: 200 })
          )
        );
        break;

      case 'stagger':
        textTranslateX.value = -50;
        textOpacity.value = 0;
        textTranslateX.value = withDelay(2000, withSpring(0, { damping: 15 }));
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 600 }));
        break;

      case 'flip':
        textRotate.value = 90;
        textOpacity.value = 0;
        textRotate.value = withDelay(2000, withSpring(0, { damping: 12 }));
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 300 }));
        break;

      case 'rainbow':
        textScale.value = withDelay(2000,
          withSequence(
            withTiming(1.1, { duration: 300 }),
            withTiming(0.9, { duration: 300 }),
            withTiming(1, { duration: 300 })
          )
        );
        break;

      default:
        textOpacity.value = 0;
        textOpacity.value = withDelay(2000, withTiming(1, { duration: 800 }));
        break;
    }
  }, [text_animation, message_content]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: text_animation === 'typing' ? 1 : textOpacity.value,
    transform: [
      { scale: textScale.value },
      { translateX: textTranslateX.value },
      { translateY: textTranslateY.value },
      { rotate: `${textRotate.value}deg` },
    ],
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // Auto-play music on mount
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (bg_music_url && bg_music_url !== 'none' && visible) {
      setIsMusicPlaying(true);
    }

    return () => {
      // Stop music on unmount
      setIsMusicPlaying(false);
    };
  }, [bg_music_url, visible]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Android Back Button Handler (with flip support)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('[MessageDetailOverlay] Android back button pressed');
      
      // 1️⃣ If flipped (showing reply view), go back to message view
      if (isFlipped) {
        console.log('[MessageDetailOverlay] Flipped → Un-flipping');
        HapticService.light();
        setIsFlipped(false);
        return true; // Prevent default behavior (closing screen)
      }
      
      // 2️⃣ Otherwise, close the overlay
      console.log('[MessageDetailOverlay] Closing overlay');
      HapticService.medium();
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, isFlipped, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Quick Action Chips
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Handle back button
  const handleBack = () => {
    HapticService.light();
    
    // If flipped (showing reply view), go back to message view
    if (isFlipped) {
      setIsFlipped(false);
      return;
    }
    
    // Otherwise, close the overlay
    onClose();
  };

  // Handle comment press (180° flip)
  const handleCommentPress = () => {
    HapticService.light();
    setIsFlipped(!isFlipped);
  };

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    if (!message) return;

    const newFavoriteYn = message.favorite_yn === 'Y' ? 'N' : 'Y';

    try {
      const result = await messageService.toggleFavorite(message.message_key, user?.user_key, newFavoriteYn);

      if (result.success) {
        // ⭐ Notify parent screen (real-time sync)
        const updatedMessage = { ...message, favorite_yn: newFavoriteYn };
        onMessageUpdate?.(updatedMessage, 'favorite');

        // Toast notification
        showToast({
          type: 'success',
          message: newFavoriteYn === 'Y' 
            ? t('message.history.favorite_added')
            : t('message.history.favorite_removed'),
          emoji: newFavoriteYn === 'Y' ? '❤️' : '🤍',
        });
      }
    } catch (error) {
      console.error('[MessageDetailOverlay] Favorite toggle error:', error);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!message) return;

    showAlert({
      title: t('message.history.delete'),
      message: t('message.history.delete_confirm_message'),
      emoji: '🗑️',
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: t('message.history.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await messageService.deleteMessage(message.message_key, user?.user_key);

              if (result.success) {
                // ⭐ Notify parent screen (real-time sync)
                onMessageUpdate?.(message, 'delete');

                showToast({
                  type: 'success',
                  message: t('message.history.delete_success'),
                  emoji: '✅',
                });

                // Close overlay after deletion
                onClose();
              }
            } catch (error) {
              console.error('[MessageDetailOverlay] Delete error:', error);
            }
          },
        },
      ],
    });
  };

  // Handle music toggle
  const handleMusicToggle = () => {
    HapticService.light();
    setIsMusicPlaying(!isMusicPlaying);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render: Don't render if not visible
  // ═══════════════════════════════════════════════════════════════════════════
  if (!visible || !message) return null;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Front View (Message)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderFront = () => (
    <>
      {/* Background: Persona Image/Video */}
      <PersonaBackgroundView
        persona={persona}
        isScreenFocused={!isFlipped}
        opacity={1}
        videoKey={message?.message_key}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Particle Effect (독립적 애니메이션) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {particle_effect && particle_effect !== 'none' && (
        <Animated.View 
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
            },
            particleAnimatedStyle
          ]}
          pointerEvents="none"
        >
          <ParticleEffect 
            type={particle_effect} 
            isActive={!isFlipped} // ⭐ 플립 시 비활성화
            customWords={customWords} // ⭐ Pass custom words for floating_words and scrolling_words
          />
        </Animated.View>
      )}

      {/* ⭐ Gradient Overlay with Sequential Animation */}
      <Animated.View style={[
        { 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        gradientAnimatedStyle
      ]}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        >
          {/* ⭐ Content with Slide Animation */}
          <Animated.View style={[
            styles.contentContainer, 
            contentAnimatedStyle
          ]}>
            {/* Title */}
            {message_title ? (
              <Animated.View style={animatedTextStyle}>
                <CustomText type="big" bold style={styles.title}>
                  {message_title}
                </CustomText>
              </Animated.View>
            ) : null}

            {/* Content */}
            {message_content ? (
              <Animated.View style={animatedTextStyle}>
                <CustomText type="middle" style={styles.content}>
                  {text_animation === 'typing' ? (
                    <>
                      {typingText}
                      {showCursor && <CustomText style={styles.cursor}>▌</CustomText>}
                    </>
                  ) : (
                    message_content
                  )}
                </CustomText>
              </Animated.View>
            ) : null}
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Back View (Replies)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderBack = () => (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ReplyListView
        messageKey={message.message_key}
        userKey={user?.user_key}
        onClose={handleCommentPress}
      />
    </View>
  );

  return (
    <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
      {/* FlipCard: Front (Message) / Back (Replies) */}
      <FlipCard
        isFlipped={isFlipped}
        front={renderFront()}
        back={renderBack()}
      />

      {/* Header (Back Button + Music Toggle) - Always visible */}
      <View style={[styles.header, { paddingTop: insets.top + verticalScale(10) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={scale(28)} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Music Toggle Button */}
        {bg_music_url && bg_music_url !== 'none' && !isFlipped && (
          <TouchableOpacity
            style={styles.musicButton}
            onPress={handleMusicToggle}
            activeOpacity={0.7}
          >
            <Icon 
              name={isMusicPlaying ? "volume-high" : "volume-mute"} 
              size={scale(24)} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Action Chips (우측 중앙) - Only visible when not flipped */}
      {!isFlipped && (
        <Animated.View style={[
          styles.chipsContainer,
          { top: insets.top + verticalScale(120) },
          chipsContainerAnimatedStyle
        ]}>
          <MessageHistoryChips
            message={message}
            onCommentPress={handleCommentPress}
            onFavoriteToggle={handleToggleFavorite}
            onDelete={handleDelete}
          />
        </Animated.View>
      )}

      {/* Background Music Player */}
      {bg_music_url && bg_music_url !== 'none' && (
        <Video
          ref={musicPlayerRef}
          source={{ uri: bg_music_url }}
          audioOnly
          repeat
          paused={!isMusicPlaying}
          volume={1.0}
          playInBackground={false}
          playWhenInactive={false}
          onError={(error) => {
            console.error('[MessageDetailOverlay] Music playback error:', error);
            setIsMusicPlaying(false);
          }}
        />
      )}
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // ⭐ 탭바 위에 완전히 덮음
    elevation: 999,
    backgroundColor: COLORS.BACKGROUND || '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(12),
    zIndex: 1000,
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    justifyContent: 'flex-end',
    marginTop: 'auto',
    height: 'auto',
  },
  contentContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(140), // ⭐ Chips 아래 공간 확보
  },
  title: {
    color: COLORS.TEXT_PRIMARY || '#FFFFFF',
    textAlign: 'left',
    marginBottom: verticalScale(12),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: scale(2) },
    textShadowRadius: scale(4),
  },
  content: {
    fontSize: scale(16),
    color: COLORS.TEXT_PRIMARY || '#FFFFFF',
    textAlign: 'left',
    lineHeight: scale(24),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: scale(1) },
    textShadowRadius: scale(3),
  },
  cursor: {
    color: '#FFFFFF',
  },
  chipsContainer: {
    position: 'absolute',
    right: 0,
    zIndex: 100,
    elevation: 100,
  },
});

export default MessageDetailOverlay;

