/**
 * ChatContext - Chat state management (isolated from Persona)
 * 
 * Key Strategy: Prevent re-render bomb during typing effect
 * - completedMessages: useRef (immutable, no re-render)
 * - typingMessage: useState (isolated, only TypingMessage re-renders)
 * - messageVersion: useState (trigger FlashList update once on complete)
 * 
 * Enhanced Strategy: Persona-specific chat histories
 * - personaChatHistories: useRef (per-persona chat storage)
 * - activePersonaKey: useState (current active persona)
 * - Instant switch on swipe, no DB calls, perfect UX
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 * @updated 2024-11-22 - Persona-specific histories
 */

import React, { createContext, useState, useContext, useRef, useCallback, useMemo } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  // ==================== SAGE Chat State ====================
  // ✅ SAGE completed messages: useRef for immutable data (no re-render)
  const sageCompletedMessagesRef = useRef([]);
  
  // ✅ SAGE typing message: isolated state (only TypingMessage component re-renders)
  const [sageTypingMessage, setSageTypingMessage] = useState(null);
  
  // ✅ SAGE message version: trigger FlashList extraData update (once per complete)
  const [sageMessageVersion, setSageMessageVersion] = useState(0);
  
  // ==================== Persona Chat State ====================
  // ✅ Persona-specific chat histories: useRef (memory-based, instant switch)
  // Structure: { 'persona_key_1': { completed: [], typing: null, version: 0 }, ... }
  const personaChatHistoriesRef = useRef({});
  
  // ✅ Active persona key: which persona is currently active
  const [activePersonaKey, setActivePersonaKey] = useState(null);
  
  // ✅ Force update trigger for persona chat (when switching or adding message)
  const [personaChatVersion, setPersonaChatVersion] = useState(0);
  
  // ==================== SAGE Functions ====================
  
  /**
   * Add completed message to SAGE (called after typing finishes)
   * This triggers only ONE re-render via messageVersion increment
   */
  const addSageMessage = useCallback((message) => {
    const newMessage = {
      ...message,
      id: `sage-${Date.now()}`, // Unique ID for FlashList key
      timestamp: new Date().toISOString(),
    };
    
    sageCompletedMessagesRef.current = [
      ...sageCompletedMessagesRef.current,
      newMessage,
    ];
    
    // ✅ Trigger FlashList update (only once)
    setSageMessageVersion(v => v + 1);
    
    // Clear typing message
    setSageTypingMessage(null);
    
    if (__DEV__) {
      console.log('[ChatContext] SAGE message completed:', newMessage.text?.substring(0, 50));
    }
  }, []);
  
  /**
   * Clear SAGE messages (for testing or reset)
   */
  const clearSageMessages = useCallback(() => {
    sageCompletedMessagesRef.current = [];
    setSageTypingMessage(null);
    setSageMessageVersion(0);
  }, []);
  
  // ==================== Persona Functions ====================
  
  /**
   * Initialize persona chat history (called when persona is first accessed)
   */
  const initializePersonaChat = useCallback((personaKey) => {
    if (!personaChatHistoriesRef.current[personaKey]) {
      personaChatHistoriesRef.current[personaKey] = {
        completed: [],
        typing: null,
        version: 0,
      };
      
      if (__DEV__) {
        console.log('[ChatContext] 🆕 Initialized chat for persona:', personaKey);
      }
    }
  }, []);
  
  /**
   * Switch active persona (instant, no DB call)
   * This is called when user swipes to a different persona
   */
  const switchPersona = useCallback((personaKey) => {
    if (!personaKey) {
      setActivePersonaKey(null);
      return;
    }
    
    // Initialize if not exists
    if (!personaChatHistoriesRef.current[personaKey]) {
      initializePersonaChat(personaKey);
    }
    
    setActivePersonaKey(personaKey);
    setPersonaChatVersion(v => v + 1); // Trigger re-render
    
    if (__DEV__) {
      console.log('[ChatContext] 🔄 Switched to persona:', personaKey);
    }
  }, [initializePersonaChat]);
  
  /**
   * Add completed message to specific persona
   */
  const addPersonaMessage = useCallback((personaKey, message) => {
    // Initialize if not exists
    if (!personaChatHistoriesRef.current[personaKey]) {
      initializePersonaChat(personaKey);
    }
    
    const newMessage = {
      ...message,
      id: `${personaKey}-${Date.now()}`, // Unique ID for FlashList key
      timestamp: new Date().toISOString(),
    };
    
    const history = personaChatHistoriesRef.current[personaKey];
    history.completed = [...history.completed, newMessage];
    history.version += 1;
    history.typing = null;
    
    // ✅ Trigger re-render only if this is the active persona
    if (personaKey === activePersonaKey) {
      setPersonaChatVersion(v => v + 1);
    }
    
    if (__DEV__) {
      console.log('[ChatContext] 💬 Persona message added:', personaKey, newMessage.text?.substring(0, 50));
      console.log('[ChatContext] 📊 Total messages for this persona:', history.completed.length);
      console.log('[ChatContext] 📊 Is active persona?', personaKey === activePersonaKey);
      console.log('[ChatContext] 📊 New version:', history.version);
    }
  }, [activePersonaKey, initializePersonaChat]);
  
  /**
   * Set typing message for specific persona
   */
  const setPersonaTypingMessage = useCallback((personaKey, message) => {
    // Initialize if not exists
    if (!personaChatHistoriesRef.current[personaKey]) {
      initializePersonaChat(personaKey);
    }
    
    personaChatHistoriesRef.current[personaKey].typing = message;
    
    // ✅ Trigger re-render only if this is the active persona
    if (personaKey === activePersonaKey) {
      setPersonaChatVersion(v => v + 1);
    }
    
    if (__DEV__ && message) {
      console.log('[ChatContext] ⌨️ Typing message updated:', personaKey, message.substring(0, 30) + '...');
      console.log('[ChatContext] 📊 Is active persona?', personaKey === activePersonaKey);
    }
  }, [activePersonaKey, initializePersonaChat]);
  
  /**
   * Get current persona's chat data (memoized)
   */
  const currentPersonaChat = useMemo(() => {
    if (!activePersonaKey || !personaChatHistoriesRef.current[activePersonaKey]) {
      return {
        completed: [],
        typing: null,
        version: 0,
      };
    }
    
    return personaChatHistoriesRef.current[activePersonaKey];
  }, [activePersonaKey, personaChatVersion]); // Re-compute when persona changes or version updates
  
  /**
   * Clear specific persona's messages
   */
  const clearPersonaMessages = useCallback((personaKey) => {
    if (personaChatHistoriesRef.current[personaKey]) {
      personaChatHistoriesRef.current[personaKey] = {
        completed: [],
        typing: null,
        version: 0,
      };
      
      if (personaKey === activePersonaKey) {
        setPersonaChatVersion(v => v + 1);
      }
    }
  }, [activePersonaKey]);
  
  /**
   * Load persona chat histories from DB (initial load)
   */
  const loadPersonaChatHistories = useCallback(async (histories) => {
    // histories = { 'persona_key_1': [messages], 'persona_key_2': [messages], ... }
    Object.keys(histories).forEach(personaKey => {
      personaChatHistoriesRef.current[personaKey] = {
        completed: histories[personaKey] || [],
        typing: null,
        version: 0,
      };
    });
    
    if (__DEV__) {
      console.log('[ChatContext] 📥 Loaded chat histories for', Object.keys(histories).length, 'personas');
    }
  }, []);

  // ==================== Context Value ====================
  
  const value = useMemo(() => ({
    // ==================== SAGE Chat ====================
    sageCompletedMessages: sageCompletedMessagesRef.current,
    sageTypingMessage,
    setSageTypingMessage,
    sageMessageVersion,
    addSageMessage,
    clearSageMessages,
    
    // ==================== Persona Chat ====================
    activePersonaKey,
    currentPersonaChat, // Current persona's { completed, typing, version }
    switchPersona,
    addPersonaMessage,
    setPersonaTypingMessage,
    clearPersonaMessages,
    loadPersonaChatHistories,
    initializePersonaChat,
    
    // ==================== Backward Compatibility (SAGE) ====================
    // For components still using old API
    completedMessages: sageCompletedMessagesRef.current,
    typingMessage: sageTypingMessage,
    setTypingMessage: setSageTypingMessage,
    messageVersion: sageMessageVersion,
    addCompletedMessage: addSageMessage,
    clearMessages: clearSageMessages,
  }), [
    sageTypingMessage,
    sageMessageVersion,
    activePersonaKey,
    currentPersonaChat,
    addSageMessage,
    clearSageMessages,
    switchPersona,
    addPersonaMessage,
    setPersonaTypingMessage,
    clearPersonaMessages,
    loadPersonaChatHistories,
    initializePersonaChat,
  ]);

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

