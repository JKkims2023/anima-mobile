/**
 * 💬 MessageInputOverlay - Emotional & Intuitive Input
 * 
 * Simple overlay with beautiful UI
 * 
 * Features:
 * - Blur backdrop (iOS) / Transparent backdrop (Android)
 * - Glass morphism card design
 * - Smooth animations
 * - Theme support (Deep Blue)
 * - Intuitive input with clear focus
 * 
 * @author JK & Hero AI
 */

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Keyboard, Platform, TextInput } from 'react-native';
// import { BlurView } from '@react-native-community/blur'; // ✅ Temporarily disabled for debugging
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

const MessageInputOverlay = forwardRef(({
  title,
  placeholder,
  leftIcon = 'text',
  initialValue = '',
  maxLength = 50,
  multiline = false,
  onSave,
}, ref) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const inputRef = useRef(null);

  // ✅ Simple state
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // ✅ Animation
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // ✅ Expose methods
  useImperativeHandle(ref, () => ({
    present: () => {
      console.log('[MessageInputOverlay] present() called');
      setVisible(true);
      setValue(initialValue);
    },
    dismiss: () => {
      console.log('[MessageInputOverlay] dismiss() called');
      handleClose();
    },
  }));

  // ✅ Show animation & Auto focus (optional)
  useEffect(() => {
    if (visible) {
      console.log('[MessageInputOverlay] Visible, starting animations...');
      
      // Animation
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      
      // ✅ Optional: Single focus attempt after animation
      // 사용자가 직접 input을 탭하는 것을 권장
      setTimeout(() => {
        console.log('[MessageInputOverlay] Animation complete, ready for input');
        // inputRef.current?.focus(); // ✅ Disabled: User will tap to focus
      }, 400);
    } else {
      console.log('[MessageInputOverlay] Not visible, hiding...');
    }
  }, [visible]);

  // ✅ Focus glow animation - 주석 처리 (Android 안정성)
  // useEffect(() => {
  //   if (isFocused) {
  //     glowOpacity.value = withTiming(1, { duration: 300 });
  //   } else {
  //     glowOpacity.value = withTiming(0, { duration: 300 });
  //   }
  // }, [isFocused]);

  // ✅ Keyboard listener - Move modal up when keyboard shows
  useEffect(() => {
    if (!visible) return;

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        console.log('[MessageInputOverlay] Keyboard showing, height:', e.endCoordinates.height);
        setKeyboardHeight(e.endCoordinates.height);
        
        // Move modal up
        const moveUp = e.endCoordinates.height / 2; // Move up by half of keyboard height
        translateY.value = withSpring(-moveUp, { damping: 25, stiffness: 400 });
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        console.log('[MessageInputOverlay] Keyboard hiding');
        setKeyboardHeight(0);
        
        // Move modal back to center
        translateY.value = withSpring(0, { damping: 25, stiffness: 400 });
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [visible]);

  // ✅ Handle save
  const handleSave = () => {
    if (!value || value.trim() === '') {
      return;
    }

    HapticService.light();
    onSave && onSave(value.trim());
    handleClose();
  };

  // ✅ Handle close
  const handleClose = () => {
    console.log('[MessageInputOverlay] handleClose() called');
    Keyboard.dismiss();
    opacity.value = withTiming(0, { duration: 250 });
    scale.value = withTiming(0.9, { duration: 250 }, () => {
      runOnJS(setVisible)(false);
    });
  };

  // ✅ Handle backdrop press (only if not focusing on input)
  const handleBackdropPress = () => {
    console.log('[MessageInputOverlay] Backdrop pressed, isFocused:', isFocused);
    // Don't close if input is focused (user is typing)
    if (!isFocused) {
      handleClose();
    }
  };

  // ✅ Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.95,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  // ✅ Glow style - 주석 처리 (Android 안정성)
  // const glowStyle = useAnimatedStyle(() => ({
  //   opacity: glowOpacity.value,
  // }));

  if (!visible) return null;

  console.log('[MessageInputOverlay] Rendering, visible:', visible, 'value:', value?.substring(0, 20));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
      hardwareAccelerated
    >
      {/* Backdrop - Simple for now (debugging keyboard issue) */}
      <TouchableOpacity 
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableOpacity>

      {/* Content - Touch-through container */}
      <View 
        style={styles.container}
        pointerEvents="box-none"
      >
        <Animated.View 
          style={[styles.card, cardStyle]}
          pointerEvents="auto"
        >
            {/* ✅ Neon Glow Layer - 주석 처리 (Android 안정성) */}
            {/* <Animated.View 
              style={[
                styles.glowLayer,
                glowStyle,
                { 
                  borderColor: COLORS.DEEP_BLUE,
                  shadowColor: COLORS.DEEP_BLUE,
                }
              ]} 
            /> */}

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={styles.iconContainer}>
                {/* ✅ 주석: 아이콘 색상 고정 (Android 안정성) */}
                <Icon 
                  name={leftIcon} 
                  size={moderateScale(20)} 
                  color={COLORS.DEEP_BLUE} 
                />
              </View>
              <CustomText type="middle" bold style={styles.title}>
                {title}
              </CustomText>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={moderateScale(24)} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          {/* Input - Direct TextInput for maximum compatibility */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                multiline && styles.inputMultiline,
                // isFocused && styles.inputFocused, // ✅ 주석: Android 내부 사각형 방지
              ]}
              value={value}
              onChangeText={(text) => {
                console.log('[MessageInputOverlay] Text changed:', text?.substring(0, 20));
                setValue(text);
              }}
              onFocus={() => {
                console.log('[MessageInputOverlay] Input focused!');
                setIsFocused(true);
                HapticService.light();
              }}
              onBlur={() => {
                console.log('[MessageInputOverlay] Input blurred!');
                setIsFocused(false);
              }}
              placeholder={placeholder}
              placeholderTextColor="rgba(156, 163, 175, 0.6)"
              multiline={multiline}
              numberOfLines={multiline ? 6 : 1}
              maxLength={maxLength}
              autoFocus={false}
              autoCorrect={false}
              autoCapitalize="sentences"
              textAlignVertical={multiline ? 'top' : 'center'}
              editable={true}
              selectTextOnFocus={false}
              returnKeyType={multiline ? 'default' : 'done'}
              blurOnSubmit={!multiline}
              onSubmitEditing={!multiline ? handleSave : undefined}
              underlineColorAndroid="transparent"
              includeFontPadding={false}
            />
            
            {/* Character counter */}
            <View style={styles.counterContainer}>
              <CustomText type="small" style={styles.counter}>
                {value.length} / {maxLength}
              </CustomText>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <CustomButton
              title={t('common.cancel')}
              type="outline"
              onPress={handleClose}
              style={styles.button}
            />
            <CustomButton
              title={`✨ ${t('common.save')}`}
              type="primary"
              onPress={handleSave}
              disabled={!value || value.trim() === ''}
              style={styles.button}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

MessageInputOverlay.displayName = 'MessageInputOverlay';

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  card: {
    width: '100%',
    maxWidth: scale(400),
    backgroundColor: 'rgba(10, 10, 10, 0.95)', // Glass morphism
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.5,
    shadowRadius: scale(20),
    elevation: 12,
    overflow: 'hidden',
  },
  glowLayer: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderRadius: scale(20),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: scale(15),
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: platformPadding(20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  iconContainer: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(79, 172, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.3)',
  },
  iconContainerActive: {
    backgroundColor: COLORS.DEEP_BLUE,
    borderColor: COLORS.DEEP_BLUE,
    shadowColor: COLORS.DEEP_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: scale(8),
    elevation: 5,
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: moderateScale(16),
  },
  closeButton: {
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputContainer: {
    padding: platformPadding(20),
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
      textAlignVertical: 'top',
      includeFontPadding: false,
      underlineColorAndroid: 'transparent',
    }),
  },
  inputMultiline: {
    minHeight: scale(120),
    maxHeight: scale(200),
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: COLORS.DEEP_BLUE,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    shadowColor: COLORS.DEEP_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 4,
  },
  counterContainer: {
    alignItems: 'flex-end',
    marginTop: scale(8),
  },
  counter: {
    color: 'rgba(156, 163, 175, 0.6)',
    fontSize: moderateScale(12),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: scale(12),
    padding: platformPadding(20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  button: {
    flex: 1,
  },
});

export default MessageInputOverlay;

