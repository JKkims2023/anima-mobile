/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 PersonaSwipeViewer Component (SIMPLIFIED - SWIPE ONLY)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Swipeable persona viewer (PERSONAS ONLY - NO SAGE)
 * 
 * Features:
 * - FlatList with horizontal paging
 * - Optimized rendering (windowSize: 3)
 * - Pagination indicators
 * - Haptic feedback on swipe
 * - Smooth animations
 * - ✅ NO CHAT LOGIC (handled by PersonaChatView inside each card)
 * 
 * @author JK & Hero AI
 * @date 2024-11-22
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../contexts/ChatContext';
import { scale, verticalScale } from '../../utils/responsive-utils';
import CustomText from '../CustomText';
import PersonaCardView from './PersonaCardView';
import PersonaChatView from '../chat/PersonaChatView';
import HapticService from '../../utils/HapticService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * PersonaSwipeViewer Component
 * @param {Object} props
 * @param {Array} props.personas - Personas to display (WITHOUT SAGE)
 * @param {boolean} props.isModeActive - Whether persona mode is active
 * @param {Animated.Value} props.modeOpacity - Opacity animation value from parent
 */
const PersonaSwipeViewer = ({ personas, isModeActive = true, modeOpacity, chatOpacity }) => {
  const { currentTheme } = useTheme();
  const { switchPersona } = useChat();
  
  const flatListRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // ✅ Switch to first persona on mount (if available)
  useEffect(() => {
    if (personas && personas.length > 0 && isModeActive) {
      const firstPersona = personas[0];
      if (firstPersona && firstPersona.persona_key) {
        switchPersona(firstPersona.persona_key, firstPersona.persona_name); // ✅ Pass persona name
        if (__DEV__) {
          console.log('[PersonaSwipeViewer] 🎯 Initial persona switched:', firstPersona.persona_name);
        }
      }
    }
  }, [personas, isModeActive, switchPersona]);

  // ✅ Handle swipe (change persona) - VERTICAL
  const handleMomentumScrollEnd = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / SCREEN_HEIGHT);

    if (index !== selectedIndex) {
      HapticService.selection();
      setSelectedIndex(index);

      if (personas && personas[index]) {
        const newPersona = personas[index];
        if (newPersona && newPersona.persona_key) {
          switchPersona(newPersona.persona_key, newPersona.persona_name); // ✅ Pass persona name
          if (__DEV__) {
            console.log('[PersonaSwipeViewer] 📱 Swiped to:', newPersona.persona_name);
          }
        }
      }
    }
  }, [selectedIndex, personas, switchPersona]);

  // ✅ Current persona
  const currentPersona = personas && personas[selectedIndex] ? personas[selectedIndex] : null;

  // ✅ Render each persona card (VIDEO/IMAGE ONLY - NO CHAT)
  const renderPersona = useCallback(({ item, index }) => {
    const isActive = index === selectedIndex && isModeActive;
    
    return (
      <View style={styles.personaItemContainer}>
        <PersonaCardView 
          persona={item} 
          isActive={isActive}
          modeOpacity={modeOpacity}
        />
      </View>
    );
  }, [selectedIndex, isModeActive, modeOpacity]);

  // ✅ Key extractor (optimized)
  const keyExtractor = useCallback((item) => item.persona_key, []);

  // Empty state (no personas)
  if (!personas || personas.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <CustomText type="big" style={{ color: currentTheme.textSecondary }}>
          🎭
        </CustomText>
        <CustomText type="normal" style={{ color: currentTheme.textSecondary, marginTop: 16 }}>
          페르소나가 없습니다
        </CustomText>
        <CustomText type="small" style={{ color: currentTheme.textSecondary, marginTop: 8 }}>
          중앙 버튼을 눌러 생성하세요
        </CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ FlatList - Optimized for VERTICAL paging (TikTok/YouTube Shorts style) */}
      <FlatList
        ref={flatListRef}
        data={personas}
        renderItem={renderPersona}
        keyExtractor={keyExtractor}
        vertical
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        decelerationRate="fast"
        snapToAlignment="start"
        snapToInterval={SCREEN_HEIGHT}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        maxToRenderPerBatch={1}
        initialNumToRender={1}
        windowSize={3}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />

      {/* Pagination Indicator */}
      {personas.length > 1 && (
        <View style={styles.paginationContainer} pointerEvents="none">
          {personas.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === selectedIndex 
                    ? (currentTheme.primary || '#4285F4')
                    : (currentTheme.textSecondary || '#888'),
                },
                index === selectedIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* ✅ PersonaChatView - OUTSIDE FlatList (like SAGE) */}
      {currentPersona && (
        <PersonaChatView 
          persona={currentPersona} 
          isPreview={!isModeActive}
          modeOpacity={modeOpacity}
          chatOpacity={chatOpacity}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  personaItemContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  paginationContainer: {
    position: 'absolute',
    right: scale(16),
    top: '50%',
    transform: [{ translateY: -50 }],
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginVertical: scale(6),
    opacity: 0.5,
  },
  paginationDotActive: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    opacity: 1,
  },
});

export default PersonaSwipeViewer;
