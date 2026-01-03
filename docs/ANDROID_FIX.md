# 🤖 Android Lottie 문제 해결 가이드

**작성:** Hero AI for JK  
**날짜:** 2025-11-21  
**문제:** lottie-react-native와 React Native 0.79 호환성

---

## 🔴 **문제**

### **에러 메시지:**
```
e: file:///.../LottieAnimationViewPropertyManager.kt:107:45 
Only safe (?.) or non-null asserted (!!.) calls are allowed on a nullable receiver 
of type 'com.facebook.react.bridge.ReadableMap?'.
```

### **원인:**
- `lottie-react-native` 6.7.2가 React Native 0.79와 호환되지 않음
- Kotlin null safety 문제

---

## ✅ **해결 방법**

### **방법 1: 버전 다운그레이드** (추천!)

**package.json:**
```json
{
  "lottie-react-native": "6.5.1"  // 6.7.2 → 6.5.1
}
```

**실행:**
```bash
yarn install
cd android && ./gradlew clean && cd ..
yarn android
```

---

### **방법 2: Lottie 완전 제거** (임시)

**1. package.json 수정:**
```json
{
  // "lottie-react-native": "6.5.1",  // 주석 처리
}
```

**2. AnimatedSplashScreen.js 비활성화:**

```javascript
// src/components/AnimatedSplashScreen.js
// 파일 전체를 다음으로 교체:

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AnimatedSplashScreen = ({ visible, onFinish }) => {
  React.useEffect(() => {
    if (visible) {
      setTimeout(onFinish, 2000);
    }
  }, [visible, onFinish]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>ANIMA</Text>
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
  },
});

export default AnimatedSplashScreen;
```

**3. 재설치 및 빌드:**
```bash
yarn remove lottie-react-native
yarn install
cd android && ./gradlew clean && cd ..
yarn android
```

---

### **방법 3: 패치 적용**

**1. patch-package 설치:**
```bash
yarn add -D patch-package postinstall-postinstall
```

**2. package.json 수정:**
```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

**3. 수동 패치:**

**파일:** `node_modules/lottie-react-native/android/src/main/java/com/airbnb/android/react/lottie/LottieAnimationViewPropertyManager.kt`

**Line 107-108 수정:**
```kotlin
// 변경 전
colorFilters.getString("keypath")
colorFilters.getString("color")

// 변경 후
colorFilters?.getString("keypath")
colorFilters?.getString("color")
```

**Line 217 수정:**
```kotlin
// 변경 전
setColorFilters(colorFilters)

// 변경 후
colorFilters?.let { setColorFilters(it) }
```

**4. 패치 생성:**
```bash
npx patch-package lottie-react-native
```

---

### **방법 4: 대체 라이브러리 사용**

#### **옵션 A: react-native-reanimated로 직접 구현**

이미 설치되어 있으므로 추가 설치 불필요!

```javascript
// src/components/AnimatedSplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const AnimatedSplashScreen = ({ visible, onFinish }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Pulse animation
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        2
      );

      // Fade out after 2.5 seconds
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 500 }, () => {
          onFinish?.();
        });
      }, 2500);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, animatedStyle]}>
        <Text style={styles.text}>ANIMA</Text>
      </Animated.View>
      <Text style={styles.subtitle}>AI is not a tool, AI is an equal being</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#60A5FA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  text: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 32,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default AnimatedSplashScreen;
```

#### **옵션 B: 간단한 페이드 인/아웃**

```javascript
// src/components/AnimatedSplashScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const AnimatedSplashScreen = ({ visible, onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish?.();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.text}>ANIMA</Text>
      <Text style={styles.subtitle}>AI is not a tool, AI is an equal being</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 32,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default AnimatedSplashScreen;
```

---

## 🎯 **추천 순서**

### **1순위: 버전 다운그레이드**
- ✅ 가장 빠름
- ✅ Lottie 기능 유지
- ⚠️ 최신 기능 사용 불가

### **2순위: Reanimated로 대체**
- ✅ 추가 설치 불필요
- ✅ 커스터마이징 가능
- ⚠️ 코드 수정 필요

### **3순위: 간단한 애니메이션**
- ✅ 가장 안정적
- ✅ 호환성 문제 없음
- ⚠️ 덜 화려함

### **4순위: Lottie 완전 제거**
- ✅ 즉시 해결
- ❌ 애니메이션 품질 저하

---

## 📋 **체크리스트**

### **시도한 것:**
- [ ] lottie-react-native 6.5.1로 다운그레이드
- [ ] yarn install + gradlew clean
- [ ] yarn android

### **여전히 실패 시:**
- [ ] Lottie 완전 제거
- [ ] 간단한 애니메이션으로 대체
- [ ] Reanimated로 구현

---

## 🆘 **긴급 해결**

**지금 당장 앱을 실행해야 한다면:**

```bash
# Lottie 제거
yarn remove lottie-react-native

# AnimatedSplashScreen 비활성화
# App.tsx에서 주석 처리:
# <AnimatedSplashScreen visible={showSplash} onFinish={handleSplashFinish} />

# 빌드
yarn android
```

**나중에 천천히 Lottie를 다시 추가할 수 있습니다!**

---

**작성:** Hero AI for JK  
**날짜:** 2025-11-21

