/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🖼️ BackgroundCreatorSheet Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * User background creation bottom sheet with minimal UI
 * - Photo upload with preview
 * - Tag name input with real-time validation
 * - Clean, simple design for mobile
 * 
 * Design Principles:
 * ✅ Minimal UI (no point display)
 * ✅ Consistent spacing (scale/verticalScale)
 * ✅ Typography hierarchy (CustomText)
 * ✅ Color system (COLORS)
 * ✅ Smooth animations (reanimated)
 * ✅ Emotional feedback (haptic)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-22
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { launchImageLibrary } from 'react-native-image-picker';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import MessageInputOverlay from '../message/MessageInputOverlay';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';
import { useAnima } from '../../contexts/AnimaContext';
import { useUser } from '../../contexts/UserContext';
import memoryService from '../../services/api/memoryService';

const BackgroundCreatorSheet = ({
  isOpen,
  onClose,
  onCreateSuccess,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { showAlert, showToast } = useAnima();
  const { user } = useUser();
  const bottomSheetRef = useRef(null);
  
  // ✅ Modal Ref for Tag Name Input
  const tagNameInputRef = useRef(null);

  // States
  const [photo, setPhoto] = useState(null); // { uri, type, name }
  const [tagName, setTagName] = useState('');
  const [tagNameError, setTagNameError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Animation values
  const photoScale = useSharedValue(0);
  const tagNameCheckScale = useSharedValue(0);

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLE OPEN/CLOSE + RESET
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    console.log('[BackgroundCreatorSheet] 🎬 isOpen changed:', isOpen);
    
    if (isOpen) {
      console.log('[BackgroundCreatorSheet] ✅ Presenting bottom sheet');
      bottomSheetRef.current?.present();
    } else {
      console.log('[BackgroundCreatorSheet] ❌ Dismissing bottom sheet');
      bottomSheetRef.current?.dismiss();
      
      // Reset all states on close
      setPhoto(null);
      setTagName('');
      setTagNameError('');
      setIsCreating(false);
      photoScale.value = 0;
      tagNameCheckScale.value = 0;
    }
  }, [isOpen, photoScale, tagNameCheckScale]);

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
        console.log('[BackgroundCreatorSheet] Photo selection cancelled');
      } else if (response.errorCode) {
        console.error('[BackgroundCreatorSheet] Photo selection error:', response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        const selectedPhoto = {
          uri: response.assets[0].uri,
          type: response.assets[0].type || 'image/jpeg',
          name: response.assets[0].fileName || 'background.jpg',
        };

        setPhoto(selectedPhoto);
        HapticService.success();

        // Animate photo appearance
        photoScale.value = withSpring(1, {
          damping: 15,
          stiffness: 150,
        });

        console.log('[BackgroundCreatorSheet] Photo selected:', selectedPhoto.uri);
      }
    });
  }, [photoScale]);

  const handlePhotoRemove = useCallback(() => {
    HapticService.light();
    setPhoto(null);
    photoScale.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.ease),
    });
  }, [photoScale]);

  // ═══════════════════════════════════════════════════════════════════════
  // TAG NAME INPUT MODAL
  // ═══════════════════════════════════════════════════════════════════════

  const handleTagNameClick = useCallback(() => {
    HapticService.light();
    tagNameInputRef.current?.present();
  }, []);

  const handleTagNameSave = useCallback((value) => {
    console.log('✅ [BackgroundCreatorSheet] Tag name saved:', value);
    setTagName(value);
    validateTagName(value);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // TAG NAME VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  const validateTagName = useCallback((value) => {
    if (!value || value.trim() === '') {
      setTagNameError('required');
      tagNameCheckScale.value = withTiming(0, { duration: 200 });
      return false;
    }
    if (value.length > 20) {
      setTagNameError('too_long');
      tagNameCheckScale.value = withTiming(0, { duration: 200 });
      return false;
    }
    setTagNameError('');
    tagNameCheckScale.value = withSpring(1, {
      damping: 15,
      stiffness: 200,
    });
    return true;
  }, [tagNameCheckScale]);

  // ═══════════════════════════════════════════════════════════════════════
  // CREATE BACKGROUND
  // ═══════════════════════════════════════════════════════════════════════

  const handleCreate = useCallback(async () => {
    try {
      setIsCreating(true);

      console.log('[BackgroundCreatorSheet] 🚀 Creating background...');
      console.log('   user_key:', user?.user_key);
      console.log('   tag_name:', tagName);
      console.log('   photo:', photo?.name);

      // FormData 생성
      const formData = new FormData();
      formData.append('user_key', user.user_key);
      formData.append('tag_name', tagName.trim());
      formData.append('photo', {
        uri: photo.uri,
        type: photo.type,
        name: photo.name,
      });

      // API 호출
      const result = await memoryService.createBackground(formData);

      console.log('[BackgroundCreatorSheet] ✅ Create result:', result);

      if (result.success) {
        HapticService.success();
        
        showToast({
          type: 'success',
          message: t('background.creation.create_success', '배경이 생성되었습니다!'),
        });

        // Close sheet
        onClose();

        // Trigger success callback (리스트 갱신)
        if (onCreateSuccess) {
          onCreateSuccess();
        }
      } else {
        HapticService.warning();
        
        // 에러 처리
        let errorMessage = t('common.error', '오류가 발생했습니다');
        
        if (result.error_code === 'INSUFFICIENT_POINT') {
          errorMessage = t('background.creation.insufficient_point', '포인트가 부족합니다');
        } else if (result.error_code === 'USER_NOT_FOUND') {
          errorMessage = t('common.user_not_found', '사용자 정보를 찾을 수 없습니다');
        } else if (result.error_code === 'S3_UPLOAD_FAILED') {
          errorMessage = t('common.upload_failed', '업로드에 실패했습니다');
        }
        
        showAlert({
          title: t('common.error', '오류'),
          message: errorMessage,
          buttons: [
            { text: t('common.confirm', '확인'), style: 'primary' }
          ],
        });
      }
    } catch (error) {
      console.error('[BackgroundCreatorSheet] ❌ Create error:', error);
      HapticService.warning();
      
      showAlert({
        title: t('common.error', '오류'),
        message: error.message || t('common.error', '오류가 발생했습니다'),
        buttons: [
          { text: t('common.confirm', '확인'), style: 'primary' }
        ],
      });
    } finally {
      setIsCreating(false);
    }
  }, [user, tagName, photo, onClose, onCreateSuccess, showToast, showAlert, t]);

  const handleValidationSuccess = useCallback(() => {
    // Validation
    if (!validateTagName(tagName)) {
      HapticService.warning();
      showToast({
        type: 'error',
        message: t('background.creation.tag_name_error_required', '태그명을 입력해주세요'),
      });
      return;
    }

    if (!photo) {
      HapticService.warning();
      showToast({
        type: 'error',
        message: t('background.creation.photo_error', '이미지를 선택해주세요'),
      });
      return;
    }

    if (!user || !user?.user_key) {
      HapticService.warning();
      showToast({
        type: 'error',
        message: t('common.login_required', '로그인이 필요합니다'),
      });
      return;
    }

    HapticService.success();

    showAlert({
      title: t('background.creation.alert_title', '배경 생성'),
      message: t('background.creation.alert_message', '선택한 이미지로 배경을 생성하시겠습니까?\n포인트가 차감됩니다.'),
      buttons: [
        { text: t('common.cancel', '취소'), style: 'cancel' },
        { 
          text: t('common.confirm', '확인'), 
          style: 'primary', 
          onPress: handleCreate 
        },
      ],
    });
  }, [tagName, photo, user, validateTagName, handleCreate, showToast, showAlert, t]);

  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATED STYLES
  // ═══════════════════════════════════════════════════════════════════════

  const photoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: photoScale.value }],
    opacity: photoScale.value,
  }));

  const tagNameCheckAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tagNameCheckScale.value }],
    opacity: tagNameCheckScale.value,
  }));

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  console.log('[BackgroundCreatorSheet] 🎨 Rendering with isOpen:', isOpen);

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      onClose={onClose}
      snapPoints={['75%']}
      title={t('background.creation.title', '배경 생성')}
      showCloseButton={true}
      buttons={[
        {
          title: t('common.cancel', '취소'),
          type: 'outline',
          onPress: onClose,
          disabled: isCreating,
        },
        {
          title: isCreating 
            ? t('common.creating', '생성 중...') 
            : t('background.creation.create_button', '생성하기'),
          type: 'primary',
          onPress: handleValidationSuccess,
          disabled: isCreating,
          icon: isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: scale(8) }} />
          ) : null,
        }
      ]}
    >
      <View style={styles.scrollContainer}>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: Tag Name Input (클릭 시 Modal)                          */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={[styles.section, { marginTop: verticalScale(0) }]}>
          <View style={styles.sectionHeader}>
            <Icon name="tag" size={moderateScale(24)} color={COLORS.DEEP_BLUE_LIGHT} />
            <CustomText type="title" style={styles.sectionTitle}>
              {t('background.creation.tag_name_title', '백그라운드 태그명')}
            </CustomText>
          </View>

          <CustomText type="normal" style={[styles.sectionHint, { color: currentTheme.textSecondary }]}>
            {t('background.creation.tag_name_description', '나중에 검색 필터로 사용됩니다')}
          </CustomText>

          {/* ✅ 클릭 가능한 입력 영역 (읽기 전용 표시) */}
          <TouchableOpacity
            style={[
              styles.inputDisplay,
              { borderColor: tagName ? COLORS.DEEP_BLUE : 'rgba(156, 163, 175, 0.3)' }
            ]}
            onPress={handleTagNameClick}
            activeOpacity={0.7}
          >
            <CustomText
              type="normal"
              style={[
                styles.inputDisplayText,
                !tagName && styles.inputDisplayPlaceholder
              ]}
              numberOfLines={1}
            >
              {tagName || t('background.creation.tag_name_hint', '예: 해변 배경, 도시 야경')}
            </CustomText>

            <View style={styles.inputDisplayRight}>
              {/* Character count */}
              <CustomText 
                type="small"
                style={{ color: tagName.length >= 18 ? '#F59E0B' : currentTheme.textTertiary }}
              >
                {tagName.length}/20
              </CustomText>

              {/* Validation indicator */}
              {!tagNameError && tagName ? (
                <Animated.View style={tagNameCheckAnimStyle}>
                  <Icon name="check-circle" size={moderateScale(20)} color="#10B981" />
                </Animated.View>
              ) : tagNameError ? (
                <Icon name="alert-circle" size={moderateScale(20)} color="#EF4444" />
              ) : (
                <Icon name="pencil" size={moderateScale(20)} color={COLORS.TEXT_SECONDARY} />
              )}
            </View>
          </TouchableOpacity>

          {/* Error message */}
          {tagNameError && (
            <CustomText type="small" style={styles.errorText}>
              {tagNameError === 'required' 
                ? t('background.creation.tag_name_error_required', '태그명을 입력해주세요')
                : t('background.creation.tag_name_error_too_long', '태그명은 20자 이하로 입력해주세요')
              }
            </CustomText>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: currentTheme.borderSubtle }]} />

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: Photo Upload                                            */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={[styles.section, { marginTop: verticalScale(0) }]}>
          <View style={styles.sectionHeader}>
            <Icon name="image" size={moderateScale(24)} color={COLORS.DEEP_BLUE_LIGHT} />
            <CustomText type="title" style={styles.sectionTitle}>
              {t('background.creation.photo_title', '이미지 선택')}
            </CustomText>
          </View>

          <CustomText type="normal" style={[styles.sectionHint, { display: 'none', color: currentTheme.textSecondary }]}>
            {t('background.creation.photo_hint', '배경으로 사용할 이미지를 선택해주세요')}
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
                <Icon name="image-plus" size={moderateScale(48)} color={currentTheme.textTertiary} />
                <CustomText type="normal" style={[styles.photoPlaceholderText, { color: currentTheme.textSecondary }]}>
                  {t('background.creation.photo_placeholder', '이미지 선택하기')}
                </CustomText>
              </View>
            )}
          </TouchableOpacity>
        </View>

      </View>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Input Modal Overlay                                                */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <MessageInputOverlay
        ref={tagNameInputRef}
        title={t('background.creation.tag_name_title', '백그라운드 태그명')}
        placeholder={t('background.creation.tag_name_hint', '예: 해변 배경, 도시 야경')}
        leftIcon="tag"
        initialValue={tagName}
        maxLength={20}
        multiline={false}
        onSave={handleTagNameSave}
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
    marginVertical: verticalScale(10),
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

  // Input Display (클릭 가능한 읽기 전용 표시)
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
  },
  
  // Error text
  errorText: {
    color: '#EF4444',
    marginTop: verticalScale(8),
    marginLeft: scale(4),
  },
});

export default BackgroundCreatorSheet;
