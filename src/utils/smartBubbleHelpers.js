/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎯 Smart Bubble Message Helpers
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Purpose:
 * - Parse AI messages into smart bubbles
 * - Replace typing animation with fade-in bubbles
 * - Support backend-split messages (array) or client-side splitting
 * 
 * Strategy:
 * Layer 1: Backend split (if AI already split the message)
 * Layer 2: Client-side split (backup if AI didn't split)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-11
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { MESSAGE_TYPES } from './chatConstants';

/**
 * 🎯 Parse AI Message (2-Layer Detection)
 * 
 * Layer 1: Check if backend already split the message (array format)
 * Layer 2: If not split, apply client-side splitting logic
 * 
 * @param {string|array} message - AI response (can be string or array)
 * @returns {array} Array of bubble objects
 */
export const parseAIMessage = (message) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 [parseAIMessage] Analyzing message...');
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Layer 1: Backend Split Detection
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  if (Array.isArray(message)) {
    console.log('✅ [parseAIMessage] Backend split detected (Array)');
    console.log(`   Bubbles: ${message.length}`);
    message.forEach((bubble, i) => {
      console.log(`   ${i + 1}. "${bubble.substring(0, 50)}..."`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return message.map((text, index) => ({
      text: text.trim(),
      delay: index === 0 ? 0 : 500, // First bubble: immediate, others: 500ms delay
      source: 'backend'
    }));
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Layer 2: Client-Side Split Logic (Backup)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('⚠️ [parseAIMessage] Backend did NOT split → Client fallback');
  
  const bubbles = splitMessageIntoBubbles(message);
  
  console.log(`✂️ [parseAIMessage] Client split result: ${bubbles.length} bubble(s)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return bubbles;
};

/**
 * ✂️ Split Message Into Bubbles (Client-Side Backup Logic)
 * 
 * @param {string} text - AI response text
 * @returns {array} Array of bubble objects
 */
export const splitMessageIntoBubbles = (text) => {
  const maxSingleBubbleSentences = 2;
  const maxSingleBubbleLength = 100;
  const bubbleDelay = 500;
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Step 1: Split by sentence markers (., !, ?)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const sentenceRegex = /([^.!?]+[.!?]+)/g;
  const sentences = text.match(sentenceRegex);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Step 2: Handle no sentence markers (long sentence without punctuation)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  if (!sentences || sentences.length === 0) {
    console.log('⚠️ [splitMessageIntoBubbles] No sentence markers found');
    
    // Split by length if too long
    if (text.length > maxSingleBubbleLength) {
      console.log('✂️ [splitMessageIntoBubbles] Splitting by length');
      const midPoint = text.substring(0, maxSingleBubbleLength).lastIndexOf(' ');
      
      if (midPoint > 0) {
        return [
          { text: text.substring(0, midPoint).trim(), delay: 0, source: 'client' },
          { text: text.substring(midPoint).trim(), delay: bubbleDelay, source: 'client' }
        ];
      }
    }
    
    // Short message: single bubble
    console.log('✅ [splitMessageIntoBubbles] Single bubble (no markers)');
    return [{ text: text.trim(), delay: 0, source: 'client' }];
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Step 3: Clean sentences
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const cleanSentences = sentences
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  console.log(`📊 [splitMessageIntoBubbles] Total sentences: ${cleanSentences.length}`);
  cleanSentences.forEach((s, i) => {
    console.log(`   ${i + 1}. "${s}"`);
  });
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Step 4: Check if short enough for single bubble
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  if (cleanSentences.length <= maxSingleBubbleSentences) {
    console.log('✅ [splitMessageIntoBubbles] Short message → Single bubble');
    return [{ text: text.trim(), delay: 0, source: 'client' }];
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Step 5: Split into 2 bubbles (at middle point)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('✂️ [splitMessageIntoBubbles] Long message → Splitting into 2 bubbles');
  
  const totalSentences = cleanSentences.length;
  const midPoint = Math.ceil(totalSentences / 2);
  
  console.log(`📍 [splitMessageIntoBubbles] Mid point: ${midPoint} / ${totalSentences}`);
  
  const firstHalf = cleanSentences.slice(0, midPoint).join(' ');
  const secondHalf = cleanSentences.slice(midPoint).join(' ');
  
  console.log(`📦 [splitMessageIntoBubbles] Bubble 1: "${firstHalf.substring(0, 50)}..."`);
  console.log(`📦 [splitMessageIntoBubbles] Bubble 2: "${secondHalf.substring(0, 50)}..."`);
  
  return [
    { text: firstHalf, delay: 0, source: 'client' },
    { text: secondHalf, delay: bubbleDelay, source: 'client' }
  ];
};

/**
 * 💬 Add AI Message with Sequential Bubbles (NEW!)
 * Replaces typing animation with fade-in bubbles
 * 
 * @param {string|array} answer - AI response (string or array)
 * @param {object} options - Configuration options
 * @returns {Promise<array|null>} Resolves with array of AI message objects, or null if cancelled
 */
export const addAIMessageWithBubbles = async ({
  answer,
  richContent = { images: [], videos: [], links: [] },
  music = null,
  youtube = null,
  setIsTyping,
  setCurrentTypingText,
  setIsLoading,
  setMessages,
  timeoutManager,
}) => {
  return new Promise(async (resolve) => {
    // Check if already cancelled
    if (timeoutManager && timeoutManager.isCancelledStatus()) {
      resolve(null);
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 [addAIMessageWithBubbles] Starting...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 1: Parse message into bubbles
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const bubbles = parseAIMessage(answer);
    
    console.log(`📊 [addAIMessageWithBubbles] Total bubbles: ${bubbles.length}`);
    console.log(`   Source: ${bubbles[0]?.source || 'unknown'}`);
    
    // Turn off loading
    setIsLoading(false);
    setIsTyping(false);
    setCurrentTypingText('');
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 2: Add bubbles sequentially
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const addedMessages = [];
    
    for (let i = 0; i < bubbles.length; i++) {
      const bubble = bubbles[i];
      
      // Check if cancelled
      if (timeoutManager && timeoutManager.isCancelledStatus()) {
        console.log('🛑 [addAIMessageWithBubbles] Cancelled during bubble addition');
        resolve(null);
        return;
      }
      
      // Apply delay (first bubble: immediate, others: delay)
      if (bubble.delay > 0) {
        console.log(`⏳ [addAIMessageWithBubbles] Waiting ${bubble.delay}ms before bubble ${i + 1}...`);
        
        // Show loading indicator between bubbles
        if (i > 0) {
          setIsLoading(true);
        }
        
        await new Promise((delayResolve) => {
          const timeoutId = timeoutManager
            ? timeoutManager.setTimeout(() => {
                setIsLoading(false);
                delayResolve();
              }, bubble.delay)
            : setTimeout(() => {
                setIsLoading(false);
                delayResolve();
              }, bubble.delay);
          
          // Store timeout ID for cleanup
          if (!timeoutManager) {
            // No cleanup support
          }
        });
        
        // Check again after delay
        if (timeoutManager && timeoutManager.isCancelledStatus()) {
          console.log('🛑 [addAIMessageWithBubbles] Cancelled after delay');
          resolve(null);
          return;
        }
      }
      
      // Create message object
      const aiMessage = {
        id: `ai-${Date.now()}-${i}`,
        role: MESSAGE_TYPES.ASSISTANT,
        text: bubble.text,
        timestamp: new Date().toISOString(),
        // Rich content only on first bubble
        ...(i === 0 && richContent && {
          images: richContent.images || [],
          videos: richContent.videos || [],
          links: richContent.links || [],
        }),
        // Music & YouTube only on first bubble
        ...(i === 0 && music && { music }),
        ...(i === 0 && youtube && { youtube }),
      };
      
      console.log(`💬 [addAIMessageWithBubbles] Adding bubble ${i + 1}/${bubbles.length}`);
      console.log(`   Text: "${bubble.text.substring(0, 50)}..."`);
      
      // Add message to state
      setMessages(prev => [...prev, aiMessage]);
      addedMessages.push(aiMessage);
    }
    
    console.log('✅ [addAIMessageWithBubbles] All bubbles added successfully');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Return all added messages
    resolve(addedMessages);
  });
};
