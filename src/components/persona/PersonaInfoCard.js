/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 PersonaInfoCard Component (자아 정보 카드)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 자아 정보 카드 (Persona 탭 하단 고정)
 * - Row 레이아웃 (좌측: 이름+설명, 우측: 채팅 버튼)
 * - 그라디언트 배경 (하단 고정, margin/radius 없음)
 * - 큰 채팅 아이콘 (직관적)
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; // ⭐ NEW: For focus detection
import Icon from 'react-native-vector-icons/Ionicons';
import IconBrain from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import GradientOverlay from '../GradientOverlay';
import { useTranslation } from 'react-i18next';
import { useAnima } from '../../contexts/AnimaContext';
import { useTheme } from '../../contexts/ThemeContext'; // ⭐ NEW: For progress bar color
import PersonaIdentitySheet from './PersonaIdentitySheet'; // ⭐ NEW: Identity sheet
import RelationshipChipsContainer from './RelationshipChipsContainer'; // ⭐ NEW: Relationship chips
import ChipDetailSheet from './ChipDetailSheet'; // ⭐ OLD: Chip detail sheet (deprecated for emotion)
import EmotionDetailSheet from './chipSheets/EmotionDetailSheet'; // 😊 NEW (2026-01-19): Emotion detail sheet
import EmotionFloatingEffect from './EmotionFloatingEffect'; // ⭐ NEW: Floating effect at card level
/**
 * PersonaInfoCard Component (⚡ OPTIMIZED: Relationship data from persona!)
 * @param {Object} props
 * @param {Object} props.persona - 자아 object (includes relationship data!)
 * @param {Function} props.onChatPress - Callback when chat button is pressed
 * @param {Function} props.onFavoriteToggle - Callback when favorite is toggled
 * @param {Number} props.currentIndex - Current persona index (0-based)
 * @param {Number} props.totalCount - Total personas count
 * @param {Function} props.onScrollToTop - Callback to scroll to first persona
 * @param {Object} props.user - User object (passed from parent for chips)
 */
const PersonaInfoCard = React.memo(({ persona, onChatPress, onFavoriteToggle, currentIndex = 0, totalCount = 0, onScrollToTop, user: userProp }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showAlert, user: userContext } = useAnima(); // Context user as fallback
  const { currentTheme: theme } = useTheme(); // ⭐ NEW: For progress bar color
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  
  // ⭐ Use prop user first, fallback to context user
  const user = userProp || userContext;

  // ⭐ NEW: Identity sheet state
  const [showIdentitySheet, setShowIdentitySheet] = useState(false);
  
  // ⭐ NEW: Selected chip for detail sheet (lifted state)
  const [selectedChip, setSelectedChip] = useState(null);
  
  // 😊 NEW (2026-01-19): Emotion detail sheet state
  const [showEmotionDetail, setShowEmotionDetail] = useState(false);
  
  // ⭐ NEW: Screen focus state (for emotion animation)
  const [isFocused, setIsFocused] = useState(true);
  
  // ⭐ NEW: Emotion chip position (for floating effect)
  const [emotionChipLayout, setEmotionChipLayout] = useState(null);
  
  // ⭐ NEW: Detect screen focus/blur for emotion animation
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false); // Stop animation when screen loses focus
    }, [])
  );
  
  // ⭐ NEW: Handle emotion chip layout
  const handleEmotionChipLayout = useCallback((event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setEmotionChipLayout({ x, y, width, height });
  }, []);
  
  // ⭐ NEW: Get emotion emoji from state (Main chip display)
  // ✨ UPDATED (2026-01-19): 12 emotions (aligned with ANIMA emotion system)
  const getEmotionEmoji = (emotionalState) => {
    // 🔍 DEBUG: Log actual emotional_state value
    if (__DEV__) {
      console.log('🔍 [PersonaInfoCard] getEmotionEmoji called with:', emotionalState);
    }
    
    const emotionEmojis = {
      // Positive emotions
      happy: '😊',
      excited: '🤩',
      grateful: '🙏',
      hopeful: '🌟',
      affectionate: '💕',
      calm: '😌',
      
      // Neutral emotions
      neutral: '😐',
      confused: '😕',
      curious: '🤔',
      
      // Negative emotions
      sad: '😢',
      anxious: '😰',
      angry: '😠',
      
      // Legacy emotions (for backward compatibility)
      normal: '😐', // → neutral
      tired: '😴', // → calm
      hurt: '😢', // → sad
      worried: '😰', // → anxious
    };
    
    const emoji = emotionEmojis[emotionalState] || '😐';
    
    // 🔍 DEBUG: Log mapped emoji
    if (__DEV__) {
      console.log('🔍 [PersonaInfoCard] Mapped emoji:', emoji);
    }
    
    return emoji;
  };
  
  // ⭐ NEW: Get floating emojis based on EMOTIONAL STATE (Simple & Intuitive!)
  // ✨ UPDATED (2026-01-19): 12 emotions (aligned with ANIMA emotion system)
  const getFloatingEmojis = (personaData) => {
    const emotionalState = personaData?.emotional_state || 'normal';
    
    // 🔍 DEBUG: Log actual emotional_state value
    if (__DEV__) {
      console.log('🔍 [PersonaInfoCard] getFloatingEmojis called with:', emotionalState);
    }
    
    // ⭐ Strategy: Fixed emojis per emotion state (User can understand immediately!)
    switch (emotionalState) {
      // Positive emotions
      case 'happy':
        return ['❤️', '❤️', '❤️']; // Red hearts → "Persona is happy!"
      
      case 'excited':
        return ['🎉', '✨', '🎊']; // Party → "Persona is excited!"
      
      case 'grateful':
        return ['🙏', '💖', '🌟']; // Gratitude → "Persona is thankful!"
      
      case 'hopeful':
        return ['✨', '🌟', '💫']; // Sparkles → "Persona is hopeful!"
      
      case 'affectionate':
        return ['💕', '💖', '💗']; // Hearts → "Persona loves you!"
      
      case 'calm':
        return ['🌸', '☁️', '🍃']; // Peaceful → "Persona is calm"
      
      // Neutral emotions
      case 'neutral':
      case 'normal':
        return ['❔', '💭', '❔']; // Thinking → "Persona is neutral"
      
      case 'confused':
        return ['❓', '🤔', '❓']; // Question marks → "Persona is confused"
      
      case 'curious':
        return ['💡', '🔍', '💡']; // Light bulb → "Persona is curious!"
      
      // Negative emotions
      case 'sad':
      case 'hurt':
        return ['💔', '😢', '💔']; // Broken hearts → "Persona is sad..."
      
      case 'anxious':
      case 'worried':
        return ['😰', '💦', '😰']; // Worried → "Persona is anxious..."
      
      case 'angry':
        return ['💢', '😠', '💢']; // Anger symbols → "Persona is angry!"
      
      // Legacy emotions
      case 'tired':
        return ['💤', '😴', '💤']; // Sleepy → "Persona is tired"
      
      default:
        return ['❔', '💭', '❔']; // Default: Neutral
    }
  };

  // ⭐ All Hooks must be at the top (before any conditional returns)
  useEffect(() => {

  }, [persona,persona?.persona_key,persona?.done_yn]);
  

  useEffect(() => {

  }, [user?.user_key, persona?.persona_key]);
  
  // ✅ Handle chat button press
  const handleChatPress = () => {
    HapticService.medium();
    if (onChatPress) {
      onChatPress(persona);
    }
  };
  
  // ✅ Handle favorite toggle
  const handleFavoritePress = (e) => {

    if(persona?.done_yn === 'N') {
      showAlert({
        emoji: '⏳',
        title: t('persona.creation.still_processing_title'),
        message: t('persona.creation.still_processing_message'),
        buttons: [
          { text: t('common.confirm'), onPress: () => {} },
        ],
      });
      return;
    }
    e.stopPropagation(); // Prevent triggering parent onPress
    HapticService.light();
    if (onFavoriteToggle) {
      onFavoriteToggle(persona);
    }
  };
  const handleBrainSettingsPress = () => {
    setShowIdentitySheet(true);
  };

  const handleSettingsPress = () => {
    

    // ⭐ Block processing personas
    if(persona?.done_yn === 'N') {
      showAlert({
        emoji: '⏳',
        title: t('persona.creation.still_processing_title'),
        message: t('persona.creation.still_processing_message'),
        buttons: [
          { text: t('common.confirm'), onPress: () => {} },
        ],
      });
      return;
    }

    // ⭐ NEW: Open identity sheet
    HapticService.medium();
    handleChatPress(true);
  };

  // ⭐ NEW: Handle identity save
  const handleIdentitySave = (data) => {
    console.log('[PersonaInfoCard] Identity saved:', data);
    // Optionally refresh persona data here
  };

  // ⚡ OPTIMIZED: Memoized chip press handler
  // ✅ FIX (2026-01-19): Added persona and onFavoriteToggle to dependencies to fix closure bug
  const handleChipPress = useCallback((chipKey, chipData) => {
    if (__DEV__) {
      console.log('📢 [PersonaInfoCard] Chip pressed:', chipKey);
      console.log('📢 [PersonaInfoCard] Current persona:', persona?.persona_name);
    }

    if(chipKey === 'intimacy') {
      handleChatPress();
      return;
    }
    if(chipKey === 'relationship') {
     
      if (onFavoriteToggle) {
        onFavoriteToggle(persona); // ← Now uses current persona, not stale closure!
      }
      return;
    }

    // 😊 NEW (2026-01-19): Emotion chip → Open EmotionDetailSheet
    if (chipKey === 'emotion') {
      console.log('😊 [PersonaInfoCard] Opening EmotionDetailSheet');
      setShowEmotionDetail(true);
      return;
    }

    // OLD: lastInteraction special handling
    if(chipKey === 'lastInteraction') {

      if(!chipData){

        showAlert({
          emoji: '💭',
          title: t('alert.emotion.no_interaction'),
          message: t('alert.emotion.no_interaction_description'),
          type: 'warning',
          buttons: [
            { text: t('common.confirm'), style: 'primary', onPress: () => {} },
          ]
        });
        return;
      } else {
        setSelectedChip({ key: chipKey, data: chipData });
      }
    }
    setSelectedChip({ key: chipKey, data: chipData });
  }, [persona, onFavoriteToggle, handleChatPress, showAlert, t]); // ✅ FIX: Added dependencies!

  if (!persona) {
    return null;
  }
  
  // ⭐ Calculate progress percentage for progress bar
  const progressPercentage = totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0;
  
  // ⭐ Check if "Scroll to Top" button should be visible
  const showScrollToTop = currentIndex >= 3;
  
  // ⭐ Handle scroll to top
  const handleScrollToTop = () => {
    if (!showScrollToTop) return; // Safety check
    
    HapticService.medium();
    console.log('[PersonaInfoCard] 🔝 Scroll to top requested (index >= 3)');
    onScrollToTop?.();
  };
  
  return (
    <>
    <GradientOverlay
      height={Platform.OS === 'ios' ? verticalScale(210) : verticalScale(150)} // ⭐ Increase height to fit pagination + content! (200 → 400)
      style={styles.gradientStyle} // ⭐ LinearGradient styles (position, zIndex, etc.)
      containerStyle={[
        styles.gradientContainerStyle, // ⭐ Inner View styles (padding, etc.)
        {
          paddingBottom: insets.bottom + verticalScale(30), // Dynamic bottom padding
          overflow: 'visible', // ⭐ iOS: Allow floating effect to escape boundaries
        },
      ]}
    >
      {/* ⭐ Pagination Indicator (Clickable when index >= 3) */}
      {totalCount > 1 && (
        <Pressable
          style={[
            styles.paginationContainer,
            { 
              paddingTop: insets.top + (Platform.OS === 'ios' ? verticalScale(10) : verticalScale(-20)), // ⭐ iOS Safe Area (original, correct!)
            }
          ]}

          activeOpacity={showScrollToTop ? 0.7 : 1} // Only show press effect when clickable
          disabled={!showScrollToTop}
        >
          <View style={styles.paginationContent}>
            <View style={styles.paginationLeft}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: scale(10)}}>
                {/* Number Display */}
                <CustomText type="title" bold style={styles.paginationText}>
                  {currentIndex + 1} / {totalCount}
                </CustomText>

              </View>
              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: theme.mainColor,
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </Pressable>
      )}
      <Pressable >
        <View style={styles.content}>
          {/* Left: Info */}
          <View style={styles.infoSection}>
            {/* Name */}
            <View style={styles.nameContainer}>
              <CustomText type="big" style={styles.name} numberOfLines={1}>
                {persona.persona_name}
              </CustomText>
              <CustomText type="title" style={[ { fontStyle: 'italic', marginLeft: scale(-15)}]} numberOfLines={1}>
              {persona?.persona_key === '573db390-a505-4c9e-809f-cc511c235cbb' ? 
              t('persona_info.sage.title') : 
              persona?.persona_key === 'af444146-e796-468c-8e2c-0daf4f9b9248' ? 
              t('persona_info.nexus.title') : 
              t('persona_info.custom.title')}
              </CustomText>
              {/* Settings Icon (Only for user-created personas) */}
              
            </View>
            {/* ⭐ NEW: Relationship Chips (Living Emotions!) - ⚡ OPTIMIZED: No API calls! */}
            {true && (
              <RelationshipChipsContainer 
                relationshipData={persona} // ⚡ Pass entire persona object (includes relationship fields)
                onChipPress={handleChipPress} // ⚡ OPTIMIZED: Stable callback!
                isFocused={isFocused} // ⭐ NEW: Pass focus state for emotion animation
                onEmotionChipLayout={handleEmotionChipLayout} // ⭐ NEW: Get emotion chip position
              />
            )}
            {/* ⭐ NEW: Instagram-style floating effect (rendered at card level to avoid clipping!) */}
            {emotionChipLayout && persona?.emotional_state && isFocused && (
              <View
                style={{
                  position: 'absolute',
                  left: emotionChipLayout.x,
                  top: emotionChipLayout.y,
                  width: emotionChipLayout.width,
                  height: emotionChipLayout.height,
                  zIndex: 9999, // ⭐ iOS: High zIndex to ensure visibility above all elements
                }}
                pointerEvents="none" // Don't block touch events
              >
                <EmotionFloatingEffect
                  mainEmoji={getEmotionEmoji(persona.emotional_state)}
                  floatingEmojis={getFloatingEmojis(persona)}
                  isFocused={isFocused}
                  count={3}
                />
              </View>
            )}
            {/* ⭐ NEW: Instagram-style floating effect (rendered at card level to avoid clipping!) */}
            {emotionChipLayout && (persona?.emotional_state === null || persona?.emotional_state === undefined) && isFocused && (
              <View
                style={{
                  position: 'absolute',
                  left: emotionChipLayout.x,
                  top: emotionChipLayout.y,
                  width: emotionChipLayout.width,
                  height: emotionChipLayout.height,
                  zIndex: 9999, // ⭐ iOS: High zIndex to ensure visibility above all elements
                }}
                pointerEvents="none" // Don't block touch events
              >
                <EmotionFloatingEffect
                  mainEmoji={getEmotionEmoji(persona.emotional_state)}
                  floatingEmojis={['⁉️', '⁉️', '⁉️']}
                  isFocused={isFocused}
                  count={3}
                />
              </View>
            )}
            <View style={styles.descriptionContainer}>
              <CustomText type="middle" bold style={styles.description} numberOfLines={2}>
                {persona?.done_yn === 'N' ? t('persona.creation.creating') : persona?.default_yn === 'Y' ? t('category_type.' + persona?.category_type + '_desc') : persona?.identity_description != null ? persona?.identity_description : t('persona.creation.no_brain')}
              </CustomText>
            </View>
          </View>
          {/* Right: Chat Button */}
          <View
            style={[styles.chatButton, { display: 'none'}]}
            onPress={handleChatPress}
            activeOpacity={0.7}
          >
            <Icon name="settings" size={scale(30)} color="#FFFFFF" />
          </View>
        </View>
      </Pressable>
    </GradientOverlay>

    {/* ⭐ NEW: Identity Settings Sheet */}
    <PersonaIdentitySheet
      visible={showIdentitySheet}
      onClose={() => setShowIdentitySheet(false)}
      persona={persona}
      onSave={handleIdentitySave}
    />

    {/* ⭐ OLD: Chip Detail Bottom Sheet (deprecated for emotion) */}
    <ChipDetailSheet
      isOpen={!!selectedChip && selectedChip?.key !== 'emotion'}
      onClose={() => {
        console.log('❌ [PersonaInfoCard] Closing chip detail sheet');
        setSelectedChip(null);
      }}
      chipKey={selectedChip?.key}
      chipData={selectedChip?.data}
      persona={persona}
    />
    
    {/* 😊 NEW (2026-01-19): Emotion Detail Bottom Sheet */}
    <EmotionDetailSheet
      isOpen={showEmotionDetail}
      onClose={() => {
        console.log('❌ [PersonaInfoCard] Closing emotion detail sheet');
        setShowEmotionDetail(false);
      }}
      persona={persona}
      user_key={user?.user_key}
    />
    </>
  );
}, (prevProps, nextProps) => {
  // ⚡ Custom comparison for React.memo
  // Return true if props are equal (skip re-render)
  return (
    prevProps.persona?.persona_key === nextProps.persona?.persona_key &&
    prevProps.persona?.intimacy_level === nextProps.persona?.intimacy_level &&
    prevProps.persona?.trust_score === nextProps.persona?.trust_score &&
    prevProps.persona?.emotional_state === nextProps.persona?.emotional_state &&
    prevProps.persona?.relationship_level === nextProps.persona?.relationship_level &&
    prevProps.persona?.last_interaction_at === nextProps.persona?.last_interaction_at &&
    prevProps.currentIndex === nextProps.currentIndex &&
    prevProps.totalCount === nextProps.totalCount &&
    prevProps.onChatPress === nextProps.onChatPress &&
    prevProps.onFavoriteToggle === nextProps.onFavoriteToggle &&
    prevProps.onScrollToTop === nextProps.onScrollToTop &&
    prevProps.user?.user_key === nextProps.user?.user_key
  );
});

const styles = StyleSheet.create({
  // ⭐ GradientOverlay - LinearGradient styles (outer)
  gradientStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
//    marginBottom: verticalScale(20),
  },
  
  // ⭐ GradientOverlay - Container styles (inner View)
  gradientContainerStyle: {
  
    paddingTop: verticalScale(0),  // check ios
    paddingHorizontal: scale(20),

  },
  
  // ⭐ Pagination Container (Clickable for scroll to top)
  paginationContainer: {

    width: '100%',
    paddingHorizontal: scale(0),
    paddingBottom: verticalScale(10), // Bottom padding for spacing
    marginBottom: verticalScale(2),



    // ⭐ NO border, NO background - Pure integration with gradient
  },
  
  paginationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start', // ⭐ Changed from 'center' to 'flex-start' to prevent arrow from being pushed down
    width: '100%',

  },
  
  paginationLeft: {
    flexDirection: 'column',
    gap: scale(6),
    flex: 1,
    // alignSelf removed - not needed with parent alignItems: 'flex-start'
  },
  
  paginationText: {
    color: '#FFFFFF',
    fontSize: scale(20),
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  progressBarContainer: {
    width: scale(60), // Fixed width for clean look
    height: scale(3),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scale(2),
    overflow: 'hidden',
  },
  
  progressBarFill: {
    height: '100%',
    borderRadius: scale(2),
    // backgroundColor is set dynamically (theme.mainColor)
  },
  
  scrollToTopIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(10), // ⭐ Optimal spacing from pagination text
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
    marginBottom: Platform.OS === 'ios' ? verticalScale(0) : verticalScale(-30),
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
    display: 'none',
  },
  infoSection: {
    flex: 1,
    gap: verticalScale(6),
  },
  name: {

    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontStyle: 'italic',
  },
  description: {

    fontSize: scale(16),
 //   fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: scale(18),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  chatButton: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
//    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    // ✅ Shadow
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    // ✅ Border
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  personaImage: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    display: 'none',
  },
});

export default PersonaInfoCard;

