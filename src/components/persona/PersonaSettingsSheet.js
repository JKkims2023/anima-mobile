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
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleNameChange = () => {
    HapticService.light();
    onNameChange?.(persona);
    // ⚠️ Don't close here - close after name change is saved
  };



  const handleDelete = () => {
    HapticService.warning();
    
    if (persona?.default_yn === 'Y') {
      showAlert({
        title: t('persona.default_persona_delete_confirm_title'),
        message: t('persona.default_persona_delete_confirm_message'),
        emoji: '⚠️',
        buttons: [
          { text: t('common.confirm'), style: 'primary' },
        ],
      });

      return;
    }

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
      title={t('persona.settings.title', { name: persona?.persona_name })}
      snapPoints={['80%']}

      
      buttons={
        [
        {
          title: t('common.close'),
          type: 'secondary',
          onPress: onClose,
        },
        {
          title: t('common.confirm'),
          type: 'primary',
          onPress: onClose,
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
    display: 'none',
  },
  
  nameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

  },
});

export default PersonaSettingsSheet;

