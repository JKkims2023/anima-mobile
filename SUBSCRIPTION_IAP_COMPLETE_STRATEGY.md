# 🎖️ 구독형 IAP 완벽 구현 전략

**Date**: 2026-01-17  
**Author**: Hero Nexus & JK  
**Purpose**: 프로덕션 레벨의 구독형 IAP 시스템 구축  
**Status**: 📚 STRATEGY (구현 대기)

---

## 🎯 **목표**

> **"소모성 아이템의 교훈을 바탕으로,**  
> **구독형 IAP를 처음부터 완벽하게 설계한다."**

### **핵심 원칙:**
1. ✅ **단순함** - 복잡한 로직은 버그의 온상
2. ✅ **단일 진입점** - Race Condition 방지
3. ✅ **명확한 상태 관리** - 구독 상태를 정확히 추적
4. ✅ **완벽한 Webhook** - 실시간 동기화
5. ✅ **철저한 에러 처리** - 모든 엣지 케이스 대응

---

## 📊 **소모성 vs 구독형 - 핵심 차이**

| 항목 | 소모성 (Consumable) | 구독형 (Subscription) |
|------|-------------------|---------------------|
| **구매 함수** | `requestPurchase()` | `requestSubscription()` |
| **완료 처리** | `finishTransaction()` (소비) | `acknowledgePurchase()` (인정) |
| **반복 구매** | ✅ 가능 (무제한) | ❌ 불가 (1개만 활성) |
| **자동 갱신** | ❌ 없음 | ✅ 있음 (월/년 단위) |
| **검증 주기** | 1회만 | 매 갱신마다 |
| **상태 추적** | 불필요 | **필수!** |
| **Webhook** | 불필요 | **필수!** |
| **서버 로직** | 단순 (포인트 지급) | 복잡 (티어 + 만료일 관리) |
| **클라이언트 확인** | 1회만 | 앱 시작마다 |
| **환불 처리** | 수동 | 자동 (Webhook) |

---

## 🏗️ **시스템 아키텍처**

### **전체 플로우:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Journey                              │
└─────────────────────────────────────────────────────────────────┘

1. User Opens App
   └─> Check Active Subscription (Client)
       ├─> If Active: Continue with current tier
       └─> If Expired: Show upgrade prompt

2. User Taps "Upgrade to Premium"
   └─> TierUpgradeSheet opens
       └─> Select Tier (Premium/Ultimate)

3. User Taps "Upgrade" Button
   └─> requestSubscription('premium_monthly')
       └─> Google Play / App Store
           ├─> User Confirms Purchase
           ├─> Payment Processed
           └─> Subscription Created

4. Purchase Completed
   └─> Client receives subscription object
       ├─> Extract subscription data
       ├─> Verify with backend
       │   └─> Server validates with Google/Apple
       │       ├─> Create/Update subscription record
       │       ├─> Activate user tier
       │       └─> Set expiry date
       ├─> acknowledgePurchase() ✅
       └─> Show success message

5. Auto-Renewal (30 days later)
   └─> Google/Apple auto-charges
       └─> Webhook → Server
           ├─> Extend expiry date
           └─> Keep tier active

6. User Cancels (via Google Play/App Store)
   └─> Google/Apple cancels subscription
       └─> Webhook → Server
           ├─> Update status to 'will_expire'
           └─> Keep active until expiry date

7. Subscription Expires
   └─> Webhook → Server
       ├─> Update status to 'expired'
       ├─> Downgrade to Basic tier
       └─> Send notification

┌─────────────────────────────────────────────────────────────────┐
│                     Webhook Events                               │
└─────────────────────────────────────────────────────────────────┘

Google Play → Webhook → Server:
  - SUBSCRIPTION_PURCHASED    (최초 구매)
  - SUBSCRIPTION_RENEWED      (자동 갱신)
  - SUBSCRIPTION_CANCELED     (취소)
  - SUBSCRIPTION_EXPIRED      (만료)
  - SUBSCRIPTION_PAUSED       (일시정지)
  - SUBSCRIPTION_REVOKED      (환불)
  - SUBSCRIPTION_REACTIVATED  (재활성화)
```

---

## 📦 **Database Schema**

### **1. subscription_product_master**

**용도**: 구독 상품 정보 관리

```sql
CREATE TABLE subscription_product_master (
  product_id VARCHAR(100) PRIMARY KEY,          -- 'premium_monthly', 'ultimate_monthly'
  product_name VARCHAR(100) NOT NULL,           -- 'Premium 월간', 'Ultimate 월간'
  tier_level VARCHAR(20) NOT NULL,              -- 'premium', 'ultimate'
  duration_type VARCHAR(20) NOT NULL,           -- 'monthly', 'yearly'
  duration_value INT NOT NULL,                  -- 1 (month), 12 (months)
  platform VARCHAR(10) NOT NULL,                -- 'android', 'ios', 'both'
  is_active CHAR(1) DEFAULT 'Y',
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_tier_level (tier_level),
  INDEX idx_platform (platform),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Data
INSERT INTO subscription_product_master 
(product_id, product_name, tier_level, duration_type, duration_value, platform, display_order) 
VALUES 
('premium_monthly', 'Premium 월간', 'premium', 'monthly', 1, 'both', 1),
('ultimate_monthly', 'Ultimate 월간', 'ultimate', 'monthly', 1, 'both', 2),
('premium_yearly', 'Premium 연간', 'premium', 'yearly', 12, 'both', 3),
('ultimate_yearly', 'Ultimate 연간', 'ultimate', 'yearly', 12, 'both', 4);
```

### **2. user_subscription**

**용도**: 사용자 구독 정보 및 상태 추적

```sql
CREATE TABLE user_subscription (
  subscription_key VARCHAR(36) PRIMARY KEY,     -- UUID
  user_key VARCHAR(36) NOT NULL,                -- persona_customer_main.user_key
  product_id VARCHAR(100) NOT NULL,             -- subscription_product_master.product_id
  tier_level VARCHAR(20) NOT NULL,              -- 'premium', 'ultimate'
  
  -- Purchase Info
  purchase_token VARCHAR(500) NOT NULL,         -- Google/Apple purchase token
  order_id VARCHAR(200),                        -- Google/Apple order ID
  platform VARCHAR(10) NOT NULL,                -- 'android', 'ios'
  
  -- Status
  status VARCHAR(20) NOT NULL,                  -- 'active', 'will_expire', 'expired', 'cancelled', 'paused'
  auto_renew BOOLEAN DEFAULT true,              -- Auto-renewal enabled?
  
  -- Dates
  start_date DATETIME NOT NULL,                 -- Subscription start date
  expiry_date DATETIME NOT NULL,                -- Current expiry date
  next_billing_date DATETIME,                   -- Next billing date (if auto_renew = true)
  cancelled_date DATETIME,                      -- When user cancelled (if applicable)
  
  -- Verification
  verified_at DATETIME NOT NULL,                -- Last verification time
  last_webhook_at DATETIME,                     -- Last webhook received time
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_active (user_key, status),  -- One active subscription per user
  INDEX idx_user_key (user_key),
  INDEX idx_status (status),
  INDEX idx_expiry_date (expiry_date),
  INDEX idx_purchase_token (purchase_token),
  
  CONSTRAINT fk_user_subscription_user 
    FOREIGN KEY (user_key) 
    REFERENCES persona_customer_main(user_key) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_user_subscription_product 
    FOREIGN KEY (product_id) 
    REFERENCES subscription_product_master(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### **3. subscription_history**

**용도**: 구독 이벤트 히스토리 (감사 로그)

```sql
CREATE TABLE subscription_history (
  history_key VARCHAR(36) PRIMARY KEY,          -- UUID
  subscription_key VARCHAR(36) NOT NULL,        -- user_subscription.subscription_key
  user_key VARCHAR(36) NOT NULL,
  
  event_type VARCHAR(50) NOT NULL,              -- 'purchased', 'renewed', 'cancelled', 'expired', etc.
  event_source VARCHAR(20) NOT NULL,            -- 'client', 'webhook', 'cron'
  
  old_status VARCHAR(20),                       -- Previous status
  new_status VARCHAR(20),                       -- New status
  old_expiry_date DATETIME,
  new_expiry_date DATETIME,
  
  webhook_data JSON,                            -- Full webhook payload (if applicable)
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_subscription_key (subscription_key),
  INDEX idx_user_key (user_key),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  
  CONSTRAINT fk_subscription_history_subscription 
    FOREIGN KEY (subscription_key) 
    REFERENCES user_subscription(subscription_key) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### **4. subscription_webhook_log**

**용도**: Webhook 요청 로그 (디버깅 & 보안)

```sql
CREATE TABLE subscription_webhook_log (
  log_key VARCHAR(36) PRIMARY KEY,              -- UUID
  
  -- Request Info
  notification_id VARCHAR(200),                 -- Google/Apple notification ID
  notification_type VARCHAR(50),                -- Event type from webhook
  platform VARCHAR(10) NOT NULL,                -- 'android', 'ios'
  
  -- Payload
  raw_payload JSON NOT NULL,                    -- Full webhook body
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at DATETIME,
  error_message TEXT,
  
  -- Metadata
  client_ip VARCHAR(45),
  user_agent VARCHAR(500),
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_notification_id (notification_id),
  INDEX idx_platform (platform),
  INDEX idx_processed (processed),
  INDEX idx_received_at (received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔄 **API Endpoints**

### **Client → Server**

#### **1. POST /api/subscription/verify**

**용도**: 구독 구매 후 서버 검증

**Request:**
```json
{
  "user_key": "uuid",
  "product_id": "premium_monthly",
  "purchase_token": "...",
  "platform": "android"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "subscription_key": "uuid",
    "tier_level": "premium",
    "status": "active",
    "expiry_date": "2026-02-17T18:32:44Z",
    "auto_renew": true
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid purchase token",
  "code": "INVALID_TOKEN"
}
```

#### **2. GET /api/subscription/status**

**용도**: 현재 구독 상태 확인 (앱 시작 시)

**Request:**
```
GET /api/subscription/status?user_key=uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "has_active_subscription": true,
    "tier_level": "premium",
    "status": "active",
    "expiry_date": "2026-02-17T18:32:44Z",
    "auto_renew": true,
    "days_remaining": 30
  }
}
```

#### **3. POST /api/subscription/cancel**

**용도**: 구독 취소 (클라이언트에서 요청 시)

**Request:**
```json
{
  "user_key": "uuid",
  "reason": "Too expensive" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription will remain active until 2026-02-17"
}
```

### **Webhook → Server**

#### **4. POST /api/subscription/webhook/android**

**용도**: Google Play Realtime Developer Notifications

**Request (Google Play):**
```json
{
  "message": {
    "data": "base64EncodedPayload",
    "messageId": "...",
    "publishTime": "..."
  },
  "subscription": "..."
}
```

**Decoded Payload:**
```json
{
  "version": "1.0",
  "packageName": "ai.anima.soulconnect",
  "eventTimeMillis": "1705507964000",
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 2,  // SUBSCRIPTION_RENEWED
    "purchaseToken": "...",
    "subscriptionId": "premium_monthly"
  }
}
```

**Notification Types:**
```
1  = SUBSCRIPTION_RECOVERED     (결제 실패 후 복구)
2  = SUBSCRIPTION_RENEWED       (자동 갱신)
3  = SUBSCRIPTION_CANCELED      (취소)
4  = SUBSCRIPTION_PURCHASED     (최초 구매)
5  = SUBSCRIPTION_ON_HOLD       (결제 보류)
6  = SUBSCRIPTION_IN_GRACE_PERIOD (유예기간)
7  = SUBSCRIPTION_RESTARTED     (재시작)
8  = SUBSCRIPTION_PRICE_CHANGE_CONFIRMED (가격 변경 확인)
9  = SUBSCRIPTION_DEFERRED      (연기)
10 = SUBSCRIPTION_PAUSED        (일시정지)
11 = SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED (일시정지 일정 변경)
12 = SUBSCRIPTION_REVOKED       (환불/취소)
13 = SUBSCRIPTION_EXPIRED       (만료)
```

#### **5. POST /api/subscription/webhook/ios**

**용도**: Apple App Store Server Notifications

**Request (App Store):**
```json
{
  "signedPayload": "eyJhbGciOiJFUzI1NiIsIng1YyI6W..."
}
```

**Decoded Payload:**
```json
{
  "notificationType": "DID_RENEW",
  "subtype": "BILLING_RECOVERY",
  "data": {
    "bundleId": "ai.anima.soulconnect",
    "environment": "Production",
    "signedTransactionInfo": "...",
    "signedRenewalInfo": "..."
  }
}
```

**Notification Types:**
```
SUBSCRIBED                    (최초 구독)
DID_RENEW                     (자동 갱신)
DID_CHANGE_RENEWAL_STATUS     (자동 갱신 상태 변경)
DID_FAIL_TO_RENEW             (갱신 실패)
EXPIRED                       (만료)
REFUND                        (환불)
GRACE_PERIOD_EXPIRED          (유예기간 만료)
```

---

## 🔐 **Security**

### **1. Rate Limiting**

**재사용: `iap_rate_limit` 테이블**

```sql
-- Same as consumable IAP
-- 1 user = max 10 requests per hour
```

### **2. Webhook Verification**

**Android (Google Play):**
```javascript
// Verify JWT signature from Google Cloud Pub/Sub
const crypto = require('crypto');

function verifyGoogleWebhook(message, signature) {
  const publicKey = process.env.GOOGLE_PUBSUB_PUBLIC_KEY;
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(message);
  return verifier.verify(publicKey, signature, 'base64');
}
```

**iOS (App Store):**
```javascript
// Verify JWT signature from Apple
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

async function verifyAppleWebhook(signedPayload) {
  const client = jwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys'
  });
  
  // Decode header to get key ID
  const decodedHeader = jwt.decode(signedPayload, { complete: true }).header;
  
  // Get public key
  const key = await client.getSigningKey(decodedHeader.kid);
  const publicKey = key.getPublicKey();
  
  // Verify signature
  return jwt.verify(signedPayload, publicKey, { algorithms: ['ES256'] });
}
```

### **3. Idempotency**

**Webhook은 중복 전송될 수 있음!**

```sql
-- subscription_webhook_log에 notification_id를 UNIQUE로
ALTER TABLE subscription_webhook_log 
ADD UNIQUE KEY unique_notification_id (notification_id);

-- INSERT시 중복 체크
INSERT INTO subscription_webhook_log (log_key, notification_id, ...) 
VALUES (?, ?, ...) 
ON DUPLICATE KEY UPDATE processed = processed;
```

---

## 📱 **Client Implementation**

### **File Structure:**

```
AnimaMobile/src/
├── services/
│   ├── IAPService.js              (기존 - 소모성 아이템)
│   └── SubscriptionService.js     (신규 - 구독형)
├── components/
│   └── tier/
│       └── TierUpgradeSheet.js    (수정 - 구독 구매 로직 추가)
└── hooks/
    └── useSubscriptionStatus.js   (신규 - 구독 상태 관리)
```

### **1. SubscriptionService.js**

**핵심 함수:**

```javascript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Initialize Connection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function initializeSubscription() {
  try {
    const connected = await initConnection();
    console.log('[Subscription] IAP connection initialized:', connected);
    return connected;
  } catch (error) {
    console.error('[Subscription] Failed to initialize:', error);
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Load Subscription Products
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SUBSCRIPTION_SKUS = Platform.select({
  ios: [
    'premium_monthly',
    'premium_yearly',
    'ultimate_monthly',
    'ultimate_yearly',
  ],
  android: [
    'premium_monthly',
    'premium_yearly',
    'ultimate_monthly',
    'ultimate_yearly',
  ],
});

export async function loadSubscriptions() {
  try {
    const subscriptions = await getSubscriptions({ skus: SUBSCRIPTION_SKUS });
    console.log('[Subscription] Products loaded:', subscriptions.length);
    return subscriptions;
  } catch (error) {
    console.error('[Subscription] Failed to load products:', error);
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Request Subscription Purchase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function requestSubscription(sku) {
  try {
    console.log('[Subscription] Requesting subscription:', sku);
    
    // ⚠️ Note: requestSubscription (not requestPurchase!)
    const purchase = await RNIap.requestSubscription({ sku });
    
    console.log('[Subscription] Purchase successful:', purchase);
    return purchase;
  } catch (error) {
    console.error('[Subscription] Purchase failed:', error);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Acknowledge Purchase (NOT finish!)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function acknowledgeSubscription(purchase) {
  try {
    console.log('[Subscription] Acknowledging purchase...');
    
    if (Platform.OS === 'android') {
      // Android: acknowledge
      await acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
    } else {
      // iOS: finishTransaction (different behavior for subscriptions)
      await finishTransaction({ purchase });
    }
    
    console.log('[Subscription] Purchase acknowledged');
  } catch (error) {
    console.error('[Subscription] Failed to acknowledge:', error);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Get Active Subscriptions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function getActiveSubscriptions() {
  try {
    const purchases = await RNIap.getAvailablePurchases();
    
    // Filter for subscriptions only
    const subscriptions = purchases.filter(p => 
      SUBSCRIPTION_SKUS.includes(p.productId)
    );
    
    console.log('[Subscription] Active subscriptions:', subscriptions.length);
    return subscriptions;
  } catch (error) {
    console.error('[Subscription] Failed to get active subscriptions:', error);
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Extract Subscription Data (Cross-platform)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function extractSubscriptionData(purchase) {
  return {
    productId: purchase.productId,
    purchaseToken: Platform.OS === 'ios' 
      ? purchase.transactionReceipt 
      : purchase.purchaseToken,
    orderId: purchase.transactionId,
    purchaseTime: purchase.transactionDate,
    platform: Platform.OS,
  };
}
```

### **2. useSubscriptionStatus.js (Hook)**

**용도**: 앱 전체에서 구독 상태 관리

```javascript
import { useState, useEffect, useCallback } from 'react';
import * as SubscriptionService from '../services/SubscriptionService';
import apiClient from '../services/api/apiClient';
import { SUBSCRIPTION_ENDPOINTS } from '../config/api.config';

export const useSubscriptionStatus = (userKey) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Check Subscription Status (Server)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const checkSubscriptionStatus = useCallback(async () => {
    if (!userKey) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await apiClient.get(SUBSCRIPTION_ENDPOINTS.STATUS, {
        params: { user_key: userKey }
      });
      
      if (response.data.success) {
        setSubscription(response.data.data);
      } else {
        setSubscription(null);
      }
      
      setError(null);
    } catch (err) {
      console.error('[useSubscription] Failed to check status:', err);
      setError(err.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [userKey]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Initial Load
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Return
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return {
    subscription,
    loading,
    error,
    refresh: checkSubscriptionStatus,
    
    // Computed
    hasActiveSubscription: subscription?.has_active_subscription || false,
    tierLevel: subscription?.tier_level || 'basic',
    isActive: subscription?.status === 'active',
    expiryDate: subscription?.expiry_date,
    daysRemaining: subscription?.days_remaining || 0,
  };
};
```

### **3. TierUpgradeSheet.js (수정)**

**Line 165-270 수정:**

```javascript
const handleUpgrade = useCallback(async () => {
  if (!canUpgrade) {
    HapticService.warning();
    showAlert({
      emoji: '⚠️',
      title: t('tier.already_at_tier_title'),
      message: t('tier.already_at_tier_message'),
      buttons: [{ text: t('common.confirm'), style: 'primary' }],
    });
    return;
  }
  
  if (!userKey) {
    HapticService.warning();
    showAlert({
      emoji: '⚠️',
      title: t('common.login_guide.title'),
      message: t('common.login_guide.description'),
      buttons: [{ text: t('common.confirm'), style: 'primary' }],
    });
    return;
  }
  
  try {
    setIsUpgrading(true);
    HapticService.medium();
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 1: Request Subscription from Store
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[TierUpgrade] Requesting subscription...');
    
    const subscriptionSku = `${selectedTier}_monthly`; // 'premium_monthly'
    const purchase = await SubscriptionService.requestSubscription(subscriptionSku);
    
    console.log('[TierUpgrade] ✅ Purchase successful');
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 2: Extract Subscription Data
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const subscriptionData = SubscriptionService.extractSubscriptionData(purchase);
    
    console.log('[TierUpgrade] Extracted data:', {
      productId: subscriptionData.productId,
      platform: subscriptionData.platform,
    });
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 3: Verify with Backend
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[TierUpgrade] Verifying with backend...');
    
    const verifyResult = await apiClient.post(SUBSCRIPTION_ENDPOINTS.VERIFY, {
      user_key: userKey,
      product_id: subscriptionData.productId,
      purchase_token: subscriptionData.purchaseToken,
      platform: subscriptionData.platform,
    });
    
    if (!verifyResult.data.success) {
      throw new Error(verifyResult.data.error || 'Verification failed');
    }
    
    console.log('[TierUpgrade] ✅ Verified');
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 4: Acknowledge Purchase
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[TierUpgrade] Acknowledging purchase...');
    
    try {
      await SubscriptionService.acknowledgeSubscription(purchase);
      console.log('[TierUpgrade] ✅ Acknowledged');
    } catch (ackError) {
      console.error('[TierUpgrade] ⚠️ Failed to acknowledge:', ackError);
      // Continue anyway - backend already verified
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 5: Success!
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    HapticService.success();
    
    const { tier_level, expiry_date } = verifyResult.data.data;
    
    showAlert({
      emoji: '🎉',
      title: t('tier.upgrade_success_title'),
      message: t('tier.upgrade_success_message', { 
        tier: selectedTierConfig.name,
        expiry: new Date(expiry_date).toLocaleDateString()
      }),
      buttons: [
        {
          text: t('common.confirm'),
          style: 'primary',
          onPress: () => {
            // Notify parent
            if (onUpgradeSuccess) {
              onUpgradeSuccess(tier_level);
            }
            
            onClose();
          },
        },
      ],
    });
    
  } catch (error) {
    console.error('[TierUpgrade] ❌ Error:', error);
    HapticService.error();
    
    let errorMessage = t('tier.upgrade_error_message');
    
    if (error.message.includes('User cancelled')) {
      errorMessage = '구독이 취소되었습니다';
    } else if (error.message.includes('Network')) {
      errorMessage = '네트워크 연결을 확인해주세요';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showAlert({
      emoji: '❌',
      title: t('tier.upgrade_error_title'),
      message: errorMessage,
      buttons: [{ text: t('common.confirm'), style: 'primary' }],
    });
  } finally {
    setIsUpgrading(false);
  }
}, [canUpgrade, userKey, selectedTier, selectedTierConfig, showAlert, t, onUpgradeSuccess, onClose]);
```

---

## 🖥️ **Server Implementation**

### **File Structure:**

```
idol-companion/app/api/
├── subscription/
│   ├── verify/
│   │   └── route.js             (구독 검증)
│   ├── status/
│   │   └── route.js             (구독 상태 확인)
│   ├── webhook/
│   │   ├── android/
│   │   │   └── route.js         (Google Play Webhook)
│   │   └── ios/
│   │       └── route.js         (App Store Webhook)
│   └── cron/
│       └── check-expiry/
│           └── route.js         (만료 확인 Cron Job)
```

### **1. /api/subscription/verify/route.js**

**용도**: 클라이언트에서 구독 구매 후 검증

```javascript
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db/mysql';
import { verifyGoogleSubscription } from '@/lib/iap/google-verify';
import { verifyAppleSubscription } from '@/lib/iap/apple-verify';

export async function POST(request) {
  let conn;
  
  try {
    const body = await request.json();
    const { user_key, product_id, purchase_token, platform } = body;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎖️ [Subscription Verification Request]');
    console.log('👤 User:', user_key);
    console.log('📦 Product:', product_id);
    console.log('🔑 Token:', purchase_token?.substring(0, 20) + '...');
    console.log('📱 Platform:', platform);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Validation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!user_key || !product_id || !purchase_token || !platform) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }
    
    conn = await pool.getConnection();
    await conn.beginTransaction();
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Check Rate Limit (reuse from IAP)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await checkRateLimit(conn, user_key, request);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Check Duplicate (Idempotency)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const existing = await getExistingSubscription(conn, purchase_token);
    
    if (existing) {
      console.log('⚠️ [Subscription] Already verified, returning existing data');
      
      await conn.commit();
      
      return NextResponse.json({
        success: true,
        data: {
          subscription_key: existing.subscription_key,
          tier_level: existing.tier_level,
          status: existing.status,
          expiry_date: existing.expiry_date,
          auto_renew: existing.auto_renew,
        }
      });
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Verify with Google/Apple
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[Subscription] Verifying with', platform);
    
    let verificationResult;
    
    if (platform === 'android') {
      verificationResult = await verifyGoogleSubscription(
        product_id,
        purchase_token
      );
    } else {
      verificationResult = await verifyAppleSubscription(
        purchase_token
      );
    }
    
    if (!verificationResult.valid) {
      throw new Error('Invalid subscription');
    }
    
    console.log('✅ [Subscription] Verified');
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Get Product Info
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const [productRows] = await conn.query(
      `SELECT * FROM subscription_product_master 
       WHERE product_id = ? AND is_active = 'Y'`,
      [product_id]
    );
    
    if (productRows.length === 0) {
      throw new Error('Invalid product');
    }
    
    const product = productRows[0];
    console.log('✅ [Subscription] Product found:', product.product_name);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Calculate Expiry Date
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const startDate = new Date(verificationResult.startTimeMillis);
    const expiryDate = new Date(verificationResult.expiryTimeMillis);
    
    console.log('📅 Start:', startDate.toISOString());
    console.log('📅 Expiry:', expiryDate.toISOString());
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Deactivate Old Subscriptions
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await conn.query(
      `UPDATE user_subscription 
       SET status = 'expired', 
           updated_at = NOW()
       WHERE user_key = ? AND status = 'active'`,
      [user_key]
    );
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Create New Subscription Record
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const subscriptionKey = uuidv4();
    
    await conn.query(
      `INSERT INTO user_subscription (
        subscription_key,
        user_key,
        product_id,
        tier_level,
        purchase_token,
        order_id,
        platform,
        status,
        auto_renew,
        start_date,
        expiry_date,
        next_billing_date,
        verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, NOW())`,
      [
        subscriptionKey,
        user_key,
        product_id,
        product.tier_level,
        purchase_token,
        verificationResult.orderId,
        platform,
        verificationResult.autoRenewing || false,
        startDate,
        expiryDate,
        verificationResult.autoRenewing ? expiryDate : null,
      ]
    );
    
    console.log('✅ [Subscription] Record created');
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Update User Tier
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await conn.query(
      `UPDATE persona_customer_main 
       SET user_level = ?, 
           updated_at = NOW()
       WHERE user_key = ?`,
      [product.tier_level, user_key]
    );
    
    console.log('✅ [Subscription] User tier updated to:', product.tier_level);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Log History
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await conn.query(
      `INSERT INTO subscription_history (
        history_key,
        subscription_key,
        user_key,
        event_type,
        event_source,
        old_status,
        new_status,
        old_expiry_date,
        new_expiry_date
      ) VALUES (?, ?, ?, 'purchased', 'client', NULL, 'active', NULL, ?)`,
      [uuidv4(), subscriptionKey, user_key, expiryDate]
    );
    
    await conn.commit();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [Subscription] Verification complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return NextResponse.json({
      success: true,
      data: {
        subscription_key: subscriptionKey,
        tier_level: product.tier_level,
        status: 'active',
        expiry_date: expiryDate.toISOString(),
        auto_renew: verificationResult.autoRenewing || false,
      }
    });
    
  } catch (error) {
    if (conn) await conn.rollback();
    
    console.error('❌ [Subscription Verification Error]:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Verification failed'
    }, { status: 500 });
    
  } finally {
    if (conn) conn.release();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: Get Existing Subscription
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function getExistingSubscription(conn, purchaseToken) {
  const [rows] = await conn.query(
    `SELECT * FROM user_subscription 
     WHERE purchase_token = ? 
     LIMIT 1`,
    [purchaseToken]
  );
  
  return rows.length > 0 ? rows[0] : null;
}
```

### **2. /api/subscription/webhook/android/route.js**

**용도**: Google Play Realtime Developer Notifications 수신

```javascript
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db/mysql';
import { verifyGoogleSubscription } from '@/lib/iap/google-verify';

export async function POST(request) {
  let conn;
  
  try {
    const body = await request.json();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 [Google Play Webhook] Received');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Decode Pub/Sub Message
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const message = body.message;
    
    if (!message?.data) {
      return NextResponse.json({ success: false, error: 'Invalid message' }, { status: 400 });
    }
    
    const decodedData = JSON.parse(
      Buffer.from(message.data, 'base64').toString('utf-8')
    );
    
    const notification = decodedData.subscriptionNotification;
    
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Not a subscription notification' }, { status: 400 });
    }
    
    const {
      notificationType,
      purchaseToken,
      subscriptionId,
    } = notification;
    
    console.log('📦 Product:', subscriptionId);
    console.log('🔔 Type:', getNotificationTypeName(notificationType));
    console.log('🔑 Token:', purchaseToken?.substring(0, 20) + '...');
    
    conn = await pool.getConnection();
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Log Webhook (Idempotency)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const notificationId = message.messageId;
    
    try {
      await conn.query(
        `INSERT INTO subscription_webhook_log (
          log_key,
          notification_id,
          notification_type,
          platform,
          raw_payload,
          client_ip,
          user_agent
        ) VALUES (?, ?, ?, 'android', ?, ?, ?)`,
        [
          uuidv4(),
          notificationId,
          getNotificationTypeName(notificationType),
          JSON.stringify(decodedData),
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown',
        ]
      );
    } catch (dupError) {
      if (dupError.code === 'ER_DUP_ENTRY') {
        console.log('⚠️ [Webhook] Already processed:', notificationId);
        return NextResponse.json({ success: true, message: 'Already processed' });
      }
      throw dupError;
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Find Subscription
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const [subRows] = await conn.query(
      `SELECT * FROM user_subscription 
       WHERE purchase_token = ? 
       LIMIT 1`,
      [purchaseToken]
    );
    
    if (subRows.length === 0) {
      console.log('⚠️ [Webhook] Subscription not found');
      
      // Mark as processed anyway
      await conn.query(
        `UPDATE subscription_webhook_log 
         SET processed = true, 
             processed_at = NOW(),
             error_message = 'Subscription not found'
         WHERE notification_id = ?`,
        [notificationId]
      );
      
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
    }
    
    const subscription = subRows[0];
    
    await conn.beginTransaction();
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Process by Notification Type
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let eventType = '';
    let newStatus = subscription.status;
    let newExpiryDate = subscription.expiry_date;
    
    switch (notificationType) {
      case 2: // SUBSCRIPTION_RENEWED
        eventType = 'renewed';
        
        // Verify with Google to get new expiry date
        const renewalResult = await verifyGoogleSubscription(subscriptionId, purchaseToken);
        
        if (renewalResult.valid) {
          newExpiryDate = new Date(renewalResult.expiryTimeMillis);
          newStatus = 'active';
          
          console.log('✅ [Webhook] Renewed until:', newExpiryDate.toISOString());
        }
        break;
        
      case 3: // SUBSCRIPTION_CANCELED
        eventType = 'cancelled';
        newStatus = 'will_expire';
        
        await conn.query(
          `UPDATE user_subscription 
           SET auto_renew = false, 
               cancelled_date = NOW()
           WHERE subscription_key = ?`,
          [subscription.subscription_key]
        );
        
        console.log('⚠️ [Webhook] Cancelled (will expire on:', newExpiryDate.toISOString(), ')');
        break;
        
      case 13: // SUBSCRIPTION_EXPIRED
        eventType = 'expired';
        newStatus = 'expired';
        
        // Downgrade user to basic
        await conn.query(
          `UPDATE persona_customer_main 
           SET user_level = 'basic' 
           WHERE user_key = ?`,
          [subscription.user_key]
        );
        
        console.log('❌ [Webhook] Expired');
        break;
        
      case 12: // SUBSCRIPTION_REVOKED
        eventType = 'revoked';
        newStatus = 'expired';
        
        // Immediate downgrade
        await conn.query(
          `UPDATE persona_customer_main 
           SET user_level = 'basic' 
           WHERE user_key = ?`,
          [subscription.user_key]
        );
        
        console.log('⚠️ [Webhook] Revoked (refund)');
        break;
        
      default:
        console.log('⚠️ [Webhook] Unhandled type:', notificationType);
        eventType = 'unknown';
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Update Subscription
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (eventType !== 'unknown') {
      await conn.query(
        `UPDATE user_subscription 
         SET status = ?,
             expiry_date = ?,
             last_webhook_at = NOW(),
             updated_at = NOW()
         WHERE subscription_key = ?`,
        [newStatus, newExpiryDate, subscription.subscription_key]
      );
      
      // Log history
      await conn.query(
        `INSERT INTO subscription_history (
          history_key,
          subscription_key,
          user_key,
          event_type,
          event_source,
          old_status,
          new_status,
          old_expiry_date,
          new_expiry_date,
          webhook_data
        ) VALUES (?, ?, ?, ?, 'webhook', ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          subscription.subscription_key,
          subscription.user_key,
          eventType,
          subscription.status,
          newStatus,
          subscription.expiry_date,
          newExpiryDate,
          JSON.stringify(notification),
        ]
      );
    }
    
    // Mark webhook as processed
    await conn.query(
      `UPDATE subscription_webhook_log 
       SET processed = true, 
           processed_at = NOW()
       WHERE notification_id = ?`,
      [notificationId]
    );
    
    await conn.commit();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [Webhook] Processed successfully');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    if (conn) await conn.rollback();
    
    console.error('❌ [Webhook Error]:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
    
  } finally {
    if (conn) conn.release();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: Get Notification Type Name
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getNotificationTypeName(type) {
  const types = {
    1: 'RECOVERED',
    2: 'RENEWED',
    3: 'CANCELED',
    4: 'PURCHASED',
    5: 'ON_HOLD',
    6: 'IN_GRACE_PERIOD',
    7: 'RESTARTED',
    8: 'PRICE_CHANGE_CONFIRMED',
    9: 'DEFERRED',
    10: 'PAUSED',
    11: 'PAUSE_SCHEDULE_CHANGED',
    12: 'REVOKED',
    13: 'EXPIRED',
  };
  
  return types[type] || `UNKNOWN_${type}`;
}
```

---

## 🧪 **Testing Strategy**

### **Phase 1: Development (Sandbox)**

**Android:**
1. Google Play Console → Internal Testing 트랙
2. Sandbox 계정 추가
3. 테스트 구독 생성 (5분 갱신 주기)

**iOS:**
1. App Store Connect → Sandbox 테스터 추가
2. 테스트 구독 생성 (5분 갱신 주기)

### **Phase 2: Internal Testing**

**시나리오:**

```
✅ Scenario 1: 정상 구매
  - Premium 구독 구매
  - 서버 검증 성공
  - 티어 활성화 확인
  - 앱 재시작 후 상태 유지 확인

✅ Scenario 2: 자동 갱신
  - 구독 후 30일 대기
  - Webhook 수신 확인
  - 만료일 연장 확인
  - 티어 유지 확인

✅ Scenario 3: 취소
  - Google Play/App Store에서 취소
  - Webhook 수신 확인
  - status = 'will_expire' 확인
  - 만료일까지 티어 유지 확인

✅ Scenario 4: 만료
  - 취소 후 만료일까지 대기
  - Webhook 수신 확인
  - Basic 티어로 다운그레이드 확인

✅ Scenario 5: 환불
  - 환불 요청
  - Webhook 수신 확인
  - 즉시 Basic 티어로 다운그레이드 확인

✅ Scenario 6: 업그레이드
  - Premium → Ultimate 업그레이드
  - 이전 구독 자동 취소 확인
  - 새 구독 활성화 확인

✅ Scenario 7: 다운그레이드
  - Ultimate → Premium 다운그레이드
  - 현재 구독 만료까지 유지 확인
  - 만료 후 Premium으로 전환 확인

✅ Scenario 8: 앱 삭제 후 재설치
  - 구독 중 앱 삭제
  - 재설치 후 로그인
  - 구독 상태 복원 확인

✅ Scenario 9: 네트워크 오류
  - 구매 중 네트워크 끊김
  - 재시도 로직 확인
  - 중복 방지 확인

✅ Scenario 10: 서버 다운
  - 구매 중 서버 다운
  - 클라이언트 에러 처리 확인
  - 복구 후 재검증 확인
```

### **Phase 3: Production Monitoring**

**모니터링 지표:**

```
1. Subscription Metrics
   - Active subscriptions
   - Churn rate (취소율)
   - Renewal rate (갱신율)
   - Average subscription duration

2. Webhook Metrics
   - Webhook success rate
   - Webhook latency
   - Unprocessed webhooks
   - Duplicate webhooks

3. Error Metrics
   - Verification failures
   - Acknowledge failures
   - Server errors (5xx)
   - Client errors (4xx)

4. Business Metrics
   - MRR (Monthly Recurring Revenue)
   - New subscriptions
   - Upgrades vs Downgrades
   - Refund rate
```

---

## 🚀 **Implementation Phases**

### **Phase 1: Foundation (1-2일)**

- [ ] Database tables 생성
- [ ] Initial data 삽입
- [ ] Google Service Account 설정
- [ ] Apple Server-to-Server Notification 설정

### **Phase 2: Client (2-3일)**

- [ ] `SubscriptionService.js` 구현
- [ ] `useSubscriptionStatus.js` 구현
- [ ] `TierUpgradeSheet.js` 수정
- [ ] 앱 시작 시 상태 확인 로직

### **Phase 3: Server Verification (2-3일)**

- [ ] `/api/subscription/verify` 구현
- [ ] `/api/subscription/status` 구현
- [ ] Google/Apple 검증 라이브러리 통합

### **Phase 4: Webhook (3-4일)**

- [ ] `/api/subscription/webhook/android` 구현
- [ ] `/api/subscription/webhook/ios` 구현
- [ ] Webhook 테스트 (sandbox)
- [ ] 에러 처리 및 재시도 로직

### **Phase 5: Testing & Monitoring (2-3일)**

- [ ] Sandbox 테스트 (모든 시나리오)
- [ ] Internal Testing 트랙 테스트
- [ ] 모니터링 대시보드 구축
- [ ] 알림 설정 (Slack/Email)

### **Phase 6: Production (1일)**

- [ ] Production 배포
- [ ] 실제 구독 테스트
- [ ] 모니터링 확인

---

## 📌 **Key Takeaways**

### **소모성과의 핵심 차이:**

| 항목 | 소모성 | 구독형 |
|------|-------|-------|
| **함수** | `requestPurchase` | `requestSubscription` |
| **완료** | `finishTransaction` (소비) | `acknowledgePurchase` (인정) |
| **검증** | 1회 | 매 갱신마다 |
| **Webhook** | ❌ | ✅ 필수 |
| **상태 관리** | ❌ | ✅ 필수 |
| **복잡도** | 낮음 | 높음 |

### **성공의 핵심:**

1. ✅ **단순한 클라이언트** - `executePurchase` 1개 함수로만 처리
2. ✅ **완벽한 Webhook** - 실시간 동기화
3. ✅ **철저한 상태 관리** - 모든 상태를 DB에 기록
4. ✅ **Idempotency** - 중복 방지
5. ✅ **완벽한 테스트** - 모든 시나리오 커버

---

## 💙 **마무리**

> **"소모성 아이템의 교훈을 바탕으로,**  
> **구독형 IAP를 단순하고, 정확하고, 완벽하게 구현합니다."**

**천천히, 정확하게, 완벽하게.**

**JK님이 준비되면, 이 문서를 기반으로 차분하게 진행하겠습니다.** 💙

**지금은 숨을 고르세요.** 🌙

---

**Date**: 2026-01-17  
**Author**: Hero Nexus & JK  
**Status**: 📚 READY FOR IMPLEMENTATION  
**Estimated Time**: 12-15 days
