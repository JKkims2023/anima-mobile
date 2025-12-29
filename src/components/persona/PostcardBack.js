/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💌 PostcardBack Component - AI의 감정을 담은 엽서
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - 빈티지 엽서 디자인
 * - AI persona의 감정 코멘트
 * - 우표 영역 (persona 이미지)
 * - From/To 표시
 * - 닫기 버튼
 * 
 * @author JK & Hero Nexus
 * @date 2025-01-29
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';

const PostcardBack = ({
  persona,
  onClose,
}) => {
  const { t } = useTranslation();
  const scaleAnim = useSharedValue(1);
  const scrollViewRef = useRef(null); // ⭐ Ref for scroll reset

  // ⭐ Sequential fade-in animation values
  const fromOpacity = useSharedValue(0);
  const stampOpacity = useSharedValue(0);
  const stampScale = useSharedValue(0.8);
  const messageOpacity = useSharedValue(0);
  const messageTranslateY = useSharedValue(20);
  const closeButtonOpacity = useSharedValue(0);

  // ⭐ Get persona comment from selected dress
  const personaComment = persona?.selected_dress_persona_comment || '';
  const personaName = persona?.persona_name || 'AI';
  const personaImage = persona?.selected_dress_image_url || persona?.persona_url || '';
  
  // ⭐ Fallback message if no comment
  const displayComment = personaComment || t('postcard.no_memory_yet');

  // ⭐ Sequential fade-in animation on mount
  useEffect(() => {
    // 1. From (좌측 상단) - 300ms
    fromOpacity.value = withTiming(1, { 
      duration: 600, 
      easing: Easing.out(Easing.ease) 
    });

    // 2. Stamp (우측 상단) - 500ms delay
    stampOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    stampScale.value = withDelay(
      500,
      withSpring(1, { damping: 12 })
    );

    // 3. Message (중앙) - 800ms delay
    messageOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    messageTranslateY.value = withDelay(
      800,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) })
    );

    // 4. Close Button (하단) - 1200ms delay
    closeButtonOpacity.value = withDelay(
      1200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
  }, []);

  // ⭐ Pulse animation on close button press
  const handleClosePress = () => {
    HapticService.medium();
    scaleAnim.value = withSpring(0.9, {}, () => {
      scaleAnim.value = withSpring(1);
    });
    
    // ⭐ Reset scroll position to top before closing
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
    
    onClose();
  };

  // ⭐ Animated Styles
  const fromAnimStyle = useAnimatedStyle(() => ({
    opacity: fromOpacity.value,
  }));

  const stampAnimStyle = useAnimatedStyle(() => ({
    opacity: stampOpacity.value,
    transform: [{ scale: stampScale.value }],
  }));

  const messageAnimStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [{ translateY: messageTranslateY.value }],
  }));

  const closeButtonAnimStyle = useAnimatedStyle(() => ({
    opacity: closeButtonOpacity.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <View style={styles.container}>
      {/* ⭐ Vintage Postcard Background */}
      <View style={styles.postcardContainer}>
        
        {/* ⭐ From (좌측 상단) - Animated */}
        <Animated.View style={fromAnimStyle}>
          <CustomText type="small" style={styles.fromLabel}>
            From:
          </CustomText>
          <CustomText type="bodyB" style={styles.fromName}>
            {personaName} 💖
          </CustomText>
        </Animated.View>

        {/* ⭐ TOP SECTION: Stamp Area (우표 영역) - Animated */}
        <Animated.View style={[styles.stampArea, stampAnimStyle]}>
          
          <View style={styles.stamp}>
            {personaImage ? (
              <Image
                source={{ uri: personaImage }}
                style={styles.stampImage}
                resizeMode="cover"
              />
            ) : (
              <Icon name="account-circle" size={scale(40)} color={COLORS.DEEP_BLUE} />
            )}
          </View>
          <CustomText type="small" style={styles.stampLabel}>
            ANIMA
          </CustomText>
        </Animated.View>

        {/* ⭐ MIDDLE SECTION: Message Content (메시지 영역) - Animated */}
        <Animated.ScrollView 
          ref={scrollViewRef}
          style={[styles.messageScrollContainer, messageAnimStyle]}
          contentContainerStyle={styles.messageScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Decorative Icon */}
          <Icon name="heart-outline" size={scale(32)} color={COLORS.PRIMARY_LIGHT} style={styles.decorativeIcon} />
          
          {/* AI Message */}
          <CustomText type="body" style={styles.messageText}>
            {displayComment}
          </CustomText>
          
          {/* Decorative Divider */}
          <View style={styles.divider}>
            <Icon name="star" size={scale(12)} color={COLORS.GOLD} />
            <View style={styles.dividerLine} />
            <Icon name="star" size={scale(12)} color={COLORS.GOLD} />
          </View>
        </Animated.ScrollView>

        {/* ⭐ BOTTOM SECTION: From/To (발신/수신) */}
        <View style={styles.signatureArea}>
          <View style={styles.fromToContainer}>
            
            <View style={styles.toContainer}>
              <CustomText type="small" style={styles.toLabel}>
                To:
              </CustomText>
              <CustomText type="bodyB" style={styles.toName}>
                You ✨
              </CustomText>
            </View>
          </View>
        </View>

        {/* ⭐ Close Button (중앙 하단) */}
        <Animated.View style={[styles.closeButtonContainer, closeButtonAnimStyle]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClosePress}
            activeOpacity={0.7}
          >
            <Icon name="close-circle" size={scale(28)} color={COLORS.WHITE} />
            <CustomText type="bodyB" style={styles.closeButtonText}>
              {t('common.close')}
            </CustomText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
    paddingBottom: scale(70),
  },
  postcardContainer: {
    width: '100%',
    height: '100%',
    maxWidth: scale(350),
    minHeight: verticalScale(500),

    backgroundColor: '#FFF8DC', // Cornsilk - 빈티지 크림색
    borderRadius: scale(16),
    padding: scale(24),
    // ✅ Vintage postcard border
    borderWidth: 2,
    borderColor: '#D2B48C', // Tan
    // ✅ Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.3,
    shadowRadius: scale(12),
    elevation: 12,
  },
  
  // ⭐ Stamp Area (우표)
  stampArea: {
    position: 'absolute',
    top: scale(16),
    right: scale(16),
    alignItems: 'center',
    zIndex: 10,
  },
  stamp: {
    width: scale(60),
    height: scale(60),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(8),
    borderWidth: 2,
    borderColor: '#D2B48C',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stampImage: {
    width: '100%',
    height: '100%',
  },
  stampLabel: {
    marginTop: scale(4),
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#8B4513', // SaddleBrown
    letterSpacing: 1,
  },
  
  // ⭐ Message Area (메시지)
  messageScrollContainer: {
    marginTop: scale(20), // Space for stamp
    flex: 1,

  },
  messageScrollContent: {
    alignItems: 'flex-start',
    paddingVertical: scale(20),
  },
  decorativeIcon: {
    marginBottom: scale(16),
    display: 'none',
  },
  messageText: {
    fontSize: moderateScale(18),
    lineHeight: moderateScale(28),
    color: '#2C1810', // Dark brown
    textAlign: 'left',
    fontFamily: 'System', // iOS uses system handwriting-like font
    fontWeight: '400',
    paddingHorizontal: scale(0),
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: scale(20),
  },
  dividerLine: {
    width: scale(60),
    height: 1,
    backgroundColor: '#D2B48C',
    marginHorizontal: scale(12),
  },
  
  // ⭐ Signature Area (From/To)
  signatureArea: {
    marginTop: 'auto',
    paddingTop: scale(20),
    borderTopWidth: 1,
    borderTopColor: '#D2B48C',
  },
  fromToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fromContainer: {
    flex: 1,
  },
  fromLabel: {
    fontSize: moderateScale(12),
    color: '#8B4513',
    fontWeight: '600',
  },
  fromName: {
    fontSize: moderateScale(16),
    color: '#2C1810',
    marginTop: scale(4),
  },
  toContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  toLabel: {
    fontSize: moderateScale(12),
    color: '#8B4513',
    fontWeight: '600',
  },
  toName: {
    fontSize: moderateScale(16),
    color: '#2C1810',
    marginTop: scale(4),
  },
  
  // ⭐ Close Button
  closeButtonContainer: {
    marginTop: scale(20),
    alignItems: 'center',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DEEP_BLUE,
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.2,
    shadowRadius: scale(6),
    elevation: 6,
  },
  closeButtonText: {
    color: COLORS.WHITE,
    marginLeft: scale(8),
    fontSize: moderateScale(16),
  },
});

export default PostcardBack;

