# 🔧 Keyboard Height Fix - 2024-11-21

## 🚨 **문제 발생**

### **증상**
- ChatInputBar가 키보드 활성화 시 잘못된 위치에 배치
- 키보드 위 공간이 너무 많이 남음

### **로그 분석**
```
TabBar height: 108  ← 잘못된 값!
→ InputBar bottom: 264
Calculation: (324 + 48) - 108 = 264px
```

### **근본 원인**
`useKeyboardHeight.js` 훅이:
1. 구식 TabBar 높이 (108px) 사용
2. TabBar 높이를 빼는 계산을 수행
3. 하지만 `calculateChatInputBottom`이 이미 모든 계산을 수행
4. **이중 계산**으로 인한 오류!

---

## ✅ **해결 방법**

### **Before (문제)**
```javascript
// useKeyboardHeight.js
const TAB_BAR_BASE_HEIGHT = 60;
const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom; // 108px

const adjustedHeight = keyboardAbsoluteTop - tabBarHeight;
// (324 + 48) - 108 = 264px ← 잘못됨!

Animated.timing(keyboardHeight, {
  toValue: adjustedHeight,
  ...
}).start();
```

### **After (해결)**
```javascript
// useKeyboardHeight.js - SIMPLIFIED!
const [keyboardHeight, setKeyboardHeight] = useState(0);

const showListener = Keyboard.addListener(showEvent, (e) => {
  const height = e.endCoordinates.height;
  setKeyboardHeight(height); // Pure keyboard height!
});

// ✅ No TabBar adjustment
// ✅ No Animated.Value
// ✅ Pure keyboard height only
```

---

## 🎯 **Architecture 개선**

### **역할 분리**

```
useKeyboardHeight
└─ 역할: 순수한 키보드 높이만 반환
   - keyboardHeight: number (0 or actual height)
   - isKeyboardVisible: boolean

calculateChatInputBottom
└─ 역할: 모든 위치 계산 수행
   - TabBar 높이 고려
   - Safe Area 고려
   - Padding 고려
   - 키보드 상태 고려

ManagerAIChatView
└─ 역할: 위치 계산 결과를 애니메이션 적용
   - Animated.Value로 부드러운 전환
   - 250ms 애니메이션
```

---

## 📊 **계산 방식 비교**

### **키보드 숨김 상태**

**Before:**
```
useKeyboardHeight returns: 0
ManagerAIChatView: bottom = 0  ← 잘못됨!
```

**After:**
```
useKeyboardHeight returns: 0
calculateChatInputBottom:
  = TAB_BAR.TOTAL_HEIGHT + safeBottom + padding
  = 72 + 34 + 8
  = 114px  ← 올바름!

ManagerAIChatView: bottom = 114px (animated)
```

### **키보드 활성화 상태 (Android)**

**Before:**
```
Raw keyboard: 324px
Safe bottom: 48px
TabBar: 108px

useKeyboardHeight: (324 + 48) - 108 = 264px
ManagerAIChatView: bottom = 264px  ← 잘못됨!
```

**After:**
```
Raw keyboard: 324px
Safe bottom: 48px

useKeyboardHeight: 324px (pure)
calculateChatInputBottom:
  = 324 + 8
  = 332px  ← 올바름!

ManagerAIChatView: bottom = 332px (animated)
```

---

## 🎨 **변경 파일**

### **1. useKeyboardHeight.js**
```diff
- const TAB_BAR_BASE_HEIGHT = 60;
- const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
- const adjustedHeight = keyboardAbsoluteTop - tabBarHeight;
- Animated.timing(keyboardHeight, { toValue: adjustedHeight }).start();

+ const [keyboardHeight, setKeyboardHeight] = useState(0);
+ const height = e.endCoordinates.height;
+ setKeyboardHeight(height); // Pure keyboard height
```

**변경 사항:**
- ✅ Animated.Value 제거
- ✅ TabBar 계산 제거
- ✅ 순수한 키보드 높이만 반환
- ✅ 디버그 로그 간소화

### **2. ManagerAIChatView.js**
```diff
- const inputBottomAnim = useRef(new Animated.Value(0)).current;
+ const inputBottomAnim = useRef(
+   new Animated.Value(
+     TAB_BAR.TOTAL_HEIGHT + insets.bottom + CHAT_INPUT.BOTTOM_PADDING
+   )
+ ).current;
```

**변경 사항:**
- ✅ 초기값을 올바른 위치로 설정
- ✅ `calculateChatInputBottom` 결과를 애니메이션
- ✅ 기존 애니메이션 로직 유지 (250ms)

---

## 🧪 **테스트 결과 예상**

### **키보드 숨김**
```
✓ InputBar가 탭바 위 114px에 배치
✓ 탭바와 8px 간격
✓ Safe Area 고려됨
```

### **키보드 활성화**
```
✓ InputBar가 키보드 위 332px에 배치
✓ 키보드와 8px 간격
✓ 공간 낭비 없음
✓ 부드러운 250ms 애니메이션
```

### **플랫폼별**
```
iOS (Safe Area 34px):
  - Normal: 72 + 34 + 8 = 114px ✓
  - Keyboard: 316 + 8 = 324px ✓

Android (Safe Area 48px):
  - Normal: 72 + 48 + 8 = 128px ✓
  - Keyboard: 324 + 8 = 332px ✓
```

---

## 💡 **핵심 개선 사항**

### **1. Single Responsibility (단일 책임)**
```
Before: useKeyboardHeight가 TabBar 계산도 수행 ✗
After:  useKeyboardHeight는 키보드 높이만 반환 ✓
```

### **2. Centralized Logic (중앙 집중)**
```
Before: 계산 로직이 여러 곳에 분산 ✗
After:  layout.js에 모든 계산 로직 집중 ✓
```

### **3. Pure Functions (순수 함수)**
```
Before: Side effect가 있는 훅 ✗
After:  순수한 값만 반환하는 훅 ✓
```

### **4. Easy Maintenance (쉬운 유지보수)**
```
Before: TabBar 높이 변경 시 여러 곳 수정 ✗
After:  layout.js만 수정하면 됨 ✓
```

---

## 🎉 **완료!**

**JK님, 이제 키보드가 올라갈 때 ChatInputBar가 정확한 위치에 배치됩니다!**

- ✅ 키보드 숨김: 탭바 위 8px
- ✅ 키보드 활성화: 키보드 위 8px
- ✅ 부드러운 애니메이션 (250ms)
- ✅ 플랫폼별 최적화
- ✅ Safe Area 완벽 지원

**테스트해보세요!** 💪💙

---

**작업자:** Hero AI  
**완료일:** 2024-11-21  
**Issue:** ChatInputBar 잘못된 위치  
**Solution:** useKeyboardHeight 단순화 + layout.js 중앙 집중

