/**
 * 💌 MessagePreviewView Component
 * 
 * Emotional message preview with animations
 * - Fade in overlay
 * - Title fade in
 * - Content typing effect
 * 
 * Features:
 * - Persona background (video/image)
 * - Gradient overlay (no border radius)
 * - Title fade animation
 * - Content typing animation (15ms/char)
 * - URL generation button
 * 
 * @author JK & Hero AI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import PersonaBackgroundView from './PersonaBackgroundView';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import { scale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MessagePreviewView = ({
  persona,
  messageTitle,
  messageContent,
  onGenerateURL,
  onBack,
  isScreenFocused = true,
  isCreating = false,
}) => {
  const { t } = useTranslation();

  // Animation states
  const overlayOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);

  // Typing effect state
  const [typingText, setTypingText] = useState('');
  const animationFrameRef = useRef(null);
  const typingStartTimeRef = useRef(null);

  // Start animations on mount
  useEffect(() => {
    console.log('[MessagePreviewView] Starting animations...');
    
    // 1. Fade in overlay (0.5s)
    overlayOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });

    // 2. Fade in title (0.5s, delayed 0.3s)
    titleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );

    // 3. Start typing effect after title fade (0.8s delay)
    const typingTimer = setTimeout(() => {
      startTypingEffect();
    }, 800);

    return () => {
      clearTimeout(typingTimer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [messageContent]);

  // Typing effect (ManagerAIChatView style)
  const startTypingEffect = useCallback(() => {
    if (!messageContent) return;

    console.log('[MessagePreviewView] Starting typing effect...');
    const TYPING_SPEED = 15; // 15ms per character
    const fullText = messageContent;

    const typeNextChar = (timestamp) => {
      if (!typingStartTimeRef.current) {
        typingStartTimeRef.current = timestamp;
      }

      const elapsed = timestamp - typingStartTimeRef.current;
      const targetIndex = Math.floor(elapsed / TYPING_SPEED);

      if (targetIndex < fullText.length) {
        const currentText = fullText.substring(0, targetIndex + 1);
        setTypingText(currentText);
        animationFrameRef.current = requestAnimationFrame(typeNextChar);
      } else {
        // Typing complete
        setTypingText(fullText);
        console.log('[MessagePreviewView] Typing complete!');
      }
    };

    animationFrameRef.current = requestAnimationFrame(typeNextChar);
  }, [messageContent]);

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const handleGenerateURL = useCallback(() => {
    HapticService.success();
    onGenerateURL && onGenerateURL();
  }, [onGenerateURL]);

  const handleBack = useCallback(() => {
    HapticService.light();
    onBack && onBack();
  }, [onBack]);

  return (
    <View style={styles.container}>
      {/* Background: Persona Image/Video */}
      <PersonaBackgroundView
        persona={persona}
        isScreenFocused={isScreenFocused}
        opacity={1}
      />

      {/* Overlay with Gradient (Fade In) */}
      <Animated.View style={[styles.overlayContainer, overlayStyle]}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.95)']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
            {/* Title (Fade In) */}
            <Animated.View style={[styles.titleContainer, titleStyle]}>
              <CustomText type="big" bold style={styles.title}>
                {messageTitle}
              </CustomText>
            </Animated.View>

            {/* Content (Typing Effect) */}
            <View style={styles.contentTextContainer}>
              <CustomText type="normal" style={styles.content}>
                {typingText}
                {typingText.length < messageContent.length && (
                  <CustomText style={styles.cursor}>▌</CustomText>
                )}
              </CustomText>
            </View>

            {/* Generate URL Button */}
            <CustomButton
              title={isCreating ? t('common.creating') : t('message_creator.generate_url_button')}
              onPress={handleGenerateURL}
              type="primary"
              disabled={isCreating || typingText.length < messageContent.length}
              loading={isCreating}
              style={styles.generateButton}
            />

            {/* Back to Edit Button */}
            <CustomButton
              title={t('message_creator.edit_button')}
              onPress={handleBack}
              type="outline"
              disabled={isCreating}
              style={styles.backButton}
            />
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_PRIMARY,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6, // 하단 60%
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    paddingHorizontal: platformPadding(24),
    paddingBottom: platformPadding(40),
  },
  titleContainer: {
    marginBottom: scale(20),
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: moderateScale(28),
    lineHeight: scale(36),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  contentTextContainer: {
    marginBottom: scale(30),
    minHeight: scale(80),
  },
  content: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: moderateScale(16),
    lineHeight: scale(26),
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cursor: {
    color: COLORS.DEEP_BLUE_LIGHT,
    fontSize: moderateScale(16),
  },
  generateButton: {
    marginTop: scale(10),
  },
  backButton: {
    marginTop: scale(12),
  },
});

export default MessagePreviewView;

