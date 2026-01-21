/**
 * 🎨 EffectCategorySheet.js - Step 1: 카테고리 선택
 * 
 * ANIMA Philosophy:
 * - 4개 카테고리로 단순화 (떨어짐, 반짝임, 텍스트, 없음)
 * - 직관적인 그룹화
 * - 2단계 선택의 첫 단계
 * - 통일된 UX 패턴
 * 
 * JK님 제안:
 * "사용자가 카테고리만 봐도 어떤 효과인지 예측 가능!"
 * "떨어지는 것들, 반짝이는 것들 → 명확한 그룹!"
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
  Vibration,
  BackHandler,
  Platform
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import { EFFECT_CATEGORIES } from '../../constants/effect-categories';
import { useTranslation } from 'react-i18next';
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';

const { width, height } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Category Item Component (Memoized)
// ═══════════════════════════════════════════════════════════════════════════

const CategoryItem = React.memo(({ category, onSelect }) => {
  
  const { t } = useTranslation();
  const handlePress = useCallback(() => {
    // Haptic feedback
    Vibration.vibrate(10);
    onSelect(category);
  }, [category, onSelect]);

  return (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={handlePress}
      activeOpacity={0.7}
      delayPressIn={0}
    >
      <LinearGradient
        colors={category.colorScheme.gradient}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      >
        {/* Emoji */}
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>

        {/* Name */}
        <CustomText style={styles.categoryName} weight="medium">
          {category.id 
           === 'falling' ? t('message.creation.effect_category.falling_title') : 
           category.id === 'sparkle' ? t('message.creation.effect_category.sparkle_title') : 
           category.id === 'text' ? t('message.creation.effect_category.text_title') : 
           category.id === 'none' ? t('message.creation.effect_category.none_title') : 
           category.name
          }
        </CustomText>

        {/* Description */}
        <CustomText style={styles.categoryDescription} weight="light">
          {category.description}
        </CustomText>

        {/* Effect Count (카테고리에 포함된 효과 수) */}
        {category.effects.length > 0 && (
          <View style={styles.effectCountBadge}>
            <CustomText style={styles.effectCountText} weight="bold">
              {category.effects.length}
            </CustomText>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
});

CategoryItem.displayName = 'CategoryItem';

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Main Component
// ═══════════════════════════════════════════════════════════════════════════

const EffectCategorySheet = ({
  visible,
  onClose,
  onSelectCategory,
}) => {

  const { t } = useTranslation();
  // ═══════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════
  const [slideAnim] = useState(new Animated.Value(height));

  // ═══════════════════════════════════════════════════════════════════════════
  // Callbacks
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSelectCategory = useCallback(
    (category) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎨 [EffectCategorySheet] Category selected!');
      console.log('   Category:', category.name, category.emoji);
      console.log('   Type:', category.type);
      console.log('   Effects count:', category.effects.length);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      onSelectCategory(category);
    },
    [onSelectCategory]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════════════════════

  // Slide animation
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 100,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // 🔧 FIX: BackHandler for Android
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🔙 [EffectCategorySheet] Back button pressed');
      onClose();
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop with BlurView */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="black"
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Bottom Sheet (separate from backdrop) */}
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handleBar} />

          <CustomText type="title" style={styles.title} bold>
            {t('message.creation.effect_category.title')}
          </CustomText>
        </View>

        {/* Categories Grid (2x2) */}
        <View style={styles.categoriesContainer}>
          {EFFECT_CATEGORIES.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onSelect={handleSelectCategory}
            />
          ))}
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <CustomText style={styles.closeButtonText} weight="medium">
            {t('common.close', '닫기')}
          </CustomText>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent', // ✅ Transparent to allow BlurView to show
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 157, 0.15)', // ✨ ANIMA: Pink tint border
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
    maxHeight: height * 0.7,
    backgroundColor: Platform.OS === 'ios' 
    ? 'rgba(26, 26, 26, 0.65)' // ✨ iOS: Semi-transparent for BlurView
    : 'rgba(26, 26, 26, 0.55)', // ✨ Android: Slightly more opaque
  elevation: 50, // ✅ Android elevation (그림자 + z-order)
  },
  header: {
    paddingTop: verticalScale(15),
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    display: 'none',
  },
  title: {

    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    display: 'none',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: (width - 48) / 2, // 2-column grid
    marginBottom: 12,
    borderRadius: Platform.OS === 'ios' ? platformPadding(300) : platformPadding(20),
    overflow: 'hidden',
  },
  categoryGradient: {
    padding: platformPadding(20),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: platformPadding(160),
    borderRadius: Platform.OS === 'ios' ? platformPadding(20) : platformPadding(20),
  },
  categoryEmoji: {
    fontSize: scale(28),
    marginBottom: platformPadding(12),
    marginRight: Platform.OS === 'ios' ? platformPadding(40) : platformPadding(0),
  },
  categoryName: {
    fontSize: scale(16),
    color: '#FFFFFF',
    marginBottom: Platform.OS === 'ios' ? platformPadding(36) : platformPadding(6),
    marginRight: Platform.OS === 'ios' ? platformPadding(40) : platformPadding(0),
    
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: scale(12),
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    display: 'none',
  },
  effectCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectCountText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  closeButton: {
    marginTop: 16,
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default React.memo(EffectCategorySheet);
