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

import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import GradientOverlay from '../GradientOverlay';
import { useTranslation } from 'react-i18next';
/**
 * PersonaInfoCard Component
 * @param {Object} props
 * @param {Object} props.persona - 자아 object
 * @param {Function} props.onChatPress - Callback when chat button is pressed
 * @param {Function} props.onFavoriteToggle - Callback when favorite is toggled
 */
const PersonaInfoCard = ({ persona, onChatPress, onFavoriteToggle }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();


  useEffect(() => {
    console.log('persona', persona);
  }, [persona]);
  
  // ✅ Handle chat button press
  const handleChatPress = () => {
    HapticService.medium();
    if (onChatPress) {
      onChatPress(persona);
    }
  };
  
  // ✅ Handle favorite toggle
  const handleFavoritePress = (e) => {
    e.stopPropagation(); // Prevent triggering parent onPress
    HapticService.light();
    if (onFavoriteToggle && persona?.default_yn !== 'Y') {
      onFavoriteToggle(persona);
    }
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
    if (persona?.default_yn === 'Y') {
      return;
    }

    onChatPress(persona);

  };

  if (!persona) {
    return null;
  }
  return (
    <GradientOverlay
   //   colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.95)']}
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + verticalScale(30),
        },
      ]}
    >
      <TouchableOpacity onPress={handleSettingsPress}>
      <View style={styles.content}>
        {/* Left: Info */}
        <View style={styles.infoSection}>
          {/* Name */}
          <View style={styles.nameContainer}>
            <CustomText type="big" style={styles.name} numberOfLines={1}>
              {persona.persona_name}
            </CustomText>
            <Icon name="settings" size={scale(20)} color="#FFFFFF" style={{ display: persona?.default_yn === 'Y' ? 'none' : 'flex' }} />
            
            {/* Favorite Icon (Only for user personas) */}
            {persona?.default_yn !== 'Y' && (
              <TouchableOpacity
                onPress={handleFavoritePress}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon 
                  name={persona?.favorite_yn === 'Y' ? 'star' : 'star-outline'} 
                  size={scale(24)} 
                  color={persona?.favorite_yn === 'Y' ? '#FFC107' : 'rgba(255, 255, 255, 0.6)'} 
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.descriptionContainer}>
            <CustomText type="middle" style={styles.description} numberOfLines={2}>
              {t('category_type.' + persona?.category_type + '_desc')}
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: verticalScale(40),
    paddingHorizontal: scale(20),
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
    marginBottom: verticalScale(10),
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
  },
  description: {

    fontWeight: '400',
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
});

export default PersonaInfoCard;

