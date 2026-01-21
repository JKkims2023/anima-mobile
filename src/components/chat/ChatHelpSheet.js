/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🗣️ SpeakingPatternSheet Component (Modal-based with Tabs)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Allow users to define persona's speaking patterns
 * 
 * Design: Tab-based UI (3 tabs)
 * ✅ Tab 1: 문장 (greeting + closing phrases)
 * ✅ Tab 2: 자주 쓰는 말 (frequent words)
 * ✅ Tab 3: 나만의 명언 (signature phrases)
 * 
 * Features:
 * ✅ Modal-based (correct z-index)
 * ✅ Tab navigation
 * ✅ Tag/Chip UI
 * ✅ Text truncation (20+ chars → ...)
 * ✅ Space-efficient layout
 * 
 * @author JK & Hero Nexus AI
 * @date 2025-12-30
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,

} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import MessageInputOverlay from '../message/MessageInputOverlay';

import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import { useAnima } from '../../contexts/AnimaContext';
import amountService from '../../services/api/amountService';
import ProcessingLoadingOverlay from '../persona/ProcessingLoadingOverlay'; // ⭐ NEW: Universal loading overlay
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';

const CreateMusicSheet = ({
  isOpen,
  onClose,
  personaKey,
  personaName,
  userKey,

}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const { currentTheme } = useTheme();
  const navigation = useNavigation();
  const { showToast, showAlert } = useAnima();


  const titleInputRef = useRef(null);
  const promptInputRef = useRef(null);
  const lyricsInputRef = useRef(null);
  

  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');

  const { user } = useUser();

  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATION EFFECTS
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1000,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

    }
  }, [isOpen, personaKey]);


  const handleSave = async () => {

    console.log('[CreateMusicSheet] handleSave');

    if (!personaKey || !userKey) return;
    
    try{
      // Validation
      if (!title.trim()) {
        showAlert({
          type: 'warning',
          message: t('music.creator.validation.title_required'),
          emoji: '⚠️',
        });
        return;
      }

      if (!prompt.trim()) {

        console.log('[CreateMusicSheet] prompt is required');
        showAlert({
          type: 'warning',
          message: t('music.creator.validation.prompt_required'),
          emoji: '⚠️',
        });
        return;
      }

      if (!user || !user?.user_key) {

        console.log('[CreateMusicSheet] User key not found');
        HapticService.warning();
        showToast({
          type: 'error',
          message: t('ai_comment.not_login'),
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
 
  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleClose = () => {
    HapticService.light();
    onClose?.();
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  
  if (!isOpen) return null;
  
  return (
    <>
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        {/* Backdrop */}
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View 
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(0,0,0,0.7)',
                opacity: backdropOpacity,
              }
            ]} 
          />
        </TouchableOpacity>
        
        {/* Modal Container */}
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              paddingBottom: insets.bottom + verticalScale(20),
              transform: [{ translateY: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <CustomText type="title" bold color={COLORS.TEXT_PRIMARY}>
              {t('chat_help_sheet.title')}
              </CustomText>

            </View>
            
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={scale(24)} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: Name Input (클릭 시 Modal)                              */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <View style={[styles.section, { marginTop: verticalScale(-10) }]}>
            
            <CustomText type="title" style={[styles.sectionTitle, { color: currentTheme.textSecondary, marginTop: verticalScale(10), marginBottom: verticalScale(20) }]}>
              {t('chat_help_sheet.description')}
            </CustomText>
            
            <View style={styles.sectionHeader}>
              <CustomText type="title" bold style={styles.sectionTitle}>
              ♥️
              </CustomText>
              <CustomText type="title" bold style={styles.sectionTitle}>
                {t('chat_help_sheet.comment_title_one')}
              </CustomText>
            </View>

            <CustomText type="normal" style={[styles.sectionDescription, { color: currentTheme.textSecondary }]}>
              {t('chat_help_sheet.comment_description_one')}
            </CustomText>

          </View>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: Description Input (클릭 시 Modal)                       */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <View style={[styles.section, { marginTop: verticalScale(10) }]}>
            <View style={styles.sectionHeader}>
              <CustomText type="title" bold style={styles.sectionTitle}>
              ❌
              </CustomText>
              <CustomText type="title" bold style={styles.sectionTitle}>
                {t('chat_help_sheet.comment_title_two')}
              </CustomText>
            </View>

            <CustomText type="normal" style={[styles.sectionDescription, { color: currentTheme.textSecondary }]}>
              {t('chat_help_sheet.comment_description_two')}
            </CustomText>

          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: currentTheme.borderSubtle }]} />

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* SECTION 1: Photo Upload                                            */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CustomText type="title" bold style={styles.sectionTitle}>
              ❗
              </CustomText>
              <CustomText type="title" bold style={styles.sectionTitle}>
                {t('chat_help_sheet.comment_title_three')}
              </CustomText>
            </View>

            <CustomText type="normal" style={[styles.sectionDescription, {  color: currentTheme.textSecondary }]}>
              {t('chat_help_sheet.comment_description_three')}
            </CustomText>

          </View>



          </ScrollView>
          
          {/* Footer Buttons */}
          <View style={styles.footer}>
            
            <CustomButton
              title={t('common.close')}
              onPress={handleClose}
              type="primary"
              size="medium"
              style={styles.saveButton}
            />
          </View>
          
        </Animated.View>
      </Modal>
      
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BACKGROUND,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(12),
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: COLORS.TEXT_TERTIARY,
    borderRadius: moderateScale(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tabs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    gap: scale(8),
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(12),
    backgroundColor: COLORS.CARD_BACKGROUND,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: COLORS.DEEP_BLUE + '15',
    borderColor: COLORS.DEEP_BLUE,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tab Content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tabContent: {
    flex: 1,
  },
  tabDescription: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(100),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  section: {
    paddingHorizontal: scale(20),
  },
  section_normal: {
    paddingHorizontal: scale(0),
  },
  sectionHeader: {
    marginBottom: verticalScale(12),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: COLORS.DIVIDER,
    gap: scale(6),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    backgroundColor: 'transparent',
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: COLORS.DEEP_BLUE,
    borderStyle: 'dashed',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
    gap: scale(12),
  },
  resetButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  savingOverlay: {
    position: 'absolute',
    bottom: verticalScale(100),
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    backgroundColor: COLORS.BACKGROUND,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: scale(12),
    marginTop: verticalScale(12),
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
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: verticalScale(8),
    marginHorizontal: scale(20),
    marginTop: verticalScale(20),
  },
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

export default CreateMusicSheet;
