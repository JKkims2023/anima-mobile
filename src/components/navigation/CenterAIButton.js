/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 CenterAIButton Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The revolutionary center AI button that embodies ANIMA's philosophy:
 * "AI at the center of human connection"
 * 
 * Features:
 * - 4 States: Empty (+), SAGE (Manager), Persona (Face), Message (✉️)
 * - Semi-circle design (top rounded)
 * - Pulse animation for empty state
 * - Smooth state transitions
 * - Touch feedback
 * 
 * States:
 * 1. Empty: Animated '+' icon with pulse (no persona selected)
 * 2. SAGE: Manager AI logo with blue theme
 * 3. Persona: Persona face image with theme color border
 * 4. Message: Message creation icon (✉️) with gradient theme
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */

import React, { useEffect, useRef, memo } from 'react';
import {
  View,
  Pressable,
  Image,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import Video from 'react-native-video';
import { useTheme } from '../../contexts/ThemeContext';
import { TAB_BAR } from '../../constants/layout';
import { scale, verticalScale } from '../../utils/responsive-utils';
import CustomText from '../CustomText';
import HapticService from '../../utils/HapticService';



/**
 * CenterAIButton Component
 * @param {Object} props
 * @param {string} props.state - 'empty' | 'sage' | 'persona' | 'message'
 * @param {string} props.personaImageUrl - Persona image URL (if state is 'persona')
 * @param {string} props.personaVideoUrl - Persona video URL (if state is 'persona')
 * @param {string} props.personaName - Persona name (if state is 'persona')
 * @param {Function} props.onPress - Press handler
 */
const CenterAIButton = ({ 
  state = 'sage', // 'empty' | 'sage' | 'persona' | 'message'
  personaImageUrl = null,
  personaVideoUrl = null,
  personaName = '',
  onPress = () => {},
}) => {
  const { currentTheme } = useTheme();
  
  // ✅ Pulse animation for empty state
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // ✅ Start pulse animation when state is 'empty'
  useEffect(() => {
    if (state === 'empty') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    } else {
      // Reset to 1 when not empty
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);
  
  // ✅ Handle press IN (touch down) - Stage 1: Focus
  const handlePressIn = () => {
    // 📸 Stage 1: Half-press (Focus)
    // Light "tick" feedback when finger touches the button
    // Like a camera half-shutter: "I'm ready!"
    HapticService.cameraHalfPress();
  };
  
  // ✅ Handle press (touch up) - Stage 2: Capture
  const handlePress = () => {
    // 📸 Stage 2: Full-press (Capture)
    // Heavy "CLACK" feedback when finger releases
    // Like a camera full-shutter: "Captured!"
    HapticService.cameraFullPress();
    
    // Execute the provided onPress handler
    onPress();
  };
  
  // ✅ Render content based on state
  const renderContent = () => {
    switch (state) {
      case 'empty':
        return (
          <Animated.View
            style={[
              styles.contentContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={[styles.emptyIcon, { 
              backgroundColor: currentTheme.primary || '#4285F4',
              borderColor: '#FFFFFF', // ✅ White border for contrast
            }]}>
              <CustomText style={styles.plusIcon}>+</CustomText>
            </View>
            <CustomText style={[styles.label, { color: currentTheme.text }]}>
              AI 선택
            </CustomText>
          </Animated.View>
        );
        
      case 'sage':
        return (
          <View style={styles.contentContainer}>
            <View style={[styles.sageIcon, { 
              backgroundColor: currentTheme.primary || '#4285F4',
              borderColor: '#FFFFFF', // ✅ White border for contrast
            }]}>
              <CustomText style={styles.sageEmoji}>🌟</CustomText>
              <CustomText style={styles.sageHeart}>💙</CustomText>
            </View>
            <CustomText style={[styles.label, { color: currentTheme.text }]}>
              SAGE
            </CustomText>
          </View>
        );
        
      case 'persona':
        return (
          <View style={styles.contentContainer}>
            <View style={[styles.personaIcon, {
              borderColor: '#FFFFFF', // ✅ White border for contrast
            }]}>
              {false ? (
                // ✅ Video (if available)
                <Video
                  source={{ uri: personaVideoUrl }}
                  style={styles.personaVideo}
                  resizeMode="cover"
                  repeat
                  muted
                  paused={false}
                  onError={(error) => {
                    if (__DEV__) {
                      console.error('[CenterAIButton] Video Error:', error);
                    }
                  }}
                />
              ) : false ? (
                // ✅ Image (fallback)
                <Image
                  source={{ uri: personaImageUrl }}
                  style={styles.personaImage}
                  resizeMode="cover"
                />
              ) : (
                // ✅ Placeholder (no image or video)
                <CustomText style={styles.personaPlaceholder}>💬</CustomText>
              )}
            </View>
            <CustomText 
              style={[styles.label, { color: currentTheme.text }]}
              numberOfLines={1}
            >
              {personaName || 'Persona'}
            </CustomText>
          </View>
        );
        
      case 'pencil':
        return (
          <View style={styles.contentContainer}>
            <View style={[styles.pencilIcon, { 
              backgroundColor: '#8E44AD', // ⭐ Purple (이모지와 겹치지 않는 색상)
              borderColor: '#FFFFFF', // ✅ White border for contrast
            }]}>
              <CustomText style={styles.pencilEmoji}>✏️</CustomText>
            </View>
            <CustomText style={[styles.label, { color: currentTheme.text }]}>
              메시지
            </CustomText>
          </View>
        );
        
      case 'message':
        return (
          <View style={styles.contentContainer}>
            <View style={[styles.messageIcon, { 
              backgroundColor: '#FF6B9D', // ⭐ Gradient-like pink theme
              borderColor: '#FFFFFF', // ✅ White border for contrast
            }]}>
              <CustomText style={styles.messageEmoji}>✉️</CustomText>
            </View>
            <CustomText style={[styles.label, { color: currentTheme.text }]}>
              메시지
            </CustomText>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPressIn={handlePressIn}
      onPress={handlePress}
    >
      {renderContent()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    // Size
    width: TAB_BAR.CENTER_BUTTON_SIZE,
    height: TAB_BAR.CENTER_BUTTON_SIZE,
    
    // Position (will be placed by TabBar)
    alignItems: 'center',
    justifyContent: 'center',
    
    // No background, no border, no shadow
    // Only the icon circle will have visual presence
    backgroundColor: 'transparent',
    
    // ✅ elevation 제거 (BottomSheet가 위로 올라가도록)
    // zIndex와 elevation 없음
  },
  
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Empty State (+)
  // ═══════════════════════════════════════════════════════════════════════════
  emptyIcon: {
    width: TAB_BAR.CENTER_BUTTON_ICON_SIZE,
    height: TAB_BAR.CENTER_BUTTON_ICON_SIZE,
    borderRadius: TAB_BAR.CENTER_BUTTON_ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(2),
    // ✅ Border for visual clarity (color applied dynamically)
    borderWidth: 2,
  },
  
  plusIcon: {
    fontSize: scale(32),
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: scale(32),
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SAGE State
  // ═══════════════════════════════════════════════════════════════════════════
  sageIcon: {
    width: TAB_BAR.CENTER_BUTTON_ICON_SIZE,
    height: TAB_BAR.CENTER_BUTTON_ICON_SIZE,
    borderRadius: TAB_BAR.CENTER_BUTTON_ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(2),
    position: 'relative',
    // ✅ Border for visual clarity (color applied dynamically)
    borderWidth: 2,
  },
  
  sageEmoji: {
    fontSize: scale(24),
    lineHeight: scale(24),
  },
  
  sageHeart: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: scale(16),
    lineHeight: scale(16),
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Persona State
  // ═══════════════════════════════════════════════════════════════════════════
  personaIcon: {
    width: TAB_BAR.CENTER_BUTTON_ICON_SIZE,
    height: TAB_BAR.CENTER_BUTTON_ICON_SIZE,
    borderRadius: TAB_BAR.CENTER_BUTTON_ICON_SIZE / 2,
    borderWidth: 2, // ✅ Consistent with other states (1-2px)
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(2),
    overflow: 'hidden',
  },
  
  personaImage: {
    width: '100%',
    height: '100%',
    borderRadius: TAB_BAR.CENTER_BUTTON_ICON_SIZE / 2,
  },
  
  personaVideo: {
    width: '100%',
    height: '100%',
    borderRadius: TAB_BAR.CENTER_BUTTON_ICON_SIZE / 2,
  },
  
  personaPlaceholder: {
    fontSize: Platform.OS === 'ios' ? scale(20) : scale(24),
    lineHeight: scale(24),
    
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Pencil State (Writing)
  // ═══════════════════════════════════════════════════════════════════════════
  pencilIcon: {
    width: TAB_BAR.CENTER_BUTTON_ICON_SIZE,
    height: TAB_BAR.CENTER_BUTTON_ICON_SIZE,
    borderRadius: TAB_BAR.CENTER_BUTTON_ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(2),
    // ✅ Border for visual clarity (color applied dynamically)
    borderWidth: 2,
  },
  
  pencilEmoji: {
    fontSize: scale(26),
    lineHeight: scale(26),
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Message State (Completed)
  // ═══════════════════════════════════════════════════════════════════════════
  messageIcon: {
    width: TAB_BAR.CENTER_BUTTON_ICON_SIZE,
    height: TAB_BAR.CENTER_BUTTON_ICON_SIZE,
    borderRadius: TAB_BAR.CENTER_BUTTON_ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(2),
    // ✅ Border for visual clarity (color applied dynamically)
    borderWidth: 2,
  },
  
  messageEmoji: {
    fontSize: scale(28),
    lineHeight: scale(28),
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Label
  // ═══════════════════════════════════════════════════════════════════════════
  label: {
    fontSize: scale(10),
    fontWeight: '600',
    marginTop: verticalScale(2),
    maxWidth: TAB_BAR.CENTER_BUTTON_SIZE - scale(8),
    textAlign: 'center',
  },
});

// ✅ Memoize to prevent unnecessary re-renders
export default memo(CenterAIButton, (prevProps, nextProps) => {
  return (
    prevProps.state === nextProps.state &&
    prevProps.personaImageUrl === nextProps.personaImageUrl &&
    prevProps.personaVideoUrl === nextProps.personaVideoUrl &&
    prevProps.personaName === nextProps.personaName
  );
});

