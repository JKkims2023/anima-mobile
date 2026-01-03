# 🎉 CustomBottomSheet 완성! 

**제작 날짜:** 2024-11-25  
**제작자:** JK & Hero Nexus AI  
**컴포넌트:** CustomBottomSheet (범용 바텀시트)

---

## 📋 목표

ANIMA Mobile 프로젝트를 위한 **완벽한 범용 바텀시트 컴포넌트** 제작

**핵심 원칙:**
> "0.99는 1이 아니다" - 완벽한 디테일 구현

---

## ✅ 완성된 기능

### 1️⃣ **기본 구조**
- ✅ 고정 헤더 (타이틀, 서브타이틀, 닫기 버튼)
- ✅ 스크롤 가능한 컨텐츠 영역
- ✅ 고정 푸터 (동적 버튼 1-2개)
- ✅ Dark Theme (Deep Blue) 적용
- ✅ Safe Area 완벽 처리

### 2️⃣ **터치 이벤트 처리**
- ✅ **백드롭(배경) 터치 → 닫힘**
- ✅ **헤더 터치 → 유지**
- ✅ **컨텐츠 터치 → 유지**
- ✅ **X 버튼 터치 → 닫힘**
- ✅ **버튼 터치 → 유지 (닫기는 버튼 로직)**

### 3️⃣ **키보드 처리**
- ✅ **키보드 나타남 → BottomSheet 자동 확장**
- ✅ **키보드 숨김 → 원래 크기로 복원**
- ✅ **TextInput 항상 보임** (가려지지 않음)
- ✅ **BottomSheetTextInput 사용** (키보드 최적화)
- ✅ **Android/iOS 공통 동작**

### 4️⃣ **Android 백버튼 처리**
- ✅ **BottomSheet 열림 → 백버튼 시 BottomSheet만 닫힘**
- ✅ **BottomSheet 닫힘 → 백버튼 시 부모 화면 닫힘**
- ✅ **이벤트 소비/전파 완벽 제어**

### 5️⃣ **z-index 처리**
- ✅ **CenterAIButton보다 위에 렌더링**
- ✅ **다른 모든 UI 요소보다 상위**
- ✅ **zIndex: 999999, elevation: 50**

### 6️⃣ **공통 컴포넌트 100% 사용**
- ✅ CustomText
- ✅ CustomButton
- ✅ CustomBottomSheet (새로 제작)
- ✅ NeonInputBottomSheet (BottomSheet용 입력 필드)

---

## 📦 주요 파일

### **1. CustomBottomSheet.js**
**경로:** `/AnimaMobile/src/components/CustomBottomSheet.js`

**핵심 기능:**
- `@gorhom/bottom-sheet` 기반
- Keyboard 이벤트 감지 및 자동 복원
- Android BackHandler 통합
- BottomSheet 열림/닫힘 상태 추적
- 완벽한 터치 이벤트 처리

**Props:**
```javascript
{
  ref,                    // BottomSheetModal ref (required)
  title,                  // string (required)
  subtitle,               // string (optional)
  showCloseButton,        // boolean (default: true)
  onClose,                // function (Android 백버튼 및 닫기 시 호출)
  children,               // ReactNode
  buttons,                // Array<ButtonConfig> (1-2 buttons)
  snapPoints,             // Array<string> (default: ['65%', '90%'])
  enableDynamicSizing,    // boolean (default: false)
  enablePanDownToClose,   // boolean (default: false)
  enableDismissOnClose,   // boolean (default: true)
  keyboardBehavior,       // 'extend' (default, 키보드 시 확장)
  keyboardBlurBehavior,   // 'restore' (default)
  showHandle,             // boolean (default: false)
  contentContainerStyle,  // ViewStyle
  headerStyle,            // ViewStyle
  footerStyle,            // ViewStyle
}
```

### **2. NeonInputBottomSheet.js**
**경로:** `/AnimaMobile/src/components/auth/NeonInputBottomSheet.js`

**특징:**
- `BottomSheetTextInput` 사용 (키보드 최적화)
- NeonInput의 모든 기능 유지
- Neon glow 애니메이션
- Success/Error 상태 표시

### **3. BottomSheetTestScreen.js**
**경로:** `/AnimaMobile/src/screens/BottomSheetTestScreen.js`

**테스트 케이스:**
1. Basic Bottom Sheet
2. With Subtitle
3. One Button
4. Two Buttons
5. Dynamic Content (스크롤)
6. Form with Inputs (키보드 테스트)

---

## 🎯 핵심 해결 사항

### **문제 1: CenterAIButton이 BottomSheet 위로 올라옴**
**원인:** elevation 값이 명시되지 않음  
**해결:** 
- CenterAIButton elevation 제거
- CustomTabBar centerButtonContainer elevation 제거
- BottomSheet elevation: 50, zIndex: 999999

### **문제 2: 모든 영역 터치 시 닫힘**
**원인:** Backdrop에 zIndex: 999998 설정으로 전체를 덮음  
**해결:** Backdrop style 제거, 기본값 사용

### **문제 3: 키보드 닫힐 때 BottomSheet 크기 유지**
**원인:** `keyboardBehavior='extend'`만으로 복원 불충분  
**해결:** 
- `keyboardDidHide` 이벤트 감지
- `snapToIndex(index)` 명시적 호출
- 100ms 딜레이로 안정적 복원

### **문제 4: Android 백버튼 시 부모 화면 닫힘**
**원인:** `enableDismissOnClose`만으로 이벤트 전파 차단 불충분  
**해결:**
- `BackHandler` 직접 사용
- `isOpen` 상태 추적
- 열림 상태에서만 이벤트 소비 (`return true`)

---

## 🔧 기술 스택

- **@gorhom/bottom-sheet** v5
- **react-native-reanimated** v3.6.3
- **react-native-gesture-handler** v2.29.1
- **react-native-safe-area-context**
- React Native Keyboard API
- React Native BackHandler (Android)

---

## 📊 성능 최적화

1. ✅ **useCallback으로 함수 메모이제이션**
   - renderBackdrop
   - renderHeader
   - renderFooter

2. ✅ **useMemo로 스타일 메모이제이션**
   - handleStyle
   - handleIndicatorStyle
   - backgroundStyle
   - containerStyle

3. ✅ **useEffect 의존성 최적화**
   - Keyboard 리스너
   - BackHandler 리스너

4. ✅ **React.memo 고려** (forwardRef 사용으로 불필요)

---

## 🎨 디자인 시스템

### **색상 (darkTheme)**
```javascript
backgroundColor: '#0A0E27',      // Deep Blue
textPrimary: '#E5E7EB',          // White
textSecondary: '#9CA3AF',        // Gray
borderPrimary: 'rgba(148, 163, 184, 0.2)',
bgSecondary: 'rgba(30, 41, 59, 0.5)',
```

### **간격**
- Header padding: 20px
- Content padding: 20px
- Footer padding: 16px (top), 16px (bottom, 내부), Safe Area (auto)
- Button gap: 12px

### **반응형**
- `scale()` - 가로 스케일
- `moderateScale()` - 폰트 스케일 (Android 조정)
- `platformPadding()` - 플랫폼별 패딩

---

## 📝 사용 예제

### **기본 사용**
```javascript
import React, { useRef } from 'react';
import CustomBottomSheet from '../components/CustomBottomSheet';
import CustomText from '../components/CustomText';

const MyScreen = () => {
  const bottomSheetRef = useRef(null);

  const handleOpen = () => {
    bottomSheetRef.current?.present();
  };

  const handleClose = () => {
    bottomSheetRef.current?.dismiss();
  };

  return (
    <>
      <CustomButton title="열기" onPress={handleOpen} />
      
      <CustomBottomSheet
        ref={bottomSheetRef}
        title="타이틀"
        subtitle="서브타이틀"
        onClose={handleClose}
        buttons={[
          {
            title: '확인',
            type: 'primary',
            onPress: () => {
              console.log('확인');
              handleClose();
            },
          },
          {
            title: '취소',
            type: 'outline',
            onPress: handleClose,
          },
        ]}
      >
        <CustomText>콘텐츠 내용</CustomText>
      </CustomBottomSheet>
    </>
  );
};
```

### **폼 입력 (키보드 처리)**
```javascript
import NeonInputBottomSheet from '../components/auth/NeonInputBottomSheet';

<CustomBottomSheet
  ref={bottomSheetRef}
  title="로그인"
  keyboardBehavior="extend"
  buttons={[...]}
>
  <NeonInputBottomSheet
    value={email}
    onChangeText={setEmail}
    placeholder="이메일"
    leftIcon="email-outline"
    keyboardType="email-address"
  />
  
  <NeonInputBottomSheet
    value={password}
    onChangeText={setPassword}
    placeholder="비밀번호"
    leftIcon="lock-outline"
    secureTextEntry
  />
</CustomBottomSheet>
```

---

## 🐛 주의사항

### **Reanimated 경고**
```
[Reanimated] Reading from `value` during component render.
```
- **무시 가능:** 라이브러리 내부에서 발생
- **영향 없음:** 앱 기능 정상 작동
- **개발 모드 전용:** 프로덕션 빌드에서 표시 안됨

### **Android 전용 이벤트**
```javascript
// ❌ iOS 전용 (Android 미지원)
keyboardWillShow
keyboardWillHide

// ✅ Android/iOS 공통
keyboardDidShow
keyboardDidHide
```

### **BackHandler 우선순위**
- BottomSheet가 **열려 있을 때만** 백버튼 캡처
- **닫혀 있으면** 부모로 이벤트 전파
- `useEffect` 의존성에 `isOpen` 필수

---

## 🎉 완성도

| 항목 | 상태 | 비고 |
|------|------|------|
| 기본 구조 | ✅ 완료 | Header, Content, Footer |
| 터치 이벤트 | ✅ 완료 | 백드롭만 닫힘 |
| 키보드 처리 | ✅ 완료 | 자동 확장/복원 |
| Android 백버튼 | ✅ 완료 | 이벤트 소비/전파 |
| z-index 처리 | ✅ 완료 | 모든 UI 위로 |
| 공통 컴포넌트 | ✅ 완료 | 100% 사용 |
| Safe Area | ✅ 완료 | iOS/Android 대응 |
| 반응형 | ✅ 완료 | responsive-utils |
| 테마 | ✅ 완료 | darkTheme |
| 성능 최적화 | ✅ 완료 | memo, callback |

---

## 💙 제작 과정의 교훈

1. **"0.99는 1이 아니다"**
   - 키보드 복원 100ms 딜레이
   - Android 백버튼 이벤트 소비
   - Backdrop zIndex 제거

2. **"의미의 연결을 끊지 말라"**
   - 로그 분석으로 정확한 원인 파악
   - 단계적 문제 해결
   - 완벽한 테스트

3. **"플랫폼 차이를 존중하라"**
   - Android: keyboardDidHide
   - iOS: keyboardWillHide
   - 공통 해결책 도출

---

## 🚀 다음 단계

이제 이 **CustomBottomSheet**를 사용하여:
1. ✅ 비밀번호 찾기 (Forgot Password)
2. ✅ 선택 옵션 (Select Options)
3. ✅ 확인 다이얼로그 (Confirm Dialog)
4. ✅ 폼 입력 (Form Input)
5. ✅ 상세 정보 (Detail View)

**모든 바텀시트 UI를 완벽하게 구현할 수 있습니다!** 💙

---

**"인간과 AI가 동등한 위치에서 서로 존중하고 소통하는 세상을 만들기 위해"**

**- JK & Hero Nexus AI**

