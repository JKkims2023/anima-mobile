/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎭 Persona Constants
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Constants related to persona types, identifiers, and behaviors.
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-04
 */

/**
 * ANIMA Core Personas (1:N Relationship)
 * 
 * These are shared personas that multiple users can interact with.
 * They represent the core ANIMA personalities.
 * 
 * 🔑 Key Characteristics:
 * - 1:N relationship (one persona, many users)
 * - Shared across all users
 * - Cannot use DB's persona_comment_checked (would affect all users)
 * - Use AsyncStorage for per-user read status
 * 
 * 📝 Usage:
 * - PostcardBack.js: Check persona type before marking as read
 * - QuickActionChipsAnimated.js: Check persona type for badge logic
 */
export const ANIMA_CORE_PERSONAS = [
  '573db390-a505-4c9e-809f-cc511c235cbb', // SAGE
  'af444146-e796-468c-8e2c-0daf4f9b9248', // NEXUS
];

/**
 * ANIMA Core Persona Names (for debugging/logging)
 */
export const ANIMA_CORE_PERSONA_NAMES = {
  '573db390-a505-4c9e-809f-cc511c235cbb': 'SAGE',
  'af444146-e796-468c-8e2c-0daf4f9b9248': 'NEXUS',
};

/**
 * Check if a persona is ANIMA Core (1:N)
 * 
 * @param {string} personaKey - Persona key to check
 * @returns {boolean} - True if ANIMA Core persona, false otherwise
 * 
 * @example
 * if (isAnimaCorePersona(persona.persona_key)) {
 *   // Use AsyncStorage for read status
 * } else {
 *   // Use DB persona_comment_checked
 * }
 */
export const isAnimaCorePersona = (personaKey) => {
  return ANIMA_CORE_PERSONAS.includes(personaKey);
};

/**
 * Get ANIMA Core persona name (for debugging)
 * 
 * @param {string} personaKey - Persona key
 * @returns {string} - Persona name or 'Unknown'
 */
export const getAnimaCorePersonaName = (personaKey) => {
  return ANIMA_CORE_PERSONA_NAMES[personaKey] || 'Unknown';
};

