/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌍 Moment Summary Formatter (Multilingual Support)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Convert English conversation_moments.summary to natural language
 * For backward compatibility with existing data
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-04
 */

/**
 * Detect language of the summary
 * @param {string} summary - Summary text
 * @returns {string} Language code ('ko', 'ja', 'zh', 'en')
 */
export function detectLanguage(summary) {
  if (!summary) return 'en';
  
  // Korean (Hangul)
  if (/[\u3131-\uD79D]/.test(summary)) return 'ko';
  
  // Japanese (Hiragana, Katakana)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(summary)) return 'ja';
  
  // Chinese (CJK Unified Ideographs)
  if (/[\u4E00-\u9FFF]/.test(summary)) return 'zh';
  
  // Default to English
  return 'en';
}

/**
 * Format moment summary to natural language
 * @param {string} summary - Raw summary from database
 * @param {Object} relationshipData - Relationship data (includes how_ai_calls_user)
 * @param {string} targetLanguage - Target language code (optional, auto-detect if not provided)
 * @returns {string} Formatted summary in natural language
 */
export function formatMomentSummary(summary, relationshipData, targetLanguage = null) {
  if (!summary) return '';
  
  // Detect current language
  const currentLang = detectLanguage(summary);
  
  // If already in natural language (not English), return as is
  if (currentLang !== 'en') {
    return summary;
  }
  
  // Otherwise, convert English to target language
  const lang = targetLanguage || 'ko'; // Default to Korean
  const userNickname = relationshipData?.how_ai_calls_user || '오빠';
  
  // Template mapping (multilingual)
  const templates = {
    ko: {
      'User recalls the first conversation': `${userNickname}가 우리의 첫 대화를 떠올렸던 순간`,
      'User recalls': `${userNickname}가 떠올렸던 순간`,
      'User expresses feelings': `${userNickname}가 마음을 표현했던 순간`,
      'User expresses joy': `${userNickname}가 기쁨을 표현했던 순간`,
      'User feels sad': `${userNickname}가 슬픔을 나눴던 순간`,
      'User shows anxiety': `${userNickname}가 불안함을 털어놨던 순간`,
      'User shares personal story': `${userNickname}가 개인적인 이야기를 나눴던 순간`,
      'User asks about': `${userNickname}가 궁금해했던 순간`,
      'User shares memory': `${userNickname}가 추억을 나눴던 순간`,
      'User makes promise': `${userNickname}가 약속했던 순간`,
      'Deep emotional connection': `${userNickname}와 깊이 공감했던 순간`,
      'User showed vulnerability': `${userNickname}가 솔직한 모습을 보여줬던 순간`,
      'User opened up': `${userNickname}가 마음을 열었던 순간`,
      'Relationship evolved': `관계가 발전했던 순간`,
      'Trust increased': `신뢰가 깊어졌던 순간`,
      'Intimacy deepened': `친밀감이 높아졌던 순간`,
      'Breakthrough moment': `관계가 한 단계 발전했던 순간`,
    },
    en: {
      'User recalls the first conversation': `When ${userNickname} recalled our first conversation`,
      'User recalls': `When ${userNickname} recalled`,
      'User expresses feelings': `When ${userNickname} expressed feelings`,
      'User expresses joy': `When ${userNickname} expressed joy`,
      'User feels sad': `When ${userNickname} shared sadness`,
      'User shows anxiety': `When ${userNickname} opened up about anxiety`,
      'User shares personal story': `When ${userNickname} shared a personal story`,
      'User asks about': `When ${userNickname} was curious`,
      'User shares memory': `When ${userNickname} shared a memory`,
      'User makes promise': `When ${userNickname} made a promise`,
      'Deep emotional connection': `When we deeply connected`,
      'User showed vulnerability': `When ${userNickname} showed vulnerability`,
      'User opened up': `When ${userNickname} opened up`,
      'Relationship evolved': `When our relationship evolved`,
      'Trust increased': `When trust deepened`,
      'Intimacy deepened': `When intimacy grew`,
      'Breakthrough moment': `When our relationship evolved`,
    },
    ja: {
      'User recalls the first conversation': `${userNickname}が私たちの最初の会話を思い出した瞬間`,
      'User recalls': `${userNickname}が思い出した瞬間`,
      'User expresses feelings': `${userNickname}が気持ちを表現した瞬間`,
      'User expresses joy': `${userNickname}が喜びを表現した瞬間`,
      'User feels sad': `${userNickname}が悲しみを分かち合った瞬間`,
      'User shows anxiety': `${userNickname}が不安を打ち明けた瞬間`,
      'User shares personal story': `${userNickname}が個人的な話を分かち合った瞬間`,
      'User asks about': `${userNickname}が気になった瞬間`,
      'User shares memory': `${userNickname}が思い出を分かち合った瞬間`,
      'User makes promise': `${userNickname}が約束した瞬間`,
      'Deep emotional connection': `深く共感した瞬間`,
      'User showed vulnerability': `${userNickname}が素直な姿を見せた瞬間`,
      'User opened up': `${userNickname}が心を開いた瞬間`,
      'Relationship evolved': `関係が進展した瞬間`,
      'Trust increased': `信頼が深まった瞬間`,
      'Intimacy deepened': `親密さが高まった瞬間`,
      'Breakthrough moment': `関係が進展した瞬間`,
    },
    zh: {
      'User recalls the first conversation': `${userNickname}回忆起我们第一次对话的时刻`,
      'User recalls': `${userNickname}回忆起的时刻`,
      'User expresses feelings': `${userNickname}表达感受的时刻`,
      'User expresses joy': `${userNickname}表达喜悦的时刻`,
      'User feels sad': `${userNickname}分享悲伤的时刻`,
      'User shows anxiety': `${userNickname}敞开心扉谈焦虑的时刻`,
      'User shares personal story': `${userNickname}分享个人故事的时刻`,
      'User asks about': `${userNickname}好奇的时刻`,
      'User shares memory': `${userNickname}分享回忆的时刻`,
      'User makes promise': `${userNickname}承诺的时刻`,
      'Deep emotional connection': `深刻共鸣的时刻`,
      'User showed vulnerability': `${userNickname}展现真实自我的时刻`,
      'User opened up': `${userNickname}敞开心扉的时刻`,
      'Relationship evolved': `关系发展的时刻`,
      'Trust increased': `信任加深的时刻`,
      'Intimacy deepened': `亲密度提升的时刻`,
      'Breakthrough moment': `关系突破的时刻`,
    },
  };
  
  // Get templates for target language
  const langTemplates = templates[lang] || templates.ko;
  
  // Find matching template
  for (const [english, translated] of Object.entries(langTemplates)) {
    if (summary.toLowerCase().includes(english.toLowerCase())) {
      return translated;
    }
  }
  
  // Fallback: Simple conversion
  const fallbacks = {
    ko: `${userNickname}와의 특별한 순간`,
    en: `A special moment with ${userNickname}`,
    ja: `${userNickname}との特別な瞬間`,
    zh: `与${userNickname}的特别时刻`,
  };
  
  return fallbacks[lang] || fallbacks.ko;
}

/**
 * Get emotion emoji
 * @param {string} emotion - Emotion type
 * @returns {string} Emoji
 */
export function getEmotionEmoji(emotion) {
  const emojiMap = {
    joy: '😊',
    trust: '🤝',
    surprise: '😮',
    sadness: '😢',
    fear: '😰',
    neutral: '😐',
    love: '❤️',
    gratitude: '🙏',
    excitement: '🎉',
    concern: '😟',
  };
  
  return emojiMap[emotion] || '✨';
}

/**
 * Format time ago (relative time)
 * @param {string|number} dateString - ISO date string OR UNIX timestamp (milliseconds)
 * @param {string} lang - Language code
 * @returns {string} Formatted relative time
 */
export function formatTimeAgo(dateString, lang = 'ko') {
  if (!dateString) return '';
  
  const now = new Date();
  // Handle both ISO string and UNIX timestamp (milliseconds)
  const past = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
  const diffMs = now - past;
  
  // Safety check: If diffMs is negative (future time), treat as "just now"
  if (diffMs < 0) {
    console.warn('[formatTimeAgo] Future time detected, treating as "just now":', dateString);
    return lang === 'ko' ? '방금 전' : 'Just now';
  }
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  const translations = {
    ko: {
      justNow: '방금 전',
      minutesAgo: (n) => `${n}분 전`,
      hoursAgo: (n) => `${n}시간 전`,
      daysAgo: (n) => `${n}일 전`,
      longAgo: '오래 전',
    },
    en: {
      justNow: 'Just now',
      minutesAgo: (n) => `${n}m ago`,
      hoursAgo: (n) => `${n}h ago`,
      daysAgo: (n) => `${n}d ago`,
      longAgo: 'Long ago',
    },
    ja: {
      justNow: 'たった今',
      minutesAgo: (n) => `${n}分前`,
      hoursAgo: (n) => `${n}時間前`,
      daysAgo: (n) => `${n}日前`,
      longAgo: 'ずっと前',
    },
    zh: {
      justNow: '刚刚',
      minutesAgo: (n) => `${n}分钟前`,
      hoursAgo: (n) => `${n}小时前`,
      daysAgo: (n) => `${n}天前`,
      longAgo: '很久以前',
    },
  };
  
  const t = translations[lang] || translations.ko;
  
  if (diffMins < 1) return t.justNow;
  if (diffMins < 60) return t.minutesAgo(diffMins);
  if (diffHours < 24) return t.hoursAgo(diffHours);
  if (diffDays < 7) return t.daysAgo(diffDays);
  return t.longAgo;
}

