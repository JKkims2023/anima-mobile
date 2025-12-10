/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏷️ CategorySelectionSheet - Persona Category Selection
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - 12개 카테고리 선택
 * - 이모지 + 라벨
 * - 현재 선택된 카테고리 표시
 * - 선택 시 즉시 적용
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-07
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';

// ═══════════════════════════════════════════════════════════════════════
// CATEGORIES (12 types)
// ═══════════════════════════════════════════════════════════════════════
const CATEGORIES = [
  { key: 'normal', emoji: '😊', label: 'category_type.normal' },
  { key: 'thanks', emoji: '🙏', label: 'category_type.thanks' },
  { key: 'apologize', emoji: '😢', label: 'category_type.apologize' },
  { key: 'hope', emoji: '✨', label: 'category_type.hope' },
  { key: 'cheer_up', emoji: '💪', label: 'category_type.cheer_up' },
  { key: 'congrats', emoji: '🎉', label: 'category_type.congrats' },
//  { key: 'birthday', emoji: '🎂', label: 'category_type.birthday' },
//  { key: 'christmas', emoji: '🎄', label: 'category_type.christmas' },
//  { key: 'new_year', emoji: '🎊', label: 'category_type.new_year' },
  { key: 'romantic', emoji: '💕', label: 'category_type.romantic' },
  { key: 'comfort', emoji: '🤗', label: 'category_type.comfort' },
  { key: 'sadness', emoji: '😔', label: 'category_type.sadness' },
];

const CategorySelectionSheet = ({
  isOpen = false,
  currentCategory = 'normal',
  onClose,
  onSelectCategory,
}) => {
  const { t } = useTranslation();
  const { currentTheme: theme } = useTheme();
  const bottomSheetRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // CONTROL BOTTOM SHEET WITH isOpen PROP
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏷️ [CategorySelectionSheet] useEffect triggered');
    console.log('isOpen:', isOpen);
    console.log('currentCategory:', currentCategory);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (isOpen && bottomSheetRef.current) {
      console.log('✅ [CategorySelectionSheet] Calling present()');
      bottomSheetRef.current.present();
    } else if (!isOpen && bottomSheetRef.current) {
      console.log('❌ [CategorySelectionSheet] Calling dismiss()');
      bottomSheetRef.current.dismiss();
    }
  }, [isOpen, currentCategory]);

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleCategorySelect = (category) => {
    console.log('🏷️ [CategorySelectionSheet] Category selected:', category.key);
    HapticService.selection();
    onSelectCategory?.(category.key);
    // ⚠️ Don't close here - parent will close after API success
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Category Chip
  // ═══════════════════════════════════════════════════════════════════════

  const renderCategoryChip = (category) => {
    const isSelected = category.key === currentCategory;

    return (
      <TouchableOpacity
        key={category.key}
        style={[
          styles.categoryChip,
          {
            backgroundColor: isSelected ? theme.mainColor : theme.bgSecondary,
            borderColor: isSelected ? theme.mainColor : theme.borderColor,
          },
        ]}
        onPress={() => handleCategorySelect(category)}
        activeOpacity={0.7}
      >
        <CustomText type="big" style={styles.categoryEmoji}>
          {category.emoji}
        </CustomText>
        <CustomText
          type="normal"
          bold={isSelected}
          style={{
            color: isSelected ? '#FFFFFF' : theme.textPrimary,
          }}
        >
          {t(category.label)}
        </CustomText>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Icon name="check-circle" size={moderateScale(16)} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      isOpen={isOpen}
      onClose={onClose}
      title={t('persona.category.title')}
      snapPoints={['70%']}
      buttons={[
        {
          title: t('common.close'),
          type: 'outline',
          onPress: onClose,
        },
      ]}
    >
      <View
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Category */}
        <View style={[styles.currentCategoryCard, { backgroundColor: theme.bgSecondary, display: 'none' }]}>
          <CustomText type="small" style={{ color: theme.textSecondary }}>
            {t('persona.category.current')}
          </CustomText>
          <View style={styles.currentCategoryContent}>
            <CustomText type="big" style={styles.categoryEmoji}>
              {CATEGORIES.find(c => c.key === currentCategory)?.emoji || '😊'}
            </CustomText>
            <CustomText type="big" bold style={{ color: theme.textPrimary }}>
              {t(CATEGORIES.find(c => c.key === currentCategory)?.label || 'category_type.normal')}
            </CustomText>
          </View>
        </View>

        {/* Category Grid */}
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map(renderCategoryChip)}
        </View>

        {/* Hint */}
        <View style={[styles.hintCard, { backgroundColor: theme.bgTertiary, display: 'none' }]}>
          <Icon name="information" size={moderateScale(20)} color={theme.textSecondary} />
          <CustomText type="small" style={{ color: theme.textSecondary, flex: 1 }}>
            {t('persona.category.hint')}
          </CustomText>
        </View>
      </View>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },

  contentContainer: {
    paddingHorizontal: platformPadding(0),
    paddingBottom: platformPadding(20),
  },

  // ⭐ Current Category Card
  currentCategoryCard: {
    padding: platformPadding(16),
    borderRadius: scale(12),
    marginBottom: platformPadding(20),
  },

  currentCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginTop: verticalScale(8),
  },

  // ⭐ Categories Grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(12),
  },

  // ⭐ Category Chip
  categoryChip: {
    width: '30%', // 3 columns
    aspectRatio: 1.2,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(6),
    padding: platformPadding(12),
    borderRadius: scale(12),
    borderWidth: 2,
    position: 'relative',
  },

  categoryEmoji: {
    fontSize: moderateScale(28),
  },

  selectedIndicator: {
    position: 'absolute',
    top: scale(6),
    right: scale(6),
  },

  // ⭐ Hint Card
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    padding: platformPadding(12),
    borderRadius: scale(8),
    marginTop: platformPadding(20),
  },
});

export default CategorySelectionSheet;

