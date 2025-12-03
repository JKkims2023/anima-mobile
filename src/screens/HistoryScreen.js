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
  const [allViewed, setAllViewed] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

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

      // Check if all viewed
      if (index >= messages.length - 1) {
        if (__DEV__) {
          console.log('[HistoryScreen] All messages viewed!');
        }
        setAllViewed(true);
      }

      if (__DEV__) {
        console.log('[HistoryScreen] New index:', index);
        console.log('[HistoryScreen] ━━━━━━━━━━━━━━━━━━━━━');
      }
    }
  }, [currentIndex, messages.length]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Reset to first message
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleReset = () => {
    if (__DEV__) {
      console.log('[HistoryScreen] Resetting to first message...');
    }
    
    HapticService.success();
    setCurrentIndex(0);
    setAllViewed(false);
    
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: 0,
        animated: true,
      });
    }
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
    <SafeScreen>
      <View style={styles.container}>
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

            {/* ✅ Pagination Indicator (Left Side) */}
            <View style={styles.paginationContainer} pointerEvents="none">
              {messages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor: index === currentIndex
                        ? (currentTheme.mainColor || COLORS.MAIN_COLOR)
                        : (currentTheme.textSecondary || COLORS.TEXT_SECONDARY),
                    },
                    index === currentIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>

            {/* ✅ All Viewed Overlay */}
            {allViewed && (
              <View style={styles.allViewedOverlay}>
                <View style={styles.allViewedCard}>
                  <Icon
                    name="checkmark-circle"
                    size={scale(60)}
                    color={currentTheme.mainColor || COLORS.MAIN_COLOR}
                  />
                  <CustomText type="big" bold style={styles.allViewedTitle}>
                    {t('history.all_swiped_title')}
                  </CustomText>
                  <CustomText type="normal" style={styles.allViewedSubtitle}>
                    {t('history.all_swiped_subtitle')}
                  </CustomText>
                  <CustomButton
                    text={t('history.reset_button')}
                    onPress={handleReset}
                    style={styles.resetButton}
                    leftIcon={<Icon name="refresh" size={scale(20)} color="#FFFFFF" />}
                  />
                </View>
              </View>
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
  // Loading
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Pagination Indicator
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  paginationContainer: {
    position: 'absolute',
    left: scale(10),
    top: '10%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(6),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  paginationDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginVertical: verticalScale(4),
    opacity: 0.5,
  },
  paginationDotActive: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    opacity: 1,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // All Viewed Overlay
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  allViewedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  allViewedCard: {
    backgroundColor: COLORS.BG_SECONDARY,
    borderRadius: scale(20),
    padding: scale(30),
    alignItems: 'center',
    marginHorizontal: scale(40),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  allViewedTitle: {
    marginTop: verticalScale(16),
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  allViewedSubtitle: {
    marginTop: verticalScale(8),
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: verticalScale(20),
    minWidth: scale(160),
  },
});

export default HistoryScreen;
