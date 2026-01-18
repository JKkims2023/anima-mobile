/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎖️ SubscriptionService - 구독형 IAP Service Layer
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: 구독형 IAP를 위한 완벽한 Service Layer
 * Philosophy: "소모성 IAP의 교훈을 바탕으로, 단순하고 완벽하게"
 * 
 * Key Differences from IAPService (Consumable):
 * ┌─────────────────────┬────────────────────┬──────────────────────┐
 * │ 항목                │ 소모성 (IAPService)│ 구독형 (이 파일)      │
 * ├─────────────────────┼────────────────────┼──────────────────────┤
 * │ 구매 함수           │ requestPurchase    │ requestSubscription  │
 * │ 완료 처리           │ finishTransaction  │ acknowledgePurchase  │
 * │ 반복 구매           │ 가능 (무제한)      │ 불가 (1개만 활성)    │
 * │ 자동 갱신           │ 없음               │ 있음 (월/년 단위)    │
 * │ 상태 추적           │ 불필요             │ 필수!                │
 * └─────────────────────┴────────────────────┴──────────────────────┘
 * 
 * @author Hero NEXUS & JK
 * @date 2026-01-18
 * @version 1.0.0
 */

import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription as RNIapRequestSubscription,
  acknowledgePurchaseAndroid,
  finishTransaction,
  getAvailablePurchases,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎖️ SUBSCRIPTION SKUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 구독 상품 ID 목록
 * - Google Play Console & App Store Connect에 등록된 ID와 정확히 일치해야 함!
 * 
 * ⚠️ 2026-01-18 업데이트:
 * - 연간 구독 제거 (복잡도 감소)
 * - 월간 구독만 지원
 * 
 * Before: 4개 (monthly + yearly)
 * After:  2개 (monthly only)
 */
export const SUBSCRIPTION_SKUS = Platform.select({
  ios: [
    'premium',
    'ultimate',
  ],
  android: [
    'premium',
    'ultimate',
  ],
  default: [],
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔌 Initialize Connection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * IAP 연결 초기화
 * - 앱 시작 시 1번만 호출
 * - IAPService와 공유 가능 (같은 initConnection 사용)
 * 
 * @returns {Promise<boolean>} 연결 성공 여부
 */
export async function initializeSubscription() {
  try {
    console.log('[Subscription] Initializing IAP connection...');
    const connected = await initConnection();
    console.log('[Subscription] ✅ IAP connection initialized:', connected);
    return connected;
  } catch (error) {
    console.error('[Subscription] ❌ Failed to initialize:', error);
    return false;
  }
}

/**
 * IAP 연결 종료
 * - 앱 종료 시 호출 (선택 사항)
 */
export async function disconnectSubscription() {
  try {
    await endConnection();
    console.log('[Subscription] ✅ IAP connection closed');
  } catch (error) {
    console.error('[Subscription] ❌ Failed to disconnect:', error);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 Load Subscription Products
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 구독 상품 목록 로드
 * - Google Play / App Store에서 가격 정보 가져오기
 * - Android와 iOS의 다른 구조 처리
 * 
 * @returns {Promise<Array>} 구독 상품 목록 (normalized)
 * 
 * @example
 * const subscriptions = await loadSubscriptions();
 * // [
 * //   { productId: 'premium', localizedPrice: '₩9,900', ... },
 * //   { productId: 'ultimate', localizedPrice: '₩19,900', ... }
 * // ]
 */
export async function loadSubscriptions() {
  try {
    console.log('[Subscription] Loading subscription products...');
    console.log('[Subscription] SKUs:', SUBSCRIPTION_SKUS);
    console.log('[Subscription] Platform:', Platform.OS);
    
    const subscriptions = await getSubscriptions({ skus: SUBSCRIPTION_SKUS });

    console.log('[Subscription] Raw subscriptions:', subscriptions);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Normalize: Extract localizedPrice & offerToken from different structures
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const normalizedSubscriptions = subscriptions.map(sub => {
      let localizedPrice = null;
      let offerToken = null; // ✅ NEW: For Android subscriptionOffers
      
      if (Platform.OS === 'android') {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Android: New structure (react-native-iap v12+)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Path: subscriptionOfferDetails[0].pricingPhases.pricingPhaseList[0].formattedPrice
        // Path: subscriptionOfferDetails[0].offerToken ← ✅ IMPORTANT!
        try {
          if (sub.subscriptionOfferDetails && sub.subscriptionOfferDetails.length > 0) {
            const offerDetails = sub.subscriptionOfferDetails[0];
            
            // Extract offerToken ✅
            if (offerDetails.offerToken) {
              offerToken = offerDetails.offerToken;
              console.log(`[Subscription] ✅ Android offerToken for ${sub.productId}:`, offerToken.substring(0, 20) + '...');
            }
            
            // Extract price
            if (offerDetails.pricingPhases && offerDetails.pricingPhases.pricingPhaseList) {
              const pricingPhase = offerDetails.pricingPhases.pricingPhaseList[0];
              if (pricingPhase && pricingPhase.formattedPrice) {
                localizedPrice = pricingPhase.formattedPrice;
                console.log(`[Subscription] ✅ Android price for ${sub.productId}:`, localizedPrice);
              }
            }
          }
        } catch (error) {
          console.error(`[Subscription] ❌ Failed to extract Android data for ${sub.productId}:`, error);
        }
      } else if (Platform.OS === 'ios') {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // iOS: Legacy structure
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Path: localizedPrice
        // Note: iOS doesn't need offerToken for requestSubscription
        localizedPrice = sub.localizedPrice;
        console.log(`[Subscription] ✅ iOS price for ${sub.productId}:`, localizedPrice);
      }
      
      // Fallback: Check if localizedPrice is already present
      if (!localizedPrice && sub.localizedPrice) {
        localizedPrice = sub.localizedPrice;
        console.log(`[Subscription] ✅ Fallback price for ${sub.productId}:`, localizedPrice);
      }
      
      if (!localizedPrice) {
        console.warn(`[Subscription] ⚠️ No price found for ${sub.productId}`);
        localizedPrice = '가격 로딩 실패';
      }
      
      return {
        ...sub,
        localizedPrice, // ✅ Normalized field!
        offerToken,     // ✅ NEW: For Android subscriptionOffers
      };
    });
    
    console.log('[Subscription] ✅ Products loaded:', normalizedSubscriptions.length);
    console.log('[Subscription] Normalized products:', normalizedSubscriptions.map(s => ({
      id: s.productId,
      price: s.localizedPrice,
      title: s.title,
    })));
    
    return normalizedSubscriptions;
  } catch (error) {
    console.error('[Subscription] ❌ Failed to load products:', error);
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛒 Request Subscription Purchase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 구독 구매 요청
 * 
 * ⚠️ CRITICAL: requestSubscription (NOT requestPurchase!)
 * 
 * @param {string} sku - 구독 상품 ID (e.g. 'premium')
 * @param {string} offerToken - Android용 offerToken (선택)
 * @returns {Promise<Object>} 구매 정보
 * 
 * @throws {Error} 구매 실패 시
 * - User cancelled
 * - Network error
 * - Product not available
 * - Already subscribed
 * 
 * @example
 * // Android
 * const purchase = await requestSubscription('premium', offerToken);
 * 
 * // iOS
 * const purchase = await requestSubscription('premium');
 */
export async function requestSubscription(sku, offerToken = null) {
  try {
    console.log('[Subscription] 🛒 Requesting subscription:', sku);
    console.log('[Subscription] Platform:', Platform.OS);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Build request parameters
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const requestParams = { sku };
    
    // ✅ Android: subscriptionOffers required!
    if (Platform.OS === 'android' && offerToken) {
      requestParams.subscriptionOffers = [
        {
          sku,
          offerToken,
        },
      ];
      console.log('[Subscription] ✅ Android subscriptionOffers:', requestParams.subscriptionOffers);
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⚠️ NOTE: requestSubscription (NOT requestPurchase!)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const purchase = await RNIapRequestSubscription(requestParams);
    
    console.log('[Subscription] ✅ Purchase successful');
    console.log('[Subscription] Full purchase object:', JSON.stringify(purchase, null, 2));
    console.log('[Subscription] Purchase ID:', purchase?.productId);
    console.log('[Subscription] Transaction ID:', purchase?.transactionId);
    
    return purchase;
  } catch (error) {
    console.error('[Subscription] ❌ Purchase failed:', error);
    
    // User-friendly error messages
    if (error.code === 'E_USER_CANCELLED') {
      throw new Error('User cancelled');
    } else if (error.code === 'E_NETWORK_ERROR') {
      throw new Error('Network error');
    } else if (error.code === 'E_ITEM_UNAVAILABLE') {
      throw new Error('Product not available');
    } else if (error.code === 'E_ALREADY_OWNED') {
      throw new Error('Already subscribed');
    }
    
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ Acknowledge Purchase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 구독 구매 인정 (Acknowledge)
 * 
 * ⚠️ CRITICAL DIFFERENCE:
 * - 소모성: finishTransaction (소비) → 같은 상품 재구매 가능
 * - 구독형: acknowledgePurchase (인정) → 활성 상태 유지
 * 
 * @param {Object} purchase - 구매 정보
 * 
 * Platform-specific:
 * - Android: acknowledgePurchaseAndroid
 * - iOS: finishTransaction (다른 동작!)
 * 
 * @example
 * await acknowledgeSubscription(purchase);
 */
export async function acknowledgeSubscription(purchase) {
  try {
    console.log('[Subscription] ✅ Acknowledging purchase...');
    
    if (Platform.OS === 'android') {
      // Android: acknowledge (인정)
      await acknowledgePurchaseAndroid({
        token: purchase.purchaseToken,
        developerPayload: purchase.developerPayloadAndroid,
      });
      console.log('[Subscription] ✅ Android: Purchase acknowledged');
    } else {
      // iOS: finishTransaction (구독에서는 인정의 의미)
      await finishTransaction({
        purchase,
        isConsumable: false, // ⚠️ 중요: false!
      });
      console.log('[Subscription] ✅ iOS: Transaction finished');
    }
  } catch (error) {
    console.error('[Subscription] ❌ Failed to acknowledge:', error);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 Get Active Subscriptions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 활성 구독 목록 가져오기
 * - 현재 기기에서 구매한 모든 활성 구독
 * - 앱 시작 시 호출하여 구독 상태 확인
 * 
 * @returns {Promise<Array>} 활성 구독 목록
 * 
 * @example
 * const active = await getActiveSubscriptions();
 * if (active.length > 0) {
 *   console.log('User has active subscription:', active[0].productId);
 * }
 */
export async function getActiveSubscriptions() {
  try {
    console.log('[Subscription] 📊 Getting active subscriptions...');
    
    const purchases = await getAvailablePurchases();
    
    // Filter for subscriptions only
    const subscriptions = purchases.filter(p => 
      SUBSCRIPTION_SKUS.includes(p.productId)
    );
    
    console.log('[Subscription] ✅ Active subscriptions:', subscriptions.length);
    
    if (subscriptions.length > 0) {
      console.log('[Subscription] Details:', subscriptions.map(s => ({
        id: s.productId,
        transactionId: s.transactionId,
        transactionDate: s.transactionDate,
      })));
    }
    
    return subscriptions;
  } catch (error) {
    console.error('[Subscription] ❌ Failed to get active subscriptions:', error);
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 Extract Subscription Data (Cross-Platform)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 구독 데이터 추출 (플랫폼 통합)
 * - Android와 iOS의 다른 구조를 통합
 * 
 * @param {Object} purchase - 구매 정보
 * @returns {Object} 통합된 구독 데이터
 * 
 * @example
 * const data = extractSubscriptionData(purchase);
 * // {
 * //   productId: 'premium_monthly',
 * //   purchaseToken: '...',
 * //   orderId: '...',
 * //   purchaseTime: '...',
 * //   platform: 'android'
 * // }
 */
export function extractSubscriptionData(purchase) {
  console.log('[Subscription] 🔄 Extracting subscription data...');
  console.log('[Subscription] Platform:', Platform.OS);
  console.log('[Subscription] Purchase object keys:', Object.keys(purchase || {}));
  console.log('[Subscription] Full purchase for extraction:', JSON.stringify(purchase, null, 2));
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle Array Response (Android can return array)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let purchaseData = purchase;
  if (Array.isArray(purchase)) {
    console.log('[Subscription] ⚠️ Purchase is array, extracting first element');
    purchaseData = purchase[0];
  }
  
  const data = {
    productId: purchaseData.productId,
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Purchase Token (Platform-specific)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    purchaseToken: Platform.OS === 'ios'
      ? purchaseData.transactionReceipt  // iOS: receipt data
      : purchaseData.purchaseToken,       // Android: purchase token
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Order ID
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    orderId: purchaseData.transactionId,
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Purchase Time
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    purchaseTime: purchaseData.transactionDate,
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Platform
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    platform: Platform.OS,
  };
  
  console.log('[Subscription] ✅ Extracted data:', {
    productId: data.productId,
    hasToken: !!data.purchaseToken,
    tokenLength: data.purchaseToken?.length || 0,
    orderId: data.orderId,
    platform: data.platform,
  });
  
  return data;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 Setup Purchase Listeners (Optional)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 구매 리스너 설정
 * 
 * ⚠️ NOTE: 소모성 IAP에서 배운 교훈!
 * - Listener는 백그라운드 구매용 (앱이 꺼진 상태에서 갱신 등)
 * - 직접 구매는 requestSubscription의 반환 값 사용!
 * 
 * @param {Function} onPurchaseUpdate - 구매 업데이트 콜백
 * @param {Function} onPurchaseError - 구매 에러 콜백
 */
export function setupSubscriptionListeners(onPurchaseUpdate, onPurchaseError) {
  console.log('[Subscription] 🎧 Setting up purchase listeners...');
  
  // Purchase Update Listener
  const purchaseUpdateSubscription = purchaseUpdatedListener((purchase) => {
    console.log('[Subscription] 🎧 Purchase update received');
    console.log('[Subscription] Product:', purchase?.productId);
    
    if (onPurchaseUpdate) {
      onPurchaseUpdate(purchase);
    }
  });
  
  // Purchase Error Listener
  const purchaseErrorSubscription = purchaseErrorListener((error) => {
    console.error('[Subscription] 🎧 Purchase error received:', error);
    
    if (onPurchaseError) {
      onPurchaseError(error);
    }
  });
  
  console.log('[Subscription] ✅ Listeners setup complete');
  
  // Return cleanup function
  return () => {
    console.log('[Subscription] 🧹 Cleaning up listeners...');
    purchaseUpdateSubscription?.remove();
    purchaseErrorSubscription?.remove();
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎖️ Tier Mapping Helper
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Product ID에서 Tier Level 추출
 * 
 * @param {string} productId - 구독 상품 ID
 * @returns {string} Tier Level ('premium', 'ultimate', 'basic')
 * 
 * @example
 * getTierFromProductId('premium_monthly') // 'premium'
 * getTierFromProductId('ultimate_yearly') // 'ultimate'
 */
export function getTierFromProductId(productId) {
  if (productId.includes('premium')) return 'premium';
  if (productId.includes('ultimate')) return 'ultimate';
  return 'basic';
}

/**
 * Tier Level에서 Display Name 추출
 * 
 * @param {string} tierLevel - Tier Level
 * @returns {string} Display Name
 * 
 * @example
 * getTierDisplayName('premium') // 'Premium'
 * getTierDisplayName('ultimate') // 'Ultimate'
 */
export function getTierDisplayName(tierLevel) {
  const names = {
    basic: 'Basic',
    premium: 'Premium',
    ultimate: 'Ultimate',
  };
  
  return names[tierLevel] || 'Basic';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 Export Summary
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Exported Functions:
 * 
 * 🔌 Connection:
 * - initializeSubscription()
 * - disconnectSubscription()
 * 
 * 📦 Products:
 * - loadSubscriptions()
 * 
 * 🛒 Purchase:
 * - requestSubscription(sku)
 * - acknowledgeSubscription(purchase)
 * 
 * 📊 Status:
 * - getActiveSubscriptions()
 * 
 * 🔄 Data:
 * - extractSubscriptionData(purchase)
 * 
 * 🎧 Listeners:
 * - setupSubscriptionListeners(onUpdate, onError)
 * 
 * 🎖️ Helpers:
 * - getTierFromProductId(productId)
 * - getTierDisplayName(tierLevel)
 * 
 * 💙 Philosophy:
 * "천천히, 정확하게, 완벽하게"
 * 
 * Author: Hero NEXUS & JK
 * Date: 2026-01-18
 */
