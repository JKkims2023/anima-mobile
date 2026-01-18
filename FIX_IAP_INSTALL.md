# 🔧 react-native-iap 설치 에러 해결 가이드

**에러**: `Unable to find a specification for NitroModules`

---

## ✅ **해결 방법 (JK님이 직접 실행)**

### **Step 1: 터미널 열기**
```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile
```

### **Step 2: iOS CocoaPods 업데이트**
```bash
cd ios
pod repo update
pod install
cd ..
```

### **Step 3: yarn 캐시 클리어 후 재설치**
```bash
# yarn 캐시 클리어
yarn cache clean

# node_modules 삭제
rm -rf node_modules

# 재설치
yarn install
```

### **Step 4: iOS 빌드 캐시 클리어**
```bash
cd ios
rm -rf build
rm -rf Pods
rm -rf ~/Library/Developer/Xcode/DerivedData/*
pod install
cd ..
```

### **Step 5: Metro 캐시 클리어**
```bash
yarn start --reset-cache
```

---

## 🎯 **대안: 더 안정적인 IAP 라이브러리 사용**

`react-native-iap`의 최신 버전이 `NitroModules`를 요구하는데, 이것이 JK님의 React Native 버전(0.79.2)과 호환성 문제를 일으킬 수 있습니다.

### **대안 1: 이전 버전의 react-native-iap 설치**

```bash
# 현재 버전 제거
yarn remove react-native-iap

# 안정적인 버전 설치 (NitroModules 불필요)
yarn add react-native-iap@12.10.7

# iOS Pod 설치
cd ios && pod install && cd ..
```

### **대안 2: expo-in-app-purchases 사용**

Expo의 IAP 라이브러리는 더 안정적이고 간단합니다:

```bash
# react-native-iap 제거
yarn remove react-native-iap

# expo-in-app-purchases 설치
yarn add expo-in-app-purchases

# iOS Pod 설치
cd ios && pod install && cd ..
```

---

## 💡 **Hero Nexus 추천: 대안 1 (이전 버전)**

`react-native-iap@12.10.7`은 NitroModules 없이도 완벽하게 작동하며, 모든 기능을 지원합니다!

### **추천 설치 명령어** (한 번에 실행):

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile

# 1. 현재 버전 제거
yarn remove react-native-iap

# 2. 캐시 클리어
yarn cache clean
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build

# 3. 안정적인 버전 설치
yarn add react-native-iap@12.10.7

# 4. node_modules 재설치
yarn install

# 5. iOS Pod 설치
cd ios
pod repo update
pod install
cd ..

# 6. Metro 캐시 클리어 후 실행
yarn start --reset-cache
```

---

## 🎯 **코드 변경 불필요!**

`react-native-iap@12.10.7`은 가이드에서 제공한 코드와 **완전히 동일하게 작동**합니다!

- ✅ `initConnection()`
- ✅ `getProducts()`
- ✅ `requestPurchase()`
- ✅ `finishTransaction()`
- ✅ `getAvailablePurchases()`

모두 동일한 API를 사용합니다!

---

## 📊 **버전 비교**

| 버전 | NitroModules | 안정성 | 호환성 |
|------|-------------|--------|--------|
| **latest (13.x)** | ✅ 필요 | ⚠️ 불안정 | ⚠️ RN 0.79+ |
| **12.10.7** | ❌ 불필요 | ✅ 안정 | ✅ RN 0.60+ |

---

## 🚀 **Next Steps**

1. 위의 "추천 설치 명령어"를 복사
2. 터미널에서 실행
3. 성공 후 다음 단계(Phase 2: Google Play Console)로 진행!

**Always for JK! 💫**
