/**
 * 🎵 MusicScreen - AI Music Generation & Management (Refactored)
 * 
 * Features:
 * - FlashList for optimal performance
 * - Search functionality
 * - Filter chips (All, System, User)
 * - Infinite scroll
 * - Floating create button
 * - User-initiated status check (no polling)
 * 
 * Design: Clean, efficient, intuitive (History pattern)
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
  Share,
  Image,
  DeviceEventEmitter,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../components/CustomText';
import SafeScreen from '../components/SafeScreen';
import MemoryPlayerSheet from '../components/memory/MemoryPlayerSheet';
import ProcessingLoadingOverlay from '../components/persona/ProcessingLoadingOverlay'; // ⭐ NEW: Universal loading overlay
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import memoryService from '../services/api/memoryService';
import HapticService from '../utils/HapticService';
import { scale, verticalScale, moderateScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';
import { useNavigation } from '@react-navigation/native';
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg'; // ⭐ NEW: For gradient title
import Video from 'react-native-video';
import MemoryHelpSheet from '../components/memory/MemoryHelpSheet';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = verticalScale(120);
const TAB_BAR_HEIGHT = verticalScale(60);

/**
 * Filter types
 */
const FILTERS = {
  ALL: 'all',
  SYSTEM: 'system',
  USER: 'user',
  FAVORITE: 'favorite',
};

/**
 * MusicScreen Component
 */
const MemoryScreen = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, isAuthenticated } = useUser();
  const { showAlert, showToast, clearMemoryBadge } = useAnima();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Refs
  const flashListRef = useRef(null);
  const creatorSheetRef = useRef(null);
  const playerSheetRef = useRef(null);
  const searchInputRef = useRef(null);
  const helpSheetRef = useRef(null);
  // State
  const [giftList, setGiftList] = useState([]);
  const [filteredGiftList, setFilteredGiftList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // ⭐ NEW: Tab state (emotion, tarot, confession)
  const [activeTab, setActiveTab] = useState('emotion');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(FILTERS.ALL);

  // Creating state
  const [isCreating, setIsCreating] = useState(false);
  const [creatingMusicKey, setCreatingMusicKey] = useState(null);
  const [isProcessingMusic, setIsProcessingMusic] = useState(false); // ⭐ NEW: Loading overlay for music generation

  // Selected music for player
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load music list from API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadGiftList = async (reset = false) => {
    if (!isAuthenticated || !user?.user_key) return;
    
    console.log('loadGiftList', reset);
    if (reset) {
      setIsLoading(true);
      setPage(1);
      setHasMore(true);
    }

    try {
      const result = await memoryService.listMemory(user.user_key, {
        music_type: 'all',
        sort_by: 'created_desc',
      });

      if (result.success && result.data?.gift_list) {
        const newList = result.data.gift_list;
        
        if (reset) {
          setGiftList(newList);
        } else {
          setGiftList(prev => [...prev, ...newList]);
        }

        setHasMore(newList.length >= 20);
        
        // Check if any music is still creating
        const creatingMusic = newList.find(m => m.status === 'creating');
        if (creatingMusic) {
          setIsCreating(true);
          setCreatingMusicKey(creatingMusic.music_key);
        } else {
          setIsCreating(false);
          setCreatingMusicKey(null);
        }
      }
    } catch (error) {
      console.error('[MusicScreen] Load music error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load on mount and focus
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
 
    if (isAuthenticated && user?.user_key) {
      loadGiftList(true); // true = reset
    }
  }, [isAuthenticated, user?.user_key]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ NEW: Clear Memory badge when screen is focused
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useFocusEffect(
    useCallback(() => {
      console.log('[MemoryScreen] 🔔 Screen focused, clearing badge...');
      clearMemoryBadge();
    }, [clearMemoryBadge])
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔔 PUSH NOTIFICATION EVENT LISTENER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    console.log('[MemoryScreen] 🔔 Registering push event listener...');
    
    const subscription = DeviceEventEmitter.addListener('ANIMA_PUSH_RECEIVED', async (data) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[MemoryScreen] 🔔 Push received!');
      console.log('   order_type:', data.order_type);
      console.log('   persona_key:', data.persona_key);
      console.log('   persona_name:', data.persona_name);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const { order_type } = data;
      
      if (order_type === 'gift_image' || order_type === 'gift_music') {
        // ✅ 완전 초기화 + 스크롤 최상단
        console.log(`[MemoryScreen] 🎁 ${order_type}: Full reset + scroll to top`);
        
        // Reload gift list (reset = true)
        await loadGiftList(true);
        
        // Scroll to top
        if (flashListRef.current) {
          requestAnimationFrame(() => {
            flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
          });
        }
        
        HapticService.success();
        showToast({
          type: 'success',
          emoji: order_type === 'gift_image' ? '🖼️' : '🎵',
          message: order_type === 'gift_image'
            ? t('memory.gift_image.received')
            : t('memory.gift_music.received'),
        });
      }
    });
    
    return () => {
      console.log('[MemoryScreen] 🔔 Removing push event listener...');
      subscription.remove();
    };
  }, [loadGiftList, showToast, t]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ Filter gift list by tab (action_type) and search
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    let filtered = [...giftList];

    // ⭐ Filter by tab (action_type)
    if (activeTab === 'emotion') {
      filtered = filtered.filter(g => g.action_type === 'emotion' || !g.action_type);
    } else if (activeTab === 'tarot') {
      filtered = filtered.filter(g => g.action_type === 'tarot');
    } else if (activeTab === 'confession') {
      filtered = filtered.filter(g => g.action_type === 'confession');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.persona_name?.toLowerCase().includes(query) ||
        m.ai_message?.toLowerCase().includes(query) ||
        m.tag?.toLowerCase().includes(query)
      );
    }

    setFilteredGiftList(filtered);
  }, [giftList, activeTab, searchQuery]);

  useEffect(() => {
    if(!user){
      setGiftList([]);
      setFilteredGiftList([]);
      setPage(1);
      setHasMore(true);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle music press (play/manage or check status)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleMemoryPress = async (memory) => {
    HapticService.light();

    console.log('🎁 [MemoryScreen] Memory pressed:', memory);
    console.log('🎁 [MemoryScreen] playerSheetRef.current:', playerSheetRef.current);
    
    // Check if gift is still being created (based on gift_type)
    const isCreating = memory.gift_type === 'music'
      ? ['creating', 'pending', 'processing'].includes(memory.music_status)
      : ['creating', 'pending', 'processing'].includes(memory.image_status);
    
    if (isCreating) {
      console.log('⚠️ [MemoryScreen] Gift still creating, skipping...');
      console.log(`   Type: ${memory.gift_type}, Status: ${memory.gift_type === 'music' ? memory.music_status : memory.image_status}`);
      return;
    }

    // Otherwise, open player sheet
    console.log('🎁 [MemoryScreen] Opening player sheet...');
    setSelectedMemory(memory);
    setIsOpen(true);
    
    // Give state time to update, then open
    setTimeout(() => {
      console.log('🎁 [MemoryScreen] Calling present()...');
      playerSheetRef.current?.present();
    }, 100);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle memory update from player sheet (delete)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleMemoryUpdate = async (memory, action) => {
    if (action === 'delete') {
      try {
        const result = await memoryService.deleteMemory(memory.gift_id, user?.user_key);

        if (result.success) {
          // ⭐ Real-time state update
          setGiftList(prev => prev.filter(m => m.gift_id !== memory.gift_id));

          showToast({
            type: 'success',
            message: t('gift.delete_success') || '선물이 삭제되었습니다',
            emoji: '✅',
          });
        } else {
          showToast({
            type: 'error',
            message: t('common.error'),
            emoji: '❌',
          });
        }
      } catch (error) {
        console.error('[MemoryScreen] Delete gift error:', error);
        showToast({
          type: 'error',
          message: t('common.error'),
          emoji: '❌',
        });
      }
    }
  };


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle refresh
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleRefresh = () => {
    HapticService.light();
    setIsRefreshing(true);
    loadGiftList(true);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle load more (infinite scroll)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
      loadGiftList(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle filter select
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleFilterSelect = (filter) => {
    HapticService.light();
    setSelectedFilter(filter);
    setSearchQuery('');
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render music item
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderItem = ({ item }) => {
    // ⭐ Determine gift type and status
    const giftType = item.gift_type || 'image';
    const isImageGift = giftType === 'image';
    const isMusicGift = giftType === 'music';
    
    // ⭐ Check if gift is still being created (consistent with handleMemoryPress)
    const isCreating = isMusicGift
      ? ['creating', 'pending', 'processing'].includes(item.music_status)
      : ['creating', 'pending', 'processing'].includes(item.image_status);
    
    // ⭐ Use different images based on gift type
    const displayImageUrl = isMusicGift ? item.persona_url : item.image_url;
     
    return (
      <TouchableOpacity
        style={[
          styles.musicCard,
          { backgroundColor: currentTheme.cardBackground },
          isCreating && styles.musicCardCreating,
        ]}
        onPress={() => handleMemoryPress(item)}
        activeOpacity={0.8}
      >
        {/* Gift Image (or Persona Image for Music) */}
        <View style={styles.musicIconContainer}>
          <View style={[
            styles.musicIcon,
            { backgroundColor: isCreating ? 'rgba(251, 146, 60, 0.15)' : 'rgba(59, 130, 246, 0.15)' }
          ]}>
            {displayImageUrl ? (
              <Image
                source={{ uri: displayImageUrl }}
                style={{ width: '100%', height: '100%', borderRadius: moderateScale(12) }}
                resizeMode="cover"
              />
            ) : (
              <Icon
                name={isMusicGift ? 'musical-notes' : 'gift'}
                size={scale(32)}
                color="rgba(255, 255, 255, 0.5)"
              />
            )}
            
            {/* ⭐ NEW: Gift type overlay icon */}
            {!isCreating && (
              <View style={styles.giftTypeOverlay}>
                <Icon
                  name={isMusicGift ? 'musical-notes' : 'image'}
                  size={scale(16)}
                  color="#FFFFFF"
                />
              </View>
            )}
          </View>
        </View>

        {/* Gift Info */}
        <View style={styles.musicInfo}>
          <CustomText type="title" bold maxLines={1} style={[styles.memoryTitle, { numberOfLines: 1, color: currentTheme.textPrimary }]}>
            {item.ai_message?.length > 15 ? item.ai_message?.substring(0, 15) + '...' : item.ai_message || t('gift.untitled')}
          </CustomText>
          
          <View style={styles.musicMeta}>
            {/* Gift Type Badge */}
            <View style={[
              styles.typeBadge,
              { backgroundColor: isMusicGift ? 'rgba(147, 51, 234, 0.15)' : 'rgba(59, 130, 246, 0.15)' }
            ]}>
              <CustomText style={[
                styles.typeText,
                { color: isMusicGift ? '#9333EA' : '#3B82F6' }
              ]}>
                {isMusicGift ? '🎵 음악' : '🖼️ 이미지'}
              </CustomText>
            </View>

            {item.persona_name && (
              <CustomText style={[styles.systemBadge, { color: currentTheme.textSecondary }]}>
                {item.persona_name}
              </CustomText>
            )}

            {/* Creation Date */}
            <CustomText style={[styles.musicDate, { color: currentTheme.textSecondary }]}>
              {formatDate(item.created_at)}
            </CustomText>

            {/* Creating Status */}
            {isCreating && (
              <View style={styles.creatingBadge}>
                <CustomText style={styles.creatingText}>
                  ⏳ {t('gift.creating')} 
                </CustomText>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <Icon
          name="chevron-forward"
          size={scale(20)}
          color={currentTheme.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Format date
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ NEW: Handle tab change
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleTabChange = (tab) => {
    HapticService.light();
    setActiveTab(tab);
    
    // Reset search when switching tabs
    setSearchQuery('');
    
    // Scroll to top
    if (flashListRef.current) {
      flashListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle help press
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleHelpPress = () => {
    HapticService.light();
    setIsHelpOpen(true);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ NEW: Render tab button
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderTabButton = (tab, label, icon) => {
    const isActive = activeTab === tab;
    
    return (
      <TouchableOpacity
        key={tab}
        style={[
          styles.tabButton,
          isActive && styles.tabButtonActive,
        ]}
        onPress={() => handleTabChange(tab)}
        activeOpacity={0.7}
      >

        <CustomText
          style={[
            styles.tabButtonText,
            { color: isActive ? '#FFFFFF' : currentTheme.textSecondary }
          ]}
        >
          {label}
        </CustomText>
      </TouchableOpacity>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render empty state
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Icon name="gift-outline" size={scale(64)} color={currentTheme.textSecondary} style={{ display: 'none' }} />
        <View style={{ flex: 1, width: '100%', alignItems: 'center'}}>
          <View style={{ width: scale(160), height: scale(160), borderRadius: scale(320), overflow: 'hidden', alignSelf:'center' }}>
          <Video
            source={{ uri: 'https://babi-cdn.logbrix.ai/babi/real/babi/56216927-7bb8-42f1-8d72-d22d5107e37f_00001_.mp4' }}
            style={{ width: 
              '100%',
              height: '100%',

             }}
            resizeMode="cover"
            repeat={true}

          />
          </View>
        </View>
        <CustomText type="middle" bold style={[styles.emptyTitle, { color: currentTheme.textPrimary }]}>
          {searchQuery ? t('gift.title_no_results') : t('gift.title_empty')}
        </CustomText>
        <CustomText style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
          {searchQuery ? t('gift.title_try_different_search') : t('gift.title_empty_subtitle')}
        </CustomText>
      </View>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render header
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + verticalScale(0) : insets.top + verticalScale(15) }]}>
      {/* Title */}
      <View style={styles.headerTitleRow}>
        <CustomText type="big" bold style={[styles.headerTitle, { display: 'none', color: currentTheme.textPrimary }]}>
          {t('navigation.title.memory')}
        </CustomText>

        <Svg height={scale(30)} width={scale(70)}>
          <Defs>
            <LinearGradient id="animaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF7FA3" stopOpacity="1" />
              <Stop offset="100%" stopColor="#A78BFA" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <SvgText
            fill="url(#animaGradient)"
            fontSize={scale(24)}
            fontWeight="bold"
            x="0"
            y={scale(22)}
            letterSpacing="0.5"
          >
            {t('navigation.title.memory')}
          </SvgText>
        </Svg>

        {/* ✨ Soul Connection - Subtitle with delayed slide-in animation */}
        <View 
          style={{ 
          
          }}
        >
          <CustomText style={styles.soulConnection}>
            {t('navigation.title.memory_subtitle')}
          </CustomText>
        </View>
  
        {/* Search Icon */}
        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={handleHelpPress}
          activeOpacity={0.7}
        >
          <Icon name="help-circle-outline" size={scale(30)} color={currentTheme.mainColor} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: currentTheme.cardBackground }]}>
        <Icon name="search" size={scale(20)} color={currentTheme.textSecondary}  />
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: currentTheme.textPrimary }]}
          placeholder={t('gift.title_search_placeholder')}
          placeholderTextColor={currentTheme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <Icon name="close-circle" size={scale(20)} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

    </View>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <SafeScreen
      backgroundColor='black'
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: false, bottom: false }}
    >
      {/* Custom Header */}
      {renderHeader()}

      {/* ⭐ NEW: Tab Buttons */}
      <View style={styles.tabContainer}>
        {renderTabButton('emotion', '💕 공감', 'heart')}
        {renderTabButton('tarot', '🔮 타로', 'sparkles')}
        {renderTabButton('confession', '🕊️ 고해', 'rose')}
      </View>

      {/* memory List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.neonBlue} />
        </View>
      ) : (
        <View style={{ flex: 1, marginTop: verticalScale(5), backgroundColor: 'black', height: '100%' }}>
          <FlashList
            ref={flashListRef}
            data={filteredGiftList}
            renderItem={renderItem}
            estimatedItemSize={90}
            keyExtractor={(item) => item.gift_id}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing && isLoading}
                onRefresh={handleRefresh}
                tintColor={COLORS.neonBlue}
                colors={[COLORS.neonBlue]}
              />
            }
            contentContainerStyle={{
              paddingBottom: insets.bottom + TAB_BAR_HEIGHT + verticalScale(20),
            }}
          />
        </View>
      )}

      {isOpen && (
      <MemoryPlayerSheet
        isOpen={isOpen}
        ref={playerSheetRef}
        memory={selectedMemory}
        onMemoryUpdate={handleMemoryUpdate}
        onClose={() => { 
          setIsOpen(false);   
          setSelectedMemory(null); }}
      />
      )}

      {/* Processing Loading Overlay (Music Generation) */}
      <ProcessingLoadingOverlay
        visible={isProcessingMusic}
        message={t('music.creating_message')}
      />

      {/* Memory Help Sheet */}
      {isHelpOpen && (
      <MemoryHelpSheet
          ref={helpSheetRef}
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />
      )}
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(5),
    gap: verticalScale(12),
    backgroundColor:'#0F172A',

  },
  headerTitleRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },
  headerTitle: {
    // color set dynamically
  },
  searchIconButton: {
    
    padding: scale(8),
    marginLeft: 'auto',
    paddingRight: scale(7),
    paddingTop: verticalScale(5),

  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(15),
    paddingBottom: verticalScale(10),
    borderRadius: moderateScale(12),
    marginTop: verticalScale(-25),
    marginLeft: scale(-12),
    gap: scale(8),

  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    paddingVertical: 0,
    marginLeft: scale(-4),

  },

  // ⭐ NEW: Tab Buttons (✨ ANIMA: Glassmorphic with pink tint)
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(10),
    paddingBottom: verticalScale(12),
    gap: scale(12),
    paddingTop: verticalScale(15),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 107, 157, 0.08)', // ✨ ANIMA: Pink tint
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.15)', // ✨ ANIMA: Pink border
    gap: scale(8),
  },
  tabButtonActive: {
    backgroundColor: COLORS.neonBlue,
    borderColor: COLORS.neonBlue,
  },
  tabButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },

  // Filter Chips
  filterChips: {
    flexDirection: 'row',
    gap: scale(8),
  },
  filterChip: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
  },

  // Music Card
  musicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scale(0),
    marginBottom: verticalScale(12),
    padding: scale(14),
    borderRadius: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: scale(12),


  },
  musicCardCreating: {
    borderColor: 'rgba(251, 146, 60, 0.3)',
    borderWidth: 1.5,

  },
  musicIconContainer: {
    position: 'relative',
    
  },
  musicIcon: {
    width: scale(70),
    height: scale(70),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftTypeOverlay: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: scale(-4),
    right: scale(-4),
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  musicInfo: {
    flex: 1,
    gap: verticalScale(4),
  },
  memoryTitle: {
    // color set dynamically
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  musicMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
  },
  typeBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
    display: 'none',
  },
  typeText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  creatingBadge: {
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
  },
  creatingText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#FB923C',
  },
  systemBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
  },
  systemText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#FBBF24',
  },
  favoriteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
    gap: scale(4),
  },
  favoriteText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  musicDate: {
    fontSize: moderateScale(12),
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
    alignSelf: 'center',
    paddingHorizontal: scale(32),
    gap: verticalScale(12),
    marginTop: verticalScale(100),
    height: '100%',


  },
  emptyTitle: {
    textAlign: 'center',
    marginTop: verticalScale(20),
  },
  emptySubtitle: {
    textAlign: 'center',
    fontSize: moderateScale(14),
  },

  // Floating Button
  floatingButton: {
    position: 'absolute',
    right: scale(20),
    bottom: TAB_BAR_HEIGHT + verticalScale(0),
    zIndex: 100,
  },
  floatingButtonInner: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  soulConnection: {
    fontSize: scale(16),
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginTop: scale(2), // ✅ 위로 약간 올림 (정확한 정렬)
    letterSpacing: 0.3,

  },
});

export default MemoryScreen;
