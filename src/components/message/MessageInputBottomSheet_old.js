/**
 * 💬 MessageInputBottomSheet Component
 * 
 * Bottom sheet for message input (title, content, password)
 * Each field opens independently to avoid unnecessary scrolling
 * Optimized keyboard handling like chat input
 * 
 * Features:
 * - Independent rendering per field (title, content, password)
 * - Keyboard-aware layout (extend mode)
 * - Auto-focus on open
 * - Validation and character count
 * - Save/Cancel buttons
 */

import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import NeonInputBottomSheet from '../auth/NeonInputBottomSheet';
import CustomSwitch from '../CustomSwitch';
import { scale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

const MessageInputBottomSheet = forwardRef(({
  fieldType = 'title', // 'title', 'content', 'password'
  initialValue = '',
  onSave,
  onClose,
}, ref) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef(null);
  const inputRef = useRef(null);

  const [value, setValue] = useState(initialValue);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [error, setError] = useState('');

  // Reset state when sheet opens
  useEffect(() => {
    setValue(initialValue);
    setConfirmPassword('');
    setError('');
    
    if (fieldType !== 'password') {
      setHasPassword(false);
    }
  }, [initialValue, fieldType]);

  // Auto-focus input when sheet opens
  const handleSheetChange = useCallback((index) => {
    if (index >= 0) {
      // Sheet opened, focus input after a short delay
      setTimeout(() => {
        inputRef.current?.focus?.();
      }, 300);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    present: () => {
      bottomSheetRef.current?.present();
    },
    dismiss: () => {
      Keyboard.dismiss();
      bottomSheetRef.current?.dismiss();
    },
  }));

  // Validation
  const validate = useCallback(() => {
    setError('');

    if (fieldType === 'title') {
      if (!value || value.trim() === '') {
        setError(t('message.errors.title_required'));
        return false;
      }
      if (value.length > 50) {
        setError(t('common.error') + ': Max 50 characters');
        return false;
      }
    }

    if (fieldType === 'content') {
      if (!value || value.trim() === '') {
        setError(t('message.errors.content_required'));
        return false;
      }
      if (value.length > 500) {
        setError(t('common.error') + ': Max 500 characters');
        return false;
      }
    }

    if (fieldType === 'password') {
      if (hasPassword) {
        if (!value || value.trim() === '') {
          setError(t('message.errors.password_required'));
          return false;
        }
        if (value !== confirmPassword) {
          setError(t('message.errors.password_mismatch'));
          return false;
        }
        if (value.length < 4 || value.length > 20) {
          setError(t('common.error') + ': 4-20 characters');
          return false;
        }
      }
    }

    return true;
  }, [fieldType, value, confirmPassword, hasPassword, t]);

  const handleSave = useCallback(() => {
    if (!validate()) {
      HapticService.light();
      return;
    }

    HapticService.light();
    
    if (fieldType === 'password') {
      onSave({ hasPassword, password: hasPassword ? value : null });
    } else {
      onSave(value);
    }

    bottomSheetRef.current?.dismiss();
  }, [validate, onSave, fieldType, value, hasPassword]);

  const handleCancel = useCallback(() => {
    HapticService.light();
    bottomSheetRef.current?.dismiss();
  }, []);

  const getTitle = () => {
    switch (fieldType) {
      case 'title':
        return t('message_creator.message_title_label');
      case 'content':
        return t('message_creator.message_content_label');
      case 'password':
        return t('message_creator.password_protection_label');
      default:
        return '';
    }
  };

  const getPlaceholder = () => {
    switch (fieldType) {
      case 'title':
        return t('message_creator.message_title_placeholder');
      case 'content':
        return t('message_creator.message_content_placeholder');
      case 'password':
        return t('message_creator.password_placeholder');
      default:
        return '';
    }
  };

  const getMaxLength = () => {
    switch (fieldType) {
      case 'title':
        return 50;
      case 'content':
        return 500;
      case 'password':
        return 20;
      default:
        return 100;
    }
  };

  const renderInputField = () => {
    if (fieldType === 'password') {
      return (
        <View style={styles.passwordContainer}>
          {/* Password toggle */}
          <View style={styles.passwordToggleContainer}>
            <View style={styles.toggleLabelContainer}>
              <CustomText type="normal" style={styles.toggleLabel}>
                🔐 {t('message_creator.password_protection_label')}
              </CustomText>
              <CustomText type="small" style={styles.toggleHint}>
                {t('message_creator.password_hint')}
              </CustomText>
            </View>
            <CustomSwitch
              value={hasPassword}
              onValueChange={setHasPassword}
            />
          </View>

          {/* Password inputs (only if enabled) */}
          {hasPassword && (
            <>
              <NeonInputBottomSheet
                ref={inputRef}
                placeholder={t('message_creator.password_placeholder')}
                value={value}
                onChangeText={setValue}
                secureTextEntry
                maxLength={20}
                autoFocus={false}
                style={styles.passwordInput}
              />
              <NeonInputBottomSheet
                placeholder={t('message_creator.password_confirm_placeholder')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                maxLength={20}
                style={styles.passwordInput}
              />
            </>
          )}

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <CustomText type="small" style={styles.errorText}>
                ⚠️ {error}
              </CustomText>
            </View>
          )}
        </View>
      );
    }

    // Title or Content input
    return (
      <View style={styles.inputContainer}>
        <NeonInputBottomSheet
          ref={inputRef}
          placeholder={getPlaceholder()}
          value={value}
          onChangeText={setValue}
          multiline={fieldType === 'content'}
          numberOfLines={fieldType === 'content' ? 8 : 1}
          maxLength={getMaxLength()}
          autoFocus={false}
          style={fieldType === 'content' ? styles.contentInput : styles.titleInput}
        />

        {/* Character count */}
        <View style={styles.charCountContainer}>
          <CustomText
            type="small"
            style={[
              styles.charCount,
              value.length >= getMaxLength() * 0.9 && styles.charCountWarning,
            ]}
          >
            {value.length} / {getMaxLength()}
          </CustomText>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <CustomText type="small" style={styles.errorText}>
              ⚠️ {error}
            </CustomText>
          </View>
        )}
      </View>
    );
  };

  const buttons = [
    {
      title: t('common.cancel'),
      type: 'outline',
      onPress: handleCancel,
    },
    {
      title: t('common.save'),
      type: 'primary',
      onPress: handleSave,
    },
  ];

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      title={getTitle()}
      subtitle={fieldType === 'password' ? '' : `✏️ ${getTitle()}을(를) 입력하세요`}
      onClose={onClose}
      onChange={handleSheetChange}
      buttons={buttons}
      snapPoints={fieldType === 'content' ? ['70%', '90%'] : ['50%', '70%']}
      keyboardBehavior="extend"
      enablePanDownToClose={false}
      enableContentPanningGesture={false}
    >
      {renderInputField()}
    </CustomBottomSheet>
  );
});

MessageInputBottomSheet.displayName = 'MessageInputBottomSheet';

const styles = StyleSheet.create({
  inputContainer: {
    paddingHorizontal: platformPadding(20),
    paddingVertical: platformPadding(10),
  },
  titleInput: {
    marginBottom: scale(10),
  },
  contentInput: {
    marginBottom: scale(10),
    minHeight: scale(200),
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: scale(5),
  },
  charCount: {
    color: COLORS.TEXT_TERTIARY,
  },
  charCountWarning: {
    color: COLORS.DEEP_BLUE_LIGHT,
    fontWeight: 'bold',
  },
  errorContainer: {
    marginTop: scale(10),
    padding: scale(10),
    backgroundColor: `${COLORS.DEEP_BLUE}20`,
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: `${COLORS.DEEP_BLUE}40`,
  },
  errorText: {
    color: COLORS.TEXT_PRIMARY,
  },
  passwordContainer: {
    paddingHorizontal: platformPadding(20),
    paddingVertical: platformPadding(10),
  },
  passwordToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
    paddingVertical: scale(10),
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: scale(15),
  },
  toggleLabel: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(4),
  },
  toggleHint: {
    color: COLORS.TEXT_TERTIARY,
    lineHeight: scale(18),
  },
  passwordInput: {
    marginBottom: scale(15),
  },
});

export default MessageInputBottomSheet;

