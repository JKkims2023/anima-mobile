/**
 * 📜 HistoryScreen - Message History with Tinder Card Swipe
 * 
 * Features:
 * - Tinder card style message browsing
 * - 4-direction swipe (left/right: next, up: favorite, down: unfavorite)
 * - Swipe back to previous card
 * - Auto play background music for current card
 * - Search messages
 * - Delete, Share, Copy actions
 * 
 * Design: Tinder Card Stack with Native Message Display
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import Swiper from 'react-native-deck-swiper';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import CustomText from '../components/CustomText';
import SafeScreen from '../components/SafeScreen';
import MessageHistoryCard from '../components/message/MessageHistoryCard';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { listMessages } from '../services/api/messageService';
import HapticService from '../utils/HapticService';
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

/**
 * HistoryScreen Component
 */
const HistoryScreen = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, isAuthenticated } = useUser();

  // ✅ Swiper ref
  const swiperRef = useRef(null);
  const musicPlayerRef = useRef(null);

  // ✅ Messages state
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allSwiped, setAllSwiped] = useState(false);

  // ✅ Music playback state
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentMusicUrl, setCurrentMusicUrl] = useState(null);

  // ✅ Load messages on mount
  useEffect(() => {
    if (isAuthenticated && user?.user_key) {
      loadMessages();
    }
  }, [isAuthenticated, user?.user_key]);

  // ✅ Auto-play music for current card
  useEffect(() => {
    if (messages.length > 0 && currentIndex < messages.length) {
      const currentMessage = messages[currentIndex];
      const musicUrl = currentMessage?.bg_music_url;
      
      if (musicUrl && musicUrl !== currentMusicUrl) {
        setCurrentMusicUrl(musicUrl);
        setIsMusicPlaying(true);
      } else if (!musicUrl) {
        setCurrentMusicUrl(null);
        setIsMusicPlaying(false);
      }
    }
  }, [currentIndex, messages]);

  // ✅ Load messages from API
  const loadMessages = async () => {
    setIsLoading(true);
    try {
      console.log('[HistoryScreen] Loading messages for user:', user?.user_key);
      const result = await listMessages(user.user_key);
      
      if (result.success && result.data?.messages) {
        console.log('[HistoryScreen] Loaded messages:', result.data.messages.length);
        setMessages(result.data.messages);
        setCurrentIndex(0);
        setAllSwiped(false);
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

  // ✅ Handle swipe (left/right)
  const handleSwiped = (cardIndex) => {
    console.log('[HistoryScreen] Swiped card:', cardIndex);
    HapticService.medium();
    
    // Check if all cards swiped
    if (cardIndex === messages.length - 1) {
      setAllSwiped(true);
    }
  };

  // ✅ Handle swipe left
  const handleSwipedLeft = (cardIndex) => {
    console.log('[HistoryScreen] Swiped LEFT:', cardIndex);
    handleSwiped(cardIndex);
  };

  // ✅ Handle swipe right
  const handleSwipedRight = (cardIndex) => {
    console.log('[HistoryScreen] Swiped RIGHT:', cardIndex);
    handleSwiped(cardIndex);
  };

  // ✅ Handle card tap
  const handleCardPress = (cardIndex) => {
    console.log('[HistoryScreen] Card tapped:', cardIndex);
    HapticService.light();
  };

  // ✅ Reset swiper
  const handleReset = () => {
    console.log('[HistoryScreen] Resetting swiper...');
    HapticService.success();
    setCurrentIndex(0);
    setAllSwiped(false);
    if (swiperRef.current) {
      swiperRef.current.jumpToCardIndex(0);
    }
  };

  // ✅ Handle swipe back
  const handleSwipeBack = () => {
    console.log('[HistoryScreen] Swipe back...');
    HapticService.medium();
    if (swiperRef.current) {
      swiperRef.current.swipeBack();
    }
  };

  // ✅ Render loading state
  if (isLoading) {
    return (
      <SafeScreen
        backgroundColor={currentTheme.backgroundColor}
        statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
        edges={{ top: true, bottom: false }}
        keyboardAware={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <CustomText type="big" bold style={styles.headerTitle}>
              {t('navigation.history')}
            </CustomText>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTheme.mainColor || COLORS.MAIN_COLOR} />
            <CustomText type="small" style={styles.loadingText}>
              메시지를 불러오는 중...
            </CustomText>
          </View>
        </View>
      </SafeScreen>
    );
  }

  // ✅ Render empty state
  if (!isLoading && messages.length === 0) {
    return (
      <SafeScreen
        backgroundColor={currentTheme.backgroundColor}
        statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
        edges={{ top: true, bottom: false }}
        keyboardAware={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <CustomText type="big" bold style={styles.headerTitle}>
              {t('navigation.history')}
            </CustomText>
          </View>
          <View style={styles.emptyContainer}>
            <Icon name="file-tray-outline" size={scale(80)} color={COLORS.TEXT_SECONDARY} />
            <CustomText type="normal" style={styles.emptyText}>
              아직 생성한 메시지가 없습니다
            </CustomText>
            <CustomText type="small" style={styles.emptySubtext}>
              홈 화면에서 첫 메시지를 만들어보세요! 💌
            </CustomText>
          </View>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen
      backgroundColor={currentTheme.backgroundColor}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: true, bottom: false }}
      keyboardAware={false}
    >
      <View style={styles.container}>
        {/* Header with Swipe Back Button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CustomText type="big" bold style={styles.headerTitle}>
              {t('navigation.history')}
            </CustomText>
            <CustomText type="small" style={styles.headerSubtitle}>
              {`${currentIndex + 1} / ${messages.length}`}
            </CustomText>
          </View>
          
          {/* Swipe Back Button */}
          {currentIndex > 0 && (
            <TouchableOpacity
              style={styles.swipeBackButton}
              onPress={handleSwipeBack}
              activeOpacity={0.7}
            >
              <Icon name="arrow-undo" size={scale(24)} color={currentTheme.mainColor || COLORS.MAIN_COLOR} />
              <CustomText type="small" style={styles.swipeBackText}>
                되돌리기
              </CustomText>
            </TouchableOpacity>
          )}
        </View>

        {/* Content - Tinder Card Stack */}
        <View style={styles.contentContainer}>
          {allSwiped ? (
            // All cards swiped - show completion message
            <View style={styles.completionContainer}>
              <Icon name="checkmark-circle" size={scale(80)} color={currentTheme.mainColor || COLORS.MAIN_COLOR} />
              <CustomText type="big" bold style={styles.completionText}>
                모두 확인하셨습니다! 🎉
              </CustomText>
              <CustomText type="normal" style={styles.completionSubtext}>
                {messages.length}개의 메시지를 모두 보셨습니다
              </CustomText>
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: currentTheme.mainColor || COLORS.MAIN_COLOR }]}
                onPress={handleReset}
                activeOpacity={0.8}
              >
                <Icon name="refresh" size={scale(20)} color="#FFFFFF" />
                <CustomText type="normal" bold style={styles.resetButtonText}>
                  처음부터 다시 보기
                </CustomText>
              </TouchableOpacity>
            </View>
          ) : (
            // Swiper
            <Swiper
              ref={swiperRef}
              cards={messages}
              renderCard={(card, index) => (
                <MessageHistoryCard
                  key={card.message_key || index}
                  message={card}
                  isActive={index === currentIndex}
                  onPress={() => handleCardPress(index)}
                />
              )}
              onSwiped={handleSwiped}
              onSwipedLeft={handleSwipedLeft}
              onSwipedRight={handleSwipedRight}
              onSwipedAll={() => setAllSwiped(true)}
              cardIndex={currentIndex}
              onTapCard={(cardIndex) => handleCardPress(cardIndex)}
              backgroundColor="transparent"
              stackSize={3}
              stackScale={10}
              stackSeparation={15}
              animateOverlayLabelsOpacity
              animateCardOpacity
              disableTopSwipe // Will enable in Phase 3
              disableBottomSwipe // Will enable in Phase 3
              verticalSwipe={false} // Will enable in Phase 3
              horizontalSwipe={true}
              containerStyle={styles.swiperContainer}
              cardStyle={styles.cardStyle}
            />
          )}
        </View>

        {/* Background Music Player (hidden) */}
        {currentMusicUrl && (
          <Video
            ref={musicPlayerRef}
            source={{ uri: currentMusicUrl }}
            audioOnly={true}
            repeat={true}
            paused={!isMusicPlaying}
            playInBackground={false}
            playWhenInactive={false}
            volume={1.0}
            onError={(error) => {
              console.error('[HistoryScreen] Music playback error:', error);
              setIsMusicPlaying(false);
            }}
            style={{ width: 0, height: 0 }}
          />
        )}
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: platformPadding(20),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Header
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(16),
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(4),
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
  },
  swipeBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(12),
  },
  swipeBackText: {
    color: COLORS.TEXT_PRIMARY,
    marginLeft: scale(4),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: verticalScale(16),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Empty State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: platformPadding(40),
  },
  emptyText: {
    color: COLORS.TEXT_PRIMARY,
    marginTop: verticalScale(20),
    textAlign: 'center',
  },
  emptySubtext: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: verticalScale(8),
    textAlign: 'center',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Swiper
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  swiperContainer: {
    flex: 1,
  },
  cardStyle: {
    top: 0,
    left: 0,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Completion State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: platformPadding(40),
  },
  completionText: {
    color: COLORS.TEXT_PRIMARY,
    marginTop: verticalScale(20),
    textAlign: 'center',
  },
  completionSubtext: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    marginTop: verticalScale(24),
  },
  resetButtonText: {
    color: '#FFFFFF',
    marginLeft: scale(8),
  },
});

export default HistoryScreen;

