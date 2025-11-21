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
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { moderateScale, verticalScale, platformLineHeight, platformPadding } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';

const ChatInputBar = memo(({ 
  onSend, 
  disabled = false, 
  placeholder,
  onToggleChatHeight,
  onToggleChatVisibility,
  chatHeight = 'medium',
  isChatVisible = true,
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
    if (trimmedText && !disabled) {
      onSend(trimmedText);
      setText('');
      // ✅ Reset to minimum height/content after send
      if (Platform.OS === 'android') {
        setInputHeight(minHeight);
      } else {
        setIosContentHeight(0);
      }
    }
  }, [text, disabled, onSend, minHeight]);

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

  return (
    <View style={styles.wrapper}>
      {/* Settings Menu */}
      {isSettingsMenuOpen && (
        <View style={styles.settingsMenu}>
          {/* 채팅창 높이 조절 */}
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

          {/* 채팅창 감추기/보이기 */}
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
        </View>
      )}

      {/* Input Container */}
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
        {/* TextInput with auto-grow */}
        <TextInput
        style={[
          styles.input,
          {
            // ✅ CRITICAL: iOS - Do NOT set height (use minHeight/maxHeight only)
            // ✅ Android - Use dynamic height
            ...(Platform.OS === 'android' && { height: inputHeight }),
            backgroundColor: 'rgba(255, 255, 255, 0.15)', // ✅ 투명 배경
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
              backgroundColor: text.trim() ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
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
                : 'rgba(255, 255, 255, 0.1)',
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

