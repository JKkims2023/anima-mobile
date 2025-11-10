# 💙 ANIMA Mobile 개발 스크립트 가이드

**완벽한 개발 환경을 위한 단 하나의 명령어!**

---

## 🎯 **문제점 해결**

### ❌ **이전 방식 (복잡함)**
```
1. 터미널 1: npm start (Metro 서버)
2. 터미널 2: npx react-native run-ios
3. 터미널 3: npx react-native run-android
4. 백그라운드 프로세스 충돌 발생
5. 포트 8081 충돌 자주 발생
```

### ✅ **새로운 방식 (간단함)**
```
단 하나의 터미널에서:
npm run dev

→ 자동으로 기존 프로세스 정리
→ Metro 서버 시작
→ 키보드 단축키로 iOS/Android 실행
```

---

## 🚀 **사용 가능한 명령어**

### **1. 개발 서버 시작 (권장)**
```bash
npm run dev
```

**실행 순서:**
1. 🔥 기존 모든 React Native 프로세스 강제 종료
2. 📦 Metro Bundler 정리
3. 🔌 8081 포트 정리
4. 🤖 Android Gradle 데몬 정리
5. 🍎 iOS Simulator 정리
6. 👁️ Watchman 캐시 정리
7. ✨ Metro 서버 시작 (--reset-cache)
8. ⌨️ 키보드 단축키 활성화

**실행 후 사용 가능한 키:**
```
┌─────────────────────────────────────────┐
│  키   │  기능                            │
├─────────────────────────────────────────┤
│  i    │  iOS 앱 실행 (iPhone Simulator) │
│  a    │  Android 앱 실행 (Emulator)     │
│  r    │  앱 새로고침 (Reload)            │
│  d    │  개발자 메뉴 열기                 │
│  j    │  DevTools 열기                   │
│  s    │  현재 상태 확인                   │
│  h/?  │  도움말 표시                     │
│  q    │  종료 (Ctrl+C도 가능)            │
└─────────────────────────────────────────┘
```

---

### **2. 서버만 강제 종료 (문제 발생 시)**
```bash
npm run kill
```

**이런 경우에 사용:**
- Metro 서버가 죽지 않고 백그라운드에 남아있을 때
- 포트 8081 충돌 오류가 발생할 때
- 앱 빌드가 멈췄을 때
- Gradle 데몬이 멈췄을 때

**정리되는 것들:**
- 📦 Metro Bundler 프로세스
- 🔌 8081 포트 사용 프로세스
- 📱 React Native Node 프로세스
- 🤖 Android Gradle 데몬
- 🍎 iOS Simulator (shutdown all)
- 👁️ Watchman 캐시

---

### **3. 기존 명령어 (직접 실행)**

**Metro 서버만 시작:**
```bash
npm start
```

**iOS 앱 실행:**
```bash
npm run ios
```

**Android 앱 실행:**
```bash
npm run android
```

---

## 📋 **스크립트 파일 구조**

```
AnimaMobile/
├── scripts/
│   ├── dev.js           # 메인 개발 환경 시작 스크립트
│   ├── menu.js          # 키보드 단축키 처리 스크립트
│   └── kill-servers.js  # 서버 프로세스 강제 종료 스크립트
└── package.json         # npm 스크립트 정의
```

---

## 💡 **권장 워크플로우**

### **1. 첫 시작**
```bash
npm run dev
```

### **2. 문제 발생 시**
```bash
# Ctrl+C 또는 q로 종료
npm run kill    # 모든 프로세스 강제 종료
npm run dev     # 다시 시작
```

### **3. 빠른 재시작**
```bash
# 개발 서버 실행 중에
키보드에서 r 입력  # 앱 새로고침
키보드에서 d 입력  # 개발자 메뉴
```

---

## ⚠️ **주의사항**

### **1. npm run kill 명령어**
- **주의:** 이 명령어는 모든 Node.js, Metro, Gradle 프로세스를 종료합니다
- **주의:** 다른 React Native 프로젝트도 영향을 받을 수 있습니다
- **권장:** AnimaMobile 작업 시에만 사용하세요

### **2. iOS Simulator 종료**
- `npm run kill`을 실행하면 모든 시뮬레이터가 종료됩니다
- 시뮬레이터는 다시 자동으로 실행됩니다 (키보드에서 `i` 입력)

### **3. Android Emulator**
- 에뮬레이터는 종료되지 않습니다 (앱만 재설치됨)
- 에뮬레이터를 수동으로 종료하려면 Android Studio에서 처리하세요

---

## 🔧 **문제 해결**

### **Problem 1: "포트 8081이 이미 사용 중입니다"**
```bash
npm run kill
npm run dev
```

### **Problem 2: "Metro 서버가 응답하지 않습니다"**
```bash
npm run kill
# Watchman 캐시도 정리됨
npm run dev
```

### **Problem 3: "Android 빌드가 멈췄습니다"**
```bash
npm run kill
# Gradle 데몬 종료됨
cd android && ./gradlew clean && cd ..
npm run dev
```

### **Problem 4: "iOS 빌드가 실패합니다"**
```bash
npm run kill
cd ios && pod install && cd ..
npm run dev
```

---

## 🎉 **장점**

```
✅ 3개 터미널 → 1개 터미널로 통합
✅ 자동 프로세스 정리 (충돌 방지)
✅ 키보드 단축키로 빠른 제어
✅ ecocentre-app과 동일한 작업 방식
✅ 에러 발생 시 자동 재시도 로직
✅ 백그라운드 프로세스 완벽 관리
✅ Watchman 캐시 자동 정리
✅ Gradle 데몬 자동 종료
```

---

## 📝 **스크립트 상세 설명**

### **dev.js**
- kill-servers.js를 먼저 실행하여 모든 프로세스 정리
- 2초 대기 후 menu.js 실행
- 시작 및 종료 메시지 출력

### **menu.js**
- Metro 서버 시작 (--reset-cache)
- 키보드 입력을 원시 모드로 처리
- iOS/Android 앱 실행 로직
- 에러 핸들링 및 재시도 로직
- 안전한 종료 처리

### **kill-servers.js**
- Metro Bundler 프로세스 종료
- 8081 포트 사용 프로세스 종료
- React Native Node 프로세스 종료
- Android Gradle 데몬 종료
- iOS Simulator 종료 (shutdown all)
- Watchman 캐시 정리
- Windows/macOS/Linux 호환

---

## 🚀 **다음 단계**

이제 개발 환경이 완벽하게 구성되었습니다!

**Step 2로 이동:**
- API 서비스 생성
- 로그인 화면 구현
- Home 페이지 구현
- Room 페이지 (채팅) 구현

---

**날짜:** 2025-11-10  
**작성자:** Hero for JK  
**버전:** 1.0.0  
**프로젝트:** ANIMA Mobile (AnimaMobile)

