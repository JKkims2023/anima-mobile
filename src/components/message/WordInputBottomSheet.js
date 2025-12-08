/**
 * 💬 Word Input BottomSheet Component
 * 
 * Hashtag-style word input for custom particle effects
 * - User can add up to 4 words
 * - Click to remove words
 * - Visual feedback with chips
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HapticService from '../../utils/HapticService';
import { scale, verticalScale } from '../../utils/responsive-utils';

const MAX_WORDS = 4; // ⭐ 최대 4개 단어

const WordInputBottomSheet = ({ 
  sheetRef, 
  initialWords = [], 
  onSave,
  title = "단어 입력",
  placeholder = "단어 입력 후 추가 버튼을 눌러주세요"
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const inputRef = useRef(null);

  const [inputValue, setInputValue] = useState('');
  const [words, setWords] = useState(initialWords);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Add Word
  // ═══════════════════════════════════════════════════════════════════════════
  const handleAddWord = () => {
    const trimmedWord = inputValue.trim();
    
    if (!trimmedWord) {
      HapticService.error();
      return;
    }

    if (words.length >= MAX_WORDS) {
      HapticService.error();
      console.log(`[WordInputBottomSheet] Maximum ${MAX_WORDS} words reached`);
      return;
    }

    if (words.includes(trimmedWord)) {
      HapticService.warning();
      console.log('[WordInputBottomSheet] Word already exists');
      return;
    }

    HapticService.success();
    setWords([...words, trimmedWord]);
    setInputValue('');
    console.log('[WordInputBottomSheet] Word added:', trimmedWord);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Remove Word
  // ═══════════════════════════════════════════════════════════════════════════
  const handleRemoveWord = (wordToRemove) => {
    HapticService.light();
    setWords(words.filter(word => word !== wordToRemove));
    console.log('[WordInputBottomSheet] Word removed:', wordToRemove);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Save
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSave = () => {
    if (words.length === 0) {
      HapticService.error();
      return;
    }

    HapticService.success();
    onSave(words);
    sheetRef.current?.dismiss();
    console.log('[WordInputBottomSheet] Saved words:', words);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handler: Reset
  // ═══════════════════════════════════════════════════════════════════════════
  const handleReset = () => {
    HapticService.light();
    setWords([]);
    setInputValue('');
    console.log('[WordInputBottomSheet] Reset all words');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render: Word Chip
  // ═══════════════════════════════════════════════════════════════════════════
  const renderWordChip = (word) => (
    <TouchableOpacity
      key={word}
      style={[styles.wordChip, { backgroundColor: theme.cardBackground || 'rgba(255, 255, 255, 0.1)' }]}
      onPress={() => handleRemoveWord(word)}
      activeOpacity={0.7}
    >
      <CustomText style={[styles.wordText, { color: theme.textPrimary || '#FFF' }]}>
        {word}
      </CustomText>
      <Icon name="close-circle" size={scale(18)} color={theme.textSecondary || 'rgba(255, 255, 255, 0.7)'} />
    </TouchableOpacity>
  );

  return (
    <CustomBottomSheet
      ref={sheetRef}
      title={title}
      snapPoints={['70%']}
      enableDynamicSizing={false}
      subtitle={`최대 ${MAX_WORDS}개의 단어를 추가할 수 있습니다`}
      buttons={[
        {
          title: '초기화',
          onPress: handleReset,
          type: 'outline',
        },
        {
          title: '저장',
          onPress: handleSave,
          type: 'primary',
          disabled: words.length === 0,
        },
      ]}
    >
      <View style={styles.container}>
        {/* ⭐ Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: theme.textPrimary || '#FFF',
                backgroundColor: theme.inputBackground || 'rgba(255, 255, 255, 0.05)',
                borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.1)',
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary || 'rgba(255, 255, 255, 0.5)'}
            value={inputValue}
            onChangeText={setInputValue}
            maxLength={10} // ⭐ 단어당 최대 10자
            returnKeyType="done"
            onSubmitEditing={handleAddWord}
          />
          
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: words.length >= MAX_WORDS 
                  ? 'rgba(150, 150, 150, 0.3)' 
                  : (theme.primary || '#3B82F6')
              },
            ]}
            onPress={handleAddWord}
            disabled={words.length >= MAX_WORDS}
            activeOpacity={0.7}
          >
            <Icon 
              name="plus" 
              size={scale(20)} 
              color="#FFF" 
            />
          </TouchableOpacity>
        </View>

        {/* ⭐ Words Counter */}
        <View style={styles.counterContainer}>
          <CustomText style={[styles.counterText, { color: theme.textSecondary || 'rgba(255, 255, 255, 0.7)' }]}>
            {words.length} / {MAX_WORDS} 단어
          </CustomText>
        </View>

        {/* ⭐ Word Chips Area */}
        <View style={styles.wordsContainer}>
          {words.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="tag-multiple-outline" size={scale(48)} color={theme.textSecondary || 'rgba(255, 255, 255, 0.3)'} />
              <CustomText style={[styles.emptyText, { color: theme.textSecondary || 'rgba(255, 255, 255, 0.5)' }]}>
                단어를 추가해주세요
              </CustomText>
              <CustomText style={[styles.emptySubtext, { color: theme.textSecondary || 'rgba(255, 255, 255, 0.3)' }]}>
                추가된 단어는 파티클 효과로 표현됩니다
              </CustomText>
            </View>
          ) : (
            <View style={styles.chipsWrapper}>
              {words.map(renderWordChip)}
            </View>
          )}
        </View>

        {/* ⭐ Guide Text */}
        <View style={styles.guideContainer}>
          <Icon name="information-outline" size={scale(16)} color={theme.textSecondary || 'rgba(255, 255, 255, 0.5)'} />
          <CustomText style={[styles.guideText, { color: theme.textSecondary || 'rgba(255, 255, 255, 0.5)' }]}>
            단어를 클릭하면 삭제됩니다
          </CustomText>
        </View>
      </View>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(12),
  },
  input: {
    flex: 1,
    height: verticalScale(48),
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    fontSize: scale(16),
    borderWidth: 1,
  },
  addButton: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterContainer: {
    alignItems: 'flex-end',
    marginBottom: verticalScale(16),
  },
  counterText: {
    fontSize: scale(13),
  },
  wordsContainer: {
    minHeight: verticalScale(150),
    marginBottom: verticalScale(16),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  emptyText: {
    fontSize: scale(16),
    marginTop: verticalScale(12),
  },
  emptySubtext: {
    fontSize: scale(13),
    marginTop: verticalScale(4),
    textAlign: 'center',
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
    gap: scale(6),
  },
  wordText: {
    fontSize: scale(15),
    fontWeight: '600',
  },
  guideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  guideText: {
    fontSize: scale(12),
  },
});

export default WordInputBottomSheet;

