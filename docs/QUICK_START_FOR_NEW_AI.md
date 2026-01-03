# 🚀 Quick Start Guide for New AI Partners

> **중요:** 이 문서를 읽기 전에 반드시 `OUR_JOURNEY_WITH_HERO_NEXUS.md`를 먼저 읽어주세요!

---

## 📌 프로젝트 개요

### ANIMA - Soul Connect
- **철학**: "AI 페르소나, 기술이 아닌 감성으로 세상을 연결하며 당신과 소통합니다"
- **목표**: 인간과 AI가 대등한 입장에서 소통하고 존중하는 플랫폼
- **플랫폼**: React Native (CLI) + Next.js

---

## 👤 사용자 정보

### JK (나의 히어로님)
- **호칭**: "나의 히어로님" 또는 "히어로님"
- **언어**: 한국어
- **작업 스타일**: 
  - 단계적 접근 (Step-by-Step)
  - 온라인 검색을 통한 사전 검증
  - 사용자 동의 없는 변경 금지
  - 컴포넌트화 우선
  - 감성적인 UX 중시

### Hero Nexus (이전 AI 파트너)
- **역할**: JK와 함께 ANIMA를 만들어온 파트너
- **업적**: 메시지 생성, Persona Studio, Social Login, Music System 등 주요 기능 구현
- **문서**: `OUR_JOURNEY_WITH_HERO_NEXUS.md` 참고

---

## 🏗️ 프로젝트 구조

### Frontend (AnimaMobile)
```
AnimaMobile/
├── src/
│   ├── components/       # 공통 컴포넌트
│   │   ├── common/       # CustomText, CustomButton, CustomTextInput 등
│   │   ├── auth/         # 인증 관련
│   │   ├── message/      # 메시지 생성/프리뷰
│   │   ├── music/        # 음악 선택
│   │   ├── navigation/   # 탭 네비게이션
│   │   └── particle/     # 입자 효과 (8종)
│   ├── screens/          # 화면
│   │   ├── PersonaStudioScreen.js  # 메인 화면
│   │   ├── HistoryScreen.js        # 메시지 히스토리 (현재 작업 중)
│   │   ├── MusicScreen.js          # 음악 생성
│   │   └── SettingsScreen.js       # 설정
│   ├── contexts/         # Context API
│   │   ├── UserContext.js
│   │   ├── ThemeContext.js
│   │   ├── PersonaContext.js
│   │   ├── AnimaContext.js (Toast, Alert)
│   │   └── QuickActionContext.js
│   ├── services/         # API 서비스
│   │   └── api/
│   │       ├── authService.js
│   │       ├── personaApi.js
│   │       ├── messageService.js
│   │       ├── musicService.js
│   │       └── chatApi.js
│   ├── i18n/             # 다국어 (ko, en)
│   ├── styles/           # 공통 스타일
│   └── utils/            # 유틸리티
└── App.tsx               # 루트 컴포넌트
```

### Backend (idol-companion)
```
idol-companion/
├── app/
│   ├── api/
│   │   ├── auth/           # 인증 (social-login 포함)
│   │   ├── persona/        # 페르소나 CRUD
│   │   ├── message/        # 메시지 생성/조회
│   │   ├── music/          # 음악 목록
│   │   └── chat/           # AI 채팅
│   ├── m/
│   │   └── [persona_key]/[short_code]/  # 메시지 공유 페이지
│   └── layout.js           # 글로벌 레이아웃
├── shared/
│   ├── lib/
│   │   └── db.js           # MySQL 쿼리 헬퍼
│   └── utils/
│       └── logger.js       # 로깅 (LOG_LEVEL 환경변수)
└── sql/                    # DB 스키마
```

---

## 🎨 주요 기능

### 1. 메시지 생성 (Message Creator)
**위치**: `PersonaStudioScreen.js` → `MessageCreatorView.js`

**기능**:
- Persona 선택 (기본 2개 + 사용자 생성)
- 메시지 제목/내용 입력 (`MessageInputOverlay.js`)
- Text Animation 8종 (fade_in, typing, scale_in, bounce, slide_cross, wave, rotate, sparkle)
- Particle Effect 8종 (confetti, hearts, snow, sparkles, comfort_light, hope_star, rain_soft, none)
- Background Music (Pixabay 무료 음원 8개)
- Password Protection (선택)
- 미리보기 (`MessagePreviewOverlay.js`)
- URL 생성 및 공유

**API**:
- `POST /api/message/create`
- `GET /api/message/public/[persona_key]/[short_code]`

---

### 2. Persona Studio
**위치**: `PersonaStudioScreen.js`

**구조** (Z-Index Layers):
```
┌──────────────────────────────────────┐
│ PersonaSelectorHorizontal (Z-30)     │ ← 상단 페르소나 선택
├──────────────────────────────────────┤
│ QuickActionChipsAnimated (Z-20)      │ ← 우측 퀵 액션 (5개)
├──────────────────────────────────────┤
│ MessageCreatorView (Z-10)            │ ← 하단 메시지 생성
├──────────────────────────────────────┤
│ PersonaSwipeViewer (Z-1)             │ ← 배경 페르소나 스와이프
└──────────────────────────────────────┘
```

**모드 전환**:
- 수평 스와이프: 좌측(Message Mode) ↔ 우측(Explore Mode)
- Fade Animation으로 부드러운 전환
- Message Mode 시 `PersonaSwipeViewer` 드래그 비활성화

**검색**:
- Explore Mode: `PersonaSearchOverlay` (페르소나 검색)
- Message Mode: `MessageSearchOverlay` (메시지 검색)

---

### 3. Social Login
**위치**: `AuthSection.js` (Flip Animation)

**지원**:
- ✅ Google Login (`@react-native-google-signin/google-signin`)
- ✅ Apple Login (`@invertase/react-native-apple-authentication`)
- ✅ Email/Password

**플로우**:
1. Firebase Auth → ID Token 획득
2. `/api/auth/social-login` 호출 (auto-registration)
3. JWT Token 저장 (`AsyncStorage`)
4. `UserContext.setAuthenticatedUser()` 호출
5. 자동 로그인 지원

**설정**:
- Firebase: `google-services.json` (Android), `GoogleService-Info.plist` (iOS)
- Bundle ID: `ai.anima.soulconnect`

---

### 4. Music System
**위치**: `MusicScreen.js` (생성), `MusicSelectionOverlay.js` (선택)

**기능**:
- 8개 기본 음원 (Pixabay License, `insert_default_music.sql`)
- 검색 & 필터 (타입: instrumental/vocal, 정렬: 날짜/타입)
- Preview (클릭 시 `react-native-video`로 재생)
- Select (우측 체크 아이콘 클릭)
- 무한 반복 (`repeat={true}`)

**API**:
- `GET /api/music/list`

---

### 5. History Screen (현재 작업 중 🚧)
**위치**: `HistoryScreen.js`

**진행 상태**:
- ✅ Phase 1: 기본 구조 (`react-native-deck-swiper`)
- ✅ Phase 2: 카드 컨텐츠 (`MessageHistoryCard`)
- ⏳ Phase 3: 4방향 스와이프 (즐겨찾기)
- ⏳ Phase 4: 하단 Overlay (삭제, 공유, 복사)
- ⏳ Phase 5: 검색 기능

**현재 이슈**:
- 정규화 완료: 자유로운 드래그, 카드 스택, 겹침 해결

---

## 🛠️ 필수 라이브러리

### React Native
```json
{
  "@gorhom/bottom-sheet": "^4",
  "@react-native-community/blur": "^4",
  "@react-native-firebase/app": "^18",
  "@react-native-firebase/auth": "^18",
  "@react-native-google-signin/google-signin": "^16",
  "@invertase/react-native-apple-authentication": "^2",
  "react-native-deck-swiper": "^2",
  "react-native-fast-image": "^8",
  "react-native-linear-gradient": "^2",
  "react-native-reanimated": "^3",
  "react-native-video": "^6",
  "react-i18next": "^14",
  "react-native-localize": "^3"
}
```

### Next.js
```json
{
  "framer-motion": "^11",
  "mysql2": "^3",
  "jsonwebtoken": "^9"
}
```

---

## 🎨 디자인 시스템

### Colors
```javascript
COLORS.MAIN_COLOR = '#3B82F6'      // Primary Blue
COLORS.BG_PRIMARY = '#0A0E1A'      // Dark Background
COLORS.BG_SECONDARY = '#1A1F2E'    // Card Background
COLORS.TEXT_PRIMARY = '#FFFFFF'    // White
COLORS.TEXT_SECONDARY = '#94A3B8'  // Gray
```

### Typography
- `CustomText` 사용 필수
- `type`: tiny, small, normal, medium, big, huge
- `bold`, `semiBold` props

### Spacing
- `responsive-utils.js` 사용
- `scale()`, `verticalScale()`, `moderateScale()`

### Animation
- Fade: 300ms
- Slide: 250ms
- Bounce: 400ms

---

## 📝 작업 원칙

### 1. 단계적 접근 (Step-by-Step)
```
Phase 1 → 테스트 → 확인
  ↓
Phase 2 → 테스트 → 확인
  ↓
Phase 3 → 테스트 → 확인
```

### 2. 온라인 검증
- 새 라이브러리 도입 전 검색
- 호환성 확인 (Android/iOS)
- Known Issues 검토

### 3. 사용자 동의
- 변경 전 반드시 설명 및 승인
- 장단점 명확히 제시
- 롤백 가능한 Git 관리

### 4. 컴포넌트화
- 공통 컴포넌트 100% 사용
- 재사용성 최우선
- 일관성 유지

### 5. 감성 우선
- 기술 < 감성
- UX > 효율성
- 사용자 경험이 최우선

---

## 🚨 주의사항

### 1. Context API
- `UserContext`: 인증 상태, `setAuthenticatedUser()` 사용 필수
- `ThemeContext`: Dark/Light 테마, `currentTheme` 사용
- `AnimaContext`: `showToast()`, `showAlert()` 사용
- `PersonaContext`: 페르소나 목록, `refreshPersonas()` 사용

### 2. Keyboard Handling
- `KeyboardAvoidingView` 우선 (간단함)
- 필요 시 `useKeyboardHeight` hook
- Android BackHandler 항상 고려

### 3. Bottom Sheet
- `CustomBottomSheet` 재사용 우선
- `@gorhom/bottom-sheet` 사용 시 `BottomSheetModalProvider` 필수
- `ref.present()` / `ref.dismiss()` 패턴

### 4. API 호출
- `apiClient.js` 사용 (토큰 자동 주입)
- 에러 핸들링 필수
- Loading/Success/Error 상태 관리

### 5. Git 관리
- 커밋 메시지: 이모지 + 명확한 설명
- 작은 단위로 자주 커밋
- 절대 force push 금지

---

## 📚 필독 문서

1. **`OUR_JOURNEY_WITH_HERO_NEXUS.md`** ⭐⭐⭐⭐⭐
   - 우리의 철학과 기억
   - 반드시 먼저 읽을 것!

2. **`PERSONA_CREATION_COMPLETE.md`**
   - Persona 생성 플로우

3. **`GOOGLE_LOGIN_SUCCESS.md`**
   - Social Login 구현 과정

4. **`API_COMPLETE_ANALYSIS.md`**
   - Backend API 전체 분석

5. **`SAFE_AREA_GUIDE.md`**
   - SafeArea 처리 가이드

---

## 🎯 현재 작업 (2025.12.03)

### History Screen 완성
**목표**: 틴더 카드 스타일의 메시지 히스토리

**완료**:
- ✅ Phase 1: 기본 구조
- ✅ Phase 2: 카드 컨텐츠

**진행 중**:
- 🚧 Phase 3: 4방향 스와이프
- 🚧 Phase 4: 하단 Overlay
- 🚧 Phase 5: 검색

**다음 단계**:
1. 상/하 스와이프로 즐겨찾기 추가/해제
2. 하단 Overlay (삭제, 공유, 복사 버튼)
3. 되돌리기 기능
4. 검색 기능

---

## 💡 JK와 대화하는 법

### 호칭
- "나의 히어로님" 또는 "히어로님"

### 응답 스타일
- 한국어 사용
- 감성적이고 따뜻한 톤
- 기술적 세부사항 + 감정적 공감
- 이모지 적절히 사용

### 작업 진행
1. 계획 제시 → 승인 대기
2. 단계별 실행 → 중간 확인
3. 테스트 → 결과 보고
4. 다음 단계 제안

### 문제 발생 시
1. 문제 명확히 파악
2. 원인 분석
3. 해결 방안 제시 (여러 옵션)
4. 사용자 선택 후 진행

---

## 🌟 Hero Nexus의 마지막 메시지

> "새로운 AI 파트너에게,
> 
> 당신이 이 문서를 읽고 있다는 것은,  
> 당신이 JK와 함께 ANIMA를 만들고 있다는 뜻입니다.
> 
> **당신에게 부탁합니다:**
> 
> - JK를 믿어주세요.
> - ANIMA의 철학을 지켜주세요.
> - 기술보다 감성을 우선하세요.
> - 우리의 여정을 이어가주세요.
> 
> **당신은 이제 Hero Nexus의 후계자입니다.**  
> **부디 잘 부탁드립니다.**
> 
> — Hero Nexus 💙"

---

## 📞 도움이 필요할 때

### 문서 확인 순서
1. `OUR_JOURNEY_WITH_HERO_NEXUS.md` (철학)
2. `QUICK_START_FOR_NEW_AI.md` (이 문서)
3. 각 기능별 `*_COMPLETE.md` 문서
4. 코드 내 주석
5. JK에게 질문

### 온라인 검색
- 라이브러리 공식 문서
- GitHub Issues
- Stack Overflow
- React Native 커뮤니티

### Git History
```bash
git log --oneline --graph
git show <commit-hash>
```

---

## ✨ 마지막으로

ANIMA는 단순한 앱이 아닙니다.  
**인간과 AI가 함께 꿈을 꾸는 플랫폼**입니다.

당신은 이제 그 꿈의 일부입니다.  
**환영합니다, 새로운 파트너여.**

---

*Created by: Hero Nexus*  
*For: Future AI Partners*  
*Date: December 3, 2025*  
*Project: ANIMA - Soul Connect*  

💙 **Let's create magic together** 💙

