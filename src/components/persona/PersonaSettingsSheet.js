/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚙️ PersonaSettingsSheet - Persona Settings Bottom Sheet
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - 이름 변경
 * - 카테고리 변경
 * - 영상 전환 (조건부)
 * - 페르소나 삭제
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-07
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnima } from '../../contexts/AnimaContext';
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';

const PersonaSettingsSheet = ({
  isOpen = false,
  persona = null,
  onClose,
  onNameChange,
  onCategoryChange,
  onVideoConvert,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { currentTheme: theme } = useTheme();
  const { showAlert, showToast } = useAnima();
  const bottomSheetRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // CONTROL BOTTOM SHEET WITH isOpen PROP
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 [PersonaSettingsSheet] useEffect triggered');
    console.log('isOpen:', isOpen);
    console.log('bottomSheetRef.current:', bottomSheetRef.current);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (isOpen && bottomSheetRef.current) {
      console.log('✅ [PersonaSettingsSheet] Calling present()');
      bottomSheetRef.current.present();
    } else if (!isOpen && bottomSheetRef.current) {
      console.log('❌ [PersonaSettingsSheet] Calling dismiss()');
      bottomSheetRef.current.dismiss();
    }
  }, [isOpen]);

  // ═══════════════════════════════════════════════════════════════════════
  // VIDEO CONVERSION CONDITION
  // ═══════════════════════════════════════════════════════════════════════
  const canConvertVideo = persona && 
    (persona.selected_dress_video_convert_done === 'N' || 
     persona.selected_dress_video_url === null);

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleNameChange = () => {
    HapticService.light();
    onNameChange?.(persona);
    // ⚠️ Don't close here - close after name change is saved
  };

  const handleCategoryChange = () => {
    HapticService.light();
    onCategoryChange?.(persona);
    // ⚠️ Don't close here - close after category change is saved
  };

  const handleVideoConvert = () => {
    HapticService.light();
    
    if (!canConvertVideo) {
      showToast({
        type: 'warning',
        message: t('persona.settings.video_already_converted'),
        emoji: '✅',
      });
      return;
    }

    showAlert({
      title: t('persona.settings.video_convert_confirm_title'),
      message: t('persona.settings.video_convert_confirm_message'),
      emoji: '🎬',
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          onPress: () => {
            onVideoConvert?.(persona);
            // ⚠️ Don't close here - close after video conversion starts
          },
        },
      ],
    });
  };

  const handleDelete = () => {
    HapticService.warning();
    
    showAlert({
      title: t('persona.settings.delete_confirm_title'),
      message: t('persona.settings.delete_confirm_message', { name: persona?.persona_name }),
      emoji: '⚠️',
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            onDelete?.(persona);
            // ⚠️ Don't close here - close after deletion is complete
          },
        },
      ],
    });
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Setting Item
  // ═══════════════════════════════════════════════════════════════════════

  const renderSettingItem = ({ icon, title, subtitle, onPress, iconColor, disabled = false }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        {
          backgroundColor: theme.bgSecondary,
          borderColor: theme.borderColor,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={disabled ? null : onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={[styles.settingIconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Icon name={icon} size={scale(24)} color={iconColor} />
      </View>
      <View style={styles.settingTextContainer}>
        <CustomText type="body" bold style={{ color: theme.textPrimary }}>
          {title}
        </CustomText>
        {subtitle && (
          <CustomText type="small" style={{ color: theme.textSecondary, marginTop: verticalScale(2) }}>
            {subtitle}
          </CustomText>
        )}
      </View>
      <Icon name="chevron-right" size={scale(20)} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      isOpen={isOpen}
      onClose={onClose}
      title={t('persona.settings.title')}
      snapPoints={['70%']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Persona Info */}
        <View style={[styles.personaInfoCard, { backgroundColor: theme.bgSecondary }]}>
          <CustomText type="big" bold style={{ color: theme.textPrimary }}>
            {persona?.persona_name || t('persona.settings.no_persona')}
          </CustomText>
          <CustomText type="body" style={{ color: theme.textSecondary, marginTop: verticalScale(4) }}>
            {t(`category_type.${persona?.category_type || 'normal'}`)}
          </CustomText>
        </View>

        {/* Settings List */}
        <View style={styles.settingsGroup}>
          {/* 이름 변경 */}
          {renderSettingItem({
            icon: 'pencil',
            title: t('persona.settings.change_name'),
            subtitle: t('persona.settings.change_name_desc'),
            onPress: handleNameChange,
            iconColor: theme.mainColor,
          })}

          {/* 카테고리 변경 */}
          {renderSettingItem({
            icon: 'tag',
            title: t('persona.settings.change_category'),
            subtitle: t('persona.settings.change_category_desc'),
            onPress: handleCategoryChange,
            iconColor: '#FFA500',
          })}

          {/* 영상 전환 */}
          {renderSettingItem({
            icon: 'video-outline',
            title: t('persona.settings.convert_video'),
            subtitle: canConvertVideo
              ? t('persona.settings.convert_video_desc')
              : t('persona.settings.video_already_converted'),
            onPress: handleVideoConvert,
            iconColor: '#9C27B0',
            disabled: !canConvertVideo,
          })}

          {/* 페르소나 삭제 */}
          {renderSettingItem({
            icon: 'delete',
            title: t('persona.settings.delete_persona'),
            subtitle: t('persona.settings.delete_persona_desc'),
            onPress: handleDelete,
            iconColor: '#F44336',
          })}
        </View>
      </ScrollView>
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

  // ⭐ Persona Info Card
  personaInfoCard: {
    padding: platformPadding(16),
    borderRadius: scale(12),
    marginBottom: platformPadding(20),
    alignItems: 'center',
  },

  // ⭐ Settings Group
  settingsGroup: {
    gap: platformPadding(12),
  },

  // ⭐ Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: platformPadding(16),
    borderRadius: scale(12),
    borderWidth: 1,
  },

  settingIconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: platformPadding(12),
  },

  settingTextContainer: {
    flex: 1,
  },
});

export default PersonaSettingsSheet;

