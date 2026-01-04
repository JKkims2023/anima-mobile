/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 QuickActionChipsAnimated Component (Persona Mode)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Quick action chips with SAFE animations
 * - Simple fade-in animation only (no complex transforms)
 * - Sequential appearance
 * - Glassmorphism style
 * - Video converting indicator (hourglass + rotation)
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import NotificationBadge from '../NotificationBadge'; // ⭐ NEW: Badge for history chip
import DressCountBadge from '../DressCountBadge'; // ⭐ NEW: Dress count badge with rotation
import { scale, verticalScale } from '../../utils/responsive-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../styles/commonstyles';
import { isAnimaCorePersona } from '../../constants/persona';
import { isPersonaCommentRead } from '../../utils/storage';
import { useUser } from '../../contexts/UserContext'; // ⭐ FIXED: Use UserContext for user_key

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedIcon = Animated.createAnimatedComponent(Icon);

const QuickActionChipsAnimated = ({
  onDressClick,      // ⭐ 1. Dressing Room
  onHistoryClick,    // ⭐ 2. Memory History
  onVideoClick,      // ⭐ 3. Video Conversion
  onMessageClick,    // ⭐ 4. Message Toggle (Opens MessageCreationOverlay)
  onSettingsClick,   // ⭐ 5. Settings
  onMusicClick,      // ⭐ 6. Music
  onShareClick,      // ⭐ 7. Share
  isVideoConverting = false, // ⭐ NEW: Video converting state
  currentPersona = null,
  currentDressState = { count: 0, hasCreating: false }, // ⭐ NEW: Dress state for badge
}) => {
  console.log('currentPersona: ', currentPersona);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useUser(); // ⭐ FIXED: Get user from UserContext (not AnimaContext!)
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHistoryBadge, setShowHistoryBadge] = useState(false); // ⭐ NEW: Badge visibility state

  // ⭐ Pastel Soft Colors - 감성적인 컬러 조합
  const chipColors = {
    video: '#FF7FA3',    // 🌸 체리 블라썸 핑크 - 사랑과 감성
    share: '#6BB6FF',    // 💙 스카이 블루 - 연결과 소통
    history: '#FFD93D',  // 🌟 골든 옐로우 - 빛나는 추억
    dress: '#A78BFA',    // 🦄 라벤더 - 꿈같은 변신
  };

  const actions = [
    { id: 'video', icon: 'heart-multiple-outline', label: '영상', onClick: onVideoClick, color: chipColors.video },
//    { id: 'settings', icon: 'cog', label: '설정', onClick: onSettingsClick },
    { id: 'share', icon: 'share-variant-outline', label: t('common.share'), onClick: onShareClick, color: chipColors.share },
    { id: 'history', icon: 'mailbox-outline', label: '추억', onClick: onHistoryClick, color: chipColors.history },
    { id: 'dress', icon: 'tshirt-crew-outline', label: '드레스', onClick: onDressClick, color: chipColors.dress },
//    { id: 'message', icon: 'message-text', label: '메시지', onClick: onMessageClick },
  ];
  
  // ⭐ Rotation animation for hourglass (continuous)
  const hourglassRotation = useSharedValue(0);
  
  // ⭐ Tooltip animation
  const tooltipOpacity = useSharedValue(0);
  const tooltipTranslateX = useSharedValue(-10);
  
  // ⭐ NEW: Dress chip rotation & anticipation effect
  const dressRotation = useSharedValue(0);
  const dressOpacity = useSharedValue(1);
  const dressScale = useSharedValue(1);
  
  // ✅ Animation values (individual for each chip)
  const opacity0 = useSharedValue(0);
  const opacity1 = useSharedValue(0);
  const opacity2 = useSharedValue(0);
  const opacity3 = useSharedValue(0);
  const opacity4 = useSharedValue(0);
  
  // ✅ Animated styles (must be at top level)
  const animatedStyle0 = useAnimatedStyle(() => ({
    opacity: opacity0.value,
  }));
  
  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: opacity1.value,
  }));
  
  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
  }));
  
  const animatedStyle3 = useAnimatedStyle(() => ({
    opacity: opacity3.value,
  }));
  
  const animatedStyle4 = useAnimatedStyle(() => ({
    opacity: opacity4.value,
  }));
  
  const animatedStyles = [animatedStyle0, animatedStyle1, animatedStyle2, animatedStyle3, animatedStyle4];
  const opacityValues = [opacity0, opacity1, opacity2, opacity3, opacity4];
  
  // ⭐ Hourglass rotation animation (continuous when converting)
  const hourglassAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${hourglassRotation.value}deg` }],
  }));
  
  // ⭐ Tooltip animation style
  const tooltipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ translateX: tooltipTranslateX.value }],
  }));
  
  // ⭐ NEW: Dress chip animated style (rotation + anticipation effect)
  const dressAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dressOpacity.value,
    transform: [
      { rotate: `${dressRotation.value}deg` },
      { scale: dressScale.value }
    ],
  }));
  
  // ⭐ Start/stop hourglass rotation based on isVideoConverting
  useEffect(() => {
    if (isVideoConverting) {
      console.log('[QuickActionChipsAnimated] 🔄 Starting hourglass rotation');
      // Infinite rotation: 0 → 360 → 0 → 360...
      hourglassRotation.value = withRepeat(
        withTiming(360, {
          duration: 2000, // 2초에 한 바퀴
          easing: Easing.linear,
        }),
        -1, // Infinite
        false // No reverse
      );
    } else {
      // Stop rotation and reset to 0
      hourglassRotation.value = withTiming(0, { duration: 300 });
    }
  }, [isVideoConverting]);
  
  // ⭐ NEW: Start/stop dress chip rotation based on hasCreating
  useEffect(() => {
    if (currentDressState.hasCreating) {
      console.log('[QuickActionChipsAnimated] 🔄 Starting dress chip rotation (creating...)');
      
      // Infinite rotation: 0 → 360 → 0 → 360...
      dressRotation.value = withRepeat(
        withTiming(360, {
          duration: 2000, // 2초에 한 바퀴 (hourglass와 동일)
          easing: Easing.linear,
        }),
        -1, // Infinite
        false // No reverse
      );
      
      // ✨ Anticipation effect: Opacity 0.75, Scale 0.95
      dressOpacity.value = withTiming(0.75, { 
        duration: 400, 
        easing: Easing.out(Easing.ease) 
      });
      dressScale.value = withTiming(0.95, { 
        duration: 400, 
        easing: Easing.out(Easing.ease) 
      });
    } else {
      console.log('[QuickActionChipsAnimated] ✅ Stopping dress chip rotation (completed!)');
      
      // Stop rotation and reset to 0
      dressRotation.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) });
      
      // ✨ Restore original state: Opacity 1.0, Scale 1.0
      dressOpacity.value = withTiming(1.0, { 
        duration: 500, 
        easing: Easing.out(Easing.ease) 
      });
      dressScale.value = withTiming(1.0, { 
        duration: 500, 
        easing: Easing.out(Easing.ease) 
      });
    }
  }, [currentDressState.hasCreating]);
  
  // ⭐ Auto-hide tooltip after 3 seconds
  useEffect(() => {
    if (showTooltip) {
      // Show tooltip
      tooltipOpacity.value = withTiming(1, { duration: 200 });
      tooltipTranslateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        tooltipOpacity.value = withTiming(0, { duration: 200 });
        tooltipTranslateX.value = withTiming(-10, { duration: 200 });
        setTimeout(() => setShowTooltip(false), 200);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);
  
  // ✅ Entry animation (fade in)
  useEffect(() => {
    if (__DEV__) {
      console.log('[QuickActionChipsAnimated] 🎬 Starting fade-in animation');
    }
    
    opacityValues.forEach((opacity, index) => {
      // Reset to 0
      opacity.value = 0;
      
      // Fade in with delay
      opacity.value = withDelay(
        index * 100, // 100ms delay between each chip
        withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.ease),
        })
      );
    });
    
    // ✅ Exit animation on unmount (fade out in reverse order)
    return () => {
      if (__DEV__) {
        console.log('[QuickActionChipsAnimated] 🌅 Starting fade-out animation');
      }
      
      opacityValues.forEach((opacity, index) => {
        // Fade out in reverse order (last chip fades out first)
        const reverseIndex = opacityValues.length - 1 - index;
        opacity.value = withDelay(
          reverseIndex * 80, // 80ms delay (faster than entry)
          withTiming(0, {
            duration: 200,
            easing: Easing.in(Easing.ease),
          })
        );
      });
    };
  }, []);

  useEffect(() => {
    console.log('currentPersona: ', currentPersona);
  }, [currentPersona]);
  
  // ⭐ NEW: Check if history badge should be shown (async check for ANIMA Core personas)
  useEffect(() => {
    const checkBadgeVisibility = async () => {
      // ⭐ DEBUG: Check user availability
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[QuickActionChipsAnimated] useEffect triggered');
      console.log('  currentPersona:', currentPersona?.persona_key, currentPersona?.persona_name);
      console.log('  user:', user);
      console.log('  user?.user_key:', user?.user_key);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (!currentPersona) {
        console.log('⚠️ [QuickActionChipsAnimated] No currentPersona, hiding badge');
        setShowHistoryBadge(false);
        return;
      }

      // ⭐ CRITICAL: Use 'guest' as fallback for non-logged-in users
      // ANIMA_CORE personas (SAGE/NEXUS) are for ALL users, including free users!
      const effectiveUserKey = user?.user_key || 'guest';
      console.log('  effectiveUserKey:', effectiveUserKey);

      console.log('✅ [QuickActionChipsAnimated] Checking badge visibility...');
      console.log('  persona_key:', currentPersona.persona_key);
      console.log('  persona_name:', currentPersona.persona_name);
      
      // ⭐ Check if comment exists
      const hasComment = 
        currentPersona.selected_dress_persona_comment !== null &&
        currentPersona.selected_dress_persona_comment !== '' &&
        currentPersona.selected_dress_persona_comment.trim() !== '';
      
      if (!hasComment) {
        console.log('  ℹ️ No comment, hiding badge');
        setShowHistoryBadge(false);
        return;
      }
      
      // ⭐ Check if ANIMA Core persona (SAGE/NEXUS)
      const isAnimaCore = isAnimaCorePersona(currentPersona.persona_key);
      console.log('  is_anima_core:', isAnimaCore);
      
      let isUnread = false;
      
      if (isAnimaCore) {
        // ⭐ ANIMA Core: Check AsyncStorage ONLY
        // Note: DB's persona_comment_checked is ALWAYS 'N' for ANIMA Core
        // because we don't call the DB API (only save to AsyncStorage)
        // So we only need to check if user has read it locally!
        
        const alreadyReadLocally = await isPersonaCommentRead(effectiveUserKey, currentPersona.persona_key);
        console.log('  📦 [AsyncStorage] Already read locally:', alreadyReadLocally);
        
        // ⭐ Not read locally = show badge!
        isUnread = !alreadyReadLocally;
        console.log('  ✅ Final isUnread:', isUnread);
      } else {
        // ⭐ User-created: Check DB field only
        // For user-created personas, we need actual user_key from DB
        if (!user?.user_key) {
          console.log('  ⚠️ User-created persona but no user_key, hiding badge');
          isUnread = false;
        } else {
          isUnread = currentPersona.persona_comment_checked === 'N';
          console.log('  🗄️ [Database] persona_comment_checked:', currentPersona.persona_comment_checked);
        }
      }
      
      const shouldShow = hasComment && isUnread;
      console.log('  🔴 shouldShow:', shouldShow);
      
      if (__DEV__ && shouldShow) {
        console.log('🔴 [QuickActionChipsAnimated] History badge ACTIVE!');
      }
      
      setShowHistoryBadge(shouldShow);
    };

    checkBadgeVisibility();
  }, [currentPersona, user?.user_key]);
  
  const handlePress = (action) => {
    HapticService.medium();
    action.onClick();
  };
  
  // ⭐ Handle message button click (with video converting check)
  const handleMessageClick = () => {
    if (isVideoConverting) {
      // Show tooltip instead of opening overlay
      console.log('[QuickActionChipsAnimated] ⏳ Video converting, showing tooltip');
      HapticService.warning();
      setShowTooltip(true);
      return;
    }
    
    // Normal flow: open message creation overlay
    console.log('[QuickActionChipsAnimated] ✅ Opening message creation overlay');
    HapticService.medium();
    if (onMessageClick) {
      onMessageClick();
    } else {
      console.warn('[QuickActionChipsAnimated] onMessageClick missing');
    }
  };

  
  return (
    <>
    <View style={styles.container}>
      {actions.map((action, index) => {
        const animatedStyle = animatedStyles[index];
        const isHistoryChip = action.id === 'history';
        const isDressChip = action.id === 'dress'; // ⭐ NEW: Dress chip check
        
        // ⭐ NEW: Use AnimatedTouchable for dress chip, regular TouchableOpacity for others
        const ChipComponent = isDressChip ? AnimatedTouchable : TouchableOpacity;
        const chipStyle = isDressChip 
          ? [styles.chip, animatedStyle, dressAnimatedStyle] // ⭐ Apply dress rotation effect!
          : [styles.chip, animatedStyle];
        
        return (
          <View key={action.id} style={[styles.chipWrapper, { display: action.id === 'video' ? 
          currentPersona?.selected_dress_video_url === null ? 'flex' : 'none' 
          : 'flex' }]}>
            <ChipComponent
              style={chipStyle}
              onPress={() => handlePress(action)}
              activeOpacity={0.7}
            >
              {/* ⭐ Pastel Soft Colors - 각 아이콘의 의미에 맞는 감성적 컬러 */}
              <Icon 
                name={action.icon} 
                size={scale(24)} 
                color={action.color || '#FFFFFF'} 
              />
              <Text style={[styles.label,{display:'none', color: action.color || '#FFFFFF'}]}>{action.label}</Text>
              
              {/* ⭐ NEW: Notification Badge for History Chip */}
              {isHistoryChip && showHistoryBadge && (
                <NotificationBadge visible={true} />
              )}
              
              {/* ⭐ NEW: Dress Count Badge (Static - chip rotates!) */}
              {isDressChip && (
                <DressCountBadge 
                  count={currentDressState.count}
                />
              )}
            </ChipComponent>
          </View>
        );
      })}
    </View>
    
    {/* ⭐ Message Creation Button with Video Converting Indicator */}
    <View style={[styles.messageButtonContainer, {display: isVideoConverting ? 'none' : 'none'}]}>
      {/* ⭐ Tooltip (Left side) */}
      {showTooltip && (
        <Animated.View style={[styles.tooltip, tooltipAnimatedStyle]}>
          <CustomText style={styles.tooltipText}>
            {t('persona.video_converting_tooltip')}
          </CustomText>
          <View style={styles.tooltipArrow} />
        </Animated.View>
      )}
      
      {/* Message Button */}
      <TouchableOpacity
        onPress={handleMessageClick}
        activeOpacity={0.7}
      >
        <View 
          style={[
            styles.chip, 
            {
              display:'none',
              backgroundColor: isVideoConverting 
                ? 'rgba(255, 165, 0, 0.3)' // ⭐ Orange tint when converting
                : COLORS.DEEP_BLUE_LIGHT,  
              borderWidth: 3,
              borderColor: isVideoConverting
                ? 'rgba(255, 165, 0, 0.5)' // ⭐ Orange border when converting
                : 'rgba(255, 255, 255, 0.3)',
              width: scale(70), 
              height: scale(70), 
              borderRadius: scale(50), 
              marginTop: verticalScale(20), 
              marginBottom: verticalScale(20), 
              alignItems: 'center', 
              justifyContent: 'center',

            }
          ]}
        >
          {/* ⭐ Conditional Icon: Hourglass (rotating) or Pencil */}
          {isVideoConverting ? (
            <AnimatedIcon 
              name="timer-sand" 
              size={scale(32)} 
              color="#FFB84D" // ⭐ 따뜻한 오렌지 - 진행 중 (기다림의 따뜻함)
              style={hourglassAnimatedStyle}
            />
          ) : (
            <Icon 
              name="pencil-outline" 
              size={scale(32)} 
              color="#A7F3D0" // ⭐ 민트 그린 - 창의성과 표현 (새로운 시작)
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    // ⭐ FIX: Remove position absolute (handled by parent)
    gap: verticalScale(12),
    alignItems: 'center',
    marginTop: verticalScale(20),
    marginRight: scale(10),
    marginBottom: verticalScale(40),

  },
  chipWrapper: {
    alignItems: 'center',
  },
  chip: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // Dark background for visibility
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  label: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontWeight: '400',
  },
  // ⭐ NEW: Message Button Container (for tooltip positioning)
  messageButtonContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    display: 'none',
  },
  // ⭐ NEW: Tooltip (Left side of message button)
  tooltip: {
    position: 'absolute',
    right: scale(85), // Position to the left of button (button width + margin)
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: scale(180),
  },
  tooltipText: {
    fontSize: scale(12),
    color: '#FFA500',
    fontWeight: '600',
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    right: scale(-6),
    top: '50%',
    marginTop: scale(-6),
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderTopColor: 'transparent',
    borderBottomWidth: 6,
    borderBottomColor: 'transparent',
    borderLeftWidth: 6,
    borderLeftColor: 'rgba(0, 0, 0, 0.9)',
  },
});

export default QuickActionChipsAnimated;

