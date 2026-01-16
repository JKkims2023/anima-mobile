/**
 * 🎨 EffectSelectionSheet.js
 * 
 * ANIMA Philosophy:
 * - 심플하고 직관적한 이펙트 선택
 * - 감성적인 디자인
 * - 즉시 미리보기
 * - Haptic feedback
 * - Lock 현상 제거 (최적화)
 * 
 * Optimizations:
 * - useMemo for expensive computations
 * - useCallback for event handlers
 * - React.memo for item components
 * - Minimal re-renders
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
  Vibration,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import { ACTIVE_EFFECTS_V2 } from '../../constants/effect-groups-v2';

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
        <CustomText style={styles.effectName} weight="medium">
          {effect.name}
        </CustomText>

        {/* Description */}
        <CustomText style={styles.effectDescription} weight="light">
          {effect.description}
        </CustomText>

        {/* Selected Indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIcon}>✓</Text>
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

const EffectSelectionSheet = ({
  visible,
  onClose,
  currentEffect,
  onSelectEffect,
}) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════
  const [slideAnim] = useState(new Animated.Value(height));

  // ═══════════════════════════════════════════════════════════════════════════
  // Memoized Values
  // ═══════════════════════════════════════════════════════════════════════════

  // 현재 선택된 효과의 ID
  const currentEffectId = useMemo(() => {
    return currentEffect?.id || null;
  }, [currentEffect]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Callbacks
  // ═══════════════════════════════════════════════════════════════════════════

  // 효과 선택 핸들러
  const handleSelectEffect = useCallback(
    (effect) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✨ [EffectSelectionSheet] Effect selected!');
      console.log('   Effect:', effect.name, effect.emoji);
      console.log('   DB Value:', effect.dbValue);
      console.log('   Requires Configuration:', effect.requiresConfiguration);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 즉시 적용
      onSelectEffect(effect);

      // ⭐ Special: 설정이 필요한 효과는 즉시 닫지 않음 (단어 입력 후 닫힘)
      if (effect.requiresConfiguration) {
        console.log('   ⚙️ Requires configuration - keeping sheet open');
        // 바텀시트는 열린 상태 유지 → 단어 입력 후 수동으로 닫음
        return;
      }

      // 일반 효과: 300ms 후 자동 닫힘
      setTimeout(() => {
        onClose();
      }, 300);
    },
    [onSelectEffect, onClose]
  );

  // 없음 선택 핸들러
  const handleSelectNone = useCallback(() => {
    console.log('✨ [EffectSelectionSheet] None selected');
    Vibration.vibrate(10);
    onSelectEffect(null);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onSelectEffect, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════════════════════

  // Slide animation
  React.useEffect(() => {
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
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={10}
        />
      </TouchableOpacity>

      {/* Bottom Sheet */}
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
          
          <CustomText style={styles.title} weight="bold">
            ✨ 효과 선택
          </CustomText>
          
          <CustomText style={styles.subtitle} weight="light">
            메시지를 더욱 특별하게 만들어보세요
          </CustomText>
        </View>

        {/* Effects Grid */}
        <View style={styles.effectsContainer}>
          {ACTIVE_EFFECTS_V2.map((effect) => (
            <EffectItem
              key={effect.id}
              effect={effect}
              isSelected={currentEffectId === effect.id}
              onSelect={handleSelectEffect}
            />
          ))}

          {/* None Option */}
          <TouchableOpacity
            style={[
              styles.effectItem,
              styles.noneItem,
              !currentEffectId && styles.effectItemSelected,
            ]}
            onPress={handleSelectNone}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={
                !currentEffectId
                  ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']
                  : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
              }
              style={styles.effectItemGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.effectEmoji}>✕</Text>
              <CustomText style={styles.effectName} weight="medium">
                없음
              </CustomText>
              <CustomText style={styles.effectDescription} weight="light">
                효과를 사용하지 않습니다
              </CustomText>
              {!currentEffectId && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIcon}>✓</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <CustomText style={styles.closeButtonText} weight="medium">
            닫기
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
    maxHeight: height * 0.85,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  effectsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  effectItem: {
    width: (width - 48) / 2,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  effectItemSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  effectItemGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  effectEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  effectName: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  effectDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: {
    fontSize: 14,
    color: '#000000',
    fontWeight: 'bold',
  },
  noneItem: {
    // Same as effectItem
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

export default React.memo(EffectSelectionSheet);
