/**
 * 💌 MessagePreviewOverlay Component
 * 
 * Full-screen overlay for message preview with special effects
 * - Text animations (fade_in, typing, scale_in, slide_cross)
 * - Particle effects (confetti, hearts, snow, sparkles, comfort_light, hope_star, rain_soft, none)
 * - Background music (ai_generated, birthday, romantic, etc.)
 * - Quick Action Chips (right side)
 * 
 * Features:
 * - Persona background (video/image)
 * - Gradient overlay
 * - Real-time effect preview
 * - Effect selection via Quick Action Chips
 * - URL generation button
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import PersonaBackgroundView from './PersonaBackgroundView';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import ParticleEffect from '../particle/ParticleEffect';
import MusicSelectionOverlay from '../music/MusicSelectionOverlay';
import Video from 'react-native-video';
// CustomBottomSheet removed - use inline selection panel instead
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MessagePreviewOverlay = ({
  visible = false,
  persona,
  messageTitle,
  messageContent,
  // Effect configuration
  textAnimation = 'fade_in', // fade_in, typing, scale_in, slide_cross
  particleEffect = 'none', // confetti, hearts, snow, sparkles, comfort_light, hope_star, rain_soft, none
  bgMusic = 'none', // birthday, romantic, christmas, ai_generated, none, etc.
  bgMusicUrl = null,
  effectConfig = null,
  // Callbacks
  onClose,
  onGenerateURL,
  onChangeTextAnimation,
  onChangeParticleEffect,
  onChangeBgMusic,
  // State
  isCreating = false,
}) => {
  const { t } = useTranslation();
  const { currentTheme: theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Selection panel state
  const [showSelectionPanel, setShowSelectionPanel] = useState(false);
  const [selectionType, setSelectionType] = useState(null); // 'text' | 'particle' | 'music'
  const panelOpacity = useSharedValue(0);
  const panelTranslateY = useSharedValue(300);
  
  // Music selection overlay state
  const [showMusicOverlay, setShowMusicOverlay] = useState(false);
  const [selectedMusicData, setSelectedMusicData] = useState(null);
  
  // Music playback state (floating player)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const videoMusicRef = useRef(null);

  // Effect options
  const TEXT_ANIMATIONS = [
    { id: 'fade_in', label: t('effects.text.fade_in', 'Fade In'), icon: 'fade' },
    { id: 'typing', label: t('effects.text.typing', 'Typing'), icon: 'keyboard' },
    { id: 'scale_in', label: t('effects.text.scale_in', 'Scale In'), icon: 'arrow-expand' },
    { id: 'slide_cross', label: t('effects.text.slide_cross', 'Slide Cross'), icon: 'arrow-split-horizontal' },
  ];

  const PARTICLE_EFFECTS = [
    { id: 'none', label: t('effects.particle.none', 'None'), icon: 'close-circle-outline' },
    { id: 'confetti', label: t('effects.particle.confetti', 'Confetti'), icon: 'party-popper' },
    { id: 'hearts', label: t('effects.particle.hearts', 'Hearts'), icon: 'heart' },
    { id: 'snow', label: t('effects.particle.snow', 'Snow'), icon: 'snowflake' },
    { id: 'sparkles', label: t('effects.particle.sparkles', 'Sparkles'), icon: 'shimmer' },
    { id: 'comfort_light', label: t('effects.particle.comfort_light', 'Comfort'), icon: 'candle' },
    { id: 'hope_star', label: t('effects.particle.hope_star', 'Hope'), icon: 'star' },
    { id: 'rain_soft', label: t('effects.particle.rain_soft', 'Rain'), icon: 'weather-rainy' },
  ];

  const BG_MUSICS = [
    { id: 'none', label: t('effects.music.none', 'None'), icon: 'music-off' },
    { id: 'birthday', label: t('effects.music.birthday', 'Birthday'), icon: 'cake' },
    { id: 'romantic', label: t('effects.music.romantic', 'Romantic'), icon: 'heart' },
    { id: 'thank_you', label: t('effects.music.thank_you', 'Thank You'), icon: 'hand-heart' },
    { id: 'christmas', label: t('effects.music.christmas', 'Christmas'), icon: 'pine-tree' },
    { id: 'celebration', label: t('effects.music.celebration', 'Celebration'), icon: 'party-popper' },
    { id: 'cheer_up', label: t('effects.music.cheer_up', 'Cheer Up'), icon: 'emoticon-happy' },
    { id: 'comfort', label: t('effects.music.comfort', 'Comfort'), icon: 'peace' },
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // Text Animation State
  // ═══════════════════════════════════════════════════════════════════════
  
  // Overlay fade in (common for all animations)
  const overlayOpacity = useSharedValue(0);
  
  // fade_in animation
  const titleOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  
  // scale_in animation (바운스: 1.2 → 1.0)
  const titleScale = useSharedValue(1.2);
  const contentScale = useSharedValue(1.2);
  
  // slide_cross animation (화면 밖에서: -100, 100)
  const titleTranslateX = useSharedValue(-100);
  const contentTranslateX = useSharedValue(100);
  
  // typing animation
  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const animationFrameRef = useRef(null);
  const typingStartTimeRef = useRef(null);
  const TYPING_SPEED = 15; // 15ms per character (same as Web)

  // ═══════════════════════════════════════════════════════════════════════
  // Animation Logic (Split into two useEffects)
  // ═══════════════════════════════════════════════════════════════════════
  
  // 1️⃣ Modal visibility: Reset and start overlay animation
  useEffect(() => {
    if (!visible) return;
    
    console.log('[MessagePreviewOverlay] Modal opened, starting overlay animation...');
    
    // Reset overlay animation only
    overlayOpacity.value = 0;
    
    // Fade in overlay (500ms)
    overlayOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
  }, [visible]);
  
  // 2️⃣ Text animation: Reset text-related animations only
  useEffect(() => {
    if (!visible) return;
    
    console.log('[MessagePreviewOverlay] Starting text animation:', textAnimation);
    
    // Reset text animation values only
    titleOpacity.value = 0;
    contentOpacity.value = 0;
    titleScale.value = 1.2;
    contentScale.value = 1.2;
    titleTranslateX.value = -100;
    contentTranslateX.value = 100;
    setTypingText('');
    setShowCursor(false);
    
    // Start specific text animation
    setTimeout(() => {
      startTextAnimation();
    }, 100);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visible, textAnimation]);
  
  /**
   * Start text animation based on textAnimation prop
   */
  const startTextAnimation = useCallback(() => {
    switch (textAnimation) {
      case 'fade_in':
        startFadeInAnimation();
        break;
      case 'typing':
        startTypingAnimation();
        break;
      case 'scale_in':
        startScaleInAnimation();
        break;
      case 'slide_cross':
        startSlideCrossAnimation();
        break;
      default:
        startFadeInAnimation();
    }
  }, [textAnimation, messageTitle, messageContent]);
  
  /**
   * 1. fade_in: 부드럽게 나타남 (Web 동일)
   */
  const startFadeInAnimation = useCallback(() => {
    // Title fade in (delay 300ms, duration 500ms)
    titleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    
    // Content fade in (delay 500ms, duration 500ms)
    contentOpacity.value = withDelay(
      500,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);
  
  /**
   * 2. typing: 타이핑 효과 (Web 동일, 15ms/char)
   */
  const startTypingAnimation = useCallback(() => {
    // Title fade in first (same as fade_in)
    titleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    
    // Content is always visible for typing (opacity: 1)
    contentOpacity.value = 1;
    
    // Start typing effect after title (delay 800ms)
    setTimeout(() => {
      typingStartTimeRef.current = null;
      setShowCursor(true);
      
      const typeNextChar = (timestamp) => {
        if (!typingStartTimeRef.current) {
          typingStartTimeRef.current = timestamp;
        }
        
        const elapsed = timestamp - typingStartTimeRef.current;
        const targetIndex = Math.floor(elapsed / TYPING_SPEED);
        
        if (targetIndex < messageContent.length) {
          setTypingText(messageContent.substring(0, targetIndex + 1));
          animationFrameRef.current = requestAnimationFrame(typeNextChar);
        } else {
          setTypingText(messageContent);
          setShowCursor(false);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(typeNextChar);
    }, 800);
  }, [messageContent]);
  
  /**
   * 3. scale_in: 바운스 (1.2 → 1.0, Web 동일, duration 800ms)
   */
  const startScaleInAnimation = useCallback(() => {
    // Title: bounce effect (1.2 → 1.0)
    titleScale.value = withDelay(
      300,
      withTiming(1.0, {
        duration: 800,
        easing: Easing.out(Easing.back(1.5)), // Bounce effect
      })
    );
    titleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      })
    );
    
    // Content: bounce effect (1.2 → 1.0)
    contentScale.value = withDelay(
      700,
      withTiming(1.0, {
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
      })
    );
    contentOpacity.value = withDelay(
      700,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);
  
  /**
   * 4. slide_cross: 제목 좌→우, 내용 우→좌 (화면 밖에서, duration 700ms)
   */
  const startSlideCrossAnimation = useCallback(() => {
    // Title: slide from left edge (delay 300ms, duration 700ms)
    titleTranslateX.value = withDelay(
      300,
      withTiming(0, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      })
    );
    titleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.ease),
      })
    );
    
    // Content: slide from right edge (delay 700ms, duration 700ms)
    contentTranslateX.value = withDelay(
      700,
      withTiming(0, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      })
    );
    contentOpacity.value = withDelay(
      700,
      withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════
  // Animated Styles (애니메이션별로 조건부 적용)
  // ═══════════════════════════════════════════════════════════════════════
  
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  
  // Title: 애니메이션 타입에 따라 다른 스타일 적용
  const titleAnimatedStyle = useAnimatedStyle(() => {
    switch (textAnimation) {
      case 'fade_in':
      case 'typing':
        return {
          opacity: titleOpacity.value,
        };
      case 'scale_in':
        return {
          opacity: titleOpacity.value,
          transform: [{ scale: titleScale.value }],
        };
      case 'slide_cross':
        return {
          opacity: titleOpacity.value,
          transform: [{ translateX: titleTranslateX.value }],
        };
      default:
        return { opacity: titleOpacity.value };
    }
  });
  
  // Content: 애니메이션 타입에 따라 다른 스타일 적용
  const contentAnimatedStyle = useAnimatedStyle(() => {
    switch (textAnimation) {
      case 'fade_in':
        return {
          opacity: contentOpacity.value,
        };
      case 'typing':
        // typing은 opacity 애니메이션 없음 (타이핑 텍스트만)
        return {
          opacity: 1,
        };
      case 'scale_in':
        return {
          opacity: contentOpacity.value,
          transform: [{ scale: contentScale.value }],
        };
      case 'slide_cross':
        return {
          opacity: contentOpacity.value,
          transform: [{ translateX: contentTranslateX.value }],
        };
      default:
        return { opacity: contentOpacity.value };
    }
  });

  /**
   * Handle close
   */
  const handleClose = useCallback(() => {
    HapticService.light();
    onClose && onClose();
  }, [onClose]);

  /**
   * Handle Generate URL
   */
  const handleGenerateURL = useCallback(() => {
    HapticService.success();
    onGenerateURL && onGenerateURL({
      textAnimation,
      particleEffect,
      bgMusic,
      bgMusicUrl,
      effectConfig
    });
  }, [onGenerateURL, textAnimation, particleEffect, bgMusic, bgMusicUrl, effectConfig]);

  /**
   * Open/Close Selection Panel
   */
  const openSelectionPanel = useCallback((type) => {
    HapticService.light();
    setSelectionType(type);
    setShowSelectionPanel(true);
    
    panelOpacity.value = withTiming(1, { duration: 300 });
    panelTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
  }, [panelOpacity, panelTranslateY]);

  const closeSelectionPanel = useCallback(() => {
    HapticService.light();
    
    panelOpacity.value = withTiming(0, { duration: 250 });
    panelTranslateY.value = withTiming(300, { duration: 250, easing: Easing.in(Easing.ease) });
    
    setTimeout(() => {
      setShowSelectionPanel(false);
      setSelectionType(null);
    }, 250);
  }, [panelOpacity, panelTranslateY]);

  /**
   * Quick Action Chip Handlers
   */
  const handleTextAnimationChipPress = useCallback(() => {
    openSelectionPanel('text');
  }, [openSelectionPanel]);

  const handleParticleEffectChipPress = useCallback(() => {
    openSelectionPanel('particle');
  }, [openSelectionPanel]);

  const handleBgMusicChipPress = useCallback(() => {
    HapticService.light();
    setShowMusicOverlay(true);
  }, []);

  /**
   * Effect Selection Handlers
   */
  const handleTextAnimationSelect = useCallback((animationId) => {
    HapticService.success();
    onChangeTextAnimation && onChangeTextAnimation(animationId);
    closeSelectionPanel();
  }, [onChangeTextAnimation, closeSelectionPanel]);

  const handleParticleEffectSelect = useCallback((effectId) => {
    HapticService.success();
    onChangeParticleEffect && onChangeParticleEffect(effectId);
    closeSelectionPanel();
  }, [onChangeParticleEffect, closeSelectionPanel]);

  const handleBgMusicSelect = useCallback((musicId) => {
    HapticService.success();
    onChangeBgMusic && onChangeBgMusic(musicId);
    closeSelectionPanel();
  }, [onChangeBgMusic, closeSelectionPanel]);
  
  /**
   * Handle music selection from MusicSelectionOverlay
   */
  const handleMusicSelect = useCallback((music) => {
    console.log('🎵 [MessagePreviewOverlay] Music selected:', music);
    HapticService.success();
    
    // Store selected music data
    setSelectedMusicData(music);
    
    // Update parent with music_key and music_url
    onChangeBgMusic && onChangeBgMusic(music.music_key, music.music_url);
    
    // Close overlay
    setShowMusicOverlay(false);
    
    // Stop music if playing
    setIsMusicPlaying(false);
  }, [onChangeBgMusic]);
  
  /**
   * Handle floating music button (play/pause)
   */
  const handleToggleMusic = useCallback(() => {
    HapticService.light();
    setIsMusicPlaying(!isMusicPlaying);
    console.log('🎵 [MessagePreviewOverlay] Toggle music:', !isMusicPlaying);
  }, [isMusicPlaying]);
  
  /**
   * Get current selection options based on type
   */
  const getCurrentOptions = useCallback(() => {
    switch (selectionType) {
      case 'text':
        return TEXT_ANIMATIONS;
      case 'particle':
        return PARTICLE_EFFECTS;
      case 'music':
        return BG_MUSICS;
      default:
        return [];
    }
  }, [selectionType, TEXT_ANIMATIONS, PARTICLE_EFFECTS, BG_MUSICS]);

  const getCurrentValue = useCallback(() => {
    switch (selectionType) {
      case 'text':
        return textAnimation;
      case 'particle':
        return particleEffect;
      case 'music':
        return bgMusic;
      default:
        return null;
    }
  }, [selectionType, textAnimation, particleEffect, bgMusic]);

  const handleOptionSelect = useCallback((optionId) => {
    switch (selectionType) {
      case 'text':
        handleTextAnimationSelect(optionId);
        break;
      case 'particle':
        handleParticleEffectSelect(optionId);
        break;
      case 'music':
        handleBgMusicSelect(optionId);
        break;
    }
  }, [selectionType, handleTextAnimationSelect, handleParticleEffectSelect, handleBgMusicSelect]);
  
  // Animated style for selection panel
  const selectionPanelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: panelOpacity.value,
    transform: [{ translateY: panelTranslateY.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <>
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Background: Persona Image/Video */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <PersonaBackgroundView
          persona={persona}
          isScreenFocused={visible}
          opacity={1}
        />

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ⭐ Particle Effect (NEW) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <ParticleEffect type={particleEffect} isActive={visible} />

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Header: Close Button (Left) + URL Button (Right) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <View style={[styles.header, { paddingTop: platformPadding(10), paddingBottom: platformPadding(10) }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={scale(28)} color={theme.textPrimary} />
          </TouchableOpacity>
          <CustomText type="title" bold style={{ color: theme.textPrimary }}>
            {t('message_preview.title', 'Preview')}
          </CustomText>

        </View>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 🎵 Floating Music Button (좌측 상단) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {bgMusic && bgMusic !== 'none' && bgMusicUrl && (
          <TouchableOpacity
            onPress={handleToggleMusic}
            style={[
              styles.floatingMusicButton,
              { 
                backgroundColor: theme.mainColor,
                top: insets.top + verticalScale(70),
              }
            ]}
          >
            <Icon 
              name={isMusicPlaying ? 'pause' : 'play'} 
              size={scale(20)} 
              color="#fff" 
            />
          </TouchableOpacity>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Main Content: Message with Gradient Overlay */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <View style={styles.contentWrapper}>

          {/* URL 생성 플로팅 버튼 (우측 상단) */}
          <TouchableOpacity
            onPress={handleGenerateURL}
            disabled={isCreating}
            style={[styles.urlFloatingButton, { backgroundColor: theme.mainColor }]}
          >
            {isCreating ? (
              <Icon name="loading" size={scale(20)} color="#fff" />
            ) : (
              <Icon name="link-variant" size={scale(20)} color="#fff" />
            )}
          </TouchableOpacity>

          {/* Gradient Overlay with Animation */}
          <Animated.View style={[styles.gradientWrapper, overlayAnimatedStyle]}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
              locations={[0, 0.4, 1]}
              style={styles.gradient}
            >
              <View style={[styles.contentContainer, { paddingBottom: insets.bottom + platformPadding(20) }]}>
                {/* Title with Animation */}
                <Animated.View style={titleAnimatedStyle}>
                  <CustomText type="big" bold style={styles.title}>
                    {messageTitle}
                  </CustomText>
                </Animated.View>

                {/* Content with Animation (different rendering for typing) */}
                {textAnimation === 'typing' ? (
                  <Animated.View style={contentAnimatedStyle}>
                    <CustomText type="middle" style={styles.content}>
                      {typingText}
                      {showCursor && <CustomText style={styles.cursor}>▌</CustomText>}
                    </CustomText>
                  </Animated.View>
                ) : (
                  <Animated.View style={contentAnimatedStyle}>
                    <CustomText type="normal" style={styles.content}>
                      {messageContent}
                    </CustomText>
                  </Animated.View>
                )}
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Quick Action Chips (Right Side) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <View style={[styles.quickChipsContainer, { top: insets.top + verticalScale(80) }]}>
          {/* Text Animation Chip */}
          <TouchableOpacity
            style={[styles.quickChip, { backgroundColor: theme.bgSecondary }]}
            onPress={handleTextAnimationChipPress}
          >
            <Icon name="format-text" size={scale(24)} color={theme.mainColor} />
          </TouchableOpacity>

          {/* Particle Effect Chip */}
          <TouchableOpacity
            style={[styles.quickChip, { backgroundColor: theme.bgSecondary }]}
            onPress={handleParticleEffectChipPress}
          >
            <Icon name="shimmer" size={scale(24)} color={theme.mainColor} />
          </TouchableOpacity>

          {/* Background Music Chip */}
          <TouchableOpacity
            style={[styles.quickChip, { backgroundColor: theme.bgSecondary }]}
            onPress={handleBgMusicChipPress}
          >
            <Icon name="music-note" size={scale(24)} color={theme.mainColor} />
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Selection Panel (Inline, Modal 내부에서 동작) */}
        {/* ⚠️ Music은 MusicSelectionOverlay로 대체되어 제외 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showSelectionPanel && selectionType !== 'music' && (
          <>
            {/* Backdrop */}
            <TouchableOpacity
              style={styles.selectionBackdrop}
              activeOpacity={1}
              onPress={closeSelectionPanel}
            >
              <Animated.View style={[styles.selectionBackdropOverlay, { opacity: panelOpacity.value }]} />
            </TouchableOpacity>

            {/* Selection Panel */}
            <Animated.View style={[styles.selectionPanel, selectionPanelAnimatedStyle, { backgroundColor: theme.backgroundColor }]}>
              {/* Panel Header */}
              <View style={[styles.selectionPanelHeader, { borderBottomColor: theme.borderColor }]}>
                <CustomText type="bodyBold" style={{ color: theme.textPrimary }}>
                  {selectionType === 'text' && t('message_preview.text_animation')}
                  {selectionType === 'particle' && t('message_preview.particle_effect')}
                  {selectionType === 'music' && t('message_preview.bg_music')}
                </CustomText>
                <TouchableOpacity onPress={closeSelectionPanel}>
                  <Icon name="close" size={scale(24)} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Options List */}
              <ScrollView style={styles.selectionPanelContent}>
                {getCurrentOptions().map((option) => {
                  const isSelected = getCurrentValue() === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                        { borderColor: theme.borderColor }
                      ]}
                      onPress={() => handleOptionSelect(option.id)}
                    >
                      <Icon
                        name={option.icon}
                        size={scale(24)}
                        color={isSelected ? theme.mainColor : theme.textSecondary}
                      />
                      <CustomText
                        type="body"
                        style={{
                          marginLeft: scale(12),
                          color: isSelected ? theme.mainColor : theme.textPrimary
                        }}
                      >
                        {option.label}
                      </CustomText>
                      {isSelected && (
                        <Icon name="check-circle" size={scale(20)} color={theme.mainColor} style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 🎵 Hidden Audio Player (react-native-video) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {bgMusic && bgMusic !== 'none' && bgMusicUrl && (
          <Video
            ref={videoMusicRef}
            source={{ uri: bgMusicUrl }}
            audioOnly={true}
            paused={!isMusicPlaying}
            repeat={true}
            volume={1.0}
            onEnd={() => {
              console.log('🎵 [MessagePreviewOverlay] Music ended');
              setIsMusicPlaying(false);
            }}
            onError={(error) => {
              console.error('❌ [MessagePreviewOverlay] Music error:', error);
              setIsMusicPlaying(false);
            }}
            style={{ width: 0, height: 0 }}
          />
        )}
      </View>
    </Modal>

    {/* Music Selection Overlay */}
    {showMusicOverlay && (
      <MusicSelectionOverlay
        visible={showMusicOverlay}
        onClose={() => setShowMusicOverlay(false)}
        onSelect={handleMusicSelect}
        selectedMusicKey={selectedMusicData?.music_key || null}
      />
    )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',

    alignItems: 'center',
    paddingHorizontal: platformPadding(16),
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    padding: scale(5),
    width: scale(40),
  },
  urlFloatingButton: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginLeft: 'auto',
    marginRight: scale(20),
    marginBottom: scale(20),
  },
  floatingMusicButton: {
    position: 'absolute',
    left: platformPadding(20),
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 101,
  },
  contentWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 'auto'//SCREEN_HEIGHT * 0.6,
  },
  gradientWrapper: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    paddingHorizontal: platformPadding(24),
  },
  title: {
    lineHeight: scale(36),
    marginBottom: verticalScale(16),
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    fontSize: scale(16),
    lineHeight: scale(32),
    marginBottom: verticalScale(0),
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cursor: {
    fontSize: scale(16),
    fontWeight: '700',
  },
  quickChipsContainer: {
    position: 'absolute',
    right: platformPadding(16),
    zIndex: 50,
  },
  quickChip: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectionBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  selectionBackdropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  selectionPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.6,
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    zIndex: 201,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  selectionPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: platformPadding(20),
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
  },
  selectionPanelContent: {
    paddingHorizontal: platformPadding(16),
    paddingVertical: verticalScale(12),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: platformPadding(16),
    marginBottom: verticalScale(8),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(79, 172, 254, 0.1)',
  },
});

export default MessagePreviewOverlay;

