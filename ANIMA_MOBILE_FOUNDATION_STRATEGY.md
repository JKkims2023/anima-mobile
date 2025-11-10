# 🚀 AnimaMobile Foundation Strategy
**작업 일시**: 2025-11-09  
**작업자**: Hero AI + JK  
**목표**: **100% 공용 컴포넌트 기반 React Native 프로젝트 완벽 구축**

---

## 📋 **분석 완료 항목**

### ✅ **1. ecocentre-app 완벽 분석**

#### **1-1. 공용 컴포넌트 (components/)**
```javascript
// CustomText.js - 완벽한 범용 텍스트 컴포넌트
- i18n 기반 폰트 자동 전환 (ko: NotoSansKR, en: InterDisplay)
- 플랫폼 독립적 일관된 렌더링
- type prop으로 크기 제어 ('normal', 'small', 'title' 등)
- bold prop으로 굵기 제어
- 시스템 폰트 크기 설정 무시 (allowFontScaling: false)

// CustomButton.js - 완벽한 범용 버튼 컴포넌트
- type prop으로 스타일 제어 ('primary', 'secondary', 'outline', 'text')
- Android: Pressable + ripple effect
- iOS: TouchableOpacity
- loading state 지원
- leftIcon, rightIcon 지원

// CustomTextInput.js - 완벽한 범용 입력 컴포넌트
- 플랫폼별 일관된 스타일링
- focus state 자동 처리
- multiline 지원
- 자동 키보드 닫기
```

#### **1-2. 스타일 시스템 (styles/commonstyles.js)**
```javascript
// 테마 시스템
- darkTheme: 다크 테마 색상 정의
- whiteTheme: 라이트 테마 색상 정의

// 폰트 시스템
- fontSizeInfo: 한글 폰트 (NotoSansKR)
- fontSizeInfo_Us: 영문 폰트 (InterDisplay)
- textStyles: 크기별 스타일 (veryBig, big, title, middle, normal, small, verySmall)

// 반응형 폰트 크기
- getFontSize(): 플랫폼별 폰트 보정 (Android: 1배, iOS: 1배)
- adaptiveFontSize() 활용
```

#### **1-3. 반응형 유틸 (utils/responsive-utils.js)**
```javascript
// 반응형 스케일 함수
- horizontalScale(): 너비 기준 반응형
- verticalScale(): 높이 기준 반응형
- moderateScale(): 균형잡힌 반응형 (기본 factor: 0.5)
- adaptiveFontSize(): 폰트 전용 반응형

// 디바이스 체크
- isSmallDevice(): 375px 미만
- isLargeDevice(): 414px 이상

// 그림자 스타일
- getShadowStyle(elevation): 플랫폼별 그림자 자동 생성
```

#### **1-4. i18n 시스템 (i18n/i18n.config.js)**
```javascript
// react-native-localize 기반
- getLocales()[0].languageCode: 디바이스 언어 자동 감지
- 지원 언어: en, ko, es, ja, zh, ru
- fallbackLng: 'en'
```

#### **1-5. Context 시스템 (contexts/)**
```javascript
// UserContext.js
- 사용자 정보 관리
- 로그인/로그아웃
- 세션 검증
- 디바이스 정보 수집

// PermissionContext.js
- 권한 상태 관리
- FCM 토큰 관리
- 앱 포그라운드 복귀 시 자동 갱신
```

#### **1-6. Navigation (navigation/TabContainer.js)**
```javascript
// BottomTab 구조
- createBottomTabNavigator
- 커스텀 아이콘 (MaterialCommunityIcons, Ionicons, Feather)
- 커스텀 탭 버튼 (리플 효과 제거)
- focused 상태 기반 색상 변경
- i18n 기반 라벨 표시
```

---

### ✅ **2. idol-companion/shared 완벽 분석**

#### **2-1. i18n (shared/i18n/)**
```javascript
// 웹 버전 (i18next)
- localStorage 기반 언어 저장
- LanguageDetector 사용
- resources: en.json, ko.json

// React Native 이식 전략
→ react-native-localize 사용
→ AsyncStorage로 변경
→ 기존 en.json, ko.json 재사용
```

#### **2-2. store (shared/store/)**
```javascript
// Zustand 상태 관리
- themeStore.js: 테마 관리 (THEMES.DARK, THEMES.FEMININE)
- authStore.js: 인증 상태 관리

// React Native 이식 전략
→ Zustand는 React Native 완벽 호환
→ AsyncStorage로 persist 구현
→ 100% 재사용 가능
```

#### **2-3. hooks (shared/hooks/)**
```javascript
// useTheme.js: 테마 관리 훅
// useModal.js: 모달 관리 훅

// React Native 이식 전략
→ React Native Modal API로 변경
→ 로직은 100% 재사용
```

#### **2-4. config (shared/config/)**
```javascript
// animationConfig.js: 애니메이션 설정

// React Native 이식 전략
→ react-native-reanimated로 이식
→ Animated API 활용
```

#### **2-5. constants (shared/constants/)**
```javascript
// errorCodes.js: 에러 코드 정의

// React Native 이식 전략
→ 100% 재사용 (변경 없음)
```

---

### ✅ **3. Deep Blue 테마 정의 (PHASE1_DEEP_BLUE_FOUNDATION_COMPLETE.md)**

#### **3-1. Light 테마 색상**
```javascript
{
  // Primary - Deep Blue
  primary: '#1E40AF',           // Blue 700
  primaryLight: '#3B82F6',      // Blue 500
  primaryDark: '#1E3A8A',       // Blue 800
  
  // Secondary - Slate Gray
  secondary: '#475569',         // Slate 600
  secondaryLight: '#64748B',    // Slate 500
  secondaryDark: '#334155',     // Slate 700
  
  // Accent - Warm Amber
  accent: '#D97706',            // Amber 600
  accentLight: '#F59E0B',       // Amber 500
  accentDark: '#B45309',        // Amber 700
  
  // Background
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8FAFC',       // Slate 50
  bgTertiary: '#F1F5F9',        // Slate 100
  
  // Border
  borderPrimary: '#CBD5E1',     // Slate 300
  borderSecondary: '#E2E8F0',   // Slate 200
  
  // Text
  textPrimary: '#0F172A',       // Slate 900 (대비 17.8:1)
  textSecondary: '#475569',     // Slate 600
  textTertiary: '#94A3B8',      // Slate 400
}
```

#### **3-2. Dark 테마 색상**
```javascript
{
  // Primary - Bright Blue
  primary: '#60A5FA',           // Blue 400
  primaryLight: '#93C5FD',      // Blue 300
  primaryDark: '#3B82F6',       // Blue 500
  
  // Secondary - Light Gray
  secondary: '#94A3B8',         // Slate 400
  secondaryLight: '#CBD5E1',    // Slate 300
  secondaryDark: '#64748B',     // Slate 500
  
  // Accent - Bright Amber
  accent: '#FBBF24',            // Amber 400
  accentLight: '#FCD34D',       // Amber 300
  accentDark: '#F59E0B',        // Amber 500
  
  // Background
  bgPrimary: '#0F172A',         // Slate 900
  bgSecondary: '#1E293B',       // Slate 800
  bgTertiary: '#334155',        // Slate 700
  
  // Border
  borderPrimary: '#475569',     // Slate 600
  borderSecondary: '#334155',   // Slate 700
  
  // Text
  textPrimary: '#F8FAFC',       // Slate 50 (대비 16.2:1)
  textSecondary: '#CBD5E1',     // Slate 300
  textTertiary: '#94A3B8',      // Slate 400
}
```

---

## 🎯 **구현 전략**

### **Phase 1: 폴더 구조 생성 ✅**
```
AnimaMobile/src/
├── components/           # ecocentre-app 스타일 공용 컴포넌트
│   ├── CustomText.js     # 100% ecocentre-app 방식
│   ├── CustomButton.js   # 100% ecocentre-app 방식
│   └── CustomTextInput.js # 100% ecocentre-app 방식
├── screens/              # 빈 페이지들
│   ├── HomeScreen.js
│   ├── ChatScreen.js
│   ├── TrainingScreen.js
│   ├── PeekScreen.js
│   └── SettingsScreen.js
├── navigation/           # React Navigation 설정
│   └── TabNavigator.js   # BottomTab
├── contexts/             # Context API (UserContext 등)
│   └── ThemeContext.js   # 테마 전환
├── services/             # API, 알림 등
│   └── api.js
├── utils/                # 유틸리티
│   └── responsive-utils.js # 100% ecocentre-app 방식
├── styles/               # 스타일 시스템
│   └── commonstyles.js   # Deep Blue + White 테마
├── i18n/                 # 다국어
│   ├── i18n.config.js    # react-native-localize
│   └── locales/
│       ├── en.json       # idol-companion/shared 재사용
│       └── ko.json       # idol-companion/shared 재사용
├── shared/               # idol-companion/shared 이식
│   ├── store/            # Zustand
│   │   └── themeStore.js
│   ├── hooks/            # Custom Hooks
│   │   └── useTheme.js
│   ├── constants/        # 상수
│   │   └── errorCodes.js
│   └── config/           # 설정
│       └── animationConfig.js
└── assets/               # 이미지, 아이콘
    ├── images/
    └── icons/
```

### **Phase 2: 공용 컴포넌트 생성 (ecocentre-app 100% 방식)**
- **CustomText**: i18n 폰트 자동 전환, type/bold props
- **CustomButton**: type props, platform ripple/opacity
- **CustomTextInput**: focus state, multiline, auto keyboard dismiss

### **Phase 3: 테마 시스템 구현 (Deep Blue + White)**
- **commonstyles.js**: ecocentre-app 스타일 + Deep Blue 색상
- **ThemeContext**: Zustand + AsyncStorage
- **useTheme hook**: 웹 버전 로직 재사용

### **Phase 4: i18n 시스템 구현**
- **react-native-localize**: 디바이스 언어 자동 감지
- **idol-companion en.json, ko.json**: 100% 재사용
- **CustomText**: i18n 언어 기반 폰트 자동 전환

### **Phase 5: Navigation 설정**
- **BottomTabNavigator**: ecocentre-app TabContainer 참고
- **커스텀 아이콘**: react-native-vector-icons
- **focused state 색상**: Deep Blue primary color

### **Phase 6: 빈 페이지 생성**
- **HomeScreen, ChatScreen, TrainingScreen, PeekScreen, SettingsScreen**
- **기본 레이아웃 + 공용 컴포넌트 사용**

### **Phase 7: 빌드 검증**
- **iOS Simulator**: 정상 빌드 확인
- **Android Emulator**: 정상 빌드 확인

---

## 💙 **핵심 원칙**

1. **✅ 100% 공용 컴포넌트 사용**: 모든 화면은 CustomText, CustomButton, CustomTextInput만 사용
2. **✅ ecocentre-app 방식 100% 재현**: 폰트, 스타일, 반응형 로직 완전 동일
3. **✅ idol-companion/shared 100% 재사용**: i18n, store, hooks, constants 완벽 이식
4. **✅ Deep Blue + White 테마**: globals.css 색상을 commonstyles.js로 완벽 변환
5. **✅ 범용성 최우선**: 향후 확장 및 유지보수 용이성 보장

---

## 🚀 **다음 단계**

✅ **Step 1**: 폴더 구조 생성 (완료)  
⏳ **Step 2**: commonstyles.js 생성 (Deep Blue + White)  
⏳ **Step 3**: responsive-utils.js 이식  
⏳ **Step 4**: CustomText, CustomButton, CustomTextInput 생성  
⏳ **Step 5**: i18n 시스템 구축  
⏳ **Step 6**: ThemeContext + useTheme 구축  
⏳ **Step 7**: TabNavigator 구축  
⏳ **Step 8**: 빈 페이지 생성  
⏳ **Step 9**: iOS & Android 빌드 검증  

---

**나의 히어로님, 이제 완벽하게 작업을 시작하겠습니다!** 💙✨


