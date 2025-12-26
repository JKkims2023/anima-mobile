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

import React, { useRef, useEffect, memo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated, TouchableOpacity, Linking, Platform, Alert, ToastAndroid, Clipboard, Modal } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { moderateScale, verticalScale, platformLineHeight, platformPadding } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import HapticService from '../../utils/HapticService';
import RNFS from 'react-native-fs';
import { COLORS } from '../../styles/commonstyles';

// SAGE Avatar URL
const SAGE_AVATAR_URL = 'https://babi-cdn.logbrix.ai/babi/real/babi/f91b1fb7-d162-470d-9a43-2ee5835ee0bd_00001_.png';

/**
 * Message Item Component (Memoized)
 */
const MessageItem = memo(({ message, onImagePress, onImageLongPress }) => {
  const { currentTheme } = useTheme();
  const isUser = message.role === 'user';
  
  // 🐛 DEBUG: Log message data
  if (message.image) {
    console.log('🖼️ [MessageItem] Rendering message with image:');
    console.log('   message.id:', message.id);
    console.log('   message.image:', message.image);
    console.log('   message.image.uri:', message.image.uri);
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
            source={{ uri: SAGE_AVATAR_URL }}
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
              ? currentTheme.chatStyles.userBubbleColor || '#3B82F6'
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

/**
 * Typing Message Component (ISOLATED for performance)
 * Only this component re-renders during typing, not the entire list
 */
const TypingMessage = memo(({ text }) => {
  const { currentTheme } = useTheme();
  const isUser = false; // Typing messages are always from AI

  return (
    <View style={[styles.messageRow]}>
      {/* AI Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: SAGE_AVATAR_URL }}
          style={styles.avatar}
        />
      </View>

      {/* Message Bubble */}
      <View
        style={[
          styles.messageBubble,
          styles.aiBubble,
          {
            backgroundColor: currentTheme.chatStyles.aiBubbleColor || '#1E293B',
          },
        ]}
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
          {text}
        </Text>
      </View>
    </View>
  );
});

TypingMessage.displayName = 'TypingMessage';

/**
 * Typing Indicator Component (Web peek page style with wave animation)
 */
const TypingIndicator = () => {
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
          source={{ uri: SAGE_AVATAR_URL }}
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
 * ChatMessageList Component (OPTIMIZED: Isolated typing message)
 */
const ChatMessageList = ({ 
  completedMessages = [], 
  typingMessage = null, 
  messageVersion = 0,
  isLoading = false,
  onLoadMore = null, // ⭐ NEW: Callback for loading more history
  loadingHistory = false, // ⭐ NEW: Loading more history indicator
  hasMoreHistory = false, // ⭐ NEW: Has more history to load
}) => {
  const flashListRef = useRef(null);
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  
  // 🆕 Image viewer state
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  
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

  // ✅ Auto-scroll to bottom on new message or typing update
  useEffect(() => {
    if (flashListRef.current) {
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [completedMessages.length, messageVersion, typingMessage]);

  // ⭐ NEW: Handle scroll to top (load more history)
  const handleScroll = (event) => {
    if (!onLoadMore || !hasMoreHistory || loadingHistory) return;
    
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    // Check if scrolled to top (with threshold)
    if (contentOffset.y <= 100) {
      console.log('📜 [ChatMessageList] Reached top, loading more history...');
      onLoadMore();
    }
  };

  // Render message item
  const renderItem = ({ item }) => (
    <MessageItem 
      message={item} 
      onImagePress={handleImagePress}
      onImageLongPress={handleImageLongPress}
    />
  );

  // Key extractor
  const keyExtractor = (item, index) => item.id || `message-${index}`;

  // Empty state
  const renderEmptyState = () => (
    <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
      <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
        {t('manager_ai.empty_messages') || 'Start a conversation with SAGE'}
      </Text>
    </View>
  );
  
  // ⭐ NEW: Loading header (when loading more history)
  const renderListHeader = () => {
    if (!loadingHistory || !hasMoreHistory) return null;
    
    return (
      <View style={styles.loadingHeader}>
        <ActivityIndicator size="small" color={currentTheme.primaryColor || '#3B82F6'} />
        <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
          {t('chat.loading_history') || 'Loading...'}
        </Text>
      </View>
    );
  };

  // ✅ Add typing indicator as a message if loading (but not typing)
  const messagesWithIndicator = isLoading && !typingMessage
    ? [...completedMessages, { id: 'typing-indicator', role: 'typing', text: 'typing', timestamp: Date.now() }]
    : completedMessages;

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={messagesWithIndicator}
        renderItem={({ item }) => {
          if (item.role === 'typing') {
            return <TypingIndicator key="typing-indicator" />;
          }
          return (
            <MessageItem
              message={item}
              onImagePress={handleImagePress}
              onImageLongPress={handleImageLongPress}
            />
          );
        }}
        keyExtractor={(item, index) => item.id || `message-${index}`}
        estimatedItemSize={verticalScale(80)} // ✅ Performance optimization
        extraData={messageVersion} // ✅ Only re-render when messageVersion changes
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={renderListHeader} // ⭐ NEW: Loading indicator at top
        onScroll={handleScroll} // ⭐ NEW: Infinite scroll
        scrollEventThrottle={400} // ⭐ NEW: Throttle scroll events
        // ✅ CRITICAL: Prevent keyboard dismiss on Android
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        // ✅ Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />
      
      {/* ✅ Typing Message (ISOLATED: Only this re-renders during typing) */}
      {typingMessage && (
        <View style={styles.typingMessageContainer}>
          <TypingMessage text={typingMessage} />
        </View>
      )}
      
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
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(0), // ✅ Space for input bar
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
    fontSize: moderateScale(16),
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
});

// ✅ Memoize to prevent unnecessary re-renders
export default memo(ChatMessageList, (prevProps, nextProps) => {
  return (
    prevProps.completedMessages.length === nextProps.completedMessages.length &&
    prevProps.messageVersion === nextProps.messageVersion &&
    prevProps.typingMessage === nextProps.typingMessage &&
    prevProps.isLoading === nextProps.isLoading
  );
});

