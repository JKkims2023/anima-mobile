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

import React, { useEffect, useState, useMemo, useRef, memo } from 'react';
import { View, TouchableOpacity, Pressable, Text, StyleSheet } from 'react-native';
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

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedIcon = Animated.createAnimatedComponent(Icon);

const QuickActionChipsAnimated = ({
  onDressClick,      // ⭐ 1. Dressing Room
  onHistoryClick,    // ⭐ 2. Memory History
  onVideoClick,      // ⭐ 3. Video Conversion
  onMessageClick,    // ⭐ 4. Message Toggle (Opens MessageCreationOverlay)
  onSettingsClick,   // ⭐ 5. Settings
  onMusicClick,      // ⭐ 6. Music
  onShareClick,      // ⭐ 7. Share
  onDeleteClick,     // ⭐ 8. Delete
  isVideoConverting = false, // ⭐ NEW: Video converting state
  currentPersona = null,
  currentDressState = { count: 0, hasCreating: false }, // ⭐ NEW: Dress state for badge
}) => {
  // 🔥 PERFORMANCE DEBUG: Render counter with timestamp
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  if (__DEV__) {
    const timestamp = Date.now();
    console.log(`🔥 [QuickActionChips] Render #${renderCountRef.current}, persona: ${currentPersona?.persona_name} @ ${timestamp}`);
  }

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
    delete: '#FF0000',   // 🔴 빨간색 - 삭제
  };

  const actions = [
    { id: 'delete', icon: 'delete-forever-outline', label: '삭제', onClick: onDeleteClick, color: chipColors.delete },
    { id: 'video', icon: 'heart-multiple-outline', label: '영상', onClick: onVideoClick, color: chipColors.video },
//    { id: 'settings', icon: 'cog', label: '설정', onClick: onSettingsClick },
    { id: 'share', icon: 'share-variant-outline', label: t('common.share'), onClick: onShareClick, color: chipColors.share },
    { id: 'history', icon: 'mailbox-outline', label: '추억', onClick: onHistoryClick, color: chipColors.history },
    { id: 'dress', icon: 'tshirt-crew-outline', label: '드레스', onClick: onDressClick, color: chipColors.dress },
//    { id: 'message', icon: 'message-text', label: '메시지', onClick: onMessageClick },
  ];
  
  // ⭐ Rotation animation for hourglass (continuous)
  const hourglassRotation = useSharedValue(0);
  
  // ⭐ Tooltip animation (starts from right, moves left)
  const tooltipOpacity = useSharedValue(0);
  const tooltipTranslateX = useSharedValue(10); // ⭐ Start from RIGHT (chip side)
  
  // ⭐ NEW: Dress chip rotation & anticipation effect
  const dressRotation = useSharedValue(0);
  const dressOpacity = useSharedValue(1);
  const dressScale = useSharedValue(1);
  
  // ⭐ NEW: Video chip animations (3 states: waiting, converting, completed)
  const videoScale = useSharedValue(1);          // 💓 Heartbeat effect (State 1)
  const videoGlow = useSharedValue(0);           // ✨ Glow intensity (State 1)
  const videoRotation = useSharedValue(0);       // 🔄 Icon rotation (State 2)
  const videoOpacity = useSharedValue(1);        // Opacity control
  const videoBorderGlow = useSharedValue(0);     // 🌟 Border glow pulse
  
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
  
  // ⭐ NEW: Video chip animated style (icon animation)
  const videoIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: videoScale.value },
      { rotate: `${videoRotation.value}deg` }
    ],
  }));
  
  // ⭐ NEW: Video chip container animated style (glow + border)
  const videoChipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: videoOpacity.value,
    transform: [{ scale: 1 + videoBorderGlow.value * 0.05 }], // Subtle border pulse
    shadowOpacity: 0.4 + videoGlow.value * 0.6, // Glow effect
    shadowRadius: 8 + videoGlow.value * 12, // Expand shadow
  }));
  
  // ⭐ Start/stop hourglass rotation based on isVideoConverting
  useEffect(() => {
    if (isVideoConverting) {
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
  
  // ⭐ NEW: Video chip animation controller (3 states)
  useEffect(() => {
    const hasVideo = currentPersona?.selected_dress_video_url !== null;
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // State 1: WAITING (No video, not converting) - 강렬한 효과! 🔥
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!hasVideo && !isVideoConverting) {
      
      // 💓 Heartbeat effect: Scale pulse (1.0 ↔ 1.15)
      videoScale.value = withRepeat(
        withTiming(1.15, {
          duration: 800, // 0.8초 (심장 박동 느낌)
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Infinite
        true // Reverse (1.0 → 1.15 → 1.0 → 1.15...)
      );
      
      // ✨ Glow pulse: Intensity (0 ↔ 1)
      videoGlow.value = withRepeat(
        withTiming(1, {
          duration: 1200, // 1.2초 (심장보다 약간 느림)
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Infinite
        true // Reverse
      );
      
      // 🌟 Border glow pulse (0 ↔ 1)
      videoBorderGlow.value = withRepeat(
        withTiming(1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
      
      // Opacity: Full
      videoOpacity.value = withTiming(1.0, { duration: 300 });
      
      // Rotation: None
      videoRotation.value = withTiming(0, { duration: 300 });
    }
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // State 2: CONVERTING (Video converting) - 변환 중 효과 ⏳
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    else if (isVideoConverting) {
      
      // Stop heartbeat & glow
      videoScale.value = withTiming(1.0, { duration: 400 });
      videoGlow.value = withTiming(0, { duration: 400 });
      videoBorderGlow.value = withTiming(0, { duration: 400 });
      
      // 🔄 Rotation (like hourglass)
      videoRotation.value = withRepeat(
        withTiming(360, {
          duration: 2000, // 2초에 한 바퀴
          easing: Easing.linear,
        }),
        -1, // Infinite
        false // No reverse
      );
      
      // Opacity: Slight transparency (0.85)
      videoOpacity.value = withTiming(0.85, { duration: 400 });
    }
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // State 3: COMPLETED (Has video) - 숨김 ✅
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    else if (hasVideo) {
      
      // Stop all animations
      videoScale.value = withTiming(1.0, { duration: 300 });
      videoGlow.value = withTiming(0, { duration: 300 });
      videoBorderGlow.value = withTiming(0, { duration: 300 });
      videoRotation.value = withTiming(0, { duration: 300 });
      videoOpacity.value = withTiming(1.0, { duration: 300 });
    }
  }, [currentPersona?.selected_dress_video_url, isVideoConverting]);
  
  // ⭐ Auto-hide tooltip after 3 seconds
  useEffect(() => {
    if (showTooltip) {
      // Show tooltip: RIGHT → LEFT (chip → left side)
      tooltipOpacity.value = withTiming(1, { duration: 200 });
      tooltipTranslateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      
      // Auto-hide after 3 seconds: LEFT → RIGHT (back to chip)
      const timer = setTimeout(() => {
        tooltipOpacity.value = withTiming(0, { duration: 200 });
        tooltipTranslateX.value = withTiming(10, { duration: 200 }); // ⭐ Back to RIGHT (chip side)
        setTimeout(() => setShowTooltip(false), 200);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);
  
  // ✅ Entry animation (fade in)
  useEffect(() => {
    
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

  }, [currentPersona]);
  
  // ⭐ NEW: Check if history badge should be shown (async check for ANIMA Core personas)
  useEffect(() => {
    const checkBadgeVisibility = async () => {
      
      if (!currentPersona) {
        setShowHistoryBadge(false);
        return;
      }

      // ⭐ CRITICAL: Use 'guest' as fallback for non-logged-in users
      // ANIMA_CORE personas (SAGE/NEXUS) are for ALL users, including free users!
      const effectiveUserKey = user?.user_key || 'guest';
      
      // ⭐ Check if comment exists
      const hasComment = 
        currentPersona.selected_dress_persona_comment !== null &&
        currentPersona.selected_dress_persona_comment !== '' &&
        currentPersona.selected_dress_persona_comment.trim() !== '';
      
      if (!hasComment) {
        setShowHistoryBadge(false);
        return;
      }
      
      // ⭐ Check if ANIMA Core persona (SAGE/NEXUS)
      const isAnimaCore = isAnimaCorePersona(currentPersona.persona_key);
      
      let isUnread = false;
      
      if (isAnimaCore) {
        // ⭐ ANIMA Core: Check AsyncStorage ONLY
        // Note: DB's persona_comment_checked is ALWAYS 'N' for ANIMA Core
        // because we don't call the DB API (only save to AsyncStorage)
        // So we only need to check if user has read it locally!
        
        const alreadyReadLocally = await isPersonaCommentRead(effectiveUserKey, currentPersona.persona_key);
        
        // ⭐ Not read locally = show badge!
        isUnread = !alreadyReadLocally;

      } else {
        // ⭐ User-created: Check DB field only
        // For user-created personas, we need actual user_key from DB
        if (!user?.user_key) {

          isUnread = false;
        } else {
          isUnread = currentPersona.persona_comment_checked === 'N';

        }
      }
      
      const shouldShow = hasComment && isUnread;
            
      setShowHistoryBadge(shouldShow);
    };

    checkBadgeVisibility();
  }, [currentPersona, user?.user_key]);
  
  const handlePress = (action) => {
    HapticService.medium();

    if(action.id === 'video') {

      if(isVideoConverting) {
        setShowTooltip(true);
        return;
      }
    }
    action.onClick();
  };
  
  // ⭐ Handle message button click (with video converting check)
  const handleMessageClick = () => {
    if (isVideoConverting) {

      HapticService.warning();
      setShowTooltip(true);
      return;
    }

    HapticService.medium();
    if (onMessageClick) {
      onMessageClick();
    } else {

    }
  };

  
  return (
    <>
    <View style={styles.container}>
      {/* ⭐ Tooltip (Left side of video chip) */}
      {showTooltip && (
        <Animated.View style={[styles.tooltip, tooltipAnimatedStyle]}>
          <CustomText style={styles.tooltipText}>
            {t('persona.video_converting_tooltip')}
          </CustomText>
          <View style={styles.tooltipArrow} />
        </Animated.View>
      )}
      
      {actions.map((action, index) => {
        const animatedStyle = animatedStyles[index];
        const isHistoryChip = action.id === 'history';
        const isDressChip = action.id === 'dress';
        const isVideoChip = action.id === 'video'; // ⭐ NEW: Video chip check
        
        // ⭐ Video chip states
        const hasVideo = currentPersona?.selected_dress_video_url !== null;
        const isWaitingState = isVideoChip && !hasVideo && !isVideoConverting; // State 1: 강렬한 효과
        const isConvertingState = isVideoChip && isVideoConverting; // State 2: 변환 중
        
        // ⭐ Video chip icon & color
        const videoIcon = isConvertingState ? 'timer-sand' : action.icon;
        const videoColor = isConvertingState 
          ? '#FFB84D' // 주황색 (변환 중)
          : isWaitingState 
            ? '#FF3B5C' // 강렬한 레드/핑크 (대기 중)
            : action.color;
        
        // ⭐ Video chip style (주황색 테마 for converting)
        const videoChipStyle = isVideoChip ? {
          backgroundColor: isConvertingState 
            ? 'rgba(0, 0, 0, 1)' // 주황색 배경 (변환 중)
            : isWaitingState
              ? 'rgba(255, 59, 92, 0.25)' // 레드 배경 (대기 중)
              : 'rgba(0, 0, 0, 0.65)',
          borderColor: isConvertingState
            ? 'rgba(255, 165, 0, 0.6)' // 주황색 테두리 (변환 중)
            : isWaitingState
              ? 'rgba(255, 59, 92, 0.7)' // 레드 테두리 (대기 중)
              : 'rgba(255, 255, 255, 0.3)',
          borderWidth: isWaitingState ? 2.5 : 1.5, // 대기 중에는 더 두꺼운 테두리
        } : {};
        
        return (
          <View key={action.id} style={[styles.chipWrapper, { display: action.id === 'video' ? 
          currentPersona?.selected_dress_video_url === null ? 'flex' : isVideoConverting ? 'flex' : 'none' 
          : 'flex' }]}>
            <AnimatedTouchable
              style={[
                styles.chip, 
                animatedStyle, 
                videoChipStyle,
                isVideoChip && videoChipAnimatedStyle // ⭐ Apply glow effect!
              ]}
              onPress={() => handlePress(action)}
              activeOpacity={0.7}
            >
              {/* ⭐ Dress chip: Icon rotates, badge stays fixed! */}
              {isDressChip ? (
                <Animated.View style={dressAnimatedStyle}>
                  <Icon 
                    name={action.icon} 
                    size={scale(24)} 
                    color={action.color || '#FFFFFF'} 
                  />
                </Animated.View>
              ) : isVideoChip ? (
                // ⭐ Video chip: Special icon animation (heartbeat or rotation)
                <Animated.View style={videoIconAnimatedStyle}>
                  <Icon 
                    name={videoIcon}
                    size={scale(24)} 
                    color={videoColor} 
                  />
                </Animated.View>
              ) : (
                <Icon 
                  name={action.icon} 
                  size={scale(24)} 
                  color={action.color || '#FFFFFF'} 
                />
              )}
              
              <Text style={[styles.label,{display:'none', color: action.color || '#FFFFFF'}]}>{action.label}</Text>
              
              {/* ⭐ NEW: Notification Badge for History Chip */}
              {isHistoryChip && showHistoryBadge && (
                <NotificationBadge visible={true} />
              )}
              
              {/* ⭐ NEW: Dress Count Badge (Fixed - doesn't rotate!) */}
              {isDressChip && (
                <DressCountBadge 
                  count={currentDressState.count}
                />
              )}
            </AnimatedTouchable>
          </View>
        );
      })}
    </View>

    {/* ⭐ Message Creation Button with Video Converting Indicator */}
    <View style={[styles.messageButtonContainer, {display: isVideoConverting ? 'none' : 'none'}]}>
      
      
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
  // ⭐ NEW: Tooltip (Left side of video chip)
  tooltip: {
    position: 'absolute',
    left: scale(-210), // ⭐ Position to the LEFT of chip container
    top: 0, // ⭐ Align with video chip (first chip)
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: scale(10),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 165, 0, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: scale(180), // ⭐ Minimum width for readability
    maxWidth: scale(220), // ⭐ Wider for better text display
  },
  tooltipText: {
    fontSize: scale(13), // ⭐ Slightly larger for better readability
    color: '#FFA500',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: scale(18), // ⭐ Better line spacing
  },
  tooltipArrow: {
    position: 'absolute',
    right: scale(-8), // ⭐ Arrow points to the right (toward chip)
    top: '50%',
    marginTop: scale(-8),
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftWidth: 8,
    borderLeftColor: 'rgba(0, 0, 0, 0.9)', // ⭐ Points RIGHT
  },
});

// 🔥 PERFORMANCE FIX: Memoize to prevent unnecessary re-renders
// Only re-render when currentPersona or currentDressState actually changes
export default memo(QuickActionChipsAnimated, (prevProps, nextProps) => {
  // persona_key 변경 시 리렌더링
  if (prevProps.currentPersona?.persona_key !== nextProps.currentPersona?.persona_key) {
    return false;
  }
  
  // 비디오 변환 상태 변경 시 리렌더링
  if (prevProps.isVideoConverting !== nextProps.isVideoConverting) {
    return false;
  }
  
  // 드레스 상태 변경 시 리렌더링
  if (
    prevProps.currentDressState?.count !== nextProps.currentDressState?.count ||
    prevProps.currentDressState?.hasCreating !== nextProps.currentDressState?.hasCreating
  ) {
    return false;
  }
  
  // 코멘트 읽음 상태 변경 시 리렌더링 (배지 표시)
  if (prevProps.currentPersona?.persona_comment_checked !== nextProps.currentPersona?.persona_comment_checked) {
    return false;
  }
  
  // 나머지는 동일 (리렌더링 스킵)
  return true;
});

