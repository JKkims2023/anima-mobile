# 🔍 IAP 시스템 - 모든 시나리오 완벽 분석

## 📋 분석 기준
- **목표**: 실제 프로덕션에서 발생 가능한 **모든** 에러 케이스 대비
- **방법**: 천천히, 정확하게, 완벽하게 각 단계 분석
- **관점**: 객관적, 비판적 시각

---

## 🔄 IAP 구매 플로우 (5단계)

```
1. 앱 시작 → IAP 초기화
   ↓
2. 포인트 바텀시트 열기 → 가격 로딩
   ↓
3. 사용자 제품 선택 → 구매 요청
   ↓
4. Google/Apple 결제창 → 결제 완료
   ↓
5. 서버 검증 → 포인트 지급 → finishTransaction
```

---

## ❌ 각 단계별 가능한 에러 케이스

---

### **1단계: 앱 시작 → IAP 초기화**

#### **시나리오 1-1: 정상 초기화**
✅ **현재 코드:**
```javascript
const result = await initConnection();
if (Platform.OS === 'android') {
  await flushFailedPurchasesCachedAsPendingAndroid();
}
```
- ✅ **대비됨**: 초기화 성공

---

#### **시나리오 1-2: IAP 초기화 실패 (Google Play 서비스 문제)**
❌ **발생 가능:**
- Google Play 서비스 비활성화
- 오래된 Google Play 서비스 버전
- 기기 미지원

❓ **현재 코드:**
```javascript
catch (error) {
  console.error('[IAPService] ❌ Failed to initialize IAP:', error);
  return false;
}
```
- ⚠️ **문제**: `return false`만 하고, 사용자에게 알림 없음
- ⚠️ **결과**: 가격이 로딩되지 않지만, 사용자는 이유를 모름

✅ **개선 필요:**
```javascript
// 초기화 실패 시 전역 상태 저장
// CompactPointPurchaseTab에서 사용자에게 명확한 안내
```

---

#### **시나리오 1-3: flushFailedPurchasesCachedAsPendingAndroid 실패**
❌ **발생 가능:**
- Android 내부 오류
- 권한 문제

❓ **현재 코드:**
```javascript
try {
  await flushFailedPurchasesCachedAsPendingAndroid();
} catch (error) {
  console.warn('[IAPService] ⚠️ Failed to clear pending purchases:', error);
}
```
- ✅ **대비됨**: try-catch로 예외 처리, 계속 진행

---

### **2단계: 포인트 바텀시트 열기 → 가격 로딩**

#### **시나리오 2-1: 정상 가격 로딩**
✅ **현재 코드:**
```javascript
const products = await getProducts({ skus: PRODUCT_ID_LIST });
```
- ✅ **대비됨**: 정상 작동

---

#### **시나리오 2-2: 가격 로딩 실패 (네트워크 문제)**
❌ **발생 가능:**
- 네트워크 연결 끊김
- Google Play Store 서버 문제

❓ **현재 코드:**
```javascript
catch (error) {
  console.error('[IAPService] ❌ Failed to load product prices:', error);
  throw error;
}
```

**CompactPointPurchaseTab.js:**
```javascript
catch (error) {
  setPriceLoadError(error.message);
}
```
- ⚠️ **문제**: 에러 메시지만 저장, UI에 명확한 안내 없음
- ⚠️ **결과**: 사용자는 "로딩 중..." 상태로 멈춤

✅ **개선 필요:**
```javascript
// 재시도 버튼 제공
// 명확한 에러 메시지 (네트워크, 서버 문제 등)
```

---

#### **시나리오 2-3: 제품이 Google Play Console에 없음**
❌ **발생 가능:**
- 제품 ID 오타
- Google Play Console에 제품 미등록
- 제품 상태가 "비활성"

❓ **현재 코드:**
```javascript
const products = await getProducts({ skus: PRODUCT_ID_LIST });
// products = []  (빈 배열)
```
- ⚠️ **문제**: 빈 배열이 반환되어도 에러 없음
- ⚠️ **결과**: 가격이 "로딩 중..." 상태로 표시

✅ **개선 필요:**
```javascript
if (products.length === 0) {
  throw new Error('제품 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
}
```

---

### **3단계: 사용자 제품 선택 → 구매 요청**

#### **시나리오 3-1: 정상 구매 요청**
✅ **현재 코드:**
```javascript
const purchaseResult = await requestPurchase({ skus: [productId] });
const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;
```
- ✅ **대비됨**: 배열/객체 모두 처리

---

#### **시나리오 3-2: 사용자가 결제 취소**
❌ **발생 가능:**
- 사용자가 "뒤로 가기" 클릭
- 결제창에서 "취소" 버튼

❓ **현재 코드:**
```javascript
if (error.message.includes('User cancelled')) {
  errorMessage = '결제가 취소되었습니다';
}
```
- ✅ **대비됨**: 명확한 메시지 표시

---

#### **시나리오 3-3: "You already own this item." 에러**
❌ **발생 가능:**
- 이전 구매가 finishTransaction 안 됨
- Google Play 동기화 지연

❓ **현재 코드:**
```javascript
// useEffect에서 clearUnfinishedPurchases() 호출
await IAPService.clearUnfinishedPurchases();
```
- ✅ **대비됨**: 앱 시작 시 자동 정리
- ⚠️ **잠재적 문제**: 사용자가 여러 번 바텀시트를 열고 닫으면?

✅ **개선 필요:**
```javascript
// 에러 발생 시 즉시 clearUnfinishedPurchases() 재호출
if (error.message.includes('already owned')) {
  await clearUnfinishedPurchases();
  // 재시도 제안
}
```

---

#### **시나리오 3-4: 네트워크 문제 (구매 요청 중)**
❌ **발생 가능:**
- Wi-Fi/모바일 데이터 끊김
- Google Play 서버 응답 없음

❓ **현재 코드:**
```javascript
if (error.message.includes('Network')) {
  errorMessage = '네트워크 연결을 확인해주세요';
}
```
- ✅ **대비됨**: 명확한 메시지
- ⚠️ **잠재적 문제**: 구매는 성공했지만 앱이 응답을 못 받았다면?

✅ **개선 필요:**
```javascript
// purchaseUpdatedListener가 이 케이스를 잡아야 함
// 현재는 로그만 찍고 있음
```

---

#### **시나리오 3-5: 구매 중 앱 종료 (백그라운드 또는 강제 종료)**
❌ **발생 가능:**
- 사용자가 홈 버튼
- 메모리 부족으로 OS가 앱 종료
- 배터리 부족으로 기기 종료

❓ **현재 코드:**
```javascript
// purchaseUpdatedListener 등록됨
purchaseUpdateSubscription = purchaseUpdatedListener((purchase) => {
  console.log('[IAPService] Purchase update:', purchase);
  if (onPurchaseUpdate) {
    onPurchaseUpdate(purchase);
  }
});
```
- ⚠️ **문제**: Listener는 로그만 찍고 실제 처리 안 함!
- ⚠️ **결과**: 다음 앱 실행 시 clearUnfinishedPurchases()가 처리하지만, 서버 검증 안 됨!

✅ **개선 필요 (CRITICAL):**
```javascript
// purchaseUpdatedListener에서 자동으로 서버 검증 시도
// 실패하면 로컬에 저장 후 다음 앱 실행 시 재시도
```

---

### **4단계: Google/Apple 결제창 → 결제 완료**

#### **시나리오 4-1: 정상 결제 완료**
✅ **현재 코드:**
```javascript
const purchase = await requestPurchaseIAP(product.productId);
const purchaseData = IAPService.extractPurchaseData(purchase, product.productId);
```
- ✅ **대비됨**: 정상 작동

---

#### **시나리오 4-2: 결제 수단 문제 (카드 한도 초과, 잔액 부족)**
❌ **발생 가능:**
- 카드 한도 초과
- 계좌 잔액 부족
- 카드 유효기간 만료

❓ **현재 코드:**
```javascript
catch (error) {
  // 일반 에러 처리
  let errorMessage = t('points.purchase_error', '충전에 실패했습니다');
}
```
- ⚠️ **문제**: Google Play가 반환하는 에러 코드를 구체적으로 파싱 안 함
- ⚠️ **결과**: 사용자는 "충전에 실패했습니다"만 보고 이유를 모름

✅ **개선 필요:**
```javascript
// Google Play 에러 코드별 메시지
// E_ITEM_UNAVAILABLE, E_SERVICE_DISCONNECTED 등
```

---

#### **시나리오 4-3: purchaseToken이 null (배열 처리 실패)**
❌ **발생 가능:**
- react-native-iap 버전 변경
- 예상치 못한 데이터 구조

❓ **현재 코드:**
```javascript
const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;
if (!purchase) {
  throw new Error('Purchase result is empty or invalid');
}
```
- ✅ **대비됨**: null 체크
- ✅ **대비됨**: Validation 추가됨

---

### **5단계: 서버 검증 → 포인트 지급 → finishTransaction**

#### **시나리오 5-1: 정상 서버 검증 및 포인트 지급**
✅ **현재 코드:**
```javascript
const verifyResponse = await fetch(IAP_ENDPOINTS.VERIFY, {...});
const verifyResult = await verifyResponse.json();
if (!verifyResult.success) {
  throw new Error(verifyResult.message || '영수증 검증에 실패했습니다');
}
await IAPService.finishTransactionIAP(purchase);
```
- ✅ **대비됨**: 정상 플로우

---

#### **시나리오 5-2: 서버 검증 실패 (네트워크 문제)**
❌ **발생 가능:**
- 서버 다운
- 네트워크 끊김
- Timeout

❓ **현재 코드:**
```javascript
const verifyResponse = await fetch(IAP_ENDPOINTS.VERIFY, {...});
```
- ⚠️ **CRITICAL 문제**: fetch 실패 시 purchase는 finishTransaction 안 됨!
- ⚠️ **결과**: 사용자는 돈 지불했지만 포인트 못 받음!
- ⚠️ **Google Play**: 3일 후 자동 환불

✅ **개선 필요 (CRITICAL):**
```javascript
// 1. 로컬 스토리지에 purchase 저장
// 2. 다음 앱 실행 시 재검증 시도
// 3. 서버 측에서 중복 검증 방지 (purchase_token 기반)
```

---

#### **시나리오 5-3: 서버 검증 중 앱 종료**
❌ **발생 가능:**
- 사용자가 강제 종료
- 메모리 부족
- 배터리 부족

❓ **현재 코드:**
```javascript
// 처리 없음
```
- ⚠️ **CRITICAL 문제**: 동일하게 purchase가 finishTransaction 안 됨!

✅ **개선 필요 (CRITICAL):**
```javascript
// 동일: 로컬 저장 + 재시도 메커니즘
```

---

#### **시나리오 5-4: 서버 검증 성공 후 finishTransaction 실패**
❌ **발생 가능:**
- Google Play API 오류
- 네트워크 문제

❓ **현재 코드:**
```javascript
await IAPService.finishTransactionIAP(purchase);
```
- ⚠️ **문제**: finishTransaction 실패 시 try-catch로 잡히지만, 사용자는 포인트를 이미 받음
- ⚠️ **결과**: 다음 구매 시 "already owned" 에러 가능

✅ **개선 필요:**
```javascript
// finishTransaction 실패 시 재시도 로직
// 최대 3회 재시도
```

---

#### **시나리오 5-5: Duplicate Receipt (중복 영수증)**
❌ **발생 가능:**
- 사용자가 네트워크 문제로 여러 번 재시도
- 악의적인 사용자가 같은 영수증 여러 번 제출

❓ **현재 코드 (서버):**
```javascript
async function checkDuplicateReceipt(purchase_token) {
  const receipts = await query(
    `SELECT receipt_key FROM iap_purchase_receipt WHERE purchase_token = ?`,
    [purchase_token]
  );
  return receipts.length > 0;
}
```
- ✅ **대비됨**: 서버에서 중복 체크

---

### **6단계: 예외 상황들**

#### **시나리오 6-1: 구매 중 바텀시트 닫기**
❌ **발생 가능:**
- 사용자가 실수로 바텀시트 닫기
- 백그라운드 전환

❓ **현재 코드:**
```javascript
// 특별한 처리 없음
```
- ⚠️ **문제**: 구매는 계속 진행 중인데 UI는 닫힘
- ⚠️ **결과**: purchaseUpdatedListener가 받지만 처리 안 함

✅ **개선 필요:**
```javascript
// 구매 진행 중에는 바텀시트 닫기 방지
// 또는 purchaseUpdatedListener에서 자동 처리
```

---

#### **시나리오 6-2: 동시에 여러 제품 구매 시도**
❌ **발생 가능:**
- 사용자가 빠르게 여러 번 클릭
- UI lag로 인한 중복 클릭

❓ **현재 코드:**
```javascript
const [loading, setLoading] = useState(false);
const [purchasingPackage, setPurchasingPackage] = useState(null);

disabled={isDisabled}
```
- ✅ **대비됨**: loading 상태로 버튼 비활성화

---

#### **시나리오 6-3: clearUnfinishedPurchases 도중 에러**
❌ **발생 가능:**
- getAvailablePurchases() 실패
- finishTransaction() 실패

❓ **현재 코드:**
```javascript
try {
  await finishTransaction({ purchase, isConsumable: true });
} catch (error) {
  console.error('[IAPService] ❌ Failed to clear purchase:', error);
}
```
- ✅ **대비됨**: 개별 try-catch로 한 개 실패해도 다른 것 계속 처리

---

## 🚨 CRITICAL 문제 요약

### **1. 서버 검증 실패 시 복구 불가 ⚠️⚠️⚠️**

**상황:**
```
사용자 결제 완료 → 서버 검증 시도 → 네트워크 에러 → finishTransaction 안 됨
결과: 돈은 지불, 포인트는 못 받음
```

**개선 필요:**
```javascript
// AsyncStorage에 pending purchase 저장
// 앱 재시작 시 자동 재검증 시도
// 서버: purchase_token 기반 중복 방지 (이미 구현됨 ✅)
```

---

### **2. purchaseUpdatedListener가 실제 처리 안 함 ⚠️⚠️**

**상황:**
```
구매 중 앱 종료 → 다음 실행 시 purchaseUpdatedListener 호출
현재: 로그만 찍음
결과: purchase는 clearUnfinishedPurchases()로 소비되지만 서버 검증 안 됨
```

**개선 필요:**
```javascript
purchaseUpdatedListener((purchase) => {
  // 자동으로 서버 검증 시도
  // 실패 시 로컬 저장
});
```

---

### **3. 가격 로딩 실패 시 UX 불명확 ⚠️**

**상황:**
```
네트워크 문제 → getProducts() 실패 → "로딩 중..." 무한 대기
```

**개선 필요:**
```javascript
// 명확한 에러 메시지 + 재시도 버튼
```

---

## ✅ 잘 구현된 부분

1. ✅ **배열/객체 처리**: Android/iOS 모두 대응
2. ✅ **중복 영수증 방지**: 서버에서 체크
3. ✅ **에러 메시지**: 사용자 친화적
4. ✅ **Loading 상태**: 중복 클릭 방지
5. ✅ **clearUnfinishedPurchases**: "already owned" 방지

---

## 📊 전체 평가

| 시나리오 | 대비 | 심각도 |
|----------|------|--------|
| 정상 플로우 | ✅ 완벽 | - |
| 사용자 취소 | ✅ 대비됨 | Low |
| "already owned" | ✅ 대비됨 | Medium |
| 구매 중 앱 종료 | ⚠️ 부분 대비 | **HIGH** |
| 서버 검증 실패 | ⚠️ 복구 불가 | **CRITICAL** |
| purchaseUpdatedListener | ⚠️ 처리 안 함 | **CRITICAL** |
| 가격 로딩 실패 | ⚠️ UX 불명확 | Medium |

---

## 🎯 결론

**현재 상태:** 70% 완성

**강점:**
- 정상 플로우는 완벽
- 기본적인 에러 처리 잘 됨
- 코드 구조 깔끔

**약점:**
- 네트워크 에러 복구 메커니즘 부족
- purchaseUpdatedListener 활용 부족
- 서버 검증 실패 시 복구 불가

**다음 단계:**
1. **CRITICAL**: 로컬 저장 + 재검증 메커니즘 구현
2. **HIGH**: purchaseUpdatedListener 자동 처리
3. **Medium**: UX 개선 (에러 메시지, 재시도 버튼)

---

**JK님, 이것이 객관적인 분석입니다.**
**어떤 부분을 먼저 개선하시겠습니까?**
