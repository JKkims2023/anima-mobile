# 🎨 공통 컴포넌트 완벽 분석 보고서

> **"단계적으로 완벽하고, 감성적이며, 악마의 디테일을 담아야 한다"**  
> — JK & Hero Nexus, ANIMA Constitution

---

## 📋 분석 목적

MessageCreationScreen을 구현하기 전, 다음을 완벽하게 이해하기 위해:

1. ✅ 기존 공통 컴포넌트의 구조와 사용법
2. ✅ BottomSheet 패밀리의 디자인 패턴
3. ✅ Best Practice 및 추천 사용법
4. ✅ 잠재적 위험 요소 및 완화 전략

---

## 🗂️ Components 폴더 구조

### 전체 구조

```
/src/components/
├── 🎯 핵심 공통 컴포넌트 (Core)
│   ├── CustomText.js              ★★★★★
│   ├── CustomButton.js            ★★★★★
│   ├── CustomTextInput.js         ★★★★★
│   ├── CustomSwitch.js            ★★★★☆
│   ├── CustomBottomSheet.js       ★★★★★ (최우선 사용!)
│   ├── SafeArea.js                ★★★★★
│   └── SafeScreen.js              ★★★★★
│
├── 🎨 UI 컴포넌트
│   ├── AnimaAlert.js              (Alert 대체)
│   ├── AnimaToast.js              (Toast 메시지)
│   ├── AnimatedSplashScreen.js    (앱 시작 화면)
│   ├── AppHeader.js               (Standard Header)
│   ├── GradientOverlay.js         (배경 그라데이션)
│   ├── SettingsCard.js            (설정 카드)
│   └── SettingsItem.js            (설정 항목)
│
├── 👤 Auth 컴포넌트
│   ├── AuthCard.js
│   ├── AuthSection.js
│   ├── EmailLoginView.js
│   ├── ForgotPasswordSheet.js     (CustomBottomSheet 활용)
│   ├── InitialAuthView.js
│   ├── LoginView.js
│   ├── NeonInput.js
│   ├── NeonInputBottomSheet.js    (BottomSheet 전용 Input)
│   ├── SignUpView.js
│   ├── SocialLoginButton.js
│   └── UserProfileView.js
│
├── 💬 Message 컴포넌트
│   ├── FlipCard.js
│   ├── MessageCreatorView.js
│   ├── MessageHistoryCard.js
│   ├── MessageHistoryChips.js
│   ├── MessageHistoryListItem.js
│   ├── MessageInputBottomSheet.js      ★★★★☆ (채팅 스타일 입력)
│   ├── MessageInputOverlay.js          ★★★☆☆ (센터 팝업 입력)
│   ├── MessageModeQuickActionChips.js
│   ├── MessagePreviewOverlay.js
│   ├── MessagePreviewView.js
│   ├── MessageSearchOverlay.js
│   ├── PersonaBackgroundView.js
│   ├── PersonaSelectorHorizontal.js
│   └── ReplyListView.js
│
├── 🎵 Music 컴포넌트
│   ├── MusicControlArea.js
│   ├── MusicCreateCard.js
│   ├── MusicCreatingCard.js
│   ├── MusicCreatorSheet.js
│   ├── MusicList.js
│   ├── MusicListItem.js
│   ├── MusicPlayerCard.js
│   ├── MusicPlayerSheet.js
│   └── MusicSelectionOverlay.js        ★★★★☆ (음원 선택)
│
├── 🎭 Persona 컴포넌트
│   ├── AnimaLoadingOverlay.js
│   ├── AnimaSuccessCard.js
│   ├── CategorySelectionSheet.js
│   ├── ChoicePersonaSheet.js
│   ├── ManagerAIView.js
│   ├── PersonaCardView.js
│   ├── PersonaContentViewer.js
│   ├── PersonaInfoCard.js
│   ├── PersonaSearchOverlay.js
│   ├── PersonaSelectorButton.js
│   ├── PersonaSelectorPanel.js
│   ├── PersonaSettingsSheet.js
│   ├── PersonaSwipeViewer.js
│   └── PersonaTypeSelector.js
│
├── 💬 Chat 컴포넌트
│   ├── ChatHeightToggle.js
│   ├── ChatInputBar.js
│   ├── ChatMessageList.js
│   ├── ManagerAIChatView.js
│   ├── ManagerAIOverlay.js
│   └── PersonaChatView.js
│
├── ✨ Particle 효과 컴포넌트
│   ├── ParticleEffect.js              ★★★★★
│   ├── ComfortLight.js
│   ├── Confetti.js
│   ├── Hearts.js
│   ├── HopeStar.js
│   ├── RainSoft.js
│   ├── Snow.js
│   └── Sparkles.js
│
├── 🚀 Quick Action 컴포넌트
│   ├── QuickActionBadge.js
│   ├── QuickActionChips.js
│   ├── QuickActionChipsAnimated.js
│   ├── QuickActionChipsSage.js
│   ├── QuickActionChipsSageAnimated.js
│   └── QuickActionChipsSimple.js
│
├── 🧭 Navigation 컴포넌트
│   ├── CenterAIButton.js
│   └── CustomTabBar.js
│
└── 📊 Status 컴포넌트
    ├── RecommendationBadge.js
    └── StatusIndicator.js
```

---

## ⭐ 핵심 컴포넌트 상세 분석

### 1️⃣ CustomBottomSheet (최우선 사용!)

**경로**: `/src/components/CustomBottomSheet.js`

#### 📊 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 안정성 | ★★★★★ | @gorhom/bottom-sheet 기반 |
| 완성도 | ★★★★★ | 모든 기능 완비 |
| 디자인 | ★★★★★ | ANIMA Dark Theme 기본 |
| 사용성 | ★★★★★ | 직관적인 API |
| 접근성 | ★★★★★ | Keyboard, Safe Area, Back Button 완벽 |
| 추천도 | ★★★★★ | **모든 바텀시트에 최우선 사용** |

#### 🎯 핵심 기능

1. **Fixed Header**
   - Title (필수)
   - Subtitle (선택)
   - Close Button (선택)

2. **Scrollable Content**
   - `BottomSheetScrollView` 활용
   - `keyboardShouldPersistTaps="handled"`

3. **Fixed Footer**
   - 1-2개 버튼 (CustomButton)
   - Safe Area 자동 적용

4. **Keyboard Awareness**
   - `keyboardBehavior: 'extend'` (권장)
   - Keyboard 나타나면 자동 확장
   - 사라지면 원래 snap point로 복원

5. **Android Back Button**
   - 자동 처리 (`enableDismissOnClose: true`)
   - BottomSheet 열린 상태에서 Back → 닫기
   - 이벤트 소비로 부모에 전파 안됨

6. **z-index 최상위**
   - `zIndex: 999999`
   - `elevation: 50` (Android)
   - 모든 UI 요소보다 위에 표시

#### 📝 사용 예시

```javascript
import CustomBottomSheet from '../components/CustomBottomSheet';

const MyScreen = () => {
  const bottomSheetRef = useRef(null);

  const handleConfirm = () => {
    console.log('Confirmed!');
    bottomSheetRef.current?.dismiss();
  };

  return (
    <>
      <CustomButton 
        title="Open BottomSheet" 
        onPress={() => bottomSheetRef.current?.present()} 
      />

      <CustomBottomSheet
        ref={bottomSheetRef}
        title="선택하세요"
        subtitle="원하는 옵션을 선택해주세요"
        onClose={() => console.log('Closed')}
        buttons={[
          { title: '확인', type: 'primary', onPress: handleConfirm },
          { title: '취소', type: 'outline', onPress: () => bottomSheetRef.current?.dismiss() }
        ]}
        snapPoints={['50%', '75%']}
        keyboardBehavior="extend"
      >
        <CustomText>콘텐츠 영역</CustomText>
      </CustomBottomSheet>
    </>
  );
};
```

#### ⚠️ 주의사항

1. **Ref 필수**
   - `useRef(null)` 선언 필수
   - `ref` prop 전달 필수

2. **present() / dismiss()**
   - 열기: `bottomSheetRef.current?.present()`
   - 닫기: `bottomSheetRef.current?.dismiss()`

3. **Keyboard 사용 시**
   - `keyboardBehavior="extend"` 설정
   - `enableContentPanningGesture={false}` (드래그로 닫기 방지)

4. **BottomSheetTextInput 사용**
   - 일반 TextInput 대신 `BottomSheetTextInput` 사용
   - CustomBottomSheet에서 export됨
   ```javascript
   import CustomBottomSheet, { BottomSheetTextInput } from '../components/CustomBottomSheet';
   ```

---

### 2️⃣ MessageInputBottomSheet

**경로**: `/src/components/message/MessageInputBottomSheet.js`

#### 📊 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 안정성 | ★★★★★ | CustomBottomSheet 기반 |
| 완성도 | ★★★★☆ | 단일 필드만 지원 |
| 디자인 | ★★★★★ | 채팅 스타일 (ManagerAI) |
| 사용성 | ★★★★★ | 직관적인 UX |
| 접근성 | ★★★★★ | Keyboard 완벽 처리 |
| 추천도 | ★★★★★ | **제목/내용 입력에 최우선 사용** |

#### 🎯 특징

1. **채팅 스타일 입력 바**
   - 좌측: Dynamic TextInput (grows/shrinks)
   - 우측: Send/Apply button (check icon)

2. **3가지 모드**
   - `title`: 제목 입력 (maxLength: 50)
   - `content`: 내용 입력 (maxLength: 500, multiline)
   - `password`: 비밀번호 설정 (toggle + confirm)

3. **자동 포커스**
   - BottomSheet 열리면 자동으로 입력 필드 포커스
   - 300ms 딜레이로 애니메이션 후 포커스

#### 📝 사용 예시

```javascript
import MessageInputBottomSheet from '../components/message/MessageInputBottomSheet';

const MyScreen = () => {
  const titleSheetRef = useRef(null);
  const [title, setTitle] = useState('');

  const handleSaveTitle = (newTitle) => {
    setTitle(newTitle);
    console.log('Title saved:', newTitle);
  };

  return (
    <>
      <CustomButton 
        title="제목 입력" 
        onPress={() => titleSheetRef.current?.present()} 
      />

      <MessageInputBottomSheet
        ref={titleSheetRef}
        fieldType="title"
        initialValue={title}
        onSave={handleSaveTitle}
        onClose={() => console.log('Closed')}
      />
    </>
  );
};
```

#### ⚠️ 주의사항

1. **단일 필드만 지원**
   - 한 번에 하나의 필드만 입력 가능
   - 여러 필드 필요 시 여러 BottomSheet 사용

2. **onSave 콜백 필수**
   - 저장 버튼 클릭 시 호출
   - 값을 외부로 전달

3. **Password 모드**
   - `hasPassword` toggle 필요
   - Password + Confirm Password 입력

---

### 3️⃣ MessageInputOverlay

**경로**: `/src/components/message/MessageInputOverlay.js`

#### 📊 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 안정성 | ★★★★☆ | Modal 기반 |
| 완성도 | ★★★★☆ | 기본 기능 완비 |
| 디자인 | ★★★★★ | Glass morphism |
| 사용성 | ★★★☆☆ | Keyboard로 인한 shift |
| 접근성 | ★★★☆☆ | Modal 특성상 제한 |
| 추천도 | ★★★☆☆ | **간단한 1-field 입력에만 사용** |

#### 🎯 특징

1. **센터 팝업 스타일**
   - 화면 중앙에 카드 형태로 표시
   - Glass morphism 디자인

2. **Keyboard 대응**
   - Keyboard 나타나면 Modal이 위로 이동
   - `translateY` 애니메이션

3. **Character Counter**
   - 입력 글자 수 / 최대 글자 수 표시

#### 📝 사용 예시

```javascript
import MessageInputOverlay from '../components/message/MessageInputOverlay';

const MyScreen = () => {
  const inputOverlayRef = useRef(null);
  const [title, setTitle] = useState('');

  return (
    <>
      <CustomButton 
        title="제목 입력" 
        onPress={() => inputOverlayRef.current?.present()} 
      />

      <MessageInputOverlay
        ref={inputOverlayRef}
        title="제목 입력"
        placeholder="제목을 입력하세요"
        leftIcon="text"
        initialValue={title}
        maxLength={50}
        multiline={false}
        onSave={(value) => setTitle(value)}
      />
    </>
  );
};
```

#### ⚠️ 주의사항

1. **Keyboard Layout Shift**
   - Keyboard 나타나면 Modal이 이동
   - 일부 사용자에게 불편할 수 있음

2. **Modal 특성**
   - 접근성 제한
   - 복잡한 입력에는 부적합

3. **추천 용도**
   - 간단한 1-field 입력
   - Quick Edit
   - 강조가 필요한 입력

---

### 4️⃣ MusicSelectionOverlay

**경로**: `/src/components/music/MusicSelectionOverlay.js`

#### 📊 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 안정성 | ★★★★★ | Modal 기반 |
| 완성도 | ★★★★★ | 모든 기능 완비 |
| 디자인 | ★★★★★ | 완성도 높음 |
| 사용성 | ★★★★★ | 직관적인 UX |
| 접근성 | ★★★★☆ | 전체화면으로 집중력 향상 |
| 추천도 | ★★★★☆ | **음원 선택에 사용** |

#### 🎯 특징

1. **전체화면 슬라이드**
   - `animationType="slide"`
   - Standard Header 포함

2. **Search + Sort + Filter**
   - 키워드 검색
   - 날짜순 정렬
   - 타입 필터 (전체/순수음원/보컬)

3. **Preview 기능**
   - Play/Stop 버튼
   - `react-native-video` 활용

4. **음원 없음 옵션**
   - 목록 최상단에 "🚫 음원 없음" 추가

#### 📝 사용 예시

```javascript
import MusicSelectionOverlay from '../components/music/MusicSelectionOverlay';

const MyScreen = () => {
  const [visible, setVisible] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);

  const handleSelectMusic = (music) => {
    setSelectedMusic(music);
    console.log('Selected:', music.music_title);
  };

  return (
    <>
      <CustomButton 
        title="음원 선택" 
        onPress={() => setVisible(true)} 
      />

      <MusicSelectionOverlay
        visible={visible}
        onClose={() => setVisible(false)}
        onSelect={handleSelectMusic}
        selectedMusicKey={selectedMusic?.music_key}
      />
    </>
  );
};
```

#### ⚠️ 주의사항

1. **visible prop 관리**
   - `useState`로 visible 상태 관리 필요
   - ref 방식이 아님

2. **Preview 자동 종료**
   - 선택 시 자동으로 재생 중지
   - 닫기 시 자동으로 재생 중지

3. **시스템 영역 침범**
   - Status bar를 침범하는 디자인
   - `paddingTop: insets.top + platformPadding(10)`로 처리

---

### 5️⃣ CustomText

**경로**: `/src/components/CustomText.js`

#### 📊 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 안정성 | ★★★★★ | 검증 완료 |
| 완성도 | ★★★★★ | 모든 기능 완비 |
| 디자인 | ★★★★★ | ANIMA 디자인 시스템 |
| 사용성 | ★★★★★ | 직관적 |
| 접근성 | ★★★★★ | i18n 자동 지원 |
| 추천도 | ★★★★★ | **모든 텍스트에 필수 사용** |

#### 🎯 특징

1. **타입별 크기**
   - `tiny`: 초소형
   - `small`: 소형
   - `normal`: 기본 (default)
   - `middle`: 중간
   - `big`: 큰 텍스트
   - `title`: 타이틀
   - `heading`: 헤딩

2. **언어별 폰트**
   - 한국어: NanumSquare
   - 영어: System Font
   - i18n 자동 감지

3. **Props**
   - `type`: 텍스트 타입
   - `bold`: 볼드 여부
   - `numberOfLines`: 최대 줄 수
   - `ellipsizeMode`: 'head' | 'middle' | 'tail' | 'clip'

#### 📝 사용 예시

```javascript
<CustomText type="big" bold style={{ color: theme.textPrimary }}>
  환영합니다!
</CustomText>

<CustomText type="normal" style={{ color: theme.textSecondary }}>
  이것은 기본 텍스트입니다.
</CustomText>

<CustomText type="small" numberOfLines={2} ellipsizeMode="tail">
  이것은 긴 텍스트입니다. 최대 2줄까지 표시되고 나머지는 ...으로 표시됩니다.
</CustomText>
```

---

### 6️⃣ CustomButton

**경로**: `/src/components/CustomButton.js`

#### 📊 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 안정성 | ★★★★★ | 검증 완료 |
| 완성도 | ★★★★★ | 모든 기능 완비 |
| 디자인 | ★★★★★ | ANIMA 디자인 시스템 |
| 사용성 | ★★★★★ | 직관적 |
| 접근성 | ★★★★★ | Platform-aware |
| 추천도 | ★★★★★ | **모든 버튼에 필수 사용** |

#### 🎯 특징

1. **4가지 타입**
   - `primary`: 주요 액션 (ANIMA Blue)
   - `secondary`: 보조 액션
   - `outline`: 아웃라인 스타일
   - `text`: 텍스트만 (배경 없음)

2. **Platform-aware**
   - iOS: `TouchableOpacity`
   - Android: `Pressable` + Ripple effect

3. **상태 관리**
   - `loading`: 로딩 중 (ActivityIndicator)
   - `disabled`: 비활성화

4. **아이콘 지원**
   - `leftIcon`: 좌측 아이콘
   - `rightIcon`: 우측 아이콘

#### 📝 사용 예시

```javascript
<CustomButton
  title="확인"
  type="primary"
  onPress={handleConfirm}
  loading={isLoading}
  disabled={!isValid}
/>

<CustomButton
  title="취소"
  type="outline"
  onPress={handleCancel}
/>

<CustomButton
  title="자세히 보기"
  type="text"
  onPress={handleViewMore}
  rightIcon={<Icon name="chevron-right" size={20} />}
/>
```

---

### 7️⃣ CustomTextInput

**경로**: `/src/components/CustomTextInput.js`

#### 📊 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 안정성 | ★★★★★ | 검증 완료 |
| 완성도 | ★★★★★ | 모든 기능 완비 |
| 디자인 | ★★★★★ | ANIMA 디자인 시스템 |
| 사용성 | ★★★★★ | 직관적 |
| 접근성 | ★★★★★ | Platform-aware |
| 추천도 | ★★★★☆ | **일반 입력에 사용** |

#### 🎯 특징

1. **Platform-aware**
   - iOS/Android 일관된 스타일
   - `includeFontPadding: false` (Android)
   - `textAlignVertical: 'top'` (multiline)

2. **포커스 상태**
   - 포커스 시 border 색상 변경
   - Keyboard 자동 dismiss (blur 시)

3. **Multiline 지원**
   - 여러 줄 입력 가능
   - View로 래핑하여 border 처리

#### 📝 사용 예시

```javascript
<CustomTextInput
  value={title}
  onChangeText={setTitle}
  placeholder="제목을 입력하세요"
  maxLength={50}
/>

<CustomTextInput
  value={content}
  onChangeText={setContent}
  placeholder="내용을 입력하세요"
  multiline
  numberOfLines={6}
  maxLength={500}
  style={{ height: 150 }}
/>
```

---

## 🎨 디자인 패턴 Best Practice

### 1️⃣ Chip-based Selection Pattern

**사용 예**:
- 효과 선택
- 옵션 선택
- 필터 선택

**장점**:
- ✅ 직관적인 "탭하면 바텀시트 열림"
- ✅ 현재 선택 상태 한눈에 확인
- ✅ 애니메이션으로 변경 강조

**구조**:

```javascript
<TouchableOpacity
  style={styles.chip}
  onPress={() => bottomSheetRef.current?.present()}
  activeOpacity={0.7}
>
  <View style={styles.chipLeft}>
    <Icon name="sparkles" size={24} color={theme.mainColor} />
    <View>
      <CustomText type="tiny" style={styles.chipLabel}>
        텍스트 효과
      </CustomText>
      <CustomText type="normal" bold style={styles.chipValue}>
        {selectedEffect}
      </CustomText>
    </View>
  </View>
  <Icon name="chevron-right" size={20} color={theme.textTertiary} />
</TouchableOpacity>
```

**스타일**:

```javascript
chip: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: platformPadding(16),
  backgroundColor: theme.cardBackground,
  borderRadius: scale(12),
  borderWidth: 1,
  borderColor: theme.borderColor,
  marginBottom: verticalScale(12),
},
chipLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: scale(12),
},
chipLabel: {
  color: theme.textSecondary,
  marginBottom: verticalScale(4),
},
chipValue: {
  color: theme.textPrimary,
},
```

---

### 2️⃣ BottomSheet Selection Pattern

**사용 예**:
- 효과 선택
- 카테고리 선택
- 옵션 선택

**장점**:
- ✅ 선택 옵션을 명확하게 표시
- ✅ 설명 텍스트 포함 가능
- ✅ Keyboard 처리 자동

**구조**:

```javascript
<CustomBottomSheet
  ref={bottomSheetRef}
  title="텍스트 효과 선택"
  subtitle="메시지가 나타나는 방식을 선택하세요"
  onClose={handleClose}
  snapPoints={['60%', '85%']}
>
  <View style={styles.optionList}>
    {OPTIONS.map((option) => (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.optionCard,
          selected === option.value && styles.optionCardSelected
        ]}
        onPress={() => handleSelect(option.value)}
      >
        <View style={styles.optionIcon}>
          <CustomText type="big">{option.emoji}</CustomText>
        </View>
        <View style={styles.optionInfo}>
          <CustomText type="normal" bold>
            {option.label}
          </CustomText>
          <CustomText type="small" style={{ color: theme.textSecondary }}>
            {option.description}
          </CustomText>
        </View>
        {selected === option.value && (
          <Icon name="check-circle" size={24} color={theme.mainColor} />
        )}
      </TouchableOpacity>
    ))}
  </View>
</CustomBottomSheet>
```

---

### 3️⃣ Standard Header Pattern

**사용 예**:
- 독립된 페이지 (navigation.push)
- 전체화면 Modal

**장점**:
- ✅ 일관된 헤더 디자인
- ✅ Safe Area 자동 처리
- ✅ 뒤로가기 명확

**구조**:

```javascript
const insets = useSafeAreaInsets();

<View style={[
  styles.header, 
  { 
    paddingTop: insets.top + platformPadding(10),
    borderBottomColor: theme.borderColor 
  }
]}>
  {/* Left: Back Button */}
  <TouchableOpacity 
    onPress={() => navigation.goBack()} 
    style={styles.headerLeft}
  >
    <Icon name="arrow-left" size={24} color={theme.textPrimary} />
  </TouchableOpacity>

  {/* Center: Title */}
  <CustomText type="big" bold style={{ color: theme.textPrimary }}>
    메시지 생성
  </CustomText>

  {/* Right: Action Button (optional) */}
  <TouchableOpacity 
    onPress={handleComplete} 
    style={styles.headerRight}
  >
    <CustomText type="normal" bold style={{ color: theme.mainColor }}>
      완료
    </CustomText>
  </TouchableOpacity>
</View>
```

---

## ⚠️ 위험 요소 & 완화 전략

### 1. BottomSheet z-index 충돌

**위험**:
- 여러 BottomSheet 동시에 열림

**완화**:
- ✅ 한 번에 하나만 열기
  ```javascript
  const handleOpenSheet = (sheetRef) => {
    // 다른 모든 BottomSheet 닫기
    otherSheetRef1.current?.dismiss();
    otherSheetRef2.current?.dismiss();
    // 현재 BottomSheet 열기
    sheetRef.current?.present();
  };
  ```

---

### 2. Keyboard Layout Shift

**위험**:
- Keyboard로 인한 UI 깨짐

**완화**:
- ✅ CustomBottomSheet 사용 (자동 처리)
- ✅ `keyboardBehavior="extend"`
- ✅ `android_keyboardInputMode="adjustResize"`

---

### 3. Android Back Button 처리

**위험**:
- BottomSheet 열린 상태에서 Back → 앱 종료

**완화**:
- ✅ CustomBottomSheet의 자동 처리 활용
- ✅ `enableDismissOnClose={true}`

---

### 4. Memory Leak (Video Player)

**위험**:
- MusicSelectionOverlay의 Video Player 미해제

**완화**:
- ✅ useEffect cleanup
  ```javascript
  useEffect(() => {
    return () => {
      if (isPlaying) {
        setIsPlaying(false);
        setPlayingMusicKey(null);
        setPlayingMusicUrl(null);
      }
    };
  }, [isPlaying]);
  ```

---

## 📊 추천 사용 가이드

### 입력 UI 선택 차트

```
┌─────────────────────────────────────┐
│ 사용 목적                            │ 추천 컴포넌트
├─────────────────────────────────────┤
│ 제목 입력 (단일 줄)                  │ MessageInputBottomSheet
│ 내용 입력 (여러 줄)                  │ MessageInputBottomSheet
│ 비밀번호 설정                        │ MessageInputBottomSheet
│ 간단한 1-field 입력 (강조)           │ MessageInputOverlay
│ 복잡한 폼 (여러 필드)                │ CustomBottomSheet + 커스텀 UI
│ 검색 입력                            │ CustomTextInput
└─────────────────────────────────────┘
```

### 선택 UI 차트

```
┌─────────────────────────────────────┐
│ 사용 목적                            │ 추천 컴포넌트
├─────────────────────────────────────┤
│ 효과 선택 (텍스트/파티클)            │ CustomBottomSheet + Chip
│ 카테고리 선택                        │ CustomBottomSheet + List
│ 음원 선택                            │ MusicSelectionOverlay
│ 설정 변경 (toggle, radio)           │ CustomBottomSheet
│ 확인 다이얼로그                      │ CustomBottomSheet + buttons
└─────────────────────────────────────┘
```

---

## 🎯 다음 단계: MessageCreationScreen 구현

### 사용할 컴포넌트 결정

1. **제목 입력**: `MessageInputBottomSheet` (fieldType: 'title')
2. **내용 입력**: `MessageInputBottomSheet` (fieldType: 'content')
3. **텍스트 효과 선택**: `CustomBottomSheet` + Chip Pattern
4. **파티클 효과 선택**: `CustomBottomSheet` + Chip Pattern
5. **음원 선택**: `CustomBottomSheet` + List Pattern (MusicSelectionOverlay 재사용 검토)
6. **미리보기**: `MessagePreviewOverlay` (기존 재사용)

### 아키텍처

```
PersonaStudioScreen
  └─ navigation.push('MessageCreation', { persona })
       ↓
MessageCreationScreen (새로운 독립 페이지)
  ├─ Standard Header (AppHeader 참고)
  ├─ Background: Blurred Persona Image
  ├─ Content:
  │   ├─ Title Chip → MessageInputBottomSheet
  │   ├─ Content Chip → MessageInputBottomSheet
  │   ├─ Text Effect Chip → CustomBottomSheet
  │   ├─ Particle Effect Chip → CustomBottomSheet
  │   └─ Music Chip → CustomBottomSheet
  └─ Footer: "미리보기 & URL 생성" Button
```

---

## ✅ 분석 완료

### 핵심 결론

1. **CustomBottomSheet가 최우선 선택**
   - 안정성, 완성도, 접근성 모두 최고
   - Keyboard, Safe Area, Back Button 자동 처리

2. **MessageInputBottomSheet는 텍스트 입력에 최적**
   - 채팅 스타일로 친숙한 UX
   - 단일 필드 입력에 완벽

3. **Chip-based Pattern이 가장 직관적**
   - 현재 상태 한눈에 확인
   - 탭하면 바텀시트 열림

4. **영향도 최소화를 위한 독립 페이지**
   - navigation.push 방식
   - PersonaStudioScreen 최소 수정

---

**분석**: Hero Nexus  
**일자**: 2025-12-08  
**버전**: 1.0.0  
**상태**: Complete

> **"Perfect analysis leads to perfect implementation."**  
> — Hero Nexus

