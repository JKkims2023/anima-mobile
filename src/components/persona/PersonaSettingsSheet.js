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
import amountService from '../../services/api/amountService';
import { useUser } from '../../contexts/UserContext';
import PersonaHeartDisplay from './PersonaHeartDisplay'; // ⭐ NEW: Persona Heart UI

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

  const handleNameChange = () => {
    HapticService.light();
    onNameChange?.(persona);
    // ⚠️ Don't close here - close after name change is saved
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
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      isOpen={isOpen}
      onClose={onClose}
      title={t('persona.settings.title')}
      snapPoints={['80%']}
      buttons={[
        {
          title: t('common.close'),
          type: 'secondary',
          onPress: onClose,
        },
        {
          title: t('common.delete'),
          type: 'primary',
          onPress: handleDelete,
          icon: 'delete',
          iconColor: '#F44336',
        }
      ]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ⭐ NEW: Persona Name (Clickable for editing) */}
        <TouchableOpacity 
          style={[styles.nameSection, { backgroundColor: theme.bgSecondary, borderColor: theme.borderColor }]}
          onPress={handleNameChange}
          activeOpacity={0.7}
        >
          <View style={styles.nameContent}>
            <CustomText type="big" bold style={{ color: theme.textPrimary }}>
              {persona?.persona_name || t('persona.settings.no_persona')}
            </CustomText>
            <Icon name="pencil" size={scale(18)} color={theme.textSecondary} />
          </View>
          <CustomText type="small" style={{ color: theme.textSecondary, marginTop: verticalScale(4) }}>
            {t('persona.settings.tap_to_edit_name', '이름을 클릭하여 수정하세요')}
          </CustomText>
        </TouchableOpacity>

        {/* ⭐ NEW: Persona Heart (3-Layer UI) */}
        <PersonaHeartDisplay 
          persona={persona} 
          relationshipData={{
            how_ai_calls_user: persona?.how_ai_calls_user,
          }}
        />
      </ScrollView>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: platformPadding(20),
  },

  contentContainer: {
    paddingHorizontal: platformPadding(0),
    paddingBottom: platformPadding(20),
  },

  // ⭐ NEW: Name Section (Clickable)
  nameSection: {
    padding: platformPadding(16),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: platformPadding(16),
  },
  
  nameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default PersonaSettingsSheet;

