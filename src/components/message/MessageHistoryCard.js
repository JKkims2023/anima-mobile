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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import PersonaBackgroundView from './PersonaBackgroundView';
import ParticleEffect from '../particle/ParticleEffect';
import CustomText from '../CustomText';
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * MessageHistoryCard Component
 */
const MessageHistoryCard = memo(({
  message,
  isActive = false, // Is this card currently visible?
  onPress,
}) => {
  const insets = useSafeAreaInsets();
  
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

  return (
    <View style={styles.card}>
      {/* Background: Persona Image/Video */}
      <View style={styles.backgroundContainer}>
        <PersonaBackgroundView
          persona={persona}
          isScreenFocused={isActive}
        />
      </View>

      {/* Particle Effects */}
      {particle_effect && particle_effect !== 'none' && isActive && (
        <View style={styles.particleContainer} pointerEvents="none">
          <ParticleEffect
            type={particle_effect}
            isActive={true}
          />
        </View>
      )}

      {/* Content Wrapper (Auto Height, 최대 50%) */}
      <View style={styles.contentWrapper}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        >
          <View style={[styles.contentContainer, { paddingBottom: insets.bottom + platformPadding(20) }]}>
            {/* Title */}
            {message_title ? (
              <CustomText type="big" bold style={styles.title} numberOfLines={2}>
                {message_title}
              </CustomText>
            ) : null}

            {/* Content */}
            {message_content ? (
              <CustomText type="normal" style={styles.content} numberOfLines={6}>
                {message_content}
              </CustomText>
            ) : null}
          </View>
        </LinearGradient>
      </View>

      {/* Persona Name Badge (Top Right) */}
      <View style={[styles.personaBadge, { top: insets.top + verticalScale(20) }]}>
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
    height: SCREEN_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#000',
  },

  // ✅ Background container (카드 내부에 고정)
  backgroundContainer: {
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
  // Content Wrapper (Auto Height, 최대 50%)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  contentWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.5, // ✅ 최대 50% (Auto height)
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
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  content: {
    fontSize: scale(20),
    lineHeight: scale(32),
    marginBottom: verticalScale(30),
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Persona Badge
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  personaBadge: {
    position: 'absolute',
    right: scale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  personaName: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
});

export default MessageHistoryCard;

