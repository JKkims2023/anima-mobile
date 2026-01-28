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

import React, { useState, memo, useCallback, useEffect, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text, Animated, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { moderateScale, verticalScale, platformLineHeight, platformPadding } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';
import CustomText from '../CustomText';
import EmotionIndicator from './EmotionIndicator';

const ChatInputBar = memo(({ 
  onSend, 
  onImageSelect, // 🆕 Image selection callback
  disabled = false, 
  placeholder,
  onToggleChatHeight,
  onToggleChatVisibility,
  onSettingsPress, // 🎛️ NEW: Settings button callback (to parent!)
  onCreateMusic,
  onCreateMessage,
  chatHeight = 'medium',
  isChatVisible = true,
  visionMode = 'basic', // 🆕 Vision mode setting
  hasSelectedImage = false, // 🆕 NEW: Parent tells us if image is selected
  persona = null, // 🗣️ NEW: Persona info for speaking pattern visibility
  currentEmotion = 'sleeping', // 😴 NEW: Current user emotion from LLM
  personaThought = null, // 💭 NEW: Persona's thought (want_to_ask)
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const [text, setText] = useState('');
  // ✅ Android only: Dynamic height state
  const [inputHeight, setInputHeight] = useState(verticalScale(40));
  // ✅ iOS only: Track content height for scroll control
  const [iosContentHeight, setIosContentHeight] = useState(0);
  const minHeight = verticalScale(40);
  const maxHeight = verticalScale(120);
  
  // 💭 NEW: Persona thought tooltip
  const [showThought, setShowThought] = useState(false);
  const [thoughtOpacity] = useState(new Animated.Value(0));
  
  // 🎯 PERFORMANCE DEBUG: Render tracking
  if (__DEV__) {
    console.log('🔄 [ChatInputBar] Rendering (emotion:', currentEmotion, ')');
  }
  

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

  // 🎛️ REMOVED: handleToggleSettings (parent handles it now!)

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

  // 💭 Handle persona thought tooltip
  const handleEmotionPress = useCallback(() => {
    if (!personaThought) return;
    
    // 🎯 Haptic feedback
    HapticService.light();
    
    setShowThought(true);
    Animated.spring(thoughtOpacity, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      Animated.timing(thoughtOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowThought(false);
      });
    }, 5000);
  }, [personaThought, thoughtOpacity]);

  // 💭 Handle thought dismiss
  const handleThoughtDismiss = useCallback(() => {
    Animated.timing(thoughtOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowThought(false);
    });
  }, [thoughtOpacity]);

  // 🎯 OPTIMIZATION: Memoize EmotionIndicator to prevent TextInput re-render
  // When currentEmotion changes, only EmotionIndicator updates
  const emotionIndicator = useMemo(() => {
    if (__DEV__) {
      console.log('🎭 [ChatInputBar] EmotionIndicator rendering:', currentEmotion);
    }
    return (
      <TouchableOpacity
        onPress={handleEmotionPress}
        disabled={!personaThought}
        activeOpacity={personaThought ? 0.6 : 1}
        style={[
          styles.emotionButton,
          {
            backgroundColor: currentTheme.backgroundColor || 'rgba(255, 255, 255, 0.1)',
            // 💭 Subtle hint that it's tappable
            opacity: personaThought ? 1 : 0.8,
          },
        ]}
      >
        <EmotionIndicator emotion={currentEmotion} animated={true} />
        {personaThought && (
          <View style={styles.thoughtBadge}>
            <Text style={styles.thoughtBadgeText}>💭</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [currentEmotion, currentTheme.backgroundColor, personaThought, handleEmotionPress]);

  return (
    <View style={styles.wrapper}>
      {/* 🎛️ REMOVED: Settings Menu (moved to parent ManagerAIOverlay!) */}
      
      {/* Input Container */}
      <View style={[styles.container, { backgroundColor: 'rgba(255, 255, 255, 0.15)'}]}>
        {/* 😴 Emotion Indicator - Memoized for performance */}
        {emotionIndicator}

        {/* 🆕 Image Picker Button - HIDDEN (display: none 효과) */}
        {false && onImageSelect && (
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

        {/* 🎛️ Settings Button (calls parent!) */}
        <TouchableOpacity
          style={[
            styles.settingsButton,
            {
              backgroundColor: currentTheme.backgroundColor || 'rgba(255, 255, 255, 0.1)',
            },
          ]}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Icon name="settings" size={moderateScale(22)} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* 💭 Persona Thought Tooltip */}
      {showThought && personaThought && (
        <Animated.View
          style={[
            styles.thoughtTooltip,
            {
              opacity: thoughtOpacity,
              transform: [
                {
                  translateY: thoughtOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleThoughtDismiss}
            style={styles.thoughtTooltipContent}
          >
            <View style={styles.thoughtHeader}>
              <Text style={styles.thoughtHeaderText}>💭 페르소나의 생각</Text>
              <TouchableOpacity onPress={handleThoughtDismiss} style={styles.thoughtCloseButton}>
                <Text style={styles.thoughtCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.thoughtQuestion}>{personaThought.question}</Text>
            
            {personaThought.topic && (
              <View style={styles.thoughtFooter}>
                <Text style={styles.thoughtTopic}>🏷️ {personaThought.topic}</Text>
                {personaThought.timestamp && (
                  <Text style={styles.thoughtTime}>
                    {new Date(personaThought.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
});

ChatInputBar.displayName = 'ChatInputBar';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  // 🎛️ REMOVED: settingsMenu, menuItem, menuIcon, menuText, menuDivider (moved to parent!)
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
  emotionButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  // 💭 Persona Thought Tooltip Styles
  thoughtBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(255, 105, 180, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thoughtBadgeText: {
    fontSize: moderateScale(10),
  },
  thoughtTooltip: {
    position: 'absolute',
    bottom: verticalScale(70),
    left: moderateScale(15),
    right: moderateScale(15),
    zIndex: 9999,
  },
  thoughtTooltipContent: {
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  thoughtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  thoughtHeaderText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  thoughtCloseButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  thoughtCloseText: {
    fontSize: moderateScale(20),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: moderateScale(20),
  },
  thoughtQuestion: {
    fontSize: moderateScale(16),
    color: '#FFF',
    lineHeight: moderateScale(24),
    marginBottom: moderateScale(12),
  },
  thoughtFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  thoughtTopic: {
    fontSize: moderateScale(12),
    color: 'rgba(255, 105, 180, 0.9)',
    fontWeight: '500',
  },
  thoughtTime: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default ChatInputBar;

