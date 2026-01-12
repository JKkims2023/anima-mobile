/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 PersonaSwipeViewer Component (SIMPLIFIED - SWIPE ONLY)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Swipeable persona viewer (PERSONAS ONLY - NO SAGE)
 * 
 * Features:
 * - ⭐ FlashList with vertical paging (optimized performance!)
 * - Auto-optimized rendering (no extraData needed)
 * - Pagination indicators
 * - Haptic feedback on swipe
 * - Smooth animations
 * - ✅ NO CHAT LOGIC (handled by PersonaChatView inside each card)
 * 
 * @author JK & Hero AI
 * @date 2024-11-22
 * @updated 2025-01-09 - Migrated from FlatList to FlashList
 */

import React, { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import {
  View,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnima } from '../../contexts/AnimaContext'; // ⭐ NEW: For user_key
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
 * @param {boolean} props.isScreenActive - Whether the screen is active (for background performance optimization)
 * @param {number} props.initialIndex - Initial selected index (for restoration)
 * @param {Function} props.onIndexChange - Callback when index changes
 * @param {Animated.Value} props.modeOpacity - Opacity animation value from parent
 * @param {Function} props.onChatWithPersona - Callback when "Chat with this 자아" is pressed
 * @param {boolean} props.enabled - Whether swipe gestures are enabled (default: true)
 * @param {number} props.availableHeight - Available height (excluding header, tabbar, etc.)
 * @param {boolean} props.refreshing - Whether the list is refreshing (pull-to-refresh)
 * @param {Function} props.onRefresh - Callback when user pulls to refresh
 * @param {Object} props.user - User object (from parent, for chips)
 */
const PersonaSwipeViewer = forwardRef(({ 
  personas,
  isModeActive = true, 
  isScreenFocused = true,
  isScreenActive = true, // ⭐ NEW: For background performance optimization
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
  filterMode = 'default',
  refreshing = false, // ⭐ NEW: Pull-to-refresh state
  onRefresh = () => {}, // ⭐ NEW: Pull-to-refresh callback (refreshes persona list with relationship data!)
  personaCardRefs = null, // ⭐ NEW: Refs for PersonaCardView (for flip animation control)
  onPostcardFlipChange, // ⭐ NEW: Callback when postcard flip state changes
  isPostcardVisible = false, // ⭐ NEW: Whether postcard is currently visible
  user: userProp, // ⭐ NEW: User from parent (PersonaStudioScreen)
  onMarkAsRead, // ⭐ NEW: Callback when comment is marked as read
  // ⚡ REMOVED: chipsRefreshKey (no longer needed!)
}, ref) => {
  const { currentTheme } = useTheme();
  const { user: userContext } = useAnima(); // Context user as fallback
  
  // ⭐ Use prop user first (from PersonaStudioScreen), fallback to context
  const user = userProp || userContext;
  
  const flatListRef = useRef(null);
  // 🔥 PERF FIX: Remove internal selectedIndex state (use initialIndex directly from props!)
  // Internal state was causing duplicate renders after scroll animation completes
  // 🔥 CRITICAL FIX: Default to 0 if initialIndex is undefined (prevents always-true comparisons!)
  const selectedIndex = initialIndex ?? 0; // ← Use prop directly with fallback (no state!)
  const isInitialMount = useRef(true);
  
  // 🔥 PERFORMANCE DEBUG: Render counter with timestamp (AFTER selectedIndex declaration!)
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  if (__DEV__) {
    const timestamp = Date.now();
    console.log(`🔥 [PersonaSwipeViewer] Render #${renderCountRef.current}, personas: ${personas?.length}, selectedIndex: ${selectedIndex}, isModeActive: ${isModeActive} @ ${timestamp}`);
  }
  const lastScrolledIndex = useRef(initialIndex);
  const { t } = useTranslation();
  
  // ⭐ DEBUG: Check user in PersonaSwipeViewer
  useEffect(() => {

  }, [userProp, userContext, user]);

  
  // ⭐ Expose scrollToIndex method to parent
  useImperativeHandle(ref, () => ({
    scrollToIndex: ({ index, animated = true }) => {
      if (flatListRef.current && index >= 0 && index < personas.length) {
        flatListRef.current.scrollToIndex({ index, animated });
        // 🔥 REMOVED: setSelectedIndex(index); - Parent manages via initialIndex
        lastScrolledIndex.current = index;
      }
    },
  }));
  
  // ⭐ Handle scroll to top (from PersonaInfoCard)
  const handleScrollToTop = useCallback(() => {
    if (flatListRef.current && personas.length > 0) {
      flatListRef.current.scrollToIndex({ index: 0, animated: true });
      // 🔥 REMOVED: setSelectedIndex(0); - Parent manages via initialIndex
      onIndexChange(0); // ✅ Notify parent instead
      lastScrolledIndex.current = 0;
      HapticService.medium();
    }
  }, [personas.length, onIndexChange]);
  
  // ⭐ DEBUG: Log enabled prop changes
  useEffect(() => {
    
  }, [enabled]);

  // ⭐ DEBUG: Log isScreenFocused prop changes
  useEffect(() => {
    
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
        
      }, 100);
      
      isInitialMount.current = false;
    }
  }, [initialIndex]);

  // ⭐ NEW: Listen to external index changes (from PersonaSelectorHorizontal)
  useEffect(() => {
    if (!isInitialMount.current && initialIndex !== lastScrolledIndex.current && flatListRef.current) {
      
      // Scroll to new index with animation
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: true, // Smooth animation for user-triggered changes
        });
        
        // 🔥 REMOVED: setSelectedIndex(initialIndex); - Parent manages via initialIndex prop
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
      // 🔥 PERF FIX: Don't update internal state! Parent manages index via initialIndex prop
      // setSelectedIndex(index); // ← REMOVED! This was causing double renders
      onIndexChange(index); // ✅ Notify parent only

    }
  }, [selectedIndex, personas, onIndexChange, availableHeight]);

  // ✅ Current persona
  const currentPersona = personas && personas[selectedIndex] ? personas[selectedIndex] : null;

  // ⭐ NEW: Calculate snap offsets for paging effect (memoized)
  const snapToOffsets = useMemo(() => {
    return personas.map((_, index) => index * availableHeight);
  }, [personas.length, availableHeight]);
  
  // 🔥 PERF: extraData for FlashList (explicit re-render control)
  const flashListExtraData = useMemo(() => ({
    selectedIndex,
    isModeActive,
    isScreenFocused,
    isScreenActive,
  }), [selectedIndex, isModeActive, isScreenFocused, isScreenActive]);

  // ✅ Render each persona card (VIDEO/IMAGE ONLY - NO CHAT)
  const renderPersona = useCallback(({ item, index }) => {
    const isActive = index === selectedIndex && isModeActive;
    
    return (
      <View style={[styles.personaItemContainer, { height: Platform.OS === 'ios' ? availableHeight  : availableHeight }]}>
        <PersonaCardView 
          ref={(ref) => {
            if (personaCardRefs && item.persona_key) {
              personaCardRefs.current[item.persona_key] = ref;
            }
          }}
          persona={item} 
          isActive={isActive}
          isScreenFocused={isScreenFocused}
          isScreenActive={isScreenActive} // ⭐ NEW: Pass down for performance optimization
          modeOpacity={modeOpacity}
          availableHeight={availableHeight}
          onCheckStatus={onCheckStatus}
          onFlipChange={onPostcardFlipChange} // ⭐ NEW: Pass flip change callback
          user={userProp} // ⭐ NEW: Pass user for PostcardBack API call
          onMarkAsRead={onMarkAsRead} // ⭐ NEW: Pass callback for comment read
        />
      </View>
    );
  }, [selectedIndex, isModeActive, isScreenFocused, isScreenActive, modeOpacity, availableHeight, onCheckStatus, onPostcardFlipChange, userProp, onMarkAsRead, personaCardRefs]);

  // ✅ Key extractor (optimized)
  // ⭐ CRITICAL FIX: Include done_yn in key to force re-render when status changes
  // This prevents FlashList from reusing components with stale BlurView state
  const keyExtractor = useCallback((item) => `${item.persona_key}-${item.done_yn}`, []);

  const handleCreatePersona = useCallback(() => {
    
    onCreatePersona();

  }, []);

  // Empty state (no personas)
  if (!personas || personas.length === 0) {
    return (
      <>

      <View style={[styles.container, styles.centered]}>
        
        <ActivityIndicator size="large" color={currentTheme.mainColor} />

        <CustomText type="title" style={{ color: currentTheme.mainColor,  textAlign: 'center', marginTop: verticalScale(16), marginBottom: verticalScale(100) }}>
          {t('common.loading_detail')}
        </CustomText>

    </View>
   </>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ FlashList - Optimized for VERTICAL paging (TikTok/YouTube Shorts style) */}
      {/* ⭐ FlashList benefits: Auto-optimized, no extraData needed, smoother scrolling */}
      {/* ⭐ CRITICAL: FlashList needs explicit width & height! */}
      <FlashList
        ref={flatListRef}
        data={personas}
        renderItem={renderPersona}
        keyExtractor={keyExtractor}
        extraData={flashListExtraData} // 🔥 PERF: Explicit re-render control
        estimatedItemSize={availableHeight} // ⭐ CRITICAL: Required for FlashList (each persona takes full height)
        scrollEnabled={enabled && !isPostcardVisible} // ⭐ Disable scroll when postcard is visible
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollToIndexFailed={(info) => {
          
          
          // Fallback: scroll to offset
          flatListRef.current?.scrollToOffset({
            offset: info.index * availableHeight,
            animated: false,
          });
        }}
        decelerationRate="fast"
        snapToOffsets={snapToOffsets} // ⭐ NEW: Replaces pagingEnabled for FlashList
        snapToAlignment="start"
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            enabled={!isPostcardVisible} // ⭐ Disable pull-to-refresh when postcard is visible
            tintColor={currentTheme.mainColor || '#4285F4'}
            colors={[currentTheme.mainColor || '#4285F4']}
            progressBackgroundColor={currentTheme.backgroundColor || '#000'}
          />
        }
      />

      {/* PersonaInfoCard (with Pagination & Scroll to Top) */}
      {personas.length > 0 && !isPostcardVisible && (
        <PersonaInfoCard 
          persona={currentPersona} 
          onChatPress={onChatWithPersona}
          onFavoriteToggle={onFavoriteToggle}
          currentIndex={selectedIndex} // ⭐ Current persona index
          totalCount={personas.length} // ⭐ Total personas count
          onScrollToTop={handleScrollToTop} // ⭐ NEW: Scroll to top handler
          user={user} // ⭐ NEW: Pass user for relationship chips
          // ⚡ REMOVED: chipsRefreshKey (data is now in persona list!)
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH, // ⭐ CRITICAL: Explicit width for FlashList
    // ⚠️ REMOVED: alignItems & justifyContent (breaks FlashList layout)
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personaItemContainer: {
    width: SCREEN_WIDTH,
    // height는 renderPersona에서 동적으로 설정됨 (availableHeight)
  },
  // ⭐ Pagination styles removed - now in PersonaTypeSelector!
});

export default PersonaSwipeViewer;
