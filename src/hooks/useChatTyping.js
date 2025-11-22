/**
 * useChatTyping Hook - Typing effect logic (SAGE + Persona common)
 * 
 * Features:
 * - requestAnimationFrame for 60fps typing
 * - Isolated state to prevent re-render bomb
 * - Automatic completion callback
 * - Memory-efficient (no setInterval)
 * 
 * @author JK & Hero AI
 * @date 2024-11-22
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for typing effect
 * 
 * @param {Function} onComplete - Callback when typing completes (receives fullText)
 * @param {number} typingSpeed - Milliseconds per character (default: 15ms, SAGE style)
 * @returns {Object} { startTyping, stopTyping, typingText, isTyping }
 */
export const useChatTyping = (onComplete, typingSpeed = 15) => {
  // ✅ Full text to type (set by startTyping)
  const [typingFullText, setTypingFullText] = useState(null);
  
  // ✅ Current typing text (updates frequently, isolated state)
  const [typingCurrentText, setTypingCurrentText] = useState('');
  
  // ✅ Is typing active
  const [isTyping, setIsTyping] = useState(false);
  
  // ✅ Animation frame ref
  const animationFrameRef = useRef(null);
  const typingStartTimeRef = useRef(null);
  
  /**
   * Start typing effect
   * @param {string} text - Full text to type
   */
  const startTyping = useCallback((text) => {
    if (!text || text.trim() === '') {
      if (__DEV__) {
        console.warn('[useChatTyping] ⚠️ Empty text provided to startTyping');
      }
      return;
    }
    
    // Stop any existing typing
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Reset state
    setTypingFullText(text);
    setTypingCurrentText('');
    setIsTyping(true);
    typingStartTimeRef.current = null; // Will be set in useEffect
    
    if (__DEV__) {
      console.log('[useChatTyping] 🎬 Started typing:', text.substring(0, 50) + '...');
    }
  }, []);
  
  /**
   * Stop typing effect (force complete)
   */
  const stopTyping = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setTypingFullText(null);
    setTypingCurrentText('');
    setIsTyping(false);
    typingStartTimeRef.current = null;
    
    if (__DEV__) {
      console.log('[useChatTyping] ⏹️ Stopped typing');
    }
  }, []);
  
  // ✅ Typing effect (requestAnimationFrame for 60fps)
  useEffect(() => {
    if (!typingFullText || !isTyping) {
      // Reset when not typing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      typingStartTimeRef.current = null;
      setTypingCurrentText('');
      return;
    }
    
    const fullText = typingFullText;
    
    // ✅ requestAnimationFrame for 60fps typing effect
    const typeNextChar = (timestamp) => {
      // ✅ Initialize start time on first frame
      if (!typingStartTimeRef.current) {
        typingStartTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - typingStartTimeRef.current;
      const targetIndex = Math.floor(elapsed / typingSpeed);
      
      if (targetIndex < fullText.length) {
        // ✅ Update typing current text (only TypingMessage component re-renders)
        const currentText = fullText.substring(0, targetIndex + 1);
        setTypingCurrentText(currentText);
        
        // Schedule next frame
        animationFrameRef.current = requestAnimationFrame(typeNextChar);
      } else {
        // ✅ Typing complete
        setIsTyping(false);
        setTypingFullText(null);
        setTypingCurrentText('');
        typingStartTimeRef.current = null;
        animationFrameRef.current = null;
        
        // Call completion callback
        if (onComplete) {
          onComplete(fullText);
        }
        
        if (__DEV__) {
          console.log('[useChatTyping] ✅ Typing completed');
        }
      }
    };
    
    // Start typing animation
    animationFrameRef.current = requestAnimationFrame(typeNextChar);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      typingStartTimeRef.current = null;
    };
  }, [typingFullText, isTyping, typingSpeed, onComplete]);
  
  return {
    startTyping,
    stopTyping,
    typingText: typingCurrentText, // Current typing text (for display)
    isTyping,
  };
};

export default useChatTyping;

