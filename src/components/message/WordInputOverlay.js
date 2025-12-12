/**
 * 💬 WordInputOverlay - Custom Word Input for Particle Effects
 * 
 * Based on MessageInputOverlay pattern for maximum Korean input compatibility
 * 
 * Features:
 * - Modal-based (NO CustomBottomSheet)
 * - Direct TextInput for Korean input stability
 * - Add/Remove words with chip UI
 * - Max 4 words
 * - Sequential colors
 * 
 * @author JK & Hero AI
 */

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Keyboard, Platform, TextInput, ScrollView } from 'react-native';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, moderateScale, verticalScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

const MAX_WORDS = 4; // Maximum words allowed

const COLOR_PALETTE = [
  '#FF6B9D', // Pink
  '#4ECDC4', // Turquoise
  '#FFE66D', // Yellow
  '#A8E6CF', // Mint
];

const WordInputOverlay = forwardRef(({
  title,
  placeholder,
  initialWords = [],
  maxLength = 15, // ⭐ NEW: Dynamic max length (15 for words, 30 for sentences)
  onSave,
}, ref) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const inputRef = useRef(null);

  // ✅ Simple state
  const [visible, setVisible] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [words, setWords] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // ✅ Animation
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(0);

  // ✅ Expose methods
  useImperativeHandle(ref, () => ({
    present: () => {
      console.log('[WordInputOverlay] present() called');
      setVisible(true);
      setWords(initialWords);
      setCurrentInput('');
    },
    dismiss: () => {
      console.log('[WordInputOverlay] dismiss() called');
      handleClose();
    },
  }));

  // ✅ Show animation
  useEffect(() => {
    if (visible) {
      console.log('[WordInputOverlay] Visible, starting animations...');
      
      // Animation
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      console.log('[WordInputOverlay] Not visible, hiding...');
    }
  }, [visible]);

  // ✅ Keyboard listener - Move modal up when keyboard shows
  useEffect(() => {
    if (!visible) return;

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        console.log('[WordInputOverlay] Keyboard showing, height:', e.endCoordinates.height);
        setKeyboardHeight(e.endCoordinates.height);
        
        // Move modal up
        const moveUp = e.endCoordinates.height / 2; // Move up by half of keyboard height
        translateY.value = withSpring(-moveUp, { damping: 25, stiffness: 400 });
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        console.log('[WordInputOverlay] Keyboard hiding');
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

  // ✅ Handle add word
  const handleAddWord = () => {
    const trimmedInput = currentInput.trim();
    
    if (!trimmedInput) {
      HapticService.warning();
      return;
    }
    
    if (words.includes(trimmedInput)) {
      HapticService.warning();
      // Optionally show toast: "Already added"
      return;
    }
    
    if (words.length >= MAX_WORDS) {
      HapticService.warning();
      // Optionally show toast: "Maximum 4 words"
      return;
    }
    
    setWords((prev) => [...prev, trimmedInput]);
    setCurrentInput('');
    HapticService.light();
    console.log('[WordInputOverlay] Word added:', trimmedInput);
  };

  // ✅ Handle remove word
  const handleRemoveWord = (wordToRemove) => {
    setWords((prev) => prev.filter((word) => word !== wordToRemove));
    HapticService.light();
    console.log('[WordInputOverlay] Word removed:', wordToRemove);
  };

  // ✅ Handle save
  const handleSave = () => {
    if (words.length === 0) {
      HapticService.warning();
      return;
    }

    HapticService.success();
    onSave && onSave(words);
    handleClose();
  };

  // ✅ Handle close
  const handleClose = () => {
    console.log('[WordInputOverlay] handleClose() called');
    Keyboard.dismiss();
    opacity.value = withTiming(0, { duration: 250 });
    scale.value = withTiming(0.9, { duration: 250 }, () => {
      runOnJS(setVisible)(false);
    });
  };

  // ✅ Handle backdrop press (only if not focusing on input)
  const handleBackdropPress = () => {
    console.log('[WordInputOverlay] Backdrop pressed, isFocused:', isFocused);
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

  if (!visible) return null;

  console.log('[WordInputOverlay] Rendering, visible:', visible, 'words:', words);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
      hardwareAccelerated
    >
      {/* Backdrop */}
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={styles.iconContainer}>
                <Icon 
                  name="format-text" 
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

          {/* Input Row */}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={currentInput}
              onChangeText={setCurrentInput}
              onFocus={() => {
                console.log('[WordInputOverlay] Input focused!');
                setIsFocused(true);
                HapticService.light();
              }}
              onBlur={() => {
                console.log('[WordInputOverlay] Input blurred!');
                setIsFocused(false);
              }}
              onSubmitEditing={handleAddWord}
              placeholder={placeholder}
              placeholderTextColor="rgba(156, 163, 175, 0.6)"
              maxLength={maxLength} // ⭐ Dynamic max length (15 for words, 30 for sentences)
              autoFocus={false}
              autoCorrect={false}
              autoCapitalize="sentences"
              editable={true}
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={[
                styles.addButton,
                (words.length >= MAX_WORDS || !currentInput.trim()) && styles.addButtonDisabled
              ]} 
              onPress={handleAddWord}
              disabled={words.length >= MAX_WORDS || !currentInput.trim()}
            >
              <Icon name="plus" size={moderateScale(20)} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Word Count */}
          <View style={styles.wordCountContainer}>
            <CustomText style={styles.wordCount}>
              {words.length} / {MAX_WORDS} 
            </CustomText>
          </View>

          {/* Words Container - ScrollView for many words */}
          <ScrollView 
            style={styles.wordsScrollContainer}
            contentContainerStyle={styles.wordsContainer}
            showsVerticalScrollIndicator={false}
          >
            {words.map((word, index) => (
              <TouchableOpacity 
                key={`${word}-${index}`}
                style={[
                  styles.wordChip, 
                  { borderColor: COLOR_PALETTE[index % COLOR_PALETTE.length] }
                ]} 
                onPress={() => handleRemoveWord(word)}
                activeOpacity={0.7}
              >
                <CustomText style={styles.wordText}>{word}</CustomText>
                <Icon 
                  name="close-circle" 
                  size={moderateScale(16)} 
                  color="#fff" 
                  style={styles.removeIcon} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleClose}
            >
              <CustomText style={styles.cancelButtonText}>
                {t('common.cancel') || '취소'}
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.saveButton,
                words.length === 0 && styles.saveButtonDisabled
              ]} 
              onPress={handleSave}
              disabled={words.length === 0}
            >
              <CustomText style={styles.saveButtonText}>
                {t('common.save') || '저장'}
              </CustomText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  card: {
    width: '100%',
    maxWidth: scale(400),
    backgroundColor: 'rgba(20, 20, 35, 0.98)',
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(79, 172, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  title: {
    fontSize: moderateScale(18),
    color: '#FFFFFF',
  },
  closeButton: {
    padding: scale(4),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  textInput: {
    flex: 1,
    height: verticalScale(45),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: scale(15),
    fontSize: scale(16),
    color: '#FFFFFF',
  },
  addButton: {
    marginLeft: scale(10),
    width: scale(45),
    height: verticalScale(45),
    borderRadius: scale(10),
    backgroundColor: COLORS.DEEP_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(79, 172, 254, 0.3)',
  },
  wordCountContainer: {
    marginBottom: verticalScale(10),
    alignItems: 'flex-end',
  },
  wordCount: {
    fontSize: scale(14),
    color: 'rgba(156, 163, 175, 0.8)',
  },
  wordsScrollContainer: {
    maxHeight: verticalScale(120),
    marginBottom: verticalScale(20),
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  wordText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '900',
    marginRight: scale(5),
  },
  removeIcon: {
    marginLeft: scale(2),
  },
  footer: {
    flexDirection: 'row',
    gap: scale(10),
  },
  button: {
    flex: 1,
    height: verticalScale(50),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: COLORS.DEEP_BLUE,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(79, 172, 254, 0.3)',
  },
  saveButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default WordInputOverlay;

