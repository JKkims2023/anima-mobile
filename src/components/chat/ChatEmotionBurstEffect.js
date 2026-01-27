/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💫 ChatEmotionBurstEffect - 채팅 전용 감정 폭발 효과
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️ CRITICAL: iOS 호환성 최우선!
 * - ManagerAIOverlay Modal 내부에서만 사용
 * - gameAlert 패턴 적용 (absolute position + high zIndex)
 * - pointerEvents="none" (터치 이벤트 통과)
 * 
 * 🎨 효과 종류:
 * 1. 💥 중앙 폭발 (burst) - 1회, 0.7-0.8초
 * 2. 🌧️ 비 효과 (rain) - 위→아래, 3초
 * 3. ✨ 상승 효과 (ascend) - 아래→위, 3초
 * 4. ⚪ 효과 없음 (null) - 이모지만 표시
 * 
 * 🎯 특징:
 * - 19개 통합 감정 지원 (EmotionIndicator & Prompt와 일치)
 * - 단발성 효과 (지속 렌더링 X)
 * - 설정에서 on/off 가능
 * - 성능 최적화 (저사양 디바이스 고려)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-27
 * @updated 2026-01-27 (Unified Emotion Mapping)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { scale, verticalScale } from '../../utils/responsive-utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// 🎭 감정-효과 매핑 (Unified v2.0)
// ═══════════════════════════════════════════════════════════════════════════
// Matches: EmotionIndicator.js & minimalistPromptBuilder.js
// Total: 19 emotions (18 active + 1 default)
// Updated: 2026-01-27 (Unified Emotion Mapping)
// ═══════════════════════════════════════════════════════════════════════════
const EMOTION_CONFIG = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔥 Core Emotions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  happy: {
    type: 'burst',
    emoji: '🎉',
    color: '#FFA500',
    count: 20,
    duration: 800,
  },
  
  sad: {
    type: 'rain',
    emoji: '💧',
    color: '#4682B4',
    count: 15,
    duration: 3000,
  },
  
  excited: {
    type: 'burst',
    emoji: '✨',
    color: '#FFD700',
    count: 25,
    duration: 700,
  },
  
  calm: {
    type: 'ascend',
    emoji: '☁️',
    color: '#87CEEB',
    count: 10,
    duration: 3000,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💕 Affective Emotions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  caring: {
    type: 'burst',
    emoji: '💝',
    color: '#FF69B4',
    count: 18,
    duration: 800,
  },
  
  love: {
    type: 'burst',
    emoji: '💕',
    color: '#FF1493',
    count: 20,
    duration: 800,
  },
  
  joyful: {
    type: 'burst',
    emoji: '🎊',
    color: '#FFD700',
    count: 22,
    duration: 700,
  },
  
  grateful: {
    type: 'ascend',
    emoji: '🙏',
    color: '#FFD700',
    count: 12,
    duration: 3000,
  },
  
  affectionate: {
    type: 'burst',
    emoji: '💖',
    color: '#FF69B4',
    count: 18,
    duration: 800,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎭 Complex Emotions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  anxious: {
    type: 'rain',
    emoji: '😰',
    color: '#FFB6C1',
    count: 12,
    duration: 3000,
  },
  
  worried: {
    type: 'rain',
    emoji: '😟',
    color: '#B0C4DE',
    count: 12,
    duration: 3000,
  },
  
  confused: {
    type: null, // No effect (emoji only in EmotionIndicator)
    emoji: '😕',
    color: '#D3D3D3',
    count: 0,
    duration: 0,
  },
  
  hopeful: {
    type: 'ascend',
    emoji: '✨',
    color: '#FFE66D',
    count: 12,
    duration: 3000,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚡ Intense Emotions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  angry: {
    type: 'burst',
    emoji: '💢',
    color: '#FF4500',
    count: 25,
    duration: 700,
  },
  
  surprised: {
    type: 'burst',
    emoji: '⚡',
    color: '#FFD700',
    count: 25,
    duration: 700,
  },
  
  playful: {
    type: 'burst',
    emoji: '😜',
    color: '#FF69B4',
    count: 20,
    duration: 800,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🌙 Neutral/Default
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  neutral: {
    type: null, // No effect (emoji only in EmotionIndicator)
    emoji: '😐',
    color: '#D3D3D3',
    count: 0,
    duration: 0,
  },
  
  sleeping: {
    type: null, // Default - no effect
    emoji: '😴',
    color: '#B0C4DE',
    count: 0,
    duration: 0,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 단일 파티클 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════
const Particle = ({ emoji, startX, startY, targetX, targetY, delay, duration, onComplete }) => {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    // Step 1: 페이드 인 + 스케일 업
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 200 })
    );
    
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 10, stiffness: 100 })
    );

    // Step 2: 이동 애니메이션
    translateX.value = withDelay(
      delay,
      withTiming(targetX, { duration, easing: Easing.out(Easing.ease) })
    );
    
    translateY.value = withDelay(
      delay,
      withTiming(targetY, { duration, easing: Easing.out(Easing.ease) })
    );

    // Step 3: 페이드 아웃 (마지막 300ms)
    opacity.value = withDelay(
      delay + duration - 300,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.particle, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════
const ChatEmotionBurstEffect = ({ emotionType, onComplete }) => {
  const config = EMOTION_CONFIG[emotionType];
  const completedCountRef = useRef(0);

  // ⚠️ Unknown emotion
  if (!config) {
    console.log(`💫 [ChatEmotionBurstEffect] Unknown emotion: ${emotionType} - no effect`);
    if (onComplete) onComplete();
    return null;
  }

  // ⚠️ No effect (type: null) - 이모지만 표시, 효과 없음
  if (!config.type || config.count === 0) {
    console.log(`💫 [ChatEmotionBurstEffect] ${emotionType} has no visual effect (type: ${config.type}, count: ${config.count})`);
    if (onComplete) onComplete();
    return null;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💫 [ChatEmotionBurstEffect] Rendering effect');
  console.log('   emotionType:', emotionType);
  console.log('   type:', config.type);
  console.log('   count:', config.count);
  console.log('   duration:', config.duration);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ⭐ 파티클 완료 핸들러
  const handleParticleComplete = () => {
    completedCountRef.current += 1;
    
    if (completedCountRef.current === config.count) {
      console.log('✅ [ChatEmotionBurstEffect] All particles completed');
      if (onComplete) {
        onComplete();
      }
    }
  };

  // ⭐ 파티클 생성
  const particles = [];
  
  for (let i = 0; i < config.count; i++) {
    let startX, startY, targetX, targetY;
    
    if (config.type === 'burst') {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 💥 중앙 폭발: 중심 → 사방으로
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const centerX = SCREEN_WIDTH / 2;
      const centerY = SCREEN_HEIGHT / 2;
      
      // 랜덤 각도와 거리
      const angle = (Math.PI * 2 * i) / config.count;
      const distance = 100 + Math.random() * 150; // 100~250
      
      startX = 0;
      startY = 0;
      targetX = Math.cos(angle) * distance;
      targetY = Math.sin(angle) * distance;
      
    } else if (config.type === 'rain') {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🌧️ 비: 위 → 아래
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const randomX = (Math.random() - 0.5) * SCREEN_WIDTH * 0.8;
      
      startX = randomX;
      startY = -50;
      targetX = randomX + (Math.random() - 0.5) * 50; // 약간의 흔들림
      targetY = SCREEN_HEIGHT;
      
    } else if (config.type === 'ascend') {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ✨ 상승: 아래 → 위
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const randomX = (Math.random() - 0.5) * SCREEN_WIDTH * 0.8;
      
      startX = randomX;
      startY = SCREEN_HEIGHT + 50;
      targetX = randomX + (Math.random() - 0.5) * 50; // 약간의 흔들림
      targetY = -50;
    }
    
    // 순차적 딜레이 (부드러운 등장)
    const delay = i * (config.duration / config.count / 2);
    
    particles.push(
      <Particle
        key={`particle-${i}`}
        emoji={config.emoji}
        startX={startX}
        startY={startY}
        targetX={targetX}
        targetY={targetY}
        delay={delay}
        duration={config.duration}
        onComplete={i === config.count - 1 ? handleParticleComplete : undefined} // ⭐ 마지막 파티클만
      />
    );
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {particles}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    // ⚠️ CRITICAL: iOS 호환성
    zIndex: 9999, // ⭐ 매우 높은 zIndex (content 위, close button 아래)
    ...Platform.select({
      android: { elevation: 9999 },
    }),
  },
  particle: {
    position: 'absolute',
    fontSize: scale(24),
    // ⚠️ iOS 텍스트 렌더링 최적화
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
});

export default ChatEmotionBurstEffect;
