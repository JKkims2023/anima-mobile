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

import React, { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale } from '../../utils/responsive-utils';
import CustomText from '../CustomText';
import PersonaCardView from './PersonaCardView';
import PersonaInfoCard from './PersonaInfoCard';
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * PersonaSwipeViewer Component
 * @param {Object} props
 * @param {Array} props.personas - 자아 목록 (SAGE 제외)
 * @param {boolean} props.isModeActive - Whether persona mode is active
 * @param {boolean} props.isScreenFocused - Whether the screen is focused (for video playback)
 * @param {number} props.initialIndex - Initial selected index (for restoration)
 * @param {Function} props.onIndexChange - Callback when index changes
 * @param {Animated.Value} props.modeOpacity - Opacity animation value from parent
 * @param {Function} props.onChatWithPersona - Callback when "Chat with this 자아" is pressed
 * @param {boolean} props.enabled - Whether swipe gestures are enabled (default: true)
 * @param {number} props.availableHeight - Available height (excluding header, tabbar, etc.)
 */
const PersonaSwipeViewer = forwardRef(({ 
  personas,
  isModeActive = true, 
  isScreenFocused = true,
  initialIndex = 0,
  onIndexChange = () => {},
  modeOpacity, 
  onChatWithPersona,
  onFavoriteToggle,
  onCheckStatus, // ⭐ NEW: Check persona status handler
  enabled = true,
  isMessageMode = false,
  availableHeight = SCREEN_HEIGHT,
  onCreatePersona = () => {},
}, ref) => {
  const { currentTheme } = useTheme();
  
  
  const flatListRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const isInitialMount = useRef(true);
  const lastScrolledIndex = useRef(initialIndex);
  const { t } = useTranslation();

  
  // ⭐ Expose scrollToIndex method to parent
  useImperativeHandle(ref, () => ({
    scrollToIndex: ({ index, animated = true }) => {
      if (flatListRef.current && index >= 0 && index < personas.length) {
        flatListRef.current.scrollToIndex({ index, animated });
        setSelectedIndex(index);
        lastScrolledIndex.current = index;
      }
    },
  }));
  
  // ⭐ DEBUG: Log enabled prop changes
  useEffect(() => {
    if (__DEV__) {
      console.log('[PersonaSwipeViewer] 🔓 Swipe enabled:', enabled);
    }
  }, [enabled]);

  // ⭐ DEBUG: Log isScreenFocused prop changes
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎥 [PersonaSwipeViewer] isScreenFocused changed:', isScreenFocused);
    console.log('  - Current persona:', currentPersona?.persona_name);
    console.log('  - Will pass to PersonaCardView:', isScreenFocused);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, [isScreenFocused, currentPersona]);

  // ✅ Restore saved index on mount (after remount from screen focus)
  useEffect(() => {
    if (isInitialMount.current && initialIndex > 0 && flatListRef.current) {
      // Delay to ensure FlatList is fully rendered
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false, // No animation for restoration
        });
        
        if (__DEV__) {
          console.log('[PersonaSwipeViewer] 🔄 Restored index:', initialIndex);
        }
      }, 100);
      
      isInitialMount.current = false;
    }
  }, [initialIndex]);

  // ⭐ NEW: Listen to external index changes (from PersonaSelectorHorizontal)
  useEffect(() => {
    if (!isInitialMount.current && initialIndex !== lastScrolledIndex.current && flatListRef.current) {
      if (__DEV__) {
        console.log('[PersonaSwipeViewer] 🎯 External index change detected:', initialIndex);
      }
      
      // Scroll to new index with animation
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: true, // Smooth animation for user-triggered changes
        });
        
        setSelectedIndex(initialIndex);
        lastScrolledIndex.current = initialIndex;
      }, 50);
    }
  }, [initialIndex]);

  // ✅ Handle swipe (change persona) - VERTICAL
  const handleMomentumScrollEnd = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / availableHeight);

    if (index !== selectedIndex) {
      HapticService.selection();
      setSelectedIndex(index);
      onIndexChange(index); // ✅ Notify parent

      if (__DEV__ && personas && personas[index]) {
        console.log('[PersonaSwipeViewer] 📱 Swiped to:', personas[index].persona_name);
      }
    }
  }, [selectedIndex, personas, onIndexChange, availableHeight]);

  // ✅ Current persona
  const currentPersona = personas && personas[selectedIndex] ? personas[selectedIndex] : null;

  // ✅ Render each persona card (VIDEO/IMAGE ONLY - NO CHAT)
  const renderPersona = useCallback(({ item, index }) => {
    const isActive = index === selectedIndex && isModeActive;
    
    return (
      <View style={[styles.personaItemContainer, { height: availableHeight }]}>
        <PersonaCardView 
          persona={item} 
          isActive={isActive}
          isScreenFocused={isScreenFocused}
          modeOpacity={modeOpacity}
          availableHeight={availableHeight}
          onCheckStatus={onCheckStatus}
        />
      </View>
    );
  }, [selectedIndex, isModeActive, isScreenFocused, modeOpacity, availableHeight, onCheckStatus]);

  // ✅ Key extractor (optimized)
  const keyExtractor = useCallback((item) => item.persona_key, []);

  const handleCreatePersona = useCallback(() => {
    
    onCreatePersona();

  }, []);

  // Empty state (no personas)
  if (!personas || personas.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        
        <CustomText type="title" style={{ color: currentTheme.textSecondary, marginTop: 16 }}>
          {t('persona.no_personas')}
        </CustomText>
        <TouchableOpacity onPress={handleCreatePersona}>
          <CustomText type="title" style={{ color: currentTheme.mainColor, marginTop: 8, textAlign: 'center' }}>
            {t('persona.create_persona')}
          </CustomText>
        </TouchableOpacity>
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
        extraData={`${isScreenFocused}-${selectedIndex}`} // ⭐ Force re-render when isScreenFocused OR selectedIndex changes
        vertical
        pagingEnabled
        scrollEnabled={enabled} // ⭐ Control swipe gestures
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollToIndexFailed={(info) => {
          // Handle scrollToIndex failure (item not rendered yet)
          if (__DEV__) {
            console.warn('[PersonaSwipeViewer] ⚠️ scrollToIndex failed:', info);
          }
          
          // Fallback: scroll to offset
          flatListRef.current?.scrollToOffset({
            offset: info.index * availableHeight,
            animated: false,
          });
        }}
        decelerationRate="fast"
        snapToAlignment="start"
        snapToInterval={availableHeight}
        scrollEventThrottle={16}
        removeClippedSubviews={false} // ⭐ CRITICAL: Keep all items mounted for prop updates (no scroll position reset)
        maxToRenderPerBatch={3} // ⭐ Increased from 1 for smoother updates
        initialNumToRender={3} // ⭐ Increased from 1 for smoother updates
        windowSize={5} // ⭐ Increased from 3 for smoother updates
        getItemLayout={(data, index) => ({
          length: availableHeight,
          offset: availableHeight * index,
          index,
        })}
      />

      {/* Pagination Indicator */}
        {personas.length > 1 && !isMessageMode && (
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

      {/* PersonaInfoCard */}
      {personas.length > 0 && (
        <PersonaInfoCard 
          persona={currentPersona} 
          onChatPress={onChatWithPersona}
          onFavoriteToggle={onFavoriteToggle}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  personaItemContainer: {
    width: SCREEN_WIDTH,
    // height는 renderPersona에서 동적으로 설정됨 (availableHeight)
  },
  paginationContainer: {
    position: 'absolute',
    left: scale(10),
    top: '25%',
    transform: [{ translateY: -40 }],
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingLeft: scale(10),
    paddingRight: scale(10),
    paddingTop: scale(10),
    paddingBottom: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'solid',
    borderRadius: scale(16),

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
