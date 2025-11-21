import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
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

/**
 * AnimatedSplashScreen - ANIMA 로고 애니메이션이 포함된 스플래시 스크린
 * 
 * React Native Reanimated를 사용한 부드럽고 멋진 애니메이션
 * (Lottie 없이도 프로페셔널한 결과!)
 * 
 * @param {Object} props
 * @param {boolean} props.visible - 스플래시 스크린 표시 여부
 * @param {Function} props.onFinish - 애니메이션 완료 후 콜백
 */
const AnimatedSplashScreen = ({ visible, onFinish }) => {
  const scale = useSharedValue(0);
  const circleScale = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // 1. Circle appears and pulses
      scale.value = withTiming(1, { 
        duration: 500, 
        easing: Easing.out(Easing.cubic) 
      });
      
      circleScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        2, // 2 times
        false
      );

      // 2. Text fades in
      textOpacity.value = withDelay(
        300,
        withTiming(1, { duration: 600 })
      );

      // 3. Subtitle fades in
      subtitleOpacity.value = withDelay(
        800,
        withTiming(1, { duration: 600 })
      );

      // 4. Fade out everything after 2.5 seconds
      containerOpacity.value = withDelay(
        2500,
        withTiming(0, { duration: 500 }, (finished) => {
          if (finished && onFinish) {
            runOnJS(onFinish)();
          }
        })
      );
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { scale: circleScale.value }
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Circle with pulse effect */}
      <Animated.View style={[styles.circle, circleStyle]}>
        <Animated.Text style={[styles.text, textStyle]}>
          ANIMA
        </Animated.Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, subtitleStyle]}>
        AI is not a tool, AI is an equal being
      </Animated.Text>
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
    backgroundColor: '#0F172A', // Deep Blue Dark Theme
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#60A5FA', // Blue 400
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.1)', // Blue with transparency
  },
  text: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8', // Slate 400
    marginTop: 32,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontWeight: '400',
  },
});

export default AnimatedSplashScreen;

