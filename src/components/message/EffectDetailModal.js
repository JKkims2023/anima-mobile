/**
 * 🎨 EffectDetailModal.js - Step 2: 상세 효과 선택
 * 
 * ANIMA Philosophy:
 * - 카테고리 내 효과 선택
 * - 깔끔한 내부 모달
 * - 즉시 미리보기
 * - Haptic feedback
 * 
 * JK님 제안:
 * "카테고리 선택 후 내부 모달로 상세 효과 선택!"
 * "텍스트 효과와 통일된 UX 패턴!"
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Vibration,
  ScrollView,
  BackHandler,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale } from '../../utils/responsive-utils';

const { width, height } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Effect Item Component (Memoized)
// ═══════════════════════════════════════════════════════════════════════════

const EffectItem = React.memo(({ effect, isSelected, onSelect }) => {
  const handlePress = useCallback(() => {
    // Haptic feedback
    Vibration.vibrate(10);
    onSelect(effect);
  }, [effect, onSelect]);

  return (
    <TouchableOpacity
      style={[
        styles.effectItem,
        isSelected && styles.effectItemSelected,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={
          isSelected
            ? effect.colorScheme.gradient
            : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
        }
        style={styles.effectItemGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Emoji */}
        <Text style={styles.effectEmoji}>{effect.emoji}</Text>

        {/* Name */}
        <CustomText style={styles.effectName} type='normal'>
          {effect.name}
        </CustomText>

        {/* Description */}
        <CustomText style={styles.effectDescription} weight="light">
          {effect.description}
        </CustomText>

        {/* New Badge */}
        {effect.isNew && (
          <View style={styles.newBadge}>
            <CustomText style={styles.newBadgeText} weight="bold">
              NEW
            </CustomText>
          </View>
        )}

        {/* Selected Indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Icon name="check-circle" size={24} color="#FFFFFF" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
});

EffectItem.displayName = 'EffectItem';

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Main Component
// ═══════════════════════════════════════════════════════════════════════════

const EffectDetailModal = ({
  visible,
  onClose,
  category,
  currentEffect,
  onSelectEffect,
}) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [opacityAnim] = useState(new Animated.Value(0));

  // ═══════════════════════════════════════════════════════════════════════════
  // Memoized Values
  // ═══════════════════════════════════════════════════════════════════════════

  const currentEffectId = React.useMemo(() => {
    return currentEffect?.id || null;
  }, [currentEffect]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Callbacks
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSelectEffect = useCallback(
    (effect) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎨 [EffectDetailModal] Effect selected!');
      console.log('   Effect:', effect.name, effect.emoji);
      console.log('   DB Value:', effect.dbValue);
      console.log('   Requires Configuration:', effect.requiresConfiguration);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 즉시 적용
      onSelectEffect(effect);

      // ⭐ 설정이 필요한 효과는 모달을 닫지 않음 (단어 입력 후 자동 닫힘)
      if (effect.requiresConfiguration) {
        console.log('   ⚙️ Requires configuration - keeping modal open');
        return;
      }

      // 일반 효과: 300ms 후 자동 닫힘
      setTimeout(() => {
        onClose();
      }, 300);
    },
    [onSelectEffect, onClose]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════════════════════

  // Modal animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 100,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  // 🔧 FIX: BackHandler for Android
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🔙 [EffectDetailModal] Back button pressed');
      onClose();
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  // 🔍 DEBUG: Log render state
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 [EffectDetailModal] Render check (AbsoluteView)');
  console.log('   visible:', visible);
  console.log('   category:', category?.name || 'null');
  console.log('   Will render:', !(!visible || !category));
  console.log('   Platform:', Platform.OS);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!visible || !category) return null;

  return (
    <View 
      style={styles.absoluteOverlay}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            opacity: opacityAnim,
          },
        ]}
      />

      {/* Centered Container with backdrop touch */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.centeredContainer}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
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
          <View style={styles.modalHeaderContent}>
          <CustomText style={styles.modalHeaderTitle} weight="bold">
            {category.name}
          </CustomText>
          <CustomText style={styles.modalHeaderSubtitle} weight="light">
            원하는 효과를 선택하세요
          </CustomText>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Effects List */}
        <View style={styles.effectsListContainer}>
          <ScrollView
            style={styles.effectsList}
            contentContainerStyle={styles.effectsListContent}
            showsVerticalScrollIndicator={false}
          >
            {category.effects.map((effect) => (
              <EffectItem
                key={effect.id}
                effect={effect}
                isSelected={currentEffectId === effect.id}
                onSelect={handleSelectEffect}
              />
            ))}
          </ScrollView>
        </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ✅ iOS FIX: AbsoluteView overlay (not Modal, works with closed parent Modal)
  absoluteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999, // ✅ Maximum zIndex
    elevation: 999, // ✅ Android elevation
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxHeight: height * 0.6,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'column', // 🔧 FIX: Explicit column layout
  },
  modalHeader: {
    
    alignItems: 'center',
    
  },
  modalHeaderEmoji: {
    fontSize: scale(22),
    marginBottom: verticalScale(12),
    display: 'none',
  },
  modalHeaderTitle: {
    fontSize: scale(16),
    color: '#FFFFFF',

    textAlign: 'center',
  },
  modalHeaderSubtitle: {
    fontSize: scale(14),
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    display: 'none',
  },
  modalHeaderContent: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? verticalScale(20) : verticalScale(15),
    paddingHorizontal: scale(24),
  },
  modalCloseButton: {

    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  // 🔧 FIX: ScrollView container with explicit height
  effectsListContainer: {
    height: height * 0.6 - 160, // Header 높이 제외
  },
  effectsList: {
    flex: 1,
  },
  effectsListContent: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',

  },
  effectItem: {
    width: (width * 0.85 - 48) / 2, // 2-column grid
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  effectItemSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  effectItemGradient: {

    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(95),
    borderRadius: scale(16),
  },
  effectEmoji: {
    fontSize: scale(22),
    marginBottom: verticalScale(8),
  },
  effectName: {
    fontSize: scale(14),
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  effectDescription: {
    fontSize: scale(11),
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    display: 'none',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FF6B9D',
    display: 'none',
  },
  newBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
});

export default React.memo(EffectDetailModal);
