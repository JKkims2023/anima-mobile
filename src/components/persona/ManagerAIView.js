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
 * @param {boolean} props.isScreenFocused - Whether the screen is focused (for video playback)
 * @param {Animated.Value} props.modeOpacity - Opacity animation value from parent (for mode transition)
 * @param {Animated.Value} props.chatOpacity - Opacity animation value for chat UI (for quick mode transition)
 */
const ManagerAIView = ({ persona, isActive = false, isScreenFocused = true, modeOpacity, chatOpacity }) => {
  // ✅ Default SAGE video URL
  const DEFAULT_SAGE_VIDEO = 'https://babi-cdn.logbrix.ai/babi/real/babi/46fb3532-e41a-4b96-8105-a39e64f39407_00001_.mp4';
  
  // ✅ Check if persona has video (video_url != null && convert_done = 'Y')
  const hasVideo = 
    persona?.selected_dress_video_url != null && 
    persona?.selected_dress_video_convert_done === 'Y';
  
  // ✅ Use persona's video URL or fallback to default SAGE video
  const videoUrl = hasVideo ? persona.selected_dress_video_url : DEFAULT_SAGE_VIDEO;
  
  // ✅ Use persona's image URL as fallback
  const imageUrl = persona?.selected_dress_image_url || persona?.original_url;
  
  if (__DEV__) {
    console.log('🎯 [ManagerAIView] Rendering with:', {
      personaName: persona?.persona_name || 'SAGE',
      personaKey: persona?.persona_key,
      hasVideo,
      videoUrl: videoUrl?.substring(0, 50) + '...',
      imageUrl: imageUrl?.substring(0, 50) + '...',
      isActive,
      isScreenFocused,
      isPreview: !isActive,
      convertDone: persona?.selected_dress_video_convert_done,
    });
  }

  // ✅ Always render ManagerAIChatView, but in preview mode when inactive
  return (
    <ManagerAIChatView 
      videoUrl={videoUrl} 
      imageUrl={imageUrl}
      hasVideo={hasVideo}
      isPreview={!isActive}
      isScreenFocused={isScreenFocused}
      modeOpacity={modeOpacity}
      chatOpacity={chatOpacity}
    />
  );
};

// ✅ Memoize to prevent unnecessary re-renders
// Only re-render if persona, isActive, or isScreenFocused changes
export default memo(ManagerAIView, (prevProps, nextProps) => {
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.isScreenFocused === nextProps.isScreenFocused &&
    prevProps.persona?.persona_key === nextProps.persona?.persona_key &&
    prevProps.persona?.selected_dress_video_url === nextProps.persona?.selected_dress_video_url &&
    prevProps.persona?.selected_dress_image_url === nextProps.persona?.selected_dress_image_url &&
    prevProps.persona?.selected_dress_video_convert_done === nextProps.persona?.selected_dress_video_convert_done
  );
});

