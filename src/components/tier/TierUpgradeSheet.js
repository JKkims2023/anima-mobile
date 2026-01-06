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

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
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
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        {/* Sheet Container */}
        <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + verticalScale(20) }]}>
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* Header */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <CustomText type="huge" style={styles.headerEmoji}>
                🎖️
              </CustomText>
              <View>
                <CustomText type="title" bold style={styles.headerTitle}>
                  {t('tier.upgrade_title', '티어 업그레이드')}
                </CustomText>
                <CustomText type="small" style={styles.headerSubtitle}>
                  {t('tier.current_tier', '현재 티어')}: {currentTierConfig.emoji} {currentTierConfig.name}
                </CustomText>
              </View>
            </View>
            
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={moderateScale(24)} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>
          
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* Scrollable Content */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* Tier Selection Dropdown */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            
            <View style={styles.section}>
              <CustomText type="medium" bold style={styles.sectionTitle}>
                {t('tier.select_tier', '티어 선택')}
              </CustomText>
              
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  { borderColor: selectedTierConfig.color },
                  isDropdownOpen && styles.dropdownOpen,
                ]}
                onPress={() => {
                  HapticService.light();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.dropdownSelected}>
                  <CustomText type="huge" style={styles.dropdownEmoji}>
                    {selectedTierConfig.emoji}
                  </CustomText>
                  <View style={styles.dropdownTextContainer}>
                    <CustomText type="medium" bold style={styles.dropdownText}>
                      {selectedTierConfig.name}
                    </CustomText>
                    <CustomText type="small" style={styles.dropdownPrice}>
                      {selectedTierConfig.price}
                    </CustomText>
                  </View>
                </View>
                
                <Icon
                  name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={moderateScale(20)}
                  color={COLORS.TEXT_PRIMARY}
                />
              </TouchableOpacity>
              
              {/* Dropdown Options */}
              {isDropdownOpen && (
                <View style={styles.dropdownOptions}>
                  {TIER_ORDER.map((tierKey) => {
                    const tierConfig = TIER_CONFIG[tierKey];
                    const isSelected = tierKey === selectedTier;
                    const isCurrent = tierKey === currentTier;
                    
                    return (
                      <TouchableOpacity
                        key={tierKey}
                        style={[
                          styles.dropdownOption,
                          isSelected && styles.dropdownOptionSelected,
                          { borderLeftColor: tierConfig.color },
                        ]}
                        onPress={() => handleTierSelect(tierKey)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownOptionContent}>
                          <CustomText type="huge" style={styles.dropdownOptionEmoji}>
                            {tierConfig.emoji}
                          </CustomText>
                          <View style={styles.dropdownOptionTextContainer}>
                            <View style={styles.dropdownOptionHeader}>
                              <CustomText type="medium" bold style={styles.dropdownOptionText}>
                                {tierConfig.name}
                              </CustomText>
                              {isCurrent && (
                                <View style={styles.currentBadge}>
                                  <CustomText type="tiny" bold style={styles.currentBadgeText}>
                                    {t('tier.current', '현재')}
                                  </CustomText>
                                </View>
                              )}
                            </View>
                            <CustomText type="small" style={styles.dropdownOptionPrice}>
                              {tierConfig.price}
                            </CustomText>
                          </View>
                        </View>
                        
                        {isSelected && (
                          <Icon name="checkmark-circle" size={moderateScale(24)} color={tierConfig.color} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
            
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* Tier Details */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            
            <View style={styles.section}>
              <CustomText type="medium" bold style={styles.sectionTitle}>
                {t('tier.features', '포함된 기능')}
              </CustomText>
              
              <View style={[styles.tierCard, { borderColor: selectedTierConfig.color }]}>
                {selectedTierConfig.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <CustomText type="medium" style={styles.featureIcon}>
                      {feature.icon}
                    </CustomText>
                    <CustomText type="medium" style={styles.featureText}>
                      {feature.text}
                    </CustomText>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
          
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* Footer Buttons */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          
          <View style={styles.footer}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              activeOpacity={0.7}
              disabled={isUpgrading}
            >
              <CustomText type="medium" bold style={styles.cancelButtonText}>
                {t('common.cancel', '취소')}
              </CustomText>
            </TouchableOpacity>
            
            {/* Upgrade Button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.upgradeButton,
                { backgroundColor: canUpgrade ? selectedTierConfig.color : '#4B5563' },
                !canUpgrade && styles.upgradeButtonDisabled,
              ]}
              onPress={handleUpgrade}
              activeOpacity={0.7}
              disabled={!canUpgrade || isUpgrading}
            >
              {isUpgrading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Icon name="arrow-up-circle" size={moderateScale(20)} color="#FFFFFF" />
                  <CustomText type="medium" bold style={styles.upgradeButtonText}>
                    {canUpgrade
                      ? t('tier.upgrade_button', '업그레이드')
                      : t('tier.already_selected', '선택된 티어')}
                  </CustomText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
});

export default TierUpgradeSheet;

