/**
 * 🖼️ BackgroundViewerOverlay - Full-Screen Background Viewer
 * 
 * Features:
 * - Full-screen background display (image/video)
 * - Share button (SNS sharing)
 * - Delete button (soft delete)
 * - Tag & date info display
 * - Glassmorphic UI design
 * 
 * Design:
 * ┌─────────────────────────────┐
 * │  [X]                        │  ← Close button
 * │                             │
 * │    [Full Background]        │  ← PersonaBackgroundView
 * │    (Image/Video)            │
 * │                             │
 * │  ╭────────────────────╮     │
 * │  │ 태그1 태그2         │     │  ← Info section
 * │  │ 2026.01.21         │     │
 * │  │ [공유] [삭제]       │     │  ← Action buttons
 * │  ╰────────────────────╯     │
 * └─────────────────────────────┘
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-21
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  BackHandler,
  Share,
  Modal,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import PersonaBackgroundView from '../message/PersonaBackgroundView';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnima } from '../../contexts/AnimaContext';
import { useUser } from '../../contexts/UserContext';
import memoryService from '../../services/api/memoryService';
import HapticService from '../../utils/HapticService';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { useTranslation } from 'react-i18next';

/**
 * Format date helper
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const BackgroundViewerOverlay = ({ 
  visible, 
  background, 
  onClose, 
  onBackgroundUpdate 
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { showAlert, showToast } = useAnima();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const closeButtonScale = useSharedValue(0.8);

  // ═══════════════════════════════════════════════════════════════════════════
  // Animation Effect
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (visible) {
      // Fade in
      fadeAnim.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
      slideAnim.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
      closeButtonScale.value = withSpring(1, { damping: 12 });
    } else {
      // Fade out
      fadeAnim.value = withTiming(0, { duration: 300 });
      slideAnim.value = withTiming(50, { duration: 300 });
      closeButtonScale.value = withTiming(0.8, { duration: 300 });
    }
  }, [visible]);

  // Animated styles
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const infoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const closeButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: closeButtonScale.value }],
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // Android Back Button Handler
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      HapticService.medium();
      onClose?.();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Share Handler
  // ═══════════════════════════════════════════════════════════════════════════
  const handleShare = async () => {
    HapticService.light();

    try {
      const message = `ANIMA 배경\n${background.emotion_tag ? `#${background.emotion_tag}` : ''} ${background.location_tag ? `#${background.location_tag}` : ''}\n${formatDate(background.created_at)}`;
      
      const result = await Share.share({
        message: Platform.OS === 'ios' 
          ? message 
          : `${message}\n\n${background.media_url}`,
        url: Platform.OS === 'ios' ? background.media_url : undefined,
        title: 'ANIMA 배경',
      });

      if (result.action === Share.sharedAction) {
        HapticService.success();
        showToast({
          type: 'success',
          message: '공유되었습니다!',
          emoji: '📤',
        });
      }
    } catch (error) {
      console.error('[BackgroundViewerOverlay] Share error:', error);
      showToast({
        type: 'error',
        message: '공유에 실패했습니다',
        emoji: '❌',
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Delete Handler
  // ═══════════════════════════════════════════════════════════════════════════
  const handleDelete = () => {
    HapticService.light();

    showAlert({
      title: '배경 삭제',
      emoji: '🗑️',
      message: '이 배경을 삭제하시겠습니까?\n삭제된 배경은 복구할 수 없습니다.',
      buttons: [
        {
          text: t('common.cancel') || '취소',
          style: 'cancel',
          onPress: () => HapticService.light(),
        },
        {
          text: t('common.delete') || '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [BackgroundViewerOverlay] Deleting background:', background.memory_key);
              
              const result = await memoryService.deleteMemory(background.memory_key);
              
              if (result.success) {
                HapticService.success();
                showToast({
                  type: 'success',
                  message: '배경이 삭제되었습니다',
                  emoji: '✅',
                });
                
                // Notify parent to update list
                onBackgroundUpdate?.(background, 'delete');
                
                // Close overlay
                setTimeout(() => {
                  onClose?.();
                }, 300);
              } else {
                throw new Error(result.error || '삭제에 실패했습니다');
              }
            } catch (error) {
              console.error('[BackgroundViewerOverlay] Delete error:', error);
              showAlert({
                title: '삭제 실패',
                emoji: '❌',
                message: error.message || '배경 삭제에 실패했습니다',
                buttons: [{ text: t('common.ok') || '확인' }],
              });
            }
          },
        },
      ],
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════
  if (!visible || !background) return null;

  // Create tempPersona object for PersonaBackgroundView
  const tempPersona = {
    persona_key: 'background-viewer',
    selected_dress_image_url: background.media_url,
    selected_dress_video_url: background.video_url,
    selected_dress_video_convert_done: background.convert_done_yn,
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      <Animated.View style={[styles.container, overlayAnimatedStyle]}>
        {/* Background */}
        <PersonaBackgroundView
          persona={tempPersona}
          isScreenFocused={visible}
          opacity={1}
          videoKey={`background-${background.memory_key}-${Date.now()}`}
        />

        {/* Top Gradient (for close button) */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0)']}
          locations={[0, 1]}
          style={styles.topGradient}
        />

        {/* Bottom Gradient (for info) */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
          locations={[0, 0.5, 1]}
          style={styles.bottomGradient}
        />

        {/* Close Button */}
        <Animated.View style={[
          styles.closeButtonContainer,
          { top: insets.top + verticalScale(10) },
          closeButtonAnimatedStyle
        ]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              HapticService.medium();
              onClose?.();
            }}
            activeOpacity={0.7}
          >
            <Icon name="close-circle" size={scale(32)} color="rgba(255, 255, 255, 0.95)" />
          </TouchableOpacity>
        </Animated.View>

        {/* Info Section (Bottom) */}
        <Animated.View style={[
          styles.infoContainer,
          { paddingBottom: insets.bottom + verticalScale(20) },
          infoAnimatedStyle
        ]}>
          {/* Tags */}
          {(background.emotion_tag || background.location_tag) && (
            <View style={styles.tagsRow}>
              {background.emotion_tag && (
                <View style={[styles.tag, { backgroundColor: 'rgba(168, 237, 234, 0.25)' }]}>
                  <CustomText style={styles.tagText}>
                    #{background.emotion_tag}
                  </CustomText>
                </View>
              )}
              {background.location_tag && (
                <View style={[styles.tag, { backgroundColor: 'rgba(254, 214, 227, 0.25)' }]}>
                  <Icon name="location" size={scale(14)} color={COLORS.neonPink} />
                  <CustomText style={styles.tagText}>
                    {background.location_tag}
                  </CustomText>
                </View>
              )}
            </View>
          )}

          {/* Date */}
          <CustomText style={styles.date}>
            {formatDate(background.created_at)}
          </CustomText>

          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <Icon 
              name={background.video_url && background.convert_done_yn === 'Y' ? "videocam" : "image"} 
              size={scale(16)} 
              color="#FFFFFF" 
            />
            <CustomText style={styles.typeText}>
              {background.video_url && background.convert_done_yn === 'Y' ? 'Video Background' : 'Image Background'}
            </CustomText>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Share Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Icon name="share-social" size={scale(20)} color="#FFFFFF" />
              <CustomText style={styles.actionButtonText}>
                {t('common.share') || '공유'}
              </CustomText>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Icon name="trash" size={scale(20)} color="#FFFFFF" />
              <CustomText style={styles.actionButtonText}>
                {t('common.delete') || '삭제'}
              </CustomText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Gradients
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(150),
    zIndex: 10,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(300),
    zIndex: 10,
  },
  
  // Close Button
  closeButtonContainer: {
    position: 'absolute',
    right: scale(20),
    zIndex: 100,
  },
  closeButton: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  
  // Info Section
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    gap: verticalScale(12),
    zIndex: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
    gap: scale(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tagText: {
    fontSize: moderateScale(13),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  date: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    gap: scale(6),
  },
  typeText: {
    fontSize: moderateScale(12),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: scale(12),
    marginTop: verticalScale(8),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    gap: scale(8),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  shareButton: {
    backgroundColor: COLORS.neonBlue,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)', // Red
  },
  actionButtonText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default BackgroundViewerOverlay;
