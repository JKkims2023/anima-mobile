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
import HapticService from '../../utils/HapticService';
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
 * Get emotion color for badge
 */
const getEmotionColor = (emotion) => {
  const colors = {
    happy: 'rgba(255, 193, 7, 0.15)',     // Yellow
    sad: 'rgba(59, 130, 246, 0.15)',      // Blue
    love: 'rgba(236, 72, 153, 0.15)',     // Pink
    excited: 'rgba(251, 146, 60, 0.15)',  // Orange
    grateful: 'rgba(16, 185, 129, 0.15)', // Green
    touched: 'rgba(168, 85, 247, 0.15)',  // Purple
  };
  return colors[emotion] || 'rgba(59, 130, 246, 0.15)';
};

/**
 * Format date helper
 */
const formatDate = (dateString, t) => {
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

/**
 * ReplyCard Component (Separate component for useState)
 */
const ReplyCard = ({ item, currentTheme, t }) => {
  const [isExpanded, setIsExpanded] = useState(true); // ✅ Now it's in a component!
  
  const isTextReply = item.reply_type === 'text';
  const isLikeOnly = item.reply_type === 'like';
  const hasEmotion = !!item.emotion;
  const hasText = isTextReply && item.reply_text;

  // Toggle accordion
  const handleToggle = () => {
    if (hasText) {
      HapticService.light();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.replyCard,
        { backgroundColor: currentTheme.cardBackground },
        hasEmotion && styles.replyCardWithEmotion,
      ]}
      onPress={handleToggle}
      activeOpacity={hasText ? 0.7 : 1}
      disabled={!hasText}
    >
      {/* Header */}
      <View style={styles.replyHeader}>
        <View style={styles.replyAuthor}>
          <Icon name="person-circle" size={scale(24)} color={currentTheme.textSecondary} />
          <CustomText style={[styles.authorName, { color: currentTheme.textPrimary }]}>
            {item.sender_name || t('reply.anonymous')}
          </CustomText>
        </View>
        
        <View style={styles.replyHeaderRight}>
          <CustomText style={[styles.replyDate, { color: currentTheme.textSecondary }]}>
            {formatDate(item.created_at, t)}
          </CustomText>
          {/* Accordion toggle icon */}
          {hasText && (
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={scale(20)}
              color={currentTheme.textSecondary}
              style={{ marginLeft: scale(8) }}
            />
          )}
        </View>
      </View>

      {/* Emotion Badge (Large & Prominent) */}
      {hasEmotion && (
        <View style={[
          styles.emotionBadge,
          { backgroundColor: getEmotionColor(item.emotion) }
        ]}>
          <CustomText style={styles.emotionBadgeEmoji}>
            {EMOTION_EMOJI[item.emotion] || '💙'}
          </CustomText>
          <CustomText style={styles.emotionBadgeLabel}>
            {t(`reply.emotion.${item.emotion}`)}
          </CustomText>
        </View>
      )}

      {/* Text Reply (Accordion Content) */}
      {hasText && isExpanded && (
        <View style={styles.replyTextContainer}>
          <CustomText style={[styles.replyText, { color: currentTheme.textPrimary }]}>
            {item.reply_text}
          </CustomText>
        </View>
      )}

      {/* Like Only (Compact Badge) */}
      {isLikeOnly && (
        <View style={styles.likeOnlyBadge}>
          <Icon name="heart" size={scale(16)} color="#FF4444" />
          <CustomText style={[styles.likeOnlyText, { color: currentTheme.textSecondary }]}>
            {t('reply.liked_message')}
          </CustomText>
        </View>
      )}
    </TouchableOpacity>
  );
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
        // ✅ Map backend fields to frontend fields
        const mappedReplies = (result.data.replies || []).map(reply => ({
          ...reply,
          reply_text: reply.reply_content,      // Backend: reply_content → Frontend: reply_text
          emotion: reply.emotion_type,           // Backend: emotion_type → Frontend: emotion
          sender_name: reply.sender_info,        // Backend: sender_info → Frontend: sender_name
        }));

        setReplies(mappedReplies);
        
        // ✅ Map stats emotion_breakdown to emotions
        const mappedStats = {
          total: result.data.stats?.total || 0,
          emotions: result.data.stats?.emotion_breakdown || {},
        };
        setStats(mappedStats);

        console.log('[ReplyListView] Mapped replies:', mappedReplies);
        console.log('[ReplyListView] Mapped stats:', mappedStats);
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
  // Render reply card (uses ReplyCard component)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderReplyCard = ({ item }) => (
    <ReplyCard item={item} currentTheme={currentTheme} t={t} />
  );

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
    padding: scale(16),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  replyCardWithEmotion: {
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.3)', // Neon blue
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
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
  replyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyDate: {
    fontSize: moderateScale(11),
  },
  
  // Emotion Badge (Large & Prominent)
  emotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(20),
    marginBottom: verticalScale(12),
    gap: scale(10),
  },
  emotionBadgeEmoji: {
    fontSize: moderateScale(28),
  },
  emotionBadgeLabel: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Text Reply Container (Accordion)
  replyTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: moderateScale(12),
    padding: scale(12),
    marginTop: verticalScale(4),
  },
  replyText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(21),
  },
  
  // Like Only Badge (Compact)
  likeOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginTop: verticalScale(4),
  },
  likeOnlyText: {
    fontSize: moderateScale(12),
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

