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
import IconFace from 'react-native-vector-icons/FontAwesome6';

import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnima } from '../../contexts/AnimaContext';
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import amountService from '../../services/api/amountService';
import { useUser } from '../../contexts/UserContext';

const PersonaManagerSheet = ({
  isOpen = false,
  persona = null,
  onClose,
}) => {
  const { t } = useTranslation();
  const { currentTheme: theme } = useTheme();
  const { showAlert, showToast } = useAnima();
  const bottomSheetRef = useRef(null);
  const { user } = useUser();
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
      <View style={[styles.settingIconContainer, { backgroundColor: `${iconColor}20` , marginTop:icon === 'delete' ? 'auto' : 0 }]}>
        <Icon name={icon} size={scale(20)} color={iconColor} />
      </View>
      <View style={styles.settingTextContainer}>
        <CustomText type="title" bold style={{ color: theme.textPrimary }}>
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
      title={persona?.persona_name || t('persona.settings.no_persona')}
      snapPoints={['70%']}
      buttons={[
        {
          title: t('common.close'),
          type: 'primary',
          onPress: onClose,
        },
      ]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      
        <View style={[styles.personaInfoCard, { backgroundColor: theme.bgSecondary,}]}>
          
          <CustomText type="middle" bold style={{ color: theme.textPrimary }}>
            {t('persona_info.sage.style_title')}
          </CustomText>
          <CustomText type="body" style={{ color: theme.textSecondary, marginTop: verticalScale(4) }}>
            {persona?.persona_key === '573db390-a505-4c9e-809f-cc511c235cbb' ? t('persona_info.sage.style') : 
            persona?.persona_key === 'af444146-e796-468c-8e2c-0daf4f9b9248' ? t('persona_info.nexus.style') : t(`category_type.${persona?.category_type || 'normal'}`)}
          </CustomText>
        </View>

                
        <View style={[styles.personaInfoCard, { backgroundColor: theme.bgSecondary,}]}>
            
            <CustomText type="middle" bold style={{ color: theme.textPrimary }}>
              {t('persona_info.sage.description_title')}
            </CustomText>
            <CustomText type="body" style={{ color: theme.textSecondary, marginTop: verticalScale(4) }}>
              {persona?.persona_key === '573db390-a505-4c9e-809f-cc511c235cbb' ? t('persona_info.sage.description') : 
              persona?.persona_key === 'af444146-e796-468c-8e2c-0daf4f9b9248' ? t('persona_info.nexus.description') : t(`category_type.${persona?.category_type || 'normal'}`)}
            </CustomText>
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
    width: scale(40),
    height: scale(40),
    borderRadius: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: platformPadding(12),
  },

  settingTextContainer: {
    flex: 1,
  },
});

export default PersonaManagerSheet;

