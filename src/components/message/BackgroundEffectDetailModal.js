/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌌 BackgroundEffectDetailModal - Direction Selection Modal
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Display 4 direction options for selected background effect category
 * - User selects direction to apply the effect
 * - Consistent with ActiveEffect direction selection UX
 * 
 * Architecture:
 * - Step 2 of 2-step selection system
 * - Appears on top of BackgroundEffectCategorySheet
 * - Parent sheet remains visible in background
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16 (Background Effect Revolution)
 */

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

/**
 * BackgroundEffectDetailModal Component
 */
const BackgroundEffectDetailModal = ({
  visible,
  category,
  currentEffectId,
  onSelectEffect,
  onClose,
}) => {
  const { t } = useTranslation();

  // ═══════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════
  const [scaleAnimValue] = useState(new Animated.Value(0.9));
  const [opacityAnimValue] = useState(new Animated.Value(0));

  // ═══════════════════════════════════════════════════════════════════════════
  // Animation: Entrance & Exit
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnimValue, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 100,
        }),
        Animated.timing(opacityAnimValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnimValue.setValue(0.9);
      opacityAnimValue.setValue(0);
    }
  }, [visible, scaleAnimValue, opacityAnimValue]);

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
  // Handler: Effect Selection
  // ═══════════════════════════════════════════════════════════════════════════
  const handleEffectPress = useCallback((effect) => {
    HapticService.selection();
    onSelectEffect(effect.id);
  }, [onSelectEffect]);

  if (!visible || !category) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            opacity: opacityAnimValue,
          },
        ]}
      />

      {/* Centered Modal Container */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.centeredContainer}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ scale: scaleAnimValue }],
                  opacity: opacityAnimValue,
                },
              ]}
            >
              {/* Header */}
              <LinearGradient
                colors={category.colorScheme.gradient}
                style={styles.modalHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <CustomText style={styles.modalHeaderEmoji}>
                  {category.emoji}
                </CustomText>
                <CustomText style={styles.modalHeaderTitle} weight="bold">
                  {category.name}
                </CustomText>
                <CustomText style={styles.modalHeaderSubtitle} weight="light">
                  {t('effects.background.detail_modal.subtitle', '빛의 방향을 선택하세요')}
                </CustomText>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <CustomText style={styles.closeButtonText}>✕</CustomText>
                </TouchableOpacity>
              </LinearGradient>

              {/* Effects Grid */}
              <View style={styles.effectsListContainer}>
                <ScrollView
                  style={styles.effectsList}
                  contentContainerStyle={styles.effectsListContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.effectsGrid}>
                    {category.effects.map((effect) => {
                      const isSelected = currentEffectId === effect.id;
                      
                      return (
                        <TouchableOpacity
                          key={effect.id}
                          style={[
                            styles.effectItem,
                            isSelected && styles.effectItemSelected,
                          ]}
                          onPress={() => handleEffectPress(effect)}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={
                              isSelected
                                ? [category.colorScheme.gradient[0] + '40', category.colorScheme.gradient[1] + '20']
                                : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                            }
                            style={styles.effectGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            {/* Emoji */}
                            <CustomText style={styles.effectEmoji}>
                              {effect.emoji}
                            </CustomText>

                            {/* Label */}
                            <CustomText style={styles.effectLabel} weight="bold">
                              {effect.label}
                            </CustomText>

                            {/* Description */}
                            <CustomText style={styles.effectDescription}>
                              {effect.description}
                            </CustomText>

                            {/* Selected Border */}
                            {isSelected && (
                              <View
                                style={[
                                  styles.selectedBorder,
                                  { borderColor: category.colorScheme.border },
                                ]}
                              />
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  centeredContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxHeight: height * 0.6,
    backgroundColor: '#1A1A1A',
    borderRadius: scale(24),
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    paddingTop: verticalScale(24),
    paddingBottom: verticalScale(20),
    paddingHorizontal: scale(24),
    alignItems: 'center',
  },
  modalHeaderEmoji: {
    fontSize: scale(48),
    marginBottom: verticalScale(12),
  },
  modalHeaderTitle: {
    fontSize: scale(20),
    color: '#FFFFFF',
    marginBottom: verticalScale(6),
    textAlign: 'center',
  },
  modalHeaderSubtitle: {
    fontSize: scale(14),
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: verticalScale(16),
    right: scale(16),
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: scale(20),
    color: '#FFFFFF',
  },
  effectsListContainer: {
    height: height * 0.6 - verticalScale(160), // Header height excluded
  },
  effectsList: {
    flex: 1,
  },
  effectsListContent: {
    padding: scale(16),
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(12),
  },
  effectItem: {
    width: (width * 0.85 - scale(32) - scale(12)) / 2, // 2 columns with gap
    aspectRatio: 1,
    borderRadius: scale(16),
    overflow: 'hidden',
  },
  effectItemSelected: {
    // Selected state is handled by gradient and border
  },
  effectGradient: {
    flex: 1,
    padding: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  effectEmoji: {
    fontSize: scale(32),
    marginBottom: verticalScale(8),
  },
  effectLabel: {
    fontSize: scale(14),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: verticalScale(4),
  },
  effectDescription: {
    fontSize: scale(11),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  selectedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: scale(16),
  },
});

export default React.memo(BackgroundEffectDetailModal);
