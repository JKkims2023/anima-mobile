/**
 * EmotionIndicator Component
 * 
 * Real-time persona emotion display with smooth animation
 * 
 * Features:
 * - 18 emotion types + sleeping (default) = 19 total
 * - Spring animation on emotion change
 * - Consistent size with other input buttons
 * - Unified emotion list (matches ChatEmotionBurstEffect & Prompt)
 * 
 * @author JK & Hero NEXUS
 * @date 2026-01-13
 * @updated 2026-01-27 (Unified Emotion Mapping)
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { moderateScale } from '../../utils/responsive-utils';

// 🎭 Emotion to Emoji Mapping (Unified - v2.0)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Matches: ChatEmotionBurstEffect.js & minimalistPromptBuilder.js
// Total: 19 emotions (18 active + 1 default)
// Updated: 2026-01-27 (Unified Emotion Mapping)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const EMOTION_EMOJI_MAP = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔥 Core Emotions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  happy: '😊',
  sad: '😢',
  excited: '🤩',
  calm: '😌',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💕 Affective Emotions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  caring: '💝', // 🆕 Added
  love: '💕', // 🆕 Added
  joyful: '🎊', // 🆕 Added
  grateful: '🙏',
  affectionate: '💖',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎭 Complex Emotions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  anxious: '😰',
  worried: '😟', // 🆕 Added
  confused: '😕',
  hopeful: '🌟',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚡ Intense Emotions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  angry: '😠',
  surprised: '😲', // 🆕 Added
  playful: '😜', // 🆕 Added
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🌙 Neutral/Default
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
