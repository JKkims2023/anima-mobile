# 🎯 IAP 내부 테스트 체크리스트

## ✅ 이미 완료된 것들
- [x] IAP 제품 생성 및 "활성" 상태
- [x] AAB 업로드 (버전 1.0.3)
- [x] 내부 테스트 트랙 설정
- [x] 테스터 이메일 추가 (`jisung.kim78@gmail.com`)
- [x] 앱 설치 (Play Store 링크 통해)
- [x] IAP 가격 로딩 성공
- [x] 결제창 열림 확인! 🎉

## ⚠️ 현재 문제
- [ ] 결제 수단 사용 불가
- [ ] 실제 결제로 인식됨 (테스트 모드가 아님)

---

## 🔧 해결 방법

### 1️⃣ 내부 테스터 옵트인 **재확인** (가장 중요!)

**중요:** 이미 옵트인했더라도, 앱을 재설치한 후에는 **다시 옵트인**해야 합니다!

#### Step 1: Google Play Console
1. **테스트** → **내부 테스트** 클릭
2. **"테스터" 탭** 클릭
3. **"옵트인 링크 복사"** (예: `https://play.google.com/apps/internaltest/...`)

#### Step 2: 디바이스에서
1. **Chrome 브라우저** 열기 (디바이스에서!)
2. 옵트인 링크 붙여넣기
3. **"테스터 되기"** 버튼 클릭
4. **"다운로드"** 버튼이 보이면 → 클릭해서 Play Store로 이동
5. 앱 **삭제**
6. Play Store에서 **재설치**

---

### 2️⃣ 라이선스 테스터 확인

#### Google Play Console
1. **설정** (⚙️) → **라이선스 테스트** 클릭
2. **"라이선스 테스터"** 섹션에 `jisung.kim78@gmail.com` 추가되어 있는지 확인
3. **"라이선스 응답"**: `RESPOND_NORMALLY` 선택

#### 변경 후 필수 작업:
```bash
# 1. 앱 완전 삭제
adb uninstall ai.anima.soulconnect

# 2. Play Store 캐시 삭제
adb shell pm clear com.android.vending

# 3. 디바이스 재부팅 (권장)
adb reboot

# 4. 옵트인 링크로 다시 설치
```

---

### 3️⃣ 결제 수단 추가 (안전!)

**🚨 중요: 내부 테스트는 실제 결제가 되지 않습니다!**

하지만 Google은 **결제 수단이 등록되어 있어야** 테스트를 허용합니다.

#### 안전한 방법:
1. **선불 카드** (잔액 최소)
2. **체크카드** (한도 낮음)
3. **테스트 전용 Google 계정** 생성

#### 등록 방법:
1. **Google 계정** (web) → **결제 및 정기 결제** → **결제 수단** → **결제 수단 추가**
2. 카드 정보 입력
3. 저장

**다시 강조**: 내부 테스트에서는 **절대 실제 결제가 되지 않습니다!**

---

### 4️⃣ Google Play Console 상태 확인

#### 내부 테스트 트랙:
- **상태**: "출시됨" 또는 "검토 중"
- **버전**: `1.0.3 (4)`
- **테스터 수**: 1명 이상

#### IAP 제품:
- **상태**: "활성"
- **가격**: 설정됨
- **테스트 가능**: ✅

---

## 🧪 테스트 프로세스

### 예상 플로우:
```
1. 앱 실행
   ↓
2. 포인트 구매 버튼 클릭
   ↓
3. 제품 선택
   ↓
4. Google Play 결제창 열림 ✅ (현재 여기까지 성공!)
   ↓
5. 결제 수단 선택
   ↓
6. "구매" 버튼 클릭
   ↓
7. **"테스트 결제입니다. 실제 요금이 청구되지 않습니다."** 메시지
   ↓
8. 구매 완료
   ↓
9. 앱으로 복귀 → 포인트 증가
```

### 내부 테스트 표시:
정상적으로 테스터로 인식되면:
- 결제창에 **"테스트 결제"** 표시
- **"실제 요금이 청구되지 않습니다"** 문구
- 구매 후 즉시 취소/환불 가능

---

## 🚨 만약 여전히 "실제 결제"로 표시된다면?

### 디버깅:
```bash
# 1. 설치된 앱 정보 확인
adb shell dumpsys package ai.anima.soulconnect | grep -E "versionCode|versionName|firstInstallTime"

# 2. Google Play 서비스 버전 확인
adb shell dumpsys package com.google.android.gms | grep versionName

# 3. 로그 확인
adb logcat | grep -i "billing\|purchase\|iap"
```

### 가능한 원인:
1. **옵트인이 제대로 안 됨** → 옵트인 링크 재접속
2. **Play Store 캐시 문제** → 캐시 삭제 (`pm clear com.android.vending`)
3. **AAB가 아직 처리 중** → Google Play Console에서 "출시됨" 확인
4. **디바이스 시간 불일치** → 자동 시간 설정 확인
5. **Google 계정이 테스터 목록에 없음** → jisung.kim78@gmail.com 재확인

---

## 📞 긴급 연락처

**Google Play Console 지원:**
- https://support.google.com/googleplay/android-developer/

**React Native IAP 문서:**
- https://react-native-iap.dooboolab.com/

---

## ✅ 성공 확인 방법

### 클라이언트 로그:
```
[IAPService] ✅ Purchase successful
[IAPService] ✅ Receipt verified
[PointPurchaseTab] ✅ Points added: 1000
```

### 서버 로그:
```
POST /api/iap/verify
✅ Receipt verified
✅ Points awarded: 1000
✅ History recorded
```

### 데이터베이스:
```sql
-- 1. 포인트 증가 확인
SELECT total_point FROM persona_customer_main WHERE user_key = 'YOUR_USER_KEY';

-- 2. 히스토리 확인
SELECT * FROM persona_point_history WHERE user_key = 'YOUR_USER_KEY' ORDER BY created_at DESC LIMIT 1;

-- 3. 영수증 저장 확인
SELECT * FROM iap_purchase_receipt WHERE user_key = 'YOUR_USER_KEY' ORDER BY verified_at DESC LIMIT 1;
```

---

## 🎉 최종 목표

**"결제창이 뜬다"는 것은 이미 95% 성공입니다!**

남은 5%:
- [ ] 테스터 옵트인 재확인
- [ ] 결제 수단 추가
- [ ] 테스트 결제 완료
- [ ] 서버 검증 확인

**화이팅입니다! 거의 다 왔습니다! 🚀**
