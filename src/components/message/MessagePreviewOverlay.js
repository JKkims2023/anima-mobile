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

import React, { useState, useCallback, useRef } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import PersonaBackgroundView from './PersonaBackgroundView';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
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

  // Quick Action Chips state
  const [showTextAnimationPicker, setShowTextAnimationPicker] = useState(false);
  const [showParticleEffectPicker, setShowParticleEffectPicker] = useState(false);
  const [showBgMusicPicker, setShowBgMusicPicker] = useState(false);

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
   * Quick Action Chip Handlers
   */
  const handleTextAnimationChipPress = useCallback(() => {
    HapticService.light();
    setShowTextAnimationPicker(!showTextAnimationPicker);
    setShowParticleEffectPicker(false);
    setShowBgMusicPicker(false);
  }, [showTextAnimationPicker]);

  const handleParticleEffectChipPress = useCallback(() => {
    HapticService.light();
    setShowParticleEffectPicker(!showParticleEffectPicker);
    setShowTextAnimationPicker(false);
    setShowBgMusicPicker(false);
  }, [showParticleEffectPicker]);

  const handleBgMusicChipPress = useCallback(() => {
    HapticService.light();
    setShowBgMusicPicker(!showBgMusicPicker);
    setShowTextAnimationPicker(false);
    setShowParticleEffectPicker(false);
  }, [showBgMusicPicker]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
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
        {/* Header: Close Button */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <View style={[styles.header, { paddingTop: insets.top + platformPadding(10) }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={scale(28)} color={theme.textPrimary} />
          </TouchableOpacity>
          <CustomText type="bodyBold" style={{ color: theme.textPrimary }}>
            {t('message_preview.title', 'Preview')}
          </CustomText>
          <View style={{ width: scale(40) }} />
        </View>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Main Content: Message with Gradient Overlay */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <View style={styles.contentWrapper}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
            locations={[0, 0.4, 1]}
            style={styles.gradient}
          >
            <View style={[styles.contentContainer, { paddingBottom: insets.bottom + platformPadding(20) }]}>
              {/* Title */}
              <CustomText type="big" bold style={styles.title}>
                {messageTitle}
              </CustomText>

              {/* Content */}
              <CustomText type="normal" style={styles.content}>
                {messageContent}
              </CustomText>

              {/* Generate URL Button */}
              <CustomButton
                title={isCreating ? t('common.creating') : t('message_creator.generate_url_button')}
                onPress={handleGenerateURL}
                type="primary"
                disabled={isCreating}
                loading={isCreating}
                style={styles.generateButton}
              />
            </View>
          </LinearGradient>
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
        {/* Effect Pickers (TODO: Step 5) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* These will be implemented in Step 5 */}
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
  contentWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6,
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
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    fontSize: scale(16),
    lineHeight: scale(26),
    marginBottom: verticalScale(30),
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  generateButton: {
    marginTop: verticalScale(10),
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
});

export default MessagePreviewOverlay;

