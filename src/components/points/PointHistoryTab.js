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
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useAnima } from '../../contexts/AnimaContext';
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { getPointHistory } from '../../services/api/pointService';
import HapticService from '../../utils/HapticService';

// ⭐ Filter Options
const FILTER_OPTIONS = [
  { value: 'all', label: 'points.filter.all', emoji: '📊' },
  { value: 'persona_create', label: 'points.filter.persona_create', emoji: '🎭' },
  { value: 'video_convert', label: 'points.filter.video_convert', emoji: '🎬' },
  { value: 'music_create', label: 'points.filter.music_create', emoji: '🎵' },
  { value: 'premium_join', label: 'points.filter.premium', emoji: '👑' },
  { value: 'point_gift', label: 'points.filter.gift_sent', emoji: '🎁' },
  { value: 'point_received', label: 'points.filter.gift_received', emoji: '💝' },
];

// ⭐ Sort Options
const SORT_OPTIONS = [
  { value: 'desc', label: 'points.sort.newest', emoji: '⬇️' },
  { value: 'asc', label: 'points.sort.oldest', emoji: '⬆️' },
];

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
  
  // ⭐ Filter & Sort State
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('desc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
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
  const loadHistory = async (pageNum = 1, isRefresh = false, filterType = null, sortOrder = null) => {
    const filter = filterType || selectedFilter;
    const sort = sortOrder || selectedSort;
    
    console.log('[PointHistoryTab] loadHistory called', { 
      pageNum, 
      isRefresh, 
      filter, 
      sort,
      isLoading: isLoadingRef.current 
    });
    
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
      const result = await getPointHistory(user.user_key, pageNum, 20, filter, sort);

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

  // ⭐ Handle Filter Change
  const handleFilterChange = (filter) => {
    console.log('[PointHistoryTab] Filter changed:', filter);
    HapticService.light();
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
    // Reset and reload
    setHistory([]);
    setPage(1);
    loadHistory(1, false, filter, selectedSort);
  };

  // ⭐ Handle Sort Change
  const handleSortChange = (sort) => {
    console.log('[PointHistoryTab] Sort changed:', sort);
    HapticService.light();
    setSelectedSort(sort);
    setShowSortDropdown(false);
    // Reset and reload
    setHistory([]);
    setPage(1);
    loadHistory(1, false, selectedFilter, sort);
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
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Filter & Sort Bar */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.filterBar}>
        {/* Filter Dropdown */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            HapticService.light();
            setShowFilterDropdown(!showFilterDropdown);
            setShowSortDropdown(false);
          }}
          activeOpacity={0.7}
        >
          <CustomText type="tiny" style={styles.filterButtonEmoji}>
            {FILTER_OPTIONS.find(f => f.value === selectedFilter)?.emoji || '📊'}
          </CustomText>
          <CustomText type="small" style={styles.filterButtonText}>
            {t(FILTER_OPTIONS.find(f => f.value === selectedFilter)?.label || 'points.filter.all')}
          </CustomText>
          <CustomText type="tiny" style={styles.filterButtonIcon}>
            {showFilterDropdown ? '▲' : '▼'}
          </CustomText>
        </TouchableOpacity>

        {/* Sort Dropdown */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            HapticService.light();
            setShowSortDropdown(!showSortDropdown);
            setShowFilterDropdown(false);
          }}
          activeOpacity={0.7}
        >
          <CustomText type="tiny" style={styles.filterButtonEmoji}>
            {SORT_OPTIONS.find(s => s.value === selectedSort)?.emoji || '⬇️'}
          </CustomText>
          <CustomText type="small" style={styles.filterButtonText}>
            {t(SORT_OPTIONS.find(s => s.value === selectedSort)?.label || 'points.sort.newest')}
          </CustomText>
          <CustomText type="tiny" style={styles.filterButtonIcon}>
            {showSortDropdown ? '▲' : '▼'}
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Filter Dropdown Menu */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {showFilterDropdown && (
        <View style={styles.dropdownMenu}>
          {FILTER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownItem,
                selectedFilter === option.value && styles.dropdownItemActive,
              ]}
              onPress={() => handleFilterChange(option.value)}
              activeOpacity={0.7}
            >
              <CustomText type="normal" style={styles.dropdownItemEmoji}>
                {option.emoji}
              </CustomText>
              <CustomText
                type="normal"
                style={[
                  styles.dropdownItemText,
                  selectedFilter === option.value && styles.dropdownItemTextActive,
                ]}
              >
                {t(option.label)}
              </CustomText>
              {selectedFilter === option.value && (
                <CustomText type="normal" style={styles.dropdownItemCheck}>
                  ✓
                </CustomText>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Sort Dropdown Menu */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {showSortDropdown && (
        <View style={styles.dropdownMenu}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownItem,
                selectedSort === option.value && styles.dropdownItemActive,
              ]}
              onPress={() => handleSortChange(option.value)}
              activeOpacity={0.7}
            >
              <CustomText type="normal" style={styles.dropdownItemEmoji}>
                {option.emoji}
              </CustomText>
              <CustomText
                type="normal"
                style={[
                  styles.dropdownItemText,
                  selectedSort === option.value && styles.dropdownItemTextActive,
                ]}
              >
                {t(option.label)}
              </CustomText>
              {selectedSort === option.value && (
                <CustomText type="normal" style={styles.dropdownItemCheck}>
                  ✓
                </CustomText>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* History List */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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
  // Filter & Sort Bar
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: platformPadding(20),
    paddingVertical: platformPadding(12),
    gap: scale(12),
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  filterButtonEmoji: {
    fontSize: moderateScale(18),
    marginRight: scale(6),
  },
  filterButtonText: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  filterButtonIcon: {
    color: COLORS.DEEP_BLUE,
    fontSize: moderateScale(12),
    marginLeft: scale(4),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Dropdown Menu
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  dropdownMenu: {
    marginHorizontal: platformPadding(20),
    marginBottom: platformPadding(12),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: platformPadding(14),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  dropdownItemEmoji: {
    fontSize: moderateScale(20),
    marginRight: scale(12),
  },
  dropdownItemText: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
  },
  dropdownItemTextActive: {
    color: COLORS.DEEP_BLUE,
    fontWeight: '600',
  },
  dropdownItemCheck: {
    color: COLORS.DEEP_BLUE,
    fontSize: moderateScale(18),
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

