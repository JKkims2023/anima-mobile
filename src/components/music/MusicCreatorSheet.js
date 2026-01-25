/**
 * 🎵 MusicCreatorSheet Component - ANIMA Emotional Design
 * 
 * Bottom sheet for music creation input
 * - Music type selection (Radio buttons with gradient)
 * - Title input
 * - Prompt input
 * - Lyrics input (conditional for vocal type)
 * 
 * ✨ ANIMA Philosophy:
 * - Warm Pink/Purple Gradient (ANIMA Signature)
 * - Glassmorphic Design
 * - Smooth Animations
 * - Emotional Feedback
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16 (ANIMA Emotional Design Revolution)
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient'; // ⭐ NEW: ANIMA Gradient
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

  // ✨ ANIMA: Animations
  const lyricsHeight = useRef(new Animated.Value(0)).current;
  const instrumentalScale = useRef(new Animated.Value(1)).current;
  const vocalScale = useRef(new Animated.Value(1)).current;

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

  // ✨ ANIMA: Handle type selection with animation
  const handleTypeSelect = (type) => {
    HapticService.light();
    setMusicType(type);
    
    // ⭐ Pulse animation on selection
    const targetScale = type === 'instrumental' ? instrumentalScale : vocalScale;
    Animated.sequence([
      Animated.timing(targetScale, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(targetScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
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
            style: 'primary',
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

          {/* ✨ ANIMA: Radio Buttons (Gradient Border) */}
          <View style={styles.radioGroup}>
            {/* Instrumental */}
            <Animated.View style={{ flex: 1, transform: [{ scale: instrumentalScale }] }}>
              <TouchableOpacity
                style={styles.radioOptionWrapper}
                onPress={() => handleTypeSelect('instrumental')}
                activeOpacity={0.7}
              >
                {musicType === 'instrumental' ? (
                  <LinearGradient
                    colors={['#FF6B9D', '#FF1493', '#A78BFA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.radioGradientBorder}
                  >
                    <View style={[styles.radioOption, styles.radioOptionSelected]}>
                      <Icon name="music" size={scale(32)} color="#FF6B9D" />
                      <CustomText type="middle" bold style={[styles.radioLabel, { color: '#FF6B9D' }]}>
                        {t('music.creator.type_instrumental')}
                      </CustomText>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={[styles.radioOption, styles.radioOptionUnselected]}>
                    <Icon name="music" size={scale(28)} color={currentTheme.textSecondary} />
                    <CustomText type="middle" style={[styles.radioLabel, { color: currentTheme.textSecondary }]}>
                      {t('music.creator.type_instrumental')}
                    </CustomText>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Vocal */}
            <Animated.View style={{ flex: 1, transform: [{ scale: vocalScale }] }}>
              <TouchableOpacity
                style={styles.radioOptionWrapper}
                onPress={() => handleTypeSelect('vocal')}
                activeOpacity={0.7}
              >
                {musicType === 'vocal' ? (
                  <LinearGradient
                    colors={['#FF6B9D', '#FF1493', '#A78BFA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.radioGradientBorder}
                  >
                    <View style={[styles.radioOption, styles.radioOptionSelected]}>
                      <Icon name="microphone" size={scale(32)} color="#FF6B9D" />
                      <CustomText type="middle" bold style={[styles.radioLabel, { color: '#FF6B9D' }]}>
                        {t('music.creator.type_vocal')}
                      </CustomText>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={[styles.radioOption, styles.radioOptionUnselected]}>
                    <Icon name="microphone" size={scale(28)} color={currentTheme.textSecondary} />
                    <CustomText type="middle" style={[styles.radioLabel, { color: currentTheme.textSecondary }]}>
                      {t('music.creator.type_vocal')}
                    </CustomText>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
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

        {/* ✨ ANIMA: Gradient Submit Button */}
        <TouchableOpacity
          style={styles.submitButtonWrapper}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF6B9D', '#FF1493', '#A78BFA', '#8B7BFA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButtonGradient}
          >
            <Icon name="sparkles" size={scale(24)} color="#FFFFFF" />
            <CustomText type="middle" bold style={styles.submitButtonText}>
              {t('music.creator.submit_button_points')}
            </CustomText>
          </LinearGradient>
        </TouchableOpacity>
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
  // ✨ ANIMA: Radio Group (Gradient Border)
  radioGroup: {
    flexDirection: 'row',
    gap: scale(12),
  },
  radioOptionWrapper: {
    flex: 1,
  },
  radioGradientBorder: {
    borderRadius: scale(16),
    padding: 2, // ⭐ Border width (gradient thickness)
  },
  radioOption: {
    borderRadius: scale(14),
    padding: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(10),
  },
  radioOptionSelected: {
    backgroundColor: 'rgba(255, 107, 157, 0.08)', // ⭐ Pink tint
  },
  radioOptionUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  radioLabel: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  // ✨ ANIMA: Read-only Input Styles (Glassmorphic)
  inputLabel: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: scale(8),
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.15)', // ⭐ Pink tint border
    backgroundColor: 'rgba(255, 107, 157, 0.03)', // ⭐ Subtle pink background
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
    fontSize: moderateScale(12),
  },
  // ✨ ANIMA: Gradient Submit Button
  submitButtonWrapper: {
    marginTop: scale(30),
    borderRadius: moderateScale(14),
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B9D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
    display: 'none',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(24),
    borderRadius: moderateScale(14),
    gap: scale(10),
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
  },
});

export default MusicCreatorSheet;

