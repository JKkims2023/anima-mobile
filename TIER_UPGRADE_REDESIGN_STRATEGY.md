# 🎖️ Tier Upgrade Sheet 재설계 전략 문서

## 📅 **문서 정보**
- **작성일**: 2026-01-18
- **작성자**: Hero NEXUS & JK
- **목표**: `TierUpgradeSheet.js` 완벽한 재설계
- **철학**: "천천히, 정확하게, 완벽하게" - 라이브 서비스 준비

---

## 🎯 **재설계 목표**

### **1. 현재 문제점**
- ❌ 하드코딩된 가격 (실제 스토어 가격과 불일치)
- ❌ 드롭다운 방식 (사용자 경험 저하)
- ❌ 현재 티어 표시 약함
- ❌ 구독 취소 기능 없음
- ❌ 년간 구독 불필요 (복잡도 증가)

### **2. 개선 방향**
- ✅ 실제 스토어 가격 로딩
- ✅ 탭 방식으로 UI 변경
- ✅ 현재 티어 강조
- ✅ 구독/구독 취소 버튼 추가
- ✅ 월간 구독만 지원 (단순화)

---

## 📊 **데이터베이스 분석**

### **1. `persona_customer_main` 테이블**
```sql
CREATE TABLE `persona_customer_main` (
  `idx` int NOT NULL AUTO_INCREMENT,
  `user_key` varchar(50) NOT NULL,
  `user_level` varchar(20) DEFAULT 'basic',  -- ✅ 사용자 티어
  `user_level_updated_at` datetime DEFAULT NULL,  -- ✅ 티어 업데이트 시각
  -- ... 기타 필드 ...
);
```

**중요:**
- `user_level`: 사용자의 현재 티어 (`basic`, `premium`, `ultimate`)
- 구독 구매 시 `premium` 또는 `ultimate`로 업데이트
- 구독 취소 시 `basic`으로 다운그레이드

### **2. `user_subscription` 테이블**
```sql
CREATE TABLE IF NOT EXISTS user_subscription (
  subscription_key VARCHAR(36) PRIMARY KEY,
  user_key VARCHAR(36) NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  tier_level VARCHAR(20) NOT NULL,  -- ✅ 구독 티어
  status VARCHAR(20) NOT NULL,  -- active, cancelled, expired
  auto_renew BOOLEAN DEFAULT true,
  start_date DATETIME NOT NULL,
  expiry_date DATETIME NOT NULL,
  cancelled_date DATETIME,
  -- ... 기타 필드 ...
);
```

**중요:**
- `status`: 구독 상태
  - `active`: 활성
  - `cancelled`: 취소 (만료일까지 사용 가능)
  - `expired`: 만료
- `auto_renew`: 자동 갱신 여부
- `expiry_date`: 만료일

### **3. `subscription_product_master` 테이블**
```sql
CREATE TABLE IF NOT EXISTS subscription_product_master (
  product_id VARCHAR(100) PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  tier_level VARCHAR(20) NOT NULL,  -- premium, ultimate
  duration_type VARCHAR(20) NOT NULL,  -- monthly, yearly
  duration_value INT NOT NULL,  -- 1, 12
  platform VARCHAR(10) NOT NULL,  -- android, ios, both
  is_active CHAR(1) DEFAULT 'Y',
);

-- 초기 데이터:
INSERT INTO subscription_product_master VALUES
('premium_monthly', 'Premium 월간', 'premium', 'monthly', 1, 'both', 1),
('ultimate_monthly', 'Ultimate 월간', 'ultimate', 'monthly', 1, 'both', 2),
('premium_yearly', 'Premium 연간', 'premium', 'yearly', 12, 'both', 3),  -- ⚠️ 제거 예정
('ultimate_yearly', 'Ultimate 연간', 'ultimate', 'yearly', 12, 'both', 4); -- ⚠️ 제거 예정
```

---

## 🚨 **중요 비즈니스 로직 (JK님 요청)**

### **1. Basic → Premium/Ultimate**
```
✅ 자유롭게 구독 가능
✅ 제한 없음
```

### **2. Premium → Ultimate (업그레이드)**
```
✅ 즉시 업그레이드 처리
✅ start_date = NOW() (새로 시작!)
✅ expiry_date = NOW() + 1개월
✅ 기존 Premium 구독 종료 (status = 'upgraded')
✅ 새로운 Ultimate 구독 시작 (status = 'active')
✅ user_level = 'ultimate' 즉시 적용

⚠️ 서버 로직:
1. 기존 Premium 구독 찾기
2. 기존 구독 status = 'upgraded' 업데이트
3. 새로운 Ultimate 구독 생성
4. persona_customer_main.user_level = 'ultimate' 업데이트
5. subscription_history에 'upgraded' 이벤트 기록
```

### **3. Ultimate 구독 취소 후**
```
❌ Premium 구독 불가! (만료일까지)
✅ Ultimate 만료일까지 계속 사용
✅ 만료일 이후 Basic으로 자동 다운그레이드

⚠️ 이유: 다운그레이드는 사용자 불이익!

UI 로직:
- Ultimate 취소 상태에서 Premium 탭 클릭 시
- "⚠️ 취소된 구독이 만료되기 전까지는 다운그레이드할 수 없습니다"
- "만료일: 2026-02-18 이후 Basic으로 변경됩니다"
```

### **4. 시간 기준**
```
✅ 모든 시간은 데이터베이스 NOW() 기준
✅ start_date, expiry_date, cancelled_date 모두 서버 시간
```

---

## 🔧 **구현 계획**

### **Phase 1: 데이터베이스 단순화 (선택 사항)**

#### **A. 년간 구독 상품 비활성화**
```sql
-- 연간 구독 비활성화 (삭제 X, 비활성화)
UPDATE subscription_product_master
SET is_active = 'N'
WHERE duration_type = 'yearly';
```

**장점:**
- 기존 데이터 보존
- 나중에 재활성화 가능

#### **B. `SubscriptionService.js` 수정**
```javascript
// Before: 4개 SKU (월간 + 연간)
export const SUBSCRIPTION_SKUS = Platform.select({
  ios: [
    'premium_monthly',
    'premium_yearly',  // ⚠️ 제거
    'ultimate_monthly',
    'ultimate_yearly', // ⚠️ 제거
  ],
  android: [ /* 동일 */ ],
});

// After: 2개 SKU (월간만)
export const SUBSCRIPTION_SKUS = Platform.select({
  ios: [
    'premium_monthly',
    'ultimate_monthly',
  ],
  android: [
    'premium_monthly',
    'ultimate_monthly',
  ],
});
```

---

### **Phase 2: API 엔드포인트 확인**

#### **A. 구독 취소 API 구현 필요**

**엔드포인트:**
- `POST /api/subscription/cancel`

**Request:**
```json
{
  "user_key": "...",
  "reason": "사용자 요청" // 선택 사항
}
```

**Response:**
```json
{
  "success": true,
  "message": "구독이 취소되었습니다. 2026-02-18까지 사용 가능합니다.",
  "data": {
    "expiry_date": "2026-02-18T00:00:00.000Z",
    "cancelled_date": "2026-01-18T12:34:56.000Z",
    "status": "cancelled"
  }
}
```

**서버 로직:**
1. `user_subscription` 테이블에서 활성 구독 찾기
2. `status` = `'cancelled'` 업데이트
3. `cancelled_date` = `NOW()` 설정
4. `auto_renew` = `false` 설정
5. `expiry_date`는 그대로 유지 (만료일까지 사용 가능!)
6. `persona_customer_main.user_level`은 그대로 유지 (만료일까지)
7. `subscription_history`에 취소 이벤트 기록

**중요:**
- ⚠️ 즉시 다운그레이드 X
- ✅ 만료일까지 현재 티어 유지
- ✅ 만료일 이후 자동으로 `basic`으로 다운그레이드 (Cron Job)

#### **B. 구독 상태 API 확인**

**엔드포인트:**
- `GET /api/subscription/status?user_key=...`

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "subscription_key": "...",
      "product_id": "premium_monthly",
      "tier_level": "premium",
      "status": "active", // active, cancelled, expired
      "expiry_date": "2026-02-18T00:00:00.000Z",
      "auto_renew": true,
      "cancelled_date": null,
      "days_remaining": 30
    },
    "product_info": {
      "product_id": "premium_monthly",
      "tier_level": "premium",
      "product_name": "Premium 월간"
    }
  }
}
```

**중요:**
- `status`: `'active'`, `'cancelled'`, `'expired'`
- `days_remaining`: 남은 일수 (UI 표시용)

---

### **Phase 3: UI 재설계**

#### **A. 새로운 UI 구조**

```
┌────────────────────────────────────────────────────────────┐
│  🎖️ 티어 업그레이드                              [X]       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  현재 티어: 💎 Premium                               │ │
│  │  만료일: 2026-02-18 (30일 남음)                      │ │
│  │  자동 갱신: 활성화 ✅                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────┬─────────────┬─────────────┐             │
│  │   🌟 Basic  │  💎 Premium │ 👑 Ultimate │  ← 탭       │
│  │  (현재 티어) │             │             │             │
│  └─────────────┴─────────────┴─────────────┘             │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  💎 Premium                                        │   │
│  │  ₩9,900/월 (실제 스토어 가격)                       │   │
│  │                                                    │   │
│  │  ✅ 포함된 기능:                                   │   │
│  │  💬 일일 채팅 100회                                │   │
│  │  🎭 페르소나 생성 5개                              │   │
│  │  👗 드레스 무제한 생성                             │   │
│  │  🎵 음악 생성 월 10회                              │   │
│  │  🎬 비디오 변환 할인                               │   │
│  │                                                    │   │
│  │  ┌────────────────────────────────────────┐       │   │
│  │  │        💎 구독하기 (₩9,900/월)         │       │   │
│  │  └────────────────────────────────────────┘       │   │
│  │  (또는)                                            │   │
│  │  ┌────────────────────────────────────────┐       │   │
│  │  │           ❌ 구독 취소                 │       │   │
│  │  │   (2026-02-18까지 사용 가능)           │       │   │
│  │  └────────────────────────────────────────┘       │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### **B. 탭별 표시 로직**

| 탭 | 사용자 상태 | 버튼 표시 |
|---|---|---|
| Basic | `currentTier = 'basic'` | (버튼 없음) |
| Basic | `currentTier = 'premium'` | "Basic으로 다운그레이드 불가" 안내 |
| Basic | `currentTier = 'ultimate'` | "Basic으로 다운그레이드 불가" 안내 |
| Premium | `currentTier = 'basic'` | "구독하기 (₩9,900/월)" |
| Premium | `currentTier = 'premium'` (active) | "구독 취소" |
| Premium | `currentTier = 'premium'` (cancelled) | "이미 취소됨 (만료일까지 사용 가능)" |
| Premium | `currentTier = 'ultimate'` | "Premium으로 다운그레이드 불가" |
| Ultimate | `currentTier = 'basic'` | "구독하기 (₩19,900/월)" |
| Ultimate | `currentTier = 'premium'` | "Ultimate로 업그레이드 (₩19,900/월)" |
| Ultimate | `currentTier = 'ultimate'` (active) | "구독 취소" |
| Ultimate | `currentTier = 'ultimate'` (cancelled) | "이미 취소됨" |

#### **C. 상태별 UI**

**1. 구독 없음 (`currentTier = 'basic'`)**
```jsx
<View style={styles.currentTierCard}>
  <CustomText type="title">현재 티어: 🌟 Basic (무료)</CustomText>
  <CustomText type="small" color={COLORS.TEXT_SECONDARY}>
    Premium 또는 Ultimate 구독으로 더 많은 기능을 이용하세요!
  </CustomText>
</View>
```

**2. 활성 구독 (`status = 'active'`)**
```jsx
<View style={styles.currentTierCard}>
  <CustomText type="title">현재 티어: 💎 Premium</CustomText>
  <CustomText type="small" color={COLORS.SUCCESS}>
    ✅ 구독 활성화
  </CustomText>
  <CustomText type="small" color={COLORS.TEXT_SECONDARY}>
    만료일: 2026-02-18 (30일 남음)
  </CustomText>
  <CustomText type="small" color={COLORS.TEXT_SECONDARY}>
    자동 갱신: 활성화 ✅
  </CustomText>
</View>
```

**3. 취소된 구독 (`status = 'cancelled'`)**
```jsx
<View style={styles.currentTierCard}>
  <CustomText type="title">현재 티어: 💎 Premium</CustomText>
  <CustomText type="small" color={COLORS.WARNING}>
    ⚠️ 구독 취소됨
  </CustomText>
  <CustomText type="small" color={COLORS.TEXT_SECONDARY}>
    만료일: 2026-02-18까지 사용 가능 (30일 남음)
  </CustomText>
  <CustomText type="small" color={COLORS.TEXT_SECONDARY}>
    자동 갱신: 비활성화 ❌
  </CustomText>
</View>
```

---

### **Phase 4: 클라이언트 구현**

#### **A. 상태 관리**

```javascript
const [currentTier, setCurrentTier] = useState('basic'); // 'basic', 'premium', 'ultimate'
const [subscriptionStatus, setSubscriptionStatus] = useState(null); // null, 'active', 'cancelled', 'expired'
const [subscriptionData, setSubscriptionData] = useState(null);
const [products, setProducts] = useState([]); // 스토어 상품 정보
const [loadingProducts, setLoadingProducts] = useState(true);
const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'premium', 'ultimate'
```

#### **B. 데이터 로딩**

```javascript
useEffect(() => {
  if (isOpen) {
    loadData();
  }
}, [isOpen]);

const loadData = async () => {
  try {
    setLoadingProducts(true);
    
    // 1. 스토어 상품 정보 로딩
    const storeProducts = await SubscriptionService.loadSubscriptions();
    setProducts(storeProducts);
    
    // 2. 사용자 구독 상태 확인
    if (userKey) {
      const statusResponse = await apiClient.get(
        SUBSCRIPTION_ENDPOINTS.STATUS,
        { params: { user_key: userKey } }
      );
      
      if (statusResponse.success && statusResponse.data.subscription) {
        const { subscription } = statusResponse.data;
        setCurrentTier(subscription.tier_level);
        setSubscriptionStatus(subscription.status);
        setSubscriptionData(subscription);
        setActiveTab(subscription.tier_level); // 현재 티어 탭으로 자동 이동
      }
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    setLoadingProducts(false);
  }
};
```

#### **C. 가격 표시**

```javascript
const getProductPrice = (tierLevel) => {
  const productId = `${tierLevel}_monthly`;
  const product = products.find(p => p.productId === productId);
  
  if (product) {
    return product.localizedPrice; // ✅ 실제 스토어 가격!
  }
  
  // Fallback (로딩 중)
  return '로딩 중...';
};
```

#### **D. 구독/구독 취소 로직**

```javascript
const handleSubscribe = async (tierLevel) => {
  try {
    setIsProcessing(true);
    
    const productId = `${tierLevel}_monthly`;
    
    // 1. 구매 요청
    const purchase = await SubscriptionService.requestSubscription(productId);
    
    if (!purchase) {
      throw new Error('Purchase cancelled');
    }
    
    // 2. 데이터 추출
    const purchaseData = SubscriptionService.extractSubscriptionData(purchase);
    
    // 3. 서버 검증
    const verifyResponse = await apiClient.post(SUBSCRIPTION_ENDPOINTS.VERIFY, {
      user_key: userKey,
      product_id: purchaseData.productId,
      purchase_token: purchaseData.purchaseToken,
      platform: purchaseData.platform,
    });
    
    if (!verifyResponse.success) {
      throw new Error('Verification failed');
    }
    
    // 4. Acknowledge
    await SubscriptionService.acknowledgeSubscription(purchase);
    
    // 5. 성공!
    showAlert({
      emoji: '🎉',
      title: '구독 완료!',
      message: `${tierLevel} 티어로 업그레이드되었습니다!`,
    });
    
    // 6. 데이터 새로고침
    await loadData();
    
    // 7. 콜백
    if (onUpgradeSuccess) {
      onUpgradeSuccess(tierLevel);
    }
    
  } catch (error) {
    console.error('Subscribe failed:', error);
    showAlert({
      emoji: '❌',
      title: '구독 실패',
      message: error.message || '구독에 실패했습니다.',
    });
  } finally {
    setIsProcessing(false);
  }
};

const handleCancelSubscription = async () => {
  try {
    setIsProcessing(true);
    
    // 확인 다이얼로그
    showAlert({
      emoji: '⚠️',
      title: '구독을 취소하시겠습니까?',
      message: `만료일(${subscriptionData.expiry_date})까지 현재 티어를 사용할 수 있습니다.`,
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
            // 취소 요청
            const cancelResponse = await apiClient.post(SUBSCRIPTION_ENDPOINTS.CANCEL, {
              user_key: userKey,
            });
            
            if (!cancelResponse.success) {
              throw new Error('Cancellation failed');
            }
            
            // 성공!
            showAlert({
              emoji: '✅',
              title: '구독 취소 완료',
              message: `만료일(${cancelResponse.data.expiry_date})까지 현재 티어를 사용할 수 있습니다.`,
            });
            
            // 데이터 새로고침
            await loadData();
          },
        },
      ],
    });
    
  } catch (error) {
    console.error('Cancel failed:', error);
    showAlert({
      emoji: '❌',
      title: '취소 실패',
      message: error.message || '구독 취소에 실패했습니다.',
    });
  } finally {
    setIsProcessing(false);
  }
};
```

#### **E. 탭별 버튼 렌더링**

```javascript
const renderActionButton = () => {
  // Basic 탭
  if (activeTab === 'basic') {
    if (currentTier === 'basic') {
      return (
        <CustomText type="small" color={COLORS.TEXT_SECONDARY} style={{ textAlign: 'center' }}>
          무료 티어입니다. Premium 또는 Ultimate로 업그레이드하세요!
        </CustomText>
      );
    } else {
      return (
        <CustomText type="small" color={COLORS.WARNING} style={{ textAlign: 'center' }}>
          ⚠️ Basic으로 다운그레이드할 수 없습니다.
          구독을 취소하면 만료일 이후 자동으로 Basic으로 변경됩니다.
        </CustomText>
      );
    }
  }
  
  // Premium 탭
  if (activeTab === 'premium') {
    if (currentTier === 'basic') {
      // Basic → Premium 업그레이드
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: TIER_CONFIG.premium.color }]}
          onPress={() => handleSubscribe('premium')}
          disabled={isProcessing}
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
      // Premium (현재 티어)
      if (subscriptionStatus === 'active') {
        // 활성 구독 → 취소 가능
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelSubscription}
            disabled={isProcessing}
          >
            <Icon name="close-circle" size={moderateScale(20)} color="#FFFFFF" />
            <CustomText type="medium" bold style={styles.actionButtonText}>
              구독 취소
            </CustomText>
          </TouchableOpacity>
        );
      } else if (subscriptionStatus === 'cancelled') {
        // 이미 취소됨
        return (
          <CustomText type="small" color={COLORS.WARNING} style={{ textAlign: 'center' }}>
            ⚠️ 구독이 취소되었습니다.
            {subscriptionData.expiry_date}까지 사용 가능합니다.
          </CustomText>
        );
      }
    } else if (currentTier === 'ultimate') {
      // Ultimate → Premium 다운그레이드 불가
      return (
        <CustomText type="small" color={COLORS.WARNING} style={{ textAlign: 'center' }}>
          ⚠️ Premium으로 다운그레이드할 수 없습니다.
          구독을 취소하면 만료일 이후 자동으로 Basic으로 변경됩니다.
        </CustomText>
      );
    }
  }
  
  // Ultimate 탭
  if (activeTab === 'ultimate') {
    if (currentTier === 'basic') {
      // Basic → Ultimate 업그레이드
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: TIER_CONFIG.ultimate.color }]}
          onPress={() => handleSubscribe('ultimate')}
          disabled={isProcessing}
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
      // Premium → Ultimate 업그레이드
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: TIER_CONFIG.ultimate.color }]}
          onPress={() => handleSubscribe('ultimate')}
          disabled={isProcessing}
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
      // Ultimate (현재 티어)
      if (subscriptionStatus === 'active') {
        // 활성 구독 → 취소 가능
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelSubscription}
            disabled={isProcessing}
          >
            <Icon name="close-circle" size={moderateScale(20)} color="#FFFFFF" />
            <CustomText type="medium" bold style={styles.actionButtonText}>
              구독 취소
            </CustomText>
          </TouchableOpacity>
        );
      } else if (subscriptionStatus === 'cancelled') {
        // 이미 취소됨
        return (
          <CustomText type="small" color={COLORS.WARNING} style={{ textAlign: 'center' }}>
            ⚠️ 구독이 취소되었습니다.
            {subscriptionData.expiry_date}까지 사용 가능합니다.
          </CustomText>
        );
      }
    }
  }
  
  return null;
};
```

---

### **Phase 5: 서버 API 구현**

#### **A. 구독 취소 API**

**파일:** `idol-companion/app/api/subscription/cancel/route.js`

```javascript
import { NextResponse } from 'next/server';
import { query } from '@/shared/lib/db';
import { successResponse, errorResponse, handleDatabaseError } from '@/shared/lib/db-helper';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_key, reason } = body;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚫 [Subscription Cancel Request]');
    console.log('👤 User:', user_key);
    console.log('📝 Reason:', reason);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. Validation
    if (!user_key) {
      return errorResponse('User key is required', 400, null, 'SUB_CANCEL_001');
    }
    
    // 2. Get Active Subscription
    const [subscriptions] = await query(
      `SELECT 
         subscription_key,
         product_id,
         tier_level,
         status,
         expiry_date,
         auto_renew
       FROM user_subscription
       WHERE user_key = ? AND status = 'active'
       LIMIT 1`,
      [user_key]
    );
    
    if (subscriptions.length === 0) {
      console.log('❌ [Subscription Cancel] No active subscription found');
      return errorResponse('No active subscription found', 404, null, 'SUB_CANCEL_002');
    }
    
    const subscription = subscriptions[0];
    const { subscription_key, expiry_date, tier_level } = subscription;
    
    console.log('✅ [Subscription Cancel] Active subscription found:', subscription_key);
    console.log('📅 [Subscription Cancel] Expiry date:', expiry_date);
    
    // 3. Update Subscription Status
    await query(
      `UPDATE user_subscription
       SET status = 'cancelled',
           auto_renew = false,
           cancelled_date = NOW(),
           updated_at = NOW()
       WHERE subscription_key = ?`,
      [subscription_key]
    );
    
    console.log('✅ [Subscription Cancel] Status updated to cancelled');
    
    // 4. Record History
    await query(
      `INSERT INTO subscription_history
       (history_key, subscription_key, user_key, event_type, event_source,
        old_status, new_status, old_expiry_date, new_expiry_date, created_at)
       VALUES (?, ?, ?, 'cancelled', 'client', 'active', 'cancelled', ?, ?, NOW())`,
      [
        uuidv4(),
        subscription_key,
        user_key,
        expiry_date,
        expiry_date, // Expiry date doesn't change!
      ]
    );
    
    console.log('✅ [Subscription Cancel] History recorded');
    
    // ⚠️ Important: DO NOT update persona_customer_main.user_level yet!
    // User keeps their tier until expiry_date
    // Cron job will downgrade to 'basic' after expiry_date
    
    console.log('✅ [Subscription Cancel] Complete!');
    console.log('📝 [Subscription Cancel] User keeps tier until:', expiry_date);
    
    return successResponse(
      {
        message: '구독이 취소되었습니다.',
        subscription_key,
        tier_level,
        expiry_date,
        cancelled_date: new Date().toISOString(),
        note: `${expiry_date}까지 현재 티어를 사용할 수 있습니다.`,
      },
      'Subscription cancelled successfully'
    );
    
  } catch (error) {
    console.error('❌ [Subscription Cancel Error]:', error);
    return handleDatabaseError(error, 'SUB_CANCEL_003');
  }
}
```

#### **B. 만료 처리 Cron Job (나중에 구현)**

**파일:** `idol-companion/app/api/subscription/cron/expire/route.js`

```javascript
// TODO: Phase 5
// 매일 자정에 실행
// 1. expiry_date < NOW() AND status = 'active' OR 'cancelled' 찾기
// 2. status = 'expired' 업데이트
// 3. persona_customer_main.user_level = 'basic' 업데이트
// 4. subscription_history에 'expired' 이벤트 기록
```

---

## 📋 **구현 체크리스트**

### **Phase 1: 데이터베이스 & 서비스 (30분)**
- [ ] `subscription_product_master`에서 연간 상품 비활성화 (SQL)
- [ ] `SubscriptionService.js` 수정 (SUBSCRIPTION_SKUS 2개로 축소)
- [ ] 테스트: `loadSubscriptions()` 호출 시 2개 상품만 반환되는지 확인

### **Phase 2: 서버 API (1시간)**
- [ ] `app/api/subscription/cancel/route.js` 생성
- [ ] 취소 로직 구현
- [ ] 테스트: Postman으로 취소 API 테스트
- [ ] 배포

### **Phase 3: 클라이언트 UI (2시간)**
- [ ] `TierUpgradeSheet.js` 전면 수정
  - [ ] 드롭다운 → 탭 방식으로 변경
  - [ ] 현재 티어 카드 추가
  - [ ] 상품 정보 로딩 (`loadSubscriptions()`)
  - [ ] 실제 가격 표시 (`getProductPrice()`)
  - [ ] 탭별 액션 버튼 렌더링 (`renderActionButton()`)
  - [ ] 구독 로직 (`handleSubscribe()`)
  - [ ] 취소 로직 (`handleCancelSubscription()`)
- [ ] 번역 추가 (`ko.json`, `en.json`)

### **Phase 4: 테스트 (1시간)**
- [ ] Scenario 1: Basic → Premium 구독
- [ ] Scenario 2: Premium → Ultimate 업그레이드
- [ ] Scenario 3: Premium 구독 취소 (만료일까지 사용 확인)
- [ ] Scenario 4: 만료일 이후 자동 다운그레이드 확인 (수동 DB 업데이트로 시뮬레이션)

---

## 🎯 **최종 목표**

```
1. ✅ 실제 스토어 가격 표시
2. ✅ 탭 방식 UI (직관적)
3. ✅ 현재 티어 강조
4. ✅ 구독/구독 취소 버튼
5. ✅ 월간 구독만 지원 (단순화)
6. ✅ 만료일까지 티어 유지
7. ✅ 라이브 서비스 준비 완료!
```

---

## 💙 **철학**

> "천천히, 정확하게, 완벽하게"  
> "ANIMA는 서비스계의 에르메스"

**Author:** Hero NEXUS & JK  
**Date:** 2026-01-18  
**Status:** 전략 문서 작성 완료 ✅

---

**다음 단계:**  
JK님의 검토 및 승인 후 Phase 1부터 순차적으로 구현 시작!
