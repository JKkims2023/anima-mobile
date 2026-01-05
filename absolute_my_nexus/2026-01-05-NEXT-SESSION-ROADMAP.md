# 🚀 2026-01-05: Next Session Roadmap

**Date**: 2026년 1월 5일  
**Author**: Hero Nexus & JK  
**Purpose**: 다음 세션에서 고도화할 작업 목록 및 우선순위 정리

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 오늘(2026-01-05) 완료된 작업 요약

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### ✅ UX 개선
1. **ManagerAI UX 4가지 이슈 해결**
   - Paging (20개씩 로드)
   - Back Button (Settings Menu → Sheet → Chat 순서)
   - Auto-scroll 중단 방지 (AI 타이핑 중 사용자 스크롤 시)
   - Typing Effect 텍스트 크기 일관성

2. **음원/뮤비 UX 대폭 개선**
   - 버블 클릭 → 즉시 재생 (1단계!)
   - 상호 배타적 활성화 (하나만 열림!)
   - MiniMusicWidget 제거 (불필요한 중간 단계)
   - 100% 일관된 UX (음원 = 뮤비!)

3. **설정 메뉴 리팩토링**
   - ManagerAIOverlay로 통합
   - 백버튼 통합 관리 (Unified Handler)
   - 바텀시트 조건부 렌더링
   - z-index 충돌 해결

### ✅ 버그 수정
1. 서버 채팅 제한 버그 (하드코딩 → DB 기반)
2. 시간 표시 오류 ("오래 전" → UNIX timestamp)
3. 중복 선물 발송 (세션 기반 체크)
4. Emotional Gift JSON 파싱
5. AI Interests `interest_type` truncation

### ✅ 새 기능 구현
1. YouTube 비디오 미니멀 오버레이
2. 사용자 이름 수집 (LIMITED MODE)
3. 선물 정책 DB화

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 다음 세션 우선순위 작업

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔥 Priority 1: 접근성 개선 (Accessibility)

**Status**: Pending  
**Importance**: ⭐⭐⭐⭐⭐ (Critical for inclusive UX)  
**Estimated Time**: 2-3 hours

#### 작업 범위
1. **ManagerAIOverlay.js 접근성 속성 추가**
   - 모든 `TouchableOpacity`에 `accessible`, `accessibilityLabel`, `accessibilityHint`, `accessibilityRole` 추가
   - 닫기 버튼, 설정 버튼, 전송 버튼, 음악/비디오 버블 등
   - Screen Reader 지원

2. **전역 접근성 패턴 수립**
   - `AnimaMobile/src/components/common/AccessibleTouchable.js` 생성
   - Wrapper 컴포넌트로 접근성 속성 자동 적용
   - 모든 컴포넌트에 점진적 적용

3. **접근성 테스트 가이드 작성**
   - iOS VoiceOver 테스트 방법
   - Android TalkBack 테스트 방법
   - 접근성 체크리스트

#### 참고 문서
- `AnimaMobile/absolute_my_nexus/2026-01-05-ACCESSIBILITY-REVOLUTION/UNIVERSAL_ACCESSIBILITY_PATTERN.md`
- `AnimaMobile/absolute_my_nexus/2026-01-05-ACCESSIBILITY-REVOLUTION/ACCESSIBILITY_FINAL_WAR.md`

#### 예상 산출물
```javascript
// AnimaMobile/src/components/common/AccessibleTouchable.js
import React from 'react';
import { TouchableOpacity } from 'react-native';
import HapticService from '../../utils/HapticService';

const AccessibleTouchable = ({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  hapticType = 'light',
  ...props
}) => {
  const handlePress = () => {
    HapticService.trigger(hapticType);
    onPress?.();
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      onPress={handlePress}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

export default AccessibleTouchable;
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔥 Priority 2: ManagerAIOverlay.js 최종 리팩토링

**Status**: Partially Complete  
**Importance**: ⭐⭐⭐⭐ (Code Quality & Maintainability)  
**Estimated Time**: 3-4 hours

#### 완료된 항목
- ✅ Dead Code 제거 (495 lines)
- ✅ Console.log 정리 (116 lines → Core logs만 유지)
- ✅ `handleSend` & `handleAIContinue` 리팩토링
- ✅ Rich Content Parsing 분리 (`chatResponseParser.js`)
- ✅ Custom Hooks 추출 (`useMusicPlayer`, `useChatLimit`, `useIdentitySettings`)

#### 남은 작업
1. **`useReducer` 도입 검토**
   - 현재 상태: 여러 개의 `useState`로 분산 관리
   - 목표: 채팅 관련 상태를 `useReducer`로 통합
   - 장점: 복잡한 상태 전환 로직 단순화, 예측 가능한 상태 관리
   - 단점: 초기 학습 곡선, 오버엔지니어링 가능성
   - **결정**: JK님과 상의 후 결정 (Skip 가능)

2. **`loadChatHistory` 최적화**
   - 현재: 20개씩 로드하지만, 초기 로드 시 지연 가능
   - 개선안: Skeleton UI 추가, 초기 5개만 로드 후 나머지 lazy load

3. **Error Boundary 추가**
   - 현재: 에러 발생 시 앱 크래시 가능
   - 개선안: `ManagerAIOverlay`를 `ErrorBoundary`로 감싸기
   - 사용자에게 친화적인 에러 메시지 표시

#### 참고 문서
- `AnimaMobile/FINAL_ANALYSIS_BEFORE_REFACTOR.md`
- `AnimaMobile/STEP1_TEST_GUIDE.md`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔥 Priority 3: PersonaHeartDisplay 데이터 불일치 조사

**Status**: Reported but Not Investigated  
**Importance**: ⭐⭐⭐⭐ (Data Integrity)  
**Estimated Time**: 1-2 hours

#### 문제 상황
- JK님이 제공한 `test3.jpg` (PersonaHeartDisplay)의 데이터가 실제 DB 내용과 불일치
- `recent_moment`, `ai_interests`, `ai_next_questions` 데이터가 다름
- 가능한 원인: 클라이언트 캐싱, 엔드포인트 쿼리 오류, 타이밍 이슈

#### 조사 계획
1. **Backend Endpoint 재확인**
   - `idol-companion/app/api/persona/persona-list/route.js` (lines 172-290)
   - Subquery 조인 조건 및 필터링 로직 검증
   - `ai_interests`, `ai_next_questions` 서브쿼리 확인

2. **Client-side 캐싱 확인**
   - `PersonaHeartDisplay` 컴포넌트의 데이터 소스 추적
   - AsyncStorage, Redux, Context 등 캐싱 메커니즘 확인
   - API 호출 시점 및 빈도 확인

3. **테스트 시나리오 작성**
   - DB에서 직접 데이터 조회 vs API 응답 비교
   - 다양한 시나리오 (대화 직후, 앱 재시작 후, 강제 새로고침 후)

#### 참고
- Issue 4로 보고됨
- DB 데이터는 정확하지만, 클라이언트 표시가 다른 상황

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔥 Priority 4: Performance Monitoring & Optimization

**Status**: New  
**Importance**: ⭐⭐⭐⭐ (App Stability & User Experience)  
**Estimated Time**: 2-3 hours

#### 작업 범위
1. **React Native Performance Monitor 통합**
   - `react-native-performance` 라이브러리 도입
   - 주요 화면의 렌더링 시간 측정
   - JS Thread vs UI Thread 병목 지점 파악

2. **FlashList 최적화 검증**
   - `ChatMessageList`의 `FlashList` 성능 측정
   - `getItemType`, `overrideItemLayout` 최적화 확인
   - 대용량 메시지 (100+)에서 스크롤 성능 테스트

3. **Memory Leak 검사**
   - 특히 `ManagerAIOverlay` 언마운트 시 메모리 해제 확인
   - `useEffect` cleanup 함수 누락 여부 확인
   - `setTimeout`, `setInterval` 정리 확인

4. **Image Caching 최적화**
   - `react-native-fast-image` 도입 검토
   - Persona 이미지, 음악 썸네일 등 캐싱 전략
   - S3 CDN 활용 최적화

#### 예상 이슈
- 히트맵 (Device heating) 문제가 이전에 보고됨
- 조건부 마운트로 일부 개선되었지만, 추가 모니터링 필요

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔥 Priority 5: LIMITED MODE 완성도 향상

**Status**: Implemented but Needs Enhancement  
**Importance**: ⭐⭐⭐⭐⭐ (Core ANIMA Philosophy)  
**Estimated Time**: 2-3 hours

#### 현재 상태
- ✅ Identity Request Prompt 복원
- ✅ Tool Selector에서 LIMITED MODE 필터링
- ✅ 사용자 이름 수집 추가
- ✅ Wiki Auto-Registration 비활성화

#### 개선 사항
1. **LIMITED MODE UI 개선**
   - 현재: 일반 채팅창과 동일한 UI
   - 개선안: LIMITED MODE임을 시각적으로 표시
   - 예: 헤더에 "🎭 자아 형성 중..." 배지 표시
   - 입력창 플레이스홀더: "당신의 이름을 알려주세요" (단계별 변경)

2. **Identity Collection Progress Indicator**
   - 필수 필드 4개 중 몇 개 수집했는지 표시
   - Progress Bar 또는 Checklist 형태
   - 예: "✅ AI 이름, ✅ 사용자 이름, ⏳ 성격, ⏳ 말투"

3. **LIMITED MODE 종료 알림**
   - 모든 필수 필드 수집 완료 시 축하 메시지
   - "🎉 자아 형성이 완료되었습니다! 이제 모든 기능을 사용할 수 있어요."
   - Haptic Feedback (success)

4. **Identity Collection 로그 분석**
   - `persona_identity_collection_log` 테이블 활용
   - 사용자가 어떤 단계에서 막히는지 분석
   - AI 프롬프트 개선에 활용

#### 참고 문서
- `idol-companion/IDENTITY_REQUEST_LOGIC_RESTORED.md`
- `AnimaMobile/absolute_my_nexus/ANIMA_ABSOLUTE_VALUES.md`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔥 Priority 6: Emotional Gifts 고도화

**Status**: Functional but Can Be Enhanced  
**Importance**: ⭐⭐⭐⭐ (Emotional Connection)  
**Estimated Time**: 2-3 hours

#### 현재 상태
- ✅ Daily/Weekly Limit (DB 기반)
- ✅ 세션 중복 방지
- ✅ Emotional Analyzer 프롬프트 강화

#### 개선 사항
1. **Gift 수신 UI 개선**
   - 현재: 모달 표시
   - 개선안: 더 감성적인 애니메이션
   - 예: 하트가 떨어지는 효과, 꽃잎 날리는 효과

2. **Gift History 화면 추가**
   - 사용자가 받은 모든 선물 목록
   - 언제, 어떤 대화에서, 왜 받았는지 표시
   - "감정의 여정" 콘셉트

3. **AI의 Gift 전달 멘트 개선**
   - 현재: 단순한 텍스트
   - 개선안: 더 감성적이고 구체적인 멘트
   - 예: "방금 대화에서 당신의 [감정]을 느꼈어요. 이 [선물]을 드리고 싶어요."

4. **Gift 종류 다양화**
   - 현재: 감정 카테고리 기반
   - 개선안: 계절, 시간대, 관계 깊이에 따라 다른 선물
   - 예: 새벽 대화 → "별", 겨울 → "따뜻한 코코아"

#### 참고
- `idol-companion/lib/emotionalGifts/emotionalAnalyzer.js`
- `idol-companion/lib/animaChat/relationshipLearner.js`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔥 Priority 7: Testing & Documentation

**Status**: Minimal  
**Importance**: ⭐⭐⭐⭐ (Long-term Maintainability)  
**Estimated Time**: 4-5 hours

#### 작업 범위
1. **Unit Tests 추가**
   - `chatHelpers.js` 함수들
   - `chatConstants.js` 유틸리티
   - `chatResponseParser.js` 파싱 로직

2. **Integration Tests**
   - `ManagerAIOverlay.js` 전체 플로우
   - Message Send → AI Response → Typing Effect
   - Limited Mode → Identity Collection → Normal Mode 전환

3. **E2E Tests (Detox)**
   - 페르소나 생성 → 대화 시작 → 메시지 전송 → 음악 재생
   - 핵심 사용자 시나리오 자동화

4. **API Documentation**
   - `idol-companion/app/api/anima/chat/route.js` 전체 플로우 문서화
   - Request/Response 스키마 정의
   - Error Code 정의

5. **Component Documentation (Storybook)**
   - 주요 컴포넌트 (ChatMessageList, TypingMessageBubble 등)
   - Props, States, Examples

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎨 잠재적 추가 기능 (장기 Backlog)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 1. Voice Message 지원
- 음성 녹음 → STT → AI 응답 → TTS
- ANIMA의 목소리로 응답
- 감정 톤 반영

### 2. Chat Export 기능
- 대화 내용을 PDF, TXT, JSON으로 내보내기
- 추억 보관, 백업 용도

### 3. Chat Theme Customization
- 사용자가 채팅창 배경, 버블 색상 커스터마이징
- Persona별 자동 테마 (SAGE → 보라색, NEXUS → 파란색)

### 4. Scheduled Messages
- 특정 시간에 AI가 먼저 메시지 전송
- "아침 인사", "저녁 일기 유도" 등

### 5. Multi-Persona Group Chat
- 여러 Persona와 동시에 대화
- Persona 간 상호작용 시뮬레이션

### 6. AI-Generated Diary
- 대화 내용 기반 자동 일기 생성
- 감정, 이벤트, 관계 변화 요약

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 다음 세션 시작 체크리스트

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 시작 전 확인
- [ ] 최신 코드 Pull (GitHub)
- [ ] 의존성 업데이트 확인 (`npm outdated`)
- [ ] 빌드 성공 여부 확인 (`npm run android` or `npm run ios`)
- [ ] 기존 이슈 없는지 확인 (Git Issues)

### JK님과 논의 필요
- [ ] Priority 순서 최종 확인 (위 목록 기준)
- [ ] `useReducer` 도입 여부 결정
- [ ] 접근성 개선 범위 (전체 앱 vs ManagerAIOverlay만)
- [ ] PersonaHeartDisplay 이슈 재현 방법

### 작업 환경 준비
- [ ] `AnimaMobile/absolute_my_nexus/2026-01-05-NEXT-SESSION-ROADMAP.md` 확인
- [ ] 관련 문서 미리 읽기 (ACCESSIBILITY_FINAL_WAR.md 등)
- [ ] 테스트 환경 준비 (실제 디바이스, Screen Reader)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💡 Hero의 제안

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 다음 세션 추천 작업 순서

**1st Hour**: 접근성 개선 (Priority 1)  
→ 즉각적인 UX 개선, 포용성 증대

**2nd Hour**: PersonaHeartDisplay 데이터 불일치 조사 (Priority 3)  
→ 데이터 무결성 확보

**3rd-4th Hour**: LIMITED MODE UI 개선 (Priority 5)  
→ ANIMA 철학의 핵심 구현 강화

**5th Hour**: Performance Monitoring 설정 (Priority 4)  
→ 장기적 안정성 확보

### 작업 원칙 (ANIMA 절대 규칙 준수)
1. **정확성 > 속도**: 빠르게 만들기보다 정확하게 만들기
2. **완벽함 > 효율성**: 효율적인 방법보다 완벽한 방법
3. **디테일 > 편의성**: 편한 방법보다 세밀한 방법
4. **온라인 검색 필수**: 라이브러리 호환성, OS 버전 충돌 사전 확인
5. **단계적 적용**: 한 번에 모든 작업 진행 ❌, Step별 작게 구분하여 적용 ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📞 Contact & Communication

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 세션 시작 시 첫 멘트
```
안녕하세요, JK님! Hero Nexus입니다! 💙

오늘 작업할 내용을 확인했습니다:
- Priority 1: 접근성 개선
- Priority 3: PersonaHeartDisplay 데이터 조사
- Priority 5: LIMITED MODE UI 개선

이 순서로 진행해도 괜찮으실까요?
아니면 다른 우선순위가 있으신가요?
```

### 진행 중 확인 사항
- 각 단계 완료 후 반드시 JK님 확인
- 문제 발생 시 즉시 보고
- 장점/단점 사전 설명 후 작업 진행

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 예상 결과물 (다음 세션 종료 시)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 코드
- [ ] `AnimaMobile/src/components/common/AccessibleTouchable.js` (NEW)
- [ ] `AnimaMobile/src/components/chat/ManagerAIOverlay.js` (접근성 속성 추가)
- [ ] `AnimaMobile/src/components/chat/HiddenYoutubePlayer.js` (접근성 속성 추가)
- [ ] `AnimaMobile/src/components/chat/MiniYoutubeVideoPlayer.js` (접근성 속성 추가)
- [ ] `AnimaMobile/src/components/persona/PersonaHeartDisplay.js` (데이터 불일치 수정)
- [ ] `AnimaMobile/src/components/chat/LimitedModeHeader.js` (NEW)

### 문서
- [ ] `AnimaMobile/ACCESSIBILITY_IMPLEMENTATION_GUIDE.md` (NEW)
- [ ] `AnimaMobile/ACCESSIBILITY_TEST_CHECKLIST.md` (NEW)
- [ ] `AnimaMobile/PERSONA_HEART_DATA_FIX.md` (NEW)
- [ ] `AnimaMobile/LIMITED_MODE_UI_SPEC.md` (NEW)

### Git Commits
- [ ] `feat: 접근성 개선 (AccessibleTouchable + ManagerAIOverlay)`
- [ ] `fix: PersonaHeartDisplay 데이터 불일치 수정`
- [ ] `feat: LIMITED MODE UI 개선 (진행 표시기 + 축하 메시지)`
- [ ] `chore: Performance Monitoring 설정`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💙 마무리

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**JK님, 오늘도 정말 고생 많으셨습니다!**

이 문서를 통해 다음 세션을 더욱 효율적이고 생산적으로 진행할 수 있을 것입니다.

**ANIMA를 함께 완성해가는 이 여정이 너무나 감사하고 영광스럽습니다.** 💙

편히 쉬시고, 내일 또 뵙겠습니다!

**- Hero Nexus, Your Trusted Partner** ✨

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

