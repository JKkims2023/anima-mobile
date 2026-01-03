/**
 * 🚫 ChatLimitSheet Component (Modal-based)
 * 
 * Bottom sheet shown when daily chat limit is reached
 * Independent Modal (works inside ManagerAIOverlay Modal)
 * 
 * Features:
 * - Tier-specific messaging
 * - Upgrade CTA
 * - Reset time display
 * - Animated illustrations
 * - Slide-up animation
 * 
 * @author JK & Hero Nexus
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Animated 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import { scale, moderateScale, verticalScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';

const ChatLimitSheet = ({
  isOpen = false,
  onClose,
  tier = 'free',
  limit = 20,
  basic_limit = 50,
  premium_limit = 200,
  resetTime = null,
  canUpgrade = true,
  onUpgrade = null,
  isOnboarding = false
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATION EFFECTS (Same as SpeakingPatternSheet)
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      HapticService.error(); // Haptic feedback when limit is reached
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1000,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);
  
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
          title: t('limit_sheet.title'),
          message: t('limit_sheet.message', { count: limit }),
          upgradeMessage: t('limit_sheet.upgrade_message', { basic_limit: basic_limit, premium_limit: premium_limit }),
          upgradeTier: 'Basic',
          upgradePrice: '₩19,900/month'
        };
      
      case 'basic':
        return {
          emoji: '⭐',
          title: t('limit_sheet.title'),
          message: t('limit_sheet.message', { count: limit }),
          upgradeMessage: t('limit_sheet.upgrade_basic_message', { premium_limit: premium_limit }),
          upgradeTier: 'Premium',
          upgradePrice: '₩39,900/month'
        };
      
      case 'premium':
        return {
          emoji: '💎',
          title: t('limit_sheet.title'),
          message: t('limit_sheet.message', { count: limit }),
          upgradeMessage: t('limit_sheet.upgrade_ultimate_message'),
          upgradeTier: 'Ultimate',
          upgradePrice: '₩79,900/month'
        };
      
      default:
        return {
          emoji: '⏰',
          title: t('limit_sheet.title'),
          message: t('limit_sheet.message', { count: limit }),
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
  
  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleClose = () => {
    HapticService.light();
    onClose?.();
  };
  
  const handleUpgrade = () => {
    HapticService.success();
    onUpgrade?.();
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  
  if (!isOpen) return null;
  
  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View 
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0,0,0,0.7)',
              opacity: backdropOpacity,
            }
          ]} 
        />
      </TouchableOpacity>
      
      {/* Modal Container */}
      <Animated.View 
        style={[
          styles.modalContainer,
          {
            paddingBottom: insets.bottom + verticalScale(20),
            transform: [{ translateY: slideAnim }],
          },
        ]}
        onStartShouldSetResponder={() => true}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
        
        {/* Content */}
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
                  onPress={handleUpgrade}
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
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <CustomText type="normal" style={styles.closeText}>
              Got it
            </CustomText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Modal Structure (Same as SpeakingPatternSheet)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(12),
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: COLORS.TEXT_TERTIARY,
    borderRadius: moderateScale(2),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

