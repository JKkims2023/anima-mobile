/**
 * 💭 PersonaThoughtBubble - Thought Bubble Component
 * 
 * Features:
 * - Cloud-shaped thought bubble
 * - Sequential message display with timer
 * - Fade in/out animation
 * - Dynamic bubble size based on message length
 * - Hybrid message system: static + dynamic + AI real thoughts
 * - Only active when currentIndex matches
 * - Zero re-render, zero performance impact
 * 
 * Messages:
 * 1. Non-logged in user (user === null)
 *    - SAGE & Nexus: Suspicious messages (hardcoded only)
 * 2. Logged in + conversation_count === 0
 *    - All personas: Nervous/excited messages (hardcoded only)
 * 3. Logged in + conversation_count > 0
 *    - Hybrid: hardcoded + time/day/relationship + AI real thoughts (ai_interests + ai_next_questions)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-05 (Initial)
 * @updated 2026-01-06 (Hybrid system with AI real thoughts)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
 * ⭐ NEW: Get AI's real thoughts from learned data
 * (Only for logged-in users with conversation history)
 * 
 * @param {Object} persona - Persona object with ai_interests and ai_next_questions
 * @returns {Array<string>} - Array of AI's real thoughts
 */
const getAIThoughts = (persona) => {
  const thoughts = [];
  
  // ⚠️ Safety check: Only for personas with conversation history
  if (!persona || persona.conversation_count === 0) {
    return thoughts;
  }
  
  // 1. AI Interests (관심사) - TOP 3 from backend
  if (persona.ai_interests && Array.isArray(persona.ai_interests) && persona.ai_interests.length > 0) {
    persona.ai_interests.forEach(interest => {
      if (interest.topic) {
        // Format: "{{topic}}에 대해 궁금한데..."
        thoughts.push(`${interest.topic}에 대해 궁금한데...`);
      }
    });
  }
  
  // 2. AI Next Questions (궁금한 것) - TOP 3 from backend
  if (persona.ai_next_questions && Array.isArray(persona.ai_next_questions) && persona.ai_next_questions.length > 0) {
    persona.ai_next_questions.forEach(q => {
      if (q.question) {
        // Use question as-is (already formatted by AI)
        thoughts.push(q.question);
      }
    });
  }
  
  return thoughts;
};

/**
 * Mix static, dynamic, and AI real thoughts (random insertion)
 * 
 * Strategy:
 * - Static messages: Always included (4 messages)
 * - Dynamic messages (time/day/relationship): Max 2 inserted
 * - AI real thoughts: Max 3 inserted (from ai_interests + ai_next_questions)
 * - Total pool: ~9-12 messages for variety
 * 
 * @param {Array<string>} staticMessages - Hardcoded static messages
 * @param {Array<string>} dynamicMessages - Time/day/relationship messages
 * @param {Array<string>} aiThoughts - AI's real interests and questions
 * @returns {Array<string>} - Mixed message array
 */
const getMixedMessages = (staticMessages, dynamicMessages = [], aiThoughts = []) => {
  // Start with static messages
  const mixed = [...staticMessages];
  
  // 1. Add dynamic messages (time/day/relationship) - Max 2
  if (dynamicMessages && dynamicMessages.length > 0) {
    const numDynamic = Math.min(2, dynamicMessages.length);
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
  }
  
  // 2. Add AI real thoughts (ai_interests + ai_next_questions) - Max 3
  if (aiThoughts && aiThoughts.length > 0) {
    const numAI = Math.min(3, aiThoughts.length);
    const usedIndices = new Set();
    
    for (let i = 0; i < numAI; i++) {
      let randomAIIndex;
      do {
        randomAIIndex = Math.floor(Math.random() * aiThoughts.length);
      } while (usedIndices.has(randomAIIndex));
      usedIndices.add(randomAIIndex);
      
      const randomPosition = Math.floor(Math.random() * (mixed.length + 1));
      mixed.splice(randomPosition, 0, aiThoughts[randomAIIndex]);
    }
  }
  
  return mixed;
};

/**
 * Get messages based on user and persona state (HYBRID SYSTEM)
 * 
 * 3 Scenarios:
 * 1. Non-logged in (user === null):
 *    - SAGE & Nexus only: Hardcoded suspicious messages
 *    - User personas: No bubble (return null)
 *    - NO ai_interests, NO ai_next_questions (no user_key)
 * 
 * 2. Logged in + First conversation (conversation_count === 0):
 *    - All personas: Hardcoded nervous/excited messages
 *    - NO ai_interests, NO ai_next_questions (no data yet)
 * 
 * 3. Logged in + Has conversation (conversation_count > 0):
 *    - HYBRID: hardcoded + time/day/relationship + AI real thoughts
 *    - ✅ ai_interests (AI's learned interests)
 *    - ✅ ai_next_questions (AI's pending questions)
 * 
 * @param {Object} user - User object (null if not logged in)
 * @param {Object} persona - Persona object
 * @returns {Array<string>|null} - Array of messages or null
 */
const getMessages = (user, persona) => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Case 1: Non-logged in user (HARDCODED ONLY)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!user) {
    const messages = THOUGHT_MESSAGES.nonLoggedIn[persona.persona_key];
    return messages || null; // SAGE/Nexus only, user personas return null
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Case 2: First conversation (HARDCODED ONLY)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (persona.conversation_count === 0) {
    return THOUGHT_MESSAGES.firstConversation;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Case 3: Has conversation (HYBRID SYSTEM!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // 1. Get static messages (hardcoded)
  const staticMessages = 
    THOUGHT_MESSAGES.hasConversation[persona.persona_key] || 
    THOUGHT_MESSAGES.hasConversation.default;
  
  // 2. Get dynamic messages (time/day/relationship)
  const dynamicMessages = getDynamicMessages(persona);
  
  // 3. ⭐ Get AI real thoughts (ai_interests + ai_next_questions)
  const aiThoughts = getAIThoughts(persona);
  
  // 4. Mix all three types and return
  return getMixedMessages(staticMessages, dynamicMessages, aiThoughts);
};

/**
 * Calculate dynamic bubble size based on message length
 * 
 * @param {string} message - The message to calculate size for
 * @returns {Object} - { width, height } in pixels
 */
const getBubbleSize = (message) => {
  if (!message) return { width: 220, height: 90 }; // Default size
  
  const length = message.length;
  
  // 4 size tiers based on message length
  if (length <= 15) {
    return { width: 200, height: 80 }; // Small
  } else if (length <= 30) {
    return { width: 220, height: 90 }; // Medium (default)
  } else if (length <= 45) {
    return { width: 250, height: 100 }; // Large
  } else {
    return { width: 270, height: 110 }; // Extra Large (max)
  }
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
  const bubbleWidth = useRef(new Animated.Value(220)).current; // ⭐ NEW: Dynamic width
  const bubbleHeight = useRef(new Animated.Value(90)).current; // ⭐ NEW: Dynamic height
  const timerRef = useRef(null);
  
  // ⭐ NEW: Memoize messages to prevent re-computation on every render
  // Only recalculate when these dependencies change
  const messages = useMemo(() => {
    return getMessages(user, persona);
  }, [
    user, 
    persona?.persona_key,
    persona?.conversation_count,
    persona?.ai_interests,
    persona?.ai_next_questions
  ]);
  
  // ⭐ NEW: Update bubble size when current message changes
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    const currentMessage = messages[currentMessageIndex];
    const newSize = getBubbleSize(currentMessage);
    
    // Animate bubble size smoothly
    Animated.parallel([
      Animated.timing(bubbleWidth, {
        toValue: newSize.width,
        duration: 300,
        useNativeDriver: false, // Layout animation requires false
      }),
      Animated.timing(bubbleHeight, {
        toValue: newSize.height,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [currentMessageIndex, messages, bubbleWidth, bubbleHeight]);
  
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
  
  // ⭐ Calculate scale for dynamic bubble size (from base 220x90)
  const bubbleScale = bubbleWidth.interpolate({
    inputRange: [200, 270],
    outputRange: [0.91, 1.23], // Scale factors (200/220 = 0.91, 270/220 = 1.23)
    extrapolate: 'clamp',
  });
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: cloudOpacity
        }
      ]}
    >
      {/* Cloud Shape - Dynamic size with smooth animation */}
      <Animated.View 
        style={[
          styles.cloudContainer,
          {
            transform: [{ scale: bubbleScale }]
          }
        ]}
      >
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
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: verticalScale(0), // Below safe area
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

