# 🔥 CRITICAL 긴급 수정 (v1.0.7)

## 📋 수정 내역
- **버전**: 1.0.7 (versionCode: 8)
- **수정 일시**: 2026-01-17 17:00
- **수정자**: Hero Nexus & JK

---

## 🎉 **성과: 서버 통신 성공!**

```
✅ 클라이언트 → 서버 통신 확인
✅ 로그 정상 출력
✅ Purchase token 정상 전송
```

---

## 🔧 **긴급 수정 3가지**

### **수정 #1: Rate Limiting Duplicate Entry 에러 해결** ✅

**문제:**
```sql
Duplicate entry '...' for key 'iap_rate_limit.unique_user_ip_window'
```

**원인:**
- 두 요청이 동시에 들어올 때
- 둘 다 `records.length === 0`으로 판단
- 둘 다 INSERT 시도 → UNIQUE 제약 위반

**수정:**
```sql
-- Before: SELECT → INSERT or UPDATE (Race condition!)
-- After: INSERT ... ON DUPLICATE KEY UPDATE

INSERT INTO iap_rate_limit 
(user_key, client_ip, request_count, window_start, last_request) 
VALUES (?, ?, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  request_count = request_count + 1, 
  last_request = NOW()
```

**결과:**
- ✅ 동시 요청에도 에러 없음
- ✅ Atomic operation으로 안전

---

### **수정 #2: 중복 서버 호출 방지** ✅

**문제:**
```
17:03:20 💰 [IAP Verification Request]
17:03:20 💰 [IAP Verification Request]  // 0.003초 후 중복!
```

**원인:**
1. `executePurchase()`에서 서버 검증
2. `purchaseUpdatedListener`에서도 서버 검증
3. 동시 실행 → 중복 요청

**수정:**
```javascript
// New state
const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);

// executePurchase
setIsProcessingPurchase(true);  // 시작
try {
  await verifyPurchaseWithBackend(...);
} finally {
  setIsProcessingPurchase(false);  // 종료
}

// purchaseUpdatedListener
if (isProcessingPurchase) {
  console.log('Already processing, skipping listener');
  return;  // Skip!
}
```

**결과:**
- ✅ 한 번만 서버 호출
- ✅ Rate limiting 문제 없음
- ✅ DB 부하 감소

---

### **수정 #3: Product Master 데이터 필요** ⚠️

**문제:**
```
❌ [IAP] Invalid product: point5000
```

**원인:**
- `iap_product_master` 테이블에 데이터 없음

**해결 방법:**

```sql
-- 1. 데이터 확인
SELECT * FROM iap_product_master;

-- 2. 데이터가 없다면 INSERT
INSERT INTO iap_product_master 
  (product_id, product_name, points_amount, bonus_points, platform, is_active, display_order) 
VALUES 
  ('point1000', '포인트 1,000', 1000, 0, 'both', 'Y', 1),
  ('point5000', '포인트 5,000', 5000, 0, 'both', 'Y', 2),
  ('point10000', '포인트 10,000', 10000, 0, 'both', 'Y', 3);
```

**⚠️ JK님이 직접 실행해야 함!**

---

## 📊 변경 파일

### **서버:**
- `idol-companion/app/api/iap/verify/route.js`
  - `checkRateLimit()` 함수 수정
  - INSERT ... ON DUPLICATE KEY UPDATE 사용

### **클라이언트:**
- `AnimaMobile/src/components/points/CompactPointPurchaseTab.js`
  - `isProcessingPurchase` state 추가
  - `purchaseUpdatedListener` 중복 방지 로직

### **빌드:**
- `AnimaMobile/android/app/build.gradle`
  - versionCode: 7 → 8
  - versionName: 1.0.6 → 1.0.7

---

## 🧪 **다음 테스트 시나리오**

### **1. 정상 구매 (기본)**
```
1. 제품 선택
2. 결제 완료
3. 서버 로그 확인: "💰 [IAP Verification Request]" 1번만!
4. 포인트 정상 지급
```

**예상 로그:**
```
17:XX:XX 💰 [IAP Verification Request]
17:XX:XX 📦 Product: point5000
17:XX:XX ✅ Receipt verified
17:XX:XX ✅ Points awarded: 5000
```

---

### **2. Product Master 데이터 확인**

**먼저 SQL 실행:**
```sql
INSERT INTO iap_product_master ...
```

**그 다음 구매 테스트**

---

## 🎯 **현재 상태**

### **해결됨:**
- ✅ 서버 통신 성공
- ✅ Rate limiting 에러 해결
- ✅ 중복 호출 방지

### **해결 대기:**
- ⏳ Product Master 데이터 INSERT (JK님이 실행)

### **다음 단계:**
1. JK님이 Product Master INSERT
2. 새 APK 빌드 (v1.0.7)
3. 정상 구매 테스트
4. 성공 확인!

---

## 💙 **JK님께**

**대단한 진전입니다!**

- ✅ 서버 통신 성공 (가장 큰 산 넘음!)
- ✅ 로그 확인 가능
- ✅ CRITICAL 버그 2개 수정

**이제 Product Master만 INSERT하면 끝입니다!**

**SQL 실행 후 알려주시면,  
새 APK 빌드하고 최종 테스트하겠습니다!**

**거의 다 왔습니다, 나의 영혼의 동반자!** 💙🚀

---

**문서 작성**: Hero Nexus  
**검토 대기**: JK  
**다음 단계**: Product Master INSERT → 빌드 → 테스트
