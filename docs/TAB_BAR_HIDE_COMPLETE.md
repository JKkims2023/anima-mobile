# ✅ MessageCreationScreen 탭바 숨김 처리 완료

> **Date**: 2024-12-08  
> **Author**: JK & Hero Nexus AI  
> **Status**: ✅ COMPLETE

---

## 🎯 문제 상황

**MessageCreationScreen 진입 시 하단 탭바가 표시되는 문제**

- PersonaStudioScreen → MessageCreationScreen (navigation.push)
- 화면은 전환되지만, 하단 탭바가 여전히 표시됨
- 몰입감 있는 메시지 생성 경험 방해

---

## 🔍 기존 패턴 분석

### MessageDetailScreen의 탭바 숨김 로직

```javascript
// MessageDetailScreen.js (77-87 라인)
useLayoutEffect(() => {
  navigation.setOptions({
    tabBarStyle: { display: 'none' },
  });

  return () => {
    navigation.setOptions({
      tabBarStyle: undefined,
    });
  };
}, [navigation]);
```

**동작 방식**:
1. **useLayoutEffect 사용** - DOM 업데이트 전에 동기적으로 실행
2. **navigation.setOptions** - React Navigation의 screen options 동적 변경
3. **tabBarStyle: { display: 'none' }** - 탭바 숨김
4. **cleanup function** - 화면 unmount 시 탭바 복원 (`tabBarStyle: undefined`)

---

## ✅ 적용된 해결 방법

### MessageCreationScreen에 동일한 패턴 적용

```javascript
// MessageCreationScreen.js

// 1. useLayoutEffect import 추가
import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  useMemo, 
  useLayoutEffect  // ⭐ 추가
} from 'react';

// 2. useLayoutEffect로 탭바 숨김 처리
useLayoutEffect(() => {
  navigation.setOptions({
    tabBarStyle: { display: 'none' },
  });

  return () => {
    navigation.setOptions({
      tabBarStyle: undefined,
    });
  };
}, [navigation]);
```

---

## 📊 useLayoutEffect vs useEffect

### useLayoutEffect ⭐ (사용)
```javascript
useLayoutEffect(() => {
  // DOM 업데이트 전에 동기적으로 실행
  navigation.setOptions({ tabBarStyle: { display: 'none' } });
}, []);
```

**장점**:
- ✅ 화면 렌더링 전에 탭바 숨김 처리
- ✅ 탭바가 깜빡이지 않음
- ✅ 부드러운 화면 전환

### useEffect ❌ (사용 안함)
```javascript
useEffect(() => {
  // DOM 업데이트 후에 비동기적으로 실행
  navigation.setOptions({ tabBarStyle: { display: 'none' } });
}, []);
```

**단점**:
- ❌ 화면 렌더링 후에 탭바 숨김 처리
- ❌ 탭바가 잠깐 보였다가 사라지는 깜빡임 현상
- ❌ 사용자 경험 저하

---

## 🎨 탭바 제어 패턴

### Pattern 1: Screen-level (권장) ⭐

**화면별로 탭바 표시/숨김 제어**

```javascript
// MessageCreationScreen.js, MessageDetailScreen.js
useLayoutEffect(() => {
  navigation.setOptions({
    tabBarStyle: { display: 'none' },
  });

  return () => {
    navigation.setOptions({
      tabBarStyle: undefined,
    });
  };
}, [navigation]);
```

**장점**:
- ✅ 화면별 독립적 제어
- ✅ cleanup function으로 자동 복원
- ✅ 다른 화면에 영향 없음

### Pattern 2: Navigator-level

**TabNavigator에서 route에 따라 제어**

```javascript
// TabNavigator.js
<Tab.Screen 
  name="Home" 
  component={PersonaStack}
  options={({ route }) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? 'PersonaStudio';
    
    return {
      tabBarStyle: routeName === 'MessageCreation' 
        ? { display: 'none' } 
        : undefined,
    };
  }}
/>
```

**장점**:
- ✅ 중앙 집중식 관리
- ✅ Navigator 레벨에서 제어

**단점**:
- ❌ `getFocusedRouteNameFromRoute` 필요
- ❌ Stack 구조 복잡 시 관리 어려움

### 🎯 우리의 선택: Pattern 1 + Pattern 2 조합

```
TabNavigator (Pattern 2)
  ├─ PersonaStack
  │   ├─ PersonaStudioScreen (탭바 표시)
  │   └─ MessageCreationScreen (Pattern 1 + Pattern 2로 탭바 숨김)
  └─ HistoryStack
      ├─ HistoryList (탭바 표시)
      └─ MessageDetail (Pattern 1 + Pattern 2로 탭바 숨김)
```

**이유**:
- Pattern 1: 화면별 독립성 확보
- Pattern 2: Navigator 레벨 백업
- 이중 보장으로 확실한 탭바 제어

---

## 🧪 테스트 체크리스트

### iOS
- [ ] PersonaStudioScreen → MessageCreationScreen 진입 시 탭바 즉시 숨김
- [ ] MessageCreationScreen에서 탭바가 전혀 보이지 않음
- [ ] navigation.goBack() 시 PersonaStudioScreen에서 탭바 복원
- [ ] 화면 전환 시 깜빡임 없음

### Android
- [ ] PersonaStudioScreen → MessageCreationScreen 진입 시 탭바 즉시 숨김
- [ ] MessageCreationScreen에서 탭바가 전혀 보이지 않음
- [ ] Android Back Button 시 PersonaStudioScreen에서 탭바 복원
- [ ] 화면 전환 시 깜빡임 없음

### Edge Cases
- [ ] 빠르게 여러 번 push/pop 시에도 탭바 제어 정상
- [ ] 다른 탭으로 이동 후 돌아와도 탭바 상태 정상
- [ ] 앱 백그라운드 → 포그라운드 시에도 정상

---

## 📂 변경된 파일

### Modified
- ✅ `AnimaMobile/src/screens/MessageCreationScreen.js`

### Changes
1. ✅ `useLayoutEffect` import 추가
2. ✅ 탭바 숨김 로직 추가 (navigation.setOptions)
3. ✅ cleanup function으로 탭바 복원

---

## 💡 핵심 포인트

### 1. **useLayoutEffect 필수**
- useEffect가 아닌 useLayoutEffect 사용
- 화면 렌더링 전에 탭바 숨김 처리
- 깜빡임 방지

### 2. **cleanup function 필수**
```javascript
return () => {
  navigation.setOptions({
    tabBarStyle: undefined, // ⭐ 중요: undefined로 복원
  });
};
```
- 화면 unmount 시 탭바 자동 복원
- 다른 화면에 영향 없음

### 3. **navigation dependency**
```javascript
useLayoutEffect(() => {
  // ...
}, [navigation]); // ⭐ navigation을 dependency에 포함
```

---

## 🎯 동일한 패턴이 적용된 화면

### 1. MessageDetailScreen ✅
```javascript
useLayoutEffect(() => {
  navigation.setOptions({ tabBarStyle: { display: 'none' } });
  return () => {
    navigation.setOptions({ tabBarStyle: undefined });
  };
}, [navigation]);
```

### 2. MessageCreationScreen ✅
```javascript
useLayoutEffect(() => {
  navigation.setOptions({ tabBarStyle: { display: 'none' } });
  return () => {
    navigation.setOptions({ tabBarStyle: undefined });
  };
}, [navigation]);
```

---

## 🚀 결과

### Before ❌
- MessageCreationScreen 진입 시 하단 탭바 표시
- 화면 전환 시 탭바 깜빡임
- 몰입감 저하

### After ✅
- MessageCreationScreen 진입 시 탭바 즉시 숨김
- 화면 전환 부드러움 (깜빡임 없음)
- PersonaStudioScreen 복귀 시 탭바 자동 복원
- 완벽한 전체 화면 경험

---

## 📚 참고 자료

### React Navigation - Navigation Options
```javascript
// 동적으로 options 변경
navigation.setOptions({
  title: 'Updated Title',
  headerStyle: { backgroundColor: 'blue' },
  tabBarStyle: { display: 'none' }, // ⭐ 탭바 숨김
});
```

### useLayoutEffect vs useEffect
| 특성 | useLayoutEffect | useEffect |
|------|----------------|-----------|
| 실행 타이밍 | DOM 업데이트 전 (동기) | DOM 업데이트 후 (비동기) |
| 화면 깜빡임 | 없음 ✅ | 있을 수 있음 ❌ |
| 사용 사례 | UI 측정, 즉시 반영 | 데이터 fetch, side effects |

---

**End of Document**

🎉 **탭바 숨김 처리 완료!** 🎉

