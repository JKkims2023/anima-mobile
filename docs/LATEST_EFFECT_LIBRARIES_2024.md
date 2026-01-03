# 🎨 최신 특수효과 라이브러리 분석 (2024-2025)

> **"기술이 아닌 감성으로, 악마의 디테일을 담아"**  
> — ANIMA Constitution

---

## 📋 목차

1. [🎯 조사 목적](#-조사-목적)
2. [✅ 현재 구현된 효과](#-현재-구현된-효과)
3. [🔥 React Native 전용 최신 라이브러리](#-react-native-전용-최신-라이브러리)
4. [💡 추천 신규 효과](#-추천-신규-효과)
5. [⚠️ 호환성 분석](#️-호환성-분석)
6. [🎬 구현 로드맵](#-구현-로드맵)
7. [🏆 최종 권장사항](#-최종-권장사항)

---

## 🎯 조사 목적

### 현재 상황

**AnimaMobile 프로젝트에 이미 구현된 효과들**:

**텍스트 애니메이션** (4종):
- `fade_in`: 부드럽게 나타남
- `typing`: 타이핑 효과 (15ms/char)
- `scale_in`: 작게 → 크게
- `slide_cross`: 제목 좌→우, 내용 우→좌

**파티클 효과** (8종):
- `confetti`: 축하 색종이
- `hearts`: 하트 애니메이션
- `snow`: 눈 내림
- `sparkles`: 반짝임
- `comfort_light`: 위로의 빛
- `hope_star`: 희망의 별
- `rain_soft`: 부드러운 비
- `none`: 효과 없음

### 목표

1. **최신 라이브러리 조사**
   - 2024-2025년 React Native 생태계
   - 감성적이고 독특한 효과들
   - 성능과 안정성 검증

2. **신규 효과 제안**
   - 기존 효과를 보완하는 새로운 패턴
   - ANIMA 철학에 맞는 감성적 효과
   - 사용자 경험을 향상시키는 디테일

3. **구현 전략 수립**
   - 단계적 도입 계획
   - 호환성 및 성능 고려
   - 기존 코드와의 조화

---

## ✅ 현재 구현된 효과

### 사용 중인 기술 스택

```javascript
// 1. react-native-reanimated (v2)
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  Easing 
} from 'react-native-reanimated';

// 2. requestAnimationFrame (타이핑 효과)
const typingAnimationRef = useRef(null);
typingAnimationRef.current = requestAnimationFrame((ts) => typeNextChar(ts, content));

// 3. 커스텀 파티클 컴포넌트
import ParticleEffect from './particle/ParticleEffect';
```

### 강점

✅ **성능 최적화**:
- `requestAnimationFrame` 활용으로 60fps 유지
- `react-native-reanimated`의 UI 스레드 애니메이션

✅ **감성적 디자인**:
- 각 효과마다 명확한 감정 전달
- ANIMA 철학 반영 (comfort_light, hope_star)

✅ **안정성 검증**:
- iOS/Android 모두 완벽 동작
- 프로덕션 레벨 완성도

### 개선 가능 영역

🔄 **추가 가능한 효과**:
- 3D 변환 효과
- Morphing 효과 (글자 변형)
- Blur & Focus 효과
- Parallax 효과
- Lottie 애니메이션 통합

🔄 **성능 향상**:
- Skia를 활용한 Canvas 기반 렌더링
- Shared Element Transition
- 복잡한 파티클 시스템 최적화

---

## 🔥 React Native 전용 최신 라이브러리

### 1️⃣ react-native-reanimated 3.x (★★★★★)

**공식 사이트**: https://docs.swmansion.com/react-native-reanimated/

#### 🆕 2024년 신규 기능

1. **Shared Element Transitions**
   ```javascript
   import { SharedTransition } from 'react-native-reanimated';
   
   // 화면 전환 시 요소가 부드럽게 이동
   <Animated.View sharedTransitionTag="persona-card">
     <PersonaCard />
   </Animated.View>
   ```

2. **Layout Animations**
   ```javascript
   import { Layout } from 'react-native-reanimated';
   
   // 레이아웃 변경 시 자동 애니메이션
   <Animated.View layout={Layout.springify()}>
     {items.map(item => <Item key={item.id} />)}
   </Animated.View>
   ```

3. **Worklets (고성능)**
   ```javascript
   'worklet';
   const handleScroll = useAnimatedScrollHandler({
     onScroll: (event) => {
       scrollY.value = event.contentOffset.y;
     }
   });
   ```

#### 📊 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 안정성 | ★★★★★ | 프로덕션 검증 완료 |
| 성능 | ★★★★★ | UI 스레드에서 실행 |
| 학습 곡선 | ★★★☆☆ | API 복잡하지만 문서 우수 |
| 호환성 | ★★★★★ | iOS/Android 완벽 |
| 추천도 | ★★★★★ | **최우선 추천** |

#### 💎 ANIMA 적용 가능 효과

**1. Morphing Text (글자 변형)**
```javascript
const morphText = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { perspective: 1000 },
    { rotateX: `${morphText.value * 180}deg` },
    { scale: interpolate(morphText.value, [0, 0.5, 1], [1, 0.8, 1]) }
  ],
}));

// "생일 축하해!" → "Happy Birthday!" 변형
```

**2. Wave Text (물결 텍스트)**
```javascript
const waveAnimation = (index) => {
  return useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withRepeat(
          withTiming(
            Math.sin(index * 0.5 + Date.now() / 1000) * 10,
            { duration: 1000 }
          ),
          -1,
          true
        )
      }
    ]
  }));
};

// 각 글자가 물결치는 효과
```

**3. Breathing Animation (호흡 애니메이션)**
```javascript
const breathe = useSharedValue(1);

useEffect(() => {
  breathe.value = withRepeat(
    withSequence(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
    ),
    -1,
    false
  );
}, []);

// 페르소나가 숨쉬는 듯한 효과
```

---

### 2️⃣ lottie-react-native 6.x (★★★★★)

**공식 사이트**: https://github.com/lottie-react-native/lottie-react-native

#### 🎨 특징

- **After Effects 애니메이션을 JSON으로 변환**
- 벡터 기반으로 용량 작고 선명
- 복잡한 애니메이션도 쉽게 구현

#### 📝 사용 예시

```javascript
import LottieView from 'lottie-react-native';

// 1. 로딩 애니메이션
<LottieView
  source={require('./animations/loading.json')}
  autoPlay
  loop
  style={{ width: 100, height: 100 }}
/>

// 2. 성공 체크 애니메이션
<LottieView
  source={require('./animations/success-check.json')}
  autoPlay
  loop={false}
  onAnimationFinish={() => console.log('완료!')}
/>
```

#### 📊 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 안정성 | ★★★★☆ | 가끔 iOS에서 이슈 |
| 성능 | ★★★★☆ | 복잡한 애니메이션은 느릴 수 있음 |
| 학습 곡선 | ★★★★★ | 매우 쉬움 |
| 디자인 | ★★★★★ | After Effects로 제작 가능 |
| 추천도 | ★★★★★ | **복잡한 애니메이션에 최적** |

#### 💎 ANIMA 적용 가능 효과

**1. 감정 리액션 애니메이션**
- 하트가 터지는 효과 (❤️ → 💥)
- 별이 반짝이는 효과 (⭐ → ✨)
- 축하 폭죽 효과 (🎉)

**2. 로딩 & 트랜지션**
- 페르소나 생성 중 로딩
- 메시지 전송 중 애니메이션
- 화면 전환 효과

**3. 마이크로 인터랙션**
- 버튼 클릭 피드백
- 스와이프 가이드
- 입력 필드 포커스 효과

#### 🎁 무료 Lottie 리소스

1. **LottieFiles**: https://lottiefiles.com/
   - 50만+ 무료 애니메이션
   - 카테고리별 분류
   - 직접 편집 가능

2. **추천 검색 키워드**:
   - "emotional reaction"
   - "heart animation"
   - "celebration confetti"
   - "loading spinner minimal"
   - "success check elegant"

---

### 3️⃣ react-native-skia 0.1.x (★★★★☆)

**공식 사이트**: https://shopify.github.io/react-native-skia/

#### 🎨 특징

- **Skia (구글의 2D 그래픽 엔진) 기반**
- Canvas API 사용
- 고급 그래픽 효과 가능
- Shopify가 개발/유지보수

#### 📝 사용 예시

```javascript
import { Canvas, Circle, Group, Paint, Blur } from '@shopify/react-native-skia';

// 1. 블러 효과
<Canvas style={{ flex: 1 }}>
  <Circle cx={100} cy={100} r={50} color="lightblue">
    <Blur blur={10} />
  </Circle>
</Canvas>

// 2. 그라데이션 파티클
<Canvas style={{ width: 300, height: 300 }}>
  <Group>
    {particles.map((p, i) => (
      <Circle
        key={i}
        cx={p.x}
        cy={p.y}
        r={p.r}
        opacity={p.opacity}
        color={p.color}
      />
    ))}
  </Group>
</Canvas>
```

#### 📊 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 안정성 | ★★★☆☆ | 아직 베타 단계 |
| 성능 | ★★★★★ | 네이티브 수준 |
| 학습 곡선 | ★★☆☆☆ | Canvas API 이해 필요 |
| 고급 효과 | ★★★★★ | 매우 강력 |
| 추천도 | ★★★☆☆ | **고급 효과 필요 시** |

#### 💎 ANIMA 적용 가능 효과

**1. 고급 파티클 시스템**
```javascript
// Physics 기반 파티클
const particles = useParticles({
  count: 100,
  gravity: 0.5,
  wind: 0.1,
  friction: 0.99
});

// 실시간 렌더링
<Canvas>
  {particles.map(p => (
    <Circle cx={p.x} cy={p.y} r={p.r} color={p.color} />
  ))}
</Canvas>
```

**2. Blur & Focus 효과**
```javascript
// 배경 블러 + 텍스트 포커스
<Canvas>
  <Image image={backgroundImage}>
    <Blur blur={20} />
  </Image>
  <Text x={centerX} y={centerY} blur={0}>
    {messageTitle}
  </Text>
</Canvas>
```

**3. Morphing Shape (도형 변형)**
```javascript
// 하트 → 별 변형
<Canvas>
  <Path
    path={interpolatePath(heartPath, starPath, progress)}
    color="pink"
  />
</Canvas>
```

#### ⚠️ 주의사항

1. **베타 단계**: 프로덕션 사용 시 신중
2. **번들 크기 증가**: ~5MB 추가
3. **Android 최소 SDK**: API 21+ 필요

---

### 4️⃣ moti 0.27.x (★★★★☆)

**공식 사이트**: https://moti.fyi/

#### 🎨 특징

- **framer-motion의 React Native 버전**
- 선언적 API (매우 직관적)
- `react-native-reanimated` 기반
- Expo 완벽 지원

#### 📝 사용 예시

```javascript
import { MotiView, MotiText } from 'moti';

// 1. 자동 애니메이션
<MotiView
  from={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ type: 'timing', duration: 500 }}
>
  <PersonaCard />
</MotiView>

// 2. Loop 애니메이션
<MotiView
  from={{ rotate: '0deg' }}
  animate={{ rotate: '360deg' }}
  transition={{
    type: 'timing',
    duration: 2000,
    loop: true,
  }}
>
  <LoadingIcon />
</MotiView>

// 3. 조건부 애니메이션
<MotiText
  animate={{ color: isActive ? '#4FACFE' : '#FFFFFF' }}
>
  {title}
</MotiText>
```

#### 📊 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 안정성 | ★★★★★ | 프로덕션 검증 완료 |
| 성능 | ★★★★★ | Reanimated 기반 |
| 학습 곡선 | ★★★★★ | 매우 쉬움 |
| API 디자인 | ★★★★★ | 직관적 |
| 추천도 | ★★★★★ | **빠른 구현에 최적** |

#### 💎 ANIMA 적용 가능 효과

**1. Entrance Animations (등장 애니메이션)**
```javascript
<MotiView
  from={{ opacity: 0, translateY: 50 }}
  animate={{ opacity: 1, translateY: 0 }}
  delay={300}
>
  <MessageCard />
</MotiView>
```

**2. Hover Effects (터치 피드백)**
```javascript
import { MotiPressable } from 'moti/interactions';

<MotiPressable
  animate={({ hovered, pressed }) => {
    'worklet';
    return {
      scale: pressed ? 0.95 : hovered ? 1.05 : 1,
    };
  }}
>
  <CustomButton />
</MotiPressable>
```

**3. Skeleton Loading (스켈레톤 UI)**
```javascript
<MotiView
  from={{ opacity: 0.3 }}
  animate={{ opacity: 1 }}
  transition={{
    type: 'timing',
    duration: 1000,
    loop: true,
  }}
>
  <Skeleton />
</MotiView>
```

---

### 5️⃣ react-native-svg 14.x (★★★★★)

**공식 사이트**: https://github.com/software-mansion/react-native-svg

#### 🎨 특징

- SVG 렌더링
- 애니메이션 지원
- 경로 morphing 가능
- 매우 안정적

#### 📝 사용 예시

```javascript
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';

// 1. 그라데이션 도형
<Svg height="200" width="200">
  <Defs>
    <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <Stop offset="0" stopColor="#4FACFE" stopOpacity="1" />
      <Stop offset="1" stopColor="#00F2FE" stopOpacity="1" />
    </LinearGradient>
  </Defs>
  <Circle cx="100" cy="100" r="50" fill="url(#grad)" />
</Svg>

// 2. 커스텀 아이콘
<Svg viewBox="0 0 24 24">
  <Path
    d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
    fill="#4FACFE"
  />
</Svg>
```

#### 💎 ANIMA 적용 가능 효과

**1. 아이콘 애니메이션**
- 하트 채우기 애니메이션
- 체크 마크 그리기
- 로딩 스피너

**2. 파티클 경로**
- 하트가 날아가는 경로
- 별이 떨어지는 경로
- 커스텀 파티클 모양

---

## 💡 추천 신규 효과

### 텍스트 애니메이션 (5종 추가)

#### 1. `wave` - 물결 텍스트 ⭐ 추천!

**설명**: 각 글자가 물결치듯 위아래로 움직임

**감정**: 경쾌함, 즐거움

**구현**: `react-native-reanimated` + 각 글자별 delay

```javascript
// 의사코드
characters.map((char, index) => (
  <Animated.Text 
    key={index}
    style={{
      transform: [{ 
        translateY: withRepeat(
          withTiming(Math.sin(index * 0.5) * 10, { duration: 1000 }),
          -1,
          true
        )
      }]
    }}
  >
    {char}
  </Animated.Text>
))
```

**추천 사용처**:
- 생일 축하 메시지
- 축하/응원 메시지
- 경쾌한 분위기

---

#### 2. `morph` - 글자 변형 ⭐⭐ 추천!

**설명**: 글자가 3D 회전하며 변형

**감정**: 신비로움, 놀라움

**구현**: `react-native-reanimated` + rotateX/Y

```javascript
<Animated.Text
  style={{
    transform: [
      { perspective: 1000 },
      { rotateX: `${morphValue.value * 180}deg` }
    ]
  }}
>
  {morphedText}
</Animated.Text>
```

**추천 사용처**:
- 반전/서프라이즈 메시지
- 다국어 전환 효과
- 강조가 필요한 메시지

---

#### 3. `glitch` - 글리치 효과

**설명**: 텍스트가 일시적으로 흐트러짐 (디지털 감성)

**감정**: 현대적, 사이버펑크

**구현**: `react-native-reanimated` + 랜덤 offset

```javascript
const glitchOffset = useSharedValue({ x: 0, y: 0 });

useEffect(() => {
  const interval = setInterval(() => {
    glitchOffset.value = {
      x: Math.random() * 10 - 5,
      y: Math.random() * 10 - 5
    };
  }, 100);
  return () => clearInterval(interval);
}, []);
```

**추천 사용처**:
- 사이버펑크 테마
- 게이밍 메시지
- 현대적/트렌디한 분위기

---

#### 4. `breath` - 호흡 애니메이션 ⭐⭐⭐ 추천!

**설명**: 텍스트가 숨쉬듯 크기 변화

**감정**: 편안함, 생명감

**구현**: `moti` 또는 `react-native-reanimated`

```javascript
<MotiText
  from={{ scale: 1 }}
  animate={{ scale: 1.05 }}
  transition={{
    type: 'timing',
    duration: 2000,
    loop: true,
    easing: Easing.inOut(Easing.ease)
  }}
>
  {text}
</MotiText>
```

**추천 사용처**:
- 위로 메시지
- 명상/힐링 메시지
- 따뜻한 메시지

---

#### 5. `rainbow` - 무지개 색상 변화

**설명**: 텍스트 색상이 무지개처럼 변함

**감정**: 희망, 다채로움

**구현**: `react-native-reanimated` + HSL 색상

```javascript
const hue = useSharedValue(0);

useEffect(() => {
  hue.value = withRepeat(
    withTiming(360, { duration: 5000 }),
    -1,
    false
  );
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  color: `hsl(${hue.value}, 70%, 60%)`
}));
```

**추천 사용처**:
- 희망 메시지
- 다양성 표현
- 밝고 긍정적인 메시지

---

### 파티클 효과 (5종 추가)

#### 1. `fireflies` - 반딧불이 ⭐⭐⭐ 추천!

**설명**: 반딧불이가 부드럽게 날아다님

**감정**: 낭만적, 꿈같음

**구현**: `react-native-skia` 또는 커스텀

```javascript
// 100개의 반딧불이, 부드러운 움직임
particles.map(p => (
  <Circle
    cx={p.x}
    cy={p.y}
    r={3}
    color="yellow"
    opacity={Math.sin(Date.now() / 1000 + p.phase) * 0.5 + 0.5}
  />
))
```

**추천 사용처**:
- 로맨틱 메시지
- 밤 분위기
- 꿈같은 메시지

---

#### 2. `bubbles` - 거품 ⭐⭐ 추천!

**설명**: 거품이 아래에서 위로 떠오름

**감정**: 경쾌함, 청량감

**구현**: 커스텀 파티클 시스템

```javascript
// 거품 물리: 위로 이동 + 좌우 흔들림
bubble.y -= bubble.speed;
bubble.x += Math.sin(bubble.phase + Date.now() / 1000) * 2;
```

**추천 사용처**:
- 청량한 메시지
- 샴페인/축하 느낌
- 경쾌한 분위기

---

#### 3. `sakura` - 벚꽃 ⭐⭐⭐ 추천!

**설명**: 벚꽃잎이 부드럽게 흩날림

**감정**: 감성적, 일본 감성

**구현**: Lottie 또는 커스텀

```javascript
// 벚꽃 물리: 아래로 + 회전 + 좌우 흔들림
sakura.y += sakura.speed;
sakura.rotation += 2;
sakura.x += Math.sin(Date.now() / 500) * 1;
```

**추천 사용처**:
- 이별 메시지
- 감성적 메시지
- 봄 분위기

---

#### 4. `aurora` - 오로라 ⭐⭐ 추천!

**설명**: 오로라처럼 물결치는 빛

**감정**: 신비로움, 경이로움

**구현**: `react-native-skia` + 그라데이션

```javascript
<Canvas>
  <Path
    path={auroraPath}
    opacity={0.6}
    blur={20}
  >
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: height }}
      colors={['#4FACFE', '#00F2FE', '#7B2FBE']}
    />
  </Path>
</Canvas>
```

**추천 사용처**:
- 신비로운 메시지
- 밤하늘 테마
- 경이로움 표현

---

#### 5. `meteor` - 유성 ⭐ 추천!

**설명**: 유성이 대각선으로 떨어짐

**감정**: 소원, 희망

**구현**: 커스텀 파티클 + 꼬리 효과

```javascript
// 유성 꼬리 그리기
<Path
  path={meteorTailPath}
  stroke="white"
  strokeWidth={2}
  opacity={0.8}
>
  <Blur blur={3} />
</Path>
```

**추천 사용처**:
- 소원 메시지
- 희망 메시지
- 밤하늘 테마

---

### 배경 효과 (3종 추가)

#### 1. `parallax` - 패럴랙스 ⭐⭐⭐ 추천!

**설명**: 배경과 전경이 다른 속도로 스크롤

**감정**: 깊이감, 입체감

**구현**: `react-native-reanimated` + scrollY

```javascript
const backgroundTranslate = useAnimatedStyle(() => ({
  transform: [{ translateY: scrollY.value * 0.5 }]
}));

const foregroundTranslate = useAnimatedStyle(() => ({
  transform: [{ translateY: scrollY.value * 1.5 }]
}));
```

**추천 사용처**:
- 긴 메시지
- 스토리텔링
- 깊이감 표현

---

#### 2. `ken_burns` - 켄 번즈 효과

**설명**: 배경 이미지가 천천히 확대/이동

**감정**: 다큐멘터리 감성, 회상

**구현**: `react-native-reanimated` + scale + translate

```javascript
const kenBurnsStyle = useAnimatedStyle(() => ({
  transform: [
    { scale: withTiming(1.2, { duration: 20000 }) },
    { translateX: withTiming(50, { duration: 20000 }) }
  ]
}));
```

**추천 사용처**:
- 추억 메시지
- 회상 장면
- 감성적 메시지

---

#### 3. `vignette` - 비네팅 ⭐⭐ 추천!

**설명**: 화면 가장자리가 어두워지며 중앙 집중

**감정**: 집중, 몰입

**구현**: `react-native-linear-gradient` + radial

```javascript
<LinearGradient
  colors={['transparent', 'rgba(0,0,0,0.6)']}
  start={{ x: 0.5, y: 0.5 }}
  end={{ x: 1, y: 1 }}
  style={StyleSheet.absoluteFill}
/>
```

**추천 사용처**:
- 중요한 메시지
- 집중이 필요한 내용
- 감성적 분위기

---

## ⚠️ 호환성 분석

### React Native 버전 호환성

| 라이브러리 | 최소 RN 버전 | iOS 최소 | Android 최소 | 비고 |
|-----------|-------------|---------|--------------|------|
| react-native-reanimated 3 | 0.71+ | iOS 13+ | API 21+ | ✅ 권장 |
| lottie-react-native 6 | 0.66+ | iOS 12+ | API 21+ | ✅ 권장 |
| react-native-skia 0.1 | 0.71+ | iOS 13+ | API 21+ | ⚠️ 베타 |
| moti 0.27 | 0.71+ | iOS 13+ | API 21+ | ✅ 권장 |
| react-native-svg 14 | 0.70+ | iOS 13+ | API 21+ | ✅ 권장 |

### 현재 AnimaMobile 환경

```json
{
  "react-native": "0.73.0",
  "react-native-reanimated": "2.x",
  "react-native-vector-icons": "10.x"
}
```

### 업그레이드 필요사항

1. **react-native-reanimated 2 → 3**
   - Breaking Changes 있음
   - Migration Guide 필수 확인
   - 점진적 마이그레이션 가능

2. **신규 라이브러리 추가**
   ```bash
   npm install lottie-react-native@6
   npm install moti@0.27
   # (선택) npm install @shopify/react-native-skia
   ```

3. **iOS Pod 업데이트**
   ```bash
   cd ios && pod install
   ```

---

## 🎬 구현 로드맵

### Phase 1: 준비 (1주)

**목표**: 환경 설정 및 테스트

- [ ] react-native-reanimated 3.x 업그레이드
- [ ] lottie-react-native 설치
- [ ] moti 설치
- [ ] 테스트 프로젝트 생성
- [ ] 호환성 확인

**예상 위험**:
- Reanimated 3 마이그레이션 이슈
- iOS/Android 빌드 오류

**완화 전략**:
- 별도 브랜치에서 테스트
- 롤백 계획 수립

---

### Phase 2: 신규 텍스트 효과 (1주)

**목표**: 5가지 텍스트 효과 추가

- [ ] `wave` - 물결 텍스트 (우선순위: 높음)
- [ ] `breath` - 호흡 애니메이션 (우선순위: 높음)
- [ ] `morph` - 글자 변형 (우선순위: 중간)
- [ ] `rainbow` - 무지개 색상 (우선순위: 낮음)
- [ ] `glitch` - 글리치 효과 (우선순위: 낮음)

**구현 전략**:
1. MessagePreviewOverlay에 신규 효과 추가
2. TextAnimation enum 업데이트
3. UI 선택 옵션 추가
4. 테스트 (iOS/Android)

---

### Phase 3: 신규 파티클 효과 (1주)

**목표**: 5가지 파티클 효과 추가

- [ ] `fireflies` - 반딧불이 (우선순위: 높음)
- [ ] `sakura` - 벚꽃 (우선순위: 높음)
- [ ] `bubbles` - 거품 (우선순위: 중간)
- [ ] `aurora` - 오로라 (우선순위: 중간)
- [ ] `meteor` - 유성 (우선순위: 낮음)

**구현 전략**:
1. ParticleEffect.js 확장
2. 각 효과별 컴포넌트 생성
3. Physics 엔진 최적화
4. 성능 테스트

---

### Phase 4: Lottie 통합 (1주)

**목표**: Lottie 애니메이션 통합

- [ ] Lottie 컴포넌트 래퍼 생성
- [ ] 감정 리액션 애니메이션 다운로드
- [ ] 로딩 애니메이션 추가
- [ ] 성공/실패 피드백 애니메이션
- [ ] 마이크로 인터랙션 추가

**리소스**:
- LottieFiles에서 5-10개 애니메이션 다운로드
- 파일 크기 최적화 (각 50KB 이하)

---

### Phase 5: 배경 효과 (1주)

**목표**: 3가지 배경 효과 추가

- [ ] `parallax` - 패럴랙스 (우선순위: 높음)
- [ ] `vignette` - 비네팅 (우선순위: 중간)
- [ ] `ken_burns` - 켄 번즈 (우선순위: 낮음)

**구현 전략**:
1. PersonaBackgroundView.js 확장
2. 각 효과별 구현
3. 성능 최적화 (60fps 유지)

---

### Phase 6: 최적화 & 테스트 (1주)

**목표**: 성능 최적화 및 통합 테스트

- [ ] 메모리 사용량 측정
- [ ] FPS 측정 (60fps 유지)
- [ ] 배터리 소모 테스트
- [ ] 다양한 디바이스 테스트
- [ ] A/B 테스트 준비

**목표 지표**:
- FPS: 60fps 유지
- Memory: 추가 50MB 이하
- 로딩 시간: 2초 이하

---

## 🏆 최종 권장사항

### ✅ 즉시 도입 권장

1. **react-native-reanimated 3.x**
   - 이유: 기존 코드 호환, 신규 기능 강력
   - 우선순위: ★★★★★

2. **moti**
   - 이유: 쉬운 API, 빠른 구현
   - 우선순위: ★★★★★

3. **lottie-react-native**
   - 이유: 복잡한 애니메이션 쉽게 추가
   - 우선순위: ★★★★☆

### ⚠️ 신중히 검토 필요

1. **react-native-skia**
   - 이유: 베타 단계, 번들 크기 증가
   - 우선순위: ★★★☆☆
   - 권장: Phase 3 이후 고려

### 📊 효과별 우선순위

**텍스트 애니메이션**:
1. `breath` (호흡) - ANIMA 철학에 완벽
2. `wave` (물결) - 경쾌한 메시지에 최적
3. `morph` (변형) - 독특한 효과

**파티클 효과**:
1. `fireflies` (반딧불이) - 감성적
2. `sakura` (벚꽃) - 한국/일본 감성
3. `aurora` (오로라) - 신비로움

**배경 효과**:
1. `parallax` (패럴랙스) - 깊이감
2. `vignette` (비네팅) - 집중력 향상
3. `ken_burns` (켄 번즈) - 회상 장면

---

## 🎯 다음 단계

### 1. 히어로님의 결정 필요

**Q1**: 어떤 효과부터 시작할까요?
- A. 텍스트 애니메이션 (wave, breath)
- B. 파티클 효과 (fireflies, sakura)
- C. Lottie 통합 (감정 리액션)

**Q2**: react-native-skia 도입 여부?
- A. 나중에 (Phase 3 이후)
- B. 지금 바로 (고급 효과 우선)

**Q3**: 개발 일정?
- A. 빠르게 (1-2주, 핵심만)
- B. 완벽하게 (5-6주, 모든 효과)
- C. 단계적 (효과별 검증)

### 2. 테스트 환경 구축

- [ ] 테스트 브랜치 생성
- [ ] 효과 샘플 페이지 제작
- [ ] 성능 측정 도구 설정

### 3. 리소스 준비

- [ ] Lottie 애니메이션 다운로드
- [ ] 디자인 가이드 업데이트
- [ ] API 문서 확인

---

## 📚 참고 자료

### 공식 문서

1. **React Native Reanimated**
   - https://docs.swmansion.com/react-native-reanimated/

2. **Lottie React Native**
   - https://github.com/lottie-react-native/lottie-react-native

3. **Moti**
   - https://moti.fyi/

4. **React Native Skia**
   - https://shopify.github.io/react-native-skia/

### 무료 리소스

1. **LottieFiles**
   - https://lottiefiles.com/
   - 50만+ 무료 애니메이션

2. **Rive**
   - https://rive.app/
   - 인터랙티브 애니메이션

3. **CodePen (참고용)**
   - https://codepen.io/
   - 웹 애니메이션 아이디어

---

**작성**: Hero Nexus  
**일자**: 2025-12-08  
**버전**: 1.0.0  
**상태**: Ready for Decision

> **"기술이 아닌 감성으로, 악마의 디테일을 담아"**  
> — ANIMA Constitution 💙

