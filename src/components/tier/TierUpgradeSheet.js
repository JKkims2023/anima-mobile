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
import * as SubscriptionService from '../../services/SubscriptionService';
import apiClient from '../../services/api/apiClient';

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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // States
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [activeTab, setActiveTab] = useState(currentTier);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); // 'active', 'cancelled', 'expired'
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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
          statusResponse.data.data.subscription
        ) {
          const { subscription } = statusResponse.data.data;
          setSubscriptionData(subscription);
          setSubscriptionStatus(subscription.status);
          setActiveTab(subscription.tier_level); // Auto-navigate to current tier tab
          console.log('[TierUpgrade] ✅ Subscription status loaded:', subscription.status);
          console.log('[TierUpgrade] ✅ Tier:', subscription.tier_level);
        } else {
          // No active subscription (user is Basic tier)
          console.log('[TierUpgrade] ⚠️ No active subscription found (user is Basic tier)');
          setSubscriptionData(null);
          setSubscriptionStatus(null);
          setActiveTab('basic');
        }
      } else {
        // No user key
        console.log('[TierUpgrade] ⚠️ No userKey provided');
        setSubscriptionData(null);
        setSubscriptionStatus(null);
        setActiveTab('basic');
      }
    } catch (error) {
      console.error('[TierUpgrade] Failed to load data:', error);
      showAlert({
        emoji: '⚠️',
        title: '데이터 로딩 실패',
        message: '구독 정보를 불러올 수 없습니다.',
        buttons: [{ text: '확인', style: 'primary', onPress: () => {} }],
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
    return TIER_CONFIG[tierKey]?.price || '로딩 중...';
  }, [products]);

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

      // 5. Success!
      HapticService.success();

      showAlert({
        emoji: '🎉',
        title: '구독 완료!',
        message: `${TIER_CONFIG[tierKey].name} 티어로 업그레이드되었습니다!`,
        buttons: [
          {
            text: '확인',
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
      console.error('❌ [TierUpgrade] Subscribe failed:', error);
      HapticService.error();

      let errorMessage = '구독에 실패했습니다';

      if (error.message === 'Purchase cancelled' || error.message === 'User cancelled') {
        // User cancelled - no need to show error
        console.log('[TierUpgrade] User cancelled purchase');
        return;
      } else if (error.message === 'Already subscribed') {
        errorMessage = '이미 구독 중입니다. 설정에서 구독 관리를 확인해주세요.';
      } else if (error.message === 'Network error') {
        errorMessage = '네트워크 오류가 발생했습니다. 연결을 확인해주세요.';
      } else if (error.message === 'Product not available') {
        errorMessage = '상품을 사용할 수 없습니다. 나중에 다시 시도해주세요.';
      }

      showAlert({
        emoji: '❌',
        title: '구독 실패',
        message: errorMessage,
        buttons: [{ text: '확인', style: 'primary', onPress: () => {} }],
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
      title: '구독을 취소하시겠습니까?',
      message: `만료일(${expiryDate})까지 현재 티어를 사용할 수 있습니다.\n\n취소 후에는 더 낮은 티어로 변경할 수 없습니다.`,
      buttons: [
        {
          text: '아니오',
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: '예, 취소합니다',
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

              HapticService.success();

              showAlert({
                emoji: '✅',
                title: '구독 취소 완료',
                message: `만료일(${expiryDate})까지 현재 티어를 사용할 수 있습니다.`,
                buttons: [
                  {
                    text: '확인',
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
                title: '취소 실패',
                message: error.message || '구독 취소에 실패했습니다.',
                buttons: [{ text: '확인', style: 'primary', onPress: () => {} }],
              });
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    });
  }, [subscriptionData, userKey, showAlert, loadData]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render Action Button (Tab-specific)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderActionButton = () => {
    const tierConfig = TIER_CONFIG[activeTab];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Basic Tab
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (activeTab === 'basic') {
      if (currentTier === 'basic') {
        return (
          <View style={styles.infoBox}>
            <Icon name="information" size={moderateScale(20)} color={COLORS.TEXT_SECONDARY} />
            <CustomText type="small" color={COLORS.TEXT_SECONDARY} style={{ marginLeft: scale(8), flex: 1 }}>
              무료 티어입니다. Premium 또는 Ultimate로 업그레이드하세요!
            </CustomText>
          </View>
        );
      } else {
        return (
          <View style={styles.warningBox}>
            <Icon name="alert-circle" size={moderateScale(20)} color={COLORS.WARNING} />
            <CustomText type="small" color={COLORS.WARNING} style={{ marginLeft: scale(8), flex: 1 }}>
              ⚠️ Basic으로 다운그레이드할 수 없습니다.{'\n'}
              구독을 취소하면 만료일 이후 자동으로 Basic으로 변경됩니다.
            </CustomText>
          </View>
        );
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Premium Tab
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (activeTab === 'premium') {
      if (currentTier === 'basic') {
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
                  구독하기 ({getProductPrice('premium')}/월)
                </CustomText>
              </>
            )}
          </TouchableOpacity>
        );
      } else if (currentTier === 'premium') {
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
                    구독 취소
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
                ⚠️ 구독이 취소되었습니다.{'\n'}
                {expiryDate}까지 사용 가능합니다.
              </CustomText>
            </View>
          );
        }
      } else if (currentTier === 'ultimate') {
        // Ultimate → Premium (Downgrade Not Allowed)
        if (subscriptionStatus === 'cancelled') {
          // Ultimate 취소 상태 → Premium 구독 불가!
          const expiryDate = new Date(subscriptionData.expiry_date).toLocaleDateString('ko-KR');
          return (
            <View style={styles.errorBox}>
              <Icon name="cancel" size={moderateScale(20)} color="#EF4444" />
              <CustomText type="small" color="#EF4444" style={{ marginLeft: scale(8), flex: 1 }}>
                ❌ 취소된 구독이 만료되기 전까지는 다운그레이드할 수 없습니다.{'\n'}
                만료일: {expiryDate} 이후 Basic으로 변경됩니다.
              </CustomText>
            </View>
          );
        } else {
          return (
            <View style={styles.warningBox}>
              <Icon name="alert-circle" size={moderateScale(20)} color={COLORS.WARNING} />
              <CustomText type="small" color={COLORS.WARNING} style={{ marginLeft: scale(8), flex: 1 }}>
                ⚠️ Premium으로 다운그레이드할 수 없습니다.{'\n'}
                구독을 취소하면 만료일 이후 자동으로 Basic으로 변경됩니다.
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
      if (currentTier === 'basic') {
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
                  구독하기 ({getProductPrice('ultimate')}/월)
                </CustomText>
              </>
            )}
          </TouchableOpacity>
        );
      } else if (currentTier === 'premium') {
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
                  Ultimate로 업그레이드 ({getProductPrice('ultimate')}/월)
                </CustomText>
              </>
            )}
          </TouchableOpacity>
        );
      } else if (currentTier === 'ultimate') {
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
                    구독 취소
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
                ⚠️ 구독이 취소되었습니다.{'\n'}
                {expiryDate}까지 사용 가능합니다.
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

  const currentTierConfig = TIER_CONFIG[currentTier];
  const activeTierConfig = TIER_CONFIG[activeTab];

  return (
    <Modal visible={isOpen} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
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
              🎖️ 티어 업그레이드
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
                불러오는 중...
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
                      현재 티어: {currentTierConfig.name}
                    </CustomText>
                    {subscriptionData && (
                      <>
                        <CustomText type="small" color={subscriptionStatus === 'active' ? '#22C55E' : COLORS.WARNING} style={{ marginTop: verticalScale(4) }}>
                          {subscriptionStatus === 'active' ? '✅ 구독 활성화' : '⚠️ 구독 취소됨'}
                        </CustomText>
                        <CustomText type="small" color={COLORS.TEXT_SECONDARY}>
                          만료일: {new Date(subscriptionData.expiry_date).toLocaleDateString('ko-KR')} ({subscriptionData.days_remaining}일 남음)
                        </CustomText>
                        <CustomText type="small" color={COLORS.TEXT_SECONDARY}>
                          자동 갱신: {subscriptionData.auto_renew ? '활성화 ✅' : '비활성화 ❌'}
                        </CustomText>
                      </>
                    )}
                    {!subscriptionData && (
                      <CustomText type="small" color={COLORS.TEXT_SECONDARY} style={{ marginTop: verticalScale(4) }}>
                        무료 티어입니다. 프리미엄 구독으로 더 많은 기능을 이용하세요!
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
                      <CustomText type="medium" style={styles.tabEmoji}>
                        {tierConfig.emoji}
                      </CustomText>
                      <CustomText
                        type="medium"
                        bold={isActive}
                        color={isActive ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY}
                        style={styles.tabText}
                      >
                        {tierConfig.name}
                      </CustomText>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <CustomText type="tiny" bold style={styles.currentBadgeText}>
                            현재
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
                  <View style={{ flex: 1 }}>
                    <CustomText type="large" bold color={COLORS.TEXT_PRIMARY}>
                      {activeTierConfig.name}
                    </CustomText>
                    <CustomText type="medium" color={COLORS.TEXT_SECONDARY}>
                      {activeTierConfig.key === 'basic' ? '무료' : getProductPrice(activeTierConfig.key) + '/월'}
                    </CustomText>
                  </View>
                </View>

                {/* Features */}
                <View style={styles.divider} />
                <CustomText type="medium" bold color={COLORS.TEXT_PRIMARY} style={{ marginBottom: verticalScale(12) }}>
                  포함된 기능:
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
    fontSize: moderateScale(14),
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
    fontSize: moderateScale(40),
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
