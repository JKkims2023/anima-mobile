// GradientOverlay.js

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/**
 * 하단 정보 표시를 위한 그라디언트 오버레이 컴포넌트
 * @param {object} props
 * @param {React.ReactNode} props.children - 오버레이 위에 표시될 컨텐츠 (예: 텍스트)
 * @param {number} [props.height=200] - 그라디언트의 높이
 * @param {string} [props.darkness='0.7'] - 그라디언트의 어두운 정도 (0.0 ~ 1.0)
 * @param {object} [props.style] - LinearGradient 컴포넌트에 적용할 추가 스타일
 * @param {object} [props.containerStyle] - 내부 View 컨테이너에 적용할 추가 스타일
 */
const GradientOverlay = ({ children, height = 200, darkness = '0.7', style, containerStyle }) => {
  // 그라디언트 색상 배열: 위(투명) -> 아래(어두움)
  const gradientColors = [
    'transparent',
    `rgba(0, 0, 0, ${darkness})` 
  ];

  return (
    <LinearGradient
      colors={gradientColors}
      style={[styles.gradient, { height: height }, style]} // ⭐ style prop 적용
      pointerEvents="box-none" // ⭐ CRITICAL: Allow swipe gestures to pass through!
    >
      <View style={[styles.contentContainer, containerStyle]} pointerEvents="box-none">
        {children}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    // 핵심 스타일: 화면 하단에 고정
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end', // 컨텐츠를 아래쪽으로 정렬
  },
  contentContainer: {
    // ⚠️ Default padding removed - controlled by containerStyle prop
    // paddingHorizontal: 20,
    // paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    // paddingTop: 20,

  },
});

export default GradientOverlay;