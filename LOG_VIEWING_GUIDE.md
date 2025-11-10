# 📝 **ANIMA Mobile - 로그 확인 가이드**

React Native 0.79.2부터 JavaScript 로그가 **React Native DevTools**로 이동했습니다.

---

## 🎯 **로그 확인 방법 3가지**

### **방법 1: DevTools 사용 (가장 강력! 🔥)**

Metro Bundler 터미널에서 **`j` 키**를 누르세요!

```bash
cd AnimaMobile
npm run dev

# Metro 시작 후
j  # 키를 누르면 Chrome/Edge에서 DevTools 열림
```

**장점:**
- 🎨 컬러풀한 로그
- 🔍 필터링 기능 (예: "[ANIMA]"로 검색)
- 🐛 강력한 디버깅 도구
- 📊 Network 탭
- ⚡ Performance 분석
- 💾 Console History

**단점:**
- Chrome 또는 Edge 필요

---

### **방법 2: 별도 터미널에서 로그 보기 (터미널 선호시 ✅)**

#### **옵션 A: 수동으로 2개 터미널 열기**

**터미널 1 (Metro Bundler):**
```bash
cd AnimaMobile
npm run dev
```

**터미널 2 (로그 뷰어) - 새로 열기:**
```bash
cd AnimaMobile
npm run logs
```

#### **옵션 B: 자동 안내 스크립트**

```bash
cd AnimaMobile
npm run dev:logs
```

이 명령어는:
1. Metro를 시작합니다
2. 3초 후 로그 확인 방법을 안내합니다
3. "새 터미널에서 `npm run logs` 실행" 메시지를 보여줍니다

---

### **방법 3: 직접 React Native CLI 사용**

#### **iOS 로그:**
```bash
npx react-native log-ios
```

#### **Android 로그:**
```bash
npx react-native log-android
```

---

## 🎨 **우리 로그 포맷**

모든 ANIMA Mobile 로그는 `[ANIMA]` 접두사를 사용합니다:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💙 [ANIMA] UserContext initialized
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 [ANIMA] Checking for saved token...
🔑 [AuthService] Starting auto-login check...
🔍 [API Client] Reading token from AsyncStorage...
⚠️  [API Client] No token found in AsyncStorage
⚠️  [AuthService] No token found in AsyncStorage
🔓 [AuthService] Auto-login: FAILED (no token)
⚠️  [ANIMA] No saved token found
🔓 [ANIMA] User needs to login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💙 [ANIMA] Auth check complete
📊 [ANIMA] isAuthenticated: NO 🔓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️  [SettingsScreen] User state changed
📊 [SettingsScreen] isAuthenticated: false
📊 [SettingsScreen] loading: false
📊 [SettingsScreen] user: null
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 💡 **DevTools에서 로그 필터링하기**

1. **`j` 키**로 DevTools 열기
2. **Console 탭** 클릭
3. **Filter 입력창**에 `[ANIMA]` 입력
4. 우리 로그만 보기! ✨

---

## 🆚 **각 방법 비교**

| 방법 | 장점 | 단점 | 추천 상황 |
|------|------|------|-----------|
| **DevTools (j)** | 가장 강력, 필터링, 디버깅 | Chrome 필요 | 일반 개발 |
| **npm run logs** | 터미널에서 직접 확인 | 필터링 약함 | 터미널 선호 |
| **CLI 직접** | 가장 빠름 | 매뉴얼 | 빠른 확인 |

---

## 🚀 **추천 워크플로우**

### **일반 개발:**
```bash
# 터미널 1
npm run dev
j  # DevTools 열기
```

### **터미널 선호:**
```bash
# 터미널 1
npm run dev

# 터미널 2 (새로 열기)
npm run logs
```

---

## 🔧 **문제 해결**

### **로그가 안 보여요!**

1. **DevTools 사용 시:**
   - Metro 터미널에서 `j` 키를 눌렀나요?
   - Chrome 또는 Edge가 설치되어 있나요?
   - DevTools의 Console 탭을 확인하세요

2. **터미널 로그 사용 시:**
   - `npm run logs`를 **별도 터미널**에서 실행했나요?
   - 앱이 실제로 실행 중인가요?
   - Metro Bundler가 먼저 시작되었나요?

3. **아무 로그도 안 나와요:**
   - 앱을 새로고침하세요 (Metro에서 `r` 키)
   - Settings 화면으로 이동하세요
   - UserContext가 초기화되면 로그가 나옵니다

---

## 📚 **추가 자료**

- [React Native DevTools 공식 문서](https://reactnative.dev/docs/debugging)
- [React Native 0.79 Release Notes](https://reactnative.dev/blog)

---

## ❓ **자주 묻는 질문**

### **Q: 예전처럼 Metro 터미널에서 직접 볼 수 없나요?**
A: React Native 0.79부터 정책 변경으로 어렵습니다. DevTools나 별도 터미널 사용을 권장합니다.

### **Q: DevTools가 필요 없다면?**
A: `npm run logs`를 별도 터미널에서 실행하세요!

### **Q: 로그가 너무 많아요!**
A: DevTools에서 `[ANIMA]`로 필터링하거나, `grep`을 사용하세요:
```bash
npm run logs | grep "\[ANIMA\]"
```

---

**Created with 💙 by JK & Hero AI**

