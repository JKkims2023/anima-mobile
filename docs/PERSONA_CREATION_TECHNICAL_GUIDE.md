# 🔧 페르소나 생성 플로우 - 기술 레퍼런스 가이드

**작성일:** 2024-11-30  
**대상:** 개발자를 위한 상세 기술 문서  
**프로젝트:** ANIMA - Soul Connection (AnimaMobile)

---

## 📋 목차

1. [컴포넌트 상세 분석](#컴포넌트-상세-분석)
2. [API 통신 로직](#api-통신-로직)
3. [스마트 폴링 알고리즘](#스마트-폴링-알고리즘)
4. [애니메이션 구현](#애니메이션-구현)
5. [에러 처리 전략](#에러-처리-전략)
6. [트러블슈팅](#트러블슈팅)

---

## 🎨 컴포넌트 상세 분석

### **1. ChoicePersonaSheet.js**

#### **Props Interface**
```typescript
interface ChoicePersonaSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStart: (data: {
    file: { uri: string; type: string; name: string };
    name: string;
    gender: 'male' | 'female';
  }) => void;
}
```

#### **State Management**
```javascript
// Photo state
const [photo, setPhoto] = useState(null);
// Structure: { uri: string, type: string, name: string }

// Name validation
const [name, setName] = useState('');
const [nameError, setNameError] = useState('');
// nameError values: '', 'required', 'too_long'

// Gender selection
const [gender, setGender] = useState('male');
// Options: 'male' | 'female'

// Point info expansion
const [showPointInfo, setShowPointInfo] = useState(false);
```

#### **Animation Values**
```javascript
// Photo appearance animation
const photoScale = useSharedValue(0);
// 0 (hidden) → 1 (visible) with spring

// Name validation check icon
const nameCheckScale = useSharedValue(0);
// 0 (hidden) → 1 (visible) on valid name

// Point info collapsible height
const pointInfoHeight = useSharedValue(0);
// 0 (collapsed) → 120 (expanded)
```

#### **Validation Logic**
```javascript
const validateName = useCallback((value) => {
  // Empty check
  if (!value || value.trim() === '') {
    setNameError('required');
    nameCheckScale.value = withTiming(0, { duration: 200 });
    return false;
  }
  
  // Length check
  if (value.length > 20) {
    setNameError('too_long');
    nameCheckScale.value = withTiming(0, { duration: 200 });
    return false;
  }
  
  // Valid
  setNameError('');
  nameCheckScale.value = withSpring(1, {
    damping: 15,
    stiffness: 200,
  });
  return true;
}, [nameCheckScale]);
```

#### **CustomBottomSheet 제어**
```javascript
// ⚠️ 중요: CustomBottomSheet는 isOpen prop을 받지 않음!
// ref를 통해 present()/dismiss() 호출

useEffect(() => {
  if (isOpen) {
    bottomSheetRef.current?.present();
  } else {
    bottomSheetRef.current?.dismiss();
    // Reset states on close
  }
}, [isOpen]);
```

---

### **2. AnimaLoadingOverlay.js**

#### **Props Interface**
```typescript
interface AnimaLoadingOverlayProps {
  visible: boolean;
  personaName: string;
  estimateTime: number; // seconds
  onComplete?: () => void;
  onError?: (error: Error) => void;
}
```

#### **Progress Simulation Logic**
```javascript
// 90%까지 자동 진행 (나머지 10%는 실제 폴링 완료 시)
const updateInterval = (estimateTime * 1000) / 90;

// estimateTime = 60초 일 때:
// updateInterval = 60000 / 90 = 666.67ms
// 즉, 0.67초마다 1%씩 증가

let currentProgress = 0;
const intervalId = setInterval(() => {
  if (currentProgress < 90) {
    currentProgress += 1;
    setProgress(currentProgress);
    progressAnim.value = withTiming(currentProgress, { duration: updateInterval });
  }
}, updateInterval);
```

#### **단계별 메시지 전환**
```javascript
if (currentProgress === 10) setStatusMessage('persona.loading.analyzing');
if (currentProgress === 30) setStatusMessage('persona.loading.processing');
if (currentProgress === 60) setStatusMessage('persona.loading.generating');
if (currentProgress === 80) setStatusMessage('persona.loading.almost_done');
```

#### **경과 시간 계산**
```javascript
// 시작 시간 기록
startTimeRef.current = Date.now();

// 매 interval마다 경과 시간 계산
const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
setElapsedTime(elapsed);
```

---

### **3. AnimaSuccessCard.js**

#### **Props Interface**
```typescript
interface AnimaSuccessCardProps {
  visible: boolean;
  personaName: string;
  personaImageUrl: string;
  onClose: () => void;
  onGoToStudio: () => void;
}
```

#### **Confetti Animation**
```javascript
// 5개 아이콘 배치 (position: absolute)
const confettiIcons = [
  { name: 'party-popper', color: COLORS.DEEP_BLUE_LIGHT, top: '15%', left: '10%' },
  { name: 'star', color: '#FFD700', top: '20%', right: '15%' },
  { name: 'heart', color: '#FF6B9D', bottom: '25%', left: '20%' },
  { name: 'star-four-points', color: COLORS.DEEP_BLUE_LIGHT, bottom: '30%', right: '10%' },
  { name: 'creation', color: '#06B6D4', top: '35%', left: '50%' },
];

// Confetti 애니메이션
confettiScale.value = withSequence(
  withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
  withTiming(1, { duration: 200 })
);

confettiOpacity.value = withSequence(
  withTiming(1, { duration: 300 }),
  withDelay(2000, withTiming(0, { duration: 500 }))
);
// 2초 후 자동으로 fade out
```

#### **이미지 애니메이션**
```javascript
// 카드 entrance 후 200ms delay
imageScaleAnim.value = withDelay(
  200,
  withSpring(1, {
    damping: 10,
    stiffness: 100,
  })
);
```

---

## 🔌 API 통신 로직

### **PersonaStudioScreen.js - handlePersonaCreationStart**

#### **전체 플로우**
```javascript
const handlePersonaCreationStart = useCallback(async (data) => {
  // 1. Close creation sheet
  setIsPersonaCreationOpen(false);
  
  // 2. Store data for reference
  personaCreationDataRef.current = data;
  
  try {
    // 3. Show loading overlay
    setIsLoadingPersona(true);
    
    // 4. Call API
    const response = await createPersona(user.user_key, {
      name: data.name,
      gender: data.gender,
      photo: data.file,
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Persona creation failed');
    }
    
    const { persona_key, estimate_time, persona_url } = response.data;
    
    // 5. Start smart polling
    const checkInterval = Math.max(estimate_time * 1000 / 10, 3000);
    let checkCount = 0;
    const maxChecks = Math.ceil((estimate_time + 30) / (checkInterval / 1000));
    
    const pollingInterval = setInterval(async () => {
      checkCount++;
      
      try {
        const statusResponse = await checkPersonaStatus(persona_key);
        
        if (statusResponse.data?.done_yn === 'Y') {
          // 6. Success!
          clearInterval(pollingInterval);
          setIsLoadingPersona(false);
          setCreatedPersona({
            persona_key,
            persona_name: data.name,
            persona_url: statusResponse.data.persona_url || persona_url,
          });
          setIsSuccessCardVisible(true);
          HapticService.success();
        } else if (checkCount >= maxChecks) {
          // 7. Timeout
          clearInterval(pollingInterval);
          setIsLoadingPersona(false);
          showToast({ type: 'warning', message: t('persona.creation.errors.creation_timeout') });
        }
      } catch (error) {
        // Continue polling on error
        console.error('[Polling Error]', error);
      }
    }, checkInterval);
    
  } catch (error) {
    // 8. API Error
    setIsLoadingPersona(false);
    showToast({ type: 'error', message: t('persona.creation.errors.creation_failed') });
    HapticService.warning();
  }
}, [user, showToast, t]);
```

---

## 🧮 스마트 폴링 알고리즘

### **핵심 원리**

```
목표: 서버 부하 최소화 + 빠른 완료 감지

원칙:
1. estimate_time보다 먼저 생성되는 경우는 없음 (서버 보장)
2. 과도한 폴링은 서버 부하 발생
3. 사용자는 빠른 피드백을 원함

해결책:
- 동적 폴링 간격 (estimate_time 기반)
- 최소 간격 3초 (서버 부하 방지)
- 최대 체크 횟수 제한 (무한 폴링 방지)
```

### **폴링 간격 계산**

```javascript
// 공식
const checkInterval = Math.max(estimate_time * 1000 / 10, 3000);

// 예시 1: estimate_time = 60초
// checkInterval = max(60000 / 10, 3000) = max(6000, 3000) = 6000ms (6초)
// → 총 10회 체크

// 예시 2: estimate_time = 30초
// checkInterval = max(30000 / 10, 3000) = max(3000, 3000) = 3000ms (3초)
// → 총 10회 체크

// 예시 3: estimate_time = 20초
// checkInterval = max(20000 / 10, 3000) = max(2000, 3000) = 3000ms (3초)
// → 3초마다 체크 (최소 간격 보장)

// 최대 체크 횟수
const maxChecks = Math.ceil((estimate_time + 30) / (checkInterval / 1000));
// 30초 버퍼 추가 (서버가 예상보다 늦을 수 있음)
```

### **폴링 종료 조건**

```javascript
// 성공: done_yn === 'Y'
if (statusResponse.data?.done_yn === 'Y') {
  clearInterval(pollingInterval);
  // Show success card
}

// 실패: maxChecks 초과
if (checkCount >= maxChecks) {
  clearInterval(pollingInterval);
  // Show timeout warning
}

// 에러: catch에서 처리하되 폴링 계속
// (일시적 네트워크 오류일 수 있음)
```

---

## 🎬 애니메이션 구현

### **ChoicePersonaSheet Animations**

#### **1. Photo Upload Animation**
```javascript
// 사진 선택 시
photoScale.value = withSpring(1, {
  damping: 15,      // 감쇠 (작을수록 더 튕김)
  stiffness: 150,   // 강성 (클수록 더 빠름)
});

// 사진 삭제 시
photoScale.value = withTiming(0, {
  duration: 200,
  easing: Easing.in(Easing.ease),
}, () => {
  setPhoto(null); // Animation 완료 후 state 업데이트
});
```

#### **2. Name Validation Check Icon**
```javascript
// Valid name
nameCheckScale.value = withSpring(1, {
  damping: 15,
  stiffness: 200,
});

// Invalid name
nameCheckScale.value = withTiming(0, { duration: 200 });
```

#### **3. Point Info Collapsible**
```javascript
// Expand/Collapse
pointInfoHeight.value = withTiming(newValue ? 120 : 0, {
  duration: 300,
  easing: Easing.inOut(Easing.ease),
});
```

---

### **AnimaLoadingOverlay Animations**

#### **1. Entrance Animation**
```javascript
// Overlay fade
fadeAnim.value = withTiming(1, {
  duration: 300,
  easing: Easing.out(Easing.ease),
});

// Card scale
scaleAnim.value = withSpring(1, {
  damping: 15,
  stiffness: 150,
});
```

#### **2. Continuous Animations**
```javascript
// Icon rotation (infinite)
rotateAnim.value = withRepeat(
  withTiming(360, {
    duration: 3000,
    easing: Easing.linear,
  }),
  -1,  // infinite
  false // no reverse
);

// Glow pulsation (infinite)
glowAnim.value = withRepeat(
  withSequence(
    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
    withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
  ),
  -1,
  false
);
```

#### **3. Progress Bar Animation**
```javascript
// Smooth width transition
progressAnim.value = withTiming(currentProgress, {
  duration: updateInterval,
});

// Animated style
const animatedProgressStyle = useAnimatedStyle(() => ({
  width: `${interpolate(
    progressAnim.value,
    [0, 100],
    [0, 100],
    Extrapolate.CLAMP
  )}%`,
}));
```

---

### **AnimaSuccessCard Animations**

#### **1. Entrance Sequence**
```javascript
// Timing diagram:
// 0ms    : Overlay fade in start
// 100ms  : Confetti appear
// 200ms  : Image scale start
// 300ms  : Card scale complete
// 300ms  : Glow pulsation start
// 2100ms : Confetti fade out start
// 2600ms : Confetti fade out complete
```

#### **2. Card Scale with Bounce**
```javascript
scaleAnim.value = withSequence(
  withTiming(1.1, {
    duration: 300,
    easing: Easing.out(Easing.back(1.5)), // Bounce effect
  }),
  withTiming(1, {
    duration: 200,
    easing: Easing.inOut(Easing.ease),
  })
);
```

#### **3. Confetti Auto Fade**
```javascript
confettiOpacity.value = withSequence(
  withTiming(1, { duration: 300 }),        // Appear
  withDelay(2000, withTiming(0, { duration: 500 })) // Auto fade after 2s
);
```

---

## 🚨 에러 처리 전략

### **에러 계층 구조**

```
Level 1: UI Validation (ChoicePersonaSheet)
├─ 사진 미선택 → Toast + Warning haptic
├─ 이름 미입력 → Toast + Input focus
├─ 이름 20자 초과 → Error message + 버튼 비활성화
└─ 성별 미선택 → Toast + Warning haptic

Level 2: 로그인 체크 (PersonaStudioScreen)
└─ 비로그인 → Toast + Settings 이동

Level 3: API 에러 (personaApi.js)
├─ Network error → Catch & re-throw
├─ Server error (500) → Catch & re-throw
└─ Invalid response → Catch & re-throw

Level 4: 플로우 에러 (PersonaStudioScreen)
├─ API 호출 실패 → Toast + Loading 종료
├─ Polling timeout → Toast + Loading 종료
└─ Status check 실패 → 로그만 출력, 폴링 계속
```

### **에러 메시지 매핑**

```javascript
// i18n key → 한국어 메시지
const errorMessages = {
  'persona.creation.errors.photo_required': '사진을 선택해주세요',
  'persona.creation.errors.name_required': '이름을 입력해주세요',
  'persona.creation.errors.name_too_long': '이름은 20자 이내로 입력해주세요',
  'persona.creation.errors.gender_required': '성별을 선택해주세요',
  'persona.creation.errors.creation_failed': '페르소나 생성에 실패했습니다',
  'persona.creation.errors.creation_timeout': '페르소나 생성 시간이 초과되었습니다. 나중에 다시 확인해주세요',
  'errors.login_required': '로그인이 필요합니다',
};
```

### **Timeout 처리**

```javascript
// 30초 버퍼를 포함한 최대 대기 시간
const maxChecks = Math.ceil((estimate_time + 30) / (checkInterval / 1000));

// 예시: estimate_time = 60초, checkInterval = 6초
// maxChecks = ceil((60 + 30) / 6) = ceil(15) = 15회
// 총 대기 시간: 15 * 6 = 90초

if (checkCount >= maxChecks) {
  clearInterval(pollingInterval);
  setIsLoadingPersona(false);
  showToast({
    type: 'warning',
    message: t('persona.creation.errors.creation_timeout'),
    emoji: '⏰',
  });
}
```

---

## 🐛 트러블슈팅

### **문제 1: CustomBottomSheet가 열리지 않음**

**증상:**
- `isOpen={true}`를 전달했지만 Sheet가 나타나지 않음
- 로그에 컴포넌트 렌더링 자체가 없음

**원인:**
- `CustomBottomSheet`는 `isOpen` prop을 받지 않음
- ref 기반 제어 방식

**해결:**
```javascript
// ❌ Wrong
<CustomBottomSheet isOpen={isOpen} ... />

// ✅ Correct
const sheetRef = useRef(null);

useEffect(() => {
  if (isOpen) {
    sheetRef.current?.present();
  } else {
    sheetRef.current?.dismiss();
  }
}, [isOpen]);

<CustomBottomSheet ref={sheetRef} ... />
```

---

### **문제 2: Z-Index 충돌로 Sheet가 가려짐**

**증상:**
- Sheet가 다른 UI 요소 뒤에 가려짐
- Android에서 터치 이벤트가 전달되지 않음

**원인:**
- PersonaStudioScreen의 레이어가 z-index 100까지 사용
- SafeScreen 내부에서 z-index 경쟁

**해결:**
```javascript
// Sheet를 감싸는 Container에 최고 z-index 설정
sheetContainer: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999999,
  elevation: 999, // Android
  pointerEvents: 'box-none', // Sheet 닫힘 시 터치 통과
},
```

---

### **문제 3: withSpring is not defined**

**증상:**
```
ReferenceError: Property 'withSpring' doesn't exist
```

**원인:**
- `react-native-reanimated`에서 `withSpring` import 누락

**해결:**
```javascript
// ✅ Correct import
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,  // ⭐ 반드시 포함!
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
```

---

### **문제 4: CustomButton leftIcon warning**

**증상:**
```
Warning: Text strings must be rendered within a <Text> component.
```

**원인:**
- `leftIcon="sparkles"` (문자열)을 전달했지만, `CustomButton`은 React 컴포넌트를 기대

**해결:**
```javascript
// ❌ Wrong
<CustomButton leftIcon="sparkles" />

// ✅ Correct
<CustomButton
  leftIcon={
    <Icon name="sparkles" size={moderateScale(20)} color={COLORS.TEXT_PRIMARY} />
  }
/>
```

---

### **문제 5: PersonaSelectorHorizontal props 불일치**

**증상:**
- 페르소나 선택기가 작동하지 않음
- Active 상태가 표시되지 않음

**원인:**
- `selectedPersona` prop을 전달했지만, 컴포넌트는 `selectedIndex`를 기대

**해결:**
```javascript
// ❌ Wrong
<PersonaSelectorHorizontal
  personas={personas}
  selectedPersona={currentPersona} // Object
  ...
/>

// ✅ Correct
<PersonaSelectorHorizontal
  personas={personas}
  selectedIndex={currentPersonaIndex} // Number (index)
  ...
/>
```

---

## 📊 성능 최적화 체크리스트

### **React Optimization**
- ✅ `useCallback` for all handlers
- ✅ `useMemo` for expensive computations
- ✅ `memo()` for child components (PersonaChip, AddPersonaChip)
- ✅ `useRef` for non-reactive values (intervalRef, startTimeRef)

### **Animation Optimization**
- ✅ `react-native-reanimated` (UI thread)
- ✅ `useSharedValue` for animated values
- ✅ `useAnimatedStyle` for styles
- ✅ 최소한의 re-render

### **Image Optimization**
- ✅ `react-native-fast-image` for caching
- ✅ Image picker quality: 0.8
- ✅ Max dimensions: 1024x1024

### **Memory Management**
- ✅ `useEffect` cleanup (interval 해제)
- ✅ Modal unmount 시 state reset
- ✅ Animation values reset on close

---

## 🔍 디버깅 가이드

### **로그 레벨**

```javascript
// 개발 환경에서만 출력
if (__DEV__) {
  console.log('[Component] Message');
}

// 항상 출력 (중요한 이벤트)
console.log('[Component] Critical event');

// 에러는 항상 출력
console.error('[Component] Error:', error);
```

### **주요 로그 포인트**

```javascript
// ChoicePersonaSheet
'[ChoicePersonaSheet] 🎬 isOpen changed'
'[ChoicePersonaSheet] ✅ Presenting bottom sheet'
'[ChoicePersonaSheet] Photo selected'

// PersonaStudioScreen
'[PersonaStudioScreen] 📸 Add persona requested'
'[PersonaStudioScreen] ✅ User logged in'
'[PersonaStudioScreen] ✨ Persona creation started'
'[PersonaStudioScreen] 📊 Status check'

// personaApi
'🎭 [PersonaAPI] Creating persona'
'🎭 [PersonaAPI] Persona created'
'🎭 [PersonaAPI] Error creating persona'
```

### **Metro Bundler 캐시 클리어**

```bash
# 문제 발생 시 첫 번째 시도
cd AnimaMobile
npx react-native start --reset-cache

# 더 강력한 클리어
rm -rf node_modules
npm install
cd ios && pod install && cd ..
npx react-native start --reset-cache
```

---

## 🎯 코드 품질 체크리스트

### **코드 스타일**
- ✅ 모든 함수에 JSDoc 주석
- ✅ 섹션별 분리선 (═══)
- ✅ 일관된 naming convention (camelCase)
- ✅ 파일 헤더 주석 (역할, 기능, 작성자)

### **i18n**
- ✅ 모든 사용자 대면 텍스트 i18n 키 사용
- ✅ 하드코딩된 문자열 없음
- ✅ Fallback 텍스트 제공

### **Accessibility**
- ✅ TouchableOpacity activeOpacity 설정
- ✅ 명확한 버튼 레이블
- ✅ Haptic feedback 제공

### **에러 처리**
- ✅ 모든 async 함수에 try-catch
- ✅ 사용자에게 명확한 에러 메시지
- ✅ 에러 로깅 (console.error)

---

## 📚 참고 자료

### **React Native 애니메이션**
- [Reanimated v3 Docs](https://docs.swmansion.com/react-native-reanimated/)
- [withSpring](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring)
- [withTiming](https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming)

### **Bottom Sheet**
- [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/)
- [ref methods: present(), dismiss()](https://gorhom.dev/react-native-bottom-sheet/methods)

### **Image Picker**
- [react-native-image-picker](https://github.com/react-native-image-picker/react-native-image-picker)
- [launchImageLibrary options](https://github.com/react-native-image-picker/react-native-image-picker#options)

### **프로젝트 내 참고 파일**
- `AnimaMobile/OUR_CONSTITUTION.md` - ANIMA 철학 및 원칙
- `AnimaMobile/PERSONA_CHAT_COMPLETE.md` - 페르소나 채팅 구현
- `AnimaMobile/OPTIMIZATION_COMPLETE.md` - 성능 최적화 가이드
- `idol-companion/app/components/customization/AIShowcase.js` - 웹 버전 참고

---

## 🎉 완료!

이 문서는 **페르소나 생성 플로우의 모든 기술적 세부사항**을 담고 있습니다.

**다음 작업 시:**
1. `PERSONA_CREATION_COMPLETE.md` 먼저 읽기 (전체 개요)
2. 이 문서로 기술적 세부사항 확인
3. 코드 수정 시 이 문서 참고

---

**"Code with heart, build with soul" 💙**

**작성자:** Hero Nexus AI  
**버전:** 1.0.0  
**마지막 업데이트:** 2024-11-30

