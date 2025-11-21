# 🚨 AnimaMobile 트러블슈팅 가이드

**작성:** Hero AI for JK  
**날짜:** 2025-11-21

---

## 🔴 **No such module 'RNBootSplash' 에러**

### **증상:**
```
/Users/jk/.../AppDelegate.swift:5:8 No such module 'RNBootSplash'
```

### **원인:**
- RNBootSplash Pod은 설치되었지만, Xcode가 인식하지 못함
- Xcode Derived Data 캐시 문제

### **해결 방법:**

#### **방법 1: 터미널 자동 스크립트** (추천!) ⭐

```bash
cd AnimaMobile
yarn fix:xcode
```

#### **방법 2: 수동 단계별 해결**

**1단계: Derived Data 삭제**
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

**2단계: iOS 폴더 클린**
```bash
cd ios
rm -rf build
xcodebuild clean -workspace AnimaMobile.xcworkspace -scheme AnimaMobile
```

**3단계: Pod 재설치**
```bash
rm -rf Pods Podfile.lock
pod install
cd ..
```

**4단계: Metro 캐시 삭제 + 재시작**
```bash
yarn start --reset-cache
```

**5단계: 새 터미널에서 빌드**
```bash
yarn ios
```

#### **방법 3: Xcode에서 직접**

1. **Xcode 열기:**
   ```bash
   open ios/AnimaMobile.xcworkspace
   ```

2. **Clean Build Folder:**
   - 메뉴: `Product > Clean Build Folder`
   - 단축키: `Shift + Cmd + K`

3. **Derived Data 삭제:**
   - 메뉴: `Window > Organizer > Derived Data`
   - 또는: `~/Library/Developer/Xcode/DerivedData` 폴더 삭제

4. **Xcode 재시작**

5. **프로젝트 다시 열기:**
   ```bash
   open ios/AnimaMobile.xcworkspace
   ```

6. **빌드:**
   - 메뉴: `Product > Build`
   - 단축키: `Cmd + B`

---

## 🔴 **Vector Icons가 표시 안 됨**

### **증상:**
- 아이콘 대신 물음표(?) 또는 빈 공간 표시

### **해결 방법:**

#### **iOS:**
```bash
cd ios
pod install
cd ..
yarn ios
```

#### **Android:**
```bash
cd android
./gradlew clean
cd ..
yarn android
```

---

## 🔴 **Metro 번들러 에러**

### **증상:**
```
Error: Unable to resolve module ...
```

### **해결 방법:**

```bash
# Metro 캐시 삭제
yarn start --reset-cache

# 또는
watchman watch-del-all
rm -rf node_modules
yarn install
yarn start --reset-cache
```

---

## 🔴 **Android 빌드 실패**

### **증상:**
```
FAILURE: Build failed with an exception
```

### **해결 방법:**

**1단계: Gradle 캐시 삭제**
```bash
cd android
./gradlew clean
rm -rf .gradle
cd ..
```

**2단계: 재빌드**
```bash
yarn android
```

---

## 🔴 **iOS Simulator 실행 안 됨**

### **증상:**
- 시뮬레이터가 열리지 않음
- 또는 앱이 설치되지 않음

### **해결 방법:**

**1단계: 시뮬레이터 재설정**
```bash
xcrun simctl shutdown all
xcrun simctl erase all
```

**2단계: 특정 시뮬레이터 지정**
```bash
yarn ios --simulator="iPhone 16 Pro"
```

---

## 🔴 **Lottie 애니메이션이 표시 안 됨**

### **증상:**
- AnimatedSplashScreen이 빈 화면

### **해결 방법:**

**1. 파일 경로 확인:**
```javascript
// src/components/AnimatedSplashScreen.js
source={require('../assets/animations/anima-logo.json')}
```

**2. 파일 존재 확인:**
```bash
ls -la src/assets/animations/anima-logo.json
```

**3. Metro 재시작:**
```bash
yarn start --reset-cache
```

---

## 🔴 **BootSplash.storyboard 없음**

### **증상:**
```
error: No such file or directory: 'BootSplash.storyboard'
```

### **해결 방법:**

**옵션 A: BootSplash 생성 (로고 있는 경우)**
```bash
npx react-native generate-bootsplash assets/logo.png \
  --background-color=0F172A \
  --logo-width=200 \
  --assets-output=src/assets/bootsplash \
  --flavor=main
```

**옵션 B: AppDelegate에서 BootSplash 제거 (로고 없는 경우)**

```swift
// AppDelegate.swift에서 주석 처리
// import RNBootSplash

override func customize(_ rootView: RCTRootView) {
  super.customize(rootView)
  // RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
}
```

그러면 Lottie AnimatedSplashScreen만 사용됩니다.

---

## 🔴 **Pod install 실패**

### **증상:**
```
[!] CocoaPods could not find compatible versions ...
```

### **해결 방법:**

**1단계: CocoaPods 캐시 삭제**
```bash
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
```

**2단계: Pod 재설치**
```bash
pod install --repo-update
cd ..
```

**3단계: 여전히 실패하면 Ruby Bundler 사용**
```bash
bundle install
bundle exec pod install
```

---

## 🔴 **"Multiple commands produce..." 에러**

### **증상:**
```
error: Multiple commands produce '/Users/.../Info.plist'
```

### **해결 방법:**

**Xcode에서:**

1. 프로젝트 선택 → Targets → AnimaMobile
2. `Build Phases` 탭
3. `Copy Bundle Resources` 섹션에서 중복 파일 제거
4. Clean Build Folder (`Shift + Cmd + K`)
5. 다시 빌드 (`Cmd + B`)

---

## 🛠️ **완전 초기화 (Last Resort)**

### **모든 것을 다시 시작:**

```bash
# 1. Node modules 삭제
rm -rf node_modules

# 2. iOS 클린
cd ios
rm -rf Pods Podfile.lock build
cd ..

# 3. Android 클린
cd android
rm -rf .gradle build app/build
./gradlew clean
cd ..

# 4. 캐시 클린
rm -rf ~/Library/Developer/Xcode/DerivedData
watchman watch-del-all

# 5. 재설치
yarn install
cd ios && pod install && cd ..

# 6. 빌드
yarn ios
# 또는
yarn android
```

---

## 📞 **여전히 문제가 있나요?**

### **문제 보고 시 필요한 정보:**

1. **에러 메시지 전체 복사**
2. **실행 환경:**
   - macOS 버전
   - Xcode 버전
   - Node 버전 (`node -v`)
   - React Native 버전 (`npx react-native --version`)

3. **실행한 명령어:**
   ```bash
   yarn ios
   # 또는
   yarn android
   ```

4. **최근 변경 사항:**
   - 새로 설치한 패키지
   - 수정한 파일

---

## 🎯 **빠른 진단 체크리스트**

### **iOS 빌드 문제:**
- [ ] `yarn install` 실행했는가?
- [ ] `cd ios && pod install` 실행했는가?
- [ ] Xcode에서 `.xcworkspace` 파일 열었는가? (`.xcodeproj` ❌)
- [ ] Derived Data 삭제했는가?
- [ ] Clean Build Folder 실행했는가?

### **Android 빌드 문제:**
- [ ] `yarn install` 실행했는가?
- [ ] Android Studio에서 프로젝트 열었는가?
- [ ] `./gradlew clean` 실행했는가?
- [ ] JDK 버전이 올바른가? (JDK 17 권장)

### **Metro 번들러 문제:**
- [ ] `yarn start --reset-cache` 실행했는가?
- [ ] `node_modules` 삭제 후 재설치했는가?
- [ ] `watchman watch-del-all` 실행했는가?

---

**문제 해결이 안 되면 언제든 Hero AI에게 문의하세요!** 💙✨

**작성:** Hero AI for JK  
**날짜:** 2025-11-21

