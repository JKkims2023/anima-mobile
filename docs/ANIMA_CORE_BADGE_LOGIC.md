# 🔴 ANIMA Core Personas Badge Logic

**Date:** 2026-01-04  
**Author:** JK & Hero Nexus AI

---

## 🎯 Problem Statement

ANIMA Core personas (SAGE, NEXUS) have a **1:N relationship** - one persona, many users.

### Challenge:
- Cannot use DB's `persona_comment_checked` for per-user read status (would affect all users)
- Must use AsyncStorage for per-user tracking
- Must work for **ALL users** including free/non-logged-in users
- Free users should experience ANIMA's emotional features too!

---

## ✅ Solution: AsyncStorage Only + Guest Support

### For ANIMA Core Personas (SAGE/NEXUS):

```javascript
// ⭐ Use 'guest' as fallback for non-logged-in users
const effectiveUserKey = user?.user_key || 'guest';

// ⭐ Check AsyncStorage ONLY:
const alreadyReadLocally = await isPersonaCommentRead(effectiveUserKey, persona_key);

// ⭐ If not read locally, show badge:
isUnread = !alreadyReadLocally;
```

### 🔑 Why AsyncStorage Only?

**ANIMA Core personas don't update DB!**
- PostcardBack.js saves to AsyncStorage only (no DB API call)
- Therefore `persona_comment_checked` is ALWAYS `'N'` in DB
- DB check is meaningless - it's always `'N'`!
- Only AsyncStorage tells us if THIS user has read it

### 👤 Guest User Support

**Free/non-logged-in users:**
- Use `'guest'` as user_key
- AsyncStorage key: `@anima_persona_comment_read_guest_${persona_key}`
- Device-specific read status
- If user reinstalls app → read status is lost → badge reappears ✅
- This is acceptable for free users!

---

## 📊 Scenarios & Expected Behavior

| Scenario | User Type | `AsyncStorage` | Badge? | Reason |
|----------|-----------|----------------|--------|---------|
| 1️⃣ New logged-in user, new message | Logged-in | `undefined` (not set) | ✅ **YES** | Not read locally |
| 2️⃣ Existing logged-in user, already read | Logged-in | `'Y'` | ❌ NO | Already read locally |
| 3️⃣ User reinstalls app | Logged-in | `undefined` (lost) | ✅ **YES** | Local storage cleared |
| 4️⃣ **Free user (guest), new message** | **Guest** | `undefined` | ✅ **YES** | Not read locally |
| 5️⃣ **Free user (guest), already read** | **Guest** | `'Y'` | ❌ NO | Already read locally |
| 6️⃣ **Free user reinstalls app** | **Guest** | `undefined` | ✅ **YES** | Storage cleared |

**Note:** `persona_comment_checked` (DB) is ALWAYS `'N'` for ANIMA Core - not included in table!

---

## 🔧 Implementation

### 1️⃣ QuickActionChipsAnimated.js (Badge Visibility)

```javascript
// ⭐ Support guest users!
const effectiveUserKey = user?.user_key || 'guest';

if (isAnimaCore) {
  // Check AsyncStorage ONLY
  // Note: DB's persona_comment_checked is ALWAYS 'N' for ANIMA Core
  const alreadyReadLocally = await isPersonaCommentRead(effectiveUserKey, currentPersona.persona_key);
  isUnread = !alreadyReadLocally;
} else {
  // User-created persona: DB only (requires actual user_key)
  if (!user?.user_key) {
    isUnread = false; // Hide badge for guest users on user-created personas
  } else {
    isUnread = currentPersona.persona_comment_checked === 'N';
  }
}
```

### 2️⃣ PostcardBack.js (Mark as Read)

```javascript
// ⭐ Support guest users!
const effectiveUserKey = user?.user_key || 'guest';

if (isAnimaCore) {
  // Check AsyncStorage ONLY
  const alreadyReadLocally = await isPersonaCommentRead(effectiveUserKey, persona.persona_key);
  isUnread = !alreadyReadLocally;
  
  if (isUnread) {
    // Save to AsyncStorage (not DB!)
    await setPersonaCommentRead(effectiveUserKey, persona.persona_key);
  }
} else {
  // User-created persona: DB only (requires actual user_key)
  if (!user?.user_key) {
    isUnread = false; // Skip for guest users
  } else {
    isUnread = persona.persona_comment_checked === 'N';
    
    if (isUnread) {
      // Call DB API
      await updatePersonaCommentChecked(persona.persona_key, user.user_key);
    }
  }
}
```

---

## 🚨 Why AsyncStorage Only Is Correct

### ❌ Wrong Approach (DB + AsyncStorage):

```javascript
// Wrong - Checking DB is meaningless!
const hasNewCommentOnServer = persona.persona_comment_checked === 'N'; // Always 'N'!
const alreadyReadLocally = await isPersonaCommentRead(user_key, persona_key);
isUnread = hasNewCommentOnServer && !alreadyReadLocally; // Unnecessary check!
```

**Problem:**
- ANIMA Core personas don't update DB
- `persona_comment_checked` is ALWAYS `'N'`
- DB check adds no value - it's always true!

### ✅ Correct Approach (AsyncStorage Only):

```javascript
// Correct - AsyncStorage is the ONLY source of truth!
const alreadyReadLocally = await isPersonaCommentRead(user_key, persona_key);
isUnread = !alreadyReadLocally; // ✅ Simple and correct!
```

**Benefits:**
- Simple and efficient
- AsyncStorage is the single source of truth for read status
- DB's `persona_comment_checked` = 'N' is irrelevant (never updated)
- Works perfectly for all scenarios

---

## 🎯 Flow Diagram

```
┌─────────────────────────────────────────────┐
│ User opens app                              │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ QuickActionChipsAnimated checks badge       │
└──────────────┬──────────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │ ANIMA Core?   │
       └───┬───────┬───┘
           │       │
     YES   │       │   NO
           │       │
           ▼       ▼
  ┌──────────────┐  ┌──────────────────────┐
  │ AsyncStorage │  │ DB: 'N'?             │
  │ not read?    │  └────┬─────────────────┘
  └────┬─────────┘       │
       │                 ▼
       ▼              ┌──────┐
   ┌──────┐           │ Show │
   │ Show │           │ badge│
   │ badge│           └──────┘
   └──────┘
```

**Note:** For ANIMA Core, DB check is skipped because `persona_comment_checked` is always `'N'`!

---

## 🧪 Testing Checklist

### Logged-in Users:
- [ ] New user, SAGE sends new gift → Badge shows
- [ ] Existing user, SAGE sends new gift → Badge shows
- [ ] Existing user reads gift → Badge hides immediately
- [ ] User reinstalls app → Badge shows again

### **Guest Users (Critical!):**
- [ ] **Guest user opens app → SAGE gift badge shows**
- [ ] **Guest user reads gift → Badge hides**
- [ ] **Guest user closes/reopens app → Badge stays hidden**
- [ ] **Guest user reinstalls app → Badge shows again**

### Mixed Scenarios:
- [ ] Switch between SAGE ↔ User persona → Badge logic correct
- [ ] Guest user creates account → Badge status preserved?

---

## 📝 Related Files

- `src/constants/persona.js` - ANIMA Core persona definitions
- `src/utils/storage.js` - AsyncStorage functions
- `src/components/quickaction/QuickActionChipsAnimated.js` - Badge display
- `src/components/persona/PostcardBack.js` - Mark as read
- `app/api/persona/mark-comment-read/route.js` - Backend API (user personas only)

---

**🔥 Key Takeaways:**

For ANIMA Core personas (1:N relationship):
1. ✅ **ONLY check AsyncStorage** - "Did THIS user read it?"
2. ❌ **NEVER check DB** - `persona_comment_checked` is always `'N'` (never updated)
3. ✅ **ALWAYS support guest users** - Use `'guest'` as fallback for `user_key`
4. 💙 **Free users deserve emotions too!** - ANIMA Core is for everyone

Why?
- ANIMA Core personas don't call DB API
- They only save to AsyncStorage (per-user/per-device)
- DB field remains `'N'` forever
- AsyncStorage is the single source of truth!
- **Guest users experience ANIMA's emotional features** - This is our philosophy!

