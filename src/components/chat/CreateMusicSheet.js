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
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import MessageInputOverlay from '../message/MessageInputOverlay';
import { CHAT_ENDPOINTS } from '../../config/api.config';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import { useAnima } from '../../contexts/AnimaContext';
import amountService from '../../services/api/amountService';
import musicService from '../../services/api/musicService';
import ProcessingLoadingOverlay from '../persona/ProcessingLoadingOverlay'; // ⭐ NEW: Universal loading overlay

const TABS = [
  {
    id: 'phrase',
    icon: '💬',
    title: '문장',
    description: '대화 시작과 끝을 장식하는 표현',
  },
  {
    id: 'nickname',
    icon: '👤',
    title: '내 호칭',
    description: 'AI가 나를 부를 때 사용하는 호칭 (당신 ❌)',
  },
  {
    id: 'frequent',
    icon: '✨',
    title: '자주 쓰는 말',
    description: '평소 자주 쓰는 말투나 표현',
  },
  {
    id: 'signature',
    icon: '🌟',
    title: '나만의 명언',
    description: '특별한 상황에서 사용하는 시그니처 문구',
  },
];

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
  // Modal Refs
  const greetingInputRef = useRef(null);
  const closingInputRef = useRef(null);
  const nicknameInputRef = useRef(null);
  const frequentInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  const titleInputRef = useRef(null);
  const promptInputRef = useRef(null);
  const lyricsInputRef = useRef(null);
  
  // States
  const [activeTab, setActiveTab] = useState('phrase');
  const [greetingPhrases, setGreetingPhrases] = useState([]);
  const [closingPhrases, setClosingPhrases] = useState([]);
  const [myNicknames, setMyNicknames] = useState([]);
  const [frequentWords, setFrequentWords] = useState([]);
  const [signaturePhrases, setSignaturePhrases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');

  const [musicType, setMusicType] = useState('instrumental'); // 'instrumental' | 'vocal'

  // Animation for lyrics field
  const lyricsHeight = useRef(new Animated.Value(0)).current;
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

      setMusicType('instrumental');
      setTitle('');
      setPrompt('');
      setLyrics('');
    }
  }, [isOpen, personaKey]);

  // Animate lyrics field when music type changes
  useEffect(() => {
    Animated.timing(lyricsHeight, {
      toValue: musicType === 'vocal' ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [musicType]);
  
  const handleMusicCreationSubmit = async () => {
    
    setSaving(true);
    
    try{

      const result = await musicService.createMusic({
        user_key: user.user_key,
        music_title: title.trim(),
        music_type: musicType,
        prompt: prompt.trim(),
        lyrics: musicType === 'vocal' ? lyrics.trim() : '',
      });

      if (result.success) {
        
        setSaving(false);

        showToast({
          type: 'success',
          message: t('music.toast.create_started'),
          emoji: '🎵',
        });
      } else {
        // ⭐ Hide processing overlay on failure
        setSaving(false);
        
        console.log('response.error_code : ', result);
        
        switch(result.errorCode){
          case 'INSUFFICIENT_POINT':
            showAlert ({
              title: t('common.not_enough_point_title'),
              message: t('common.not_enough_point'),
              buttons: [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('common.confirm'),
                  style: 'primary',
                  onPress: () => {
                    handleClose();
                  },
                },
              ],
            });
            break;
          default:
            showAlert ({
              title: t('common.error_title'),
              message: t('common.error'),
              buttons: [
                {
                  text: t('common.confirm'),
                  style: 'primary',
                  onPress: () => {
 
                  },
                },
              ],
            });
            break;  
        }

        return;

      }


    } catch (error) {
      console.error('[CreateMusicSheet] Music creation submit error:', error);
      HapticService.warning();
      showToast({
        type: 'error',
        message: error.message,
        emoji: '⚠️',
      });
    }
  };

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
              handleMusicCreationSubmit();
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
  
  // Handle type selection
  const handleTypeSelect = (type) => {

    HapticService.light();
    setMusicType(type);
    setTitle('');
    setPrompt('');
    setLyrics('');
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // TEXT TRUNCATE HELPER
  // ═══════════════════════════════════════════════════════════════════════
  
  const truncateText = (text, maxLength = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleClose = () => {
    HapticService.light();
    onClose?.();
  };

  const lyricsContainerStyle = {
    maxHeight: lyricsHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, verticalScale(180)],
    }),
    opacity: lyricsHeight,
    overflow: 'hidden',
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
              <CustomText type="big" bold color={COLORS.TEXT_PRIMARY}>
                🎵  {t('ai_comment.create_music_title')}
              </CustomText>

            </View>
            
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={scale(24)} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          {/* Music Type Selection */}
          <View style={[styles.section, { marginTop: verticalScale(20) }]}>
           
            <CustomText type="normal" bold style={[styles.sectionTitle, {  }]}>
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

          {/* 구분선 */}
          <View style={styles.menuDivider} />

          
          {/* Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

          {/* Title Input (Read-only View) */}
          <View style={styles.section_normal}>
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
          <View style={[styles.section_normal, { marginTop: verticalScale(20) }]}>
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
          <Animated.View style={[styles.section_normal, lyricsContainerStyle, { marginTop: verticalScale(20) }]}>
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


          </ScrollView>
          
          {/* Footer Buttons */}
          <View style={styles.footer}>
            <CustomButton
              title={t('common.close')}
              onPress={handleClose}
              type="outline"
              size="medium"
              style={styles.resetButton}
              disabled={loading || saving}
            />
            <CustomButton
              title={t('common.create')}
              onPress={handleSave}
              type="primary"
              size="medium"
              style={styles.saveButton}
              disabled={loading}
              loading={saving}
            />
          </View>
          
          {saving && (
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="small" color={COLORS.DEEP_BLUE} />
              <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ marginLeft: scale(8) }}>
                저장 중...
              </CustomText>
            </View>
          )}
        </Animated.View>
      </Modal>
      
      {/* Input Overlays */}
      <MessageInputOverlay
        ref={titleInputRef}
        title={t('music.creator.title_label')}
        guide={t('music.creator.title_guide')}
        placeholder={t('music.creator.title_placeholder')}
        initialValue={title}
        onSave={setTitle}
        maxLength={20}
        multiline={false}
      />

      <MessageInputOverlay
        ref={promptInputRef}
        title={t('music.creator.prompt_label')}
        placeholder={t('music.creator.prompt_placeholder')}
        initialValue={prompt}
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
      {/* Processing Loading Overlay (Music Generation) */}
      <ProcessingLoadingOverlay
        visible={saving}
        message={t('music.creating_message')}
      />
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
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
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
});

export default CreateMusicSheet;
