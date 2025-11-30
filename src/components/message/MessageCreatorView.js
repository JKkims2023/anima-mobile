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

import React, { useState, useRef, useCallback, useFocusEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import PersonaSelectorHorizontal from './PersonaSelectorHorizontal';
import PersonaBackgroundView from './PersonaBackgroundView';
import MessageInputBottomSheet from './MessageInputBottomSheet';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useAnima } from '../../contexts/AnimaContext';

const MessageCreatorView = ({
  personas = [],
  onAddPersona,
  onPreview,
  isCreating = false,
  isScreenFocused = true,
}) => {
  const { t } = useTranslation();
  const { showToast } = useAnima();

  // Refs for bottom sheets
  const titleSheetRef = useRef(null);
  const contentSheetRef = useRef(null);
  const passwordSheetRef = useRef(null);

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

  const selectedPersona = displayPersonas[selectedPersonaIndex] || displayPersonas[0] || null;

  console.log('[MessageCreatorView] Selected:', {
    selectedIndex: selectedPersonaIndex,
    selectedPersonaKey: selectedPersona?.persona_key,
    selectedPersonaName: selectedPersona?.persona_name,
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

  // Save handlers
  const handleTitleSave = useCallback((value) => {
    setMessageTitle(value);
    showToast({
      type: 'success',
      message: t('common.saved'),
      emoji: '✅',
    });
  }, [showToast, t]);

  const handleContentSave = useCallback((value) => {
    setMessageContent(value);
    showToast({
      type: 'success',
      message: t('common.saved'),
      emoji: '✅',
    });
  }, [showToast, t]);

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
    // Validation
    if (!selectedPersona) {
      showToast({
        type: 'error',
        message: t('message.errors.persona_required'),
        emoji: '⚠️',
      });
      return;
    }

    if (!messageTitle || messageTitle.trim() === '') {
      showToast({
        type: 'error',
        message: t('message.errors.title_required'),
        emoji: '⚠️',
      });
      return;
    }

    if (!messageContent || messageContent.trim() === '') {
      showToast({
        type: 'error',
        message: t('message.errors.content_required'),
        emoji: '⚠️',
      });
      return;
    }

    // Pass data to parent
    onPreview({
      persona: selectedPersona,
      title: messageTitle,
      content: messageContent,
      hasPassword,
      password,
    });
  }, [selectedPersona, messageTitle, messageContent, hasPassword, password, onPreview, showToast, t]);

  return (
    <View style={styles.container}>
      {/* Background: Persona Image/Video */}
      <PersonaBackgroundView
        persona={selectedPersona}
        isScreenFocused={isScreenFocused}
        opacity={1}
      />

      {/* Content: Persona Selector + Message Overlay */}
      <View style={styles.contentContainer}>
        {/* Persona Selector (Top) */}
        <View style={styles.selectorContainer}>
          <PersonaSelectorHorizontal
            personas={displayPersonas}
            selectedIndex={selectedPersonaIndex}
            onSelectPersona={setSelectedPersonaIndex}
            onAddPersona={onAddPersona}
            isCreating={isCreating}
            hasWaitingPersona={false}
            showDefaultPersonas={personas.length === 0}
          />
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Message Overlay (Bottom) */}
        <View style={styles.messageOverlayContainer}>
          {/* Title Field */}
          <TouchableOpacity
            style={styles.overlayField}
            onPress={handleTitleTap}
            activeOpacity={0.8}
          >
            <View style={styles.overlayFieldHeader}>
              <Icon name="text" size={moderateScale(18)} color={COLORS.DEEP_BLUE_LIGHT} />
              <CustomText type="small" bold style={styles.overlayFieldLabel}>
                {t('message.input.title_label')}
              </CustomText>
            </View>
            {messageTitle ? (
              <CustomText type="title" bold style={styles.overlayFieldValue}>
                {messageTitle}
              </CustomText>
            ) : (
              <CustomText type="normal" style={styles.overlayFieldPlaceholder}>
                {t('message.input.title_placeholder')}
              </CustomText>
            )}
            <View style={styles.tapHint}>
              <CustomText type="small" style={styles.tapHintText}>
                💬 {t('common.tap_to_edit')}
              </CustomText>
            </View>
          </TouchableOpacity>

          {/* Content Field */}
          <TouchableOpacity
            style={[styles.overlayField, styles.contentField]}
            onPress={handleContentTap}
            activeOpacity={0.8}
          >
            <View style={styles.overlayFieldHeader}>
              <Icon name="text-box-outline" size={moderateScale(18)} color={COLORS.DEEP_BLUE_LIGHT} />
              <CustomText type="small" bold style={styles.overlayFieldLabel}>
                {t('message.input.content_label')}
              </CustomText>
            </View>
            {messageContent ? (
              <CustomText type="normal" style={styles.overlayFieldValue} numberOfLines={4}>
                {messageContent}
              </CustomText>
            ) : (
              <CustomText type="normal" style={styles.overlayFieldPlaceholder} numberOfLines={2}>
                {t('message.input.content_placeholder')}
              </CustomText>
            )}
            <View style={styles.tapHint}>
              <CustomText type="small" style={styles.tapHintText}>
                💬 {t('common.tap_to_edit')}
              </CustomText>
            </View>
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

          {/* Preview Button */}
          <CustomButton
            title={`✨ ${t('message.buttons.preview')}`}
            onPress={handlePreview}
            type="primary"
            style={styles.previewButton}
            disabled={!messageTitle || !messageContent}
          />
        </View>
      </View>

      {/* Bottom Sheets */}
      <MessageInputBottomSheet
        ref={titleSheetRef}
        fieldType="title"
        initialValue={messageTitle}
        onSave={handleTitleSave}
        onClose={() => titleSheetRef.current?.dismiss()}
      />

      <MessageInputBottomSheet
        ref={contentSheetRef}
        fieldType="content"
        initialValue={messageContent}
        onSave={handleContentSave}
        onClose={() => contentSheetRef.current?.dismiss()}
      />

      <MessageInputBottomSheet
        ref={passwordSheetRef}
        fieldType="password"
        initialValue={password || ''}
        onSave={handlePasswordSave}
        onClose={() => passwordSheetRef.current?.dismiss()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_PRIMARY,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  selectorContainer: {
    marginTop: platformPadding(10),
  },
  spacer: {
    flex: 1,
  },
  messageOverlayContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: platformPadding(30),
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark overlay for readability
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
  },
  overlayField: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glass effect
    borderRadius: scale(16),
    padding: platformPadding(16),
    marginTop: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentField: {
    minHeight: scale(120),
  },
  overlayFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: scale(8),
  },
  overlayFieldLabel: {
    color: COLORS.TEXT_PRIMARY,
  },
  overlayFieldValue: {
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
  },
  overlayFieldCompactText: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
  },
  previewButton: {
    marginTop: scale(20),
  },
});

export default MessageCreatorView;

