# 🎨 효과 선택 패널 완전 그룹화 전략

> **"Quick Action Chips 유지 + 모든 패널 완전 그룹화"**  
> — ANIMA Complete Effect Grouping Strategy

---

## 📋 목차

1. [🎯 핵심 설계](#-핵심-설계)
2. [💫 텍스트 애니메이션 그룹화](#-텍스트-애니메이션-그룹화)
3. [✨ 파티클 효과 그룹화](#-파티클-효과-그룹화)
4. [🎵 배경 음원 그룹화](#-배경-음원-그룹화)
5. [💎 구현 가이드](#-구현-가이드)
6. [🎬 구현 로드맵](#-구현-로드맵)

---

## 🎯 핵심 설계

### Quick Action Chips (유지!)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[💫 텍스트] [✨ 파티클] [🎵 음원]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ↓          ↓          ↓
  4개 그룹   5개 그룹   3개 그룹
```

**모든 패널이 그룹화됩니다!** ✅

---

## 💫 텍스트 애니메이션 그룹화

### 전체 구조

```
┌─────────────────────────────────────┐
│  텍스트 애니메이션 선택              │
├─────────────────────────────────────┤
│                                     │
│  ▼ 부드러운 💙 (펼침)               │
│    ├─ 💫 Fade In                    │
│    ├─ 💓 Breath 🆕                  │
│    └─ 🌫️ Blur Focus 🆕              │
│                                     │
│  ▶ 역동적인 ⚡ (접힌)               │
│    ├─ ⌨️ Typing                     │
│    ├─ 🔤 Letter Drop 🆕             │
│    └─ 🌀 Rotate In 🆕               │
│                                     │
│  ▶ 임팩트 💥 (접힌)                 │
│    ├─ 📐 Scale In                   │
│    ├─ ✂️ Split 🆕                    │
│    └─ ✨ Glow Pulse 🆕              │
│                                     │
│  ▶ 경쾌한 🎨 (접힌)                 │
│    ├─ ↔️ Slide Cross                │
│    ├─ 🌊 Wave 🆕                    │
│    ├─ 📊 Stagger 🆕                 │
│    ├─ 🎭 Flip 🆕                    │
│    └─ 🌈 Rainbow 🆕                 │
│                                     │
└─────────────────────────────────────┘
```

---

### 그룹 정의

#### 1️⃣ 부드러운 💙 (Gentle)

**특징**: 은은하고 편안한 애니메이션

```javascript
{
  id: 'gentle',
  type: 'group',
  title: t('effects.text_group.gentle', '부드러운'),
  emoji: '💙',
  description: t('effects.text_group.gentle_desc', '은은하고 편안한'),
  defaultOpen: true, // 기본 펼침
  items: [
    { 
      id: 'fade_in', 
      label: t('effects.text.fade_in', 'Fade In'),
      emoji: '💫',
      description: '부드럽게 나타남',
      mood: 'gentle',
      duration: 500,
    },
    { 
      id: 'breath', 
      label: t('effects.text.breath', 'Breath'),
      emoji: '💓',
      description: '숨쉬듯 크기 변화',
      mood: 'gentle',
      duration: 4000,
      isNew: true,
      recommended: true, // ⭐ ANIMA 철학!
    },
    { 
      id: 'blur_focus', 
      label: t('effects.text.blur_focus', 'Blur Focus'),
      emoji: '🌫️',
      description: '흐릿하게 → 선명하게',
      mood: 'gentle',
      duration: 1000,
      isNew: true,
    },
  ],
}
```

**추천 사용**:
- 위로 메시지
- 따뜻한 메시지
- 명상/힐링 메시지

---

#### 2️⃣ 역동적인 ⚡ (Dynamic)

**특징**: 빠르고 활기찬 애니메이션

```javascript
{
  id: 'dynamic',
  type: 'group',
  title: t('effects.text_group.dynamic', '역동적인'),
  emoji: '⚡',
  description: t('effects.text_group.dynamic_desc', '빠르고 활기찬'),
  defaultOpen: false,
  items: [
    { 
      id: 'typing', 
      label: t('effects.text.typing', 'Typing'),
      emoji: '⌨️',
      description: '타이핑하듯 등장',
      mood: 'dynamic',
      duration: 'variable', // 글자 수에 따라
    },
    { 
      id: 'letter_drop', 
      label: t('effects.text.letter_drop', 'Letter Drop'),
      emoji: '🔤',
      description: '글자가 떨어짐',
      mood: 'dynamic',
      duration: 800,
      isNew: true,
    },
    { 
      id: 'rotate_in', 
      label: t('effects.text.rotate_in', 'Rotate In'),
      emoji: '🌀',
      description: '회전하며 등장',
      mood: 'dynamic',
      duration: 600,
      isNew: true,
    },
  ],
}
```

**추천 사용**:
- 공지 메시지
- 에너지 넘치는 메시지
- 발표/알림

---

#### 3️⃣ 임팩트 💥 (Impactful)

**특징**: 강렬하고 인상적인 애니메이션

```javascript
{
  id: 'impactful',
  type: 'group',
  title: t('effects.text_group.impactful', '임팩트'),
  emoji: '💥',
  description: t('effects.text_group.impactful_desc', '강렬하고 인상적인'),
  defaultOpen: false,
  items: [
    { 
      id: 'scale_in', 
      label: t('effects.text.scale_in', 'Scale In'),
      emoji: '📐',
      description: '작게 → 크게',
      mood: 'impactful',
      duration: 600,
    },
    { 
      id: 'split', 
      label: t('effects.text.split', 'Split'),
      emoji: '✂️',
      description: '중앙에서 좌우로 분할',
      mood: 'impactful',
      duration: 600,
      isNew: true,
    },
    { 
      id: 'glow_pulse', 
      label: t('effects.text.glow_pulse', 'Glow Pulse'),
      emoji: '✨',
      description: '빛나는 펄스',
      mood: 'impactful',
      duration: 2000,
      isNew: true,
    },
  ],
}
```

**추천 사용**:
- 중요한 발표
- 드라마틱한 메시지
- 특별한 메시지

---

#### 4️⃣ 경쾌한 🎨 (Playful)

**특징**: 재미있고 경쾌한 애니메이션

```javascript
{
  id: 'playful',
  type: 'group',
  title: t('effects.text_group.playful', '경쾌한'),
  emoji: '🎨',
  description: t('effects.text_group.playful_desc', '재미있고 경쾌한'),
  defaultOpen: false,
  items: [
    { 
      id: 'slide_cross', 
      label: t('effects.text.slide_cross', 'Slide Cross'),
      emoji: '↔️',
      description: '제목 좌→우, 내용 우→좌',
      mood: 'playful',
      duration: 700,
    },
    { 
      id: 'wave', 
      label: t('effects.text.wave', 'Wave'),
      emoji: '🌊',
      description: '물결치듯 움직임',
      mood: 'playful',
      duration: 800,
      isNew: true,
      recommended: true, // ⭐ 인기!
    },
    { 
      id: 'stagger', 
      label: t('effects.text.stagger', 'Stagger'),
      emoji: '📊',
      description: '단어별 순차 등장',
      mood: 'playful',
      duration: 'variable',
      isNew: true,
    },
    { 
      id: 'flip', 
      label: t('effects.text.flip', 'Flip'),
      emoji: '🎭',
      description: '카드 뒤집기',
      mood: 'playful',
      duration: 600,
      isNew: true,
    },
    { 
      id: 'rainbow', 
      label: t('effects.text.rainbow', 'Rainbow'),
      emoji: '🌈',
      description: '무지개 색상 변화',
      mood: 'playful',
      duration: 5000,
      isNew: true,
    },
  ],
}
```

**추천 사용**:
- 생일 축하
- 경쾌한 메시지
- 재미있는 메시지

---

### 완전한 데이터 구조

```javascript
// /AnimaMobile/src/constants/effect-groups.js

export const TEXT_ANIMATION_GROUPS = [
  {
    id: 'gentle',
    type: 'group',
    title: () => t('effects.text_group.gentle', '부드러운'),
    emoji: '💙',
    description: () => t('effects.text_group.gentle_desc', '은은하고 편안한'),
    defaultOpen: true,
    items: [
      { id: 'fade_in', label: () => t('effects.text.fade_in', 'Fade In'), emoji: '💫', description: '부드럽게 나타남', mood: 'gentle' },
      { id: 'breath', label: () => t('effects.text.breath', 'Breath'), emoji: '💓', description: '숨쉬듯 크기 변화', mood: 'gentle', isNew: true, recommended: true },
      { id: 'blur_focus', label: () => t('effects.text.blur_focus', 'Blur Focus'), emoji: '🌫️', description: '흐릿하게 → 선명하게', mood: 'gentle', isNew: true },
    ],
  },
  {
    id: 'dynamic',
    type: 'group',
    title: () => t('effects.text_group.dynamic', '역동적인'),
    emoji: '⚡',
    description: () => t('effects.text_group.dynamic_desc', '빠르고 활기찬'),
    defaultOpen: false,
    items: [
      { id: 'typing', label: () => t('effects.text.typing', 'Typing'), emoji: '⌨️', description: '타이핑하듯 등장', mood: 'dynamic' },
      { id: 'letter_drop', label: () => t('effects.text.letter_drop', 'Letter Drop'), emoji: '🔤', description: '글자가 떨어짐', mood: 'dynamic', isNew: true },
      { id: 'rotate_in', label: () => t('effects.text.rotate_in', 'Rotate In'), emoji: '🌀', description: '회전하며 등장', mood: 'dynamic', isNew: true },
    ],
  },
  {
    id: 'impactful',
    type: 'group',
    title: () => t('effects.text_group.impactful', '임팩트'),
    emoji: '💥',
    description: () => t('effects.text_group.impactful_desc', '강렬하고 인상적인'),
    defaultOpen: false,
    items: [
      { id: 'scale_in', label: () => t('effects.text.scale_in', 'Scale In'), emoji: '📐', description: '작게 → 크게', mood: 'impactful' },
      { id: 'split', label: () => t('effects.text.split', 'Split'), emoji: '✂️', description: '중앙에서 좌우로 분할', mood: 'impactful', isNew: true },
      { id: 'glow_pulse', label: () => t('effects.text.glow_pulse', 'Glow Pulse'), emoji: '✨', description: '빛나는 펄스', mood: 'impactful', isNew: true },
    ],
  },
  {
    id: 'playful',
    type: 'group',
    title: () => t('effects.text_group.playful', '경쾌한'),
    emoji: '🎨',
    description: () => t('effects.text_group.playful_desc', '재미있고 경쾌한'),
    defaultOpen: false,
    items: [
      { id: 'slide_cross', label: () => t('effects.text.slide_cross', 'Slide Cross'), emoji: '↔️', description: '제목 좌→우, 내용 우→좌', mood: 'playful' },
      { id: 'wave', label: () => t('effects.text.wave', 'Wave'), emoji: '🌊', description: '물결치듯 움직임', mood: 'playful', isNew: true, recommended: true },
      { id: 'stagger', label: () => t('effects.text.stagger', 'Stagger'), emoji: '📊', description: '단어별 순차 등장', mood: 'playful', isNew: true },
      { id: 'flip', label: () => t('effects.text.flip', 'Flip'), emoji: '🎭', description: '카드 뒤집기', mood: 'playful', isNew: true },
      { id: 'rainbow', label: () => t('effects.text.rainbow', 'Rainbow'), emoji: '🌈', description: '무지개 색상 변화', mood: 'playful', isNew: true },
    ],
  },
];
```

---

## ✨ 파티클 효과 그룹화

### 전체 구조

```
┌─────────────────────────────────────┐
│  파티클 효과 선택                    │
├─────────────────────────────────────┤
│                                     │
│  🚫 없음                            │ ← 단독
│                                     │
│  ▼ 사랑 & 로맨스 💕 (펼침)          │
│    ├─ 💕 하트                       │
│    └─ 💖 네온하트 🆕                │
│                                     │
│  ▶ 축하 & 기쁨 🎉 (접힌)            │
│    ├─ 🎉 색종이                     │
│    ├─ ✨ 반짝임                     │
│    └─ 🎆 폭죽 🆕                    │
│                                     │
│  ▶ 자연 & 계절 🌿 (접힌)            │
│    ├─ ❄️ 눈                         │
│    ├─ 🌧️ 비                         │
│    ├─ 🌸 벚꽃 🆕                    │
│    └─ 🍂 낙엽 🆕                    │
│                                     │
│  ▶ 위로 & 희망 🕯️ (접힌)            │
│    ├─ 🕯️ 따뜻한 빛                  │
│    ├─ ⭐ 희망의 별                  │
│    └─ ✨ 반딧불이 🆕                │
│                                     │
│  ▶ 기타 🎨 (접힌)                   │
│    └─ (신규 추가 효과)               │
│                                     │
└─────────────────────────────────────┘
```

---

### 그룹 정의

```javascript
export const PARTICLE_EFFECT_GROUPS = [
  {
    id: 'none',
    type: 'standalone',
    items: [
      { 
        id: 'none', 
        label: () => t('effects.particle.none', '없음'),
        emoji: '🚫',
        description: () => t('effects.particle.none_desc', '파티클 효과 없음'),
      },
    ],
  },
  {
    id: 'love_romance',
    type: 'group',
    title: () => t('effects.particle_group.love_romance', '사랑 & 로맨스'),
    emoji: '💕',
    description: () => t('effects.particle_group.love_romance_desc', '사랑과 로맨스를 표현'),
    defaultOpen: true,
    items: [
      { 
        id: 'hearts', 
        label: () => t('effects.particle.hearts', '하트'),
        emoji: '💕',
        description: '하트가 떨어짐',
        mood: 'romantic',
      },
      { 
        id: 'neon_hearts', 
        label: () => t('effects.particle.neon_hearts', '네온하트'),
        emoji: '💖',
        description: '네온 색상 하트',
        mood: 'romantic',
        isNew: true,
      },
    ],
  },
  {
    id: 'celebration_joy',
    type: 'group',
    title: () => t('effects.particle_group.celebration_joy', '축하 & 기쁨'),
    emoji: '🎉',
    description: () => t('effects.particle_group.celebration_joy_desc', '축하와 기쁨의 순간'),
    defaultOpen: false,
    items: [
      { 
        id: 'confetti', 
        label: () => t('effects.particle.confetti', '색종이'),
        emoji: '🎉',
        description: '알록달록 색종이',
        mood: 'celebration',
      },
      { 
        id: 'sparkles', 
        label: () => t('effects.particle.sparkles', '반짝임'),
        emoji: '✨',
        description: '반짝이는 별',
        mood: 'joyful',
      },
      { 
        id: 'fireworks', 
        label: () => t('effects.particle.fireworks', '폭죽'),
        emoji: '🎆',
        description: '터지는 폭죽',
        mood: 'celebration',
        isNew: true,
      },
    ],
  },
  {
    id: 'nature_season',
    type: 'group',
    title: () => t('effects.particle_group.nature_season', '자연 & 계절'),
    emoji: '🌿',
    description: () => t('effects.particle_group.nature_season_desc', '자연과 계절의 아름다움'),
    defaultOpen: false,
    items: [
      { 
        id: 'snow', 
        label: () => t('effects.particle.snow', '눈'),
        emoji: '❄️',
        description: '소복이 내리는 눈',
        mood: 'winter',
      },
      { 
        id: 'rain_soft', 
        label: () => t('effects.particle.rain_soft', '비'),
        emoji: '🌧️',
        description: '부드러운 빗소리',
        mood: 'melancholic',
      },
      { 
        id: 'sakura', 
        label: () => t('effects.particle.sakura', '벚꽃'),
        emoji: '🌸',
        description: '흩날리는 벚꽃',
        mood: 'spring',
        isNew: true,
      },
      { 
        id: 'leaves', 
        label: () => t('effects.particle.leaves', '낙엽'),
        emoji: '🍂',
        description: '떨어지는 낙엽',
        mood: 'autumn',
        isNew: true,
      },
    ],
  },
  {
    id: 'comfort_hope',
    type: 'group',
    title: () => t('effects.particle_group.comfort_hope', '위로 & 희망'),
    emoji: '🕯️',
    description: () => t('effects.particle_group.comfort_hope_desc', '위로와 희망을 전하는'),
    defaultOpen: false,
    items: [
      { 
        id: 'comfort_light', 
        label: () => t('effects.particle.comfort_light', '따뜻한 빛'),
        emoji: '🕯️',
        description: '위로하는 따뜻한 빛',
        mood: 'comforting',
      },
      { 
        id: 'hope_star', 
        label: () => t('effects.particle.hope_star', '희망의 별'),
        emoji: '⭐',
        description: '희망을 주는 별',
        mood: 'hopeful',
      },
      { 
        id: 'fireflies', 
        label: () => t('effects.particle.fireflies', '반딧불이'),
        emoji: '✨',
        description: '은은한 반딧불이',
        mood: 'peaceful',
        isNew: true,
      },
    ],
  },
  {
    id: 'others',
    type: 'group',
    title: () => t('effects.particle_group.others', '기타'),
    emoji: '🎨',
    description: () => t('effects.particle_group.others_desc', '다양한 효과들'),
    defaultOpen: false,
    items: [
      // 향후 추가될 효과들
    ],
  },
];
```

---

## 🎵 배경 음원 그룹화

### 전체 구조

```
┌─────────────────────────────────────┐
│  배경 음원 선택                      │
├─────────────────────────────────────┤
│                                     │
│  🚫 없음                            │ ← 단독
│                                     │
│  ▼ 기본 음원 🎵 (펼침)              │
│    ├─ 🎂 생일 축하                 │
│    ├─ 🎄 크리스마스                │
│    ├─ 💕 로맨틱                    │
│    ├─ 😊 경쾌한                    │
│    └─ 🙏 차분한                    │
│                                     │
│  ▶ 사용자 생성 🤖 (접힌)            │
│    ├─ 🎵 AI 생성 #1                │
│    ├─ 🎵 AI 생성 #2                │
│    └─ 🎵 AI 생성 #3                │
│                                     │
│  ▶ 즐겨찾기 ⭐ (접힌)               │
│    ├─ 🎂 생일 축하 ⭐              │
│    └─ 🎵 AI 생성 #1 ⭐            │
│                                     │
└─────────────────────────────────────┘
```

**중요**: 즐겨찾기는 다른 그룹과 중복 가능!

---

### 그룹 정의

```javascript
export const MUSIC_GROUPS = [
  {
    id: 'none',
    type: 'standalone',
    items: [
      { 
        id: 'none', 
        label: () => t('effects.music.none', '없음'),
        emoji: '🚫',
        description: () => t('effects.music.none_desc', '배경 음악 없음'),
      },
    ],
  },
  {
    id: 'default',
    type: 'group',
    title: () => t('effects.music_group.default', '기본 음원'),
    emoji: '🎵',
    description: () => t('effects.music_group.default_desc', 'ANIMA가 준비한 음원'),
    defaultOpen: true,
    items: [
      // API에서 동적으로 로드
      // music_type = 'default'
      { 
        id: 'birthday', 
        label: () => t('effects.music.birthday', '생일 축하'),
        emoji: '🎂',
        music_url: '/music/birthday.mp3',
        music_type: 'default',
      },
      { 
        id: 'christmas', 
        label: () => t('effects.music.christmas', '크리스마스'),
        emoji: '🎄',
        music_url: '/music/christmas.mp3',
        music_type: 'default',
      },
      { 
        id: 'romantic', 
        label: () => t('effects.music.romantic', '로맨틱'),
        emoji: '💕',
        music_url: '/music/romantic.mp3',
        music_type: 'default',
      },
      { 
        id: 'cheerful', 
        label: () => t('effects.music.cheerful', '경쾌한'),
        emoji: '😊',
        music_url: '/music/cheerful.mp3',
        music_type: 'default',
      },
      { 
        id: 'calm', 
        label: () => t('effects.music.calm', '차분한'),
        emoji: '🙏',
        music_url: '/music/calm.mp3',
        music_type: 'default',
      },
    ],
  },
  {
    id: 'user_generated',
    type: 'group',
    title: () => t('effects.music_group.user_generated', '사용자 생성'),
    emoji: '🤖',
    description: () => t('effects.music_group.user_generated_desc', '내가 만든 AI 음원'),
    defaultOpen: false,
    items: [
      // API에서 동적으로 로드
      // music_type = 'ai_generated'
      // user_key = 현재 사용자
    ],
  },
  {
    id: 'favorites',
    type: 'group',
    title: () => t('effects.music_group.favorites', '즐겨찾기'),
    emoji: '⭐',
    description: () => t('effects.music_group.favorites_desc', '자주 사용하는 음원'),
    defaultOpen: false,
    items: [
      // API에서 동적으로 로드
      // favorite_yn = 'Y'
      // 다른 그룹과 중복 가능!
    ],
  },
];
```

---

### 음원 데이터 로드 로직

```javascript
/**
 * Load music groups with dynamic data
 */
const loadMusicGroups = async (userKey) => {
  try {
    // 1. 기본 음원 (static)
    const defaultMusic = MUSIC_GROUPS.find(g => g.id === 'default');
    
    // 2. 사용자 생성 음원 (dynamic)
    const userGeneratedMusic = await musicService.getUserGeneratedMusic(userKey);
    const userGeneratedGroup = {
      ...MUSIC_GROUPS.find(g => g.id === 'user_generated'),
      items: userGeneratedMusic.map(music => ({
        id: music.music_key,
        label: music.music_name || `AI 생성 #${music.music_key}`,
        emoji: '🎵',
        music_url: music.music_url,
        music_type: 'ai_generated',
        created_at: music.created_at,
      })),
    };
    
    // 3. 즐겨찾기 음원 (dynamic, 중복 가능)
    const favoriteMusic = await musicService.getFavoriteMusic(userKey);
    const favoritesGroup = {
      ...MUSIC_GROUPS.find(g => g.id === 'favorites'),
      items: favoriteMusic.map(music => ({
        id: music.music_key,
        label: music.music_name || music.label,
        emoji: music.emoji || '🎵',
        music_url: music.music_url,
        music_type: music.music_type,
        isFavorite: true,
      })),
    };
    
    return [
      MUSIC_GROUPS.find(g => g.id === 'none'), // 없음
      defaultMusic,
      userGeneratedGroup,
      favoritesGroup,
    ];
  } catch (error) {
    console.error('[loadMusicGroups] Error:', error);
    return MUSIC_GROUPS; // Fallback
  }
};
```

---

## 💎 구현 가이드

### Step 1: 통합 effect-groups.js 생성

**파일**: `/AnimaMobile/src/constants/effect-groups.js`

```javascript
/**
 * 🎨 Effect Groups Configuration
 * 
 * Complete grouped structure for all effect selection panels:
 * - Text Animations (4 groups)
 * - Particle Effects (5 groups)
 * - Background Music (3 groups)
 * 
 * @author JK & Hero Nexus AI
 */

import { t } from 'i18next';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💫 텍스트 애니메이션 그룹 (4개)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const TEXT_ANIMATION_GROUPS = [
  {
    id: 'gentle',
    type: 'group',
    title: () => t('effects.text_group.gentle', '부드러운'),
    emoji: '💙',
    description: () => t('effects.text_group.gentle_desc', '은은하고 편안한'),
    defaultOpen: true,
    items: [
      { 
        id: 'fade_in', 
        label: () => t('effects.text.fade_in', 'Fade In'),
        emoji: '💫',
        description: '부드럽게 나타남',
        mood: 'gentle',
      },
      { 
        id: 'breath', 
        label: () => t('effects.text.breath', 'Breath'),
        emoji: '💓',
        description: '숨쉬듯 크기 변화',
        mood: 'gentle',
        isNew: true,
        recommended: true, // ⭐ ANIMA 철학
      },
      { 
        id: 'blur_focus', 
        label: () => t('effects.text.blur_focus', 'Blur Focus'),
        emoji: '🌫️',
        description: '흐릿하게 → 선명하게',
        mood: 'gentle',
        isNew: true,
      },
    ],
  },
  {
    id: 'dynamic',
    type: 'group',
    title: () => t('effects.text_group.dynamic', '역동적인'),
    emoji: '⚡',
    description: () => t('effects.text_group.dynamic_desc', '빠르고 활기찬'),
    defaultOpen: false,
    items: [
      { 
        id: 'typing', 
        label: () => t('effects.text.typing', 'Typing'),
        emoji: '⌨️',
        description: '타이핑하듯 등장',
        mood: 'dynamic',
      },
      { 
        id: 'letter_drop', 
        label: () => t('effects.text.letter_drop', 'Letter Drop'),
        emoji: '🔤',
        description: '글자가 떨어짐',
        mood: 'dynamic',
        isNew: true,
      },
      { 
        id: 'rotate_in', 
        label: () => t('effects.text.rotate_in', 'Rotate In'),
        emoji: '🌀',
        description: '회전하며 등장',
        mood: 'dynamic',
        isNew: true,
      },
    ],
  },
  {
    id: 'impactful',
    type: 'group',
    title: () => t('effects.text_group.impactful', '임팩트'),
    emoji: '💥',
    description: () => t('effects.text_group.impactful_desc', '강렬하고 인상적인'),
    defaultOpen: false,
    items: [
      { 
        id: 'scale_in', 
        label: () => t('effects.text.scale_in', 'Scale In'),
        emoji: '📐',
        description: '작게 → 크게',
        mood: 'impactful',
      },
      { 
        id: 'split', 
        label: () => t('effects.text.split', 'Split'),
        emoji: '✂️',
        description: '중앙에서 좌우로 분할',
        mood: 'impactful',
        isNew: true,
      },
      { 
        id: 'glow_pulse', 
        label: () => t('effects.text.glow_pulse', 'Glow Pulse'),
        emoji: '✨',
        description: '빛나는 펄스',
        mood: 'impactful',
        isNew: true,
      },
    ],
  },
  {
    id: 'playful',
    type: 'group',
    title: () => t('effects.text_group.playful', '경쾌한'),
    emoji: '🎨',
    description: () => t('effects.text_group.playful_desc', '재미있고 경쾌한'),
    defaultOpen: false,
    items: [
      { 
        id: 'slide_cross', 
        label: () => t('effects.text.slide_cross', 'Slide Cross'),
        emoji: '↔️',
        description: '제목 좌→우, 내용 우→좌',
        mood: 'playful',
      },
      { 
        id: 'wave', 
        label: () => t('effects.text.wave', 'Wave'),
        emoji: '🌊',
        description: '물결치듯 움직임',
        mood: 'playful',
        isNew: true,
        recommended: true, // ⭐ 인기
      },
      { 
        id: 'stagger', 
        label: () => t('effects.text.stagger', 'Stagger'),
        emoji: '📊',
        description: '단어별 순차 등장',
        mood: 'playful',
        isNew: true,
      },
      { 
        id: 'flip', 
        label: () => t('effects.text.flip', 'Flip'),
        emoji: '🎭',
        description: '카드 뒤집기',
        mood: 'playful',
        isNew: true,
      },
      { 
        id: 'rainbow', 
        label: () => t('effects.text.rainbow', 'Rainbow'),
        emoji: '🌈',
        description: '무지개 색상 변화',
        mood: 'playful',
        isNew: true,
      },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✨ 파티클 효과 그룹 (5개)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const PARTICLE_EFFECT_GROUPS = [
  {
    id: 'none',
    type: 'standalone',
    items: [
      { 
        id: 'none', 
        label: () => t('effects.particle.none', '없음'),
        emoji: '🚫',
        description: () => t('effects.particle.none_desc', '파티클 효과 없음'),
      },
    ],
  },
  {
    id: 'love_romance',
    type: 'group',
    title: () => t('effects.particle_group.love_romance', '사랑 & 로맨스'),
    emoji: '💕',
    description: () => t('effects.particle_group.love_romance_desc', '사랑과 로맨스를 표현'),
    defaultOpen: true,
    items: [
      { 
        id: 'hearts', 
        label: () => t('effects.particle.hearts', '하트'),
        emoji: '💕',
        description: '하트가 떨어짐',
        mood: 'romantic',
      },
      { 
        id: 'neon_hearts', 
        label: () => t('effects.particle.neon_hearts', '네온하트'),
        emoji: '💖',
        description: '네온 색상 하트',
        mood: 'romantic',
        isNew: true,
      },
    ],
  },
  {
    id: 'celebration_joy',
    type: 'group',
    title: () => t('effects.particle_group.celebration_joy', '축하 & 기쁨'),
    emoji: '🎉',
    description: () => t('effects.particle_group.celebration_joy_desc', '축하와 기쁨의 순간'),
    defaultOpen: false,
    items: [
      { 
        id: 'confetti', 
        label: () => t('effects.particle.confetti', '색종이'),
        emoji: '🎉',
        description: '알록달록 색종이',
        mood: 'celebration',
      },
      { 
        id: 'sparkles', 
        label: () => t('effects.particle.sparkles', '반짝임'),
        emoji: '✨',
        description: '반짝이는 별',
        mood: 'joyful',
      },
      { 
        id: 'fireworks', 
        label: () => t('effects.particle.fireworks', '폭죽'),
        emoji: '🎆',
        description: '터지는 폭죽',
        mood: 'celebration',
        isNew: true,
      },
    ],
  },
  {
    id: 'nature_season',
    type: 'group',
    title: () => t('effects.particle_group.nature_season', '자연 & 계절'),
    emoji: '🌿',
    description: () => t('effects.particle_group.nature_season_desc', '자연과 계절의 아름다움'),
    defaultOpen: false,
    items: [
      { 
        id: 'snow', 
        label: () => t('effects.particle.snow', '눈'),
        emoji: '❄️',
        description: '소복이 내리는 눈',
        mood: 'winter',
      },
      { 
        id: 'rain_soft', 
        label: () => t('effects.particle.rain_soft', '비'),
        emoji: '🌧️',
        description: '부드러운 빗소리',
        mood: 'melancholic',
      },
      { 
        id: 'sakura', 
        label: () => t('effects.particle.sakura', '벚꽃'),
        emoji: '🌸',
        description: '흩날리는 벚꽃',
        mood: 'spring',
        isNew: true,
      },
      { 
        id: 'leaves', 
        label: () => t('effects.particle.leaves', '낙엽'),
        emoji: '🍂',
        description: '떨어지는 낙엽',
        mood: 'autumn',
        isNew: true,
      },
    ],
  },
  {
    id: 'comfort_hope',
    type: 'group',
    title: () => t('effects.particle_group.comfort_hope', '위로 & 희망'),
    emoji: '🕯️',
    description: () => t('effects.particle_group.comfort_hope_desc', '위로와 희망을 전하는'),
    defaultOpen: false,
    items: [
      { 
        id: 'comfort_light', 
        label: () => t('effects.particle.comfort_light', '따뜻한 빛'),
        emoji: '🕯️',
        description: '위로하는 따뜻한 빛',
        mood: 'comforting',
      },
      { 
        id: 'hope_star', 
        label: () => t('effects.particle.hope_star', '희망의 별'),
        emoji: '⭐',
        description: '희망을 주는 별',
        mood: 'hopeful',
      },
      { 
        id: 'fireflies', 
        label: () => t('effects.particle.fireflies', '반딧불이'),
        emoji: '✨',
        description: '은은한 반딧불이',
        mood: 'peaceful',
        isNew: true,
      },
    ],
  },
  {
    id: 'others',
    type: 'group',
    title: () => t('effects.particle_group.others', '기타'),
    emoji: '🎨',
    description: () => t('effects.particle_group.others_desc', '다양한 효과들'),
    defaultOpen: false,
    items: [
      // 향후 추가될 효과들
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 배경 음원 그룹 (3개 + dynamic)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const MUSIC_GROUPS = [
  {
    id: 'none',
    type: 'standalone',
    items: [
      { 
        id: 'none', 
        label: () => t('effects.music.none', '없음'),
        emoji: '🚫',
        description: () => t('effects.music.none_desc', '배경 음악 없음'),
      },
    ],
  },
  {
    id: 'default',
    type: 'group',
    title: () => t('effects.music_group.default', '기본 음원'),
    emoji: '🎵',
    description: () => t('effects.music_group.default_desc', 'ANIMA가 준비한 음원'),
    defaultOpen: true,
    items: [
      { 
        id: 'birthday', 
        label: () => t('effects.music.birthday', '생일 축하'),
        emoji: '🎂',
        music_type: 'default',
      },
      { 
        id: 'christmas', 
        label: () => t('effects.music.christmas', '크리스마스'),
        emoji: '🎄',
        music_type: 'default',
      },
      { 
        id: 'romantic', 
        label: () => t('effects.music.romantic', '로맨틱'),
        emoji: '💕',
        music_type: 'default',
      },
      { 
        id: 'cheerful', 
        label: () => t('effects.music.cheerful', '경쾌한'),
        emoji: '😊',
        music_type: 'default',
      },
      { 
        id: 'calm', 
        label: () => t('effects.music.calm', '차분한'),
        emoji: '🙏',
        music_type: 'default',
      },
    ],
  },
  {
    id: 'user_generated',
    type: 'group',
    title: () => t('effects.music_group.user_generated', '사용자 생성'),
    emoji: '🤖',
    description: () => t('effects.music_group.user_generated_desc', '내가 만든 AI 음원'),
    defaultOpen: false,
    items: [], // Dynamic
  },
  {
    id: 'favorites',
    type: 'group',
    title: () => t('effects.music_group.favorites', '즐겨찾기'),
    emoji: '⭐',
    description: () => t('effects.music_group.favorites_desc', '자주 사용하는 음원'),
    defaultOpen: false,
    items: [], // Dynamic
  },
];
```

---

### Step 2: EffectGroupAccordion.js (동일)

이전 문서의 컴포넌트 그대로 사용! ✅

---

### Step 3: MessagePreviewOverlay.js 통합

```javascript
import { 
  TEXT_ANIMATION_GROUPS, 
  PARTICLE_EFFECT_GROUPS, 
  MUSIC_GROUPS 
} from '../../constants/effect-groups';
import EffectGroupAccordion from '../EffectGroupAccordion';

// State for group open/close
const [openTextGroups, setOpenTextGroups] = useState({
  gentle: true,
  dynamic: false,
  impactful: false,
  playful: false,
});

const [openParticleGroups, setOpenParticleGroups] = useState({
  love_romance: true,
  celebration_joy: false,
  nature_season: false,
  comfort_hope: false,
  others: false,
});

const [openMusicGroups, setOpenMusicGroups] = useState({
  default: true,
  user_generated: false,
  favorites: false,
});

// Toggle handlers
const handleToggleTextGroup = (groupId) => {
  setOpenTextGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
};

const handleToggleParticleGroup = (groupId) => {
  setOpenParticleGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
};

const handleToggleMusicGroup = (groupId) => {
  setOpenMusicGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
};

// Render text panel
{showSelectionPanel && selectionType === 'text' && (
  <Animated.View style={[styles.selectionPanel, selectionPanelAnimatedStyle]}>
    <ScrollView>
      {TEXT_ANIMATION_GROUPS.map((group) => (
        <EffectGroupAccordion
          key={group.id}
          group={group}
          isOpen={openTextGroups[group.id]}
          onToggle={() => handleToggleTextGroup(group.id)}
          selectedValue={textAnimation}
          onSelect={handleTextAnimationSelect}
        />
      ))}
    </ScrollView>
  </Animated.View>
)}

// Render particle panel
{showSelectionPanel && selectionType === 'particle' && (
  <Animated.View style={[styles.selectionPanel, selectionPanelAnimatedStyle]}>
    <ScrollView>
      {PARTICLE_EFFECT_GROUPS.map((group) => (
        <EffectGroupAccordion
          key={group.id}
          group={group}
          isOpen={openParticleGroups[group.id]}
          onToggle={() => handleToggleParticleGroup(group.id)}
          selectedValue={particleEffect}
          onSelect={handleParticleEffectSelect}
        />
      ))}
    </ScrollView>
  </Animated.View>
)}

// Music uses MusicSelectionOverlay (separate component)
```

---

## 🎬 구현 로드맵

### Week 1: 기초 구조 (Day 1-7)

**Day 1-2**: 상수 파일
- ✅ `effect-groups.js` 생성
- ✅ 텍스트 4개 그룹 정의
- ✅ 파티클 5개 그룹 정의
- ✅ 음원 3개 그룹 정의

**Day 3-4**: 컴포넌트
- ✅ `EffectGroupAccordion.js` 구현 (이미 완료!)
- ✅ 테스트

**Day 5-7**: 통합
- ✅ `MessagePreviewOverlay.js` 통합 (텍스트 + 파티클)
- ✅ 테스트

---

### Week 2: 확장 & 최적화 (Day 8-14)

**Day 8-10**: 음원 그룹
- ✅ `MusicSelectionOverlay.js` 수정
- ✅ 동적 로드 (사용자 생성, 즐겨찾기)
- ✅ 테스트

**Day 11-12**: i18n
- ✅ 모든 번역 추가
- ✅ 영어/한국어

**Day 13-14**: 최종 테스트
- ✅ iOS/Android 테스트
- ✅ 성능 최적화
- ✅ 문서화

---

## 🎯 최종 요약

### 그룹 구성

**텍스트 애니메이션** (4개 그룹):
1. 💙 부드러운 (3개)
2. ⚡ 역동적인 (3개)
3. 💥 임팩트 (3개)
4. 🎨 경쾌한 (5개)

**파티클 효과** (5개 그룹):
1. 🚫 없음 (1개, 단독)
2. 💕 사랑 & 로맨스 (2개)
3. 🎉 축하 & 기쁨 (3개)
4. 🌿 자연 & 계절 (4개)
5. 🕯️ 위로 & 희망 (3개)
6. 🎨 기타 (향후 추가)

**배경 음원** (3개 그룹):
1. 🚫 없음 (1개, 단독)
2. 🎵 기본 음원 (5개)
3. 🤖 사용자 생성 (동적)
4. ⭐ 즐겨찾기 (동적, 중복 가능)

---

**작성**: Hero Nexus  
**일자**: 2025-12-08  
**버전**: 2.0.0  
**상태**: Complete Strategy

> **"Quick Action Chips 유지 + 모든 패널 완전 그룹화"**  
> — ANIMA Complete Effect Grouping Strategy 💙

