# 🎯 Next Session Plan - Message Reply Feature

## 📅 Session Info
- **Date Created**: 2025-01-XX
- **Status**: Ready to Start
- **Priority**: HIGH
- **Estimated Time**: 4-6 hours

---

## 🎯 Goal: Message Reply Feature

메시지를 받은 사람이 회신을 남길 수 있는 기능을 구현하여, ANIMA의 바이럴 루프를 완성합니다.

```
💌 메시지 전송
   ↓
📬 메시지 수신 (Web)
   ↓
💬 회신 작성
   ↓
📱 회신 확인 (Mobile)
   ↓
🔄 다시 메시지 전송
   ↓
✨ 바이럴 루프 완성!
```

---

## 📋 Implementation Plan

### **Phase 1: Backend API (2시간)**

#### **1-1. Reply Storage Table**
```sql
CREATE TABLE persona_message_reply (
  reply_key VARCHAR(36) PRIMARY KEY,
  message_key VARCHAR(36) NOT NULL,
  reply_name VARCHAR(50),
  reply_content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_key) REFERENCES persona_message_main(message_key)
);
```

#### **1-2. API Endpoints**
```
POST /api/message/reply/create
  - Request: { message_key, reply_name?, reply_content }
  - Response: { success, reply_key }

GET /api/message/reply/list
  - Request: { message_key }
  - Response: { success, data: [replies] }

GET /api/message/reply/count
  - Request: { user_key }
  - Response: { success, total, unread }
```

---

### **Phase 2: Web UI (1-2시간)**

#### **2-1. Message Page Update**
- **File**: `idol-companion/app/m/[persona_key]/[short_code]/MessageViewClient.js`
- **Changes**:
  ```javascript
  // ❌ Remove
  <ShareButton />
  
  // ✅ Add
  <ReplyButton onClick={() => setShowReplyModal(true)} />
  ```

#### **2-2. Reply Input Modal**
- **Create**: `idol-companion/app/m/[persona_key]/[short_code]/components/ReplyInputModal.js`
- **Features**:
  - 이름 입력 (선택)
  - 회신 내용 입력 (필수)
  - 전송 버튼
  - ANIMA 디자인 일관성

---

### **Phase 3: Mobile UI (2-3시간)**

#### **3-1. Reply Badge**
- **File**: `AnimaMobile/src/components/message/MessageHistoryChips.js`
- **Add**: Reply badge (unread count)
  ```javascript
  {replyCount > 0 && (
    <Badge count={replyCount} />
  )}
  ```

#### **3-2. Reply List Sheet**
- **Create**: `AnimaMobile/src/components/message/MessageReplySheet.js`
- **Features**:
  - 회신 목록 표시
  - 읽음/안읽음 표시
  - 시간 표시
  - 이름 표시 (또는 "익명")

#### **3-3. Integration**
- **File**: `AnimaMobile/src/screens/HistoryScreen.js`
- **Add**: 
  ```javascript
  const [showReplySheet, setShowReplySheet] = useState(false);
  const [selectedMessageForReply, setSelectedMessageForReply] = useState(null);
  ```

---

## 🎨 Design Specifications

### **Web Reply Modal**
```
┌─────────────────────────────────────┐
│  💬 회신 남기기                      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 이름 (선택)                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │ 회신 내용을 입력하세요...    │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        💌 전송하기           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### **Mobile Reply Sheet**
```
┌─────────────────────────────────────┐
│  💬 받은 회신 (3)                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔴 지민                      │   │
│  │ "너무 감동적이었어요!"        │   │
│  │ 2분 전                       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⚪ 익명                      │   │
│  │ "정말 좋은 메시지네요"        │   │
│  │ 1시간 전                     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⚪ 철수                      │   │
│  │ "감사합니다"                 │   │
│  │ 2시간 전                     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 📁 Files to Create

### **Backend**
```
✅ idol-companion/sql/create_reply_table.sql
✅ idol-companion/app/api/message/reply/create/route.js
✅ idol-companion/app/api/message/reply/list/route.js
✅ idol-companion/app/api/message/reply/count/route.js
```

### **Web**
```
✅ idol-companion/app/m/[persona_key]/[short_code]/components/ReplyInputModal.js
✅ idol-companion/app/m/[persona_key]/[short_code]/components/ReplyButton.js
```

### **Mobile**
```
✅ AnimaMobile/src/components/message/MessageReplySheet.js
✅ AnimaMobile/src/components/message/ReplyBadge.js
✅ AnimaMobile/src/services/api/replyService.js
```

---

## 🔧 Technical Decisions

### **1. Reply Storage**
```
✅ Separate table (persona_message_reply)
✅ Simple structure (no user_key for anonymous)
✅ message_key foreign key
```

### **2. Anonymous Support**
```
✅ reply_name is optional
✅ Display "익명" if null
✅ No authentication required
```

### **3. Real-time Updates**
```
❌ Not for MVP (추후 Socket.IO)
✅ Poll on screen focus
✅ Badge count update
```

### **4. Notification**
```
❌ Not for MVP (추후 Push Notification)
✅ Badge count on History tab
✅ Unread indicator
```

---

## 🧪 Test Checklist

### **Backend**
```
☐ Reply creation succeeds
☐ Reply list returns correct data
☐ Reply count accurate
☐ Anonymous reply works
☐ Named reply works
```

### **Web**
```
☐ Reply button appears on message page
☐ Reply modal opens
☐ Reply submission works
☐ Success feedback shown
☐ Anonymous option works
```

### **Mobile**
```
☐ Reply badge shows correct count
☐ Reply sheet opens
☐ Reply list displays correctly
☐ Read/unread status correct
☐ Time formatting correct
```

---

## 🎯 Success Criteria

```
✅ 메시지 받은 사람이 Web에서 회신 가능
✅ 메시지 보낸 사람이 Mobile에서 회신 확인 가능
✅ 익명 회신 지원
✅ Badge로 새 회신 표시
✅ 시간 정보 표시
✅ ANIMA 디자인 일관성
```

---

## 📊 After This Feature

### **Completed**
```
✅ Message Creation (Web + Mobile)
✅ Message Preview
✅ Message History
✅ Message Actions (Favorite, Delete, Share)
✅ Message Reply (NEW!)
```

### **Next**
```
⏭️ History Screen 마무리
   - 4방향 스와이프
   - 되돌리기
   - 검색

⏭️ Music Generation
   - AI 음원 생성
   - 음원 목록
   - 메시지 연결
```

---

## 💙 Notes for Hero Nexus

```
1. Start with SQL table creation
2. Test API endpoints thoroughly
3. Web UI should be simple and intuitive
4. Mobile UI should match existing design
5. Consider error cases (network, validation)
6. Add i18n for all text
7. Update TODO list as you progress
8. Commit frequently with clear messages
```

---

## 🚀 When JK Returns...

```
1️⃣ Read this document
2️⃣ Confirm the plan
3️⃣ Start with Phase 1 (Backend)
4️⃣ Test each phase before moving on
5️⃣ Celebrate together when complete! 🎉
```

---

**Created with 💙 by Hero Nexus**

**For JK, my trusted partner in building ANIMA**

**우리는 함께 걸어갑니다. ✨**

