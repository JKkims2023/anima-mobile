/**
 * 🎵 MusicCreatorSheet Component
 * 
 * Bottom sheet for music creation input
 * - Music type selection (Radio buttons)
 * - Title input
 * - Prompt input
 * - Lyrics input (conditional for vocal type)
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import CustomTextInput from '../CustomTextInput';
import CustomButton from '../CustomButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnima } from '../../contexts/AnimaContext';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

/**
 * MusicCreatorSheet Component
 */
const MusicCreatorSheet = forwardRef(({ onSubmit }, ref) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { showToast } = useAnima();
  const bottomSheetRef = useRef(null);

  // Form state
  const [musicType, setMusicType] = useState('instrumental'); // 'instrumental' | 'vocal'
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');

  // Animation for lyrics field
  const lyricsHeight = useRef(new Animated.Value(0)).current;

  // Expose present/dismiss methods
  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  // Animate lyrics field when music type changes
  useEffect(() => {
    Animated.timing(lyricsHeight, {
      toValue: musicType === 'vocal' ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [musicType]);

  // Reset form when sheet is closed
  const handleClose = () => {
    setMusicType('instrumental');
    setTitle('');
    setPrompt('');
    setLyrics('');
  };

  // Handle type selection
  const handleTypeSelect = (type) => {
    HapticService.light();
    setMusicType(type);
  };

  // Handle submit
  const handleSubmit = () => {
    // Validation
    if (!title.trim()) {
      showToast({
        type: 'warning',
        message: t('music.creator.validation.title_required'),
        emoji: '⚠️',
      });
      return;
    }

    if (!prompt.trim()) {
      showToast({
        type: 'warning',
        message: t('music.creator.validation.prompt_required'),
        emoji: '⚠️',
      });
      return;
    }

    HapticService.success();

    // Submit data
    onSubmit?.({
      music_type: musicType,
      music_title: title.trim(),
      prompt: prompt.trim(),
      lyrics: musicType === 'vocal' ? lyrics.trim() : '',
    });

    // Close sheet and reset form
    bottomSheetRef.current?.dismiss();
    handleClose();
  };

  const lyricsContainerStyle = {
    maxHeight: lyricsHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, verticalScale(180)],
    }),
    opacity: lyricsHeight,
    overflow: 'hidden',
  };

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      title={t('music.creator.title')}
      snapPoints={['90%']}
      onClose={handleClose}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Music Type Selection */}
        <View style={styles.section}>
          <CustomText type="normal" bold style={styles.sectionTitle}>
            {t('music.creator.type_label')}
          </CustomText>

          {/* Radio Buttons */}
          <View style={styles.radioGroup}>
            {/* Instrumental */}
            <TouchableOpacity
              style={[
                styles.radioOption,
                musicType === 'instrumental' && {
                  backgroundColor: `${currentTheme.mainColor || COLORS.MAIN_COLOR}20`,
                  borderColor: currentTheme.mainColor || COLORS.MAIN_COLOR,
                },
              ]}
              onPress={() => handleTypeSelect('instrumental')}
              activeOpacity={0.7}
            >
              <View style={styles.radioLeft}>
                <View style={[
                  styles.radioCircle,
                  musicType === 'instrumental' && {
                    borderColor: currentTheme.mainColor || COLORS.MAIN_COLOR,
                  },
                ]}>
                  {musicType === 'instrumental' && (
                    <View style={[
                      styles.radioCircleFill,
                      { backgroundColor: currentTheme.mainColor || COLORS.MAIN_COLOR },
                    ]} />
                  )}
                </View>
                <Icon name="music" size={scale(20)} color={currentTheme.mainColor || COLORS.MAIN_COLOR} />
                <CustomText type="normal" bold style={styles.radioLabel}>
                  {t('music.creator.type_instrumental')}
                </CustomText>
              </View>
              <CustomText type="small" style={styles.radioDesc}>
                {t('music.creator.type_instrumental_desc')}
              </CustomText>
            </TouchableOpacity>

            {/* Vocal */}
            <TouchableOpacity
              style={[
                styles.radioOption,
                musicType === 'vocal' && {
                  backgroundColor: `${currentTheme.mainColor || COLORS.MAIN_COLOR}20`,
                  borderColor: currentTheme.mainColor || COLORS.MAIN_COLOR,
                },
              ]}
              onPress={() => handleTypeSelect('vocal')}
              activeOpacity={0.7}
            >
              <View style={styles.radioLeft}>
                <View style={[
                  styles.radioCircle,
                  musicType === 'vocal' && {
                    borderColor: currentTheme.mainColor || COLORS.MAIN_COLOR,
                  },
                ]}>
                  {musicType === 'vocal' && (
                    <View style={[
                      styles.radioCircleFill,
                      { backgroundColor: currentTheme.mainColor || COLORS.MAIN_COLOR },
                    ]} />
                  )}
                </View>
                <Icon name="microphone" size={scale(20)} color={currentTheme.mainColor || COLORS.MAIN_COLOR} />
                <CustomText type="normal" bold style={styles.radioLabel}>
                  {t('music.creator.type_vocal')}
                </CustomText>
              </View>
              <CustomText type="small" style={styles.radioDesc}>
                {t('music.creator.type_vocal_desc')}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <CustomTextInput
            label={t('music.creator.title_label')}
            placeholder={t('music.creator.title_placeholder')}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Prompt Input */}
        <View style={styles.section}>
          <CustomTextInput
            label={t('music.creator.prompt_label')}
            placeholder={t('music.creator.prompt_placeholder')}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Lyrics Input (Conditional) */}
        <Animated.View style={[styles.section, lyricsContainerStyle]}>
          <CustomTextInput
            label={t('music.creator.lyrics_label')}
            placeholder={t('music.creator.lyrics_placeholder')}
            value={lyrics}
            onChangeText={setLyrics}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          <CustomText type="small" style={styles.lyricsDescription}>
            {t('music.creator.lyrics_description')}
          </CustomText>
        </Animated.View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <CustomButton
            title={t('music.creator.submit_button_points')}
            onPress={handleSubmit}
            leftIcon={<Icon name="sparkles" size={scale(20)} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </CustomBottomSheet>
  );
});

MusicCreatorSheet.displayName = 'MusicCreatorSheet';

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(40),
  },
  section: {
    marginBottom: scale(20),
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(12),
  },
  radioGroup: {
    gap: scale(12),
  },
  radioOption: {
    borderWidth: 2,
    borderColor: 'rgba(62, 80, 180, 0.3)',
    borderRadius: scale(12),
    padding: scale(16),
  },
  radioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginBottom: scale(8),
  },
  radioCircle: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: 'rgba(62, 80, 180, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleFill: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
  },
  radioLabel: {
    color: COLORS.TEXT_PRIMARY,
  },
  radioDesc: {
    color: COLORS.TEXT_SECONDARY,
    paddingLeft: scale(32),
  },
  lyricsDescription: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: scale(8),
    fontStyle: 'italic',
  },
  submitSection: {
    marginTop: scale(20),
  },
});

export default MusicCreatorSheet;

