/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📜 MessageHistorySheet - Previous Messages List for Reuse
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Load user's message history
 * - Show messages in list format
 * - Click to apply settings to current message creation
 * - Empty state handling
 * - Pull-to-refresh support
 * - Infinite scroll pagination
 * 
 * Props:
 * - visible: boolean
 * - onClose: () => void
 * - onSelectMessage: (message) => void
 * - userKey: string
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import MessageHistoryListItem from './MessageHistoryListItem';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import messageService from '../../services/api/messageService';
import HapticService from '../../utils/HapticService';
import { scale, verticalScale } from '../../utils/responsive-utils';

const MessageHistorySheet = ({
  visible = false,
  onClose,
  onSelectMessage,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user } = useUser();
  const sheetRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // State Management
  // ═══════════════════════════════════════════════════════════════════════════
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ⭐ Remove pagination states (not needed for simple list)

  // ═══════════════════════════════════════════════════════════════════════════
  // Load Messages (Simplified - no pagination)
  // ═══════════════════════════════════════════════════════════════════════════
  const loadMessages = useCallback(async () => {
    if (!user?.user_key) {
      console.log('[MessageHistorySheet] ⚠️ No user key, skipping load');
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📜 [MessageHistorySheet] Loading messages');
    console.log('   user_key:', user.user_key);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    setLoading(true);
    setError(null);

    try {
      // ⭐ Load all messages (limit 200)
      const result = await messageService.listMessages(user.user_key, 1, 200);

      console.log('🔍 [MessageHistorySheet] Full result:', result);
      console.log('🔍 [MessageHistorySheet] result.data:', result.data);

      if (result.success) {
        // ⭐ FIX: result.data is the array directly, not result.data.messages
        const newMessages = result.data || [];
        console.log('✅ [MessageHistorySheet] Messages loaded:', newMessages.length);
        console.log('✅ [MessageHistorySheet] First message:', newMessages[0]);
        setMessages(newMessages);
      } else {
        console.error('❌ [MessageHistorySheet] Load failed:', result.errorCode);
        setError(result.errorCode);
      }
    } catch (error) {
      console.error('❌ [MessageHistorySheet] Load error:', error);
      setError('NETWORK_ERROR');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Sheet Control (present/dismiss based on visible prop)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (visible) {
      console.log('[MessageHistorySheet] 🎬 Opening sheet (present)');
      sheetRef.current?.present();
      
      // Load messages on first open
      if (user?.user_key && messages.length === 0) {
        console.log('[MessageHistorySheet] 🔄 Initial load triggered');
        loadMessages(true);
      }
    } else {
      console.log('[MessageHistorySheet] 🌙 Closing sheet (dismiss)');
      sheetRef.current?.dismiss();
    }
  }, [visible]); // ⚠️ loadMessages를 dependency에서 제거 (무한 루프 방지)

  // ═══════════════════════════════════════════════════════════════════════════
  // Event Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  // Handle message press
  const handleMessagePress = useCallback((message) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📜 [MessageHistorySheet] Message pressed!');
    console.log('   message_key:', message.message_key);
    console.log('   message_title:', message.message_title);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    HapticService.medium();

    // ⭐ Call parent callback to apply settings
    if (onSelectMessage) {
      onSelectMessage(message);
    }

    // Close sheet
    sheetRef.current?.dismiss();
  }, [onSelectMessage]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render Functions
  // ═══════════════════════════════════════════════════════════════════════════

  // Render empty state
  // ⭐ Render content (loading / error / list / empty)
  const renderContent = () => {
    // Loading state
    if (loading && messages.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={currentTheme.mainColor} />
          <CustomText style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            {t('message.history.loading') || '메시지 불러오는 중...'}
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
            {t('message.history.error') || '메시지를 불러오는데 실패했습니다.'}
          </CustomText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: currentTheme.mainColor }]}
            onPress={loadMessages}
          >
            <CustomText style={styles.retryButtonText}>
              {t('common.retry') || '다시 시도'}
            </CustomText>
          </TouchableOpacity>
        </View>
      );
    }

    // Empty state
    if (messages.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="document-text-outline" size={scale(60)} color={currentTheme.textSecondary} />
          <CustomText style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            {t('message.history.empty') || '작성한 메시지가 없습니다.'}
          </CustomText>
          <CustomText style={[styles.emptySubText, { color: currentTheme.textSecondary }]}>
            {t('message.history.empty_hint') || '첫 메시지를 작성해보세요!'}
          </CustomText>
        </View>
      );
    }

    // ⭐ Render messages directly with map (no FlatList needed!)
    return (
      <View style={styles.listContainer}>
        {messages.map((message) => (
          <MessageHistoryListItem
            key={message.message_key}
            message={message}
            onPress={() => handleMessagePress(message)}
          />
        ))}
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render Component
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <CustomBottomSheet
      ref={sheetRef}
      snapPoints={['80%']}
      title={t('message.history.title') || '이전 메시지 불러오기'}
      subtitle={t('message.history.subtitle') || '메시지를 선택하면 설정이 자동으로 적용됩니다'}
      onClose={onClose}
      enablePanDownToClose={true}
    >
      {/* ⭐ FIX: Render content directly (no FlatList, just map!) */}
      {renderContent()}
    </CustomBottomSheet>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  listContainer: {
    // ⭐ Simple container for mapped items
  },
  emptyContainer: {
    minHeight: verticalScale(400), // ⭐ Minimum height for centering
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

export default MessageHistorySheet;
