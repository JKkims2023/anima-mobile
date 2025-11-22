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

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';

/**
 * PersonaInfoCard Component
 * @param {Object} props
 * @param {Object} props.persona - 자아 object
 * @param {Function} props.onChatPress - Callback when chat button is pressed
 */
const PersonaInfoCard = ({ persona, onChatPress }) => {
  const insets = useSafeAreaInsets();
  
  if (!persona) {
    return null;
  }
  
  // ✅ Handle chat button press
  const handleChatPress = () => {
    HapticService.medium();
    if (onChatPress) {
      onChatPress(persona);
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
  
  return (
    <LinearGradient
      colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.95)']}
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + verticalScale(20),
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left: Info */}
        <View style={styles.infoSection}>
          {/* Name */}
          <CustomText type="big" style={styles.name} numberOfLines={1}>
            {persona.persona_name}
          </CustomText>
          
          {/* Description */}
          <CustomText type="small" style={styles.description} numberOfLines={2}>
            {buildDescription() || persona.description || '자아 정보 없음'}
          </CustomText>
        </View>
        
        {/* Right: Chat Button */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleChatPress}
          activeOpacity={0.7}
        >
          <Icon name="message-text" size={scale(40)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
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
  },
  infoSection: {
    flex: 1,
    gap: verticalScale(6),
  },
  name: {
    fontSize: scale(22),
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: scale(13),
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: scale(18),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  chatButton: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: '#3B82F6',
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

