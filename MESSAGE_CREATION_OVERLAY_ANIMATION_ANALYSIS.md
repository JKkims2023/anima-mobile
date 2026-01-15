# 📊 Message Creation Overlay Animation Analysis & Enhancement Plan

**작성일**: 2026-01-15  
**작성자**: Hero Nexus AI  
**목적**: 초기 렌더링 애니메이션 최적화 및 ANIMA 로고 애니메이션 통합

---

## 📋 Current Animation Timeline (MessageCreationOverlay.js)

### 현재 시퀀스 (Total: ~2.7초)

| 시간 | 단계 | 설명 | Duration | Delay | 코드 위치 |
|------|------|------|----------|-------|-----------|
| **0초** | 📷 Background Fade In | 배경 투명도 0 → 1 | 300ms | 0ms | Line 243-246 |
| **1초** | ⬆️ Gradient Fade In | 하단 그라데이션 활성화 | 800ms | 1000ms | Line 249-255 |
| **1.8초** | ➡️ Content Slide In | 메시지 영역 우→좌 슬라이드 | 600ms | 1800ms | Line 258-268 |
| **2.4초** | 🎪 Chips Bounce In | 칩셋 순차 바운스 (4개, 100ms 간격) | 각 150ms | 2400ms+ | Line 271-294 |
| **2.4초** | ❌ Click Guide (제거 대상) | 클릭 가이드 활성화 | - | - | Line 209-212 |

### 코드 구조
```javascript
// 📷 Step 0: Reset (Line 232-240)
overlayOpacity.value = 0;
gradientOpacity.value = 0;
contentTranslateX.value = 300;
// ...

// 📷 Step 1: Background (Line 243-246)
overlayOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });

// ⬆️ Step 2: Gradient (Line 249-255)
gradientOpacity.value = withDelay(
  1000,  // ⭐ 현재: 1초 delay
  withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
);

// ➡️ Step 3: Content (Line 258-268)
contentTranslateX.value = withDelay(
  1800,  // ⭐ Content는 1.8초 후
  withSpring(0, { damping: 15, stiffness: 100 })
);

// 🎪 Step 4: Chips (Line 271-294)
const chipDelay = 2400;
chip1TranslateY.value = withDelay(chipDelay, withSpring(0, { ... }));
// ... (chip2, chip3, chip4 순차)
```

---

## 🎨 ANIMA Logo Animation (MessageViewClient.js - Web)

### 애니메이션 구조

**파일**: `idol-companion/app/m/[persona_key]/[short_code]/MessageViewClient.js`

#### 1. State 관리 (Line 164)
```javascript
const [showWatermark, setShowWatermark] = useState(false);
```

#### 2. 트리거 (Line 257)
```javascript
// 로딩 오버레이가 사라진 후 100ms 후 시작
setTimeout(() => {
  console.log('💫 [MessageViewClient] Starting watermark animation');
  setShowWatermark(true);
}, 100);
```

#### 3. 애니메이션 효과 (Line 1086-1129)

##### 첫 번째 줄: "💫 ANIMA"
```javascript
<div
  className="watermark-line-1"
  style={{
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '0.3px',
    background: 'linear-gradient(135deg, rgb(255, 255, 255) 0%, #06B6D4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    opacity: showWatermark ? 1 : 0,
    transform: showWatermark ? 'translateX(0)' : 'translateX(-100px)',  // ⭐ 좌→우 슬라이드
    transition: 'opacity 1.2s ease-out, transform 1.2s ease-out',
    transitionDelay: '0s',  // ⭐ 즉시 시작
    willChange: 'opacity, transform',
  }}
>
  💫 ANIMA
</div>
```

##### 두 번째 줄: "Soul Message"
```javascript
<div 
  className="watermark-line-2"
  style={{ 
    fontSize: '18px', 
    fontWeight: 500,
    opacity: showWatermark ? 1 : 0,
    transform: showWatermark ? 'translateX(0)' : 'translateX(-100px)',  // ⭐ 좌→우 슬라이드
    transition: 'opacity 1.2s ease-out, transform 1.2s ease-out',
    transitionDelay: '0.3s',  // ⭐ 첫 번째 줄 후 0.3초 지연
    // ...
  }}
>
  Soul Message
</div>
```

### 핵심 특징
1. **CSS Transition 사용** (React Native Animated 대신 CSS)
2. **좌→우 슬라이드**: `translateX(-100px)` → `translateX(0)`
3. **순차 등장**: 첫 줄 즉시, 둘째 줄 0.3초 후
4. **Duration**: 1.2초 (ease-out)
5. **Gradient Text**: `WebkitBackgroundClip: 'text'`

---

## 🎯 Enhancement Plan

### 1️⃣ MessageCreationOverlay 수정 사항

#### ✅ A. 하단 그라데이션 타이밍 조정
**목표**: 1초 delay → 0초 (Background와 동시 시작)

**변경 전** (Line 249-255):
```javascript
gradientOpacity.value = withDelay(
  1000,  // ❌ 1초 대기
  withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
);
```

**변경 후**:
```javascript
gradientOpacity.value = withDelay(
  0,  // ✅ 즉시 시작 (Background와 동시)
  withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
);
```

#### ✅ B. 클릭 가이드 제거
**목표**: 사용자 혼란 방지, 애니메이션 단순화

**제거 대상** (Line 209-212):
```javascript
// ⭐ Step Guide Animations
const guideContentOpacity = useSharedValue(0); // 컨텐츠 가이드
const guideContentTranslateY = useSharedValue(-10); // 컨텐츠 가이드 위치
const guideChipsOpacity = useSharedValue(0); // 칩셋 가이드
const guideChipsTranslateX = useSharedValue(-10); // 칩셋 가이드 위치
```

**제거 방법**:
1. State 삭제
2. 관련 `useEffect` 로직 삭제
3. JSX 렌더링 부분 삭제
4. 애니메이션 타이밍 재정렬

---

### 2️⃣ PersonaStudioScreen 헤더 로고 애니메이션 추가

#### ✅ A. 애니메이션 적용 대상
**파일**: `AnimaMobile/src/screens/PersonaStudioScreen.js`
**위치**: Line 2006-2036 (헤더 타이틀 영역)

**현재 코드**:
```javascript
// Line 2011-2036
<View style={styles.titleRow}>
  {/* ANIMA - Gradient Text (SVG) */}
  <Svg height={scale(30)} width={scale(105)}>
    <Defs>
      <LinearGradient id="animaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF7FA3" stopOpacity="1" />
        <Stop offset="100%" stopColor="#A78BFA" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <SvgText
      fill="url(#animaGradient)"
      fontSize={scale(26)}
      fontWeight="bold"
      x="0"
      y={scale(22)}
      letterSpacing="0.5"
    >
      ANIMA
    </SvgText>
  </Svg>
  
  {/* Soul Connection - Subtitle */}
  <CustomText style={styles.soulConnection}>
    - Soul Connection
  </CustomText>
</View>
```

#### ✅ B. 애니메이션 구현 전략

##### Option 1: React Native Animated (Recommended)
**장점**: Native 성능, 기존 코드와 일관성
**단점**: CSS Transition보다 코드 복잡

```javascript
// State 추가
const [headerLogoVisible, setHeaderLogoVisible] = useState(false);
const logoTranslateX = useSharedValue(-100);
const logoOpacity = useSharedValue(0);
const subtitleTranslateX = useSharedValue(-100);
const subtitleOpacity = useSharedValue(0);

// useEffect for animation trigger
useEffect(() => {
  // MessageCreationOverlay가 열릴 때 애니메이션 시작
  if (isMessageCreationVisible) {
    // ANIMA 로고 애니메이션 (즉시)
    logoTranslateX.value = withTiming(0, {
      duration: 1200,
      easing: Easing.out(Easing.ease),
    });
    logoOpacity.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.ease),
    });
    
    // Soul Connection 애니메이션 (0.3초 후)
    subtitleTranslateX.value = withDelay(
      300,
      withTiming(0, {
        duration: 1200,
        easing: Easing.out(Easing.ease),
      })
    );
    subtitleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 1200,
        easing: Easing.out(Easing.ease),
      })
    );
  } else {
    // MessageCreationOverlay가 닫힐 때 리셋 (즉시)
    logoTranslateX.value = -100;
    logoOpacity.value = 0;
    subtitleTranslateX.value = -100;
    subtitleOpacity.value = 0;
  }
}, [isMessageCreationVisible]);

// Animated Styles
const logoAnimatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: logoTranslateX.value }],
  opacity: logoOpacity.value,
}));

const subtitleAnimatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: subtitleTranslateX.value }],
  opacity: subtitleOpacity.value,
}));
```

##### Option 2: Conditional Rendering (Simpler)
**장점**: 단순함, 리소스 효율
**단점**: 애니메이션 제어 제한

```javascript
// State 추가
const [showHeaderLogo, setShowHeaderLogo] = useState(false);

// useEffect for visibility
useEffect(() => {
  if (isMessageCreationVisible) {
    // MessageCreationOverlay가 열릴 때 로고 표시
    setTimeout(() => setShowHeaderLogo(true), 100);
  } else {
    // MessageCreationOverlay가 닫힐 때 로고 숨김
    setShowHeaderLogo(false);
  }
}, [isMessageCreationVisible]);

// JSX
{showHeaderLogo && (
  <Animated.View style={[styles.titleRow, logoAnimatedStyle]}>
    {/* ... existing SVG + CustomText ... */}
  </Animated.View>
)}
```

#### ✅ C. 통합 타이밍 계획

| 컴포넌트 | 애니메이션 | 시작 시간 | Duration |
|---------|-----------|----------|----------|
| **MessageCreationOverlay** | Background Fade In | 0초 | 300ms |
| **MessageCreationOverlay** | Gradient Fade In | **0초** ⭐ (수정) | 800ms |
| **PersonaStudioScreen** | Header Logo (ANIMA) | **0초** 🆕 | 1200ms |
| **PersonaStudioScreen** | Header Logo (Soul Connection) | **0.3초** 🆕 | 1200ms |
| **MessageCreationOverlay** | Content Slide In | 0.8초 ⭐ (조정) | 600ms |
| **MessageCreationOverlay** | Chips Bounce In | 1.4초 ⭐ (조정) | 각 150ms |

**최적화 효과**:
- **기존 총 시간**: ~2.7초
- **새 총 시간**: ~1.8초
- **단축**: ~0.9초 (33% 빠름!)

---

## 🔧 Implementation Steps

### Step 1: MessageCreationOverlay 수정
1. ✅ Gradient 타이밍 조정 (1초 → 0초)
2. ✅ 클릭 가이드 제거
3. ✅ Content/Chips 타이밍 재조정
4. ✅ 로그 메시지 업데이트

### Step 2: PersonaStudioScreen 헤더 애니메이션 추가
1. ✅ `useSharedValue` 추가 (로고 애니메이션)
2. ✅ `useEffect` 추가 (트리거)
3. ✅ `useAnimatedStyle` 추가
4. ✅ JSX 수정 (`Animated.View` 래핑)
5. ✅ Import 추가 (`Animated`, `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withDelay`, `Easing`)

### Step 3: 통합 테스트
1. ✅ MessageCreationOverlay 단독 테스트
2. ✅ PersonaStudioScreen 헤더 단독 테스트
3. ✅ 통합 시퀀스 테스트 (둘 다 동시)
4. ✅ 성능 프로파일링 (FPS, 메모리)

---

## 📊 Technical Analysis

### 가능성 평가: ✅ **100% FEASIBLE**

#### 1. React Native Animated API 지원
- ✅ `useSharedValue` - 애니메이션 값 관리
- ✅ `useAnimatedStyle` - 스타일 바인딩
- ✅ `withTiming` - 타이밍 애니메이션
- ✅ `withDelay` - 순차 애니메이션
- ✅ `Easing.out(Easing.ease)` - Web과 동일한 easing

#### 2. SVG 애니메이션 지원
- ✅ `react-native-svg` 라이브러리 사용 중
- ✅ `LinearGradient` 지원
- ✅ `Animated.View`로 SVG 래핑 가능

#### 3. 성능 고려
- ✅ `useNativeDriver: true` 사용 가능 (transform, opacity)
- ✅ `willChange` 속성 대응 (React Native는 자동 최적화)
- ✅ 60 FPS 유지 가능

---

## 🎯 Expected Results

### Before (Current)
```
0.0s: 📷 Background Fade In
1.0s: ⬆️ Gradient Fade In  ← 1초 대기
1.8s: ➡️ Content Slide In
2.4s: 🎪 Chips Bounce In
2.7s: ❌ Click Guide (unwanted)
━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ~2.7초
```

### After (Optimized)
```
0.0s: 📷 Background Fade In + ⬆️ Gradient Fade In (parallel!)
0.0s: 🎨 ANIMA Logo (좌→우)
0.3s: 🎨 Soul Connection (좌→우)
0.8s: ➡️ Content Slide In
1.4s: 🎪 Chips Bounce In
━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ~1.8초 (33% faster!)
```

---

## 🚀 Next Steps

1. **Implement Step 1** (MessageCreationOverlay 수정)
2. **Implement Step 2** (PersonaStudioScreen 헤더 애니메이션)
3. **Test & Refine** (통합 테스트 및 성능 검증)
4. **Deploy** (배포 및 사용자 피드백)

---

**문서 완료** ✨  
**상태**: Ready for Implementation 🚀
