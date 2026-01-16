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
  DeviceEventEmitter,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import MessageHistoryListItem from '../components/message/MessageHistoryListItem';
import MusicListItem from '../components/music/MusicListItem'; // ⭐ NEW: Unified music list item
import MessageDetailOverlay from '../components/message/MessageDetailOverlay';
import MusicCreatorSheet from '../components/music/MusicCreatorSheet'; // ⭐ NEW: Music creation
import MusicPlayerSheet from '../components/music/MusicPlayerSheet'; // ⭐ NEW: Music player
import ProcessingLoadingOverlay from '../components/persona/ProcessingLoadingOverlay'; // ⭐ NEW: Music generation loading
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import messageService from '../services/api/messageService';
import musicService from '../services/api/musicService'; // ⭐ NEW: Music service
import HapticService from '../utils/HapticService';
import { scale, verticalScale, moderateScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';
import HistoryHelpSheet from '../components/persona/HistoryHelpSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Filter types
 */
const MESSAGE_FILTERS = {
  ALL: 'all',
  FAVORITE: 'favorite',
  REPLIES: 'replies',
};

const MUSIC_FILTERS = {
  ALL: 'all',
  SYSTEM: 'system',
  USER: 'user',
  FAVORITE: 'favorite',
};

/**
 * HistoryScreen Component
 */
const HistoryScreen = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, isAuthenticated } = useUser();
  const { showAlert, showToast, setHasNewMessage, setCreatedMessageUrl, clearMusicBadge } = useAnima(); // ⭐ Badge clearing
  const insets = useSafeAreaInsets();
  const navigation = useNavigation(); // ⭐ NEW: For music creation error handling

  // ✅ Refs
  const flashListRef = useRef(null);
  const helpSheetRef = useRef(null);
  const creatorSheetRef = useRef(null); // ⭐ NEW: Music creator
  const playerSheetRef = useRef(null); // ⭐ NEW: Music player
  
  // ✅ Tab state
  const [activeTab, setActiveTab] = useState('message'); // 'message' | 'music'
  const [isHelpOpen, setIsHelpOpen] = useState(false);
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
  const [activeFilter, setActiveFilter] = useState(MESSAGE_FILTERS.ALL);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // ⭐ NEW: Music state
  const [musicList, setMusicList] = useState([]);
  const [filteredMusicList, setFilteredMusicList] = useState([]);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicFilter, setMusicFilter] = useState(MUSIC_FILTERS.ALL);
  const [musicPage, setMusicPage] = useState(1);
  const [hasMusicMore, setHasMusicMore] = useState(true);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [isMusicRefreshing, setIsMusicRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creatingMusicKey, setCreatingMusicKey] = useState(null);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [isProcessingMusic, setIsProcessingMusic] = useState(false);

  // ⭐ Message Detail Overlay state
  const [isMessageDetailVisible, setIsMessageDetailVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // ⭐ Clear badges on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('✅ [HistoryScreen] Screen focused - Clearing badges');
      setHasNewMessage(false);
      setCreatedMessageUrl('');
      clearMusicBadge(); // ⭐ NEW: Clear music badge too
    }, [setHasNewMessage, setCreatedMessageUrl, clearMusicBadge])
  );

  // ⭐ NEW: Close MessageDetailOverlay when navigating away (Tab bar)
  useFocusEffect(
    useCallback(() => {
      // Cleanup function runs when screen loses focus (blur)
      return () => {
        console.log('🌙 [HistoryScreen] Screen blurred - Closing MessageDetailOverlay');
        if (isMessageDetailVisible) {
          setIsMessageDetailVisible(false);
          setSelectedMessage(null);
        }
      };
    }, [isMessageDetailVisible])
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load messages on mount
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    console.log('📊 [HistoryScreen] Mount useEffect triggered, isAuthenticated:', isAuthenticated, 'user_key:', user?.user_key);
    if (isAuthenticated && user?.user_key) {
      console.log('📊 [HistoryScreen] Loading messages and music...');
      loadMessages(true); // true = reset
      loadMusicList(true); // ⭐ NEW: Also load music
    }
  }, [isAuthenticated, user?.user_key]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Apply filters when search or filter changes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    applyFilters();
  }, [messages, searchQuery, activeFilter]);

  // ⭐ NEW: Apply music filters
  useEffect(() => {
    console.log('🎵 [HistoryScreen] Music filter useEffect triggered');
    applyMusicFilters();
  }, [musicList, musicFilter, musicSearchQuery]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ NEW: Push Notification Event Listener (Music)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    console.log('[HistoryScreen] 🔔 Registering push event listener...');
    
    const subscription = DeviceEventEmitter.addListener('ANIMA_PUSH_RECEIVED', async (data) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[HistoryScreen] 🔔 Push received!');
      console.log('   order_type:', data.order_type);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const { order_type } = data;
      
      if (order_type === 'create_music') {
        console.log('[HistoryScreen] 🎵 create_music: Reloading music list');
        
        // Reload music list
        await loadMusicList(true);
        
        // Switch to music tab & scroll to top
        setActiveTab('music');
        if (flashListRef.current) {
          requestAnimationFrame(() => {
            flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
          });
        }
        
        HapticService.success();
        showToast({
          type: 'success',
          emoji: '🎵',
          message: t('music.created'),
        });
      }
    });
    
    return () => {
      console.log('[HistoryScreen] 🔔 Removing push event listener...');
      subscription.remove();
    };
  }, [showToast, t]);

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
  // ⭐ NEW: Load music list from API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadMusicList = async (reset = false) => {
    if (!user?.user_key) {
      console.log('❌ [HistoryScreen] loadMusicList: No user_key');
      return;
    }
    
    console.log('🎵 [HistoryScreen] loadMusicList called, reset:', reset);
    
    if (reset) {
      setIsMusicLoading(true);
      setMusicPage(1);
      setHasMusicMore(true);
    }

    try {
      console.log('🎵 [HistoryScreen] Calling musicService.listMusic for user:', user.user_key);
      const result = await musicService.listMusic(user.user_key, {
        music_type: 'all',
        sort_by: 'created_desc',
      });

      console.log('🎵 [HistoryScreen] Music API response:', result);

      if (result.success && result.data?.music_list) {
        const newList = result.data.music_list;
        console.log('🎵 [HistoryScreen] Music list loaded:', newList.length, 'items');
        
        if (reset) {
          setMusicList(newList);
        } else {
          setMusicList(prev => [...prev, ...newList]);
        }

        setHasMusicMore(newList.length >= 20);
        
        // Check if any music is still creating
        const creatingMusic = newList.find(m => m.status === 'creating' || m.status === 'pending' || m.status === 'processing');
        if (creatingMusic) {
          setIsCreating(true);
          setCreatingMusicKey(creatingMusic.music_key);
          console.log('🎵 [HistoryScreen] Creating music found:', creatingMusic.music_key);
        } else {
          setIsCreating(false);
          setCreatingMusicKey(null);
        }
      } else {
        console.log('❌ [HistoryScreen] Music API failed or no data:', result);
        if (reset) {
          setMusicList([]);
        }
      }
    } catch (error) {
      console.error('❌ [HistoryScreen] Load music error:', error);
      if (reset) {
        setMusicList([]);
      }
    } finally {
      setIsMusicLoading(false);
      setIsMusicRefreshing(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Apply filters (search + filter chips)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const applyFilters = () => {
    // Message filters
    let filtered = [...messages];

    if (activeFilter === MESSAGE_FILTERS.FAVORITE) {
      filtered = filtered.filter(msg => msg.favorite_yn === 'Y');
    } else if (activeFilter === MESSAGE_FILTERS.REPLIES) {
      filtered = filtered.filter(msg => msg.reply_count > 0);
    }

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

  // ⭐ NEW: Apply music filters
  const applyMusicFilters = () => {
    console.log('🎵 [HistoryScreen] applyMusicFilters called, musicList length:', musicList.length);
    let filtered = [...musicList];

    // Filter by type
    if (musicFilter === MUSIC_FILTERS.SYSTEM) {
      filtered = filtered.filter(m => m.is_default === 'Y');
      console.log('🎵 [HistoryScreen] Filter: SYSTEM, filtered length:', filtered.length);
    } else if (musicFilter === MUSIC_FILTERS.USER) {
      filtered = filtered.filter(m => m.is_default !== 'Y');
      console.log('🎵 [HistoryScreen] Filter: USER, filtered length:', filtered.length);
    } else if (musicFilter === MUSIC_FILTERS.FAVORITE) {
      filtered = filtered.filter(m => m.favorite_yn === 'Y');
      console.log('🎵 [HistoryScreen] Filter: FAVORITE, filtered length:', filtered.length);
    }

    // Filter by search query
    if (musicSearchQuery.trim()) {
      const query = musicSearchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.music_title?.toLowerCase().includes(query) ||
        m.tag?.toLowerCase().includes(query)
      );
      console.log('🎵 [HistoryScreen] Search query:', musicSearchQuery, ', filtered length:', filtered.length);
    }

    console.log('🎵 [HistoryScreen] Final filtered music list length:', filtered.length);
    setFilteredMusicList(filtered);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle filter chip press
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleFilterPress = (filter) => {
    HapticService.light();
    setActiveFilter(filter);
  };

  // ⭐ NEW: Handle music filter chip press
  const handleMusicFilterPress = (filter) => {
    HapticService.light();
    setMusicFilter(filter);
  };

  // ⭐ NEW: Handle tab change
  const handleTabChange = (tab) => {
    HapticService.light();
    setActiveTab(tab);
    
    // Reset search when switching tabs
    if (tab === 'message') {
      setMusicSearchQuery('');
    } else {
      setSearchQuery('');
    }
    
    // Scroll to top
    if (flashListRef.current) {
      flashListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
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
    // ⭐ NEW: Use Overlay instead of Stack Navigation
    setSelectedMessage(message);
    setIsMessageDetailVisible(true);
  };

  // ⭐ NEW: Handle music item press
  const handleMusicPress = async (music) => {
    HapticService.light();
    
    // If creating, check status
    if (music.status === 'creating' || music.status === 'pending' || music.status === 'processing') {
      await handleCheckMusicStatus(music);
      return;
    }
    
    // Open player
    setSelectedMusic(music);
    playerSheetRef.current?.present();
  };

  // ⭐ NEW: Check music creation status
  const handleCheckMusicStatus = async (music) => {
    if (!music?.music_key) return;

    try {
      setIsProcessingMusic(true);
      const result = await musicService.checkMusicStatus(music.music_key);
      
      if (result.success && result.data) {
        const { status, estimated_time } = result.data;
        
        if (status === 'completed') {
          HapticService.success();
          showToast({
            type: 'success',
            emoji: '🎵',
            message: t('music.created'),
          });
          await loadMusicList(true);
        } else {
          showToast({
            type: 'info',
            emoji: '⏳',
            message: t('music.still_creating', { time: estimated_time || 30 }),
          });
        }
      }
    } catch (error) {
      console.error('[HistoryScreen] Check music status error:', error);
      showAlert({
        title: t('common.error'),
        message: t('music.status_check_failed'),
        buttons: [{ text: t('common.ok') }],
      });
    } finally {
      setIsProcessingMusic(false);
    }
  };

  // ⭐ NEW: Handle music update from player (favorite/delete)
  const handleMusicUpdate = useCallback((updatedMusic, action) => {
    if (action === 'delete') {
      setMusicList(prev => prev.filter(m => m.music_key !== updatedMusic.music_key));
      playerSheetRef.current?.dismiss();
    } else if (action === 'favorite') {
      setMusicList(prev => prev.map(m =>
        m.music_key === updatedMusic.music_key
          ? { ...m, favorite_yn: updatedMusic.favorite_yn }
          : m
      ));
    }
  }, []);

  // ⭐ NEW: Handle floating button press (create music)
  const handleFloatingButtonPress = () => {
    if (isCreating) {
      HapticService.warning();
      showAlert({
        title: t('music.already_creating_title'),
        message: t('music.already_creating_message'),
        buttons: [{ text: t('common.ok') }],
      });
      return;
    }
    
    HapticService.light();
    creatorSheetRef.current?.present();
  };

  // ⭐ NEW: Handle music creation submit (from MusicCreatorSheet)
  const handleMusicCreationSubmit = async (formData) => {
    console.log('🎵 [HistoryScreen] handleMusicCreationSubmit called:', formData);
    
    // Show processing overlay
    setIsProcessingMusic(true);
    
    // Close creator sheet
    creatorSheetRef.current?.dismiss();
    
    try {
      console.log('🎵 [HistoryScreen] Calling musicService.createMusic...');
      const result = await musicService.createMusic({
        user_key: user.user_key,
        music_title: formData.music_title,
        music_type: formData.music_type,
        prompt: formData.prompt,
        lyrics: formData.lyrics,
      });

      console.log('🎵 [HistoryScreen] Music creation result:', result);

      if (result.success) {
        // Optimistic Update: Add to list immediately
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

        console.log('🎵 [HistoryScreen] Adding new music to list:', newMusic);
        setMusicList(prev => [newMusic, ...prev]);
        setIsCreating(true);
        setCreatingMusicKey(newMusic.music_key);

        // Hide processing overlay
        setIsProcessingMusic(false);

        showToast({
          type: 'success',
          message: t('music.toast.create_started'),
          emoji: '🎵',
        });

        // Switch to music tab
        setActiveTab('music');
        if (flashListRef.current) {
          requestAnimationFrame(() => {
            flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
          });
        }
      } else {
        // Hide processing overlay on failure
        setIsProcessingMusic(false);
        
        console.log('❌ [HistoryScreen] Music creation failed:', result);
        
        switch(result.errorCode){
          case 'INSUFFICIENT_POINT':
            showAlert({
              title: t('common.not_enough_point_title'),
              message: t('common.not_enough_point'),
              buttons: [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('common.settings'),
                  onPress: () => navigation.navigate('Settings'),
                },
              ],
            });
            break;
          default:
            showAlert({
              title: t('common.error'),
              message: result.error || t('music.creation_failed'),
              buttons: [{ text: t('common.ok') }],
            });
        }
      }
    } catch (error) {
      console.error('❌ [HistoryScreen] Music creation error:', error);
      setIsProcessingMusic(false);
      
      showAlert({
        title: t('common.error'),
        message: error.message || t('music.creation_failed'),
        buttons: [{ text: t('common.ok') }],
      });
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle refresh (Dynamic!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleRefresh = () => {
    HapticService.light();
    console.log('🔄 [HistoryScreen] Refresh triggered for tab:', activeTab);
    if (activeTab === 'message') {
      loadMessages(true);
    } else {
      setIsMusicRefreshing(true);
      loadMusicList(true);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle load more (infinite scroll, Dynamic!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleLoadMore = () => {
    console.log('📜 [HistoryScreen] Load more triggered for tab:', activeTab);
    if (activeTab === 'message') {
      if (hasMore && !isLoadingMore && !isLoading) {
        loadMessages(false);
      }
    } else {
      // Music doesn't have pagination yet, but we keep the structure
      if (hasMusicMore && !isMusicLoading) {
        // TODO: Implement music pagination if needed
        console.log('🎵 [HistoryScreen] Music pagination not implemented yet');
      }
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle help press
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleHelpPress = () => {
    HapticService.light();

  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render tab button (NEW!)
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
        <Icon 
          name={icon} 
          size={scale(20)} 
          color={isActive ? '#FFFFFF' : currentTheme.textSecondary} 
        />
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

  // ⭐ NEW: Render music filter chip
  const renderMusicFilterChip = (filter, label, icon) => {
    const isActive = musicFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterChip,
          isActive && styles.filterChipActive,
          { backgroundColor: isActive ? COLORS.neonBlue : currentTheme.cardBackground }
        ]}
        onPress={() => handleMusicFilterPress(filter)}
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
  // Render list item (Dynamic!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderMessageItem = ({ item }) => (
    <MessageHistoryListItem
      message={item}
      onPress={() => handleMessagePress(item)}
    />
  );

  const renderMusicItem = ({ item }) => (
    <MusicListItem
      music={item}
      onPress={() => handleMusicPress(item)}
    />
  );

  const renderItem = activeTab === 'message' ? renderMessageItem : renderMusicItem;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render empty state (Dynamic!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderEmpty = () => {
    if ((activeTab === 'message' && isLoading) || (activeTab === 'music' && isMusicLoading)) {
      return null;
    }

    if (activeTab === 'message') {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="chatbubbles-outline" size={scale(64)} color={currentTheme.textSecondary} />
          <CustomText style={[styles.emptyTitle, { color: currentTheme.textPrimary }]}>
            {searchQuery || activeFilter !== MESSAGE_FILTERS.ALL
              ? t('history.no_results')
              : t('history.no_messages')}
          </CustomText>
          <CustomText style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
            {searchQuery || activeFilter !== MESSAGE_FILTERS.ALL
              ? t('history.try_different_filter')
              : t('history.create_first_message')}
          </CustomText>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="musical-notes-outline" size={scale(64)} color={currentTheme.textSecondary} />
          <CustomText style={[styles.emptyTitle, { color: currentTheme.textPrimary }]}>
            {musicSearchQuery ? t('music.no_results') : t('music.empty_title')}
          </CustomText>
          <CustomText style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
            {musicSearchQuery ? t('music.try_different_search') : t('music.empty_subtitle')}
          </CustomText>
        </View>
      );
    }
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
      backgroundColor={'rgba(30, 30, 32, 1)'} // ✨ ANIMA: Brighter background (26→30) to match CustomBottomSheet
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
              : t('navigation.subtitle.history_message')}
          </CustomText>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => setIsHelpOpen(true)}
          activeOpacity={0.7}
        >
          <Icon 
            name={"help-circle-outline"} 
            size={scale(30)} 
            color={currentTheme.mainColor} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: currentTheme.cardBackground }]}>
        <Icon name="search" size={scale(20)} color={currentTheme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: currentTheme.textPrimary }]}
          placeholder={activeTab === 'message' ? t('history.search_placeholder') : t('music.search_placeholder')}
          placeholderTextColor={currentTheme.textSecondary}
          value={activeTab === 'message' ? searchQuery : musicSearchQuery}
          onChangeText={activeTab === 'message' ? setSearchQuery : setMusicSearchQuery}
          returnKeyType="search"
        />
        {((activeTab === 'message' && searchQuery.length > 0) || (activeTab === 'music' && musicSearchQuery.length > 0)) && (
          <TouchableOpacity 
            onPress={() => activeTab === 'message' ? setSearchQuery('') : setMusicSearchQuery('')} 
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={scale(20)} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ⭐ NEW: Tab Buttons */}
      <View style={styles.tabContainer}>
        {renderTabButton('message', t('navigation.title.history_message'), 'chatbubbles')}
        {renderTabButton('music', t('navigation.title.history_music'), 'musical-notes')}
      </View>

      {false && (
      <>
      {/* Filter Chips (Dynamic!) */}
      {activeTab === 'message' ? (
        <View style={styles.filterContainer}>
          {renderFilterChip(MESSAGE_FILTERS.ALL, t('history.filter_all'), 'apps-outline')}
          {renderFilterChip(MESSAGE_FILTERS.FAVORITE, t('history.filter_favorite'), 'star')}
          {renderFilterChip(MESSAGE_FILTERS.REPLIES, t('history.filter_replies'), 'chatbubble')}
        </View>
      ) : (
        <View style={styles.filterContainer}>
          {renderMusicFilterChip(MUSIC_FILTERS.ALL, t('music.filter_all'), 'apps-outline')}
          {renderMusicFilterChip(MUSIC_FILTERS.SYSTEM, t('music.filter_system'), 'shield-checkmark')}
          {renderMusicFilterChip(MUSIC_FILTERS.USER, t('music.filter_user'), 'person')}
          {renderMusicFilterChip(MUSIC_FILTERS.FAVORITE, t('music.filter_favorite'), 'star')}
        </View>
      )}
      </>
      )}

      {/* List (Dynamic!) */}
      {((activeTab === 'message' && isLoading) || (activeTab === 'music' && isMusicLoading)) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.neonBlue} />
          <CustomText style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
            {activeTab === 'message' ? t('history.loading') : t('music.loading')}
          </CustomText>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            ref={flashListRef}
            data={activeTab === 'message' ? filteredMessages : filteredMusicList}
            renderItem={renderItem}
            estimatedItemSize={94}
            keyExtractor={(item) => activeTab === 'message' ? item.message_key : item.music_key}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={activeTab === 'message' ? false : isMusicRefreshing}
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

      {/* ⭐ NEW: Floating Create Button (Music Tab Only) */}
      {activeTab === 'music' && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: COLORS.neonBlue }]}
          onPress={handleFloatingButtonPress}
          activeOpacity={0.8}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="add" size={scale(30)} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}

      {/* ⭐ Message Detail Overlay (z-index: 9999, covers tab bar) */}
      {isMessageDetailVisible && selectedMessage && (
        <MessageDetailOverlay
          visible={isMessageDetailVisible}
          message={selectedMessage}
          onClose={() => {
            setIsMessageDetailVisible(false);
            setSelectedMessage(null);
          }}
          onMessageUpdate={handleMessageUpdate}
        />
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Help Sheet */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <View style={styles.sheetContainer}>
        <HistoryHelpSheet
          ref={helpSheetRef}
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />
      </View>

      {/* ⭐ NEW: Music Creator Sheet */}
      <MusicCreatorSheet
        ref={creatorSheetRef}
        onSubmit={handleMusicCreationSubmit}
      />

      {/* ⭐ NEW: Music Player Sheet */}
      {selectedMusic && (
        <MusicPlayerSheet
          ref={playerSheetRef}
          music={selectedMusic}
          onMusicUpdate={handleMusicUpdate}
        />
      )}

      {/* ⭐ NEW: Processing Loading Overlay (Music Generation) */}
      {isProcessingMusic && (
        <ProcessingLoadingOverlay
          visible={isProcessingMusic}
          message={t('music.checking_status')}
        />
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
    paddingBottom: platformPadding(0),
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
    display: 'none',
  },
  searchButton: {
    marginLeft: platformPadding(12),
    padding: platformPadding(8),
    marginTop: Platform.OS === 'ios' ? verticalScale(-5) : verticalScale(-5),
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
    marginLeft: scale(5),
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

  // ⭐ NEW: Tab Buttons (✨ ANIMA: Glassmorphic with pink tint)
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(12),
    gap: scale(12),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 107, 157, 0.12)', // ✨ ANIMA: Brighter pink tint (0.08→0.12) for harmony
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.2)', // ✨ ANIMA: Brighter pink border (0.15→0.2)
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

  // ✨ ANIMA: List Container (Brighter background for harmony with bottom sheets)
  listContainer: {
    flex: 1,
    backgroundColor: 'rgba(42, 42, 44, 1)', // ✨ ANIMA: Significantly brighter (26→42) for harmony with CustomBottomSheet
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

  // ⭐ NEW: Floating Button
  floatingButton: {
    position: 'absolute',
    right: scale(20),
    bottom: scale(80),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Sheet Container
  sheetContainer: {
    flex: 0,
  },
});

export default HistoryScreen;
