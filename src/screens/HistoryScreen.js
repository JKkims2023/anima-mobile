/**
 * 📜 HistoryScreen - Message History (FlashList Style)
 * 
 * Features:
 * - FlashList for optimal performance
 * - Search functionality
 * - Filter chips (All, Favorite, With Replies)
 * - Infinite scroll
 * - Card-based list items
 * - Navigation to MessageDetailScreen
 * 
 * Design: Efficient, scannable, intuitive
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../components/CustomText';
import SafeScreen from '../components/SafeScreen';
import MessageHistoryListItem from '../components/message/MessageHistoryListItem';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import messageService from '../services/api/messageService';
import HapticService from '../utils/HapticService';
import { scale, verticalScale, moderateScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Filter types
 */
const FILTERS = {
  ALL: 'all',
  FAVORITE: 'favorite',
  REPLIES: 'replies',
};

/**
 * HistoryScreen Component
 */
const HistoryScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, isAuthenticated } = useUser();
  const { showAlert, showToast } = useAnima();
  const insets = useSafeAreaInsets();

  // ✅ FlashList ref
  const flashListRef = useRef(null);

  // ✅ Messages state
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // ✅ Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  // ✅ Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTERS.ALL);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load messages on mount
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (isAuthenticated && user?.user_key) {
      loadMessages(true); // true = reset
    }
  }, [isAuthenticated, user?.user_key]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Apply filters when search or filter changes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    applyFilters();
  }, [messages, searchQuery, activeFilter]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load messages from API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadMessages = async (reset = false) => {
    if (!user?.user_key) return;
    
    if (reset) {
      setIsLoading(true);
      setPage(1);
      setHasMore(true);
    } else {
      if (!hasMore || isLoadingMore) return;
      setIsLoadingMore(true);
    }

    try {
      const result = await messageService.listMessages(user.user_key, {
        page: reset ? 1 : page,
        limit: PAGE_SIZE,
      });

      if (result.success && result?.data) {
        const newMessages = result.data;
        
        if (reset) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...prev, ...newMessages]);
        }

        // Check if there are more
        if (newMessages.length < PAGE_SIZE) {
          setHasMore(false);
        }

        if (!reset) {
          setPage(prev => prev + 1);
        }
      } else {
        if (reset) {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('[HistoryScreen] Failed to load messages:', error);
      if (reset) {
        setMessages([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Apply filters (search + filter chips)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const applyFilters = () => {
    let filtered = [...messages];

    // 1. Apply filter chips
    if (activeFilter === FILTERS.FAVORITE) {
      filtered = filtered.filter(msg => msg.favorite_yn === 'Y');
    } else if (activeFilter === FILTERS.REPLIES) {
      filtered = filtered.filter(msg => msg.reply_count > 0);
    }

    // 2. Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(msg => 
        msg.message_title?.toLowerCase().includes(query) ||
        msg.message_content?.toLowerCase().includes(query) ||
        msg.persona_name?.toLowerCase().includes(query)
      );
    }

    setFilteredMessages(filtered);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle filter chip press
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleFilterPress = (filter) => {
    HapticService.light();
    setActiveFilter(filter);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle search toggle
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const toggleSearch = () => {
    HapticService.light();
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery(''); // Clear search when closing
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle message item press
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle message update (real-time sync from detail screen)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleMessageUpdate = useCallback((updatedMessage, action) => {
    setMessages((prevMessages) => {
      if (action === 'delete') {
        // Remove message from list
        return prevMessages.filter(msg => msg.message_key !== updatedMessage.message_key);
      }
      
      if (action === 'favorite') {
        // Update favorite status
        return prevMessages.map(msg => 
          msg.message_key === updatedMessage.message_key 
            ? { ...msg, favorite_yn: updatedMessage.favorite_yn }
            : msg
        );
      }
      
      return prevMessages;
    });
  }, []);

  const handleMessagePress = (message) => {
    HapticService.light();
    navigation.push('MessageDetail', { 
      message,
      onMessageUpdate: handleMessageUpdate, // ⭐ Pass callback
    });
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle refresh
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleRefresh = () => {
    HapticService.light();
    loadMessages(true);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle load more (infinite scroll)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && !isLoading) {
      loadMessages(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render filter chip
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderFilterChip = (filter, label, icon) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterChip,
          isActive && styles.filterChipActive,
          { backgroundColor: isActive ? COLORS.neonBlue : currentTheme.cardBackground }
        ]}
        onPress={() => handleFilterPress(filter)}
        activeOpacity={0.7}
      >
        <Icon 
          name={icon} 
          size={scale(16)} 
          color={isActive ? '#FFFFFF' : currentTheme.textSecondary} 
        />
        <CustomText
          style={[
            styles.filterChipText,
            { color: isActive ? '#FFFFFF' : currentTheme.textSecondary }
          ]}
        >
          {label}
        </CustomText>
      </TouchableOpacity>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render list item
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderItem = ({ item }) => (
    <MessageHistoryListItem
      message={item}
      onPress={() => handleMessagePress(item)}
    />
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render empty state
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Icon name="chatbubbles-outline" size={scale(64)} color={currentTheme.textSecondary} />
        <CustomText style={[styles.emptyTitle, { color: currentTheme.textPrimary }]}>
          {searchQuery || activeFilter !== FILTERS.ALL
            ? t('history.no_results')
            : t('history.no_messages')}
        </CustomText>
        <CustomText style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
          {searchQuery || activeFilter !== FILTERS.ALL
            ? t('history.try_different_filter')
            : t('history.create_first_message')}
        </CustomText>
      </View>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render footer (loading more indicator)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.neonBlue} />
      </View>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <SafeScreen
      backgroundColor={currentTheme.backgroundColor || COLORS.BACKGROUND}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: true, bottom: false }}
      keyboardAware={false}
    >
      {/* Header with Search Icon */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <CustomText type="big" bold style={[styles.headerTitle, { color: currentTheme.textPrimary }]}>
            {t('navigation.title.history')}
          </CustomText>
          <CustomText type="small" style={[styles.headerSubtitle, { color: currentTheme.textSecondary }]}>
            {filteredMessages.length > 0 
              ? `${filteredMessages.length}${t('history.messages_count')}` 
              : t('navigation.subtitle.history')}
          </CustomText>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={toggleSearch}
          activeOpacity={0.7}
        >
          <Icon 
            name={isSearchVisible ? "close" : "search"} 
            size={scale(24)} 
            color={currentTheme.mainColor} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {isSearchVisible && (
        <View style={[styles.searchContainer, { backgroundColor: currentTheme.cardBackground }]}>
          <Icon name="search" size={scale(20)} color={currentTheme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: currentTheme.textPrimary }]}
            placeholder={t('history.search_placeholder')}
            placeholderTextColor={currentTheme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Icon name="close-circle" size={scale(20)} color={currentTheme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {renderFilterChip(FILTERS.ALL, t('history.filter_all'), 'apps-outline')}
        {renderFilterChip(FILTERS.FAVORITE, t('history.filter_favorite'), 'star')}
        {renderFilterChip(FILTERS.REPLIES, t('history.filter_replies'), 'chatbubble')}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.neonBlue} />
          <CustomText style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
            {t('history.loading')}
          </CustomText>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: currentTheme.backgroundColor }}>
          <FlashList
            ref={flashListRef}
            data={filteredMessages}
            renderItem={renderItem}
            estimatedItemSize={94} // height of MessageHistoryListItem
            keyExtractor={(item) => item.message_key}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={handleRefresh}
                tintColor={COLORS.neonBlue}
                {...(Platform.OS === 'android' && {
                  colors: [COLORS.neonBlue],
                  progressBackgroundColor: currentTheme.cardBackground,
                })}
              />
            }
            contentContainerStyle={{
              paddingBottom: insets.bottom + verticalScale(20),
            }}
          />
        </View>
      )}
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(16),
    paddingHorizontal: platformPadding(20),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    marginBottom: scale(4),
  },
  headerSubtitle: {
    // color set dynamically
  },
  searchButton: {
    marginLeft: platformPadding(12),
    padding: platformPadding(8),
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scale(16),
    marginBottom: verticalScale(12),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    padding: 0,
  },
  clearButton: {
    padding: scale(4),
  },

  // Filter Chips
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(12),
    gap: scale(8),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    gap: scale(6),
  },
  filterChipActive: {
    // backgroundColor set dynamically
  },
  filterChipText: {
    fontSize: moderateScale(13),
    fontWeight: '500',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: verticalScale(12),
  },
  loadingText: {
    fontSize: moderateScale(14),
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(64),
    gap: verticalScale(12),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },

  // Footer Loader
  footerLoader: {
    paddingVertical: verticalScale(20),
    alignItems: 'center',
  },
});

export default HistoryScreen;
