/**
 * 🎖️ TierUpgradeSheet - Universal Tier Upgrade Bottom Sheet
 * 
 * Features:
 * - Display current user tier
 * - Dropdown to select new tier (Basic, Premium, Ultimate)
 * - Tier-specific service information
 * - Upgrade/Cancel buttons
 * - Disable upgrade if already at selected tier
 * - Independent Modal (works inside ManagerAIOverlay!)
 * 
 * Usage:
 * ```jsx
 * <TierUpgradeSheet
 *   isOpen={showTierUpgrade}
 *   onClose={() => setShowTierUpgrade(false)}
 *   currentTier={user?.user_level || 'basic'}
 *   userKey={user?.user_key}
 *   onUpgradeSuccess={(newTier) => {
 *     // Update local user state
 *   }}
 * />
 * ```
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-06
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useAnima } from '../../contexts/AnimaContext';


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎖️ TIER CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TIER_CONFIG = {
  basic: {
    key: 'basic',
    name: 'Basic',
    emoji: '🌟',
    color: '#9CA3AF', // Gray
    gradient: ['#6B7280', '#9CA3AF'],
    price: '무료',
    features: [
      { icon: '💬', text: '일일 채팅 20회' },
      { icon: '🎭', text: '페르소나 생성 1개' },
      { icon: '👗', text: '드레스 생성 제한' },
      { icon: '🎵', text: '음악 생성 제한' },
      { icon: '📱', text: '기본 기능 사용' },
    ],
  },
  premium: {
    key: 'premium',
    name: 'Premium',
    emoji: '💎',
    color: '#3B82F6', // Blue
    gradient: ['#2563EB', '#3B82F6'],
    price: '₩9,900/월',
    features: [
      { icon: '💬', text: '일일 채팅 100회' },
      { icon: '🎭', text: '페르소나 생성 5개' },
      { icon: '👗', text: '드레스 무제한 생성' },
      { icon: '🎵', text: '음악 생성 월 10회' },
      { icon: '🎬', text: '비디오 변환 할인' },
      { icon: '✨', text: '프리미엄 기능 우선 체험' },
    ],
  },
  ultimate: {
    key: 'ultimate',
    name: 'Ultimate',
    emoji: '👑',
    color: '#8B5CF6', // Purple
    gradient: ['#7C3AED', '#8B5CF6'],
    price: '₩19,900/월',
    features: [
      { icon: '💬', text: '일일 채팅 무제한' },
      { icon: '🎭', text: '페르소나 생성 10개' },
      { icon: '👗', text: '드레스 무제한 생성' },
      { icon: '🎵', text: '음악 생성 무제한' },
      { icon: '🎬', text: '비디오 변환 무료' },
      { icon: '🚀', text: '최신 AI 모델 우선 적용' },
      { icon: '💝', text: '특별 이벤트 초대' },
    ],
  },
};

const TIER_ORDER = ['basic', 'premium', 'ultimate'];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎖️ TIER UPGRADE SHEET COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TierUpgradeSheet = ({
  isOpen = false,
  onClose,
  currentTier = 'basic',
  userKey,
  onUpgradeSuccess,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAnima();
  
  const [selectedTier, setSelectedTier] = useState(currentTier);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 Current & Selected Tier Info
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const currentTierConfig = useMemo(() => TIER_CONFIG[currentTier] || TIER_CONFIG.basic, [currentTier]);
  const selectedTierConfig = useMemo(() => TIER_CONFIG[selectedTier] || TIER_CONFIG.basic, [selectedTier]);
  
  // Check if upgrade is possible (selected tier is higher than current)
  const canUpgrade = useMemo(() => {
    const currentIndex = TIER_ORDER.indexOf(currentTier);
    const selectedIndex = TIER_ORDER.indexOf(selectedTier);
    return selectedIndex > currentIndex;
  }, [currentTier, selectedTier]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 Handlers
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const handleTierSelect = useCallback((tier) => {
    HapticService.light();
    setSelectedTier(tier);
    setIsDropdownOpen(false);
  }, []);
  
  const handleUpgrade = useCallback(async () => {
    if (!canUpgrade) {
      HapticService.warning();
      showAlert({
        emoji: '⚠️',
        title: t('tier.already_at_tier_title'),
        message: t('tier.already_at_tier_message', { tier: selectedTierConfig.name }),
        buttons: [{ text: t('common.confirm'), style: 'primary', onPress: () => {} }],
      });
      return;
    }
    
    if (!userKey) {
      HapticService.warning();
      showAlert({
        emoji: '⚠️',
        title: t('common.login_guide.title'),
        message: t('common.login_guide.description'),
        buttons: [{ text: t('common.confirm'), style: 'primary', onPress: () => {} }],
      });
      return;
    }
    
    try {
      setIsUpgrading(true);
      HapticService.medium();
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 💳 TODO: Payment Integration (Google Pay / Apple Pay)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      /*
      const paymentResult = await processPayment({
        user_key: userKey,
        tier: selectedTier,
        amount: getPaymentAmount(selectedTier),
        platform: Platform.OS === 'ios' ? 'apple' : 'google',
      });
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }
      */
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔄 API Call: Update user tier
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      const response = await fetch(
        'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/user/upgrade-tier',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_key: userKey,
            new_tier: selectedTier,
          }),
        }
      );
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Upgrade failed');
      }
      
      // ✅ Success!
      HapticService.success();
      
      showAlert({
        emoji: '🎉',
        title: t('tier.upgrade_success_title'),
        message: t('tier.upgrade_success_message', { tier: selectedTierConfig.name }),
        buttons: [
          {
            text: t('common.confirm'),
            style: 'primary',
            onPress: () => {
              // Notify parent component
              if (onUpgradeSuccess) {
                onUpgradeSuccess(selectedTier);
              }
              
              // Close sheet
              onClose();
            },
          },
        ],
      });
      
    } catch (error) {
      console.error('❌ [TierUpgrade] Error:', error);
      HapticService.error();
      
      showAlert({
        emoji: '❌',
        title: t('tier.upgrade_error_title'),
        message: error.message || t('tier.upgrade_error_message'),
        buttons: [{ text: t('common.confirm'), style: 'primary', onPress: () => {} }],
      });
    } finally {
      setIsUpgrading(false);
    }
  }, [canUpgrade, userKey, selectedTier, selectedTierConfig, showAlert, t, onUpgradeSuccess, onClose]);
  
  const handleClose = useCallback(() => {
    HapticService.light();
    setIsDropdownOpen(false);
    onClose();
  }, [onClose]);
  
  if (!isOpen) return null;
  
  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >

        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        
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
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <CustomText type="title" bold color={COLORS.TEXT_PRIMARY}>
                🗣️ {t('tier.upgrade_sheet.title')}
              </CustomText>
            </View>
            
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={scale(24)} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>
        
          
          {/* Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

          </ScrollView>
          
          {/* Footer Buttons */}
          <View style={styles.footer}>
            <CustomButton
              title={t('common.cancel')}
              onPress={handleClose}
              type="outline"
              size="medium"
              style={styles.resetButton}
            />
            <CustomButton
              title={t('common.save')}
              onPress={handleUpgrade}
              type="primary"
              size="medium"
              style={styles.saveButton}
            />
          </View>
          {/*
          {saving && (
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="small" color={COLORS.DEEP_BLUE} />
              <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ marginLeft: scale(8) }}>
                저장 중...
              </CustomText>
            </View>
          )}
          */}
        </Animated.View>
 
    </Modal>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheetContainer: {
    backgroundColor: COLORS.DEEP_BLUE_DARK,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '85%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
   modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Header
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  headerEmoji: {
    fontSize: moderateScale(32),
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: verticalScale(2),
  },
  closeButton: {
    padding: scale(8),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Scroll Content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(20),
  },
  
  section: {
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(12),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Dropdown
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    borderWidth: 2,
  },
  dropdownOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  dropdownEmoji: {
    fontSize: moderateScale(32),
  },
  dropdownTextContainer: {
    gap: verticalScale(2),
  },
  dropdownText: {
    color: COLORS.TEXT_PRIMARY,
  },
  dropdownPrice: {
    color: COLORS.TEXT_SECONDARY,
  },
  
  dropdownOptions: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderBottomLeftRadius: moderateScale(12),
    borderBottomRightRadius: moderateScale(12),
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    borderLeftWidth: 3,
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  dropdownOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    flex: 1,
  },
  dropdownOptionEmoji: {
    fontSize: moderateScale(28),
  },
  dropdownOptionTextContainer: {
    flex: 1,
    gap: verticalScale(2),
  },
  dropdownOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  dropdownOptionText: {
    color: COLORS.TEXT_PRIMARY,
  },
  dropdownOptionPrice: {
    color: COLORS.TEXT_SECONDARY,
  },
  currentBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
  },
  currentBadgeText: {
    color: '#22C55E',
    fontSize: moderateScale(10),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tier Card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  tierCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: moderateScale(12),
    padding: platformPadding(16),
    borderWidth: 2,
    gap: verticalScale(12),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  featureIcon: {
    fontSize: moderateScale(20),
  },
  featureText: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Footer
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  footer: {
    flexDirection: 'row',
    gap: scale(12),
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(16),
    paddingBottom: platformPadding(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    gap: scale(8),
  },
  cancelButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  cancelButtonText: {
    color: COLORS.TEXT_PRIMARY,
  },
  upgradeButton: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  upgradeButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
  },
    modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '85%',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tabs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    gap: scale(8),
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(12),
    backgroundColor: COLORS.CARD_BACKGROUND,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: COLORS.DEEP_BLUE + '15',
    borderColor: COLORS.DEEP_BLUE,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tab Content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tabContent: {
    flex: 1,
  },
  tabDescription: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    marginTop: verticalScale(-26),
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(100),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionHeader: {
    marginBottom: verticalScale(12),
    flexDirection: 'row',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: COLORS.DIVIDER,
    gap: scale(6),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    backgroundColor: 'transparent',
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: COLORS.DEEP_BLUE,
    borderStyle: 'dashed',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
    gap: scale(12),
  },
  resetButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  savingOverlay: {
    position: 'absolute',
    bottom: verticalScale(100),
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    backgroundColor: COLORS.BACKGROUND,
  },
  nicknameWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(12),
    backgroundColor: '#FF9500' + '15',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#FF9500' + '30',
    marginBottom: verticalScale(12),
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginTop: verticalScale(-10),
    marginBottom: verticalScale(22),
  },
});

export default TierUpgradeSheet;

