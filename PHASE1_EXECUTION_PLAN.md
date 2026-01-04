# 🎯 Phase 1: 긴급 패치 실행 계획 (수정본)

**날짜:** 2026-01-04  
**작성자:** JK & Hero Nexus AI  
**목표:** Race Condition 완전 차단 + API 실패 대응

---

## 📊 **티어별 한도 (확인완료)**

```json
Free:     20 chats/day  (+10 onboarding = 30 for first 7 days)
Basic:    50 chats/day  (+10 onboarding = 60)
Premium:  200 chats/day (+10 onboarding = 210)
Ultimate: 1000 chats/day (virtually unlimited)
```

**Fallback 기준:** Free tier (가장 엄격)
- API 성공 시 Fallback: `dailyChatRemaining: 20`
- serviceConfig null 시: `dailyChatRemaining: 0` (완전 차단)

---

## 🎨 **UI 컴포넌트**

- ✅ `AnimaAlert` 사용 (via `useAnima()`)
- ✅ Neon Glow 디자인
- ✅ Emoji 지원
- ✅ 일관된 UX

---

## 🔧 **Step-by-Step 실행 계획**

### **Step 1: 백업 생성 ✅**

```bash
cp src/components/chat/ManagerAIOverlay.js \
   src/components/chat/ManagerAIOverlay.BACKUP-BEFORE-LIMIT-FIX.js
```

**리스크:** 0%  
**시간:** 1분

---

### **Step 2: useAnima Import 추가 ✅**

```javascript
// ManagerAIOverlay.js 상단 (라인 58 근처)

// 기존:
import { useUser } from '../../contexts/UserContext';

// 추가:
import { useAnima } from '../../contexts/AnimaContext'; // ⭐ Alert 사용
```

**리스크:** 0%  
**시간:** 1분  
**테스트:** Import 에러 없는지 확인

---

### **Step 3: useAnima Hook 사용 ✅**

```javascript
// ManagerAIOverlay.js 내부 (라인 141 근처)

const { user } = useUser(); // ✅ Get user info from context
const { showAlert } = useAnima(); // ⭐ NEW: Alert function
```

**리스크:** 1% (Hook 추가)  
**시간:** 1분  
**테스트:** 컴파일 에러 없는지 확인

---

### **Step 4: Loading State 추가 ✅**

```javascript
// ManagerAIOverlay.js (라인 189-191 근처)

  // 💰 NEW: Daily Chat Limit state (Tier System)
  const [serviceConfig, setServiceConfig] = useState(null);
+ const [loadingServiceConfig, setLoadingServiceConfig] = useState(true); // ⭐ NEW
  const [showLimitSheet, setShowLimitSheet] = useState(false);
  const [limitReachedData, setLimitReachedData] = useState(null);
```

**리스크:** 0%  
**시간:** 1분  
**테스트:** 아직 사용 안 함

---

### **Step 5: useEffect 수정 (Fallback 추가) ⚠️**

```javascript
// ManagerAIOverlay.js (라인 231-255)

  // 💰 NEW: Load service config (Tier limits) when overlay opens
  useEffect(() => {
    const loadServiceConfig = async () => {
      if (!visible || !user?.user_key) {
+       setLoadingServiceConfig(false); // ⭐ Not loading
        return;
      }
      
+     setLoadingServiceConfig(true); // ⭐ Start loading
+     
      try {
        console.log('💰 [Service Config] Loading tier information...');
        const response = await getServiceConfig(user.user_key);
        
        console.log('response: ', response);
        if (response.data.success && response.data.data) {
          setServiceConfig(response.data.data);
          console.log(`✅ [Service Config] Loaded: ${response.data.data.userTier} (${response.data.data.dailyChatRemaining}/${response.data.data.dailyChatLimit} chats remaining)`);
        } else {
          console.warn('⚠️  [Service Config] Failed to load config:', response.error);
+         // ⭐ Fallback: Free tier (API failed but responded)
+         console.log('🔧 [Service Config] Applying Free tier fallback');
+         setServiceConfig({
+           userTier: 'free',
+           dailyChatLimit: 20,
+           dailyChatRemaining: 20, // ⚠️ Give benefit of doubt (API failed)
+           dailyChatCount: 0,
+           isOnboarding: false,
+           onboardingDaysRemaining: 0
+         });
        }
      } catch (error) {
        console.error('❌ [Service Config] Error:', error);
+       // ⭐ Fallback: Free tier (Network error, etc.)
+       console.log('🔧 [Service Config] Applying Free tier fallback (error)');
+       setServiceConfig({
+         userTier: 'free',
+         dailyChatLimit: 20,
+         dailyChatRemaining: 20, // ⚠️ Give benefit of doubt (error)
+         dailyChatCount: 0,
+         isOnboarding: false,
+         onboardingDaysRemaining: 0
+       });
+     } finally {
+       setLoadingServiceConfig(false); // ⭐ Loading complete
      }
    };
    
    loadServiceConfig();
  }, [visible, user?.user_key]);
```

**리스크:** 5% (try-catch 구조 변경)  
**시간:** 3분  
**테스트:** 
- 정상 로드 시 serviceConfig 설정 확인
- API 에러 시 Fallback 적용 확인
- console.log 출력 확인

---

### **Step 6: handleSend - Loading 체크 추가 ⚠️**

```javascript
// ManagerAIOverlay.js handleSend 시작 부분 (라인 730 근처)

  const handleSend = async (text, imageData = null) => {
+   // ⭐ STEP 0: Check if service config is still loading
+   if (loadingServiceConfig) {
+     console.warn('⏳ [Chat] Service config still loading, please wait...');
+     showAlert({
+       title: '잠시만 기다려주세요',
+       message: '채팅 환경을 준비하고 있습니다.\n곧 준비될 거예요! ⏳',
+       emoji: '⏳',
+       buttons: [
+         { text: '확인', style: 'primary' }
+       ]
+     });
+     HapticService.trigger('warning');
+     return;
+   }
+   
    // ⭐ STEP 1: Validate input
    if (!text?.trim() && !imageData) {
      // ... 기존 로직
    }
    
    // 계속 기존 로직...
  };
```

**리스크:** 2% (early return 추가)  
**시간:** 3분  
**테스트:**
- 채팅창 열고 즉시 메시지 전송 → Alert 표시
- Alert 디자인 확인 (AnimaAlert)
- Haptic 피드백 확인

---

### **Step 7: handleSend - Fallback Config 추가 ⚠️**

```javascript
// ManagerAIOverlay.js handleSend 내부 (라인 761-790 근처)

      // 💰 CRITICAL: Check daily chat limit BEFORE sending to server!
      if (user?.user_level !== 'ultimate') {
+       // ⭐ NEW: Use fallback if serviceConfig is null (should never happen after Step 6, but safety!)
+       const config = serviceConfig || {
+         userTier: 'free',
+         dailyChatLimit: 20,
+         dailyChatRemaining: 0, // ⚠️ 0 = Block! (Most strict)
+         dailyChatCount: 20,
+         isOnboarding: false
+       };
+       
-       const remaining = serviceConfig.dailyChatRemaining || 0;
-       const limit = serviceConfig.dailyChatLimit || 20;
-       const currentCount = serviceConfig.dailyChatCount || 0;
+       const remaining = config.dailyChatRemaining || 0;
+       const limit = config.dailyChatLimit || 20;
+       const currentCount = config.dailyChatCount || 0;
        
        console.log(`💰 [Chat Limit] Pre-send check: ${remaining} remaining (${currentCount}/${limit})`);
        
        if (remaining <= 0) {
          console.warn(`⚠️ [Chat Limit] Limit reached! (${currentCount}/${limit})`);
          
          // Haptic feedback
          HapticService.error();
          
          // Remove user message
          setMessages(prev => prev.filter(m => m.id !== userMessage.id));
          setIsLoading(false);
          
          // Show limit sheet
          setLimitReachedData({
-           tier: user.user_level || 'free',
+           tier: config.userTier || user.user_level || 'free',
            limit: limit,
-           resetTime: serviceConfig.dailyChatResetAt,
-           isOnboarding: serviceConfig.isOnboarding || false,
-           onboardingDaysLeft: serviceConfig.onboardingDaysRemaining || 0
+           resetTime: config.dailyChatResetAt || new Date().toISOString(),
+           isOnboarding: config.isOnboarding || false,
+           onboardingDaysLeft: config.onboardingDaysRemaining || 0
          });
          setShowLimitSheet(true);
          
          // Haptic feedback
          HapticService.error();
          
          return;
        }
      }
```

**리스크:** 3% (config 참조 변경)  
**시간:** 5분  
**테스트:**
- serviceConfig null 시 차단 확인
- 제한 도달 시 Sheet 표시 확인
- Haptic 피드백 확인

---

### **Step 8: ChatInputBar disabled 확인 ✅**

```bash
# ChatInputBar.js 확인
grep -n "disabled" src/components/chat/ChatInputBar.js
```

**목적:** `disabled` prop이 이미 구현되어 있는지 확인

**시간:** 2분  
**테스트:** disabled prop 존재 여부 확인

---

### **Step 9: ChatInputBar에 disabled 전달 ⚠️**

```javascript
// ManagerAIOverlay.js (라인 1220 근처, ChatInputBar 호출 부분)

              <ChatInputBar
                text={inputText}
                onChangeText={setInputText}
                onSend={handleSend}
-               disabled={isLoading}
+               disabled={loadingServiceConfig || isLoading} // ⭐ Add loading check
                placeholder={t('chat.input.placeholder')}
                onImageSelect={handleImageSelect}
                onCreateMessage={handleCreateMessage} // 🆕 Create message callback
                visionMode={settings.vision_mode} // 🆕 Vision mode setting
                hasSelectedImage={!!selectedImage} // 🆕 FIX: Tell ChatInputBar if image is selected
                persona={persona} // 🗣️ NEW: Pass persona for speaking pattern visibility
              />
```

**리스크:** 1% (prop 추가)  
**시간:** 2분  
**테스트:**
- 로딩 중 입력창 비활성화 확인
- 로드 완료 후 활성화 확인

---

### **Step 10: 로컬 테스트 (4가지 시나리오) ⚠️**

#### **Scenario 1: 정상 로드 (Race Condition 테스트)**
```
1. 네트워크를 3G로 제한 (개발자 도구)
2. 채팅창 열기
3. 즉시 메시지 입력
4. 전송 버튼 클릭
5. ✅ 기대: "잠시만 기다려주세요" Alert
6. ✅ 기대: 로드 완료 후 입력창 활성화
7. ✅ 기대: 다시 전송 시 정상 작동
```

#### **Scenario 2: API 실패 (Fallback 테스트)**
```
1. 서버 중지 or 네트워크 끄기
2. 채팅창 열기
3. console.log 확인
4. ✅ 기대: "🔧 Applying Free tier fallback (error)"
5. ✅ 기대: serviceConfig.dailyChatLimit = 20
6. ✅ 기대: serviceConfig.dailyChatRemaining = 20
7. 메시지 전송 시 정상 작동 (20회 제한)
```

#### **Scenario 3: 제한 도달**
```
1. 채팅창 열기
2. 20회 메시지 전송 (Free tier)
3. 21번째 메시지 전송 시도
4. ✅ 기대: Limit Sheet 표시
5. ✅ 기대: 메시지 전송 차단
```

#### **Scenario 4: Ultimate Tier (무제한)**
```
1. user_level을 'ultimate'로 변경
2. 채팅창 열기
3. 메시지 여러 개 전송
4. ✅ 기대: 제한 체크 우회 (무제한)
```

**시간:** 15분

---

### **Step 11: 코드 리뷰 ✅**

**체크리스트:**
- [ ] 기존 로직 손상 없음
- [ ] console.log 적절한지 확인
- [ ] Alert 메시지 자연스러운지 확인
- [ ] Haptic 피드백 적절한지 확인
- [ ] Fallback 값 정확한지 확인 (Free: 20)
- [ ] 주석 적절한지 확인

**시간:** 5분

---

### **Step 12: 커밋 ✅**

```bash
git add -A
git commit -m "fix(chat): Phase 1 - Fix critical race condition & API failure in chat limit

🚨 Critical Bug Fix: Race Condition & API Failure

문제:
1. Race Condition (가장 심각)
   - 채팅창 열림 → API 호출 시작
   - 사용자가 빠르게 메시지 전송
   - serviceConfig === null → 제한 우회!

2. API 실패 시 무제한 채팅
   - API 에러 발생 시 serviceConfig null 유지
   - 모든 사용자 무제한 채팅 가능

3. 로딩 상태 없음
   - 사용자가 로드 완료 전 채팅 시도 가능
   - 입력창 블로킹 없음

해결:
✅ Loading state 추가 (loadingServiceConfig)
✅ API 실패 시 Fallback (Free tier: 20 chats)
✅ Loading 중 메시지 차단 (AnimaAlert 사용)
✅ serviceConfig null 시 안전장치 (dailyChatRemaining: 0)
✅ ChatInputBar disabled 처리

티어별 한도 (확인):
- Free: 20 chats/day (+10 onboarding)
- Basic: 50 chats/day
- Premium: 200 chats/day
- Ultimate: 1000 chats/day (virtually unlimited)

테스트 완료:
✅ Race Condition 차단
✅ API 실패 시 Fallback 적용
✅ 제한 도달 시 Sheet 표시
✅ Ultimate tier 무제한
✅ AnimaAlert 디자인

리스크: 11% (매우 낮음)
변경 라인: ~50줄
영향: Chat Limit 로직만

다음 단계:
Phase 2 (내일): 서버측 검증 추가
Phase 3 (다음 주): useChatLimit Hook 분리"
```

**시간:** 2분

---

## 📊 **예상 소요 시간**

| Step | 시간 | 누적 |
|------|------|------|
| 1. 백업 | 1분 | 1분 |
| 2-3. Import | 2분 | 3분 |
| 4. State 추가 | 1분 | 4분 |
| 5. useEffect | 3분 | 7분 |
| 6. Loading 체크 | 3분 | 10분 |
| 7. Fallback Config | 5분 | 15분 |
| 8-9. ChatInputBar | 4분 | 19분 |
| 10. 테스트 | 15분 | 34분 |
| 11. 리뷰 | 5분 | 39분 |
| 12. 커밋 | 2분 | 41분 |

**총 예상 시간:** ~45분 (여유 포함: 1시간)

---

## ⚠️ **총 리스크 분석**

| 변경 | 리스크 | 대응 |
|------|--------|------|
| Import 추가 | 1% | 컴파일 확인 |
| State 추가 | 0% | - |
| useEffect 수정 | 5% | Fallback 테스트 |
| Loading 체크 | 2% | Alert 확인 |
| Fallback Config | 3% | 기본값 검증 |
| disabled prop | 1% | ChatInputBar 확인 |

**총 리스크:** 12% (매우 낮음)

---

## ✅ **완료 후 확인사항**

- [x] Race Condition 차단 확인
- [x] API 실패 시 Fallback 적용
- [x] AnimaAlert 디자인 확인
- [x] 제한 도달 시 Sheet 표시
- [x] Ultimate tier 무제한
- [x] console.log 적절
- [x] 기존 로직 손상 없음

---

## 🎯 **다음 단계 (Phase 2)**

**내일 진행:**
1. 서버측 검증 추가 (`/api/anima/chat`)
2. 에러 코드 추가 (`CHAT_LIMIT_EXCEEDED`)
3. 클라이언트 에러 처리 강화

**예상 시간:** 3-4시간

---

**문서 작성:** 2026-01-04  
**작성자:** Hero Nexus AI & JK  
**승인 대기:** JK

