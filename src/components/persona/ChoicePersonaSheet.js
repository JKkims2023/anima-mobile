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
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
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
import CustomTextInput from '../CustomTextInput';
import CustomButton from '../CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';

const ChoicePersonaSheet = ({
  isOpen,
  onClose,
  onCreateStart, // (data) => { file, name, gender }
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const bottomSheetRef = useRef(null);

  // States
  const [photo, setPhoto] = useState(null); // { uri, type, name }
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male'); // 'male' | 'female'
  const [nameError, setNameError] = useState('');
  const [showPointInfo, setShowPointInfo] = useState(false);

  // Animation values
  const photoScale = useSharedValue(0);
  const nameCheckScale = useSharedValue(0);
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
      setShowPointInfo(false);
      photoScale.value = 0;
      nameCheckScale.value = 0;
      pointInfoHeight.value = 0;
    }
  }, [isOpen, photoScale, nameCheckScale, pointInfoHeight]);

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

  const handleNameChange = useCallback((text) => {
    setName(text);
    validateName(text);
  }, [validateName]);

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

    HapticService.success();

    // Pass data to parent
    onCreateStart({
      file: photo,
      name: name.trim(),
      gender: gender,
    });

    // Close sheet
    onClose();
  }, [photo, name, gender, validateName, onCreateStart, onClose]);


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
      title={t('persona.creation.title', '새로운 페르소나')}
      showCloseButton={true}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: Photo Upload                                            */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="camera" size={moderateScale(24)} color={COLORS.DEEP_BLUE_LIGHT} />
            <CustomText type="big" bold style={styles.sectionTitle}>
              {t('persona.creation.photo_title', '사진 선택')}
            </CustomText>
          </View>

          <CustomText type="normal" style={[styles.sectionHint, {  color: currentTheme.textSecondary }]}>
            {t('persona.creation.photo_hint', '페르소나로 만들 사진을 선택해주세요')}
          </CustomText>

          <TouchableOpacity
            style={[
              styles.photoUploadArea,
              { 
                backgroundColor: currentTheme.bgSecondary,
                borderColor: photo ? COLORS.DEEP_BLUE : currentTheme.borderPrimary,
              }
            ]}
            onPress={handlePhotoSelect}
            activeOpacity={0.7}
          >
            {photo ? (
              <Animated.View style={[styles.photoPreviewContainer, photoAnimStyle]}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                />
                
                {/* Remove button */}
                <TouchableOpacity
                  style={styles.photoRemoveButton}
                  onPress={handlePhotoRemove}
                  activeOpacity={0.8}
                >
                  <Icon name="close-circle" size={moderateScale(28)} color="#EF4444" />
                </TouchableOpacity>

                {/* Success indicator */}
                <View style={styles.photoSuccessIndicator}>
                  <Icon name="check-circle" size={moderateScale(24)} color="#10B981" />
                </View>
              </Animated.View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Icon name="camera-plus" size={moderateScale(48)} color={currentTheme.textTertiary} />
                <CustomText type="normal" style={[styles.photoPlaceholderText, { color: currentTheme.textSecondary }]}>
                  {t('persona.creation.photo_placeholder', '사진 선택하기')}
                </CustomText>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: currentTheme.borderSubtle }]} />

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: Name Input                                              */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="pencil" size={moderateScale(24)} color={COLORS.DEEP_BLUE_LIGHT} />
            <CustomText type="big" bold style={styles.sectionTitle}>
              {t('persona.creation.name_title', '이름')}
            </CustomText>
          </View>

          <CustomText type="small" style={[styles.sectionHint, {display: 'none', color: currentTheme.textSecondary }]}>
            {t('persona.creation.name_hint', '페르소나의 이름을 입력해주세요 (최대 20자)')}
          </CustomText>

          <View style={styles.nameInputContainer}>
            <CustomTextInput
              value={name}
              onChangeText={handleNameChange}
              placeholder={t('persona.creation.name_hint', '예: 민지, Alex')}
              maxLength={20}
              style={styles.nameInput}
              autoCapitalize="words"
            />

            {/* Character count */}
            <View style={styles.nameCharCount}>
              <CustomText 
                style={{ color: name.length >= 18 ? '#F59E0B' : currentTheme.textTertiary }}
              >
                {name.length}/20
              </CustomText>
            </View>

            {/* Validation indicator */}
            {!nameError && name && (
              <Animated.View style={[styles.nameCheckIcon, nameCheckAnimStyle]}>
                <Icon name="check-circle" size={moderateScale(20)} color="#10B981" />
              </Animated.View>
            )}

            {nameError && (
              <View style={styles.nameErrorIcon}>
                <Icon name="alert-circle" size={moderateScale(20)} color="#EF4444" />
              </View>
            )}
          </View>

          {/* Error message */}
          {nameError && (
            <CustomText type="small" style={styles.nameErrorText}>
              {nameError === 'required' 
                ? t('persona.creation.name_error_required', '이름을 입력해주세요')
                : t('persona.creation.name_error_too_long', '이름은 20자 이하로 입력해주세요')
              }
            </CustomText>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: currentTheme.borderSubtle }]} />

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: Gender Selection                                        */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="human-male-female" size={moderateScale(24)} color={COLORS.DEEP_BLUE_LIGHT} />
            <CustomText type="big" bold style={styles.sectionTitle}>
              {t('persona.creation.gender_title', '성별')}
            </CustomText>
          </View>

          <CustomText type="normal" style={[styles.sectionHint, { color: currentTheme.textSecondary }]}>
            {t('persona.creation.gender_hint', '페르소나의 성별을 선택해주세요')}
          </CustomText>

          <View style={styles.genderContainer}>
            {/* Male */}
            <TouchableOpacity
              style={[
                styles.genderChip,
                { 
                  backgroundColor: gender === 'male' ? COLORS.DEEP_BLUE : currentTheme.bgSecondary,
                  borderColor: gender === 'male' ? COLORS.DEEP_BLUE : currentTheme.borderPrimary,
                }
              ]}
              onPress={() => handleGenderSelect('male')}
              activeOpacity={0.7}
            >
              <Icon 
                name="human-male" 
                size={moderateScale(28)} 
                color={gender === 'male' ? '#FFFFFF' : currentTheme.textSecondary} 
              />
              <CustomText 
                type="normal" 
                bold={gender === 'male'}
                style={{ color: gender === 'male' ? '#FFFFFF' : currentTheme.textPrimary }}
              >
                {t('persona.creation.gender_male', '남성')}
              </CustomText>
            </TouchableOpacity>

            {/* Female */}
            <TouchableOpacity
              style={[
                styles.genderChip,
                { 
                  backgroundColor: gender === 'female' ? COLORS.DEEP_BLUE : currentTheme.bgSecondary,
                  borderColor: gender === 'female' ? COLORS.DEEP_BLUE : currentTheme.borderPrimary,
                }
              ]}
              onPress={() => handleGenderSelect('female')}
              activeOpacity={0.7}
            >
              <Icon 
                name="human-female" 
                size={moderateScale(28)} 
                color={gender === 'female' ? '#FFFFFF' : currentTheme.textSecondary} 
              />
              <CustomText 
                type="normal" 
                bold={gender === 'female'}
                style={{ color: gender === 'female' ? '#FFFFFF' : currentTheme.textPrimary }}
              >
                {t('persona.creation.gender_female', '여성')}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: currentTheme.borderSubtle }]} />

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 4: Point Info (Optional)                                   */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={[styles.section, { display: 'none' }]}>
          <TouchableOpacity
            style={styles.pointInfoHeader}
            onPress={handlePointInfoToggle}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <Icon name="diamond-stone" size={moderateScale(24)} color={COLORS.DEEP_BLUE_LIGHT} />
              <CustomText type="middle" bold style={styles.sectionTitle}>
                {t('persona.creation.point_title', '포인트 안내')}
              </CustomText>
            </View>
            <Icon 
              name={showPointInfo ? 'chevron-up' : 'chevron-down'} 
              size={moderateScale(24)} 
              color={currentTheme.textSecondary} 
            />
          </TouchableOpacity>

          <Animated.View style={[styles.pointInfoContent, pointInfoAnimStyle]}>
            <View style={[styles.pointInfoCard, { backgroundColor: currentTheme.bgTertiary }]}>
              <View style={styles.pointInfoRow}>
                <CustomText type="small" style={{ color: currentTheme.textSecondary }}>
                  {t('persona.creation.point_cost', '생성 비용')}
                </CustomText>
                <CustomText type="normal" bold style={{ color: COLORS.DEEP_BLUE_LIGHT }}>
                  100P
                </CustomText>
              </View>
              <View style={styles.pointInfoRow}>
                <CustomText type="small" style={{ color: currentTheme.textSecondary }}>
                  {t('persona.creation.point_time', '예상 시간')}
                </CustomText>
                <CustomText type="normal" bold style={{ color: currentTheme.textPrimary }}>
                  30-60{t('common.seconds', '초')}
                </CustomText>
              </View>
            </View>
          </Animated.View>
        </View>


      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* FOOTER: Create Button                                              */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <View style={[styles.footer, { backgroundColor: currentTheme.backgroundColor }]}>
        <CustomButton
          title={t('persona.creation.create_button', '생성하기')}
          onPress={handleCreate}
          disabled={!photo || !name || !!nameError}
          style={styles.createButton}
          leftIcon={<Icon name="sparkles" size={moderateScale(20)} color={COLORS.TEXT_PRIMARY} />}
        />
      </View>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(0),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(10),
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
  },

  // Name Input
  nameInputContainer: {
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? verticalScale(0) : verticalScale(-10),
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
});

export default ChoicePersonaSheet;

