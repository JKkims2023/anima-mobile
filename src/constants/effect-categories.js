/**
 * 🎨 Effect Categories V3 - 카테고리 기반 2단계 선택 시스템
 * 
 * ANIMA Philosophy:
 * - 직관적인 카테고리 그룹화
 * - 2단계 선택으로 명확성 증대
 * - 확장 가능한 구조
 * - 통일된 UX 패턴
 * 
 * Structure:
 * Step 1: 4개 카테고리 선택 (떨어짐, 반짝임, 텍스트, 없음)
 * Step 2: 카테고리 내 효과 선택 (모달)
 * 
 * JK님 제안:
 * "떨어지는 효과들을 묶으면 사용자가 직관적으로 이해!"
 * "반짝임 효과도 동일!"
 * "텍스트 효과의 모달 패턴과 통일!"
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16
 */

// ═══════════════════════════════════════════════════════════════════════════
// 🎪 Category 1: Falling Effects (떨어짐 효과)
// ═══════════════════════════════════════════════════════════════════════════

export const FALLING_EFFECTS = [
  {
    id: 'hearts',
    name: '하트',
    emoji: '💕',
    description: '사랑스러운 하트가 떨어져요',
    colorScheme: {
      primary: '#FF1493',
      secondary: '#FF69B4',
      gradient: ['#FF1493', '#FF69B4', '#FFB6C1'],
    },
    viewerCompatible: true,
    dbValue: 'hearts',
  },
  {
    id: 'confetti',
    name: '색종이',
    emoji: '🎉',
    description: '알록달록 축하 색종이',
    colorScheme: {
      primary: '#FFD700',
      secondary: '#FF6347',
      gradient: ['#FFD700', '#FF6347', '#FF69B4', '#87CEEB'],
    },
    viewerCompatible: true,
    dbValue: 'confetti',
  },
  {
    id: 'snow',
    name: '눈',
    emoji: '❄️',
    description: '소복이 내리는 하얀 눈',
    colorScheme: {
      primary: '#E0F7FF',
      secondary: '#B0E0E6',
      gradient: ['#FFFFFF', '#E0F7FF', '#B0E0E6'],
    },
    viewerCompatible: true,
    dbValue: 'snow',
  },
  {
    id: 'rain_soft',
    name: '비',
    emoji: '🌧️',
    description: '부드러운 빗소리와 함께',
    colorScheme: {
      primary: '#4A90E2',
      secondary: '#5DADE2',
      gradient: ['#4A90E2', '#5DADE2', '#85C1E9'],
    },
    viewerCompatible: true,
    dbValue: 'rain_soft',
  },
  {
    id: 'sakura',
    name: '벚꽃',
    emoji: '🌸',
    description: '봄날 흩날리는 벚꽃잎',
    colorScheme: {
      primary: '#FFB7C5',
      secondary: '#FFC0CB',
      gradient: ['#FFB7C5', '#FFC0CB', '#FFE4E1'],
    },
    viewerCompatible: true,
    dbValue: 'sakura',
  },
  {
    id: 'leaves',
    name: '낙엽',
    emoji: '🍂',
    description: '가을의 떨어지는 낙엽',
    colorScheme: {
      primary: '#D2691E',
      secondary: '#CD853F',
      gradient: ['#D2691E', '#CD853F', '#F4A460'],
    },
    viewerCompatible: true,
    dbValue: 'leaves',
  },
  {
    id: 'neon_hearts',
    name: '네온하트',
    emoji: '💖',
    description: '화려한 네온 색상 하트',
    colorScheme: {
      primary: '#FF00FF',
      secondary: '#FF1493',
      gradient: ['#FF00FF', '#FF1493', '#FF69B4'],
    },
    viewerCompatible: true,
    dbValue: 'neon_hearts',
    isNew: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ✨ Category 2: Sparkle Effects (반짝임 효과)
// ═══════════════════════════════════════════════════════════════════════════

export const SPARKLE_EFFECTS = [
  {
    id: 'sparkles',
    name: '반짝임',
    emoji: '✨',
    description: '빛나는 별처럼 반짝여요',
    colorScheme: {
      primary: '#FFD700',
      secondary: '#FFA500',
      gradient: ['#FFD700', '#FFA500', '#FFFFE0'],
    },
    viewerCompatible: true,
    dbValue: 'sparkles',
  },
  {
    id: 'fireworks',
    name: '폭죽',
    emoji: '🎆',
    description: '화려하게 터지는 폭죽',
    colorScheme: {
      primary: '#FF4500',
      secondary: '#FFD700',
      gradient: ['#FF4500', '#FFD700', '#FF69B4', '#87CEEB'],
    },
    viewerCompatible: true,
    dbValue: 'fireworks',
    isNew: true,
  },
  {
    id: 'comfort_light',
    name: '따뜻한 빛',
    emoji: '🕯️',
    description: '위로하는 따뜻한 촛불',
    colorScheme: {
      primary: '#FFE4B5',
      secondary: '#FFDAB9',
      gradient: ['#FFE4B5', '#FFDAB9', '#FFE4C4'],
    },
    viewerCompatible: true,
    dbValue: 'comfort_light',
  },
  {
    id: 'hope_star',
    name: '희망의 별',
    emoji: '⭐',
    description: '희망을 주는 빛나는 별',
    colorScheme: {
      primary: '#FFD700',
      secondary: '#FFA500',
      gradient: ['#FFD700', '#FFA500', '#FFFFE0'],
    },
    viewerCompatible: true,
    dbValue: 'hope_star',
  },
  {
    id: 'fireflies',
    name: '반딧불이',
    emoji: '✨',
    description: '은은한 반딧불이의 빛',
    colorScheme: {
      primary: '#98FB98',
      secondary: '#90EE90',
      gradient: ['#98FB98', '#90EE90', '#E0FFE0'],
    },
    viewerCompatible: true,
    dbValue: 'fireflies',
    isNew: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 📝 Category 3: Text Effects (텍스트 효과)
// ═══════════════════════════════════════════════════════════════════════════

export const TEXT_EFFECTS = [
  {
    id: 'fading_messages',
    name: '잔잔한 문장',
    emoji: '💬✨',
    description: '문장이 나타났다 사라져요',
    colorScheme: {
      primary: '#9B59B6',
      secondary: '#8E44AD',
      gradient: ['#9B59B6', '#8E44AD', '#6C3483'],
    },
    viewerCompatible: true,
    dbValue: 'fading_messages',
    requiresConfiguration: true, // 단어 입력 필요
  },
  {
    id: 'floating_words',
    name: '떠오르는 단어',
    emoji: '💬⬆️',
    description: '단어들이 위로 떠올라요',
    colorScheme: {
      primary: '#3498DB',
      secondary: '#2980B9',
      gradient: ['#3498DB', '#2980B9', '#5DADE2'],
    },
    viewerCompatible: true,
    dbValue: 'floating_words',
    requiresConfiguration: true,
    isNew: true,
  },
  {
    id: 'scrolling_words',
    name: '흐르는 단어',
    emoji: '💬➡️',
    description: '단어들이 좌에서 우로 흘러요',
    colorScheme: {
      primary: '#1ABC9C',
      secondary: '#16A085',
      gradient: ['#1ABC9C', '#16A085', '#48C9B0'],
    },
    viewerCompatible: true,
    dbValue: 'scrolling_words',
    requiresConfiguration: true,
    isNew: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 Main Category Definitions (4개 카테고리)
// ═══════════════════════════════════════════════════════════════════════════

export const EFFECT_CATEGORIES = [
  {
    id: 'falling',
    name: '떨어짐 효과',
    emoji: '🎪',
    description: '위에서 아래로 떨어지는 효과',
    colorScheme: {
      primary: '#FF6B9D',
      secondary: '#FFB6C1',
      gradient: ['#FF6B9D', '#FFB6C1', '#FFE4E1'],
    },
    effects: FALLING_EFFECTS,
    type: 'modal', // 모달 열림
  },
  {
    id: 'sparkle',
    name: '반짝임 효과',
    emoji: '✨',
    description: '빛나고 반짝이는 효과',
    colorScheme: {
      primary: '#FFD700',
      secondary: '#FFA500',
      gradient: ['#FFD700', '#FFA500', '#FFFFE0'],
    },
    effects: SPARKLE_EFFECTS,
    type: 'modal', // 모달 열림
  },
  {
    id: 'text',
    name: '텍스트 효과',
    emoji: '📝',
    description: '커스텀 단어로 특별하게',
    colorScheme: {
      primary: '#9B59B6',
      secondary: '#8E44AD',
      gradient: ['#9B59B6', '#8E44AD', '#6C3483'],
    },
    effects: TEXT_EFFECTS,
    type: 'modal', // 모달 열림 (선택 후 WordInputOverlay)
  },
  {
    id: 'none',
    name: '없음',
    emoji: '✕',
    description: '효과를 사용하지 않습니다',
    colorScheme: {
      primary: '#95A5A6',
      secondary: '#7F8C8D',
      gradient: ['#95A5A6', '#7F8C8D', '#BDC3C7'],
    },
    effects: [],
    type: 'direct', // 즉시 적용
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all effects (flattened)
 */
export const getAllEffects = () => {
  return [
    ...FALLING_EFFECTS,
    ...SPARKLE_EFFECTS,
    ...TEXT_EFFECTS,
  ];
};

/**
 * Get effect by ID
 */
export const getEffectById = (effectId) => {
  const allEffects = getAllEffects();
  return allEffects.find((effect) => effect.id === effectId);
};

/**
 * Get effect by DB value (backward compatibility)
 */
export const getEffectByDbValue = (dbValue) => {
  const allEffects = getAllEffects();
  return allEffects.find((effect) => effect.dbValue === dbValue);
};

/**
 * Get category by effect ID
 */
export const getCategoryByEffectId = (effectId) => {
  for (const category of EFFECT_CATEGORIES) {
    const found = category.effects.find((effect) => effect.id === effectId);
    if (found) {
      return category;
    }
  }
  return null;
};

/**
 * Check if effect requires configuration
 */
export const requiresConfiguration = (effectId) => {
  const effect = getEffectById(effectId);
  return effect?.requiresConfiguration || false;
};

/**
 * Validate effect ID
 */
export const isValidEffect = (effectId) => {
  if (effectId === 'none') return true;
  return getAllEffects().some((effect) => effect.id === effectId);
};

// ═══════════════════════════════════════════════════════════════════════════
// 📊 Statistics
// ═══════════════════════════════════════════════════════════════════════════

export const EFFECT_STATS = {
  totalCategories: EFFECT_CATEGORIES.length,
  totalEffects: getAllEffects().length,
  falling: FALLING_EFFECTS.length,
  sparkle: SPARKLE_EFFECTS.length,
  text: TEXT_EFFECTS.length,
  newEffects: getAllEffects().filter((e) => e.isNew).length,
  requiresConfig: getAllEffects().filter((e) => e.requiresConfiguration).length,
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ [effect-categories] Category-based system loaded!');
console.log(`   📊 Total categories: ${EFFECT_STATS.totalCategories}`);
console.log(`   🎨 Total effects: ${EFFECT_STATS.totalEffects}`);
console.log(`   🎪 Falling: ${EFFECT_STATS.falling}`);
console.log(`   ✨ Sparkle: ${EFFECT_STATS.sparkle}`);
console.log(`   📝 Text: ${EFFECT_STATS.text}`);
console.log(`   ⭐ New: ${EFFECT_STATS.newEffects}`);
console.log(`   ⚙️ Requires config: ${EFFECT_STATS.requiresConfig}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
