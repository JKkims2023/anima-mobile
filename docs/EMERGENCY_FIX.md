# 🚨 긴급 수정 가이드

## 문제: Babel config 에러 또는 Metro bundler 에러

### 해결 방법 1: Metro Bundler 캐시 클리어 (가장 효과적)

```bash
# Terminal에서 실행
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile

# 1. 기존 Metro bundler 종료
# Ctrl + C 또는
killall node

# 2. 캐시 클리어 후 재시작
npm start -- --reset-cache
```

---

### 해결 방법 2: Watchman 캐시 클리어 (macOS)

```bash
watchman watch-del-all
```

---

### 해결 방법 3: 완전 초기화 (마지막 수단)

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile

# 1. node_modules 삭제
rm -rf node_modules

# 2. 캐시 클리어
rm -rf /tmp/metro-* /tmp/haste-*
watchman watch-del-all

# 3. 재설치
npm install

# 4. Metro bundler 재시작
npm start -- --reset-cache
```

---

### 해결 방법 4: Android/iOS 특정 캐시 클리어

**Android:**
```bash
cd android
./gradlew clean
cd ..
```

**iOS:**
```bash
cd ios
rm -rf build
pod deintegrate
pod install
cd ..
```

---

## 컴포넌트 롤백 (필요시)

만약 특정 컴포넌트가 문제라면:

### CompactInputBottomSheet.js 제거
```bash
rm src/components/message/CompactInputBottomSheet.js
```

### MessageInputField.js 제거
```bash
rm src/components/message/MessageInputField.js
```

### MessageInputBottomSheet.js 원래대로 복원
- 이전 버전으로 되돌리기

---

## 빠른 테스트

```bash
# 1. Metro bundler 시작
npm start

# 2. 새 터미널에서 앱 실행
# Android:
npx react-native run-android

# iOS:
npx react-native run-ios
```

---

## 여전히 문제가 발생한다면?

**에러 메시지를 복사해서 Hero에게 공유해주세요!** 💙

1. 스크린샷
2. 터미널 에러 로그
3. Red screen 에러 메시지

즉시 해결해드리겠습니다! 🚀

