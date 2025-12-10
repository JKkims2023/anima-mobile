/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💝 Emotion Presets - ANIMA's Ultimate Kindness
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Provide optimal effect combinations for first-time users
 * - Remove confusion from complex effect selection
 * - Deliver ANIMA's philosophy: Emotional connection through thoughtful defaults
 * 
 * Presets:
 * 1. Congrats (축하) 🎉: Joy and celebration
 * 2. Thanks (감사) 🙏: Gratitude and appreciation
 * 3. Love (사랑) 💕: Love and affection
 * 4. Comfort (위로) 😢: Comfort and empathy
 * 
 * Each preset includes:
 * - Text animation
 * - Background effect
 * - Active effect (particle)
 * - Background music
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-10 (Emotion Presets)
 */

export const EMOTION_PRESETS = [
  {
    id: 'congrats',
    emoji: '🎉',
    labelKey: 'emotion_presets.congrats.label',
    descriptionKey: 'emotion_presets.congrats.description',
    color: '#FFD700', // Gold
    effects: {
      textAnimation: 'fade_in',
      backgroundEffect: 'gradient_top_left',
      activeEffect: 'confetti',
      customWords: null,
      bgMusic: 'none', // User can select later
    },
  },
  {
    id: 'thanks',
    emoji: '🙏',
    labelKey: 'emotion_presets.thanks.label',
    descriptionKey: 'emotion_presets.thanks.description',
    color: '#87CEEB', // Sky Blue
    effects: {
      textAnimation: 'breath',
      backgroundEffect: 'aurora_top_left',
      activeEffect: 'sparkles',
      customWords: null,
      bgMusic: 'none',
    },
  },
  {
    id: 'love',
    emoji: '💕',
    labelKey: 'emotion_presets.love.label',
    descriptionKey: 'emotion_presets.love.description',
    color: '#FF69B4', // Hot Pink
    effects: {
      textAnimation: 'breath',
      backgroundEffect: 'gradient_top_right',
      activeEffect: 'hearts',
      customWords: null,
      bgMusic: 'none',
    },
  },
  {
    id: 'comfort',
    emoji: '😢',
    labelKey: 'emotion_presets.comfort.label',
    descriptionKey: 'emotion_presets.comfort.description',
    color: '#9370DB', // Medium Purple
    effects: {
      textAnimation: 'fade_in',
      backgroundEffect: 'sun_bottom_left',
      activeEffect: 'snow',
      customWords: null,
      bgMusic: 'none',
    },
  },
];

/**
 * Get preset by ID
 */
export const getPresetById = (id) => {
  return EMOTION_PRESETS.find(preset => preset.id === id);
};

/**
 * Get all preset IDs
 */
export const getAllPresetIds = () => {
  return EMOTION_PRESETS.map(preset => preset.id);
};

export default EMOTION_PRESETS;

