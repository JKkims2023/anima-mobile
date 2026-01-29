/**
 * 🎴 TarotCard - Individual Tarot Card Component
 * 
 * Features:
 * - Card back design (mystical purple pattern)
 * - Card front design (name, keywords)
 * - Selection state (glow effect)
 * - Touch interaction
 * 
 * @author JK & Hero NEXUS
 * @version 1.0.0
 * @date 2026-01-23
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import { scale, moderateScale, verticalScale } from '../../utils/responsive-utils';
import TAROT_IMAGES from '../../assets/tarot';

/**
 * TarotCard Component
 * 
 * @param {object} card - Card data { id, name_ko, keywords, is_reversed, ... }
 * @param {boolean} isFront - Show front (true) or back (false)
 * @param {boolean} isSelected - Selection state
 * @param {function} onPress - Press callback
 * @param {boolean} disabled - Disable touch
 * @param {number} delay - Entrance animation delay (ms)
 */
const TarotCard = ({
  card,
  isFront = false,
  isSelected = false,
  onPress,
  disabled = false,
  delay = 0,
}) => {
  // ✨ Flip Animation
  const flipRotation = useSharedValue(isFront ? 1 : 0);
  
  // ✨ Entrance Animation (Fade + Scale) - 더 신비롭게! 🌙
  const entranceOpacity = useSharedValue(0);
  const entranceScale = useSharedValue(0.7); // 0.5 → 0.7 (더 자연스러운 시작)
  
  // ✨ Selection Bounce Animation
  const selectionScale = useSharedValue(1);
  
  // 🔮 Reversed Rotation (역방향 회전) - NEW!
  const reversedRotation = useSharedValue(0);
  
  // 🔮 Reversed Glow (역방향 오라) - NEW!
  const reversedGlow = useSharedValue(0);
  
  // Update flip when isFront changes
  useEffect(() => {
    flipRotation.value = withTiming(isFront ? 1 : 0, {
      duration: 600,
      easing: Easing.inOut(Easing.ease),
    });
    
    // 🔮 역방향 카드 애니메이션 (플립 완료 후)
    if (isFront && card.is_reversed) {
      // 플립 완료 후 300ms 대기
      setTimeout(() => {
        // 180도 회전 애니메이션
        reversedRotation.value = withTiming(180, {
          duration: 800,
          easing: Easing.elastic(1),
        });
        
        // 보라색 오라 효과
        reversedGlow.value = withTiming(1, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        });
      }, 900); // 600ms (플립) + 300ms (대기)
    }
  }, [isFront, card.is_reversed]);
  
  // Entrance animation on mount - 더 천천히, 부드럽게 ✨
  useEffect(() => {
    const timer = setTimeout(() => {
      // 🌙 Fade In (더 천천히, 더 부드럽게)
      entranceOpacity.value = withTiming(1, {
        duration: 800, // 500ms → 800ms
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth cubic bezier
      });
      
      // ✨ Scale (신비로운 Spring)
      entranceScale.value = withSpring(1, {
        damping: 18, // 15 → 18 (더 부드러운 감쇠)
        stiffness: 80, // 100 → 80 (더 느리고 우아하게)
        mass: 1.2, // 약간의 질량감 추가
      });
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  // Selection bounce effect
  useEffect(() => {
    if (isSelected) {
      // Bounce: 1.0 → 0.9 → 1.05
      selectionScale.value = withSpring(1.05, {
        damping: 10,
        stiffness: 200,
      });
    } else {
      selectionScale.value = withSpring(1, {
        damping: 10,
        stiffness: 200,
      });
    }
  }, [isSelected]);
  
  // Front animated style (동적 부분만)
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipRotation.value,
      [0, 1],
      [180, 360]
    );
    
    const opacity = interpolate(
      flipRotation.value,
      [0, 0.5, 1],
      [0, 0, 1]
    );
    
    // 🔮 역방향 오라 효과 (shadow로 표현)
    const glowOpacity = reversedGlow.value;
    const glowRadius = 15 * glowOpacity;
    
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { rotateZ: `${reversedRotation.value}deg` }, // 🔮 역방향 회전 (레이아웃 영향 X)
        { scale: selectionScale.value * entranceScale.value },
      ],
      opacity: opacity * entranceOpacity.value,
      // 🔮 역방향 오라 (동적 shadow - shadowOffset 제외)
      shadowColor: '#9C27B0', // 보라색
      shadowOpacity: glowOpacity * 0.8,
      shadowRadius: glowRadius,
      elevation: glowOpacity * 10, // Android
    };
  });
  
  // Front 정적 스타일 (shadowOffset 등)
  const frontStaticStyle = {
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
    shadowOffset: { width: 0, height: 0 }, // 정적 값
  };
  
  // Back animated style
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipRotation.value,
      [0, 1],
      [0, 180]
    );
    
    const opacity = interpolate(
      flipRotation.value,
      [0, 0.5, 1],
      [1, 0, 0]
    );
    
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale: selectionScale.value * entranceScale.value },
      ],
      opacity: opacity * entranceOpacity.value,
      backfaceVisibility: 'hidden',
      position: 'absolute',
      width: '100%',
      height: '100%',
      
    };
  });
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {/* Card Back (뒷면) - 신비로운 이미지 ✨ */}
      <Animated.View style={[backAnimatedStyle]}>
        <View style={styles.cardBack}>
          <Image
            source={require('../../assets/tarot/tarot_back.jpg')}
            style={styles.cardBackImage}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
      
      {/* Card Front (앞면) - 이미지 중심 디자인 ✨ */}
      {/* 🚀 OPTIMIZATION: 조건부 렌더링으로 메모리 사용량 1/3로 감소! */}
      {isFront && (
        <Animated.View style={[frontStaticStyle, frontAnimatedStyle]}>
          <View style={styles.cardFront}>
            {/* Card Image (메인) */}
            <Image
              source={TAROT_IMAGES[card.image]}
              style={styles.cardImage}
              resizeMode="contain"
            />
            
            {/* Keywords (하단, 심플하게) */}
            <View style={styles.keywordsContainer}>
              {card.keywords.map((keyword, index) => (
                <CustomText key={index} style={styles.keywordText}>
                  {keyword}
                  {index < card.keywords.length - 1 && ' · '}
                </CustomText>
              ))}
            </View>
            
            {/* 🔮 역방향 표시 (카드가 회전해도 항상 정방향 유지!) */}
            {card.is_reversed && (
              <Animated.View 
                style={[
                  styles.reversedIndicator,
                  {
                    opacity: reversedGlow.value,
                    transform: [
                      { rotateZ: '-180deg' }  // ✅ 카드 회전 상쇄!
                    ]
                  }
                ]}
              >
                <CustomText style={styles.reversedIndicatorText}>⚠️</CustomText>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      )}
      
      {/* Selection Indicator */}
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Icon name="checkmark-circle" size={moderateScale(24)} color="#4CAF50" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 0.6, // Tarot card ratio (width:height = 3:5)
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // ✨ 약간의 배경색 (자연스러운 등장)
    // Base shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  selected: {
    // Glow effect
    transform: [{ scale: 1.05 }],
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Card Back (뒷면) - 신비로운 이미지 ✨
  // ═══════════════════════════════════════════════════════════════════════════
  cardBack: {
    flex: 1,
    borderRadius: moderateScale(10),
    overflow: 'hidden',
  },
  
  cardBackImage: {
    width: '100%',
    height: '100%',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Card Front (앞면) - 이미지 중심 디자인 ✨
  // ═══════════════════════════════════════════════════════════════════════════
  cardFront: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 깔끔한 흰색 배경
    borderRadius: moderateScale(10),
    overflow: 'hidden',
  },
  
  // 카드 이미지 (메인)
  cardImage: {
    width: '100%',
    height: '85%', // 상단 85% = 이미지
    borderTopLeftRadius: moderateScale(10),
    borderTopRightRadius: moderateScale(10),
  },
  
  // 키워드 영역 (하단 15%)
  keywordsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '15%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // 반투명 흰색
    borderTopWidth: 1,
    borderTopColor: 'rgba(123, 31, 162, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(8),
  },
  
  // 키워드 텍스트 (심플하게)
  keywordText: {
    fontSize: moderateScale(10),
    color: '#4A148C',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Selection Indicator
  // ═══════════════════════════════════════════════════════════════════════════
  selectionIndicator: {
    position: 'absolute',
    top: scale(5),
    right: scale(5),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: moderateScale(12),
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔮 Reversed Indicator (역방향 표시)
  // ═══════════════════════════════════════════════════════════════════════════
  reversedIndicator: {
    position: 'absolute',
    top: scale(8),
    left: scale(8),
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255, 193, 7, 0.95)', // 노란색 배경 (경고)
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  reversedIndicatorText: {
    fontSize: scale(18),
  },
});

export default TarotCard;
