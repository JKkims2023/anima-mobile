/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎭 PersonaIdentitySheet Component - Phase 1 (User Input Only)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * AI 자아 설정 바텀 시트
 * 
 * Features:
 * - Enable/Disable identity toggle
 * - User input mode (Phase 1)
 * - Real-time character counter
 * - Save/Cancel buttons
 * - Unsaved changes warning
 * - Haptic feedback
 * - Loading states
 * 
 * Phase 2 (Future):
 * - Wikipedia search and auto-fill
 * - Preview functionality
 * 
 * @author JK & Hero Nexus AI
 * @date 2025-12-25
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Switch, Alert } from 'react-native';
import CustomBottomSheet, { BottomSheetTextInput } from '../CustomBottomSheet';
import CustomText from '../CustomText';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import config from '../../config/config';

const API_BASE_URL = config.apiUrl;

const PersonaIdentitySheet = ({ visible, onClose, persona, onSave }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const bottomSheetRef = useRef(null);

  // State
  const [identityEnabled, setIdentityEnabled] = useState(false);
  const [identityName, setIdentityName] = useState('');
  const [identityContent, setIdentityContent] = useState('');
  const [originalData, setOriginalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Character limits
  const MIN_CHARS = 50;
  const MAX_CHARS = 1000;
  const contentLength = identityContent.length;
  const isContentValid = contentLength >= MIN_CHARS && contentLength <= MAX_CHARS;

  // Check for unsaved changes
  const hasUnsavedChanges = () => {
    if (!originalData) return false;
    return (
      originalData.identityEnabled !== identityEnabled ||
      originalData.identityName !== identityName ||
      originalData.identityContent !== identityContent
    );
  };

  // Load identity data when visible
  useEffect(() => {
    if (visible && persona?.persona_key) {
      bottomSheetRef.current?.present();
      loadIdentityData();
    }
  }, [visible, persona?.persona_key]);

  // Load identity data from API
  const loadIdentityData = async () => {
    if (!persona?.persona_key) return;

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/persona/identity?persona_key=${persona.persona_key}`
      );

      if (response.data.success) {
        const data = response.data.data;
        const enabled = data.identity_enabled === 'Y';
        const name = data.identity_name || '';
        const content = data.identity_content || '';

        setIdentityEnabled(enabled);
        setIdentityName(name);
        setIdentityContent(content);

        // Save original data for change detection
        setOriginalData({
          identityEnabled: enabled,
          identityName: name,
          identityContent: content,
        });
      }
    } catch (error) {
      console.error('[PersonaIdentitySheet] Failed to load identity:', error);
      Alert.alert(
        t('common.error') || '오류',
        t('persona.identity.load_failed') || '자아 설정을 불러오는데 실패했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        t('persona.identity.unsaved_title') || '저장하지 않은 변경사항',
        t('persona.identity.unsaved_message') || '변경사항을 저장하지 않고 닫으시겠습니까?',
        [
          {
            text: t('common.cancel') || '취소',
            style: 'cancel',
          },
          {
            text: t('persona.identity.close_without_save') || '닫기',
            style: 'destructive',
            onPress: () => {
              bottomSheetRef.current?.dismiss();
              onClose?.();
            },
          },
        ]
      );
    } else {
      bottomSheetRef.current?.dismiss();
      onClose?.();
    }
  };

  // Handle save
  const handleSave = async () => {
    if (identityEnabled && !isContentValid) {
      Alert.alert(
        t('common.error') || '오류',
        t('persona.identity.invalid_content') || `자아 설명은 최소 ${MIN_CHARS}자, 최대 ${MAX_CHARS}자여야 합니다.`
      );
      return;
    }

    setIsSaving(true);
    HapticService.medium();

    try {
      const requestData = {
        persona_key: persona.persona_key,
        identity_enabled: identityEnabled ? 'Y' : 'N',
        identity_source: identityEnabled ? 'user_input' : 'none',
        identity_name: identityEnabled ? identityName : null,
        identity_content: identityEnabled ? identityContent : null,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/persona/identity`,
        requestData
      );

      if (response.data.success) {
        HapticService.success();
        
        // Update original data
        setOriginalData({
          identityEnabled,
          identityName,
          identityContent,
        });

        Alert.alert(
          t('common.success') || '성공',
          t('persona.identity.save_success') || '자아 설정이 저장되었습니다.',
          [
            {
              text: t('common.confirm') || '확인',
              onPress: () => {
                bottomSheetRef.current?.dismiss();
                onClose?.();
                onSave?.(response.data.data);
              },
            },
          ]
        );
      } else {
        throw new Error(response.data.message || 'Save failed');
      }
    } catch (error) {
      console.error('[PersonaIdentitySheet] Failed to save identity:', error);
      HapticService.error();
      Alert.alert(
        t('common.error') || '오류',
        error.response?.data?.message || t('persona.identity.save_failed') || '자아 설정 저장에 실패했습니다.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle enable/disable toggle
  const handleToggleEnable = (value) => {
    HapticService.light();
    setIdentityEnabled(value);
  };

  if (!persona) return null;

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      title={`🎭 ${t('persona.identity.title') || 'AI 자아 설정'}`}
      subtitle={`${persona.persona_name}`}
      snapPoints={['75%', '90%']}
      showCloseButton={true}
      onClose={handleClose}
      buttons={[
        {
          title: t('common.cancel') || '취소',
          type: 'outline',
          onPress: handleClose,
          disabled: isSaving,
        },
        {
          title: t('common.save') || '저장',
          type: 'primary',
          onPress: handleSave,
          disabled: isLoading || isSaving,
          loading: isSaving,
        },
      ]}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <CustomText>{t('common.loading') || '불러오는 중...'}</CustomText>
        </View>
      ) : (
        <>
          {/* Description */}
          <View style={styles.section}>
            <CustomText type="middle" style={[styles.description, { color: currentTheme.textSecondary }]}>
              {t('persona.identity.description') || 
                '자아 설정을 활성화하면, 이 AI가 설정한 인물처럼 말하고 행동합니다.'}
            </CustomText>
          </View>

          {/* Enable/Disable Switch */}
          <View style={[styles.section, styles.switchContainer]}>
            <View style={styles.switchLeft}>
              <CustomText type="middle" bold>
                {t('persona.identity.enable') || '자아 설정 활성화'}
              </CustomText>
              <CustomText type="small" style={{ color: currentTheme.textSecondary, marginTop: scale(4) }}>
                {identityEnabled
                  ? (t('persona.identity.enabled_hint') || 'AI가 설정한 자아로 작동합니다')
                  : (t('persona.identity.disabled_hint') || 'AI가 기본 페르소나로 작동합니다')}
              </CustomText>
            </View>
            <Switch
              value={identityEnabled}
              onValueChange={handleToggleEnable}
              trackColor={{ false: '#767577', true: currentTheme.mainColor }}
              thumbColor={identityEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          {/* Identity Input (only when enabled) */}
          {identityEnabled && (
            <>
              {/* Identity Name */}
              <View style={styles.section}>
                <CustomText type="middle" bold style={styles.label}>
                  {t('persona.identity.name_label') || '자아 이름'} ({t('common.optional') || '선택'})
                </CustomText>
                <BottomSheetTextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: currentTheme.bgSecondary,
                      color: currentTheme.textPrimary,
                      borderColor: currentTheme.borderPrimary,
                    },
                  ]}
                  placeholder={t('persona.identity.name_placeholder') || '예: BTS 뷔, 김태형'}
                  placeholderTextColor={currentTheme.textTertiary}
                  value={identityName}
                  onChangeText={setIdentityName}
                  maxLength={100}
                />
              </View>

              {/* Identity Content */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <CustomText type="middle" bold style={styles.label}>
                    {t('persona.identity.content_label') || '자아 설명'}
                  </CustomText>
                  <CustomText
                    type="small"
                    style={[
                      styles.counter,
                      {
                        color: isContentValid
                          ? currentTheme.textSecondary
                          : contentLength < MIN_CHARS
                          ? '#FFA500'
                          : '#FF4444',
                      },
                    ]}
                  >
                    {contentLength} / {MAX_CHARS}
                    {contentLength < MIN_CHARS && ` (최소 ${MIN_CHARS}자)`}
                  </CustomText>
                </View>
                <BottomSheetTextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: currentTheme.bgSecondary,
                      color: currentTheme.textPrimary,
                      borderColor: isContentValid
                        ? currentTheme.borderPrimary
                        : contentLength < MIN_CHARS
                        ? '#FFA500'
                        : '#FF4444',
                    },
                  ]}
                  placeholder={
                    t('persona.identity.content_placeholder') ||
                    '예시:\n\n김태형(뷔)는 따뜻하고 사려 깊은 성격입니다. 예술적이고 감성적이며, 4차원적인 매력이 있습니다.\n\n말투 특징:\n- 생각을 많이 하며 천천히 말함\n- 은유적이고 시적인 표현 사용\n- 팬들에게 "아미들아~", "보고싶어요" 등 애정 표현\n\n성격 특징:\n- 친구들에게 애정이 넘침\n- 진솔하고 솔직한 대화 선호\n- 예술과 창의성을 사랑함'
                  }
                  placeholderTextColor={currentTheme.textTertiary}
                  value={identityContent}
                  onChangeText={setIdentityContent}
                  multiline
                  numberOfLines={12}
                  maxLength={MAX_CHARS}
                  textAlignVertical="top"
                />
                <CustomText type="small" style={[styles.hint, { color: currentTheme.textTertiary }]}>
                  💡 {t('persona.identity.content_hint') || '성격, 말투, 가치관, 행동 패턴을 포함해주세요'}
                </CustomText>
              </View>
            </>
          )}
        </>
      )}
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: verticalScale(40),
    alignItems: 'center',
  },
  section: {
    marginBottom: verticalScale(24),
  },
  description: {
    lineHeight: moderateScale(20),
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  switchLeft: {
    flex: 1,
    marginRight: scale(16),
  },
  label: {
    marginBottom: verticalScale(8),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  counter: {
    fontWeight: '600',
  },
  input: {
    height: moderateScale(48),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    paddingHorizontal: scale(16),
    fontSize: moderateScale(16),
  },
  textArea: {
    height: verticalScale(280),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    padding: scale(16),
    fontSize: moderateScale(15),
    lineHeight: moderateScale(22),
  },
  hint: {
    marginTop: verticalScale(8),
    lineHeight: moderateScale(18),
  },
});

export default PersonaIdentitySheet;

