/**
 * ManagerAIView - Manager AI (SAGE) display and chat interface
 * 
 * Features:
 * - Video background with overlay chat
 * - Keyboard-aware input bar
 * - Height adjustable chat area
 * - Real-time AI chat integration
 * 
 * ✅ Phase 2 Complete:
 * - FlashList message rendering
 * - Typing effect
 * - API integration
 * - Keyboard handling
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */

import React, { memo } from 'react';
import ManagerAIChatView from '../chat/ManagerAIChatView';

/**
 * ManagerAIView Component
 * 
 * Wrapper for ManagerAIChatView with video URL from persona
 * @param {Object} props
 * @param {Object} props.persona - Persona data (SAGE or selected persona)
 * @param {boolean} props.isActive - Whether this view is currently active
 * @param {Animated.Value} props.modeOpacity - Opacity animation value from parent (for mode transition)
 * @param {Animated.Value} props.chatOpacity - Opacity animation value for chat UI (for quick mode transition)
 */
const ManagerAIView = ({ persona, isActive = false, modeOpacity, chatOpacity }) => {
  // ✅ Default SAGE video URL
  const DEFAULT_SAGE_VIDEO = 'https://babi-cdn.logbrix.ai/babi/real/babi/46fb3532-e41a-4b96-8105-a39e64f39407_00001_.mp4';
  
  // ✅ Use persona's video URL or fallback to default SAGE video
  const videoUrl = persona?.selected_dress_video_url || DEFAULT_SAGE_VIDEO;
  
  if (__DEV__) {
    console.log('[ManagerAIView] Rendering with:', {
      personaName: persona?.persona_name || 'SAGE',
      videoUrl: videoUrl.substring(0, 50) + '...',
      isActive,
    });
  }

  // ✅ Always render ManagerAIChatView, but in preview mode when inactive
  return (
    <ManagerAIChatView 
      videoUrl={videoUrl} 
      isPreview={!isActive}
      modeOpacity={modeOpacity}
      chatOpacity={chatOpacity}
    />
  );
};

// ✅ Memoize to prevent unnecessary re-renders
// Only re-render if persona or isActive changes
export default memo(ManagerAIView, (prevProps, nextProps) => {
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.persona?.persona_key === nextProps.persona?.persona_key &&
    prevProps.persona?.selected_dress_video_url === nextProps.persona?.selected_dress_video_url
  );
});

