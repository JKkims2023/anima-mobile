/**
 * EmotionIndicator Component
 * 
 * Real-time user emotion display with smooth animation
 * 
 * Features:
 * - 11 emotion types + sleeping (default)
 * - Spring animation on emotion change
 * - Consistent size with other input buttons
 * 
 * @author JK & Hero NEXUS
 * @date 2026-01-13
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { moderateScale } from '../../utils/responsive-utils';

// 🎭 Emotion to Emoji Mapping
const EMOTION_EMOJI_MAP = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  anxious: '😰',
  excited: '🤩',
  calm: '😌',
  confused: '😕',
  grateful: '🙏',
  hopeful: '🌟',
  affectionate: '💖',
  neutral: '😐',
  sleeping: '😴', // Default
};

const EmotionIndicator = ({ emotion = 'sleeping', animated = true }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevEmotion = useRef(emotion);

  useEffect(() => {
    // Detect emotion change
    if (animated && emotion !== prevEmotion.current && emotion !== 'sleeping') {
      // Spring bounce animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.4,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.0,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      prevEmotion.current = emotion;
    }
  }, [emotion, animated, scaleAnim]);

  const emoji = EMOTION_EMOJI_MAP[emotion] || EMOTION_EMOJI_MAP.sleeping;

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        width: moderateScale(44),
        height: moderateScale(44),
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: moderateScale(24) }}>{emoji}</Text>
      </Animated.View>
    </View>
  );
};

export default EmotionIndicator;
