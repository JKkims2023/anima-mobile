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

import React, { memo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
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

  // ✅ Animation values
  const titleOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const particleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(1.2);
  const contentScale = useSharedValue(1.2);
  const titleTranslateX = useSharedValue(-100);
  const contentTranslateX = useSharedValue(100);

  // ✅ Start animations when card becomes active
  useEffect(() => {
    if (isActive) {
      if (__DEV__) {
        console.log('[MessageHistoryCard] 🎬 Starting animations:', text_animation);
      }

      // Reset all animation values
      titleOpacity.value = 0;
      contentOpacity.value = 0;
      particleOpacity.value = 0;
      titleScale.value = 1.2;
      contentScale.value = 1.2;
      titleTranslateX.value = -100;
      contentTranslateX.value = 100;

      // 1. Particle effects start (0.3s delay)
      particleOpacity.value = withDelay(
        300,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
      );

      // 2. Text animations based on text_animation type
      switch (text_animation) {
        case 'fade_in':
          startFadeInAnimation();
          break;
        case 'typing':
          startFadeInAnimation(); // For now, use fade_in (typing requires special handling)
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
    } else {
      // Reset when not active
      titleOpacity.value = 0;
      contentOpacity.value = 0;
      particleOpacity.value = 0;
      titleScale.value = 1.2;
      contentScale.value = 1.2;
      titleTranslateX.value = -100;
      contentTranslateX.value = 100;
    }
  }, [isActive, text_animation]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Animation Functions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const startFadeInAnimation = () => {
    titleOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    contentOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) })
    );
  };

  const startScaleInAnimation = () => {
    titleScale.value = withDelay(
      500,
      withTiming(1.0, { duration: 800, easing: Easing.out(Easing.back(1.5)) })
    );
    titleOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    
    contentScale.value = withDelay(
      900,
      withTiming(1.0, { duration: 800, easing: Easing.out(Easing.back(1.5)) })
    );
    contentOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
  };

  const startSlideCrossAnimation = () => {
    titleTranslateX.value = withDelay(
      500,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    titleOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    
    contentTranslateX.value = withDelay(
      900,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    contentOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
  };

  // ✅ Animated styles
  const animatedTitleStyle = useAnimatedStyle(() => {
    switch (text_animation) {
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
        return {
          opacity: titleOpacity.value,
        };
    }
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    switch (text_animation) {
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
        return {
          opacity: contentOpacity.value,
        };
    }
  });

  const animatedParticleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));

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

      {/* Gradient Overlay (하단 50%만 어둡게) */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        locations={[0.5, 0.75, 1]}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />

      {/* Particle Effects */}
      {particle_effect && particle_effect !== 'none' && isActive && (
        <Animated.View style={[styles.particleContainer, animatedParticleStyle]} pointerEvents="none">
          <ParticleEffect
            type={particle_effect}
            isActive={true}
          />
        </Animated.View>
      )}

      {/* Message Content */}
      <View style={styles.contentContainer}>
        {/* Title */}
        {message_title ? (
          <Animated.View style={animatedTitleStyle}>
            <CustomText type="big" bold style={styles.title}>
              {message_title}
            </CustomText>
          </Animated.View>
        ) : null}

        {/* Content */}
        {message_content ? (
          <Animated.View style={animatedContentStyle}>
            <CustomText type="normal" style={styles.content}>
              {message_content}
            </CustomText>
          </Animated.View>
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
    top: '50%', // ✅ 하단 50%만 어둡게
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

