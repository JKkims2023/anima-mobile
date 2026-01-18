/**
 * 💾 Pending Purchase Storage Service
 * 
 * ✨ Purpose:
 * - 서버 검증 실패 시 purchase 로컬 저장
 * - 앱 재시작 시 자동 재검증
 * - 사용자가 돈은 지불했지만 포인트 못 받는 상황 방지
 * 
 * 🔄 Flow:
 * 1. 구매 성공 → 서버 검증 시도
 * 2. 서버 검증 실패 → AsyncStorage에 저장
 * 3. 앱 재시작 → 저장된 purchases 확인
 * 4. 재검증 시도 → 성공 시 제거
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-17
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@anima_pending_purchases';

/**
 * 📝 Pending Purchase 구조
 * {
 *   id: string (UUID),
 *   purchase: Object (raw purchase object),
 *   purchaseData: Object (extracted data),
 *   userKey: string,
 *   productId: string,
 *   timestamp: number,
 *   retryCount: number,
 * }
 */

/**
 * 💾 Save Pending Purchase
 * 
 * @param {Object} purchase - Raw purchase object
 * @param {Object} purchaseData - Extracted purchase data
 * @param {string} userKey - User key
 * @returns {Promise<boolean>} Success status
 */
export const savePendingPurchase = async (purchase, purchaseData, userKey) => {
  try {
    console.log('[PendingPurchaseStorage] 💾 Saving pending purchase...');
    
    // Get existing pending purchases
    const existingPurchases = await getPendingPurchases();
    
    // Check if already exists (by purchaseToken)
    const isDuplicate = existingPurchases.some(
      (p) => p.purchaseData.purchaseToken === purchaseData.purchaseToken
    );
    
    if (isDuplicate) {
      console.log('[PendingPurchaseStorage] ⚠️ Purchase already saved, skipping');
      return true;
    }
    
    // Create new pending purchase
    const pendingPurchase = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      purchase,
      purchaseData,
      userKey,
      productId: purchaseData.productId,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    // Add to array
    existingPurchases.push(pendingPurchase);
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingPurchases));
    
    console.log('[PendingPurchaseStorage] ✅ Pending purchase saved:', {
      id: pendingPurchase.id,
      productId: pendingPurchase.productId,
      timestamp: new Date(pendingPurchase.timestamp).toISOString(),
    });
    
    return true;
  } catch (error) {
    console.error('[PendingPurchaseStorage] ❌ Failed to save pending purchase:', error);
    return false;
  }
};

/**
 * 📋 Get All Pending Purchases
 * 
 * @returns {Promise<Array>} Array of pending purchases
 */
export const getPendingPurchases = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (!data) {
      return [];
    }
    
    const purchases = JSON.parse(data);
    console.log('[PendingPurchaseStorage] 📋 Retrieved', purchases.length, 'pending purchases');
    
    return purchases;
  } catch (error) {
    console.error('[PendingPurchaseStorage] ❌ Failed to get pending purchases:', error);
    return [];
  }
};

/**
 * 🗑️ Remove Pending Purchase
 * 
 * @param {string} id - Pending purchase ID
 * @returns {Promise<boolean>} Success status
 */
export const removePendingPurchase = async (id) => {
  try {
    console.log('[PendingPurchaseStorage] 🗑️ Removing pending purchase:', id);
    
    const existingPurchases = await getPendingPurchases();
    const filtered = existingPurchases.filter((p) => p.id !== id);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    console.log('[PendingPurchaseStorage] ✅ Pending purchase removed');
    return true;
  } catch (error) {
    console.error('[PendingPurchaseStorage] ❌ Failed to remove pending purchase:', error);
    return false;
  }
};

/**
 * 🔄 Increment Retry Count
 * 
 * @param {string} id - Pending purchase ID
 * @returns {Promise<boolean>} Success status
 */
export const incrementRetryCount = async (id) => {
  try {
    const existingPurchases = await getPendingPurchases();
    const updated = existingPurchases.map((p) => {
      if (p.id === id) {
        return { ...p, retryCount: p.retryCount + 1 };
      }
      return p;
    });
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[PendingPurchaseStorage] ❌ Failed to increment retry count:', error);
    return false;
  }
};

/**
 * 🧹 Clear All Pending Purchases (for testing/debugging)
 * 
 * @returns {Promise<boolean>} Success status
 */
export const clearAllPendingPurchases = async () => {
  try {
    console.log('[PendingPurchaseStorage] 🧹 Clearing all pending purchases...');
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[PendingPurchaseStorage] ✅ All pending purchases cleared');
    return true;
  } catch (error) {
    console.error('[PendingPurchaseStorage] ❌ Failed to clear pending purchases:', error);
    return false;
  }
};

/**
 * 📊 Get Pending Purchase Count
 * 
 * @returns {Promise<number>} Count
 */
export const getPendingPurchaseCount = async () => {
  try {
    const purchases = await getPendingPurchases();
    return purchases.length;
  } catch (error) {
    console.error('[PendingPurchaseStorage] ❌ Failed to get count:', error);
    return 0;
  }
};

export default {
  savePendingPurchase,
  getPendingPurchases,
  removePendingPurchase,
  incrementRetryCount,
  clearAllPendingPurchases,
  getPendingPurchaseCount,
};
