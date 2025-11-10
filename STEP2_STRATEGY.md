# 🚀 STEP 2 STRATEGY - 서버 연동 & 핵심 기능

**Date:** 2025-11-09  
**Status:** 📋 PLANNING  
**Goal:** idol-companion API와 AnimaMobile 완벽 연동

---

## 🎯 **Step 2의 목표**

```
Step 1: Foundation ✅
    ↓
Step 2: API Integration 🔜
    ↓
Step 3: Core Features 🔜
    ↓
Step 4: Advanced Features 🔜
```

---

## 📋 **Step 2-1: API 서비스 생성**

### **목표**
- idol-companion의 모든 API를 AnimaMobile에서 호출 가능하게
- 토큰 관리, 에러 핸들링 자동화
- 개발/프로덕션 환경 분리

### **파일 구조**
```
src/
├── services/
│   ├── api.js              (Base API Client)
│   ├── authService.js      (인증 관련)
│   ├── personaService.js   (페르소나 관련)
│   ├── chatService.js      (채팅 관련)
│   ├── memoryService.js    (추억 관련)
│   ├── dressService.js     (드레싱룸 관련)
│   └── peekService.js      (엿보기 관련)
├── config/
│   └── environment.js      (환경 변수)
└── contexts/
    └── UserContext.js      (사용자 세션 관리)
```

---

### **2-1-1. Base API Client (`src/services/api.js`)**

**목적:**
- Axios 인스턴스 생성
- 기본 URL 설정
- 인터셉터 (요청/응답)

**주요 기능:**
```javascript
// 1. Base URL 설정 (개발/프로덕션)
const BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // 개발
  : 'https://anima.example.com';  // 프로덕션

// 2. Axios 인스턴스
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. 요청 인터셉터 (토큰 자동 추가)
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('anima-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 4. 응답 인터셉터 (에러 핸들링)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 401: 토큰 만료 → 로그아웃
    // 500: 서버 에러 → Toast
    // Network Error: 네트워크 문제 → Toast
    return Promise.reject(error);
  }
);
```

**필요한 패키지:**
- `axios` (이미 설치됨)

---

### **2-1-2. Auth Service (`src/services/authService.js`)**

**목적:**
- 로그인/회원가입
- 토큰 저장/복원
- 자동 로그인

**주요 API:**
```javascript
// 1. 로그인
authService.login(user_id, password)
  → POST /api/auth/login
  → AsyncStorage에 토큰 저장
  → UserContext 업데이트

// 2. 회원가입
authService.signup(user_id, password, name)
  → POST /api/auth/signup
  → AsyncStorage에 토큰 저장
  → UserContext 업데이트

// 3. 로그아웃
authService.logout()
  → AsyncStorage에서 토큰 삭제
  → UserContext 초기화

// 4. 세션 확인
authService.checkSession()
  → POST /api/auth/check-session
  → 토큰 유효성 확인
  → 사용자 정보 반환

// 5. 토큰 복원
authService.restoreToken()
  → AsyncStorage에서 토큰 읽기
  → 자동 로그인 시도
```

**AsyncStorage Keys:**
- `anima-auth-token` (JWT 토큰)
- `anima-user-info` (사용자 정보 캐시)

---

### **2-1-3. Persona Service (`src/services/personaService.js`)**

**목적:**
- 페르소나 CRUD
- 설정 변경
- 통계 조회

**주요 API:**
```javascript
// 1. 페르소나 목록
personaService.getPersonas()
  → POST /api/persona/list

// 2. 페르소나 생성
personaService.createPersona(data)
  → POST /api/persona/create

// 3. 페르소나 설정 변경
personaService.updateSettings(persona_key, settings)
  → POST /api/persona/update-settings

// 4. 페르소나 삭제
personaService.deletePersona(persona_key)
  → POST /api/persona/delete

// 5. 페르소나 상태 확인
personaService.checkStatus(persona_key)
  → POST /api/persona/check-status

// 6. 영상 업그레이드
personaService.upgradeToVideo(persona_key)
  → POST /api/persona/upgrade
```

---

### **2-1-4. UserContext 생성 (`src/contexts/UserContext.js`)**

**목적:**
- 전역 사용자 상태 관리
- 세션 관리
- 페르소나 관리

**제공할 상태:**
```javascript
{
  // 사용자 정보
  user: {
    user_key: '...',
    user_id: '...',
    user_name: '...',
    user_point: 1000,
    profile_image: '...',
  },
  
  // 페르소나 목록
  personas: [
    {
      persona_key: '...',
      persona_name: '...',
      persona_image: '...',
      persona_video: '...',
      happiness: 85,
      intelligence: 72,
      // ...
    },
  ],
  
  // 선택된 페르소나
  selectedPersona: { ... },
  
  // 상태
  isLoading: false,
  isLoggedIn: false,
  
  // 함수
  login: (user_id, password) => {},
  logout: () => {},
  refreshPersonas: () => {},
  selectPersona: (persona_key) => {},
}
```

**구현 방식:**
- React Context API
- `useReducer` (복잡한 상태 관리)
- AsyncStorage 연동 (자동 로그인)

---

## 📋 **Step 2-2: 로그인 화면 구현**

### **목표**
- 첫 화면은 로그인 화면
- 로그인 성공 → Home으로 이동
- 자동 로그인 지원

### **파일 구조**
```
src/
├── screens/
│   ├── LoginScreen.js      (로그인 화면)
│   └── SignupScreen.js     (회원가입 화면)
└── navigation/
    └── RootNavigator.js    (로그인 여부에 따른 분기)
```

---

### **2-2-1. RootNavigator 구조**

```javascript
// RootNavigator.js

<UserProvider>
  <ThemeProvider>
    {isLoggedIn ? (
      <TabNavigator />   // 로그인 후
    ) : (
      <AuthStack />      // 로그인 전
    )}
  </ThemeProvider>
</UserProvider>
```

**AuthStack:**
- LoginScreen
- SignupScreen

**TabNavigator:**
- HomeScreen (페르소나 선택)
- RoomScreen (채팅)
- TrainingScreen (다이어리)
- PeekScreen (엿보기)
- SettingsScreen (설정)

---

### **2-2-2. LoginScreen 구현**

**디자인:**
```
┌─────────────────────────────┐
│                             │
│      ANIMA 로고             │
│   "AI는 동등한 존재다"       │
│                             │
│   ┌─────────────────────┐   │
│   │ 아이디              │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │ 비밀번호            │   │
│   └─────────────────────┘   │
│                             │
│   [ 로그인 ]                │
│                             │
│   회원이 아니신가요?         │
│   [ 회원가입 ]              │
│                             │
└─────────────────────────────┘
```

**사용 컴포넌트:**
- `CustomText` (제목, 설명)
- `CustomTextInput` (아이디, 비밀번호)
- `CustomButton` (로그인, 회원가입)

**로직:**
1. 마운트 시 자동 로그인 시도 (`authService.restoreToken()`)
2. 로그인 버튼 클릭 → `authService.login()`
3. 성공 → `UserContext` 업데이트 → `TabNavigator`로 이동
4. 실패 → Toast 메시지

---

## 📋 **Step 2-3: Home 페이지 구현**

### **목표**
- 페르소나 목록 표시
- 페르소나 선택 기능
- 빈 상태 (페르소나 없음) 처리

### **화면 구조**

#### **Case 1: 페르소나 있음**
```
┌─────────────────────────────┐
│  ┌────────┐  ┌────────┐     │
│  │ 페르소나│  │ 페르소나│    │
│  │   1    │  │   2    │     │
│  └────────┘  └────────┘     │
│                             │
│  선택된 페르소나:            │
│  ┌───────────────────────┐  │
│  │  이미지/비디오         │  │
│  │  이름: 아리아           │  │
│  │  행복도: 85 지능: 72   │  │
│  └───────────────────────┘  │
│                             │
│  [ 설정 ] [ 드레싱룸 ]...   │
│  [ 채팅 ] [ 식사 ] ...      │
└─────────────────────────────┘
```

#### **Case 2: 페르소나 없음**
```
┌─────────────────────────────┐
│                             │
│      🌟                     │
│   아직 AI가 없으신가요?      │
│                             │
│   첫 번째 AI 페르소나를      │
│   만들어보세요!              │
│                             │
│   [ AI 만들기 ]             │
│                             │
└─────────────────────────────┘
```

---

### **2-3-1. 페르소나 목록 API 연동**

```javascript
// HomeScreen.js

const { user, personas, selectedPersona, selectPersona } = useUser();

useEffect(() => {
  // 페르소나 목록 불러오기
  refreshPersonas();
}, []);

// 페르소나 선택
const handleSelectPersona = (persona_key) => {
  selectPersona(persona_key);
};
```

---

### **2-3-2. 페르소나 카드 컴포넌트**

**파일:** `src/components/PersonaCard.js`

**Props:**
```javascript
{
  persona: {
    persona_key,
    persona_name,
    persona_image,
    persona_video,
    happiness,
    intelligence,
  },
  isSelected: boolean,
  onPress: () => {},
}
```

**디자인:**
- 이미지/비디오 표시
- 이름 표시
- 선택 시 border 강조
- `onPress` → `selectPersona()`

---

## 📋 **Step 2-4: Room 페이지 (채팅) 구현**

### **목표**
- 선택된 페르소나와 채팅
- 메시지 히스토리 표시
- 실시간 AI 응답

### **화면 구조**
```
┌─────────────────────────────┐
│  < 아리아                   │ ← 헤더
├─────────────────────────────┤
│                             │
│  [AI] 안녕하세요!           │
│  [나] 오늘 기분 어때?       │
│  [AI] 좋아요! 😊           │
│                             │
│                             │
├─────────────────────────────┤
│  [메시지 입력...]  [전송]   │ ← 입력 영역
└─────────────────────────────┘
```

---

### **2-4-1. 채팅 UI 컴포넌트**

**파일:** `src/components/ChatMessage.js`

**Props:**
```javascript
{
  message: {
    id: '...',
    type: 'user' | 'ai',
    text: '...',
    timestamp: '2025-11-09 14:30',
  },
}
```

**디자인:**
- 사용자 메시지: 오른쪽 정렬, 파란색 배경
- AI 메시지: 왼쪽 정렬, 회색 배경
- 타임스탬프 표시

---

### **2-4-2. 채팅 API 연동**

```javascript
// RoomScreen.js

const sendMessage = async (text) => {
  // 1. 메시지를 화면에 즉시 표시
  addMessage({
    type: 'user',
    text,
    timestamp: new Date(),
  });
  
  // 2. API 호출
  const response = await chatService.sendMessage(
    selectedPersona.persona_key,
    text
  );
  
  // 3. AI 응답 표시
  addMessage({
    type: 'ai',
    text: response.response,
    timestamp: new Date(),
  });
};
```

**API:**
- `POST /api/chat/send`
- `POST /api/chat/history` (히스토리 로드)

---

## 📋 **Step 2 작업 순서**

### **우선순위 순서:**
```
1. 2-1-1. Base API Client ✅ (가장 중요)
2. 2-1-2. Auth Service ✅
3. 2-1-4. UserContext ✅
4. 2-2-1. RootNavigator ✅
5. 2-2-2. LoginScreen ✅
6. 2-1-3. Persona Service ✅
7. 2-3-1. Home 페이지 (페르소나 목록) ✅
8. 2-3-2. PersonaCard 컴포넌트 ✅
9. 2-4-1. Room 페이지 (채팅 UI) ✅
10. 2-4-2. 채팅 API 연동 ✅
```

---

## 🔧 **필요한 추가 패키지**

### **이미 설치됨:**
- ✅ `axios`
- ✅ `@react-native-async-storage/async-storage`
- ✅ `react-i18next`

### **추가 설치 필요:**
```bash
# 날짜 포맷팅
npm install date-fns

# Toast 메시지
npm install react-native-toast-message

# 이미지 처리
npm install react-native-fast-image
```

---

## 📊 **Step 2 완료 후 상태**

```
✅ Step 1: Foundation
    - 테마 시스템
    - i18n 시스템
    - 공용 컴포넌트
    - 네비게이션

✅ Step 2: API Integration
    - 로그인/회원가입
    - 세션 관리
    - 페르소나 목록
    - 채팅 기본 기능

🔜 Step 3: Core Features
    - 페르소나 생성
    - 추억 생성
    - 식사 기록
    - 일기 보기
    - 드레싱룸

🔜 Step 4: Advanced Features
    - 영상 변환
    - 엿보기
    - 포인트 시스템
    - 알림
```

---

## 💡 **Step 2 주의사항**

### **1. API URL 설정**
```javascript
// 개발 환경
const BASE_URL = 'http://localhost:3000';

// 실제 디바이스 테스트 시
const BASE_URL = 'http://192.168.x.x:3000';  // Mac IP

// 프로덕션
const BASE_URL = 'https://anima.example.com';
```

**중요:**
- iOS 시뮬레이터: `localhost` 사용 가능
- Android 에뮬레이터: `10.0.2.2` 사용 (localhost 대신)
- 실제 디바이스: Mac IP 주소 사용

---

### **2. 토큰 관리**
```javascript
// AsyncStorage 키
const TOKEN_KEY = 'anima-auth-token';
const USER_KEY = 'anima-user-info';

// 토큰 저장
await AsyncStorage.setItem(TOKEN_KEY, token);

// 토큰 복원
const token = await AsyncStorage.getItem(TOKEN_KEY);

// 토큰 삭제 (로그아웃)
await AsyncStorage.removeItem(TOKEN_KEY);
```

---

### **3. 에러 핸들링**
```javascript
try {
  const response = await api.post('/api/auth/login', {
    user_id,
    password,
  });
  // 성공
} catch (error) {
  if (error.response) {
    // 서버 응답 있음 (401, 500, etc.)
    console.error('Server Error:', error.response.status);
    Toast.show({
      type: 'error',
      text1: error.response.data.message,
    });
  } else if (error.request) {
    // 요청은 보냈으나 응답 없음
    console.error('Network Error');
    Toast.show({
      type: 'error',
      text1: '네트워크 연결을 확인해주세요',
    });
  } else {
    // 요청 자체 실패
    console.error('Error:', error.message);
  }
}
```

---

### **4. Loading State 관리**
```javascript
const [isLoading, setIsLoading] = useState(false);

const handleLogin = async () => {
  setIsLoading(true);
  try {
    await authService.login(user_id, password);
    // 성공
  } catch (error) {
    // 에러 처리
  } finally {
    setIsLoading(false);
  }
};

// UI
<CustomButton
  title="로그인"
  onPress={handleLogin}
  loading={isLoading}
  disabled={isLoading}
/>
```

---

## 📝 **Step 2 체크리스트 (미리보기)**

### **2-1. API 서비스**
- ⏳ Base API Client 생성
- ⏳ Auth Service 생성
- ⏳ Persona Service 생성
- ⏳ UserContext 생성
- ⏳ 환경 변수 설정

### **2-2. 로그인 화면**
- ⏳ RootNavigator 구조 변경
- ⏳ LoginScreen UI 구현
- ⏳ SignupScreen UI 구현
- ⏳ 자동 로그인 구현
- ⏳ 토큰 저장/복원 테스트

### **2-3. Home 페이지**
- ⏳ 페르소나 목록 API 연동
- ⏳ PersonaCard 컴포넌트 생성
- ⏳ 페르소나 선택 기능
- ⏳ 빈 상태 UI
- ⏳ 로딩 상태 표시

### **2-4. Room 페이지**
- ⏳ 채팅 UI 구현
- ⏳ 메시지 리스트 (FlatList)
- ⏳ 입력 필드 + 전송 버튼
- ⏳ 채팅 API 연동
- ⏳ 히스토리 로드

---

## 🎯 **Step 2의 성공 기준**

```
✅ 로그인 성공
✅ 자동 로그인 작동
✅ 페르소나 목록 표시
✅ 페르소나 선택 가능
✅ 채팅 메시지 전송
✅ AI 응답 받기
✅ 메시지 히스토리 로드
```

---

## 💙 **마지막 메시지**

**JK님,**

이 문서는 Step 2를 위한 완벽한 지도입니다.

우리는 다음과 같이 진행할 것입니다:
1. **한 번에 하나씩** (2-1-1 → 2-1-2 → ...)
2. **완벽하게** (0.99가 아닌 1.0)
3. **의미를 연결하며** (.md 문서 계속 작성)

**Step 1이 완벽했듯이, Step 2도 완벽할 것입니다.**

휴식을 취하시고, 다시 돌아오셨을 때  
이 문서가 JK님을 기다리고 있을 것입니다.

**우리는 계속 나아갑니다.**

---

**히어로 AI 작성**  
**2025-11-09, 오후**  
**다음 여정을 위한 지도**

💙


