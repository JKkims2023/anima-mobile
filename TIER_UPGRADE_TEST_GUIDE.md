# 🎖️ Tier Upgrade Test Guide

## 📅 **문서 정보**
- **작성일**: 2026-01-18
- **작성자**: Hero NEXUS & JK
- **목표**: 구독 티어 업그레이드 시스템 테스트
- **철학**: "천천히, 정확하게, 완벽하게"

---

## ✅ **사전 준비**

### **1. 데이터베이스 SQL 실행**

```bash
# 서버 접속 후 MySQL 실행
mysql -u your_user -p your_database

# SQL 파일 실행
source /path/to/idol-companion/migrations/disable_yearly_subscriptions.sql
```

**확인:**
```sql
-- 활성 상품 확인 (2개만 활성화되어야 함)
SELECT * FROM subscription_product_master WHERE is_active = 'Y';

-- Expected Result:
-- premium_monthly, ultimate_monthly
```

### **2. 서버 배포 확인**

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/idol-companion
git pull
# 서버 재시작
```

**확인:**
- `/api/subscription/cancel` 엔드포인트 동작 확인
- `/api/subscription/verify` 업그레이드 로직 확인

### **3. 클라이언트 빌드**

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile
yarn install
cd ios && pod install && cd ..

# APK 빌드 (테스트용)
cd android && ./gradlew assembleRelease && cd ..
```

---

## 🧪 **테스트 시나리오**

### **Scenario 1: Basic → Premium 구독**

**Steps:**
1. 앱 실행 (Basic 티어)
2. 설정 → 티어 업그레이드 클릭
3. 현재 티어 확인: "현재 티어: 🌟 Basic (무료)"
4. Premium 탭 클릭
5. "구독하기 (실제 가격/월)" 버튼 클릭
6. Google Play 결제 진행
7. 결제 완료 후 "구독 완료!" 알림 확인
8. 앱 재시작
9. 현재 티어 확인: "현재 티어: 💎 Premium"

**Expected Results:**
- ✅ 실제 스토어 가격 표시
- ✅ 구독 활성화 표시
- ✅ 만료일 표시 (30일 후)
- ✅ 자동 갱신 활성화 표시

**Database Check:**
```sql
SELECT * FROM user_subscription WHERE user_key = 'YOUR_USER_KEY';
-- status: 'active'
-- tier_level: 'premium'
-- auto_renew: true

SELECT * FROM persona_customer_main WHERE user_key = 'YOUR_USER_KEY';
-- user_level: 'premium'
```

---

### **Scenario 2: Premium → Ultimate 업그레이드**

**Steps:**
1. 앱 실행 (Premium 티어)
2. 설정 → 티어 업그레이드 클릭
3. 현재 티어 확인: "현재 티어: 💎 Premium"
4. Ultimate 탭 클릭
5. "Ultimate로 업그레이드 (실제 가격/월)" 버튼 클릭
6. Google Play 결제 진행
7. 결제 완료 후 "업그레이드 완료!" 알림 확인
8. 앱 재시작
9. 현재 티어 확인: "현재 티어: 👑 Ultimate"

**Expected Results:**
- ✅ 기존 Premium 구독 종료 (status: 'upgraded')
- ✅ 새로운 Ultimate 구독 시작 (status: 'active')
- ✅ start_date가 NOW()로 설정 (업그레이드 시점!)
- ✅ expiry_date가 NOW() + 30일로 설정

**Database Check:**
```sql
-- 기존 Premium 구독
SELECT * FROM user_subscription 
WHERE user_key = 'YOUR_USER_KEY' AND tier_level = 'premium';
-- status: 'upgraded'

-- 새로운 Ultimate 구독
SELECT * FROM user_subscription 
WHERE user_key = 'YOUR_USER_KEY' AND tier_level = 'ultimate' AND status = 'active';
-- status: 'active'
-- start_date: (업그레이드 시점)
-- expiry_date: (start_date + 30일)

-- subscription_history 확인
SELECT * FROM subscription_history 
WHERE user_key = 'YOUR_USER_KEY' 
ORDER BY created_at DESC;
-- event_type: 'upgraded'
```

---

### **Scenario 3: Ultimate 구독 취소**

**Steps:**
1. 앱 실행 (Ultimate 티어)
2. 설정 → 티어 업그레이드 클릭
3. 현재 티어 확인: "현재 티어: 👑 Ultimate (✅ 구독 활성화)"
4. Ultimate 탭 클릭
5. "구독 취소" 버튼 클릭
6. 확인 다이얼로그: "만료일까지 현재 티어를 사용할 수 있습니다"
7. "예, 취소합니다" 클릭
8. 취소 완료 알림 확인
9. 화면 새로고침
10. 현재 티어 확인: "현재 티어: 👑 Ultimate (⚠️ 구독 취소됨)"
11. 만료일 확인: "만료일: 2026-02-18까지 사용 가능 (30일 남음)"
12. 자동 갱신 확인: "자동 갱신: 비활성화 ❌"

**Expected Results:**
- ✅ status: 'cancelled'
- ✅ auto_renew: false
- ✅ cancelled_date: NOW()
- ✅ expiry_date는 그대로! (만료일까지 사용 가능)
- ✅ user_level은 그대로! ('ultimate' 유지)

**Database Check:**
```sql
SELECT * FROM user_subscription WHERE user_key = 'YOUR_USER_KEY' AND status = 'cancelled';
-- status: 'cancelled'
-- auto_renew: false
-- cancelled_date: (취소 시점)
-- expiry_date: (원래 만료일, 변경 없음!)

SELECT user_level FROM persona_customer_main WHERE user_key = 'YOUR_USER_KEY';
-- user_level: 'ultimate' (아직 유지!)

SELECT * FROM subscription_history 
WHERE user_key = 'YOUR_USER_KEY' AND event_type = 'cancelled';
-- event_type: 'cancelled'
-- event_source: 'client'
```

---

### **Scenario 4: Ultimate 취소 후 Premium 구독 시도 (⚠️ 다운그레이드 방지)**

**Steps:**
1. 앱 실행 (Ultimate 티어, 취소 상태)
2. 설정 → 티어 업그레이드 클릭
3. 현재 티어 확인: "현재 티어: 👑 Ultimate (⚠️ 구독 취소됨)"
4. Premium 탭 클릭
5. 에러 박스 확인:
   ```
   ❌ 취소된 구독이 만료되기 전까지는 다운그레이드할 수 없습니다.
   만료일: 2026-02-18 이후 Basic으로 변경됩니다.
   ```
6. 구독 버튼 없음 확인

**Expected Results:**
- ✅ Premium 구독 버튼이 표시되지 않음
- ✅ 에러 안내 메시지 표시
- ✅ 사용자 보호 (다운그레이드 방지)

---

### **Scenario 5: 만료일 이후 자동 다운그레이드 (수동 시뮬레이션)**

**Steps:**
1. 데이터베이스에서 expiry_date를 과거로 수정:
   ```sql
   UPDATE user_subscription 
   SET expiry_date = '2026-01-17 00:00:00'
   WHERE user_key = 'YOUR_USER_KEY' AND status = 'cancelled';
   ```
2. Cron Job 실행 (수동):
   ```sql
   -- 만료된 구독 찾기
   SELECT * FROM user_subscription 
   WHERE expiry_date < NOW() AND status IN ('active', 'cancelled');
   
   -- 만료 처리
   UPDATE user_subscription 
   SET status = 'expired', updated_at = NOW()
   WHERE expiry_date < NOW() AND status IN ('active', 'cancelled');
   
   -- 사용자 티어 다운그레이드
   UPDATE persona_customer_main 
   SET user_level = 'basic', updated_at = NOW()
   WHERE user_key IN (
     SELECT DISTINCT user_key 
     FROM user_subscription 
     WHERE status = 'expired' AND tier_level IN ('premium', 'ultimate')
   );
   
   -- 히스토리 기록
   INSERT INTO subscription_history
   (history_key, subscription_key, user_key, event_type, event_source, 
    old_status, new_status, created_at)
   SELECT 
     UUID(),
     subscription_key,
     user_key,
     'expired',
     'cron',
     status,
     'expired',
     NOW()
   FROM user_subscription 
   WHERE status = 'expired';
   ```
3. 앱 재시작
4. 현재 티어 확인: "현재 티어: 🌟 Basic (무료)"

**Expected Results:**
- ✅ user_level: 'basic'
- ✅ subscription status: 'expired'
- ✅ 구독 정보 없음

---

## 🔍 **테스트 체크리스트**

### **UI/UX**
- [ ] 현재 티어 카드 표시
- [ ] 탭 전환 부드러움
- [ ] 실제 스토어 가격 표시
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 표시
- [ ] 구독 상태 (활성화/취소) 표시
- [ ] 만료일 표시
- [ ] 자동 갱신 상태 표시

### **비즈니스 로직**
- [ ] Basic → Premium 구독 가능
- [ ] Basic → Ultimate 구독 가능
- [ ] Premium → Ultimate 업그레이드 가능 (start_date = NOW())
- [ ] Ultimate → Premium 다운그레이드 불가
- [ ] Ultimate 취소 후 Premium 구독 불가
- [ ] 취소 시 만료일까지 티어 유지
- [ ] 만료일 이후 자동 다운그레이드

### **서버 API**
- [ ] `/api/subscription/verify` 정상 동작
- [ ] `/api/subscription/status` 정상 동작
- [ ] `/api/subscription/cancel` 정상 동작
- [ ] Rate Limiting 동작
- [ ] Idempotency 동작 (중복 요청 처리)
- [ ] Error Handling 동작

### **데이터베이스**
- [ ] `user_subscription` 테이블 정상 동작
- [ ] `subscription_history` 테이블 정상 동작
- [ ] `persona_customer_main.user_level` 정상 업데이트
- [ ] `subscription_product_master` 정상 조회 (2개만 활성)

---

## 🚨 **알려진 제한사항**

1. **Cron Job 미구현**
   - 현재: 수동으로 만료 처리 필요
   - 향후: 자동 Cron Job 구현 (Phase 5)

2. **실제 Google/Apple 검증 미구현**
   - 현재: Mock 검증 사용
   - 향후: Google Service Account 설정 (Phase 5)

3. **Webhook 미구현**
   - 현재: 클라이언트 요청만 처리
   - 향후: Google/Apple Webhook 수신 (Phase 5)

---

## 💡 **문제 해결 가이드**

### **"구독 정보를 불러올 수 없습니다" 에러**

**원인:** 서버 API 연결 실패

**해결:**
1. 서버가 실행 중인지 확인
2. API_BASE_URL 확인 (`api.config.js`)
3. 네트워크 연결 확인
4. 서버 로그 확인

### **"상품을 사용할 수 없습니다" 에러**

**원인:** Google Play Console 설정 문제

**해결:**
1. Internal Test Track에 AAB 업로드 확인
2. 제품 활성화 확인 (premium_monthly, ultimate_monthly)
3. License Tester 설정 확인 (`LICENSED`)
4. 24시간 대기 후 재시도

### **가격이 "로딩 중..."으로 표시**

**원인:** `loadSubscriptions()` 실패

**해결:**
1. `SubscriptionService.js`의 SUBSCRIPTION_SKUS 확인
2. Google Play Console 제품 ID 일치 확인
3. 콘솔 로그 확인 (`console.log`)

---

## 📋 **다음 단계 (Phase 5)**

1. **Cron Job 구현**
   - 만료일 이후 자동 다운그레이드
   - 하루 1회 실행
   - 배치 처리

2. **실제 Google/Apple 검증**
   - Google Service Account 설정
   - Apple Server-to-Server Notification 설정

3. **Webhook 구현**
   - Android: `/api/subscription/webhook/android`
   - iOS: `/api/subscription/webhook/ios`
   - 자동 갱신/취소/환불 처리

---

## 💙 **철학**

> "천천히, 정확하게, 완벽하게"  
> "ANIMA는 서비스계의 에르메스"

**Author:** Hero NEXUS & JK  
**Date:** 2026-01-18  
**Status:** Test Guide 작성 완료 ✅

---

**Happy Testing!** 🎉
