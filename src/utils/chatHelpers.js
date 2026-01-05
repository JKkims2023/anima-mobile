/**
 * 💬 Chat Helpers - Reusable Chat Functions
 * 
 * @author JK & Hero Nexus AI
 * @description Common chat functions with cleanup support
 */

import { calculateTotalDuration, MESSAGE_TYPES } from './chatConstants';

/**
 * 🛑 Cancelable Timeout Class
 * 
 * Provides a way to cancel setTimeout operations when component unmounts
 * or modal closes, preventing memory leaks and errors.
 */
export class CancelableTimeout {
  constructor() {
    this.timeoutIds = new Set();
    this.isCancelled = false;
  }

  /**
   * Set a cancelable timeout
   * @param {Function} callback - Function to execute
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Timeout ID
   */
  setTimeout(callback, delay) {
    if (this.isCancelled) {
      return null;
    }

    const timeoutId = setTimeout(() => {
      if (!this.isCancelled) {
        callback();
      }
      this.timeoutIds.delete(timeoutId);
    }, delay);

    this.timeoutIds.add(timeoutId);
    return timeoutId;
  }

  /**
   * Cancel all pending timeouts
   */
  cancelAll() {
    this.isCancelled = true;
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds.clear();
  }

  /**
   * Check if cancelled
   * @returns {boolean}
   */
  isCancelledStatus() {
    return this.isCancelled;
  }
}

/**
 * 💬 Add AI Message with Typing Effect
 * 
 * @param {string} answer - AI response text
 * @param {object} options - Configuration options
 * @param {object} options.richContent - Rich media content (images, videos, links)
 * @param {object|null} options.music - Music data
 * @param {object|null} options.youtube - YouTube data
 * @param {string} options.messageId - Custom message ID (optional)
 * @param {Function} options.setIsTyping - State setter for typing status
 * @param {Function} options.setCurrentTypingText - State setter for typing text
 * @param {Function} options.setIsLoading - State setter for loading status
 * @param {Function} options.setMessages - State setter for messages
 * @param {CancelableTimeout} options.timeoutManager - Timeout manager for cleanup
 * @returns {Promise<object|null>} Resolves with AI message object, or null if cancelled
 */
export const addAIMessageWithTyping = ({
  answer,
  richContent = { images: [], videos: [], links: [] },
  music = null,
  youtube = null,
  messageId = null,
  setIsTyping,
  setCurrentTypingText,
  setIsLoading,
  setMessages,
  timeoutManager,
}) => {
  return new Promise((resolve) => {
    // Check if already cancelled
    if (timeoutManager && timeoutManager.isCancelledStatus()) {
      resolve(null);
      return;
    }

    // Start typing effect
    setIsTyping(true);
    setCurrentTypingText(answer);
    setIsLoading(false);

    // Calculate typing duration
    const totalDuration = calculateTotalDuration(answer);

    // Set cancelable timeout
    const timeoutId = timeoutManager
      ? timeoutManager.setTimeout(() => {
          // Check again before executing (double safety)
          if (timeoutManager.isCancelledStatus()) {
            resolve(null);
            return;
          }

          const aiMessage = {
            id: messageId || `ai-${Date.now()}`,
            role: MESSAGE_TYPES.ASSISTANT,
            text: answer,
            timestamp: new Date().toISOString(),
            images: [
              ...(richContent.images || []),
            ],
            videos: richContent.videos || [],
            links: richContent.links || [],
            music: music,
            youtube: youtube,
          };

          setMessages(prev => [...prev, aiMessage]);
          setIsTyping(false);
          setCurrentTypingText('');

          resolve(aiMessage);
        }, totalDuration)
      : setTimeout(() => {
          // Fallback without timeout manager (for backward compatibility)
          const aiMessage = {
            id: messageId || `ai-${Date.now()}`,
            role: MESSAGE_TYPES.ASSISTANT,
            text: answer,
            timestamp: new Date().toISOString(),
            images: [
              ...(richContent.images || []),
            ],
            videos: richContent.videos || [],
            links: richContent.links || [],
            music: music,
            youtube: youtube,
          };

          setMessages(prev => [...prev, aiMessage]);
          setIsTyping(false);
          setCurrentTypingText('');

          resolve(aiMessage);
        }, totalDuration);
  });
};

/**
 * ⏱️ Cancelable Delay
 * 
 * @param {number} ms - Delay in milliseconds
 * @param {CancelableTimeout} timeoutManager - Timeout manager for cleanup
 * @returns {Promise<void>} Resolves after delay, or immediately if cancelled
 */
export const cancelableDelay = (ms, timeoutManager) => {
  return new Promise((resolve) => {
    if (timeoutManager && timeoutManager.isCancelledStatus()) {
      resolve();
      return;
    }

    if (timeoutManager) {
      timeoutManager.setTimeout(() => {
        resolve();
      }, ms);
    } else {
      setTimeout(resolve, ms);
    }
  });
};

/**
 * 📝 Normalize Message
 * 
 * Ensures consistent message structure across history and real-time messages
 * 
 * @param {object} msg - Raw message object
 * @returns {object} Normalized message object
 */
export const normalizeMessage = (msg) => ({
  id: msg.id,
  role: msg.role,
  text: msg.text,
  timestamp: msg.timestamp,
  image: msg.image || null, // User-sent image
  images: msg.images || [], // AI-generated images
  videos: msg.videos || [], // AI-generated videos
  links: msg.links || [], // AI-generated links
  music: msg.music || null, // Music data
  youtube: msg.youtube || null, // YouTube video data
});

/**
 * 🎨 Create Error Message
 * 
 * @param {string} errorText - Error message text
 * @returns {object} Error message object
 */
export const createErrorMessage = (errorText) => ({
  id: `error-${Date.now()}`,
  role: MESSAGE_TYPES.ASSISTANT,
  text: errorText,
  timestamp: new Date().toISOString(),
});

/**
 * 👤 Create User Message
 * 
 * @param {string} text - User message text
 * @param {object|null} selectedImage - Selected image data
 * @returns {object} User message object with image Data URI
 */
export const createUserMessage = (text, selectedImage) => {
  const imageDataUri = selectedImage 
    ? `data:${selectedImage.type};base64,${selectedImage.base64}`
    : null;

  return {
    id: `user-${Date.now()}`,
    role: MESSAGE_TYPES.USER,
    text: text,
    timestamp: new Date().toISOString(),
    image: selectedImage ? {
      uri: imageDataUri,
      type: selectedImage.type,
    } : null,
  };
};

