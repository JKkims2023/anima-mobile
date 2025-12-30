/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎭 IdentitySettingsSheet Component (Modal-based)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: AI personality settings (자아 설정)
 * - Speech style (말투 스타일)
 * - Response style (응답 길이)
 * - Advice level (조언 수준)
 * 
 * Design Principles:
 * ✅ Modal-based (for correct z-index above ManagerAIOverlay)
 * ✅ Animated slide-up effect
 * ✅ Clean & intuitive UI
 * ✅ Haptic feedback
 * 
 * @author JK & Hero Nexus AI
 * @date 2025-12-30
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
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
import { SETTING_CATEGORIES } from '../../constants/aiSettings';

const IdentitySettingsSheet = ({
  isOpen,
  onClose,
  settings,
  onUpdateSetting, // (key, value) => Promise<void>
  loading = false,
  saving = false,
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
  
  const handleSettingChange = async (category, optionValue) => {
    HapticService.selection();
    await onUpdateSetting?.(category, optionValue);
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER SETTING SECTION
  // ═══════════════════════════════════════════════════════════════════════
  
  const renderSettingSection = (category, data) => {
    const currentValue = settings?.[category] || data.options[0].value;
    
    return (
      <View key={category} style={styles.section}>
        <View style={styles.sectionHeader}>
          <CustomText size="lg" weight="bold" color={COLORS.TEXT_PRIMARY}>
            {data.icon} {data.title}
          </CustomText>
          <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ marginTop: verticalScale(4) }}>
            {data.description}
          </CustomText>
        </View>
        
        <View style={styles.optionsContainer}>
          {data.options.map((option) => {
            const isSelected = currentValue === option.value;
            
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionChip,
                  isSelected && styles.optionChipSelected,
                ]}
                onPress={() => handleSettingChange(category, option.value)}
                disabled={saving}
              >
                <CustomText
                  size="sm"
                  weight={isSelected ? 'bold' : 'normal'}
                  color={isSelected ? COLORS.BUTTON_TEXT : COLORS.TEXT_SECONDARY}
                >
                  {option.label}
                </CustomText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
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
            <CustomText size="xl" weight="bold" color={COLORS.TEXT_PRIMARY}>
              🎭 자아 설정
            </CustomText>
            <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ marginTop: verticalScale(4) }}>
              AI의 성격과 응답 스타일을 설정하세요
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
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.DEEP_BLUE} />
              <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ marginTop: verticalScale(12) }}>
                불러오는 중...
              </CustomText>
            </View>
          ) : (
            <>
              {renderSettingSection('speech_style', SETTING_CATEGORIES.speech_style)}
              {renderSettingSection('response_style', SETTING_CATEGORIES.response_style)}
              {renderSettingSection('advice_level', SETTING_CATEGORIES.advice_level)}
            </>
          )}
          
          {saving && (
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="small" color={COLORS.DEEP_BLUE} />
              <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ marginLeft: scale(8) }}>
                저장 중...
              </CustomText>
            </View>
          )}
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionHeader: {
    marginBottom: verticalScale(12),
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  optionChip: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.DIVIDER,
  },
  optionChipSelected: {
    backgroundColor: COLORS.DEEP_BLUE,
    borderColor: COLORS.DEEP_BLUE,
  },
  savingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
  },
});

export default IdentitySettingsSheet;
