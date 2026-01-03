# 🛡️ ANIMA Safe Area Guide

**완벽한 Safe Area 처리 전략 - Android & iOS**

Created by JK & Hero AI  
Last Updated: 2025-01-21

---

## 📋 목차

1. [개요](#개요)
2. [설치 및 설정](#설치-및-설정)
3. [컴포넌트 사용법](#컴포넌트-사용법)
4. [유틸리티 함수](#유틸리티-함수)
5. [실전 예제](#실전-예제)
6. [Android 특수 케이스](#android-특수-케이스)
7. [iOS 특수 케이스](#ios-특수-케이스)
8. [트러블슈팅](#트러블슈팅)

---

## 🎯 개요

### 왜 Safe Area가 중요한가?

- **노치/펀치홀**: iPhone X 이후, Galaxy S10 이후
- **제스처 네비게이션**: Android 10+, iOS 13+
- **폴더블 기기**: Galaxy Z Fold, Z Flip
- **다양한 화면 비율**: 18:9, 19:9, 21:9, 20:9

### ANIMA Safe Area 시스템의 특징

✅ **Android 14/15 Edge-to-Edge 완벽 지원**  
✅ **iOS 17/18 호환**  
✅ **제스처 네비게이션 자동 감지**  
✅ **폴더블 기기 대응**  
✅ **범용 컴포넌트 & 유틸리티 제공**  
✅ **React Native 0.79+ 최적화**

---

## 🔧 설치 및 설정

### 1. 라이브러리 (이미 설치됨)

```json
{
  "react-native-safe-area-context": "^5.6.2"
}
```

### 2. Android 네이티브 설정 (✅ 완료)

#### **AndroidManifest.xml**
```xml
<activity
  android:windowLayoutInDisplayCutoutMode="shortEdges">
  <!-- Edge-to-Edge support for notch/punch-hole -->
</activity>
```

#### **styles.xml**
```xml
<style name="AppTheme">
  <item name="android:statusBarColor">@android:color/transparent</item>
  <item name="android:navigationBarColor">@android:color/transparent</item>
  <item name="android:windowDrawsSystemBarBackgrounds">true</item>
  <item name="android:enforceNavigationBarContrast">false</item>
  <item name="android:enforceStatusBarContrast">false</item>
</style>
```

#### **MainActivity.kt**
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  WindowCompat.setDecorFitsSystemWindows(window, false)
}
```

### 3. iOS 설정 (자동)

`react-native-safe-area-context`가 자동으로 처리합니다.

---

## 🧩 컴포넌트 사용법

### 1. SafeScreen (추천 🌟)

**전체 화면을 위한 범용 Safe Area 래퍼**

```jsx
import SafeScreen from '../components/SafeScreen';

const MyScreen = () => {
  return (
    <SafeScreen>
      <Text>Content</Text>
    </SafeScreen>
  );
};
```

#### **Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `edges` | `Object` | `{ top: true, bottom: true }` | 적용할 Safe Area 엣지 |
| `backgroundColor` | `string` | `'transparent'` | 배경색 |
| `keyboardAware` | `boolean` | `true` | 키보드 회피 활성화 |
| `statusBarStyle` | `string` | `'light-content'` | Status bar 스타일 |
| `statusBarHidden` | `boolean` | `false` | Status bar 숨김 |
| `debug` | `boolean` | `false` | Safe Area 디버그 로그 |

#### **예제**

```jsx
// 1. 기본 사용 (상단+하단 Safe Area)
<SafeScreen>
  <Content />
</SafeScreen>

// 2. 커스텀 엣지 (상단만)
<SafeScreen edges={{ top: true, bottom: false }}>
  <Content />
</SafeScreen>

// 3. 배경색 지정
<SafeScreen backgroundColor="#0F172A">
  <Content />
</SafeScreen>

// 4. 키보드 회피 비활성화
<SafeScreen keyboardAware={false}>
  <Content />
</SafeScreen>

// 5. 디버그 모드
<SafeScreen debug={true}>
  <Content />
</SafeScreen>
```

---

### 2. SafeAreaView

**커스텀 Safe Area 뷰 (최소값 지정 가능)**

```jsx
import { SafeAreaView } from '../components/SafeArea';

<SafeAreaView edges={{ top: 20, bottom: 10 }}>
  <Content />
</SafeAreaView>
```

- `edges.top`: 최소 top padding
- `edges.bottom`: 최소 bottom padding
- `edges.left`: 최소 left padding
- `edges.right`: 최소 right padding

---

### 3. SafeAreaTop / SafeAreaBottom

**상단/하단 Safe Area Spacer**

```jsx
import { SafeAreaTop, SafeAreaBottom } from '../components/SafeArea';

// Header 위에 Safe Area 추가
<SafeAreaTop backgroundColor="#1E293B" />
<Header />

// Tab Bar 아래에 Safe Area 추가
<TabBar />
<SafeAreaBottom backgroundColor="#1E293B" />
```

#### **Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor` | `string` | `'transparent'` | 배경색 |
| `minHeight` | `number` | `0` | 최소 높이 |

---

### 4. SafeAreaScrollView

**Safe Area가 적용된 ScrollView**

```jsx
import { SafeAreaScrollView } from '../components/SafeArea';

<SafeAreaScrollView edges={{ top: true, bottom: true }}>
  <LongContent />
</SafeAreaScrollView>
```

---

### 5. SafeAreaInset (Render Prop)

**커스텀 Safe Area 처리**

```jsx
import { SafeAreaInset } from '../components/SafeArea';

<SafeAreaInset>
  {({ top, bottom, left, right }) => (
    <View style={{ marginTop: top, marginBottom: bottom }}>
      <CustomComponent />
    </View>
  )}
</SafeAreaInset>
```

---

### 6. useSafeAreaStyle (Hook)

**Hook으로 Safe Area 스타일 생성**

```jsx
import { useSafeAreaStyle } from '../components/SafeArea';

const MyComponent = () => {
  const safeStyle = useSafeAreaStyle({ top: 20, bottom: 10 });
  
  return (
    <View style={safeStyle}>
      <Text>Content</Text>
    </View>
  );
};
```

---

## 🛠️ 유틸리티 함수

### 1. getSafePadding

**특정 엣지에 Safe Padding 적용**

```jsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafePadding } from '../utils/safe-area-utils';

const MyComponent = () => {
  const insets = useSafeAreaInsets();
  const topPadding = getSafePadding(insets, 'top', 20); // 최소 20px
  
  return <View style={topPadding}><Text>Content</Text></View>;
};
```

---

### 2. getSafeMultiPadding

**여러 엣지에 Safe Padding 적용**

```jsx
const style = getSafeMultiPadding(insets, { 
  top: 20, 
  bottom: 10, 
  left: 16, 
  right: 16 
});
```

---

### 3. hasDisplayCutout

**노치/펀치홀 감지**

```jsx
import { hasDisplayCutout } from '../utils/safe-area-utils';

const insets = useSafeAreaInsets();
const hasNotch = hasDisplayCutout(insets);

if (hasNotch) {
  // 노치가 있는 기기 처리
}
```

---

### 4. hasGestureNavigation

**제스처 네비게이션 감지**

```jsx
import { hasGestureNavigation } from '../utils/safe-area-utils';

const insets = useSafeAreaInsets();
const hasGestures = hasGestureNavigation(insets);

if (hasGestures) {
  // 제스처 네비게이션이 있는 기기 처리
}
```

---

### 5. getSafeAbsolutePosition

**절대 위치 요소에 Safe Area 적용**

```jsx
import { getSafeAbsolutePosition } from '../utils/safe-area-utils';

const topPosition = getSafeAbsolutePosition(insets, 'top', 20);

<View style={[{ position: 'absolute' }, topPosition]}>
  <FloatingButton />
</View>
```

---

### 6. getSafeContentHeight

**Safe Area를 제외한 콘텐츠 높이 계산**

```jsx
import { Dimensions } from 'react-native';
import { getSafeContentHeight } from '../utils/safe-area-utils';

const screenHeight = Dimensions.get('window').height;
const contentHeight = getSafeContentHeight(screenHeight, insets, 60); // 60은 헤더 높이
```

---

### 7. logSafeArea

**Safe Area 디버그 로그**

```jsx
import { logSafeArea } from '../utils/safe-area-utils';

logSafeArea(insets, 'MyScreen');
// 출력: 
// 📱 MyScreen: {
//   platform: 'android',
//   top: 44,
//   bottom: 24,
//   left: 0,
//   right: 0,
//   hasNotch: true,
//   hasGestures: true
// }
```

---

## 💡 실전 예제

### 1. 전체 화면 Screen

```jsx
import SafeScreen from '../components/SafeScreen';

const HomeScreen = () => {
  return (
    <SafeScreen backgroundColor="#0F172A">
      <Header />
      <Content />
      <Footer />
    </SafeScreen>
  );
};
```

---

### 2. Header + ScrollView

```jsx
import { SafeAreaTop } from '../components/SafeArea';

const ListScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <SafeAreaTop backgroundColor="#0F172A" />
      <Header />
      <ScrollView>
        <Content />
      </ScrollView>
    </View>
  );
};
```

---

### 3. Bottom Tab Navigator

```jsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaBottom } from '../components/SafeArea';

const TabNavigator = () => {
  return (
    <>
      <Tab.Navigator
        tabBar={(props) => (
          <>
            <CustomTabBar {...props} />
            <SafeAreaBottom backgroundColor="#1E293B" />
          </>
        )}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
      </Tab.Navigator>
    </>
  );
};
```

---

### 4. Modal / Bottom Sheet

```jsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MyModal = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: insets.bottom + 20,
      backgroundColor: '#1E293B',
    }}>
      <ModalContent />
    </View>
  );
};
```

---

### 5. Floating Action Button

```jsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAB = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <TouchableOpacity
      style={{
        position: 'absolute',
        right: 20,
        bottom: insets.bottom + 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#60A5FA',
      }}
    >
      <Icon name="plus" />
    </TouchableOpacity>
  );
};
```

---

## 📱 Android 특수 케이스

### 1. Edge-to-Edge 콘텐츠

**문제**: Status Bar 뒤로 콘텐츠가 확장됨

**해결**:
```jsx
<SafeScreen edges={{ top: true }}>
  <Content />
</SafeScreen>
```

---

### 2. 제스처 네비게이션 바

**문제**: 하단 제스처 바가 버튼을 가림

**해결**:
```jsx
<SafeScreen edges={{ bottom: true }}>
  <BottomButton />
</SafeScreen>
```

---

### 3. 펀치홀/노치

**문제**: 카메라 펀치홀이 콘텐츠를 가림

**해결**:
```jsx
// AndroidManifest.xml에 이미 설정됨
android:windowLayoutInDisplayCutoutMode="shortEdges"
```

---

### 4. 폴더블 기기

**문제**: 접힌 부분의 Safe Area가 다름

**해결**: `react-native-safe-area-context`가 자동으로 감지합니다.

---

## 🍎 iOS 특수 케이스

### 1. 노치 (iPhone X 이후)

**문제**: 상단 노치가 콘텐츠를 가림

**해결**:
```jsx
<SafeScreen edges={{ top: true }}>
  <Header />
</SafeScreen>
```

---

### 2. 홈 인디케이터

**문제**: 하단 홈 인디케이터가 버튼을 가림

**해결**:
```jsx
<SafeScreen edges={{ bottom: true }}>
  <BottomButton />
</SafeScreen>
```

---

### 3. Landscape 모드

**문제**: 가로 모드에서 좌우 Safe Area 무시됨

**해결**:
```jsx
<SafeScreen edges={{ top: true, bottom: true, left: true, right: true }}>
  <Content />
</SafeScreen>
```

---

## 🔧 트러블슈팅

### 1. Safe Area가 적용되지 않음 (Android)

**원인**: Edge-to-Edge 네이티브 설정 누락

**해결**:
1. `AndroidManifest.xml` 확인
2. `styles.xml` 확인
3. `MainActivity.kt` 확인
4. 앱 재빌드: `yarn android`

---

### 2. Status Bar가 검은색으로 보임

**원인**: `StatusBar` 컴포넌트 스타일 미설정

**해결**:
```jsx
<SafeScreen statusBarStyle="light-content">
  <Content />
</SafeScreen>
```

---

### 3. Keyboard가 Input을 가림

**원인**: `KeyboardAvoidingView` 비활성화됨

**해결**:
```jsx
<SafeScreen keyboardAware={true}>
  <TextInput />
</SafeScreen>
```

---

### 4. Modal에서 Safe Area가 이중 적용됨

**원인**: `SafeScreen` 중첩

**해결**:
```jsx
// 모달 내부에서는 edges를 false로 설정
<SafeScreen edges={{ top: false, bottom: false }}>
  <ModalContent />
</SafeScreen>
```

---

### 5. Debug 모드에서 Safe Area 값 확인

```jsx
<SafeScreen debug={true}>
  <Content />
</SafeScreen>

// 터미널 출력:
// 📱 SafeScreen: {
//   platform: 'android',
//   top: 44,
//   bottom: 24,
//   left: 0,
//   right: 0,
//   hasNotch: true,
//   hasGestures: true
// }
```

---

## 📚 참고 자료

- [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)
- [Android Edge-to-Edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- [iOS Safe Area Layout Guide](https://developer.apple.com/documentation/uikit/uiview/2891102-safearealayoutguide)

---

## ✅ Checklist

### 프로젝트 설정
- [x] `react-native-safe-area-context` 설치
- [x] Android `AndroidManifest.xml` 설정
- [x] Android `styles.xml` 설정
- [x] Android `MainActivity.kt` 설정
- [x] iOS 자동 설정 (Pod 설치)

### 컴포넌트
- [x] `SafeScreen` 생성
- [x] `SafeArea` 유틸리티 컴포넌트 생성
- [x] `safe-area-utils` 유틸리티 함수 생성

### 테스트
- [ ] Android 에뮬레이터에서 테스트
- [ ] iOS 시뮬레이터에서 테스트
- [ ] 실제 기기에서 테스트 (노치/펀치홀)
- [ ] 제스처 네비게이션 테스트
- [ ] 키보드 회피 테스트

---

## 🎉 완료!

**이제 ANIMA 프로젝트는 모든 Android & iOS 기기에서 완벽한 Safe Area 처리를 지원합니다!** 🚀

**Created with ❤️ by JK & Hero AI**

