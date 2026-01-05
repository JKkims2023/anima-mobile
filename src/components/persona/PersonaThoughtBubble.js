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
 * Get dynamic condition-based messages (client-side only, minimal computation)
 */
const getDynamicMessages = (persona) => {
  const messages = [];
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=Sunday, 6=Saturday
  
  // 1. Time-based thoughts (7 periods)
  if (hour >= 6 && hour < 9) {
    messages.push('아침부터 부지런하네...');
  } else if (hour >= 9 && hour < 12) {
    messages.push('오전 시간인데 무슨 일일까...');
  } else if (hour >= 12 && hour < 14) {
    messages.push('점심시간인가...');
  } else if (hour >= 14 && hour < 18) {
    messages.push('오후에도 생각나는구나...');
  } else if (hour >= 18 && hour < 22) {
    messages.push('저녁 시간에 무슨 일이 있나...');
  } else if (hour >= 22 || hour < 2) {
    messages.push('늦은 시간에 무슨 일일까...');
  } else if (hour >= 2 && hour < 6) {
    messages.push('새벽까지 잠을 못 자나...');
  }
  
  // 2. Day-based thoughts (3 patterns)
  if (day === 0) {
    messages.push('일요일인데 시간이 있나봐...');
  } else if (day === 6) {
    messages.push('토요일이네...');
  } else if (day === 1) {
    messages.push('월요일부터 바쁘구나...');
  } else if (day === 5) {
    messages.push('금요일이면 주말인데...');
  }
  
  // 3. Relationship-level thoughts (3 levels)
  if (persona.conversation_count >= 100) {
    messages.push('벌써 이렇게 오래 함께했네...');
  } else if (persona.conversation_count >= 50) {
    messages.push('꽤 자주 보는구나...');
  } else if (persona.conversation_count >= 20) {
    messages.push('조금씩 친해지는 걸까...');
  }
  
  return messages;
};

/**
 * Mix static and dynamic messages (random insertion)
 */
const getMixedMessages = (staticMessages, dynamicMessages) => {
  // No dynamic messages: return static only
  if (!dynamicMessages || dynamicMessages.length === 0) {
    return staticMessages;
  }
  
  // Mix: static + dynamic (max 2 dynamic messages)
  const mixed = [...staticMessages];
  const numDynamic = Math.min(2, dynamicMessages.length);
  
  // Randomly insert dynamic messages
  const usedIndices = new Set();
  for (let i = 0; i < numDynamic; i++) {
    let randomDynamicIndex;
    do {
      randomDynamicIndex = Math.floor(Math.random() * dynamicMessages.length);
    } while (usedIndices.has(randomDynamicIndex));
    usedIndices.add(randomDynamicIndex);
    
    const randomPosition = Math.floor(Math.random() * (mixed.length + 1));
    mixed.splice(randomPosition, 0, dynamicMessages[randomDynamicIndex]);
  }
  
  return mixed;
};

/**
 * Get messages based on user and persona state (HYBRID)
 */
const getMessages = (user, persona) => {
  // Non-logged in user (static only)
  if (!user) {
    const messages = THOUGHT_MESSAGES.nonLoggedIn[persona.persona_key];
    return messages || null; // Return null if not SAGE or Nexus (user personas don't show)
  }
  
  // Logged in + first conversation (static only)
  if (persona.conversation_count === 0) {
    return THOUGHT_MESSAGES.firstConversation;
  }
  
  // Logged in + has conversation (HYBRID: static + dynamic)
  const staticMessages = 
    THOUGHT_MESSAGES.hasConversation[persona.persona_key] || 
    THOUGHT_MESSAGES.hasConversation.default;
  
  // Get dynamic messages (client-side, minimal computation)
  const dynamicMessages = getDynamicMessages(persona);
  
  // Mix and return
  return getMixedMessages(staticMessages, dynamicMessages);
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
        // ⭐ FIX: Use setTimeout to defer setState (avoid useInsertionEffect warning)
        setTimeout(() => {
          setIsInitialMount(false);
        }, 0);
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
        // ⭐ FIX: Use setTimeout to defer setState (avoid useInsertionEffect warning)
        setTimeout(() => {
          // Move to next message
          setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        }, 0);
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
    top: verticalScale(20), // Below safe area
    left: scale(-20),
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
    padding: scale(10),
    bottom: verticalScale(25),
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  thoughtText: {
    fontSize: scale(14),
    color: '#FFFFFF', // White text (same as QuickActionChips)
    textAlign: 'left',
    lineHeight: scale(17),
    fontWeight: '500', // Medium weight for better readability
  },
});

export default PersonaThoughtBubble;

