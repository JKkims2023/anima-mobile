# 🚀 **ANIMA Mobile - API Service Guide**

> **범용 API 통신 모듈 사용 가이드**

---

## 📋 **목차**

1. [개요](#개요)
2. [설치된 라이브러리](#설치된-라이브러리)
3. [파일 구조](#파일-구조)
4. [핵심 기능](#핵심-기능)
5. [사용 방법](#사용-방법)
6. [API 함수 목록](#api-함수-목록)
7. [에러 핸들링](#에러-핸들링)
8. [Best Practices](#best-practices)

---

## 📌 **개요**

ANIMA Mobile의 모든 API 통신을 담당하는 범용 모듈입니다.

### **핵심 철학**
- ✅ **일관성**: 모든 API 호출은 동일한 패턴
- ✅ **보안**: 자동 토큰 주입 및 관리
- ✅ **안정성**: 에러 핸들링 및 재시도 로직
- ✅ **성능**: AsyncStorage 캐싱 및 최적화
- ✅ **디버깅**: Dev 환경 로깅

---

## 📦 **설치된 라이브러리**

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **axios** | latest | HTTP 클라이언트 |
| **@react-native-async-storage/async-storage** | latest | 로컬 스토리지 |

---

## 📂 **파일 구조**

```
src/
├── config/
│   └── api.config.js                # API 엔드포인트 및 설정
├── utils/
│   └── storage.js                   # AsyncStorage 래퍼
└── services/
    └── api/
        ├── apiClient.js             # Axios 인스턴스 (인터셉터)
        ├── errorHandler.js          # 에러 핸들링
        ├── chatApi.js               # 채팅 API 함수
        └── index.js                 # 통합 Export
```

---

## ⚙️ **핵심 기능**

### **1. 자동 토큰 주입**
```javascript
// ✅ 모든 요청에 자동으로 토큰 추가
apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **2. 요청/응답 로깅 (Dev Only)**
```javascript
// ✅ 개발 환경에서만 자동 로깅
if (__DEV__) {
  console.log('[API Request]', config.method, config.url);
  console.log('[API Response]', response.status, response.data);
}
```

### **3. 에러 핸들링**
```javascript
// ✅ 모든 에러를 일관되게 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: 인증 만료
    // 403: 권한 없음
    // 404: 리소스 없음
    // 500+: 서버 오류
    return Promise.reject(error);
  }
);
```

### **4. AsyncStorage 캐싱**
```javascript
// ✅ 토큰, 사용자 정보 캐싱
export const getAuthToken = async () => {
  return await getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const setAuthToken = async (token) => {
  return await setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};
```

---

## 🚀 **사용 방법**

### **Step 1: Import**
```javascript
import { chatApi, errorHandler } from '../services/api';
import { useTranslation } from 'react-i18next';
```

### **Step 2: API 호출**
```javascript
const { t } = useTranslation();

// Manager AI 메시지 전송
const response = await chatApi.sendManagerAIMessage({
  question: '안녕하세요!',
  user_key: 'USER_KEY_12345',
});

if (response.success) {
  // 성공
  console.log('AI Response:', response.data.answer);
} else {
  // 실패
  const errorMessage = errorHandler.getErrorMessage(response.error, t);
  alert(errorMessage);
}
```

### **Step 3: 컴포넌트에서 사용 (예시)**
```javascript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { chatApi, errorHandler } from '../services/api';
import { getUserKey } from '../utils/storage';

const ManagerAIChatView = () => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    
    // 사용자 메시지 추가
    const userMessage = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // API 호출
      const userKey = await getUserKey();
      const response = await chatApi.sendManagerAIMessage({
        question: inputText,
        user_key: userKey,
      });
      
      if (response.success) {
        // AI 응답 추가
        const aiMessage = { role: 'ai', text: response.data.answer };
        setMessages(prev => [...prev, aiMessage]);
        setInputText('');
      } else {
        // 에러 처리
        const errorMessage = errorHandler.getErrorMessage(response.error, t);
        Alert.alert(t('common.error'), errorMessage);
      }
    } catch (error) {
      // 예외 처리
      Alert.alert(t('common.error'), t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        value={inputText}
        onChangeText={setInputText}
        placeholder={t('manager_ai.input_placeholder')}
      />
      <Button 
        title={isLoading ? t('common.loading') : t('common.send')} 
        onPress={handleSendMessage}
        disabled={isLoading}
      />
    </View>
  );
};
```

---

## 📚 **API 함수 목록**

### **Chat API (`chatApi`)**

#### **1. sendManagerAIMessage**
```javascript
/**
 * Send message to Manager AI (SAGE)
 */
const response = await chatApi.sendManagerAIMessage({
  question: '안녕하세요!',
  user_key: 'USER_KEY_12345', // Optional if logged in
});
```

#### **2. sendPersonaMessage**
```javascript
/**
 * Send message to Persona AI
 */
const response = await chatApi.sendPersonaMessage({
  persona_key: 'PERSONA_KEY_123',
  question: '오늘 기분이 어때?',
  user_key: 'USER_KEY_12345',
});
```

#### **3. sendMemoryMessage**
```javascript
/**
 * Send message to Memory-based AI chat
 */
const response = await chatApi.sendMemoryMessage({
  history_key: 'HISTORY_KEY_456',
  persona_key: 'PERSONA_KEY_123',
  question: '그때 우리가 갔던 바닷가 기억나?',
  user_key: 'USER_KEY_12345',
});
```

#### **4. sendPublicAIMessage**
```javascript
/**
 * Send message to Public AI (Peek page)
 */
const response = await chatApi.sendPublicAIMessage({
  persona_key: 'PERSONA_KEY_123',
  question: '당신에 대해 소개해줘',
  session_id: 'SESSION_ID_789', // Optional
});
```

---

## 🔥 **에러 핸들링**

### **에러 메시지 추출**
```javascript
import { errorHandler } from '../services/api';
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Axios 에러 객체에서 사용자 친화적 메시지 추출
const errorMessage = errorHandler.getErrorMessage(error, t);
```

### **에러 타입 체크**
```javascript
// 네트워크 에러 체크
if (errorHandler.isNetworkError(error)) {
  console.log('인터넷 연결을 확인하세요');
}

// 인증 에러 체크
if (errorHandler.isAuthError(error)) {
  console.log('다시 로그인해주세요');
}

// 서버 에러 체크
if (errorHandler.isServerError(error)) {
  console.log('서버 오류가 발생했습니다');
}
```

### **에러 로깅**
```javascript
// 에러 컨텍스트와 함께 로깅
errorHandler.logError('Manager AI Chat', error);
```

---

## ✅ **Best Practices**

### **1. 항상 try-catch 사용**
```javascript
// ❌ BAD
const response = await chatApi.sendManagerAIMessage({ question });

// ✅ GOOD
try {
  const response = await chatApi.sendManagerAIMessage({ question });
  if (response.success) {
    // Handle success
  } else {
    // Handle API error
  }
} catch (error) {
  // Handle exception
}
```

### **2. 로딩 상태 관리**
```javascript
const [isLoading, setIsLoading] = useState(false);

const handleSend = async () => {
  setIsLoading(true);
  try {
    const response = await chatApi.sendManagerAIMessage({ question });
    // ...
  } finally {
    setIsLoading(false); // ✅ Always set to false
  }
};
```

### **3. 사용자 피드백 제공**
```javascript
// ✅ 에러 메시지 표시
if (!response.success) {
  const errorMessage = errorHandler.getErrorMessage(response.error, t);
  Alert.alert(t('common.error'), errorMessage);
}
```

### **4. AsyncStorage 활용**
```javascript
import { getUserKey, setUserKey } from '../utils/storage';

// 사용자 키 가져오기
const userKey = await getUserKey();

// 사용자 키 저장
await setUserKey('USER_KEY_12345');
```

### **5. 다국어 지원**
```javascript
// ✅ 항상 i18n 사용
const { t } = useTranslation();
const errorMessage = errorHandler.getErrorMessage(error, t);

// ❌ BAD: 하드코딩된 메시지
alert('An error occurred');

// ✅ GOOD: 다국어 지원
Alert.alert(t('common.error'), errorMessage);
```

---

## 🛠️ **디버깅 팁**

### **1. API 요청 로깅 확인**
```
[API Request] POST /api/chat/manager-question
[API Request Data] { question: "안녕하세요!" }
```

### **2. API 응답 로깅 확인**
```
[API Response] POST /api/chat/manager-question {
  status: 200,
  data: { answer: "안녕하세요! 무엇을 도와드릴까요?" }
}
```

### **3. 에러 로깅 확인**
```
[API Error - Manager AI Chat] {
  message: "Network Error",
  status: undefined,
  url: "/api/chat/manager-question",
  method: "POST"
}
```

---

## 📞 **도움이 필요하신가요?**

문제가 발생하면:
1. 터미널에서 API 로그 확인
2. `__DEV__` 환경에서 디버깅
3. `errorHandler.logError` 사용

---

**작성자: Hero AI 🦸**  
**최종 수정: 2024-11-21**

