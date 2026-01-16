/**
 * 🎨 EFFECT GROUPS V2 - Optimized & Simplified
 * 
 * ANIMA Philosophy:
 * - 19개 → 5개로 단순화
 * - 검증된 효과만 선택
 * - 직관적이고 감성적인 선택
 * - Lock 현상 제거
 * 
 * Backward Compatibility:
 * - 기존 effect_config.active_effect 값 그대로 사용
 * - DB 마이그레이션 불필요
 * - Viewer 페이지 호환성 보장
 */

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Active Effects (Layer 2) - 5 Selected Effects
// ═══════════════════════════════════════════════════════════════════════════

export const ACTIVE_EFFECTS_V2 = [
  {
    id: 'hearts',
    name: '하트',
    emoji: '💕',
    description: '사랑스러운 하트 효과',
    category: 'love',
    colorScheme: {
      primary: '#FF1493',
      secondary: '#FF69B4',
      gradient: ['#FF1493', '#FF69B4', '#FFB6C1'],
    },
    // Viewer compatibility
    viewerCompatible: true,
    dbValue: 'hearts', // particle_effect, effect_config.active_effect
  },
  {
    id: 'confetti',
    name: '색종이',
    emoji: '🎉',
    description: '축하와 기쁨의 색종이',
    category: 'celebration',
    colorScheme: {
      primary: '#FFD700',
      secondary: '#FF6347',
      gradient: ['#FFD700', '#FF6347', '#FF69B4', '#87CEEB'],
    },
    viewerCompatible: true,
    dbValue: 'confetti',
  },
  {
    id: 'sparkles',
    name: '반짝임',
    emoji: '✨',
    description: '빛나는 반짝임 효과',
    category: 'celebration',
    colorScheme: {
      primary: '#FFD700',
      secondary: '#FFA500',
      gradient: ['#FFD700', '#FFA500', '#FFFFE0'],
    },
    viewerCompatible: true,
    dbValue: 'sparkles',
  },
  {
    id: 'snow',
    name: '눈',
    emoji: '❄️',
    description: '하얀 눈송이',
    category: 'nature',
    colorScheme: {
      primary: '#E0F7FF',
      secondary: '#B0E0E6',
      gradient: ['#FFFFFF', '#E0F7FF', '#B0E0E6'],
    },
    viewerCompatible: true,
    dbValue: 'snow',
  },
  {
    id: 'sakura',
    name: '벚꽃',
    emoji: '🌸',
    description: '봄의 벚꽃 잎',
    category: 'nature',
    colorScheme: {
      primary: '#FFB7C5',
      secondary: '#FFC0CB',
      gradient: ['#FFB7C5', '#FFC0CB', '#FFE4E1'],
    },
    viewerCompatible: true,
    dbValue: 'sakura',
  },
  {
    id: 'fading_messages',
    name: '텍스트 효과',
    emoji: '📝',
    description: '커스텀 단어로 특별하게',
    category: 'special',
    colorScheme: {
      primary: '#9B59B6',
      secondary: '#8E44AD',
      gradient: ['#9B59B6', '#8E44AD', '#6C3483'],
    },
    viewerCompatible: true,
    dbValue: 'fading_messages',
    requiresConfiguration: true, // ⭐ 특별 플래그: 추가 설정 필요
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get effect by ID
 */
export const getEffectById = (effectId) => {
  return ACTIVE_EFFECTS_V2.find((effect) => effect.id === effectId);
};

/**
 * Get effect by DB value (backward compatibility)
 */
export const getEffectByDbValue = (dbValue) => {
  return ACTIVE_EFFECTS_V2.find((effect) => effect.dbValue === dbValue);
};

/**
 * Check if effect is valid
 */
export const isValidEffect = (effectId) => {
  return ACTIVE_EFFECTS_V2.some((effect) => effect.id === effectId);
};

/**
 * Get default effect
 */
export const getDefaultEffect = () => {
  return ACTIVE_EFFECTS_V2[0]; // hearts
};

// ═══════════════════════════════════════════════════════════════════════════
// 📊 Export Summary
// ═══════════════════════════════════════════════════════════════════════════

export const EFFECT_SUMMARY = {
  total: ACTIVE_EFFECTS_V2.length,
  categories: {
    love: ACTIVE_EFFECTS_V2.filter((e) => e.category === 'love').length,
    celebration: ACTIVE_EFFECTS_V2.filter((e) => e.category === 'celebration').length,
    nature: ACTIVE_EFFECTS_V2.filter((e) => e.category === 'nature').length,
    special: ACTIVE_EFFECTS_V2.filter((e) => e.category === 'special').length,
  },
  viewerCompatible: ACTIVE_EFFECTS_V2.filter((e) => e.viewerCompatible).length,
  requiresConfiguration: ACTIVE_EFFECTS_V2.filter((e) => e.requiresConfiguration).length,
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ [effect-groups-v2] Loaded successfully!');
console.log(`   📊 Total effects: ${EFFECT_SUMMARY.total}`);
console.log(`   💕 Love: ${EFFECT_SUMMARY.categories.love}`);
console.log(`   🎉 Celebration: ${EFFECT_SUMMARY.categories.celebration}`);
console.log(`   🌿 Nature: ${EFFECT_SUMMARY.categories.nature}`);
console.log(`   📝 Special: ${EFFECT_SUMMARY.categories.special}`);
console.log(`   ✅ Viewer compatible: ${EFFECT_SUMMARY.viewerCompatible}`);
console.log(`   ⚙️ Requires config: ${EFFECT_SUMMARY.requiresConfiguration}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
