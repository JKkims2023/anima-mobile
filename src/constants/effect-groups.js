/**
 * 🎨 Effect Groups Configuration (2-Layer System)
 * 
 * Complete grouped structure for all effect selection panels:
 * - Text Animations (4 groups: Gentle, Dynamic, Impactful, Playful)
 * - Background Effects (3 groups: Light & Glow, Atmosphere) ⭐ NEW: Layer 1
 * - Active Effects (6 groups: Love, Celebration, Nature, Comfort, Custom Words) ⭐ Layer 2
 * - Background Music (3 groups: Default, User Generated, Favorites)
 * 
 * 2-Layer System Architecture:
 * Layer 1 (Background): Ambient, soft effects (z-index: 10)
 *   → Aurora, Neon Light, Gradient, Fog, Shimmer
 * Layer 2 (Active): Dynamic, engaging effects (z-index: 50)
 *   → Hearts, Fireworks, Snow, Floating Words, etc.
 * 
 * Design Principles:
 * - Emotion-based categorization
 * - Multiple effects can be combined (Layer 1 + Layer 2 + Music)
 * - i18n support for all labels
 * - Consistent with Next.js web version
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-10 (2-Layer System)
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
// 🌌 BACKGROUND EFFECT GROUPS (3 groups, NEW!)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Background Effect Groups (Layer 1)
 * 
 * Soft, ambient effects that fill the background:
 * 1. None: No background effect (standalone)
 * 2. Light & Glow (✨): Aurora, neon light, gradient flow
 * 3. Atmosphere (🌫️): Fog, mist, shimmer
 * 
 * Design Principles:
 * - Low z-index (behind active effects)
 * - Gentle, slow animations
 * - Sets the emotional mood/atmosphere
 * - Does not distract from message content
 */
export const BACKGROUND_EFFECT_GROUPS = [
  // ─────────────────────────────────────────────────────────────────────
  // Standalone: None
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'none',
    type: 'standalone',
    items: [
      { 
        id: 'none', 
        label: () => t('effects.background.none', '없음'),
        emoji: '⚫',
        description: () => t('effects.background.none_desc', '배경 효과 없음'),
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 1: Sun (태양) ☀️
  // ⭐ NEW UX: 사용자가 빛의 방향을 직관적으로 선택!
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'sun',
    type: 'group',
    title: () => t('effects.background_group.sun', '태양'),
    emoji: '☀️',
    description: () => t('effects.background_group.sun_desc', '따뜻한 햇빛'),
    defaultOpen: true,
    items: [
      { 
        id: 'sun_top_left', 
        label: () => t('effects.background.sun_top_left', '상단 좌측'),
        emoji: '↖️',
        description: '좌측 상단에서 햇빛',
        mood: 'warm',
        isNew: true,
        recommended: true, // ⭐ Most natural sun position
      },
      { 
        id: 'sun_top_right', 
        label: () => t('effects.background.sun_top_right', '상단 우측'),
        emoji: '↗️',
        description: '우측 상단에서 햇빛',
        mood: 'warm',
        isNew: true,
      },
      { 
        id: 'sun_bottom_left', 
        label: () => t('effects.background.sun_bottom_left', '하단 좌측'),
        emoji: '↙️',
        description: '좌측 하단에서 햇빛',
        mood: 'warm',
        isNew: true,
      },
      { 
        id: 'sun_bottom_right', 
        label: () => t('effects.background.sun_bottom_right', '하단 우측'),
        emoji: '↘️',
        description: '우측 하단에서 햇빛',
        mood: 'warm',
        isNew: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 2: Aurora (오로라) 🌌
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'aurora',
    type: 'group',
    title: () => t('effects.background_group.aurora', '오로라'),
    emoji: '🌌',
    description: () => t('effects.background_group.aurora_desc', '신비로운 오로라 빛'),
    defaultOpen: false,
    items: [
      { 
        id: 'aurora_top_left', 
        label: () => t('effects.background.aurora_top_left', '상단 좌측'),
        emoji: '↖️',
        description: '좌측 상단에서 오로라',
        mood: 'mystical',
        isNew: true,
      },
      { 
        id: 'aurora_top_right', 
        label: () => t('effects.background.aurora_top_right', '상단 우측'),
        emoji: '↗️',
        description: '우측 상단에서 오로라',
        mood: 'mystical',
        isNew: true,
      },
      { 
        id: 'aurora_bottom_left', 
        label: () => t('effects.background.aurora_bottom_left', '하단 좌측'),
        emoji: '↙️',
        description: '좌측 하단에서 오로라',
        mood: 'mystical',
        isNew: true,
      },
      { 
        id: 'aurora_bottom_right', 
        label: () => t('effects.background.aurora_bottom_right', '하단 우측'),
        emoji: '↘️',
        description: '우측 하단에서 오로라',
        mood: 'mystical',
        isNew: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 3: Neon Light (네온 라이트) 💡
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'neon',
    type: 'group',
    title: () => t('effects.background_group.neon', '네온 라이트'),
    emoji: '💡',
    description: () => t('effects.background_group.neon_desc', '화려한 네온 빛'),
    defaultOpen: false,
    items: [
      { 
        id: 'neon_top_left', 
        label: () => t('effects.background.neon_top_left', '상단 좌측'),
        emoji: '↖️',
        description: '좌측 상단에서 네온 빛',
        mood: 'vibrant',
        isNew: true,
      },
      { 
        id: 'neon_top_right', 
        label: () => t('effects.background.neon_top_right', '상단 우측'),
        emoji: '↗️',
        description: '우측 상단에서 네온 빛',
        mood: 'vibrant',
        isNew: true,
      },
      { 
        id: 'neon_bottom_left', 
        label: () => t('effects.background.neon_bottom_left', '하단 좌측'),
        emoji: '↙️',
        description: '좌측 하단에서 네온 빛',
        mood: 'vibrant',
        isNew: true,
      },
      { 
        id: 'neon_bottom_right', 
        label: () => t('effects.background.neon_bottom_right', '하단 우측'),
        emoji: '↘️',
        description: '우측 하단에서 네온 빛',
        mood: 'vibrant',
        isNew: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 4: Gradient (그라디언트) 🌈
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'gradient',
    type: 'group',
    title: () => t('effects.background_group.gradient', '그라디언트'),
    emoji: '🌈',
    description: () => t('effects.background_group.gradient_desc', '부드러운 색상 조화'),
    defaultOpen: false,
    items: [
      { 
        id: 'gradient_top_left', 
        label: () => t('effects.background.gradient_top_left', '상단 좌측'),
        emoji: '↖️',
        description: '좌측 상단에서 그라디언트',
        mood: 'dreamy',
        isNew: true,
      },
      { 
        id: 'gradient_top_right', 
        label: () => t('effects.background.gradient_top_right', '상단 우측'),
        emoji: '↗️',
        description: '우측 상단에서 그라디언트',
        mood: 'dreamy',
        isNew: true,
      },
      { 
        id: 'gradient_bottom_left', 
        label: () => t('effects.background.gradient_bottom_left', '하단 좌측'),
        emoji: '↙️',
        description: '좌측 하단에서 그라디언트',
        mood: 'dreamy',
        isNew: true,
      },
      { 
        id: 'gradient_bottom_right', 
        label: () => t('effects.background.gradient_bottom_right', '하단 우측'),
        emoji: '↘️',
        description: '우측 하단에서 그라디언트',
        mood: 'dreamy',
        isNew: true,
      },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✨ ACTIVE EFFECT GROUPS (Layer 2 - 기존 PARTICLE_EFFECT_GROUPS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Active Effect Groups (Layer 2)
 * 
 * Dynamic, moving effects that draw attention:
 * 1. None: No active effect (standalone)
 * 2. Love & Romance (💕): Hearts and romantic particles
 * 3. Celebration & Joy (🎉): Confetti, sparkles, fireworks
 * 4. Nature & Season (🌿): Snow, rain, sakura, leaves
 * 5. Comfort & Hope (🕯️): Warm light, stars, fireflies
 * 6. Custom Words (💬): Floating/scrolling user words
 * 
 * Design Principles:
 * - Higher z-index (above background effects)
 * - Active, engaging animations
 * - Eye-catching and memorable
 * - Enhances message emotion
 */
export const ACTIVE_EFFECT_GROUPS = [
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
  // Group 5: Custom Words (나만의 단어) 💬
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'custom_words',
    type: 'group',
    title: () => t('effects.particle_group.custom_words', '나만의 단어'),
    emoji: '💬',
    description: () => t('effects.particle_group.custom_words_desc', '특별한 단어로 감동을'),
    defaultOpen: false,
    items: [
      { 
        id: 'floating_words', 
        label: () => t('effects.particle.floating_words', '떠오르는 단어'),
        emoji: '💬⬆️',
        description: '단어들이 위로 떠오름',
        mood: 'personal',
        isNew: true,
        requiresCustomWords: true, // ⭐ CRITICAL: Requires user input
      },
      { 
        id: 'scrolling_words', 
        label: () => t('effects.particle.scrolling_words', '흐르는 단어'),
        emoji: '💬➡️',
        description: '단어들이 좌에서 우로 흐름',
        mood: 'personal',
        isNew: true,
        requiresCustomWords: true, // ⭐ CRITICAL: Requires user input
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 6: Food & Drink (음식 & 음료) 🍻
  // ⭐ NEW: Lottie animations for social moments
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'food_drink',
    type: 'group',
    title: () => t('effects.particle_group.food_drink', '음식 & 음료'),
    emoji: '🍻',
    description: () => t('effects.particle_group.food_drink_desc', '만남과 소통을 위한'),
    defaultOpen: false,
    items: [
      { 
        id: 'cheers_toast', 
        label: () => t('effects.particle.cheers_toast', '건배'),
        emoji: '🍻',
        description: '건배 후 술병이 떨어지는 축제', // ⭐ Updated: Shows combo effect
        mood: 'social',
        isNew: true,
        recommended: true,
        isLottie: true, // ⭐ Lottie + Particle combo
      },
      // ⭐ Reserved for future food/drink effects:
      // - coffee_steam (커피 김)
      // - pizza_slice (피자)
      // - cake_celebration (케이크)
      // - ramen_steam (라면)
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Group 7: Retro (레트로) 📺 - TEMPORARILY HIDDEN
  // ⭐ Analog TV noise effects for vintage vibes
  // ─────────────────────────────────────────────────────────────────────
  /*
  {
    id: 'retro',
    type: 'group',
    title: () => t('effects.particle_group.retro', '레트로'),
    emoji: '📺',
    description: () => t('effects.particle_group.retro_desc', '빈티지 아날로그 효과'),
    defaultOpen: false,
    items: [
      { 
        id: 'tv_noise_weak', 
        label: () => t('effects.particle.tv_noise_weak', 'TV 노이즈 (약함)'),
        emoji: '📺',
        description: '은은한 아날로그 노이즈',
        mood: 'retro',
        isNew: true,
      },
      { 
        id: 'tv_noise_medium', 
        label: () => t('effects.particle.tv_noise_medium', 'TV 노이즈 (중간)'),
        emoji: '📺',
        description: '중간 강도 노이즈',
        mood: 'retro',
        isNew: true,
        recommended: true, // ⭐ Best balance
      },
      { 
        id: 'tv_noise_strong', 
        label: () => t('effects.particle.tv_noise_strong', 'TV 노이즈 (강함)'),
        emoji: '📺',
        description: '강렬한 빈티지 노이즈',
        mood: 'retro',
        isNew: true,
      },
    ],
  },
  */

  // ─────────────────────────────────────────────────────────────────────
  // Group 8: Others (기타) 🎨
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
  backgroundEffects: {
    totalGroups: BACKGROUND_EFFECT_GROUPS.length,
    totalEffects: getAllEffectIds(BACKGROUND_EFFECT_GROUPS).length,
    recommended: getRecommendedEffects(BACKGROUND_EFFECT_GROUPS).length,
    new: getNewEffects(BACKGROUND_EFFECT_GROUPS).length,
  },
  activeEffects: {
    totalGroups: ACTIVE_EFFECT_GROUPS.length,
    totalEffects: getAllEffectIds(ACTIVE_EFFECT_GROUPS).length,
    recommended: getRecommendedEffects(ACTIVE_EFFECT_GROUPS).length,
    new: getNewEffects(ACTIVE_EFFECT_GROUPS).length,
  },
  music: {
    totalGroups: MUSIC_GROUPS.length,
    staticEffects: getAllEffectIds(MUSIC_GROUPS).length,
    dynamicGroups: MUSIC_GROUPS.filter(g => g.isDynamic).length,
  },
};

// Log stats in development
if (__DEV__) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 [Effect Groups] 2-Layer System Statistics:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Text Animations:', EFFECT_STATS.textAnimations);
  console.log('🌌 Background Effects (Layer 1):', EFFECT_STATS.backgroundEffects);
  console.log('✨ Active Effects (Layer 2):', EFFECT_STATS.activeEffects);
  console.log('🎵 Music:', EFFECT_STATS.music);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 BACKWARD COMPATIBILITY (for existing code)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @deprecated Use ACTIVE_EFFECT_GROUPS instead
 * Maintained for backward compatibility with existing code
 */
export const PARTICLE_EFFECT_GROUPS = ACTIVE_EFFECT_GROUPS;

