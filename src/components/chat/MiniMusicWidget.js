/**
 * 🎵 MiniMusicWidget - Floating Music Control Widget
 * 
 * Features:
 * - Mini floating widget in top-right corner
 * - Sound wave animation (3 pulsing circles)
 * - Tap: Toggle play/pause
 * - Long press: Stop music & hide widget
 * - Visual feedback with haptics
 * 
 * @author JK & Hero AI
 * @date 2026-01-04
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, moderateScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';

/**
 * Sound Wave Circle Component
 * - Animated circle that expands and fades out
 */
const SoundWaveCircle = ({ delay = 0, isPlaying = true }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!isPlaying) {
      // Reset animation when paused
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      return;
    }

    // Delay before starting
    const startDelay = setTimeout(() => {
      // Create repeating animation
      const animation = Animated.loop(
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 2.5,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();

      return () => animation.stop();
    }, delay);

    return () => {
      clearTimeout(startDelay);
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    };
  }, [isPlaying, delay]);

  return (
    <Animated.View
      style={[
        styles.waveCircle,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

/**
 * Main Widget Component
 */
const MiniMusicWidget = ({ 
  isPlaying = false, 
  onToggle,
  onStop,
  visible = true,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  useEffect(() => {
    if (visible) {
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Pulse animation for center icon
  useEffect(() => {
    if (!isPlaying) {
      pulseAnim.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [isPlaying]);

  const handlePress = () => {
    HapticService.trigger('impactLight');
    onToggle?.();
  };

  const handleLongPress = () => {
    HapticService.trigger('impactMedium');
    onStop?.();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: fadeAnim }],
        },
      ]}
    >
      {/* Sound Wave Circles (3 layers) */}
      {isPlaying && (
        <>
          <SoundWaveCircle delay={0} isPlaying={isPlaying} />
          <SoundWaveCircle delay={400} isPlaying={isPlaying} />
          <SoundWaveCircle delay={800} isPlaying={isPlaying} />
        </>
      )}

      {/* Center Button */}
      <TouchableOpacity
        style={[
          styles.button,
          isPlaying ? styles.buttonPlaying : styles.buttonPaused,
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={800}
        activeOpacity={0.7}
      >
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
        >
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size={moderateScale(24)}
            color="#fff"
          />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: scale(20), // Below header
    right: scale(16),
    width: scale(30),
    height: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  waveCircle: {
    position: 'absolute',
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    borderWidth: 2,
    borderColor: '#10B981', // Green
    backgroundColor: 'transparent',
  },
  button: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonPlaying: {
    backgroundColor: 'rgba(16, 185, 129, 0.95)', // Green (playing)
  },
  buttonPaused: {
    backgroundColor: 'rgba(107, 114, 128, 0.95)', // Gray (paused)
  },
});

export default MiniMusicWidget;

