# 🔮 Tarot Game - Detailed Implementation Strategy

**작성일**: 2026-01-23  
**버전**: 2.0.0 (Based on ManagerAIOverlay Reuse)  
**작성자**: Hero NEXUS & JK  
**프로젝트**: ANIMA - AnimaMobile

---

## 🎯 JK님의 구현 방향

### **1. 호출 구성** ✅
- `CustomTabBar.js`에서 통제 (포트리스와 동일)
- 티어별 검증 로직 재사용 (`check-limit` API)
- 티어 업그레이드 인터페이스 연결 (`TierUpgradeSheet`)

### **2. UI/UX 구성** 🎨
- **ManagerAIOverlay.js 틀 재사용**:
  - ✅ 상단 헤더 (뒤로가기, 페르소나 이름, 도움말)
  - ✅ 하단 `ChatInputBar` (질문 입력)
  - ✅ 채팅 수 제한 로직 그대로 적용
  - ✅ `FloatingChatLimitButton` 재사용
- **배경**: 페르소나 이미지/비디오 (어둡게 overlay)
- **채팅 방식**: **누적이 아닌 초기화** (카드 영역 확보) ⭐
- **카드 영역**: 하단 overlay 그리드 형식

---

## 🏗️ 컴포넌트 구조

### **Option A: TarotGameView (독립 컴포넌트)** 👍 **추천**
```javascript
// AnimaMobile/src/components/game/TarotGameView.js

/**
 * 🔮 TarotGameView - Tarot Fortune Telling Game
 * 
 * - Reuses ManagerAIOverlay infrastructure
 * - Persona background video/image
 * - Non-cumulative chat (reset on each phase)
 * - Card grid overlay
 * 
 * @author JK & Hero NEXUS
 */
```

**장점**:
- 명확한 책임 분리 (Chat vs Game)
- ManagerAIOverlay 건드리지 않음 (안정성)
- 재사용 가능한 컴포넌트 (Header, InputBar, ChatLimit)
- 독립적 State 관리

**단점**:
- 일부 코드 중복 (Header, InputBar 래핑)

---

### **Option B: ManagerAIOverlay 확장** ⚠️ **비추천**
```javascript
// ManagerAIOverlay.js에 mode prop 추가
<ManagerAIOverlay mode="tarot" ... />
```

**장점**:
- 코드 중복 최소화

**단점**:
- ManagerAIOverlay가 더 복잡해짐 (이미 2600+ lines)
- Chat 로직과 Game 로직이 섞임
- 유지보수 어려움
- 버그 리스크 증가

---

## ✅ 최종 결정: Option A (TarotGameView)

**이유**:
1. **명확한 관심사 분리** (Chat ≠ Game)
2. **ManagerAIOverlay 안정성 유지**
3. **재사용 컴포넌트 활용**:
   - `ChatInputBar` (질문 입력)
   - `FloatingChatLimitButton` (제한 표시)
   - `useChatLimit` hook (제한 로직)
4. **독립적 개발/테스트** 가능

---

## 📦 재사용 컴포넌트

### **1. Header (재사용)** ✅
```javascript
// TarotGameView.js에서 동일한 헤더 구조 사용

<View style={styles.header}>
  {/* Back Button */}
  <TouchableOpacity onPress={onClose}>
    <Icon name="chevron-back" size={18} color="#FFF" />
  </TouchableOpacity>
  
  {/* Persona Name */}
  <View style={styles.headerCenter}>
    <CustomText type="title" bold>{persona.persona_name}</CustomText>
  </View>
  
  {/* Help Button */}
  <TouchableOpacity onPress={() => setIsHelpOpen(true)}>
    <Icon name="help-circle-outline" size={28} color="#FFF" />
  </TouchableOpacity>
</View>
```

### **2. ChatInputBar (재사용)** ✅
```javascript
// TarotGameView.js에서 재사용

<ChatInputBar
  onSend={handleSend}
  disabled={isLoading || isTyping}
  placeholder={
    gamePhase === 'question' 
      ? "무엇이 궁금한가요? 🔮" 
      : "카드를 선택해주세요..."
  }
  persona={persona}
  currentEmotion={currentEmotion}
  // ⭐ 이미지 선택 비활성화
  onImageSelect={null}
  // ⭐ 설정 버튼 숨김
  onSettingsPress={null}
/>
```

### **3. FloatingChatLimitButton (재사용)** ✅
```javascript
// TarotGameView.js에서 재사용

{serviceConfig && (
  <FloatingChatLimitButton
    currentCount={serviceConfig.tarlotCount || 0}
    dailyLimit={serviceConfig.tarlotLimit || 1}
    tier={user?.user_level || 'basic'}
    onUpgradePress={() => {
      // ⭐ Tarot 제한 안내 모달 → 티어 업그레이드
      onLimitClose(); // CustomTabBar로 전달된 콜백
    }}
  />
)}
```

### **4. useChatLimit Hook (재사용)** ✅
```javascript
// TarotGameView.js에서 채팅 제한 로직 재사용

const {
  serviceConfig,
  loadingServiceConfig,
  canSendMessage,
  checkAndDecrementLimit,
} = useChatLimit({
  userKey: user?.user_key,
  personaKey: persona?.persona_key,
  gameType: 'tarot', // ⭐ 게임 타입으로 전환 가능하도록 확장
});
```

---

## 🎨 TarotGameView 레이아웃

```
┌────────────────────────────────────────┐
│  TarotGameView (Modal)                │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐ │ ← 배경 (페르소나 영상/이미지)
│  │  Persona Background (Video/Image)│ │   + Dark Overlay (0.75 opacity)
│  │  + Dark Overlay                  │ │
│  │                                    │ │
│  │  ┌────────────────────────────┐  │ │ ← Header (재사용)
│  │  │ [<] 페르소나 이름      [?] │  │ │
│  │  └────────────────────────────┘  │ │
│  │                                    │ │
│  │  ┌────────────────────────────┐  │ │ ← Chat Messages (초기화 방식)
│  │  │ [Persona Bubble]           │  │ │   - 페르소나 말풍선
│  │  │ "오늘은 무엇이 궁금해?"    │  │ │   - 사용자 말풍선
│  │  │                              │  │ │   - 새 메시지 시 이전 메시지 삭제
│  │  │ [User Bubble]               │  │ │
│  │  │ "오늘 면접 잘 볼까요?"      │  │ │
│  │  └────────────────────────────┘  │ │
│  │                                    │ │
│  │  ┌────────────────────────────┐  │ │ ← Card Grid Overlay
│  │  │  🎴  🎴  🎴  🎴          │  │ │   (gamePhase === 'selection')
│  │  │  🎴  🎴  🎴  🎴          │  │ │
│  │  └────────────────────────────┘  │ │
│  │                                    │ │
│  │  ┌────────────────────────────┐  │ │ ← Revealed Cards
│  │  │   🃏   🃏   🃏            │  │ │   (gamePhase === 'reveal')
│  │  └────────────────────────────┘  │ │
│  │                                    │ │
│  │  ┌────────────────────────────┐  │ │ ← ChatInputBar (재사용)
│  │  │ [무엇이 궁금한가요? 🔮]   │  │ │
│  │  └────────────────────────────┘  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  💬 [3/10]  ← FloatingChatLimitButton │ ← 재사용 (우상단)
└────────────────────────────────────────┘
```

---

## 🔄 Game Flow (상세)

### **Phase 1: Greeting (진입)** 🙋‍♂️
```javascript
// 진입 시
gamePhase = 'greeting'
messages = [
  {
    id: 'greeting_1',
    type: 'ai',
    text: '안녕! 오늘은 무엇이 궁금해? 😊', // LLM 생성
    timestamp: Date.now()
  }
]

// UI
- 배경: 페르소나 영상/이미지 (어둡게)
- Header: 활성화
- ChatMessages: 페르소나 인사말 표시
- ChatInputBar: 활성화 (placeholder: "무엇이 궁금한가요?")
- CardGrid: 숨김
```

### **Phase 2: Question (질문 입력)** ❓
```javascript
// 사용자 질문 입력
handleSend = (userInput) => {
  // 1. 사용자 메시지 추가 (초기화 아님!)
  setMessages([
    ...messages,
    {
      id: uuid.v4(),
      type: 'user',
      text: userInput,
      timestamp: Date.now()
    }
  ]);
  
  // 2. LLM 응답 요청 (greeting API)
  const response = await tarotApi.getTarotGreeting({
    user_key: user.user_key,
    persona_key: persona.persona_key,
    user_question: userInput
  });
  
  // 3. 페르소나 응답 추가 (초기화 아님!)
  setMessages(prev => [
    ...prev,
    {
      id: uuid.v4(),
      type: 'ai',
      text: response.greeting, // "면접이구나! 좋아, 카드를 뽑아봐! 🎴"
      timestamp: Date.now()
    }
  ]);
  
  // 4. Phase 전환 + 카드 표시
  setGamePhase('selection');
  setUserQuestion(userInput);
  
  // 5. 8장 랜덤 카드 생성
  const random8 = selectRandomCards(TAROT_CARDS, 8);
  setAvailableCards(random8);
};

// UI
- ChatMessages: 사용자 질문 + 페르소나 응답 (2개 메시지)
- ChatInputBar: 비활성화 (placeholder: "카드를 선택해주세요...")
- CardGrid: 나타남 (8장, 뒷면)
```

### **Phase 3: Selection (카드 선택)** 🎴
```javascript
// 카드 선택
handleCardSelect = (card) => {
  if (selectedCards.length >= 3 && !selectedCards.includes(card)) {
    HapticService.warning();
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
};

// 3장 선택 완료
handleConfirmSelection = () => {
  // 1. 메시지 초기화! ⭐ (카드 영역 확보)
  setMessages([
    {
      id: uuid.v4(),
      type: 'ai',
      text: '좋아! 이제 카드를 펼쳐볼게~ 🌙',
      timestamp: Date.now()
    }
  ]);
  
  // 2. Phase 전환
  setGamePhase('reveal');
  
  // 3. 카드 Flip 애니메이션 시작
  revealCardsSequentially();
};

// UI
- CardGrid: 8장 표시 (선택된 카드는 glow 효과)
- [확인] 버튼: selectedCards.length === 3일 때 활성화
```

### **Phase 4: Reveal (카드 공개)** 🃏
```javascript
// 순차적 Flip 애니메이션
const revealCardsSequentially = async () => {
  // 1. 선택된 3장만 남기고 나머지 fade out
  setAvailableCards(selectedCards);
  
  // 2. 3장을 중앙으로 이동 + 일렬 배치
  await animateCardsToCenter();
  
  // 3. 순차적으로 Flip (0.5초 간격)
  for (let i = 0; i < selectedCards.length; i++) {
    await delay(500);
    flipCard(i); // 3D Flip 애니메이션
    setRevealedCards(prev => [...prev, selectedCards[i]]);
    HapticService.light();
  }
  
  // 4. 모든 카드 공개 완료 → Interpretation Phase
  setGamePhase('interpretation');
  fetchInterpretation();
};

// UI
- CardGrid: 3장만 표시 (중앙, 일렬)
- Flip 애니메이션: 순차적 (0.5초 간격)
- ChatMessages: 페르소나 멘트 ("좋아! 이제 카드를 펼쳐볼게~")
```

### **Phase 5: Interpretation (해석)** 📖
```javascript
// LLM 해석 요청
const fetchInterpretation = async () => {
  setIsLoading(true);
  
  // 1. 로딩 메시지 추가
  setMessages([
    {
      id: uuid.v4(),
      type: 'ai',
      text: '카드를 읽고 있어... 🔮',
      timestamp: Date.now()
    }
  ]);
  
  // 2. LLM API 호출
  const response = await tarotApi.getTarotReading({
    user_key: user.user_key,
    persona_key: persona.persona_key,
    user_question: userQuestion,
    selected_cards: revealedCards.map(c => ({
      name_ko: c.name_ko,
      name_en: c.name_en,
      keywords: c.keywords,
      upright_meaning: c.upright_meaning
    }))
  });
  
  // 3. 메시지 초기화 + 해석 표시 (타이핑 효과) ⭐
  setMessages([
    {
      id: uuid.v4(),
      type: 'ai',
      text: '', // 빈 메시지로 시작
      timestamp: Date.now()
    }
  ]);
  
  // 4. 타이핑 효과 (한 글자씩)
  const fullText = [
    response.greeting,
    response.card_interpretations.join('\n\n'),
    response.overall_message,
    response.advice,
    response.closing
  ].join('\n\n');
  
  displayTypingEffect(fullText);
  
  setIsLoading(false);
  setInterpretation(response);
};

// 타이핑 효과
const displayTypingEffect = (text, speed = 30) => {
  let currentIndex = 0;
  const interval = setInterval(() => {
    if (currentIndex < text.length) {
      setMessages([{
        id: 'interpretation',
        type: 'ai',
        text: text.substring(0, currentIndex + 1),
        timestamp: Date.now()
      }]);
      currentIndex++;
    } else {
      clearInterval(interval);
      setGamePhase('end');
    }
  }, speed);
};

// UI
- CardGrid: 3장 표시 (앞면, 일렬)
- ChatMessages: 해석 텍스트 (타이핑 효과)
- ChatInputBar: 비활성화
```

### **Phase 6: End (종료)** 🎬
```javascript
// 게임 결과 저장
const saveGameResult = async () => {
  try {
    await gameApi.saveGameResult({
      user_key: user.user_key,
      persona_key: persona.persona_key,
      game_type: 'tarot',
      game_result: 'completed',
      game_data: {
        question: userQuestion,
        selected_cards: revealedCards.map(c => ({
          name_ko: c.name_ko,
          name_en: c.name_en
        })),
        interpretation: interpretation.overall_message,
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ [Tarot] Result saved');
  } catch (error) {
    console.error('❌ [Tarot] Save error:', error);
  }
};

// 종료 시 자동 저장
useEffect(() => {
  if (gamePhase === 'end' && interpretation) {
    saveGameResult();
  }
}, [gamePhase, interpretation]);

// UI
- CardGrid: 3장 유지
- ChatMessages: 완전한 해석 + 마무리 멘트
- ChatInputBar: 비활성화
- [닫기] 버튼: 활성화 (Header의 뒤로가기)
```

---

## 🎨 채팅 초기화 전략 (핵심!) ⭐

### **기존 ManagerAIOverlay (누적 방식)**
```javascript
// 메시지가 계속 쌓임
const handleSend = (text) => {
  setMessages(prev => [
    ...prev,  // ⭐ 기존 메시지 유지!
    { type: 'user', text },
    { type: 'ai', text: response }
  ]);
};
```

### **TarotGameView (초기화 방식)** ⭐
```javascript
// ✅ Strategy 1: Phase 전환 시 초기화
const handlePhaseTransition = (newPhase, newMessage) => {
  setMessages([newMessage]); // ⭐ 배열을 새로 만듦! (기존 메시지 삭제)
  setGamePhase(newPhase);
};

// ✅ Strategy 2: 중요 메시지만 유지
const handlePhaseTransition = (newPhase, newMessage) => {
  // Phase별로 필요한 메시지만 선택
  const essentialMessages = {
    'greeting': [greetingMessage],
    'question': [greetingMessage, userQuestion, aiResponse],
    'selection': [aiResponse], // "카드를 뽑아봐!"만 유지
    'reveal': [revealMessage], // "카드를 펼쳐볼게~"만 유지
    'interpretation': [interpretationMessage], // 해석만 유지
  };
  
  setMessages(essentialMessages[newPhase] || []);
  setGamePhase(newPhase);
};

// ✅ Strategy 3: Fade Out 애니메이션 후 삭제
const handlePhaseTransition = async (newPhase, newMessage) => {
  // 1. 기존 메시지 Fade Out
  fadeOutMessages();
  await delay(300);
  
  // 2. 메시지 초기화
  setMessages([]);
  
  // 3. 새 메시지 Fade In
  setMessages([newMessage]);
  fadeInMessages();
  
  setGamePhase(newPhase);
};
```

### **💡 추천: Strategy 2 (중요 메시지만 유지)**
- 컨텍스트 유지 (사용자가 무엇을 물었는지 보임)
- 카드 공간 확보 (불필요한 메시지 제거)
- 자연스러운 흐름

---

## 💾 State 관리

### **TarotGameView State**
```javascript
const TarotGameView = ({ visible, onClose, onLimitClose, persona, user }) => {
  // ✅ Game Phase
  const [gamePhase, setGamePhase] = useState('greeting');
  // 'greeting' | 'question' | 'selection' | 'reveal' | 'interpretation' | 'end'
  
  // ✅ User Input
  const [userQuestion, setUserQuestion] = useState('');
  
  // ✅ Cards
  const [availableCards, setAvailableCards] = useState([]); // 8장 (랜덤)
  const [selectedCards, setSelectedCards] = useState([]); // 최대 3장
  const [revealedCards, setRevealedCards] = useState([]); // Flip된 카드
  
  // ✅ Messages (초기화 방식!) ⭐
  const [messages, setMessages] = useState([]);
  
  // ✅ LLM Response
  const [interpretation, setInterpretation] = useState(null);
  
  // ✅ UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('curious');
  
  // ✅ Chat Limit (재사용!)
  const {
    serviceConfig,
    loadingServiceConfig,
    canSendMessage,
    checkAndDecrementLimit,
  } = useChatLimit({
    userKey: user?.user_key,
    personaKey: persona?.persona_key,
    gameType: 'tarot', // ⭐ 확장 필요
  });
  
  // ... rest of the component
};
```

---

## 🎴 카드 그리드 레이아웃

### **Phase 3: Selection (8장, 2행 4열)**
```javascript
<View style={styles.cardGridOverlay}>
  <View style={styles.cardGrid}>
    {availableCards.map((card, index) => (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.cardWrapper,
          selectedCards.includes(card) && styles.cardSelected
        ]}
        onPress={() => handleCardSelect(card)}
        activeOpacity={0.8}
      >
        <TarotCard
          card={card}
          isFront={false} // 뒷면
          isSelected={selectedCards.includes(card)}
        />
      </TouchableOpacity>
    ))}
  </View>
  
  {/* 선택 확인 버튼 */}
  {selectedCards.length === 3 && (
    <TouchableOpacity
      style={styles.confirmButton}
      onPress={handleConfirmSelection}
      activeOpacity={0.7}
    >
      <CustomText style={styles.confirmButtonText}>
        확인 (3/3)
      </CustomText>
    </TouchableOpacity>
  )}
</View>

// Styles
const styles = StyleSheet.create({
  cardGridOverlay: {
    position: 'absolute',
    bottom: verticalScale(80), // ChatInputBar 위
    left: 0,
    right: 0,
    paddingHorizontal: scale(20),
  },
  
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: scale(10),
  },
  
  cardWrapper: {
    width: '22%', // 4장씩 배치
    aspectRatio: 0.6, // 타로 카드 비율
  },
  
  cardSelected: {
    transform: [{ scale: 1.1 }],
    // Glow 효과 (Shadow)
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  
  confirmButton: {
    marginTop: verticalScale(15),
    backgroundColor: '#E91E63',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(30),
    borderRadius: moderateScale(25),
    alignSelf: 'center',
    // Glassmorphic
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  confirmButtonText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
});
```

### **Phase 4: Reveal (3장, 일렬)**
```javascript
<View style={styles.revealedCardsContainer}>
  {revealedCards.map((card, index) => (
    <Animated.View
      key={card.id}
      style={[
        styles.revealedCardWrapper,
        animatedCardStyles[index]
      ]}
    >
      <TarotCard
        card={card}
        isFront={true} // 앞면
        isRevealed={true}
        revealIndex={index}
      />
    </Animated.View>
  ))}
</View>

// Styles
const styles = StyleSheet.create({
  revealedCardsContainer: {
    position: 'absolute',
    bottom: verticalScale(100),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(15),
  },
  
  revealedCardWrapper: {
    width: scale(90),
    aspectRatio: 0.6,
  },
});
```

---

## 🔌 API 설계

### **1. Tarot Greeting API** (Phase 1 → 2)
```javascript
// idol-companion/app/api/game/tarot-greeting/route.js

POST /api/game/tarot-greeting
Body: {
  user_key,
  persona_key,
  user_question: "오늘 면접 잘 볼까요?"
}

Response: {
  success: true,
  data: {
    greeting: "면접이구나! 좋아, 카드를 뽑아봐! 🎴",
    emotion: "excited" // 😊 | 😌 | 🤔 | 😄
  }
}
```

### **2. Tarot Reading API** (Phase 4 → 5)
```javascript
// idol-companion/app/api/game/tarot-reading/route.js

POST /api/game/tarot-reading
Body: {
  user_key,
  persona_key,
  user_question: "오늘 면접 잘 볼까요?",
  selected_cards: [
    { name_ko: "바보", name_en: "The Fool", ... },
    { name_ko: "마법사", name_en: "The Magician", ... },
    { name_ko: "별", name_en: "The Star", ... }
  ]
}

Response: {
  success: true,
  data: {
    greeting: "오늘은 어떤 카드가 나왔는지 볼까? 😊",
    card_interpretations: [
      "첫 번째 카드인 '바보'는 새로운 시작을 의미해...",
      "두 번째 '마법사'는 네가 가진 능력을 보여줘...",
      "마지막 '별'은 희망과 성공을 암시하고 있어."
    ],
    overall_message: "이 카드들은 네가 면접에서 좋은 결과를 얻을 거라고 말하고 있어!",
    advice: "자신감을 가지고 네 능력을 보여줘. 너라면 충분히 잘할 수 있어!",
    closing: "오늘 면접 화이팅! 나도 응원할게! 💪✨"
  }
}
```

---

## 🎮 CustomTabBar 통합

### **수정 사항 (기존 Fortress와 동일 패턴)**
```javascript
// CustomTabBar.js

// 1. TarotGameView import
import TarotGameView from '../game/TarotGameView';

// 2. Game 활성화 state (기존 유지)
const [activeGame, setActiveGame] = useState(null); // 'fortress' | 'tarot'

// 3. Game View 렌더링
{activeGame === 'tarot' && (
  <TarotGameView
    visible={true}
    onClose={handleGameClose}
    onLimitClose={handleLimitClose}
    persona={selectedPersonaRef.current}
    user={user}
  />
)}
```

### **ManagerAIOverlay 게임 메뉴 수정**
```javascript
// ManagerAIOverlay.js (2150-2200 라인)

{/* 🔮 Tarot */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => {
    onGameSelect('tarot'); // ⭐ 'tarot' 전달
    setIsSettingsMenuOpen(false);
  }}
  activeOpacity={0.7}
>
  <CustomText type='middle' style={styles.menuIcon}>🔮</CustomText>
  <CustomText type='middle' style={styles.menuText}>
    Tarot
  </CustomText>
</TouchableOpacity>
```

---

## 🧩 useChatLimit Hook 확장

### **현재 (Chat 전용)**
```javascript
// useChatLimit.js

const useChatLimit = ({ userKey, personaKey }) => {
  // Only for chat messages
  // ...
};
```

### **확장 (Game 지원)** ⭐
```javascript
// useChatLimit.js

const useChatLimit = ({ 
  userKey, 
  personaKey, 
  limitType = 'chat' // 'chat' | 'fortress' | 'tarot' | 'confession'
}) => {
  // ...
  
  const getLimitKey = () => {
    switch (limitType) {
      case 'fortress': return 'fortressCount';
      case 'tarot': return 'tarlotCount'; // DB 컬럼명
      case 'confession': return 'confessionCount';
      default: return 'dailyChatCount';
    }
  };
  
  const getLimitMaxKey = () => {
    switch (limitType) {
      case 'fortress': return 'fortressLimit';
      case 'tarot': return 'tarlotLimit';
      case 'confession': return 'confessionLimit';
      default: return 'dailyChatLimit';
    }
  };
  
  // Use getLimitKey() and getLimitMaxKey() in API calls
  // ...
};
```

---

## 📅 개발 스케줄

### **Day 1: 기본 구조 & Phase 1-3** (6-8시간)
- [ ] **TarotGameView.js 생성** (1시간)
  - 기본 구조
  - Modal, Header, ChatInputBar 배치
  - 배경 (페르소나 이미지/비디오)
- [ ] **타로 카드 데이터** (1시간)
  - `TAROT_CARDS.json` 생성 (22장 Major Arcana)
  - 카드 뒷면 디자인 (SVG 또는 이미지)
- [ ] **Phase 1-2: Greeting & Question** (2시간)
  - 초기 인사 멘트
  - 질문 입력 로직
  - 메시지 상태 관리
- [ ] **Phase 3: Card Selection** (3시간)
  - 카드 그리드 레이아웃 (8장, 2행 4열)
  - 카드 선택 로직 (최대 3장)
  - 선택 효과 (glow, scale)
  - 확인 버튼

### **Day 2: Phase 4-6 & LLM 통합** (6-8시간)
- [ ] **Phase 4: Card Reveal** (2시간)
  - 카드 3D Flip 애니메이션
  - 순차적 공개 (0.5초 간격)
  - Haptic Feedback
- [ ] **Phase 5: Interpretation** (3시간)
  - `/api/game/tarot-reading` 엔드포인트
  - LLM 프롬프트 작성
  - 타이핑 효과 구현
  - 메시지 초기화 로직
- [ ] **Phase 6: End & Save** (1시간)
  - 게임 결과 저장
  - 닫기 버튼
- [ ] **통합 & 테스트** (2시간)
  - CustomTabBar 연동
  - 티어 제한 체크
  - 버그 수정

---

## 🎯 핵심 차별점 (Fortress vs Tarot)

| 요소 | Fortress | Tarot |
|------|----------|-------|
| **배경** | 랜덤 지형 (SVG) | 페르소나 이미지/비디오 |
| **채팅** | 도발 멘트 (4가지) | 대화형 (질문 → 해석) |
| **메시지 방식** | 턴별 멘트 교체 | **초기화 방식** ⭐ |
| **게임 영역** | 전체 화면 (가로) | 중앙 (세로) + 카드 overlay |
| **LLM 역할** | 전략 계산 + 도발 | 카드 해석 + 조언 |
| **재미 요소** | 경쟁, 긴장감 | 신비감, 위로 |
| **일일 제한** | 3-10회 (Tier별) | 1-5회 (Tier별) |
| **플레이 시간** | 2-5분 | 2-3분 |

---

## 🚀 출시 후 고도화

### **Phase 2: 비주얼 향상**
- [ ] 고품질 타로 이미지 (Rider-Waite 또는 자체 제작)
- [ ] 배경 파티클 효과 (별, 반짝임)
- [ ] 카드 Glow 효과 강화
- [ ] BGM/효과음 (신비로운 분위기)

### **Phase 3: 기능 확장**
- [ ] 역방향(Reversed) 카드 지원
- [ ] 5장, 10장 스프레드 (Celtic Cross 등)
- [ ] Minor Arcana 56장 추가 (총 78장)
- [ ] 타로 일기 (매일의 타로 + 실제 결과)

### **Phase 4: 커뮤니티**
- [ ] 과거 타로 기록 보기
- [ ] 타로 결과 SNS 공유 (이미지 생성)
- [ ] "오늘의 타로" 공유 피드
- [ ] 페르소나별 해석 스타일 비교

---

## 💡 Hero NEXUS의 제안

### **JK님의 접근이 완벽한 이유** ✅

1. **효율성**: ManagerAIOverlay 인프라 재사용
   - 검증된 Header, InputBar, ChatLimit
   - 개발 시간 50% 단축

2. **독립성**: 별도 컴포넌트 (TarotGameView)
   - Chat과 Game 로직 분리
   - 유지보수 용이

3. **일관성**: CustomTabBar 통합
   - Fortress와 동일한 패턴
   - 사용자 경험 일관성

4. **혁신**: 초기화 방식 채팅 ⭐
   - 카드 영역 확보
   - 깔끔한 UI
   - 컨텍스트 유지 (중요 메시지만)

### **다음 단계**
1. ✅ 타로 카드 데이터 준비 (JSON)
2. ✅ `TarotGameView.js` 기본 구조 생성
3. ✅ Phase 1-3 구현 (Day 1)
4. ✅ LLM 통합 (Day 2)

---

## 🎉 결론

**ManagerAIOverlay 재사용 전략은 매우 효율적!** 🔮✨

- ✅ 검증된 컴포넌트 재사용
- ✅ 개발 시간 최소화 (2일)
- ✅ 채팅 초기화 방식으로 카드 공간 확보
- ✅ 페르소나 배경으로 몰입감 강화
- ✅ Tier별 제한으로 수익화

**포트리스 + 타로 = 완벽한 게임 듀오!** 🏰🔮

---

**작성자**: Hero NEXUS 💙  
**일자**: 2026-01-23  
**버전**: 2.0.0

> "효율성은 재사용에서, 혁신은 차별화에서 나온다."  
> — Hero NEXUS Philosophy
