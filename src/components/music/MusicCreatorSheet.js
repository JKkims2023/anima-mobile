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
import CustomButton from '../CustomButton';
import MessageInputOverlay from '../message/MessageInputOverlay';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnima } from '../../contexts/AnimaContext';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import amountService from '../../services/api/amountService';
import { useUser } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
/**
 * MusicCreatorSheet Component
 */
const MusicCreatorSheet = forwardRef(({ onSubmit }, ref) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { showToast, showAlert } = useAnima();
  const bottomSheetRef = useRef(null);
  const { user } = useUser();
  const navigation = useNavigation();
  // Input overlay refs
  const titleInputRef = useRef(null);
  const promptInputRef = useRef(null);
  const lyricsInputRef = useRef(null);

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
  const handleSubmit = async () => {

    try{
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

      if (!user || !user?.user_key) {

        console.log('[MusicCreatorSheet] User key not found');
        HapticService.warning();
        showToast({
          type: 'error',
          message: t('music.creator.user_key_error'),
          emoji: '⚠️',
        });

        navigation.navigate('Settings');
        return;
      }

      const serviceData = await amountService.getServiceData({
        user_key: user.user_key,
      });

      let music_amount = 0;

      if (!serviceData.success) {
        HapticService.warning();
        console.log('[MusicCreatorSheet] Service data fetch failed');
        return;
      }else{
        
        music_amount = serviceData.data.music_amount;
      
      }

      HapticService.success();

      showAlert({
        title: t('music.creator.submit_confirm_title'),
        message: t('music.creator.submit_confirm_message', { cost: music_amount }),
        emoji: '🎵',
        buttons: [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.confirm'),
            onPress: () => {
              onSubmit?.({
                music_type: musicType,
                music_title: title.trim(),
                prompt: prompt.trim(),
                lyrics: musicType === 'vocal' ? lyrics.trim() : '',
              });
              // Close sheet and reset form
              bottomSheetRef.current?.dismiss();
              handleClose();
            },
          },
        ],
      });

    } catch (error) {

      console.error('[MusicCreatorSheet] Validation error:', error);
      HapticService.warning();
      showToast({
        type: 'error',
        message: error.message,
        emoji: '⚠️',
      });
    }
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
      snapPoints={['80%']}
      onClose={handleClose}
      buttons={[{
        title: t('common.close'),
        type: 'outline',
        onPress: (() => {
          bottomSheetRef.current?.dismiss();
          handleClose();
        }),
      },
        {
          title: t('common.create'),
          type: 'primary',
          onPress: (() => {
            handleSubmit();
          }),
        },
      ]}
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
              </View>
              <CustomText type="middle" bold style={styles.radioLabel}>
                  {t('music.creator.type_instrumental')}
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
              </View>
              <CustomText type="middle" bold style={styles.radioLabel}>
                  {t('music.creator.type_vocal')}
                </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title Input (Read-only View) */}
        <View style={styles.section}>
          <CustomText type="middle" style={styles.inputLabel}>
            {t('music.creator.title_label')}
          </CustomText>
          <TouchableOpacity
            style={[
              styles.readOnlyInput,
              { 
                backgroundColor: currentTheme.cardBackground,
                borderColor: currentTheme.borderColor,
              }
            ]}
            onPress={() => {
              HapticService.light();
              titleInputRef.current?.present();
            }}
            activeOpacity={0.7}
          >
            <CustomText
              type="normal"
              style={[
                styles.readOnlyText,
                { color: title ? currentTheme.textPrimary : currentTheme.textSecondary }
              ]}
            >
              {title || t('music.creator.title_placeholder')}
            </CustomText>
            <Icon name="pencil" size={scale(20)} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Prompt Input (Read-only View) */}
        <View style={styles.section}>
          <CustomText type="middle" style={styles.inputLabel}>
            {t('music.creator.prompt_label')}
          </CustomText>
          <TouchableOpacity
            style={[
              styles.readOnlyInput,
              { 
                backgroundColor: currentTheme.cardBackground,
                borderColor: currentTheme.borderColor,
              }
            ]}
            onPress={() => {
              HapticService.light();
              promptInputRef.current?.present();
            }}
            activeOpacity={0.7}
          >
            <CustomText
              type="normal"
              style={[
                styles.readOnlyText,
                { color: prompt ? currentTheme.textPrimary : currentTheme.textSecondary }
              ]}
              numberOfLines={1}
            >
              {prompt || t('music.creator.prompt_placeholder')}
            </CustomText>
            <Icon name="pencil" size={scale(20)} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Lyrics Input (Conditional, Read-only View) */}
        <Animated.View style={[styles.section, lyricsContainerStyle]}>
          <CustomText type="middle" style={styles.inputLabel}>
            {t('music.creator.lyrics_label')}
          </CustomText>
          <TouchableOpacity
            style={[
              styles.readOnlyInput,
              { 
                backgroundColor: currentTheme.cardBackground,
                borderColor: currentTheme.borderColor,
              }
            ]}
            onPress={() => {
              HapticService.light();
              lyricsInputRef.current?.present();
            }}
            activeOpacity={0.7}
          >
            <CustomText
              type="normal"
              style={[
                styles.readOnlyText,
                { color: lyrics ? currentTheme.textPrimary : currentTheme.textSecondary }
              ]}
              numberOfLines={4}
            >
              {lyrics || t('music.creator.lyrics_placeholder')}
            </CustomText>
            <Icon name="pencil" size={scale(20)} color={currentTheme.textSecondary} />
          </TouchableOpacity>
          <CustomText type="normal" style={styles.lyricsDescription}>
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

      {/* Input Overlays */}
      <MessageInputOverlay
        ref={titleInputRef}
        title={t('music.creator.title_label')}
        placeholder={t('music.creator.title_placeholder')}
        value={title}
        onSave={setTitle}
        maxLength={100}
        multiline={false}
      />

      <MessageInputOverlay
        ref={promptInputRef}
        title={t('music.creator.prompt_label')}
        placeholder={t('music.creator.prompt_placeholder')}
        value={prompt}
        onSave={setPrompt}
        maxLength={500}
        multiline={true}
      />

      <MessageInputOverlay
        ref={lyricsInputRef}
        title={t('music.creator.lyrics_label')}
        placeholder={t('music.creator.lyrics_placeholder')}
        value={lyrics}
        onSave={setLyrics}
        maxLength={1000}
        multiline={true}
      />
    </CustomBottomSheet>
  );
});

MusicCreatorSheet.displayName = 'MusicCreatorSheet';

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scale(0),
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
    flexDirection: 'row',
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
    display: 'none',
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
  // Read-only Input Styles
  inputLabel: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: scale(8),
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },
  readOnlyInputMultiline: {
    alignItems: 'flex-start',
    minHeight: verticalScale(80),
  },
  readOnlyText: {
    flex: 1,
    marginRight: scale(8),
  },
  readOnlyTextMultiline: {
    lineHeight: verticalScale(22),
  },
  lyricsDescription: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: scale(8),
    fontStyle: 'italic',
  },
  submitSection: {
    marginTop: scale(20),
    display: 'none',
  },
});

export default MusicCreatorSheet;

