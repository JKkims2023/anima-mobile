/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FloatingContentButton
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Floating button for real-time generated content (image/music)
 * 
 * States:
 * - processing: 생성 중 (animated spinner)
 * - completed: 생성 완료 (clickable)
 * - failed: 생성 실패 (retry button)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // ✅ FIX: Use react-native-vector-icons (not Expo)
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

const { width } = Dimensions.get('window');

const FloatingContentButton = ({
  contentType = 'image', // 'image' | 'music'
  status = 'processing', // 'processing' | 'completed' | 'failed'
  isPlaying = false, // 🎵 NEW: For music player toggle
  onPress,
  onRetry,
  style,
}) => {
  const { currentTheme } = useTheme();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  // Fade in + Scale up + Slide in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Trigger haptic
    HapticService.trigger('impactLight');
  }, []);

  // Pulse animation for processing state or playing music
  useEffect(() => {
    if (status === 'processing' || (contentType === 'music' && isPlaying)) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
    }
  }, [status, contentType, isPlaying]); // 🎵 Added isPlaying dependency

  const handlePress = () => {
    if (status === 'completed') {
      HapticService.trigger('impactMedium');
      onPress?.();
    } else if (status === 'failed') {
      HapticService.trigger('impactLight');
      onRetry?.();
    }
  };

  // Icon based on type and status
  const getIcon = () => {
    if (status === 'failed') {
      return 'alert-circle-outline';
    }
    if (contentType === 'music') {
      // 🎵 Music player icons (speaker)
      if (status === 'processing') {
        return 'musical-notes-outline'; // Searching for music
      }
      return isPlaying ? 'volume-high' : 'volume-mute'; // Playing / Paused
    }
    return status === 'completed' ? 'images' : 'image-outline';
  };

  // Text based on status
  const getText = () => {
    if (status === 'processing') {
      return contentType === 'image' ? '이미지 생성 중...' : '음악 검색 중...';
    }
    if (status === 'completed') {
      if (contentType === 'image') {
        return '이미지 보기 👁️';
      }
      // 🎵 Music player text
      return isPlaying ? '재생 중 🎵' : '음악 재생 ▶️';
    }
    if (status === 'failed') {
      return '생성 실패 🔄';
    }
  };

  // Background color based on status
  const getBackgroundColor = () => {
    if (status === 'failed') {
      return COLORS.error; // Red for error
    }
    if (status === 'completed') {
      if (contentType === 'music' && isPlaying) {
        return '#FF6B6B'; // Vibrant red for playing music
      }
      return COLORS.primary; // Default primary
    }
    // 🎨 Processing: Semi-transparent dark background (not fully transparent!)
    return 'rgba(0, 0, 0, 0.75)'; // Dark semi-transparent
  };

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateX: slideAnim },
            { scale: (status === 'processing' || (contentType === 'music' && isPlaying)) ? pulseAnim : 1 },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: currentTheme.borderColor,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={status === 'processing'}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          {status === 'processing' ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Icon
              name={getIcon()}
              size={24}
              color={COLORS.white}
            />
          )}
        </View>

        {/* Text */}
        <Text style={styles.text}>{getText()}</Text>

        {/* Arrow for completed */}
        {status === 'completed' && (
          <Icon
            name="chevron-forward"
            size={20}
            color={COLORS.white}
            style={styles.arrow}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80, // 🎯 Top right (below header)
    right: 16,
    zIndex: 1000,
    // Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: width - 32,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  text: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  arrow: {
    marginLeft: 8,
  },
});

export default FloatingContentButton;

