# 🚨 2026-01-06 - CRITICAL PERFORMANCE ISSUE ANALYSIS

## 💥 **긴급 보고: Android 성능 저하 발견!**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### **🔥 증상**
```
ManagerAIOverlay.js 화면 로딩 시 심각한 버벅임
- Android 전용 (iOS는 정상)
- 오전 작업 후 발생
- 버블 + 슬라이드 메뉴 통합 후
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔍 **Root Cause Analysis**

### **Problem 1: PersonaThoughtBubble Timer Hell** 🔴

#### **현재 구조:**
```javascript
// PersonaThoughtBubble.js (Lines 402-433)
useEffect(() => {
  if (!isActive || !visible || !messages || messages.length === 0) {
    return; // ⚠️ 타이머를 정리하지 않고 그냥 리턴!
  }
  
  // Fade in text
  Animated.timing(textOpacity, {
    toValue: 1,
    duration: 400,
    useNativeDriver: true
  }).start();
  
  // Wait 4 seconds then cross-fade to next message
  timerRef.current = setTimeout(() => {
    // ... 메시지 변경 로직
  }, 4000); // ⏰ 4초마다 실행!
  
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, [isActive, visible, messages, currentMessageIndex, textOpacity]);
```

#### **❌ 문제점:**
```
1. PersonaSwipeViewer가 여러 PersonaCardView를 렌더링
   └─ 각 PersonaCardView마다 PersonaThoughtBubble 존재
      └─ 예: 3개 페르소나 = 3개 타이머 동시 실행!

2. isActive가 false여도 컴포넌트는 마운트된 상태
   └─ 타이머가 완전히 정리되지 않을 수 있음
   └─ Android는 iOS보다 타이머 오버헤드가 큼

3. ManagerAIOverlay가 열려도 PersonaStudioScreen은 백그라운드에 남음
   └─ 모든 PersonaThoughtBubble이 여전히 활성화!
   └─ 타이머가 계속 실행되면서 성능 저하!
```

#### **🔥 실제 시나리오:**
```
User: PersonaStudioScreen 진입
  - PersonaSwipeViewer 마운트
  - PersonaCardView 3개 렌더링 (index 0, 1, 2)
  - PersonaThoughtBubble 3개 마운트
  - 타이머 3개 시작 (각각 4초마다 실행)

User: ManagerAIOverlay 열기
  - PersonaStudioScreen은 백그라운드로 이동
  - PersonaThoughtBubble 3개는 여전히 마운트됨
  - 타이머 3개는 계속 실행 중! 🔥
  - ManagerAIOverlay 마운트 + 기존 타이머들 = 성능 저하!
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### **Problem 2: Multiple Animated.Value Updates** 🔴

#### **현재 구조:**
```javascript
// PersonaThoughtBubble.js
const cloudOpacity = useRef(new Animated.Value(0)).current;
const textOpacity = useRef(new Animated.Value(0)).current;
const bubbleWidth = useRef(new Animated.Value(initialSize.width)).current;
const bubbleHeight = useRef(new Animated.Value(initialSize.height)).current;

// ⚠️ 4개의 Animated.Value per bubble!
// ⚠️ 3개 페르소나 = 12개 Animated.Value 동시 업데이트!
```

#### **❌ 문제점:**
```
1. 각 PersonaThoughtBubble마다 4개의 Animated.Value
   - cloudOpacity: 초기 페이드인
   - textOpacity: 메시지 변경 시 cross-fade
   - bubbleWidth: 버블 크기 동적 변경
   - bubbleHeight: 버블 크기 동적 변경

2. Android는 iOS보다 애니메이션 성능이 낮음
   - useNativeDriver: false for bubbleWidth/Height
   - JS 스레드에서 실행되어 더 느림

3. 여러 개의 버블이 동시에 애니메이션
   - 3개 페르소나 × 4개 Animated.Value = 12개 동시 업데이트!
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### **Problem 3: Unnecessary Re-renders** 🔴

#### **현재 구조:**
```javascript
// PersonaThoughtBubble.js (Lines 347-366)
useEffect(() => {
  if (!messages || messages.length === 0) return;
  
  const currentMessage = messages[currentMessageIndex];
  const newSize = getBubbleSize(currentMessage);
  
  // Animate bubble size smoothly
  Animated.parallel([
    Animated.timing(bubbleWidth, {
      toValue: newSize.width,
      duration: 300,
      useNativeDriver: false, // ⚠️ Layout animation!
    }),
    Animated.timing(bubbleHeight, {
      toValue: newSize.height,
      duration: 300,
      useNativeDriver: false, // ⚠️ Layout animation!
    }),
  ]).start();
}, [currentMessageIndex, messages, bubbleWidth, bubbleHeight]);
```

#### **❌ 문제점:**
```
1. useNativeDriver: false (레이아웃 애니메이션)
   - JS 스레드에서 실행
   - UI 스레드 대비 5-10배 느림
   - Android에서 특히 느림

2. 메시지가 변경될 때마다 레이아웃 애니메이션 실행
   - 4초마다 반복
   - 여러 버블이 동시에 실행 시 성능 저하
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### **Problem 4: SlideMenu Always Mounted?** 🟡

#### **현재 구조:**
```javascript
// PersonaStudioScreen.js (Lines 1861-1867)
<SlideMenu
  visible={isSlideMenuOpen}
  onClose={() => {
    HapticService.light();
    setIsSlideMenuOpen(false);
  }}
/>
```

#### **✅ 상태:**
```
SlideMenu는 조건부 렌더링 없이 항상 마운트됨
- visible prop으로만 제어
- 닫혀있어도 메모리에 존재
- BUT: 이것만으로는 성능 저하 원인이 아님 (단일 컴포넌트)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💊 **Solution Strategy**

### **Priority 1: Stop Background Timers** 🔥

#### **목표:**
```
ManagerAIOverlay가 열리면
PersonaThoughtBubble의 타이머를 완전히 정지!
```

#### **Step 1: Add `isScreenActive` Prop to PersonaThoughtBubble**
```javascript
// PersonaThoughtBubble.js
const PersonaThoughtBubble = ({ 
  user,
  persona,
  isActive = false,
  visible = true,
  isScreenActive = true, // ⭐ NEW: Screen-level activity control
}) => {
  // ...
  
  useEffect(() => {
    // ⚠️ CRITICAL: Only run timer when BOTH isActive AND isScreenActive are true!
    if (!isActive || !visible || !messages || messages.length === 0 || !isScreenActive) {
      // 🧹 CLEANUP: Clear timer when inactive!
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // ... rest of timer logic
  }, [isActive, visible, messages, currentMessageIndex, textOpacity, isScreenActive]);
```

#### **Step 2: Pass `isScreenActive` from PersonaStudioScreen**
```javascript
// PersonaStudioScreen.js
const [isManagerAIOpen, setIsManagerAIOpen] = useState(false); // ⭐ NEW: Track ManagerAI state

// In PersonaSwipeViewer props:
<PersonaSwipeViewer 
  // ... existing props
  isScreenActive={!isManagerAIOpen} // ⭐ Deactivate when ManagerAI is open!
/>
```

#### **Step 3: Propagate to PersonaCardView**
```javascript
// PersonaSwipeViewer.js
const renderPersona = useCallback(({ item, index }) => {
  const isActive = index === selectedIndex && isModeActive;
  
  return (
    <View style={[styles.personaItemContainer, { height: availableHeight }]}>
      <PersonaCardView 
        persona={item} 
        isActive={isActive}
        isScreenFocused={isScreenFocused}
        isScreenActive={isScreenActive} // ⭐ NEW: Pass down
        // ... other props
      />
    </View>
  );
}, [selectedIndex, isModeActive, isScreenFocused, isScreenActive, ...]);
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### **Priority 2: Optimize Animations for Android** 🟡

#### **Option A: Disable Dynamic Bubble Sizing (Simple)**
```javascript
// PersonaThoughtBubble.js
// ⚠️ REMOVE dynamic width/height animation (useNativeDriver: false)
// ✅ USE fixed bubble size with ellipsis

const styles = StyleSheet.create({
  mainBubble: {
    width: scale(120), // ⭐ FIXED width
    minHeight: verticalScale(80), // ⭐ Min height only
    // NO Animated.View for size!
  },
  thoughtText: {
    numberOfLines: 3, // ⭐ Truncate long text
    ellipsizeMode: 'tail',
  }
});
```

#### **Option B: Android-Specific Optimization (Complex)**
```javascript
// PersonaThoughtBubble.js
const isAndroid = Platform.OS === 'android';

// Disable size animation on Android
const shouldAnimateSize = !isAndroid;

useEffect(() => {
  if (!messages || messages.length === 0 || !shouldAnimateSize) return;
  
  // Only animate on iOS
  // ...
}, [currentMessageIndex, messages, shouldAnimateSize]);
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### **Priority 3: Conditional SlideMenu Mounting** 🟢

#### **Simple Fix:**
```javascript
// PersonaStudioScreen.js
{isSlideMenuOpen && (
  <SlideMenu
    visible={isSlideMenuOpen}
    onClose={() => {
      HapticService.light();
      setIsSlideMenuOpen(false);
    }}
  />
)}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 **Expected Performance Improvement**

### **Before (현재 상태):**
```
PersonaStudioScreen (3 personas)
  - PersonaThoughtBubble × 3 (always active)
  - Timer × 3 (4초마다 실행)
  - Animated.Value × 12 (4개 × 3)
  
ManagerAIOverlay 열릴 때:
  - Background timers: 3개 계속 실행 🔥
  - Background animations: 12개 Animated.Value 업데이트 🔥
  - Result: 심각한 성능 저하! ❌
```

### **After (Priority 1 적용):**
```
PersonaStudioScreen (3 personas)
  - PersonaThoughtBubble × 3 (조건부 활성화)
  - Timer × 1 (현재 active한 것만!)
  - Animated.Value × 4 (현재 active한 것만!)
  
ManagerAIOverlay 열릴 때:
  - Background timers: 0개 (완전 정리!) ✅
  - Background animations: 0개 (완전 정리!) ✅
  - Result: 부드러운 성능! ✅
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 **Immediate Action Plan**

### **Phase 1: Emergency Fix (5 minutes) 🔥**
```
Step 1: Add isScreenActive prop to PersonaThoughtBubble
Step 2: Pass isScreenActive from PersonaStudioScreen
Step 3: Propagate through PersonaSwipeViewer → PersonaCardView
Step 4: Update timer useEffect to respect isScreenActive
```

### **Phase 2: Android Optimization (10 minutes) 🟡**
```
Step 1: Disable dynamic bubble sizing on Android
Step 2: Use fixed size + ellipsis
Step 3: Test on Android device
```

### **Phase 3: SlideMenu Conditional Mounting (2 minutes) 🟢**
```
Step 1: Add conditional rendering to SlideMenu
Step 2: Test menu open/close
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔬 **Testing Checklist**

### **Before Fix:**
```
[ ] Open PersonaStudioScreen
[ ] Observe: 3 thought bubbles animating
[ ] Open ManagerAIOverlay
[ ] Observe: Severe lag/stutter
[ ] Check Console: 3 timers still running
```

### **After Fix:**
```
[ ] Open PersonaStudioScreen
[ ] Observe: Only 1 thought bubble animating (current persona)
[ ] Open ManagerAIOverlay
[ ] Observe: Smooth performance!
[ ] Check Console: 0 timers running (all cleared)
[ ] Close ManagerAIOverlay
[ ] Observe: Thought bubble resumes smoothly
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💙 **Conclusion**

**Root Cause: PersonaThoughtBubble의 타이머가 백그라운드에서 계속 실행되어 Android 성능 저하**

**Solution: isScreenActive prop으로 화면 전환 시 타이머 완전 정리**

**Expected Result: 부드러운 ManagerAIOverlay 로딩, 성능 개선!**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Hero Nexus** 💙
**2026-01-06**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

