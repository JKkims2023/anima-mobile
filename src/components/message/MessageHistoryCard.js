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

import React, { memo, useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  // ═══════════════════════════════════════════════════════════════════════
  // Text Animation State (MessagePreviewOverlay 로직 적용)
  // ═══════════════════════════════════════════════════════════════════════
  const titleOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const titleScale = useSharedValue(1.2);
  const contentScale = useSharedValue(1.2);
  const titleTranslateX = useSharedValue(-100);
  const contentTranslateX = useSharedValue(100);
  
  // typing animation
  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const animationFrameRef = useRef(null);
  const typingStartTimeRef = useRef(null);
  const TYPING_SPEED = 15; // 15ms per character

  // ═══════════════════════════════════════════════════════════════════════
  // Start text animation when card becomes active
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isActive) {
      // Reset animations when card is not active
      titleOpacity.value = 0;
      contentOpacity.value = 0;
      titleScale.value = 1.2;
      contentScale.value = 1.2;
      titleTranslateX.value = -100;
      contentTranslateX.value = 100;
      setTypingText('');
      setShowCursor(false);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    if (__DEV__) {
      console.log('[MessageHistoryCard] 🎬 Starting text animation:', text_animation);
    }

    // ✅ 파티클 이펙트 시작 후 텍스트 애니메이션 (300ms delay)
    setTimeout(() => {
      startTextAnimation();
    }, 300);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, text_animation]);

  // ═══════════════════════════════════════════════════════════════════════
  // Text Animation Functions
  // ═══════════════════════════════════════════════════════════════════════
  const startTextAnimation = useCallback(() => {
    switch (text_animation) {
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
  }, [text_animation, message_title, message_content]);

  const startFadeInAnimation = useCallback(() => {
    titleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    
    contentOpacity.value = withDelay(
      500,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);

  const startTypingAnimation = useCallback(() => {
    titleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    
    contentOpacity.value = 1;
    
    setTimeout(() => {
      typingStartTimeRef.current = null;
      setShowCursor(true);
      
      const typeNextChar = (timestamp) => {
        if (!typingStartTimeRef.current) {
          typingStartTimeRef.current = timestamp;
        }
        
        const elapsed = timestamp - typingStartTimeRef.current;
        const targetIndex = Math.floor(elapsed / TYPING_SPEED);
        
        if (targetIndex < message_content.length) {
          setTypingText(message_content.substring(0, targetIndex + 1));
          animationFrameRef.current = requestAnimationFrame(typeNextChar);
        } else {
          setTypingText(message_content);
          setShowCursor(false);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(typeNextChar);
    }, 800);
  }, [message_content]);

  const startScaleInAnimation = useCallback(() => {
    titleScale.value = withDelay(
      300,
      withTiming(1.0, {
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
      })
    );
    titleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      })
    );
    
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

  const startSlideCrossAnimation = useCallback(() => {
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
  // Animated Styles
  // ═══════════════════════════════════════════════════════════════════════
  const titleAnimatedStyle = useAnimatedStyle(() => {
    switch (text_animation) {
      case 'fade_in':
      case 'typing':
        return { opacity: titleOpacity.value };
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

  const contentAnimatedStyle = useAnimatedStyle(() => {
    switch (text_animation) {
      case 'fade_in':
        return { opacity: contentOpacity.value };
      case 'typing':
        return { opacity: 1 };
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
          <View style={[styles.contentContainer, { paddingBottom: platformPadding(20) }]}>
            {/* Title with Animation */}
            {message_title ? (
              <Animated.View style={titleAnimatedStyle}>
                <CustomText type="big" bold style={styles.title} numberOfLines={2}>
                  {message_title}
                </CustomText>
              </Animated.View>
            ) : null}

            {/* Content with Animation */}
            {message_content ? (
              text_animation === 'typing' ? (
                <Animated.View style={contentAnimatedStyle}>
                  <CustomText type="normal" style={styles.content} numberOfLines={6}>
                    {typingText}
                    {showCursor && <CustomText style={styles.cursor}>▌</CustomText>}
                  </CustomText>
                </Animated.View>
              ) : (
                <Animated.View style={contentAnimatedStyle}>
                  <CustomText type="normal" style={styles.content} numberOfLines={6}>
                    {message_content}
                  </CustomText>
                </Animated.View>
              )
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
  // ✅ Full width card (height는 부모에서 설정)
  card: {
    flex: 1, // ✅ 부모의 height 차지
    width: SCREEN_WIDTH,
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
  cursor: {
    fontSize: scale(16),
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
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

