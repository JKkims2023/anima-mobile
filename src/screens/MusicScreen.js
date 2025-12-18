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
import MusicCreatorSheet from '../components/music/MusicCreatorSheet';
import MusicPlayerSheet from '../components/music/MusicPlayerSheet';
import ProcessingLoadingOverlay from '../components/persona/ProcessingLoadingOverlay'; // ⭐ NEW: Universal loading overlay
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import musicService from '../services/api/musicService';
import HapticService from '../utils/HapticService';
import { scale, verticalScale, moderateScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';
import { useNavigation } from '@react-navigation/native';


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
const MusicScreen = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, isAuthenticated } = useUser();
  const { showAlert, showToast } = useAnima();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Refs
  const flashListRef = useRef(null);
  const creatorSheetRef = useRef(null);
  const playerSheetRef = useRef(null);
  const searchInputRef = useRef(null);

  // State
  const [musicList, setMusicList] = useState([]);
  const [filteredMusicList, setFilteredMusicList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(FILTERS.ALL);

  // Creating state
  const [isCreating, setIsCreating] = useState(false);
  const [creatingMusicKey, setCreatingMusicKey] = useState(null);
  const [isProcessingMusic, setIsProcessingMusic] = useState(false); // ⭐ NEW: Loading overlay for music generation

  // Selected music for player
  const [selectedMusic, setSelectedMusic] = useState(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load music list from API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadMusicList = async (reset = false) => {
    if (!isAuthenticated || !user?.user_key) return;
    
    if (reset) {
      setIsLoading(true);
      setPage(1);
      setHasMore(true);
    }

    try {
      const result = await musicService.listMusic(user.user_key, {
        music_type: 'all',
        sort_by: 'created_desc',
      });

      if (result.success && result.data?.music_list) {
        const newList = result.data.music_list;
        
        if (reset) {
          setMusicList(newList);
        } else {
          setMusicList(prev => [...prev, ...newList]);
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
      loadMusicList(true); // true = reset
    }
  }, [isAuthenticated, user?.user_key]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Filter music list by search and filter
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    let filtered = [...musicList];

    // Filter by type
    if (selectedFilter === FILTERS.SYSTEM) {
      filtered = filtered.filter(m => m.is_default === 'Y');
    } else if (selectedFilter === FILTERS.USER) {
      filtered = filtered.filter(m => m.is_default !== 'Y');
    } else if (selectedFilter === FILTERS.FAVORITE) {
      filtered = filtered.filter(m => m.favorite_yn === 'Y');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.music_title?.toLowerCase().includes(query) ||
        m.tag?.toLowerCase().includes(query)
      );
    }

    setFilteredMusicList(filtered);
  }, [musicList, selectedFilter, searchQuery]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle music press (play/manage or check status)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleMusicPress = async (music) => {
    HapticService.light();

    console.log('music', music);
    // If music is still creating, check status
    if (music.status === 'creating' || music.status === 'pending' || music.status === 'processing') {
      await handleCheckMusicStatus(music);
      return;
    }

    // Otherwise, open player sheet
    setSelectedMusic(music);
    playerSheetRef.current?.present();
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Check music status (user-initiated)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleCheckMusicStatus = async (music) => {
    try {

      console.log(music);
      console.log('music_key', music.music_key);
      console.log('request_key', music.request_key);

      const result = await musicService.checkMusicStatus(music.music_key, music.request_key);

      if (result.success) {
        if (result.data.status === 'completed') {
          // ✅ Completed!
          showAlert({
            title: t('music.alert.completed_title'),
            message: t('music.alert.completed_message'),
            emoji: '🎉',
            buttons: [
              {
                text: t('common.confirm'),
                style: 'default',
                onPress: () => {
                  // Update list
                  setMusicList(prev => prev.map(m =>
                    m.music_key === music.music_key
                      ? { ...m, status: 'completed' }
                      : m
                  ));
                  
                  // Reset creating state
                  setIsCreating(false);
                  setCreatingMusicKey(null);
                  
                  // TODO: Show confetti
                },
              },
            ],
          });
        } else if (result.data.status === 'failed') {
          // ❌ Failed
          showToast({
            type: 'error',
            message: t('music.toast.create_failed'),
            emoji: '❌',
          });

          // Remove from list
          setMusicList(prev => prev.filter(m => m.music_key !== music.music_key));
          setIsCreating(false);
          setCreatingMusicKey(null);
        } else {
          // ⏳ Still creating
          const remainingTime = result.data.estimated_time_remaining || 0;
          showToast({
            type: 'info',
            message: t('music.toast.still_creating', { time: remainingTime }),
            emoji: '⏳',
          });
        }
      }
    } catch (error) {
      console.error('[MusicScreen] Check status error:', error);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle music update from player sheet (delete)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleMusicUpdate = async (music, action) => {
    if (action === 'delete') {
      try {
        const result = await musicService.deleteMusic(music.music_key, user?.user_key);

        if (result.success) {
          // ⭐ Real-time state update
          setMusicList(prev => prev.filter(m => m.music_key !== music.music_key));

          showToast({
            type: 'success',
            message: t('music.player.delete_success'),
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
        console.error('[MusicScreen] Delete music error:', error);
        showToast({
          type: 'error',
          message: t('common.error'),
          emoji: '❌',
        });
      }
    } else if (action === 'favorite') {
      try {
        const result = await musicService.toggleFavorite(music.music_key, user.user_key);

        if (result.success) {
          // ⭐ Real-time state update
          const newFavoriteStatus = result.data.favorite_yn;
          
          setMusicList(prev => prev.map(m =>
            m.music_key === music.music_key
              ? { ...m, favorite_yn: newFavoriteStatus }
              : m
          ));

          // Update selectedMusic for player sheet
          setSelectedMusic(prev => 
            prev?.music_key === music.music_key
              ? { ...prev, favorite_yn: newFavoriteStatus }
              : prev
          );

          showToast({
            type: 'success',
            message: newFavoriteStatus === 'Y' 
              ? t('music.toast.favorite_added')
              : t('music.toast.favorite_removed'),
            emoji: newFavoriteStatus === 'Y' ? '⭐' : '✨',
          });
        } else {
          showToast({
            type: 'error',
            message: t('common.error'),
            emoji: '❌',
          });
        }
      } catch (error) {
        console.error('[MusicScreen] Toggle favorite error:', error);
        showToast({
          type: 'error',
          message: t('common.error'),
          emoji: '❌',
        });
      }
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle floating button press
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleFloatingButtonPress = () => {
    HapticService.light();

    // If creating, show warning
    if (isCreating) {
      showToast({
        type: 'warning',
        message: t('music.creating_in_progress'),
        emoji: '⏳',
      });
      return;
    }

    // Check authentication
    if (!isAuthenticated) {
      showToast({
        type: 'warning',
        message: t('auth.login_required'),
        emoji: '🔒',
      });
      return;
    }

    creatorSheetRef.current?.present();
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle music creation submit
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleMusicCreationSubmit = async (formData) => {
    // ⭐ Show processing overlay
    setIsProcessingMusic(true);
    
    // Close creator sheet
    creatorSheetRef.current?.dismiss();
    
    try {
      
      const result = await musicService.createMusic({
        user_key: user.user_key,
        music_title: formData.music_title,
        music_type: formData.music_type,
        prompt: formData.prompt,
        lyrics: formData.lyrics,
      });

      if (result.success) {
        // ⭐ Optimistic Update: Add to list immediately
        const newMusic = {
          music_key: result.data.music_key,
          music_title: formData.music_title,
          music_type: formData.music_type,
          status: 'creating',
          estimated_time: result.data.estimated_time || 30,
          is_default: 'N',
          created_at: new Date().toISOString(),
          music_url: result.data.music_url,
          request_key: result.data.request_key,
        };

        setMusicList(prev => [newMusic, ...prev]);
        setIsCreating(true);
        setCreatingMusicKey(newMusic.music_key);

        // ⭐ Hide processing overlay
        setIsProcessingMusic(false);

        showToast({
          type: 'success',
          message: t('music.toast.create_started'),
          emoji: '🎵',
        });
      } else {
        // ⭐ Hide processing overlay on failure
        setIsProcessingMusic(false);
        
        console.log('response.error_code : ', result);
        
        switch(result.errorCode){
          case 'INSUFFICIENT_POINT':
            showAlert ({
              title: t('common.not_enough_point_title'),
              message: t('common.not_enough_point'),
              buttons: [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('common.confirm'),
                  style: 'primary',
                  onPress: () => {
                    navigation.navigate('Settings');
                  },
                },
              ],
            });
            break;
          default:
            showAlert ({
              title: t('common.error_title'),
              message: t('common.error'),
              buttons: [
                {
                  text: t('common.confirm'),
                  style: 'primary',
                  onPress: () => {
 
                  },
                },
              ],
            });
            break;  
        }

        return;

      }
    } catch (error) {
      console.error('[MusicScreen] Create music error:', error);
      
      // ⭐ Hide processing overlay on error
      setIsProcessingMusic(false);
      
      showToast({
        type: 'error',
        message: t('music.toast.create_failed'),
        emoji: '❌',
      });
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle refresh
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleRefresh = () => {
    HapticService.light();
    setIsRefreshing(true);
    loadMusicList(true);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle load more (infinite scroll)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
      loadMusicList(false);
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
    const isCreating = item.status === 'creating' || item.status === 'pending' || item.status === 'processing';
    const isFavorite = item.favorite_yn === 'Y';
    
    return (
      <TouchableOpacity
        style={[
          styles.musicCard,
          { backgroundColor: currentTheme.cardBackground },
          isCreating && styles.musicCardCreating,
        ]}
        onPress={() => handleMusicPress(item)}
        activeOpacity={0.8}
      >
        {/* Music Icon */}
        <View style={styles.musicIconContainer}>
          <View style={[
            styles.musicIcon,
            { backgroundColor: isCreating ? 'rgba(251, 146, 60, 0.15)' : 'rgba(59, 130, 246, 0.15)' }
          ]}>
            <Icon
              name={isCreating ? "hourglass-outline" : item.music_type === 'vocal' ? "mic-sharp" : "musical-notes-sharp"}
              size={scale(28)}
              color={isCreating ? '#FB923C' : currentTheme.mainColor}
            />
          </View>
          
          {/* Favorite Indicator Badge */}
          {isFavorite && (
            <View style={styles.favoriteIndicator}>
              <Icon name="star" size={scale(14)} color={COLORS.gold} />
            </View>
          )}
        </View>

        {/* Music Info */}
        <View style={styles.musicInfo}>
          <CustomText type="title" bold style={[styles.musicTitle, { color: currentTheme.textPrimary }]}>
            {item.music_title || t('music.untitled')}
          </CustomText>
          
          <View style={styles.musicMeta}>
            {/* Type Badge */}
            <View style={[styles.typeBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <CustomText style={[styles.typeText, { color: '#A855F7' }]}>
                {item.music_type === 'vocal' ? '🎤 Vocal' : '🎹 Instrumental'}
              </CustomText>
            </View>

            {/* Creation Date */}
            <CustomText style={[styles.musicDate, { color: currentTheme.textSecondary }]}>
              {formatDate(item.created_at)}
            </CustomText>

            {/* Creating Status */}
            {isCreating && (
              <View style={styles.creatingBadge}>
                <CustomText style={styles.creatingText}>
                  ⏳ {t('music.creating')} ({item.estimated_time}s)
                </CustomText>
              </View>
            )}

            {/* System Badge */}
            {item.is_default === 'Y' && (
              <View style={styles.systemBadge}>
                <CustomText style={styles.systemText}>
                  🌟 {t('music.system')}
                </CustomText>
              </View>
            )}

            {/* Favorite Badge */}
            {isFavorite && (
              <View style={styles.favoriteBadge}>
                <Icon name="star" size={scale(12)} color={COLORS.gold} />
                <CustomText style={[styles.favoriteText, { color: COLORS.gold }]}>
                  {t('music.favorite')}
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
  // Handle help press
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleHelpPress = () => {
    HapticService.light();

  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render empty state
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Icon name="musical-notes-outline" size={scale(64)} color={currentTheme.textSecondary} />
        <CustomText type="middle" bold style={[styles.emptyTitle, { color: currentTheme.textPrimary }]}>
          {searchQuery ? t('music.no_results') : t('music.empty_title')}
        </CustomText>
        <CustomText style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
          {searchQuery ? t('music.try_different_search') : t('music.empty_subtitle')}
        </CustomText>
      </View>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render header
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + verticalScale(15) }]}>
      {/* Title */}
      <View style={styles.headerTitleRow}>
        <CustomText type="big" bold style={[styles.headerTitle, { color: currentTheme.textPrimary }]}>
          {t('navigation.title.studio')}
        </CustomText>
        
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
        <Icon name="search" size={scale(20)} color={currentTheme.textSecondary} />
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: currentTheme.textPrimary }]}
          placeholder={t('music.search_placeholder')}
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

      {/* Filter Chips */}
      <View style={styles.filterChips}>
        {Object.entries(FILTERS).map(([key, value]) => {
          const isSelected = selectedFilter === value;
          const count = value === FILTERS.ALL 
            ? musicList.length
            : value === FILTERS.SYSTEM
            ? musicList.filter(m => m.is_default === 'Y').length
            : value === FILTERS.USER
            ? musicList.filter(m => m.is_default !== 'Y').length
            : musicList.filter(m => m.favorite_yn === 'Y').length;

          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.filterChip,
                { borderColor: currentTheme.borderColor },
                isSelected && { 
                  backgroundColor: currentTheme.mainColor,
                  borderColor: currentTheme.mainColor,
                }
              ]}
              onPress={() => handleFilterSelect(value)}
              activeOpacity={0.7}
            >
              <CustomText
                type="small"
                bold={isSelected}
                style={{ color: isSelected ? '#FFFFFF' : currentTheme.textPrimary }}
              >
                {t(`music.filter_${key.toLowerCase()}`)} ({count})
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Floating button animation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isCreating) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isCreating]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <SafeScreen
      backgroundColor={currentTheme.backgroundColor}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: false, bottom: false }}
    >
      {/* Custom Header */}
      {renderHeader()}

      {/* Music List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.neonBlue} />
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: currentTheme.backgroundColor, height: '100%' }}>
          <FlashList
            ref={flashListRef}
            data={filteredMusicList}
            renderItem={renderItem}
            estimatedItemSize={90}
            keyExtractor={(item) => item.music_key}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
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

      {/* Floating Create Button */}
      <Animated.View style={[styles.floatingButton, animatedButtonStyle]}>
        <TouchableOpacity
          style={[
            styles.floatingButtonInner,
            { backgroundColor: isCreating ? '#FB923C' : currentTheme.mainColor }
          ]}
          onPress={handleFloatingButtonPress}
          activeOpacity={0.8}
        >
          <Icon
            name={isCreating ? "hourglass" : "add"}
            size={scale(28)}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Music Creator Sheet */}
      <MusicCreatorSheet
        ref={creatorSheetRef}
        onSubmit={handleMusicCreationSubmit}
      />

      {/* Music Player Sheet */}
      <MusicPlayerSheet
        ref={playerSheetRef}
        music={selectedMusic}
        onMusicUpdate={handleMusicUpdate}
      />

      {/* Processing Loading Overlay (Music Generation) */}
      <ProcessingLoadingOverlay
        visible={isProcessingMusic}
        message={t('music.creating_message')}
      />
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(16),
    gap: verticalScale(12),
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    // color set dynamically
  },
  searchIconButton: {
    padding: scale(8),

  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    marginTop: verticalScale(-15),
    marginLeft: scale(-13),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    paddingVertical: 0,
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
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    padding: scale(14),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    width: scale(56),
    height: scale(56),
    borderRadius: moderateScale(12),
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
  musicTitle: {
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
});

export default MusicScreen;
