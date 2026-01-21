/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🖼️ BackgroundSelectionSheet - User Background Selection for Message Creation
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Load user's dress/memory list
 * - Show thumbnails in horizontal scroll (DressManageSheer pattern)
 * - Click to apply background to message creation
 * - Reset button in header (return to original persona background)
 * - Empty state handling
 * - Image/Video badge indicator
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onSelectBackground: (memory) => void
 * - onResetBackground: () => void
 * - currentBackground: memory object (currently selected background)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-21
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useAnima } from '../../contexts/AnimaContext';
import memoryService from '../../services/api/memoryService';
import HapticService from '../../utils/HapticService';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const BackgroundSelectionSheet = ({
  isOpen = false,
  onClose,
  onSelectBackground,
  onResetBackground,
  currentBackground = null,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user } = useUser();
  const { showToast } = useAnima();
  const sheetRef = useRef(null);
  const flatListRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // State Management
  // ═══════════════════════════════════════════════════════════════════════════
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // Load Backgrounds
  // ═══════════════════════════════════════════════════════════════════════════
  const loadBackgrounds = useCallback(async () => {
    if (!user?.user_key) {
      console.log('[BackgroundSelectionSheet] ⚠️ No user key, skipping load');
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖼️ [BackgroundSelectionSheet] Loading backgrounds');
    console.log('   user_key:', user.user_key);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    setLoading(true);
    setError(null);

    try {
      const result = await memoryService.listUserBackgrounds(user.user_key);

      console.log('🔍 [BackgroundSelectionSheet] Result:', result);

      if (result.success) {
        const newBackgrounds = result.data || [];
        console.log('✅ [BackgroundSelectionSheet] Backgrounds loaded:', newBackgrounds.length);
        setBackgrounds(newBackgrounds);
      } else {
        console.error('❌ [BackgroundSelectionSheet] Load failed:', result.errorCode);
        setError(result.errorCode);
      }
    } catch (error) {
      console.error('❌ [BackgroundSelectionSheet] Load error:', error);
      setError('NETWORK_ERROR');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Sheet Control (present/dismiss based on isOpen prop)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isOpen) {
      console.log('[BackgroundSelectionSheet] 🎬 Opening sheet (present)');
      sheetRef.current?.present();
      
      // Load backgrounds on open
      if (user?.user_key) {
        loadBackgrounds();
      }
    } else {
      console.log('[BackgroundSelectionSheet] 🌙 Closing sheet (dismiss)');
      sheetRef.current?.dismiss();
    }
  }, [isOpen, user?.user_key]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Event Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  // Handle background selection
  const handleBackgroundPress = useCallback((memory) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖼️ [BackgroundSelectionSheet] Background selected!');
    console.log('   memory_key:', memory.memory_key);
    console.log('   media_url:', memory.media_url);
    console.log('   video_url:', memory.video_url);
    console.log('   convert_done_yn:', memory.convert_done_yn);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    HapticService.medium();

    // Call parent callback
    if (onSelectBackground) {
      onSelectBackground(memory);
    }

    // Show toast
    showToast({
      type: 'success',
      emoji: '🎨',
      message: t('message.background_selection.changed_message') || '배경이 변경되었습니다!',
    });

    // Close sheet
    sheetRef.current?.dismiss();
  }, [onSelectBackground, showToast, t]);

  // Handle reset to original persona background
  const handleReset = useCallback(() => {
    console.log('🔄 [BackgroundSelectionSheet] Reset to original background');
    
    HapticService.light();

    // Call parent callback
    if (onResetBackground) {
      onResetBackground();
    }

    // Show toast
    showToast({
      type: 'info',
      emoji: '🔄',
      message: t('message.background_selection.reset_message') || '원래 배경으로 복귀했습니다!',
    });

    // Close sheet
    sheetRef.current?.dismiss();
  }, [onResetBackground, showToast, t]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render Item (DressManageSheer pattern)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderBackground = useCallback(({ item }) => {
    // Check if this is currently selected background
    const isSelected = currentBackground?.memory_key === item.memory_key;
    
    // Determine if video or image
    const hasVideo = item.video_url && item.convert_done_yn === 'Y';
    
    return (
      <TouchableOpacity
        style={styles.backgroundItem}
        onPress={() => handleBackgroundPress(item)}
        activeOpacity={0.8}
      >
        {/* Thumbnail */}
        <Image 
          source={{ uri: item.media_url }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        
        {/* Video Badge (top-left) */}
        {hasVideo && (
          <View style={styles.videoBadge}>
            <Icon name="play-circle" size={moderateScale(20)} color="#FFFFFF" />
          </View>
        )}
        
        {/* Selected Badge (top-right) */}
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Icon name="check-circle" size={moderateScale(20)} color="#FFFFFF" />
            <CustomText type="tiny" style={styles.selectedBadgeText}>
              {t('message.background_selection.selected') || '선택됨'}
            </CustomText>
          </View>
        )}
        
        {/* Emotion Tag Overlay (bottom) */}
        {item.emotion_tag && (
          <View style={styles.tagOverlay}>
            <CustomText type="tiny" style={styles.tagText}>
              {item.emotion_tag}
            </CustomText>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [currentBackground, handleBackgroundPress, t]);

  const keyExtractor = useCallback((item) => item.memory_key, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render Content
  // ═══════════════════════════════════════════════════════════════════════════
  const renderContent = () => {
    // Loading state
    if (loading && backgrounds.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={currentTheme.mainColor} />
          <CustomText style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            {t('message.background_selection.loading') || '배경 불러오는 중...'}
          </CustomText>
        </View>
      );
    }

    // Error state
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="alert-circle-outline" size={scale(60)} color={currentTheme.textSecondary} />
          <CustomText style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            {t('message.background_selection.error') || '배경을 불러오는데 실패했습니다.'}
          </CustomText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: currentTheme.mainColor }]}
            onPress={loadBackgrounds}
          >
            <CustomText style={styles.retryButtonText}>
              {t('common.retry') || '다시 시도'}
            </CustomText>
          </TouchableOpacity>
        </View>
      );
    }

    // Empty state
    if (backgrounds.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="image-off-outline" size={scale(60)} color={currentTheme.textSecondary} />
          <CustomText style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            {t('message.background_selection.empty_title') || '보유한 드레스가 없습니다'}
          </CustomText>
          <CustomText style={[styles.emptySubText, { color: currentTheme.textSecondary }]}>
            {t('message.background_selection.empty_subtitle') || '페르소나 스튜디오에서 드레스를 생성해보세요! 🎨'}
          </CustomText>
        </View>
      );
    }

    // Render FlashList with horizontal scroll
    return (
      <View style={styles.listContainer}>
        <FlashList
          ref={flatListRef}
          data={backgrounds}
          renderItem={renderBackground}
          keyExtractor={keyExtractor}
          horizontal={true}
          estimatedItemSize={scale(200)}
          scrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={scale(200) + scale(12)}
          snapToAlignment="start"
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render Component
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <CustomBottomSheet
      ref={sheetRef}
      snapPoints={['50%']}
      title={t('message.background_selection.title') || '배경 선택'}
      subtitle={t('message.background_selection.subtitle') || '드레스를 선택하여 배경을 변경하세요'}
      onClose={onClose}
      enablePanDownToClose={true}
      buttons={[
        {
          title: t('common.close') || '닫기',
          type: 'outline',
          onPress: onClose,
        },
        {
          title: t('message.background_selection.reset_button') || '원래 배경',
          type: 'secondary',
          icon: 'refresh',
          onPress: handleReset,
        },
      ]}
    >
      {renderContent()}
    </CustomBottomSheet>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  listContainer: {
    height: verticalScale(280),
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
  },
  backgroundItem: {
    width: scale(200),
    height: verticalScale(260),
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
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: scale(8),
    left: scale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: scale(20),
    padding: scale(4),
  },
  selectedBadge: {
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
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  tagOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    textAlign: 'center',
  },
  emptyContainer: {
    minHeight: verticalScale(280),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    fontSize: scale(16),
    fontWeight: '600',
    textAlign: 'center',
    marginTop: verticalScale(20),
  },
  emptySubText: {
    fontSize: scale(14),
    textAlign: 'center',
    marginTop: verticalScale(8),
    opacity: 0.7,
  },
  retryButton: {
    marginTop: verticalScale(20),
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderRadius: scale(12),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '600',
  },
});

export default BackgroundSelectionSheet;
