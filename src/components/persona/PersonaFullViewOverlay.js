/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🖼️ PersonaFullViewOverlay Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 페르소나 전체창 오버레이
 * - 전체 화면 이미지/비디오 표시
 * - 핀치줌 기능 (확대/축소/리셋)
 * - 공유하기 버튼
 * - 닫기 버튼
 * - SafeArea 침범 방지
 * 
 * @author JK & Hero NEXUS
 * @date 2026-01-15
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Dimensions,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring 
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import HapticService from '../../utils/HapticService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * PersonaFullViewOverlay Component
 * @param {boolean} visible - 오버레이 표시 여부
 * @param {Object} persona - 선택된 페르소나 정보
 * @param {Function} onClose - 닫기 버튼 클릭 시 콜백
 * @param {Function} onShare - 공유하기 버튼 클릭 시 콜백
 */
const PersonaFullViewOverlay = ({ 
  visible, 
  persona, 
  onClose, 
  onShare 
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  
  // ⭐ Zoom + Pan State (핀치줌 + 상하좌우 이동)
  const zoomScale = useSharedValue(1); // ⭐ RENAMED: 'scale' conflicts with responsive-utils function
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  // Context for Pan (이전 위치 저장)
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);
  
  // ⭐ Android Back Button Handler (전체창 닫기)
  useEffect(() => {
    if (!visible) return;
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (__DEV__) {
        console.log('[PersonaFullViewOverlay] 🔙 Back button pressed, closing full view');
      }
      HapticService.light();
      onClose?.();
      return true; // Prevent app exit
    });
    
    return () => backHandler.remove();
  }, [visible, onClose]);
  
  // ⭐ Pan Gesture Handler (상하좌우 이동)
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: () => {
      // Keep current position (no reset on pan end)
    },
  });
  
  // Animated Style for Zoom + Pan
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: zoomScale.value },
    ]
  }));
  
  if (!visible || !persona) return null;
  
  // Determine content type (video or image)
  const hasVideo = persona.selected_dress_video_url && 
                   persona.selected_dress_video_convert_done === 'Y';
  const contentUrl = hasVideo 
    ? persona.selected_dress_video_url 
    : (persona.selected_dress_image_url || persona.persona_url);
  
  if (__DEV__) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖼️ [PersonaFullViewOverlay] Rendering');
    console.log('   Persona:', persona.persona_name);
    console.log('   Has Video:', hasVideo);
    console.log('   Content URL:', contentUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Close Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: currentTheme.cardBackground }]}
            onPress={() => {
              HapticService.light();
              onClose?.();
            }}
            activeOpacity={0.7}
          >
            <Icon name="close" size={scale(28)} color={currentTheme.textPrimary} />
          </TouchableOpacity>
        </View>
        
        {/* Content (Image/Video with Pinch Zoom) */}
        <View style={styles.contentContainer}>
          <PanGestureHandler
            onGestureEvent={panGestureHandler}
            minPointers={1}
            maxPointers={1}
          >
            <Animated.View style={{ flex: 1 }}>
              <PinchGestureHandler
                onGestureEvent={(event) => {
                  zoomScale.value = event.nativeEvent.scale;
                }}
                onHandlerStateChange={(event) => {
                  if (event.nativeEvent.state === State.END) {
                    // Reset zoom AND position with spring animation
                    zoomScale.value = withSpring(1, {
                      damping: 15,
                      stiffness: 150,
                    });
                    translateX.value = withSpring(0, {
                      damping: 15,
                      stiffness: 150,
                    });
                    translateY.value = withSpring(0, {
                      damping: 15,
                      stiffness: 150,
                    });
                  }
                }}
              >
                <Animated.View style={[styles.content, animatedStyle]}>
                  {hasVideo ? (
                    <Video
                      source={{ uri: contentUrl }}
                      style={styles.media}
                      resizeMode="contain"
                      repeat
                      muted={false}
                      paused={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: contentUrl }}
                      style={styles.media}
                      resizeMode="contain"
                    />
                  )}
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>
          
          {/* Zoom + Pan Hint */}
          <View style={styles.hintContainer}>
            <CustomText type="small" style={[styles.hintText, { color: currentTheme.textSecondary }]}>
              {t('persona.fullview.zoom_pan_hint') || '확대/축소 및 이동 가능 • 두 손가락 떼면 리셋'}
            </CustomText>
          </View>
        </View>
        
        {/* Share Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: currentTheme.mainColor }]}
            onPress={() => {
              HapticService.success();
              onShare?.();
            }}
            activeOpacity={0.8}
          >
            <Icon name="share" size={scale(24)} color="#FFFFFF" />
            <CustomText bold style={styles.shareButtonText}>
              {t('persona.share') || '공유하기'}
            </CustomText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 999999,
    elevation: 999,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
  },
  closeButton: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  hintContainer: {
    position: 'absolute',
    bottom: verticalScale(20),
    alignSelf: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: scale(20),
  },
  hintText: {
    fontSize: scale(12),
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(20),
  },
  shareButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
    borderRadius: scale(12),
    gap: scale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
  },
});

export default PersonaFullViewOverlay;
