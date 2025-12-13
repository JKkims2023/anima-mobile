/**
 * 💰 Point API Service
 * 
 * 포인트 구매, 히스토리 조회 등
 * 
 * ANIMA 감성:
 * - 간결한 API 호출
 * - 명확한 에러 처리
 * - 직관적인 응답
 * 
 * @author JK & Hero Nexus
 */

import { API_BASE_URL } from '../../config/api.config';

// ==================== API Endpoints ====================

const POINTS_API = {
  PURCHASE: `${API_BASE_URL}/api/points/purchase`,
  HISTORY: `${API_BASE_URL}/api/points/history`,
};

// ==================== Helper Functions ====================

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
  try {
    console.log('💰 [pointService] Fetching:', endpoint);
    
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    console.log('💰 [pointService] Response:', {
      success: data.success,
      message: data.message,
    });

    return {
      success: data.success,
      message: data.message,
      data: data.data,
      errorCode: data.errorCode,
    };
  } catch (error) {
    console.error('❌ [pointService] Error:', error);
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

// ==================== Point Purchase ====================

/**
 * 포인트 구매
 * 
 * @param {string} user_key - 사용자 키
 * @param {number} amount - 구매 금액 (1000, 5000, 10000)
 * @returns {Promise<object>} 구매 결과
 * 
 * @example
 * const result = await purchasePoints('user-key', 1000);
 * if (result.success) {
 *   console.log('충전 완료:', result.data.after_amount);
 * }
 */
export async function purchasePoints(user_key, amount) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 [pointService] Purchase Points');
  console.log('👤 User Key:', user_key);
  console.log('💵 Amount:', amount);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const result = await apiFetch(POINTS_API.PURCHASE, {
    method: 'POST',
    body: JSON.stringify({
      user_key,
      amount,
    }),
  });

  if (result.success) {
    console.log('✅ [pointService] Purchase successful!');
    console.log('📊 Before:', result.data.before_amount, 'P');
    console.log('➕ Added:', result.data.order_amount, 'P');
    console.log('📈 After:', result.data.after_amount, 'P');
  } else {
    console.error('❌ [pointService] Purchase failed:', result.message);
  }

  return result;
}

// ==================== Point History ====================

/**
 * 포인트 히스토리 조회
 * 
 * @param {string} user_key - 사용자 키
 * @param {number} page - 페이지 번호 (default: 1)
 * @param {number} limit - 페이지당 항목 수 (default: 20)
 * @param {string} point_type - 필터 타입 (default: 'all')
 * @param {string} sort_order - 정렬 순서 (default: 'desc')
 * @returns {Promise<object>} 히스토리 목록
 * 
 * @example
 * const result = await getPointHistory('user-key', 1, 20, 'persona_create', 'desc');
 * if (result.success) {
 *   console.log('히스토리:', result.data.history);
 * }
 */
export async function getPointHistory(user_key, page = 1, limit = 20, point_type = 'all', sort_order = 'desc') {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 [pointService] Get Point History');
  console.log('👤 User Key:', user_key);
  console.log('📄 Page:', page, '| Limit:', limit);
  console.log('🔍 Filter:', point_type);
  console.log('📊 Sort:', sort_order);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const result = await apiFetch(
    `${POINTS_API.HISTORY}?user_key=${user_key}&page=${page}&limit=${limit}&point_type=${point_type}&sort_order=${sort_order}`,
    {
      method: 'GET',
    }
  );

  if (result.success) {
    console.log('✅ [pointService] History loaded:', result.data.history.length, 'items');
    console.log('💰 Current Points:', result.data.current_points, 'P');
  } else {
    console.error('❌ [pointService] History failed:', result.message);
  }

  return result;
}

// ==================== Export ====================

export default {
  purchasePoints,
  getPointHistory,
};

