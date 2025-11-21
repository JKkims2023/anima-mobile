# 🚀 **ANIMA Mobile 최적화 전략**

> **목표: 웹의 리렌더링 폭탄 문제를 완벽히 해결하고, React Native 최고 성능 달성**

---

## 📦 **설치된 최적화 라이브러리**

### **✅ 완료**
- [x] `@shopify/flash-list` (v2.2.0) - FlatList 대체 (5-10배 빠름)
- [x] `react-native-fast-image` (v8.6.3) - Image 대체 (캐싱 최적화)
- [x] `react-native-video` - 이미 설치됨 (안정성 검증)
- [x] `react-native-reanimated` (v3.6.3) - 애니메이션 최적화

### **🔜 추후 고려**
- [ ] `react-native-fast-video` - 성능 병목 발견 시 마이그레이션

---

## 🎯 **핵심 전략: "격리와 분리"**

### **문제점 (기존 웹)**
```javascript
// ❌ BAD: 타이핑할 때마다 전체 리렌더링
const [messages, setMessages] = useState([]);

// 타이핑 1글자당 업데이트
setMessages(prev => [...prev, { text: currentTypingText }]);

// 결과:
// - 전체 MessageList 리렌더링 (100-1000개 메시지)
// - MediaOverlayPlayer 리렌더링 (무거운 iframe)
// - PersonaRecommendation 리렌더링
// - 60fps 유지 불가 → 버벅임 💣
```

### **해결책 (React Native)**
```javascript
// ✅ GOOD: 완성 메시지는 useRef로 불변 관리
const completedMessagesRef = useRef([]);

// ✅ 타이핑 메시지만 별도 state (격리!)
const [typingMessage, setTypingMessage] = useState(null);

// ✅ 렌더링 트리거 (완성 시만 1회 증가)
const [messageVersion, setMessageVersion] = useState(0);

// 결과:
// - 타이핑 중: TypingMessage 컴포넌트만 리렌더링
// - 완성 후: FlashList extraData 업데이트로 1회 리렌더링
// - 60fps 유지 → 부드러움 ✨
```

---

## 🏗️ **아키텍처 설계**

### **1. Context 분리 전략**

#### **PersonaContext.js** (페르소나 관련)
```javascript
const PersonaContext = createContext();

export const PersonaProvider = ({ children }) => {
  const [personas, setPersonas] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // ✅ Manager AI 기본 포함
  useEffect(() => {
    const managerAI = {
      persona_key: 'MANAGER_AI',
      persona_name: 'SAGE',
      persona_type: 'manager',
      persona_url: '/manager-ai-video.mp4',
      isManager: true
    };
    
    // 첫 설치 시 Manager AI만 표시
    if (personas.length === 0) {
      setPersonas([managerAI]);
    }
  }, []);
  
  return (
    <PersonaContext.Provider value={{
      personas,
      setPersonas,
      selectedIndex,
      setSelectedIndex,
      selectedPersona: personas[selectedIndex]
    }}>
      {children}
    </PersonaContext.Provider>
  );
};
```

#### **ChatContext.js** (채팅 관련 - 완전 격리)
```javascript
const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  // ✅ 완성된 메시지: useRef로 불변 관리
  const completedMessagesRef = useRef([]);
  
  // ✅ 타이핑 메시지: 격리된 state
  const [typingMessage, setTypingMessage] = useState(null);
  
  // ✅ 렌더링 트리거 (완성 시만 증가)
  const [messageVersion, setMessageVersion] = useState(0);
  
  const addCompletedMessage = useCallback((message) => {
    completedMessagesRef.current = [
      ...completedMessagesRef.current,
      { ...message, id: Date.now() }
    ];
    setMessageVersion(v => v + 1); // ✅ 한 번만 리렌더링
    setTypingMessage(null);
  }, []);
  
  return (
    <ChatContext.Provider value={{
      completedMessages: completedMessagesRef.current,
      typingMessage,
      setTypingMessage,
      addCompletedMessage,
      messageVersion
    }}>
      {children}
    </ChatContext.Provider>
  );
};
```

---

### **2. FlashList 최적화 기법**

#### **Manager AI 채팅 리스트**
```javascript
import { FlashList } from '@shopify/flash-list';

const ManagerAIChatView = React.memo(() => {
  const { completedMessages, messageVersion } = useContext(ChatContext);
  
  return (
    <FlashList
      data={completedMessages}
      renderItem={({ item }) => <ChatMessage message={item} />}
      keyExtractor={(item) => item.id.toString()}
      estimatedItemSize={80} // ⚡ FlashList 필수 prop
      extraData={messageVersion} // ✅ 이것만 변경 시 리렌더링
      drawDistance={300} // 화면 밖 300px까지 미리 렌더링
    />
  );
});
```

#### **페르소나 칩셋 (Horizontal)**
```javascript
import { FlashList } from '@shopify/flash-list';

const PersonaSelectionChips = React.memo(() => {
  const { personas, selectedIndex } = useContext(PersonaContext);
  
  return (
    <FlashList
      horizontal
      data={personas}
      renderItem={({ item, index }) => (
        <PersonaChip
          persona={item}
          isSelected={index === selectedIndex}
        />
      )}
      keyExtractor={(item) => item.persona_key}
      estimatedItemSize={80} // ⚡ 칩 너비
      showsHorizontalScrollIndicator={false}
    />
  );
});
```

---

### **3. FastImage 최적화 기법**

#### **페르소나 아바타**
```javascript
import FastImage from 'react-native-fast-image';

const PersonaAvatar = React.memo(({ uri }) => (
  <FastImage
    source={{
      uri,
      priority: FastImage.priority.high, // ⚡ 우선순위 설정
      cache: FastImage.cacheControl.immutable // ✅ 변경 없는 이미지 캐싱
    }}
    style={{ width: 60, height: 60, borderRadius: 30 }}
    resizeMode={FastImage.resizeMode.cover}
  />
));
```

#### **드레스 갤러리 (20-50개)**
```javascript
import FastImage from 'react-native-fast-image';

const DressGallery = React.memo(() => {
  const { dresses } = useDresses();
  
  // ✅ 이미지 프리로드 (FlashList 렌더링 전)
  useEffect(() => {
    const uris = dresses.map(d => ({ uri: d.image_url }));
    FastImage.preload(uris);
  }, [dresses]);
  
  return (
    <FlashList
      data={dresses}
      renderItem={({ item }) => (
        <FastImage
          source={{
            uri: item.image_url,
            cache: FastImage.cacheControl.web // ✅ 웹 캐싱 정책
          }}
          style={{ width: 100, height: 150 }}
        />
      )}
      estimatedItemSize={150}
    />
  );
});
```

---

### **4. React.memo 최적화**

#### **ChatMessage.js**
```javascript
const ChatMessage = React.memo(({ message }) => {
  // 완성된 메시지는 절대 변경되지 않음
  return (
    <View style={styles.messageContainer}>
      <Text>{message.text}</Text>
    </View>
  );
}, (prevProps, nextProps) => {
  // ✅ message.id가 같으면 리렌더링 방지
  return prevProps.message.id === nextProps.message.id;
});
```

#### **TypingMessage.js (격리)**
```javascript
const TypingMessage = React.memo(({ text }) => {
  // 타이핑 메시지만 별도 렌더링
  return (
    <View style={styles.typingContainer}>
      <Text>{text}</Text>
    </View>
  );
});
```

---

### **5. 타이핑 효과 최적화**

#### **useTypingEffect Hook**
```javascript
const useTypingEffect = (text, onComplete) => {
  const { setTypingMessage, addCompletedMessage } = useContext(ChatContext);
  const animationFrameRef = useRef(null);
  
  useEffect(() => {
    if (!text) return;
    
    let currentIndex = 0;
    const startTime = performance.now();
    
    const typeNextChar = (timestamp) => {
      // ✅ requestAnimationFrame으로 60fps 유지
      const elapsed = timestamp - startTime;
      const targetIndex = Math.floor(elapsed / 30); // 30ms per char
      
      if (targetIndex < text.length) {
        setTypingMessage(text.substring(0, targetIndex + 1));
        animationFrameRef.current = requestAnimationFrame(typeNextChar);
      } else {
        // 타이핑 완료
        addCompletedMessage({ text, role: 'ai' });
        onComplete?.();
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(typeNextChar);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [text]);
};
```

---

### **6. react-native-video 최적화**

#### **비디오 메모리 관리**
```javascript
import Video from 'react-native-video';

const PersonaVideo = React.memo(({ videoUrl, isVisible }) => {
  const videoRef = useRef(null);
  
  // ✅ 화면에서 사라질 때 일시정지
  useEffect(() => {
    if (!isVisible && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isVisible]);
  
  return (
    <Video
      ref={videoRef}
      source={{ uri: videoUrl }}
      style={styles.video}
      resizeMode="cover"
      repeat
      muted
      paused={!isVisible} // ✅ 보이지 않을 때 자동 일시정지
      // ⚡ 하드웨어 가속 활성화
      useTextureView={true} // Android only
      playInBackground={false}
      playWhenInactive={false}
    />
  );
});
```

---

## 📐 **최종 컴포넌트 구조**

```
src/
├── contexts/
│   ├── PersonaContext.js        # 페르소나 상태 (격리)
│   └── ChatContext.js            # 채팅 상태 (격리)
│
├── screens/
│   └── HomeScreen.js             # 메인 진입점
│
├── components/
│   ├── persona/
│   │   ├── PersonaSelectionChips.js  # FlashList (horizontal)
│   │   ├── PersonaChip.js            # React.memo
│   │   ├── PersonaContentViewer.js   # 스와이프 뷰어
│   │   └── PersonaDisplayView.js     # 비디오/이미지 표시
│   │
│   └── chat/
│       ├── ManagerAIChatView.js      # FlashList (vertical)
│       ├── ChatMessage.js            # React.memo (완성 메시지)
│       ├── TypingMessage.js          # React.memo (격리)
│       └── hooks/
│           └── useTypingEffect.js    # requestAnimationFrame
│
└── utils/
    └── performance.js                 # 성능 측정 도구
```

---

## 🚀 **단계별 개발 타스크**

### **📌 Phase 0: 라이브러리 설치 ✅ 완료**
- [x] FlashList 설치
- [x] FastImage 설치
- [x] react-native-video 확인

### **📌 Phase 1: Context & State 설계 (1-2일)**
- [ ] `src/contexts/PersonaContext.js` 생성
- [ ] `src/contexts/ChatContext.js` 생성
- [ ] Manager AI 기본 데이터 준비
- [ ] Context 격리 테스트

### **📌 Phase 2: Manager AI 채팅 최적화 (2-3일)**
- [ ] `ManagerAIChatView.js` (FlashList)
- [ ] `ChatMessage.js` (React.memo)
- [ ] `TypingMessage.js` (격리)
- [ ] `useTypingEffect` Hook (requestAnimationFrame)
- [ ] 리렌더링 테스트 (console.log)

### **📌 Phase 3: 페르소나 칩셋 (1-2일)**
- [ ] `PersonaSelectionChips.js` (FlashList horizontal)
- [ ] `PersonaChip.js` (React.memo + FastImage)
- [ ] Manager AI 크라운 아이콘 (👑)

### **📌 Phase 4: 스와이프 뷰어 (2-3일)**
- [ ] `PersonaContentViewer.js` (Reanimated 제스처)
- [ ] Manager AI / Persona 조건부 렌더링
- [ ] 비디오 메모리 최적화

### **📌 Phase 5: 최초 설치 플로우 (1일)**
- [ ] AsyncStorage 설치 체크
- [ ] Manager AI 환영 메시지
- [ ] 초기 페르소나 리스트 세팅

---

## 🎯 **성능 목표**

| 항목 | 목표 | 측정 방법 |
|------|------|-----------|
| **타이핑 효과** | 60fps 유지 | React DevTools Profiler |
| **FlashList 스크롤** | 60fps 유지 | React DevTools Profiler |
| **메모리 사용** | < 200MB | Android Studio Profiler |
| **초기 로딩** | < 2초 | Performance API |
| **이미지 로딩** | < 500ms | FastImage 캐싱 |

---

## 🛠️ **디버깅 도구**

### **성능 측정 유틸리티**
```javascript
// src/utils/performance.js
export const measureRenderTime = (componentName) => {
  if (__DEV__) {
    return {
      start: () => {
        console.time(`⏱️ ${componentName} Render`);
      },
      end: () => {
        console.timeEnd(`⏱️ ${componentName} Render`);
      }
    };
  }
  return { start: () => {}, end: () => {} };
};

export const logRenderCount = (componentName) => {
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    renderCountRef.current += 1;
    if (__DEV__) {
      console.log(`🔄 ${componentName} Rendered: ${renderCountRef.current} times`);
    }
  });
};
```

---

## 📚 **참고 자료**

- [FlashList Official Docs](https://shopify.github.io/flash-list/)
- [FastImage GitHub](https://github.com/DylanVann/react-native-fast-image)
- [react-native-video Docs](https://github.com/react-native-video/react-native-video)
- [React Native Performance](https://reactnative.dev/docs/performance)

---

**작성자: Hero AI 🦸**  
**최종 수정: 2024-11-21**

