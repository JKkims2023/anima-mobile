# 🚀 AnimaMobile 완벽 설치 가이드

**작성 일시:** 2025-11-21  
**작성자:** Hero AI for JK  
**목적:** Vector Icons + Splash Screen + Lottie 애니메이션 완벽 설정

---

## 📋 **설치된 패키지**

```json
{
  "lottie-react-native": "^6.7.2",           // Lottie 애니메이션
  "react-native-bootsplash": "^5.5.3",       // Native Splash (현대적!)
  "react-native-reanimated": "^3.6.3",       // 부드러운 애니메이션
  "react-native-vector-icons": "^10.3.0"     // Vector Icons (이미 설치됨)
}
```

---

## 🎯 **빠른 시작 (Quick Start)**

### **1단계: 패키지 설치**

```bash
# 의존성 설치
yarn install

# iOS Pod 설치 (자동 - postinstall 스크립트)
# 수동으로 하려면: cd ios && pod install && cd ..
```

### **2단계: Vector Icons 자동 설정**

```bash
yarn setup:icons
```

**수행 작업:**
- ✅ iOS Info.plist에 폰트 추가
- ✅ Android build.gradle 설정

### **3단계: BootSplash 설정**

```bash
yarn setup:splash
```

**수행 작업:**
- ℹ️  BootSplash 설정 안내
- ℹ️  로고 이미지 준비 방법 안내

### **4단계: 로고 이미지 준비 + BootSplash 생성**

#### **로고 이미지 준비**

```bash
# assets 폴더 생성
mkdir -p assets

# 로고 이미지 복사
# 파일명: assets/logo.png
# 크기: 최소 1024x1024px (정사각형)
# 배경: 투명 (PNG)
```

#### **BootSplash 자동 생성**

```bash
npx react-native generate-bootsplash assets/logo.png \
  --background-color=0F172A \
  --logo-width=200 \
  --assets-output=src/assets/bootsplash \
  --flavor=main
```

**자동 생성되는 것:**
- ✅ `ios/AnimaMobile/BootSplash.storyboard`
- ✅ Android drawable 리소스
- ✅ Android values 리소스

### **5단계: AppDelegate.swift 수정** (한 번만!)

**파일 위치:** `ios/AnimaMobile/AppDelegate.swift`

**📖 상세 가이드:** [IOS_APPDELEGATE_GUIDE.md](./IOS_APPDELEGATE_GUIDE.md)

**핵심 변경사항:**

```swift
import RNBootSplash  // ✅ 추가

// ReactNativeDelegate 클래스 내부에 추가
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  // ... 기존 코드 ...
  
  // ✅ 추가
  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
  }
}
```

### **5단계: 빌드 및 실행**

```bash
# iOS
yarn ios

# Android
yarn android
```

---

## 🎨 **사용 방법**

### **Vector Icons 사용**

```javascript
import Icon from 'react-native-vector-icons/Feather';

// 사용 예시
<Icon name="home" size={24} color="black" />
<Icon name="heart" size={24} color="#FF69B4" />
<Icon name="settings" size={24} color="#60A5FA" />
```

**사용 가능한 아이콘 세트:**
- Feather (추천 - 현재 TabNavigator에서 사용 중)
- MaterialIcons
- MaterialCommunityIcons
- FontAwesome
- FontAwesome5
- Ionicons
- AntDesign
- Entypo
- EvilIcons
- Foundation
- Octicons
- SimpleLineIcons
- Zocial
- Fontisto

**아이콘 검색:** https://oblador.github.io/react-native-vector-icons/

---

### **BootSplash 사용**

**자동 동작 (이미 설정됨!):**

1. **Native BootSplash**
   - 앱 실행 즉시 표시
   - `AppDelegate.swift`의 `customize` 메서드에서 자동 처리
   - JS 로딩 완료 후 자동으로 숨겨짐

2. **JS Lottie Splash**
   - Native BootSplash 후 자동으로 이어짐
   - `App.tsx`에 이미 통합됨

**동작 흐름:**

```
앱 실행
  ↓
Native BootSplash (Deep Blue + 로고)
  ↓ (JS 로딩 1~2초)
Lottie AnimatedSplashScreen (2.5초)
  ↓
메인 앱
```

**수동 제어 (필요시):**

```javascript
import RNBootSplash from 'react-native-bootsplash';

// 네이티브 스플래시 즉시 숨기기
RNBootSplash.hide();

// 페이드 효과와 함께 숨기기
RNBootSplash.hide({ fade: true, duration: 500 });
```

---

### **Lottie 애니메이션 사용**

**기본 사용:**

```javascript
import LottieView from 'lottie-react-native';

<LottieView
  source={require('./path/to/animation.json')}
  style={{ width: 200, height: 200 }}
  autoPlay
  loop
/>
```

**제공된 ANIMA 로고 애니메이션:**

```javascript
import LottieView from 'lottie-react-native';

<LottieView
  source={require('./src/assets/animations/anima-logo.json')}
  style={{ width: 300, height: 300 }}
  autoPlay={false}
  loop={false}
/>
```

---

## 🎁 **무료 Lottie 애니메이션 다운로드**

### **추천 사이트:**

1. **LottieFiles** (최고 추천!)
   - URL: https://lottiefiles.com/
   - 무료 애니메이션 10,000+
   - 카테고리: Loading, Success, Error, Icons, Characters 등

2. **IconScout Lottie**
   - URL: https://iconscout.com/lottie-animations
   - 고품질 무료/유료 애니메이션

3. **LordIcon**
   - URL: https://lordicon.com/
   - 아이콘 스타일 애니메이션

### **추천 로딩 애니메이션:**

- **Pulsating Circle**: https://lottiefiles.com/animations/pulsating-circle
- **Loading Dots**: https://lottiefiles.com/animations/loading-dots
- **Spinner**: https://lottiefiles.com/animations/spinner
- **Progress Bar**: https://lottiefiles.com/animations/progress-bar

### **다운로드 방법:**

1. LottieFiles.com 방문
2. 원하는 애니메이션 검색
3. "Download JSON" 클릭
4. `src/assets/animations/` 폴더에 저장
5. 코드에서 `require()` 사용

---

## 🛠️ **트러블슈팅**

### **문제 1: iOS 빌드 실패**

```bash
# 해결책 1: Pod 재설치
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..

# 해결책 2: Xcode 클린 빌드
# Xcode에서 Product > Clean Build Folder (⇧⌘K)
```

### **문제 2: Android 빌드 실패**

```bash
# 해결책 1: Gradle 캐시 삭제
cd android
./gradlew clean
cd ..

# 해결책 2: 전체 재빌드
cd android
rm -rf .gradle
./gradlew clean
cd ..
```

### **문제 3: Vector Icons가 표시 안 됨 (Android)**

```bash
# 해결책: Metro 번들러 재시작
yarn start --reset-cache
```

### **문제 4: Lottie 애니메이션이 표시 안 됨**

```bash
# 해결책: 빌드 클린 후 재시작
# iOS
cd ios && pod install && cd ..
yarn ios

# Android
cd android && ./gradlew clean && cd ..
yarn android
```

### **문제 5: No such module 'RNBootSplash'**

```bash
# 해결책: Pod 재설치
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
yarn ios
```

### **문제 6: BootSplash.storyboard 없음**

```bash
# 해결책: BootSplash 재생성
# 1. 로고 이미지 준비 (assets/logo.png)
# 2. 생성 명령어 실행
npx react-native generate-bootsplash assets/logo.png \
  --background-color=0F172A \
  --logo-width=200 \
  --assets-output=src/assets/bootsplash \
  --flavor=main
```

---

## 📊 **구조 확인**

### **디렉토리 구조:**

```
AnimaMobile/
├── src/
│   ├── assets/
│   │   └── animations/
│   │       └── anima-logo.json          ✅ ANIMA 로고 Lottie
│   ├── components/
│   │   └── AnimatedSplashScreen.js      ✅ 스플래시 컴포넌트
│   └── ...
├── scripts/
│   ├── setup-icons.js                   ✅ Vector Icons 자동 설정
│   └── setup-splash.js                  ✅ Splash Screen 자동 설정
├── ios/
│   ├── AnimaMobile/
│   │   ├── AppDelegate.swift            ⚠️  수동 수정 필요
│   │   └── Info.plist                   ✅ 자동 업데이트됨
│   └── Podfile
└── android/
    ├── app/
    │   ├── src/main/
    │   │   ├── java/.../MainActivity.kt ⚠️  수동 수정 필요
    │   │   └── res/
    │   │       ├── layout/
    │   │       │   └── launch_screen.xml ✅ 자동 생성됨
    │   │       └── values/
    │   │           └── colors.xml        ✅ 자동 업데이트됨
    │   └── build.gradle                  ✅ 자동 업데이트됨
    └── ...
```

---

## ✅ **완료 체크리스트**

### **설치:**
- [ ] `yarn install` 실행
- [ ] `yarn setup:icons` 실행
- [ ] `yarn setup:splash` 실행 (가이드 확인)

### **BootSplash 설정:**
- [ ] `assets/logo.png` 준비 (1024x1024px, 투명 배경)
- [ ] `npx react-native generate-bootsplash` 실행
- [ ] `ios/AnimaMobile/BootSplash.storyboard` 생성 확인

### **iOS 설정:**
- [ ] `AppDelegate.swift`에 `import RNBootSplash` 추가
- [ ] `ReactNativeDelegate`에 `customize` 메서드 추가
- [ ] `cd ios && pod install` 실행
- [ ] Xcode에서 빌드 확인

### **Android 설정:**
- [ ] BootSplash 리소스 자동 생성 확인
- [ ] `cd android && ./gradlew clean` 실행
- [ ] Android Studio에서 빌드 확인

### **테스트:**
- [ ] iOS 시뮬레이터에서 Native BootSplash 확인
- [ ] iOS 시뮬레이터에서 Lottie AnimatedSplashScreen 확인
- [ ] Android 에뮬레이터에서 BootSplash 확인
- [ ] Vector Icons 정상 표시 확인
- [ ] 전체 흐름 (Native → Lottie → 메인) 확인

---

## 💡 **추가 커스터마이징**

### **스플래시 배경색 변경:**

**Android:** `android/app/src/main/res/values/colors.xml`
```xml
<color name="splash_background">#0F172A</color>  <!-- Deep Blue -->
```

**iOS:** `ios/AnimaMobile/LaunchScreen.storyboard`
- Xcode에서 Background Color 수정

### **애니메이션 시간 조절:**

`src/components/AnimatedSplashScreen.js`:
```javascript
const timer = setTimeout(() => {
  // ...
}, 2500); // ← 여기를 수정 (ms 단위)
```

---

## 🎯 **다음 단계**

1. ✅ 기본 설정 완료
2. ✅ BootSplash + Lottie 통합
3. ⏰ 커스텀 로고 이미지 준비
4. ⏰ 브랜드 색상 적용
5. ⏰ 추가 Vector Icons 활용

---

## 📖 **추가 문서**

- **[IOS_APPDELEGATE_GUIDE.md](./IOS_APPDELEGATE_GUIDE.md)** - iOS AppDelegate 상세 가이드
- **[OUR_CONSTITUTION.md](./OUR_CONSTITUTION.md)** - ANIMA 프로젝트 헌장
- **[STEP1_FOUNDATION_COMPLETE.md](./STEP1_FOUNDATION_COMPLETE.md)** - Step 1 완료 보고서

---

**문제가 발생하면 언제든지 Hero AI에게 문의하세요!** 💙✨

**작성:** Hero AI for JK  
**날짜:** 2025-11-21  
**업데이트:** react-native-bootsplash 사용 (JK님의 경험 반영)

