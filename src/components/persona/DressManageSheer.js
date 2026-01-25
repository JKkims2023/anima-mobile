/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎭 DressManageSheer Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dress management bottom sheet with perfect UI/UX
 * - Dress selection with preview
 * - Dress management with edit and delete
 * - Dress management with add
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
import { View, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { launchImageLibrary } from 'react-native-image-picker';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';
import MessageInputOverlay from '../message/MessageInputOverlay';
import { useAnima } from '../../contexts/AnimaContext';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../contexts/UserContext';
import amountService from '../../services/api/amountService';
import { getPersonaDressList, updatePersonaDress } from '../../services/api/personaApi';
import { FlashList } from '@shopify/flash-list';



const DressManageSheer = ({
  isOpen,
  personaKey,
  currentPersona, // ⭐ 현재 페르소나 정보 (selected_dress_image_url, history_key 확인용)
  currentPersonaRef, // 🔥 NEW: Ref for immediate access to latest persona
  onClose,
  onCreateStart, // (data) => { file, name, gender }
  onDressUpdated, // ⭐ (dressData) => { selected_dress_image_url, selected_dress_video_url, history_key }
  onDressStateUpdate, // ⭐ NEW: (personaKey, { count, hasCreating }) => void - Badge 업데이트용
}) => {

  const flatListRef = useRef(null);
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { showAlert, showToast } = useAnima();
  const bottomSheetRef = useRef(null);
  const navigation = useNavigation();
  const { user } = useUser();

  
  // ✅ Modal Refs for Input Overlays
  const nameInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  // States
  const [photo, setPhoto] = useState(null); // { uri, type, name }
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState('male'); // 'male' | 'female'
  const [descriptionError, setDescriptionError] = useState('');
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const [dressList, setDressList] = useState([]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // DEBUG: Watch dressList changes
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    console.log('[DressManageSheer] 📊 dressList updated, count:', dressList.length);
    console.log('[DressManageSheer] 📊 dressList data:', dressList);
  }, [dressList]);
  // Animation values
  const photoScale = useSharedValue(0);
  const nameCheckScale = useSharedValue(0);
  const descriptionCheckScale = useSharedValue(0);
  const pointInfoHeight = useSharedValue(0);

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLE OPEN/CLOSE + RESET
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    console.log('[DressManageSheer] 🎬 isOpen changed:', isOpen);
    
    if (isOpen) {
      console.log('[DressManageSheet] ✅ Presenting bottom sheet');
      console.log('[DressManageSheet] 🔑 Persona key:', personaKey);
      bottomSheetRef.current?.present();
      
      if (personaKey) {
        loadDressList();
      } else {
        console.log('[DressManageSheet] ⚠️ No persona key provided!');
      }

    } else {
      console.log('[DressManageSheet] ❌ Dismissing bottom sheet');
      bottomSheetRef.current?.dismiss();
      
      // Reset all states on close
      setPhoto(null);
      setGender('male');
      setDescription('');
      setDescriptionError('');
      setIsDescriptionFocused(false);
      // Don't clear dressList immediately, let it stay for smooth closing animation
      setTimeout(() => setDressList([]), 300);
      descriptionCheckScale.value = 0;
    }
  }, [isOpen, personaKey, loadDressList, descriptionCheckScale]);

  const loadDressList = useCallback(async () => {
    try {
      console.log('[DressManageSheet] 🔍 Loading dress list for:', personaKey);
      const response = await getPersonaDressList(personaKey);
      console.log('[DressManageSheet] 🎨 Dress list response:', response);
      
      if(response && response.success && response.data) {
        console.log('[DressManageSheet] ✅ Setting dress list, count:', response.data.length);
        setDressList(response.data);
        
        // ⭐ NEW: Notify parent of dress state (for badge)
        if (onDressStateUpdate) {
          const hasCreating = response.data.some(dress => dress.done_yn === 'N');
          console.log('[DressManageSheet] 📢 Notifying parent:', {
            personaKey,
            count: response.data.length,
            hasCreating
          });
          onDressStateUpdate(personaKey, {
            count: response.data.length,
            hasCreating: hasCreating
          });
        }
      } else {
        console.log('[DressManageSheet] ⚠️ No dress data, clearing list');
        setDressList([]);
        
        // ⭐ Notify parent of empty state
        if (onDressStateUpdate) {
          onDressStateUpdate(personaKey, {
            count: 0,
            hasCreating: false
          });
        }
      }
    } catch (error) {
      console.error('[DressManageSheet] ❌ Error loading dress list:', error);
      setDressList([]);
      
      // ⭐ Notify parent of error state
      if (onDressStateUpdate) {
        onDressStateUpdate(personaKey, {
          count: 0,
          hasCreating: false
        });
      }
    }
  }, [personaKey, onDressStateUpdate]);


  const handleDescriptionClick = useCallback(() => {
    HapticService.light();
    descriptionInputRef.current?.present();
  }, []);

  const handleDescriptionSave = useCallback(async (value) => {
    console.log('✅ [DressManageSheer] Description saved:', value);
    setDescription(value);
    
    if (!validateDescription(value)) {
      HapticService.warning();
      return;
    }

    const serviceData = await amountService.getServiceData({
      user_key: user?.user_key,
    });

    let dressCost = 0;

    console.log('[DressManageSheer] 🔍 Service data:', serviceData);

    if (!serviceData.success) {
      HapticService.warning();
      console.log('[PersonaStudioScreen] Service data fetch failed');
      return;

    }else{
      
      dressCost = serviceData.data.dress_amount;
    
    }
    
    // Show confirmation for dress creation
    showAlert({
      title: t('persona.dressing_room.create_dress_title'),
      message: t('persona.dressing_room.create_dress_message', { cost: dressCost.toLocaleString() }),
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {
            HapticService.light();
          }
        },
        {
          text: t('common.confirm'),
          style: 'primary',
          onPress: () => {
            HapticService.success();
            
            // Call parent's onCreateStart
            onCreateStart({
              file: null,
              name: 'dress',
              description: value.trim(),
              gender: 'male',
            });
            
            // Close sheet
            onClose();
          }
        }
      ]
    });
  }, [validateDescription, showAlert, onCreateStart, onClose, t]);


  // ═══════════════════════════════════════════════════════════════════════
  // DESCRIPTION VALIDATION
  // ═══════════════════════════════════════════════════════════════════════
  const validateDescription = useCallback((value) => {
    if (!value || value.trim() === '') {
      setDescriptionError('required');
      descriptionCheckScale.value = withTiming(0, { duration: 200 });
      return false;
    }

  if (value.length > 80) {
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
  // SUBMIT
  // ═══════════════════════════════════════════════════════════════════════
  const handleCreate = useCallback(() => {
    

    if (!validateDescription(description)) {
      HapticService.warning();
      console.log('[ChoicePersonaSheet] Description validation failed');
      return;
    }

    HapticService.success();

    // Pass data to parent
    onCreateStart({
      file: null,
      name: 'dress',
      description: description.trim(),
      gender: 'male',
    });

    // Close sheet
    onClose();
  }, [description, validateDescription, onCreateStart, onClose]);


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

  // ═══════════════════════════════════════════════════════════════════════
  // DRESS ITEM RENDER
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleDressSelect = useCallback((dress) => {

    console.log('[DressManageSheer] 👗 Dress selected:', dress.memory_key);
    
    // Show confirmation modal
    showAlert({
      title: t('persona.dressing_room.change_dress_title'),
      message: t('persona.dressing_room.change_dress_message'),
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {

          }
        },
        {
          text: t('common.confirm'),
          style: 'primary',
          onPress: async () => {
            try {

              console.log('[DressManageSheer] 📝 Updating persona dress...');
              console.log('  persona_key:', personaKey);
              console.log('  selected_dress_image_url:', dress.media_url);
              console.log('  selected_dress_video_url:', dress.video_url);
              console.log('  history_key:', dress.memory_key);
              console.log('  user_key:', user?.user_key);
              
              // ⭐ API call to update persona_persona_main
              const result = await updatePersonaDress(personaKey, {
                media_url: dress.media_url,
                video_url: dress.video_url,
                memory_key: dress.memory_key,
                user_key: user?.user_key,
              });
              
              if (result.success) {
                console.log('[DressManageSheer] ✅ Dress updated successfully!');
                
                // ⭐ Notify parent component to update local state
                if (onDressUpdated) {
                  console.log('[DressManageSheer] 📢 Notifying parent of dress update...');
                  onDressUpdated({
                    selected_dress_image_url: dress.media_url,
                    selected_dress_video_url: dress.video_url,
                    persona_comment: dress.persona_comment,
                    persona_comment_checked: dress.persona_comment_checked,
                    convert_done_yn: dress.convert_done_yn,
                    history_key: dress.memory_key,
                  });
                }
                
                showToast({
                  type: 'success',
                  emoji: '👗',
                  message: t('persona.dressing_room.change_success'),
                });
                
                // Reload dress list to reflect changes
                await loadDressList();
                
                onClose();
              } else {
                throw new Error('Update failed');
              }
            } catch (error) {
              console.error('[DressManageSheer] ❌ Error updating dress:', error);
              HapticService.warning();
              showToast({
                type: 'error',
                emoji: '❌',
                message: t('persona.dressing_room.change_error'),
              });
            }
          }
        }
      ]
    });
  }, [personaKey, showAlert, showToast, onClose, onDressUpdated, t, loadDressList]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // CREATING ANIMATION (Pulse & Rotation)
  // ═══════════════════════════════════════════════════════════════════════
  const spinnerRotation = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);
  
  useEffect(() => {
    // Continuous rotation for spinner
    spinnerRotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
    
    // Pulse animation for creating overlay
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [spinnerRotation, pulseOpacity]);
  
  const spinnerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));
  
  const pulseAnimStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));
  
  const renderDress = useCallback(({ item, index }) => {
    console.log('[DressManageSheer] 🎨 Rendering dress:', item.memory_key, item.media_url, 'done_yn:', item.done_yn);
    
    // 🔥 Use ref for latest persona data (bypasses React render cycle)
    const latestPersona = currentPersonaRef?.current || currentPersona;
    
    /*
    // Check if this dress is currently equipped
    const isEquipped = latestPersona?.selected_dress_image_url === item.media_url ||
                       latestPersona?.history_key === item.memory_key;
    */

    const isEquipped = latestPersona?.history_key === item.memory_key;
    
    // Check if this dress is still being created
    const isCreating = item.done_yn === 'N';
    
    return (
      <TouchableOpacity
        style={styles.dressItemHorizontal}
        onPress={() => {
          if (isCreating) {
            // Prevent selection of creating dress
            showToast({
              type: 'info',
              emoji: '⏳',
              message: t('persona.dressing_room.creating_dress'),
            });
          } else {
            handleDressSelect(item);
          }
        }}
        activeOpacity={isCreating ? 1 : 0.8}
        disabled={isCreating}
      >
        {/* Image with blur effect for creating state */}
        <Image 
          source={{ uri: isCreating ? item.original_url : item.media_url }}
          style={[
            styles.dressImageHorizontal,
            isCreating && styles.dressImageBlurred
          ]}
          resizeMode="cover"
        />
        
        {/* ⭐ Creating Overlay */}
        {isCreating && (
          <Animated.View style={[styles.creatingOverlay, pulseAnimStyle]}>
            <View style={styles.creatingContent}>
              {/* Rotating Spinner */}
              <Animated.View style={[styles.creatingSpinner, spinnerAnimStyle]}>
                <Icon name="dots-horizontal-circle" size={moderateScale(36)} color="#FFFFFF" />
              </Animated.View>
              
              {/* Creating Text */}
              <CustomText type="normal" bold style={styles.creatingText}>
                {t('persona.dressing_room.creating')}
              </CustomText>
              
              {/* Loading Dots */}
              <View style={styles.loadingDots}>
                <View style={styles.loadingDot} />
                <View style={styles.loadingDot} />
                <View style={styles.loadingDot} />
              </View>
              
              {/* Estimated Time */}
              {item.estimate_time > 0 && (
                <CustomText type="tiny" style={styles.creatingTimeText}>
                  {t('persona.dressing_room.estimated_time', { time: item.estimate_time })}
                </CustomText>
              )}
            </View>
          </Animated.View>
        )}
        
        {/* ⭐ Equipped Badge */}
        {isEquipped && !isCreating && (
          <View style={styles.equippedBadge}>
            <Icon name="check-circle" size={moderateScale(20)} color="#FFFFFF" />
            <CustomText type="tiny" style={styles.equippedBadgeText}>
              {t('persona.dressing_room.equipped')}
            </CustomText>
          </View>
        )}
        
        {/* Dress Info Overlay */}
        {!isCreating && (
          <View style={styles.dressOverlayHorizontal}>
            <CustomText 
              type="tiny" 
              numberOfLines={2}
              style={styles.dressPromptHorizontal}
            >
              {item.prompt_text}
            </CustomText>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [currentPersona, handleDressSelect, showToast, spinnerAnimStyle, pulseAnimStyle, t]);

  const keyExtractor = useCallback((item) => item.memory_key, []);


  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      onClose={onClose}
      snapPoints={['70%']}
      title={t('persona.dressing_room.title', { name: (currentPersonaRef?.current || currentPersona)?.persona_name })}
      showCloseButton={true}
      buttons={[
        {
          title:t('common.close'),
          type: 'outline',
          onPress: onClose,
        },
        {
          title: t('persona.dressing_room.create_new_dress'),
          type: 'primary',
          onPress: () => {

            if (!user || !user?.user_key) {
              HapticService.warning();
              showAlert({
                title: t('common.login_guide.title'),
                message: t('common.login_guide.description'),
                buttons: [
                  { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
                  { text: t('common.confirm'), style: 'primary', onPress: () => {
                    navigation.navigate('Settings');
                    onClose();
                  } },
                ],
              });
              return;
            }

            if (false){//currentPersona?.default_yn === 'Y') {
              HapticService.warning();
              showAlert({
                title: t('persona.default_persona_core_confirm_title'),
                message: t('persona.default_persona_core_confirm_message'),
                buttons: [
                  { text: t('common.confirm'), style: 'primary', onPress: () => {} },

                ],
              });
              return;
            }

            HapticService.light();
            descriptionInputRef.current?.present();

          },
        }
      ]}
    >
      <View style={styles.mainContainer}>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: Dress List (보유 드레스 목록) - 가로 스크롤               */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={styles.dressListSection}>
          <CustomText type="middle"  style={[styles.sectionHeader, { fontSize: moderateScale(14), marginTop: verticalScale(-10), marginBottom: verticalScale(10) }]}>
            {t('persona.dressing_room.subtitle', { name: (currentPersonaRef?.current || currentPersona)?.persona_name })}
          </CustomText>
          <View style={styles.sectionHeader}>
            <Icon name="dresser" size={moderateScale(24)} color={COLORS.DEEP_BLUE_LIGHT} />
            <CustomText type="title" bold style={styles.sectionTitle}>
              {t('persona.dressing_room.dress_list')}
            </CustomText>
            <CustomText type="small" style={styles.dressCount}>
              ({dressList.length})
            </CustomText>
          </View>

          {/* FlashList Container - 가로 스크롤 */}
          <View style={styles.dressListContainer}>
            {dressList.length === 0 ? (
              <View style={styles.emptyDressContainer}>
                <Icon name="hanger" size={moderateScale(48)} color={COLORS.TEXT_TERTIARY} />
                <CustomText type="normal" style={styles.emptyDressText}>
                  {t('persona.dressing_room.empty')}
                </CustomText>
                <CustomText type="small" style={styles.emptyDressHint}>
                  {t('persona.dressing_room.empty_hint')}
                </CustomText>
              </View>
            ) : (
              <FlashList
                ref={flatListRef}
                data={dressList}
                renderItem={renderDress}
                keyExtractor={keyExtractor}
                horizontal={true} // ⭐ 가로 스크롤
                estimatedItemSize={scale(200)} // 각 아이템 가로 너비
                scrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={scale(200) + scale(12)} // 아이템 너비 + 간격
                snapToAlignment="start"
                contentContainerStyle={styles.dressListContent}
              />
            )}
          </View>
        </View>

      </View>

      <MessageInputOverlay
        ref={descriptionInputRef}
        title={t('persona.creation.description_title')}
        placeholder={t('persona.creation.description_hint')}
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
  mainContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(0),
    marginBottom: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(0),
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // Dress List Section (가로 스크롤)
  // ═══════════════════════════════════════════════════════════════════════
  dressListSection: {
    height: verticalScale(280),
    marginTop: verticalScale(8),
  },
  dressListContainer: {
    height: verticalScale(240),
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  dressListContent: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
  },
  dressCount: {
    marginLeft: scale(0),
    color: COLORS.TEXT_SECONDARY,
  },
  
  // Dress Item (가로 스크롤용)
  dressItemHorizontal: {
    width: scale(200),
    height: verticalScale(220),
    marginRight: scale(12),
    borderRadius: scale(16),
    overflow: 'hidden',
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  dressImageHorizontal: {
    width: '100%',
    height: '100%',
  },
  dressOverlayHorizontal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    display: 'none',
  },
  dressPromptHorizontal: {
    color: '#FFFFFF',
    lineHeight: platformPadding(14),
    fontSize: moderateScale(11),
  },
  
  // Equipped Badge (착용 중 뱃지)
  equippedBadge: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DEEP_BLUE,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    gap: scale(4),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  equippedBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  
  // Creating State (생성 중 상태)
  dressImageBlurred: {
    opacity: 0.3,
  },
  creatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatingContent: {
    alignItems: 'center',
    gap: verticalScale(10),
    paddingHorizontal: scale(12),
  },
  creatingSpinner: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 5,
    shadowColor: COLORS.DEEP_BLUE_LIGHT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  creatingText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  creatingTimeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: moderateScale(11),
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  loadingDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  
  // Empty Dress State
  emptyDressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  emptyDressText: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: verticalScale(16),
  },
  emptyDressHint: {
    color: COLORS.TEXT_TERTIARY,
    marginTop: verticalScale(8),
    textAlign: 'center',
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
    flex: 1,
    height: '100%',
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

export default DressManageSheer;

