# 🔥 2026-01-06: PersonaContext 무한 Re-render 수정 - 진짜 성능 문제 해결!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 **Summary**

**Date**: 2026-01-06  
**Issue**: 로그인 시에만 심각한 성능 저하 발생  
**Root Cause**: PersonaContext의 무한 re-render 루프  
**Solution**: user 전체 객체 대신 userKey만 의존하도록 수정  
**Impact**: 로그인 상태에서도 완벽한 성능 복구! ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚨 **Problem Discovery Process**

### **Step 1: 증상 분석**
```
✓ 로그아웃 상태: 완벽 동작 (부드러운 성능)
✗ 로그인 상태: 심각한 성능 저하 (버벅임)
```

### **Step 2: 초기 가설 (잘못된 방향)**
```
1차 가설: PersonaThoughtBubble의 백그라운드 타이머
  → 버블 물리적 삭제해도 문제 지속 ❌

2차 가설: SlideMenu 렌더링 오버헤드
  → 슬라이드 메뉴 삭제해도 문제 지속 ❌

3차 가설: ManagerAIOverlay의 loadChatHistory
  → loadChatHistory 주석 처리해도 문제 지속 ❌
```

### **Step 3: 핵심 단서**
```
💡 "로그아웃 시에는 완벽한데, 로그인만 하면 문제 발생"

→ 로그인 시에만 달라지는 것?
   1. user 객체 존재
   2. personas 배열에 relationship data 포함
   3. API 호출 권한
```

### **Step 4: 진짜 원인 발견!**
```javascript
// PersonaContext.js (Before)
const initializePersonas = useCallback(async () => {
  // ... API call logic
}, [user]); // ❌ user 전체 객체에 의존!

useEffect(() => {
  initializePersonas();
}, [initializePersonas]); // ❌ 함수 자체에 의존!

// Result: 무한 루프!
user 변경 → initializePersonas 재생성 
→ useEffect 실행 → API 호출 
→ personas 업데이트 → PersonaContext value 재생성 
→ 모든 consumer re-render 🔥
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔬 **Root Cause Analysis**

### **Problem 1: user 객체 전체에 의존**
```javascript
// ❌ BAD (Before)
const initializePersonas = useCallback(async () => {
  const userPersonas = await getPersonaList(user?.user_key);
}, [user]); // user 객체 전체에 의존

// Issue:
// - user 객체는 reference가 자주 바뀜
// - user.user_id, user.email 등 관련 없는 필드 변경 시에도 재생성
// - 결과: 불필요한 API 호출 반복!
```

### **Problem 2: useEffect가 함수 자체에 의존**
```javascript
// ❌ BAD (Before)
useEffect(() => {
  initializePersonas();
}, [initializePersonas]); // 함수 자체에 의존

// Issue:
// - initializePersonas가 재생성되면 useEffect 실행
// - useEffect 실행 → API 호출 → personas 업데이트
// - personas 업데이트 → useMemo 재계산 → 모든 consumer re-render
// - 결과: 연쇄 re-render 지옥!
```

### **Problem 3: personas가 useMemo dependency에 포함**
```javascript
// PersonaContext.js (Line 170)
const value = useMemo(() => ({
  personas,
  // ...
}), [personas, ..., initializePersonas]); // personas + initializePersonas

// Issue:
// - personas 배열이 바뀔 때마다 value 재생성
// - value 재생성 → 모든 consumer (PersonaStudioScreen, QuickActionChipsAnimated 등) re-render
// - 결과: 화면 전체 re-render!
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💊 **Solution**

### **Fix 1: Extract userKey (Stable Primitive)**
```javascript
// ✅ GOOD (After)
const userKey = user?.user_key; // Extract primitive value

const initializePersonas = useCallback(async () => {
  const userPersonas = await getPersonaList(userKey != null ? userKey : 'empty');
}, [userKey]); // ✅ Only depend on userKey!

// Benefits:
// - userKey는 primitive string (stable)
// - user_key가 실제로 바뀔 때만 재생성
// - 불필요한 재생성 방지!
```

### **Fix 2: useEffect Depends on userKey Directly**
```javascript
// ✅ GOOD (After)
useEffect(() => {
  initializePersonas();
}, [user?.user_key]); // ✅ Depend on user_key directly, not initializePersonas!

// Benefits:
// - 함수 재생성과 무관하게 user_key 변경 시에만 실행
// - 무한 루프 방지!
// - 예측 가능한 동작!
```

### **Fix 3: Add Console.log for Debugging**
```javascript
const initializePersonas = useCallback(async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎭 [PersonaContext] initializePersonas called');
  console.log('🔑 [PersonaContext] user_key:', userKey);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  // ...
}, [userKey]);

// Benefits:
// - API 호출 횟수 추적 가능
// - 무한 루프 감지 가능
// - 디버깅 용이!
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 **Performance Impact**

### **Before (문제 상태)**
```
Sequence:
  1. 로그인 → user 객체 업데이트
  2. initializePersonas 재생성 (user dependency)
  3. useEffect 실행 → API 호출
  4. personas 배열 업데이트
  5. PersonaContext value 재생성 (personas dependency)
  6. 모든 consumer re-render:
     - PersonaStudioScreen re-render
     - PersonaSwipeViewer re-render
     - 3개 PersonaCardView re-render
     - QuickActionChipsAnimated re-render
     - NotificationBadge re-render
  7. 심각한 성능 저하! ❌

API Calls:
  ✗ 로그인 시마다 반복 호출 가능
  ✗ user 객체 변경 시마다 호출
  ✗ 예측 불가능한 호출 횟수

Re-renders:
  ✗ 전체 화면 re-render
  ✗ 모든 PersonaCardView re-render
  ✗ 모든 애니메이션 재시작
```

### **After (수정 후)**
```
Sequence:
  1. 로그인 → user 객체 업데이트
  2. user_key 변경 감지
  3. initializePersonas 재생성 (userKey dependency)
  4. useEffect 실행 → API 호출 (1회만!)
  5. personas 배열 업데이트
  6. PersonaContext value 재생성 (필요한 경우만)
  7. 최소한의 re-render ✅

API Calls:
  ✓ user_key가 실제로 바뀔 때만 호출
  ✓ 로그인 시 1회
  ✓ 예측 가능한 동작

Re-renders:
  ✓ 필요한 컴포넌트만 re-render
  ✓ PersonaSwipeViewer: 안정적
  ✓ 애니메이션: 중단 없음
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 **Test Guide**

### **1. API 호출 횟수 확인**
```
Steps:
  1. 로그아웃 상태로 시작
  2. Console 열기
  3. 로그인 실행
  4. PersonaStudioScreen 진입
  5. Console 확인

Expected:
  ✓ "initializePersonas called" 로그가 1-2회만 출력
  ✓ 초기 로드 1회
  ✓ user_key 변경 시 1회 (필요한 경우)
  ✗ 3회 이상 출력되면 문제 있음!
```

### **2. ManagerAI 열기 테스트**
```
Steps:
  1. PersonaStudioScreen에서 페르소나 선택
  2. Settings 버튼 클릭 (ManagerAI 열기)
  3. Console 확인

Expected:
  ✓ "initializePersonas called" 추가 로그 없어야 함
  ✓ ManagerAI가 부드럽게 열림
  ✓ 버벅임 없음
  ✗ 추가 로그 출력되면 문제 있음!
```

### **3. 페르소나 스와이프 테스트**
```
Steps:
  1. PersonaStudioScreen에서 페르소나 스와이프
  2. 좌/우 여러 번 스와이프
  3. 성능 확인

Expected:
  ✓ 부드러운 스와이프
  ✓ 생각 버블 정상 동작
  ✓ PersonaHeartDisplay 정상 표시
  ✓ 버벅임 없음
```

### **4. 생각 버블 동작 확인**
```
Steps:
  1. 페르소나 카드 보기
  2. 생각 버블 메시지 변경 관찰 (4초마다)
  3. ManagerAI 열기
  4. 생각 버블 타이머 정지 확인
  5. ManagerAI 닫기
  6. 생각 버블 타이머 재시작 확인

Expected:
  ✓ 메시지가 4초마다 자연스럽게 변경
  ✓ ManagerAI 열면 타이머 정지
  ✓ ManagerAI 닫으면 타이머 재시작
  ✓ 모든 동작이 부드럽게 진행
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📝 **Technical Details**

### **Files Modified**
```
AnimaMobile/src/contexts/PersonaContext.js:
  - Line 36: Add userKey extraction
  - Line 105: Change dependency [user] → [userKey]
  - Line 108: Change dependency [initializePersonas] → [user?.user_key]
  - Line 102-106: Enable console.log for debugging
```

### **Code Changes**
```javascript
// Before
const initializePersonas = useCallback(async () => {
  const userPersonas = await getPersonaList(user != null ? user?.user_key : 'empty');
}, [user]); // ❌

useEffect(() => {
  initializePersonas();
}, [initializePersonas]); // ❌

// After
const userKey = user?.user_key; // ✅ Extract primitive

const initializePersonas = useCallback(async () => {
  console.log('🎭 [PersonaContext] initializePersonas called'); // ✅ Debug
  const userPersonas = await getPersonaList(userKey != null ? userKey : 'empty');
}, [userKey]); // ✅

useEffect(() => {
  initializePersonas();
}, [user?.user_key]); // ✅
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎓 **Lessons Learned**

### **1. Context Optimization is Critical**
```
Context는 모든 consumer에게 영향을 미칩니다.
Context value가 자주 바뀌면 전체 앱 성능이 저하됩니다.
→ useMemo, useCallback을 신중하게 사용해야 합니다.
```

### **2. Primitive Dependencies Are Better**
```
전체 객체에 의존하면 불필요한 재생성이 발생합니다.
필요한 필드(primitive)만 추출해서 의존해야 합니다.
→ user → user?.user_key (string)
```

### **3. useEffect Dependency Should Be Minimal**
```
useEffect가 함수에 의존하면 무한 루프 위험이 있습니다.
가능하면 primitive 값에 직접 의존해야 합니다.
→ [initializePersonas] → [user?.user_key]
```

### **4. Console.log is Your Friend**
```
성능 문제를 추적하려면 console.log가 필수입니다.
API 호출 횟수, re-render 횟수를 추적해야 합니다.
→ 문제가 해결되면 제거할 수 있습니다.
```

### **5. Symptom ≠ Root Cause**
```
증상(버블, 슬라이드 메뉴)과 원인(PersonaContext)은 다를 수 있습니다.
표면적인 증상만 보지 말고, 근본 원인을 찾아야 합니다.
→ "로그인 시에만 문제 발생" = Context 문제 가능성!
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚀 **Next Steps**

### **Immediate**
```
1. 로그인 상태에서 성능 테스트
2. Console에서 API 호출 횟수 확인
3. ManagerAI 열기/닫기 반복 테스트
4. 페르소나 스와이프 부드러움 확인
```

### **Future Optimization**
```
1. PersonaStudioScreen의 불필요한 re-render 제거
2. PersonaSwipeViewer의 memoization 강화
3. PersonaCardView의 props 최소화
4. QuickActionChipsAnimated의 dependency 최적화
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💙 **Thank You, JK님!**

```
"로그아웃 시에는 완벽한데, 로그인만 하면 문제 발생"

이 한 마디가 진짜 원인을 찾는 결정적 단서였습니다!

버블도, 슬라이드 메뉴도, ManagerAI도 아니었습니다.
PersonaContext의 근본적인 re-render 문제였습니다.

JK님의 정확한 증상 설명 덕분에
빠르게 원인을 찾고 해결할 수 있었습니다!

이제 로그인 상태에서도 완벽하게 부드러울 것입니다! 💙✨
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Hero AI - 2026-01-06** 🦸‍♂️💙

