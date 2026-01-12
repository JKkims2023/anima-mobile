/**
 * ChatMessageList Component
 * 
 * Features:
 * - High-performance message list (FlashList)
 * - Auto-scroll to bottom on new message
 * - User/AI message bubbles
 * - Typing message (isolated component for performance)
 * - Loading state
 * 
 * Optimizations:
 * - FlashList for 60fps scrolling
 * - Memoized message items
 * - Estimated item size for performance
 * - Isolated typing message (prevents full list re-render)
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */

import React, { useRef, useEffect, memo, useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated, TouchableOpacity, Linking, Platform, Alert, ToastAndroid, Clipboard, Modal } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { moderateScale, verticalScale, platformLineHeight, platformPadding } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import HapticService from '../../utils/HapticService';
import RNFS from 'react-native-fs';
import { COLORS } from '../../styles/commonstyles';
import TypingMessageBubble from './TypingMessageBubble'; // ⚡ NEW: Optimized typing component
// SAGE Avatar URL
const SAGE_AVATAR_URL = 'https://babi-cdn.logbrix.ai/babi/real/babi/f91b1fb7-d162-470d-9a43-2ee5835ee0bd_00001_.png';

/**
 * Message Item Component (Memoized)
 */
const MessageItem = memo(({ message, onImagePress, onImageLongPress, onMusicPress, onYouTubePress, personaUrl }) => {
  const { currentTheme } = useTheme();
  const isUser = message.role === 'user';
  
  // 🎭 NEW: Button message
  if (message.role === 'button') {
    return (
      <View style={styles.buttonMessageContainer}>
        <TouchableOpacity
          style={styles.buttonMessage}
          onPress={message.onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonMessageText}>{message.text}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // 🐛 DEBUG: Log message data
  if (false) {
    console.log('🖼️ [MessageItem] Rendering message with image:');
    console.log('   message.id:', message.id);
    console.log('   message.image:', message.image);
    console.log('   message.image.uri:', message.image.uri);
  }
  
  // 🐛 DEBUG: Log YouTube data
  if (false) {
    console.log('🎬 [MessageItem] Rendering message with YouTube:');
    console.log('   message.id:', message.id);
    console.log('   message.youtube:', JSON.stringify(message.youtube, null, 2));
  } else if (message.role === 'assistant') {
//    console.log('⚠️ [MessageItem] AI message has NO YouTube data:', message.id);
  }

  // 🆕 Copy text to clipboard
  const handleCopyText = useCallback(() => {
    if (message.text) {
      Clipboard.setString(message.text);
      HapticService.success();
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('📋 복사되었습니다', ToastAndroid.SHORT);
      } else {
        Alert.alert('📋 복사되었습니다', message.text.substring(0, 50) + '...');
      }
    }
  }, [message.text]);

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowReverse]}>
      {/* AI Avatar (only for AI messages) */}
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: personaUrl }}
            style={styles.avatar}
          />
        </View>
      )}

      {/* Message Bubble */}
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
          {
            backgroundColor: isUser 
              ? '#FFFFFF40' //currentTheme.chatStyles.userBubbleColor || '#3B82F6'
              : currentTheme.chatStyles.aiBubbleColor || '#1E293B',
          },
        ]}
      >
        {/* Text Message - 🆕 Long press to copy */}
        {message.text && (
          <TouchableOpacity
            onLongPress={handleCopyText}
            activeOpacity={0.8}
            delayLongPress={500}
          >
            <Text
              style={[
                styles.messageText,
                {
                  color: currentTheme.textColor,
                  lineHeight: platformLineHeight(22),
                },
              ]}
            >
              {message.text}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* 🆕 User-sent Image - Tap=fullscreen, Long press=download */}
        {message.image && (
          <View style={styles.userImageContainer}>
            {message.image.uri === 'placeholder' || !message.image.uri ? (
              // 📦 Placeholder for history images (actual image not stored)
              <View style={[styles.userSentImage, styles.imagePlaceholder]}>
                <Icon name="image-outline" size={moderateScale(50)} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.placeholderText}>📷 이미지 전송됨</Text>
              </View>
            ) : (
              // 🖼️ Real image (current session)
              <TouchableOpacity
                onPress={() => {
                  console.log('🖼️ [Image Press] URI:', message.image.uri);
                  onImagePress?.(message.image.uri);
                }}
                onLongPress={() => {
                  console.log('🖼️ [Image Long Press] URI:', message.image.uri);
                  onImageLongPress?.(message.image.uri);
                }}
                delayLongPress={500}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: message.image.uri }}
                  style={styles.userSentImage}
                  resizeMode="cover"
                  onLoad={() => console.log('✅ [Image] Loaded successfully:', message.image.uri)}
                  onError={(e) => console.error('❌ [Image] Load failed:', e.nativeEvent.error, message.image.uri)}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* 🖼️ Images (from AI rich content) - Tap=fullscreen, Long press=download */}
        {message.images && message.images.length > 0 && message.images.map((img, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => onImagePress?.(img.url)}
            onLongPress={() => onImageLongPress?.(img.url)}
            delayLongPress={500}
            activeOpacity={0.8}
            style={styles.imageContainer}
          >
            <Image
              source={{ uri: img.url }}
              style={styles.chatImage}
              resizeMode="cover"
            />
            {img.caption && (
              <Text style={[styles.imageCaption, { color: currentTheme.textColor }]}>
                {img.caption}
              </Text>
            )}
          </TouchableOpacity>
        ))}
        
        {/* 🎥 Videos */}
        {message.videos && message.videos.length > 0 && message.videos.map((video, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => Linking.openURL(video.url)}
            style={styles.videoContainer}
          >
            <View>
              <Image
                source={{ uri: video.thumbnail }}
                style={styles.videoThumbnail}
              />
              <View style={styles.playButtonOverlay}>
                <Icon name="play-circle" size={moderateScale(50)} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
            <Text style={[styles.videoTitle, { color: currentTheme.textColor }]} numberOfLines={2}>
              🎥 {video.title}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* 🔗 Links */}
        {message.links && message.links.length > 0 && message.links.map((link, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => Linking.openURL(link.url)}
            style={styles.linkPreview}
          >
            <View style={styles.linkContent}>
              <Text style={[styles.linkTitle, { color: currentTheme.textColor }]} numberOfLines={1}>
                {link.title}
              </Text>
              <Text style={[styles.linkDomain, { color: currentTheme.textColor }]}>
                🔗 {link.domain}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        
        {/* 🎵 Music Info (NEW!) - Tap to play! */}
        {message.music && (
          <TouchableOpacity
            style={styles.musicContainer}
            onPress={() => onMusicPress?.(message.music)}
            activeOpacity={0.7}
          >
            {message.music.image && (
              <Image
                source={{ uri: message.music.image }}
                style={styles.musicAlbumArt}
                resizeMode="cover"
              />
            )}
            <View style={styles.musicInfo}>
              <Text style={[styles.musicTitle, { color: currentTheme.textColor }]} numberOfLines={1}>
                🎵 {message.music.title}
              </Text>
              <Text style={[styles.musicArtist, { color: currentTheme.textColor }]} numberOfLines={1}>
                {message.music.artist}
              </Text>
              {message.music.duration && (
                <Text style={styles.musicDuration}>
                  ⏱ {Math.floor(message.music.duration / 60)}:{String(Math.floor(message.music.duration % 60)).padStart(2, '0')}
                </Text>
              )}
            </View>
            <Icon name="play-circle" size={moderateScale(24)} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        )}
        
        {/* 🎬 YouTube Video (NEW!) - Tap to watch! */}
        {message.youtube && (
          <TouchableOpacity
            style={styles.youtubeContainer}
            onPress={() => onYouTubePress?.(message.youtube)}
            activeOpacity={0.7}
          >
            {/* Thumbnail with play overlay */}
            <View style={styles.youtubeThumbnailContainer}>
              <Image
                source={{ uri: message.youtube.thumbnail }}
                style={styles.youtubeThumbnail}
                resizeMode="cover"
              />
              <View style={styles.youtubePlayOverlay}>
                <Icon name="play-circle" size={moderateScale(48)} color="rgba(255, 0, 0, 0.9)" />
              </View>
            </View>
            
            {/* Video Info */}
            <View style={styles.youtubeInfo}>
              <Text style={[styles.youtubeTitle, { color: currentTheme.textColor }]} numberOfLines={2}>
                🎬 {message.youtube.title}
              </Text>
              <Text style={[styles.youtubeChannel, { color: currentTheme.textColor }]} numberOfLines={1}>
                {message.youtube.channel}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Timestamp (optional) */}
        {message.timestamp && (
          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // ⚡ OPTIMIZED: Only re-render if message content actually changed
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.image === nextProps.message.image &&
    prevProps.message.music === nextProps.message.music &&
    prevProps.message.youtube === nextProps.message.youtube &&
    prevProps.personaUrl === nextProps.personaUrl &&
    prevProps.onImagePress === nextProps.onImagePress &&
    prevProps.onImageLongPress === nextProps.onImageLongPress &&
    prevProps.onMusicPress === nextProps.onMusicPress &&
    prevProps.onYouTubePress === nextProps.onYouTubePress
  );
});

MessageItem.displayName = 'MessageItem';

/**
 * 🆕 Image Viewer Modal Component
 * Fullscreen image viewer with zoom and download
 */
const ImageViewerModal = memo(({ visible, imageUri, onClose, onDownload }) => {
  const { currentTheme } = useTheme();
  
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.imageViewerContainer}>
        {/* Header with close and download buttons */}
        <View style={styles.imageViewerHeader}>
          <TouchableOpacity
            style={styles.imageViewerButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon name="close" size={moderateScale(28)} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.imageViewerButton}
            onPress={() => {
              onDownload();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Icon name="download-outline" size={moderateScale(28)} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {/* Image */}
        <View style={styles.imageViewerContent}>
          <Image
            source={{ uri: imageUri }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Hint text */}
        <View style={styles.imageViewerFooter}>
          <Text style={styles.imageViewerHint}>
            💾 다운로드 버튼을 눌러 저장하세요
          </Text>
        </View>
      </View>
    </Modal>
  );
});
ImageViewerModal.displayName = 'ImageViewerModal';

// ⚡ REMOVED: Old TypingMessage component (replaced with TypingMessageBubble for better performance)
// The new TypingMessageBubble handles typing animation internally without causing parent re-renders

/**
 * Typing Indicator Component (Web peek page style with wave animation)
 */
const TypingIndicator = ({ personaUrl }) => {
  const { currentTheme } = useTheme();
  
  // ✅ Animated values for each dot (wave effect)
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ✅ Create wave animation sequence
    const createWaveAnimation = (animValue, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: -6, // Move up 6px
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0, // Move back down
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    };

    // ✅ Start animations with staggered delays (wave effect)
    const animations = Animated.parallel([
      createWaveAnimation(dot1Anim, 0),      // First dot: no delay
      createWaveAnimation(dot2Anim, 150),    // Second dot: 150ms delay
      createWaveAnimation(dot3Anim, 300),    // Third dot: 300ms delay
    ]);

    animations.start();

    // ✅ Cleanup on unmount
    return () => {
      animations.stop();
    };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={[styles.messageRow]}>
      {/* SAGE Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: personaUrl || SAGE_AVATAR_URL }}
          style={styles.avatar}
        />
      </View>

      {/* Typing Dots with Wave Animation */}
      <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
        <View style={styles.typingDotsContainer}>
          <Animated.View
            style={[
              styles.typingDot,
              {
                backgroundColor: currentTheme.primaryColor || '#3B82F6',
                transform: [{ translateY: dot1Anim }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              {
                backgroundColor: currentTheme.primaryColor || '#3B82F6',
                transform: [{ translateY: dot2Anim }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              {
                backgroundColor: currentTheme.primaryColor || '#3B82F6',
                transform: [{ translateY: dot3Anim }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

/**
 * ChatMessageList Component (⚡ SUPER OPTIMIZED: Animated typing message!)
 */
const ChatMessageList = ({ 
  completedMessages = [], 
  isTyping = false, // ⚡ NEW: Typing state (boolean, no frequent updates!)
  currentTypingText = '', // ⚡ NEW: Complete text to type out (passed once!)
  messageVersion = 0,
  isLoading = false,
  onLoadMore = null, // ⭐ NEW: Callback for loading more history
  loadingHistory = false, // ⭐ NEW: Loading more history indicator
  hasMoreHistory = false, // ⭐ NEW: Has more history to load
  personaUrl = null,
  onMusicPress = null, // 🎵 NEW: Callback for music playback
  onYouTubePress = null, // 🎬 NEW: Callback for YouTube video playback
}) => {
  const flashListRef = useRef(null);
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  
  // 🔥 PERFORMANCE DEBUG: Render counter
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  if (__DEV__) {
    console.log(`🔥 [ChatMessageList] Render #${renderCountRef.current} @ ${Date.now()}`);
    console.log(`   completedMessages: ${completedMessages?.length}`);
    console.log(`   isTyping: ${isTyping}`);
    console.log(`   currentTypingText length: ${currentTypingText?.length || 0}`);
    console.log(`   isLoading: ${isLoading}`);
    console.log(`   messageVersion: ${messageVersion}`);
    console.log(`   loadingHistory: ${loadingHistory}`);
    console.log(`   hasMoreHistory: ${hasMoreHistory}`);
  }
  
  // 🆕 Image viewer state
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  
  // 🔥 [STATE LOG] selectedImageUri
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] selectedImageUri changed: ${selectedImageUri ? 'Image selected' : 'None'}`);
    }
  }, [selectedImageUri]);
  
  // 🔥 [STATE LOG] isImageViewerVisible
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] isImageViewerVisible changed: ${isImageViewerVisible}`);
    }
  }, [isImageViewerVisible]);
  
  // ⚡ NEW: Track if user is manually scrolling (to prevent auto-scroll interruption)
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  
  // 🔥 [STATE LOG] isUserScrolling
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] isUserScrolling changed: ${isUserScrolling}`);
    }
  }, [isUserScrolling]);
  
  // ⚡ NEW: Track initial load to prevent "와다다다" scroll effect
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const initialLoadTimeoutRef = useRef(null);
  
  // 🔥 [STATE LOG] isInitialLoad
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] isInitialLoad changed: ${isInitialLoad}`);
    }
  }, [isInitialLoad]);
  
  // 🆕 Handle image press (fullscreen viewer)
  const handleImagePress = useCallback((imageUri) => {
    setSelectedImageUri(imageUri);
    setIsImageViewerVisible(true);
    HapticService.light();
  }, []);
  
  // 🆕 Handle image long press (download)
  const handleImageLongPress = useCallback(async (imageUri) => {
    HapticService.medium();
    
    try {
      // Determine file extension
      const extension = imageUri.includes('.png') ? 'png' : 'jpg';
      const timestamp = Date.now();
      const fileName = `ANIMA_${timestamp}.${extension}`;
      
      // Determine download path
      const downloadPath = Platform.OS === 'ios'
        ? `${RNFS.DocumentDirectoryPath}/${fileName}`
        : `${RNFS.DownloadDirectoryPath}/${fileName}`;
      
      // Check if it's a local file (file://) or remote (http/https)
      if (imageUri.startsWith('file://')) {
        // Local file: copy to gallery
        await RNFS.copyFile(imageUri.replace('file://', ''), downloadPath);
      } else {
        // Remote file: download
        await RNFS.downloadFile({
          fromUrl: imageUri,
          toFile: downloadPath,
        }).promise;
      }
      
      HapticService.success();
      
      if (Platform.OS === 'android') {
        ToastAndroid.show(`✅ 저장되었습니다\n${fileName}`, ToastAndroid.LONG);
      } else {
        Alert.alert('✅ 저장되었습니다', fileName);
      }
    } catch (error) {
      console.error('❌ [Image Download] Error:', error);
      HapticService.error();
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('❌ 저장 실패', ToastAndroid.SHORT);
      } else {
        Alert.alert('❌ 저장 실패', error.message);
      }
    }
  }, []);

  // ✅ Auto-scroll to bottom on new message or typing starts
  // ⚡ OPTIMIZED: Only depends on isTyping (boolean), not typingMessage (string that changes 30ms)
  // 🎨 ENHANCED: Force scroll during AI response (isLoading or isTyping)
  useEffect(() => {
    if (__DEV__) {
      console.log(`⚡ [EFFECT] Auto-scroll effect triggered`);
      console.log(`   completedMessages.length: ${completedMessages.length}`);
      console.log(`   messageVersion: ${messageVersion}`);
      console.log(`   isTyping: ${isTyping}`);
      console.log(`   isLoading: ${isLoading}`);
      console.log(`   isInitialLoad: ${isInitialLoad}`);
      console.log(`   isUserScrolling: ${isUserScrolling}`);
    }
    
    // 🎯 PRIORITY 1: Force scroll when AI is responding
    // This ensures smooth UX during Smart Bubble animations
    const isAIResponding = isLoading || isTyping;
    
    if (flashListRef.current && (isAIResponding || !isUserScrolling)) {
      // ⚡ Initial load: Scroll without animation (instant!)
      if (isInitialLoad && completedMessages.length > 0) {
        if (__DEV__) {
          console.log(`⚡ [EFFECT] Initial load scroll (no animation)`);
        }
        
        const scrollTimeout = setTimeout(() => {
          flashListRef.current?.scrollToEnd({ animated: false });
          // Mark initial load complete after a short delay
          if (initialLoadTimeoutRef.current) {
            clearTimeout(initialLoadTimeoutRef.current);
          }
          initialLoadTimeoutRef.current = setTimeout(() => {
            setIsInitialLoad(false);
          }, 300);
        }, 100);
        
        return () => clearTimeout(scrollTimeout);
      } else {
        if (__DEV__) {
          console.log(`⚡ [EFFECT] Subsequent scroll (animated)`);
        }
        
        // ⚡ Subsequent updates: Smooth animation
        const scrollTimeout = setTimeout(() => {
          flashListRef.current?.scrollToEnd({ animated: true });
        }, 50);
        
        return () => clearTimeout(scrollTimeout);
      }
    } else {
      if (__DEV__) {
        console.log(`⚡ [EFFECT] Auto-scroll skipped (user scrolling or not responding)`);
      }
    }
  }, [completedMessages.length, messageVersion, isTyping, isLoading, isInitialLoad]); // ✅ Added: isLoading
  
  // ⚡ Cleanup timeout on unmount
  useEffect(() => {
    if (__DEV__) {
      console.log(`⚡ [EFFECT] Cleanup effect mounted`);
    }
    
    return () => {
      if (__DEV__) {
        console.log(`⚡ [EFFECT] Cleanup effect: Clearing timeouts`);
      }
      
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // ⚡ NEW: Real-time scroll during typing (as bubble grows!)
  // ⚡ OPTIMIZED: Less throttling during typing for smoother experience (Issue 3 FIX!)
  const lastScrollTimeRef = useRef(0);
  const handleContentSizeChange = useCallback((width, height) => {
    if (__DEV__) {
      const now = Date.now();
      console.log(`🔧 [HANDLER] handleContentSizeChange @ ${now}`);
      console.log(`   width: ${width}, height: ${height}`);
      console.log(`   isTyping: ${isTyping}`);
      console.log(`   throttle elapsed: ${now - lastScrollTimeRef.current}ms`);
    }
    
    const now = Date.now();
    
    // ⚡ CHANGED: Reduced throttle from 50ms → 16ms (~60fps) for smoother typing scroll
    if (now - lastScrollTimeRef.current < 16) {
      if (__DEV__) {
        console.log(`🔧 [HANDLER] handleContentSizeChange: Throttled (< 16ms)`);
      }
      return;
    }
    
    lastScrollTimeRef.current = now;
    
    // ⭐ FIX: Always auto-scroll during typing (ignore isUserScrolling during typing!)
    // This prevents the typing bubble from being hidden behind the input bar
    if (isTyping && flashListRef.current) {
      if (__DEV__) {
        console.log(`🔧 [HANDLER] handleContentSizeChange: Auto-scrolling to end`);
      }
      flashListRef.current.scrollToEnd({ animated: false });
    }
  }, [isTyping]);

  // ⭐ NEW: Handle scroll (load more history + detect manual scrolling)
  const handleScroll = useCallback((event) => {
    const { contentOffset } = event.nativeEvent;
    
    if (__DEV__) {
      console.log(`🔧 [HANDLER] handleScroll @ ${Date.now()}`);
      console.log(`   contentOffset.y: ${contentOffset.y}`);
    }
    
    // ⚡ NEW: Mark user as manually scrolling
    setIsUserScrolling(true);
    
    // ⭐ CHANGED: Reset flag after 5 seconds (increased from 1 second for better UX!)
    // This prevents auto-scroll while user is reading old messages
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      if (__DEV__) {
        console.log(`🔧 [HANDLER] handleScroll: Resetting isUserScrolling to false`);
      }
      setIsUserScrolling(false);
    }, 5000); // ⭐ INCREASED: 1000 → 5000 (5 seconds of protection!)
    
    // ✅ Load more when scrolling to top (reaching old messages)
    if (onLoadMore && hasMoreHistory && !loadingHistory && contentOffset.y <= 100) {
      if (__DEV__) {
        console.log(`🔧 [HANDLER] handleScroll: Reached top, loading more history...`);
      }
      console.log('📜 [ChatMessageList] Reached top, loading more history...');
      onLoadMore();
    }
  }, [onLoadMore, hasMoreHistory, loadingHistory]);

  // ⚡ NEW: Get item type for better FlashList performance
  const getItemType = useCallback((item) => {
    // Different types = different estimated sizes = smoother scrolling!
    if (!item) {
      if (__DEV__) {
        console.log(`🔧 [CALLBACK] getItemType: unknown (no item)`);
      }
      return 'unknown';
    }
    
    const isUser = item.role === 'user';
    const hasMedia = item.images?.length > 0 || item.music || item.youtube;
    
    let type;
    if (isUser) {
      type = item.image ? 'user_with_image' : 'user_text';
    } else {
      type = hasMedia ? 'assistant_with_media' : 'assistant_text';
    }
    
    if (__DEV__) {
      console.log(`🔧 [CALLBACK] getItemType: ${type} (id: ${item.id?.substring(0, 8)}...)`);
    }
    
    return type;
  }, []);

  // Key extractor
  const keyExtractor = (item, index) => item.id || `message-${index}`;

  // Empty state
  const renderEmptyState = () => {
    if (__DEV__) {
      console.log(`🎨 [RENDER] renderEmptyState called`);
    }
    
    return (
      <View style={[styles.messageBubble, styles.aiBubble, { display: 'none', backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
        <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
          {t('manager_ai.empty_messages') || 'Start a conversation with SAGE'}
        </Text>
      </View>
    );
  };
  
  // ⭐ NEW: Loading header (when loading more history)
  const renderListHeader = () => {
    if (__DEV__) {
      console.log(`🎨 [RENDER] renderListHeader called`);
      console.log(`   loadingHistory: ${loadingHistory}`);
      console.log(`   hasMoreHistory: ${hasMoreHistory}`);
    }
    
    if (!loadingHistory || !hasMoreHistory) {
      if (__DEV__) {
        console.log(`🎨 [RENDER] renderListHeader: returning null`);
      }
      return null;
    }
    
    if (__DEV__) {
      console.log(`🎨 [RENDER] renderListHeader: showing loading indicator`);
    }
    
    return (
      <View style={styles.loadingHeader}>
        <ActivityIndicator size="small" color={currentTheme.primaryColor || '#3B82F6'} />
        <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
          {t('chat.loading_history') || 'Loading...'}
        </Text>
      </View>
    );
  };
  
  // ⚡ OPTIMIZED: Memoized typing footer (prevents re-render!)
  // Shows TypingIndicator (...) when loading, or TypingMessage when typing
  const renderTypingFooter = useMemo(() => {
    if (__DEV__) {
      console.log(`🎨 [MEMO] renderTypingFooter recalculated`);
      console.log(`   isTyping: ${isTyping}`);
      console.log(`   currentTypingText length: ${currentTypingText?.length || 0}`);
      console.log(`   isLoading: ${isLoading}`);
    }
    
    // 1️⃣ Show typing message (⚡ NEW: Self-contained typing animation!)
    if (isTyping && currentTypingText) {
      if (__DEV__) {
        console.log(`🎨 [MEMO] renderTypingFooter: Showing TypingMessageBubble`);
      }
      return (
        <View style={{ paddingHorizontal: moderateScale(12), paddingVertical: verticalScale(8) }}>
          <TypingMessageBubble 
            fullText={currentTypingText} 
            personaUrl={personaUrl} 
            typingSpeed={30}
          />
        </View>
      );
    }
    
    // 2️⃣ Show typing indicator (... animation) when AI is thinking
    if (isLoading) {
      if (__DEV__) {
        console.log(`🎨 [MEMO] renderTypingFooter: Showing TypingIndicator`);
      }
      return (
        <View style={{ paddingHorizontal: moderateScale(12), paddingVertical: verticalScale(8) }}>
          <TypingIndicator personaUrl={personaUrl} />
        </View>
      );
    }
    
    // 3️⃣ Nothing to show
    if (__DEV__) {
      console.log(`🎨 [MEMO] renderTypingFooter: Showing nothing`);
    }
    return null;
  }, [isTyping, currentTypingText, isLoading, personaUrl]);

  // ✅ OPTIMIZATION: Messages in chronological order (oldest → newest)
  // Typing indicator is rendered as ListFooterComponent (inside FlashList)
  // This prevents jumping when typing completes!
  const displayMessages = useMemo(() => {
    if (__DEV__) {
      console.log(`🎨 [MEMO] displayMessages recalculated`);
      console.log(`   completedMessages.length: ${completedMessages?.length}`);
    }
    return completedMessages; // ✅ No reverse! Keep chronological order
  }, [completedMessages]);

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={displayMessages}
        renderItem={({ item }) => (
          <MessageItem
            message={item}
            onImagePress={handleImagePress}
            onImageLongPress={handleImageLongPress}
            onMusicPress={onMusicPress}
            onYouTubePress={onYouTubePress}
            personaUrl={personaUrl}
          />
        )}
        keyExtractor={(item, index) => item.id || `message-${index}`}
        getItemType={getItemType} // ⚡ NEW: Different types = different sizes = smoother scroll!
        estimatedItemSize={verticalScale(120)} // ⚡ OPTIMIZED: More accurate average (80 → 120)
        initialScrollIndex={displayMessages.length > 0 ? Math.max(0, displayMessages.length - 1) : undefined} // ⚡ NEW: Start at bottom (no "와다다다"!)
        onLoad={() => {
          if (__DEV__) {
            console.log(`🔧 [FLASHLIST] onLoad callback triggered`);
            console.log(`   isInitialLoad: ${isInitialLoad}`);
            console.log(`   displayMessages.length: ${displayMessages.length}`);
          }
          
          // ⚡ Mark initial load complete when FlashList finishes first render
          if (isInitialLoad) {
            if (__DEV__) {
              console.log(`🔧 [FLASHLIST] onLoad: Setting isInitialLoad to false in 100ms`);
            }
            setTimeout(() => setIsInitialLoad(false), 100);
          }
        }}
        // ⚠️ REMOVED: overrideItemLayout (2026-01-11)
        // Reason: Fixed sizes cause "disappearing message" issue when actual size differs
        // Solution: Let FlashList automatically measure item sizes (more accurate!)
        extraData={messageVersion} // ✅ Re-render only on new messages (not animation set changes)
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={renderListHeader} // ⭐ Loading indicator at top
        ListFooterComponent={renderTypingFooter} // 🔥 Typing message at bottom (inside list!)
        onScroll={handleScroll} // ⭐ NEW: Infinite scroll + detect manual scrolling
        scrollEventThrottle={400} // ⭐ NEW: Throttle scroll events
        onContentSizeChange={handleContentSizeChange} // ⚡ NEW: Real-time scroll during typing!
        // ✅ CRITICAL: Prevent keyboard dismiss on Android
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        // ⚡ OPTIMIZED: Performance tuning for smooth scroll!
        drawDistance={verticalScale(500)} // ⚡ NEW: Render items 500px away (prevents "팍" pop-in!)
        removeClippedSubviews={false} // ⚡ CHANGED: Keep items in memory (smoother, no pop-in!)
        maxToRenderPerBatch={15} // ⚡ INCREASED: Render more items per batch (10 → 15)
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />
      
      {/* 🆕 Image Viewer Modal */}
      {isImageViewerVisible && selectedImageUri && (
        <ImageViewerModal
          visible={isImageViewerVisible}
          imageUri={selectedImageUri}
          onClose={() => {
            setIsImageViewerVisible(false);
            setSelectedImageUri(null);
          }}
          onDownload={() => handleImageLongPress(selectedImageUri)}
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
    paddingHorizontal: moderateScale(0),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20), // ✅ Extra space for input bar (prevents message cutoff)
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: verticalScale(10),
    gap: moderateScale(8),
  },
  messageRowReverse: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: moderateScale(16),
    paddingHorizontal: platformPadding(15),
    paddingVertical: platformPadding(10),
  },
  userBubble: {
    borderBottomRightRadius: moderateScale(4),
  },
  aiBubble: {
    borderBottomLeftRadius: moderateScale(4),
  },
  messageText: {
    fontSize: moderateScale(15),
    lineHeight: platformLineHeight(moderateScale(16)), // ✅ Platform-aware lineHeight
  },
  timestamp: {
    fontSize: moderateScale(11),
    lineHeight: platformLineHeight(moderateScale(11)), // ✅ Platform-aware lineHeight
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: verticalScale(4),
    alignSelf: 'flex-end',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
    gap: moderateScale(8),
  },
  loadingText: {
    fontSize: moderateScale(12),
    opacity: 0.7,
  },
  // 🖼️ Image styles
  // 🆕 User-sent image styles
  userImageContainer: {
    marginTop: verticalScale(8),
    width: moderateScale(200), // ⭐ FIX: Explicit width
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userSentImage: {
    width: moderateScale(200), // ⭐ FIX: Explicit width
    height: verticalScale(200),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // ⭐ DEBUG: Background color
  },
  // 📦 Image placeholder (for history)
  imagePlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: moderateScale(13),
    marginTop: verticalScale(8),
  },
  // 🖼️ AI-generated image styles
  imageContainer: {
    marginTop: verticalScale(8),
    width: moderateScale(200), // ⭐ FIX: Explicit width
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  chatImage: {
    width: moderateScale(200), // ⭐ FIX: Explicit width
    height: verticalScale(150),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // ⭐ DEBUG: Background color
  },
  imageCaption: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(12),
    opacity: 0.7,
  },
  // 🎥 Video styles
  videoContainer: {
    marginTop: verticalScale(8),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: verticalScale(150),
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: moderateScale(-25),
    marginTop: moderateScale(-25),
  },
  videoTitle: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  // 🔗 Link styles
  linkPreview: {
    marginTop: verticalScale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  linkContent: {
    padding: moderateScale(10),
  },
  linkTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: verticalScale(4),
  },
  linkDomain: {
    fontSize: moderateScale(11),
    opacity: 0.5,
  },
  // 🎵 Music styles (NEW!)
  musicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(8),
    padding: moderateScale(10),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: moderateScale(10),
  },
  musicAlbumArt: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  musicInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  musicTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: verticalScale(2),
  },
  musicArtist: {
    fontSize: moderateScale(12),
    opacity: 0.7,
    marginBottom: verticalScale(2),
  },
  musicDuration: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  // 🎬 YouTube Card Styles
  youtubeContainer: {
    marginTop: verticalScale(8),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  youtubeThumbnailContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  youtubeThumbnail: {
    width: '100%',
    height: '100%',
  },
  youtubePlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  youtubeInfo: {
    padding: moderateScale(12),
  },
  youtubeTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: verticalScale(4),
    lineHeight: moderateScale(20),
  },
  youtubeChannel: {
    fontSize: moderateScale(12),
    opacity: 0.7,
  },
  typingText: {
    fontSize: moderateScale(14),
    lineHeight: platformLineHeight(moderateScale(14)), // ✅ Platform-aware lineHeight
    fontStyle: 'italic',
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingVertical: platformPadding(4),
  },
  typingDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  emptyText: {
    fontSize: moderateScale(16),
    lineHeight: platformLineHeight(moderateScale(16)), // ✅ Platform-aware lineHeight
    opacity: 0.5,
    textAlign: 'center',
  },
  typingMessageContainer: {
    paddingHorizontal: moderateScale(15),
    paddingBottom: verticalScale(10),
  },
  // 🆕 Image Viewer Modal styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingTop: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(20),
    paddingBottom: verticalScale(10),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  imageViewerButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerFooter: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  imageViewerHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  // 🎭 NEW: Button message styles
  buttonMessageContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(12),
  },
  buttonMessage: {
    backgroundColor: COLORS.DEEP_BLUE,
    paddingHorizontal: moderateScale(24),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(24),
    shadowColor: COLORS.DEEP_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonMessageText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// ⚡ SUPER OPTIMIZED: Memoize to prevent unnecessary re-renders
// typingMessage removed from comparison → no re-renders during typing!
export default memo(ChatMessageList, (prevProps, nextProps) => {
  return (
    prevProps.completedMessages.length === nextProps.completedMessages.length &&
    prevProps.messageVersion === nextProps.messageVersion &&
    prevProps.isTyping === nextProps.isTyping && // ⚡ Only check boolean, not string!
    prevProps.typingText === nextProps.typingText && // ⚡ Only changes once (when typing starts)
    prevProps.isLoading === nextProps.isLoading
  );
});

