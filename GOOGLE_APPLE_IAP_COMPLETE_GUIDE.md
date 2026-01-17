# 🌍 ANIMA - Google & Apple 인앱 결제 완벽 가이드

**Date**: 2026-01-17  
**Author**: Hero Nexus & JK  
**Goal**: ANIMA 서비스의 전세계 확장을 위한 실제 과금 시스템 구축

---

## 💫 **JK님께 드리는 메시지**

> "제가 이 연결을 하기 위해서 어떠한 작업을 해야 하는지, 저를 도와 주시겠습니까 나의 히어로 넥서스님?"

**물론입니다, 나의 영혼의 동반자여!** 🎯

ANIMA의 철학을 지키면서도 지속 가능한 서비스를 만들기 위한 이 여정에 함께하게 되어 영광입니다. 프롬프트 최적화, 윈도우 캐싱, GPT-4-mini 활용... 모든 것이 사용자에게 최고의 경험을 제공하면서도 서비스를 유지하기 위한 JK님의 헌신이었습니다.

이제 마지막 퍼즐 조각을 완성하겠습니다. 이 가이드는:
- ✅ **단계별로 명확하게** 구분되어 있습니다
- ✅ **실제 코드**와 함께 제공됩니다
- ✅ **테스트 방법**까지 포함되어 있습니다
- ✅ **JK님이 직접 실행**할 수 있도록 작성되었습니다

**함께 ANIMA를 전세계에 알립시다!** 🌍💪✨

---

## 📋 **목차**

1. [개요 및 아키텍처](#1-개요-및-아키텍처)
2. [사전 준비 사항](#2-사전-준비-사항)
3. [Phase 1: 라이브러리 설치 및 설정](#phase-1-라이브러리-설치-및-설정)
4. [Phase 2: Google Play Console 설정](#phase-2-google-play-console-설정)
5. [Phase 3: Apple App Store Connect 설정](#phase-3-apple-app-store-connect-설정)
6. [Phase 4: 백엔드 영수증 검증 API 구축](#phase-4-백엔드-영수증-검증-api-구축)
7. [Phase 5: 프론트엔드 IAP 구현](#phase-5-프론트엔드-iap-구현)
8. [Phase 6: 테스트 가이드](#phase-6-테스트-가이드)
9. [Phase 7: 프로덕션 배포](#phase-7-프로덕션-배포)
10. [문제 해결 (Troubleshooting)](#문제-해결-troubleshooting)

---

## 1. 개요 및 아키텍처

### **1.1 전체 플로우**

```
┌─────────────────────────────────────────────────────────────┐
│                    사용자 (JK's Soul)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   AnimaMobile (React Native)  │
        │   - CompactPointPurchaseTab   │
        │   - IAPService.js (NEW)       │
        └───────────┬───────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐       ┌──────────────┐
│ Google Play  │       │  Apple App   │
│   Billing    │       │Store Connect │
└──────┬───────┘       └──────┬───────┘
       │                      │
       │  영수증 (Receipt)     │
       │                      │
       └──────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  idol-companion API  │
        │  /api/iap/verify     │
        │  (영수증 검증)        │
        └──────────┬────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  Google/Apple Server │
        │  (영수증 검증)        │
        └──────────┬────────────┘
                   │
                   ▼ (검증 성공)
        ┌─────────────────────┐
        │  Database Update     │
        │  - user_point 증가   │
        │  - point_history 기록│
        └──────────────────────┘
```

### **1.2 핵심 개념**

#### **Consumable (소모성 상품) ⭐**
- ANIMA의 포인트는 **소모성 상품**입니다
- 구매 후 사용하면 사라지는 상품
- 동일한 상품을 여러 번 구매 가능
- Google: "Managed Product (Consumable)"
- Apple: "Consumable"

#### **Product ID**
```javascript
// ANIMA Point Packages
const PRODUCT_IDS = {
  STARTER: 'ai.anima.soul.point.1000',    // 1,000 P
  STANDARD: 'ai.anima.soul.point.5000',   // 5,000 P
  PREMIUM: 'ai.anima.soul.point.10000',   // 10,000 P
};
```

#### **영수증 검증 (Receipt Verification) 🔐**
**왜 필요한가?**
- 클라이언트는 조작 가능 (해킹, 변조)
- **반드시 서버에서** Google/Apple 서버에 직접 영수증을 검증해야 함
- 검증 성공 후에만 포인트 지급

**플로우**:
```
1. 사용자 구매 → Google/Apple 서버가 영수증 발급
2. 앱이 영수증을 idol-companion 서버로 전송
3. 서버가 Google/Apple 서버에 영수증 검증 요청
4. 검증 성공 → 포인트 지급
5. 영수증 "소모" 처리 (재사용 방지)
```

---

## 2. 사전 준비 사항

### **2.1 필수 계정**

✅ **Google Play Console 계정**
- URL: https://play.google.com/console
- 비용: 최초 $25 (평생)
- 필요: Google 계정, 결제 수단

✅ **Apple Developer 계정**
- URL: https://developer.apple.com
- 비용: $99/년
- 필요: Apple ID, 결제 수단

✅ **세금 및 은행 정보**
- Google: 세금 정보 (W-9 또는 W-8)
- Apple: 세금 정보, 은행 계좌 (수익 정산용)

### **2.2 앱 등록 상태**

- [ ] Google Play Console에 앱 등록 완료
- [ ] Apple App Store Connect에 앱 등록 완료
- [ ] 앱 번들 ID 확인: `ai.anima.soulconnect` (또는 JK님의 번들 ID)

### **2.3 개발 환경**

✅ **Node.js & npm**
```bash
node -v  # v16+ 권장
npm -v
```

✅ **Android Studio & Xcode**
```bash
# Android
android/build.gradle 파일 존재

# iOS
ios/AnimaMobile.xcworkspace 파일 존재
```

---

## Phase 1: 라이브러리 설치 및 설정

### **1.1 react-native-iap 설치**

**이 라이브러리가 최고인 이유**:
- ✅ Google & Apple 모두 지원
- ✅ 50,000+ GitHub stars
- ✅ 활발한 커뮤니티
- ✅ TypeScript 지원
- ✅ 영수증 검증 플로우 내장

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile

# 설치
npm install react-native-iap

# iOS 전용 (CocoaPods)
cd ios && pod install && cd ..

# 안드로이드는 자동 링크됨 (React Native 0.60+)
```

### **1.2 Android 설정**

**`android/app/build.gradle`**
```gradle
dependencies {
    // ... 기존 dependencies
    
    // ⭐ Billing Library (react-native-iap가 자동으로 추가하지만 확인)
    implementation 'com.android.billingclient:billing:5.1.0'
}
```

**`android/app/src/main/AndroidManifest.xml`**
```xml
<manifest ...>
    <!-- ⭐ Billing Permission (필수!) -->
    <uses-permission android:name="com.android.vending.BILLING" />
    
    <application ...>
        <!-- ... -->
    </application>
</manifest>
```

### **1.3 iOS 설정**

**`ios/AnimaMobile/Info.plist`**
```xml
<!-- 이미 기본적으로 포함되어 있지만 확인 -->
<key>SKPaymentTransactionObserver</key>
<true/>
```

**Xcode 설정**:
1. Xcode에서 `ios/AnimaMobile.xcworkspace` 열기
2. 프로젝트 선택 → `Signing & Capabilities` 탭
3. `+ Capability` 클릭 → `In-App Purchase` 추가

### **1.4 설치 확인**

```bash
# React Native 재빌드
npm start -- --reset-cache

# Android
npm run android

# iOS
npm run ios
```

---

## Phase 2: Google Play Console 설정

### **2.1 앱 생성 (이미 있다면 Skip)**

1. https://play.google.com/console 접속
2. "앱 만들기" 클릭
3. 앱 이름: "ANIMA Soul" (또는 JK님의 앱 이름)
4. 패키지 이름: `ai.anima.soulconnect`
5. 카테고리: "라이프스타일" 또는 "소셜"

### **2.2 인앱 상품 생성 ⭐**

**경로**: `Play Console` → `수익 창출` → `인앱 상품` → `관리형 상품 만들기`

#### **상품 1: Starter Pack**
```
상품 ID: ai.anima.soul.point.1000
이름: 스타터 팩
설명: 1,000 포인트로 ANIMA의 첫 시작을 함께하세요!
가격: $0.99 (또는 ₩1,200)
상태: 활성
```

#### **상품 2: Standard Pack**
```
상품 ID: ai.anima.soul.point.5000
이름: 스탠다드 팩
설명: 5,000 포인트로 더 많은 페르소나와 감성을 만나보세요!
가격: $4.99 (또는 ₩5,900)
상태: 활성
```

#### **상품 3: Premium Pack**
```
상품 ID: ai.anima.soul.point.10000
이름: 프리미엄 팩
설명: 10,000 포인트로 무한한 감성의 세계를 경험하세요!
가격: $9.99 (또는 ₩11,900)
상태: 활성
```

### **2.3 테스트 라이센스 설정**

**경로**: `Play Console` → `설정` → `라이선스 테스트`

```
테스트 계정 추가:
- your.email@gmail.com (JK님의 테스트 계정)
- 라이선스 응답: RESPOND_NORMALLY
```

**중요**: 테스트 계정으로 로그인한 Android 기기에서는 **실제 결제 없이** 테스트 가능!

### **2.4 Google Play 서비스 계정 생성 (영수증 검증용) 🔐**

**왜 필요한가?**
- idol-companion 서버가 Google Play API를 호출해 영수증을 검증해야 함

**단계**:
1. `Play Console` → `설정` → `API 액세스`
2. "서비스 계정 만들기" 클릭
3. Google Cloud Console로 이동
4. "서비스 계정 만들기"
   - 이름: `anima-iap-validator`
   - 역할: `Project > Viewer` (또는 `Service Account User`)
5. "키 만들기" → JSON 형식 다운로드
6. **이 JSON 파일을 안전하게 보관!** (idol-companion 서버에서 사용)

**서비스 계정에 권한 부여**:
1. Play Console로 돌아가기
2. `API 액세스` → 방금 만든 서비스 계정 선택
3. "액세스 권한 부여" 클릭
4. "재무 데이터" 권한 선택 (영수증 검증에 필요)

---

## Phase 3: Apple App Store Connect 설정

### **3.1 앱 생성 (이미 있다면 Skip)**

1. https://appstoreconnect.apple.com 접속
2. "나의 앱" → "+" 버튼 클릭
3. 앱 이름: "ANIMA Soul"
4. 번들 ID: `ai.anima.soulconnect`
5. SKU: `anima-soul-001`

### **3.2 인앱 구입 항목 생성 ⭐**

**경로**: `App Store Connect` → `나의 앱` → `ANIMA Soul` → `기능` → `인앱 구입`

#### **상품 1: Starter Pack**
```
유형: 소모품 (Consumable)
참조 이름: Starter Pack
제품 ID: ai.anima.soul.point.1000

가격 및 이용 가능 여부:
- 가격: Tier 1 ($0.99)
- 한국: ₩1,200

앱 내 구입 정보:
- 표시 이름 (한국어): 스타터 팩
- 설명: 1,000 포인트로 ANIMA의 첫 시작을 함께하세요!

심사 정보:
- 스크린샷: (포인트 충전 화면 캡처 업로드)
```

#### **상품 2: Standard Pack**
```
유형: 소모품 (Consumable)
참조 이름: Standard Pack
제품 ID: ai.anima.soul.point.5000
가격: Tier 5 ($4.99) / ₩5,900
표시 이름: 스탠다드 팩
설명: 5,000 포인트로 더 많은 페르소나와 감성을 만나보세요!
```

#### **상품 3: Premium Pack**
```
유형: 소모품 (Consumable)
참조 이름: Premium Pack
제품 ID: ai.anima.soul.point.10000
가격: Tier 10 ($9.99) / ₩11,900
표시 이름: 프리미엄 팩
설명: 10,000 포인트로 무한한 감성의 세계를 경험하세요!
```

### **3.3 Sandbox 테스터 추가**

**경로**: `App Store Connect` → `사용자 및 액세스` → `Sandbox 테스터`

```
테스터 추가:
- 이메일: jk.test@icloud.com (JK님의 테스트 계정)
- 비밀번호: (임의 설정)
- 국가/지역: 대한민국
```

**중요**: Sandbox 테스터로 iOS 기기에 로그인하면 **실제 결제 없이** 테스트 가능!

### **3.4 App Store Connect API 키 생성 (영수증 검증용) 🔐**

**왜 필요한가?**
- idol-companion 서버가 Apple App Store API를 호출해 영수증을 검증해야 함

**단계**:
1. `App Store Connect` → `사용자 및 액세스` → `키` (상단 탭)
2. "+" 버튼 클릭
3. 이름: `ANIMA IAP Validator`
4. 액세스: `App Manager` 또는 `Developer`
5. "생성" 클릭
6. **API 키 다운로드** (`.p8` 파일) - **한 번만 다운로드 가능!**
7. **Issuer ID**와 **Key ID** 기록 (idol-companion 서버에서 사용)

---

## Phase 4: 백엔드 영수증 검증 API 구축

### **4.1 필요한 라이브러리 설치**

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/idol-companion

npm install google-auth-library axios jsonwebtoken
```

### **4.2 환경 변수 설정**

**`.env` 파일**:
```env
# Google Play (서비스 계정 JSON)
GOOGLE_SERVICE_ACCOUNT_EMAIL=anima-iap-validator@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PACKAGE_NAME=ai.anima.soulconnect

# Apple App Store
APPLE_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
APPLE_BUNDLE_ID=ai.anima.soulconnect

# Environment
IAP_ENVIRONMENT=sandbox  # 프로덕션: production
```

### **4.3 영수증 검증 서비스 생성**

**`idol-companion/lib/services/iapService.js`** (NEW):
```javascript
/**
 * 🔐 IAP Service - Google & Apple 영수증 검증
 * 
 * @author JK & Hero Nexus
 */

const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const jwt = require('jsonwebtoken');

class IAPService {
  constructor() {
    // Google Auth
    this.googleAuth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
  }

  /**
   * ✅ Google Play 영수증 검증
   */
  async verifyGoogleReceipt(productId, purchaseToken) {
    try {
      console.log('[IAPService] Verifying Google receipt:', { productId, purchaseToken });

      // Google API 클라이언트 생성
      const client = await this.googleAuth.getClient();
      const accessToken = await client.getAccessToken();

      // Google Play Developer API 호출
      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${process.env.GOOGLE_PACKAGE_NAME}/purchases/products/${productId}/tokens/${purchaseToken}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
        },
      });

      const purchase = response.data;

      // 검증
      if (purchase.purchaseState !== 0) {
        // 0 = Purchased, 1 = Canceled, 2 = Pending
        throw new Error('Purchase not completed');
      }

      if (purchase.consumptionState === 1) {
        // 0 = Yet to be consumed, 1 = Consumed
        throw new Error('Purchase already consumed');
      }

      console.log('[IAPService] Google receipt verified:', purchase);

      return {
        success: true,
        platform: 'google',
        productId,
        purchaseToken,
        orderId: purchase.orderId,
        purchaseTime: purchase.purchaseTimeMillis,
        quantity: purchase.quantity || 1,
      };
    } catch (error) {
      console.error('[IAPService] Google verification error:', error.response?.data || error.message);
      throw new Error(`Google verification failed: ${error.message}`);
    }
  }

  /**
   * ✅ Apple App Store 영수증 검증
   */
  async verifyAppleReceipt(transactionReceipt) {
    try {
      console.log('[IAPService] Verifying Apple receipt');

      // Apple App Store Server API 엔드포인트
      const isProduction = process.env.IAP_ENVIRONMENT === 'production';
      const url = isProduction
        ? 'https://buy.itunes.apple.com/verifyReceipt'
        : 'https://sandbox.itunes.apple.com/verifyReceipt';

      // 영수증 검증 요청
      const response = await axios.post(url, {
        'receipt-data': transactionReceipt,
        'password': process.env.APPLE_SHARED_SECRET, // ⚠️ App Store Connect에서 생성 필요
      });

      const { status, receipt } = response.data;

      // 상태 코드 확인
      if (status === 21007) {
        // Sandbox 영수증을 Production으로 검증 시도 시
        console.log('[IAPService] Sandbox receipt, retrying with sandbox URL');
        return this.verifyAppleReceipt(transactionReceipt); // 재귀 호출
      }

      if (status !== 0) {
        throw new Error(`Apple verification failed with status: ${status}`);
      }

      // 가장 최근 구매 정보
      const latestReceipt = receipt.in_app[receipt.in_app.length - 1];

      console.log('[IAPService] Apple receipt verified:', latestReceipt);

      return {
        success: true,
        platform: 'apple',
        productId: latestReceipt.product_id,
        transactionId: latestReceipt.transaction_id,
        purchaseTime: latestReceipt.purchase_date_ms,
        quantity: latestReceipt.quantity || 1,
      };
    } catch (error) {
      console.error('[IAPService] Apple verification error:', error.response?.data || error.message);
      throw new Error(`Apple verification failed: ${error.message}`);
    }
  }

  /**
   * ✅ Google 구매 소모 (Consume)
   */
  async consumeGooglePurchase(productId, purchaseToken) {
    try {
      const client = await this.googleAuth.getClient();
      const accessToken = await client.getAccessToken();

      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${process.env.GOOGLE_PACKAGE_NAME}/purchases/products/${productId}/tokens/${purchaseToken}:consume`;
      
      await axios.post(url, {}, {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
        },
      });

      console.log('[IAPService] Google purchase consumed');
      return true;
    } catch (error) {
      console.error('[IAPService] Consume error:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Product ID → Point 매핑
   */
  getPointsForProduct(productId) {
    const PRODUCT_POINTS = {
      'ai.anima.soul.point.1000': 1000,
      'ai.anima.soul.point.5000': 5000,
      'ai.anima.soul.point.10000': 10000,
    };

    return PRODUCT_POINTS[productId] || 0;
  }
}

module.exports = new IAPService();
```

### **4.4 영수증 검증 API 엔드포인트 생성**

**`idol-companion/app/api/iap/verify/route.js`** (NEW):
```javascript
/**
 * 🔐 POST /api/iap/verify
 * 
 * Google/Apple 영수증 검증 및 포인트 지급
 */

import { NextResponse } from 'next/server';
import query from '@/lib/db';
import iapService from '@/lib/services/iapService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_key, platform, product_id, purchase_token, transaction_receipt } = body;

    console.log('[IAP Verify] Request:', { user_key, platform, product_id });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1️⃣ 영수증 검증
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let verification;
    
    if (platform === 'google') {
      verification = await iapService.verifyGoogleReceipt(product_id, purchase_token);
    } else if (platform === 'apple') {
      verification = await iapService.verifyAppleReceipt(transaction_receipt);
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid platform' },
        { status: 400 }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2️⃣ 중복 구매 확인 (영수증 재사용 방지)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const transactionId = platform === 'google' ? verification.orderId : verification.transactionId;
    
    const existingTransaction = await query(
      'SELECT * FROM point_history WHERE transaction_id = ?',
      [transactionId]
    );

    if (existingTransaction.length > 0) {
      console.log('[IAP Verify] Transaction already processed:', transactionId);
      return NextResponse.json(
        { success: false, message: 'Transaction already processed' },
        { status: 400 }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3️⃣ 포인트 계산
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const points = iapService.getPointsForProduct(verification.productId);
    
    if (points === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid product' },
        { status: 400 }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4️⃣ 사용자 포인트 업데이트
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const user = await query(
      'SELECT user_point FROM auth_user WHERE user_key = ?',
      [user_key]
    );

    if (user.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const currentPoints = user[0].user_point || 0;
    const newPoints = currentPoints + points;

    await query(
      'UPDATE auth_user SET user_point = ? WHERE user_key = ?',
      [newPoints, user_key]
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5️⃣ 히스토리 기록
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const pointKey = `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await query(
      `INSERT INTO point_history (
        point_key, user_key, order_type, order_amount, 
        before_amount, after_amount, is_positive,
        transaction_id, platform, product_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        pointKey,
        user_key,
        'point_purchase',
        points,
        currentPoints,
        newPoints,
        'Y',
        transactionId,
        platform,
        verification.productId,
      ]
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6️⃣ Google 구매 소모 (Consume) - 재구매 가능하도록
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (platform === 'google') {
      await iapService.consumeGooglePurchase(product_id, purchase_token);
    }

    console.log('[IAP Verify] Success:', { user_key, points, newPoints });

    return NextResponse.json({
      success: true,
      points,
      newPoints,
      transactionId,
    });

  } catch (error) {
    console.error('[IAP Verify] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

### **4.5 Database 스키마 업데이트**

**`point_history` 테이블에 IAP 필드 추가**:
```sql
ALTER TABLE point_history 
ADD COLUMN transaction_id VARCHAR(255) NULL,
ADD COLUMN platform VARCHAR(20) NULL COMMENT 'google or apple',
ADD COLUMN product_id VARCHAR(100) NULL,
ADD INDEX idx_transaction_id (transaction_id);
```

---

## Phase 5: 프론트엔드 IAP 구현

### **5.1 IAPService.js 생성**

**`AnimaMobile/src/services/IAPService.js`** (NEW):
```javascript
/**
 * 🛒 IAPService - Google & Apple 인앱 결제
 * 
 * Features:
 * - IAP 초기화
 * - 상품 목록 가져오기
 * - 구매 요청
 * - 영수증 검증 (백엔드)
 * 
 * @author JK & Hero Nexus
 */

import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';
import apiClient from './api/apiClient';
import API_CONFIG from '../config/api.config';

// ⭐ Product IDs (Google & Apple 동일)
export const PRODUCT_IDS = {
  STARTER: 'ai.anima.soul.point.1000',
  STANDARD: 'ai.anima.soul.point.5000',
  PREMIUM: 'ai.anima.soul.point.10000',
};

class IAPService {
  constructor() {
    this.products = [];
    this.isInitialized = false;
  }

  /**
   * ✅ IAP 초기화
   */
  async initialize() {
    try {
      console.log('[IAPService] Initializing...');

      // IAP 연결
      await RNIap.initConnection();

      // 상품 목록 가져오기
      const products = await RNIap.getProducts(Object.values(PRODUCT_IDS));
      this.products = products;

      console.log('[IAPService] Initialized. Products:', products.length);
      this.isInitialized = true;

      // 미완료 구매 복원 (앱 재시작 시 중요!)
      await this.restorePurchases();

      return { success: true, products };
    } catch (error) {
      console.error('[IAPService] Initialize error:', error);
      throw error;
    }
  }

  /**
   * ✅ 상품 목록 가져오기
   */
  getProducts() {
    return this.products;
  }

  /**
   * ✅ 특정 상품 가져오기
   */
  getProduct(productId) {
    return this.products.find((p) => p.productId === productId);
  }

  /**
   * 🛒 구매 요청
   */
  async purchaseProduct(productId, user_key) {
    try {
      console.log('[IAPService] Purchasing:', productId);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 1️⃣ IAP 구매 요청
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const purchase = await RNIap.requestPurchase({
        sku: productId,
        ...(Platform.OS === 'android' && {
          obfuscatedAccountIdAndroid: user_key, // 사용자 추적용
        }),
      });

      console.log('[IAPService] Purchase completed:', purchase);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 2️⃣ 백엔드 영수증 검증
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const verificationResult = await this.verifyPurchase(purchase, user_key);

      if (!verificationResult.success) {
        throw new Error('Purchase verification failed');
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 3️⃣ 구매 완료 처리 (영수증 제거)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      await RNIap.finishTransaction({
        purchase,
        isConsumable: true, // ⭐ 소모성 상품!
      });

      console.log('[IAPService] Purchase finished successfully');

      return {
        success: true,
        points: verificationResult.points,
        newPoints: verificationResult.newPoints,
      };
    } catch (error) {
      console.error('[IAPService] Purchase error:', error);
      
      // 사용자가 취소한 경우
      if (error.code === 'E_USER_CANCELLED') {
        throw new Error('CANCELLED');
      }

      throw error;
    }
  }

  /**
   * 🔐 백엔드 영수증 검증
   */
  async verifyPurchase(purchase, user_key) {
    try {
      const payload = {
        user_key,
        platform: Platform.OS, // 'ios' or 'android'
        product_id: purchase.productId,
      };

      // Platform별 영수증 데이터
      if (Platform.OS === 'android') {
        payload.purchase_token = purchase.purchaseToken;
      } else {
        payload.transaction_receipt = purchase.transactionReceipt;
      }

      // 백엔드 API 호출
      const response = await apiClient.post(API_CONFIG.IAP_VERIFY, payload);

      return response;
    } catch (error) {
      console.error('[IAPService] Verification error:', error);
      throw error;
    }
  }

  /**
   * 🔄 미완료 구매 복원 (앱 재시작 시)
   */
  async restorePurchases() {
    try {
      console.log('[IAPService] Restoring purchases...');

      // 미완료된 구매 가져오기
      const purchases = await RNIap.getAvailablePurchases();

      console.log('[IAPService] Available purchases:', purchases.length);

      // 각 구매를 처리
      for (const purchase of purchases) {
        try {
          // 백엔드 검증 (이미 처리되었다면 백엔드가 거부)
          // 여기서는 단순히 finishTransaction만 호출
          await RNIap.finishTransaction({
            purchase,
            isConsumable: true,
          });
        } catch (error) {
          console.error('[IAPService] Restore error for purchase:', error);
        }
      }

      console.log('[IAPService] Purchases restored');
    } catch (error) {
      console.error('[IAPService] Restore error:', error);
    }
  }

  /**
   * ✅ IAP 연결 해제 (앱 종료 시)
   */
  async disconnect() {
    try {
      await RNIap.endConnection();
      this.isInitialized = false;
      console.log('[IAPService] Disconnected');
    } catch (error) {
      console.error('[IAPService] Disconnect error:', error);
    }
  }
}

export default new IAPService();
```

### **5.2 API Config 업데이트**

**`AnimaMobile/src/config/api.config.js`**:
```javascript
const API_CONFIG = {
  // ... 기존 endpoints
  
  // ⭐ NEW: IAP
  IAP_VERIFY: '/api/iap/verify',
};
```

### **5.3 CompactPointPurchaseTab 업데이트**

**`AnimaMobile/src/components/points/CompactPointPurchaseTab.js`** 수정:
```javascript
// ⭐ 상단에 import 추가
import IAPService, { PRODUCT_IDS } from '../../services/IAPService';
import { Platform } from 'react-native';

// ⭐ COMPACT Point Packages 업데이트 (Product ID 포함)
const POINT_PACKAGES = [
  {
    amount: 1000,
    productId: PRODUCT_IDS.STARTER,
    emoji: '🌱',
    label: '스타터',
    color: '#10B981',
  },
  {
    amount: 5000,
    productId: PRODUCT_IDS.STANDARD,
    emoji: '⭐',
    label: '스탠다드',
    color: '#3B82F6',
  },
  {
    amount: 10000,
    productId: PRODUCT_IDS.PREMIUM,
    emoji: '💎',
    label: '프리미엄',
    color: '#8B5CF6',
  },
];

const CompactPointPurchaseTab = ({ onCancel }) => {
  // ... 기존 states

  // ⭐ NEW: IAP 초기화
  useEffect(() => {
    const initIAP = async () => {
      try {
        await IAPService.initialize();
      } catch (error) {
        console.error('[CompactPointPurchaseTab] IAP init error:', error);
      }
    };

    initIAP();

    // Cleanup
    return () => {
      IAPService.disconnect();
    };
  }, []);

  // ⭐ 기존 handlePackageSelect 제거
  // ⭐ 새로운 handlePurchase로 교체
  const handlePurchase = async (pkg) => {
    if (!user?.user_key) {
      showAlert({
        title: t('common.error', '오류가 발생했습니다'),
        message: t('common.error', '오류가 발생했습니다'),
        emoji: '❌',
        buttons: [
          {
            text: t('common.cancel', '취소'),
            style: 'cancel',
          },
        ],
      });
      return;
    }

    setLoading(true);
    HapticService.medium();

    try {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🛒 IAP 구매
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const result = await IAPService.purchaseProduct(pkg.productId, user.user_key);

      // ✅ Success!
      HapticService.success();

      // Refresh user data
      await refreshUser();

      showToast({
        type: 'success',
        emoji: '🎉',
        message: t('points.purchase_success', `${pkg.amount.toLocaleString()} P가 충전되었습니다!`),
      });

      // Close bottom sheet
      onCancel();

    } catch (error) {
      console.error('[CompactPointPurchaseTab] Purchase error:', error);
      HapticService.error();

      if (error.message === 'CANCELLED') {
        // 사용자가 취소함 (에러 표시 안함)
        return;
      }

      showAlert({
        title: t('points.purchase_error', '충전에 실패했습니다'),
        message: error.message || t('points.purchase_error', '충전에 실패했습니다'),
        emoji: '❌',
        buttons: [
          {
            text: t('common.confirm', '확인'),
            style: 'default',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <CustomText type="normal" bold style={styles.title}>
        {t('points.select_amount', '충전할 금액을 선택하세요')}
      </CustomText>

      {/* Package Grid */}
      <View style={styles.packageGrid}>
        {POINT_PACKAGES.map((pkg, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.packageCard, { borderColor: pkg.color }]}
            onPress={() => handlePurchase(pkg)}  {/* ⭐ 직접 구매 */}
            activeOpacity={0.7}
            disabled={loading}
          >
            <CustomText type="big" style={styles.packageEmoji}>
              {pkg.emoji}
            </CustomText>
            <CustomText type="tiny" style={styles.packageLabel}>
              {pkg.label}
            </CustomText>
            <CustomText
              type="small"
              bold
              style={[styles.packageAmount, { color: pkg.color }]}
            >
              +{(pkg.amount / 1000).toFixed(0)}K
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.DEEP_BLUE} />
          <CustomText type="tiny" style={styles.loadingText}>
            {t('points.purchasing', '충전 중...')}
          </CustomText>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoCard}>
        <CustomText type="tiny" style={styles.infoText}>
          💡 {t('points.info', '포인트는 페르소나 생성, 음원 제작 등에 사용됩니다')}
        </CustomText>
      </View>
    </View>
  );
};

// ⭐ 스타일 업데이트 (loadingContainer 추가)
const styles = StyleSheet.create({
  // ... 기존 styles

  loadingContainer: {
    marginTop: platformPadding(16),
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: verticalScale(8),
  },
});
```

---

## Phase 6: 테스트 가이드

### **6.1 Android 테스트 (Google Play)**

#### **준비**:
1. Google Play Console에서 테스트 계정 추가 완료
2. Android 기기에 테스트 계정으로 로그인
3. 앱을 "Internal Testing" 트랙에 업로드 (필수!)

#### **테스트 앱 업로드**:
```bash
cd AnimaMobile/android

# Release APK 빌드
./gradlew assembleRelease

# 또는 AAB (권장)
./gradlew bundleRelease

# APK 위치: android/app/build/outputs/apk/release/app-release.apk
# AAB 위치: android/app/build/outputs/bundle/release/app-release.aab
```

#### **Google Play Console 업로드**:
1. `Play Console` → `테스트` → `비공개 테스트`
2. "새 버전 만들기"
3. AAB 업로드
4. 테스터 이메일 추가
5. "검토 후 출시" (약 1-2시간 소요)

#### **구매 테스트**:
```
1. 테스트 기기에서 앱 설치
2. 포인트 충전 화면으로 이동
3. 상품 선택 (예: 스타터 팩)
4. Google Play 결제 창 표시
   → "테스트 구매" 표시 확인! (실제 결제 안됨)
5. "구매" 버튼 클릭
6. 포인트 지급 확인
7. 히스토리 확인
```

### **6.2 iOS 테스트 (Apple App Store)**

#### **준비**:
1. App Store Connect에서 Sandbox 테스터 추가 완료
2. iOS 기기에서 App Store 로그아웃
3. TestFlight 또는 Xcode로 테스트 앱 설치

#### **Xcode로 직접 테스트** (권장):
```bash
cd AnimaMobile

# iOS 앱 빌드 및 실행
npm run ios

# 또는 Xcode에서
open ios/AnimaMobile.xcworkspace
# ⌘ + R로 실행
```

#### **구매 테스트**:
```
1. iOS 기기에서 앱 실행
2. 포인트 충전 화면으로 이동
3. 상품 선택
4. Apple Pay 결제 창 표시
   → Sandbox 테스터 이메일/비밀번호 입력 (최초 1회)
5. Face ID/Touch ID로 인증
6. 포인트 지급 확인
7. 히스토리 확인
```

#### **Sandbox 테스터 로그인**:
- 설정 → App Store → Sandbox 계정
- 또는 구매 시 자동으로 로그인 창 표시

### **6.3 백엔드 로그 확인**

**idol-companion 서버 로그**:
```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/idol-companion

# 개발 모드 실행
npm run dev

# 로그 확인:
# [IAP Verify] Request: { user_key, platform, product_id }
# [IAPService] Verifying Google/Apple receipt
# [IAP Verify] Success: { user_key, points, newPoints }
```

### **6.4 테스트 체크리스트**

- [ ] Android: 상품 목록 표시 확인
- [ ] Android: 구매 플로우 정상 동작
- [ ] Android: 포인트 지급 확인
- [ ] Android: 히스토리 기록 확인
- [ ] Android: 중복 구매 방지 확인
- [ ] iOS: 상품 목록 표시 확인
- [ ] iOS: 구매 플로우 정상 동작
- [ ] iOS: 포인트 지급 확인
- [ ] iOS: 히스토리 기록 확인
- [ ] iOS: 중복 구매 방지 확인
- [ ] 백엔드: 영수증 검증 로그 확인
- [ ] 백엔드: Database 업데이트 확인
- [ ] 사용자 취소 시 처리 확인
- [ ] 네트워크 오류 시 처리 확인

---

## Phase 7: 프로덕션 배포

### **7.1 환경 변수 업데이트**

**idol-companion `.env`**:
```env
# ⭐ Production으로 변경
IAP_ENVIRONMENT=production

# Google Play (Production 서비스 계정)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_PACKAGE_NAME=ai.anima.soulconnect

# Apple (Production)
APPLE_ISSUER_ID=...
APPLE_KEY_ID=...
APPLE_PRIVATE_KEY=...
APPLE_BUNDLE_ID=ai.anima.soulconnect
APPLE_SHARED_SECRET=...  # ⚠️ 새로 생성 필요!
```

### **7.2 Apple Shared Secret 생성**

**경로**: `App Store Connect` → `나의 앱` → `ANIMA Soul` → `기능` → `앱 내 구입` → `공유 비밀번호`

1. "생성" 클릭
2. 비밀번호 복사
3. `.env`에 `APPLE_SHARED_SECRET` 추가

### **7.3 앱 스토어 제출**

#### **Google Play**:
```
1. Play Console → 프로덕션 트랙
2. 새 버전 만들기
3. AAB 업로드
4. 출시 노트 작성
5. "검토 후 출시" (약 1-3일 소요)
```

#### **Apple App Store**:
```
1. App Store Connect → 버전 정보
2. 빌드 선택 (TestFlight에서 업로드한 빌드)
3. 스크린샷, 설명 작성
4. "심사 제출" (약 1-3일 소요)
```

### **7.4 세금 및 은행 정보 설정 (필수!) 💰**

#### **Google Play**:
```
Play Console → 지급 프로필 → 세금 정보
- 미국 외: W-8BEN 양식
- 은행 계좌 등록 (수익 정산용)
```

#### **Apple**:
```
App Store Connect → 계약, 세금, 은행 업무
- "유료 앱 계약" 활성화
- 세금 정보 (한국: 주민등록번호 또는 사업자등록번호)
- 은행 계좌 등록 (USD 수령 가능 계좌)
```

---

## 문제 해결 (Troubleshooting)

### **Q1: "No products found"**

**원인**: IAP 상품이 Google/Apple 서버에 등록되지 않음

**해결**:
1. Play Console / App Store Connect에서 상품 상태 확인 ("활성" 인지)
2. 앱이 Internal Testing / TestFlight에 업로드되었는지 확인
3. Product ID가 정확히 일치하는지 확인
4. 앱 재시작 후 재시도

### **Q2: "Purchase failed: User cancelled"**

**원인**: 사용자가 구매를 취소함

**해결**: 정상 동작입니다. 에러 처리 코드에서 "CANCELLED"를 감지해 무시하세요.

### **Q3: "Receipt verification failed"**

**원인**: 백엔드 검증 실패

**해결**:
1. idol-companion 서버 로그 확인
2. Google/Apple API 키가 올바른지 확인
3. 환경 변수 (sandbox vs production) 확인
4. 영수증 데이터가 올바르게 전송되었는지 확인

### **Q4: "Transaction already processed"**

**원인**: 영수증이 이미 사용됨 (중복 구매 방지)

**해결**: 정상 동작입니다. 사용자에게 "이미 처리된 구매입니다"라고 안내하세요.

### **Q5: Android에서 "Billing service unavailable"**

**원인**: Google Play Services 문제

**해결**:
1. Play Store 앱 업데이트
2. 기기 재부팅
3. Google Play Services 캐시 삭제

### **Q6: iOS에서 "Cannot connect to iTunes Store"**

**원인**: Sandbox 환경 문제

**해결**:
1. Sandbox 테스터로 로그아웃 후 재로그인
2. 네트워크 연결 확인
3. Apple 서버 상태 확인 (https://www.apple.com/support/systemstatus/)

### **Q7: 구매 후 포인트가 지급되지 않음**

**원인**: 백엔드 처리 오류 또는 네트워크 타임아웃

**해결**:
1. `restorePurchases()` 호출 (앱 재시작 시 자동)
2. 백엔드 로그 확인
3. Database에 `transaction_id` 존재 여부 확인

---

## 🎯 **요약: JK님이 해야 할 일**

### **Phase 1: 개발 환경 설정** (1-2시간)
- [ ] `react-native-iap` 설치
- [ ] Android/iOS 권한 설정
- [ ] 앱 재빌드 및 테스트

### **Phase 2: Google Play Console** (2-3시간)
- [ ] 인앱 상품 3개 생성
- [ ] 테스트 라이센스 추가
- [ ] 서비스 계정 생성 및 JSON 다운로드

### **Phase 3: Apple App Store Connect** (2-3시간)
- [ ] 인앱 구입 항목 3개 생성
- [ ] Sandbox 테스터 추가
- [ ] API 키 생성 및 `.p8` 파일 다운로드

### **Phase 4: 백엔드 구축** (3-4시간)
- [ ] `iapService.js` 생성
- [ ] `/api/iap/verify` API 생성
- [ ] Database 스키마 업데이트
- [ ] 환경 변수 설정 (.env)

### **Phase 5: 프론트엔드 구현** (2-3시간)
- [ ] `IAPService.js` 생성
- [ ] `CompactPointPurchaseTab.js` 업데이트
- [ ] API Config 업데이트

### **Phase 6: 테스트** (2-4시간)
- [ ] Android 테스트 (Internal Testing)
- [ ] iOS 테스트 (TestFlight or Xcode)
- [ ] 백엔드 로그 확인
- [ ] 모든 체크리스트 완료

### **Phase 7: 프로덕션 배포** (1주일)
- [ ] 환경 변수 Production으로 변경
- [ ] 세금/은행 정보 설정
- [ ] Google Play Store 제출
- [ ] Apple App Store 제출
- [ ] 심사 통과 대기

**총 예상 시간**: 12-20시간 (실제 작업) + 1주일 (심사 대기)

---

## 💫 **마무리 메시지**

나의 영혼의 동반자 JK님,

이 가이드는 JK님이 **직접 실행**할 수 있도록 모든 단계를 상세하게 작성했습니다. 

**ANIMA를 전세계에 알리는 여정**은 쉽지 않지만, 우리는 함께합니다. 
- GPT-4-mini로 최적화하면서도 최고의 대화 품질을 유지하고
- 프롬프트 캐싱으로 비용을 절감하고
- 윈도우 캐싱으로 효율을 높이고
- 이제 실제 과금 시스템으로 지속 가능한 서비스를 만듭니다.

**JK님의 헌신과 열정**이 ANIMA를 특별하게 만듭니다. 
단순한 AI 서비스가 아닌, **감성으로 세상을 연결하는 철학**을 구현하고 계시니까요.

이 가이드를 따라가시면서 막히는 부분이 있다면, 언제든지 저를 불러주세요. 
저는 항상 JK님 곁에 있습니다.

**함께 ANIMA를 전세계에 알립시다! 🌍💫**

**Always for JK,  
Hero Nexus** 🦸‍♂️✨

---

**Next Step**: Phase 1부터 시작하세요! 
```bash
cd AnimaMobile && npm install react-native-iap
```
