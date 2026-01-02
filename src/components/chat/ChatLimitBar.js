/**
 * 💬 ChatLimitBar Component
 * 
 * Displays remaining chat count for the day
 * Shows at the top of chat screen
 * Animates when approaching limit
 * 
 * Features:
 * - Tier-aware display
 * - Color-coded warning levels
 * - Animated progress bar
 * - Onboarding bonus indicator
 * - Upgrade CTA when low
 * 
 * @author JK & Hero Nexus
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { scale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const ChatLimitBar = ({
  currentCount = 0,
  dailyLimit = 20,
  tier = 'free',
  isOnboarding = false,
  onUpgradePress = null,
  style = {}
}) => {
  // Calculate metrics
  const remaining = Math.max(0, dailyLimit - currentCount);
  const percentage = dailyLimit > 0 ? (currentCount / dailyLimit) * 100 : 0;
  
  // Determine warning level
  const warningLevel = useMemo(() => {
    if (percentage >= 90) return 'critical'; // 90%+
    if (percentage >= 70) return 'warning';  // 70-89%
    if (percentage >= 50) return 'caution';  // 50-69%
    return 'normal'; // 0-49%
  }, [percentage]);
  
  // Color scheme based on warning level
  const colors = useMemo(() => {
    switch (warningLevel) {
      case 'critical':
        return {
          gradient: ['#EF4444', '#DC2626'],
          text: '#FFF',
          icon: '#FFF',
          bg: 'rgba(239, 68, 68, 0.1)'
        };
      case 'warning':
        return {
          gradient: ['#F59E0B', '#D97706'],
          text: '#FFF',
          icon: '#FFF',
          bg: 'rgba(245, 158, 11, 0.1)'
        };
      case 'caution':
        return {
          gradient: ['#10B981', '#059669'],
          text: '#FFF',
          icon: '#FFF',
          bg: 'rgba(16, 185, 129, 0.1)'
        };
      default:
        return {
          gradient: [COLORS.DEEP_BLUE, '#3B82F6'],
          text: '#FFF',
          icon: '#FFF',
          bg: 'rgba(59, 130, 246, 0.1)'
        };
    }
  }, [warningLevel]);
  
  // Tier display name
  const tierDisplayName = useMemo(() => {
    switch (tier) {
      case 'basic': return '⭐ Basic';
      case 'premium': return '💎 Premium';
      case 'ultimate': return '👑 Ultimate';
      default: return '💙 Free';
    }
  }, [tier]);
  
  // Show upgrade button if low and not ultimate
  const showUpgrade = warningLevel === 'critical' && tier !== 'ultimate' && onUpgradePress;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }, style]}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { 
                width: `${Math.min(100, percentage)}%`,
                backgroundColor: colors.gradient[0] // Use first color from gradient
              }
            ]}
          />
        </View>
      </View>
      
      {/* Info Row */}
      <View style={styles.infoRow}>
        {/* Left: Tier & Count */}
        <View style={styles.leftInfo}>
          <CustomText type="small" bold style={[styles.tierText, { color: colors.text }]}>
            {tierDisplayName}
          </CustomText>
          
          <View style={styles.countContainer}>
            <Icon name="message-text" size={scale(14)} color={colors.icon} />
            <CustomText type="small" bold style={[styles.countText, { color: colors.text }]}>
              {remaining} left today
            </CustomText>
            
            {isOnboarding && (
              <View style={styles.bonusBadge}>
                <CustomText type="tiny" bold style={styles.bonusText}>
                  +BONUS
                </CustomText>
              </View>
            )}
          </View>
        </View>
        
        {/* Right: Upgrade or Info */}
        {showUpgrade ? (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={onUpgradePress}
            activeOpacity={0.7}
          >
            <Icon name="arrow-up-circle" size={scale(16)} color={COLORS.DEEP_BLUE} />
            <CustomText type="tiny" bold style={styles.upgradeText}>
              Upgrade
            </CustomText>
          </TouchableOpacity>
        ) : (
          <CustomText type="tiny" style={[styles.limitText, { color: colors.text }]}>
            {currentCount}/{dailyLimit}
          </CustomText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: moderateScale(12),
    marginHorizontal: scale(12),
    marginBottom: scale(8),
  },
  
  // Progress Bar
  progressBarContainer: {
    marginBottom: scale(8),
  },
  progressBarBackground: {
    height: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: moderateScale(2),
  },
  
  // Info Row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flex: 1,
  },
  tierText: {
    marginBottom: scale(4),
    opacity: 0.9,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  countText: {
    fontSize: moderateScale(13),
  },
  limitText: {
    fontSize: moderateScale(12),
    opacity: 0.8,
  },
  
  // Bonus Badge
  bonusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: moderateScale(4),
    marginLeft: scale(4),
  },
  bonusText: {
    color: '#FFF',
    fontSize: moderateScale(9),
  },
  
  // Upgrade Button
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: moderateScale(12),
    gap: scale(4),
  },
  upgradeText: {
    color: COLORS.DEEP_BLUE,
    fontSize: moderateScale(11),
  },
});

export default ChatLimitBar;

