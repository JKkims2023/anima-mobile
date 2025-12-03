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
  
  // scale_in animation
  const titleScale = useSharedValue(0.8);
  const contentScale = useSharedValue(0.8);
  
  // slide_cross animation
  const titleTranslateX = useSharedValue(-50);
  const contentTranslateX = useSharedValue(50);
  
  // typing animation
  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const animationFrameRef = useRef(null);
  const typingStartTimeRef = useRef(null);
  const TYPING_SPEED = 15; // 15ms per character (same as Web)

  // ═══════════════════════════════════════════════════════════════════════
  // Animation Logic
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!visible) return;
    
    console.log('[MessagePreviewOverlay] Starting animations, textAnimation:', textAnimation);
    
    // Reset all animation values
    overlayOpacity.value = 0;
    titleOpacity.value = 0;
    contentOpacity.value = 0;
    titleScale.value = 0.8;
    contentScale.value = 0.8;
    titleTranslateX.value = -50;
    contentTranslateX.value = 50;
    setTypingText('');
    setShowCursor(false);
    
    // Always fade in overlay first (500ms)
    overlayOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    
    // Start specific text animation based on textAnimation prop
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
   * 3. scale_in: 작게 → 크게 (Web 동일, duration 600ms)
   */
  const startScaleInAnimation = useCallback(() => {
    // Title scale in (delay 300ms, duration 600ms)
    titleScale.value = withDelay(
      300,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.back(1.5)), // Bounce effect
      })
    );
    titleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
    
    // Content scale in (delay 600ms, duration 600ms)
    contentScale.value = withDelay(
      600,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
      })
    );
    contentOpacity.value = withDelay(
      600,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);
  
  /**
   * 4. slide_cross: 제목 좌→우, 내용 우→좌 (Web 동일, duration 600ms)
   */
  const startSlideCrossAnimation = useCallback(() => {
    // Title: slide from left (delay 300ms, duration 600ms)
    titleTranslateX.value = withDelay(
      300,
      withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
    titleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
    
    // Content: slide from right (delay 600ms, duration 600ms)
    contentTranslateX.value = withDelay(
      600,
      withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
    contentOpacity.value = withDelay(
      600,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════
  // Animated Styles
  // ═══════════════════════════════════════════════════════════════════════
  
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [
      { scale: titleScale.value },
      { translateX: titleTranslateX.value },
    ],
  }));
  
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [
      { scale: contentScale.value },
      { translateX: contentTranslateX.value },
    ],
  }));

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
    openSelectionPanel('music');
  }, [openSelectionPanel]);

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
        {/* Header: Close Button (Left) + URL Button (Right) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <View style={[styles.header, { paddingTop: insets.top + platformPadding(10) }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={scale(28)} color={theme.textPrimary} />
          </TouchableOpacity>
          <CustomText type="bodyBold" style={{ color: theme.textPrimary }}>
            {t('message_preview.title', 'Preview')}
          </CustomText>
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
        </View>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Main Content: Message with Gradient Overlay */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <View style={styles.contentWrapper}>
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
                    <CustomText type="normal" style={styles.content}>
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
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showSelectionPanel && (
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
      </View>
    </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: platformPadding(16),
    zIndex: 100,
  },
  closeButton: {
    padding: scale(5),
    width: scale(40),
  },
  urlFloatingButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  contentWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6,
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
    fontSize: scale(28),
    lineHeight: scale(36),
    marginBottom: verticalScale(16),
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    fontSize: scale(20),
    lineHeight: scale(32),
    marginBottom: verticalScale(30),
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

