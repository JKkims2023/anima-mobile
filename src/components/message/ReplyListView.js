/**
 * 💬 ReplyListView Component
 * 
 * Display list of replies for a message
 * - Reply stats (total count, emotion breakdown)
 * - FlashList of replies
 * - Emotion chips, text replies, likes
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnima } from '../../contexts/AnimaContext';
import messageService from '../../services/api/messageService';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

/**
 * Emotion emoji mapping
 */
const EMOTION_EMOJI = {
  happy: '😊',
  sad: '😢',
  love: '💙',
  excited: '🎉',
  grateful: '🙏',
  touched: '🥺',
};

/**
 * ReplyListView Component
 */
const ReplyListView = ({ messageKey, userKey, onClose }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { showToast } = useAnima();

  // State
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    emotions: {},
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load replies on mount
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (messageKey) {
      loadReplies();
    }
  }, [messageKey]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load replies from API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadReplies = async () => {
    setIsLoading(true);
    try {
      const result = await messageService.getReplies(messageKey, userKey);

      console.log('[ReplyListView] Load replies result:', result);
      if (result.success && result.data) {
        setReplies(result.data.data.replies || []);
        setStats(result.data.data.stats || { total: 0, emotions: {} });
      }
    } catch (error) {
      console.error('[ReplyListView] Failed to load replies:', error);
      showToast({
        type: 'error',
        message: t('reply.load_error'),
        emoji: '❌',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render reply card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderReplyCard = ({ item }) => {
    const isTextReply = item.reply_type === 'text';
    const isLikeOnly = item.reply_type === 'like';

    return (
      <View style={[styles.replyCard, { backgroundColor: currentTheme.cardBackground }]}>
        {/* Header */}
        <View style={styles.replyHeader}>
          <View style={styles.replyAuthor}>
            <Icon name="person-circle" size={scale(24)} color={currentTheme.textSecondary} />
            <CustomText style={[styles.authorName, { color: currentTheme.textPrimary }]}>
              {item.sender_name || t('reply.anonymous')}
            </CustomText>
          </View>
          <CustomText style={[styles.replyDate, { color: currentTheme.textSecondary }]}>
            {formatDate(item.created_at)}
          </CustomText>
        </View>

        {/* Emotion */}
        {item.emotion && (
          <View style={styles.emotionChip}>
            <CustomText style={styles.emotionEmoji}>
              {EMOTION_EMOJI[item.emotion] || '💙'}
            </CustomText>
            <CustomText style={[styles.emotionLabel, { color: currentTheme.textSecondary }]}>
              {t(`reply.emotion.${item.emotion}`)}
            </CustomText>
          </View>
        )}

        {/* Text Reply */}
        {isTextReply && item.reply_text && (
          <CustomText style={[styles.replyText, { color: currentTheme.textPrimary }]}>
            {item.reply_text}
          </CustomText>
        )}

        {/* Like Only */}
        {isLikeOnly && (
          <View style={styles.likeOnly}>
            <Icon name="heart" size={scale(20)} color="#FF4444" />
            <CustomText style={[styles.likeOnlyText, { color: currentTheme.textSecondary }]}>
              {t('reply.liked_message')}
            </CustomText>
          </View>
        )}
      </View>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Format date
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('reply.just_now');
    if (minutes < 60) return t('reply.minutes_ago', { count: minutes });
    if (hours < 24) return t('reply.hours_ago', { count: hours });
    if (days < 7) return t('reply.days_ago', { count: days });

    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render empty state
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Icon name="chatbubble-outline" size={scale(64)} color={currentTheme.textSecondary} />
        <CustomText style={[styles.emptyText, { color: currentTheme.textPrimary }]}>
          {t('reply.no_replies')}
        </CustomText>
        <CustomText style={[styles.emptySubtext, { color: currentTheme.textSecondary }]}>
          {t('reply.be_first_to_reply')}
        </CustomText>
      </View>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      {/* Stats Card */}
      <View style={[styles.statsCard, { backgroundColor: currentTheme.cardBackground }]}>
        <View style={styles.statsHeader}>
          <Icon name="chatbubbles" size={scale(24)} color={currentTheme.mainColor} />
          <CustomText type="big" bold style={[styles.statsTitle, { color: currentTheme.textPrimary }]}>
            {t('reply.total_replies', { count: stats.total })}
          </CustomText>
        </View>

        {/* Emotion Stats */}
        {Object.keys(stats.emotions).length > 0 && (
          <View style={styles.emotionStats}>
            {Object.entries(stats.emotions).map(([emotion, count]) => (
              <View key={emotion} style={styles.emotionStat}>
                <CustomText style={styles.emotionStatEmoji}>
                  {EMOTION_EMOJI[emotion] || '💙'}
                </CustomText>
                <CustomText style={[styles.emotionStatCount, { color: currentTheme.textSecondary }]}>
                  {count}
                </CustomText>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Reply List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.neonBlue} />
        </View>
      ) : (
        <FlashList
          data={replies}
          renderItem={renderReplyCard}
          estimatedItemSize={120}
          keyExtractor={(item) => item.reply_key}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <CustomButton
          text={t('reply.back_to_message')}
          onPress={onClose}
          leftIcon={<Icon name="arrow-back" size={scale(20)} color="#FFFFFF" />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Stats Card
  statsCard: {
    marginHorizontal: scale(20),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(16),
    padding: scale(16),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(12),
  },
  statsTitle: {
    // color set dynamically
  },
  emotionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(12),
  },
  emotionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  emotionStatEmoji: {
    fontSize: moderateScale(18),
  },
  emotionStatCount: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },

  // Reply Card
  replyCard: {
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    padding: scale(14),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  replyAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  authorName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  replyDate: {
    fontSize: moderateScale(12),
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: verticalScale(8),
  },
  emotionEmoji: {
    fontSize: moderateScale(20),
  },
  emotionLabel: {
    fontSize: moderateScale(13),
  },
  replyText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  likeOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  likeOnlyText: {
    fontSize: moderateScale(13),
    fontStyle: 'italic',
  },

  // List
  listContent: {
    paddingBottom: verticalScale(100),
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
    gap: verticalScale(12),
  },
  emptyText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },

  // Back Button
  backButtonContainer: {
    position: 'absolute',
    bottom: verticalScale(20),
    left: scale(20),
    right: scale(20),
  },
});

export default ReplyListView;

