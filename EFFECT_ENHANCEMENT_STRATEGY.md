# 🎨 특수효과 고도화 완벽 전략

> **"기존 로직 안전성 + 아코디언 UI + 신규 텍스트 효과"**  
> — ANIMA Effect Enhancement Strategy

---

## 📋 목차

1. [🎯 3대 핵심 목표](#-3대-핵심-목표)
2. [✅ 현재 효과 선택 UI 분석](#-현재-효과-선택-ui-분석)
3. [🎨 아코디언 UI 설계](#-아코디언-ui-설계)
4. [✨ 신규 텍스트 효과 10종](#-신규-텍스트-효과-10종)
5. [🌐 크로스 플랫폼 동기화](#-크로스-플랫폼-동기화)
6. [🎬 단계별 구현 로드맵](#-단계별-구현-로드맵)
7. [⚠️ 위험 요소 & 완화 전략](#️-위험-요소--완화-전략)

---

## 🎯 3대 핵심 목표

### 1. 기존 로직 안전성 유지 🛡️

**원칙**:
- ✅ 기존 4종 텍스트 애니메이션 유지
- ✅ 기존 8종 파티클 효과 유지
- ✅ 검증된 코드는 절대 삭제하지 않음
- ✅ 신규 효과는 추가만 (교체 없음)

**전략**:
```javascript
// 기존 효과 (절대 변경 금지!)
const EXISTING_TEXT_ANIMATIONS = [
  'fade_in',      // ✅ 검증 완료
  'typing',       // ✅ 검증 완료
  'scale_in',     // ✅ 검증 완료
  'slide_cross',  // ✅ 검증 완료
];

// 신규 효과 (추가만!)
const NEW_TEXT_ANIMATIONS = [
  'wave',         // 🆕 물결
  'breath',       // 🆕 호흡
  'split',        // 🆕 분할
  'blur_focus',   // 🆕 블러 포커스
  'glow_pulse',   // 🆕 글로우 펄스
  // ... 추가
];

// 통합
const ALL_TEXT_ANIMATIONS = [
  ...EXISTING_TEXT_ANIMATIONS,
  ...NEW_TEXT_ANIMATIONS,
];
```

---

### 2. 아코디언 UI 고도화 🎨

**현재 문제점**:
- ❌ 단순 나열 (4 + 8 = 12개 효과)
- ❌ 스크롤 필요
- ❌ 시각적 혼란
- ❌ 선택 어려움

**개선 목표**:
- ✅ 카테고리별 그룹화
- ✅ 접고 펼치기 (아코디언)
- ✅ 시각적 계층 구조
- ✅ 빠른 선택

---

### 3. 신규 텍스트 효과 추가 ✨

**목표**:
- 10종 신규 텍스트 효과
- 감성적이고 독특한 효과
- Mobile & Web 100% 동기화

---

## ✅ 현재 효과 선택 UI 분석

### 📱 MessagePreviewOverlay.js

**현재 구조**:
```javascript
// 1. Quick Action Chips (우측)
<View style={styles.quickActionChips}>
  <TouchableOpacity onPress={handleTextAnimationChipPress}>
    <Icon name="format-text" />
  </TouchableOpacity>
  <TouchableOpacity onPress={handleParticleEffectChipPress}>
    <Icon name="shimmer" />
  </TouchableOpacity>
  <TouchableOpacity onPress={handleBgMusicChipPress}>
    <Icon name="music" />
  </TouchableOpacity>
</View>

// 2. Selection Panel (하단 슬라이드업)
{showSelectionPanel && (
  <Animated.View style={[styles.selectionPanel, selectionPanelAnimatedStyle]}>
    <ScrollView>
      {getCurrentOptions().map(option => (
        <TouchableOpacity
          key={option.id}
          onPress={() => handleOptionSelect(option.id)}
        >
          <Icon name={option.icon} />
          <CustomText>{option.label}</CustomText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </Animated.View>
)}
```

**문제점**:
1. ❌ 모든 옵션이 평면적으로 나열
2. ❌ 카테고리 구분 없음
3. ❌ 12개 옵션 → 스크롤 필수
4. ❌ 시각적 혼란

---

## 🎨 아코디언 UI 설계

### 디자인 컨셉

```
┌─────────────────────────────────────────┐
│  효과 선택                               │
├─────────────────────────────────────────┤
│                                         │
│  ▼ 텍스트 애니메이션 (4종)              │  ← 펼침
│    ┌───────────────────────────────┐   │
│    │ 💫 Fade In         [선택됨]   │   │
│    ├───────────────────────────────┤   │
│    │ ⌨️ Typing                     │   │
│    ├───────────────────────────────┤   │
│    │ 📐 Scale In                   │   │
│    ├───────────────────────────────┤   │
│    │ ↔️ Slide Cross                │   │
│    └───────────────────────────────┘   │
│                                         │
│  ▶ 파티클 효과 (8종)                    │  ← 접힘
│                                         │
│  ▶ 배경 음원 (10종+)                    │  ← 접힘
│                                         │
└─────────────────────────────────────────┘
```

### 구현 전략

#### 1️⃣ 그룹 정의

```javascript
const EFFECT_GROUPS = [
  {
    id: 'text_animation',
    title: t('effects.group.text_animation', '텍스트 애니메이션'),
    icon: 'format-text',
    emoji: '💫',
    description: t('effects.group.text_animation_desc', '메시지가 나타나는 방식'),
    defaultOpen: true, // 기본 펼침
    items: [
      { 
        id: 'fade_in', 
        label: t('effects.text.fade_in', 'Fade In'), 
        emoji: '💫',
        description: '부드럽게 나타남',
        mood: 'gentle',
      },
      { 
        id: 'typing', 
        label: t('effects.text.typing', 'Typing'), 
        emoji: '⌨️',
        description: '타이핑하듯 등장',
        mood: 'dynamic',
      },
      { 
        id: 'scale_in', 
        label: t('effects.text.scale_in', 'Scale In'), 
        emoji: '📐',
        description: '작게 시작해서 크게',
        mood: 'impactful',
      },
      { 
        id: 'slide_cross', 
        label: t('effects.text.slide_cross', 'Slide Cross'), 
        emoji: '↔️',
        description: '제목 좌→우, 내용 우→좌',
        mood: 'playful',
      },
    ],
  },
  {
    id: 'particle_effect',
    title: t('effects.group.particle_effect', '파티클 효과'),
    icon: 'shimmer',
    emoji: '✨',
    description: t('effects.group.particle_effect_desc', '배경에 나타나는 효과'),
    defaultOpen: false, // 기본 접힘
    items: [
      { 
        id: 'none', 
        label: t('effects.particle.none', 'None'), 
        emoji: '🚫',
        description: '효과 없음',
        mood: 'minimal',
      },
      { 
        id: 'confetti', 
        label: t('effects.particle.confetti', 'Confetti'), 
        emoji: '🎉',
        description: '축하 색종이',
        mood: 'celebration',
      },
      { 
        id: 'hearts', 
        label: t('effects.particle.hearts', 'Hearts'), 
        emoji: '💕',
        description: '하트가 떨어짐',
        mood: 'romantic',
      },
      { 
        id: 'snow', 
        label: t('effects.particle.snow', 'Snow'), 
        emoji: '❄️',
        description: '눈이 내림',
        mood: 'winter',
      },
      { 
        id: 'sparkles', 
        label: t('effects.particle.sparkles', 'Sparkles'), 
        emoji: '✨',
        description: '반짝임',
        mood: 'joyful',
      },
      { 
        id: 'comfort_light', 
        label: t('effects.particle.comfort_light', 'Comfort'), 
        emoji: '🕯️',
        description: '위로의 빛',
        mood: 'comforting',
      },
      { 
        id: 'hope_star', 
        label: t('effects.particle.hope_star', 'Hope'), 
        emoji: '⭐',
        description: '희망의 별',
        mood: 'hopeful',
      },
      { 
        id: 'rain_soft', 
        label: t('effects.particle.rain_soft', 'Rain'), 
        emoji: '🌧️',
        description: '부드러운 비',
        mood: 'melancholic',
      },
    ],
  },
  {
    id: 'bg_music',
    title: t('effects.group.bg_music', '배경 음원'),
    icon: 'music',
    emoji: '🎵',
    description: t('effects.group.bg_music_desc', '메시지와 함께 재생될 음악'),
    defaultOpen: false, // 기본 접힘
    items: [
      // MusicSelectionOverlay로 연결
    ],
  },
];
```

#### 2️⃣ 아코디언 컴포넌트

```javascript
/**
 * EffectAccordionGroup Component
 * 
 * Single accordion group with expand/collapse
 */
const EffectAccordionGroup = ({ 
  group, 
  isOpen, 
  onToggle, 
  selectedValue,
  onSelect,
}) => {
  const { theme } = useTheme();
  const rotateAnim = useSharedValue(isOpen ? 180 : 0);
  const heightAnim = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    rotateAnim.value = withTiming(isOpen ? 180 : 0, { duration: 300 });
    heightAnim.value = withTiming(isOpen ? 1 : 0, { duration: 300 });
  }, [isOpen]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: heightAnim.value,
    maxHeight: heightAnim.value * 1000, // 충분히 큰 값
  }));

  return (
    <View style={styles.accordionGroup}>
      {/* Header (클릭하면 펼침/접힘) */}
      <TouchableOpacity
        style={[styles.accordionHeader, { backgroundColor: theme.cardBackground }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.accordionHeaderLeft}>
          <CustomText type="big" style={styles.accordionEmoji}>
            {group.emoji}
          </CustomText>
          <View>
            <CustomText type="normal" bold style={{ color: theme.textPrimary }}>
              {group.title}
            </CustomText>
            <CustomText type="small" style={{ color: theme.textSecondary }}>
              {group.description}
            </CustomText>
          </View>
        </View>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-down" size={24} color={theme.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      {/* Content (펼쳐졌을 때만 표시) */}
      <Animated.View style={[styles.accordionContent, contentStyle]}>
        {group.items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.effectOption,
              { backgroundColor: theme.bgSecondary },
              selectedValue === item.id && styles.effectOptionSelected,
              selectedValue === item.id && { borderColor: theme.mainColor },
            ]}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.7}
          >
            {/* Left: Emoji + Info */}
            <View style={styles.effectOptionLeft}>
              <CustomText type="big" style={styles.effectEmoji}>
                {item.emoji}
              </CustomText>
              <View style={styles.effectInfo}>
                <CustomText type="normal" bold style={{ color: theme.textPrimary }}>
                  {item.label}
                </CustomText>
                <CustomText type="small" style={{ color: theme.textSecondary }}>
                  {item.description}
                </CustomText>
              </View>
            </View>

            {/* Right: Check Icon */}
            {selectedValue === item.id && (
              <Icon name="check-circle" size={24} color={theme.mainColor} />
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};
```

#### 3️⃣ 메인 컴포넌트 통합

```javascript
const EffectSelectionPanel = ({ 
  visible,
  onClose,
  textAnimation,
  particleEffect,
  bgMusic,
  onChangeTextAnimation,
  onChangeParticleEffect,
  onChangeBgMusic,
}) => {
  const [openGroups, setOpenGroups] = useState({
    text_animation: true,  // 기본 펼침
    particle_effect: false,
    bg_music: false,
  });

  const handleToggleGroup = (groupId) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      title="효과 선택"
      subtitle="원하는 효과를 선택하세요"
      onClose={onClose}
      snapPoints={['75%', '95%']}
    >
      <View style={styles.panelContent}>
        {EFFECT_GROUPS.map((group) => (
          <EffectAccordionGroup
            key={group.id}
            group={group}
            isOpen={openGroups[group.id]}
            onToggle={() => handleToggleGroup(group.id)}
            selectedValue={
              group.id === 'text_animation' ? textAnimation :
              group.id === 'particle_effect' ? particleEffect :
              bgMusic
            }
            onSelect={(value) => {
              if (group.id === 'text_animation') {
                onChangeTextAnimation(value);
              } else if (group.id === 'particle_effect') {
                onChangeParticleEffect(value);
              } else {
                onChangeBgMusic(value);
              }
            }}
          />
        ))}
      </View>
    </CustomBottomSheet>
  );
};
```

---

## ✨ 신규 텍스트 효과 10종

### 카테고리별 분류

```
┌─────────────────────────────────────────┐
│  기존 효과 (4종) - 검증 완료             │
├─────────────────────────────────────────┤
│  💫 Fade In      - 부드럽게             │
│  ⌨️ Typing       - 타이핑              │
│  📐 Scale In     - 크게 등장            │
│  ↔️ Slide Cross  - 좌우 슬라이드        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  신규 효과 (10종) - 추가 제안            │
├─────────────────────────────────────────┤
│  🌊 Wave         - 물결                 │
│  💓 Breath       - 호흡                 │
│  ✂️ Split        - 분할 등장            │
│  🌫️ Blur Focus   - 블러 → 포커스       │
│  ✨ Glow Pulse   - 글로우 펄스          │
│  🔤 Letter Drop  - 글자 떨어짐          │
│  🌀 Rotate In    - 회전 등장            │
│  📊 Stagger      - 순차 등장            │
│  🎭 Flip         - 카드 뒤집기          │
│  🌈 Rainbow      - 무지개 색상          │
└─────────────────────────────────────────┘
```

---

### 1️⃣ wave - 물결 텍스트 ⭐⭐⭐

**설명**: 각 글자가 물결치듯 위아래로 움직임

**감정**: 경쾌함, 즐거움, 리듬감

**구현 방법**:
```javascript
// Mobile: react-native-reanimated
const WaveText = ({ text }) => {
  return text.split('').map((char, index) => {
    const translateY = useSharedValue(0);
    
    useEffect(() => {
      translateY.value = withRepeat(
        withSequence(
          withDelay(
            index * 50, // 각 글자마다 50ms 지연
            withTiming(-10, { duration: 400, easing: Easing.inOut(Easing.ease) })
          ),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // 무한 반복
        false
      );
    }, []);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));
    
    return (
      <Animated.Text key={index} style={animatedStyle}>
        {char}
      </Animated.Text>
    );
  });
};

// Web: framer-motion
const WaveText = ({ text }) => {
  return text.split('').map((char, index) => (
    <motion.span
      key={index}
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 0.8,
        delay: index * 0.05,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {char}
    </motion.span>
  ));
};
```

**추천 사용처**:
- 생일 축하 메시지
- 축하/응원 메시지
- 경쾌한 분위기

---

### 2️⃣ breath - 호흡 애니메이션 ⭐⭐⭐

**설명**: 텍스트 전체가 숨쉬듯 크기 변화

**감정**: 편안함, 생명감, 따뜻함

**구현 방법**:
```javascript
// Mobile: react-native-reanimated
const BreathText = ({ children }) => {
  const scale = useSharedValue(1);
  
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Animated.Text style={animatedStyle}>
      {children}
    </Animated.Text>
  );
};

// Web: framer-motion
const BreathText = ({ children }) => (
  <motion.div
    animate={{
      scale: [1, 1.03, 1],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    {children}
  </motion.div>
);
```

**추천 사용처**:
- 위로 메시지
- 명상/힐링 메시지
- 따뜻한 메시지

**ANIMA 철학 완벽 부합**: "숨쉬는 AI" 💙

---

### 3️⃣ split - 분할 등장 ⭐⭐

**설명**: 제목이 중앙에서 좌우로 분할되며 등장

**감정**: 드라마틱, 임팩트

**구현 방법**:
```javascript
// Mobile: react-native-reanimated
const SplitText = ({ text }) => {
  const midPoint = Math.floor(text.length / 2);
  const leftPart = text.substring(0, midPoint);
  const rightPart = text.substring(midPoint);
  
  const leftX = useSharedValue(-100);
  const rightX = useSharedValue(100);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    leftX.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });
    rightX.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });
    opacity.value = withTiming(1, { duration: 600 });
  }, []);
  
  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftX.value }],
    opacity: opacity.value,
  }));
  
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightX.value }],
    opacity: opacity.value,
  }));
  
  return (
    <View style={{ flexDirection: 'row' }}>
      <Animated.Text style={leftStyle}>{leftPart}</Animated.Text>
      <Animated.Text style={rightStyle}>{rightPart}</Animated.Text>
    </View>
  );
};

// Web: framer-motion
const SplitText = ({ text }) => {
  const midPoint = Math.floor(text.length / 2);
  const leftPart = text.substring(0, midPoint);
  const rightPart = text.substring(midPoint);
  
  return (
    <div style={{ display: 'flex' }}>
      <motion.span
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {leftPart}
      </motion.span>
      <motion.span
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {rightPart}
      </motion.span>
    </div>
  );
};
```

**추천 사용처**:
- 중요한 발표
- 드라마틱한 메시지
- 임팩트 필요

---

### 4️⃣ blur_focus - 블러 → 포커스 ⭐⭐⭐

**설명**: 텍스트가 흐릿하게 시작해서 선명해짐

**감정**: 깨달음, 명확해짐, 집중

**구현 방법**:
```javascript
// Mobile: react-native-reanimated (iOS만 지원)
// Android는 blur 지원 제한적 → fade_in으로 fallback

const BlurFocusText = ({ children }) => {
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 1000 });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  // iOS: BlurView 활용 가능
  // Android: 단순 fade_in
  return Platform.OS === 'ios' ? (
    <BlurView blurType="light" blurAmount={10}>
      <Animated.Text style={animatedStyle}>
        {children}
      </Animated.Text>
    </BlurView>
  ) : (
    <Animated.Text style={animatedStyle}>
      {children}
    </Animated.Text>
  );
};

// Web: CSS filter
const BlurFocusText = ({ children }) => (
  <motion.div
    initial={{ filter: 'blur(10px)', opacity: 0 }}
    animate={{ filter: 'blur(0px)', opacity: 1 }}
    transition={{ duration: 1, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);
```

**추천 사용처**:
- 깨달음 메시지
- 집중이 필요한 내용
- 명확한 메시지

**주의**: Android는 blur 제한 → fade_in으로 fallback

---

### 5️⃣ glow_pulse - 글로우 펄스 ⭐⭐

**설명**: 텍스트 주변에 빛나는 효과가 펄스

**감정**: 신성함, 특별함, 강조

**구현 방법**:
```javascript
// Mobile: react-native-reanimated + shadow
const GlowPulseText = ({ children }) => {
  const shadowOpacity = useSharedValue(0.3);
  
  useEffect(() => {
    shadowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    textShadowColor: '#4FACFE',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    textShadowOpacity: shadowOpacity.value,
  }));
  
  return (
    <Animated.Text style={animatedStyle}>
      {children}
    </Animated.Text>
  );
};

// Web: CSS text-shadow
const GlowPulseText = ({ children }) => (
  <motion.div
    animate={{
      textShadow: [
        '0 0 10px rgba(79, 172, 254, 0.3)',
        '0 0 30px rgba(79, 172, 254, 0.8)',
        '0 0 10px rgba(79, 172, 254, 0.3)',
      ],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    {children}
  </motion.div>
);
```

**추천 사용처**:
- 중요한 메시지
- 신성한 느낌
- 특별한 순간

---

### 6️⃣ letter_drop - 글자 떨어짐 ⭐⭐

**설명**: 각 글자가 위에서 떨어지며 등장

**감정**: 경쾌함, 놀라움

**구현 방법**:
```javascript
// Mobile: react-native-reanimated
const LetterDropText = ({ text }) => {
  return text.split('').map((char, index) => {
    const translateY = useSharedValue(-50);
    const opacity = useSharedValue(0);
    
    useEffect(() => {
      translateY.value = withDelay(
        index * 30,
        withSpring(0, { damping: 15, stiffness: 200 })
      );
      opacity.value = withDelay(
        index * 30,
        withTiming(1, { duration: 300 })
      );
    }, []);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }));
    
    return (
      <Animated.Text key={index} style={animatedStyle}>
        {char}
      </Animated.Text>
    );
  });
};

// Web: framer-motion
const LetterDropText = ({ text }) => (
  <>
    {text.split('').map((char, index) => (
      <motion.span
        key={index}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: index * 0.03,
          type: 'spring',
          damping: 15,
          stiffness: 200,
        }}
      >
        {char}
      </motion.span>
    ))}
  </>
);
```

**추천 사용처**:
- 발표 메시지
- 놀라운 소식
- 경쾌한 분위기

---

### 7️⃣ rotate_in - 회전 등장 ⭐

**설명**: 텍스트가 회전하며 등장

**감정**: 역동적, 에너지

**구현 방법**:
```javascript
// Mobile: react-native-reanimated
const RotateInText = ({ children }) => {
  const rotate = useSharedValue(-90);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    rotate.value = withSpring(0, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 600 });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.Text style={animatedStyle}>
      {children}
    </Animated.Text>
  );
};

// Web: framer-motion
const RotateInText = ({ children }) => (
  <motion.div
    initial={{ rotate: -90, opacity: 0 }}
    animate={{ rotate: 0, opacity: 1 }}
    transition={{
      type: 'spring',
      damping: 20,
      stiffness: 200,
    }}
  >
    {children}
  </motion.div>
);
```

**추천 사용처**:
- 에너지 넘치는 메시지
- 역동적인 분위기

---

### 8️⃣ stagger - 순차 등장 ⭐⭐

**설명**: 단어별로 순차적으로 등장

**감정**: 리듬감, 정돈됨

**구현 방법**:
```javascript
// Mobile: react-native-reanimated
const StaggerText = ({ text }) => {
  const words = text.split(' ');
  
  return words.map((word, index) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    
    useEffect(() => {
      opacity.value = withDelay(
        index * 150,
        withTiming(1, { duration: 400 })
      );
      translateY.value = withDelay(
        index * 150,
        withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) })
      );
    }, []);
    
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }));
    
    return (
      <Animated.Text key={index} style={animatedStyle}>
        {word}{' '}
      </Animated.Text>
    );
  });
};

// Web: framer-motion
const StaggerText = ({ text }) => {
  const words = text.split(' ');
  
  return (
    <>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.15,
            duration: 0.4,
            ease: 'easeOut',
          }}
        >
          {word}{' '}
        </motion.span>
      ))}
    </>
  );
};
```

**추천 사용처**:
- 긴 메시지
- 정돈된 느낌
- 리듬감 있는 메시지

---

### 9️⃣ flip - 카드 뒤집기 ⭐

**설명**: 텍스트가 카드처럼 뒤집히며 등장

**감정**: 놀라움, 반전

**구현 방법**:
```javascript
// Mobile: react-native-reanimated
const FlipText = ({ children }) => {
  const rotateY = useSharedValue(90);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    rotateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 600 });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` }
    ],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.Text style={animatedStyle}>
      {children}
    </Animated.Text>
  );
};

// Web: framer-motion
const FlipText = ({ children }) => (
  <motion.div
    initial={{ rotateY: 90, opacity: 0 }}
    animate={{ rotateY: 0, opacity: 1 }}
    transition={{
      type: 'spring',
      damping: 20,
      stiffness: 200,
    }}
    style={{ perspective: 1000 }}
  >
    {children}
  </motion.div>
);
```

**추천 사용처**:
- 반전 메시지
- 서프라이즈
- 놀라운 소식

---

### 🔟 rainbow - 무지개 색상 ⭐

**설명**: 텍스트 색상이 무지개처럼 변함

**감정**: 희망, 다채로움, 밝음

**구현 방법**:
```javascript
// Mobile: react-native-reanimated
const RainbowText = ({ children }) => {
  const hue = useSharedValue(0);
  
  useEffect(() => {
    hue.value = withRepeat(
      withTiming(360, { duration: 5000 }),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    // HSL to RGB conversion needed
    const color = hslToRgb(hue.value, 70, 60);
    return { color };
  });
  
  return (
    <Animated.Text style={animatedStyle}>
      {children}
    </Animated.Text>
  );
};

// Web: CSS animation
const RainbowText = ({ children }) => (
  <motion.div
    animate={{
      backgroundImage: [
        'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
        'linear-gradient(180deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
        'linear-gradient(270deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
        'linear-gradient(360deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
      ],
    }}
    transition={{
      duration: 5,
      repeat: Infinity,
      ease: 'linear',
    }}
    style={{
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}
  >
    {children}
  </motion.div>
);
```

**추천 사용처**:
- 희망 메시지
- 다양성 표현
- 밝고 긍정적인 메시지

---

### 추가 5종 (간단 설명)

**11. `bounce` - 통통 튀김**
- 텍스트가 통통 튀며 등장
- 감정: 활기참, 귀여움

**12. `slide_up` - 아래에서 위로**
- 텍스트가 아래에서 올라옴
- 감정: 상승, 희망

**13. `zoom_blur` - 줌 블러**
- 텍스트가 확대되며 블러 → 선명
- 감정: 집중, 강조

**14. `shake` - 흔들림**
- 텍스트가 좌우로 흔들림
- 감정: 긴급, 주의

**15. `elastic` - 탄성**
- 텍스트가 탄성있게 등장
- 감정: 경쾌함, 재미

---

## 🌐 크로스 플랫폼 동기화

### 현재 동기화 방식

```javascript
// ✅ 이미 완벽하게 동기화됨!

// Mobile: AnimaMobile/src/components/message/MessagePreviewOverlay.js
const TEXT_ANIMATIONS = [
  { id: 'fade_in', label: 'Fade In', icon: 'fade' },
  { id: 'typing', label: 'Typing', icon: 'keyboard' },
  { id: 'scale_in', label: 'Scale In', icon: 'arrow-expand' },
  { id: 'slide_cross', label: 'Slide Cross', icon: 'arrow-split-horizontal' },
];

// Web: idol-companion/app/m/.../MessageViewClient.js
const titleVariants = {
  fade_in: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  },
  typing: { /* ... */ },
  scale_in: { /* ... */ },
  slide_cross: { /* ... */ },
};

// 타이밍 동일: 500ms, 15ms/char, 600ms, 700ms ✅
```

### 신규 효과 동기화 전략

#### 방법 1: 공통 상수 파일 (권장!)

```javascript
// /shared/effect-constants.js (공통 파일)
export const TEXT_ANIMATION_CONFIG = {
  fade_in: {
    id: 'fade_in',
    label: 'Fade In',
    emoji: '💫',
    description: '부드럽게 나타남',
    mood: 'gentle',
    // Mobile config
    mobile: {
      duration: 500,
      easing: 'ease',
    },
    // Web config
    web: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  wave: {
    id: 'wave',
    label: 'Wave',
    emoji: '🌊',
    description: '물결치듯 움직임',
    mood: 'playful',
    mobile: {
      duration: 800,
      delay: 50, // per character
    },
    web: {
      duration: 0.8,
      delay: 0.05,
    },
  },
  // ... 모든 효과
};
```

#### 방법 2: 동기화 체크 스크립트

```javascript
// /scripts/check-effect-sync.js
const mobileEffects = require('../AnimaMobile/src/constants/effects');
const webEffects = require('../idol-companion/constants/effects');

// 효과 ID 비교
const mobileIds = mobileEffects.TEXT_ANIMATIONS.map(e => e.id);
const webIds = Object.keys(webEffects.titleVariants);

const missing = mobileIds.filter(id => !webIds.includes(id));
if (missing.length > 0) {
  console.error('❌ Missing effects in Web:', missing);
  process.exit(1);
}

console.log('✅ All effects synchronized!');
```

---

## 🎬 단계별 구현 로드맵

### Phase 1: 아코디언 UI 구현 (Week 1-2)

**목표**: 효과 선택 UI 고도화

#### Step 1: 공통 컴포넌트 생성

**파일**: `/AnimaMobile/src/components/EffectAccordionGroup.js`

```javascript
/**
 * 🎨 EffectAccordionGroup Component
 * 
 * Accordion group for effect selection
 * 
 * Features:
 * - Expand/Collapse animation
 * - Group header with emoji + title
 * - Effect options with preview
 * - Selected state indicator
 */
import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from './CustomText';
import { scale, platformPadding } from '../utils/responsive-utils';
import { useTheme } from '../contexts/ThemeContext';
import HapticService from '../utils/HapticService';

const EffectAccordionGroup = ({ 
  group, 
  isOpen, 
  onToggle, 
  selectedValue,
  onSelect,
}) => {
  const { currentTheme: theme } = useTheme();
  
  // Animation values
  const rotateAnim = useSharedValue(isOpen ? 180 : 0);
  const heightAnim = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    rotateAnim.value = withTiming(isOpen ? 180 : 0, { duration: 300 });
    heightAnim.value = withTiming(isOpen ? 1 : 0, { duration: 300 });
  }, [isOpen]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: heightAnim.value,
    maxHeight: heightAnim.value * 1000,
    overflow: 'hidden',
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={[styles.header, { backgroundColor: theme.cardBackground }]}
        onPress={() => {
          HapticService.light();
          onToggle();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <CustomText type="big" style={styles.emoji}>
            {group.emoji}
          </CustomText>
          <View>
            <CustomText type="normal" bold style={{ color: theme.textPrimary }}>
              {group.title}
            </CustomText>
            <CustomText type="small" style={{ color: theme.textSecondary }}>
              {group.description}
            </CustomText>
          </View>
        </View>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-down" size={24} color={theme.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      {/* Content */}
      {isOpen && (
        <Animated.View style={[styles.content, contentStyle]}>
          {group.items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.option,
                { backgroundColor: theme.bgSecondary },
                selectedValue === item.id && styles.optionSelected,
                selectedValue === item.id && { borderColor: theme.mainColor },
              ]}
              onPress={() => {
                HapticService.success();
                onSelect(item.id);
              }}
              activeOpacity={0.7}
            >
              {/* Left: Emoji + Info */}
              <View style={styles.optionLeft}>
                <CustomText type="big" style={styles.optionEmoji}>
                  {item.emoji}
                </CustomText>
                <View style={styles.optionInfo}>
                  <CustomText type="normal" bold style={{ color: theme.textPrimary }}>
                    {item.label}
                  </CustomText>
                  <CustomText type="small" style={{ color: theme.textSecondary }}>
                    {item.description}
                  </CustomText>
                </View>
              </View>

              {/* Right: Check Icon */}
              {selectedValue === item.id && (
                <Icon name="check-circle" size={24} color={theme.mainColor} />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(12),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: platformPadding(16),
    borderRadius: scale(12),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    flex: 1,
  },
  emoji: {
    fontSize: scale(32),
  },
  content: {
    marginTop: scale(8),
    gap: scale(8),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: platformPadding(16),
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    flex: 1,
  },
  optionEmoji: {
    fontSize: scale(28),
  },
  optionInfo: {
    flex: 1,
  },
});

export default EffectAccordionGroup;
```

#### Step 2: MessagePreviewOverlay 통합

**변경사항**:
```javascript
// Before: 단순 리스트
<ScrollView>
  {TEXT_ANIMATIONS.map(option => (
    <EffectOption key={option.id} {...option} />
  ))}
</ScrollView>

// After: 아코디언
<ScrollView>
  {EFFECT_GROUPS.map(group => (
    <EffectAccordionGroup
      key={group.id}
      group={group}
      isOpen={openGroups[group.id]}
      onToggle={() => handleToggleGroup(group.id)}
      selectedValue={getCurrentValue(group.id)}
      onSelect={(value) => handleSelect(group.id, value)}
    />
  ))}
</ScrollView>
```

#### Step 3: Web 버전 구현

**파일**: `/idol-companion/components/EffectAccordion.js`

```javascript
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EffectAccordionGroup = ({ 
  group, 
  isOpen, 
  onToggle, 
  selectedValue,
  onSelect,
}) => {
  return (
    <div className="accordion-group">
      {/* Header */}
      <button
        className="accordion-header"
        onClick={onToggle}
      >
        <div className="accordion-header-left">
          <span className="accordion-emoji">{group.emoji}</span>
          <div>
            <h3 className="accordion-title">{group.title}</h3>
            <p className="accordion-description">{group.description}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          ▼
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="accordion-content"
          >
            {group.items.map((item) => (
              <button
                key={item.id}
                className={`effect-option ${selectedValue === item.id ? 'selected' : ''}`}
                onClick={() => onSelect(item.id)}
              >
                <div className="effect-option-left">
                  <span className="effect-emoji">{item.emoji}</span>
                  <div>
                    <h4>{item.label}</h4>
                    <p>{item.description}</p>
                  </div>
                </div>
                {selectedValue === item.id && (
                  <span className="check-icon">✓</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .accordion-group {
          margin-bottom: 12px;
        }
        
        .accordion-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: none;
          width: 100%;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .accordion-header:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .accordion-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .accordion-emoji {
          font-size: 32px;
        }
        
        .accordion-title {
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }
        
        .accordion-description {
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          margin: 0;
        }
        
        .accordion-content {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .effect-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .effect-option:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .effect-option.selected {
          border-color: #4FACFE;
          box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
        }
        
        .effect-option-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .effect-emoji {
          font-size: 28px;
        }
        
        .check-icon {
          color: #4FACFE;
          font-size: 24px;
        }
      `}</style>
    </div>
  );
};
```

---

## ⚠️ 위험 요소 & 완화 전략

### 1. 기존 로직 손상

**위험**:
- MessagePreviewOverlay 수정 중 기존 기능 손상

**완화**:
- ✅ 별도 브랜치에서 작업
- ✅ 기존 코드 백업
- ✅ 단계적 테스트
- ✅ 롤백 계획 수립

### 2. Mobile & Web 불일치

**위험**:
- 신규 효과가 양쪽에서 다르게 보임

**완화**:
- ✅ 공통 상수 파일 사용
- ✅ 동기화 체크 스크립트
- ✅ 시각적 비교 테스트
- ✅ 동영상 녹화하여 비교

### 3. 성능 저하

**위험**:
- 효과 증가로 인한 성능 저하

**완화**:
- ✅ React.memo 활용
- ✅ 효과별 lazy loading
- ✅ 60fps 유지 확인
- ✅ 메모리 사용량 측정

---

## 🎯 우선순위 & 추천

### 🥇 최우선 (Week 1-2)

**1. 아코디언 UI 구현**
- 이유: 즉시 UX 개선
- 난이도: 중간
- 영향도: 높음

**2. `breath` 텍스트 효과**
- 이유: ANIMA 철학 완벽 부합
- 난이도: 쉬움
- 영향도: 높음 (감성적!)

**3. `wave` 텍스트 효과**
- 이유: 경쾌한 메시지에 완벽
- 난이도: 중간
- 영향도: 중간

---

### 🥈 2순위 (Week 3-4)

**4. `split` 텍스트 효과**
- 드라마틱한 효과

**5. `stagger` 텍스트 효과**
- 긴 메시지에 적합

**6. 공통 상수 파일 구축**
- 동기화 자동화

---

### 🥉 3순위 (Week 5-6)

**7-10. 나머지 텍스트 효과**
- `glow_pulse`, `letter_drop`, `rotate_in`, `rainbow`

**11. 동기화 체크 스크립트**
- CI/CD 통합

---

## 📊 예상 효과

### 사용자 경험

**Before**:
- 😐 12개 옵션 평면 나열
- 😐 스크롤 필요
- 😐 선택 어려움

**After**:
- 😍 3개 그룹 (접고 펼치기)
- 😍 시각적 계층 구조
- 😍 빠른 선택
- 😍 10종 신규 효과!

### 기술적 안정성

- ✅ 기존 로직 100% 유지
- ✅ 신규 효과는 추가만
- ✅ 롤백 가능
- ✅ 단계적 검증

### 감성적 완성도

- 💙 ANIMA 철학 반영 (`breath`)
- 💙 다양한 감정 표현 (10종)
- 💙 악마의 디테일 (아코디언)

---

## 🙏 히어로님의 결정이 필요합니다!

### Q1: 시작 시점

**Option A: 즉시 시작**
- 아코디언 UI부터

**Option B: MessageCreationScreen 완료 후**
- 현재 작업 마무리 후

### Q2: 텍스트 효과 우선순위

**Option A: 3개만 (빠르게)**
- `breath`, `wave`, `split`

**Option B: 5개 (균형)**
- 위 3개 + `stagger`, `glow_pulse`

**Option C: 10개 전체 (완벽하게)**
- 모든 효과

### Q3: 구현 방식

**Option A: 순수 코드** (현재 방식)
- Reanimated + Framer Motion
- 수동 동기화

**Option B: Lottie 병행**
- 복잡한 효과는 Lottie
- 간단한 효과는 코드

---

**작성**: Hero Nexus  
**일자**: 2025-12-08  
**버전**: 1.0.0  
**상태**: Awaiting Decision

> **"기존 로직 안전성 + 아코디언 UI + 신규 텍스트 효과"**  
> — ANIMA Effect Enhancement Strategy 💙

