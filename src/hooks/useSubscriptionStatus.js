/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎖️ useSubscriptionStatus - 구독 상태 관리 Hook
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: 앱 전체에서 구독 상태를 관리하는 Custom Hook
 * Philosophy: "단일 진입점 - 모든 컴포넌트가 같은 구독 상태를 공유"
 * 
 * Features:
 * - 앱 시작 시 구독 상태 자동 확인
 * - 서버와 실시간 동기화
 * - 자동 refresh 기능
 * - 에러 처리
 * 
 * @author Hero NEXUS & JK
 * @date 2026-01-18
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api/apiClient';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎖️ useSubscriptionStatus Hook
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 구독 상태 관리 Hook
 * 
 * @param {string} userKey - 사용자 키
 * @returns {Object} 구독 상태 및 메서드
 * 
 * @example
 * const {
 *   subscription,
 *   loading,
 *   error,
 *   refresh,
 *   hasActiveSubscription,
 *   tierLevel,
 *   isActive,
 *   expiryDate,
 *   daysRemaining,
 * } = useSubscriptionStatus(user?.user_key);
 * 
 * // 사용
 * if (hasActiveSubscription) {
 *   console.log('User tier:', tierLevel);
 * }
 */
export const useSubscriptionStatus = (userKey) => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // States
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Check Subscription Status (Server)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const checkSubscriptionStatus = useCallback(async () => {
    if (!userKey) {
      console.log('[useSubscription] No user key, skipping check');
      setSubscription(null);
      setLoading(false);
      return;
    }
    
    try {
      console.log('[useSubscription] 📊 Checking subscription status...');
      console.log('[useSubscription] User:', userKey);
      
      setLoading(true);
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // API Call: GET /api/subscription/status
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const response = await apiClient.get('/api/subscription/status', {
        params: { user_key: userKey }
      });
      
      console.log('[useSubscription] Response:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        
        setSubscription(data);
        setError(null);
        
        console.log('[useSubscription] ✅ Status:', {
          hasActive: data.has_active_subscription,
          tier: data.tier_level,
          status: data.status,
          expiryDate: data.expiry_date,
          daysRemaining: data.days_remaining,
        });
      } else {
        console.log('[useSubscription] ⚠️ No active subscription');
        setSubscription(null);
        setError(null);
      }
      
    } catch (err) {
      console.error('[useSubscription] ❌ Failed to check status:', err);
      setError(err.message || 'Failed to check subscription status');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [userKey]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Initial Load
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    console.log('[useSubscription] 🚀 Initializing...');
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Computed Values
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const hasActiveSubscription = subscription?.has_active_subscription || false;
  const tierLevel = subscription?.tier_level || 'basic';
  const isActive = subscription?.status === 'active';
  const expiryDate = subscription?.expiry_date;
  const daysRemaining = subscription?.days_remaining || 0;
  const autoRenew = subscription?.auto_renew || false;
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Return
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return {
    // Raw Data
    subscription,
    
    // States
    loading,
    error,
    
    // Methods
    refresh: checkSubscriptionStatus,
    
    // Computed
    hasActiveSubscription,
    tierLevel,
    isActive,
    expiryDate,
    daysRemaining,
    autoRenew,
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 Export Summary
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Return Values:
 * 
 * 📊 Raw Data:
 * - subscription: 전체 구독 데이터 (null if no subscription)
 * 
 * 🔄 States:
 * - loading: 로딩 중 여부
 * - error: 에러 메시지 (null if no error)
 * 
 * 🔧 Methods:
 * - refresh(): 구독 상태 강제 refresh
 * 
 * 💎 Computed:
 * - hasActiveSubscription: 활성 구독 여부 (boolean)
 * - tierLevel: 현재 티어 ('basic', 'premium', 'ultimate')
 * - isActive: 활성 상태 여부 (boolean)
 * - expiryDate: 만료일 (ISO string or null)
 * - daysRemaining: 남은 일수 (number)
 * - autoRenew: 자동 갱신 설정 (boolean)
 * 
 * 💙 Philosophy:
 * "천천히, 정확하게, 완벽하게"
 * 
 * Author: Hero NEXUS & JK
 * Date: 2026-01-18
 */

export default useSubscriptionStatus;
