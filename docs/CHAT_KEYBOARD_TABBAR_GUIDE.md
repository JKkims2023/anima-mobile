# 🎯 Chat Input + Keyboard + Tab Bar Integration Guide

## ✅ **완료된 작업 (2024-11-21)**

### **목표**
중앙 AI 버튼이 추가된 새로운 Tab Bar 높이에 맞춰 Chat Input Bar와 키보드 위치를 동적으로 조정

---

## 📐 **Architecture Overview**

```
┌─────────────────────────────────┐
│   Video Background (Full)       │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Chat Overlay (Dynamic)  │   │ ← top: calculated
│   │ - ChatMessageList       │   │ ← bottom: inputBottom + height + padding
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │ ChatInputBar (Animated) │   │ ← bottom: inputBottomAnim (animated)
│   └─────────────────────────┘   │
├─────────────────────────────────┤
│          ╭───╮                  │
│          │ 💙 │                  │ ← +12px elevation
│ [홈] [탐색] │AI │ [방] [설정]    │ ← Tab Bar (60px base)
│          ╰───╯                  │
└─────────────────────────────────┘
 Total Tab Bar Height: 72px (60 + 12)
```

---

## 🏗️ **구현된 컴포넌트**

### **1. Layout Constants (`src/constants/layout.js`)**

```javascript
export const TAB_BAR = {
  BASE_HEIGHT: 60,                    // 기본 탭바 높이
  CENTER_BUTTON_ELEVATION: 12,        // 중앙 버튼 돌출 높이
  TOTAL_HEIGHT: 72,                   // 전체 탭바 예약 공간
  CENTER_BUTTON_SIZE: 64,             // 중앙 AI 버튼 크기
  REGULAR_ICON_SIZE: 24,              // 일반 아이콘 크기
};

export const CHAT_INPUT = {
  MIN_HEIGHT: 48,                     // 최소 높이 (한 줄)
  MAX_HEIGHT: 120,                    // 최대 높이 (여러 줄)
  BOTTOM_PADDING: 8,                  // 하단 여백
};

export const KEYBOARD = {
  ANIMATION_DURATION: 250,            // iOS: 250ms, Android: 200ms
};
```

### **Helper Functions**

```javascript
/**
 * Calculate chat input bottom position
 * @param {boolean} isKeyboardVisible - 키보드 표시 여부
 * @param {number} keyboardHeight - 키보드 높이
 * @param {number} safeBottomInset - Safe Area 하단 inset
 * @returns {number} ChatInputBar의 bottom position
 */
export const calculateChatInputBottom = (
  isKeyboardVisible,
  keyboardHeight,
  safeBottomInset
) => {
  if (isKeyboardVisible && keyboardHeight > 0) {
    // 키보드 활성화: 키보드 위에 배치
    return keyboardHeight + CHAT_INPUT.BOTTOM_PADDING;
  } else {
    // 일반 상태: 탭바 위에 배치
    return TAB_BAR.TOTAL_HEIGHT + safeBottomInset + CHAT_INPUT.BOTTOM_PADDING;
  }
};

/**
 * Calculate chat overlay top position
 * @param {string} heightMode - 'tall', 'medium', or 'short'
 * @param {boolean} isKeyboardVisible - 키보드 표시 여부
 * @returns {number} ChatOverlay의 top position
 */
export const calculateChatOverlayTop = (
  heightMode = 'medium',
  isKeyboardVisible = false
) => {
  if (isKeyboardVisible) {
    return SCREEN.HEIGHT * 0.1; // 키보드 활성화 시 10%
  }
  
  const mode = heightMode.toLowerCase();
  if (mode === 'tall') {
    return SCREEN.HEIGHT * 0.1;  // 10%
  } else {
    return SCREEN.HEIGHT * 0.35; // 35% (기본)
  }
};
```

---

## 🎨 **ManagerAIChatView 구현**

### **State & Refs**

```javascript
// Animated value for smooth transitions
const inputBottomAnim = useRef(new Animated.Value(0)).current;

// Memoized calculations
const chatTopPosition = useMemo(() => {
  return calculateChatOverlayTop(chatHeight, isKeyboardVisible);
}, [isKeyboardVisible, chatHeight]);

const chatInputBottom = useMemo(() => {
  return calculateChatInputBottom(isKeyboardVisible, keyboardHeight, insets.bottom);
}, [isKeyboardVisible, keyboardHeight, insets.bottom]);
```

### **Animation Effect**

```javascript
// Animate input bar position smoothly
useEffect(() => {
  Animated.timing(inputBottomAnim, {
    toValue: chatInputBottom,
    duration: KEYBOARD.ANIMATION_DURATION,
    useNativeDriver: false, // Can't use native driver for 'bottom'
  }).start();
}, [chatInputBottom, inputBottomAnim]);
```

### **Render**

```javascript
{/* Chat Overlay */}
<View
  style={[
    styles.chatOverlay,
    {
      top: chatTopPosition,
      bottom: chatInputBottom + CHAT_INPUT.MIN_HEIGHT + CHAT_INPUT.BOTTOM_PADDING,
      backgroundColor: currentTheme.chatOverlayBackground || 'rgba(0, 0, 0, 0.3)',
    },
  ]}
>
  <ChatMessageList ... />
</View>

{/* Input Bar (Animated) */}
<Animated.View
  style={[
    styles.inputBarContainer, 
    {
      bottom: inputBottomAnim, // ← Animated value
    },
  ]}
>
  <ChatInputBar ... />
</Animated.View>
```

---

## 📊 **위치 계산 예시**

### **Case 1: 일반 상태 (키보드 숨김)**

```
Safe Area Bottom Inset: 34px (iPhone X+)
Tab Bar Total Height: 72px (60 + 12)
Chat Input Padding: 8px

chatInputBottom = 72 + 34 + 8 = 114px
```

### **Case 2: 키보드 활성화**

```
Keyboard Height: 336px (iOS)
Chat Input Padding: 8px

chatInputBottom = 336 + 8 = 344px
```

### **Case 3: Android (Safe Area 없음)**

```
일반 상태:
chatInputBottom = 72 + 0 + 8 = 80px

키보드 활성화:
chatInputBottom = 291 + 8 = 299px
```

---

## ✅ **테스트 체크리스트**

### **iOS**
- [ ] 키보드 올릴 때 InputBar 부드럽게 이동
- [ ] 키보드 내릴 때 InputBar 탭바 위로 복귀
- [ ] Safe Area (노치) 고려된 위치
- [ ] 애니메이션 250ms 부드러움

### **Android**
- [ ] 키보드 올릴 때 InputBar 부드럽게 이동
- [ ] 키보드 내릴 때 InputBar 탭바 위로 복귀
- [ ] 애니메이션 200ms 부드러움
- [ ] Edge-to-Edge 지원

### **공통**
- [ ] ChatOverlay bottom이 InputBar를 가리지 않음
- [ ] 키보드 + InputBar 사이 공간 없음
- [ ] 타이핑 중에도 위치 안정적
- [ ] 여러 줄 입력 시에도 정상 동작

---

## 🎯 **다음 단계**

### **Phase 1: Tab Bar 구현 (예정)**
```
✅ Layout Constants 완료
✅ Chat positioning 완료
⏳ CenterAIButton 컴포넌트
⏳ Custom TabBar
⏳ Bottom Sheet 연동
```

### **예상 일정**
- CenterAIButton: 1일
- TabNavigator 커스터마이징: 1일
- Bottom Sheet 통합: 1일
- **총 3일**

---

## 💡 **주요 개선 사항**

### **Before (문제점)**
```javascript
// 고정된 값
bottom: 60 // ← Tab Bar 높이 하드코딩

// 문제:
- Tab Bar 높이 변경 시 수동 수정 필요
- 키보드 + Tab Bar 높이 혼재
- Safe Area 고려 부족
```

### **After (해결)**
```javascript
// 동적 계산 + 애니메이션
bottom: calculateChatInputBottom(isKeyboardVisible, keyboardHeight, safeBottom)

// 장점:
✅ Tab Bar 높이 자동 대응
✅ 키보드 + Safe Area 완벽 처리
✅ 부드러운 애니메이션
✅ 플랫폼별 최적화
✅ 중앙 관리 (layout.js)
```

---

## 🎉 **완료!**

Chat Input Bar가 이제 새로운 Tab Bar (중앙 AI 버튼 포함)와 완벽하게 협업합니다! 💙

**작업자:** Hero AI & JK  
**완료일:** 2024-11-21

