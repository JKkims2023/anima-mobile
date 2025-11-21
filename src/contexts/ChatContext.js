/**
 * ChatContext - Chat state management (isolated from Persona)
 * 
 * Key Strategy: Prevent re-render bomb during typing effect
 * - completedMessages: useRef (immutable, no re-render)
 * - typingMessage: useState (isolated, only TypingMessage re-renders)
 * - messageVersion: useState (trigger FlashList update once on complete)
 */

import React, { createContext, useState, useContext, useRef, useCallback } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  // ✅ Completed messages: useRef for immutable data (no re-render)
  const completedMessagesRef = useRef([]);
  
  // ✅ Typing message: isolated state (only TypingMessage component re-renders)
  const [typingMessage, setTypingMessage] = useState(null);
  
  // ✅ Message version: trigger FlashList extraData update (once per complete)
  const [messageVersion, setMessageVersion] = useState(0);
  
  /**
   * Add completed message (called after typing finishes)
   * This triggers only ONE re-render via messageVersion increment
   */
  const addCompletedMessage = useCallback((message) => {
    const newMessage = {
      ...message,
      id: Date.now(), // Unique ID for FlashList key
      timestamp: new Date().toISOString(),
    };
    
    completedMessagesRef.current = [
      ...completedMessagesRef.current,
      newMessage,
    ];
    
    // ✅ Trigger FlashList update (only once)
    setMessageVersion(v => v + 1);
    
    // Clear typing message
    setTypingMessage(null);
    
    if (__DEV__) {
      console.log('[ChatContext] Message completed:', newMessage.text?.substring(0, 50));
    }
  }, []);
  
  /**
   * Clear all messages (for testing or reset)
   */
  const clearMessages = useCallback(() => {
    completedMessagesRef.current = [];
    setTypingMessage(null);
    setMessageVersion(0);
  }, []);

  const value = {
    // Completed messages (immutable)
    completedMessages: completedMessagesRef.current,
    
    // Typing message (isolated)
    typingMessage,
    setTypingMessage,
    
    // Message version (FlashList trigger)
    messageVersion,
    
    // Actions
    addCompletedMessage,
    clearMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook for easy access
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export default ChatContext;

