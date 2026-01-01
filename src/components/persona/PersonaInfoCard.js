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

import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import FastImage from 'react-native-fast-image';
import PersonaSettingsSheet from './PersonaSettingsSheet';
import PersonaIdentitySheet from './PersonaIdentitySheet'; // ⭐ NEW: Identity sheet
import RelationshipChipsContainer from './RelationshipChipsContainer'; // ⭐ NEW: Relationship chips
/**
 * PersonaInfoCard Component
 * @param {Object} props
 * @param {Object} props.persona - 자아 object
 * @param {Function} props.onChatPress - Callback when chat button is pressed
 * @param {Function} props.onFavoriteToggle - Callback when favorite is toggled
 * @param {Number} props.currentIndex - Current persona index (0-based)
 * @param {Number} props.totalCount - Total personas count
 * @param {Function} props.onScrollToTop - Callback to scroll to first persona
 */
const PersonaInfoCard = ({ persona, onChatPress, onFavoriteToggle, currentIndex = 0, totalCount = 0, onScrollToTop }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showAlert, user } = useAnima(); // ⭐ Added: user for chips
  const { currentTheme: theme } = useTheme(); // ⭐ NEW: For progress bar color
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  // ⭐ NEW: Identity sheet state
  const [showIdentitySheet, setShowIdentitySheet] = useState(false);
  
  // ⭐ NEW: Refresh trigger for relationship chips
  const [chipsRefreshTrigger, setChipsRefreshTrigger] = useState(0);

  // ⭐ All Hooks must be at the top (before any conditional returns)
  useEffect(() => {
    console.log('persona', persona);
  }, [persona,persona?.persona_key,persona?.done_yn]);
  
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
  // ✅ Build description text
  const buildDescription = () => {
    const parts = [];
    if (persona.personality) parts.push(persona.personality);
    if (persona.style) parts.push(persona.style);
    if (persona.expertise) parts.push(persona.expertise);
    return parts.join(' • ');
  };
  const handleSettingsPress = () => {
    // ⭐ Block default personas (SAGE, NEXUS)
    if (persona?.default_yn === 'Y') {
      showAlert({
        emoji: '🚫',
        title: t('persona.identity.blocked_title') || '기본 AI',
        message: t('persona.identity.blocked_message') || '기본 AI (SAGE, NEXUS)는 자아 설정이 불가능합니다.',
        buttons: [
          { text: t('common.confirm') || '확인', onPress: () => {} },
        ],
      });
      return;
    }

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
   //   colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.95)']}
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + verticalScale(30),
        },
      ]}
    >
      {/* ⭐ Pagination Indicator (Clickable when index >= 3) */}
      {totalCount > 1 && (
        <TouchableOpacity
          style={styles.paginationContainer}
          onPress={handleScrollToTop}
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
              {/* ⭐ Scroll to Top Icon (Visible only when index >= 3) */}
              {showScrollToTop && (
                <View style={styles.scrollToTopIcon}>
                  <Icon 
                    name="arrow-up-circle" 
                    size={scale(30)} 
                    color={theme.mainColor} 
                  />
                </View>
              )}
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
        </TouchableOpacity>
      )}
      
      <TouchableOpacity onPress={handleSettingsPress}>
      <View style={styles.content}>
        {/* Persona Image */}
        <FastImage
          source={{ uri: persona?.persona_url }}
          style={styles.personaImage}
          resizeMode="cover"
        />
        {/* Favorite Icon (⭐ ALL personas including default) */}
        <TouchableOpacity
            onPress={handleBrainSettingsPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ display: persona?.default_yn === 'Y' ? 'none' : 'none' }}
          >
            <IconBrain 
              name={persona?.identity_description != null ? 'brain' : 'brain'} 
              size={scale(60)} 
              color={persona?.identity_description != null ? '#FFC107' : 'rgba(255, 255, 255, 0.6)'} 
            />
          </TouchableOpacity>
        {/* Left: Info */}
        <View style={styles.infoSection}>
          {/* Name */}
          <View style={styles.nameContainer}>
            <CustomText type="big" style={styles.name} numberOfLines={1}>
              {persona.persona_name}
            </CustomText>
            
            {/* Settings Icon (Only for user-created personas) */}
            <IconBrain 
              name="brain" 
              size={scale(20)} 
              color="#FFFFFF" 
              style={{ display: persona?.default_yn === 'Y' ? 'none' : 'none' }} 
            />
            
          </View>
          
          {/* ⭐ NEW: Relationship Chips (Living Emotions!) */}
          {user?.user_key && persona?.persona_key && (
            <RelationshipChipsContainer 
              userKey={user.user_key}
              personaKey={persona.persona_key}
              refreshTrigger={chipsRefreshTrigger}
            />
          )}
          
          <View style={styles.descriptionContainer}>
            <CustomText type="middle" bold style={styles.description} numberOfLines={2}>
              {
              persona?.done_yn === 'N' ? t('persona.creation.creating') : persona?.default_yn === 'Y' ? t('category_type.' + persona?.category_type + '_desc') : persona?.identity_description != null ? persona?.identity_description : t('persona.creation.no_brain') }
            </CustomText>
          </View>
        </View>
        
        {/* Right: Chat Button */}
        <TouchableOpacity
          style={[styles.chatButton, { display: 'none'}]}
          onPress={handleChatPress}
          activeOpacity={0.7}
        >
          <Icon name="settings" size={scale(30)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      </TouchableOpacity>
    </GradientOverlay>

    {/* ⭐ NEW: Identity Settings Sheet */}
    <PersonaIdentitySheet
      visible={showIdentitySheet}
      onClose={() => setShowIdentitySheet(false)}
      persona={persona}
      onSave={handleIdentitySave}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: verticalScale(20), // ⭐ Reduced: Make room for pagination
    paddingHorizontal: scale(20),
    zIndex: 100,
  },
  
  // ⭐ Pagination Container (Clickable for scroll to top)
  paginationContainer: {
    width: '100%',
    paddingHorizontal: scale(0),
    paddingVertical: verticalScale(10),
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
    fontSize: scale(22),
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
    marginBottom: verticalScale(30),
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

