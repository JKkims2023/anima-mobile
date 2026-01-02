/**
 * 🚫 ChatLimitSheet Component
 * 
 * Bottom sheet shown when daily chat limit is reached
 * Uses CustomBottomSheet for design consistency
 * 
 * Features:
 * - Tier-specific messaging
 * - Upgrade CTA
 * - Reset time display
 * - Animated illustrations
 * 
 * @author JK & Hero Nexus
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import { scale, moderateScale, verticalScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const ChatLimitSheet = ({
  isOpen = false,
  onClose,
  tier = 'free',
  limit = 20,
  resetTime = null,
  canUpgrade = true,
  onUpgrade = null,
  isOnboarding = false
}) => {
  // Calculate hours until reset
  const hoursUntilReset = resetTime 
    ? Math.ceil((new Date(resetTime) - new Date()) / (1000 * 60 * 60))
    : 0;
  
  // Tier-specific content
  const getContent = () => {
    switch (tier) {
      case 'free':
        return {
          emoji: '💬',
          title: 'Daily Limit Reached',
          message: `You've used all ${limit} conversations today!${isOnboarding ? '\n(Including your welcome bonus! 🎁)' : ''}`,
          upgradeMessage: 'Upgrade to Basic for 50 chats/day,\nor Premium for 200 chats/day!',
          upgradeTier: 'Basic',
          upgradePrice: '₩19,900/month'
        };
      
      case 'basic':
        return {
          emoji: '⭐',
          title: 'Daily Limit Reached',
          message: `You've used all ${limit} conversations today!`,
          upgradeMessage: 'Upgrade to Premium for 200 chats/day,\nor Ultimate for virtually unlimited!',
          upgradeTier: 'Premium',
          upgradePrice: '₩39,900/month'
        };
      
      case 'premium':
        return {
          emoji: '💎',
          title: 'Daily Limit Reached',
          message: `You've used all ${limit} conversations today!`,
          upgradeMessage: 'Upgrade to Ultimate for 1,000 chats/day\n(virtually unlimited)!',
          upgradeTier: 'Ultimate',
          upgradePrice: '₩79,900/month'
        };
      
      default:
        return {
          emoji: '⏰',
          title: 'Daily Limit Reached',
          message: `You've used all ${limit} conversations today!`,
          upgradeMessage: null,
          upgradeTier: null,
          upgradePrice: null
        };
    }
  };
  
  const content = getContent();
  
  // Format reset time
  const formatResetTime = () => {
    if (!resetTime) return 'midnight';
    
    const resetDate = new Date(resetTime);
    const hours = resetDate.getHours();
    const minutes = resetDate.getMinutes();
    
    if (hours === 0 && minutes === 0) {
      return 'midnight';
    }
    
    return resetDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return (
    <CustomBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      height={canUpgrade && content.upgradeMessage ? 480 : 360}
    >
      <View style={styles.container}>
        {/* Emoji Icon */}
        <View style={styles.emojiContainer}>
          <CustomText type="big" style={styles.emoji}>
            {content.emoji}
          </CustomText>
        </View>
        
        {/* Title */}
        <CustomText type="big" bold style={styles.title}>
          {content.title}
        </CustomText>
        
        {/* Message */}
        <CustomText type="normal" style={styles.message}>
          {content.message}
        </CustomText>
        
        {/* Reset Info */}
        <View style={styles.resetInfoCard}>
          <Icon name="clock-outline" size={scale(20)} color={COLORS.DEEP_BLUE} />
          <View style={styles.resetTextContainer}>
            <CustomText type="small" bold style={styles.resetLabel}>
              Resets at {formatResetTime()}
            </CustomText>
            <CustomText type="tiny" style={styles.resetSubtext}>
              {hoursUntilReset > 0 
                ? `in ${hoursUntilReset} hour${hoursUntilReset > 1 ? 's' : ''}` 
                : 'very soon'}
            </CustomText>
          </View>
        </View>
        
        {/* Upgrade Section */}
        {canUpgrade && content.upgradeMessage && (
          <View style={styles.upgradeSection}>
            <View style={styles.upgradeDivider} />
            
            <CustomText type="small" style={styles.upgradeMessage}>
              {content.upgradeMessage}
            </CustomText>
            
            {onUpgrade && (
              <CustomButton
                title={`Upgrade to ${content.upgradeTier}`}
                type="primary"
                onPress={onUpgrade}
                style={styles.upgradeButton}
                leftIcon={<Icon name="arrow-up-circle" size={scale(20)} color="#FFF" />}
              />
            )}
            
            <CustomText type="tiny" style={styles.priceText}>
              {content.upgradePrice}
            </CustomText>
          </View>
        )}
        
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <CustomText type="normal" style={styles.closeText}>
            Got it
          </CustomText>
        </TouchableOpacity>
      </View>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: scale(24),
    alignItems: 'center',
  },
  
  // Emoji
  emojiContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: moderateScale(40),
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  emoji: {
    fontSize: moderateScale(40),
  },
  
  // Text
  title: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(12),
    textAlign: 'center',
  },
  message: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: scale(20),
    lineHeight: moderateScale(22),
  },
  
  // Reset Info Card
  resetInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderRadius: moderateScale(12),
    width: '100%',
    marginBottom: scale(20),
  },
  resetTextContainer: {
    marginLeft: scale(12),
    flex: 1,
  },
  resetLabel: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(4),
  },
  resetSubtext: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: moderateScale(11),
  },
  
  // Upgrade Section
  upgradeSection: {
    width: '100%',
    alignItems: 'center',
  },
  upgradeDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: scale(20),
  },
  upgradeMessage: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: scale(16),
    lineHeight: moderateScale(20),
  },
  upgradeButton: {
    width: '100%',
    marginBottom: scale(8),
  },
  priceText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: moderateScale(11),
    marginBottom: scale(16),
  },
  
  // Close Button
  closeButton: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
  },
  closeText: {
    color: COLORS.DEEP_BLUE,
    fontSize: moderateScale(15),
  },
});

export default ChatLimitSheet;

