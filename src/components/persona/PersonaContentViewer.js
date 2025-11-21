/**
 * PersonaContentViewer - Main content area for Persona display
 * 
 * Features:
 * - Swipeable persona viewer
 * - Manager AI (Index 0) + Regular Personas (Index 1+)
 * - Conditional rendering based on persona type
 * - Haptic feedback
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 * @updated 2024-11-21 - Swipe viewer integration
 */

import React from 'react';
import PersonaSwipeViewer from './PersonaSwipeViewer';

/**
 * PersonaContentViewer Component
 * Now delegates to PersonaSwipeViewer for all rendering
 */
const PersonaContentViewer = () => {
  return <PersonaSwipeViewer />;
};

export default PersonaContentViewer;

