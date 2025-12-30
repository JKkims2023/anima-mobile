/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎭 IdentitySettingsSheet Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: AI personality settings (자아 설정)
 * - Speech style (말투 스타일)
 * - Response style (응답 길이)
 * - Advice level (조언 수준)
 * 
 * Design Principles:
 * ✅ Bottom sheet based (not panel)
 * ✅ Consistent with ChoicePersonaSheet pattern
 * ✅ Clean & intuitive UI
 * ✅ Haptic feedback
 * 
 * @author JK & Hero Nexus AI
 * @date 2025-12-30
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';
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
  const bottomSheetRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════
  // HANDLE OPEN/CLOSE
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isOpen]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  
  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      snapPoints={['70%']}
      onDismiss={onClose}
      enablePanDownToClose={true}
    >
      <View style={styles.container}>
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
            onPress={() => {
              HapticService.light();
              onClose?.();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={scale(24)} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
        
        {/* Loading */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <CustomText size="sm" color={COLORS.TEXT_SECONDARY}>
              설정 불러오는 중...
            </CustomText>
          </View>
        ) : (
          <>
            {/* Scroll Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {SETTING_CATEGORIES.map((category) => (
                <View key={category.key} style={styles.section}>
                  <CustomText size="md" weight="semibold" color={COLORS.TEXT_PRIMARY} style={styles.sectionTitle}>
                    {category.title}
                  </CustomText>
                  
                  <View style={styles.optionsContainer}>
                    {category.options.map((option) => {
                      const isSelected = settings[category.key] === option.id;
                      return (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.optionCard,
                            isSelected && styles.optionCardSelected,
                          ]}
                          onPress={() => {
                            HapticService.light();
                            onUpdateSetting?.(category.key, option.id);
                          }}
                          disabled={saving}
                          activeOpacity={0.7}
                        >
                          <View style={styles.optionContent}>
                            <CustomText style={styles.optionEmoji}>
                              {option.emoji}
                            </CustomText>
                            <CustomText
                              size="sm"
                              weight={isSelected ? 'semibold' : 'normal'}
                              color={isSelected ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY}
                            >
                              {option.name}
                            </CustomText>
                          </View>
                          {isSelected && (
                            <Icon name="check-circle" size={scale(20)} color={COLORS.PRIMARY} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              
              {/* Saving Indicator */}
              {saving && (
                <View style={styles.savingContainer}>
                  <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                  <CustomText size="sm" color={COLORS.PRIMARY}>
                    저장 중...
                  </CustomText>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: platformPadding(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(12),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(20),
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    marginBottom: verticalScale(12),
  },
  optionsContainer: {
    gap: moderateScale(10),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(12),
    paddingHorizontal: platformPadding(16),
    paddingVertical: verticalScale(14),
  },
  optionCardSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  optionEmoji: {
    fontSize: moderateScale(20),
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    gap: moderateScale(8),
  },
});

export default IdentitySettingsSheet;

