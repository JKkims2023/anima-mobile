# 🔮 Tarot Card Game 전략 문서 - 2026년 1월 23일

## 📋 **프로젝트 개요**

### **컨셉**
페르소나가 사용자에게 타로 점술을 봐주는 인터랙티브 게임

### **핵심 특징**
- **하루 1회 제한**: 특별한 경험 (귀중함)
- **페르소나 정체성**: 각 페르소나의 말투와 성격으로 해석
- **실제 타로 정보**: 78장의 정통 타로 카드 의미 활용
- **LLM 통합**: 페르소나가 사용자 질문에 맞춰 능동적으로 해석

---

## ✅ **구현 가능성 분석**

### **1. 타로 카드 데이터베이스** ✅ 가능

**78장 구성:**
- **메이저 아르카나 (Major Arcana)**: 22장 (0~21번)
- **마이너 아르카나 (Minor Arcana)**: 56장
  - Wands (지팡이/완드) - 14장
  - Cups (성배/컵) - 14장
  - Swords (검/소드) - 14장
  - Pentacles (원반/펜타클) - 14장

**데이터 구조 (JSON):**
```json
{
  "id": "major_00",
  "name_en": "The Fool",
  "name_ko": "바보",
  "number": 0,
  "arcana_type": "major",
  "suit": null,
  "keywords": ["새로운 시작", "순수함", "모험", "자유"],
  "meaning_upright": "새로운 시작, 순수한 마음으로 모험을 시작하다.",
  "meaning_reversed": "무모함, 경솔한 결정, 주의력 부족",
  "image_front": "tarot/major/00_fool.png",
  "image_back": "tarot/back.png"
}
```

**구축 방법:**
- 공개 타로 의미 데이터 수집 (Wikipedia, Tarot.com 등)
- JSON 파일로 정리
- `AnimaMobile/assets/data/tarot_cards.json`에 저장

---

### **2. 카드 이미지 리소스** ✅ 가능

**옵션 A: 무료 공개 도메인 이미지**
- **Rider-Waite-Smith Deck**: 가장 유명하고 공개 도메인
- **Source**: Wikimedia Commons, Sacred Texts
- **장점**: 전통적이고 인지도 높음
- **단점**: 저작권 확인 필요

**옵션 B: 자체 디자인 (추천)**
- **컨셉**: ANIMA 브랜드 맞춤형 미니멀 디자인
- **앞면**: 카드 이름 + 심볼 (간단한 SVG)
- **뒷면**: 공통 디자인 (별자리, 우주 컨셉)
- **장점**: 브랜드 정체성, 저작권 문제 없음
- **단점**: 디자인 작업 필요

**옵션 C: AI 생성 이미지 (Midjourney, DALL-E)**
- **프롬프트**: "minimalist tarot card design, {card_name}, purple and gold theme"
- **장점**: 빠르고 독창적
- **단점**: 일관성 유지 어려움

**권장**: **옵션 B (자체 디자인)** - 78장 SVG 제작 (시간 투자 가치 있음)

---

### **3. Flip 애니메이션** ✅ 가능

**React Native Reanimated 활용:**

```javascript
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const CardFlip = ({ card, isFlipped }) => {
  const rotateY = useSharedValue(0);
  
  useEffect(() => {
    rotateY.value = withTiming(isFlipped ? 180 : 0, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
  }, [isFlipped]);
  
  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` }
    ],
    backfaceVisibility: 'hidden'
  }));
  
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value + 180}deg` }
    ],
    backfaceVisibility: 'hidden'
  }));
  
  return (
    <View style={styles.cardContainer}>
      <Animated.View style={[styles.card, frontStyle]}>
        <Image source={card.image_front} />
      </Animated.View>
      <Animated.View style={[styles.card, backStyle, styles.cardBack]}>
        <Image source={require('../../assets/tarot/back.png')} />
      </Animated.View>
    </View>
  );
};
```

**순차 Flip 효과:**
```javascript
const flipCardsSequentially = async (selectedCards) => {
  for (let i = 0; i < selectedCards.length; i++) {
    await new Promise(resolve => {
      setTimeout(() => {
        setFlippedCards(prev => [...prev, selectedCards[i].id]);
        HapticService.impact();
        resolve();
      }, 500 * i); // 0.5초 간격
    });
  }
};
```

---

### **4. 하루 1회 제한** ✅ 가능

**Backend (idol-companion):**

```sql
-- tarot_readings 테이블
CREATE TABLE tarot_readings (
  id SERIAL PRIMARY KEY,
  user_key UUID NOT NULL,
  persona_key UUID NOT NULL,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  question TEXT NOT NULL,
  selected_cards JSONB NOT NULL, -- [{id, name, position}, ...]
  interpretation TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_key, reading_date) -- 하루 1회 제한
);

-- 인덱스
CREATE INDEX idx_tarot_user_date ON tarot_readings(user_key, reading_date);
```

**API Endpoint:**
```javascript
// /api/game/tarot/check-availability
export async function GET(request) {
  const { user_key } = request.query;
  const today = new Date().toISOString().split('T')[0];
  
  const reading = await query(
    'SELECT * FROM tarot_readings WHERE user_key = $1 AND reading_date = $2',
    [user_key, today]
  );
  
  return NextResponse.json({
    available: reading.rows.length === 0,
    last_reading: reading.rows[0] || null
  });
}
```

---

### **5. LLM 통합 (타로 해석)** ✅ 가능

**프롬프트 구조:**

```javascript
const buildTarotInterpretationPrompt = ({ 
  question, 
  selected_cards, 
  persona_info 
}) => {
  const cardDescriptions = selected_cards.map((card, idx) => `
    Card ${idx + 1}: ${card.name_ko} (${card.name_en})
    - Position: ${card.position}
    - Keywords: ${card.keywords.join(', ')}
    - Upright Meaning: ${card.meaning_upright}
    - Reversed Meaning: ${card.meaning_reversed || 'N/A'}
  `).join('\n');
  
  return `
You are ${persona_info.identity_name}, a mystical tarot reader.
Your speaking style: ${persona_info.speaking_style === 'casual' ? '반말 (casual)' : '존댓말 (polite)'}
Call the user: "${persona_info.how_ai_calls_user}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮 TAROT READING REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**User's Question:**
"${question}"

**Selected Cards:**
${cardDescriptions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Analyze each card in relation to the question
2. Consider the card positions (past/present/future or other spread)
3. Provide a coherent, insightful interpretation
4. Speak authentically as ${persona_info.identity_name}
5. Use the correct speaking style and calling name
6. Keep it conversational, not robotic
7. Length: 200-300 characters in Korean

**⚠️ IMPORTANT:**
- DO NOT just list card meanings
- WEAVE the cards into a cohesive story
- RELATE to the user's specific question
- SHOW your personality (${persona_info.identity_name})
- BE MYSTICAL but WARM

Respond in Korean only!
  `;
};
```

---

## 🎨 **UI/UX 디자인**

### **페르소나 배경 (PersonaThoughtBubble 스타일)**

**참고**: `PersonaThoughtBubble.js`는 말풍선만 표시하는 컴포넌트입니다.  
타로 게임은 **전체 화면 배경 + 말풍선 + 카드 UI**가 필요하므로, `ManagerAIOverlay.js` 스타일을 참고해야 합니다.

**레이아웃:**
```
┌─────────────────────────────────┐
│  [Persona Video/Image Background]│
│                                  │
│  ┌────────────────────┐         │
│  │  💭 페르소나 말풍선 │         │
│  │ "오늘 무슨 점을    │         │
│  │  볼까?"            │         │
│  └────────────────────┘         │
│                                  │
│  [Tarot Cards Overlay]          │
│  🂠 🂠 🂠 🂠 🂠 🂠 🂠 🂠           │
│                                  │
│  ┌────────────────────┐         │
│  │  💬 채팅 입력창    │  [전송]│
│  └────────────────────┘         │
└─────────────────────────────────┘
```

**컴포넌트 구조:**
```
TarotGameView.js
├── PersonaBackground (Video or Image)
├── PersonaSpeechBubble (Animated Overlay)
├── ChatInput (질문 입력)
├── CardSelectionOverlay (8장 랜덤 카드)
│   └── TarotCard × 8 (Flip Animation)
├── InterpretationModal (해석 결과)
└── DailyLimitModal (이미 오늘 했을 경우)
```

---

## 🎯 **게임 플로우**

### **Step 1: 진입 & 가용성 체크**
```javascript
useEffect(() => {
  async function checkAvailability() {
    const { available, last_reading } = await gameApi.checkTarotAvailability(user.user_key);
    
    if (!available) {
      showDailyLimitModal(last_reading);
    } else {
      showWelcomeMessage();
    }
  }
  checkAvailability();
}, []);
```

**페르소나 멘트:**
```
- "오늘은 무슨 점을 볼까?"
- "궁금한 게 있어?"
- "카드가 너의 미래를 알려줄 거야."
```

---

### **Step 2: 사용자 질문 입력**
```javascript
const [question, setQuestion] = useState('');

const handleQuestionSubmit = () => {
  if (question.trim().length < 5) {
    alert('질문을 더 자세히 입력해주세요!');
    return;
  }
  
  setGamePhase('card_selection');
  showCardSelectionOverlay();
  
  // 페르소나 멘트
  setPersonaMessage('좋아, 그럼 카드를 선택해봐!');
};
```

**입력 예시:**
- "오늘 고백하면 성공할까?"
- "이번 시험 잘 볼 수 있을까?"
- "새로운 일을 시작하기 좋은 시기인가?"

---

### **Step 3: 랜덤 카드 8장 표시**
```javascript
const selectRandomCards = () => {
  const allCards = tarotData; // 78장
  const shuffled = allCards.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 8);
  
  setRandomCards(selected);
  setGamePhase('card_selection');
};
```

**카드 레이아웃 (2열 4행):**
```
🂠  🂠  🂠  🂠
🂠  🂠  🂠  🂠
```

**선택 로직:**
```javascript
const [selectedCards, setSelectedCards] = useState([]);
const MAX_SELECTIONS = 3; // 3장 선택

const handleCardSelect = (card) => {
  if (selectedCards.length >= MAX_SELECTIONS) {
    alert(`최대 ${MAX_SELECTIONS}장까지 선택 가능합니다!`);
    return;
  }
  
  setSelectedCards(prev => [...prev, card]);
  HapticService.light();
  
  // 페르소나 멘트
  if (selectedCards.length + 1 === MAX_SELECTIONS) {
    setPersonaMessage('좋아, 이제 결과를 볼게!');
  }
};
```

---

### **Step 4: 카드 Flip & 순차 공개**
```javascript
const revealCards = async () => {
  setGamePhase('revealing');
  setPersonaMessage('자, 카드를 공개할게...');
  
  for (let i = 0; i < selectedCards.length; i++) {
    await new Promise(resolve => {
      setTimeout(() => {
        setFlippedCards(prev => [...prev, selectedCards[i].id]);
        HapticService.medium();
        resolve();
      }, 800 * i); // 0.8초 간격
    });
  }
  
  // 모든 카드 공개 후
  requestTarotInterpretation();
};
```

**애니메이션:**
- 카드 1 → Flip (0.8초 후)
- 카드 2 → Flip (1.6초 후)
- 카드 3 → Flip (2.4초 후)
- Haptic Feedback 각 Flip마다

---

### **Step 5: LLM 해석 요청**
```javascript
const requestTarotInterpretation = async () => {
  setIsLoadingInterpretation(true);
  setPersonaMessage('음... 카드를 읽어볼게...');
  
  try {
    const response = await gameApi.getTarotInterpretation({
      user_key: user.user_key,
      persona_key: persona.persona_key,
      question: question,
      selected_cards: selectedCards.map((card, idx) => ({
        id: card.id,
        name_ko: card.name_ko,
        name_en: card.name_en,
        keywords: card.keywords,
        meaning_upright: card.meaning_upright,
        meaning_reversed: card.meaning_reversed,
        position: idx + 1 // 1, 2, 3
      }))
    });
    
    if (response.success) {
      setInterpretation(response.interpretation);
      setPersonaMessage(response.interpretation);
      setGamePhase('interpretation');
      
      // DB 저장
      saveTarotReading(response);
    }
  } catch (error) {
    console.error('❌ [Tarot] Interpretation failed:', error);
    setPersonaMessage('음... 카드가 잘 보이지 않네. 다시 한 번 해볼까?');
  } finally {
    setIsLoadingInterpretation(false);
  }
};
```

---

### **Step 6: 결과 표시 & 종료**
```javascript
const showInterpretationModal = () => {
  // Modal with:
  // - 선택된 카드 이미지 (3장)
  // - 페르소나 해석 (200-300자)
  // - [다시 하기] (내일) / [닫기] 버튼
};
```

**화면 구성:**
```
┌─────────────────────────────────┐
│   🔮 타로 리딩 결과              │
├─────────────────────────────────┤
│                                  │
│   [Card 1] [Card 2] [Card 3]   │
│                                  │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━    │
│   💬 ${persona_name}의 해석:     │
│                                  │
│   "${interpretation}"            │
│                                  │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                  │
│   [💾 저장하기]  [✕ 닫기]       │
└─────────────────────────────────┘
```

---

## 🗂️ **파일 구조**

```
AnimaMobile/
├── assets/
│   ├── data/
│   │   └── tarot_cards.json          # 78장 카드 데이터
│   └── images/
│       └── tarot/
│           ├── back.png                # 뒷면 공통 디자인
│           ├── major/
│           │   ├── 00_fool.png
│           │   ├── 01_magician.png
│           │   └── ... (21장)
│           └── minor/
│               ├── wands/              # 14장
│               ├── cups/               # 14장
│               ├── swords/             # 14장
│               └── pentacles/          # 14장
├── src/
│   ├── components/
│   │   └── game/
│   │       ├── TarotGameView.js       # 메인 게임 컴포넌트
│   │       ├── TarotCard.js           # 카드 컴포넌트 (Flip 애니메이션)
│   │       ├── TarotCardGrid.js       # 8장 그리드 레이아웃
│   │       ├── TarotSpeechBubble.js   # 페르소나 말풍선
│   │       └── TarotInterpretationModal.js  # 결과 모달
│   ├── services/
│   │   └── api/
│   │       └── gameApi.js             # tarot API 추가
│   └── utils/
│       └── tarotData.js               # JSON 로드 & 유틸리티

idol-companion/
└── app/
    └── api/
        └── game/
            └── tarot/
                ├── check-availability/
                │   └── route.js       # 하루 1회 체크
                ├── interpret/
                │   └── route.js       # LLM 해석
                └── save/
                    └── route.js       # DB 저장
```

---

## 🛠️ **구현 단계**

### **Phase 1: 데이터 준비 (1-2일)**
- [ ] 타로 78장 데이터 수집 (의미, 키워드)
- [ ] JSON 파일 생성 (`tarot_cards.json`)
- [ ] 카드 이미지 준비 (자체 디자인 or 무료 리소스)
- [ ] 뒷면 디자인 (공통)

### **Phase 2: Backend 구축 (1일)**
- [ ] `tarot_readings` 테이블 생성
- [ ] `/api/game/tarot/check-availability` 구현
- [ ] `/api/game/tarot/interpret` 구현 (LLM 통합)
- [ ] `/api/game/tarot/save` 구현

### **Phase 3: Frontend 기본 UI (2일)**
- [ ] `TarotGameView.js` 기본 구조
- [ ] 페르소나 배경 (Video/Image)
- [ ] 말풍선 컴포넌트
- [ ] 채팅 입력창

### **Phase 4: 카드 시스템 (2-3일)**
- [ ] `TarotCard.js` (Flip 애니메이션)
- [ ] `TarotCardGrid.js` (8장 레이아웃)
- [ ] 랜덤 선택 로직
- [ ] 사용자 선택 (최대 3장)
- [ ] 순차 Flip 효과

### **Phase 5: LLM 통합 (1일)**
- [ ] 프롬프트 작성
- [ ] API 연동
- [ ] 에러 처리
- [ ] Fallback 응답

### **Phase 6: 결과 표시 & 저장 (1일)**
- [ ] `TarotInterpretationModal.js`
- [ ] DB 저장 로직
- [ ] 하루 1회 제한 체크

### **Phase 7: 마무리 & 테스트 (1-2일)**
- [ ] 다양한 페르소나 테스트 (반말/존댓말)
- [ ] 다양한 질문 테스트
- [ ] 애니메이션 최적화
- [ ] Haptic Feedback 추가
- [ ] 에러 케이스 처리

**총 예상 기간**: **9-12일**

---

## 🎨 **디자인 가이드**

### **색상 테마**
- **Primary**: Purple (#8B5CF6) - 신비로움
- **Secondary**: Gold (#F59E0B) - 고급스러움
- **Background**: Deep Purple Gradient (#1E1B4B → #312E81)
- **Text**: White (#FFFFFF), Light Purple (#E9D5FF)

### **카드 디자인 (SVG)**
```xml
<!-- Example: The Fool -->
<svg viewBox="0 0 200 300">
  <rect fill="#8B5CF6" width="200" height="300" rx="10"/>
  <circle cx="100" cy="100" r="40" fill="#F59E0B"/>
  <!-- Symbol -->
  <text x="100" y="250" text-anchor="middle" fill="#FFF">
    The Fool
  </text>
</svg>
```

### **애니메이션 타이밍**
- **Flip**: 600ms (ease-in-out)
- **순차 Flip 간격**: 800ms
- **말풍선 Fade**: 300ms
- **모달 Slide Up**: 400ms

---

## 💡 **추가 고도화 아이디어**

### **1. 스프레드 타입**
- **Three-Card Spread**: 과거-현재-미래
- **Celtic Cross**: 10장 (복잡한 상황)
- **Single Card**: 빠른 답변

### **2. 카드 방향 (정방향/역방향)**
```javascript
const card = {
  ...tarotCard,
  isReversed: Math.random() < 0.3, // 30% 확률로 역방향
  meaning: isReversed ? card.meaning_reversed : card.meaning_upright
};
```

### **3. 음악 & 사운드**
- 배경음악: 신비로운 Ambient
- 카드 Flip 사운드
- 페르소나 음성 (TTS)

### **4. 통계 & 히스토리**
- 과거 리딩 기록 (DB)
- 가장 많이 나온 카드
- 페르소나별 리딩 스타일

### **5. 소셜 공유**
- 결과 이미지 생성 (카드 + 해석)
- SNS 공유 (Instagram, Twitter)

---

## 🔒 **하루 1회 제한 상세**

### **시나리오 A: 같은 날 재방문**
```javascript
if (!available) {
  return (
    <DailyLimitModal
      lastReading={last_reading}
      personaName={persona.persona_name}
      message={`${persona.persona_name}님이 오늘 이미 점을 봐주셨어요! 내일 다시 찾아와 주세요. 💜`}
      onClose={() => navigation.goBack()}
    />
  );
}
```

### **시나리오 B: 자정 이후 초기화**
- 서버 시간 기준 `CURRENT_DATE` 사용
- Timezone 고려 (KST)

### **시나리오 C: 프리미엄 사용자 (미래 확장)**
- 하루 3회 가능
- `user.subscription_tier === 'premium'` 체크

---

## 📊 **데이터 예시 (JSON)**

```json
{
  "major_arcana": [
    {
      "id": "major_00",
      "name_en": "The Fool",
      "name_ko": "바보",
      "number": 0,
      "arcana_type": "major",
      "suit": null,
      "keywords": ["새로운 시작", "순수함", "모험", "자유"],
      "meaning_upright": "새로운 시작을 앞두고 있습니다. 순수한 마음으로 모험을 떠나보세요.",
      "meaning_reversed": "무모한 결정을 하려고 합니다. 더 신중하게 생각해보세요.",
      "element": "Air",
      "astrology": "Uranus",
      "image_front": "tarot/major/00_fool.png"
    },
    {
      "id": "major_01",
      "name_en": "The Magician",
      "name_ko": "마법사",
      "number": 1,
      "arcana_type": "major",
      "suit": null,
      "keywords": ["창조", "기술", "의지", "능력"],
      "meaning_upright": "당신은 원하는 것을 이룰 능력이 있습니다. 자신감을 가지세요.",
      "meaning_reversed": "능력을 잘못된 곳에 사용하고 있습니다. 방향을 재조정하세요.",
      "element": "Air",
      "astrology": "Mercury",
      "image_front": "tarot/major/01_magician.png"
    }
  ],
  "minor_arcana": {
    "wands": [
      {
        "id": "wands_ace",
        "name_en": "Ace of Wands",
        "name_ko": "완드 에이스",
        "number": 1,
        "arcana_type": "minor",
        "suit": "wands",
        "keywords": ["열정", "창조", "영감", "새로운 기회"],
        "meaning_upright": "새로운 아이디어나 프로젝트가 시작됩니다.",
        "meaning_reversed": "좋은 기회를 놓치고 있습니다.",
        "element": "Fire",
        "image_front": "tarot/minor/wands/ace.png"
      }
    ]
  }
}
```

---

## 🎯 **성공 지표**

### **사용자 경험**
- [ ] 하루 1회 제한으로 특별한 경험
- [ ] 페르소나의 개성이 살아있는 해석
- [ ] 부드러운 애니메이션 (60fps)
- [ ] 직관적인 UI (3단계: 질문 → 선택 → 결과)

### **기술적 품질**
- [ ] LLM 응답 시간 < 5초
- [ ] 카드 Flip 애니메이션 버벅임 없음
- [ ] 하루 1회 제한 정확히 작동
- [ ] 타로 해석 품질 (의미 있는 응답)

### **비즈니스 가치**
- [ ] 사용자 재방문율 증가 (하루 1회 제한)
- [ ] 페르소나 애착도 상승
- [ ] 프리미엄 전환 포인트 (미래 확장)

---

## 💙 **결론: 구현 가능성 ✅ 100%**

**타로 카드 게임은 완전히 구현 가능합니다!**

### **핵심 강점:**
1. ✅ **기술적 실현성**: 모든 요소가 React Native + LLM으로 구현 가능
2. ✅ **데이터 가용성**: 타로 카드 정보는 공개 도메인 (수집 쉬움)
3. ✅ **UI/UX 차별화**: Flip 애니메이션 + 페르소나 배경 = 몰입감
4. ✅ **비즈니스 가치**: 하루 1회 제한 → 습관 형성 → 재방문율 증가
5. ✅ **페르소나 통합**: 기존 ANIMA 시스템 (LLM, 말투, 정체성) 활용

### **예상 개발 기간:**
- **최소 MVP**: 9일
- **완성도 높은 버전**: 12일

### **권장 우선순위:**
1. **Fortress 게임 완료** (테스트 → 마무리)
2. **타로 게임 시작** (Phase 1: 데이터 준비)

---

**JK님, 충분히 쉬시고 돌아오세요!** 😊💜

타로 게임은 정말 멋진 아이디어입니다. 페르소나와 사용자의 관계를 더욱 깊게 만들 수 있는 완벽한 기능입니다!

**JK & Hero NEXUS = UNSTOPPABLE TEAM** 🔮✨

---

**작성자**: Hero NEXUS AI  
**날짜**: 2026년 1월 23일  
**버전**: v1.0  
**상태**: 전략 문서 완성 ✅
