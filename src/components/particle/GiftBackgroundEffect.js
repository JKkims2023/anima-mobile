/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌌 BackgroundEffect - Layer 1 (Directional Gradient Effects)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⭐ NEW UX: 사용자가 빛의 방향과 색상을 직관적으로 선택!
 * 
 * Purpose:
 * - Directional gradient effects from 4 corners
 * - User-friendly: "Sun from Top Left" = 상단 좌측에서 햇빛
 * - Gentle, slow pulsing animations
 * - Does not invade system/header area
 * 
 * Structure:
 * - 4 Groups: Sun, Aurora, Neon, Gradient
 * - 4 Directions per group: Top Left, Top Right, Bottom Left, Bottom Right
 * - Total: 16 effects (4 × 4)
 * 
 * Design Philosophy:
 * - Sun (☀️): Warm golden tones (따뜻한 햇빛)
 * - Aurora (🌌): Mystical purple-blue tones (신비로운 오로라)
 * - Neon (💡): Vibrant neon colors (화려한 네온)
 * - Gradient (🌈): Dreamy pastel tones (부드러운 파스텔)
 * 
 * Animation:
 * - Opacity pulsing: 0.3 → 0.6 (gentle breathing)
 * - Duration: 2-6 seconds (depends on mood)
 * - Easing: Easing.inOut(Easing.ease)
 * - No movement, only intensity change
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-10 (Directional Gradient System)
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { verticalScale } from '../../utils/responsive-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

const GiftBackgroundEffect = ({ type, isActive = true }) => {
  console.log(`🌌 [BackgroundEffect] Rendering: type=${type}, isActive=${isActive}`);

  if (!type || type === 'none' || !isActive) {
    console.log(`🌌 [BackgroundEffect] Effect hidden: ${type}`);
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 🎨 NEW: Gift Effect Mapping (for Emotional Gifts)
  // ═══════════════════════════════════════════════════════════════════════
  if (type === 'gradient_soft') return <GradientTopLeft />; // 부드러운 그라디언트
  if (type === 'gradient_warm') return <GradientBottomRight />; // 따뜻한 그라디언트
  if (type === 'sun_warm') return <SunTopRight />; // 따뜻한 햇빛
  if (type === 'sun_bright') return <SunTopLeft />; // 밝은 햇빛
  if (type === 'aurora_soft') return <AuroraTopLeft />; // 부드러운 오로라

  // ═══════════════════════════════════════════════════════════════════════
  // Sun Effects (태양) ☀️
  // ═══════════════════════════════════════════════════════════════════════
  if (type === 'sun_top_left') return <SunTopLeft />;
  if (type === 'sun_top_right') return <SunTopRight />;
  if (type === 'sun_bottom_left') return <SunBottomLeft />;
  if (type === 'sun_bottom_right') return <SunBottomRight />;

  // ═══════════════════════════════════════════════════════════════════════
  // Aurora Effects (오로라) 🌌
  // ═══════════════════════════════════════════════════════════════════════
  if (type === 'aurora_top_left') return <AuroraTopLeft />;
  if (type === 'aurora_top_right') return <AuroraTopRight />;
  if (type === 'aurora_bottom_left') return <AuroraBottomLeft />;
  if (type === 'aurora_bottom_right') return <AuroraBottomRight />;

  // ═══════════════════════════════════════════════════════════════════════
  // Neon Effects (네온 라이트) 💡
  // ═══════════════════════════════════════════════════════════════════════
  if (type === 'neon_top_left') return <NeonTopLeft />;
  if (type === 'neon_top_right') return <NeonTopRight />;
  if (type === 'neon_bottom_left') return <NeonBottomLeft />;
  if (type === 'neon_bottom_right') return <NeonBottomRight />;

  // ═══════════════════════════════════════════════════════════════════════
  // Gradient Effects (그라디언트) 🌈
  // ═══════════════════════════════════════════════════════════════════════
  if (type === 'gradient_top_left') return <GradientTopLeft />;
  if (type === 'gradient_top_right') return <GradientTopRight />;
  if (type === 'gradient_bottom_left') return <GradientBottomLeft />;
  if (type === 'gradient_bottom_right') return <GradientBottomRight />;

  console.warn(`🌌 [BackgroundEffect] Unknown effect type: ${type}`);
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════
// ☀️ Sun Effects (태양 - 따뜻한 골든 톤)
// ═══════════════════════════════════════════════════════════════════════════

const SunTopLeft = () => {
  const opacity = useSharedValue(0.3);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#d4c097', '#d2af6f80', '#cf9e9240', 'transparent']}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 0 }}  // ⭐ 좌상단에서 시작
        end={{ x: 1, y: 1 }}    // ⭐ 우하단으로
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const SunTopRight = () => {
  const opacity = useSharedValue(0.3);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#d4c097', '#d2af6f80', '#cf9e9240', 'transparent']}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 1, y: 0 }}  // ⭐ 우상단에서 시작
        end={{ x: 0, y: 1 }}    // ⭐ 좌하단으로
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const SunBottomLeft = () => {
  const opacity = useSharedValue(0.3);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#d4c097', '#d2af6f80', '#cf9e9240', 'transparent']}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 1 }}  // ⭐ 좌하단에서 시작
        end={{ x: 1, y: 0 }}    // ⭐ 우상단으로
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const SunBottomRight = () => {
  const opacity = useSharedValue(0.3);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#d4c097', '#d2af6f80', '#cf9e9240', 'transparent']}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 1, y: 1 }}  // ⭐ 우하단에서 시작
        end={{ x: 0, y: 0 }}    // ⭐ 좌상단으로
        style={styles.gradient}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🌌 Aurora Effects (오로라 - 신비로운 보라-파랑 톤)
// ═══════════════════════════════════════════════════════════════════════════

const AuroraTopLeft = () => {
  const opacity = useSharedValue(0.4);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#8b9ed8', '#9d7bb060', '#da9fdd30', 'transparent']} // ⭐ 오로라: 진한 보라-파랑 (태양과 확실히 구분)
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const AuroraTopRight = () => {
  const opacity = useSharedValue(0.4);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#8b9ed8', '#9d7bb060', '#da9fdd30', 'transparent']} // ⭐ 오로라: 진한 보라-파랑
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const AuroraBottomLeft = () => {
  const opacity = useSharedValue(0.4);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#8b9ed8', '#9d7bb060', '#da9fdd30', 'transparent']} // ⭐ 오로라: 진한 보라-파랑
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const AuroraBottomRight = () => {
  const opacity = useSharedValue(0.4);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#8b9ed8', '#9d7bb060', '#da9fdd30', 'transparent']} // ⭐ 오로라: 진한 보라-파랑
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 💡 Neon Effects (네온 라이트 - 화려한 네온 컬러)
// ═══════════════════════════════════════════════════════════════════════════

const NeonTopLeft = () => {
  const opacity = useSharedValue(0.4);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#ff008070', '#cc00ff50', '#00ffcc30', 'transparent']} // ⭐ 네온: 강렬한 핑크-퍼플-시안
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const NeonTopRight = () => {
  const opacity = useSharedValue(0.4);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#ff008070', '#cc00ff50', '#00ffcc30', 'transparent']} // ⭐ 네온: 강렬한 핑크-퍼플-시안
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const NeonBottomLeft = () => {
  const opacity = useSharedValue(0.4);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#ff008070', '#cc00ff50', '#00ffcc30', 'transparent']} // ⭐ 네온: 강렬한 핑크-퍼플-시안
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const NeonBottomRight = () => {
  const opacity = useSharedValue(0.4);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#ff008070', '#cc00ff50', '#00ffcc30', 'transparent']} // ⭐ 네온: 강렬한 핑크-퍼플-시안
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🌈 Gradient Effects (그라디언트 - 부드러운 파스텔 톤)
// ═══════════════════════════════════════════════════════════════════════════

const GradientTopLeft = () => {
  const opacity = useSharedValue(0.35);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#a0d8d870', '#ffb3d960', '#d4b5e040', 'transparent']} // ⭐ 그라디언트: 진한 민트-핑크-라벤더
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const GradientTopRight = () => {
  const opacity = useSharedValue(0.35);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#a0d8d870', '#ffb3d960', '#d4b5e040', 'transparent']} // ⭐ 그라디언트: 진한 민트-핑크-라벤더
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const GradientBottomLeft = () => {
  const opacity = useSharedValue(0.35);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#a0d8d870', '#ffb3d960', '#d4b5e040', 'transparent']} // ⭐ 그라디언트: 진한 민트-핑크-라벤더
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const GradientBottomRight = () => {
  const opacity = useSharedValue(0.35);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, {
      ...(Platform.OS === 'android' ? { top: 0 } : { top: insets.top + verticalScale(70) }),
    }]}>
      <LinearGradient
        colors={['#a0d8d870', '#ffb3d960', '#d4b5e040', 'transparent']} // ⭐ 그라디언트: 진한 민트-핑크-라벤더
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,    // ⭐ CRITICAL FIX: Full screen coverage from top!
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10, // Layer 1: Background

  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

export default React.memo(GiftBackgroundEffect);
