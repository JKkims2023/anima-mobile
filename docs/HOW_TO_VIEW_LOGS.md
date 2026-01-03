# 📝 **로그 확인 방법 (React Native 0.79+)**

---

## 🎯 **간단한 방법**

### **Step 1: 개발 서버 시작**
```bash
npm run dev
```

### **Step 2: 로그 보기**
Metro 터미널에서 **`j` 키**를 누르세요!

```
j  # Chrome/Edge에서 DevTools가 열립니다
```

**끝!** 🎉

---

## 📊 **DevTools에서 로그 확인**

1. **Chrome 또는 Edge**가 자동으로 열립니다
2. **Console 탭** 클릭
3. **Filter 입력창**에 `[ANIMA]` 입력
4. 우리 로그만 보기! ✨

---

## 🔍 **예상 로그**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💙 [ANIMA] UserContext initialized
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 [ANIMA] Checking for saved token...
🔑 [AuthService] Starting auto-login check...
🔍 [API Client] Reading token from AsyncStorage...
⚠️  [API Client] No token found in AsyncStorage
🔓 [AuthService] Auto-login: FAILED (no token)
⚠️  [ANIMA] No saved token found
🔓 [ANIMA] User needs to login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💙 [ANIMA] Auth check complete
📊 [ANIMA] isAuthenticated: NO 🔓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 **왜 이렇게 해야 하나요?**

React Native 0.79부터:
- ❌ `console.log()` → Metro 터미널에 **안 보임**
- ✅ `console.log()` → **DevTools에만** 보임

우리의 해결책:
- Metro를 **영어 locale**로 시작 (`LANG=en_US.UTF-8`)
- `j` 키가 정상 작동 (ko.json 에러 방지)
- DevTools가 완벽하게 열림!

---

## 💡 **추가 키보드 단축키**

Metro 터미널에서:
```
r - 앱 새로고침
i - iOS 앱 실행
a - Android 앱 실행
d - 개발자 메뉴 열기
j - DevTools 열기 (로그 확인!)
q - 종료
```

---

## 🆘 **문제 해결**

### **DevTools가 안 열려요!**
1. Metro가 실행 중인가요?
2. Chrome 또는 Edge가 설치되어 있나요?
3. `j` 키를 정확히 눌렀나요? (대문자 J가 아님)

### **로그가 안 보여요!**
1. DevTools의 **Console 탭**을 확인하세요
2. 앱을 새로고침하세요 (Metro에서 `r` 키)
3. Settings 화면으로 이동하세요 (로그가 트리거됨)

### **ko.json 에러가 나요!**
1. `npm run kill` 실행
2. `npm run dev` 다시 시작
3. 우리 스크립트는 자동으로 영어 locale 사용

---

**Created with 💙 by JK & Hero AI**

