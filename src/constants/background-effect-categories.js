/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌌 Background Effect Categories (2-Step Selection System)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - 2-layer selection for background directional effects
 * - Step 1: Choose effect type (Sun, Aurora, Neon, Gradient)
 * - Step 2: Choose direction (Top Left, Top Right, Bottom Left, Bottom Right)
 * 
 * Architecture:
 * - Parent: EffectCategorySheet (4 categories + None)
 * - Child: EffectDetailModal (4 directions per category)
 * 
 * Design Philosophy:
 * - Consistent with Active Effect selection UX
 * - Clear, intuitive direction selection
 * - Beautiful ANIMA emotional colors
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16 (Background Effect Revolution)
 */

import { t } from 'i18next';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌌 BACKGROUND EFFECT CATEGORIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const BACKGROUND_EFFECT_CATEGORIES = [
  // ─────────────────────────────────────────────────────────────────────
  // Category 1: Sun (태양) ☀️
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'sun',
    name: '☀️ 태양',
    emoji: '☀️',
    description: '따뜻한 햇빛',
    colorScheme: {
      gradient: ['#FFD700', '#FFA500'],
      border: '#FFD700',
    },
    effects: [
      {
        id: 'sun_top_left',
        label: '↖️ 상단 좌측',
        emoji: '↖️',
        description: '좌측 상단에서 햇빛',
        direction: 'top_left',
      },
      {
        id: 'sun_top_right',
        label: '↗️ 상단 우측',
        emoji: '↗️',
        description: '우측 상단에서 햇빛',
        direction: 'top_right',
      },
      {
        id: 'sun_bottom_left',
        label: '↙️ 하단 좌측',
        emoji: '↙️',
        description: '좌측 하단에서 햇빛',
        direction: 'bottom_left',
      },
      {
        id: 'sun_bottom_right',
        label: '↘️ 하단 우측',
        emoji: '↘️',
        description: '우측 하단에서 햇빛',
        direction: 'bottom_right',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Category 2: Aurora (오로라) 🌌
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'aurora',
    name: '🌌 오로라',
    emoji: '🌌',
    description: '신비로운 빛',
    colorScheme: {
      gradient: ['#9370DB', '#8A2BE2'],
      border: '#9370DB',
    },
    effects: [
      {
        id: 'aurora_top_left',
        label: '↖️ 상단 좌측',
        emoji: '↖️',
        description: '좌측 상단에서 오로라',
        direction: 'top_left',
      },
      {
        id: 'aurora_top_right',
        label: '↗️ 상단 우측',
        emoji: '↗️',
        description: '우측 상단에서 오로라',
        direction: 'top_right',
      },
      {
        id: 'aurora_bottom_left',
        label: '↙️ 하단 좌측',
        emoji: '↙️',
        description: '좌측 하단에서 오로라',
        direction: 'bottom_left',
      },
      {
        id: 'aurora_bottom_right',
        label: '↘️ 하단 우측',
        emoji: '↘️',
        description: '우측 하단에서 오로라',
        direction: 'bottom_right',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Category 3: Neon (네온) 💡
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'neon',
    name: '💡 네온',
    emoji: '💡',
    description: '화려한 빛',
    colorScheme: {
      gradient: ['#FF1493', '#FF00FF'],
      border: '#FF1493',
    },
    effects: [
      {
        id: 'neon_top_left',
        label: '↖️ 상단 좌측',
        emoji: '↖️',
        description: '좌측 상단에서 네온 빛',
        direction: 'top_left',
      },
      {
        id: 'neon_top_right',
        label: '↗️ 상단 우측',
        emoji: '↗️',
        description: '우측 상단에서 네온 빛',
        direction: 'top_right',
      },
      {
        id: 'neon_bottom_left',
        label: '↙️ 하단 좌측',
        emoji: '↙️',
        description: '좌측 하단에서 네온 빛',
        direction: 'bottom_left',
      },
      {
        id: 'neon_bottom_right',
        label: '↘️ 하단 우측',
        emoji: '↘️',
        description: '우측 하단에서 네온 빛',
        direction: 'bottom_right',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Category 4: Gradient (그라디언트) 🌈
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'gradient',
    name: '🌈 그라디언트',
    emoji: '🌈',
    description: '부드러운 조화',
    colorScheme: {
      gradient: ['#B0E0E6', '#FFB6C1'],
      border: '#B0E0E6',
    },
    effects: [
      {
        id: 'gradient_top_left',
        label: '↖️ 상단 좌측',
        emoji: '↖️',
        description: '좌측 상단에서 그라디언트',
        direction: 'top_left',
      },
      {
        id: 'gradient_top_right',
        label: '↗️ 상단 우측',
        emoji: '↗️',
        description: '우측 상단에서 그라디언트',
        direction: 'top_right',
      },
      {
        id: 'gradient_bottom_left',
        label: '↙️ 하단 좌측',
        emoji: '↙️',
        description: '좌측 하단에서 그라디언트',
        direction: 'bottom_left',
      },
      {
        id: 'gradient_bottom_right',
        label: '↘️ 하단 우측',
        emoji: '↘️',
        description: '우측 하단에서 그라디언트',
        direction: 'bottom_right',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Category 5: None (없음) ✕
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'none',
    name: '✕ 없음',
    emoji: '✕',
    description: '효과 없음',
    colorScheme: {
      gradient: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
      border: 'rgba(255, 255, 255, 0.2)',
    },
    effects: [
      {
        id: 'none',
        label: '없음',
        emoji: '✕',
        description: '배경 효과 없음',
      },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get effect by ID
 */
export const getEffectById = (effectId) => {
  for (const category of BACKGROUND_EFFECT_CATEGORIES) {
    const effect = category.effects.find((e) => e.id === effectId);
    if (effect) {
      return { effect, category };
    }
  }
  return null;
};

/**
 * Get category by effect ID
 */
export const getCategoryByEffectId = (effectId) => {
  const result = getEffectById(effectId);
  return result ? result.category : null;
};

/**
 * Get category by ID
 */
export const getCategoryById = (categoryId) => {
  return BACKGROUND_EFFECT_CATEGORIES.find((cat) => cat.id === categoryId);
};
