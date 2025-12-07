/**
 * 📜 MessageDetailScreen - Full Screen Message View
 * 
 * Features:
 * - Full screen message display (MessageHistoryCard 로직 재사용)
 * - Persona background (image/video)
 * - Message animations (text, particles, music)
 * - Quick Action Chips (Comment, Share, Favorite, Delete)
 * - Navigation support
 * 
 * Design: Immersive, emotional, interactive
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import PersonaBackgroundView from '../components/message/PersonaBackgroundView';
import ParticleEffect from '../components/particle/ParticleEffect';
import MessageHistoryChips from '../components/message/MessageHistoryChips';
import FlipCard from '../components/message/FlipCard';
import ReplyListView from '../components/message/ReplyListView';
import CustomText from '../components/CustomText';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import messageService from '../services/api/messageService';
import HapticService from '../utils/HapticService';
import { scale, verticalScale } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * MessageDetailScreen Component
 */
const MessageDetailScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user } = useUser();
  const { showAlert, showToast } = useAnima();
  const insets = useSafeAreaInsets();

  // Get message from navigation params
  const { message: initialMessage } = route.params || {};

  // State
  const [message, setMessage] = useState(initialMessage);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false); // ⭐ Flip state for comment view

  // Refs
  const musicPlayerRef = useRef(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Hide tab bar on mount
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      navigation.setOptions({
        tabBarStyle: undefined,
      });
    };
  }, [navigation]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Android back button handler
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If flipped (showing reply view), go back to message view
      if (isFlipped) {
        HapticService.light();
        setIsFlipped(false);
        return true; // Prevent default behavior (closing screen)
      }
      
      // Otherwise, allow default behavior (closing screen)
      return false;
    });

    return () => backHandler.remove();
  }, [isFlipped]);

  // ✅ Extract message data
  const {
    message_title = '',
    message_content = '',
    persona_key,
    persona_name = 'Unknown',
    persona_image_url,
    persona_video_url,
    convert_yn = 'N',
    text_animation = 'fade_in',
    particle_effect = 'none',
    bg_music = 'none',
    bg_music_url = null,
  } = message || {};

  // ✅ Create persona object for PersonaBackgroundView
  const persona = {
    persona_key,
    persona_name,
    selected_dress_image_url: persona_image_url,
    selected_dress_video_url: persona_video_url,
    selected_dress_video_convert_yn: convert_yn || 'N',
  };

  // ✅ Animation values
  const titleOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const particleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(1.2);
  const contentScale = useSharedValue(1.2);
  const titleTranslateX = useSharedValue(-100);
  const contentTranslateX = useSharedValue(100);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Start animations on mount
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    // Reset all animation values
    titleOpacity.value = 0;
    contentOpacity.value = 0;
    particleOpacity.value = 0;
    titleScale.value = 1.2;
    contentScale.value = 1.2;
    titleTranslateX.value = -100;
    contentTranslateX.value = 100;

    // 1. Particle effects start (0.3s delay)
    particleOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );

    // 2. Text animations based on text_animation type
    switch (text_animation) {
      case 'fade_in':
        startFadeInAnimation();
        break;
      case 'typing':
        startFadeInAnimation();
        break;
      case 'scale_in':
        startScaleInAnimation();
        break;
      case 'slide_cross':
        startSlideCrossAnimation();
        break;
      default:
        startFadeInAnimation();
    }
  }, [text_animation]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Auto-play music on mount
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (bg_music_url && bg_music_url !== 'none') {
      setIsMusicPlaying(true);
    }

    return () => {
      // Stop music on unmount
      setIsMusicPlaying(false);
    };
  }, [bg_music_url]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Animation Functions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const startFadeInAnimation = () => {
    titleOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    contentOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) })
    );
  };

  const startScaleInAnimation = () => {
    titleScale.value = withDelay(
      500,
      withTiming(1.0, { duration: 800, easing: Easing.out(Easing.back(1.5)) })
    );
    titleOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    
    contentScale.value = withDelay(
      900,
      withTiming(1.0, { duration: 800, easing: Easing.out(Easing.back(1.5)) })
    );
    contentOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
  };

  const startSlideCrossAnimation = () => {
    titleTranslateX.value = withDelay(
      500,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    titleOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    
    contentTranslateX.value = withDelay(
      900,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    contentOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
  };

  // ✅ Animated styles
  const animatedTitleStyle = useAnimatedStyle(() => {
    switch (text_animation) {
      case 'scale_in':
        return {
          opacity: titleOpacity.value,
          transform: [{ scale: titleScale.value }],
        };
      case 'slide_cross':
        return {
          opacity: titleOpacity.value,
          transform: [{ translateX: titleTranslateX.value }],
        };
      default:
        return {
          opacity: titleOpacity.value,
        };
    }
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    switch (text_animation) {
      case 'scale_in':
        return {
          opacity: contentOpacity.value,
          transform: [{ scale: contentScale.value }],
        };
      case 'slide_cross':
        return {
          opacity: contentOpacity.value,
          transform: [{ translateX: contentTranslateX.value }],
        };
      default:
        return {
          opacity: contentOpacity.value,
        };
    }
  });

  const animatedParticleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle back button
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleBack = () => {
    HapticService.light();
    
    // If flipped (showing reply view), go back to message view
    if (isFlipped) {
      setIsFlipped(false);
      return;
    }
    
    // Otherwise, close the screen
    navigation.goBack();
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle favorite toggle
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleToggleFavorite = async () => {
    if (!message) return;

    const newFavoriteYn = message.favorite_yn === 'Y' ? 'N' : 'Y';

    try {
      const result = await messageService.toggleFavorite(message.message_key, newFavoriteYn);

      if (result.success) {
        // Update local state
        setMessage(prev => ({ ...prev, favorite_yn: newFavoriteYn }));

        // Toast notification
        showToast({
          type: 'success',
          message: newFavoriteYn === 'Y' 
            ? t('message.history.favorite_added')
            : t('message.history.favorite_removed'),
          emoji: newFavoriteYn === 'Y' ? '❤️' : '🤍',
        });
      }
    } catch (error) {
      console.error('[MessageDetailScreen] Favorite toggle error:', error);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle delete
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleDelete = () => {
    if (!message) return;

    showAlert({
      title: t('message.history.delete'),
      message: t('message.history.delete_confirm_message'),
      emoji: '🗑️',
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: t('message.history.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await messageService.deleteMessage(message.message_key, user?.user_key);

              if (result.success) {
                showToast({
                  type: 'success',
                  message: t('message.history.delete_success'),
                  emoji: '✅',
                });

                // Navigate back after deletion
                navigation.goBack();
              }
            } catch (error) {
              console.error('[MessageDetailScreen] Delete error:', error);
            }
          },
        },
      ],
    });
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle share
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleShare = async () => {
    if (!message?.share_url) return;

    HapticService.success();
    
    try {
      const { Share } = require('react-native');
      await Share.share({
        message: Platform.OS === 'ios'
          ? `${message.message_title}\n\n${message.share_url}`
          : message.share_url,
        url: Platform.OS === 'ios' ? message.share_url : undefined,
        title: message.message_title,
      });
    } catch (error) {
      console.error('[MessageDetailScreen] Share error:', error);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle music toggle
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleMusicToggle = () => {
    HapticService.light();
    setIsMusicPlaying(!isMusicPlaying);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle comment view (180° flip)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleCommentPress = () => {
    HapticService.light();
    setIsFlipped(!isFlipped);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!message) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={scale(64)} color={currentTheme.textSecondary} />
          <CustomText style={[styles.errorText, { color: currentTheme.textPrimary }]}>
            {t('common.error_occurred')}
          </CustomText>
        </View>
      </View>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Front View (Message)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderFront = () => (
    <>
      {/* Background: Persona Image/Video */}
      <View style={styles.backgroundContainer}>
        <PersonaBackgroundView
          persona={persona}
          isScreenFocused={!isFlipped}
          showOverlay={false}
        />
      </View>

      {/* Gradient Overlay (하단 50%만 어둡게) */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        locations={[0, 0.5, 1]}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />

      {/* Particle Effects */}
      {particle_effect && particle_effect !== 'none' && (
        <Animated.View style={[styles.particleContainer, animatedParticleStyle]} pointerEvents="none">
          <ParticleEffect
            type={particle_effect}
            isActive={!isFlipped}
          />
        </Animated.View>
      )}

      {/* Message Content */}
      <View style={[styles.contentContainer, { bottom: insets.bottom + verticalScale(120) }]}>
        {/* Title */}
        {message_title ? (
          <Animated.View style={animatedTitleStyle}>
            <CustomText type="big" bold style={styles.title}>
              {message_title}
            </CustomText>
          </Animated.View>
        ) : null}

        {/* Content */}
        {message_content ? (
          <Animated.View style={animatedContentStyle}>
            <CustomText type="middle" style={styles.content}>
              {message_content}
            </CustomText>
          </Animated.View>
        ) : null}
      </View>
    </>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Back View (Replies)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderBack = () => (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ReplyListView
        messageKey={message.message_key}
        userKey={user?.user_key}
        onClose={handleCommentPress}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* FlipCard: Front (Message) / Back (Replies) */}
      <FlipCard
        isFlipped={isFlipped}
        front={renderFront()}
        back={renderBack()}
      />

      {/* Header (Back Button + Music Toggle) - Always visible */}
      <View style={[styles.header, { paddingTop: insets.top + verticalScale(10) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={scale(28)} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Music Toggle Button */}
        {bg_music_url && bg_music_url !== 'none' && !isFlipped && (
          <TouchableOpacity
            style={styles.musicButton}
            onPress={handleMusicToggle}
            activeOpacity={0.7}
          >
            <Icon 
              name={isMusicPlaying ? "volume-high" : "volume-mute"} 
              size={scale(24)} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Action Chips (우측 중앙) - Only visible when not flipped */}
      {!isFlipped && (
        <MessageHistoryChips
          message={message}
          onCommentPress={handleCommentPress}
          onFavoriteToggle={handleToggleFavorite}
          onDelete={handleDelete}
        />
      )}

      {/* Background Music Player */}
      {bg_music_url && bg_music_url !== 'none' && (
        <Video
          ref={musicPlayerRef}
          source={{ uri: bg_music_url }}
          audioOnly
          repeat
          paused={!isMusicPlaying}
          volume={1.0}
          playInBackground={false}
          playWhenInactive={false}
          onError={(error) => {
            console.error('[MessageDetailScreen] Music playback error:', error);
            setIsMusicPlaying(false);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(12),
    zIndex: 10,
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    position: 'absolute',
    left: scale(20),
    right: scale(20),
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'left',
    marginBottom: verticalScale(12),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: scale(2) },
    textShadowRadius: scale(4),
  },
  content: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'left',
    lineHeight: verticalScale(24),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: scale(1) },
    textShadowRadius: scale(3),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: verticalScale(16),
  },
  errorText: {
    fontSize: scale(16),
  },
});

export default MessageDetailScreen;
