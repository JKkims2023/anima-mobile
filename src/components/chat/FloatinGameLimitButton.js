/**
 * 💰 FloatingChatLimitButton - Circular Floating Chat Limit Display
 * 
 * Features:
 * - Circular design with progress border
 * - Shows remaining chat count
 * - Click to show tooltip with tier info
 * - Animated tooltip (slide in/out from right)
 * - Visual progress indicator
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-05
 */

import React, { useRef, memo, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from '../CustomText';
import { scale, moderateScale, verticalScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';
// ⭐ Tier display configuration
const TIER_CONFIG = {
  free: {
    label: 'Free',
    emoji: '💙',
    color: '#60A5FA',
    gradient: ['#3B82F6', '#60A5FA'],
  },
  basic: {
    label: 'Basic',
    emoji: '⭐',
    color: '#FBBF24',
    gradient: ['#F59E0B', '#FBBF24'],
  },
  premium: {
    label: 'Premium',
    emoji: '💎',
    color: '#A78BFA',
    gradient: ['#8B5CF6', '#A78BFA'],
  },
  ultimate: {
    label: 'Ultimate',
    emoji: '👑',
    color: '#F472B6',
    gradient: ['#EC4899', '#F472B6'],
  },
};

const FloatingGameLimitButton = ({
  currentCount = 0,
  dailyLimit = 20,
  tier = 'free',
  isOnboarding = false,
  onUpgradePress,
  onBuyPointPress,
  onTooltipVisibilityChange, // ⭐ NEW: Callback to notify parent of tooltip state
  tooltipVisibleRef, // ⭐ NEW: Ref to expose close function to parent
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const tooltipVisible = useSharedValue(0);
  const tooltipTranslateX = useSharedValue(10);
  
  // Calculate remaining and progress
  const remaining = tier === 'ultimate' ? '∞' : Math.max(0, dailyLimit - currentCount);
  const progress = dailyLimit > 0 ? (remaining / dailyLimit) : 0;
  
  // Get tier config
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.free;
  
  // Circle dimensions for progress
  const CIRCLE_SIZE = scale(40);
  const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
  const STROKE_WIDTH = scale(3.5);
  const PROGRESS_RADIUS = CIRCLE_RADIUS - STROKE_WIDTH / 2;
  const CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;
  
  // Calculate stroke dash offset for progress (clockwise from top)
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);


  useEffect(() => {
    console.log('tier: ', tier);
  }, [tier]);
  
  // ⭐ NEW: Close tooltip function (exposed to parent via ref)
  const closeTooltip = () => {
    const isVisible = tooltipVisible.value === 1;
    
    if (isVisible) {
      tooltipVisible.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      tooltipTranslateX.value = withTiming(10, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      
      // ⭐ Notify parent that tooltip is closed
      if (onTooltipVisibilityChange) {
        onTooltipVisibilityChange(false);
      }
    }
  };
  
  // ⭐ NEW: Expose closeTooltip function to parent via ref
  useEffect(() => {
    if (tooltipVisibleRef) {
      tooltipVisibleRef.current = { closeTooltip };
    }
  }, [tooltipVisibleRef]);
  
  // Toggle tooltip
  const handlePress = () => {
    HapticService.light();
    
    const isVisible = tooltipVisible.value === 1;
    
    if (isVisible) {
      // Hide tooltip
      tooltipVisible.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      tooltipTranslateX.value = withTiming(10, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      
      // ⭐ Notify parent that tooltip is closed
      if (onTooltipVisibilityChange) {
        onTooltipVisibilityChange(false);
      }
    } else {
      // Show tooltip
      tooltipVisible.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.back(1.1)),
      });
      tooltipTranslateX.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.back(1.1)),
      });
      
      // ⭐ Notify parent that tooltip is opened
      if (onTooltipVisibilityChange) {
        onTooltipVisibilityChange(true);
      }
    }
  };
  
  // Animated styles
  const tooltipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tooltipVisible.value,
    transform: [{ translateX: tooltipTranslateX.value }],
  }));
  

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(10),
      right: scale(12),
      zIndex: 1000,
    },
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Circular Button
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    button: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      // Shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    progressSvg: {
      position: 'absolute',
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    countText: {
      color: '#FFFFFF',
      fontSize: moderateScale(16),
      marginTop: verticalScale(-2),
    },
    onboardingBadge: {
      position: 'absolute',
      top: verticalScale(-8),
      right: scale(-8),
      width: scale(18),
      height: scale(18),
      borderRadius: scale(9),
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    onboardingText: {
      fontSize: moderateScale(10),
    },
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Tooltip
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    tooltip: {
      position: 'absolute',
      top: verticalScale(5),
      right: scale(56), // Button width + gap
      minWidth: scale(180),
      maxWidth: scale(220),
    },
    tooltipContent: {
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      borderRadius: scale(12),
      borderWidth: 1.5,
      paddingHorizontal: scale(14),
      paddingVertical: verticalScale(10),
      gap: verticalScale(8),
      // Shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 8,
    },
    tooltipRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tooltipLabel: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: moderateScale(14),
    },
    tooltipValue: {
      color: '#FFFFFF',
      fontSize: moderateScale(16),
      marginRight: scale(4),
    },
    tierBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      paddingHorizontal: scale(8),
      paddingVertical: verticalScale(2),
      borderRadius: scale(8),
      backgroundColor: 'rgba(255, 255, 255, 0.1)',

    },
    tierEmoji: {
      fontSize: moderateScale(12),
    },
    tierText: {
      fontSize: moderateScale(14),
    },
    onboardingInfo: {
      marginTop: verticalScale(4),
      paddingVertical: verticalScale(6),
      paddingHorizontal: scale(8),
      borderRadius: scale(6),
      backgroundColor: 'rgba(251, 191, 36, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    onboardingInfoText: {
      color: '#FBBF24',
      fontSize: moderateScale(10),
      textAlign: 'center',
    },
    upgradeButton: {
      marginTop: verticalScale(6),
      paddingVertical: verticalScale(8),
      paddingHorizontal: scale(12),
      borderRadius: scale(8),
      justifyContent: 'center',
      alignItems: 'center',
    },
    buyPointButton: {
      marginTop: verticalScale(6),
      paddingVertical: verticalScale(8),
      paddingHorizontal: scale(12),
      borderRadius: scale(8),
      justifyContent: 'center',
      alignItems: 'center',
    },
    upgradeButtonText: {
      color: '#FFFFFF',
      fontSize: moderateScale(14),
    },
    tooltipArrow: {
      position: 'absolute',
      right: scale(-8),
      top: verticalScale(20),
      marginTop: verticalScale(-8),
      width: 0,
      height: 0,
      borderTopWidth: 8,
      borderTopColor: 'transparent',
      borderBottomWidth: 8,
      borderBottomColor: 'transparent',
      borderLeftWidth: 8,
      borderLeftColor: 'transparent',
      borderRightWidth: 8,
    },
  });


  return (
    <View style={styles.container}>
      {/* Circular Button */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.button}
      >
        {/* Progress Circle (SVG) */}
        <Svg
          width={CIRCLE_SIZE}
          height={CIRCLE_SIZE}
          style={styles.progressSvg}
        >
          {/* Background Circle */}
          <Circle
            cx={CIRCLE_RADIUS}
            cy={CIRCLE_RADIUS}
            r={PROGRESS_RADIUS}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          
          {/* Progress Circle */}
          <Circle
            cx={CIRCLE_RADIUS}
            cy={CIRCLE_RADIUS}
            r={PROGRESS_RADIUS}
            stroke={tierConfig.color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${CIRCLE_RADIUS}, ${CIRCLE_RADIUS}`}
          />
        </Svg>
        
        {/* Center Content */}
        <View style={styles.centerContent}>
          <CustomText type="huge" style={styles.countText}>
            {remaining}
          </CustomText>
          {isOnboarding && (
            <View style={styles.onboardingBadge}>
              <CustomText type="tiny" bold style={styles.onboardingText}>
                🎁
              </CustomText>
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Tooltip */}
      <Animated.View style={[styles.tooltip, tooltipAnimatedStyle]}>
        <View style={[styles.tooltipContent, { borderColor: tierConfig.color }]}>
          {/* Tier */}
          <View style={styles.tooltipRow}>
            <CustomText type="small" style={styles.tooltipLabel}>
              {t('floating_chat_limit_button.tooltip.title')}
            </CustomText>
            <View style={styles.tierBadge}>
              <CustomText type="small" style={styles.tierEmoji}>
                {tierConfig.emoji}
              </CustomText>
              <CustomText type="small" bold style={[styles.tierText, { color: tierConfig.color }]}>
                {tierConfig.label}
              </CustomText>
            </View>
          </View>
          
          {/* Remaining */}
          <View style={styles.tooltipRow}>
            <CustomText type="small" style={styles.tooltipLabel}>
              {t('floating_chat_limit_button.tooltip.remaining')}
            </CustomText>
            <CustomText type="small" bold style={styles.tooltipValue}>
              {tier === 'ultimate' ? '∞' : remaining}
            </CustomText>
          </View>
          
          {/* Daily Limit */}
          <View style={styles.tooltipRow}>
            <CustomText type="small" style={styles.tooltipLabel}>
              {t('floating_chat_limit_button.tooltip.daily_limit')}
            </CustomText>
            <CustomText type="small" bold style={styles.tooltipValue}>
              {tier === 'ultimate' ? '∞' : dailyLimit}
            </CustomText>
          </View>
          
          {/* Onboarding Bonus */}
          {isOnboarding && (
            <View style={styles.onboardingInfo}>
              <CustomText type="tiny" style={styles.onboardingInfoText}>
                {t('floating_chat_limit_button.tooltip.onboarding_bonus')}
              </CustomText>
            </View>
          )}
          
          {/* Upgrade Button (if not ultimate) */}
          {tier !== 'ultimate' && onUpgradePress && (
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: tierConfig.color }]}
              onPress={() => {
                HapticService.medium();

                onUpgradePress();
                closeTooltip();
              }}
              activeOpacity={0.8}
            >
              <CustomText type="title" bold style={styles.upgradeButtonText}>
                ⬆️ {t('floating_chat_limit_button.tooltip.upgrade')}
              </CustomText>
            </TouchableOpacity>
          )}

          {/* Upgrade Button (if not ultimate) */}
          {tier !== 'ultimate' && onBuyPointPress && remaining <= 0 && (
            <TouchableOpacity
              style={[styles.buyPointButton, { backgroundColor: '#60A5FA' }]}
              onPress={() => {
                HapticService.medium();
                onBuyPointPress();
                closeTooltip();
              }}
              activeOpacity={0.8}
            >
              <CustomText type="small" bold style={styles.upgradeButtonText}>
              🔄 {t('floating_chat_limit_button.tooltip.clear_limit')}
              </CustomText>
            </TouchableOpacity>
          )}

        </View>
        
        {/* Tooltip Arrow (pointing to button) */}
        <View style={[styles.tooltipArrow, { borderRightColor: tierConfig.color }]} />
      </Animated.View>
    </View>
  );
};

export default memo(FloatingGameLimitButton);

