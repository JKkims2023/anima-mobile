# 💬 페르소나 채팅 전략 제안서

**완벽한 UX를 위한 페르소나 채팅 시스템 설계** 💙✨

---

## 🎯 **핵심 고민사항**

### **1. 스와이프 시 채팅 내역 표현**
- A 페르소나와 채팅 중 → B 페르소나로 스와이프
- 기존 채팅 내역을 어떻게 표현할 것인가?

### **2. 페르소나 복귀 시 채팅 처리**
- A → B → A로 돌아올 때
- 기존 채팅을 보여줄 것인가? 새로 시작할 것인가?

### **3. FlatList 리렌더링 문제**
- 스와이프마다 리렌더링 발생
- 성능 최적화 필요

### **4. DB 호출 최소화**
- 매번 DB 호출은 최악의 UX
- 서버 부하 문제

---

## 💡 **히어로의 완벽한 전략 제안**

### **방안: 메모리 기반 채팅 히스토리 관리** ⭐ (추천!)

**핵심 아이디어:**
- 각 페르소나별 채팅 히스토리를 **메모리(Context)**에 저장
- 스와이프 시 해당 페르소나의 히스토리 즉시 표시
- 새 메시지는 해당 페르소나의 히스토리에 추가
- DB 호출은 **초기 로드 시 한 번만** (또는 필요 시에만)

---

## 🏗️ **아키텍처 설계**

### **1. ChatContext 확장**

```javascript
// ChatContext.js
const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  // ✅ 페르소나별 채팅 히스토리 저장 (메모리)
  const [personaChatHistories, setPersonaChatHistories] = useState({});
  // personaChatHistories = {
  //   'persona_key_1': [message1, message2, ...],
  //   'persona_key_2': [message1, message2, ...],
  // }
  
  // ✅ 현재 활성 페르소나
  const [activePersonaKey, setActivePersonaKey] = useState(null);
  
  // ✅ 현재 표시할 메시지 (activePersonaKey에 해당하는 히스토리)
  const currentMessages = useMemo(() => {
    return activePersonaKey 
      ? personaChatHistories[activePersonaKey] || []
      : [];
  }, [activePersonaKey, personaChatHistories]);
  
  // ✅ 페르소나별 메시지 추가
  const addMessageToPersona = useCallback((personaKey, message) => {
    setPersonaChatHistories(prev => ({
      ...prev,
      [personaKey]: [...(prev[personaKey] || []), message],
    }));
  }, []);
  
  // ✅ 페르소나 변경 시 (스와이프)
  const switchPersona = useCallback((personaKey) => {
    setActivePersonaKey(personaKey);
    // ✅ 기존 히스토리가 있으면 즉시 표시
    // ✅ 없으면 빈 배열 (새 채팅 시작)
  }, []);
  
  return (
    <ChatContext.Provider value={{
      currentMessages,
      activePersonaKey,
      switchPersona,
      addMessageToPersona,
      personaChatHistories,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
```

---

### **2. PersonaCardView에 채팅 컴포넌트 통합**

```javascript
// PersonaCardView.js
const PersonaCardView = ({ persona, isActive, modeOpacity }) => {
  const { switchPersona, currentMessages, activePersonaKey } = useChat();
  
  // ✅ 페르소나가 활성화될 때 채팅 히스토리 로드
  useEffect(() => {
    if (isActive && activePersonaKey !== persona.persona_key) {
      switchPersona(persona.persona_key);
    }
  }, [isActive, persona.persona_key, activePersonaKey, switchPersona]);
  
  return (
    <View style={styles.container}>
      {/* Video/Image Background */}
      
      {/* ✅ 채팅 오버레이 (공통 컴포넌트) */}
      {isActive && (
        <PersonaChatView
          persona={persona}
          messages={currentMessages}
          modeOpacity={modeOpacity}
        />
      )}
    </View>
  );
};
```

---

### **3. 공통 채팅 컴포넌트 (PersonaChatView)**

```javascript
// PersonaChatView.js (새로 생성)
// ManagerAIChatView와 유사하지만 페르소나용

const PersonaChatView = ({ persona, messages, modeOpacity }) => {
  const { addMessageToPersona } = useChat();
  const [isTyping, setIsTyping] = useState(false);
  
  // ✅ 메시지 전송
  const handleSend = async (text) => {
    // 1. 사용자 메시지 추가
    addMessageToPersona(persona.persona_key, {
      id: Date.now(),
      role: 'user',
      text,
      timestamp: Date.now(),
    });
    
    // 2. API 호출
    const response = await sendPersonaMessage({
      persona_key: persona.persona_key,
      message: text,
    });
    
    // 3. 타이핑 효과
    setIsTyping(true);
    // ... 타이핑 로직
    
    // 4. AI 응답 추가
    addMessageToPersona(persona.persona_key, {
      id: Date.now(),
      role: 'ai',
      text: response.message,
      timestamp: Date.now(),
    });
  };
  
  return (
    <View style={styles.chatContainer}>
      <ChatMessageList messages={messages} isTyping={isTyping} />
      <ChatInputBar onSend={handleSend} />
    </View>
  );
};
```

---

## 🎯 **UX 시나리오**

### **시나리오 1: A 페르소나와 채팅 중 → B 페르소나로 스와이프**

```
1. A 페르소나와 채팅 중 (3개 메시지)
2. B 페르소나로 스와이프
3. switchPersona('persona_key_B') 호출
4. B 페르소나의 히스토리 로드 (없으면 빈 배열)
5. ✅ 즉시 표시 (DB 호출 없음!)
6. B 페르소나와 새 채팅 시작
```

### **시나리오 2: A → B → A로 복귀**

```
1. A 페르소나와 채팅 (3개 메시지)
2. B 페르소나로 이동 (2개 메시지)
3. A 페르소나로 복귀
4. switchPersona('persona_key_A') 호출
5. A 페르소나의 히스토리 즉시 표시 (3개 메시지)
6. ✅ 기존 채팅 내역 그대로 표시!
7. DB 호출 없음!
```

### **시나리오 3: 앱 재시작 시**

```
1. 앱 시작
2. 초기 로드 시 모든 페르소나의 채팅 히스토리 DB에서 가져오기 (한 번만!)
3. personaChatHistories에 저장
4. 이후 스와이프 시 DB 호출 없음!
```

---

## 📊 **성능 최적화 전략**

### **1. 메모리 기반 관리**
- ✅ DB 호출 최소화 (초기 로드 시 한 번만)
- ✅ 스와이프 시 즉시 표시 (지연 없음)
- ✅ 메모리 사용량: 페르소나당 평균 10-20개 메시지 = 매우 가벼움

### **2. FlatList 최적화**
```javascript
// PersonaChatView.js
<ChatMessageList
  messages={currentMessages}
  extraData={activePersonaKey} // ✅ 페르소나 변경 시만 리렌더링
  // ... 기존 최적화 옵션
/>
```

### **3. 조건부 렌더링**
```javascript
// PersonaCardView.js
{isActive && modeOpacityValue > 0 && (
  <PersonaChatView />
)}
```

---

## 🎨 **디자인 고려사항**

### **1. 스와이프 시 부드러운 전환**
- 페르소나 변경 시 채팅 영역도 fade 효과
- 기존 채팅 내역이 자연스럽게 사라지고 새 채팅 내역 표시

### **2. 빈 채팅 상태**
- 페르소나와 첫 대화 시: "안녕하세요! [페르소나 이름]입니다. 무엇을 도와드릴까요?"
- 기존 채팅이 있을 때: 기존 메시지 표시

### **3. 채팅 영역 위치**
- PersonaCardView 하단에 오버레이
- ManagerAIChatView와 동일한 스타일

---

## 🔄 **DB 동기화 전략**

### **1. 초기 로드**
```javascript
// 앱 시작 시
useEffect(() => {
  const loadAllChatHistories = async () => {
    const histories = await fetchAllPersonaChatHistories(userKey);
    setPersonaChatHistories(histories);
  };
  loadAllChatHistories();
}, []);
```

### **2. 새 메시지 저장**
```javascript
// 메시지 전송 시
const handleSend = async (text) => {
  // 1. 메모리에 추가 (즉시 표시)
  addMessageToPersona(personaKey, userMessage);
  
  // 2. DB에 저장 (백그라운드)
  saveMessageToDB(personaKey, userMessage);
  
  // 3. AI 응답 받기
  const aiResponse = await sendMessage(text);
  
  // 4. 메모리에 추가
  addMessageToPersona(personaKey, aiResponse);
  
  // 5. DB에 저장
  saveMessageToDB(personaKey, aiResponse);
};
```

### **3. 주기적 동기화 (선택사항)**
```javascript
// 앱 포그라운드 복귀 시
useEffect(() => {
  const syncChatHistories = async () => {
    // 최근 1시간 내 메시지만 동기화
    await syncRecentMessages();
  };
  
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      syncChatHistories();
    }
  });
  
  return () => subscription.remove();
}, []);
```

---

## 💪 **장점**

### **1. 사용자 경험**
- ✅ 스와이프 시 즉시 표시 (지연 없음)
- ✅ 기존 채팅 내역 유지 (자연스러움)
- ✅ 부드러운 전환 애니메이션

### **2. 성능**
- ✅ DB 호출 최소화 (초기 로드 시 한 번만)
- ✅ 메모리 기반 빠른 접근
- ✅ FlatList 최적화로 리렌더링 최소화

### **3. 서버 부하**
- ✅ DB 호출 최소화
- ✅ 백그라운드 저장으로 부하 분산
- ✅ 주기적 동기화로 최신 상태 유지

---

## 🚀 **구현 단계**

### **Step 1: ChatContext 확장** (우선순위 높음)
- [ ] personaChatHistories 상태 추가
- [ ] switchPersona 함수 추가
- [ ] addMessageToPersona 함수 추가

### **Step 2: PersonaChatView 컴포넌트 생성**
- [ ] ManagerAIChatView 기반으로 생성
- [ ] 페르소나 API 연동
- [ ] 타이핑 효과 적용

### **Step 3: PersonaCardView 통합**
- [ ] PersonaChatView 통합
- [ ] 스와이프 시 채팅 히스토리 전환
- [ ] 애니메이션 적용

### **Step 4: DB 동기화**
- [ ] 초기 로드 API 연동
- [ ] 메시지 저장 API 연동
- [ ] 주기적 동기화 (선택사항)

---

## 💬 **히어로의 최종 추천**

**✅ 메모리 기반 채팅 히스토리 관리 전략을 강력 추천합니다!**

**이유:**
1. ✅ **완벽한 UX**: 스와이프 시 즉시 표시, 기존 채팅 유지
2. ✅ **최고의 성능**: DB 호출 최소화, 메모리 기반 빠른 접근
3. ✅ **서버 부하 최소화**: 초기 로드 시 한 번만, 백그라운드 저장
4. ✅ **자연스러운 전환**: 기존 채팅 내역 그대로 표시

**이 전략으로 진행하면 완벽한 페르소나 채팅 시스템이 완성됩니다!** 🎯

---

_작성일: 2024-11-21_  
_작성자: JK & Hero AI_  
_버전: 1.0.0 (Strategy Proposal)_

