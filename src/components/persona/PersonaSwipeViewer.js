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
  onRefresh = () => {}, // ⭐ NEW: Pull-to-refresh callback
  personaCardRefs = null, // ⭐ NEW: Refs for PersonaCardView (for flip animation control)
  onPostcardFlipChange, // ⭐ NEW: Callback when postcard flip state changes
  isPostcardVisible = false, // ⭐ NEW: Whether postcard is currently visible
  user: userProp, // ⭐ NEW: User from parent (PersonaStudioScreen)
}, ref) => {
  const { currentTheme } = useTheme();
  const { user: userContext } = useAnima(); // Context user as fallback
  
  // ⭐ Use prop user first (from PersonaStudioScreen), fallback to context
  const user = userProp || userContext;
  
  
  const flatListRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const isInitialMount = useRef(true);
  const lastScrolledIndex = useRef(initialIndex);
  const { t } = useTranslation();
  
  // ⭐ DEBUG: Check user in PersonaSwipeViewer
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 [PersonaSwipeViewer] User Check:');
    console.log('   userProp (from parent):', userProp);
    console.log('   userProp?.user_key:', userProp?.user_key);
    console.log('   userContext (from AnimaContext):', userContext);
    console.log('   userContext?.user_key:', userContext?.user_key);
    console.log('   Final user:', user);
    console.log('   Final user?.user_key:', user?.user_key);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, [userProp, userContext, user]);

  
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
  
  // ⭐ Handle scroll to top (from PersonaInfoCard)
  const handleScrollToTop = useCallback(() => {
    if (flatListRef.current && personas.length > 0) {
      flatListRef.current.scrollToIndex({ index: 0, animated: true });
      setSelectedIndex(0);
      lastScrolledIndex.current = 0;
      HapticService.medium();
    }
  }, [personas.length]);
  
  // ⭐ DEBUG: Log enabled prop changes
  useEffect(() => {
    if (__DEV__) {
      console.log('[PersonaSwipeViewer] 🔓 Swipe enabled:', enabled);
    }
  }, [enabled]);

  // ⭐ DEBUG: Log isScreenFocused prop changes
  useEffect(() => {
    /*
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎥 [PersonaSwipeViewer] isScreenFocused changed:', isScreenFocused);
    console.log('  - Current persona:', currentPersona?.persona_name);
    console.log('  - Will pass to PersonaCardView:', isScreenFocused);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    */
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
         // console.log('[PersonaSwipeViewer] 🔄 Restored index:', initialIndex);
        }
      }, 100);
      
      isInitialMount.current = false;
    }
  }, [initialIndex]);

  // ⭐ NEW: Listen to external index changes (from PersonaSelectorHorizontal)
  useEffect(() => {
    if (!isInitialMount.current && initialIndex !== lastScrolledIndex.current && flatListRef.current) {
      if (__DEV__) {
       // console.log('[PersonaSwipeViewer] 🎯 External index change detected:', initialIndex);
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
       // console.log('[PersonaSwipeViewer] 📱 Swiped to:', personas[index].persona_name);
      }
    }
  }, [selectedIndex, personas, onIndexChange, availableHeight]);

  // ✅ Current persona
  const currentPersona = personas && personas[selectedIndex] ? personas[selectedIndex] : null;

  // ⭐ NEW: Calculate snap offsets for paging effect (memoized)
  const snapToOffsets = useMemo(() => {
    return personas.map((_, index) => index * availableHeight);
  }, [personas.length, availableHeight]);

  // ✅ Render each persona card (VIDEO/IMAGE ONLY - NO CHAT)
  const renderPersona = useCallback(({ item, index }) => {
    const isActive = index === selectedIndex && isModeActive;
    
    return (
      <View style={[styles.personaItemContainer, { height: availableHeight }]}>
        <PersonaCardView 
          ref={(ref) => {
            if (personaCardRefs && item.persona_key) {
              personaCardRefs.current[item.persona_key] = ref;
            }
          }}
          persona={item} 
          isActive={isActive}
          isScreenFocused={isScreenFocused}
          modeOpacity={modeOpacity}
          availableHeight={availableHeight}
          onCheckStatus={onCheckStatus}
          onFlipChange={onPostcardFlipChange} // ⭐ NEW: Pass flip change callback
        />
      </View>
    );
  }, [selectedIndex, isModeActive, isScreenFocused, modeOpacity, availableHeight, onCheckStatus]);

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
      {filterMode === 'user' ? (
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
    
      ) : (

      <View style={[styles.container, styles.centered]}>
            
      <CustomText type="title" style={{ color: currentTheme.textSecondary, marginTop: 16 }}>
        {t('persona.no_favorite_personas')}
      </CustomText>
      <View style={{ marginTop: 8, textAlign: 'center', marginLeft: verticalScale(20), marginRight: verticalScale(20) }}>
        <CustomText type="middle" style={{ color: currentTheme.mainColor, marginTop: 8, textAlign: 'center' }}>
          {t('persona.create_favorite_persona')}
        </CustomText>
      </View>
    </View>
    )}
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
