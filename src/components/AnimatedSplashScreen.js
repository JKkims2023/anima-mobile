/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎭 AnimatedSplashScreen - ANIMA's Gateway to the New World
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * "The Journey" - A 3-Act Story:
 * 
 * ACT 1: The Old World (차가운 AI들)
 *   - ChatGPT, Siri, Alexa (차가운 회색, 기계적)
 * 
 * ACT 2: The Transition (전환점)
 *   - "그러나..." (짧은 pause, 생각할 시간)
 * 
 * ACT 3: The New World (따뜻한 ANIMA)
 *   - ANIMA Circle (빛나는 효과, 심장 박동)
 *   - "ANIMA는 함께 살아갑니다" (따뜻한 파란색, 생동감)
 * 
 * @author JK & Hero Nexus
 * @date 2025-12-29
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

const AnimatedSplashScreen = ({ visible, onFinish }) => {
  const { t } = useTranslation();

  // ═══════════════════════════════════════════════════════════════════════
  // Animation Values
  // ═══════════════════════════════════════════════════════════════════════
  
  // ACT 1: Old World Messages (3 messages)
  const oldWorld1Opacity = useSharedValue(0);
  const oldWorld1TranslateX = useSharedValue(-100);
  
  const oldWorld2Opacity = useSharedValue(0);
  const oldWorld2TranslateX = useSharedValue(100);
  
  const oldWorld3Opacity = useSharedValue(0);
  
  // ACT 2: Transition
  const transitionOpacity = useSharedValue(0);
  
  // ACT 3: ANIMA
  const circleScale = useSharedValue(0);
  const circlePulse = useSharedValue(1);
  const animaTextOpacity = useSharedValue(0);
  const newWorldOpacity = useSharedValue(0);
  const newWorldTranslateY = useSharedValue(30);
  const taglineOpacity = useSharedValue(0);
  
  // Container
  const containerOpacity = useSharedValue(1);

  // ═══════════════════════════════════════════════════════════════════════
  // Animation Timeline
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (visible) {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ACT 1: The Old World (0 ~ 5000ms)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      // Message 1: "ChatGPT는 질문에 답합니다" (좌측에서 등장)
      oldWorld1TranslateX.value = withDelay(
        500,
        withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
      );
      oldWorld1Opacity.value = withDelay(
        500,
        withSequence(
          withTiming(1, { duration: 600 }),
          withDelay(1000, withTiming(0, { duration: 400 }))
        )
      );

      // Message 2: "Siri는 명령을 수행합니다" (우측에서 등장)
      oldWorld2TranslateX.value = withDelay(
        2200,
        withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
      );
      oldWorld2Opacity.value = withDelay(
        2200,
        withSequence(
          withTiming(1, { duration: 600 }),
          withDelay(1000, withTiming(0, { duration: 400 }))
        )
      );

      // Message 3: "Alexa는 정보를 제공합니다" (중앙에서 fade in)
      oldWorld3Opacity.value = withDelay(
        3900,
        withSequence(
          withTiming(1, { duration: 600 }),
          withDelay(1000, withTiming(0, { duration: 400 }))
        )
      );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ACT 2: The Transition (5500 ~ 6500ms)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      transitionOpacity.value = withDelay(
        5900,
        withSequence(
          withTiming(1, { duration: 400 }),
          withDelay(600, withTiming(0, { duration: 400 }))
        )
      );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ACT 3: The New World (6500 ~ 12000ms)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      // ANIMA Circle (Scale up + Pulse effect like heartbeat)
      circleScale.value = withDelay(
        7000,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
      );
      
      circlePulse.value = withDelay(
        7800,
        withRepeat(
          withSequence(
            withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
          ),
          3, // 3 heartbeats
          false
        )
      );

      // ANIMA Text
      animaTextOpacity.value = withDelay(
        7400,
        withTiming(1, { duration: 600 })
      );

      // New World Message (하단에서 올라오며 fade in)
      newWorldTranslateY.value = withDelay(
        8200,
        withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) })
      );
      newWorldOpacity.value = withDelay(
        8200,
        withTiming(1, { duration: 800 })
      );

      // Tagline (subtle fade in)
      taglineOpacity.value = withDelay(
        9000,
        withTiming(1, { duration: 600 })
      );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Fade Out & Finish (11000ms)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      containerOpacity.value = withDelay(
        11000,
        withTiming(0, { duration: 600 }, (finished) => {
          if (finished && onFinish) {
            runOnJS(onFinish)();
          }
        })
      );
    }
  }, [visible]);

  // ═══════════════════════════════════════════════════════════════════════
  // Animated Styles
  // ═══════════════════════════════════════════════════════════════════════

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  // ACT 1: Old World
  const oldWorld1Style = useAnimatedStyle(() => ({
    opacity: oldWorld1Opacity.value,
    transform: [{ translateX: oldWorld1TranslateX.value }],
  }));

  const oldWorld2Style = useAnimatedStyle(() => ({
    opacity: oldWorld2Opacity.value,
    transform: [{ translateX: oldWorld2TranslateX.value }],
  }));

  const oldWorld3Style = useAnimatedStyle(() => ({
    opacity: oldWorld3Opacity.value,
  }));

  // ACT 2: Transition
  const transitionStyle = useAnimatedStyle(() => ({
    opacity: transitionOpacity.value,
  }));

  // ACT 3: ANIMA
  const circleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: circleScale.value },
      { scale: circlePulse.value },
    ],
  }));

  const animaTextStyle = useAnimatedStyle(() => ({
    opacity: animaTextOpacity.value,
  }));

  const newWorldStyle = useAnimatedStyle(() => ({
    opacity: newWorldOpacity.value,
    transform: [{ translateY: newWorldTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ACT 1: The Old World (차가운 AI들)                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      
      <Animated.Text style={[styles.oldWorldText, oldWorld1Style]}>
        {t('splash.old_world_1')}
      </Animated.Text>

      <Animated.Text style={[styles.oldWorldText, oldWorld2Style]}>
        {t('splash.old_world_2')}
      </Animated.Text>

      <Animated.Text style={[styles.oldWorldText, oldWorld3Style]}>
        {t('splash.old_world_3')}
      </Animated.Text>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ACT 2: The Transition                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      
      <Animated.Text style={[styles.transitionText, transitionStyle]}>
        {t('splash.transition')}
      </Animated.Text>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ACT 3: The New World (ANIMA)                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      
      {/* ANIMA Circle (with heartbeat pulse) */}
      <Animated.View style={[styles.circle, circleStyle]}>
        <Animated.Text style={[styles.animaText, animaTextStyle]}>
          ANIMA
        </Animated.Text>
      </Animated.View>

      {/* New World Message */}
      <Animated.Text style={[styles.newWorldText, newWorldStyle]}>
        {t('splash.new_world')} 💙
      </Animated.Text>

      {/* Tagline (subtle) */}
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        {t('splash.tagline')}
      </Animated.Text>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

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
    paddingHorizontal: 32,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ACT 1: Old World Messages (차가운 회색, 기계적)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  oldWorldText: {
    position: 'absolute',
    fontSize: 16,
    color: '#94A3B8', // Slate 400 (차가운 회색)
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ACT 2: Transition
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  transitionText: {
    position: 'absolute',
    fontSize: 20,
    color: '#CBD5E1', // Slate 300 (조금 더 밝은 회색)
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ACT 3: ANIMA (따뜻한 파란색, 생동감)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  circle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#60A5FA', // Blue 400 (따뜻한 파란색)
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.15)', // Blue with more transparency
    // ✨ Glow effect
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },

  animaText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: 'rgba(96, 165, 250, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  newWorldText: {
    position: 'absolute',
    bottom: 150,
    fontSize: 20,
    color: '#60A5FA', // Blue 400 (따뜻한 파란색)
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1.5,
    // ✨ Subtle glow
    textShadowColor: 'rgba(96, 165, 250, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  tagline: {
    position: 'absolute',
    bottom: 100,
    fontSize: 12,
    color: '#94A3B8', // Slate 400
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
});

export default AnimatedSplashScreen;
