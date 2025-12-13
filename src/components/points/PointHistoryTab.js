/**
 * 📊 PointHistoryTab - 포인트 히스토리 탭
 * 
 * ANIMA 감성:
 * - 직관적인 히스토리
 * - 명확한 정보
 * - 감성적인 아이콘
 * 
 * @author JK & Hero Nexus
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useAnima } from '../../contexts/AnimaContext';
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { getPointHistory } from '../../services/api/pointService';

/**
 * 📊 PointHistoryTab Component
 */
const PointHistoryTab = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user } = useUser();
  const { showToast } = useAnima();

  // ✅ State
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // ⭐ Prevent infinite loop - 완전히 다른 방식
  const isLoadingRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  // ✅ Load History on Focus (React Navigation)
  useFocusEffect(
    useCallback(() => {
      console.log('[PointHistoryTab] Tab focused');
      
      // ⭐ 첫 로딩만 자동으로, 이후는 Pull-to-Refresh만
      if (!hasLoadedOnceRef.current && user?.user_key) {
        console.log('[PointHistoryTab] First load - auto loading');
        hasLoadedOnceRef.current = true;
        loadHistory();
      } else {
        console.log('[PointHistoryTab] Already loaded - use Pull-to-Refresh');
      }

      // Cleanup on unfocus
      return () => {
        console.log('[PointHistoryTab] Tab unfocused');
      };
    }, []) // ⭐ 빈 배열! user 의존성 제거
  );

  // ✅ Load History
  const loadHistory = async (pageNum = 1, isRefresh = false) => {
    console.log('[PointHistoryTab] loadHistory called', { pageNum, isRefresh, isLoading: isLoadingRef.current });
    
    if (!user?.user_key) {
      console.log('[PointHistoryTab] No user_key, aborting');
      setLoading(false);
      setHasError(true);
      return;
    }

    // ⭐ Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('[PointHistoryTab] Already loading, skipping...');
      return;
    }

    isLoadingRef.current = true;
    setHasError(false);

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getPointHistory(user.user_key, pageNum, 20);

      if (result.success) {
        const newHistory = result.data.history || [];
        
        if (isRefresh || pageNum === 1) {
          setHistory(newHistory);
        } else {
          setHistory(prev => [...prev, ...newHistory]);
        }

        setHasMore(result.data.pagination?.has_next || false);
        setPage(pageNum);
        setHasError(false);
        
        console.log('[PointHistoryTab] History loaded successfully:', newHistory.length, 'items');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('[PointHistoryTab] Load error:', error);
      setHasError(true);
      
      // ⭐ Only show error toast once, don't retry automatically
      if (!hasError) {
        showToast({
          type: 'error',
          emoji: '❌',
          message: t('points.history_error', '히스토리를 불러오지 못했습니다'),
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingRef.current = false;
      console.log('[PointHistoryTab] loadHistory finished');
    }
  };

  // ✅ Handle Refresh
  const handleRefresh = () => {
    console.log('[PointHistoryTab] Manual refresh triggered');
    loadHistory(1, true);
  };

  // ✅ Handle Load More
  const handleLoadMore = () => {
    if (!loading && !isLoadingRef.current && hasMore && !hasError) {
      console.log('[PointHistoryTab] Loading more...');
      loadHistory(page + 1, false);
    }
  };

  // ✅ Render History Item
  const renderHistoryItem = ({ item }) => {
    const isPositive = item.is_positive;
    const sign = isPositive ? '+' : '-';
    const color = isPositive ? '#10B981' : '#EF4444';

    return (
      <View style={styles.historyItem}>
        {/* Icon */}
        <View style={styles.historyIcon}>
          <CustomText type="title" style={styles.historyEmoji}>
            {item.type_emoji}
          </CustomText>
        </View>

        {/* Info */}
        <View style={styles.historyInfo}>
          <CustomText type="normal" bold style={styles.historyType}>
            {item.type_label}
          </CustomText>
          <CustomText type="tiny" style={styles.historyDate}>
            {formatDate(item.created_at)}
          </CustomText>
        </View>

        {/* Amount */}
        <View style={styles.historyAmount}>
          <CustomText type="normal" bold style={[styles.historyAmountText, { color }]}>
            {sign}{Math.abs(item.order_amount).toLocaleString()} P
          </CustomText>
          <CustomText type="tiny" style={styles.historyBalance}>
            잔액: {item.after_amount.toLocaleString()} P
          </CustomText>
        </View>
      </View>
    );
  };

  // ✅ Format Date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  // ✅ Render Empty
  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <CustomText type="huge" style={styles.emptyEmoji}>
          📊
        </CustomText>
        <CustomText type="title" bold style={styles.emptyTitle}>
          {t('points.history_empty_title', '아직 히스토리가 없습니다')}
        </CustomText>
        <CustomText type="small" style={styles.emptyDescription}>
          {t('points.history_empty_description', '포인트를 충전하거나 사용하면\n여기에 표시됩니다')}
        </CustomText>
      </View>
    );
  };

  // ✅ Render Footer
  const renderFooter = () => {
    if (!loading || page === 1) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.DEEP_BLUE} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.DEEP_BLUE} />
          <CustomText type="small" style={styles.loadingText}>
            {t('points.loading_history', '히스토리를 불러오는 중...')}
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.point_key}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.DEEP_BLUE}
              colors={[COLORS.DEEP_BLUE]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: platformPadding(20),
    paddingBottom: platformPadding(40),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // History Item
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(12),
    padding: platformPadding(16),
    marginBottom: platformPadding(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(24),
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  historyEmoji: {
    fontSize: moderateScale(24),
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(4),
  },
  historyDate: {
    color: COLORS.TEXT_SECONDARY,
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  historyAmountText: {
    fontSize: moderateScale(18),
    marginBottom: scale(4),
  },
  historyBalance: {
    color: COLORS.TEXT_SECONDARY,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Empty State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: platformPadding(80),
  },
  emptyEmoji: {
    fontSize: moderateScale(80),
    marginBottom: platformPadding(20),
  },
  emptyTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: platformPadding(10),
  },
  emptyDescription: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Loading
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: platformPadding(16),
  },
  footerLoader: {
    paddingVertical: platformPadding(20),
    alignItems: 'center',
  },
});

export default PointHistoryTab;

