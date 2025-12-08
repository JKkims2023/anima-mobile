/**
 * 🎨 Effect Groups Configuration
 * 
 * Complete grouped structure for all effect selection panels:
 * - Text Animations (4 groups: Gentle, Dynamic, Impactful, Playful)
 * - Particle Effects (5 groups: Love, Celebration, Nature, Comfort, Others)
 * - Background Music (3 groups: Default, User Generated, Favorites)
 * 
 * Design Principles:
 * - Emotion-based categorization
 * - Accordion structure for better UX
 * - i18n support for all labels
 * - Consistent with Next.js web version
 * 
 * @author JK & Hero Nexus AI
 */

import { t } from 'i18next';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💫 TEXT ANIMATION GROUPS (4 groups, 14 effects total)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Text Animation Groups
 * 
 * Categorized by mood and animation style:
 * 1. Gentle (💙): Soft, calm, comfortable animations
 * 2. Dynamic (⚡): Fast, energetic, lively animations  
 * 3. Impactful (💥): Strong, impressive, dramatic animations
 * 4. Playful (🎨): Fun, cheerful, whimsical animations
 */
export const TEXT_ANIMATION_GROUPS = [
  // ─────────────────────────────────────────────────────────────────────
  // Group 1: Gentle (부드러운) 💙
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'gentle',
    type: 'group',
    title: () => t('effects.text_group.gentle', '부드러운'),
    emoji: '💙',
    description: () => t('effects.text_group.gentle_desc', '은은하고 편안한'),
    defaultOpen: true, // First group opens by default
    items: [
      { 
        id: 'fade_in', 
        label: () => t('effects.text.fade_in', 'Fade In'),
        emoji: '💫',
        description: '부드럽게 나타남',
        mood: 'gentle',
        duration: 500,
      },
      { 
        id: 'breath', 
        label: () => t('effects.text.breath', 'Breath'),
        emoji: '💓',
        description: '숨쉬듯 크기 변화',
        mood: 'gentle',
        duration: 4000,
        isNew: true,
        recommended: true, // ⭐ ANIMA Philosophy: "Breathing AI"
      },
      { 
        id: 'blur_focus', 
        label: () => t('effects.text.blur_focus', 'Blur Focus'),
        emoji: '🌫️',
        description: '흐릿하게 → 선명하게',
        mood: 'gentle',
        duration: 1000,
        isNew: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 2: Dynamic (역동적인) ⚡
  // ─────────────────────────────────────────────────────────────────────
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
        duration: 'variable', // Based on text length
      },
      { 
        id: 'letter_drop', 
        label: () => t('effects.text.letter_drop', 'Letter Drop'),
        emoji: '🔤',
        description: '글자가 떨어짐',
        mood: 'dynamic',
        duration: 800,
        isNew: true,
      },
      { 
        id: 'rotate_in', 
        label: () => t('effects.text.rotate_in', 'Rotate In'),
        emoji: '🌀',
        description: '회전하며 등장',
        mood: 'dynamic',
        duration: 600,
        isNew: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 3: Impactful (임팩트) 💥
  // ─────────────────────────────────────────────────────────────────────
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
        duration: 600,
      },
      { 
        id: 'split', 
        label: () => t('effects.text.split', 'Split'),
        emoji: '✂️',
        description: '중앙에서 좌우로 분할',
        mood: 'impactful',
        duration: 600,
        isNew: true,
      },
      { 
        id: 'glow_pulse', 
        label: () => t('effects.text.glow_pulse', 'Glow Pulse'),
        emoji: '✨',
        description: '빛나는 펄스',
        mood: 'impactful',
        duration: 2000,
        isNew: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 4: Playful (경쾌한) 🎨
  // ─────────────────────────────────────────────────────────────────────
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
        duration: 700,
      },
      { 
        id: 'wave', 
        label: () => t('effects.text.wave', 'Wave'),
        emoji: '🌊',
        description: '물결치듯 움직임',
        mood: 'playful',
        duration: 800,
        isNew: true,
        recommended: true, // ⭐ Popular effect
      },
      { 
        id: 'stagger', 
        label: () => t('effects.text.stagger', 'Stagger'),
        emoji: '📊',
        description: '단어별 순차 등장',
        mood: 'playful',
        duration: 'variable',
        isNew: true,
      },
      { 
        id: 'flip', 
        label: () => t('effects.text.flip', 'Flip'),
        emoji: '🎭',
        description: '카드 뒤집기',
        mood: 'playful',
        duration: 600,
        isNew: true,
      },
      { 
        id: 'rainbow', 
        label: () => t('effects.text.rainbow', 'Rainbow'),
        emoji: '🌈',
        description: '무지개 색상 변화',
        mood: 'playful',
        duration: 5000,
        isNew: true,
      },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✨ PARTICLE EFFECT GROUPS (5 groups, 12+ effects total)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Particle Effect Groups
 * 
 * Categorized by emotion and theme:
 * 1. None: No particle effect (standalone)
 * 2. Love & Romance (💕): Hearts and romantic particles
 * 3. Celebration & Joy (🎉): Confetti, sparkles, fireworks
 * 4. Nature & Season (🌿): Snow, rain, sakura, leaves
 * 5. Comfort & Hope (🕯️): Warm light, stars, fireflies
 * 6. Others (🎨): Miscellaneous effects (for future expansion)
 */
export const PARTICLE_EFFECT_GROUPS = [
  // ─────────────────────────────────────────────────────────────────────
  // Standalone: None
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'none',
    type: 'standalone', // Not an accordion group
    items: [
      { 
        id: 'none', 
        label: () => t('effects.particle.none', '없음'),
        emoji: '🚫',
        description: () => t('effects.particle.none_desc', '파티클 효과 없음'),
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 1: Love & Romance (사랑 & 로맨스) 💕
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'love_romance',
    type: 'group',
    title: () => t('effects.particle_group.love_romance', '사랑 & 로맨스'),
    emoji: '💕',
    description: () => t('effects.particle_group.love_romance_desc', '사랑과 로맨스를 표현'),
    defaultOpen: true, // First group opens by default
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

  // ─────────────────────────────────────────────────────────────────────
  // Group 2: Celebration & Joy (축하 & 기쁨) 🎉
  // ─────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────
  // Group 3: Nature & Season (자연 & 계절) 🌿
  // ─────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────
  // Group 4: Comfort & Hope (위로 & 희망) 🕯️
  // ─────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────
  // Group 5: Others (기타) 🎨
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'others',
    type: 'group',
    title: () => t('effects.particle_group.others', '기타'),
    emoji: '🎨',
    description: () => t('effects.particle_group.others_desc', '다양한 효과들'),
    defaultOpen: false,
    items: [
      // Reserved for future effects
      // This group will be hidden if empty
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 MUSIC GROUPS (3 groups + dynamic loading)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Music Groups
 * 
 * Categorized by source and usage:
 * 1. None: No background music (standalone)
 * 2. Default (🎵): ANIMA default music collection
 * 3. User Generated (🤖): AI-generated music by user
 * 4. Favorites (⭐): User's favorite music (can overlap with other groups)
 * 
 * Note: Groups 3 and 4 are dynamically loaded from API
 */
export const MUSIC_GROUPS = [
  // ─────────────────────────────────────────────────────────────────────
  // Standalone: None
  // ─────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────
  // Group 1: Default (기본 음원) 🎵
  // ─────────────────────────────────────────────────────────────────────
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
        description: '생일을 축하하는 경쾌한 멜로디',
        music_type: 'default',
        music_key: 'birthday',
      },
      { 
        id: 'christmas', 
        label: () => t('effects.music.christmas', '크리스마스'),
        emoji: '🎄',
        description: '따뜻한 크리스마스 분위기',
        music_type: 'default',
        music_key: 'christmas',
      },
      { 
        id: 'romantic', 
        label: () => t('effects.music.romantic', '로맨틱'),
        emoji: '💕',
        description: '사랑스러운 로맨틱 멜로디',
        music_type: 'default',
        music_key: 'romantic',
      },
      { 
        id: 'cheerful', 
        label: () => t('effects.music.cheerful', '경쾌한'),
        emoji: '😊',
        description: '기분 좋은 경쾌한 리듬',
        music_type: 'default',
        music_key: 'cheerful',
      },
      { 
        id: 'calm', 
        label: () => t('effects.music.calm', '차분한'),
        emoji: '🙏',
        description: '평온하고 차분한 선율',
        music_type: 'default',
        music_key: 'calm',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 2: User Generated (사용자 생성) 🤖
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'user_generated',
    type: 'group',
    title: () => t('effects.music_group.user_generated', '사용자 생성'),
    emoji: '🤖',
    description: () => t('effects.music_group.user_generated_desc', '내가 만든 AI 음원'),
    defaultOpen: false,
    items: [], // Dynamically loaded from API
    isDynamic: true,
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 3: Favorites (즐겨찾기) ⭐
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'favorites',
    type: 'group',
    title: () => t('effects.music_group.favorites', '즐겨찾기'),
    emoji: '⭐',
    description: () => t('effects.music_group.favorites_desc', '자주 사용하는 음원'),
    defaultOpen: false,
    items: [], // Dynamically loaded from API (can overlap with other groups)
    isDynamic: true,
    allowDuplicates: true, // Same music can appear in multiple groups
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get all effect IDs from a group array (flattened)
 * Useful for validation and mapping
 */
export const getAllEffectIds = (groups) => {
  return groups.reduce((acc, group) => {
    const ids = group.items.map(item => item.id);
    return [...acc, ...ids];
  }, []);
};

/**
 * Find effect by ID across all groups
 */
export const findEffectById = (groups, effectId) => {
  for (const group of groups) {
    const effect = group.items.find(item => item.id === effectId);
    if (effect) {
      return { effect, group };
    }
  }
  return null;
};

/**
 * Filter groups that have items (hide empty groups)
 */
export const filterNonEmptyGroups = (groups) => {
  return groups.filter(group => group.items && group.items.length > 0);
};

/**
 * Get recommended effects (marked with recommended: true)
 */
export const getRecommendedEffects = (groups) => {
  const recommended = [];
  groups.forEach(group => {
    group.items.forEach(item => {
      if (item.recommended) {
        recommended.push({ ...item, groupId: group.id });
      }
    });
  });
  return recommended;
};

/**
 * Get new effects (marked with isNew: true)
 */
export const getNewEffects = (groups) => {
  const newEffects = [];
  groups.forEach(group => {
    group.items.forEach(item => {
      if (item.isNew) {
        newEffects.push({ ...item, groupId: group.id });
      }
    });
  });
  return newEffects;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 STATISTICS (for debugging and analytics)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const EFFECT_STATS = {
  textAnimations: {
    totalGroups: TEXT_ANIMATION_GROUPS.length,
    totalEffects: getAllEffectIds(TEXT_ANIMATION_GROUPS).length,
    recommended: getRecommendedEffects(TEXT_ANIMATION_GROUPS).length,
    new: getNewEffects(TEXT_ANIMATION_GROUPS).length,
  },
  particleEffects: {
    totalGroups: PARTICLE_EFFECT_GROUPS.length,
    totalEffects: getAllEffectIds(PARTICLE_EFFECT_GROUPS).length,
    recommended: getRecommendedEffects(PARTICLE_EFFECT_GROUPS).length,
    new: getNewEffects(PARTICLE_EFFECT_GROUPS).length,
  },
  music: {
    totalGroups: MUSIC_GROUPS.length,
    staticEffects: getAllEffectIds(MUSIC_GROUPS).length,
    dynamicGroups: MUSIC_GROUPS.filter(g => g.isDynamic).length,
  },
};

// Log stats in development
if (__DEV__) {
  console.log('🎨 [Effect Groups] Statistics:', EFFECT_STATS);
}

