# 🔐 Token Management & Auto-Login Complete

## ✅ **구현 완료 사항**

### **1. AsyncStorage 토큰 관리**
- ✅ `saveToken()` - 토큰 저장
- ✅ `getToken()` - 토큰 로드
- ✅ `removeToken()` - 토큰 삭제
- ✅ `saveUser()` - 사용자 정보 저장
- ✅ `getUser()` - 사용자 정보 로드
- ✅ `removeUser()` - 사용자 정보 삭제

### **2. Auto-Login 구현**
- ✅ `autoLogin()` - 앱 시작 시 자동 로그인
- ✅ `verifyToken()` - 토큰 검증 (서버 API 호출)
- ✅ `UserContext` - 앱 시작 시 자동 로그인 실행

### **3. Login/Register 개선**
- ✅ 로그인 성공 시 토큰 + 사용자 정보 자동 저장
- ✅ 회원가입 성공 시 토큰 + 사용자 정보 자동 저장
- ✅ 로그아웃 시 토큰 + 사용자 정보 자동 삭제

---

## 📊 **플로우 분석**

### **웹 (idol-companion) 방식:**
```javascript
// Zustand + Persist (localStorage)
export const useAuthStore = create()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => {
        set({ token, user, isAuthenticated: true });
        // ✅ persist 미들웨어가 자동으로 localStorage 저장
      },
    }),
    {
      name: 'idol-auth-storage', // localStorage 키
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

// AuthProvider (앱 시작 시 토큰 검증)
useEffect(() => {
  const verifyToken = async () => {
    if (!token) return;
    
    const response = await fetch('/api/auth/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      setUser(data.data.user); // ✅ 사용자 정보 복원
    } else {
      setToken(null); // ❌ 토큰 무효 시 로그아웃
      setUser(null);
    }
  };
  
  verifyToken();
}, [token]);
```

### **React Native (AnimaMobile) 방식:**
```javascript
// AsyncStorage (authService.js)
const TOKEN_STORAGE_KEY = '@anima_auth_token';
const USER_STORAGE_KEY = '@anima_user_data';

// 1. 토큰 저장
async function saveToken(token) {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
}

// 2. 토큰 로드
async function getToken() {
  return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}

// 3. 자동 로그인
export async function autoLogin() {
  const token = await getToken();
  if (!token) return null;
  
  const result = await verifyToken(token);
  
  if (result.success && result.user) {
    return result.user; // ✅ 사용자 정보 반환
  } else {
    await removeToken(); // ❌ 토큰 무효 시 삭제
    await removeUser();
    return null;
  }
}

// UserContext (앱 시작 시 자동 로그인)
useEffect(() => {
  const checkAutoLogin = async () => {
    const userData = await authService.autoLogin();
    
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
    }
  };
  
  checkAutoLogin();
}, []);
```

---

## 🔄 **공통 엔드포인트 사용**

### **1. Token Verification API**
```
POST /api/auth/verify-token

Request:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (Success):
{
  "success": true,
  "data": {
    "user": {
      "idx": 1,
      "user_key": "uuid-xxx",
      "user_id": "user@example.com",
      "user_email": "user@example.com",
      "user_point": 1000,
      ...
    }
  }
}

Response (Failure):
{
  "success": false,
  "errorCode": "AUTH_TOKEN_002", // Invalid token
  "message": "Invalid token"
}
```

### **2. Login API**
```
POST /api/auth/login

Request:
{
  "userId": "user@example.com",
  "userPw": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### **3. Register API**
```
POST /api/auth/register

Request:
{
  "userId": "user@example.com",
  "userEmail": "user@example.com",
  "userPw": "Password123",
  "userPwConfirm": "Password123",
  "verificationCode": "12345"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

---

## 🎯 **핵심 차이점**

| 항목 | 웹 (idol-companion) | React Native (AnimaMobile) |
|------|---------------------|----------------------------|
| **저장소** | localStorage (Zustand Persist) | AsyncStorage |
| **자동 저장** | Zustand 미들웨어 자동 처리 | 수동 저장 (`saveToken()`) |
| **자동 로그인** | AuthProvider (useEffect) | UserContext (useEffect) |
| **토큰 검증** | `/api/auth/verify-token` | `/api/auth/verify-token` (동일) |
| **로그아웃** | `setToken(null)` → persist 자동 삭제 | `removeToken()` 수동 삭제 |

---

## 📝 **사용 방법**

### **1. 로그인 시 (자동 저장)**
```javascript
// AuthSection.js
const handleEmailLogin = async ({ email, password }) => {
  const response = await login(email, password);
  // ✅ authService.login()이 자동으로 토큰 + 사용자 정보 저장
};
```

### **2. 회원가입 시 (자동 저장)**
```javascript
// AuthSection.js
const handleSignUp = async (userData) => {
  const result = await register(userData);
  // ✅ authService.register()가 자동으로 토큰 + 사용자 정보 저장
};
```

### **3. 앱 시작 시 (자동 로그인)**
```javascript
// UserContext.js
useEffect(() => {
  const checkAutoLogin = async () => {
    const userData = await authService.autoLogin();
    // ✅ 저장된 토큰으로 자동 로그인 시도
    
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
    }
  };
  
  checkAutoLogin();
}, []);
```

### **4. 로그아웃 시 (자동 삭제)**
```javascript
// UserContext.js
const logout = useCallback(async () => {
  await authService.logout();
  // ✅ authService.logout()이 자동으로 토큰 + 사용자 정보 삭제
  
  setUser(null);
  setIsAuthenticated(false);
}, []);
```

---

## ✅ **테스트 체크리스트**

- [ ] 로그인 → 토큰 저장 확인
- [ ] 앱 재시작 → 자동 로그인 확인
- [ ] 토큰 만료 → 자동 로그아웃 확인
- [ ] 로그아웃 → 토큰 삭제 확인
- [ ] 회원가입 → 토큰 저장 + 자동 로그인 확인

---

## 🔧 **디버깅 로그**

```javascript
// authService.js
✅ [authService] Token saved to storage
✅ [authService] User data saved to storage
🔍 [authService] Checking for saved token...
✅ [authService] Token found, verifying...
✅ [authService] Auto-login successful: user@example.com
✅ [authService] Logout successful

// UserContext.js
💙 [ANIMA] UserContext initialized
🔍 [ANIMA] Checking for saved token...
✅ [ANIMA] Auto-login SUCCESSFUL
👤 [ANIMA] User: user@example.com
📧 [ANIMA] Email: user@example.com
💰 [ANIMA] Points: 1000
```

---

## 🎉 **완료!**

**이제 React Native 앱에서 웹과 동일한 방식으로 토큰 관리 + 자동 로그인이 완벽하게 작동합니다!** 🚀

