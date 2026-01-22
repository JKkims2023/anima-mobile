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
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'; // ⭐ NEW: For chip icons
import CustomText from '../CustomText';
import HistoryBackgroundView from '../message/HistoryBackgroundView';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnima } from '../../contexts/AnimaContext';
import { useUser } from '../../contexts/UserContext';
import memoryService from '../../services/api/memoryService';
import amountService from '../../services/api/amountService'; // ⭐ NEW: For video conversion cost
import HapticService from '../../utils/HapticService';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { useTranslation } from 'react-i18next';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

  // ⭐ NEW: Video converting state
  const [isVideoConverting, setIsVideoConverting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const closeButtonScale = useSharedValue(0.8);
  
  // ⭐ NEW: Chip animations (fade-in sequence)
  const chipOpacity0 = useSharedValue(0); // Video chip
  const chipOpacity1 = useSharedValue(0); // Share chip
  const chipOpacity2 = useSharedValue(0); // Delete chip
  
  // ⭐ NEW: Video chip rotation (when converting)
  const videoRotation = useSharedValue(0);
  
  // ⭐ NEW: Tooltip animation
  const tooltipOpacity = useSharedValue(0);
  const tooltipTranslateX = useSharedValue(10);

  // ═══════════════════════════════════════════════════════════════════════════
  // Animation Effect
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (visible) {
      // Fade in
      fadeAnim.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
      slideAnim.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
      closeButtonScale.value = withSpring(1, { damping: 12 });
      
      // ⭐ NEW: Chips fade-in sequence
      chipOpacity0.value = 0;
      chipOpacity1.value = 0;
      chipOpacity2.value = 0;
      
      chipOpacity0.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      chipOpacity1.value = withTiming(1, { duration: 300, delay: 100, easing: Easing.out(Easing.ease) });
      chipOpacity2.value = withTiming(1, { duration: 300, delay: 200, easing: Easing.out(Easing.ease) });
    } else {
      // Fade out
      fadeAnim.value = withTiming(0, { duration: 300 });
      slideAnim.value = withTiming(50, { duration: 300 });
      closeButtonScale.value = withTiming(0.8, { duration: 300 });
      
      // ⭐ NEW: Chips fade-out
      chipOpacity0.value = withTiming(0, { duration: 200 });
      chipOpacity1.value = withTiming(0, { duration: 200 });
      chipOpacity2.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);
  
  // ⭐ NEW: Video rotation animation (when converting)
  useEffect(() => {
    if (isVideoConverting) {
      videoRotation.value = withRepeat(
        withTiming(360, {
          duration: 2000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      videoRotation.value = withTiming(0, { duration: 300 });
    }
  }, [isVideoConverting]);
  
  // ⭐ NEW: Tooltip auto-hide
  useEffect(() => {
    if (showTooltip) {
      tooltipOpacity.value = withTiming(1, { duration: 200 });
      tooltipTranslateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      
      const timer = setTimeout(() => {
        tooltipOpacity.value = withTiming(0, { duration: 200 });
        tooltipTranslateX.value = withTiming(10, { duration: 200 });
        setTimeout(() => setShowTooltip(false), 200);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);
  
  // ⭐ NEW: Check if background is converting (update state from prop)
  useEffect(() => {
    if (background) {
      const isConverting = 
        background.video_url !== null && 
        background.convert_done_yn === 'N';
      setIsVideoConverting(isConverting);
    }
  }, [background]);

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
  
  // ⭐ NEW: Chip animated styles
  const chip0AnimatedStyle = useAnimatedStyle(() => ({
    opacity: chipOpacity0.value,
  }));
  
  const chip1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: chipOpacity1.value,
  }));
  
  const chip2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: chipOpacity2.value,
  }));
  
  // ⭐ NEW: Video icon rotation
  const videoIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${videoRotation.value}deg` }],
  }));
  
  // ⭐ NEW: Tooltip animated style
  const tooltipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ translateX: tooltipTranslateX.value }],
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
                buttons: [{ text: t('common.confirm')}],
              });
            }
          },
        },
      ],
    });
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ NEW: Video Conversion Handler
  // ═══════════════════════════════════════════════════════════════════════════
  const handleVideoConvert = async () => {
    HapticService.light();
    
    // ⭐ Check if already converting
    if (isVideoConverting) {
      setShowTooltip(true);
      return;
    }
    
    // ⭐ Check if already has video
    if (background.video_url !== null && background.convert_done_yn === 'Y') {
      showAlert({
        title: '이미 변환 완료',
        message: '이 배경은 이미 영상으로 변환되었습니다.',
        emoji: '✅',
        buttons: [{ text: t('common.confirm')}],
      });
      return;
    }
    
    try {
      // ⭐ Get video conversion cost
      const serviceData = await amountService.getServiceData({
        user_key: user?.user_key,
      });

      if (!serviceData.success) {
        HapticService.warning();
        console.log('[BackgroundViewerOverlay] Service data fetch failed');
        return;
      }
      
      const video_amount = serviceData.data.video_amount;
      
      // ⭐ Confirm with user
      showAlert({
        title: '영상 변환 확인',
        message: `이 배경을 영상으로 변환하시겠습니까?\n${video_amount.toLocaleString()} 포인트가 차감됩니다.`,
        emoji: '🎬',
        buttons: [
          {
            text: t('common.cancel') || '취소',
            style: 'cancel',
          },
          {
            text: t('common.confirm') || '확인',
            style: 'primary',
            onPress: async () => {
              try {
                console.log('🎬 [BackgroundViewerOverlay] Starting video conversion...');
                
                // ⭐ Call API (will be created)
                const result = await memoryService.convertBackgroundVideo(
                  background.memory_key,
                  user.user_key,
                  background.media_url
                );

                if (result.success) {
                  // ⭐ Update local state
                  setIsVideoConverting(true);
                  
                  HapticService.success();
                  showToast({
                    type: 'success',
                    message: '영상 변환이 시작되었습니다.\n완료되면 알림을 보내드립니다.',
                    emoji: '🎬',
                  });
                  
                  // ⭐ Update parent (HistoryScreen)
                  onBackgroundUpdate?.(
                    { 
                      ...background, 
                      video_url: result.data.video_url,
                      convert_done_yn: 'N',
                      bric_convert_key: result.data.request_key,
                    }, 
                    'video_converting'
                  );
                  
                  console.log('✅ [BackgroundViewerOverlay] Video conversion started:', result.data.request_key);
                } else {
                  // ⭐ Handle errors
                  switch(result.errorCode) {
                    case 'INSUFFICIENT_POINT':
                      showAlert({
                        title: t('common.not_enough_point_title') || '포인트 부족',
                        message: t('common.not_enough_point') || '포인트가 부족합니다.',
                        buttons: [{ text: t('common.confirm') || '확인' }],
                      });
                      break;
                    default:
                      throw new Error(result.message || '영상 변환에 실패했습니다');
                  }
                }
              } catch (error) {
                console.error('❌ [BackgroundViewerOverlay] Video convert error:', error);
                HapticService.warning();
                showAlert({
                  title: '변환 실패',
                  emoji: '❌',
                  message: error.message || '영상 변환에 실패했습니다',
                  buttons: [{ text: t('common.confirm')}],
                });
              }
            },
          },
        ],
      });
    } catch (error) {
      console.error('[BackgroundViewerOverlay] Video convert error:', error);
      HapticService.warning();
      showAlert({
        title: '오류',
        emoji: '❌',
        message: error.message || '오류가 발생했습니다',
        buttons: [{ text: t('common.confirm')}],
      });
    }
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
      style={{backgroundColor: 'black'}}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      <Animated.View style={[styles.container, overlayAnimatedStyle]}>
        {/* Background */}
        <HistoryBackgroundView
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
          { top: insets.top + verticalScale(50) },
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
        
        {/* ⭐ NEW: Quick Action Chips (Right Side) */}
        <View style={[styles.chipsContainer, { top: insets.top + verticalScale(170) }]}>
          {/* ⭐ Tooltip (Left side of video chip) */}
          {showTooltip && (
            <Animated.View style={[styles.tooltip, tooltipAnimatedStyle]}>
              <CustomText style={styles.tooltipText}>
                영상 변환 중입니다...
              </CustomText>
              <View style={styles.tooltipArrow} />
            </Animated.View>
          )}
          
          {/* Video Chip (Conditional: only show if no video OR converting) */}
          {(background.video_url === null || isVideoConverting) && (
            <AnimatedPressable
              style={[
                styles.chip,
                chip0AnimatedStyle,
                isVideoConverting && styles.chipConverting,
              ]}
              onPress={handleVideoConvert}
            >
              <Animated.View style={videoIconAnimatedStyle}>
                <MaterialIcon 
                  name={isVideoConverting ? "timer-sand" : "heart-multiple-outline"} 
                  size={scale(24)} 
                  color={isVideoConverting ? "#FFB84D" : "#FF7FA3"} 
                />
              </Animated.View>
            </AnimatedPressable>
          )}
          
          {/* Share Chip */}
          <AnimatedPressable
            style={[styles.chip, chip1AnimatedStyle]}
            onPress={handleShare}
          >
            <MaterialIcon name="share-variant-outline" size={scale(24)} color="#6BB6FF" />
          </AnimatedPressable>
          
          {/* Delete Chip */}
          <AnimatedPressable
            style={[styles.chip, chip2AnimatedStyle]}
            onPress={handleDelete}
          >
            <MaterialIcon name="delete-forever-outline" size={scale(24)} color="#FF0000" />
          </AnimatedPressable>
        </View>

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
  
  // ⭐ NEW: Quick Action Chips (Right Side)
  chipsContainer: {
    position: 'absolute',
    right: scale(20),
    gap: verticalScale(12),
    zIndex: 100,
  },
  chip: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  chipConverting: {
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderColor: 'rgba(255, 165, 0, 0.6)',
    borderWidth: 1.5,
  },
  
  // ⭐ NEW: Tooltip (Left side of chips)
  tooltip: {
    position: 'absolute',
    left: scale(-210),
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: scale(10),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 165, 0, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: scale(180),
    maxWidth: scale(220),
  },
  tooltipText: {
    fontSize: scale(13),
    color: '#FFA500',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: scale(18),
  },
  tooltipArrow: {
    position: 'absolute',
    right: scale(-8),
    top: '50%',
    marginTop: scale(-8),
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftWidth: 8,
    borderLeftColor: 'rgba(0, 0, 0, 0.9)',
  },
});

export default BackgroundViewerOverlay;
