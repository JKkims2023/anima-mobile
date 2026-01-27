/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎖️ TierUpgradeSheet Component (Tab-based, Subscription IAP)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: 구독 티어 업그레이드/취소/관리
 * Design: 탭 기반 UI (Basic | Premium | Ultimate)
 * 
 * Features:
 * ✅ 현재 티어 강조 카드
 * ✅ 탭 기반 티어 선택
 * ✅ 실제 스토어 가격 로딩
 * ✅ 구독/취소/업그레이드 버튼
 * ✅ 비즈니스 로직 (다운그레이드 방지)
 * 
 * Business Rules:
 * 1. Basic → Premium/Ultimate: 자유롭게 구독
 * 2. Premium → Ultimate: 즉시 업그레이드 (start_date = NOW())
 * 3. Ultimate 취소 후: Premium 구독 불가 (다운그레이드 방지)
 * 
 * @author JK & Hero NEXUS AI
 * @date 2026-01-18
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from '../CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { SUBSCRIPTION_ENDPOINTS } from '../../config/api.config';
import { useAnima } from '../../contexts/AnimaContext';
import { useUser } from '../../contexts/UserContext';
import * as SubscriptionService from '../../services/SubscriptionService';
import apiClient from '../../services/api/apiClient';



// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎖️ TIER CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


const TIER_ORDER = ['basic', 'premium', 'ultimate'];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TierUpgradeSheet = ({
  isOpen,
  onClose,
  currentTier = 'basic',
  userKey,
  onUpgradeSuccess,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const { showAlert } = useAnima();
  const { refreshUser } = useUser(); // ⚡ NEW: User info refresh

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // States
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [activeTab, setActiveTab] = useState(currentTier);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); // 'active', 'cancelled', 'expired'
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [serviceData, setServiceData] = useState(null);


  const TIER_CONFIG = {
    basic: {
      key: 'basic',
      name: 'Basic',
      emoji: '🌟',
      color: '#9CA3AF', // Gray
      gradient: ['#6B7280', '#9CA3AF'],
      price: '무료',
      features: [
        { icon: '💬', text: t('tier_sheet.daily_chat_limit', { count: serviceData?.daily_chat_limit_basic }) },
        { icon: '🎭', text: t('tier_sheet.persona_limit', { count: serviceData?.limit_persona_count_basic }) },
        { icon: '🖌️', text: t('tier_sheet.persona_create_limit', { count: serviceData?.limit_persona_create_count_basic }) },
        { icon: '✉️', text: t('tier_sheet.message_limit', { count: serviceData?.daily_create_message_limit_basic }) },
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
        { icon: '💬', text: t('tier_sheet.daily_chat_limit', { count: serviceData?.daily_chat_limit_premium }) },
        { icon: '🎭', text: t('tier_sheet.persona_limit', { count: serviceData?.limit_persona_count_premium }) },
        { icon: '🖌️', text: t('tier_sheet.persona_create_limit', { count: serviceData?.limit_persona_create_count_premium }) },
        { icon: '✉️', text: t('tier_sheet.message_limit', { count: serviceData?.daily_create_message_limit_premium }) },
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
        { icon: '💬', text: t('tier_sheet.daily_chat_limit', { count: serviceData?.daily_chat_limit_ultimate }) },
        { icon: '🎭', text: t('tier_sheet.persona_limit', { count: serviceData?.limit_persona_count_ultimate }) },
        { icon: '🖌️', text: t('tier_sheet.persona_create_limit', { count: serviceData?.limit_persona_create_count_ultimate }) },
        { icon: '✉️', text: t('tier_sheet.message_limit', { count: serviceData?.daily_create_message_limit_ultimate }) },
      ],
    },
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Effective Current Tier (서버 데이터 우선!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const effectiveCurrentTier = useMemo(() => {
    // If we have subscription data from server, use that!
    if (subscriptionData && subscriptionData.tier_level) {
      return subscriptionData.tier_level;
    }
    // Otherwise, use prop
    return currentTier;
  }, [subscriptionData, currentTier]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load Data
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, userKey]);

  const loadData = async () => {
    try {
      setLoadingProducts(true);

      // 1. Load Store Products
      const storeProducts = await SubscriptionService.loadSubscriptions();
      console.log('[TierUpgrade] Products loaded:', storeProducts);
      setProducts(storeProducts);

      // 2. Load User Subscription Status
      if (userKey) {
        const statusResponse = await apiClient.get(SUBSCRIPTION_ENDPOINTS.STATUS, {
          params: { user_key: userKey },
        });

        console.log('[TierUpgrade] Status response:', statusResponse);
        console.log('[TierUpgrade] Status response.data:', statusResponse.data);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Check if subscription exists (with safe navigation)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (
          statusResponse &&
          statusResponse.data &&
          statusResponse.data.success &&
          statusResponse.data.data &&
          statusResponse.data.data.has_active_subscription
        ) {
          // ✅ FIXED: data.data is the subscription object itself!
          const subscriptionInfo = statusResponse.data.data;
          setSubscriptionData(subscriptionInfo);
          setSubscriptionStatus(subscriptionInfo.status);
          setActiveTab(subscriptionInfo.tier_level); // Auto-navigate to current tier tab
          console.log('[TierUpgrade] ✅ Subscription status loaded:', subscriptionInfo.status);
          console.log('[TierUpgrade] ✅ Tier:', subscriptionInfo.tier_level);
          console.log('[TierUpgrade] ✅ Auto-renew:', subscriptionInfo.auto_renew);
          console.log('[TierUpgrade] ✅ Days remaining:', subscriptionInfo.days_remaining);
        } else {
          // No active subscription (user is Basic tier)
          console.log('[TierUpgrade] ⚠️ No active subscription found (user is Basic tier)');
          setSubscriptionData(null);
          setSubscriptionStatus(null);
          setActiveTab('basic');
        }
        setServiceData(statusResponse?.data?.data?.service);

      } else {
        // No user key
        console.log('[TierUpgrade] ⚠️ No userKey provided');
        setSubscriptionData(null);
        setSubscriptionStatus(null);
        setActiveTab('basic');
      }

    } catch (error) {
      console.log('[TierUpgrade] Failed to load data:', error);
      showAlert({
        emoji: '⚠️',
        title: (t('tier_sheet.loading_failed_title')),
        message: (t('tier_sheet.loading_failed_message')),
        buttons: [{ text: (t('common.confirm')), style: 'primary', onPress: () => {} }],
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Get Product Price
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const getProductPrice = useCallback((tierKey) => {
    // ⚠️ Note: Product IDs are now 'premium', 'ultimate' (not 'premium_monthly')
    const productId = tierKey; // 'premium' or 'ultimate'
    const product = products.find(p => p.productId === productId);

    console.log('[TierUpgrade] getProductPrice:', tierKey, '→', product?.localizedPrice);

    if (product && product.localizedPrice) {
      return product.localizedPrice; // ✅ Real store price!
    }

    // Fallback
    return TIER_CONFIG[tierKey]?.price || (t('tier_sheet.loading'));
  }, [products, t]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle Subscribe
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleSubscribe = useCallback(async (tierKey) => {
    try {
      setIsProcessing(true);
      HapticService.medium();

      // ⚠️ Note: Product IDs are now 'premium', 'ultimate' (not 'premium_monthly')
      const productId = tierKey; // 'premium' or 'ultimate'
      console.log('[TierUpgrade] 🛒 Starting subscription:', productId);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Find product and extract offerToken (Android)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const product = products.find(p => p.productId === productId);
      const offerToken = product?.offerToken || null;

      console.log('[TierUpgrade] Product:', product?.productId);
      console.log('[TierUpgrade] OfferToken:', offerToken ? offerToken.substring(0, 20) + '...' : 'null');

      // 1. Request Subscription (with offerToken for Android)
      const purchase = await SubscriptionService.requestSubscription(productId, offerToken);

      if (!purchase) {
        throw new Error('Purchase cancelled');
      }

      console.log('[TierUpgrade] ✅ Purchase successful');

      // 2. Extract Data
      const purchaseData = SubscriptionService.extractSubscriptionData(purchase);

      // 3. Verify with Server
      console.log('[TierUpgrade] 🔐 Verifying with server...');

      const verifyResponse = await apiClient.post(SUBSCRIPTION_ENDPOINTS.VERIFY, {
        user_key: userKey,
        product_id: purchaseData.productId,
        purchase_token: purchaseData.purchaseToken,
        platform: purchaseData.platform,
      });

      if (!verifyResponse.data || !verifyResponse.data.success) {
        throw new Error('Verification failed');
      }

      console.log('[TierUpgrade] ✅ Server verification successful');

      // 4. Acknowledge
      console.log('[TierUpgrade] ✅ Acknowledging purchase...');
      await SubscriptionService.acknowledgeSubscription(purchase);

      console.log('[TierUpgrade] ✅ Purchase acknowledged!');

      // 5. Refresh User Info
      console.log('[TierUpgrade] 🔄 Refreshing user info...');
      try {
        await refreshUser();
        console.log('[TierUpgrade] ✅ User info refreshed!');
      } catch (refreshError) {
        console.error('[TierUpgrade] ⚠️ User info refresh failed (non-critical):', refreshError);
      }

      // 6. Success!
      HapticService.success();

      showAlert({
        emoji: '🎉',
        title: (t('tier_sheet.subscription_completed_title')),
        message: (t('tier_sheet.subscription_completed_message', { tier: TIER_CONFIG[tierKey].name })),
        buttons: [
          {
            text: (t('common.confirm')),
            style: 'primary',
            onPress: () => {
              // Reload data
              loadData();

              // Callback
              if (onUpgradeSuccess) {
                onUpgradeSuccess(tierKey);
              }

              // Close sheet
              onClose();
            },
          },
        ],
      });
    } catch (error) {
      console.log('❌ [TierUpgrade] Subscribe failed:', error);
      HapticService.error();

      let errorMessage = (t('tier_sheet.subscription_failed_message'));

      if (error.message === 'Purchase cancelled' || error.message === 'User cancelled') {
        // User cancelled - no need to show error
        console.log('[TierUpgrade] User cancelled purchase');
        return;
      } else if (error.message === 'Already subscribed') {
        errorMessage = (t('tier_sheet.subscription_already_subscribed_message'));
      } else if (error.message === 'Network error') {
        errorMessage = (t('tier_sheet.subscription_network_error_message'));
      } else if (error.message === 'Product not available') {
        errorMessage = (t('tier_sheet.subscription_product_not_available_message'));
      }

      showAlert({
        emoji: '❌',
        title: (t('tier_sheet.subscription_failed_title')),
        message: errorMessage,
        buttons: [{ text: (t('common.confirm')), style: 'primary', onPress: () => {} }],
      });
    } finally {
      setIsProcessing(false);
    }
  }, [userKey, showAlert, onUpgradeSuccess, onClose, loadData]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle Cancel Subscription
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleCancelSubscription = useCallback(async () => {
    if (!subscriptionData) {
      return;
    }

    const expiryDate = new Date(subscriptionData.expiry_date).toLocaleDateString('ko-KR');

    showAlert({
      emoji: '⚠️',
      title: (t('tier_sheet.subscription_cancel_title')),
      message: t('tier_sheet.subscription_cancel_message', { expiryDate: expiryDate }),
      buttons: [
        {
          text: (t('common.cancel')),
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: (t('common.confirm')),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);

              const cancelResponse = await apiClient.post(SUBSCRIPTION_ENDPOINTS.CANCEL, {
                user_key: userKey,
                reason: 'User requested',
              });

              if (!cancelResponse.data || !cancelResponse.data.success) {
                throw new Error('Cancellation failed');
              }

              // ⚡ Refresh User Info
              console.log('[TierUpgrade] 🔄 Refreshing user info after cancellation...');
              try {
                await refreshUser();
                console.log('[TierUpgrade] ✅ User info refreshed!');
              } catch (refreshError) {
                console.error('[TierUpgrade] ⚠️ User info refresh failed (non-critical):', refreshError);
              }

              HapticService.success();

              showAlert({
                emoji: '✅',
                title: (t('tier_sheet.subscription_cancel_completed_title')),
                message: (t('tier_sheet.subscription_cancel_completed_message', { expiryDate: expiryDate })),
                buttons: [
                  {
                    text: (t('common.confirm')),
                    style: 'primary',
                    onPress: () => {
                      // Reload data
                      loadData();
                    },
                  },
                ],
              });
            } catch (error) {
              console.error('❌ [TierUpgrade] Cancel failed:', error);
              HapticService.error();

              showAlert({
                emoji: '❌',
                title: (t('tier_sheet.subscription_cancel_failed_title')),
                message: error.message || (t('tier_sheet.subscription_cancel_failed_message')),
                buttons: [{ text: (t('common.confirm')), style: 'primary', onPress: () => {} }],
              });
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    });
  }, [subscriptionData, userKey, showAlert, loadData, refreshUser]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render Action Button (Tab-specific)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderActionButton = () => {
    const tierConfig = TIER_CONFIG[activeTab];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Basic Tab
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (activeTab === 'basic') {
      if (effectiveCurrentTier === 'basic') {
        return (
          <View style={styles.infoBox}>
            <Icon name="information" size={moderateScale(20)} color={COLORS.TEXT_SECONDARY} />
            <CustomText type="small" color={COLORS.TEXT_SECONDARY} style={{ marginLeft: scale(8), flex: 1 }}>
              {t('tier_sheet.basic_description')}
            </CustomText>
          </View>
        );
      } else {
        return (
          <View style={styles.warningBox}>
            <Icon name="alert-circle" size={moderateScale(20)} color={COLORS.WARNING} />
            <CustomText type="small" color={COLORS.WARNING} style={{ marginLeft: scale(8), flex: 1 }}>
              {t('tier_sheet.basic_downgrade_not_allowed_message')}
            </CustomText>
          </View>
        );
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Premium Tab
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (activeTab === 'premium') {
      if (effectiveCurrentTier === 'basic') {
        // Basic → Premium (Subscribe)
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: tierConfig.color }]}
            onPress={() => handleSubscribe('premium')}
            disabled={isProcessing || loadingProducts}
            activeOpacity={0.7}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="arrow-up-circle" size={moderateScale(20)} color="#FFFFFF" />
                <CustomText type="medium" bold style={styles.actionButtonText}>
                  {t('tier_sheet.subscribe_button', { price: getProductPrice('premium') })}
                </CustomText>
              </>
            )}
          </TouchableOpacity>
        );
      } else if (effectiveCurrentTier === 'premium') {
        // Premium (Current)
        if (subscriptionStatus === 'active') {
          // Active → Cancel
          return (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelSubscription}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="close-circle" size={moderateScale(20)} color="#FFFFFF" />
                  <CustomText type="medium" bold style={styles.actionButtonText}>
                    {t('tier_sheet.subscription_cancel_button')}
                  </CustomText>
                </>
              )}
            </TouchableOpacity>
          );
        } else if (subscriptionStatus === 'cancelled') {
          // Cancelled
          const expiryDate = new Date(subscriptionData.expiry_date).toLocaleDateString('ko-KR');
          return (
            <View style={styles.warningBox}>
              <Icon name="alert-circle" size={moderateScale(20)} color={COLORS.WARNING} />
              <CustomText type="small" color={COLORS.WARNING} style={{ marginLeft: scale(8), flex: 1 }}>
                {t('tier_sheet.subscription_cancelled_message', { expiryDate: expiryDate })}
              </CustomText>
            </View>
          );
        }
      } else if (effectiveCurrentTier === 'ultimate') {
        // Ultimate → Premium (Downgrade Not Allowed)
        if (subscriptionStatus === 'cancelled') {
          // Ultimate 취소 상태 → Premium 구독 불가!
          const expiryDate = new Date(subscriptionData.expiry_date).toLocaleDateString('ko-KR');
          return (
            <View style={styles.errorBox}>
              <Icon name="cancel" size={moderateScale(20)} color="#EF4444" />
              <CustomText type="small" color="#EF4444" style={{ marginLeft: scale(8), flex: 1 }}>
                {t('tier_sheet.subscription_cancelled_not_allowed_message')}
              </CustomText>
            </View>
          );
        } else {
          return (
            <View style={styles.warningBox}>
              <Icon name="alert-circle" size={moderateScale(20)} color={COLORS.WARNING} />
              <CustomText type="small" color={COLORS.WARNING} style={{ marginLeft: scale(8), flex: 1 }}>
                {t('tier_sheet.premium_downgrade_not_allowed_message')}
              </CustomText>
            </View>
          );
        }
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Ultimate Tab
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (activeTab === 'ultimate') {
      if (effectiveCurrentTier === 'basic') {
        // Basic → Ultimate (Subscribe)
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: tierConfig.color }]}
            onPress={() => handleSubscribe('ultimate')}
            disabled={isProcessing || loadingProducts}
            activeOpacity={0.7}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="arrow-up-circle" size={moderateScale(20)} color="#FFFFFF" />
                <CustomText type="medium" bold style={styles.actionButtonText}>
                  {t('tier_sheet.subscribe_button', { price: getProductPrice('ultimate') })}
                </CustomText>
              </>
            )}
          </TouchableOpacity>
        );
      } else if (effectiveCurrentTier === 'premium') {
        // Premium → Ultimate (Upgrade)
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: tierConfig.color }]}
            onPress={() => handleSubscribe('ultimate')}
            disabled={isProcessing || loadingProducts}
            activeOpacity={0.7}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="arrow-up-circle" size={moderateScale(20)} color="#FFFFFF" />
                <CustomText type="medium" bold style={styles.actionButtonText}>
                  {t('tier_sheet.upgrade_ulimate_button', { price: getProductPrice('ultimate') })}
                </CustomText>
              </>
            )}
          </TouchableOpacity>
        );
      } else if (effectiveCurrentTier === 'ultimate') {
        // Ultimate (Current)
        if (subscriptionStatus === 'active') {
          // Active → Cancel
          return (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelSubscription}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="close-circle" size={moderateScale(20)} color="#FFFFFF" />
                  <CustomText type="medium" bold style={styles.actionButtonText}>
                    {t('tier_sheet.subscription_cancel_button')}
                  </CustomText>
                </>
              )}
            </TouchableOpacity>
          );
        } else if (subscriptionStatus === 'cancelled') {
          // Cancelled
          const expiryDate = new Date(subscriptionData.expiry_date).toLocaleDateString('ko-KR');
          return (
            <View style={styles.warningBox}>
              <Icon name="alert-circle" size={moderateScale(20)} color={COLORS.WARNING} />
              <CustomText type="small" color={COLORS.WARNING} style={{ marginLeft: scale(8), flex: 1 }}>
                {t('tier_sheet.subscription_cancelled_message', { expiryDate: expiryDate })}
              </CustomText>
            </View>
          );
        }
      }
    }

    return null;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Animation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  }, [isOpen, slideAnim, backdropOpacity]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle Close
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleClose = useCallback(() => {
    HapticService.light();
    onClose();
  }, [onClose]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!isOpen) return null;

  const currentTierConfig = TIER_CONFIG[effectiveCurrentTier];
  const activeTierConfig = TIER_CONFIG[activeTab];

  return (
    <Modal 
    /*
    visible={isOpen} 
    transparent 
    animationType="none" 
    presentationStyle="overFullScreen" 
    statusBarTranslucent 
    onRequestClose={handleClose}
    */
    visible={isOpen}
    transparent={true}
    animationType="fade"
    onRequestClose={handleClose} // ⭐ FIX: Use unified back press handler!
    >
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0,0,0,0.7)',
              opacity: backdropOpacity,
            },
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

        {/* Header */}
        <View style={styles.header}>
          <View>
            <CustomText type="title" bold color={COLORS.TEXT_PRIMARY}>
              {t('tier_sheet.title')}
            </CustomText>
          </View>

          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="close" size={scale(24)} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loadingProducts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.DEEP_BLUE} />
              <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ marginTop: verticalScale(12) }}>
                {t('tier_sheet.loading')}
              </CustomText>
            </View>
          ) : (
            <>
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* Current Tier Card */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <View style={[styles.currentTierCard, { borderColor: currentTierConfig.color }]}>
                <View style={styles.currentTierHeader}>
                  <CustomText type="huge" style={styles.currentTierEmoji}>
                    {currentTierConfig.emoji}
                  </CustomText>
                  <View style={{ flex: 1 }}>
                    <CustomText type="medium" bold color={COLORS.TEXT_PRIMARY}>
                      {t('tier_sheet.now_tier', { name: currentTierConfig.name })}
                    </CustomText>
                    {subscriptionData && (
                      <>
                        <CustomText type="small" color={subscriptionStatus === 'active' ? '#22C55E' : COLORS.WARNING} style={{ marginTop: verticalScale(4) }}>
                          {subscriptionStatus === 'active' ? t('tier_sheet.subscription_active') : t('tier_sheet.subscription_cancelled')}
                        </CustomText>
                        <CustomText type="small" color={COLORS.TEXT_SECONDARY}>
                          {t('tier_sheet.expiry_date')}: {new Date(subscriptionData.expiry_date).toLocaleDateString('ko-KR')} ({t('tier_sheet.days_remaining', { days: subscriptionData.days_remaining })})
                        </CustomText>
                        <CustomText type="small" color={COLORS.TEXT_SECONDARY}>
                          {t('tier_sheet.auto_renew')}: {subscriptionData.auto_renew ? t('tier_sheet.subscription_active') : t('tier_sheet.subscription_cancelled')}
                        </CustomText>
                      </>
                    )}
                    {!subscriptionData && (
                      <CustomText type="small" color={COLORS.TEXT_SECONDARY} style={{ marginTop: verticalScale(4) }}>
                        {t('tier_sheet.basic_description')}
                      </CustomText>
                    )}
                  </View>
                </View>
              </View>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* Tabs */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <View style={styles.tabContainer}>
                {TIER_ORDER.map((tierKey) => {
                  const tierConfig = TIER_CONFIG[tierKey];
                  const isActive = tierKey === activeTab;
                  const isCurrent = tierKey === currentTier;

                  return (
                    <TouchableOpacity
                      key={tierKey}
                      style={[
                        styles.tab,
                        isActive && styles.tabActive,
                        isActive && { borderBottomColor: tierConfig.color },
                      ]}
                      onPress={() => {
                        HapticService.light();
                        setActiveTab(tierKey);
                      }}
                      activeOpacity={0.7}
                    >
                      <CustomText type="medium" style={[styles.tabEmoji, {display: 'none'}]}>
                        {tierConfig.emoji}
                      </CustomText>
                      <CustomText
                        type="title"
                        bold={isActive}
                        color={isActive ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY}
                        style={styles.tabText}
                      >
                        {tierConfig.name}
                      </CustomText>
                      {false && (
                        <View style={styles.currentBadge}>
                          <CustomText type="tiny" bold style={styles.currentBadgeText}>
                            {t('tier_sheet.now')}
                          </CustomText>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* Tab Content */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <View style={[styles.tierCard, { borderColor: activeTierConfig.color }]}>
                {/* Tier Header */}
                <View style={styles.tierCardHeader}>
                  <CustomText type="huge" style={styles.tierCardEmoji}>
                    {activeTierConfig.emoji}
                  </CustomText>
                  <View style={{ flex: 1, flexDirection:'row' }}>
                    <CustomText type="title" bold color={COLORS.TEXT_PRIMARY}>
                      {activeTierConfig.name}
                    </CustomText>
                    <CustomText type="title" bold color={COLORS.TEXT_SECONDARY} style={{ marginLeft: scale(8) }}>
                      ({activeTierConfig.key === 'basic' ? '무료' : getProductPrice(activeTierConfig.key) + '/월'})
                    </CustomText>
                  </View>
                </View>

                {/* Features */}
                <View style={styles.divider} />
                <CustomText type="medium" bold color={COLORS.TEXT_PRIMARY} style={{ marginBottom: verticalScale(12) }}>
                  {t('tier_sheet.included_features')}
                </CustomText>
                {activeTierConfig.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <CustomText type="medium" style={styles.featureIcon}>
                      {feature.icon}
                    </CustomText>
                    <CustomText type="medium" color={COLORS.TEXT_PRIMARY} style={styles.featureText}>
                      {feature.text}
                    </CustomText>
                  </View>
                ))}

                {/* Action Button */}
                <View style={{ marginTop: verticalScale(20) }}>{renderActionButton()}</View>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styles = StyleSheet.create({
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
    maxHeight: '90%',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(0),
    paddingBottom: platformPadding(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(20),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Current Tier Card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  currentTierCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: moderateScale(12),
    padding: platformPadding(16),
    borderWidth: 2,
    marginBottom: verticalScale(20),
  },
  currentTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  currentTierEmoji: {
    fontSize: moderateScale(32),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tabs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: verticalScale(20),
    marginTop: verticalScale(-16),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: scale(6),
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabEmoji: {
    fontSize: moderateScale(18),
  },
  tabText: {
    fontSize: moderateScale(16),
  },
  currentBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
  },
  currentBadgeText: {
    color: '#22C55E',
    fontSize: moderateScale(10),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tier Card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tierCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: moderateScale(12),
    padding: platformPadding(16),
    borderWidth: 2,
  },
  tierCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginBottom: verticalScale(16),
  },
  tierCardEmoji: {
    fontSize: moderateScale(32),
    display: 'none',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: verticalScale(16),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginBottom: verticalScale(10),
  },
  featureIcon: {
    fontSize: moderateScale(20),
  },
  featureText: {
    flex: 1,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Action Button
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    gap: scale(8),
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Info/Warning/Error Boxes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: moderateScale(12),
    padding: platformPadding(12),
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: moderateScale(12),
    padding: platformPadding(12),
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: moderateScale(12),
    padding: platformPadding(12),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});

export default TierUpgradeSheet;
