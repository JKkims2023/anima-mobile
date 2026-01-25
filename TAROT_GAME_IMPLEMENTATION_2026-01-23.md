# 🔮 Tarot Game - Implementation Strategy

**작성일**: 2026-01-23  
**버전**: 1.0.0 (Implementation Ready)  
**작성자**: Hero NEXUS & JK  
**프로젝트**: ANIMA - AnimaMobile

---

## 📋 목차

1. [개요](#개요)
2. [게임 컨셉](#게임-컨셉)
3. [게임 플로우](#게임-플로우)
4. [UI/UX 설계](#uiux-설계)
5. [타로 카드 데이터](#타로-카드-데이터)
6. [LLM 통합](#llm-통합)
7. [기술 구현](#기술-구현)
8. [개발 단계](#개발-단계)

---

## 🎯 개요

### **컨셉**
> "당신의 페르소나가 타로 마스터가 되어, 당신의 미래를 점쳐드립니다."

- 선택된 페르소나가 **타로 점술가** 역할
- 사용자가 질문 → 카드 선택 → 페르소나가 해석
- **하루 1회** 제한 (Tier별 차등)
- 신비롭고 몰입감 있는 경험

### **목표**
- ✅ 페르소나의 **새로운 역할** 부여 (게임 → 점술가)
- ✅ **일일 루틴 형성** (매일 아침/저녁 타로점)
- ✅ **감정적 교감 강화** (개인적 고민 + 페르소나의 조언)
- ✅ **재방문율 증가** (하루 1회 제한 → 내일 다시 올게)

### **차별점**
| 일반 타로 앱 | ANIMA 타로 |
|--------------|------------|
| 익명의 AI | 내 페르소나 |
| 정형화된 해석 | 성격 반영 해석 |
| 단발성 | 관계 누적 |
| 단순 텍스트 | 영상 + 애니메이션 |

---

## 🎨 게임 컨셉

### **분위기**
- 🌙 **신비로운 밤의 방** (어두운 보라/남색 배경)
- ✨ **Glassmorphic UI** (반투명 + blur 효과)
- 🎴 **우아한 카드 애니메이션** (flip, glow, float)
- 💜 **페르소나 중심** (배경 영상/이미지, 말풍선)

### **감정 타겟**
1. **호기심** ("오늘은 어떤 카드가 나올까?")
2. **친밀감** ("내 페르소나가 나를 위해 점을 봐줘")
3. **기대감** ("내일은 또 어떤 이야기를 들을까?")
4. **신뢰감** ("페르소나는 나를 알아, 더 정확할 거야")

---

## 🔄 게임 플로우

### **Phase 1: 진입 & 환영** (5초)
```
1. 사용자가 ManagerAIOverlay → Games → Tarot 선택
   ↓
2. TarotGameView 활성화
   - Entrance Animation (페이드 인)
   - 배경: 페르소나 영상/이미지 (어둡게 overlay)
   ↓
3. API: /api/game/check-limit (타로점 가능 여부)
   - can_play: false → "오늘은 이미 점을 봤어요" 모달
   - can_play: true → 진행
   ↓
4. 페르소나 환영 멘트 (말풍선)
   - LLM 생성: "안녕! 오늘은 무엇이 궁금해? 😊"
   - 애니메이션: 말풍선 fade in + bounce
```

### **Phase 2: 질문 입력** (30초)
```
1. 중앙 하단에 채팅 입력창 표시
   - Placeholder: "무엇이 궁금한가요? (예: 오늘의 운세, 연애운, 시험 결과...)"
   ↓
2. 사용자가 질문 입력 후 [전송]
   - 예: "오늘 면접 잘 볼 수 있을까요?"
   ↓
3. 질문 검증
   - 최소 5자 이상
   - 비속어/부적절한 내용 필터링
   ↓
4. 페르소나 응답 (말풍선)
   - LLM 생성: "면접이구나! 좋아, 카드를 뽑아봐! 🎴"
   - 채팅창 숨김
```

### **Phase 3: 카드 선택** (30초)
```
1. 8장의 카드 뒷면이 화면에 나타남
   - 애니메이션: 순차적으로 날아와서 배치 (0.1초 간격)
   - 레이아웃: 2행 4열 (가로 배치)
   - 카드 뒷면: 신비로운 패턴 (보라/금색)
   ↓
2. 페르소나 안내 (말풍선)
   - "마음이 이끄는 대로 3장을 선택해봐! ✨"
   ↓
3. 사용자가 카드 터치 (최대 3장)
   - 선택 시: 카드 살짝 확대 + glow 효과
   - 선택 취소: 다시 터치하면 해제
   - 진행 표시: "3 / 3 선택됨"
   ↓
4. 3장 선택 완료
   - [확인] 버튼 활성화
   - 페르소나: "좋아! 이제 카드를 펼쳐볼게~ 🌙"
```

### **Phase 4: 카드 공개** (10초)
```
1. 선택된 3장의 카드가 중앙으로 이동
   - 나머지 5장은 fade out + 사라짐
   - 3장은 일렬로 재배치 (좌 → 중 → 우)
   ↓
2. 카드 Flip 애니메이션 (순차적)
   - 1번 카드 (0.5초 후): 3D flip, 앞면 공개
   - 2번 카드 (1.0초 후): 3D flip, 앞면 공개
   - 3번 카드 (1.5초 후): 3D flip, 앞면 공개
   - Haptic: 각 flip 시 light feedback
   ↓
3. 카드 정보 표시
   - 카드 이름 (한글 + 영어)
   - 카드 이미지 (실제 타로 이미지)
   - 카드별 키워드 (미니 라벨)
```

### **Phase 5: 해석** (60초)
```
1. 페르소나가 카드 해석 시작
   - 로딩: "카드를 읽고 있어..." (1-2초)
   ↓
2. LLM API 호출
   - /api/game/tarot-reading
   - 입력:
     - user_question: "오늘 면접 잘 볼 수 있을까요?"
     - selected_cards: [{ name, meaning, keywords }, ...]
     - persona_identity: { calling_name, speaking_style, ... }
   ↓
3. 해석 결과 표시 (말풍선)
   - 전체 해석 (200-400자)
   - 카드별 의미 연결
   - 질문에 대한 조언
   - 페르소나 말투 반영
   ↓
4. 애니메이션
   - 텍스트 타이핑 효과 (한 글자씩)
   - 또는 fade in (부드럽게)
   ↓
5. 추가 UI
   - [다시 듣기] 버튼: 해석 재생
   - [저장하기] 버튼: 결과 저장 (선택)
```

### **Phase 6: 종료** (5초)
```
1. 페르소나 마무리 멘트
   - "오늘 면접 화이팅! 너라면 잘할 수 있어! 💪"
   ↓
2. 게임 결과 저장
   - API: /api/game/save-result
   - game_data: {
       question: "...",
       cards: [...],
       interpretation: "...",
       duration: 120
     }
   ↓
3. 사용자 선택
   - [닫기]: TarotGameView 종료
   - [내 기록 보기]: 과거 타로 기록 (선택)
```

---

## 🎨 UI/UX 설계

### **화면 구성**

```
┌────────────────────────────────────────┐
│  [ TarotGameView - Portrait Mode ]    │
├────────────────────────────────────────┤
│                                        │
│   ┌──────────────────────────────┐   │ ← 배경 (페르소나 영상/이미지)
│   │   Persona Background         │   │   + Dark Overlay (opacity 0.7)
│   │   (Video or Image)           │   │
│   │                                │   │
│   │  ┌────────────────────────┐  │   │ ← 페르소나 아바타 (상단 중앙)
│   │  │  [Persona Avatar]      │  │   │   원형, glassmorphic
│   │  │  + 말풍선 (아래)        │  │   │
│   │  │  "카드를 선택해봐!"    │  │   │
│   │  └────────────────────────┘  │   │
│   │                                │   │
│   │    [ Card Selection Area ]   │   │ ← 카드 배치 영역
│   │                                │   │   (8장 또는 3장)
│   │   🎴 🎴 🎴 🎴              │   │
│   │   🎴 🎴 🎴 🎴              │   │
│   │                                │   │
│   │  ┌────────────────────────┐  │   │ ← 입력창 (phase 2)
│   │  │ [Chat Input]           │  │   │   또는 확인 버튼 (phase 3)
│   │  │ "무엇이 궁금한가요?"    │  │   │
│   │  └────────────────────────┘  │   │
│   │                                │   │
│   └──────────────────────────────┘   │
│                                        │
│  [X] (닫기 버튼, 좌상단)              │
└────────────────────────────────────────┘
```

### **색상 팔레트**
```javascript
colors: {
  background: '#1A0E2E',           // 어두운 남보라
  overlay: 'rgba(0,0,0,0.7)',      // 반투명 검정
  card_back: '#4A148C',            // 진한 보라
  card_glow: '#FFD700',            // 금색
  glass_bg: 'rgba(255,255,255,0.1)', // Glassmorphic
  glass_border: 'rgba(255,255,255,0.2)',
  text_primary: '#FFFFFF',         // 흰색
  text_secondary: '#B39DDB',       // 연한 보라
  accent: '#E91E63',               // 핑크 (강조)
}
```

### **카드 디자인**

#### **뒷면 (Back)**
```javascript
<Card style={styles.cardBack}>
  <LinearGradient colors={['#4A148C', '#7B1FA2', '#9C27B0']}>
    <View style={styles.cardPattern}>
      {/* 신비로운 패턴: 별, 달, 태양 */}
      <Icon name="moon-outline" size={40} color="#FFD700" />
      <Icon name="star-outline" size={20} color="#FFF" />
    </View>
  </LinearGradient>
</Card>
```

#### **앞면 (Front)**
```javascript
<Card style={styles.cardFront}>
  <Image source={{ uri: card.image_url }} style={styles.cardImage} />
  <View style={styles.cardInfo}>
    <Text style={styles.cardName}>{card.name_ko}</Text>
    <Text style={styles.cardNameEn}>{card.name_en}</Text>
    <View style={styles.keywords}>
      {card.keywords.map(k => <Chip key={k}>{k}</Chip>)}
    </View>
  </View>
</Card>
```

### **애니메이션**

#### **카드 진입** (Phase 3)
```javascript
// 순차적으로 날아오기
cards.forEach((card, index) => {
  card.translateY.value = withDelay(
    index * 100,
    withSpring(-300, { damping: 12, stiffness: 150 })
  );
  card.opacity.value = withDelay(
    index * 100,
    withTiming(1, { duration: 400 })
  );
});
```

#### **카드 Flip** (Phase 4)
```javascript
// 3D Flip 효과
const flipCard = (cardIndex) => {
  cardRotateY.value = withTiming(180, {
    duration: 600,
    easing: Easing.inOut(Easing.ease)
  });
  
  // 중간 지점에서 이미지 교체
  setTimeout(() => {
    setCardFace('front');
  }, 300);
};
```

#### **해석 타이핑** (Phase 5)
```javascript
// 타이핑 효과
const typingEffect = (text, speed = 30) => {
  let currentText = '';
  for (let i = 0; i < text.length; i++) {
    setTimeout(() => {
      currentText += text[i];
      setDisplayedText(currentText);
    }, i * speed);
  }
};
```

---

## 🎴 타로 카드 데이터

### **데이터 구조**
```javascript
// 총 78장: Major Arcana (22장) + Minor Arcana (56장)
// MVP: Major Arcana 22장만 사용

const tarotCards = [
  {
    id: 0,
    name_en: "The Fool",
    name_ko: "바보",
    image_url: "https://example.com/tarot/00_fool.jpg",
    keywords: ["새로운 시작", "모험", "자유"],
    upright_meaning: "새로운 시작, 순수함, 자유로운 영혼",
    reversed_meaning: "무모함, 경솔함, 위험",
    category: "major"
  },
  {
    id: 1,
    name_en: "The Magician",
    name_ko: "마법사",
    image_url: "https://example.com/tarot/01_magician.jpg",
    keywords: ["의지", "창조", "기술"],
    upright_meaning: "능력, 자신감, 창조력",
    reversed_meaning: "속임수, 능력 부족, 자기 의심",
    category: "major"
  },
  // ... 나머지 20장
];
```

### **카드 이미지 소스**

#### **Option 1: 무료 타로 이미지**
- **Rider-Waite Tarot** (퍼블릭 도메인)
  - URL: https://sacred-texts.com/tarot/pkt/
  - 가장 유명한 타로 덱
  - 무료 사용 가능

- **Open Tarot** (CC BY-SA 4.0)
  - GitHub: https://github.com/munderseth/open-tarot
  - 현대적 디자인

#### **Option 2: 자체 제작**
- AI 이미지 생성 (Midjourney, DALL-E)
- 프롬프트 예시:
  ```
  "tarot card design, The Fool, mystical, purple and gold colors, 
  intricate border, spiritual, elegant, high quality"
  ```

#### **Option 3: 구매**
- Shutterstock, Adobe Stock
- 타로 아티스트 커미션

### **카드 DB 저장**
```sql
-- Option A: JSON 파일 (빠른 MVP)
-- AnimaMobile/assets/data/tarot_cards.json

-- Option B: MySQL 테이블 (확장성)
CREATE TABLE tarot_cards (
  card_id INT PRIMARY KEY,
  name_en VARCHAR(50),
  name_ko VARCHAR(50),
  image_url VARCHAR(255),
  keywords JSON,
  upright_meaning TEXT,
  reversed_meaning TEXT,
  category VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🤖 LLM 통합

### **API Endpoint**
```javascript
// idol-companion/app/api/game/tarot-reading/route.js

import { NextResponse } from 'next/server';
import { query } from '@/shared/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_key, persona_key, user_question, selected_cards } = body;

    // 1. 페르소나 정보 가져오기
    const persona = await query(
      `SELECT persona_name, calling_name, speaking_style, relationship_type
       FROM persona_persona_main WHERE persona_key = ?`,
      [persona_key]
    );

    // 2. LLM 프롬프트 생성
    const prompt = buildTarotPrompt({
      user_question,
      selected_cards,
      persona_identity: persona[0]
    });

    // 3. OpenRouter API 호출
    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5-8b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800
      })
    });

    const result = await llmResponse.json();
    const interpretation = JSON.parse(result.choices[0].message.content);

    return NextResponse.json({
      success: true,
      data: {
        greeting: interpretation.greeting,
        card_interpretations: interpretation.card_interpretations,
        overall_message: interpretation.overall_message,
        advice: interpretation.advice,
        closing: interpretation.closing
      }
    });

  } catch (error) {
    console.error('❌ [Tarot Reading] Error:', error);
    return NextResponse.json({
      success: false,
      error: '타로 해석 중 오류가 발생했습니다.'
    }, { status: 200 });
  }
}
```

### **LLM 프롬프트 구조**
```javascript
function buildTarotPrompt({ user_question, selected_cards, persona_identity }) {
  return `
You are a mystical Tarot reader with the following persona:
- Name: ${persona_identity.persona_name}
- Calling the user: "${persona_identity.calling_name}"
- Speaking style: ${persona_identity.speaking_style === 'casual' ? '반말 (informal)' : '존댓말 (polite)'}
- Relationship: ${persona_identity.relationship_type}

The user asked: "${user_question}"

They selected 3 Tarot cards:
1. ${selected_cards[0].name_ko} (${selected_cards[0].name_en})
   - Keywords: ${selected_cards[0].keywords.join(', ')}
   - Meaning: ${selected_cards[0].upright_meaning}

2. ${selected_cards[1].name_ko} (${selected_cards[1].name_en})
   - Keywords: ${selected_cards[1].keywords.join(', ')}
   - Meaning: ${selected_cards[1].upright_meaning}

3. ${selected_cards[2].name_ko} (${selected_cards[2].name_en})
   - Keywords: ${selected_cards[2].keywords.join(', ')}
   - Meaning: ${selected_cards[2].upright_meaning}

Please provide a Tarot reading in Korean that:
1. Reflects your persona (use the correct speaking style and calling name)
2. Interprets the 3 cards in relation to the user's question
3. Provides meaningful advice and encouragement
4. Is 200-400 characters long
5. Feels personal and caring, not generic

Response format (JSON):
{
  "greeting": "오늘은 어떤 카드가 나왔는지 볼까? 😊",
  "card_interpretations": [
    "첫 번째 카드인 '바보'는 새로운 시작을 의미해.",
    "두 번째 '마법사'는 네가 가진 능력을 보여줘.",
    "마지막 '별'은 희망과 성공을 암시하고 있어."
  ],
  "overall_message": "이 카드들은 네가 면접에서 좋은 결과를 얻을 거라고 말하고 있어! 새로운 시작에 대한 긍정적인 에너지가 느껴져.",
  "advice": "자신감을 가지고 네 능력을 보여줘. 너라면 충분히 잘할 수 있어!",
  "closing": "오늘 면접 화이팅! 나도 응원할게! 💪✨"
}
`;
}
```

### **응답 예시**
```json
{
  "success": true,
  "data": {
    "greeting": "오늘은 어떤 카드가 나왔는지 볼까? 😊",
    "card_interpretations": [
      "첫 번째 카드인 '바보'는 새로운 시작을 의미해. 면접이라는 새로운 도전을 앞두고 있는 너를 보여주는 거야.",
      "두 번째 '마법사'는 네가 가진 능력과 자신감을 상징해. 너는 충분히 준비되어 있어!",
      "마지막 '별'은 희망과 성공을 암시하고 있어. 긍정적인 결과가 기다리고 있다는 신호야."
    ],
    "overall_message": "이 카드들은 네가 면접에서 좋은 결과를 얻을 거라고 말하고 있어! 새로운 시작에 대한 긍정적인 에너지가 강하게 느껴져.",
    "advice": "면접장에 들어갈 때 자신감을 가져. 네가 준비한 만큼 충분히 잘할 수 있어. 긴장하지 말고 네 진짜 모습을 보여줘!",
    "closing": "오늘 면접 대박나! 나도 여기서 응원할게! 💪✨"
  }
}
```

---

## 🛠️ 기술 구현

### **컴포넌트 구조**
```
TarotGameView.js (메인)
├─ TarotBackground.js (배경 영상/이미지)
├─ PersonaAvatar.js (아바타 + 말풍선)
├─ ChatInput.js (질문 입력)
├─ CardDeck.js (카드 배치)
│  └─ TarotCard.js (개별 카드)
│     ├─ CardBack.js
│     └─ CardFront.js
├─ InterpretationPanel.js (해석 표시)
└─ LimitModal.js (일일 제한 안내)
```

### **주요 State**
```javascript
// TarotGameView.js

const [gamePhase, setGamePhase] = useState('greeting'); // greeting, question, selection, reveal, interpretation, end
const [userQuestion, setUserQuestion] = useState('');
const [availableCards, setAvailableCards] = useState([]); // 8장 랜덤
const [selectedCards, setSelectedCards] = useState([]); // 최대 3장
const [revealedCards, setRevealedCards] = useState([]); // flip된 카드
const [interpretation, setInterpretation] = useState(null);
const [personaMessage, setPersonaMessage] = useState('');
const [canPlay, setCanPlay] = useState(true);
const [isLoading, setIsLoading] = useState(false);
```

### **카드 랜덤 선택**
```javascript
// 22장 Major Arcana 중 8장 랜덤
const selectRandomCards = (allCards, count = 8) => {
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

useEffect(() => {
  if (visible) {
    const random8 = selectRandomCards(TAROT_CARDS, 8);
    setAvailableCards(random8);
  }
}, [visible]);
```

### **카드 선택 로직**
```javascript
const handleCardSelect = useCallback((card) => {
  if (selectedCards.length >= 3 && !selectedCards.includes(card)) {
    // 이미 3장 선택됨
    HapticService.notification('warning');
    return;
  }

  if (selectedCards.includes(card)) {
    // 선택 해제
    setSelectedCards(prev => prev.filter(c => c.id !== card.id));
  } else {
    // 선택
    setSelectedCards(prev => [...prev, card]);
    HapticService.light();
  }
}, [selectedCards]);
```

### **카드 Flip 애니메이션**
```javascript
// TarotCard.js

const rotateY = useSharedValue(0);

const flipToFront = () => {
  rotateY.value = withTiming(180, {
    duration: 600,
    easing: Easing.inOut(Easing.ease)
  });
};

const animatedStyle = useAnimatedStyle(() => {
  const rotateYDeg = `${rotateY.value}deg`;
  return {
    transform: [
      { perspective: 1000 },
      { rotateY: rotateYDeg }
    ]
  };
});

// 중간 지점 (90도)에서 앞/뒤 전환
useEffect(() => {
  if (rotateY.value >= 90) {
    setIsFront(true);
  }
}, [rotateY.value]);
```

### **LLM 해석 호출**
```javascript
const fetchTarotInterpretation = async () => {
  setIsLoading(true);
  setPersonaMessage('카드를 읽고 있어... 🔮');

  try {
    const response = await gameApi.getTarotReading({
      user_key: user.user_key,
      persona_key: persona.persona_key,
      user_question: userQuestion,
      selected_cards: selectedCards.map(c => ({
        name_ko: c.name_ko,
        name_en: c.name_en,
        keywords: c.keywords,
        upright_meaning: c.upright_meaning
      }))
    });

    if (response.success) {
      setInterpretation(response.data);
      setGamePhase('interpretation');
      
      // 타이핑 효과로 해석 표시
      displayTypingEffect(response.data.overall_message);
    }
  } catch (error) {
    console.error('❌ [Tarot] Interpretation error:', error);
    setPersonaMessage('앗... 카드 해석에 문제가 생겼어 😅');
  } finally {
    setIsLoading(false);
  }
};
```

### **게임 결과 저장**
```javascript
const saveGameResult = async () => {
  try {
    await gameApi.saveGameResult({
      user_key: user.user_key,
      persona_key: persona.persona_key,
      game_type: 'tarot',
      game_result: 'completed',
      game_data: {
        question: userQuestion,
        selected_cards: selectedCards.map(c => c.name_ko),
        interpretation: interpretation.overall_message,
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ [Tarot] Result saved');
  } catch (error) {
    console.error('❌ [Tarot] Save error:', error);
  }
};

// Phase: end일 때 자동 저장
useEffect(() => {
  if (gamePhase === 'end' && interpretation) {
    saveGameResult();
  }
}, [gamePhase, interpretation]);
```

---

## 📅 개발 단계

### **MVP (Minimum Viable Product) - 2일**

#### **Day 1: 기본 구조 & UI**
- [x] TarotGameView.js 생성
- [ ] 배경 + 페르소나 아바타 배치
- [ ] Phase 1-3 구현 (진입, 질문, 카드 선택)
- [ ] 카드 데이터 JSON 파일 준비 (22장 Major Arcana)
- [ ] 카드 뒷면 디자인
- [ ] 카드 배치 애니메이션

#### **Day 2: LLM 통합 & 완성**
- [ ] /api/game/tarot-reading 엔드포인트 생성
- [ ] Phase 4-6 구현 (카드 공개, 해석, 종료)
- [ ] 카드 Flip 애니메이션 (3D)
- [ ] 해석 타이핑 효과
- [ ] 일일 제한 체크 (check-limit API 연동)
- [ ] 게임 결과 저장 (save-result API 연동)
- [ ] 테스트 & 버그 수정

---

### **Phase 2: 고도화 - 1주**

#### **비주얼 향상**
- [ ] 카드 앞면 이미지 (고품질 타로 이미지)
- [ ] 배경 파티클 효과 (별, 반짝임)
- [ ] 카드 Glow 효과 강화
- [ ] BGM/효과음 추가

#### **기능 확장**
- [ ] 과거 타로 기록 보기 (History)
- [ ] 즐겨찾기 기능 (중요한 타로 저장)
- [ ] 공유 기능 (SNS 이미지 생성)
- [ ] 타로 일기 (매일의 타로 + 실제 결과)

#### **Minor Arcana 추가**
- [ ] 56장 추가 (총 78장)
- [ ] 역방향(Reversed) 해석 지원
- [ ] 더 복잡한 스프레드 (3장 → 5장, 10장)

---

### **Phase 3: 커뮤니티 - 2주**

#### **사용자 참여**
- [ ] 타로 해석 정확도 평가 (별점)
- [ ] "오늘의 타로" 공유 피드
- [ ] 인기 질문 TOP 10
- [ ] 페르소나별 해석 스타일 비교

#### **게임화**
- [ ] 타로 컬렉션 (모든 카드 보기)
- [ ] 도전 과제 (10일 연속 타로, 모든 Major Arcana 뽑기)
- [ ] 특별 이벤트 (만월의 타로, 새해 운세)

---

## 📊 예상 효과

### **사용자 참여**
- **일일 접속률**: +30% (매일 타로 보러 옴)
- **체류 시간**: +2분 (타로 1회당 평균 2분)
- **재방문율**: +50% (내일 다시 타로)

### **페르소나 가치**
- 페르소나와의 **새로운 관계** 형성 (점술가 역할)
- **감정적 교감** 증가 (개인적 고민 공유)
- **신뢰도** 상승 (조언자로서의 페르소나)

### **수익화**
- Tier별 차등 제공 (Basic: 1회, Ultimate: 5회)
- 추가 타로 구매 (100코인 / 1회)
- 특별 타로 덱 판매 (프리미엄 이미지)

---

## 🎉 결론

**타로점 게임은 ANIMA의 철학을 가장 잘 보여주는 기능!** 🔮✨

- ✅ 페르소나를 **존재(Being)**로 강화
- ✅ **일일 루틴** 형성 (습관화)
- ✅ **감정적 깊이** 추가 (고민 상담 + 조언)
- ✅ 기술적 실현 **100% 가능**

**포트리스가 "함께 즐기는 동반자"라면,**  
**타로는 "마음을 이해하는 조언자"다.** 💜

---

**다음 단계**: TarotGameView.js 구현 시작! 🚀

---

**작성자**: Hero NEXUS 💙  
**일자**: 2026-01-23  
**버전**: 1.0.0

> "타로는 미래를 보는 것이 아니라, 마음을 읽는 것이다."  
> — Tarot Philosophy
