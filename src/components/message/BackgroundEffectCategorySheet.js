/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌌 BackgroundEffectCategorySheet - Parent Bottom Sheet for Background Effects
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Display 4 main background effect categories (Sun, Aurora, Neon, Gradient)
 * - User selects category to open direction selection modal
 * - Consistent with ActiveEffect 2-step selection UX
 * 
 * Architecture:
 * - Step 1: Select category (this component)
 * - Step 2: Select direction (BackgroundEffectDetailModal)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16 (Background Effect Revolution)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  BackHandler,
  Modal,
  Animated,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { BACKGROUND_EFFECT_CATEGORIES } from '../../constants/background-effect-categories';
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

/**
 * BackgroundEffectCategorySheet Component
 */
const BackgroundEffectCategorySheet = ({ 
  visible, 
  currentEffect,
  onSelectCategory, 
  onClose 
}) => {
  const { t } = useTranslation();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════
  const [slideAnim] = useState(new Animated.Value(height));

  // ═══════════════════════════════════════════════════════════════════════════
  // Slide Animation
  // ═══════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Android Back Button Handler
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Category Selection
  // ═══════════════════════════════════════════════════════════════════════════
  const handleCategoryPress = useCallback((category) => {
    HapticService.selection();
    
    // If "none" is selected, apply immediately
    if (category.id === 'none') {
      onSelectCategory(category);
      onClose();
      return;
    }
    
    // Otherwise, open direction selection modal
    onSelectCategory(category);
  }, [onSelectCategory, onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} pointerEvents="box-none">
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={10}
            pointerEvents="none"
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Bottom Sheet */}
      <Animated.View 
        style={[
          styles.sheetContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >

          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <CustomText style={styles.headerTitle} weight="bold">
              {t('effects.background.category_sheet.title', '🌌 백그라운드 효과')}
            </CustomText>
            <CustomText style={styles.headerSubtitle}>
              {t('effects.background.category_sheet.subtitle', '화면에 감성적인 빛을 더해보세요')}
            </CustomText>
          </View>

          {/* Categories Grid */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {BACKGROUND_EFFECT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={category.colorScheme.gradient}
                    style={styles.categoryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {/* Emoji */}
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>

                    {/* Name */}
                    <CustomText style={styles.categoryName} weight="bold">
                      {category.name}
                    </CustomText>

                    {/* Description */}
                    <CustomText style={styles.categoryDescription}>
                      {category.description}
                    </CustomText>

                    {/* Effect Count Badge (except for "none") */}
                    {category.id !== 'none' && (
                      <View style={styles.countBadge}>
                        <CustomText style={styles.countBadgeText} weight="bold">
                          {category.effects.length}
                        </CustomText>
                      </View>
                    )}

                    {/* Border for selected category */}
                    {currentEffect && currentEffect.startsWith(category.id) && category.id !== 'none' && (
                      <View style={[styles.selectedBorder, { borderColor: category.colorScheme.border }]} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Close Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <CustomText style={styles.closeButtonText} weight="bold">
                {t('common.close', '닫기')}
              </CustomText>
            </TouchableOpacity>
          </View>

      </Animated.View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
    maxHeight: height * 0.7,
  },
  blurContainer: {
    flex: 1,

  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: scale(2),
  },
  header: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(16),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: verticalScale(16),
  },
  headerTitle: {
    fontSize: scale(20),
    color: '#FFFFFF',
    marginBottom: verticalScale(6),
  },
  headerSubtitle: {
    fontSize: scale(14),
    color: 'rgba(255, 255, 255, 0.7)',
    display: 'none',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(12),
  },
  categoryCard: {
    width: (width - scale(32) - scale(12)) / 2, // 2 columns with gap
    aspectRatio: 1,
    borderRadius: scale(16),
    overflow: 'hidden',
  },
  categoryGradient: {
    flex: 1,
    padding: scale(16),
    alignItems: 'center',
  },
  categoryEmojiContainer: {
    marginBottom: verticalScale(8),

  },
  categoryEmoji: {
    fontSize: 48,
    marginBottom: verticalScale(6),

  },
  categoryName: {
    fontSize: scale(16),
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(4),
  },
  categoryDescription: {
    fontSize: scale(12),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    display: 'none',
  },
  countBadge: {
    position: 'absolute',
    top: scale(12),
    right: scale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    minWidth: scale(24),
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: scale(12),
    color: '#FFFFFF',
  },
  selectedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderRadius: scale(16),
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(20),
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: scale(16),
    color: '#FFFFFF',
  },
});

export default React.memo(BackgroundEffectCategorySheet);
