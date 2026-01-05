# 🧪 Step 1 리팩토링 테스트 가이드

**날짜:** 2026-01-05  
**작업:** 공통 함수 추출 & Cleanup 메커니즘 추가  
**백업:** `ManagerAIOverlay.BACKUP-BEFORE-STEP1.js`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 변경 사항 요약

### **✅ 새로 생성된 파일**

1. **`src/utils/chatConstants.js`** (79 lines)
   - 타이밍 상수 (TIMING)
   - AI 행동 상수 (AI_BEHAVIOR)
   - Identity Evolution 상수 (IDENTITY_EVOLUTION)
   - 채팅 히스토리 상수 (CHAT_HISTORY)
   - 특수 마커 (SPECIAL_MARKERS)
   - 헬퍼 함수 (calculateTypingDuration, calculateTotalDuration)

2. **`src/utils/chatHelpers.js`** (240 lines)
   - `CancelableTimeout` 클래스: 타이머 취소 메커니즘
   - `addAIMessageWithTyping`: 타이핑 효과 with cleanup
   - `cancelableDelay`: 취소 가능한 딜레이
   - `normalizeMessage`: 메시지 정규화
   - `createErrorMessage`: 에러 메시지 생성
   - `createUserMessage`: 사용자 메시지 생성

### **✅ ManagerAIOverlay.js 주요 변경**

1. **Imports 추가**
   - chatConstants에서 상수들 import
   - chatHelpers에서 함수들 import

2. **timeoutManager 추가**
   - `timeoutManagerRef`: 타이머 관리 ref
   - `useEffect` cleanup: 모달 닫을 때 타이머 취소

3. **handleSend 리팩토링**
   - `createUserMessage` 사용 (15 lines → 1 line)
   - `addAIMessageWithTyping` 사용 (45 lines → 15 lines)
   - `cancelableDelay` 사용 (setTimeout 중첩 제거)
   - `createErrorMessage` 사용 (8 lines → 2 lines)
   - cleanup 체크 2곳 추가

4. **handleAIContinue 리팩토링**
   - `addAIMessageWithTyping` 사용 (40 lines → 10 lines)
   - `cancelableDelay` 사용
   - cleanup 체크 3곳 추가

5. **loadChatHistory 개선**
   - `normalizeMessage` 사용 (13 lines → 1 line)
   - `CHAT_HISTORY` 상수 사용

6. **Identity Evolution 개선**
   - `timeoutManager` 사용 (cleanup 지원)
   - `IDENTITY_EVOLUTION` 상수 사용

7. **기타 함수들**
   - `calculateTotalDuration` 사용 (4곳)
   - `IDENTITY_FIELD_LABELS` 사용

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🧪 필수 테스트 시나리오

### **✅ 1. 기본 채팅 기능 테스트**

#### **1-1. 사용자 메시지 전송**
```
1. 채팅창 열기
2. 메시지 입력 후 전송
3. ✅ 확인: 사용자 메시지가 즉시 표시됨
4. ✅ 확인: 로딩 인디케이터 표시됨
5. ✅ 확인: AI 응답이 타이핑 효과와 함께 표시됨
```

**예상 동작:**
- 사용자 메시지: 즉시 추가
- AI 응답: 30ms/글자 속도로 타이핑
- 타이핑 완료 후 100ms 버퍼

#### **1-2. 이미지 포함 메시지 전송**
```
1. 이미지 선택
2. 메시지 입력 후 전송
3. ✅ 확인: 이미지가 메시지와 함께 표시됨
4. ✅ 확인: AI 응답이 정상적으로 옴
```

#### **1-3. 에러 처리**
```
1. 네트워크 끊기 (비행기 모드)
2. 메시지 전송
3. ✅ 확인: 에러 메시지가 표시됨
4. ✅ 확인: 로딩 상태가 해제됨
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### **✅ 2. AI 연속 대화 테스트**

#### **2-1. AI가 계속 말하는 경우**
```
1. AI가 continue_conversation=true로 응답하도록 유도
2. ✅ 확인: AI 응답 후 800ms 후 자동으로 다음 메시지
3. ✅ 확인: 최대 5번까지만 연속 (AI_BEHAVIOR.MAX_CONTINUES)
4. ✅ 확인: 6번째는 자동으로 멈춤
```

**예상 동작:**
- 1번째 AI 응답 → 800ms 딜레이 → 2번째 AI 응답
- 5번째 AI 응답 → 멈춤 (더 이상 자동 전송 안 함)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### **🔥 3. Cleanup 메커니즘 테스트 (가장 중요!)**

#### **3-1. 타이핑 중 모달 닫기**
```
1. 메시지 전송 (긴 텍스트)
2. AI 응답 타이핑 시작됨 (10초 걸림)
3. 타이핑 중간 (5초 후)에 채팅창 닫기
4. ✅ 확인: 에러 없이 즉시 닫힘
5. ✅ 확인: 백그라운드에서 타이머가 실행되지 않음
6. 다시 채팅창 열기
7. ✅ 확인: 정상 동작
```

**예상 동작:**
- 타이머가 즉시 취소됨
- 상태 업데이트가 멈춤
- 메모리 누수 없음

#### **3-2. AI 연속 대화 중 모달 닫기**
```
1. AI가 계속 말하도록 유도 (continue_conversation=true)
2. AI가 2번째 메시지 타이핑 중일 때 채팅창 닫기
3. ✅ 확인: 에러 없이 즉시 닫힘
4. ✅ 확인: 3번째, 4번째 메시지가 백그라운드에서 전송되지 않음
5. 다시 채팅창 열기
6. ✅ 확인: 정상 동작
```

**예상 동작:**
- 모든 예약된 타이머가 취소됨
- API 호출이 멈춤 (이미 진행 중인 것은 완료되지만 결과 무시)
- 상태 업데이트가 멈춤

#### **3-3. Identity Evolution 표시 중 모달 닫기**
```
1. Identity Evolution이 발생하는 메시지 전송
2. Evolution 알림이 표시되는 중 (3초 간격으로 여러 개)
3. 첫 번째 알림 표시 중에 채팅창 닫기
4. ✅ 확인: 에러 없이 즉시 닫힘
5. ✅ 확인: 두 번째, 세 번째 알림이 표시되지 않음
```

**예상 동작:**
- 모든 Identity Evolution 타이머가 취소됨
- 알림이 더 이상 표시되지 않음

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### **✅ 4. 채팅 히스토리 테스트**

#### **4-1. 히스토리 로드**
```
1. 채팅창 열기
2. ✅ 확인: 최근 100개 메시지가 로드됨 (CHAT_HISTORY.INITIAL_LIMIT)
3. ✅ 확인: 메시지가 올바른 형식으로 표시됨 (normalizeMessage)
4. ✅ 확인: 이미지, 음악, 비디오 등 Rich Content가 표시됨
```

#### **4-2. 더 보기**
```
1. 스크롤을 최상단으로 올림
2. "더 보기" 트리거
3. ✅ 확인: 20개 메시지가 추가 로드됨 (CHAT_HISTORY.LOAD_MORE_LIMIT)
4. ✅ 확인: 스크롤 위치가 유지됨
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### **✅ 5. Rich Content 테스트**

#### **5-1. 음악 버블**
```
1. 음악이 포함된 AI 응답 받기
2. ✅ 확인: 음악 버블이 표시됨
3. 음악 버블 클릭
4. ✅ 확인: MiniMusicWidget이 표시됨
5. ✅ 확인: 음악 재생됨
```

#### **5-2. YouTube 버블**
```
1. YouTube가 포함된 AI 응답 받기
2. ✅ 확인: YouTube 버블이 표시됨
3. YouTube 버블 클릭
4. ✅ 확인: YouTube 플레이어가 표시됨
```

#### **5-3. Pixabay 이미지**
```
1. 이미지 생성 요청
2. ✅ 확인: 생성된 이미지가 AI 메시지 버블에 표시됨
3. ✅ 확인: 크레딧 정보가 표시됨
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### **✅ 6. 채팅 제한 테스트**

#### **6-1. 정상 전송**
```
1. 채팅 제한에 여유가 있는 상태
2. 메시지 전송
3. ✅ 확인: 정상 전송됨
4. ✅ 확인: 채팅 카운트 증가 (incrementChatCount)
```

#### **6-2. 제한 도달**
```
1. 채팅 제한 소진
2. 메시지 전송 시도
3. ✅ 확인: 메시지가 전송되지 않음
4. ✅ 확인: 사용자 메시지가 UI에서 제거됨 (revert)
5. ✅ 확인: ChatLimitSheet이 표시됨
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🐛 디버깅 가이드

### **문제 1: 타이핑 효과가 작동하지 않음**

**증상:**
- AI 응답이 타이핑 없이 즉시 표시됨

**확인 사항:**
1. `calculateTotalDuration` 함수가 올바른 값을 반환하는지 확인
2. `addAIMessageWithTyping`이 호출되는지 확인
3. `timeoutManagerRef.current`가 null이 아닌지 확인

**해결 방법:**
```javascript
// chatConstants.js에서 TIMING.TYPING_SPEED 확인
export const TIMING = {
  TYPING_SPEED: 30, // ms per character (이 값이 0이면 즉시 표시됨)
  TYPING_BUFFER: 100,
  // ...
};
```

### **문제 2: 모달 닫을 때 에러 발생**

**증상:**
- 채팅창 닫을 때 "Can't perform a React state update on an unmounted component" 에러

**확인 사항:**
1. `timeoutManagerRef.current.cancelAll()`이 호출되는지 확인
2. `timeoutManagerRef.current.isCancelledStatus()`가 올바르게 체크되는지 확인

**해결 방법:**
```javascript
// ManagerAIOverlay.js의 useEffect cleanup 확인
useEffect(() => {
  if (visible && !timeoutManagerRef.current) {
    timeoutManagerRef.current = new CancelableTimeout();
  }
  
  return () => {
    if (timeoutManagerRef.current) {
      timeoutManagerRef.current.cancelAll(); // ✅ 이게 호출되는지 확인
      timeoutManagerRef.current = null;
    }
  };
}, [visible]);
```

### **문제 3: AI 연속 대화가 멈추지 않음**

**증상:**
- AI가 5번 이상 계속 말함

**확인 사항:**
1. `AI_BEHAVIOR.MAX_CONTINUES` 값 확인
2. `aiContinueCountRef.current` 증가 확인
3. `handleAIContinue`의 체크 로직 확인

**해결 방법:**
```javascript
// chatConstants.js에서 MAX_CONTINUES 확인
export const AI_BEHAVIOR = {
  MAX_CONTINUES: 5, // Maximum number of continuous AI messages
};

// ManagerAIOverlay.js의 handleAIContinue 확인
if (aiContinueCountRef.current >= AI_BEHAVIOR.MAX_CONTINUES) {
  setIsAIContinuing(false);
  aiContinueCountRef.current = 0;
  setIsLoading(false);
  return; // ✅ 여기서 멈춰야 함
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 성능 확인

### **1. 메모리 누수 확인**

**React DevTools Profiler 사용:**
```
1. 채팅창 열기/닫기를 10회 반복
2. React DevTools에서 메모리 확인
3. ✅ 확인: 메모리가 일정하게 유지됨
4. ✅ 확인: 컴포넌트가 정상적으로 unmount됨
```

### **2. 타이머 확인**

**Chrome DevTools Performance 사용:**
```
1. Performance 탭 열기
2. 녹화 시작
3. 메시지 전송 → 타이핑 중 → 채팅창 닫기
4. 녹화 중지
5. ✅ 확인: 채팅창 닫은 후 타이머가 실행되지 않음
```

### **3. Re-render 확인**

**React DevTools Profiler 사용:**
```
1. Profiler 녹화 시작
2. 메시지 전송
3. AI 응답 받기
4. 녹화 중지
5. ✅ 확인: 불필요한 re-render가 없음
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✅ 테스트 체크리스트

### **기능 테스트**
- [ ] 1-1. 사용자 메시지 전송
- [ ] 1-2. 이미지 포함 메시지 전송
- [ ] 1-3. 에러 처리
- [ ] 2-1. AI 연속 대화
- [ ] 4-1. 히스토리 로드
- [ ] 4-2. 더 보기
- [ ] 5-1. 음악 버블
- [ ] 5-2. YouTube 버블
- [ ] 5-3. Pixabay 이미지
- [ ] 6-1. 정상 전송 (채팅 제한)
- [ ] 6-2. 제한 도달

### **Cleanup 테스트 (가장 중요!)**
- [ ] 3-1. 타이핑 중 모달 닫기
- [ ] 3-2. AI 연속 대화 중 모달 닫기
- [ ] 3-3. Identity Evolution 표시 중 모달 닫기

### **성능 테스트**
- [ ] 메모리 누수 없음
- [ ] 타이머 정상 취소됨
- [ ] 불필요한 re-render 없음

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚨 롤백 방법 (문제 발생 시)

```bash
# 백업 파일로 복원
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile
cp src/components/chat/ManagerAIOverlay.BACKUP-BEFORE-STEP1.js src/components/chat/ManagerAIOverlay.js

# 새로 생성된 파일 삭제
rm src/utils/chatConstants.js
rm src/utils/chatHelpers.js
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📝 다음 단계

**Step 1 테스트가 완료되면:**

1. ✅ 모든 테스트 통과 확인
2. ✅ Git commit
3. ✅ Step 2로 진행 (Rich Content 파싱 함수 분리)

**또는**

- 문제 발견 시 즉시 수정
- 필요하면 롤백 후 재시도

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**작성일:** 2026-01-05  
**작성자:** Hero Nexus AI & JK  
**버전:** Step 1 - Cleanup & Common Functions

