/**
 * 💰 IAPService - In-App Purchase Service Layer
 * 
 * ✨ ANIMA Philosophy:
 * - 투명함: 실시간 가격 표시 (국가별 자동 변환)
 * - 안전함: 영수증 검증 (백엔드)
 * - 단순함: 최소/중간/최대 3개 패키지
 * 
 * 🔄 Purchase Flow:
 * 1. initializeIAP() - IAP 초기화
 * 2. loadProductPrices() - 상품 가격 로딩
 * 3. requestPurchase() - 구매 요청
 * 4. verifyReceipt() - 영수증 검증 (백엔드)
 * 5. finishTransaction() - 트랜잭션 완료
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-17
 */

import { Platform } from 'react-native';
import RNIap, {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
  getAvailablePurchases,
  flushFailedPurchasesCachedAsPendingAndroid,
  Product,
  Purchase,
  PurchaseError,
} from 'react-native-iap';
import * as PendingPurchaseStorage from './PendingPurchaseStorage';

// 🎯 Product IDs (Google Play & App Store)
export const PRODUCT_IDS = {
  POINT_1000: 'point1000',
  POINT_5000: 'point5000',
  POINT_10000: 'point10000',
};

// 📦 All Product IDs as Array
const PRODUCT_ID_LIST = Object.values(PRODUCT_IDS);

// 🔧 IAP State
let iapInitialized = false;
let purchaseUpdateSubscription = null;
let purchaseErrorSubscription = null;

/**
 * ✅ Initialize IAP Connection
 * 
 * @returns {Promise<boolean>} Success status
 */
export const initializeIAP = async () => {
  try {
    if (iapInitialized) {
      console.log('[IAPService] Already initialized');
      return true;
    }

    console.log('[IAPService] Initializing IAP connection...');
    
    // Connect to IAP
    const result = await initConnection();
    console.log('[IAPService] Connection result:', result);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔧 Clear pending Android purchases (CRITICAL!)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (Platform.OS === 'android') {
      try {
        console.log('[IAPService] 🧹 Clearing pending Android purchases...');
        await flushFailedPurchasesCachedAsPendingAndroid();
        console.log('[IAPService] ✅ Pending purchases cleared');
      } catch (error) {
        console.warn('[IAPService] ⚠️ Failed to clear pending purchases:', error);
      }
    }

    iapInitialized = true;
    console.log('[IAPService] ✅ IAP initialized successfully');
    
    return true;
  } catch (error) {
    console.error('[IAPService] ❌ Failed to initialize IAP:', error);
    return false;
  }
};

/**
 * 🛑 End IAP Connection
 */
export const disconnectIAP = async () => {
  try {
    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }
    if (purchaseErrorSubscription) {
      purchaseErrorSubscription.remove();
      purchaseErrorSubscription = null;
    }

    await endConnection();
    iapInitialized = false;
    console.log('[IAPService] ✅ IAP disconnected');
  } catch (error) {
    console.error('[IAPService] ❌ Error disconnecting IAP:', error);
  }
};

/**
 * 💰 Load Product Prices from Store
 * 
 * @returns {Promise<Array<Product>>} Products with prices
 */
export const loadProductPrices = async () => {
  try {
    console.log('[IAPService] Loading product prices...');
    console.log('[IAPService] Product IDs:', PRODUCT_ID_LIST);

    // Ensure IAP is initialized
    if (!iapInitialized) {
      const initialized = await initializeIAP();
      if (!initialized) {
        throw new Error('Failed to initialize IAP');
      }
    }

    // Get products from store
    const products = await getProducts({ skus: PRODUCT_ID_LIST });
    console.log('[IAPService] ✅ Products loaded:', products);

    // Parse and format products
    const formattedProducts = products.map((product) => {
      // Map product ID to point amount
      const pointAmount = getPointAmountFromProductId(product.productId);

      return {
        productId: product.productId,
        pointAmount,
        price: product.price, // Numeric price (e.g., 1.1)
        localizedPrice: product.localizedPrice, // Formatted price (e.g., "₩1,100")
        currency: product.currency, // Currency code (e.g., "KRW")
        title: product.title,
        description: product.description,
      };
    });

    console.log('[IAPService] ✅ Formatted products:', formattedProducts);
    return formattedProducts;
  } catch (error) {
    console.error('[IAPService] ❌ Failed to load product prices:', error);
    throw error;
  }
};

/**
 * 🛒 Request Purchase (Cross-Platform)
 * 
 * @param {string} productId - Product ID to purchase
 * @returns {Promise<Purchase>} Purchase object
 */
export const requestPurchaseIAP = async (productId) => {
  try {
    console.log('[IAPService] 🛒 Requesting purchase for:', productId);
    console.log('[IAPService] Platform:', Platform.OS);

    // Ensure IAP is initialized
    if (!iapInitialized) {
      const initialized = await initializeIAP();
      if (!initialized) {
        throw new Error('Failed to initialize IAP');
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🍎 iOS: Use 'sku' parameter
    // 🤖 Android: Use 'skus' array parameter
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let purchaseResult;
    
    if (Platform.OS === 'ios') {
      console.log('[IAPService] iOS: Using sku parameter');
      purchaseResult = await requestPurchase({ sku: productId });
    } else {
      console.log('[IAPService] Android: Using skus array parameter');
      purchaseResult = await requestPurchase({ skus: [productId] });
    }
    
    // 🔍 DEBUG: Log entire purchase result
    console.log('[IAPService] ✅ Purchase requested - Full result:', JSON.stringify(purchaseResult, null, 2));
    console.log('[IAPService] Purchase result type:', Array.isArray(purchaseResult) ? 'ARRAY' : 'OBJECT');
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔧 CRITICAL: requestPurchase() returns ARRAY on Android!
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;
    
    if (!purchase) {
      throw new Error('Purchase result is empty or invalid');
    }
    
    console.log('[IAPService] ✅ Extracted single purchase object');
    console.log('[IAPService] Purchase fields:', {
      productId: purchase.productId,
      productIds: purchase.productIds,
      transactionId: purchase.transactionId,
      purchaseToken: purchase.purchaseToken,
      transactionReceipt: purchase.transactionReceipt ? 'exists' : 'missing',
      dataAndroid: purchase.dataAndroid ? 'exists' : 'missing',
      isAcknowledgedAndroid: purchase.isAcknowledgedAndroid,
    });

    return purchase;
  } catch (error) {
    console.error('[IAPService] ❌ Purchase request failed:', error);
    throw error;
  }
};

/**
 * 🧹 Clear Unfinished Purchases (Consume them)
 * 
 * This function gets all pending/unfinished purchases and finishes them.
 * Use this when you want to allow repeated purchases of consumable items.
 * 
 * @returns {Promise<number>} Number of cleared purchases
 */
export const clearUnfinishedPurchases = async () => {
  try {
    console.log('[IAPService] 🧹 Checking for unfinished purchases...');
    
    // Get all available (pending) purchases
    const availablePurchases = await getAvailablePurchases();
    console.log('[IAPService] Available purchases:', availablePurchases.length);
    
    if (availablePurchases.length === 0) {
      console.log('[IAPService] ✅ No unfinished purchases');
      return 0;
    }
    
    // Finish each purchase
    for (const purchase of availablePurchases) {
      console.log('[IAPService] 🗑️ Finishing unfinished purchase:', {
        productId: purchase.productId || purchase.productIds?.[0],
        transactionId: purchase.transactionId,
      });
      
      try {
        await finishTransaction({ purchase, isConsumable: true });
        console.log('[IAPService] ✅ Unfinished purchase cleared');
      } catch (error) {
        console.error('[IAPService] ❌ Failed to clear purchase:', error);
      }
    }
    
    console.log('[IAPService] ✅ Cleared', availablePurchases.length, 'unfinished purchases');
    return availablePurchases.length;
  } catch (error) {
    console.error('[IAPService] ❌ Failed to clear unfinished purchases:', error);
    return 0;
  }
};

/**
 * 🔧 Extract Purchase Data (Android/iOS Compatible)
 * 
 * Handles platform differences in purchase object structure:
 * - Android: productIds (array), purchaseToken, dataAndroid
 * - iOS: productId (string), transactionReceipt, transactionId
 * 
 * @param {Purchase} purchase - Raw purchase object
 * @param {string} fallbackProductId - Fallback product ID if extraction fails
 * @returns {Object} Normalized purchase data
 */
export const extractPurchaseData = (purchase, fallbackProductId = null) => {
  console.log('[IAPService] 🔧 Extracting purchase data...');
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📦 Product ID Extraction
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let productId = null;
  
  if (purchase.productId) {
    // iOS or newer Android
    productId = purchase.productId;
  } else if (purchase.productIds && purchase.productIds.length > 0) {
    // Android (array)
    productId = purchase.productIds[0];
  } else if (fallbackProductId) {
    // Fallback
    productId = fallbackProductId;
    console.warn('[IAPService] ⚠️ Using fallback productId:', fallbackProductId);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔑 Purchase Token / Receipt (Platform-Specific)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🤖 Android: purchaseToken (required for Google Play API)
  // 🍎 iOS: transactionReceipt (Base64-encoded receipt data)
  const purchaseToken = Platform.OS === 'ios' 
    ? (purchase.transactionReceipt || null)
    : (purchase.purchaseToken || null);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🆔 Transaction ID
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const transactionId = purchase.transactionId || null;
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📱 Package Name (Android)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const packageName = purchase.packageNameAndroid || 'ai.anima.soulconnect';
  
  const extracted = {
    productId,
    purchaseToken,
    transactionId,
    packageName,
    platform: Platform.OS,
    rawPurchase: purchase, // Keep original for debugging
  };
  
  console.log('[IAPService] ✅ Extracted purchase data:', extracted);
  
  return extracted;
};

/**
 * ✅ Finish Transaction
 * 
 * @param {Purchase} purchase - Purchase to finish
 */
export const finishTransactionIAP = async (purchase) => {
  try {
    console.log('[IAPService] Finishing transaction:', purchase.transactionId || 'unknown');
    
    await finishTransaction({ purchase, isConsumable: true });
    console.log('[IAPService] ✅ Transaction finished');
  } catch (error) {
    console.error('[IAPService] ❌ Failed to finish transaction:', error);
    throw error;
  }
};

/**
 * 🔍 Get Point Amount from Product ID
 * 
 * @param {string} productId - Product ID
 * @returns {number} Point amount
 */
const getPointAmountFromProductId = (productId) => {
  switch (productId) {
    case PRODUCT_IDS.POINT_1000:
      return 1000;
    case PRODUCT_IDS.POINT_5000:
      return 5000;
    case PRODUCT_IDS.POINT_10000:
      return 10000;
    default:
      console.warn('[IAPService] Unknown product ID:', productId);
      return 0;
  }
};

/**
 * 🎧 Setup Purchase Listeners
 * 
 * @param {Function} onPurchaseUpdate - Callback for purchase updates
 * @param {Function} onPurchaseError - Callback for purchase errors
 */
export const setupPurchaseListeners = (onPurchaseUpdate, onPurchaseError) => {
  // Remove existing listeners
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
  }

  // Setup new listeners
  purchaseUpdateSubscription = purchaseUpdatedListener((purchase) => {
    console.log('[IAPService] Purchase update:', purchase);
    if (onPurchaseUpdate) {
      onPurchaseUpdate(purchase);
    }
  });

  purchaseErrorSubscription = purchaseErrorListener((error) => {
    console.error('[IAPService] Purchase error:', error);
    if (onPurchaseError) {
      onPurchaseError(error);
    }
  });

  console.log('[IAPService] ✅ Purchase listeners setup');
};

/**
 * 🔄 Retry Pending Purchases Verification
 * 
 * This function attempts to verify all pending purchases with the backend.
 * Called on app start and can be manually triggered.
 * 
 * @param {Function} verifyCallback - Callback to verify purchase with backend
 * @returns {Promise<Object>} Result { success: number, failed: number }
 */
export const retryPendingPurchases = async (verifyCallback) => {
  try {
    console.log('[IAPService] 🔄 Retrying pending purchases verification...');
    
    const pendingPurchases = await PendingPurchaseStorage.getPendingPurchases();
    
    if (pendingPurchases.length === 0) {
      console.log('[IAPService] ✅ No pending purchases to retry');
      return { success: 0, failed: 0 };
    }
    
    console.log('[IAPService] 📋 Found', pendingPurchases.length, 'pending purchases');
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const pending of pendingPurchases) {
      console.log('[IAPService] 🔄 Retrying purchase:', {
        id: pending.id,
        productId: pending.productId,
        retryCount: pending.retryCount,
        timestamp: new Date(pending.timestamp).toISOString(),
      });
      
      try {
        // Increment retry count
        await PendingPurchaseStorage.incrementRetryCount(pending.id);
        
        // Attempt verification via callback
        const result = await verifyCallback(pending.purchaseData, pending.userKey);
        
        if (result.success) {
          console.log('[IAPService] ✅ Verification successful, finishing transaction...');
          
          // Finish transaction
          try {
            await finishTransaction({ purchase: pending.purchase, isConsumable: true });
            console.log('[IAPService] ✅ Transaction finished');
          } catch (finishError) {
            console.error('[IAPService] ⚠️ Failed to finish transaction (will retry next time):', finishError);
          }
          
          // Remove from storage
          await PendingPurchaseStorage.removePendingPurchase(pending.id);
          
          successCount++;
          console.log('[IAPService] ✅ Pending purchase resolved:', pending.id);
        } else {
          console.error('[IAPService] ❌ Verification failed:', result.message);
          failedCount++;
        }
      } catch (error) {
        console.error('[IAPService] ❌ Error retrying purchase:', error);
        failedCount++;
      }
    }
    
    console.log('[IAPService] 🎯 Retry complete:', { successCount, failedCount });
    
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('[IAPService] ❌ Failed to retry pending purchases:', error);
    return { success: 0, failed: 0 };
  }
};

/**
 * 📊 Get Product Info by ID
 * 
 * @param {string} productId - Product ID
 * @param {Array<Product>} products - All products
 * @returns {Product|null} Product or null
 */
export const getProductById = (productId, products) => {
  return products.find((p) => p.productId === productId) || null;
};

export default {
  PRODUCT_IDS,
  initializeIAP,
  disconnectIAP,
  loadProductPrices,
  requestPurchaseIAP,
  extractPurchaseData,
  finishTransactionIAP,
  clearUnfinishedPurchases,
  retryPendingPurchases,
  setupPurchaseListeners,
  getProductById,
};
