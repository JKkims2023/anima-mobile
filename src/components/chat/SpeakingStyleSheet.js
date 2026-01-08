/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💬 SpeakingStyleSheet Component (Modal-based)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Allow users to select persona's speaking style
 * 
 * Design: IdentitySettingsSheet 스타일 재사용
 * 
 * Features:
 * ✅ Modal-based (correct z-index)
 * ✅ Option chip UI
 * ✅ Haptic feedback
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-08
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from '../CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

/**
 * 💬 말투 선택 옵션
 */
const SPEAKING_STYLES = [
  { id: 'friendly', name: '친근한 반말', emoji: '😊', description: '편하고 친근하게 대화해요' },
  { id: 'polite', name: '부드러운 존댓말', emoji: '🙏', description: '부드럽고 정중하게 대화해요' },
  { id: 'cute', name: '귀여운 말투', emoji: '🥰', description: '사랑스럽고 귀엽게 대화해요' },
  { id: 'cool', name: '쿨한 말투', emoji: '😎', description: '시크하고 멋있게 대화해요' },
  { id: 'professional', name: '전문적인 말투', emoji: '💼', description: '격식있고 전문적으로 대화해요' },
];

const SpeakingStyleSheet = ({
  isOpen,
  onClose,
  currentStyle = '',
  onSelect, // (styleId) => void
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATION EFFECTS
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1000,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleClose = () => {
    HapticService.light();
    onClose?.();
  };
  
  const handleSelect = (styleId) => {
    HapticService.success();
    onSelect?.(styleId);
    
    // Auto-close after selection
    setTimeout(() => {
      handleClose();
    }, 300);
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  
  if (!isOpen) return null;
  
  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View 
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0,0,0,0.7)',
              opacity: backdropOpacity,
            }
          ]} 
        />
      </TouchableOpacity>
      
      {/* Modal Container */}
      <Animated.View 
        style={[
          styles.modalContainer,
          {
            paddingBottom: insets.bottom + verticalScale(20),
            transform: [{ translateY: slideAnim }],
          },
        ]}
        onStartShouldSetResponder={() => true}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <CustomText type="title" bold color={COLORS.TEXT_PRIMARY}>
              💬 말투 선택
            </CustomText>
            <CustomText type="small" color={COLORS.TEXT_SECONDARY} style={{ marginTop: verticalScale(4) }}>
              페르소나가 어떻게 대화하길 원하나요?
            </CustomText>
          </View>
          
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={scale(24)} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.optionsContainer}>
            {SPEAKING_STYLES.map((style) => {
              const isSelected = currentStyle === style.id;
              
              return (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => handleSelect(style.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionHeader}>
                    <CustomText type="huge" style={styles.optionEmoji}>
                      {style.emoji}
                    </CustomText>
                    {isSelected && (
                      <Icon name="check-circle" size={moderateScale(24)} color={COLORS.DEEP_BLUE} />
                    )}
                  </View>
                  <CustomText
                    type="middle"
                    bold
                    color={isSelected ? COLORS.DEEP_BLUE : COLORS.TEXT_PRIMARY}
                    style={styles.optionName}
                  >
                    {style.name}
                  </CustomText>
                  <CustomText
                    type="small"
                    color={COLORS.TEXT_SECONDARY}
                    style={styles.optionDescription}
                  >
                    {style.description}
                  </CustomText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(12),
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: COLORS.TEXT_TERTIARY,
    borderRadius: moderateScale(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20),
  },
  optionsContainer: {
    gap: scale(12),
  },
  optionCard: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: moderateScale(16),
    borderWidth: 2,
    borderColor: COLORS.DIVIDER,
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
  },
  optionCardSelected: {
    borderColor: COLORS.DEEP_BLUE,
    backgroundColor: COLORS.DEEP_BLUE + '10',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  optionEmoji: {
    fontSize: moderateScale(40),
  },
  optionName: {
    marginBottom: verticalScale(4),
  },
  optionDescription: {
    lineHeight: moderateScale(18),
  },
});

export default SpeakingStyleSheet;

