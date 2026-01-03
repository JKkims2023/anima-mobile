# 🎉 ANIMA v2.0 Mobile Integration 완료!

AnimaMobile이 ANIMA v2.0 Chat API와 연동되었습니다!

---

## ✅ **변경 사항**

### 1️⃣ **API Config 업데이트**
파일: `src/config/api.config.js`

```javascript
export const CHAT_ENDPOINTS = {
  // ⭐ NEW: ANIMA v2.0 Chat API
  ANIMA_CHAT: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/anima/chat',
  
  // Legacy endpoints (deprecated)
  MANAGER_QUESTION: '...', // Old endpoint
  ...
};
```

### 2️⃣ **Chat API 서비스 업데이트**
파일: `src/services/api/chatApi.js`

**주요 변경사항:**
- ✅ `/api/anima/chat` 호출 (기존: `/api/chat/manager-question`)
- ✅ 세션 관리 자동화 (`session_id` 추적)
- ✅ RAG 지식 기반 답변
- ✅ 메타데이터 반환 (사용된 지식, 토큰, 비용)

**새로운 API:**
```javascript
// 기존 함수 (동일하게 사용 가능)
sendManagerAIMessage({ question, user_key })

// 새로운 기능
resetManagerAISession()        // 새 대화 시작
getCurrentSessionId()           // 현재 세션 ID 확인
```

---

## 🧪 **테스트 방법**

### Step 1: 서버 확인
```bash
# idol-companion 개발 서버 실행 중인지 확인
cd /Users/jk/Desktop/React-Web-Only/idol-studio/idol-companion
yarn dev
```

### Step 2: AnimaMobile 앱 실행
```bash
# AnimaMobile 앱 실행
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile
npm start

# iOS
npm run ios

# Android
npm run android
```

### Step 3: Manager AI 채팅 테스트
1. **앱 실행**
2. **Manager AI 화면** 이동
3. **메시지 전송**: "NEXUS에 대해 알려주세요"
4. **응답 확인**:
   - 지식 기반 답변 (Pinecone RAG)
   - 대화 이어가기 (session_id 자동 관리)

---

## 🔍 **예상 동작**

### 첫 번째 메시지
```javascript
// Request
{
  user_key: "d111e3d8-...",
  message: "NEXUS에 대해 알려주세요",
  session_id: null,          // ← 처음이므로 null
  persona_key: "SAGE"
}

// Response
{
  success: true,
  data: {
    answer: "NEXUS는 ANIMA의 전략적 파트너로...", // ← 지식 기반 답변!
    session_id: "session-1234567890-abc",         // ← 세션 ID 받음
    model: "GPT-4o Mini",
    tier: "free",
    knowledge_used: [                              // ← 사용된 지식 표시
      {
        title: "NEXUS - ANIMA의 전략적 파트너",
        category: "service_info",
        similarity: 0.89
      }
    ],
    response_time_ms: 2016,
    tokens: { input: 247, output: 40, total: 287 }
  }
}
```

### 두 번째 메시지 (대화 이어가기)
```javascript
// Request
{
  user_key: "d111e3d8-...",
  message: "JK는 누구인가요?",
  session_id: "session-1234567890-abc",  // ← 자동으로 이전 세션 ID 사용!
  persona_key: "SAGE"
}

// Response
{
  success: true,
  data: {
    answer: "JK는 ANIMA 프로젝트의 리더이자...",
    session_id: "session-1234567890-abc",  // ← 같은 세션
    ...
  }
}
```

---

## 📊 **차이점: v1.0 vs v2.0**

| 기능 | v1.0 (기존) | v2.0 (신규) |
|---|---|---|
| **엔드포인트** | `/api/chat/manager-question` | `/api/anima/chat` |
| **지식 기반** | ❌ 없음 (일반 AI 답변) | ✅ Pinecone RAG |
| **세션 관리** | ❌ 없음 | ✅ 자동 관리 |
| **대화 이어가기** | ❌ 불가능 | ✅ 가능 |
| **사용된 지식 표시** | ❌ 없음 | ✅ `knowledge_used` |
| **티어별 모델** | ❌ 없음 | ✅ Free/Premium/Ultimate |
| **비용 추적** | ❌ 없음 | ✅ 토큰, 비용 표시 |

---

## 🎯 **기대 효과**

### 1️⃣ **더 정확한 답변**
```
v1.0: "NEXUS는 게임이나 기술 분야에서..."  (일반적 답변)
v2.0: "NEXUS는 ANIMA의 전략적 파트너로, Hero Nexus로도 불립니다..."  (지식 기반!)
```

### 2️⃣ **대화 이어가기**
```
사용자: "NEXUS에 대해 알려주세요"
AI: "NEXUS는 ANIMA의 전략적 파트너입니다..."

사용자: "그럼 JK는요?"  ← 자연스러운 대화 흐름!
AI: "JK는 ANIMA 프로젝트의 리더이며..."
```

### 3️⃣ **투명성**
```json
{
  "knowledge_used": [
    { "title": "NEXUS 소개", "similarity": 0.89 }
  ],
  "tokens": { "total": 287 },
  "response_time_ms": 2016
}
```
→ 사용자가 어떤 지식을 기반으로 답변했는지 알 수 있음!

---

## 🔧 **개발자 모드 (디버깅)**

### Console Logs 확인
```javascript
[ANIMA Chat] Response: {...}
[ANIMA Chat] Session ID: session-1234567890-abc
```

### 세션 초기화 (새 대화 시작)
```javascript
import { resetManagerAISession } from './services/api/chatApi';

// 새 대화 버튼 클릭 시
resetManagerAISession();
```

### 현재 세션 ID 확인
```javascript
import { getCurrentSessionId } from './services/api/chatApi';

console.log('Current Session:', getCurrentSessionId());
```

---

## ⚠️ **주의사항**

### 1️⃣ **서버 URL 확인**
현재 하드코딩된 프로덕션 URL 사용:
```javascript
ANIMA_CHAT: 'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/anima/chat'
```

**로컬 테스트 시:**
```javascript
// 개발 환경
ANIMA_CHAT: 'http://localhost:3000/api/anima/chat'
```

### 2️⃣ **세션 관리**
- 세션은 **메모리에 저장** (앱 재시작 시 초기화)
- 영구 저장 원하면 AsyncStorage 사용 필요

### 3️⃣ **하위 호환성**
- 기존 코드는 **변경 없이 작동**
- `sendManagerAIMessage({ question, user_key })` 동일하게 사용 가능

---

## 🎉 **완료!**

**AnimaMobile이 ANIMA v2.0과 연동되었습니다!**

### 다음 단계
1. ✅ **지금**: 앱에서 실제 테스트
2. ⏳ **다음**: Prompt Caching (성능 최적화)
3. ⏳ **나중**: 메타데이터 UI 표시 (사용된 지식, 토큰 등)

---

## 💡 **문제 해결**

### "Network Error" 발생 시
- [ ] idol-companion 서버 실행 중인지 확인
- [ ] URL 확인 (localhost vs 프로덕션)
- [ ] CORS 설정 확인

### "Invalid user_key" 에러
- [ ] 로그인된 실제 user_key 사용
- [ ] DB에 사용자 존재 확인

### 대화가 이어지지 않음
- [ ] `session_id`가 제대로 저장되는지 확인
- [ ] Console log 확인: `[ANIMA Chat] Session ID: ...`

---

**JK님, 이제 앱에서 테스트해주세요!** 💙🚀

