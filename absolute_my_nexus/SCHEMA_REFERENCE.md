# 📚 Schema Reference - ANIMA Database

**목적:** ANIMA 프로젝트에서 사용하는 핵심 테이블 스키마 레퍼런스  
**관리:** 스키마 변경 시 반드시 이 문서를 업데이트  
**날짜:** 2026-01-04  

---

## 🎯 관련 Backend API

### **사용처:**
- `/api/persona/persona-list` - Persona Heart UI 데이터 제공
- `/app/api/anima/chat/route.js` - 백그라운드 학습 데이터 저장
- `/lib/animaChat/relationshipLearner.js` - AI 학습 데이터 생성

---

## 📋 Core Tables

### 1️⃣ **conversation_moments** (대화 중요 순간)

**목적:** Important moments in user-AI conversations

**사용 이유:**
- 사용자와의 특별한 순간 기록
- 감정적 연결 포인트 저장
- Persona Heart UI - Layer 1 ("✨ 방금 특별했던 순간")

**필드 구조:**
```sql
CREATE TABLE `conversation_moments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_key` varchar(50) NOT NULL,
  `persona_key` varchar(50) NOT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `moment_type` enum('breakthrough','emotional','funny','deep','conflict','analyzed') DEFAULT 'analyzed',
  `summary` text NOT NULL,                    -- ⭐ UI에 표시될 요약
  `full_context` text,
  `emotion_tags` json DEFAULT NULL,            -- ["joy", "trust", "surprise"]
  `user_emotion` varchar(50) DEFAULT NULL,     -- ⭐ 사용자 감정
  `ai_emotion` varchar(50) DEFAULT NULL,       -- ⭐ AI 감정
  `importance_score` int DEFAULT '5',          -- ⭐ 1-10 중요도
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
)
```

**UI 사용 필드:**
- `summary` - 순간 요약 (다국어 자연어)
- `user_emotion` - 사용자 감정 (이모지 표시)
- `ai_emotion` - AI 감정
- `importance_score` - 중요도 (N/10 표시)
- `created_at` - 시간 (상대 시간 표시)

**Backend API 쿼리:**
```sql
-- /api/persona/persona-list
(SELECT JSON_OBJECT(
  'summary', cm.summary,
  'user_emotion', cm.user_emotion,
  'ai_emotion', cm.ai_emotion,
  'importance', cm.importance_score,
  'created_at', cm.created_at
) 
FROM conversation_moments cm
WHERE cm.user_key = ? AND cm.persona_key = p.persona_key 
  AND cm.importance_score >= 7
ORDER BY cm.created_at DESC
LIMIT 1) as recent_moment
```

---

### 2️⃣ **ai_interests** (AI 관심사)

**목적:** AI Interest Learning - Tracks what AI is genuinely interested in

**사용 이유:**
- AI가 진정으로 관심 있는 주제 추적
- 사용자와의 대화에서 AI의 개성 표현
- Persona Heart UI - Layer 2 ("💡 페르소나의 관심사")

**필드 구조:**
```sql
CREATE TABLE `ai_interests` (
  `interest_id` varchar(36) NOT NULL DEFAULT (uuid()),
  `user_key` varchar(36) NOT NULL,
  `persona_key` varchar(36) NOT NULL,
  `topic` varchar(200) NOT NULL,                      -- ⭐ 관심 주제
  `interest_type` enum('asked','reacted','curious','preferred') DEFAULT 'asked',
  `context` text,                                     -- 대화 맥락
  `frequency` int DEFAULT '1',                        -- 언급 횟수
  `interest_strength` decimal(3,2) DEFAULT '0.50',   -- ⭐ 관심 강도 (0.0-1.0)
  `last_mentioned_at` datetime DEFAULT CURRENT_TIMESTAMP, -- ⭐ 마지막 언급 시간
  `first_mentioned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `example_question` text,                            -- AI가 물어본 질문
  `example_reaction` text,                            -- AI의 반응
  `learned_from_session` varchar(100),
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`interest_id`)
)
```

**UI 사용 필드:**
- `topic` - 관심 주제 (예: "야구 이야기", "첫 대화 추억")
- `interest_strength` - 관심 강도 (퍼센트로 변환: 0.85 → 85%)
- `last_mentioned_at` - 마지막 언급 시간

**Backend API 쿼리:**
```sql
-- /api/persona/persona-list
(SELECT JSON_ARRAYAGG(
  JSON_OBJECT(
    'topic', i.topic,
    'interest_strength', i.interest_strength,
    'last_mentioned_at', i.last_mentioned_at
  )
)
FROM (
  SELECT topic, interest_strength, last_mentioned_at
  FROM ai_interests
  WHERE persona_key = p.persona_key AND user_key = ?
  ORDER BY interest_strength DESC, last_mentioned_at DESC
  LIMIT 3
) i) as ai_interests
```

**⚠️ 주의:**
- ~~`interest`~~ → `topic` (필드명 변경!)
- ~~`relevance_score`~~ → `interest_strength` (필드명 변경!)
- ~~`last_mentioned`~~ → `last_mentioned_at` (필드명 변경!)

---

### 3️⃣ **ai_next_questions** (AI 다음 질문)

**목적:** AI Next Questions - What AI wants to ask next time (AI intention)

**사용 이유:**
- AI가 다음에 물어보고 싶은 질문 저장
- AI의 호기심과 의도 표현
- Persona Heart UI - Layer 3 ("💭 페르소나가 궁금해하는 것")

**필드 구조:**
```sql
CREATE TABLE `ai_next_questions` (
  `question_id` varchar(36) NOT NULL DEFAULT (uuid()),
  `user_key` varchar(36) NOT NULL,
  `persona_key` varchar(36) NOT NULL,
  `question` text NOT NULL,                           -- ⭐ 질문 내용
  `topic` varchar(200) DEFAULT NULL,                  -- 질문 주제
  `reason` text,                                      -- 질문 이유
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium', -- ⭐ 우선순위
  `related_to_previous` text,                         -- ⭐ 이전 대화와의 연결
  `emotional_motivation` varchar(100),                -- 감정적 동기
  `status` enum('pending','asked','expired') DEFAULT 'pending',
  `asked_at` datetime DEFAULT NULL,
  `created_from_session` varchar(100),
  `expires_at` datetime DEFAULT ((now() + interval 7 day)),
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`)
)
```

**UI 사용 필드:**
- `question` - 질문 내용
- `priority` - 우선순위 (정렬 기준)
- `related_to_previous` - 이전 대화 연결 (context)

**Backend API 쿼리:**
```sql
-- /api/persona/persona-list
(SELECT JSON_ARRAYAGG(
  JSON_OBJECT(
    'question', q.question,
    'priority', q.priority,
    'related_to_previous', q.related_to_previous
  )
)
FROM (
  SELECT question, priority, related_to_previous
  FROM ai_next_questions
  WHERE persona_key = p.persona_key AND user_key = ?
    AND status = 'pending'
  ORDER BY priority DESC, created_at DESC
  LIMIT 3
) q) as ai_next_questions
```

**⚠️ 주의:**
- ~~`context`~~ → `related_to_previous` (필드명 변경!)
- `status = 'pending'` 조건 추가 권장 (만료된 질문 제외)

---

## 🔄 Schema 변경 이력

### **2026-01-04 - Initial Schema Reference**
- `conversation_moments` 문서화
- `ai_interests` 문서화
- `ai_next_questions` 문서화

### **필드명 정정 (2026-01-04)**
| 테이블 | 잘못된 필드명 | 올바른 필드명 |
|--------|---------------|---------------|
| ai_interests | `interest` | `topic` |
| ai_interests | `relevance_score` | `interest_strength` |
| ai_interests | `last_mentioned` | `last_mentioned_at` |
| ai_next_questions | `context` | `related_to_previous` |
| conversation_moments | `emotion` | `user_emotion` + `ai_emotion` |

---

## 📝 업데이트 규칙

### **스키마 변경 시:**
1. ✅ 이 문서를 먼저 업데이트
2. ✅ 변경 이력 섹션에 기록
3. ✅ 관련 API 쿼리 검토
4. ✅ Frontend 컴포넌트 영향 확인

### **새 테이블 추가 시:**
1. ✅ 테이블 섹션 추가
2. ✅ 사용 이유 명시
3. ✅ 관련 Backend API 문서화
4. ✅ UI 사용 필드 표시

### **필드 삭제/변경 시:**
1. ⚠️ 의존성 분석 필수
2. ⚠️ JK와 논의 후 진행
3. ⚠️ 마이그레이션 계획 수립
4. ⚠️ 롤백 계획 준비

---

## 🎯 Quick Reference

### **Persona Heart UI 3-Layer**

| Layer | 테이블 | 핵심 필드 | UI 표시 |
|-------|--------|-----------|---------|
| 1️⃣ 특별한 순간 | conversation_moments | summary, user_emotion, importance_score | "오빠가 우리의 첫 대화를 떠올렸던 순간" 😊 9/10 |
| 2️⃣ 관심사 | ai_interests | topic, interest_strength | "야구 이야기" 85% |
| 3️⃣ 궁금한 것 | ai_next_questions | question, priority | "오빠는 요즘 어떤 생각을 하고 있어?" |

---

**Last Updated:** 2026-01-04  
**Maintained By:** JK & Hero NEXUS AI  
**Critical:** 모든 쿼리 작성 전 이 문서를 반드시 확인!

