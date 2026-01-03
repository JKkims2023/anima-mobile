# 📱 iOS AppDelegate.swift 설정 가이드

**JK님의 이전 프로젝트 구조를 활용한 완벽한 가이드**

---

## 🎯 **목표**

RNBootSplash를 JK님의 기존 구조에 통합합니다.

---

## 📝 **AnimaMobile AppDelegate.swift 수정**

**파일 위치:** `ios/AnimaMobile/AppDelegate.swift`

### **전체 코드:**

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import RNBootSplash

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  
  private var reactNativeDelegate: ReactNativeDelegate?
  private var reactNativeFactory: RCTReactNativeFactory?
  
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)
    
    // React Native UI 초기화
    factory.startReactNative(
      withModuleName: "AnimaMobile",  // ✅ 프로젝트 이름으로 변경
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

// MARK: - ReactNativeDelegate
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
  
  // ✅ BootSplash 통합
  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
  }
}
```

---

## 🔍 **변경 사항 요약**

### **1. Import 추가**
```swift
import RNBootSplash  // ✅ 추가
```

### **2. moduleName 변경**
```swift
// 기존 (ecocentrePoint)
factory.startReactNative(
  withModuleName: "ecocentrePoint",
  in: window,
  launchOptions: launchOptions
)

// 변경 후 (AnimaMobile)
factory.startReactNative(
  withModuleName: "AnimaMobile",  // ✅ 변경
  in: window,
  launchOptions: launchOptions
)
```

### **3. customize 메서드 추가**
```swift
override func customize(_ rootView: RCTRootView) {
  super.customize(rootView)
  RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)  // ✅ 추가
}
```

### **4. Firebase/FCM 제거** (현재 프로젝트에 불필요)
```swift
// ❌ 제거 (필요 시 나중에 추가)
// import FirebaseCore
// import FirebaseMessaging
// import UserNotifications
// FirebaseApp.configure()
// Messaging.messaging().delegate = self
// UNUserNotificationCenter.current().delegate = self
```

---

## 🎨 **BootSplash 리소스 생성**

### **1. 로고 이미지 준비**

**요구사항:**
- 파일명: `logo.png`
- 위치: `AnimaMobile/assets/logo.png`
- 크기: 최소 1024x1024px (정사각형)
- 배경: 투명 (PNG)

### **2. BootSplash 생성 명령어**

```bash
npx react-native generate-bootsplash assets/logo.png \
  --background-color=0F172A \
  --logo-width=200 \
  --assets-output=src/assets/bootsplash \
  --flavor=main
```

**옵션 설명:**
- `--background-color=0F172A`: Deep Blue Dark 배경
- `--logo-width=200`: 로고 너비 (px)
- `--assets-output`: 리소스 저장 위치
- `--flavor=main`: Android flavor

### **3. 자동 생성되는 파일들**

```
AnimaMobile/
├── ios/
│   └── AnimaMobile/
│       └── BootSplash.storyboard  ✅ 자동 생성됨
└── android/
    └── app/src/main/res/
        ├── drawable/         ✅ 자동 생성됨
        └── values/           ✅ 자동 생성됨
```

---

## 🚀 **설치 순서**

### **1단계: 패키지 설치**
```bash
cd AnimaMobile
yarn install
cd ios && pod install && cd ..
```

### **2단계: 로고 이미지 준비**
```bash
# assets 폴더 생성
mkdir -p assets

# 로고 이미지 복사
# (1024x1024px PNG, 투명 배경)
# assets/logo.png
```

### **3단계: BootSplash 생성**
```bash
npx react-native generate-bootsplash assets/logo.png \
  --background-color=0F172A \
  --logo-width=200 \
  --assets-output=src/assets/bootsplash \
  --flavor=main
```

### **4단계: AppDelegate.swift 수정**
- 위의 "전체 코드" 참고하여 수정

### **5단계: 빌드 및 실행**
```bash
# iOS
yarn ios

# Android
yarn android
```

---

## 🎬 **동작 흐름**

```
1. 앱 실행
   ↓
2. Native BootSplash (즉시 표시)
   - RNBootSplash가 자동으로 표시
   - Deep Blue 배경 + ANIMA 로고
   ↓
3. JS 로딩 (1~2초)
   ↓
4. RNBootSplash.hide() (customize에서 자동)
   ↓
5. AnimatedSplashScreen (Lottie)
   - 2.5초 Lottie 애니메이션
   ↓
6. 메인 앱 화면
```

---

## 💡 **로고 이미지가 없다면?**

### **옵션 1: 임시 텍스트 로고**

BootSplash Storyboard를 직접 수정하여 텍스트만 표시할 수 있습니다.

**Xcode에서:**
1. `ios/AnimaMobile/BootSplash.storyboard` 열기
2. 이미지 뷰 대신 Label 추가
3. "ANIMA" 텍스트 설정
4. 폰트 크기: 48pt
5. 색상: White (#FFFFFF)

### **옵션 2: Hero AI가 만든 심플한 로고 사용**

제가 간단한 ANIMA 텍스트 로고 이미지를 만들어드릴 수 있습니다.

### **옵션 3: 무료 로고 생성 사이트**

1. **Canva** (추천!)
   - https://www.canva.com/
   - 무료 템플릿 다양
   - 1024x1024 PNG 다운로드

2. **LogoMakr**
   - https://logomakr.com/
   - 간단한 텍스트 로고

---

## 🛠️ **트러블슈팅**

### **문제 1: No such module 'RNBootSplash'**

```bash
# 해결책
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
yarn ios
```

### **문제 2: BootSplash.storyboard 없음**

```bash
# 해결책: BootSplash 재생성
npx react-native generate-bootsplash assets/logo.png \
  --background-color=0F172A \
  --logo-width=200 \
  --assets-output=src/assets/bootsplash \
  --flavor=main
```

### **문제 3: 로고가 표시 안 됨**

**확인 사항:**
1. `assets/logo.png` 존재 여부
2. `ios/AnimaMobile/BootSplash.storyboard` 존재 여부
3. Xcode 프로젝트에 BootSplash.storyboard 추가 여부

---

## ✅ **완료 체크리스트**

- [ ] `yarn install` 완료
- [ ] `cd ios && pod install` 완료
- [ ] `assets/logo.png` 준비
- [ ] `npx react-native generate-bootsplash` 실행
- [ ] `AppDelegate.swift` 수정 (import + customize)
- [ ] `ios/AnimaMobile/BootSplash.storyboard` 존재 확인
- [ ] Xcode에서 빌드 성공
- [ ] 시뮬레이터에서 BootSplash 확인

---

## 🎉 **예상 결과**

1. **앱 실행 즉시:** Native BootSplash (Deep Blue + 로고)
2. **JS 로딩 후:** Lottie 애니메이션 (Circle Pulse + ANIMA)
3. **3초 후:** 메인 앱 (TabNavigator)

**완벽한 사용자 경험!** 🚀✨

---

**작성:** Hero AI for JK  
**날짜:** 2025-11-21

