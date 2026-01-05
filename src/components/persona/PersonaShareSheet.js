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
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { useUser } from '../../contexts/UserContext';

const PersonaShareSheet = ({
  isOpen = false,
  persona = null,
  onHandleShare,
  onClose,
}) => {
  const { t } = useTranslation();
  const { currentTheme: theme } = useTheme();
  const { showAlert, showToast } = useAnima();
  const bottomSheetRef = useRef(null);
  const { user } = useUser();
  const [shareType, setShareType] = useState('image'); // 'image' | 'video'
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

  useEffect(() => {
    console.log('shareType: ', shareType);
  }, [shareType]);

  const handleShare = () => {
    onHandleShare(shareType);
    onClose();
  };

  const handleShareTypeSelect = (type) => {


    setShareType(type);

  };


  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      isOpen={isOpen}
      onClose={onClose}
      title={t('persona_share_sheet.title', { name: persona?.persona_name })}
      snapPoints={['50%']}
      buttons={[
        {
          title: t('common.cancel'),
          type: 'secondary',
          onPress: onClose,
        },
        {
          title: t('common.share'),
          type: 'primary',
          onPress: handleShare,
          icon: 'share-social-outline',
          iconColor: '#FFFFFF',
        },
      ]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >

      <CustomText type="normal" style={{ color: theme.textSecondary }}>
        {t('persona_share_sheet.guide_message')}
      </CustomText>

      <CustomText type="middle" bold style={{ color: theme.textPrimary, marginTop: verticalScale(20) }}>  
        {t('persona_share_sheet.share_type_title')}
      </CustomText>

      {/* Filter Chips */}
      <View style={[styles.filterChips, { marginTop: verticalScale(20) }]}>
      <TouchableOpacity
          style={[
            styles.filterChip,
            { borderColor: theme.borderColor },
            shareType === 'image' ? { 
              backgroundColor: theme.mainColor,
              borderColor: theme.mainColor,
            } : {
              backgroundColor: 'transparent',
              borderColor: theme.borderColor,
            }
          ]}
          onPress={() => handleShareTypeSelect('image')}
          activeOpacity={0.7}
        >
          <CustomText
            type="middle"
            bold={shareType === 'image'}
            style={{ color: shareType.current === 'image' ? '#FFFFFF' : theme.textPrimary }}
          >
            {t('persona_share_sheet.share_type.image')}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            { borderColor: theme.borderColor },
            shareType === 'video' ? { 
              backgroundColor: theme.mainColor,
              borderColor: theme.mainColor,
            } : {
              backgroundColor: 'transparent',
              borderColor: theme.borderColor,
            }
          ]}
          onPress={() => handleShareTypeSelect('video')}
          activeOpacity={0.7}
        >
          <CustomText
            type="middle"
            bold={shareType === 'video'}
            style={{ color: shareType.current === 'video' ? '#FFFFFF' : theme.textPrimary }}
          >
            {t('persona_share_sheet.share_type.video')}
          </CustomText>
        </TouchableOpacity>
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
   // Filter Chips
   filterChips: {
    flexDirection: 'row',
    gap: scale(8),
  },
  filterChip: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
  },

});

export default PersonaShareSheet;

