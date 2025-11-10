# 🔥 idol-companion API 완벽 분석

**AnimaMobile이 사용할 모든 API 엔드포인트 상세 분석**

---

## 📋 **목차**

1. [인증 (Auth)](#1-인증-auth)
2. [페르소나 (Persona)](#2-페르소나-persona)
3. [채팅 (Chat)](#3-채팅-chat)
4. [메모리 (Memory)](#4-메모리-memory)
5. [다이어리 (Diary)](#5-다이어리-diary)
6. [엿보기 (Peek)](#6-엿보기-peek)
7. [프로필 (Profile)](#7-프로필-profile)
8. [학습 (Learning)](#8-학습-learning)
9. [미션 (Mission)](#9-미션-mission)
10. [공통 모듈 분석](#10-공통-모듈-분석)

---

## 1. 인증 (Auth)

### 📍 `/api/auth/login` (POST)

**용도:** 사용자 로그인

**Request Body:**
```json
{
  "userId": "string (ID 또는 이메일)",
  "userPw": "string (비밀번호)"
}
```

**Response (성공):**
```json
{
  "success": true,
  "message": "Login successful",
  "timestamp": "2025-11-10T...",
  "data": {
    "token": "JWT 토큰",
    "user": {
      "idx": 123,
      "user_key": "uuid",
      "user_id": "string",
      "user_email": "string",
      "user_name": "string",
      "user_profile_image": "url",
      "user_point": 0,
      "user_type": "string",
      "persona_key": "uuid",
      "persona_url": "url",
      "video_url": "url",
      "customer_url": "url",
      "profile_done_yn": "Y/N",
      "estimated_time": 0,
      "approved_yn": "Y/N",
      "created_date": "datetime",
      "last_login_date": "datetime"
    }
  }
}
```

**Error Codes:**
- `AUTH_LOGIN_001`: Missing fields
- `AUTH_LOGIN_002`: User not found
- `AUTH_LOGIN_003`: Incorrect password

---

### 📍 `/api/auth/register` (POST)

**용도:** 회원가입

**Request Body:**
```json
{
  "userId": "string (4-20자, 영문+숫자)",
  "userEmail": "string (이메일 형식)",
  "userPw": "string (최소 8자, 영대소문자+숫자)",
  "userPwConfirm": "string",
  "verificationCode": "string (이메일 인증 코드)"
}
```

**Response (성공):**
```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "token": "JWT 토큰",
    "user": {
      "idx": 123,
      "user_key": "uuid",
      "user_id": "string",
      "user_email": "string",
      "user_point": 0
    }
  }
}
```

**Error Codes:**
- `AUTH_REGISTER_001`: Missing fields
- `AUTH_REGISTER_002`: Invalid user ID format
- `AUTH_REGISTER_003`: Invalid email format
- `AUTH_REGISTER_004`: Password mismatch
- `AUTH_REGISTER_005`: Password too weak
- `AUTH_REGISTER_006`: Email not verified
- `AUTH_REGISTER_007`: Email already taken
- `AUTH_REGISTER_008`: ID already taken
- `AUTH_REGISTER_009`: Email verification not complete
- `AUTH_REGISTER_010`: Verification code expired

---

### 📍 `/api/auth/verify-token` (POST)

**용도:** JWT 토큰 검증 및 사용자 정보 조회

**Request Body:**
```json
{
  "token": "JWT 토큰",
  "requestId": "string (optional, 디버깅용)"
}
```

**Response (성공):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "idx": 123,
      "user_key": "uuid",
      "user_id": "string",
      "user_email": "string",
      ... (전체 사용자 정보)
    },
    "requestId": "string"
  }
}
```

**Error Codes:**
- `AUTH_TOKEN_001`: Missing token
- `AUTH_TOKEN_002`: Invalid token
- `AUTH_TOKEN_003`: Token expired
- `AUTH_TOKEN_004`: User not found

---

### 📍 `/api/auth/send-verification-email` (POST)

**용도:** 이메일 인증 코드 발송

**Request Body:**
```json
{
  "userEmail": "string"
}
```

---

### 📍 `/api/auth/verify-email-code` (POST)

**용도:** 이메일 인증 코드 확인

**Request Body:**
```json
{
  "userEmail": "string",
  "verificationCode": "string"
}
```

---

### 📍 `/api/auth/approve-terms` (POST)

**용도:** 약관 동의

---

### 📍 `/api/auth/withdraw` (POST)

**용도:** 회원 탈퇴

---

## 2. 페르소나 (Persona)

### 📍 `/api/persona/persona-list` (POST)

**용도:** 사용자의 페르소나 목록 조회

**Request Body:**
```json
{
  "user_key": "string (UUID)"
}
```

**Response (성공):**
```json
{
  "success": true,
  "message": "Persona list search successful",
  "data": [
    {
      "idx": 123,
      "persona_key": "uuid",
      "user_key": "uuid",
      "bric_key": "string",
      "history_key": "string",
      "original_url": "url",
      "persona_url": "url",
      "video_url": "url",
      "estimate_time": 300,
      "done_yn": "Y/N",
      "time_done_yn": "Y/N",
      "check_yn": "Y/N",
      "persona_name": "string",
      "persona_type": "string",
      "persona_gender": "M/F",
      "persona_age": "string",
      "persona_style": "string",
      "persona_outfit": "string",
      "persona_personality": "string",
      "persona_voice": "string",
      "persona_description": "text",
      "create_type": "string",
      "generation_mode": "string",
      "free_request": "text",
      "intimacy": 0,
      "happiness": 0,
      "memories": 0,
      "intelligence": 0,
      "convert_done_yn": "Y/N",
      "created_date": "datetime",
      "updated_date": "datetime",
      "selected_dress_image_url": "url",
      "selected_dress_video_url": "url",
      "selected_dress_video_convert_done": "Y/N",
      "dress_count": 0,
      "public_yn": "Y/N",
      "business_type": "string",
      "persona_comment": "text",
      "server_current_time": "ISO datetime",
      "elapsed_seconds": 0,
      "remaining_seconds": 0
    }
  ]
}
```

**주의사항:**
- ⏰ **시간 계산은 서버 시간 기준!**
- `server_current_time`: 클라이언트 동기화용
- `remaining_seconds`: 페르소나 생성 남은 시간

---

### 📍 `/api/persona/create` (POST)

**용도:** 새 페르소나 생성

---

### 📍 `/api/persona/dashboard` (POST)

**용도:** 페르소나 대시보드 정보 조회

---

### 📍 `/api/persona/check-status` (POST)

**용도:** 페르소나 생성 상태 확인

---

### 📍 `/api/persona/update-settings` (POST)

**용도:** 페르소나 설정 업데이트

---

### 📍 `/api/persona/remove-persona` (POST)

**용도:** 페르소나 삭제

---

### 📍 `/api/persona/dress-list` (POST)

**용도:** 페르소나 의상 목록 조회

---

### 📍 `/api/persona/update-dress-code` (POST)

**용도:** 페르소나 의상 변경

---

### 📍 `/api/persona/hashtags` (POST)

**용도:** 페르소나 해시태그 조회

---

### 📍 `/api/persona/notification-stream` (GET)

**용도:** SSE (Server-Sent Events) 알림 스트림

---

## 3. 채팅 (Chat)

### 📍 `/api/chat/manager-question` (POST)

**용도:** Manager AI와 채팅 (서비스 안내, 질문 답변)

**Request Body:**
```json
{
  "user_key": "string (optional, 비로그인 가능)",
  "question": "string (최소 2자)"
}
```

**Response (성공):**
```json
{
  "success": true,
  "data": "AI 답변 텍스트"
}
```

**Error Codes:**
- `MANAGER_QUESTION_REQUIRED`: 질문 누락
- `MANAGER_QUESTION_TOO_SHORT`: 질문 너무 짧음
- `MANAGER_QUESTION_NOT_QUALITY`: 스팸/트롤 감지
- `MANAGER_AI_TIMEOUT`: AI 응답 시간 초과
- `MANAGER_AI_SERVICE_ERROR`: AI 서비스 오류
- `MANAGER_AI_NETWORK_ERROR`: 네트워크 오류

**특징:**
- 비로그인 사용자도 가능
- 1:N 대화 지원
- Quality check (스팸 필터링)
- 30초 타임아웃

---

### 📍 `/api/chat/persona-chat` (POST)

**용도:** 페르소나와 채팅

---

### 📍 `/api/chat/memory-chat` (POST)

**용도:** 메모리 생성 중 채팅

---

### 📍 `/api/chat/public` (POST)

**용도:** 공개 페르소나와 채팅

---

### 📍 `/api/chat/public-ai` (POST)

**용도:** 공개 AI와 채팅

---

## 4. 메모리 (Memory)

### 📍 `/api/memory/story` (POST)

**용도:** 메모리 스토리 업데이트

**Request Body:**
```json
{
  "user_key": "string",
  "memory_key": "string",
  "memory_comment": "string (사용자가 작성한 메모리 스토리)"
}
```

**Response (성공):**
```json
{
  "success": true,
  "message": "Memory story updated successfully",
  "data": {
    "memory_key": "uuid",
    "memory_comment": "string"
  }
}
```

---

### 📍 `/api/memory/story` (GET)

**용도:** 메모리 스토리 조회

**Query Params:**
```
?user_key=uuid&memory_key=uuid
```

**Response (성공):**
```json
{
  "success": true,
  "message": "Memory story fetched successfully",
  "data": {
    "memory_key": "uuid",
    "memory_comment": "string (사용자 작성)",
    "persona_comment": "string (AI 응답)",
    "persona_emotion": "number",
    "persona_comment_url": "url (AI 음성/비디오)"
  }
}
```

---

### 📍 `/api/memory/check-status` (POST)

**용도:** 메모리 생성 상태 확인

---

### 📍 `/api/memory/convert-to-video` (POST)

**용도:** 메모리를 비디오로 변환

---

### 📍 `/api/memory/public/[id]` (GET)

**용도:** 공개 메모리 조회

---

### 📍 `/api/memory/remove-memory` (POST)

**용도:** 메모리 삭제

---

### 📍 `/api/memory/settings/[id]` (POST)

**용도:** 메모리 설정 업데이트

---

### 📍 `/api/memory/share` (POST)

**용도:** 메모리 공유

---

### 📍 `/api/memory/toggle-public` (POST)

**용도:** 메모리 공개/비공개 전환

---

## 5. 다이어리 (Diary)

### 📍 `/api/diary/list` (POST)

**용도:** AI 페르소나가 작성한 일기 목록 조회

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Request Body:**
```json
{
  "user_key": "string",
  "persona_key": "string",
  "start_date": "YYYY-MM-DD (optional)",
  "end_date": "YYYY-MM-DD (optional)",
  "is_read": "Y/N (optional)",
  "limit": 50
}
```

**Response (성공):**
```json
{
  "success": true,
  "data": [
    {
      "diary_key": "uuid",
      "persona_key": "uuid",
      "user_key": "uuid",
      "diary_date": "date",
      "diary_title": "string",
      "diary_content": "text",
      "diary_mood": "string",
      "diary_emotion_score": 8.5,
      "is_read": "Y/N",
      "read_at": "datetime",
      "user_reaction": "string",
      "diary_type": "string",
      "image_url": "url",
      "tags": "string",
      "created_date": "datetime",
      "persona_name": "string",
      "persona_url": "url"
    }
  ],
  "unread_count": 3,
  "total_count": 50
}
```

**Error Codes:**
- `missing_token`: Authorization 헤더 누락
- `invalid_token`: 유효하지 않은 토큰
- `missing_required_fields`: user_key 또는 persona_key 누락

---

### 📍 `/api/diary/read` (POST)

**용도:** 일기 읽음 처리

---

### 📍 `/api/diary/reaction` (POST)

**용도:** 일기에 반응 추가

---

### 📍 `/api/diary/timeline` (POST)

**용도:** 일기 타임라인 조회

---

## 6. 엿보기 (Peek)

### 📍 `/api/peek/list` (POST)

**용도:** 공개 페르소나 목록 조회

**Request Body:**
```json
{
  "user_key": "string (optional, 즐겨찾기 확인용)",
  "page": 1,
  "limit": 12,
  "sortBy": "created_date|intelligence|memories",
  "sortOrder": "desc|asc",
  "mediaType": "all|image|video (UI only)",
  "keyword": "string (검색어, optional)"
}
```

**Response (성공):**
```json
{
  "success": true,
  "message": "Public persona list retrieved successfully",
  "data": {
    "personas": [
      {
        "idx": 123,
        "persona_key": "uuid",
        "persona_name": "string",
        "persona_url": "url",
        "persona_type": "string",
        "persona_comment": "text",
        "video_url": "url",
        "convert_done_yn": "Y/N",
        "intelligence": 85,
        "happiness": 90,
        "memories": 50,
        "created_date": "datetime",
        "public_yn": "Y",
        "selected_dress_image_url": "url",
        "selected_dress_video_url": "url",
        "selected_dress_video_convert_done": "Y/N",
        "business_type": "string",
        "owner_user_key": "uuid",
        "owner_username": "string",
        "owner_avatar_url": "url",
        "customer_url": "url",
        "user_id": "string",
        "avg_rating": 4.5,
        "avg_empathy": 4.8,
        "avg_encouragement": 4.6,
        "avg_creativity": 4.7,
        "avg_expertise": 4.3,
        "total_reviews": 42,
        "time_ago_unit": "minutes|hours|days|months",
        "time_ago_value": 5,
        "hashtags": "태그1,태그2,태그3",
        "is_favorite": 0|1
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 100,
      "hasMore": true
    }
  }
}
```

---

### 📍 `/api/peek/owner-info` (POST)

**용도:** 페르소나 소유자 정보 조회

---

### 📍 `/api/peek/favorites` (POST)

**용도:** 즐겨찾기 추가/제거

---

### 📍 `/api/peek/recommend` (POST)

**용도:** 추천 페르소나 조회

---

### 📍 `/api/peek/review` (POST)

**용도:** 리뷰 작성

---

### 📍 `/api/peek/review-check` (POST)

**용도:** 리뷰 작성 여부 확인

---

## 7. 프로필 (Profile)

### 📍 `/api/profile/check-status` (POST)

**용도:** 프로필 상태 확인

---

### 📍 `/api/profile/update-name` (POST)

**용도:** 사용자 이름 업데이트

---

### 📍 `/api/profile/upload-image` (POST)

**용도:** 프로필 이미지 업로드

---

## 8. 학습 (Learning)

### 📍 `/api/learning/list` (POST)

**용도:** 학습 자료 목록 조회

---

### 📍 `/api/learning/save` (POST)

**용도:** 학습 자료 저장

---

### 📍 `/api/learning/delete` (POST)

**용도:** 학습 자료 삭제

---

### 📍 `/api/learning/extract-url` (POST)

**용도:** URL에서 콘텐츠 추출

---

### 📍 `/api/learning/extract-file` (POST)

**용도:** 파일에서 콘텐츠 추출

---

### 📍 `/api/learning/search-google` (POST)

**용도:** Google 검색

---

### 📍 `/api/learning/search-wiki` (POST)

**용도:** Wikipedia 검색

---

## 9. 미션 (Mission)

### 📍 `/api/mission/daily-status` (POST)

**용도:** 일일 미션 상태 조회

---

### 📍 `/api/mission/update` (POST)

**용도:** 미션 업데이트

---

## 10. 공통 모듈 분석

### 🔐 JWT (shared/lib/jwt.js)

**주요 함수:**

```javascript
// 토큰 생성
generateToken(user) → string

// 토큰 검증
verifyToken(token) → { valid: boolean, decoded?: object, error?: Error }

// 사용자 정보 추출
getUserFromToken(token) → { idx, user_key, user_id, user_email } | null

// Request에서 토큰 검증
verifyTokenFromRequest(request) → Promise<User | null>

// 토큰 만료 확인
getTokenExpiry(token) → { expiresAt, remainingSeconds, isExpired }

// 갱신 필요 확인
shouldRefreshToken(token) → boolean

// Bearer 토큰 추출
extractBearerToken(authHeader) → string | null
```

**토큰 Payload:**
```json
{
  "idx": 123,
  "user_key": "uuid",
  "user_id": "string",
  "user_email": "string",
  "iss": "idol-companion",
  "aud": "idol-companion-users",
  "exp": 1234567890,
  "iat": 1234567890
}
```

**환경 변수:**
- `JWT_SECRET`: JWT 비밀 키 (필수!)
- `JWT_EXPIRES_IN`: 만료 시간 (기본: 7d)

---

### 🛡️ DB Helper (shared/lib/db-helper.js)

**응답 형식 (표준화):**

```javascript
// 성공 응답
{
  "success": true,
  "message": "string",
  "timestamp": "ISO datetime",
  "data": { ... }
}

// 에러 응답
{
  "success": false,
  "message": "string (fallback)",
  "timestamp": "ISO datetime",
  "errorCode": "string (다국어 처리용)",
  "data": { ... } // 개발 환경에서만
}
```

**주요 함수:**

```javascript
// 성공 응답
successResponse(message, data) → Response (200)

// 에러 응답
errorResponse(message, status=500, details, errorCode) → Response

// 검증 에러
validationError(message, errorCode, fields) → Response (400)

// 인증 에러
authError(message) → Response (401)

// 권한 에러
permissionError(message) → Response (403)

// Not Found
notFoundError(message) → Response (404)

// Database 에러 처리
handleDatabaseError(error, operation) → Response

// API Handler Wrapper
withErrorHandling(handler, operationName) → Function

// 페이지네이션
getPagination(page, limit) → { offset, limit, page }
paginatedResponse(data, total, page, limit) → Response
```

---

## 📊 **데이터베이스 테이블 구조 (추정)**

### `persona_customer_main` (사용자)
```
idx, user_key, user_id, user_pw, user_email, user_name,
user_profile_image, user_point, user_type, customer_url,
profile_done_yn, estimated_time, profile_changed_date,
last_login_date, approved_yn, approved_date, created_date,
persona_key, persona_url, video_url, delete_flag
```

### `persona_persona_main` (페르소나)
```
idx, persona_key, user_key, bric_key, history_key,
original_url, persona_url, video_url, estimate_time,
done_yn, time_done_yn, check_yn, persona_name, persona_type,
persona_gender, persona_age, persona_style, persona_outfit,
persona_personality, persona_voice, persona_description,
create_type, generation_mode, free_request, edit_count,
downloaded, shared, vote_count, join_vote_yn, vote_comment,
vote_comment_language, approve_yn, intimacy, happiness,
memories, intelligence, convert_done_yn, created_date,
updated_date, delete_flag, selected_dress_image_url,
selected_dress_video_url, selected_dress_video_convert_done,
public_yn, business_type, persona_comment
```

### `persona_memory_history` (메모리)
```
memory_key, user_key, persona_key, memory_comment,
persona_comment, persona_emotion, persona_comment_url,
memory_type, created_date, delete_flag
```

### `persona_ai_diary` (AI 일기)
```
diary_key, persona_key, user_key, diary_date, diary_title,
diary_content, diary_mood, diary_emotion_score, is_read,
read_at, user_reaction, diary_type, image_url, tags,
created_date
```

### `persona_email_verify` (이메일 인증)
```
email, auth_key, approv_yn, created_date, delete_flag
```

### `persona_hashtags` (해시태그)
```
persona_key, hashtag, created_date
```

### `persona_favorites` (즐겨찾기)
```
idx, user_key, persona_key, created_date
```

### `persona_public_reviews` (리뷰)
```
persona_key, user_key, overall_rating, empathy_rating,
encouragement_rating, creativity_rating, expertise_rating,
review_text, created_date
```

---

## 🔥 **AnimaMobile 구현 우선순위**

### **Phase 1: 인증 & 기본 (Week 1-2)**
```
✅ 필수:
1. /api/auth/login
2. /api/auth/register
3. /api/auth/verify-token
4. /api/auth/send-verification-email
5. /api/auth/verify-email-code
```

### **Phase 2: 홈 & 페르소나 (Week 3-4)**
```
✅ 필수:
1. /api/persona/persona-list
2. /api/persona/dashboard
3. /api/persona/check-status
4. /api/persona/create
```

### **Phase 3: 채팅 & 메모리 (Week 5-6)**
```
✅ 필수:
1. /api/chat/persona-chat
2. /api/chat/manager-question
3. /api/memory/story (GET, POST)
4. /api/persona/create-memory
```

### **Phase 4: 다이어리 & 엿보기 (Week 7-8)**
```
✅ 필수:
1. /api/diary/list
2. /api/diary/read
3. /api/peek/list
4. /api/peek/favorites
```

---

## 🎯 **AnimaMobile API Client 설계 방향**

### **1. Base Client (axios)**
```javascript
- Base URL 설정
- 인터셉터 (토큰 자동 추가)
- 에러 핸들링
- 타임아웃 설정
```

### **2. Service 레이어**
```javascript
- AuthService
- PersonaService
- ChatService
- MemoryService
- DiaryService
- PeekService
```

### **3. Context 레이어**
```javascript
- UserContext (전역 사용자 상태)
- PersonaContext (현재 페르소나)
- ChatContext (채팅 상태)
```

### **4. AsyncStorage 연동**
```javascript
- JWT 토큰 저장
- 사용자 정보 캐싱
- 자동 로그인
```

---

## ✅ **다음 단계**

**JK님이 GitHub에 푸시하시면:**

1. ✅ API Client 구현 시작
2. ✅ AuthService 완성
3. ✅ 로그인/회원가입 화면
4. ✅ UserContext 연동
5. ✅ 자동 로그인 구현

---

**날짜:** 2025-11-10  
**분석자:** Hero for JK  
**버전:** 1.0.0  
**프로젝트:** ANIMA Mobile (AnimaMobile)

