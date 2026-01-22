/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎭 ChoicePersonaSheet Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Persona creation bottom sheet with perfect UI/UX
 * - Photo upload with preview
 * - Name input with real-time validation
 * - Gender selection (Male/Female)
 * - Point information card (optional)
 * 
 * Design Principles:
 * ✅ Consistent spacing (scale/verticalScale)
 * ✅ Typography hierarchy (CustomText)
 * ✅ Color system (COLORS)
 * ✅ Smooth animations (reanimated)
 * ✅ Emotional feedback (haptic)
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-30
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { launchImageLibrary } from 'react-native-image-picker';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';
import MessageInputOverlay from '../message/MessageInputOverlay';

const MainHelpFeedbackSheet = ({
  isOpen,
  onClose,
  onCreateStart, // (data) => { file, name, gender }
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const bottomSheetRef = useRef(null);
  
  // ✅ Modal Refs for Input Overlays
  const nameInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  // States
  const [photo, setPhoto] = useState(null); // { uri, type, name }
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState('male'); // 'male' | 'female'
  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [showPointInfo, setShowPointInfo] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  // Animation values
  const photoScale = useSharedValue(0);
  const nameCheckScale = useSharedValue(0);
  const descriptionCheckScale = useSharedValue(0);
  const pointInfoHeight = useSharedValue(0);

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLE OPEN/CLOSE + RESET
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    console.log('[ChoicePersonaSheet] 🎬 isOpen changed:', isOpen);
    
    if (isOpen) {
      console.log('[ChoicePersonaSheet] ✅ Presenting bottom sheet');
      bottomSheetRef.current?.present();
    } else {
      console.log('[ChoicePersonaSheet] ❌ Dismissing bottom sheet');
      bottomSheetRef.current?.dismiss();
      
      // Reset all states on close
      setPhoto(null);
      setName('');
      setGender('male');
      setNameError('');
      setDescription('');
      setDescriptionError('');
      setShowPointInfo(false);
      setIsNameFocused(false);
      setIsDescriptionFocused(false);
      photoScale.value = 0;
      nameCheckScale.value = 0;
      descriptionCheckScale.value = 0;
      pointInfoHeight.value = 0;
    }
  }, [isOpen, photoScale, nameCheckScale, descriptionCheckScale,  pointInfoHeight]);

  // ═══════════════════════════════════════════════════════════════════════
  // PHOTO UPLOAD
  // ═══════════════════════════════════════════════════════════════════════

  const handlePhotoSelect = useCallback(() => {
    HapticService.light();

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('[ChoicePersonaSheet] Photo selection cancelled');
      } else if (response.errorCode) {
        console.error('[ChoicePersonaSheet] Photo selection error:', response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        const selectedPhoto = {
          uri: response.assets[0].uri,
          type: response.assets[0].type || 'image/jpeg',
          name: response.assets[0].fileName || 'photo.jpg',
        };

        setPhoto(selectedPhoto);
        HapticService.success();

        // Animate photo appearance
        photoScale.value = withSpring(1, {
          damping: 15,
          stiffness: 150,
        });

        console.log('[ChoicePersonaSheet] Photo selected:', selectedPhoto.uri);
      }
    });
  }, [photoScale]);

  const handlePhotoRemove = useCallback(() => {
    HapticService.light();
    
    /*
    // Animate out
    photoScale.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.ease),
    }, () => {
      setPhoto(null);
    });
    */
    setPhoto(null);
  }, [photoScale]);

  // ═══════════════════════════════════════════════════════════════════════
  // INPUT MODAL HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleNameClick = useCallback(() => {
    HapticService.light();
    nameInputRef.current?.present();
  }, []);

  const handleDescriptionClick = useCallback(() => {
    HapticService.light();
    descriptionInputRef.current?.present();
  }, []);

  const handleNameSave = useCallback((value) => {
    console.log('✅ [ChoicePersonaSheet] Name saved:', value);
    setName(value);
    validateName(value);
  }, []);

  const handleDescriptionSave = useCallback((value) => {
    console.log('✅ [ChoicePersonaSheet] Description saved:', value);
    setDescription(value);
    validateDescription(value);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // NAME VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  const validateName = useCallback((value) => {
    if (!value || value.trim() === '') {
      setNameError('required');
      nameCheckScale.value = withTiming(0, { duration: 200 });
      return false;
    }
    if (value.length > 20) {
      setNameError('too_long');
      nameCheckScale.value = withTiming(0, { duration: 200 });
      return false;
    }
    setNameError('');
    nameCheckScale.value = withSpring(1, {
      damping: 15,
      stiffness: 200,
    });
    return true;
  }, [nameCheckScale]);

  // ═══════════════════════════════════════════════════════════════════════
  // DESCRIPTION VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  const validateDescription = useCallback((value) => {
    if (!value || value.trim() === '') {
      setDescriptionError('required');
      descriptionCheckScale.value = withTiming(0, { duration: 200 });
      return false;
    }

  if (value.length > 50) {
    setDescriptionError('too_long');
    descriptionCheckScale.value = withTiming(0, { duration: 200 });
    return false;
  }
  setDescriptionError('');
  descriptionCheckScale.value = withSpring(1, {
    damping: 15,
    stiffness: 200,
  });
  return true;
}, [descriptionCheckScale]);




  // ═══════════════════════════════════════════════════════════════════════
  // GENDER SELECTION
  // ═══════════════════════════════════════════════════════════════════════

  const handleGenderSelect = useCallback((selectedGender) => {
    HapticService.selection();
    setGender(selectedGender);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // POINT INFO TOGGLE
  // ═══════════════════════════════════════════════════════════════════════

  const handlePointInfoToggle = useCallback(() => {
    HapticService.light();
    setShowPointInfo(prev => {
      const newValue = !prev;
      pointInfoHeight.value = withTiming(newValue ? 120 : 0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });
      return newValue;
    });
  }, [pointInfoHeight]);

  // ═══════════════════════════════════════════════════════════════════════
  // SUBMIT
  // ═══════════════════════════════════════════════════════════════════════

  const handleCreate = useCallback(() => {
    // Validation
    if (!photo) {
      HapticService.warning();
      // TODO: Show toast
      console.log('[ChoicePersonaSheet] Photo required');
      return;
    }

    if (!validateName(name)) {
      HapticService.warning();
      console.log('[ChoicePersonaSheet] Name validation failed');
      return;
    }

    if (!validateDescription(description)) {
      HapticService.warning();
      console.log('[ChoicePersonaSheet] Description validation failed');
      return;
    }

    HapticService.success();

    // Pass data to parent
    onCreateStart({
      file: photo,
      name: name.trim(),
      description: description.trim(),
      gender: gender,
    });

    // Close sheet
    onClose();
  }, [photo, name, description, gender, validateName, validateDescription, onCreateStart, onClose]);


  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATED STYLES
  // ═══════════════════════════════════════════════════════════════════════

  const photoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: photoScale.value }],
    opacity: photoScale.value,
  }));

  const nameCheckAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nameCheckScale.value }],
    opacity: nameCheckScale.value,
  }));

  const descriptionCheckAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: descriptionCheckScale.value }],
    opacity: descriptionCheckScale.value,
  }));

  const pointInfoAnimStyle = useAnimatedStyle(() => ({
    height: pointInfoHeight.value,
    opacity: pointInfoHeight.value / 120,
  }));

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  console.log('[ChoicePersonaSheet] 🎨 Rendering with isOpen:', isOpen);

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      onClose={onClose}
      snapPoints={['85%']}
      title={t('help.message_feedback_help.title')}
      showCloseButton={true}
      buttons={[
        {
          title: t('common.close', '닫기'),
          type: 'primary',
          onPress: onClose,
        }
      ]}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: Name Input (클릭 시 Modal)                              */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={[styles.section, {  marginTop: verticalScale(-10) }]}>
          
          <CustomText type="middle" style={[styles.sectionTitle, {  color: currentTheme.textSecondary, marginTop: verticalScale(10), marginBottom: verticalScale(20) }]}>
            {t('help.message_feedback_help.description')}
          </CustomText>
          
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: scale(8)}}>
            
            <CustomText type="title" bold style={styles.sectionTitle}>
              {t('help.message_feedback_help.section_title_one')}
            </CustomText>
            </View>
          </View>

          <CustomText type="normal" style={[styles.sectionDescription, { color: currentTheme.textSecondary }]}>
            {t('help.message_feedback_help.section_title_one_desc')}
          </CustomText>

        </View>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: Description Input (클릭 시 Modal)                       */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={[styles.section, { marginTop: verticalScale(10) }]}>
          <View style={styles.sectionHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: scale(8)}}>
            <CustomText type="title" bold style={styles.sectionTitle}>
              {t('help.message_feedback_help.section_title_two')}
            </CustomText>
            </View>
          </View>

          <CustomText type="normal" style={[styles.sectionDescription, { color: currentTheme.textSecondary }]}>
            {t('help.message_feedback_help.section_title_two_desc')}
          </CustomText>

        </View>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: Description Input (클릭 시 Modal)                       */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={[styles.section, { marginTop: verticalScale(10) }]}>
          <View style={styles.sectionHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: scale(8)}}>
            <CustomText type="title" bold style={styles.sectionTitle}>
              {t('help.message_feedback_help.section_title_three')}
            </CustomText>
            </View>
          </View>

          <CustomText type="normal" style={[styles.sectionDescription, { color: currentTheme.textSecondary }]}>
            {t('help.message_feedback_help.section_title_three_desc')}
          </CustomText>

        </View>


      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* FOOTER: Create Button                                              */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <View style={[styles.footer, { backgroundColor: currentTheme.backgroundColor, display: 'none' }]}>
        <CustomButton
          title={t('persona.creation.create_button', '생성하기')}
          onPress={handleCreate}
          disabled={!photo || !name || !!nameError}
          style={styles.createButton}
          leftIcon={<Icon name="sparkles" size={moderateScale(20)} color={COLORS.TEXT_PRIMARY} />}
        />
      </View>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Input Modal Overlays                                                */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <MessageInputOverlay
        ref={nameInputRef}
        title={t('persona.creation.name_title', '이름')}
        placeholder={t('persona.creation.name_hint', '예: 민지, Alex')}
        leftIcon="account"
        initialValue={name}
        maxLength={20}
        multiline={false}
        onSave={handleNameSave}
      />

      <MessageInputOverlay
        ref={descriptionInputRef}
        title={t('persona.creation.description_title', '설명')}
        placeholder={t('persona.creation.description_hint', '예: 산타 복장, 빨간 벤츠, 웃는 얼굴')}
        leftIcon="text-box"
        initialValue={description}
        maxLength={80}
        multiline={true}
        onSave={handleDescriptionSave}
      />
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(0),
    marginBottom: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(0),
  },
  scrollContent: {
    paddingHorizontal: scale(0),
    paddingTop: verticalScale(10),
    paddingBottom: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(0),
    marginBottom: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(0),
  },

  // Section
  section: {
    marginBottom: verticalScale(8),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(8),
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
  },
  sectionHint: {
    marginBottom: verticalScale(12),
    lineHeight: platformPadding(18),
  },

  // Divider
  divider: {
    height: 1,
    marginVertical: verticalScale(20),
  },

  // Photo Upload
  photoUploadArea: {
    height: verticalScale(200),
    borderRadius: scale(16),
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: verticalScale(12),
  },
  photoPlaceholderText: {
    marginTop: verticalScale(8),
  },
  photoPreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemoveButton: {
    position: 'absolute',
    top: scale(12),
    right: scale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: scale(14),
    padding: scale(2),
  },
  photoSuccessIndicator: {
    position: 'absolute',
    bottom: scale(12),
    right: scale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: scale(12),
    padding: scale(4),
    display: 'none',
  },

  // Name Input
  nameInputContainer: {
    position: 'relative',
  },
  nameInput: {
    paddingRight: scale(80), // Space for indicators
  },
  nameCharCount: {
    position: 'absolute',
    right: scale(12),
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  descriptionCharCount: {
    position: 'absolute',
    right: scale(12),
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  nameCheckIcon: {
    position: 'absolute',
    right: scale(50),
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  nameErrorIcon: {
    position: 'absolute',
    right: scale(50),
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  nameErrorText: {
    color: '#EF4444',
    marginTop: verticalScale(8),
    marginLeft: scale(4),
  },

  // Gender Selection
  genderContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: platformPadding(16),
    borderRadius: scale(12),
    borderWidth: 2,
  },

  // Point Info
  pointInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointInfoContent: {
    overflow: 'hidden',
  },
  pointInfoCard: {
    marginTop: verticalScale(12),
    padding: scale(16),
    borderRadius: scale(12),
    gap: verticalScale(12),
  },
  pointInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    paddingBottom: platformPadding(20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',

  },
  createButton: {
    width: '100%',
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

  // ✅ Input Display (클릭 가능한 읽기 전용 표시)
  inputDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 2,
    borderRadius: scale(12),
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(14),
    minHeight: scale(50),
  },
  inputDisplayText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: moderateScale(15),
  },
  inputDisplayPlaceholder: {
    color: 'rgba(156, 163, 175, 0.6)',
  },
  inputDisplayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    display: 'none',
  },
  
});

export default MainHelpFeedbackSheet;

