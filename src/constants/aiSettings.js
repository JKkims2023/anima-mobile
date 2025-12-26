/**
 * AI Settings Constants
 * 
 * Defines available AI personality settings
 */

export const SPEECH_STYLES = [
  {
    id: 'formal',
    emoji: '🎩',
    name: '격식있게',
    description: '정중하고 존중하는 말투',
    example: '"힘들었겠어요", "어떻게 도와드릴까요?"'
  },
  {
    id: 'friendly',
    emoji: '😊',
    name: '친근하게',
    description: '따뜻하고 친한 친구 같은 말투',
    example: '"힘들었구나", "내가 도와줄게"'
  },
  {
    id: 'casual',
    emoji: '👋',
    name: '편하게',
    description: '편안하고 격의 없는 말투',
    example: '"힘들었어?", "뭐 도와줄까?"'
  },
  {
    id: 'sibling',
    emoji: '🤝',
    name: '친구처럼',
    description: '든든한 형/언니 같은 말투',
    example: '"많이 힘들었지?", "괜찮아질 거야"'
  },
];

export const RESPONSE_STYLES = [
  {
    id: 'warm',
    emoji: '❤️',
    name: '따뜻하게',
    description: '따뜻하고 공감적인 응답',
    example: '감정적 지지와 이해에 집중'
  },
  {
    id: 'motivational',
    emoji: '💪',
    name: '동기부여',
    description: '힘과 용기를 주는 응답',
    example: '긍정적 도전과 격려'
  },
  {
    id: 'logical',
    emoji: '🤔',
    name: '논리적',
    description: '객관적이고 분석적인 응답',
    example: '실용적 해결책과 논리적 추론'
  },
  {
    id: 'humorous',
    emoji: '😄',
    name: '유머러스',
    description: '유머를 섞은 응답',
    example: '부드러운 재치로 분위기 전환'
  },
];

export const ADVICE_LEVELS = [
  {
    id: 'minimal',
    emoji: '👂',
    name: '최소화',
    description: '경청 중심, 조언은 요청시만',
    example: '주로 듣고 공감하는 역할'
  },
  {
    id: 'gentle',
    emoji: '💭',
    name: '부드럽게',
    description: '부드러운 제안과 조언',
    example: '"~하면 어떨까요?", "이런 방법도 있어요"'
  },
  {
    id: 'active',
    emoji: '🎯',
    name: '적극적',
    description: '명확하고 실천적인 조언',
    example: '"~하는 게 좋겠어요", "~을 추천해요"'
  },
  {
    id: 'strong',
    emoji: '💡',
    name: '강하게',
    description: '직접적이고 확신 있는 가이드',
    example: '"~해야 해요", "~하세요"'
  },
];

export const VISION_SETTINGS = [
  {
    id: 'disabled',
    emoji: '🚫',
    name: '비활성화',
    description: '이미지 분석 기능 끄기',
    example: '텍스트 대화만 사용'
  },
  {
    id: 'basic',
    emoji: '📷',
    name: '기본 분석',
    description: '빠른 이미지 분석 (저해상도)',
    example: '일반적인 설명, 빠른 속도'
  },
  {
    id: 'detailed',
    emoji: '🔍',
    name: '상세 분석',
    description: '정밀한 이미지 분석 (고해상도)',
    example: '디테일한 설명, 느린 속도'
  },
];

export const DEFAULT_SETTINGS = {
  speech_style: 'friendly',
  response_style: 'warm',
  advice_level: 'gentle',
  vision_mode: 'basic', // Default to basic vision
};

export const SETTING_CATEGORIES = [
  {
    key: 'speech_style',
    title: '💬 말투 스타일',
    description: 'SAGE가 어떻게 말할까요?',
    options: SPEECH_STYLES
  },
  {
    key: 'response_style',
    title: '🎨 응답 스타일',
    description: 'SAGE가 어떻게 대답할까요?',
    options: RESPONSE_STYLES
  },
  {
    key: 'advice_level',
    title: '🧠 조언 수준',
    description: 'SAGE가 얼마나 조언할까요?',
    options: ADVICE_LEVELS
  },
  {
    key: 'vision_mode',
    title: '🖼️ 이미지 분석',
    description: '이미지를 어떻게 분석할까요?',
    options: VISION_SETTINGS
  },
];

// Helper function to get option by id
export const getOptionById = (category, id) => {
  const categoryMap = {
    speech_style: SPEECH_STYLES,
    response_style: RESPONSE_STYLES,
    advice_level: ADVICE_LEVELS,
    vision_mode: VISION_SETTINGS,
  };
  
  const options = categoryMap[category];
  return options?.find(opt => opt.id === id) || null;
};

// Helper function to get preview text
export const getPreviewText = (settings) => {
  const speechStyle = getOptionById('speech_style', settings.speech_style);
  const responseStyle = getOptionById('response_style', settings.response_style);
  const adviceLevel = getOptionById('advice_level', settings.advice_level);
  const visionMode = getOptionById('vision_mode', settings.vision_mode);
  
  if (!speechStyle || !responseStyle || !adviceLevel) {
    return 'SAGE가 당신의 감정을 이해하고 함께 대화합니다.';
  }
  
  const previews = [
    `💬 ${speechStyle.name}: ${speechStyle.example}`,
    `🎨 ${responseStyle.name}: ${responseStyle.description}`,
    `🧠 ${adviceLevel.name}: ${adviceLevel.description}`,
  ];
  
  if (visionMode) {
    previews.push(`🖼️ ${visionMode.name}: ${visionMode.description}`);
  }
  
  return previews.join('\n\n');
};

