/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 CenterAIButton Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The revolutionary center AI button that embodies ANIMA's philosophy:
 * "AI at the center of human connection"
 * 
 * Features:
 * - 3 States: Empty (+), SAGE (Manager), Persona (Face)
 * - Semi-circle design (top rounded)
 * - Pulse animation for empty state
 * - Smooth state transitions
 * - Touch feedback
 * 
 * States:
 * 1. Empty: Animated '+' icon with pulse (no persona selected)
 * 2. SAGE: Manager AI logo with blue theme
 * 3. Persona: Persona face image with theme color border
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { TAB_BAR } from '../../constants/layout';
import { scale, verticalScale } from '../../utils/responsive-utils';
import CustomText from '../CustomText';

/**
 * CenterAIButton Component
 * @param {Object} props
 * @param {string} props.state - 'empty' | 'sage' | 'persona'
 * @param {string} props.personaImageUrl - Persona image URL (if state is 'persona')
 * @param {string} props.personaName - Persona name (if state is 'persona')
 * @param {Function} props.onPress - Press handler
 */
const CenterAIButton = ({ 
  state = 'sage', // 'empty' | 'sage' | 'persona'
  personaImageUrl = null,
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
              {personaImageUrl ? (
                <Image
                  source={{ uri: personaImageUrl }}
                  style={styles.personaImage}
                  resizeMode="cover"
                />
              ) : (
                <CustomText style={styles.personaPlaceholder}>🎭</CustomText>
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
        
      default:
        return null;
    }
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
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
  
  personaPlaceholder: {
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

export default CenterAIButton;

