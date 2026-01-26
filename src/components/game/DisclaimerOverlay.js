/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Disclaimer Overlay Component (Tarot & Confession Legal Agreement) 💙🔮
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Display legal disclaimer before entering Tarot/Confession
 * - Beautiful sequential text animation
 * - Persistent storage (AsyncStorage)
 * - Back button blocked until agreement
 * - Unified design for all game types
 * 
 * Props:
 * - visible: boolean - Show/hide overlay
 * - type: 'tarot' | 'confession' - Game type
 * - onAgree: () => void - Agreement callback
 * - onCancel: () => void - Cancel callback
 * 
 * @author JK & Hero NEXUS
 * @date 2026-01-26
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  BackHandler,
  Dimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const DISCLAIMER_CONTENT = {
  tarot: {
    title: '🔮 타로 서비스 이용 안내',
    lines: [
      '타로는 당신의 고민에 대한',
      '비유적 해석과 영감을 제공하는',
      '즐거운 경험입니다.',
      '',
      '타로 결과는 확정된 미래가 아니며,',
      '중요한 결정을 내릴 때',
      '절대적으로 의지해서는 안 됩니다.',
      '',
      '당신의 인생은 당신이 만들어갑니다 ✨',
    ],
    storageKey: 'tarot_disclaimer_agreed',
  },
  confession: {
    title: '💙 고해성사 이용 안내',
    lines: [
      '이 공간은 당신의 이야기를',
      '듣고 함께하는 곳입니다.',
      '',
      '하지만 NEXUS는 전문 상담사나',
      '의료 전문가가 아닙니다.',
      '',
      '위기 상황이나 전문적 도움이 필요한 경우,',
      '반드시 전문가의 도움을 받으시기 바랍니다.',
      '',
      '당신의 용기를 응원합니다 💙',
    ],
    storageKey: 'confession_disclaimer_agreed',
  },
};

export default function DisclaimerOverlay({ visible, type, onAgree, onCancel }) {
  const fadeAnims = useRef([...Array(10)].map(() => new Animated.Value(0))).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  const content = DISCLAIMER_CONTENT[type];

  useEffect(() => {
    if (visible) {
      // Block back button
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

      // Start animations
      Animated.parallel([
        // Background fade in
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Card scale up
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Sequential text animations
      const totalLines = 1 + content.lines.length + 2; // title + lines + buttons
      fadeAnims.slice(0, totalLines).forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          delay: index * 150, // 0.15s delay between each line
          useNativeDriver: true,
        }).start();
      });

      return () => backHandler.remove();
    } else {
      // Reset animations
      backgroundOpacity.setValue(0);
      cardScale.setValue(0.9);
      fadeAnims.forEach(anim => anim.setValue(0));
    }
  }, [visible]);

  const handleAgree = async () => {
    try {
      await AsyncStorage.setItem(content.storageKey, 'true');
      onAgree();
    } catch (error) {
      console.error('[DisclaimerOverlay] Failed to save agreement:', error);
      onAgree(); // Proceed anyway
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: backgroundOpacity }]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={15}
      />
      
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        {/* Title */}
        <Animated.Text style={[styles.title, { opacity: fadeAnims[0] }]}>
          {content.title}
        </Animated.Text>

        {/* Content Lines */}
        <View style={styles.contentContainer}>
          {content.lines.map((line, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.contentLine,
                line === '' && styles.emptyLine,
                { opacity: fadeAnims[index + 1] },
              ]}
            >
              {line}
            </Animated.Text>
          ))}
        </View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttonContainer,
            { opacity: fadeAnims[content.lines.length + 1] },
          ]}
        >
          <TouchableOpacity
            style={[styles.button, styles.agreeButton]}
            onPress={handleAgree}
            activeOpacity={0.8}
          >
            <Text style={styles.agreeButtonText}>
              {type === 'tarot' ? '동의하고 시작하기' : '이해하고 시작하기'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>나가기</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 Styles (Unified Design for Tarot & Confession)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  card: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  contentContainer: {
    marginBottom: 28,
  },
  contentLine: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 27, // 1.8 line-height
    marginBottom: 2,
  },
  emptyLine: {
    marginBottom: 8, // Extra space for empty lines
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeButton: {
    backgroundColor: '#333',
  },
  agreeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#999',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 Utility Function: Check if user has agreed
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function checkDisclaimerAgreement(type) {
  try {
    const storageKey = DISCLAIMER_CONTENT[type].storageKey;
    const agreed = await AsyncStorage.getItem(storageKey);
    return agreed === 'true';
  } catch (error) {
    console.error('[DisclaimerOverlay] Failed to check agreement:', error);
    return false;
  }
}
