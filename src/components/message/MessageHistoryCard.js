/**
 * 🎴 MessageHistoryCard Component
 * 
 * Displays a single message card for tinder-style swiping
 * - Persona background (video/image)
 * - Gradient overlay
 * - Message title + content
 * - Particle effects
 * - Background music (controlled by parent)
 * 
 * Reuses components from MessagePreviewOverlay
 * 
 * @author JK & Hero Nexus AI
 */

import React, { memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import PersonaBackgroundView from './PersonaBackgroundView';
import ParticleEffect from '../particle/ParticleEffect';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * MessageHistoryCard Component
 */
const MessageHistoryCard = memo(({
  message,
  isActive = false, // Is this card currently visible?
  onPress,
  availableHeight = SCREEN_HEIGHT, // Available height (excluding header, tabbar, etc.)
}) => {
  // ✅ Extract message data
  const {
    message_title,
    message_content,
    persona_key,
    persona_name,
    persona_image_url,
    persona_video_url,
    text_animation = 'fade_in',
    particle_effect = 'none',
    bg_music = 'none',
    bg_music_url = null,
  } = message;

  // ✅ Create persona object for PersonaBackgroundView
  const persona = {
    persona_key,
    persona_name,
    selected_dress_image_url: persona_image_url,
    selected_dress_video_url: persona_video_url,
    selected_dress_video_convert_yn: persona_video_url ? 'Y' : 'N',
  };

  // Debug log
  console.log(`[MessageHistoryCard] Rendering card:`, {
    persona_name,
    isActive,
    particle_effect,
    message_title: message_title?.substring(0, 20),
  });

  return (
    <View style={[styles.card, { height: availableHeight }]}>
      {/* Background: Persona Image/Video */}
      <View style={styles.backgroundContainer}>
        <PersonaBackgroundView
          persona={persona}
          isScreenFocused={isActive}
        />
      </View>

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
        locations={[0, 0.5, 1]}
        style={styles.gradientOverlay}
      />

      {/* Particle Effects */}
      {particle_effect && particle_effect !== 'none' && isActive && (
        <View style={styles.particleContainer} pointerEvents="none">
          <ParticleEffect
            type={particle_effect}
            isActive={true}
          />
        </View>
      )}

      {/* Message Content */}
      <View style={styles.contentContainer}>
        {/* Title */}
        {message_title ? (
          <CustomText type="big" bold style={styles.title}>
            {message_title}
          </CustomText>
        ) : null}

        {/* Content */}
        {message_content ? (
          <CustomText type="normal" style={styles.content}>
            {message_content}
          </CustomText>
        ) : null}
      </View>

      {/* Persona Name Badge (Top Right) */}
      <View style={styles.personaBadge}>
        <CustomText type="small" style={styles.personaName}>
          {persona_name || 'Unknown'}
        </CustomText>
      </View>
    </View>
  );
});

MessageHistoryCard.displayName = 'MessageHistoryCard';

const styles = StyleSheet.create({
  // ✅ Full screen card (전체 화면 채우기)
  card: {
    width: SCREEN_WIDTH,
    // height는 props로 전달됨 (availableHeight)
    overflow: 'hidden',
    backgroundColor: COLORS.BG_PRIMARY,
  },

  // ✅ Background container (카드 내부에 고정)
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  contentContainer: {
    position: 'absolute',
    bottom: verticalScale(40),
    left: scale(20),
    right: scale(20),
  },

  title: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'left',
    marginBottom: verticalScale(12),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: scale(2) },
    textShadowRadius: scale(4),
  },

  content: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'left',
    lineHeight: verticalScale(24),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: scale(1) },
    textShadowRadius: scale(3),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Persona Badge
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  personaBadge: {
    position: 'absolute',
    top: verticalScale(20),
    right: scale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(12),
  },

  personaName: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
});

export default MessageHistoryCard;

