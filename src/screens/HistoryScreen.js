/**
 * 📜 HistoryScreen - Message History (PersonaSwipeViewer Style)
 * 
 * Features:
 * - Vertical swipe message browsing (TikTok/YouTube Shorts style)
 * - FlatList with pagingEnabled (안정적)
 * - Auto play background music for current card
 * - All viewed state with reset button
 * - ⭐ 좌우 스와이프 기능은 Phase 3에서 추가 예정
 * 
 * Design: Vertical swipe with Native Message Display
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import CustomText from '../components/CustomText';
import CustomButton from '../components/CustomButton';
import SafeScreen from '../components/SafeScreen';
import MessageHistoryCard from '../components/message/MessageHistoryCard';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { listMessages } from '../services/api/messageService';
import HapticService from '../utils/HapticService';
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * HistoryScreen Component
 */
const HistoryScreen = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, isAuthenticated } = useUser();

  // ✅ FlatList ref
  const flatListRef = useRef(null);

  // ✅ Messages state
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [allViewed, setAllViewed] = useState(false);

  // ✅ Music playback state
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentMusicUrl, setCurrentMusicUrl] = useState(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Screen Focus (for video playback)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useFocusEffect(
    useCallback(() => {
      if (__DEV__) {
        console.log('[HistoryScreen] 🎯 Screen FOCUSED');
      }
      setIsScreenFocused(true);
      
      return () => {
        if (__DEV__) {
          console.log('[HistoryScreen] 🎯 Screen BLURRED');
        }
        setIsScreenFocused(false);
      };
    }, [])
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load messages on mount
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (__DEV__) {
      console.log('[HistoryScreen] isAuthenticated:', isAuthenticated);
      console.log('[HistoryScreen] user:', user);
    }
    
    if (isAuthenticated && user?.user_key) {
      loadMessages();
    }
  }, [isAuthenticated, user?.user_key]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Auto-play music for current card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (messages.length > 0 && currentIndex < messages.length) {
      const currentMessage = messages[currentIndex];
      const musicUrl = currentMessage?.bg_music_url;

      if (__DEV__) {
        console.log('[HistoryScreen] Current message:', currentIndex, 'Music URL:', musicUrl);
      }
      
      if (musicUrl && musicUrl !== 'none') {
        setCurrentMusicUrl(musicUrl);
        setIsMusicPlaying(true);
      } else {
        setCurrentMusicUrl(null);
        setIsMusicPlaying(false);
      }
    }
  }, [currentIndex, messages]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load messages from API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadMessages = async () => {
    setIsLoading(true);
    try {
      if (__DEV__) {
        console.log('[HistoryScreen] Loading messages for user:', user?.user_key);
      }
      
      const result = await listMessages(user.user_key);

      if (__DEV__) {
        console.log('[HistoryScreen] loadMessages result:', result);
      }

      if (result.success && result?.data) {
        if (__DEV__) {
          console.log('[HistoryScreen] Loaded messages:', result.data.length);
        }
        setMessages(result.data);
        setCurrentIndex(0);
        setAllViewed(false);
      } else {
        console.error('[HistoryScreen] Failed to load messages:', result.errorCode);
        setMessages([]);
      }
    } catch (error) {
      console.error('[HistoryScreen] Failed to load messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle vertical swipe (change message)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleMomentumScrollEnd = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / SCREEN_HEIGHT);

    if (index !== currentIndex) {
      if (__DEV__) {
        console.log('[HistoryScreen] ━━━━━━━━━━━━━━━━━━━━━');
        console.log('[HistoryScreen] Swiped to message:', index);
        console.log('[HistoryScreen] Current index before:', currentIndex);
      }

      HapticService.selection();
      setCurrentIndex(index);

      if (__DEV__) {
        console.log('[HistoryScreen] New index:', index);
        console.log('[HistoryScreen] ━━━━━━━━━━━━━━━━━━━━━');
      }
    }
  }, [currentIndex]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Toggle music playback
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleToggleMusic = () => {
    if (__DEV__) {
      console.log('[HistoryScreen] Toggle music:', !isMusicPlaying);
    }
    
    HapticService.light();
    setIsMusicPlaying(!isMusicPlaying);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render each message card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderMessage = useCallback(({ item, index }) => {
    const isActive = index === currentIndex && isScreenFocused;

    if (__DEV__) {
      console.log('[HistoryScreen] Rendering message at index:', index, 'IsActive:', isActive);
    }

    return (
      <View style={styles.messageItemContainer}>
        <MessageHistoryCard
          message={item}
          isActive={isActive}
        />
      </View>
    );
  }, [currentIndex, isScreenFocused]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Key extractor
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const keyExtractor = useCallback((item, index) => {
    return item.message_key || `message-${index}`;
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <SafeScreen
      backgroundColor={currentTheme.backgroundColor}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: true, bottom: false }}
      keyboardAware={false}
    >
      <View style={styles.container}>
        {/* ✅ Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CustomText type="big" bold style={styles.headerTitle}>
              {t('navigation.title.history')}
            </CustomText>
            <CustomText type="small" style={styles.headerSubtitle}>
              {t('navigation.subtitle.history')}
            </CustomText>
          </View>
          
          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              // TODO: Phase 5에서 검색 기능 추가
              HapticService.light();
            }}
            activeOpacity={0.7}
          >
            <Icon name="search-outline" size={scale(24)} color={currentTheme.mainColor || COLORS.MAIN_COLOR} />
          </TouchableOpacity>
        </View>

        {/* ✅ Loading */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={currentTheme.mainColor || COLORS.MAIN_COLOR}
            />
            <CustomText type="normal" style={styles.loadingText}>
              {t('history.loading')}
            </CustomText>
          </View>
        )}

        {/* ✅ Empty state */}
        {!isLoading && messages.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon
              name="chatbubbles-outline"
              size={scale(60)}
              color={currentTheme.textSecondary || COLORS.TEXT_SECONDARY}
            />
            <CustomText type="big" bold style={styles.emptyTitle}>
              {t('history.empty_title')}
            </CustomText>
            <CustomText type="normal" style={styles.emptySubtitle}>
              {t('history.empty_subtitle')}
            </CustomText>
          </View>
        )}

        {/* ✅ Message List (FlatList with Vertical Paging) */}
        {!isLoading && messages.length > 0 && (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={keyExtractor}
              vertical
              pagingEnabled
              showsVerticalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              onScrollToIndexFailed={(info) => {
                // Handle scrollToIndex failure
                if (__DEV__) {
                  console.warn('[HistoryScreen] ⚠️ scrollToIndex failed:', info);
                }
                
                // Fallback: scroll to offset
                flatListRef.current?.scrollToOffset({
                  offset: info.index * SCREEN_HEIGHT,
                  animated: true,
                });
              }}
              decelerationRate="fast"
              snapToAlignment="start"
              snapToInterval={SCREEN_HEIGHT}
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              maxToRenderPerBatch={1}
              initialNumToRender={1}
              windowSize={3}
              getItemLayout={(data, index) => ({
                length: SCREEN_HEIGHT,
                offset: SCREEN_HEIGHT * index,
                index,
              })}
            />

            {/* ✅ Music Player (Top Left) */}
            {currentMusicUrl && (
              <>
                {/* Hidden Video Component for Audio Playback */}
                <Video
                  source={{ uri: currentMusicUrl }}
                  audioOnly={true}
                  repeat={true}
                  paused={!isMusicPlaying}
                  playInBackground={false}
                  playWhenInactive={false}
                  style={styles.hiddenVideo}
                />

                {/* Floating Music Button */}
                <TouchableOpacity
                  style={styles.musicButton}
                  onPress={handleToggleMusic}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={isMusicPlaying ? 'musical-notes' : 'musical-notes-outline'}
                    size={scale(20)}
                    color={COLORS.TEXT_PRIMARY}
                  />
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_PRIMARY,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Header
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: COLORS.BG_PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(4),
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
  },
  searchButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(12),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Loading
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BG_PRIMARY,
  },
  loadingText: {
    marginTop: verticalScale(16),
    color: COLORS.TEXT_SECONDARY,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Empty State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
    backgroundColor: COLORS.BG_PRIMARY,
  },
  emptyTitle: {
    marginTop: verticalScale(20),
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: verticalScale(8),
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Message List
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  messageItemContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Music Player (Top Left)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  hiddenVideo: {
    width: 0,
    height: 0,
    position: 'absolute',
  },
  musicButton: {
    position: 'absolute',
    top: platformPadding(60), // Below header
    left: scale(16),
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 100,
  },
});

export default HistoryScreen;
