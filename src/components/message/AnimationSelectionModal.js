/**
 * 🎬 AnimationSelectionModal.js - 로티 애니메이션 선택 모달
 * 
 * ANIMA Philosophy:
 * - UserMusicListModal과 동일한 디자인 언어
 * - 9개의 로티 애니메이션 중 선택
 * - 선택 시 즉시 적용 (무한 반복 재생)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-27
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  BackHandler,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Animation List (9 Lottie Animations)
// ═══════════════════════════════════════════════════════════════════════════

const ANIMATIONS = [
  {
    id: 'birthday_cupcake',
    name: '생일 케이크',
    emoji: '🎂',
    description: '생일 축하 케이크 애니메이션',
    dbValue: 'birthday_cupcake',
  },
  {
    id: 'cheers_toast',
    name: '건배',
    emoji: '🍻',
    description: '축하의 건배 애니메이션',
    dbValue: 'cheers_toast',
  },
  {
    id: 'confetti_lottie',
    name: '색종이',
    emoji: '🎉',
    description: '알록달록 색종이 축하',
    dbValue: 'confetti_lottie',
  },
  {
    id: 'fiery_passion',
    name: '불타는 열정',
    emoji: '🔥',
    description: '뜨거운 열정의 불꽃',
    dbValue: 'fiery_passion',
  },
  {
    id: 'food_beverage',
    name: '음식 & 음료',
    emoji: '🍽️',
    description: '맛있는 음식과 음료',
    dbValue: 'food_beverage',
  },
  {
    id: 'love_hearts_lottie',
    name: '사랑의 하트',
    emoji: '💕',
    description: '사랑스러운 하트 애니메이션',
    dbValue: 'love_hearts_lottie',
  },
  {
    id: 'mug_beer',
    name: '맥주',
    emoji: '🍺',
    description: '시원한 맥주',
    dbValue: 'mug_beer',
  },
  {
    id: 'sushi',
    name: '초밥',
    emoji: '🍣',
    description: '신선한 초밥',
    dbValue: 'sushi',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Animation Item Component (Memoized)
// ═══════════════════════════════════════════════════════════════════════════

const AnimationItem = React.memo(({ animation, isSelected, onSelect }) => {
  const handlePress = useCallback(() => {
    HapticService.light();
    onSelect(animation);
  }, [animation, onSelect]);

  return (
    <TouchableOpacity
      style={[styles.animationItem, isSelected && styles.animationItemSelected]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.animationItemContent}>
        {/* Icon */}
        <View style={styles.animationIcon}>
          <CustomText style={styles.animationEmoji}>{animation.emoji}</CustomText>
        </View>

        {/* Title & Description */}
        <View style={styles.animationInfo}>
          <CustomText style={styles.animationTitle} weight="medium" numberOfLines={1}>
            {animation.name}
          </CustomText>
          <CustomText style={styles.animationDescription} weight="light" numberOfLines={1}>
            {animation.description}
          </CustomText>
        </View>

        {/* Selection Indicator */}
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Icon name="check-circle" size={scale(20)} color="#4CAF50" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

AnimationItem.displayName = 'AnimationItem';

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Main Component
// ═══════════════════════════════════════════════════════════════════════════

const AnimationSelectionModal = ({ visible, onClose, onSelectAnimation, currentAnimation }) => {
  const { t } = useTranslation();

  // ═══════════════════════════════════════════════════════════════════════════
  // Reanimated Shared Values (✅ react-native-reanimated 사용)
  // ═══════════════════════════════════════════════════════════════════════════
  const scale_info = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSelectAnimation = useCallback(
    (animation) => {
      HapticService.success();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎬 [AnimationSelectionModal] Animation selected:');
      console.log('   Name:', animation.name);
      console.log('   DB Value:', animation.dbValue);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      onSelectAnimation(animation);
      handleClose();
    },
    [onSelectAnimation]
  );

  const handleClose = useCallback(() => {
    HapticService.light();
    scale_info.value = withTiming(0.8, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onClose)(); // ✅ UI 쓰레드 → JS 쓰레드로 전환
      }
    });
  }, [onClose, scale_info, opacity]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════════════════════

  // Entrance animation
  useEffect(() => {
    if (visible) {
      scale_info.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [visible, scale_info, opacity]);

  // Back button handler
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, handleClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Animated Styles (✅ useAnimatedStyle 사용)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  const modalContentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale_info.value }],
    opacity: opacity.value,
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* Modal Container */}
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.modalContent, modalContentStyle]}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <CustomText style={styles.title} weight="bold">
                  🎬 애니메이션 선택
                </CustomText>
                <CustomText style={styles.subtitle} weight="light">
                  무한 반복 재생되는 로티 애니메이션
                </CustomText>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
                <Icon name="close" size={scale(24)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Animation List */}
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {ANIMATIONS.map((animation) => (
                <AnimationItem
                  key={animation.id}
                  animation={animation}
                  isSelected={currentAnimation === animation.dbValue}
                  onSelect={handleSelectAnimation}
                />
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <CustomText style={styles.footerText} weight="light">
                총 {ANIMATIONS.length}개의 애니메이션
              </CustomText>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    borderRadius: scale(20),
    overflow: 'hidden',
  },
  gradientContainer: {
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: scale(20),
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  subtitle: {
    fontSize: scale(13),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  closeButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(12),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(16),
  },
  animationItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(12),
    marginBottom: verticalScale(12),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  animationItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  animationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
  },
  animationIcon: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(16),
  },
  animationEmoji: {
    fontSize: scale(24),
  },
  animationInfo: {
    flex: 1,
  },
  animationTitle: {
    fontSize: scale(16),
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  animationDescription: {
    fontSize: scale(13),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  selectedBadge: {
    marginLeft: scale(12),
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: scale(13),
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default AnimationSelectionModal;
