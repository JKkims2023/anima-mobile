/**
 * 💬 MessageInputBottomSheet_v2 Component
 * 
 * Chat-style bottom sheet for message input
 * Inspired by ManagerAIChatView input bar
 * 
 * Features:
 * - Left: Dynamic TextInput (grows/shrinks)
 * - Right: Send/Apply button
 * - Minimal, optimized design
 * - Keyboard-aware
 */

import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Keyboard, Platform, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
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
  const [inputHeight, setInputHeight] = useState(40);

  // Reset state when sheet opens
  useEffect(() => {
    setValue(initialValue);
    setConfirmPassword('');
    setInputHeight(40);
    
    if (fieldType !== 'password') {
      setHasPassword(false);
    }
  }, [initialValue, fieldType]);

  // Auto-focus input when sheet opens
  const handleSheetChange = useCallback((index) => {
    if (index >= 0) {
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
    if (fieldType === 'title' && (!value || value.trim() === '')) return false;
    if (fieldType === 'content' && (!value || value.trim() === '')) return false;
    if (fieldType === 'password' && hasPassword) {
      if (!value || value !== confirmPassword) return false;
    }
    return true;
  }, [fieldType, value, confirmPassword, hasPassword]);

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

  const getPlaceholder = () => {
    switch (fieldType) {
      case 'title':
        return t('message.input.title_placeholder');
      case 'content':
        return t('message.input.content_placeholder');
      case 'password':
        return t('message.input.password_placeholder');
      default:
        return '';
    }
  };

  const getTitle = () => {
    switch (fieldType) {
      case 'title':
        return t('message.input.title_label');
      case 'content':
        return t('message.input.content_label');
      case 'password':
        return t('message.input.password_label');
      default:
        return '';
    }
  };

  const renderPasswordMode = () => (
    <View style={styles.passwordContainer}>
      {/* Password toggle */}
      <View style={styles.passwordToggle}>
        <CustomSwitch
          value={hasPassword}
          onValueChange={setHasPassword}
        />
        <CustomText type="normal" style={styles.passwordToggleText}>
          {t('message.input.password_label')}
        </CustomText>
      </View>

      {hasPassword && (
        <>
          {/* Password input bar */}
          <View style={styles.inputBar}>
            <MessageInputField
              ref={inputRef}
              placeholder={t('message.input.password_placeholder')}
              value={value}
              onChangeText={setValue}
              secureTextEntry
              maxLength={20}
              returnKeyType="next"
            />
            <TouchableOpacity
              style={[styles.sendButton, !value && styles.sendButtonDisabled]}
              onPress={() => value && inputRef.current?.blur?.()}
              disabled={!value}
            >
              <Icon name="arrow-down" size={moderateScale(24)} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Confirm password input bar */}
          <View style={styles.inputBar}>
            <MessageInputField
              placeholder={t('message.input.password_confirm_placeholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <TouchableOpacity
              style={[styles.sendButton, !validate() && styles.sendButtonDisabled]}
              onPress={handleSave}
              disabled={!validate()}
            >
              <Icon name="check" size={moderateScale(24)} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {!hasPassword && (
        <View style={styles.inputBar}>
          <View style={styles.inputPlaceholder}>
            <CustomText type="small" style={styles.disabledText}>
              {t('common.no_password')}
            </CustomText>
          </View>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSave}
          >
            <Icon name="check" size={moderateScale(24)} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTextMode = () => (
    <View style={styles.inputBar}>
      {/* Dynamic TextInput */}
      <MessageInputField
        ref={inputRef}
        placeholder={getPlaceholder()}
        value={value}
        onChangeText={setValue}
        multiline={fieldType === 'content'}
        maxLength={fieldType === 'title' ? 50 : 500}
        returnKeyType={fieldType === 'content' ? 'default' : 'done'}
        onSubmitEditing={fieldType === 'title' ? handleSave : undefined}
        onContentSizeChange={(e) => {
          if (fieldType === 'content') {
            setInputHeight(e.nativeEvent.contentSize.height);
          }
        }}
        style={fieldType === 'content' && { height: Math.max(40, inputHeight) }}
      />

      {/* Send button */}
      <TouchableOpacity
        style={[styles.sendButton, !validate() && styles.sendButtonDisabled]}
        onPress={handleSave}
        disabled={!validate()}
      >
        <Icon name="check" size={moderateScale(24)} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      title={getTitle()}
      subtitle=""
      onClose={onClose}
      onChange={handleSheetChange}
      snapPoints={fieldType === 'password' ? ['50%', '70%'] : ['35%', '50%']}
      keyboardBehavior="extend"
      enablePanDownToClose={true}
      enableContentPanningGesture={false}
      android_keyboardInputMode="adjustResize"
    >
      <View style={styles.container}>
        {fieldType === 'password' ? renderPasswordMode() : renderTextMode()}
      </View>
    </CustomBottomSheet>
  );
});

MessageInputBottomSheet.displayName = 'MessageInputBottomSheet';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: platformPadding(16),
    paddingTop: platformPadding(8), // ✅ 상단 공백 최소화
    paddingBottom: platformPadding(8), // ✅ 하단 공백 최소화
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: scale(10),
    backgroundColor: COLORS.BG_SECONDARY,
    borderRadius: scale(24),
    paddingHorizontal: platformPadding(10),
    paddingVertical: platformPadding(8),
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    marginBottom: scale(8), // ✅ 간격 최소화 (10 → 8)
  },
  inputPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: scale(8),
  },
  sendButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: COLORS.DEEP_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.DEEP_BLUE_LIGHT,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.TEXT_TERTIARY,
    opacity: 0.5,
  },
  passwordContainer: {
    gap: scale(12), // ✅ 간격 최소화 (15 → 12)
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    paddingVertical: scale(8), // ✅ 패딩 최소화 (10 → 8)
  },
  passwordToggleText: {
    color: COLORS.TEXT_PRIMARY,
  },
  disabledText: {
    color: COLORS.TEXT_TERTIARY,
  },
});

export default MessageInputBottomSheet;

