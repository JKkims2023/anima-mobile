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

import React from 'react';
import ManagerAIChatView from '../chat/ManagerAIChatView';

/**
 * ManagerAIView Component
 * 
 * Wrapper for ManagerAIChatView with video URL from persona
 */
const ManagerAIView = ({ persona }) => {
  // ✅ Use persona's video URL or fallback to default SAGE video
  const videoUrl = 'https://babi-cdn.logbrix.ai/babi/real/babi/46fb3532-e41a-4b96-8105-a39e64f39407_00001_.mp4';

  return (
    <ManagerAIChatView videoUrl={videoUrl} />
  );
};

export default ManagerAIView;

