/**
 * 💰 CompactPointPurchaseTab - IAP Direct Purchase UI
 * 
 * ✨ Design Philosophy (ANIMA):
 * - 단순함: 3개 옵션으로 명확
 * - 부담 최소화: 최소/중간/최대로 선택 쉬움
 * - 과한 구매 제한: 충동적 과소비 방지
 * - 클릭 즉시 구매: IAP 표준 플로우
 * 
 * 🔄 Purchase Flow:
 * 1. 사용자가 패키지 클릭
 * 2. 구매 확인 다이얼로그
 * 3. Google/Apple 결제 (Phase 2에서 구현)
 * 4. 영수증 검증 후 포인트 지급
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-17
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import { useUser } from '../../contexts/UserContext';
import { purchasePoints } from '../../services/api/pointService';
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useAnima } from '../../contexts/AnimaContext';
import * as IAPService from '../../services/IAPService';
import { IAP_ENDPOINTS } from '../../config/api.config';
import * as PendingPurchaseStorage from '../../services/PendingPurchaseStorage';

// 🎯 Point Packages (최소/중간/최대)
const POINT_PACKAGES = [
  {
    amount: 1000,
    emoji: '🌱',
    label: '스타터',
    color: '#10B981', // Green
    description: '부담없이 시작',
  },
  {
    amount: 5000,
    emoji: '⭐',
    label: '스탠다드',
    color: '#3B82F6', // Blue
    description: '가장 합리적',
    popular: true, // 인기 뱃지
  },
  {
    amount: 10000,
    emoji: '💎',
    label: '프리미엄',
    color: '#8B5CF6', // Purple
    description: '충분히 넉넉',
  },
];

/**
 * 💰 CompactPointPurchaseTab Component
 */
const CompactPointPurchaseTab = ({ onCancel }) => {
  const { t } = useTranslation();
  const { user, refreshUser } = useUser();
  const { showAlert } = useAnima();
  const [loading, setLoading] = useState(false);
  const [purchasingPackage, setPurchasingPackage] = useState(null); // 현재 구매 중인 패키지
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false); // 🔥 중복 처리 방지
  
  // 💰 IAP Product States
  const [products, setProducts] = useState([]); // Store products with prices
  const [loadingPrices, setLoadingPrices] = useState(true); // Price loading state
  const [priceLoadError, setPriceLoadError] = useState(null); // Price load error

  // 🔄 Load Product Prices on Mount + Retry Pending Purchases
  useEffect(() => {
    const initialize = async () => {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔄 CRITICAL: Retry pending purchases first
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const pendingCount = await PendingPurchaseStorage.getPendingPurchaseCount();
      if (pendingCount > 0) {
        console.log('[CompactPointPurchaseTab] 🔄 Found', pendingCount, 'pending purchases, retrying...');
        
        // Retry verification
        try {
          const result = await IAPService.retryPendingPurchases(verifyPurchaseWithBackend);
          
          if (result.success > 0) {
            console.log('[CompactPointPurchaseTab] ✅ Resolved', result.success, 'pending purchases');
            
            // Refresh user data to show updated points
            await refreshUser();
            
            // Show success notification
            showAlert({
              emoji: '🎉',
              title: '이전 구매 완료',
              message: `${result.success}개의 미완료 구매가 처리되었습니다.\n포인트가 정상적으로 지급되었습니다.`,
              buttons: [
                {
                  text: t('common.confirm', '확인'),
                  style: 'primary',
                },
              ],
            });
          }
        } catch (error) {
          console.error('[CompactPointPurchaseTab] ❌ Failed to retry pending purchases:', error);
        }
      }
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🧹 Clear unfinished purchases
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      await IAPService.clearUnfinishedPurchases();
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 💰 Load prices
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      await loadPrices();
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🎧 Setup listeners
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      setupIAPListeners();
    };
    
    initialize();
    
    // Cleanup on unmount
    return () => {
      // IAPService.disconnectIAP(); // Don't disconnect here, keep connection alive
    };
  }, []);

  // 🎧 Setup IAP Purchase Listeners (Auto-verification for interrupted purchases)
  const setupIAPListeners = () => {
    console.log('[CompactPointPurchaseTab] Setting up IAP listeners...');
    
    IAPService.setupPurchaseListeners(
      // onPurchaseUpdate - Auto-verify interrupted purchases
      async (purchaseUpdate) => {
        console.log('[CompactPointPurchaseTab] 🎧 Purchase update received:', purchaseUpdate);
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔥 SINGLE SOURCE OF TRUTH: All verification happens here
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        if (!user?.user_key) {
          console.warn('[CompactPointPurchaseTab] ⚠️ No user logged in, skipping verification');
          return;
        }
        
        // Extract purchase (handle array)
        const purchase = Array.isArray(purchaseUpdate) ? purchaseUpdate[0] : purchaseUpdate;
        
        if (!purchase) {
          console.warn('[CompactPointPurchaseTab] ⚠️ Empty purchase update');
          return;
        }
        
        // Check if already acknowledged
        if (purchase.isAcknowledgedAndroid === true) {
          console.log('[CompactPointPurchaseTab] ✅ Purchase already acknowledged, skipping');
          return;
        }
        
        console.log('[CompactPointPurchaseTab] 🔄 Verifying purchase...');
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Track if this purchase was initiated from executePurchase
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const isUserInitiated = isProcessingPurchase;
        
        try {
          // Extract purchase data
          const purchaseData = IAPService.extractPurchaseData(purchase);
          
          if (!purchaseData.purchaseToken) {
            console.error('[CompactPointPurchaseTab] ❌ No purchase token, cannot verify');
            
            if (isUserInitiated) {
              setLoading(false);
              setPurchasingPackage(null);
              setIsProcessingPurchase(false);
              
              showAlert({
                emoji: '❌',
                title: '오류',
                message: '구매 정보를 확인할 수 없습니다.',
                buttons: [{ text: '확인', style: 'cancel' }],
              });
            }
            return;
          }
          
          // Get product info for display
          const product = getProductByAmount(IAPService.getPointAmountFromProductId(purchaseData.productId));
          
          // Attempt verification
          const verifyResult = await verifyPurchaseWithBackend(purchaseData, user.user_key);
          
          if (verifyResult.success) {
            console.log('[CompactPointPurchaseTab] ✅ Verification successful');
            
            // Finish transaction
            try {
              await IAPService.finishTransactionIAP(purchase);
              console.log('[CompactPointPurchaseTab] ✅ Transaction finished');
            } catch (finishError) {
              console.error('[CompactPointPurchaseTab] ⚠️ Failed to finish transaction:', finishError);
            }
            
            // Refresh user
            await refreshUser();
            
            console.log('[CompactPointPurchaseTab] ✅ Purchase completed');
            
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // Show success UI only for user-initiated purchases
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            if (isUserInitiated) {
              HapticService.success();
              
              showAlert({
                emoji: '🎉',
                title: t('points.purchase_success_title', '포인트 충전 성공'),
                message: `${verifyResult.data.points_added.toLocaleString()} P가 충전되었습니다!${product ? `\n\n💰 ${product.localizedPrice} 결제 완료` : ''}`,
                buttons: [
                  {
                    text: t('common.confirm', '확인'),
                    style: 'primary',
                    onPress: () => {
                      onCancel();
                    },
                  },
                ],
              });
            }
          } else {
            console.error('[CompactPointPurchaseTab] ❌ Verification failed, saving for retry');
            
            // Save for retry
            await PendingPurchaseStorage.savePendingPurchase(
              purchase,
              purchaseData,
              user.user_key
            );
            
            if (isUserInitiated) {
              showAlert({
                emoji: '⚠️',
                title: '서버 확인 중 오류',
                message: '결제는 완료되었지만 서버 확인 중 문제가 발생했습니다.\n포인트는 다음 앱 실행 시 자동으로 지급됩니다.\n\n잠시 후 앱을 재시작해주세요.',
                buttons: [
                  {
                    text: '확인',
                    style: 'cancel',
                    onPress: () => {
                      onCancel();
                    },
                  },
                ],
              });
            }
          }
        } catch (error) {
          console.error('[CompactPointPurchaseTab] ❌ Verification error:', error);
          
          if (isUserInitiated) {
            HapticService.error();
            
            showAlert({
              emoji: '❌',
              title: '오류',
              message: '결제 확인 중 오류가 발생했습니다.\n네트워크를 확인 후 다시 시도해주세요.',
              buttons: [
                {
                  text: '확인',
                  style: 'cancel',
                },
              ],
            });
          }
        } finally {
          // Reset loading states
          if (isUserInitiated) {
            setLoading(false);
            setPurchasingPackage(null);
            setIsProcessingPurchase(false);
          }
        }
      },
      // onPurchaseError
      (error) => {
        console.error('[CompactPointPurchaseTab] 🎧 Purchase error received:', error);
        
        // 에러는 executePurchase의 try-catch에서 처리됨
      }
    );
    
    console.log('[CompactPointPurchaseTab] ✅ IAP listeners setup complete');
  };

  // 💰 Load Prices from Store
  const loadPrices = async () => {
    try {
      setLoadingPrices(true);
      setPriceLoadError(null);
      
      console.log('[CompactPointPurchaseTab] Loading prices from store...');
      const storeProducts = await IAPService.loadProductPrices();
      
      setProducts(storeProducts);
      console.log('[CompactPointPurchaseTab] ✅ Prices loaded:', storeProducts);
      
    } catch (error) {
      console.error('[CompactPointPurchaseTab] ❌ Failed to load prices:', error);
      setPriceLoadError(error.message);
      
      // Show error alert
      showAlert({
        emoji: '⚠️',
        title: '가격 로딩 실패',
        message: '스토어 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
        buttons: [
          {
            text: '다시 시도',
            style: 'primary',
            onPress: () => {
              loadPrices();
            },
          },
          {
            text: '닫기',
            style: 'cancel',
            onPress: () => {
              onCancel();
            },
          },
        ],
      });
    } finally {
      setLoadingPrices(false);
    }
  };

  // 💰 Get Product Price by Amount
  const getProductByAmount = (amount) => {
    return products.find((p) => p.pointAmount === amount);
  };

  // 🎯 Handle Package Press (클릭 즉시 구매 확인)
  const handlePackagePress = (pkg) => {
    if (loading || loadingPrices) return;
    
    // Get product with price
    const product = getProductByAmount(pkg.amount);
    if (!product) {
      showAlert({
        emoji: '❌',
        title: '오류',
        message: '상품 정보를 찾을 수 없습니다.',
        buttons: [
          {
            text: '확인',
            style: 'cancel',
          },
        ],
      });
      return;
    }
    
    HapticService.medium();
    
    // 구매 확인 다이얼로그 (가격 포함)
    showAlert({
      emoji: pkg.emoji,
      title: `${pkg.label} 패키지`,
      message: `${pkg.amount.toLocaleString()} P를 구매하시겠습니까?\n\n${pkg.description}\n\n💰 가격: ${product.localizedPrice}`,
      buttons: [
        {
          text: t('common.cancel', '취소'),
          style: 'cancel',
          onPress: () => {
            HapticService.light();
          },
        },
        {
          text: `${product.localizedPrice} 구매`,
          style: 'primary',
          onPress: () => {
            executePurchase(pkg, product);
          },
        },
      ],
    });
  };

  // 🔐 Verify Purchase with Backend (Extracted for reuse)
  const verifyPurchaseWithBackend = async (purchaseData, userKey) => {
    console.log('[CompactPointPurchaseTab] 🔐 Verifying purchase with backend...');
    console.log('[CompactPointPurchaseTab] Verification request:', {
      user_key: userKey,
      product_id: purchaseData.productId,
      platform: purchaseData.platform,
      packageName: purchaseData.packageName,
      hasToken: !!purchaseData.purchaseToken,
    });
    
    const verifyResponse = await fetch(IAP_ENDPOINTS.VERIFY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_key: userKey,
        purchase_token: purchaseData.purchaseToken,
        product_id: purchaseData.productId,
        package_name: purchaseData.packageName,
        platform: purchaseData.platform,
      }),
    });
    
    const verifyResult = await verifyResponse.json();
    
    if (!verifyResult.success) {
      return { success: false, message: verifyResult.message || '영수증 검증에 실패했습니다' };
    }
    
    console.log('[CompactPointPurchaseTab] ✅ Receipt verified:', verifyResult.data);
    return { success: true, data: verifyResult.data };
  };

  // ✅ Execute Purchase (Real IAP)
  const executePurchase = async (pkg, product) => {
    if (!user?.user_key) {
      showAlert({
        title: t('common.error', '오류'),
        message: '사용자 정보를 확인할 수 없습니다.',
        emoji: '❌',
        buttons: [
          {
            text: t('common.confirm', '확인'),
            style: 'cancel',
          },
        ],
      });
      return;
    }

    setLoading(true);
    setPurchasingPackage(pkg.amount);
    setIsProcessingPurchase(true); // 🔥 중복 처리 방지
    HapticService.medium();

    try {
      console.log('[CompactPointPurchaseTab] 🛒 Starting IAP purchase...');
      console.log('[CompactPointPurchaseTab] Product:', product);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔥 SINGLE SOURCE OF TRUTH: Only request purchase
      // ALL verification happens in purchaseUpdatedListener
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log('[CompactPointPurchaseTab] Requesting purchase from store...');
      const purchase = await IAPService.requestPurchaseIAP(product.productId);
      
      console.log('[CompactPointPurchaseTab] ✅ Purchase request completed');
      console.log('[CompactPointPurchaseTab] ⏳ Waiting for purchaseUpdatedListener to verify...');
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🎯 purchaseUpdatedListener will handle:
      // 1. Extract purchase data
      // 2. Verify with backend
      // 3. Finish transaction
      // 4. Show success message
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    } catch (error) {
      console.error('[CompactPointPurchaseTab] ❌ Purchase error:', error);
      HapticService.error();
      
      // 에러 메시지 파싱
      let errorMessage = t('points.purchase_error', '충전에 실패했습니다');
      
      if (error.message.includes('User cancelled')) {
        errorMessage = '결제가 취소되었습니다';
      } else if (error.message.includes('Network')) {
        errorMessage = '네트워크 연결을 확인해주세요';
      } else if (error.message.includes('already owned')) {
        errorMessage = '이미 소유한 상품입니다. 앱을 재시작해주세요';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert({
        emoji: '❌',
        title: t('common.error', '오류'),
        message: errorMessage,
        buttons: [
          {
            text: t('common.confirm', '확인'),
            style: 'cancel',
          },
        ],
      });
    } finally {
      setLoading(false);
      setPurchasingPackage(null);
      setIsProcessingPurchase(false); // 🔥 중복 처리 방지 해제
    }
  };

  return (
    <View style={styles.container}>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Title */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <CustomText type="title" style={styles.title}>
        {t('points.select_amount', '충전할 금액을 선택하세요')}
      </CustomText>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Package Grid (3 Columns) - 클릭 즉시 구매 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.packageGrid}>
        {POINT_PACKAGES.map((pkg, index) => {
          const isPurchasing = loading && purchasingPackage === pkg.amount;
          const product = getProductByAmount(pkg.amount);
          const isDisabled = loading || loadingPrices || !product;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.packageCard,
                { borderColor: pkg.color },
                isPurchasing && styles.packageCardLoading,
                isDisabled && styles.packageCardDisabled,
              ]}
              onPress={() => handlePackagePress(pkg)}
              activeOpacity={0.7}
              disabled={isDisabled}
            >
              {/* 인기 뱃지 */}
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <CustomText type="tiny" bold style={styles.popularBadgeText}>
                    인기
                  </CustomText>
                </View>
              )}

              {/* Emoji */}
              <CustomText type="huge" style={styles.packageEmoji}>
                {pkg.emoji}
              </CustomText>
              
              {/* Label */}
              <CustomText type="small" bold style={styles.packageLabel}>
                {pkg.label}
              </CustomText>
              
              {/* Amount */}
              <CustomText
                type="big"
                bold
                style={[styles.packageAmount, { color: pkg.color }]}
              >
                {pkg.amount.toLocaleString()}P
              </CustomText>

              {/* Description */}
              <CustomText type="tiny" style={styles.packageDescription}>
                {pkg.description}
              </CustomText>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* Price Display */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {loadingPrices ? (
                <View style={styles.priceLoading}>
                  <ActivityIndicator size="small" color={pkg.color} />
                </View>
              ) : product ? (
                <CustomText type="small" bold style={styles.packagePrice}>
                  {product.localizedPrice}
                </CustomText>
              ) : (
                <CustomText type="tiny" style={styles.packagePriceError}>
                  가격 로딩 실패
                </CustomText>
              )}

              {/* Loading Indicator (구매 중) */}
              {isPurchasing && (
                <ActivityIndicator
                  size="small"
                  color={pkg.color}
                  style={styles.packageLoading}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Info */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.infoCard}>
        <CustomText type="tiny" style={styles.infoText}>
          💡 {t('points.info', '포인트는 페르소나 생성, 음원 제작 등에 사용됩니다')}
        </CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: platformPadding(0),
    paddingBottom: platformPadding(20),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Title
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  title: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: platformPadding(16),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Package Grid (3 Columns) - 클릭 즉시 구매
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  packageGrid: {
    flexDirection: 'row',
    gap: scale(10),
    marginBottom: platformPadding(20),
  },
  packageCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: moderateScale(14),
    borderWidth: 2,
    padding: platformPadding(16),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(180), // Increased for price display
    position: 'relative',
  },
  packageCardLoading: {
    opacity: 0.6,
  },
  packageCardDisabled: {
    opacity: 0.4,
  },
  
  // 인기 뱃지
  popularBadge: {
    position: 'absolute',
    top: platformPadding(8),
    right: platformPadding(8),
    backgroundColor: '#FF6B9D',
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
  },

  // Package 요소들
  packageEmoji: {
    marginBottom: verticalScale(8),
  },
  packageLabel: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: verticalScale(4),
  },
  packageAmount: {
    marginBottom: verticalScale(4),
    // Color is dynamic
  },
  packageDescription: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  
  // Price display
  priceLoading: {
    marginTop: verticalScale(4),
  },
  packagePrice: {
    color: '#FF6B9D',
    marginTop: verticalScale(4),
  },
  packagePriceError: {
    color: '#EF4444',
    marginTop: verticalScale(4),
  },
  
  packageLoading: {
    marginTop: verticalScale(8),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Info
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: moderateScale(10),
    padding: platformPadding(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

export default CompactPointPurchaseTab;
