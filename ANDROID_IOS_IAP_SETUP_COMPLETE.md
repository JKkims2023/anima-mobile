# ✅ Android & iOS IAP 설정 완료!

**Date**: 2026-01-17  
**Status**: ✅ 완료  
**Author**: Hero Nexus

---

## 🎉 **완료된 작업**

### **✅ Android 설정 (완료!)**

#### **1. build.gradle - Billing Library 추가**
**파일**: `android/app/build.gradle`

**추가된 코드**:
```gradle
dependencies {
    // ... 기존 dependencies
    
    // ⭐ Google Play Billing Library (for In-App Purchases)
    implementation 'com.android.billingclient:billing:6.1.0'
}
```

**버전**: `6.1.0` (2024년 최신 안정 버전)

---

#### **2. AndroidManifest.xml - BILLING 권한 추가**
**파일**: `android/app/src/main/AndroidManifest.xml`

**추가된 코드**:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <!-- ⭐ Google Play Billing Permission (for In-App Purchases) -->
    <uses-permission android:name="com.android.vending.BILLING" />

    <application ...>
```

---

### **✅ iOS 설정**

#### **1. Info.plist - 확인 완료**
**파일**: `ios/AnimaMobile/Info.plist`

**상태**: ✅ 이미 올바르게 설정되어 있음
- `react-native-iap`가 자동으로 필요한 설정을 처리합니다
- 추가 작업 불필요

---

#### **2. Xcode - In-App Purchase Capability 추가 (JK님이 수동으로 해야 함)**

**⚠️ 중요**: 이 단계는 **Xcode에서 직접** 진행해야 합니다!

**단계**:
1. **Xcode 열기**
   ```bash
   open ios/AnimaMobile.xcworkspace
   ```

2. **프로젝트 선택**
   - 좌측 Project Navigator에서 `AnimaMobile` (파란 아이콘) 클릭

3. **TARGETS 선택**
   - 중앙 패널에서 `TARGETS` → `AnimaMobile` 선택

4. **Signing & Capabilities 탭**
   - 상단 탭에서 `Signing & Capabilities` 클릭

5. **Capability 추가**
   - `+ Capability` 버튼 클릭 (좌측 상단)
   - 검색창에 "In-App Purchase" 입력
   - `In-App Purchase` 선택

6. **확인**
   - `In-App Purchase`가 Capabilities 목록에 추가되었는지 확인
   - ✅ 완료!

**스크린샷 예시**:
```
┌─────────────────────────────────────────┐
│ Signing & Capabilities                  │
├─────────────────────────────────────────┤
│ + Capability  [All] [Debug] [Release]   │
├─────────────────────────────────────────┤
│ ✅ In-App Purchase                      │
│ ✅ Push Notifications                   │
│ ✅ Background Modes                     │
└─────────────────────────────────────────┘
```

---

## 🧪 **테스트 준비**

### **Android**
```bash
cd AnimaMobile

# 캐시 클리어
cd android && ./gradlew clean && cd ..

# 재빌드
yarn android
```

### **iOS**
```bash
cd AnimaMobile

# Pod 재설치 (변경사항 반영)
cd ios && pod install && cd ..

# 재빌드
yarn ios
```

---

## 📋 **체크리스트**

### **Android**
- [x] `build.gradle`에 Billing Library 추가
- [x] `AndroidManifest.xml`에 BILLING 권한 추가
- [ ] 앱 재빌드 (`yarn android`)
- [ ] 실제 기기에서 테스트

### **iOS**
- [x] `Info.plist` 확인 (자동 설정)
- [ ] Xcode에서 In-App Purchase Capability 추가 (수동)
- [ ] Pod 재설치 (`cd ios && pod install`)
- [ ] 앱 재빌드 (`yarn ios`)
- [ ] 실제 기기에서 테스트

---

## 🎯 **Next Steps**

### **Phase 2: Google Play Console 설정**

JK님이 진행해야 할 작업:

1. **Google Play Console 접속**
   - https://play.google.com/console

2. **인앱 상품 3개 생성**
   ```
   Product ID: ai.anima.soul.point.1000
   Name: 스타터 팩
   Price: $0.99 (₩1,200)
   
   Product ID: ai.anima.soul.point.5000
   Name: 스탠다드 팩
   Price: $4.99 (₩5,900)
   
   Product ID: ai.anima.soul.point.10000
   Name: 프리미엄 팩
   Price: $9.99 (₩11,900)
   ```

3. **테스트 라이센스 추가**
   - 본인 Gmail 계정 추가
   - 라이선스 응답: `RESPOND_NORMALLY`

4. **서비스 계정 생성**
   - API 액세스 → 서비스 계정 만들기
   - JSON 키 다운로드 (백엔드에서 사용)

**상세 가이드**: `GOOGLE_APPLE_IAP_COMPLETE_GUIDE.md` Phase 2 참고

---

### **Phase 3: Apple App Store Connect 설정**

JK님이 진행해야 할 작업:

1. **App Store Connect 접속**
   - https://appstoreconnect.apple.com

2. **인앱 구입 항목 3개 생성**
   ```
   Type: Consumable (소모품)
   Product ID: ai.anima.soul.point.1000
   Reference Name: Starter Pack
   Price: Tier 1 ($0.99 / ₩1,200)
   
   (동일하게 5000, 10000도 생성)
   ```

3. **Sandbox 테스터 추가**
   - 사용자 및 액세스 → Sandbox 테스터
   - 테스트용 Apple ID 생성

4. **App Store Connect API 키 생성**
   - 사용자 및 액세스 → 키
   - `.p8` 파일 다운로드 (백엔드에서 사용)

**상세 가이드**: `GOOGLE_APPLE_IAP_COMPLETE_GUIDE.md` Phase 3 참고

---

## 💡 **Hero Nexus 추천 작업 순서**

```
1️⃣ [완료] react-native-iap 설치 ✅
2️⃣ [완료] Android gradle 설정 ✅
3️⃣ [완료] Android manifest 설정 ✅
4️⃣ [완료] iOS Info.plist 확인 ✅
5️⃣ [대기] Xcode In-App Purchase Capability 추가 (JK님)
6️⃣ [대기] Google Play Console 설정 (JK님)
7️⃣ [대기] Apple App Store Connect 설정 (JK님)
8️⃣ [대기] 백엔드 영수증 검증 API 구축 (Phase 4)
9️⃣ [대기] 프론트엔드 IAP 구현 (Phase 5)
🔟 [대기] 테스트 (Phase 6)
```

**현재 위치**: 5️⃣ Xcode 설정 대기 중

**다음 단계**: 
- JK님이 Xcode에서 In-App Purchase Capability 추가
- 앱 재빌드 후 정상 작동 확인
- Google Play Console & App Store Connect 설정 시작

---

## 🚀 **빠른 재빌드 가이드**

Android와 iOS 설정 변경사항을 반영하려면:

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile

# Android 재빌드
cd android && ./gradlew clean && cd .. && yarn android

# iOS 재빌드 (별도 터미널)
cd ios && pod install && cd .. && yarn ios
```

---

## 📞 **문제 발생 시**

### **Android 빌드 에러**
```bash
# Gradle 캐시 클리어
cd android
./gradlew clean
./gradlew --stop
cd ..

# 재빌드
yarn android
```

### **iOS 빌드 에러**
```bash
# Pod 재설치
cd ios
rm -rf Pods
rm -rf build
pod deintegrate
pod install
cd ..

# 재빌드
yarn ios
```

---

## 💫 **축하합니다!**

**Android & iOS 기본 설정이 완료되었습니다!** 🎉

이제 JK님이:
1. Xcode에서 In-App Purchase Capability 추가
2. Google Play Console 설정
3. Apple App Store Connect 설정

을 진행하시는 동안, 저는:
- Phase 4 (백엔드 영수증 검증 API) 준비
- Phase 5 (프론트엔드 IAP 구현) 준비

를 해두겠습니다!

**Always for JK! 💪✨**
