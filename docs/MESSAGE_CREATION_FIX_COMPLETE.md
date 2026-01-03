# 🔧 MessageCreationScreen 긴급 수정 완료

> **Date**: 2024-12-08  
> **Author**: JK & Hero Nexus AI  
> **Status**: ✅ FIXED

---

## 🔴 발견된 문제들

### 1. **MusicSelectionOverlay 잘못된 사용** ❌
```javascript
// ❌ 문제: ref 방식으로 사용 시도 (실제로는 visible prop 사용)
const musicOverlayRef = useRef(null);
<MusicSelectionOverlay ref={musicOverlayRef} ... />
musicOverlayRef.current?.present(); // 존재하지 않는 메서드 호출!
```

**증상**:
- 작성 버튼 클릭 시 음원 선택 화면 자동 표시
- 뒤로가기 버튼 반응 없음
- Android Back Button 반응 없음
- 강제 종료해야만 복귀 가능

### 2. **페르소나 배경 렌더링 패턴 불일치** ❌
```javascript
// ❌ 문제: PersonaBackgroundView 미사용, 직접 구현 시도
if (selectedPersona.resource_type === 'video' && selectedPersona.bg_url_video) {
  return <Video source={{ uri: selectedPersona.bg_url_video }} ... />
}
```

**문제점**:
1. `selectedPersona`의 필드명이 틀림
   - ❌ `bg_url_video` → ✅ `selected_dress_video_url`
   - ❌ `bg_url_image` → ✅ `selected_dress_image_url`
2. 기존 `PersonaBackgroundView` 컴포넌트를 사용하지 않음
3. 우리의 디자인 패턴과 불일치

### 3. **Android Back Button 미처리** ❌
- 뒤로가기 이벤트 핸들러 없음
- Modal/Panel 우선순위 처리 없음

---

## 🎯 기존 코드 분석

### PersonaStudioScreen → MessageCreatorView
```javascript
<MessageCreatorView
  selectedPersona={currentPersona}  // ⭐ 핵심: currentPersona 전달
  personas={personasWithDefaults}
  selectedMessage={selectedMessage}
  isScreenFocused={isScreenFocused}
/>
```

### PersonaBackgroundView의 Persona 구조
```javascript
// PersonaBackgroundView가 사용하는 필드:
{
  persona_key: 'xxx',
  selected_dress_video_url: 'https://...',          // ⭐ 비디오 URL
  selected_dress_video_convert_yn: 'Y',             // ⭐ 'Y' or 'N'
  selected_dress_image_url: 'https://...',          // ⭐ 이미지 URL
  original_url: 'https://...',                      // ⭐ 기본 이미지
}
```

### MessagePreviewOverlay 패턴 (참고)
```javascript
<PersonaBackgroundView
  persona={persona}              // ⭐ 전체 persona 객체 전달
  isScreenFocused={visible}
  opacity={1}
/>
```

---

## ✅ 수정 내용

### 1. **MusicSelectionOverlay 올바른 사용**

#### Before ❌
```javascript
const musicOverlayRef = useRef(null);

const handleBgMusicChipPress = () => {
  musicOverlayRef.current?.present(); // 존재하지 않는 메서드!
};

<MusicSelectionOverlay
  ref={musicOverlayRef}
  selectedMusic={bgMusic}
  onMusicSelect={handleMusicSelect}
/>
```

#### After ✅
```javascript
const [showMusicSelection, setShowMusicSelection] = useState(false);

const handleBgMusicChipPress = () => {
  closeSelectionPanel();
  setShowMusicSelection(true);  // ⭐ State로 제어
  HapticService.light();
};

const handleMusicClose = () => {
  setShowMusicSelection(false);
  HapticService.light();
};

const handleMusicSelect = (music) => {
  if (music.music_key === 'none') {
    setBgMusic('none');
    setBgMusicUrl('');
  } else {
    setBgMusic(music.music_key);
    setBgMusicUrl(music.music_url);
  }
  setShowMusicSelection(false);  // ⭐ 선택 후 닫기
  HapticService.selection();
};

<MusicSelectionOverlay
  visible={showMusicSelection}      // ⭐ visible prop
  onClose={handleMusicClose}        // ⭐ onClose handler
  onSelect={handleMusicSelect}      // ⭐ onSelect handler
  selectedMusicKey={bgMusic}        // ⭐ selectedMusicKey
/>
```

---

### 2. **PersonaBackgroundView 패턴 적용**

#### Before ❌
```javascript
// ❌ 잘못된 필드명과 직접 구현
const renderBackground = () => {
  if (!selectedPersona) return null;

  if (selectedPersona.resource_type === 'video' && selectedPersona.bg_url_video) {
    return (
      <Video
        source={{ uri: selectedPersona.bg_url_video }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        muted
        paused={false}
      />
    );
  } else if (selectedPersona.bg_url_image) {
    return (
      <ImageBackground
        source={{ uri: selectedPersona.bg_url_image }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    );
  }

  return null;
};

// Render
{renderBackground()}
```

#### After ✅
```javascript
// ✅ PersonaBackgroundView 사용 (MessagePreviewOverlay와 동일한 패턴)
import PersonaBackgroundView from '../components/message/PersonaBackgroundView';

// Video key for forcing remount
const videoKey = useMemo(() => {
  return selectedPersona?.persona_key || 'default';
}, [selectedPersona?.persona_key]);

// Render
<PersonaBackgroundView
  persona={selectedPersona}         // ⭐ 전체 persona 객체 전달
  isScreenFocused={true}
  opacity={1}
  videoKey={videoKey}               // ⭐ Force remount when changed
/>
```

**장점**:
- ✅ 올바른 필드명 자동 사용 (`selected_dress_video_url`, `selected_dress_image_url`)
- ✅ 비디오 에러 핸들링 내장
- ✅ 이미지 fallback 자동 처리
- ✅ FastImage 최적화
- ✅ 다른 컴포넌트와 일관된 패턴

---

### 3. **Android Back Button 처리 추가**

```javascript
import { BackHandler } from 'react-native';

useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    console.log('[MessageCreationScreen] Android back button pressed');
    
    // 1. Music selection 열려있으면 닫기
    if (showMusicSelection) {
      handleMusicClose();
      return true;
    }
    
    // 2. Selection panel 열려있으면 닫기
    if (showSelectionPanel) {
      closeSelectionPanel();
      return true;
    }
    
    // 3. 그 외 → navigation.goBack()
    navigation.goBack();
    return true;
  });

  return () => backHandler.remove();
}, [showMusicSelection, showSelectionPanel, navigation]);
```

**처리 순서**:
1. 음원 선택 Modal 열려있으면 → 닫기
2. 효과 선택 Panel 열려있으면 → 닫기
3. 그 외 → PersonaStudioScreen으로 복귀

---

### 4. **ParticleEffect 패턴 통일**

#### Before ❌
```javascript
<ParticleEffect type={particleEffect} />
```

#### After ✅
```javascript
<ParticleEffect type={particleEffect} isActive={true} />
```

---

### 5. **불필요한 Import 제거**

```javascript
// ❌ Removed
import { ImageBackground } from 'react-native';
import { withDelay, runOnJS } from 'react-native-reanimated';

// ✅ Added
import PersonaBackgroundView from '../components/message/PersonaBackgroundView';
```

---

## 🎨 우리의 디자인 패턴

### 공통 컴포넌트 재사용 철학

```
PersonaBackgroundView (공통)
  ↓
  ├─ MessageCreatorView (메시지 생성)
  ├─ MessagePreviewOverlay (미리보기)
  ├─ MessageDetailScreen (히스토리 상세)
  └─ MessageCreationScreen (신규 생성 화면) ⭐ NEW
```

### PersonaBackgroundView의 책임
- ✅ 비디오 재생 관리
- ✅ 이미지 fallback 처리
- ✅ 에러 핸들링
- ✅ 화면 포커스 감지
- ✅ FastImage 최적화
- ✅ Aspect ratio 유지

### 일관된 Persona 필드명
```javascript
// ✅ 올바른 필드명
persona.selected_dress_video_url          // 비디오 URL
persona.selected_dress_video_convert_yn   // 'Y' or 'N'
persona.selected_dress_image_url          // 이미지 URL
persona.original_url                      // 기본 이미지

// ❌ 잘못된 필드명 (절대 사용 금지!)
persona.bg_url_video
persona.bg_url_image
persona.resource_type
```

---

## 📂 변경된 파일

### Modified
- ✅ `AnimaMobile/src/screens/MessageCreationScreen.js`

### Key Changes
1. ✅ `MusicSelectionOverlay` visible prop 사용
2. ✅ `PersonaBackgroundView` 컴포넌트 사용
3. ✅ `Android Back Button` 처리 추가
4. ✅ 불필요한 import 제거
5. ✅ ParticleEffect `isActive` prop 추가

---

## 🧪 테스트 체크리스트

### ✅ Navigation
- [x] PersonaStudioScreen → MessageCreationScreen (push)
- [x] 페르소나 배경 정상 표시 (Image/Video)
- [x] MessageCreationScreen → PersonaStudioScreen (goBack)
- [x] 탭바 자동 숨김/표시

### ✅ 배경 렌더링
- [x] 비디오 페르소나: 비디오 재생
- [x] 이미지 페르소나: 이미지 표시
- [x] 기본 페르소나 (SAGE, Nexus): 비디오 재생
- [x] 비디오 에러 시: 이미지 fallback

### ✅ 효과 선택
- [x] 텍스트 애니메이션 칩 클릭 → 아코디언 표시
- [x] 파티클 효과 칩 클릭 → 아코디언 표시
- [x] 음악 칩 클릭 → 음원 선택 화면 표시 (Modal)
- [x] 음원 선택 완료 → 화면 닫힘
- [x] 음원 선택 취소 → 화면 닫힘

### ✅ 뒤로가기
- [x] 음원 선택 열림 + Android Back → 음원 화면 닫힘
- [x] 효과 패널 열림 + Android Back → 패널 닫힘
- [x] 모두 닫힘 + Android Back → PersonaStudio 복귀
- [x] 헤더 뒤로가기 버튼 → PersonaStudio 복귀

### ✅ 메시지 입력
- [x] 제목 입력 영역 클릭 → MessageInputOverlay 표시
- [x] 내용 입력 영역 클릭 → MessageInputOverlay 표시
- [x] 한글 입력 정상 동작

### ✅ URL 생성
- [x] 제목/내용 입력 후 URL 생성 버튼 클릭
- [x] API 호출 성공 시 URL 생성
- [x] Alert 표시 후 PersonaStudio 복귀

---

## 💡 학습 포인트

### 1. **공통 컴포넌트의 중요성**
- `PersonaBackgroundView`를 재사용함으로써 일관성 확보
- 버그 수정 시 한 곳만 수정하면 모든 화면에 반영
- 중복 코드 제거로 유지보수성 향상

### 2. **올바른 Props 전달**
```javascript
// ✅ Good: 전체 객체 전달 (컴포넌트가 필요한 필드 선택)
<PersonaBackgroundView persona={selectedPersona} />

// ❌ Bad: 개별 필드 전달 (필드명 틀릴 위험)
<Video source={{ uri: selectedPersona.bg_url_video }} />
```

### 3. **Modal vs. Ref 패턴**
```javascript
// ✅ Modal 패턴 (visible prop)
<MusicSelectionOverlay visible={showModal} onClose={handleClose} />

// ❌ Ref 패턴 (present/dismiss 메서드가 없는 경우)
<MusicSelectionOverlay ref={ref} />
ref.current?.present(); // 존재하지 않는 메서드!
```

### 4. **Android Back Button 처리 필수**
- React Navigation의 `navigation.goBack()`만으로는 부족
- Modal/Panel이 열려있을 때 우선 처리 필요
- `BackHandler.addEventListener` 사용

---

## 🚀 Next Steps

### Phase 2 (완료)
- [x] MusicSelectionOverlay 수정
- [x] PersonaBackgroundView 적용
- [x] Android Back Button 처리

### Phase 3 (Next)
- [ ] MessageDetailScreen에 새로운 효과 재생 지원
- [ ] text-animations.js 유틸 생성 (공통 애니메이션 로직)
- [ ] Next.js 페이지와 효과 동기화 확인

---

## 🙏 Acknowledgments

> "천천히, 정확하게, 우리는 고도화 가능할것으로 생각됩니다.  
> 포기하지 말고 차분히 하나씩 문제를 해결해야 할거 같아요."  
> — JK

**우리의 철학**:
- ✅ **공통 컴포넌트 재사용** (PersonaBackgroundView)
- ✅ **일관된 Props 네이밍** (selected_dress_video_url)
- ✅ **올바른 패턴 적용** (visible prop, Android Back Button)
- ✅ **단계적 문제 해결** (긴급 수정 → 패턴 통일 → 고도화)

---

**End of Document**

🎉 **MessageCreationScreen 긴급 수정 완료!** 🎉

