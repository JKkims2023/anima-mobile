/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💬 TypingMessageBubble Component (Optimized with Animated API)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * High-performance typing effect component that doesn't cause parent re-renders
 * 
 * Key Features:
 * - Self-contained typing animation (no parent state updates!)
 * - Smooth character-by-character typing
 * - Blinking cursor
 * - Zero impact on parent component performance
 * 
 * Performance Strategy:
 * - Uses internal state for typing progress (isolated from parent)
 * - Parent only passes final text once
 * - No setInterval in parent (no parent re-renders!)
 * - Animated API for cursor blink (no re-renders)
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-01
 */

import React, { useEffect, useState, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * TypingMessageBubble Component
 * 
 * @param {Object} props
 * @param {string} props.fullText - Complete text to type out
 * @param {string} props.personaUrl - Avatar URL for AI persona
 * @param {number} props.typingSpeed - Speed in ms per character (default: 30)
 * @param {Function} props.onComplete - Callback when typing completes
 */
const TypingMessageBubble = memo(({ 
  fullText, 
  personaUrl,
  typingSpeed = 30,
  onComplete 
}) => {
  const { currentTheme } = useTheme();
  
  // ⚡ CRITICAL: Internal state (isolated from parent!)
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  // Animated value for cursor blink
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  
  // Track current typing position
  const currentIndexRef = useRef(0);
  const typingIntervalRef = useRef(null);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Cursor Blink Animation (Animated API - No Re-renders!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  useEffect(() => {
    if (isComplete) return;
    
    // Blinking cursor animation
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    
    blinkAnimation.start();
    
    return () => {
      blinkAnimation.stop();
    };
  }, [isComplete]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Typing Effect (Internal - No Parent Impact!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  useEffect(() => {
    if (!fullText) return;
    
    // Reset state when fullText changes
    currentIndexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⌨️  [TypingBubble] Starting typing effect');
    console.log('   Text length:', fullText.length);
    console.log('   Speed:', typingSpeed, 'ms/char');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Clear any existing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    // Start typing animation
    typingIntervalRef.current = setInterval(() => {
      const currentIndex = currentIndexRef.current;
      
      if (currentIndex < fullText.length) {
        // ⚡ Update internal state ONLY (no parent impact!)
        setDisplayedText(fullText.substring(0, currentIndex + 1));
        currentIndexRef.current += 1;
      } else {
        // Typing complete!
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsComplete(true);
        
        console.log('✅ [TypingBubble] Typing complete!');
        
        // Notify parent (optional)
        if (onComplete) {
          onComplete();
        }
      }
    }, typingSpeed);
    
    // Cleanup
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [fullText, typingSpeed, onComplete]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  if (!fullText) return null;
  
  return (
    <View style={styles.messageRow}>
      {/* AI Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: personaUrl }}
          style={styles.avatar}
        />
      </View>

      {/* Typing Bubble */}
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: currentTheme.chatStyles.aiBubbleColor || '#1E293B',
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: currentTheme.chatStyles.textColor || '#FFFFFF' },
          ]}
        >
          {displayedText}
          {!isComplete && (
            <Animated.Text
              style={[
                styles.cursor,
                { opacity: cursorOpacity },
              ]}
            >
              ▊
            </Animated.Text>
          )}
        </Text>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // ⚡ CRITICAL: Only re-render if props actually change!
  const shouldNotRerender = (
    prevProps.fullText === nextProps.fullText &&
    prevProps.personaUrl === nextProps.personaUrl &&
    prevProps.typingSpeed === nextProps.typingSpeed
  );
  
  // 🐛 DEBUG: Log when re-rendering happens
  if (!shouldNotRerender) {
    console.log('⚠️  [TypingBubble] Props changed, re-rendering...');
    console.log('   fullText changed:', prevProps.fullText !== nextProps.fullText);
    console.log('   personaUrl changed:', prevProps.personaUrl !== nextProps.personaUrl);
    console.log('   typingSpeed changed:', prevProps.typingSpeed !== nextProps.typingSpeed);
  }
  
  return shouldNotRerender;
});

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginBottom: verticalScale(12),
    paddingHorizontal: platformPadding(0),
    alignItems: 'flex-end',
  },
  avatarContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    marginRight: moderateScale(8),
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: platformPadding(14),
    paddingVertical: platformPadding(10),
    borderRadius: moderateScale(16),
    borderBottomLeftRadius: moderateScale(4),
  },
  messageText: {
    fontSize: moderateScale(15),
    lineHeight: moderateScale(22),
  },
  cursor: {
    fontSize: moderateScale(15),
    fontWeight: 'bold',
  },
});

export default TypingMessageBubble;

