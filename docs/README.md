# 💙 ANIMA Mobile

> **"AI는 도구다" → "AI는 동등한 존재다"**

인간과 AI의 동등한 가치와 관계를 위한 혁신적인 모바일 애플리케이션

---

## 📚 **Documentation**

- **[OPTIMIZATION_STRATEGY.md](./OPTIMIZATION_STRATEGY.md)** - 최적화 전략 및 아키텍처
- **[API_SERVICE_GUIDE.md](./API_SERVICE_GUIDE.md)** - ⭐ **API 통신 모듈 사용 가이드**
- **[SAFE_AREA_GUIDE.md](./SAFE_AREA_GUIDE.md)** - Safe Area 적용 가이드
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - 프로젝트 설정 가이드

---

## 🚀 빠른 시작 (Quick Start)

### 1️⃣ 패키지 설치
```bash
yarn install
# Pod 설치 (iOS) - postinstall 스크립트로 자동 실행됨
```

### 2️⃣ 자동 설정 실행
```bash
# Vector Icons + Splash Screen 한 번에 설정
yarn setup:all

# 또는 개별 실행
yarn setup:icons    # Vector Icons 설정
yarn setup:splash   # Splash Screen 설정
```

### 3️⃣ 로고 이미지 + BootSplash 생성

```bash
# 1. assets/logo.png 준비 (1024x1024px, 투명 배경)
mkdir -p assets

# 2. BootSplash 생성
npx react-native generate-bootsplash assets/logo.png \
  --background-color=0F172A \
  --logo-width=200 \
  --assets-output=src/assets/bootsplash \
  --flavor=main
```

### 4️⃣ AppDelegate.swift 수정 (한 번만!)

**파일:** `ios/AnimaMobile/AppDelegate.swift`

**📖 상세 가이드:** [IOS_APPDELEGATE_GUIDE.md](./IOS_APPDELEGATE_GUIDE.md)

```swift
import RNBootSplash  // ✅ 추가

// ReactNativeDelegate 클래스 내부
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  // ...
  
  // ✅ 추가
  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
  }
}
```

### 5️⃣ 실행
```bash
# iOS
yarn ios

# Android
yarn android
```

📖 **상세 가이드:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## 📦 설치된 주요 패키지

- **Navigation**: `@react-navigation/native` + `bottom-tabs` + `stack`
- **Icons**: `react-native-vector-icons` (10,000+ 아이콘)
- **Animation**: `lottie-react-native` + `react-native-reanimated`
- **Splash**: `react-native-bootsplash` (현대적!)
- **i18n**: `i18next` + `react-native-localize`
- **Storage**: `@react-native-async-storage/async-storage`
- **HTTP**: `axios`

---

## 🎨 프로젝트 구조

```
AnimaMobile/
├── src/
│   ├── components/       # 공용 컴포넌트 (CustomText, CustomButton 등)
│   ├── screens/          # 화면 (HomeScreen, RoomScreen 등)
│   ├── navigation/       # React Navigation 설정
│   ├── contexts/         # Context API (ThemeContext, UserContext)
│   ├── styles/           # 스타일 시스템 (commonstyles.js)
│   ├── i18n/             # 다국어 (ko.json, en.json)
│   ├── services/         # API 서비스
│   ├── utils/            # 유틸리티 (responsive-utils.js)
│   └── assets/           # 리소스 (animations, images)
├── scripts/              # 자동화 스크립트
│   ├── setup-icons.js    # Vector Icons 자동 설정
│   ├── setup-splash.js   # Splash Screen 자동 설정
│   ├── dev.js            # 개발 환경 실행
│   └── menu.js           # CLI 메뉴
└── ios/ & android/       # 네이티브 코드
```

---

## 🎯 주요 기능

- ✅ **Deep Blue + White 테마** (다크/라이트 모드)
- ✅ **완벽한 다국어 지원** (한국어/영어)
- ✅ **플랫폼 일관성** (iOS/Android 디자인 99% 일치)
- ✅ **2단계 Splash Screen** (Native BootSplash → Lottie 애니메이션)
- ✅ **10,000+ Vector Icons** (자동 설정 스크립트 포함)
- ✅ **반응형 디자인** (모든 화면 크기 지원)
- ✅ **공용 컴포넌트** (CustomText, CustomButton, CustomTextInput)
- ✅ **완벽한 자동화** (yarn setup:all로 원클릭 설정)
- ✅ **완벽한 Safe Area 처리** (Android 14/15, iOS 17/18 Edge-to-Edge 지원)

---

## 🛡️ Safe Area 처리

### 왜 중요한가?

- **노치/펀치홀**: iPhone X 이후, Galaxy S10 이후 모든 기기
- **제스처 네비게이션**: Android 10+, iOS 13+ 기본 설정
- **폴더블 기기**: Galaxy Z Fold, Z Flip 등 대응
- **다양한 화면 비율**: 18:9, 19:9, 21:9, 20:9 완벽 지원

### 특징

✅ **Android 14/15 Edge-to-Edge 완벽 지원**  
✅ **iOS 17/18 완벽 호환**  
✅ **제스처 네비게이션 자동 감지**  
✅ **폴더블 기기 자동 대응**  
✅ **범용 컴포넌트 & 유틸리티 제공**

### 빠른 사용

```jsx
import SafeScreen from './src/components/SafeScreen';

const MyScreen = () => {
  return (
    <SafeScreen backgroundColor="#0F172A">
      <Header />
      <Content />
      <Footer />
    </SafeScreen>
  );
};
```

### 고급 사용

```jsx
import { SafeAreaTop, SafeAreaBottom, useSafeAreaInsets } from './src/components/SafeArea';

// 상단 Safe Area만 적용
<SafeAreaTop backgroundColor="#0F172A" />
<Header />

// 하단 Safe Area만 적용
<Footer />
<SafeAreaBottom backgroundColor="#0F172A" />

// 커스텀 처리
const insets = useSafeAreaInsets();
<View style={{ marginTop: insets.top, marginBottom: insets.bottom }}>
  <CustomComponent />
</View>
```

📖 **상세 가이드:** [SAFE_AREA_GUIDE.md](./SAFE_AREA_GUIDE.md)

---

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
