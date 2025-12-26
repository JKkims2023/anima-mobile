/**
 * ChatInputBar Component
 * 
 * Features:
 * - Auto-grow multiline TextInput with transparent blur background
 * - Chat bubble send button
 * - Settings menu (chat height, visibility controls)
 * - Keyboard-aware (parent controls position)
 * 
 * ⚠️ IMPORTANT:
 * - DO NOT use KeyboardAvoidingView here (conflicts with parent)
 * - Parent component controls position via Animated.Value
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */

import React, { useState, memo, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text, Animated, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { moderateScale, verticalScale, platformLineHeight, platformPadding } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';

const ChatInputBar = memo(({ 
  onSend, 
  onImageSelect, // 🆕 Image selection callback
  disabled = false, 
  placeholder,
  onToggleChatHeight,
  onToggleChatVisibility,
  onAISettings, // 🆕 AI Settings callback
  chatHeight = 'medium',
  isChatVisible = true,
  visionMode = 'basic', // 🆕 Vision mode setting
  hasSelectedImage = false, // 🆕 NEW: Parent tells us if image is selected
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const [text, setText] = useState('');
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  // ✅ Android only: Dynamic height state
  const [inputHeight, setInputHeight] = useState(verticalScale(40));
  // ✅ iOS only: Track content height for scroll control
  const [iosContentHeight, setIosContentHeight] = useState(0);
  const minHeight = verticalScale(40);
  const maxHeight = verticalScale(120);

  const handleSend = useCallback(() => {
    const trimmedText = text.trim();
    // 🆕 FIX: Allow sending if text OR image is present
    if ((trimmedText || hasSelectedImage) && !disabled) {
      // 🎯 Haptic feedback for message send
      // Medium impact - satisfying confirmation of important action
      // Like pressing "send" on a letter - meaningful and decisive
      HapticService.medium();
      
      onSend(trimmedText || ''); // ⚠️ Send empty string if only image
      setText('');
      // ✅ Reset to minimum height/content after send
      if (Platform.OS === 'android') {
        setInputHeight(minHeight);
      } else {
        setIosContentHeight(0);
      }
    }
  }, [text, disabled, onSend, minHeight, hasSelectedImage]); // 🆕 Add hasSelectedImage dependency

  const handleTextChange = useCallback((newText) => {
    setText(newText);
    
    // ✅ Reset height/content when text is cleared
    if (!newText || newText.trim() === '') {
      if (Platform.OS === 'android') {
        setInputHeight(minHeight);
      } else {
        setIosContentHeight(0);
      }
    }
  }, [minHeight]);

  const handleToggleSettings = useCallback(() => {
    setIsSettingsMenuOpen(prev => !prev);
  }, []);

  const handleImagePick = useCallback(async () => {
    // Check if vision is disabled
    if (visionMode === 'disabled') {
      Alert.alert(
        '이미지 분석 비활성화',
        '이미지 분석 기능이 비활성화되어 있습니다.\n설정에서 활성화해주세요.',
        [{ text: '확인' }]
      );
      return;
    }

    // Check if disabled
    if (disabled) {
      return;
    }

    try {
      // 🎯 Haptic feedback for image selection
      HapticService.light();

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: visionMode === 'detailed' ? 0.9 : 0.7,
        maxWidth: visionMode === 'detailed' ? 1024 : 512,
        maxHeight: visionMode === 'detailed' ? 1024 : 512,
        includeBase64: false, // We'll read file manually for better control
      });

      if (result.didCancel) {
        console.log('📷 [Image Picker] User cancelled');
        return;
      }

      if (result.errorCode) {
        console.error('📷 [Image Picker] Error:', result.errorMessage);
        Alert.alert('이미지 선택 오류', result.errorMessage || '이미지를 선택할 수 없습니다.');
        return;
      }

      if (result.assets && result.assets[0]) {
        const image = result.assets[0];
        console.log('📷 [Image Picker] Selected:', {
          uri: image.uri,
          type: image.type,
          size: image.fileSize,
          width: image.width,
          height: image.height,
        });

        // Read file as base64
        let base64Data;
        if (Platform.OS === 'ios') {
          // iOS uses file:// URI
          const filePath = image.uri.replace('file://', '');
          base64Data = await RNFS.readFile(filePath, 'base64');
        } else {
          // Android
          base64Data = await RNFS.readFile(image.uri, 'base64');
        }

        // Call parent callback
        onImageSelect?.({
          uri: image.uri,
          type: image.type || 'image/jpeg',
          base64: base64Data,
          width: image.width,
          height: image.height,
          fileSize: image.fileSize,
        });

        // 🎯 Success haptic
        HapticService.success();
      }
    } catch (error) {
      console.error('📷 [Image Picker] Exception:', error);
      Alert.alert('오류', '이미지를 처리할 수 없습니다.');
      HapticService.error();
    }
  }, [visionMode, disabled, onImageSelect]);

  return (
    <View style={styles.wrapper}>
      {/* Settings Menu */}
      {isSettingsMenuOpen && (
        <View style={styles.settingsMenu}>
          {/* 🆕 AI 성격 설정 */}
          {onAISettings && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onAISettings?.();
                  setIsSettingsMenuOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>🎭</Text>
                <Text style={styles.menuText}>AI 성격 설정</Text>
              </TouchableOpacity>
              
              {/* 구분선 */}
              <View style={styles.menuDivider} />
            </>
          )}
          
          {/* 채팅창 높이 조절 */}
          {onToggleChatHeight && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onToggleChatHeight?.();
                setIsSettingsMenuOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>📏</Text>
              <Text style={styles.menuText}>
                채팅창 높이: {chatHeight === 'tall' ? '높게' : '중간'}
              </Text>
            </TouchableOpacity>
          )}

          {/* 채팅창 감추기/보이기 */}
          {onToggleChatVisibility && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onToggleChatVisibility?.();
                setIsSettingsMenuOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{isChatVisible ? '👁️' : '👁️‍🗨️'}</Text>
              <Text style={styles.menuText}>
                {isChatVisible ? '채팅창 감추기' : '채팅창 보이기'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Input Container */}
      <View style={[styles.container, { backgroundColor: 'rgba(255, 255, 255, 0.15)'}]}>
        {/* 🆕 Image Picker Button */}
        {onImageSelect && (
          <TouchableOpacity
            style={[
              styles.imageButton,
              {
                opacity: disabled || visionMode === 'disabled' ? 0.3 : 1,
                backgroundColor: currentTheme.backgroundColor || 'rgba(255, 255, 255, 0.1)',
              },
            ]}
            onPress={handleImagePick}
            disabled={disabled || visionMode === 'disabled'}
            activeOpacity={0.7}
          >
            <Icon name="image" size={moderateScale(22)} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* TextInput with auto-grow */}
        <TextInput
        style={[
          styles.input,
          {
            // ✅ CRITICAL: iOS - Do NOT set height (use minHeight/maxHeight only)
            // ✅ Android - Use dynamic height
            ...(Platform.OS === 'android' && { height: inputHeight }),
            backgroundColor: currentTheme.backgroundColor || 'rgba(255, 255, 255, 0.15)', // ✅ 투명 배경
            color: '#FFF',
            // ✅ Android only: lineHeight for proper text alignment
            ...(Platform.OS === 'android' && { lineHeight: platformLineHeight(20) }),
          },
        ]}
        value={text}
        onChangeText={handleTextChange}
        placeholder={placeholder || t('manager_ai.input_placeholder') || 'SAGE에게 질문하세요...'}
        placeholderTextColor="rgba(255, 255, 255, 0.6)"
        multiline
        scrollEnabled={Platform.OS === 'ios' ? (iosContentHeight >= maxHeight) : (inputHeight >= maxHeight)}
        onContentSizeChange={(e) => {
          const contentHeight = e.nativeEvent.contentSize.height;
          
          if (Platform.OS === 'ios') {
            // ✅ iOS: Track content height for scroll control only
            setIosContentHeight(contentHeight);
            
            if (__DEV__) {
              console.log('[TextInput iOS] Content Size Change:', {
                contentHeight,
                maxHeight,
                scrollEnabled: contentHeight >= maxHeight,
                textLength: text.length,
                note: 'iOS auto-grow works with minHeight/maxHeight + no explicit height',
              });
            }
            return; // ✅ iOS handles height automatically
          }
          
          // ✅ Android: Manual height calculation
          // Reset to minimum if text is empty
          if (!text || text.trim() === '') {
            if (inputHeight !== minHeight) {
              setInputHeight(minHeight);
            }
            return;
          }
          
          // Calculate new height
          const newHeight = Math.max(contentHeight, minHeight);
          const clampedHeight = Math.min(newHeight, maxHeight);
          
          // Only update if height actually changed
          if (Math.abs(clampedHeight - inputHeight) > 1) {
            setInputHeight(clampedHeight);
          }
        }}
        editable={!disabled}
        returnKeyType={Platform.OS === 'ios' ? 'default' : 'send'}
        blurOnSubmit={false}
        enablesReturnKeyAutomatically={false}
        onSubmitEditing={Platform.OS === 'ios' ? undefined : handleSend}
      />

        {/* Send Button (Chat Bubble) */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              opacity: disabled || !text.trim() ? 0.5 : 1,
              backgroundColor: currentTheme.backgroundColor,
            },
          ]}
          onPress={handleSend}
          disabled={disabled || !text.trim()}
          activeOpacity={0.7}
        >
          <Icon name="chat-bubble" size={moderateScale(22)} color="#FFF" />
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          style={[
            styles.settingsButton,
            {
              backgroundColor: isSettingsMenuOpen 
                ? 'rgba(59, 130, 246, 0.3)' 
                : currentTheme.backgroundColor || 'rgba(255, 255, 255, 0.1)',
            },
          ]}
          onPress={handleToggleSettings}
          activeOpacity={0.7}
        >
          <Icon name="settings" size={moderateScale(22)} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

ChatInputBar.displayName = 'ChatInputBar';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  settingsMenu: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(8),
    marginHorizontal: moderateScale(15),
    padding: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    gap: moderateScale(12),
  },
  menuIcon: {
    fontSize: moderateScale(18),
  },
  menuText: {
    color: '#FFF',
    fontSize: moderateScale(15),
    lineHeight: platformLineHeight(moderateScale(15)), // ✅ Platform-aware lineHeight
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: verticalScale(8),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: moderateScale(15),
    paddingTop: platformPadding(10),
    paddingBottom: platformPadding(10),
    gap: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(15),
    paddingVertical: platformPadding(10),
    fontSize: moderateScale(16),
    minHeight: verticalScale(40),
    maxHeight: verticalScale(120),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // ✅ Android only: text alignment + lineHeight (iOS multiline conflicts with lineHeight)
    ...(Platform.OS === 'android' && { 
      textAlignVertical: 'top',
      lineHeight: platformLineHeight(moderateScale(16)),
    }),
  },
  imageButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default ChatInputBar;

