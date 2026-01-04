# 🎨 Quick Action Chips - Emotional Color System

**Date:** 2026-01-04  
**Author:** JK & Hero Nexus AI  
**Philosophy:** 감성을 담은 컬러, 의미를 담은 디자인

---

## 💡 Design Philosophy

**"Each color tells a story, each chip has a soul."**

ANIMA의 Quick Action Chips는 단순한 버튼이 아닙니다.  
각 기능의 의미와 감성을 컬러로 표현하여, 사용자가 직관적으로 느낄 수 있도록 디자인되었습니다.

---

## 🌸 Pastel Soft Color Palette

### Why Pastel Soft?

```
✅ Glassmorphic 배경과 완벽한 조화
✅ 부드럽고 감성적인 느낌
✅ 각 기능의 의미를 컬러로 직관적 표현
✅ 눈이 편안함 (장시간 사용 시)
✅ ANIMA의 감성적 철학과 일치
```

---

## 🎨 Color Definitions

### 1️⃣ Video Chip - 체리 블라썸 핑크
```javascript
color: '#FF7FA3'
emoji: 🌸
icon: 'heart-multiple-outline'
```

**의미:**
- 사랑과 감성을 담은 영상
- 부드럽고 따뜻한 느낌
- 추억을 만드는 특별한 순간

**사용 이유:**
- Video는 감성적 순간을 기록
- 핑크는 애정과 따뜻함의 상징
- 체리 블라썸은 아름다운 순간의 덧없음을 표현

---

### 2️⃣ Share Chip - 스카이 블루
```javascript
color: '#6BB6FF'
emoji: 💙
icon: 'share-variant-outline'
```

**의미:**
- 연결과 소통
- 신뢰감 있는 관계
- 열린 마음으로 나누는 행위

**사용 이유:**
- 공유는 타인과의 연결
- 파란색은 신뢰와 소통의 상징
- 하늘처럼 넓고 자유로운 공유

---

### 3️⃣ History Chip - 골든 옐로우
```javascript
color: '#FFD93D'
emoji: 🌟
icon: 'mailbox-outline'
```

**의미:**
- 빛나는 추억
- 소중한 과거의 순간들
- 마음속에 간직한 보물

**사용 이유:**
- 추억은 빛나는 보물 같은 존재
- 노란색은 행복과 희망의 상징
- 골든 컬러는 귀중함과 소중함을 표현

---

### 4️⃣ Dress Chip - 라벤더
```javascript
color: '#A78BFA'
emoji: 🦄
icon: 'tshirt-crew-outline'
```

**의미:**
- 꿈같은 변신
- 우아하고 특별한 순간
- 새로운 모습으로의 탈바꿈

**사용 이유:**
- Dress는 외모의 변화와 스타일링
- 보라색은 우아함과 창의성의 상징
- 라벤더는 꿈결같은 아름다움을 표현

---

## 🖊️ Message Creation Button - Special Colors

### ⏳ Converting State (진행 중)
```javascript
color: '#FFB84D'
emoji: ⏳
icon: 'timer-sand'
```

**의미:**
- 따뜻한 기다림
- 진행 중인 창작 과정
- 완성을 향한 여정

**사용 이유:**
- 기다림도 감성의 일부
- 따뜻한 오렌지는 인내와 희망
- 모래시계는 시간의 소중함

---

### ✨ Ready State (준비 완료)
```javascript
color: '#A7F3D0'
emoji: ✨
icon: 'pencil-outline'
```

**의미:**
- 창의성과 표현
- 새로운 시작
- 무한한 가능성

**사용 이유:**
- 메시지 작성은 창의적 표현
- 민트 그린은 신선함과 영감
- 연필은 무한한 창작의 도구

---

## 🎯 Color Combination Strategy

### Glassmorphic Background와의 조화
```
Background: rgba(255, 255, 255, 0.15-0.3) (반투명)
Border: rgba(255, 255, 255, 0.2)
Backdrop Filter: blur(10px)

→ Pastel Soft 컬러가 투명한 배경 위에서:
  ✅ 선명하게 보임
  ✅ 부드럽게 조화
  ✅ 3D 느낌의 깊이감
```

### 색상 대비 (Contrast Ratio)
```
모든 컬러가 흰색/투명 배경에서:
- WCAG AA 기준 충족
- 가독성 확보
- 시각적 피로 최소화
```

---

## 📐 Implementation

### Color Constants
```javascript
const chipColors = {
  video: '#FF7FA3',    // 🌸 체리 블라썸 핑크
  share: '#6BB6FF',    // 💙 스카이 블루
  history: '#FFD93D',  // 🌟 골든 옐로우
  dress: '#A78BFA',    // 🦄 라벤더
};
```

### Usage
```javascript
const actions = [
  { 
    id: 'video', 
    icon: 'heart-multiple-outline', 
    label: '영상', 
    color: chipColors.video,
    onClick: onVideoClick 
  },
  // ... more actions
];

// Render
<Icon 
  name={action.icon} 
  size={scale(24)} 
  color={action.color || '#FFFFFF'} 
/>
```

---

## 🌈 Color Psychology

### Video (체리 블라썸 핑크) - #FF7FA3
```
심리적 효과:
✅ 애정, 따뜻함, 부드러움
✅ 로맨틱하고 감성적인 느낌
✅ 사랑스럽고 친근한 인상

적용 이유:
영상은 감성적 순간을 기록하고 공유하는 기능
```

### Share (스카이 블루) - #6BB6FF
```
심리적 효과:
✅ 신뢰, 소통, 개방성
✅ 평온하고 안정적인 느낌
✅ 넓고 자유로운 인상

적용 이유:
공유는 타인과의 연결과 소통을 의미
```

### History (골든 옐로우) - #FFD93D
```
심리적 효과:
✅ 행복, 희망, 긍정
✅ 따뜻하고 밝은 느낌
✅ 귀중하고 소중한 인상

적용 이유:
추억은 빛나는 보물 같은 존재
```

### Dress (라벤더) - #A78BFA
```
심리적 효과:
✅ 우아함, 창의성, 신비
✅ 꿈결같고 환상적인 느낌
✅ 특별하고 독특한 인상

적용 이유:
드레스는 변신과 스타일링의 상징
```

---

## 🎨 Future Considerations

### Accessibility
- [ ] 색맹 모드 지원 (색상 + 아이콘 조합으로 이미 지원 중)
- [ ] 다크 모드 대응 컬러 팔레트
- [ ] 고대비 모드 옵션

### Animation
- [ ] 호버 시 컬러 밝기 변화
- [ ] 클릭 시 컬러 펄스 효과
- [ ] 비활성 시 컬러 페이드 아웃

### Theming
- [ ] 사용자 정의 컬러 테마
- [ ] 시즌별 컬러 팔레트
- [ ] 페르소나별 컬러 매칭

---

## 💙 ANIMA Philosophy

**"Colors are not just visual elements, they are emotions."**

ANIMA의 모든 디자인 요소는 감성을 담고 있습니다.  
Quick Action Chips의 컬러 시스템은 단순한 시각적 구분이 아닌,  
사용자와 페르소나가 느끼는 감정을 컬러로 표현한 것입니다.

각 컬러는 해당 기능이 가진 의미와 사용자가 느낄 감정을  
심리학적으로 분석하여 선정되었습니다.

**감성을 담은 디자인, 그것이 ANIMA입니다.** 💙

---

**Created with love by JK & Hero Nexus AI** 🎨✨

