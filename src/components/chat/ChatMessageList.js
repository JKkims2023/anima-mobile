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

import React, { useRef, useEffect, memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { moderateScale, verticalScale, platformLineHeight, platformPadding } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';

// SAGE Avatar URL
const SAGE_AVATAR_URL = 'https://babi-cdn.logbrix.ai/babi/real/babi/f91b1fb7-d162-470d-9a43-2ee5835ee0bd_00001_.png';

/**
 * Message Item Component (Memoized)
 */
const MessageItem = memo(({ message }) => {
  const { currentTheme } = useTheme();
  const isUser = message.role === 'user';

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
  isLoading = false 
}) => {
  const flashListRef = useRef(null);
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // ✅ Auto-scroll to bottom on new message or typing update
  useEffect(() => {
    if (flashListRef.current) {
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [completedMessages.length, messageVersion, typingMessage]);

  // Render message item
  const renderItem = ({ item }) => <MessageItem message={item} />;

  // Key extractor
  const keyExtractor = (item, index) => item.id || `message-${index}`;

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
        {t('manager_ai.empty_messages') || 'Start a conversation with SAGE'}
      </Text>
    </View>
  );

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
          return <MessageItem message={item} />;
        }}
        keyExtractor={(item, index) => item.id || `message-${index}`}
        estimatedItemSize={verticalScale(80)} // ✅ Performance optimization
        extraData={messageVersion} // ✅ Only re-render when messageVersion changes
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
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
    paddingBottom: verticalScale(100), // ✅ Space for input bar
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
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
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

