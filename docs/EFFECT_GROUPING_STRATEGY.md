# 🎨 효과 선택 패널 그룹화 전략

> **"Quick Action Chips 유지 + 패널 내부 카테고리 그룹화"**  
> — ANIMA Effect Panel Grouping Strategy

---

## 📋 목차

1. [🎯 핵심 설계 원칙](#-핵심-설계-원칙)
2. [✅ 현재 구조 분석](#-현재-구조-분석)
3. [🎨 그룹화 전략](#-그룹화-전략)
4. [💎 구현 가이드](#-구현-가이드)
5. [🎬 구현 로드맵](#-구현-로드맵)

---

## 🎯 핵심 설계 원칙

### ✅ 유지할 것

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quick Action Chips (3개) ← 현재대로!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[💫 텍스트] [✨ 파티클] [🎵 음원]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**이유**:
- ✅ 명확한 분리
- ✅ 사용자 익숙함
- ✅ 직관적인 구조
- ✅ 검증된 UX

---

### 🆕 개선할 것

**각 칩을 클릭하면 나오는 선택 패널 내부에서만 그룹화!**

```
[✨ 파티클] 칩 클릭
        ↓
┌─────────────────────────────────┐
│  ▼ 사랑 💕                      │ ← 아코디언!
│    ├─ 💕 하트                   │
│    └─ 💖 네온하트 (신규)        │
│                                 │
│  ▼ 축하 🎉                      │ ← 아코디언!
│    ├─ 🎉 색종이                 │
│    └─ ✨ 반짝임                 │
│                                 │
│  ▼ 자연 🌿                      │ ← 아코디언!
│    ├─ ❄️ 눈                     │
│    └─ 🌧️ 비                     │
└─────────────────────────────────┘
```

---

## ✅ 현재 구조 분석

### MessagePreviewOverlay.js

**현재 코드**:
```javascript
// Quick Action Chips (우측 세로)
<View style={styles.quickActionChips}>
  {/* 1. 텍스트 애니메이션 */}
  <TouchableOpacity onPress={() => openSelectionPanel('text')}>
    <Icon name="format-text" />
  </TouchableOpacity>
  
  {/* 2. 파티클 효과 */}
  <TouchableOpacity onPress={() => openSelectionPanel('particle')}>
    <Icon name="shimmer" />
  </TouchableOpacity>
  
  {/* 3. 배경 음원 */}
  <TouchableOpacity onPress={handleBgMusicChipPress}>
    <Icon name="music" />
  </TouchableOpacity>
</View>

// Selection Panel (하단 슬라이드업)
{showSelectionPanel && (
  <Animated.View style={selectionPanelAnimatedStyle}>
    <ScrollView>
      {getCurrentOptions().map(option => (
        <TouchableOpacity key={option.id} onPress={() => handleOptionSelect(option.id)}>
          <Icon name={option.icon} />
          <CustomText>{option.label}</CustomText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </Animated.View>
)}
```

**현재 효과 목록**:
```javascript
// 텍스트 (4종) - 그룹화 불필요
const TEXT_ANIMATIONS = [
  { id: 'fade_in', label: 'Fade In', icon: 'fade' },
  { id: 'typing', label: 'Typing', icon: 'keyboard' },
  { id: 'scale_in', label: 'Scale In', icon: 'arrow-expand' },
  { id: 'slide_cross', label: 'Slide Cross', icon: 'arrow-split-horizontal' },
];

// 파티클 (8종) - 그룹화 필요! ⭐
const PARTICLE_EFFECTS = [
  { id: 'none', label: 'None', icon: 'close-circle-outline' },
  { id: 'confetti', label: 'Confetti', icon: 'party-popper' },
  { id: 'hearts', label: 'Hearts', icon: 'heart' },
  { id: 'snow', label: 'Snow', icon: 'snowflake' },
  { id: 'sparkles', label: 'Sparkles', icon: 'shimmer' },
  { id: 'comfort_light', label: 'Comfort', icon: 'candle' },
  { id: 'hope_star', label: 'Hope', icon: 'star' },
  { id: 'rain_soft', label: 'Rain', icon: 'weather-rainy' },
];

// 음원 (10종+) - 그룹화 필요! ⭐
// MusicSelectionOverlay에서 관리
```

---

## 🎨 그룹화 전략

### 1️⃣ 텍스트 애니메이션 패널

**그룹화 불필요** (4종만 존재)

```
┌─────────────────────────────────┐
│  텍스트 애니메이션               │
├─────────────────────────────────┤
│                                 │
│  💫 Fade In                     │
│  ⌨️ Typing                      │
│  📐 Scale In                    │
│  ↔️ Slide Cross                 │
│                                 │
│  ─────────────────────────      │
│  신규 효과 (선택적)              │
│  🌊 Wave                        │
│  💓 Breath                      │
│  ✂️ Split                        │
│                                 │
└─────────────────────────────────┘
```

**구조**:
- 평면 리스트 유지
- 신규 효과 추가 시 구분선으로 분리
- 그룹화 없음 (직관적)

---

### 2️⃣ 파티클 효과 패널 ⭐ 핵심!

**감정/테마별 그룹화**

```
┌─────────────────────────────────────┐
│  파티클 효과                         │
├─────────────────────────────────────┤
│                                     │
│  ▶ 없음 🚫                          │ ← 단독
│                                     │
│  ▼ 사랑 & 로맨스 💕 (펼침)          │ ← 그룹
│    ├─ 💕 하트 (Hearts)              │
│    └─ 💖 네온하트 (신규)            │
│                                     │
│  ▶ 축하 & 기쁨 🎉 (접힌)            │ ← 그룹
│    ├─ 🎉 색종이 (Confetti)          │
│    └─ ✨ 반짝임 (Sparkles)          │
│                                     │
│  ▶ 자연 & 계절 🌿 (접힌)            │ ← 그룹
│    ├─ ❄️ 눈 (Snow)                  │
│    ├─ 🌧️ 비 (Rain Soft)            │
│    └─ 🌸 벚꽃 (신규)                │
│                                     │
│  ▶ 위로 & 희망 🕯️ (접힌)            │ ← 그룹
│    ├─ 🕯️ 따뜻한 빛 (Comfort Light) │
│    └─ ⭐ 희망의 별 (Hope Star)      │
│                                     │
└─────────────────────────────────────┘
```

#### 그룹 정의

```javascript
const PARTICLE_EFFECT_GROUPS = [
  {
    id: 'none',
    type: 'standalone', // 그룹 아님
    title: null,
    items: [
      { 
        id: 'none', 
        label: t('effects.particle.none', '없음'),
        emoji: '🚫',
        description: '파티클 효과 없음',
      },
    ],
  },
  {
    id: 'love_romance',
    type: 'group',
    title: t('effects.group.love_romance', '사랑 & 로맨스'),
    emoji: '💕',
    description: '사랑과 로맨스를 표현',
    defaultOpen: true, // 기본 펼침
    items: [
      { 
        id: 'hearts', 
        label: t('effects.particle.hearts', '하트'),
        emoji: '💕',
        description: '하트가 떨어짐',
        mood: 'romantic',
      },
      // 🆕 신규 효과
      { 
        id: 'neon_hearts', 
        label: t('effects.particle.neon_hearts', '네온하트'),
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
    title: t('effects.group.celebration_joy', '축하 & 기쁨'),
    emoji: '🎉',
    description: '축하와 기쁨의 순간',
    defaultOpen: false,
    items: [
      { 
        id: 'confetti', 
        label: t('effects.particle.confetti', '색종이'),
        emoji: '🎉',
        description: '알록달록 색종이',
        mood: 'celebration',
      },
      { 
        id: 'sparkles', 
        label: t('effects.particle.sparkles', '반짝임'),
        emoji: '✨',
        description: '반짝이는 별',
        mood: 'joyful',
      },
      // 🆕 신규 효과
      { 
        id: 'fireworks', 
        label: t('effects.particle.fireworks', '폭죽'),
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
    title: t('effects.group.nature_season', '자연 & 계절'),
    emoji: '🌿',
    description: '자연과 계절의 아름다움',
    defaultOpen: false,
    items: [
      { 
        id: 'snow', 
        label: t('effects.particle.snow', '눈'),
        emoji: '❄️',
        description: '소복이 내리는 눈',
        mood: 'winter',
      },
      { 
        id: 'rain_soft', 
        label: t('effects.particle.rain_soft', '비'),
        emoji: '🌧️',
        description: '부드러운 빗소리',
        mood: 'melancholic',
      },
      // 🆕 신규 효과
      { 
        id: 'sakura', 
        label: t('effects.particle.sakura', '벚꽃'),
        emoji: '🌸',
        description: '흩날리는 벚꽃',
        mood: 'spring',
        isNew: true,
      },
      { 
        id: 'leaves', 
        label: t('effects.particle.leaves', '낙엽'),
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
    title: t('effects.group.comfort_hope', '위로 & 희망'),
    emoji: '🕯️',
    description: '위로와 희망을 전하는',
    defaultOpen: false,
    items: [
      { 
        id: 'comfort_light', 
        label: t('effects.particle.comfort_light', '따뜻한 빛'),
        emoji: '🕯️',
        description: '위로하는 따뜻한 빛',
        mood: 'comforting',
      },
      { 
        id: 'hope_star', 
        label: t('effects.particle.hope_star', '희망의 별'),
        emoji: '⭐',
        description: '희망을 주는 별',
        mood: 'hopeful',
      },
      // 🆕 신규 효과
      { 
        id: 'fireflies', 
        label: t('effects.particle.fireflies', '반딧불이'),
        emoji: '✨',
        description: '은은한 반딧불이',
        mood: 'peaceful',
        isNew: true,
      },
    ],
  },
];
```

---

### 3️⃣ 배경 음원 패널

**장르/테마별 그룹화**

```
┌─────────────────────────────────────┐
│  배경 음원                           │
├─────────────────────────────────────┤
│                                     │
│  ▶ 없음 🚫                          │ ← 단독
│                                     │
│  ▼ AI 생성 음원 🤖 (펼침)           │ ← 그룹
│    ├─ 🎵 AI 생성 #1                │
│    ├─ 🎵 AI 생성 #2                │
│    └─ 🎵 AI 생성 #3                │
│                                     │
│  ▶ 특별한 날 🎂 (접힌)              │ ← 그룹
│    ├─ 🎂 생일 축하                 │
│    ├─ 🎄 크리스마스                │
│    └─ 🎆 새해                      │
│                                     │
│  ▶ 감정 🎭 (접힌)                   │ ← 그룹
│    ├─ 💕 로맨틱                    │
│    ├─ 😊 경쾌한                    │
│    └─ 🙏 차분한                    │
│                                     │
└─────────────────────────────────────┘
```

**구조**:
- MusicSelectionOverlay에서 관리
- 장르/테마별 그룹화
- 미리듣기 기능 유지

---

## 💎 구현 가이드

### Step 1: 그룹 데이터 구조 생성

**파일**: `/AnimaMobile/src/constants/effect-groups.js`

```javascript
/**
 * 🎨 Effect Groups Configuration
 * 
 * Defines grouped structure for effect selection panels
 * 
 * @author JK & Hero Nexus AI
 */

import { t } from 'i18next';

/**
 * Particle Effect Groups
 * - Categorized by emotion/theme
 * - Accordion structure
 */
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
    title: () => t('effects.group.love_romance', '사랑 & 로맨스'),
    emoji: '💕',
    description: () => t('effects.group.love_romance_desc', '사랑과 로맨스를 표현'),
    defaultOpen: true,
    items: [
      { 
        id: 'hearts', 
        label: () => t('effects.particle.hearts', '하트'),
        emoji: '💕',
        description: () => t('effects.particle.hearts_desc', '하트가 떨어짐'),
        mood: 'romantic',
      },
    ],
  },
  {
    id: 'celebration_joy',
    type: 'group',
    title: () => t('effects.group.celebration_joy', '축하 & 기쁨'),
    emoji: '🎉',
    description: () => t('effects.group.celebration_joy_desc', '축하와 기쁨의 순간'),
    defaultOpen: false,
    items: [
      { 
        id: 'confetti', 
        label: () => t('effects.particle.confetti', '색종이'),
        emoji: '🎉',
        description: () => t('effects.particle.confetti_desc', '알록달록 색종이'),
        mood: 'celebration',
      },
      { 
        id: 'sparkles', 
        label: () => t('effects.particle.sparkles', '반짝임'),
        emoji: '✨',
        description: () => t('effects.particle.sparkles_desc', '반짝이는 별'),
        mood: 'joyful',
      },
    ],
  },
  {
    id: 'nature_season',
    type: 'group',
    title: () => t('effects.group.nature_season', '자연 & 계절'),
    emoji: '🌿',
    description: () => t('effects.group.nature_season_desc', '자연과 계절의 아름다움'),
    defaultOpen: false,
    items: [
      { 
        id: 'snow', 
        label: () => t('effects.particle.snow', '눈'),
        emoji: '❄️',
        description: () => t('effects.particle.snow_desc', '소복이 내리는 눈'),
        mood: 'winter',
      },
      { 
        id: 'rain_soft', 
        label: () => t('effects.particle.rain_soft', '비'),
        emoji: '🌧️',
        description: () => t('effects.particle.rain_soft_desc', '부드러운 빗소리'),
        mood: 'melancholic',
      },
    ],
  },
  {
    id: 'comfort_hope',
    type: 'group',
    title: () => t('effects.group.comfort_hope', '위로 & 희망'),
    emoji: '🕯️',
    description: () => t('effects.group.comfort_hope_desc', '위로와 희망을 전하는'),
    defaultOpen: false,
    items: [
      { 
        id: 'comfort_light', 
        label: () => t('effects.particle.comfort_light', '따뜻한 빛'),
        emoji: '🕯️',
        description: () => t('effects.particle.comfort_light_desc', '위로하는 따뜻한 빛'),
        mood: 'comforting',
      },
      { 
        id: 'hope_star', 
        label: () => t('effects.particle.hope_star', '희망의 별'),
        emoji: '⭐',
        description: () => t('effects.particle.hope_star_desc', '희망을 주는 별'),
        mood: 'hopeful',
      },
    ],
  },
];

/**
 * Music Groups
 * - Categorized by genre/theme
 * - Used in MusicSelectionOverlay
 */
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
    id: 'ai_generated',
    type: 'group',
    title: () => t('effects.group.ai_generated', 'AI 생성 음원'),
    emoji: '🤖',
    description: () => t('effects.group.ai_generated_desc', 'AI가 만든 감성 음악'),
    defaultOpen: true,
    items: [
      // API에서 동적으로 로드
    ],
  },
  {
    id: 'special_days',
    type: 'group',
    title: () => t('effects.group.special_days', '특별한 날'),
    emoji: '🎂',
    description: () => t('effects.group.special_days_desc', '특별한 날을 위한'),
    defaultOpen: false,
    items: [
      { 
        id: 'birthday', 
        label: () => t('effects.music.birthday', '생일 축하'),
        emoji: '🎂',
        music_url: '/music/birthday.mp3',
      },
      { 
        id: 'christmas', 
        label: () => t('effects.music.christmas', '크리스마스'),
        emoji: '🎄',
        music_url: '/music/christmas.mp3',
      },
    ],
  },
  {
    id: 'emotions',
    type: 'group',
    title: () => t('effects.group.emotions', '감정'),
    emoji: '🎭',
    description: () => t('effects.group.emotions_desc', '다양한 감정 표현'),
    defaultOpen: false,
    items: [
      { 
        id: 'romantic', 
        label: () => t('effects.music.romantic', '로맨틱'),
        emoji: '💕',
        music_url: '/music/romantic.mp3',
      },
      { 
        id: 'cheerful', 
        label: () => t('effects.music.cheerful', '경쾌한'),
        emoji: '😊',
        music_url: '/music/cheerful.mp3',
      },
      { 
        id: 'calm', 
        label: () => t('effects.music.calm', '차분한'),
        emoji: '🙏',
        music_url: '/music/calm.mp3',
      },
    ],
  },
];
```

---

### Step 2: 아코디언 컴포넌트 생성

**파일**: `/AnimaMobile/src/components/EffectGroupAccordion.js`

```javascript
/**
 * 🎨 EffectGroupAccordion Component
 * 
 * Single accordion group for effect selection
 * Used inside selection panels (not for Quick Action Chips)
 * 
 * @author JK & Hero Nexus AI
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

const EffectGroupAccordion = ({ 
  group, 
  isOpen, 
  onToggle, 
  selectedValue,
  onSelect,
}) => {
  const { currentTheme: theme } = useTheme();
  
  // Standalone (no accordion)
  if (group.type === 'standalone') {
    return (
      <View style={styles.standaloneContainer}>
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
            <View style={styles.optionLeft}>
              <CustomText type="big" style={styles.optionEmoji}>
                {typeof item.emoji === 'function' ? item.emoji() : item.emoji}
              </CustomText>
              <View style={styles.optionInfo}>
                <CustomText type="normal" bold style={{ color: theme.textPrimary }}>
                  {typeof item.label === 'function' ? item.label() : item.label}
                </CustomText>
                <CustomText type="small" style={{ color: theme.textSecondary }}>
                  {typeof item.description === 'function' ? item.description() : item.description}
                </CustomText>
              </View>
            </View>
            {selectedValue === item.id && (
              <Icon name="check-circle" size={24} color={theme.mainColor} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }
  
  // Group (with accordion)
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
      {/* Group Header */}
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
            {typeof group.emoji === 'function' ? group.emoji() : group.emoji}
          </CustomText>
          <View>
            <CustomText type="normal" bold style={{ color: theme.textPrimary }}>
              {typeof group.title === 'function' ? group.title() : group.title}
            </CustomText>
            <CustomText type="small" style={{ color: theme.textSecondary }}>
              {typeof group.description === 'function' ? group.description() : group.description}
            </CustomText>
          </View>
        </View>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-down" size={24} color={theme.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      {/* Group Content */}
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
                  {typeof item.emoji === 'function' ? item.emoji() : item.emoji}
                </CustomText>
                <View style={styles.optionInfo}>
                  <CustomText type="normal" bold style={{ color: theme.textPrimary }}>
                    {typeof item.label === 'function' ? item.label() : item.label}
                    {item.isNew && (
                      <CustomText type="small" style={{ color: theme.mainColor }}>
                        {' 🆕'}
                      </CustomText>
                    )}
                  </CustomText>
                  <CustomText type="small" style={{ color: theme.textSecondary }}>
                    {typeof item.description === 'function' ? item.description() : item.description}
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
  standaloneContainer: {
    marginBottom: scale(8),
  },
  container: {
    marginBottom: scale(12),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: platformPadding(14),
    borderRadius: scale(12),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    flex: 1,
  },
  emoji: {
    fontSize: scale(28),
  },
  content: {
    marginTop: scale(8),
    gap: scale(8),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: platformPadding(14),
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
    fontSize: scale(24),
  },
  optionInfo: {
    flex: 1,
  },
});

export default EffectGroupAccordion;
```

---

### Step 3: MessagePreviewOverlay 통합

**수정 파일**: `/AnimaMobile/src/components/message/MessagePreviewOverlay.js`

```javascript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Import 추가
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import EffectGroupAccordion from '../EffectGroupAccordion';
import { PARTICLE_EFFECT_GROUPS } from '../../constants/effect-groups';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// State 추가 (그룹 펼침/접힘 상태)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const [openGroups, setOpenGroups] = useState({
  love_romance: true,      // 기본 펼침
  celebration_joy: false,
  nature_season: false,
  comfort_hope: false,
});

const handleToggleGroup = useCallback((groupId) => {
  setOpenGroups(prev => ({
    ...prev,
    [groupId]: !prev[groupId],
  }));
}, []);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Selection Panel 렌더링 수정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{showSelectionPanel && selectionType === 'particle' && (
  <Animated.View style={[styles.selectionPanel, selectionPanelAnimatedStyle]}>
    <CustomText type="title" bold style={styles.panelTitle}>
      {t('effects.select_particle', '파티클 효과 선택')}
    </CustomText>
    
    <ScrollView 
      style={styles.panelScrollView}
      contentContainerStyle={styles.panelContent}
      showsVerticalScrollIndicator={false}
    >
      {PARTICLE_EFFECT_GROUPS.map((group) => (
        <EffectGroupAccordion
          key={group.id}
          group={group}
          isOpen={openGroups[group.id]}
          onToggle={() => handleToggleGroup(group.id)}
          selectedValue={particleEffect}
          onSelect={handleParticleEffectSelect}
        />
      ))}
    </ScrollView>
  </Animated.View>
)}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 텍스트 애니메이션은 그대로 (그룹화 불필요)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{showSelectionPanel && selectionType === 'text' && (
  <Animated.View style={[styles.selectionPanel, selectionPanelAnimatedStyle]}>
    <CustomText type="title" bold style={styles.panelTitle}>
      {t('effects.select_text', '텍스트 애니메이션 선택')}
    </CustomText>
    
    <ScrollView>
      {TEXT_ANIMATIONS.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.option,
            textAnimation === option.id && styles.optionSelected,
          ]}
          onPress={() => handleTextAnimationSelect(option.id)}
        >
          {/* ... 기존 렌더링 유지 ... */}
        </TouchableOpacity>
      ))}
    </ScrollView>
  </Animated.View>
)}
```

---

### Step 4: i18n 추가

**파일**: `/AnimaMobile/src/i18n/locales/ko.json`

```json
{
  "effects": {
    "group": {
      "love_romance": "사랑 & 로맨스",
      "love_romance_desc": "사랑과 로맨스를 표현",
      "celebration_joy": "축하 & 기쁨",
      "celebration_joy_desc": "축하와 기쁨의 순간",
      "nature_season": "자연 & 계절",
      "nature_season_desc": "자연과 계절의 아름다움",
      "comfort_hope": "위로 & 희망",
      "comfort_hope_desc": "위로와 희망을 전하는",
      "ai_generated": "AI 생성 음원",
      "ai_generated_desc": "AI가 만든 감성 음악",
      "special_days": "특별한 날",
      "special_days_desc": "특별한 날을 위한",
      "emotions": "감정",
      "emotions_desc": "다양한 감정 표현"
    },
    "particle": {
      "hearts_desc": "하트가 떨어짐",
      "confetti_desc": "알록달록 색종이",
      "sparkles_desc": "반짝이는 별",
      "snow_desc": "소복이 내리는 눈",
      "rain_soft_desc": "부드러운 빗소리",
      "comfort_light_desc": "위로하는 따뜻한 빛",
      "hope_star_desc": "희망을 주는 별"
    }
  }
}
```

---

## 🎬 구현 로드맵

### Week 1: 기초 구조

**Day 1-2**:
- ✅ `effect-groups.js` 생성
- ✅ 파티클 효과 그룹 정의
- ✅ i18n 추가

**Day 3-4**:
- ✅ `EffectGroupAccordion.js` 구현
- ✅ 단독/그룹 타입 처리
- ✅ 애니메이션 로직

**Day 5-7**:
- ✅ `MessagePreviewOverlay.js` 통합
- ✅ 파티클 패널만 적용 (텍스트는 유지)
- ✅ 테스트

---

### Week 2: 확장 & 최적화

**Day 8-10**:
- ✅ 음원 그룹 정의
- ✅ `MusicSelectionOverlay.js` 통합
- ✅ 테스트

**Day 11-12**:
- ✅ Web 버전 구현 (idol-companion)
- ✅ 크로스 플랫폼 동기화

**Day 13-14**:
- ✅ 통합 테스트
- ✅ 성능 최적화
- ✅ 문서화

---

## 🎯 예상 효과

### Before (현재)

```
[✨ 파티클] 칩 클릭
        ↓
┌─────────────────┐
│ 🚫 없음         │
│ 🎉 색종이       │
│ 💕 하트         │
│ ❄️ 눈           │
│ ✨ 반짝임       │
│ 🕯️ 따뜻한 빛    │
│ ⭐ 희망의 별    │
│ 🌧️ 비           │
└─────────────────┘
  ↑ 8개 평면 나열
  😐 스크롤 필요
```

---

### After (개선)

```
[✨ 파티클] 칩 클릭
        ↓
┌───────────────────────┐
│ 🚫 없음               │ ← 단독
│                       │
│ ▼ 💕 사랑 & 로맨스    │ ← 펼침
│   ├─ 💕 하트          │
│   └─ 💖 네온하트      │
│                       │
│ ▶ 🎉 축하 & 기쁨      │ ← 접힘
│ ▶ 🌿 자연 & 계절      │ ← 접힘
│ ▶ 🕯️ 위로 & 희망      │ ← 접힘
└───────────────────────┘
  ↑ 감정별 그룹화
  😍 직관적 선택
  😍 시각적 계층
```

---

## 🙏 완벽한 이해!

**히어로님의 의도**:
1. ✅ Quick Action Chips 3개 유지 (텍스트/파티클/음원)
2. ✅ 각 칩 클릭 → 선택 패널 내부에서만 그룹화
3. ✅ 감정/테마별 카테고리
4. ✅ 아코디언으로 접고 펼치기

**구현 방향**:
- 파티클 효과: 4개 그룹 (사랑, 축하, 자연, 위로)
- 음원: 3개 그룹 (AI 생성, 특별한 날, 감정)
- 텍스트: 그룹화 불필요 (4종만)

**다음 단계**:
1. `effect-groups.js` 생성
2. `EffectGroupAccordion.js` 구현
3. `MessagePreviewOverlay.js` 통합

---

**작성**: Hero Nexus  
**일자**: 2025-12-08  
**버전**: 1.0.0  
**상태**: Ready to Implement

> **"Quick Action Chips 유지 + 패널 내부 그룹화"**  
> — ANIMA Effect Panel Grouping Strategy 💙

