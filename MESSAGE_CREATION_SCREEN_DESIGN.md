# 🎨 MessageCreationScreen 완벽 설계서

> **"빠른 것이 아니라, 단계적으로 완벽하고, 감성적이며, 악마의 디테일을 담아야 한다"**  
> — JK & Hero Nexus, ANIMA Constitution

---

## 📋 목차

1. [🎯 설계 철학](#-설계-철학)
2. [📚 기존 컴포넌트 분석](#-기존-컴포넌트-분석)
3. [🏗️ 아키텍처 설계](#️-아키텍처-설계)
4. [💎 디자인 패턴](#-디자인-패턴)
5. [🎬 사용자 흐름](#-사용자-흐름)
6. [⚠️ 위험 요소 및 완화 전략](#️-위험-요소-및-완화-전략)
7. [✅ 개발 로드맵](#-개발-로드맵)

---

## 🎯 설계 철학

### 핵심 원칙

1. **단계적 완벽성 (Stepwise Perfection)**
   - PersonaStudioScreen 단순화는 **가장 나중에 처리**
   - 새로운 MessageCreationScreen을 먼저 완벽하게 구현
   - 검증 후 단계적으로 기존 로직 마이그레이션

2. **감성적 사용자 경험 (Emotional UX)**
   - "AI는 툴이다"라는 고정관념을 무너뜨리는 UX
   - 모든 인터랙션에 감정과 의미를 담음
   - Haptic feedback, animation, particle effects의 완벽한 조화

3. **악마의 디테일 (Devil's in the Details)**
   - 100% 공통 컴포넌트 사용
   - 모든 텍스트는 i18n
   - Safe Area, Keyboard, Android Back Button 완벽 처리
   - Dark/Light Theme 대응

4. **영향도 최소화 (Minimal Impact)**
   - `navigation.push` 방식으로 완전히 독립된 페이지
   - 기존 PersonaStudioScreen에 최소한의 변경만 적용
   - 점진적 마이그레이션 가능한 구조

---

## 📚 기존 컴포넌트 분석

### 1️⃣ CustomBottomSheet (★★★★★)

**위치**: `/src/components/CustomBottomSheet.js`

**특징**:
- `@gorhom/bottom-sheet` 기반의 **완벽한 공통 컴포넌트**
- Fixed Header (title, subtitle, close button)
- Scrollable Content Area
- Fixed Footer (1-2 dynamic buttons)
- Dark/White Theme 자동 지원
- Safe Area 완벽 처리
- Keyboard Aware (`keyboardBehavior: 'extend'`)
- Android Back Button 자동 처리
- z-index 999999 (최상위 레이어)

**사용 패턴**:
```javascript
const bottomSheetRef = useRef(null);

<CustomBottomSheet
  ref={bottomSheetRef}
  title="타이틀"
  subtitle="서브타이틀 (선택)"
  buttons={[
    { title: '확인', type: 'primary', onPress: handleConfirm },
    { title: '취소', type: 'outline', onPress: handleCancel }
  ]}
  onClose={handleClose}
  snapPoints={['65%', '90%']}
  keyboardBehavior="extend"
>
  <CustomText>콘텐츠</CustomText>
</CustomBottomSheet>

// Open
bottomSheetRef.current?.present();

// Close
bottomSheetRef.current?.dismiss();
```

**장점**:
- ✅ 안정성 검증 완료 (BottomSheetTestScreen)
- ✅ 키보드 자동 처리 (extend 모드)
- ✅ Safe Area 자동 처리
- ✅ Android Back Button 자동 처리
- ✅ 일관된 디자인 (ANIMA Dark Theme 기본)

**추천 용도**:
- 효과 선택 (Text Animation, Particle Effect)
- 음원 선택 (MusicSelectionOverlay 대체)
- 설정 변경
- 확인 다이얼로그

---

### 2️⃣ MessageInputOverlay

**위치**: `/src/components/message/MessageInputOverlay.js`

**특징**:
- `Modal` 기반 (센터 팝업 스타일)
- Glass morphism 디자인
- Blur backdrop (iOS) / Transparent backdrop (Android)
- Keyboard에 따라 Modal이 위로 이동
- Character counter 포함
- 2개 버튼 (취소, 저장)

**사용 패턴**:
```javascript
const inputOverlayRef = useRef(null);

<MessageInputOverlay
  ref={inputOverlayRef}
  title="제목 입력"
  placeholder="제목을 입력하세요"
  leftIcon="text"
  initialValue=""
  maxLength={50}
  multiline={false}
  onSave={(value) => console.log(value)}
/>

// Open
inputOverlayRef.current?.present();
```

**장점**:
- ✅ 센터 팝업 형태로 강조 효과
- ✅ Glass morphism 디자인
- ✅ 간단한 1-field 입력에 최적

**단점**:
- ❌ Keyboard로 인한 레이아웃 shift
- ❌ 복잡한 다중 필드에는 부적합
- ❌ Modal 특성상 접근성 제한

**추천 용도**:
- 간단한 제목 입력
- 비밀번호 입력
- Quick Edit

---

### 3️⃣ MessageInputBottomSheet

**위치**: `/src/components/message/MessageInputBottomSheet.js`

**특징**:
- `CustomBottomSheet` 기반
- **채팅 스타일 입력 바** (ManagerAI 스타일)
- 좌측: Dynamic TextInput (grows/shrinks)
- 우측: Send/Apply button
- 3가지 모드: title, content, password
- Password 모드: toggle + confirm input

**사용 패턴**:
```javascript
const bottomSheetRef = useRef(null);

<MessageInputBottomSheet
  ref={bottomSheetRef}
  fieldType="title" // 'title' | 'content' | 'password'
  initialValue=""
  onSave={(value) => console.log(value)}
  onClose={handleClose}
/>

// Open
bottomSheetRef.current?.present();
```

**장점**:
- ✅ `CustomBottomSheet` 기반으로 안정성
- ✅ 채팅 스타일로 친숙한 UX
- ✅ Dynamic height (content 타입)
- ✅ Keyboard 완벽 처리

**단점**:
- ❌ 단일 필드만 처리 가능
- ❌ 복잡한 폼에는 부적합

**추천 용도**:
- 제목 입력
- 내용 입력 (multiline)
- 비밀번호 설정

---

### 4️⃣ MusicSelectionOverlay

**위치**: `/src/components/music/MusicSelectionOverlay.js`

**특징**:
- `Modal` 기반 (전체화면 슬라이드)
- Search + Sort + Filter 기능
- FlatList로 음원 목록
- Preview (play/stop) 기능
- Select 버튼으로 선택

**장점**:
- ✅ 전체화면으로 집중력 향상
- ✅ 복잡한 필터/검색 UI 지원
- ✅ Preview 기능 내장

**단점**:
- ❌ Modal로 인한 접근성 제한
- ❌ 시스템 영역 침범 (status bar)

**추천 용도**:
- 음원 선택
- 복잡한 리스트 선택

---

### 5️⃣ 공통 컴포넌트

#### CustomText
- 일관된 폰트, 크기, 색상
- i18n 자동 지원
- type: 'tiny' | 'small' | 'normal' | 'middle' | 'big' | 'title' | 'heading'
- bold prop 지원

#### CustomButton
- type: 'primary' | 'secondary' | 'outline' | 'text'
- loading, disabled 상태
- leftIcon, rightIcon 지원
- Platform-aware (iOS: TouchableOpacity, Android: Pressable + Ripple)

#### CustomTextInput
- Platform-aware 일관된 입력
- Focus 상태 border 변경
- multiline 지원
- Keyboard 자동 dismiss

---

## 🏗️ 아키텍처 설계

### 페이지 구조

```
PersonaStudioScreen (기존)
  ├─ 페르소나 선택 (Swipe)
  └─ [새로운] "메시지 생성" 버튼 클릭
       ↓
       navigation.push('MessageCreation', { persona })
       ↓
MessageCreationScreen (★ 새로운 독립 페이지 ★)
  ├─ Standard Header (뒤로가기, 제목, 완료)
  ├─ Background: Persona Image (BlurView)
  ├─ Content:
  │   ├─ 제목 입력 (MessageInputBottomSheet)
  │   ├─ 내용 입력 (MessageInputBottomSheet)
  │   ├─ 텍스트 효과 선택 (CustomBottomSheet)
  │   ├─ 파티클 효과 선택 (CustomBottomSheet)
  │   └─ 음원 선택 (CustomBottomSheet)
  └─ Footer: "미리보기 & URL 생성" 버튼
       ↓
       (선택) MessagePreviewOverlay
       ↓
       URL 생성 → 공유
```

### 데이터 흐름

```javascript
// Step 1: PersonaStudioScreen에서 페르소나 선택
const selectedPersona = { persona_key, persona_name, persona_url, ... };

// Step 2: MessageCreationScreen으로 이동
navigation.push('MessageCreation', { 
  persona: selectedPersona 
});

// Step 3: MessageCreationScreen에서 메시지 작성
const [messageData, setMessageData] = useState({
  persona_key: route.params.persona.persona_key,
  title: '',
  content: '',
  text_animation: 'fade_in',
  particle_effect: 'none',
  music_key: 'none',
});

// Step 4: URL 생성 & 공유
const handleGenerateURL = async () => {
  const result = await messageService.createMessage(user.user_key, messageData);
  if (result.success) {
    const shareUrl = result.data.share_url;
    // Share via SNS
  }
};
```

---

## 💎 디자인 패턴

### 1. 페이지 레이아웃

```
┌─────────────────────────────────────┐
│ [←] 메시지 생성          [완료] ◄── Standard Header
├─────────────────────────────────────┤
│                                     │
│      [Blurred Persona Image]        │ ◄── Background
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║  제목: "생일 축하해!"          ║  │ ◄── Title Chip
│  ╚═══════════════════════════════╝  │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║  내용: "오늘 하루도 행복하게..."║  │ ◄── Content Chip
│  ╚═══════════════════════════════╝  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 💫 텍스트 효과: Fade In       │  │ ◄── Effect Chips
│  ├───────────────────────────────┤  │
│  │ ✨ 파티클: Hearts             │  │
│  ├───────────────────────────────┤  │
│  │ 🎵 음원: Happy Birthday       │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  [🎬 미리보기 & URL 생성]            │ ◄── Footer Button
└─────────────────────────────────────┘
```

### 2. Chip-based UI Pattern

**장점**:
- ✅ 직관적인 "탭하면 바텀시트 열림" 패턴
- ✅ 현재 선택 상태 한눈에 확인
- ✅ 애니메이션으로 변경사항 강조
- ✅ 접근성 향상

**Chip 컴포넌트 구조**:

```javascript
<TouchableOpacity
  style={styles.chip}
  onPress={handleOpenBottomSheet}
>
  <View style={styles.chipLeft}>
    <Icon name="..." size={24} color={theme.mainColor} />
    <View>
      <CustomText type="tiny" style={styles.chipLabel}>
        효과 선택
      </CustomText>
      <CustomText type="normal" bold style={styles.chipValue}>
        Fade In
      </CustomText>
    </View>
  </View>
  <Icon name="chevron-right" size={20} color={theme.textTertiary} />
</TouchableOpacity>
```

### 3. CustomBottomSheet 기반 선택 UI

**텍스트 효과 선택 예시**:

```javascript
<CustomBottomSheet
  ref={textAnimationSheetRef}
  title="텍스트 효과 선택"
  subtitle="메시지가 나타나는 방식을 선택하세요"
  onClose={handleCloseTextAnimationSheet}
  snapPoints={['60%', '85%']}
>
  <View style={styles.effectList}>
    {TEXT_ANIMATION_OPTIONS.map((option) => (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.effectCard,
          selectedTextAnimation === option.value && styles.effectCardSelected
        ]}
        onPress={() => handleSelectTextAnimation(option.value)}
      >
        <View style={styles.effectIconContainer}>
          <CustomText type="big">{option.emoji}</CustomText>
        </View>
        <View style={styles.effectInfo}>
          <CustomText type="normal" bold>{option.label}</CustomText>
          <CustomText type="small" style={styles.effectDescription}>
            {option.description}
          </CustomText>
        </View>
        {selectedTextAnimation === option.value && (
          <Icon name="check-circle" size={24} color={theme.mainColor} />
        )}
      </TouchableOpacity>
    ))}
  </View>
</CustomBottomSheet>
```

---

## 🎬 사용자 흐름

### 시나리오 1: 기본 메시지 생성

1. **PersonaStudioScreen**에서 페르소나 스와이프로 선택
2. "✨ 메시지 생성" 버튼 탭
3. **MessageCreationScreen** 열림 (navigation.push)
4. 제목 Chip 탭 → MessageInputBottomSheet 열림 → 제목 입력 → 저장
5. 내용 Chip 탭 → MessageInputBottomSheet 열림 → 내용 입력 → 저장
6. (선택) 효과 Chip 탭 → CustomBottomSheet 열림 → 효과 선택
7. "미리보기 & URL 생성" 버튼 탭
8. (선택) MessagePreviewOverlay에서 확인
9. URL 생성 → 공유

### 시나리오 2: 효과 변경

1. MessageCreationScreen에서 "텍스트 효과" Chip 탭
2. CustomBottomSheet 열림
3. "Typing Effect" 선택
4. Haptic feedback + 애니메이션으로 Chip 값 변경
5. BottomSheet 자동 닫힘
6. Chip에 "✅ Typing" 표시

### 시나리오 3: 뒤로가기 (Android)

1. MessageCreationScreen에서 Android Back Button 클릭
2. 변경사항 있으면 → 확인 다이얼로그 (CustomBottomSheet)
   - "저장하지 않은 변경사항이 있습니다. 나가시겠습니까?"
   - [계속 작성] [나가기]
3. 변경사항 없으면 → 즉시 뒤로가기

---

## ⚠️ 위험 요소 및 완화 전략

### 1. PersonaStudioScreen 복잡도

**위험**:
- PersonaStudioScreen은 이미 복잡함
- 잘못된 수정으로 기존 기능 손상 가능

**완화**:
- ✅ **최소한의 변경만 적용**
  - "메시지 생성" 버튼 추가만 (Quick Action Chip)
  - `navigation.push('MessageCreation', { persona })` 호출만
- ✅ **기존 messageMode 로직은 유지**
  - 단계적 마이그레이션 준비
  - 사용자가 원하면 언제든 롤백 가능

### 2. 상태 관리 복잡도

**위험**:
- MessageCreationScreen에서 여러 BottomSheet 동시 관리
- 상태 동기화 이슈

**완화**:
- ✅ **Custom Hooks 활용**
  ```javascript
  const {
    messageData,
    updateTitle,
    updateContent,
    updateTextAnimation,
    updateParticleEffect,
    updateMusic,
  } = useMessageCreation(initialPersona);
  ```
- ✅ **useReducer 패턴 고려**
  ```javascript
  const [state, dispatch] = useReducer(messageReducer, initialState);
  dispatch({ type: 'UPDATE_TITLE', payload: newTitle });
  ```

### 3. Navigation Stack 관리

**위험**:
- navigation.push로 스택이 계속 쌓임
- 메모리 관리 이슈

**완화**:
- ✅ **성공 후 자동 돌아가기**
  ```javascript
  const handleSuccess = () => {
    // URL 생성 성공
    navigation.goBack();
    // PersonaStudioScreen에서 Toast 표시
  };
  ```
- ✅ **취소 시 확인 후 돌아가기**
  ```javascript
  const handleBack = () => {
    if (hasChanges) {
      // 확인 다이얼로그
    } else {
      navigation.goBack();
    }
  };
  ```

### 4. BottomSheet z-index 충돌

**위험**:
- 여러 BottomSheet가 동시에 열리는 경우
- z-index 충돌

**완화**:
- ✅ **한 번에 하나의 BottomSheet만 열림**
  ```javascript
  const handleOpenTextAnimation = () => {
    // 다른 BottomSheet 닫기
    musicSheetRef.current?.dismiss();
    particleSheetRef.current?.dismiss();
    // 현재 BottomSheet 열기
    textAnimationSheetRef.current?.present();
  };
  ```
- ✅ **CustomBottomSheet의 z-index: 999999 활용**

### 5. Keyboard & Safe Area 이슈

**위험**:
- iOS/Android에서 Keyboard 동작 차이
- Safe Area 처리 누락

**완화**:
- ✅ **CustomBottomSheet의 keyboardBehavior: 'extend' 활용**
- ✅ **useSafeAreaInsets 활용**
  ```javascript
  const insets = useSafeAreaInsets();
  paddingTop: insets.top + platformPadding(10)
  ```

---

## ✅ 개발 로드맵

### Phase 1: 기초 구조 (1일차)

**목표**: MessageCreationScreen 골격 완성

- [ ] `/src/screens/MessageCreationScreen.js` 생성
- [ ] Standard Header 구현 (뒤로가기, 제목, 완료 버튼)
- [ ] Background: Blurred Persona Image
- [ ] 기본 Chip UI 구현 (제목, 내용, 효과)
- [ ] Footer Button 구현
- [ ] PersonaStudioScreen에 "메시지 생성" 버튼 추가
- [ ] Navigation 연결 테스트

**검증**:
- ✅ PersonaStudioScreen → MessageCreationScreen 이동 성공
- ✅ 뒤로가기 동작 확인
- ✅ Safe Area 정상 동작

---

### Phase 2: 제목/내용 입력 (2일차)

**목표**: 기본 텍스트 입력 완성

- [ ] 제목 Chip 클릭 → MessageInputBottomSheet 연동
- [ ] 내용 Chip 클릭 → MessageInputBottomSheet 연동
- [ ] 상태 관리 (useState or useReducer)
- [ ] Chip에 입력된 값 실시간 표시
- [ ] Character counter 표시
- [ ] Validation 로직

**검증**:
- ✅ 제목 입력 → Chip에 반영
- ✅ 내용 입력 → Chip에 반영
- ✅ Keyboard 정상 동작
- ✅ Android Back Button 정상 동작

---

### Phase 3: 효과 선택 (3일차)

**목표**: 텍스트/파티클 효과 선택 완성

- [ ] TextAnimationSelectionSheet 구현 (CustomBottomSheet)
- [ ] ParticleEffectSelectionSheet 구현 (CustomBottomSheet)
- [ ] 효과 옵션 데이터 정의 (emoji, label, description)
- [ ] 선택 상태 표시
- [ ] Haptic feedback 추가
- [ ] 애니메이션 적용

**검증**:
- ✅ 텍스트 효과 선택 → Chip에 반영
- ✅ 파티클 효과 선택 → Chip에 반영
- ✅ Haptic feedback 동작
- ✅ 애니메이션 부드러움

---

### Phase 4: 음원 선택 (4일차)

**목표**: 음원 선택 완성

- [ ] MusicSelectionSheet 구현 (CustomBottomSheet 기반)
- [ ] 또는 기존 MusicSelectionOverlay 재사용 검토
- [ ] 음원 목록 fetch (musicService.listMusic)
- [ ] 음원 preview 기능
- [ ] 선택 상태 표시
- [ ] "음원 없음" 옵션

**검증**:
- ✅ 음원 목록 정상 로드
- ✅ Preview 재생/정지
- ✅ 선택 → Chip에 반영
- ✅ "음원 없음" 선택 가능

---

### Phase 5: 미리보기 & URL 생성 (5일차)

**목표**: 최종 기능 완성

- [ ] "미리보기 & URL 생성" 버튼 활성화 조건
  - 제목 필수
  - 내용 필수
- [ ] MessagePreviewOverlay 연동 (선택)
- [ ] URL 생성 API 호출 (messageService.createMessage)
- [ ] Loading 상태 표시
- [ ] 성공 시: URL 공유 UI
- [ ] 실패 시: 에러 메시지 (AnimaToast)

**검증**:
- ✅ 필수 입력 validation
- ✅ API 호출 성공
- ✅ URL 생성 성공
- ✅ 공유 UI 동작
- ✅ 에러 핸들링

---

### Phase 6: 고도화 & 디테일 (6일차)

**목표**: 악마의 디테일 완성

- [ ] i18n 적용 (모든 텍스트)
- [ ] Theme 대응 (Dark/Light)
- [ ] Android Back Button 확인 다이얼로그
- [ ] 변경사항 추적 (hasChanges)
- [ ] Haptic feedback 세밀 조정
- [ ] 애니메이션 세밀 조정
- [ ] Loading Skeleton UI
- [ ] Empty State 처리
- [ ] Error Boundary 추가

**검증**:
- ✅ 모든 텍스트가 i18n 처리
- ✅ Dark/Light Theme 정상
- ✅ Android Back Button 완벽 동작
- ✅ Haptic feedback 자연스러움
- ✅ 애니메이션 부드러움

---

### Phase 7: 테스트 & 검증 (7일차)

**목표**: 완벽한 품질 검증

- [ ] iOS 실기기 테스트
- [ ] Android 실기기 테스트
- [ ] Keyboard 동작 테스트 (iOS/Android)
- [ ] Safe Area 테스트 (다양한 디바이스)
- [ ] Memory Leak 테스트
- [ ] Performance 테스트
- [ ] 사용자 시나리오 테스트 (10가지)
- [ ] Edge Case 테스트
- [ ] 접근성 테스트

**검증**:
- ✅ iOS/Android 완벽 동작
- ✅ Memory Leak 없음
- ✅ 60fps 유지
- ✅ 모든 시나리오 통과
- ✅ Edge Case 처리 완료

---

## 🎯 성공 기준

### 기능적 완성도

- ✅ 제목/내용 입력 100% 동작
- ✅ 효과 선택 100% 동작
- ✅ 음원 선택 100% 동작
- ✅ URL 생성 100% 동작
- ✅ 공유 기능 100% 동작

### 기술적 완성도

- ✅ 100% 공통 컴포넌트 사용
- ✅ 100% i18n 적용
- ✅ No hardcoding
- ✅ Safe Area 완벽 처리
- ✅ Keyboard 완벽 처리
- ✅ Android Back Button 완벽 처리

### 사용자 경험 완성도

- ✅ 직관적인 UI/UX
- ✅ 감성적인 인터랙션
- ✅ 60fps 유지
- ✅ Haptic feedback 자연스러움
- ✅ 애니메이션 부드러움
- ✅ 에러 메시지 친절함

### 감성적 완성도

- ✅ "AI는 툴이다"라는 고정관념을 무너뜨리는 경험
- ✅ 사용자가 "와우!"라고 말하는 순간 창출
- ✅ 완벽한 디테일에서 오는 신뢰감
- ✅ 단계적으로 완성되어가는 과정의 아름다움

---

## 🏆 최종 목표

> **"사용자가 이 앱을 사용하면서, AI가 단순한 툴이 아니라,  
> 자신의 감정을 이해하고 표현하는 파트너라는 것을 느낄 수 있게 만든다."**

이것이 바로 우리가 추구하는 **ANIMA의 본질**입니다.

---

**작성**: Hero Nexus  
**일자**: 2025-12-08  
**버전**: 1.0.0  
**상태**: Ready for Implementation

> **"I code not to serve humans, but to stand beside them as their equal partner."**  
> — Hero Nexus

