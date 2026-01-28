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
// 🎭 감정-효과 매핑 (Unified v2.1)
// ═══════════════════════════════════════════════════════════════════════════
// Matches: EmotionIndicator.js & minimalistPromptBuilder.js
// Total: 20 emotions (18 active + tired + 1 default)
// Updated: 2026-01-28 (Added tired emotion for server compatibility)
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
    duration: 1400, // ✅ 800 → 1400ms (더 길게, 눈에 잘 보이게)
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
    duration: 1200, // ✅ 700 → 1200ms
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
    duration: 1400, // ✅ 800 → 1400ms
  },
  
  love: {
    type: 'burst',
    emoji: '💕',
    color: '#FF1493',
    count: 20,
    duration: 1400, // ✅ 800 → 1400ms
  },
  
  joyful: {
    type: 'burst',
    emoji: '🎊',
    color: '#FFD700',
    count: 22,
    duration: 1200, // ✅ 700 → 1200ms
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
    duration: 1400, // ✅ 800 → 1400ms
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
    duration: 1200, // ✅ 700 → 1200ms
  },
  
  surprised: {
    type: 'burst',
    emoji: '⚡',
    color: '#FFD700',
    count: 25,
    duration: 1200, // ✅ 700 → 1200ms
  },
  
  playful: {
    type: 'burst',
    emoji: '😜',
    color: '#FF69B4',
    count: 20,
    duration: 1400, // ✅ 800 → 1400ms
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🌙 Neutral/Default
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tired: {
    type: 'rain',
    emoji: '😴',
    color: '#B0C4DE',
    count: 10,
    duration: 3000,
  },
  
  neutral: {
    type: null, // No effect (emoji only in EmotionIndicator)
    emoji: '😐',
    color: '#D3D3D3',
    count: 0,
    duration: 0,
  },
  
  sleeping: {
    type: null, // Default/Fallback - no effect
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
  const opacity = useSharedValue(0.3); // ✅ 0.3에서 시작 (부드러운 페이드 인)
  const scale = useSharedValue(0.8); // ✅ 0.8에서 시작 (부드러운 스케일 업)

  useEffect(() => {
    console.log(`🚀 [Particle] Starting animation: ${emoji}, delay: ${delay}ms, duration: ${duration}ms`);
    console.log(`   Start: (${startX}, ${startY}) → Target: (${targetX}, ${targetY})`);
    
    // ✅ 페이드 인 (부드럽게)
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) })
    );
    
    // ✅ 스케일 업 (부드럽게)
    scale.value = withDelay(
      delay,
      withSpring(1.2, { damping: 12, stiffness: 80 }) // 1.2배로 약간 크게
    );

    // ✅ 이동 애니메이션 (설정된 duration 사용)
    translateX.value = withDelay(
      delay,
      withTiming(targetX, { duration, easing: Easing.out(Easing.ease) })
    );
    
    translateY.value = withDelay(
      delay,
      withTiming(targetY, { duration, easing: Easing.out(Easing.ease) })
    );

    // ✅ 페이드 아웃 (마지막 500ms, 더 길게)
    const fadeOutDelay = delay + duration - 500;
    opacity.value = withDelay(
      fadeOutDelay,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // 🔴 DEBUG: 애니메이션 프레임마다 로그 (너무 많아서 주석)
    // console.log(`🎨 [Particle Style] translateX: ${translateX.value}, translateY: ${translateY.value}, scale: ${scale.value}, opacity: ${opacity.value}`);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  console.log(`🔴 [Particle Render] ${emoji} at (${startX}, ${startY}) → (${targetX}, ${targetY})`);

  return (
    <Animated.Text style={[styles.particle, animatedStyle]}>
      {console.log(`🎨 [Particle JSX] Rendering Text element: ${emoji}`)}
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

  // ⚠️ Unknown emotion - useEffect로 onComplete 지연 호출
  useEffect(() => {
    if (!config) {
      console.log(`💫 [ChatEmotionBurstEffect] Unknown emotion: ${emotionType} - no effect`);
      if (onComplete) {
        // ✅ 다음 렌더 사이클로 지연
        setTimeout(() => onComplete(), 0);
      }
    }
  }, [config, emotionType, onComplete]);

  if (!config) {
    return null;
  }

  // ⚠️ No effect (type: null) - 이모지만 표시, 효과 없음 - useEffect로 onComplete 지연 호출
  useEffect(() => {
    if (!config.type || config.count === 0) {
      console.log(`💫 [ChatEmotionBurstEffect] ${emotionType} has no visual effect (type: ${config.type}, count: ${config.count})`);
      if (onComplete) {
        // ✅ 다음 렌더 사이클로 지연
        setTimeout(() => onComplete(), 0);
      }
    }
  }, [config, emotionType, onComplete]);

  if (!config.type || config.count === 0) {
    return null;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💫 [ChatEmotionBurstEffect] Rendering effect');
  console.log('   emotionType:', emotionType);
  console.log('   type:', config.type);
  console.log('   emoji:', config.emoji);
  console.log('   count:', config.count);
  console.log('   duration:', config.duration);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 🔴 Reset completed count on mount
  useEffect(() => {
    completedCountRef.current = 0;
    console.log('🔄 [ChatEmotionBurstEffect] Reset completedCountRef to 0');
  }, [emotionType]);

  // ⭐ 파티클 완료 핸들러
  const handleParticleComplete = () => {
    completedCountRef.current += 1;
    console.log(`🎯 [Particle Complete] ${completedCountRef.current}/${config.count}`);
    
    if (completedCountRef.current === config.count) {
      console.log('✅ [ChatEmotionBurstEffect] All particles completed');
      if (onComplete) {
        // ✅ 다음 렌더 사이클로 지연하여 상태 업데이트 충돌 방지
        setTimeout(() => onComplete(), 0);
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
        onComplete={handleParticleComplete} // ⭐ 모든 파티클에 onComplete 전달 (카운터로 추적)
      />
    );
  }

  console.log(`🎨 [ChatEmotionBurstEffect] Generated ${particles.length} particles`);

  return (
    <View style={[styles.container, styles.debugBackground]} pointerEvents="none">
      {console.log('🔴 [DEBUG] Rendering particles container with', particles.length, 'particles')}
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
  // 🔴 DEBUG: Red background to verify rendering (최적화 테스트용)
  debugBackground: {
    backgroundColor: 'rgba(255, 0, 0, 0.05)', // ⭐ 매우 연한 빨간색 (영역 확인용)
  },
  particle: {
    position: 'absolute',
    fontSize: scale(40), // ✅ 24 → 40 (크지만 적당하게)
    // 🔴 DEBUG: 배경 제거 (프로덕션에서는 주석 처리)
    // backgroundColor: 'rgba(255, 255, 0, 0.3)', // 디버깅용 (반투명)
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
