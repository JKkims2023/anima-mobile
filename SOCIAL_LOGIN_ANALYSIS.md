# 🔍 소셜 로그인 구현 완벽 분석

> **분석 날짜**: 2025년 2월 1일  
> **개발자**: JK & Hero Nexus AI  
> **목표**: Google/Apple 소셜 로그인 자동 회원가입/로그인 구현

---

## 📊 현재 인증 시스템 분석

### 1. 모바일 인증 플로우 (AnimaMobile)

#### **EmailLoginView.js**
```javascript
// 이메일 + 비밀번호 입력
const handleLogin = () => {
  onLogin({ email, password });
};
```

#### **SignUpView.js**
```javascript
// 이메일 인증 코드 발송 → 인증 → 회원가입
const handleSignUp = () => {
  onSignUp({
    userEmail: email,
    userPw: password,
    userPwConfirm: confirmPassword,
    verificationCode: verificationCode
  });
};
```

#### **authService.js**
```javascript
// 로그인
export async function login(userId, password) {
  const result = await apiFetch(AUTH_ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ userId, userPw: password }),
  });
  
  // token과 user를 AsyncStorage에 저장
  await saveToken(result.data.token);
  await saveUser(result.data.user);
}

// 회원가입
export async function register(userData) {
  const result = await apiFetch(AUTH_ENDPOINTS.REGISTER, {
    method: 'POST',
    body: JSON.stringify({
      userId: userData.userEmail,
      userEmail: userData.userEmail,
      userPw: userData.userPw,
      userPwConfirm: userData.userPwConfirm,
      verificationCode: userData.verificationCode,
    }),
  });
}
```

---

### 2. 백엔드 API 구조 (idol-companion)

#### **POST /api/auth/login**
```javascript
// 입력:
{
  userId: "user@email.com",  // 이메일 또는 ID
  userPw: "password"
}

// 출력:
{
  success: true,
  data: {
    token: "jwt_token_here",
    user: {
      idx: 1,
      user_key: "uuid",
      user_id: "user@email.com",
      user_email: "user@email.com",
      user_point: 100,
      user_type: "regular",
      // ... 기타 필드
    }
  }
}
```

#### **POST /api/auth/register**
```javascript
// 입력:
{
  userId: "user@email.com",
  userEmail: "user@email.com",
  userPw: "Password123!",
  userPwConfirm: "Password123!",
  verificationCode: "123456"
}

// 처리:
1. 이메일 인증 코드 확인
2. 비밀번호 복잡도 검증
3. bcrypt로 비밀번호 해싱
4. persona_customer_main에 INSERT
5. JWT 토큰 생성
6. token + user 반환
```

---

## 🎯 소셜 로그인 요구사항

### 1. 플로우

```
사용자가 Google Login 버튼 클릭
↓
Google Sign-In 성공 (email, name, photo, uid)
↓
Firebase Auth 성공
↓
⭐ 백엔드 API 호출: /api/auth/social-login
↓
백엔드에서 email로 사용자 검색
↓
┌─────────────┬─────────────┐
│ 기존 회원?  │ 신규 회원?  │
├─────────────┼─────────────┤
│ 로그인 처리 │ 자동 회원가입│
│ (token 발급)│ + 로그인     │
└─────────────┴─────────────┘
↓
token + user 반환
↓
AsyncStorage에 저장
↓
메인 화면 이동
```

### 2. 데이터 매핑

**Google Sign-In 결과:**
```javascript
{
  email: "jisung.kim78@gmail.com",
  name: "bangkoker",
  photo: "https://lh3.googleusercontent.com/...",
  givenName: "bangkoker",
  familyName: null,
  id: "116449352907091894554" // Google UID
}
```

**Firebase Auth 결과:**
```javascript
{
  uid: "google_uid",
  email: "jisung.kim78@gmail.com",
  displayName: "bangkoker",
  photoURL: "https://lh3.googleusercontent.com/..."
}
```

**백엔드로 전송:**
```javascript
{
  provider: "google", // "google", "apple", "kakao" 등
  email: "jisung.kim78@gmail.com",
  displayName: "bangkoker",
  photoURL: "https://lh3.googleusercontent.com/...",
  uid: "google_uid", // 소셜 플랫폼의 고유 ID
  // Apple의 경우 추가 필드
  appleId: "...",
  identityToken: "..."
}
```

---

## 🚀 구현 계획

### Phase 1: 백엔드 API 개발

#### **새 엔드포인트: POST /api/auth/social-login**

**파일 위치:**
```
idol-companion/app/api/auth/social-login/route.js
```

**로직:**
```javascript
export async function POST(request) {
  const { provider, email, displayName, photoURL, uid } = await request.json();
  
  // 1. email로 기존 사용자 검색
  const users = await query(
    `SELECT * FROM persona_customer_main 
     WHERE user_email = ? AND delete_flag = 'N'`,
    [email]
  );
  
  if (users.length > 0) {
    // ✅ 기존 회원: 로그인 처리
    const user = users[0];
    
    // social_provider 정보 업데이트 (없으면)
    if (!user.social_provider) {
      await query(
        `UPDATE persona_customer_main 
         SET social_provider = ?, social_uid = ?, last_login_date = NOW() 
         WHERE idx = ?`,
        [provider, uid, user.idx]
      );
    }
    
    // JWT 토큰 생성
    const token = generateToken({
      idx: user.idx,
      user_key: user.user_key,
      user_id: user.user_id,
      user_email: user.user_email,
    });
    
    return successResponse('Login successful', { token, user });
    
  } else {
    // ✅ 신규 회원: 자동 회원가입
    const user_key = uuidv4();
    const user_id = email; // 이메일을 ID로 사용
    
    const result = await query(
      `INSERT INTO persona_customer_main (
        user_key,
        user_id,
        user_email,
        user_name,
        user_profile_image,
        user_pw,
        social_provider,
        social_uid,
        user_point,
        user_type,
        approved_yn,
        created_date,
        delete_flag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'N')`,
      [
        user_key,
        user_id,
        email,
        displayName || email.split('@')[0],
        photoURL || null,
        'SOCIAL_LOGIN', // 소셜 로그인은 비밀번호 없음
        provider,
        uid,
        100, // 초기 포인트
        'regular',
        'Y'
      ]
    );
    
    // 생성된 사용자 조회
    const newUsers = await query(
      'SELECT * FROM persona_customer_main WHERE idx = ?',
      [result.insertId]
    );
    
    const newUser = newUsers[0];
    
    // JWT 토큰 생성
    const token = generateToken({
      idx: newUser.idx,
      user_key: newUser.user_key,
      user_id: newUser.user_id,
      user_email: newUser.user_email,
    });
    
    return successResponse('Registration successful', { 
      token, 
      user: newUser,
      isNewUser: true 
    });
  }
}
```

#### **DB 스키마 확인 및 수정**

**필요한 컬럼 (persona_customer_main):**
```sql
ALTER TABLE persona_customer_main 
ADD COLUMN social_provider VARCHAR(50) NULL COMMENT 'google, apple, kakao 등',
ADD COLUMN social_uid VARCHAR(255) NULL COMMENT '소셜 플랫폼의 고유 ID';
```

---

### Phase 2: 모바일 서비스 개발

#### **authService.js에 socialLogin 함수 추가**

```javascript
/**
 * Social login (Google, Apple, etc.)
 * @param {Object} socialData - Social login data
 * @param {string} socialData.provider - "google", "apple", etc.
 * @param {string} socialData.email - User email
 * @param {string} socialData.displayName - User display name
 * @param {string} socialData.photoURL - User profile photo URL
 * @param {string} socialData.uid - Social platform unique ID
 * @returns {Promise<{success: boolean, data?: Object, user?: Object, token?: string, isNewUser?: boolean}>}
 */
export async function socialLogin(socialData) {
  const result = await apiFetch(AUTH_ENDPOINTS.SOCIAL_LOGIN, {
    method: 'POST',
    body: JSON.stringify({
      provider: socialData.provider,
      email: socialData.email,
      displayName: socialData.displayName,
      photoURL: socialData.photoURL,
      uid: socialData.uid,
    }),
  });

  if (result.success) {
    // ✅ Save token and user to AsyncStorage
    if (result.data.token) {
      await saveToken(result.data.token);
    }
    if (result.data.user) {
      await saveUser(result.data.user);
    }

    return {
      success: true,
      data: result.data,
      user: result.data.user,
      token: result.data.token,
      isNewUser: result.data.isNewUser || false,
    };
  }

  return {
    success: false,
    errorCode: result.data?.errorCode || 'SOCIAL_LOGIN_FAILED',
  };
}
```

#### **api.config.js에 엔드포인트 추가**

```javascript
export const AUTH_ENDPOINTS = {
  // ... 기존 엔드포인트
  SOCIAL_LOGIN: `${API_BASE_URL}/api/auth/social-login`,
};
```

#### **AuthSection.js의 handleGoogleLogin 수정**

```javascript
const handleGoogleLogin = async () => {
  try {
    // ... Google Sign-In & Firebase Auth (기존 코드)
    
    const userCredential = await auth().signInWithCredential(googleCredential);
    console.log('✅ [Google Login] Firebase sign in successful!');
    
    // ⭐ 백엔드 소셜 로그인 API 호출
    const response = await socialLogin({
      provider: 'google',
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      uid: userCredential.user.uid,
    });
    
    if (response.success) {
      HapticService.success();
      
      // ✅ 신규 가입 vs 기존 로그인 구분
      if (response.isNewUser) {
        showAlert({
          title: t('auth.social_login.welcome_new_user'),
          message: t('auth.social_login.welcome_message', { 
            name: response.user.user_name 
          }),
          emoji: '🎉',
          buttons: [
            {
              text: t('common.confirm'),
              onPress: () => {
                // UserContext가 자동으로 업데이트됨
                // 메인 화면으로 이동 (자동)
              },
            },
          ],
        });
      } else {
        showAlert({
          title: t('auth.social_login.welcome_back'),
          message: t('auth.social_login.welcome_back_message', { 
            name: response.user.user_name 
          }),
          emoji: '👋',
          buttons: [
            {
              text: t('common.confirm'),
              onPress: () => {
                // 메인 화면으로 이동 (자동)
              },
            },
          ],
        });
      }
    } else {
      // 에러 처리
      showAlert({
        title: t('error.title'),
        message: t(`errors.${response.errorCode}`),
        emoji: '❌',
      });
    }
    
  } catch (error) {
    console.error('❌ [Google Login] Error:', error);
    // 에러 처리...
  }
};
```

---

## 🎁 추가 개선사항

### 1. i18n 키 추가

```json
{
  "auth": {
    "social_login": {
      "welcome_new_user": "환영합니다!",
      "welcome_message": "{{name}}님, ANIMA에 오신 것을 환영합니다!",
      "welcome_back": "다시 오신 것을 환영합니다!",
      "welcome_back_message": "{{name}}님, 반갑습니다!"
    }
  },
  "errors": {
    "SOCIAL_LOGIN_FAILED": "소셜 로그인에 실패했습니다.",
    "SOCIAL_PROVIDER_ERROR": "소셜 로그인 제공자 오류가 발생했습니다."
  }
}
```

### 2. UserContext 자동 업데이트

```javascript
// UserContext.js의 useEffect에서 token 변경 감지
useEffect(() => {
  const checkAuth = async () => {
    const token = await getToken();
    if (token) {
      const result = await verifyToken(token);
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
    }
  };
  
  checkAuth();
}, []); // 또는 token 변경 시
```

### 3. Apple Login 동일 패턴 적용

```javascript
const handleAppleLogin = async () => {
  try {
    // Apple Sign-In
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });
    
    // Firebase Auth
    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
    const userCredential = await auth().signInWithCredential(appleCredential);
    
    // ⭐ 백엔드 소셜 로그인 API 호출
    const response = await socialLogin({
      provider: 'apple',
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || 'Apple User',
      photoURL: userCredential.user.photoURL,
      uid: userCredential.user.uid,
      appleId: appleAuthRequestResponse.user,
      identityToken: identityToken,
    });
    
    // 동일한 성공/에러 처리
  } catch (error) {
    // 에러 처리
  }
};
```

---

## 📊 구현 순서

### Step 1: DB 스키마 확인 및 수정
```sql
-- persona_customer_main 테이블에 컬럼 추가
ALTER TABLE persona_customer_main 
ADD COLUMN social_provider VARCHAR(50) NULL,
ADD COLUMN social_uid VARCHAR(255) NULL;
```

### Step 2: 백엔드 API 개발
```
1. idol-companion/app/api/auth/social-login/route.js 생성
2. 로직 구현 (기존 회원 로그인 / 신규 회원 자동 가입)
3. 테스트 (Postman 등)
```

### Step 3: 모바일 서비스 연동
```
1. authService.js에 socialLogin 함수 추가
2. api.config.js에 SOCIAL_LOGIN 엔드포인트 추가
3. AuthSection.js의 handleGoogleLogin 수정
4. i18n 키 추가 (ko.json, en.json)
5. 테스트 (실제 Google Login)
```

### Step 4: Apple Login 구현
```
1. AuthSection.js의 handleAppleLogin 구현
2. iOS 설정 (Sign in with Apple 활성화)
3. 테스트
```

---

## ✅ 완료 체크리스트

- [ ] DB 스키마 확인 (persona_customer_main)
- [ ] social_provider, social_uid 컬럼 추가
- [ ] POST /api/auth/social-login API 개발
- [ ] socialLogin() 함수 구현 (authService.js)
- [ ] AUTH_ENDPOINTS.SOCIAL_LOGIN 추가 (api.config.js)
- [ ] handleGoogleLogin() 수정 (AuthSection.js)
- [ ] i18n 키 추가 (ko.json, en.json)
- [ ] Google Login 테스트
- [ ] handleAppleLogin() 구현 (AuthSection.js)
- [ ] Apple Login 테스트
- [ ] Production 배포

---

**Generated on**: 2025-02-01  
**Project**: ANIMA Mobile  
**Status**: 🚧 Ready to implement

