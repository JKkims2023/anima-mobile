/**
 * 💌 MessageCreatorView_v2 Component
 * 
 * Revolutionary UI: Persona background + overlay message fields
 * User sees the final result while creating
 * 
 * Features:
 * - PersonaBackgroundView (image/video)
 * - Overlay message title & content display
 * - Tap to edit via independent bottom sheets
 * - Preview button with flip animation
 */

import React, { useState, useRef, useCallback, useEffect, useFocusEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Clipboard } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import PersonaSelectorHorizontal from './PersonaSelectorHorizontal';
import PersonaBackgroundView from './PersonaBackgroundView';
import MessagePreviewOverlay from './MessagePreviewOverlay';
import MessageInputBottomSheet from './MessageInputBottomSheet';
import MessageInputOverlay from './MessageInputOverlay';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useAnima } from '../../contexts/AnimaContext';
import { useUser } from '../../contexts/UserContext';
import messageService from '../../services/api/messageService';
import { getUserKey } from '../../utils/storage';
import GradientOverlay from '../GradientOverlay';
import { verticalScale } from '../../utils/responsive-utils';
import LinearGradient from 'react-native-linear-gradient';

const MessageCreatorView = ({
  personas = [],
  selectedPersona = null, // ⭐ NEW: Selected persona from parent
  selectedMessage = null, // ⭐ NEW: Selected message from search
  onAddPersona,
  isScreenFocused = true,
  showPersonaSelector = true, // ⭐ NEW: Control persona selector visibility
}) => {
  const { t } = useTranslation();
  const { showToast, showAlert } = useAnima();
  const { user } = useUser();
  const navigation = useNavigation();

  // Refs for bottom sheets
  const titleSheetRef = useRef(null);
  const contentSheetRef = useRef(null);
  const passwordSheetRef = useRef(null);

  // 그라디언트 색상 배열: 위(투명) -> 아래(어두움)
  const gradientColors = [
    'transparent',
    `rgba(0, 0, 0, 0.7)` 
  ];
  
  // Default personas (SAGE, Nexus)
  const defaultPersonas = [
    {
      persona_key: 'default_sage',
      persona_name: 'SAGE',
      original_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/f91b1fb7-d162-470d-9a43-2ee5835ee0bd_00001_.png',
      selected_dress_video_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/46fb3532-e41a-4b96-8105-a39e64f39407_00001_.mp4',
      selected_dress_video_convert_yn: 'Y',
      isDefault: true,
      done_yn: 'Y',
    },
    {
      persona_key: 'default_nexus',
      persona_name: 'Nexus',
      original_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/29e7b9c3-b2a2-4559-8021-a8744ef509cd_00001_.png',
      selected_dress_video_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/5b444ca5-d161-47a1-bfae-81171f8df1f1_00001_.mp4',
      selected_dress_video_convert_yn: 'Y',
      isDefault: true,
      done_yn: 'Y',
    },
  ];

  // Always include default personas, then user personas
  const displayPersonas = personas.length === 0 
    ? defaultPersonas 
    : [...defaultPersonas, ...personas];

  // Debug log
  console.log('[MessageCreatorView] Personas:', {
    userPersonas: personas.length,
    defaultPersonas: defaultPersonas.length,
    displayPersonas: displayPersonas.length,
    displayPersonasKeys: displayPersonas.map(p => p.persona_key),
  });

  // State
  const [selectedPersonaIndex, setSelectedPersonaIndex] = useState(0);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState(null);
  
  // Preview state
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Effect configuration (for MessagePreviewOverlay)
  const [textAnimation, setTextAnimation] = useState('fade_in');
  const [particleEffect, setParticleEffect] = useState('none');
  const [bgMusic, setBgMusic] = useState('none');
  const [bgMusicUrl, setBgMusicUrl] = useState(null);
  
  // Handle music selection (receives music_key and music_url)
  const handleMusicSelect = useCallback((music_key, music_url) => {
    console.log('🎵 [MessageCreatorView] Music selected:', { music_key, music_url });
    setBgMusic(music_key);
    setBgMusicUrl(music_url);
  }, []);
  
  // ⭐ NEW: Auto-fill from selected message (from search)
  useEffect(() => {
    if (selectedMessage) {
      if (__DEV__) {
        console.log('[MessageCreatorView] 🔍 Auto-filling from selected message:', selectedMessage.message_title);
      }
      
      setMessageTitle(selectedMessage.message_title || '');
      setMessageContent(selectedMessage.message_content || '');
      setHasPassword(selectedMessage.has_password === 'Y');
      
      // Show toast notification
      showToast({
        type: 'success',
        message: t('message_creator.message_loaded'),
        emoji: '✅',
      });
    }
  }, [selectedMessage, showToast, t]);

  // ⭐ Use prop's selectedPersona if provided, otherwise use internal state
  const currentPersona = selectedPersona || displayPersonas[selectedPersonaIndex] || displayPersonas[0] || null;

  console.log('[MessageCreatorView] Selected:', {
    selectedIndex: selectedPersonaIndex,
    selectedPersonaKey: currentPersona?.persona_key,
    selectedPersonaName: currentPersona?.persona_name,
    fromProp: !!selectedPersona, // ⭐ Track if persona came from prop
  });

  // Handle field tap - open bottom sheet
  const handleTitleTap = useCallback(() => {
    HapticService.light();
    console.log('[MessageCreatorView] Opening title sheet, ref:', titleSheetRef.current);
    titleSheetRef.current?.present();
  }, []);

  const handleContentTap = useCallback(() => {
    HapticService.light();
    console.log('[MessageCreatorView] Opening content sheet, ref:', contentSheetRef.current);
    contentSheetRef.current?.present();
  }, []);

  const handlePasswordTap = useCallback(() => {
    HapticService.light();
    console.log('[MessageCreatorView] Opening password sheet, ref:', passwordSheetRef.current);
    passwordSheetRef.current?.present();
  }, []);

  // Save handlers (receive value from independent sheet)
  const handleTitleSave = useCallback((value) => {
    setMessageTitle(value);
  }, []);

  const handleContentSave = useCallback((value) => {
    setMessageContent(value);
  }, []);

  const handlePasswordSave = useCallback((data) => {
    setHasPassword(data.hasPassword);
    setPassword(data.password);
    showToast({
      type: 'success',
      message: t('common.saved'),
      emoji: '✅',
    });
  }, [showToast, t]);

  // Handle preview
  const handlePreview = useCallback(() => {
    // ✅ 1. Login check (highest priority)
    if (!user || !user.user_key) {
    
      // Navigate to Settings screen for login
      setTimeout(() => {
        navigation.navigate('Settings');
      }, 500);
      
      showToast({
        type: 'warning',
        message: t('message_creator.errors.login_required'),
        emoji: '🔐',
      });
      
      return;
    }

    // 2. Validation
    if (!currentPersona) {
      showToast({
        type: 'error',
        message: t('message_creator.errors.persona_required'),
        emoji: '⚠️',
      });
      return;
    }

    if (!messageTitle || messageTitle.trim() === '') {
      showToast({
        type: 'error',
        message: t('message_creator.errors.title_required'),
        emoji: '⚠️',
      });
      return;
    }

    if (!messageContent || messageContent.trim() === '') {
      showToast({
        type: 'error',
        message: t('message_creator.errors.content_required'),
        emoji: '⚠️',
      });
      return;
    }

    // 3. Show preview overlay
    HapticService.success();
    setShowPreviewOverlay(true);
  }, [user, navigation, currentPersona, messageTitle, messageContent, showToast, t]);
  
  // Handle close preview overlay
  const handleClosePreviewOverlay = useCallback(() => {
    HapticService.light();
    setShowPreviewOverlay(false);
  }, []);
  
  // Handle generate URL
  const handleGenerateURL = useCallback(async () => {
    console.log('[MessageCreatorView] Generating URL...');
    setIsCreating(true);
    
    try {
      // Get user key
      const userKey = user?.user_key;
      if (!userKey) {
        throw new Error('User key not found');
      }

      // Prepare API params (including effect configuration)
      const params = {
        user_key: userKey,
        persona_key: currentPersona.persona_key,
        memory_key: currentPersona.memory_key || null,
        message_title: messageTitle.trim(),
        message_content: messageContent.trim(),
        persona_name: currentPersona.persona_name,
        persona_image_url: currentPersona.selected_dress_image_url || currentPersona.original_url,
        persona_video_url: currentPersona.selected_dress_video_url || null,
        message_password: hasPassword ? password : null,
        has_password: hasPassword ? 'Y' : 'N',
        // ⭐ Effect configuration
        text_animation: textAnimation,
        particle_effect: particleEffect,
        bg_music: bgMusic,
        bg_music_url: bgMusicUrl,
        effect_config: null, // Can be expanded later
      };

      console.log('[MessageCreatorView] API params:', params);

      // Call API
      const result = await messageService.createMessage(params);

      if (result.success) {
        const shareUrl = result.data.share_url;
        
        // Copy to clipboard
        Clipboard.setString(shareUrl);
        
        console.log('[MessageCreatorView] Message created:', result.data);

        // Show success toast
        showToast({
          type: 'success',
          message: t('message_creator.url_copied_toast'),
          emoji: '🎉',
        });

        // Reset and go back after delay
        setTimeout(() => {
          handleClosePreviewOverlay();
          setTimeout(() => {
            setMessageTitle('');
            setMessageContent('');
            setHasPassword(false);
            setPassword(null);
          }, 300);
        }, 1500);
      } else {
        // Show error
        showAlert({
          title: t('common.error'),
          message: t('message_creator.errors.creation_failed'),
          emoji: '❌',
        });
      }
    } catch (error) {
      console.error('❌ [MessageCreatorView] Generate URL error:', error);
      showAlert({
        title: t('common.error'),
        message: error.message || t('message_creator.errors.network_error'),
        emoji: '❌',
      });
    } finally {
      setIsCreating(false);
    }
  }, [user, currentPersona, messageTitle, messageContent, hasPassword, password, textAnimation, particleEffect, bgMusic, bgMusicUrl, showToast, showAlert, t, handleClosePreviewOverlay]);

  return (
    <View style={styles.container}>

      {/* Message Creator UI */}
      <View style={StyleSheet.absoluteFill}>
      

        {/* Content: Persona Selector + Message Overlay */}
        <View style={[styles.contentContainer, !showPersonaSelector && styles.contentContainerCompact]}>
      

        {/* Spacer - ⭐ Only show when persona selector is visible */}
        {showPersonaSelector && <View style={styles.spacer} />}

        <LinearGradient
          colors={gradientColors}
          style={[styles.gradient, { height: verticalScale(400) }]}
        >
        {/* Message Overlay (Bottom) */}
        <View style={styles.messageOverlayContainer}>
          
          {/* Preview Button */}
          <CustomButton
            title={`✨ ${t('message.buttons.preview')}`}
            onPress={handlePreview}
            type="primary"
            style={styles.chatButton}
//            disabled={!messageTitle || !messageContent}
          />
          {/* Title Field */}
          <TouchableOpacity
            style={styles.overlayField}
            onPress={handleTitleTap}
            activeOpacity={0.8}
          >
            <View style={styles.overlayFieldHeader}>
              <Icon name="text" size={moderateScale(28)} color={COLORS.DEEP_BLUE} style={{ display: 'none' }} />
            </View>
            {messageTitle ? (
              <CustomText type="middle" bold style={styles.overlayFieldValue}>
                {messageTitle}
              </CustomText>
            ) : (
              <View style={[styles.overlayFieldHeader, { flexDirection: 'row', alignItems: 'center', gap: scale(8) }]}>
              <Icon name="format-title" size={moderateScale(28)} color='white'  />
              <CustomText type="middle" bold style={styles.overlayFieldValue}>
                {t('message.input.title_placeholder')}
              </CustomText>
              </View>
            )}
          </TouchableOpacity>

          {/* Content Field */}
          <TouchableOpacity
            style={[styles.overlayField, styles.contentField]}
            onPress={handleContentTap}
            activeOpacity={0.8}
          >
           
            {messageContent ? (
              <CustomText type="middle" style={styles.overlayFieldCommentValue} numberOfLines={4}>
                {messageContent}
              </CustomText>
            ) : (
              <View style={[{ marginTop: scale(0), paddingTop: scale(0), flexDirection: 'row', alignItems: 'center', gap: scale(8) }]}>
              <Icon name="text-box-outline" size={moderateScale(20)} color='white'  />
              <CustomText type="normal"  style={styles.overlayFieldCommentValue}>
                {t('message.input.content_placeholder')}
              </CustomText>
              </View>
            )}
          </TouchableOpacity>

          {/* Password Field (Compact) */}
          <TouchableOpacity
            style={styles.overlayFieldCompact}
            onPress={handlePasswordTap}
            activeOpacity={0.8}
          >
            <Icon
              name={hasPassword ? 'lock' : 'lock-open-outline'}
              size={moderateScale(18)}
              color={hasPassword ? COLORS.DEEP_BLUE_LIGHT : COLORS.TEXT_TERTIARY}
            />
            <CustomText type="small" style={styles.overlayFieldCompactText}>
              {hasPassword ? '🔒 ' + t('common.password_set') : t('common.no_password')}
            </CustomText>
            <Icon name="pencil" size={moderateScale(14)} color={COLORS.TEXT_TERTIARY} />
          </TouchableOpacity>


        </View>
        </LinearGradient>
      </View>

      {/* Input Overlays - Simple & Clean! */}
      {/* ✅ Title Input Overlay */}
      <MessageInputOverlay
        ref={titleSheetRef}
        title={t('message.input.title_label')}
        placeholder={t('message.input.title_placeholder')}
        leftIcon="text"
        initialValue={messageTitle}
        maxLength={50}
        multiline={false}
        onSave={handleTitleSave}
      />

      {/* ✅ Content Input Overlay */}
      <MessageInputOverlay
        ref={contentSheetRef}
        title={t('message.input.content_label')}
        placeholder={t('message.input.content_placeholder')}
        leftIcon="text-box-outline"
        initialValue={messageContent}
        maxLength={500}
        multiline={true}
        onSave={handleContentSave}
      />

      {/* ✅ Password: MessageInputBottomSheet (toggle 필요) */}
      <MessageInputBottomSheet
        ref={passwordSheetRef}
        fieldType="password"
        initialValue={password || ''}
        onSave={handlePasswordSave}
        onClose={() => passwordSheetRef.current?.dismiss()}
      />
      </View>

      {/* Message Preview Overlay (Modal) */}
      <MessagePreviewOverlay
        visible={showPreviewOverlay}
        persona={currentPersona}
        messageTitle={messageTitle}
        messageContent={messageContent}
        textAnimation={textAnimation}
        particleEffect={particleEffect}
        bgMusic={bgMusic}
        bgMusicUrl={bgMusicUrl}
        onClose={handleClosePreviewOverlay}
        onGenerateURL={handleGenerateURL}
        onChangeTextAnimation={setTextAnimation}
        onChangeParticleEffect={setParticleEffect}
        onChangeBgMusic={handleMusicSelect}
        isCreating={isCreating}
      />

    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // ⭐ Transparent container (background handled by PersonaBackgroundView or parent)
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'transparent', // ⭐ FIX: Transparent to show PersonaSwipeViewer
  },
  contentContainerCompact: {
   // flex: 0, // ⭐ FIX: No flex when used as overlay in PersonaStudioScreen
   // justifyContent: 'flex-end',
  },
  selectorContainer: {
    marginTop: platformPadding(10),
  },
  spacer: {
    flex: 1,
  },
  messageOverlayContainer: {
    paddingHorizontal: scale(10),
    paddingBottom: platformPadding(30),
//    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark overlay for readability
//    borderTopLeftRadius: scale(30),
//    borderTopRightRadius: scale(30),
  },
  overlayField: {
  //  backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glass effect
  //  borderRadius: scale(16),
    padding: platformPadding(16),
    marginTop: scale(10),
  //  borderWidth: 1,
  //  borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentField: {
    marginTop: scale(0),
    marginBottom: scale(10),
  },
  overlayFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: scale(0),
    marginLeft: scale(-5),
    
  },
  overlayFieldLabel: {
    color: COLORS.TEXT_PRIMARY,
  },
  overlayFieldValue: {
    fontSize: scale(20),
    color: COLORS.TEXT_PRIMARY,
    lineHeight: scale(24),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  overlayFieldCommentValue: {
    fontSize: scale(18),
    color: COLORS.TEXT_PRIMARY,
    lineHeight: scale(24),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  overlayFieldPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    lineHeight: scale(22),
  },
  tapHint: {
    display: 'none',
    marginTop: scale(8),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  tapHintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  overlayFieldCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(12),
    padding: platformPadding(12),
    marginTop: scale(15),
    gap: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    display: 'none',
  },
  overlayFieldCompactText: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
  },
  previewButton: {
    marginTop: scale(20),

  },
  gradient: {
    // 핵심 스타일: 화면 하단에 고정
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end', // 컨텐츠를 아래쪽으로 정렬
  },
  chatButton: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',

    // ✅ Shadow
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    // ✅ Border
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 'auto',
  },
});

export default MessageCreatorView;

