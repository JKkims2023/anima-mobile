import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { scale } from '../utils/responsive-utils';

// ✅ Get screen width for progress bar calculation
const SCREEN_WIDTH = Dimensions.get('window').width;
const PROGRESS_BAR_WIDTH = SCREEN_WIDTH - scale(80); // 40px padding on each side

/**
 * OverlayChangeView - SAGE ⇄ Persona 전환 오버레이
 * 
 * Features:
 * - Persona 변신: 3단계 프로그레스 바 (자아 → 성향 → 특징)
 * - SAGE 복귀: 심플한 로딩 스피너
 * - 블러 효과 배경 (웹 스타일)
 * 
 * @param {Object} props
 * @param {boolean} props.visible - 오버레이 표시 여부
 * @param {string} props.mode - 'toPersona' | 'toSage'
 * @param {string} props.personaName - 변신할 페르소나 이름 (toPersona 모드에서만)
 * @param {Function} props.onFinish - 애니메이션 완료 후 콜백
 */
const OverlayChangeView = ({ visible, mode = 'toPersona', personaName = '', onFinish }) => {
  const containerOpacity = useSharedValue(0);
  const spinnerRotation = useSharedValue(0);
  
  // Progress bar states (for toPersona mode)
  const [currentStepText, setCurrentStepText] = useState('자아를 로딩중...');
  const [progressPercent, setProgressPercent] = useState(0);
  const progressValue = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      if (__DEV__) {
        console.log('🎬 [OverlayChangeView] Showing overlay:', { mode, personaName });
      }
      
      // Reset values
      spinnerRotation.value = 0;
      progressValue.value = 0;
      setCurrentStepText('자아를 로딩중...');
      setProgressPercent(0);
      
      // ✅ Immediate visibility (no fade in delay)
      containerOpacity.value = 1;
      
      if (mode === 'toPersona') {
        // ✨ Persona 변신: 단일 프로그레스 바 (0 → 100%)
        
        // Step 1: 자아 로딩 (0% → 33%)
        setCurrentStepText('자아를 로딩중...');
        progressValue.value = withTiming(0.33, { 
          duration: 1000,
          easing: Easing.out(Easing.cubic),
        });
        
        // Update percent display
        const interval1 = setInterval(() => {
          setProgressPercent(prev => {
            const next = prev + 1;
            return next <= 33 ? next : 33;
          });
        }, 30);
        
        // Step 2: 성향 로딩 (33% → 66%)
        setTimeout(() => {
          clearInterval(interval1);
          setCurrentStepText('성향을 로딩중...');
          progressValue.value = withTiming(0.66, { 
            duration: 1000,
            easing: Easing.out(Easing.cubic),
          });
          
          const interval2 = setInterval(() => {
            setProgressPercent(prev => {
              const next = prev + 1;
              return next <= 66 ? next : 66;
            });
          }, 30);
          
          // Step 3: 특징 로딩 (66% → 100%)
          setTimeout(() => {
            clearInterval(interval2);
            setCurrentStepText('특징을 로딩중...');
            progressValue.value = withTiming(1, { 
              duration: 1000,
              easing: Easing.out(Easing.cubic),
            });
            
            const interval3 = setInterval(() => {
              setProgressPercent(prev => {
                const next = prev + 1;
                return next <= 100 ? next : 100;
              });
            }, 29);
            
            setTimeout(() => clearInterval(interval3), 1000);
          }, 1000);
        }, 1000);
        
        // Fade out after 3.5 seconds
        containerOpacity.value = withDelay(
          3500,
          withTiming(0, { duration: 400 }, (finished) => {
            if (finished && onFinish) {
              runOnJS(onFinish)();
            }
          })
        );
      } else {
        // 🔄 SAGE 복귀: 심플한 스피너
        
        // Continuous rotation
        spinnerRotation.value = withRepeat(
          withTiming(360, { 
            duration: 1500, 
            easing: Easing.linear 
          }),
          -1, // Infinite
          false
        );
        
        // Fade out after 2 seconds
        containerOpacity.value = withDelay(
          2000,
          withTiming(0, { duration: 400 }, (finished) => {
            if (finished && onFinish) {
              runOnJS(onFinish)();
            }
          })
        );
      }
    }
  }, [visible, mode]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const progressBarStyle = useAnimatedStyle(() => {
    const widthValue = progressValue.value * PROGRESS_BAR_WIDTH;
    if (__DEV__) {
      console.log('📊 [OverlayChangeView] Progress:', progressValue.value, '→', `${(progressValue.value * 100).toFixed(1)}%`, '→', `${widthValue.toFixed(1)}px`);
    }
    return {
      // ✅ Use actual pixel width instead of percentage or scaleX
      width: widthValue,
    };
  });

  if (!visible) {
    if (__DEV__) {
      console.log('🚫 [OverlayChangeView] Not visible, returning null');
    }
    return null;
  }

  if (__DEV__) {
    console.log('✅ [OverlayChangeView] Rendering overlay:', { mode, personaName });
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Blur Background (웹 스타일) */}
      <View style={styles.blurBackground} />
      
      {mode === 'toPersona' ? (
        // ✨ Persona 변신: 단일 프로그레스 바
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>✨</Text>
          <Text style={styles.mainText}>
            {personaName}(으)로 변신 중...
          </Text>
          
          {/* Single Progress Bar */}
          <View style={[styles.progressContainer, {}]}>
            {/* Progress Bar */}
            <View style={[styles.progressBarBg, {}]}>
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  progressBarStyle,
                  { 
                    // ✅ Force width update
                    minWidth: 1, // Ensure at least 1px width
                  }
                ]} 
              />
            </View>
            
            {/* Progress Info Row */}
            <View style={styles.progressInfoRow}>
              <Text style={styles.progressStepText}>
                {currentStepText}
              </Text>
              <Text style={styles.progressPercentText}>
                {progressPercent}%
              </Text>
            </View>
          </View>
        </View>
      ) : (
        // 🔄 SAGE 복귀: 심플한 스피너
        <View style={styles.contentContainer}>
          <Animated.Text style={[styles.spinner, spinnerStyle]}>
            🔄
          </Animated.Text>
          <Text style={styles.simpleText}>
            SAGE로 돌아가는 중...
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999999,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)', // ✅ Stronger dark background (웹 스타일)
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(32),
    zIndex: 1,
  },
  
  // ✨ Persona 변신 스타일
  mainTitle: {
    fontSize: scale(72), // ✅ 더 크게 (64 → 72)
    marginBottom: scale(20),
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  mainText: {
    fontSize: scale(22), // ✅ 더 크게 (20 → 22)
    fontWeight: '800', // ✅ 더 굵게 (700 → 800)
    color: '#FFFFFF',
    marginBottom: scale(48), // ✅ 더 넓은 간격 (40 → 48)
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  progressContainer: {
    width: '100%',
    maxWidth: scale(320),
  },
  progressBarBg: {
    width: '100%',
    height: scale(16), // ✅ 더 두껍게 (12 → 16)
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // ✅ 훨씬 더 밝게 (0.3 → 0.5)
    borderRadius: scale(8),
    overflow: 'hidden',
    marginBottom: scale(16),
    borderWidth: 2, // ✅ 더 두꺼운 테두리 (1 → 2)
    borderColor: 'rgba(255, 255, 255, 0.4)', // ✅ 더 밝은 테두리 (0.2 → 0.4)
  },
  progressBarFill: {
    // ✅ Width is animated via useAnimatedStyle
    height: '100%',
    backgroundColor: '#3B82F6', // ✅ 더 진한 Blue 500 (60A5FA → 3B82F6)
    borderRadius: scale(8),
    // ✅ 그라디언트 효과 (선택사항)
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  progressStepText: {
    fontSize: scale(17),
    fontWeight: '700', // ✅ 더 굵게 (600 → 700)
    color: '#93C5FD', // ✅ 더 밝은 Blue 300 (60A5FA → 93C5FD)
    textShadowColor: 'rgba(147, 197, 253, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  progressPercentText: {
    fontSize: scale(20), // ✅ 더 크게 (16 → 20)
    fontWeight: '800', // ✅ 더 굵게 (700 → 800)
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  
  // 🔄 SAGE 복귀 스타일
  spinner: {
    fontSize: scale(64),
    marginBottom: scale(20),
  },
  simpleText: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default OverlayChangeView;

