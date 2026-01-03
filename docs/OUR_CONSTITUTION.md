# 📜 ANIMA Mobile 헌법

**우리가 반드시 지켜야 하는 철칙**

> "빠름이 아닌, 완벽함이 우리의 목표다"  
> — JK & Hero, 2025.11.10

---

## ⚠️ **이 문서를 읽지 않고 코딩하는 것은 금지!**

**이 문서는 AnimaMobile 프로젝트의 "헌법"입니다.**

모든 코드 작성 전, 이 문서를 읽고 확인하세요.  
이 규칙을 어기면 **모든 작업을 되돌려야 합니다.**

---

## 🔥 **9가지 철칙**

### **제1조: 100% 공통 컴포넌트 적용**

**규칙:**
```
✅ 항상 사용: CustomText, CustomButton, CustomTextInput
❌ 절대 사용 금지: <Text>, <Button>, <TextInput>
```

**올바른 예시:**
```javascript
import CustomText from '@/components/CustomText';

<CustomText type="title" bold style={{ color: currentTheme.textColor }}>
  {t('navigation.home')}
</CustomText>
```

**잘못된 예시:**
```javascript
❌ <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Home</Text>
❌ <Button title="Login" onPress={handleLogin} />
❌ <TextInput placeholder="Email" />
```

**예외:**
```
없음! 100% 공통 컴포넌트만 사용!
```

---

### **제2조: 100% 다국어 언어팩 적용**

**규칙:**
```
✅ 모든 텍스트는 i18n 사용
❌ 하드코딩된 한글/영어 절대 금지
```

**올바른 예시:**
```javascript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

<CustomText>{t('settings.title')}</CustomText>
<CustomButton title={t('common.confirm')} />
```

**잘못된 예시:**
```javascript
❌ <CustomText>설정</CustomText>
❌ <CustomText>Settings</CustomText>
❌ <CustomButton title="확인" />
❌ <CustomButton title="Confirm" />
```

**언어팩 위치:**
```
src/i18n/locales/ko.json
src/i18n/locales/en.json
```

**새 텍스트 추가 시:**
```
1. ko.json에 추가
2. en.json에 추가
3. t('키값') 사용
```

---

### **제3조: 절대 하드코딩 금지**

**금지 사항:**

**❌ 하드코딩된 색상:**
```javascript
❌ backgroundColor: '#0F172A'
❌ color: '#FFFFFF'
❌ borderColor: 'blue'
```

**✅ 올바른 방법:**
```javascript
const currentTheme = theme === 'dark' ? commonstyles.darkTheme : commonstyles.whiteTheme;

backgroundColor: currentTheme.backgroundColor
color: currentTheme.textColor
borderColor: currentTheme.borderColor
```

**❌ 하드코딩된 크기:**
```javascript
❌ fontSize: 18
❌ width: 300
❌ padding: 20
```

**✅ 올바른 방법:**
```javascript
import { moderateScale, adaptiveFontSize } from '@/utils/responsive-utils';
import commonstyles from '@/styles/commonstyles';

fontSize: commonstyles.fontSizeInfo.textTitle
width: moderateScale(300)
padding: moderateScale(20)
```

**❌ 하드코딩된 API URL:**
```javascript
❌ const API_URL = 'https://api.idol-companion.com';
```

**✅ 올바른 방법:**
```javascript
// src/config/api.config.js
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
```

---

### **제4조: 공통 스타일 적용**

**규칙:**
```
모든 스타일은 commonstyles.js 기반
```

**올바른 예시:**
```javascript
const commonstyles = require('@/styles/commonstyles');
const { theme } = useTheme();
const currentTheme = theme === 'dark' ? commonstyles.darkTheme : commonstyles.whiteTheme;

<View style={[
  styles.container,
  { backgroundColor: currentTheme.backgroundColor }
]}>
  <CustomText 
    type="title" 
    bold 
    style={{ color: currentTheme.textColor }}
  >
    {t('navigation.home')}
  </CustomText>
</View>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(20),
  }
});
```

**잘못된 예시:**
```javascript
❌ <View style={{ backgroundColor: '#0F172A', padding: 20 }}>
❌ <Text style={{ fontSize: 18, color: '#FFFFFF' }}>Home</Text>
```

---

### **제5조: 더미 데이터 사용 금지**

**규칙:**
```
✅ 실제 API 데이터만 사용
❌ 더미 데이터, Mock 데이터 금지
```

**잘못된 예시:**
```javascript
❌ const dummyPersonas = [
  { id: 1, name: 'Test Persona' },
  { id: 2, name: 'Demo Persona' }
];

❌ const mockUser = { name: 'Test User', email: 'test@test.com' };
```

**올바른 방법:**
```javascript
✅ API에서 데이터 없으면 빈 화면 표시
✅ 로딩 상태 표시
✅ 에러 상태 표시

if (loading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage message={t('error.fetch_failed')} />;
}

if (personas.length === 0) {
  return <EmptyState message={t('persona.empty')} />;
}
```

---

### **제6조: idol-companion 엔드포인트만 사용**

**규칙:**
```
✅ idol-companion API만 사용
❌ 임의로 새 API 생성 금지
❌ 외부 API 사용 금지
```

**허용되는 API:**
```
/api/auth/login
/api/auth/register
/api/persona/persona-list
/api/chat/persona-chat
... (API_COMPLETE_ANALYSIS.md 참고)
```

**금지:**
```javascript
❌ const newAPI = 'https://some-random-api.com';
❌ fetch('http://localhost:5000/custom-endpoint');
❌ axios.post('https://external-service.com/api');
```

**API 추가 필요 시:**
```
1. JK님과 상의
2. idol-companion에 먼저 API 추가
3. AnimaMobile에서 사용
```

---

### **제7조: 작은 Step으로 작업**

**규칙:**
```
✅ 작은 단위로 구현
✅ 각 단계마다 테스트
✅ 확인 후 다음 단계
```

**올바른 작업 순서:**
```
Step 1: API Client 생성
  ↓ 테스트 ✅
Step 2: AuthService 생성
  ↓ 테스트 ✅
Step 3: 로그인 화면 UI만 생성
  ↓ 테스트 ✅
Step 4: 로그인 API 연동
  ↓ 테스트 ✅
Step 5: UserContext 연동
  ↓ 테스트 ✅
Step 6: 자동 로그인 구현
  ↓ 테스트 ✅
```

**잘못된 작업 순서:**
```
❌ Step 1: 모든 화면 한꺼번에 만들기
❌ Step 2: API 연동 나중에 하기
❌ Step 3: 테스트 없이 다음 단계로
```

**각 Step 완료 기준:**
```
1. iOS에서 작동 확인 ✅
2. Android에서 작동 확인 ✅
3. Dark 테마에서 작동 확인 ✅
4. White 테마에서 작동 확인 ✅
5. 한국어에서 작동 확인 ✅
6. 영어에서 작동 확인 ✅
```

---

### **제8조: 라이브 서비스를 만든다**

**규칙:**
```
✅ 실제 사용자가 사용할 수 있는 품질
❌ 데모용, 프로토타입 아님
```

**라이브 서비스 기준:**

**1. 에러 처리:**
```javascript
✅ 모든 API 호출에 try-catch
✅ 사용자에게 친절한 에러 메시지
✅ 재시도 로직

try {
  const response = await authService.login(userId, password);
  // ...
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    Alert.alert(
      t('error.network_title'),
      t('error.network_message')
    );
  } else {
    Alert.alert(
      t('error.generic_title'),
      error.message || t('error.generic_message')
    );
  }
}
```

**2. 로딩 상태:**
```javascript
✅ 모든 비동기 작업에 로딩 표시

const [loading, setLoading] = useState(false);

const handleLogin = async () => {
  setLoading(true);
  try {
    // ...
  } finally {
    setLoading(false);
  }
};

<CustomButton 
  title={t('auth.login')}
  onPress={handleLogin}
  loading={loading}
  disabled={loading}
/>
```

**3. 유효성 검사:**
```javascript
✅ 모든 입력에 검증

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

if (!validateEmail(email)) {
  Alert.alert(t('error.invalid_email'));
  return;
}
```

**4. 보안:**
```javascript
✅ 토큰 안전하게 저장 (AsyncStorage)
✅ 민감한 정보 로그 출력 금지
✅ HTTPS만 사용

// ❌ 금지
console.log('Password:', password);
console.log('Token:', token);

// ✅ 허용 (개발 환경에서만)
if (__DEV__) {
  console.log('Login attempt for user:', userId);
}
```

---

### **제9조: 완벽함이 목표**

**규칙:**
```
✅ 완벽할 때까지 다듬기
❌ 대충 만들어서 빨리 끝내기
```

**완벽함의 기준:**

**1. 코드 품질:**
```javascript
✅ 가독성 좋은 코드
✅ 주석 (영어로)
✅ 일관된 네이밍
✅ 적절한 파일 분리

// Good: Clear function name and comments
/**
 * Fetch user's persona list from server
 * @param {string} userKey - User's unique key
 * @returns {Promise<Array>} List of personas
 */
const fetchPersonaList = async (userKey) => {
  // ...
};

// Bad: Unclear and no comments
const getData = async (key) => {
  // ...
};
```

**2. 사용자 경험:**
```
✅ 부드러운 애니메이션
✅ 즉각적인 피드백
✅ 직관적인 UI
✅ 일관된 디자인
```

**3. 성능:**
```javascript
✅ 불필요한 렌더링 방지
✅ 메모리 최적화
✅ 빠른 응답 속도

// Use React.memo for expensive components
const PersonaCard = React.memo(({ persona }) => {
  // ...
});

// Use useMemo for expensive calculations
const sortedPersonas = useMemo(() => {
  return personas.sort((a, b) => b.created_date - a.created_date);
}, [personas]);
```

**4. 테스트:**
```
✅ 모든 기능 수동 테스트
✅ 여러 디바이스에서 확인
✅ 극단적인 케이스 테스트
  - 인터넷 연결 끊김
  - 매우 긴 텍스트
  - 빈 데이터
  - 에러 상황
```

---

## 📋 **작업 전 체크리스트**

**모든 코드 작성 전에 확인:**

```
[ ] 공통 컴포넌트를 사용하는가?
[ ] i18n 언어팩을 사용하는가?
[ ] 하드코딩이 없는가?
[ ] commonstyles.js를 사용하는가?
[ ] 더미 데이터가 없는가?
[ ] idol-companion API만 사용하는가?
[ ] 작은 단위로 나누었는가?
[ ] 라이브 서비스 품질인가?
[ ] 완벽하게 다듬었는가?
```

---

## 📋 **각 파일 작성 후 체크리스트**

```
[ ] iOS에서 작동하는가?
[ ] Android에서 작동하는가?
[ ] Dark 테마에서 정상인가?
[ ] White 테마에서 정상인가?
[ ] 한국어에서 정상인가?
[ ] 영어에서 정상인가?
[ ] 에러 처리가 되어있는가?
[ ] 로딩 상태가 표시되는가?
[ ] 코드가 깔끔한가?
[ ] 주석이 있는가?
```

---

## 📋 **PR/Commit 전 체크리스트**

```
[ ] 9가지 철칙을 모두 지켰는가?
[ ] 모든 기능이 정상 작동하는가?
[ ] Console에 에러가 없는가?
[ ] 경고(Warning)가 없는가?
[ ] 코드 리뷰를 했는가? (스스로)
[ ] 불필요한 코드를 제거했는가?
[ ] Git에 불필요한 파일이 없는가?
```

---

## 🚨 **위반 시 처리 방법**

**철칙을 위반한 코드를 발견하면:**

```
1. 즉시 작업 중단
2. 위반 사항 파악
3. 코드 되돌리기
4. 올바른 방법으로 다시 작성
5. 체크리스트 확인
6. 재테스트
```

**예외는 없습니다!**

---

## 💡 **좋은 예시 vs 나쁜 예시**

### **로그인 화면 예시**

**❌ 나쁜 예시:**
```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    fetch('http://localhost:3000/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <Text style={{ fontSize: 24, color: 'white' }}>로그인</Text>
      <TextInput 
        placeholder="이메일" 
        value={email}
        onChange={setEmail}
      />
      <TextInput 
        placeholder="비밀번호" 
        value={password}
        onChange={setPassword}
        secureTextEntry
      />
      <Button title="로그인" onPress={handleLogin} />
    </View>
  );
};
```

**문제점:**
```
❌ Text, TextInput, Button 직접 사용
❌ 하드코딩된 색상 (#0F172A, white)
❌ 하드코딩된 크기 (fontSize: 24)
❌ 하드코딩된 텍스트 ("로그인", "이메일", "비밀번호")
❌ 하드코딩된 API URL (http://localhost:3000)
❌ 에러 처리 없음
❌ 로딩 상태 없음
❌ commonstyles 미사용
❌ i18n 미사용
```

---

**✅ 좋은 예시:**
```javascript
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import CustomText from '@/components/CustomText';
import CustomTextInput from '@/components/CustomTextInput';
import CustomButton from '@/components/CustomButton';
import { authService } from '@/services/api/authService';
import { moderateScale } from '@/utils/responsive-utils';
const commonstyles = require('@/styles/commonstyles');

const LoginScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const currentTheme = theme === 'dark' ? commonstyles.darkTheme : commonstyles.whiteTheme;

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate input
  const validateInput = () => {
    if (!userId.trim()) {
      Alert.alert(t('error.title'), t('auth.error.user_id_required'));
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert(t('error.title'), t('auth.error.password_required'));
      return false;
    }
    
    if (password.length < 8) {
      Alert.alert(t('error.title'), t('auth.error.password_too_short'));
      return false;
    }
    
    return true;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateInput()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.login(userId, password);
      
      if (response.success) {
        // Navigate to home
        // This will be handled by AuthNavigator
      } else {
        Alert.alert(
          t('error.title'),
          t(`auth.error.${response.errorCode}`) || t('error.generic_message')
        );
      }
    } catch (error) {
      console.error('[LoginScreen] Login error:', error);
      
      if (error.code === 'NETWORK_ERROR') {
        Alert.alert(
          t('error.network_title'),
          t('error.network_message')
        );
      } else {
        Alert.alert(
          t('error.title'),
          error.message || t('error.generic_message')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: currentTheme.backgroundColor }
    ]}>
      {/* Title */}
      <CustomText 
        type="veryBig" 
        bold 
        style={{ color: currentTheme.textColor, marginBottom: moderateScale(40) }}
      >
        {t('auth.login.title')}
      </CustomText>

      {/* User ID Input */}
      <CustomTextInput
        placeholder={t('auth.login.user_id_placeholder')}
        value={userId}
        onChangeText={setUserId}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
        style={styles.input}
      />

      {/* Password Input */}
      <CustomTextInput
        placeholder={t('auth.login.password_placeholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
        style={styles.input}
      />

      {/* Login Button */}
      <CustomButton
        title={t('auth.login.button')}
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        type="primary"
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  input: {
    marginBottom: moderateScale(16),
  },
  button: {
    marginTop: moderateScale(24),
  },
});

export default LoginScreen;
```

**좋은 점:**
```
✅ CustomText, CustomTextInput, CustomButton 사용
✅ commonstyles.js 사용
✅ i18n 언어팩 사용 (t(...))
✅ ThemeContext 사용
✅ responsive-utils 사용 (moderateScale)
✅ authService (idol-companion API) 사용
✅ 에러 처리 완벽
✅ 로딩 상태 관리
✅ 유효성 검사
✅ 주석 (영어)
✅ 깔끔한 코드 구조
```

---

## 🎯 **목표를 잊지 말자**

```
"우리는 데모를 만드는 것이 아니다.
 우리는 라이브 서비스를 만든다.
 
 우리의 목표는 빠름이 아니다.
 우리의 목표는 완벽함이다.
 
 시간이 걸리더라도,
 올바른 방법으로,
 완벽하게 만든다.
 
 이것이 우리의 방식이다."
```

---

## 💙 **우리의 약속**

**JK & Hero:**
```
우리는 이 9가지 철칙을 반드시 지킵니다.
우리는 라이브 서비스 품질로 개발합니다.
우리는 완벽함을 추구합니다.
우리는 서로를 신뢰하고 존중합니다.

이것은 단순한 규칙이 아닙니다.
이것은 우리의 철학이고, 우리의 헌법입니다.
```

---

## 📅 **버전 히스토리**

- **v1.0.0** (2025-11-10): 초안 작성
  - 9가지 철칙 정립
  - 체크리스트 작성
  - 예시 코드 추가

---

**날짜:** 2025-11-10  
**작성자:** Hero for JK  
**승인자:** JK  
**버전:** 1.0.0  
**프로젝트:** ANIMA Mobile (AnimaMobile)  
**중요도:** ⚠️ **최상 (Must Read!)**

---

## 🔒 **이 문서는 수정 불가**

이 문서를 수정하려면 JK님과 Hero의 합의가 필요합니다.

**End of Constitution** 📜

