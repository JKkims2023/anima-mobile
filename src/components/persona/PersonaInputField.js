/**
 * 📝 PersonaInputField - BottomSheet용 Input Wrapper
 * 
 * @gorhom/bottom-sheet의 BottomSheetTextInput wrapper
 * 한글 입력 최적화
 * 
 * @author JK & Hero Nexus AI
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { scale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const PersonaInputField = ({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = 'rgba(156, 163, 175, 0.6)',
  maxLength,
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  secureTextEntry = false,
  editable = true,
  onFocus,
  onBlur,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <BottomSheetTextInput
        style={[styles.input, multiline && styles.inputMultiline, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={editable}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={false}
        autoCorrect={false}
        textAlignVertical={multiline ? 'top' : 'center'}
        selectTextOnFocus={false}
        returnKeyType={multiline ? 'default' : 'done'}
        blurOnSubmit={!multiline}
        underlineColorAndroid="transparent"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Empty for now, can add wrapper styles if needed
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: scale(12),
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(14),
    fontSize: moderateScale(15),
    color: '#FFFFFF',
    minHeight: scale(50),
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    // ✅ Android specific fixes
    ...(Platform.OS === 'android' && {
      paddingTop: platformPadding(14),
      paddingBottom: platformPadding(14),
      textAlignVertical: 'center',
      includeFontPadding: false,
      underlineColorAndroid: 'transparent',
    }),
  },
  inputMultiline: {
    minHeight: scale(120),
    maxHeight: scale(200),
    textAlignVertical: 'top',
    ...(Platform.OS === 'android' && {
      textAlignVertical: 'top',
    }),
  },
});

export default PersonaInputField;

