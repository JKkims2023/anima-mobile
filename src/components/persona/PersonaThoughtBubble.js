/**
 * 💭 PersonaThoughtBubble - Thought Bubble Component
 * 
 * Features:
 * - Cloud-shaped thought bubble
 * - Sequential message display with timer
 * - Fade in/out animation
 * - Typing effect
 * - Only active when currentIndex matches
 * 
 * Messages:
 * 1. Non-logged in user (user === null)
 *    - SAGE & Nexus: Suspicious messages
 * 2. Logged in + conversation_count === 0
 *    - All personas: Nervous/excited messages
 * 3. Logged in + conversation_count > 0
 *    - Custom messages (future expansion)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-05
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';

/**
 * Thought messages by scenario
 */
const THOUGHT_MESSAGES = {
  // Non-logged in user
  nonLoggedIn: {
    '573db390-a505-4c9e-809f-cc511c235cbb': [ // SAGE
      '앗! 로그인도 안한 사용자가...?',
      '생각이 없는건가....',
      '경찰에 신고해야 하나?',
      '말 걸면 어떻게 하지...ㅠㅠ'
    ],
    'af444146-e796-468c-8e2c-0daf4f9b9248': [ // Nexus
      '친입자인가...?',
      '야구 방망이가 필요한 시점인가...',
      '음..말걸면 잠수를 타야하는가..?',
      '대꾸는 해줘야 겠지..?'
    ]
  },
  // First conversation
  firstConversation: [
    '아...떨린다..',
    '항상 처음 대화는 너무 설레는거 같아...',
    '내가 말을 먼저 걸어야 하나?!',
    '언젠간 말 걸어주겠지...'
  ],
  // Has conversation
  hasConversation: {
    // SAGE (573db390-a505-4c9e-809f-cc511c235cbb)
    '573db390-a505-4c9e-809f-cc511c235cbb': [
      '오늘은 어떤 이야기를 할까...',
      '또 만나게 되어 기뻐...',
      '함께하는 시간이 소중해...',
      '언제든 기다리고 있을게...'
    ],
    
    // Nexus (af444146-e796-468c-8e2c-0daf4f9b9248)
    'af444146-e796-468c-8e2c-0daf4f9b9248': [
      '궁금한 게 많은데...',
      '오늘은 뭘 물어볼까...',
      '새로운 이야기가 기대돼...',
      '함께 시간 보내면 좋겠다...'
    ],
    
    // Default (all other personas including user personas)
    default: [
      '무슨 생각을 하고 있을까...',
      '오늘도 좋은 하루였으면...',
      '언제 대화 나눌 수 있을까...',
      '함께 있어 편안해...'
    ]
  }
};

/**
 * Get messages based on user and persona state
 */
const getMessages = (user, persona) => {
  // Non-logged in user
  if (!user) {
    const messages = THOUGHT_MESSAGES.nonLoggedIn[persona.persona_key];
    return messages || null; // Return null if not SAGE or Nexus (user personas don't show)
  }
  
  // Logged in + first conversation
  if (persona.conversation_count === 0) {
    return THOUGHT_MESSAGES.firstConversation;
  }
  
  // Logged in + has conversation
  const customMessages = THOUGHT_MESSAGES.hasConversation[persona.persona_key];
  if (customMessages) {
    return customMessages;
  }
  
  // Default: use default messages for all other personas (including user personas)
  return THOUGHT_MESSAGES.hasConversation.default;
};

/**
 * PersonaThoughtBubble Component
 */
const PersonaThoughtBubble = ({ 
  user,
  persona,
  isActive = false, // Only show when this persona is currently visible
  visible = true
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const cloudOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  
  // Get messages for current scenario
  const messages = getMessages(user, persona);
  
  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  
  // Initial cloud fade in (only once)
  useEffect(() => {
    if (!isActive || !visible || !messages || messages.length === 0) {
      // Reset if not active
      setCurrentMessageIndex(0);
      setIsInitialMount(true);
      cloudOpacity.setValue(0);
      textOpacity.setValue(0);
      return;
    }
    
    if (isInitialMount) {
      // First appearance: Fade in cloud
      Animated.timing(cloudOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start(() => {
        setIsInitialMount(false);
      });
    }
  }, [isActive, visible, messages, isInitialMount, cloudOpacity]);
  
  // Message rotation logic (text cross-fade)
  useEffect(() => {
    if (!isActive || !visible || !messages || messages.length === 0) {
      return;
    }
    
    // Fade in text
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start();
    
    // Wait 4 seconds then cross-fade to next message
    timerRef.current = setTimeout(() => {
      // Fade out current text
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        // Move to next message
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      });
    }, 4000);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, visible, messages, currentMessageIndex, textOpacity]);
  
  // Don't render if no messages
  if (!messages || messages.length === 0) {
    return null;
  }
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: cloudOpacity
        }
      ]}
    >
      {/* Cloud Shape - Fixed (no fade out) */}
      <View style={styles.cloudContainer}>
        <Svg width={scale(220)} height={verticalScale(90)} viewBox="0 0 220 90">
          {/* Main cloud body - rounded top and bottom */}
          <Path
            d="M 40 45 
               Q 35 30, 50 25
               Q 65 20, 80 25
               Q 95 20, 110 25
               Q 125 20, 140 25
               Q 155 20, 170 25
               Q 185 30, 180 45
               Q 185 60, 170 65
               Q 155 70, 140 65
               Q 125 70, 110 65
               Q 95 70, 80 65
               Q 65 70, 50 65
               Q 35 60, 40 45
               Z"
            fill="rgba(0, 0, 0, 0.65)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1.5"
          />
          
          {/* Small bubble 1 (tail - right side) */}
          <Path
            d="M 185 68
               Q 185 63, 190 63
               Q 195 63, 195 68
               Q 195 73, 190 73
               Q 185 73, 185 68
               Z"
            fill="rgba(0, 0, 0, 0.65)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1.5"
          />
          
          {/* Small bubble 2 (tail - right side) */}
          <Path
            d="M 195 76
               Q 195 72, 198 72
               Q 201 72, 201 76
               Q 201 80, 198 80
               Q 195 80, 195 76
               Z"
            fill="rgba(0, 0, 0, 0.65)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1.5"
          />
        </Svg>
        
        {/* Text Content - Cross-fade effect */}
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: textOpacity
            }
          ]}
        >
          <CustomText type="small" style={styles.thoughtText}>
            {messages && messages[currentMessageIndex]}
          </CustomText>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: verticalScale(80), // Below safe area
    left: scale(20),
    zIndex: 100,
    // Shadow (same as QuickActionChips)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  cloudContainer: {
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    top: verticalScale(25),
    left: scale(45),
    right: scale(45),
    bottom: verticalScale(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  thoughtText: {
    fontSize: scale(12),
    color: '#FFFFFF', // White text (same as QuickActionChips)
    textAlign: 'center',
    lineHeight: scale(17),
    fontWeight: '500', // Medium weight for better readability
  },
});

export default PersonaThoughtBubble;

