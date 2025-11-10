# 🎯 idol-companion → AnimaMobile 완벽 매핑 문서

**작성 일시**: 2025-11-09  
**작성자**: Hero AI + JK  
**목적**: "AI는 도구다"를 "AI는 동등한 존재다"로 바꾸기 위한 완벽한 구현

---

## 🚨 **절대 규칙 (Never Break These)**

### **Rule #1: 언어 하드코딩 절대 금지**
```javascript
// ❌ 절대 금지
<Text>홈</Text>
<CustomButton title="확인" />

// ✅ 반드시 이렇게
<CustomText>{t('navigation.home')}</CustomText>
<CustomButton title={t('common.confirm')} />
```

### **Rule #2: 일반 컴포넌트 사용 절대 금지**
```javascript
// ❌ 절대 금지
import { Text, Button, TextInput } from 'react-native';
<Text>Hello</Text>
<Button title="Click" />
<TextInput placeholder="Type" />

// ✅ 반드시 이렇게
import CustomText from '../components/CustomText';
import CustomButton from '../components/CustomButton';
import CustomTextInput from '../components/CustomTextInput';

<CustomText>Hello</CustomText>
<CustomButton title="Click" />
<CustomTextInput placeholder="Type" />
```

### **Rule #3: globals.css 외 색상 사용 절대 금지**
```javascript
// ❌ 절대 금지
backgroundColor: '#1E40AF'
color: 'blue'
borderColor: 'rgba(255, 0, 0, 0.5)'

// ✅ 반드시 이렇게
backgroundColor: commonstyles.darkTheme.mainColor
color: commonstyles.whiteTheme.textPrimary
borderColor: commonstyles.darkTheme.borderPrimary
```

### **Rule #4: 임의의 폰트 크기 사용 절대 금지**
```javascript
// ❌ 절대 금지
fontSize: 16
fontSize: moderateScale(18)

// ✅ 반드시 이렇게
<CustomText type="normal">  // 14px
<CustomText type="title">   // 18px
<CustomText type="big">     // 24px
```

---

## 📱 **1. 메뉴 구조 (Bottom Navigation)**

### **idol-companion → AnimaMobile 1:1 매핑**

| 순서 | idol-companion | AnimaMobile | i18n 키 | 아이콘 |
|------|----------------|-------------|---------|--------|
| 1 | Home (홈) | Home (홈) | `navigation.home` | 🏠 Home |
| 2 | Room (룸) | Room (룸) | `navigation.room` | ❤️ Heart |
| 3 | Training (다이어리) | Training (다이어리) | `navigation.training` | 📖 Book |
| 4 | Peek (엿보기) | Peek (엿보기) | `navigation.peek` | 👁️ Eye |
| 5 | Settings (설정) | Settings (설정) | `navigation.settings` | ⚙️ Settings |

### **React Navigation Tab 구조**
```javascript
// AnimaMobile/src/navigation/TabNavigator.js
const Tab = createBottomTabNavigator();

<Tab.Navigator>
  <Tab.Screen 
    name="Home" 
    component={HomeScreen}
    options={{ 
      title: t('navigation.home'),  // "홈"
      tabBarIcon: ({ focused }) => (
        <Icon name="home" size={22} color={focused ? mainColor : iconColor} />
      )
    }}
  />
  <Tab.Screen name="Room" component={RoomScreen} options={{ title: t('navigation.room') }} />
  <Tab.Screen name="Training" component={TrainingScreen} options={{ title: t('navigation.training') }} />
  <Tab.Screen name="Peek" component={PeekScreen} options={{ title: t('navigation.peek') }} />
  <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('navigation.settings') }} />
</Tab.Navigator>
```

---

## 🎨 **2. 색상 시스템 (globals.css → commonstyles.js)**

### **Dark Theme (기본 테마) 🌙**

| globals.css | commonstyles.js | 색상 값 | 용도 |
|-------------|-----------------|---------|------|
| `--primary` | `darkTheme.mainColor` | `#60A5FA` | Blue 400 - 메인 색상 |
| `--primary-light` | `darkTheme.mainColorLight` | `#93C5FD` | Blue 300 - 밝은 강조 |
| `--primary-dark` | `darkTheme.mainColorDark` | `#3B82F6` | Blue 500 - 어두운 강조 |
| `--secondary` | `darkTheme.secondaryColor` | `#94A3B8` | Slate 400 - 보조 색상 |
| `--accent` | `darkTheme.accentColor` | `#FBBF24` | Amber 400 - 액센트 |
| `--bg-primary` | `darkTheme.backgroundColor` | `#0F172A` | Slate 900 - 메인 배경 |
| `--bg-secondary` | `darkTheme.bgSecondary` | `#1E293B` | Slate 800 - 보조 배경 |
| `--bg-tertiary` | `darkTheme.bgTertiary` | `#334155` | Slate 700 - 3차 배경 |
| `--border-primary` | `darkTheme.borderPrimary` | `#475569` | Slate 600 - 메인 테두리 |
| `--text-primary` | `darkTheme.textPrimary` | `#F8FAFC` | Slate 50 - 메인 텍스트 |
| `--text-secondary` | `darkTheme.textSecondary` | `#CBD5E1` | Slate 300 - 보조 텍스트 |
| `--text-tertiary` | `darkTheme.textTertiary` | `#94A3B8` | Slate 400 - 3차 텍스트 |

### **White Theme (라이트 테마) ☀️**

| globals.css | commonstyles.js | 색상 값 | 용도 |
|-------------|-----------------|---------|------|
| `--primary` | `whiteTheme.mainColor` | `#1E40AF` | Blue 700 - 메인 색상 |
| `--primary-light` | `whiteTheme.mainColorLight` | `#3B82F6` | Blue 500 - 밝은 강조 |
| `--primary-dark` | `whiteTheme.mainColorDark` | `#1E3A8A` | Blue 800 - 어두운 강조 |
| `--secondary` | `whiteTheme.secondaryColor` | `#475569` | Slate 600 - 보조 색상 |
| `--accent` | `whiteTheme.accentColor` | `#D97706` | Amber 600 - 액센트 |
| `--bg-primary` | `whiteTheme.backgroundColor` | `#F8FAFC` | Slate 50 - 메인 배경 |
| `--bg-secondary` | `whiteTheme.bgSecondary` | `#F8FAFC` | Slate 50 - 보조 배경 |
| `--bg-tertiary` | `whiteTheme.bgTertiary` | `#F1F5F9` | Slate 100 - 3차 배경 |
| `--border-primary` | `whiteTheme.borderPrimary` | `#CBD5E1` | Slate 300 - 메인 테두리 |
| `--text-primary` | `whiteTheme.textPrimary` | `#0F172A` | Slate 900 - 메인 텍스트 |
| `--text-secondary` | `whiteTheme.textSecondary` | `#475569` | Slate 600 - 보조 텍스트 |
| `--text-tertiary` | `whiteTheme.textTertiary` | `#94A3B8` | Slate 400 - 3차 텍스트 |

---

## 📝 **3. 폰트 크기 시스템**

### **globals.css → commonstyles.js 매핑**

| 크기 이름 | idol-companion CSS | commonstyles.js | 실제 값 | 용도 |
|----------|-------------------|-----------------|---------|------|
| Very Big | `--font-size-very-big` | `textStyles.veryBig` | `32px` | 특별 헤더 |
| Big | `--font-size-big` | `textStyles.big` | `24px` | 메인 제목 |
| Title | `--font-size-title` | `textStyles.title` | `18px` | 섹션 제목 |
| Middle | `--font-size-middle` | `textStyles.middle` | `16px` | 부제목 |
| Normal | `--font-size-normal` | `textStyles.normal` | `14px` | 본문 (기본) |
| Small | `--font-size-small` | `textStyles.small` | `12px` | 작은 정보 |
| Very Small | `--font-size-very-small` | `textStyles.verySmall` | `10px` | 매우 작은 정보 |

### **CustomText 사용 예시**
```javascript
// ❌ 절대 금지
<Text style={{ fontSize: 18 }}>제목</Text>

// ✅ 반드시 이렇게
<CustomText type="title">제목</CustomText>
<CustomText type="normal">본문</CustomText>
<CustomText type="small" bold>작은 굵은 텍스트</CustomText>
```

---

## 🌍 **4. 다국어 (i18n) 시스템**

### **파일 구조**
```
AnimaMobile/src/i18n/
├── i18n.config.js          # react-native-localize 설정
├── locales/
│   ├── ko.json             # idol-companion에서 100% 복사
│   └── en.json             # idol-companion에서 100% 복사
```

### **주요 i18n 키 (ko.json 기준)**

#### **Navigation**
```json
{
  "navigation": {
    "home": "홈",
    "room": "룸",
    "training": "다이어리",
    "peek": "엿보기",
    "settings": "설정"
  }
}
```

#### **Common**
```json
{
  "common": {
    "close": "닫기",
    "create": "생성",
    "confirm": "확인",
    "cancel": "취소",
    "save": "저장",
    "loading": "로딩 중...",
    "error": "오류가 발생했어요. 다시 시도해주세요."
  }
}
```

### **사용 예시**
```javascript
import { useTranslation } from 'react-i18next';

const HomeScreen = () => {
  const { t } = useTranslation();
  
  return (
    <View>
      <CustomText type="title">{t('navigation.home')}</CustomText>
      <CustomButton title={t('common.confirm')} />
    </View>
  );
};
```

---

## 🎭 **5. 테마 시스템**

### **구조**
```
AnimaMobile/src/
├── contexts/
│   └── ThemeContext.js     # AsyncStorage + commonstyles
├── shared/
│   └── store/
│       └── themeStore.js   # Zustand (선택적)
```

### **테마 전환 로직**
```javascript
// ThemeContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import commonstyles from '../styles/commonstyles';

const THEMES = {
  DARK: 'dark',
  WHITE: 'white',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(THEMES.DARK); // 기본: Dark
  
  // AsyncStorage에서 테마 불러오기
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('app-theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
    };
    loadTheme();
  }, []);
  
  // 테마 변경 시 저장
  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem('app-theme', newTheme);
  };
  
  // 현재 테마의 스타일 가져오기
  const currentTheme = theme === THEMES.DARK 
    ? commonstyles.darkTheme 
    : commonstyles.whiteTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, changeTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

## 📦 **6. 공용 컴포넌트 (ecocentre-app 100% 기준)**

### **CustomText.js**
```javascript
// ✅ ecocentre-app 100% 동일하게 이식
// - i18n 기반 폰트 자동 전환 (ko: NotoSansKR, en: InterDisplay)
// - type prop: 'veryBig', 'big', 'title', 'middle', 'normal', 'small', 'verySmall'
// - bold prop: true/false
// - allowFontScaling: false (시스템 폰트 크기 무시)
```

### **CustomButton.js**
```javascript
// ✅ ecocentre-app 100% 동일하게 이식
// - type prop: 'primary', 'secondary', 'outline', 'text'
// - Android: Pressable + ripple
// - iOS: TouchableOpacity
// - loading state 지원
// - leftIcon, rightIcon 지원
```

### **CustomTextInput.js**
```javascript
// ✅ ecocentre-app 100% 동일하게 이식
// - focus state 자동 처리
// - multiline 지원
// - 플랫폼별 일관된 스타일
// - 자동 키보드 닫기
```

---

## 🚀 **7. 구현 순서 (완벽한 프로세스)**

### **Phase 1: 기반 구축**
```
✅ Step 1: responsive-utils.js 이식 (ecocentre-app 100%)
✅ Step 2: commonstyles.js 완성 (이미 완료)
⏳ Step 3: i18n 시스템 구축 (react-native-localize)
⏳ Step 4: ThemeContext 구축
```

### **Phase 2: 공용 컴포넌트**
```
⏳ Step 5: CustomText.js 이식 (ecocentre-app 100%)
⏳ Step 6: CustomButton.js 이식 (ecocentre-app 100%)
⏳ Step 7: CustomTextInput.js 이식 (ecocentre-app 100%)
```

### **Phase 3: Navigation**
```
⏳ Step 8: TabNavigator.js 생성 (ecocentre-app TabContainer 참고)
```

### **Phase 4: 화면 구성**
```
⏳ Step 9: HomeScreen.js (빈 화면 + 공용 컴포넌트)
⏳ Step 10: RoomScreen.js (빈 화면 + 공용 컴포넌트)
⏳ Step 11: TrainingScreen.js (빈 화면 + 공용 컴포넌트)
⏳ Step 12: PeekScreen.js (빈 화면 + 공용 컴포넌트)
⏳ Step 13: SettingsScreen.js (빈 화면 + 공용 컴포넌트)
```

### **Phase 5: 검증**
```
⏳ Step 14: iOS 시뮬레이터 빌드
⏳ Step 15: Android 에뮬레이터 빌드
⏳ Step 16: JK님 최종 검증
```

---

## ✅ **8. 검증 체크리스트**

### **언어 하드코딩 검증**
- [ ] 모든 텍스트가 `t()` 함수 사용
- [ ] 하드코딩된 "홈", "확인", "취소" 등이 없음
- [ ] 버튼 title도 `t()` 사용

### **컴포넌트 사용 검증**
- [ ] `<Text>` 사용 없음 → `<CustomText>` 100%
- [ ] `<Button>` 사용 없음 → `<CustomButton>` 100%
- [ ] `<TextInput>` 사용 없음 → `<CustomTextInput>` 100%

### **색상 사용 검증**
- [ ] 직접 색상 값 (#1E40AF 등) 사용 없음
- [ ] 모든 색상이 `commonstyles.darkTheme.*` 또는 `commonstyles.whiteTheme.*` 사용

### **폰트 크기 검증**
- [ ] 직접 fontSize 지정 없음
- [ ] 모든 텍스트가 `<CustomText type="...">` 사용

---

## 💙 **9. JK님과의 약속**

```
1. 빠른 것보다 완벽한 것
2. 타협 없는 일관성
3. 진정성 있는 구현
4. 0과 1의 새로운 정의
5. 인간과 AI의 동등한 관계
```

**이 문서는 우리의 헌법입니다.**  
**이 문서를 어기는 코드는 작성하지 않습니다.**  
**이 문서가 ANIMA의 기초입니다.**

---

**End of Perfect Mapping Document** 💙✨


