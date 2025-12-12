/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 MessageDetailOverlay - WebView-Based Message Viewing
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Full-screen overlay with WebView for perfect stability
 * - No video/music conflicts (handled by browser engine)
 * - 100% consistency with KakaoTalk shared links
 * - Single codebase maintenance (Web only)
 * 
 * Features:
 * - WebView rendering (Front Face)
 * - Quick Action Chips (RN): Comment, Favorite, Share, Delete
 * - 180° Flip Card (Message ⟷ Reply List)
 * - Android back button support
 * - Real-time sync with HistoryScreen
 * 
 * Design Pattern:
 * - WebView for content display (stable, unified)
 * - RN for native features (Haptic, Share, Flip)
 * - Overlay architecture (z-index: 9999)
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-12 (WebView Refactor)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

// ═══════════════════════════════════════════════════════════════════════════
// Contexts & Services
// ═══════════════════════════════════════════════════════════════════════════
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useAnima } from '../../contexts/AnimaContext';
import { scale, verticalScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import messageService from '../../services/api/messageService';

// ═══════════════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════════════
import CustomText from '../CustomText';
import MessageHistoryChips from './MessageHistoryChips';
import FlipCard from './FlipCard';
import ReplyListView from './ReplyListView';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../styles/commonstyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * MessageDetailOverlay Component
 * 
 * @param {boolean} visible - Overlay visibility (controlled by parent)
 * @param {object} message - Complete message object from HistoryScreen
 * @param {function} onClose - Callback when overlay should close
 * @param {function} onMessageUpdate - Callback when message is updated (favorite, delete)
 */
const MessageDetailOverlay = ({ visible, message, onClose, onMessageUpdate }) => {
  const { currentTheme } = useTheme();
  const { user } = useUser();
  const { showAlert, showToast } = useAnima();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // State Management
  // ═══════════════════════════════════════════════════════════════════════════
  const [isFlipped, setIsFlipped] = useState(false); // ⭐ 180° flip for comment view
  const [localMessage, setLocalMessage] = useState(message); // ⭐ Local message state for UI updates
  const [isWebViewLoading, setIsWebViewLoading] = useState(true); // ⭐ WebView loading state

  // ⭐ Update localMessage when message prop changes
  useEffect(() => {
    if (message) {
      setLocalMessage(message);
      setIsWebViewLoading(true); // Reset loading state
    }
  }, [message]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Extract message data
  // ═══════════════════════════════════════════════════════════════════════════
  const {
    share_url,
    message_key,
  } = localMessage || {};

  // ═══════════════════════════════════════════════════════════════════════════
  // Sequential Animation (Simplified for WebView)
  // ═══════════════════════════════════════════════════════════════════════════
  const overlayOpacity = useSharedValue(0); // 전체 오버레이
  const chipsOpacity = useSharedValue(0); // 칩셋 투명도

  useEffect(() => {
    if (visible) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✨ [MessageDetailOverlay] Opening with WebView');
      console.log('   🌐 URL:', share_url);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Reset
      overlayOpacity.value = 0;
      chipsOpacity.value = 0;
      
      // Fade in overlay
      overlayOpacity.value = withTiming(1, { 
        duration: 300, 
        easing: Easing.out(Easing.ease) 
      });
      
      // Chips appear after WebView loads (controlled by onLoadEnd)
      
    } else {
      console.log('🌙 [MessageDetailOverlay] Closing WebView overlay');
      overlayOpacity.value = withTiming(0, { 
        duration: 400,
        easing: Easing.in(Easing.ease) 
      });
      chipsOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  // ⭐ Show chips after WebView loads
  const handleWebViewLoadEnd = () => {
    console.log('✅ [MessageDetailOverlay] WebView loaded successfully');
    setIsWebViewLoading(false);
    
    // Show chips with delay
    chipsOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
    );
  };

  // Animated Styles
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const chipsContainerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chipsOpacity.value,
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // Android Back Button Handler (with flip support)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('[MessageDetailOverlay] Android back button pressed');
      
      // 1️⃣ If flipped (showing reply view), go back to message view
      if (isFlipped) {
        console.log('[MessageDetailOverlay] Flipped → Un-flipping');
        HapticService.light();
        setIsFlipped(false);
        return true; // Prevent default behavior (closing screen)
      }
      
      // 2️⃣ Otherwise, close the overlay
      console.log('[MessageDetailOverlay] Closing overlay');
      HapticService.medium();
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, isFlipped, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers: Quick Action Chips
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Handle back button
  const handleBack = () => {
    HapticService.light();
    
    // If flipped (showing reply view), go back to message view
    if (isFlipped) {
      setIsFlipped(false);
      return;
    }
    
    // Otherwise, close the overlay
    onClose();
  };

  // Handle comment press (180° flip)
  const handleCommentPress = () => {
    HapticService.light();
    setIsFlipped(!isFlipped);
  };

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    if (!localMessage) return;

    const newFavoriteYn = localMessage.favorite_yn === 'Y' ? 'N' : 'Y';

    try {
      const result = await messageService.toggleFavorite(localMessage.message_key, user?.user_key, newFavoriteYn);

      if (result.success) {
        // ⭐ Update local message state (immediate UI update)
        const updatedMessage = { ...localMessage, favorite_yn: newFavoriteYn };
        setLocalMessage(updatedMessage);

        // ⭐ Notify parent screen (real-time sync)
        onMessageUpdate?.(updatedMessage, 'favorite');

        // Toast notification
        showToast({
          type: 'success',
          message: newFavoriteYn === 'Y' 
            ? t('message.history.favorite_added')
            : t('message.history.favorite_removed'),
          emoji: newFavoriteYn === 'Y' ? '❤️' : '🤍',
        });
      }
    } catch (error) {
      console.error('[MessageDetailOverlay] Favorite toggle error:', error);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!localMessage) return;

    showAlert({
      title: t('message.history.delete'),
      message: t('message.history.delete_confirm_message'),
      emoji: '🗑️',
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: t('message.history.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await messageService.deleteMessage(localMessage.message_key, user?.user_key);

              if (result.success) {
                // ⭐ Notify parent screen (real-time sync)
                onMessageUpdate?.(localMessage, 'delete');

                showToast({
                  type: 'success',
                  message: t('message.history.delete_success'),
                  emoji: '✅',
                });

                // Close overlay after deletion
                onClose();
              }
            } catch (error) {
              console.error('[MessageDetailOverlay] Delete error:', error);
            }
          },
        },
      ],
    });
  };

  // Handle help press
  const handleHelpPress = () => {
    HapticService.light();
    showToast({
      type: 'info',
      message: t('message.history.help_message', '메시지를 감상하세요!'),
      emoji: '💡',
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render: Don't render if not visible
  // ═══════════════════════════════════════════════════════════════════════════
  if (!visible || !localMessage || !share_url) return null;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Front View (WebView - Message)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderFront = () => (
    <View style={styles.webViewContainer}>
      {/* Loading Indicator */}
      {isWebViewLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.mainColor} />
          <CustomText type="middle" style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
            {t('common.loading', 'Loading...')}
          </CustomText>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: share_url }}
        style={styles.webView}
        onLoadEnd={handleWebViewLoadEnd}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ [MessageDetailOverlay] WebView error:', nativeEvent);
          setIsWebViewLoading(false);
        }}
        // ⭐ Media playback settings
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // ⭐ Performance settings
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        // ⭐ iOS settings
        allowsBackForwardNavigationGestures={false}
        bounces={false}
        // ⭐ Android settings
        mixedContentMode="compatibility"
        // ⭐ Disable zoom
        scalesPageToFit={Platform.OS === 'android'}
      />
    </View>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Back View (Replies)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderBack = () => (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ReplyListView
        messageKey={localMessage?.message_key}
        userKey={user?.user_key}
        onClose={handleCommentPress}
      />
    </View>
  );

  return (
    <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
      {/* FlipCard: Front (WebView) / Back (Replies) */}
      <FlipCard
        isFlipped={isFlipped}
        front={renderFront()}
        back={renderBack()}
      />

      {/* Header (Back Button Only) */}
      <View style={[styles.header, { paddingTop: insets.top + verticalScale(10) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={scale(28)} color="#FFFFFF" />
        </TouchableOpacity>

        <CustomText type="big" bold style={[styles.headerTitle, { color: currentTheme.textPrimary }]}>
          {t('navigation.title.history_detail')}
        </CustomText>
        
        {/* Help Icon */}
        <TouchableOpacity
          style={[{ marginLeft: 'auto' }]}
          onPress={handleHelpPress}
          activeOpacity={0.7}
        >
          <Icon name="help-circle-outline" size={scale(30)} color={currentTheme.mainColor} />
        </TouchableOpacity>
      </View>

      {/* Quick Action Chips (우측 중앙) - Only visible when not flipped */}
      {!isFlipped && (
        <Animated.View style={[
          styles.chipsContainer,
          { top: insets.top + verticalScale(0) },
          chipsContainerAnimatedStyle
        ]}>
          <MessageHistoryChips
            message={localMessage}
            onCommentPress={handleCommentPress}
            onFavoriteToggle={handleToggleFavorite}
            onDelete={handleDelete}
          />
        </Animated.View>
      )}

    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // ⭐ 탭바 위에 완전히 덮음
    elevation: 999,
    backgroundColor: COLORS.BACKGROUND || '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(12),
    zIndex: 10000, // ⭐ Above WebView
    backgroundColor: 'transparent',
  },
  backButton: {
    marginRight: scale(0),
    padding: scale(8),
    marginLeft: scale(-15),
  },
  headerTitle: {
    marginLeft: scale(8),
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND || '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND || '#000',
    zIndex: 1,
  },
  loadingText: {
    marginTop: verticalScale(16),
    fontSize: scale(16),
  },
  chipsContainer: {
    position: 'absolute',
    right: 0,
    zIndex: 10001, // ⭐ Above header
    elevation: 100,
  },
});

export default MessageDetailOverlay;
