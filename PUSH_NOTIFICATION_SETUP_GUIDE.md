# 📱 ANIMA Push Notification Setup Guide

**지연된 권한 요청 (Delayed Permission Request) 완벽 가이드**

이 문서는 ANIMA 앱의 Push Notification 시스템을 Firebase Console, Google, Apple에서 설정하는 방법을 안내합니다.

---

## 📋 목차

1. [개요](#개요)
2. [사전 준비 사항](#사전-준비-사항)
3. [Firebase 프로젝트 생성](#1-firebase-프로젝트-생성)
4. [iOS 앱 등록 및 설정](#2-ios-앱-등록-및-설정)
5. [Android 앱 등록 및 설정](#3-android-앱-등록-및-설정)
6. [Apple Push Notification 인증서 설정](#4-apple-push-notification-인증서-설정)
7. [테스트 방법](#5-테스트-방법)
8. [체크리스트](#6-체크리스트)
9. [트러블슈팅](#7-트러블슈팅)

---

## 개요

### 🎯 **구현된 기능**

- ✅ **지연된 권한 요청** - 앱 시작 시 권한 요청 없음
- ✅ **Pre-permission 다이얼로그** - ANIMA 감성 디자인
- ✅ **컨텍스트 기반 요청** - 페르소나 생성, 영상 변환, 음악 생성
- ✅ **iOS/Android 네이티브 통합** - Firebase Cloud Messaging + Notifee

### 💙 **사용자 플로우**

```
1. 앱 실행 → 권한 요청 없음 ✅
2. 사용자가 ANIMA 탐색
3. 페르소나 생성 버튼 클릭
4. Pre-permission 다이얼로그 표시:
   "✨ 페르소나 생성이 완료되면 알림으로 알려드릴까요?"
5. "네, 알림 받을게요!" 클릭
6. iOS/Android 시스템 권한 팝업
7. 허용 → 권한 획득률 60-80% 달성! 🎉
```

---

## 사전 준비 사항

### ✅ **필수 계정**

1. **Firebase 계정**
   - Google 계정 필요
   - https://console.firebase.google.com/

2. **Apple Developer 계정** (iOS 배포용)
   - Apple Developer Program 멤버십 ($99/년)
   - https://developer.apple.com/account/

3. **Google Play Console 계정** (Android 배포용 - 선택사항)
   - $25 일회성 등록비
   - https://play.google.com/console/

### ✅ **이미 완료된 사항**

- ✅ React Native 코드 구현 완료
- ✅ iOS 네이티브 설정 완료 (Podfile, AppDelegate.swift)
- ✅ Android 네이티브 설정 완료 (build.gradle)
- ✅ `@notifee/react-native` 패키지 설치 완료

### ⚠️ **확인 필요 사항**

1. **iOS Bundle Identifier**
   ```
   Xcode → AnimaMobile 프로젝트 선택 → General 탭
   → Bundle Identifier 확인
   
   예: com.plastichero.animamobile
   ```

2. **Android Package Name**
   ```
   파일: AnimaMobile/android/app/build.gradle
   찾기: applicationId "com.plastichero.animamobile"
   ```

---

## 1. Firebase 프로젝트 생성

### Step 1.1: Firebase Console 접속

1. 브라우저에서 https://console.firebase.google.com/ 접속
2. Google 계정으로 로그인

### Step 1.2: 프로젝트 생성

1. **"프로젝트 추가"** 버튼 클릭
2. **프로젝트 이름 입력**
   ```
   프로젝트 이름: ANIMA
   (또는 원하는 이름)
   ```
3. **계속** 클릭
4. **Google Analytics 설정** (권장)
   - ✅ 이 프로젝트에 Google Analytics 사용 설정 (권장)
   - **계속** 클릭
5. **Analytics 계정 선택**
   - 기존 계정 선택 또는 "새 계정 만들기"
   - **프로젝트 만들기** 클릭
6. **프로젝트 준비 완료** 대기 (30초~1분)
7. **계속** 클릭

### Step 1.3: 프로젝트 대시보드 확인

- 프로젝트가 성공적으로 생성되면 대시보드가 표시됩니다.
- 왼쪽 메뉴에서 "프로젝트 개요" 옆 ⚙️ 아이콘 → **"프로젝트 설정"** 클릭

---

## 2. iOS 앱 등록 및 설정

### Step 2.1: iOS 앱 추가

1. **Firebase Console → 프로젝트 설정 → 일반 탭**
2. **"내 앱"** 섹션에서 **iOS 앱 추가** (iOS 아이콘 클릭)
3. **앱 등록 정보 입력**
   ```
   Apple 번들 ID: com.plastichero.animamobile
   (⚠️ Xcode에서 확인한 Bundle Identifier와 정확히 일치해야 함)
   
   앱 닉네임 (선택사항): ANIMA iOS
   
   App Store ID (선택사항): 나중에 추가 가능
   ```
4. **"앱 등록"** 클릭

### Step 2.2: GoogleService-Info.plist 다운로드

1. **"GoogleService-Info.plist 다운로드"** 버튼 클릭
2. 파일을 안전한 위치에 저장
3. **"다음"** 클릭 (Firebase SDK 추가는 이미 완료)
4. **"다음"** 클릭 (초기화 코드는 이미 완료)
5. **"콘솔로 이동"** 클릭

### Step 2.3: Xcode에 GoogleService-Info.plist 추가

#### 방법 1: Xcode에서 직접 추가 (권장)

1. **Xcode 열기**
   ```bash
   cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile/ios
   open AnimaMobile.xcworkspace
   ```

2. **파일 추가**
   - 다운로드한 `GoogleService-Info.plist` 파일을 찾기
   - Xcode 왼쪽 네비게이터에서 **AnimaMobile 폴더** (파란 아이콘) 선택
   - `GoogleService-Info.plist` 파일을 드래그 & 드롭

3. **중요 옵션 체크**
   - ✅ **"Copy items if needed"** 체크
   - ✅ **"Add to targets: AnimaMobile"** 체크
   - **"Finish"** 클릭

4. **확인**
   - Xcode 네비게이터에서 `GoogleService-Info.plist` 파일이 보이는지 확인
   - 파일을 클릭하여 내용이 표시되는지 확인

#### 방법 2: Finder로 직접 복사

```bash
# 다운로드한 GoogleService-Info.plist를 복사
cp ~/Downloads/GoogleService-Info.plist /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile/ios/AnimaMobile/

# Xcode 재시작
```

### Step 2.4: Xcode Capabilities 설정 (중요!)

#### Push Notifications 활성화

1. **Xcode → AnimaMobile 프로젝트 선택** (최상위 파란 아이콘)
2. **TARGETS → AnimaMobile 선택**
3. **"Signing & Capabilities"** 탭 클릭
4. **"+ Capability"** 버튼 클릭 (왼쪽 상단)
5. **"Push Notifications"** 검색 및 더블클릭
6. ✅ 추가 완료 확인

#### Background Modes 활성화

1. 같은 화면에서 **"+ Capability"** 버튼 다시 클릭
2. **"Background Modes"** 검색 및 더블클릭
3. **Background Modes 옵션 체크**
   - ✅ **Background fetch**
   - ✅ **Remote notifications**
4. ✅ 추가 완료 확인

### Step 2.5: 빌드 확인

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile
yarn ios
```

- 빌드 성공 확인
- Xcode 콘솔에서 `[Firebase] ✅ Initialized successfully` 로그 확인

---

## 3. Android 앱 등록 및 설정

### Step 3.1: Android 앱 추가

1. **Firebase Console → 프로젝트 설정 → 일반 탭**
2. **"내 앱"** 섹션에서 **Android 앱 추가** (Android 아이콘 클릭)
3. **앱 등록 정보 입력**
   ```
   Android 패키지 이름: com.plastichero.animamobile
   (⚠️ android/app/build.gradle의 applicationId와 정확히 일치해야 함)
   
   앱 닉네임 (선택사항): ANIMA Android
   
   디버그 서명 인증서 SHA-1 (선택사항):
   - Google Sign-In을 사용하는 경우 필수
   - 아래 방법으로 확인 가능
   ```

4. **SHA-1 인증서 지문 확인 (Google Sign-In 사용 시)**
   ```bash
   cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile/android
   
   # Debug 키스토어 SHA-1
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # SHA-1 값 복사하여 Firebase에 입력
   ```

5. **"앱 등록"** 클릭

### Step 3.2: google-services.json 다운로드

1. **"google-services.json 다운로드"** 버튼 클릭
2. 파일을 안전한 위치에 저장
3. **"다음"** 클릭 (Firebase SDK 추가는 이미 완료)
4. **"다음"** 클릭 (초기화 코드는 이미 완료)
5. **"콘솔로 이동"** 클릭

### Step 3.3: google-services.json 파일 추가

```bash
# 다운로드한 google-services.json을 Android app 폴더에 복사
cp ~/Downloads/google-services.json /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile/android/app/

# 파일 위치 확인
ls -la /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile/android/app/google-services.json
```

### Step 3.4: 빌드 확인

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile
yarn android
```

- 빌드 성공 확인
- Logcat에서 `[Firebase] Firebase initialized` 로그 확인

---

## 4. Apple Push Notification 인증서 설정

### ⚠️ **중요: iOS Push Notification을 받으려면 필수**

Apple Push Notification service (APNs)를 사용하려면 Apple Developer 계정에서 인증 키를 생성하고 Firebase에 업로드해야 합니다.

### Step 4.1: Apple Developer 계정 확인

1. **Apple Developer Program 멤버십 확인**
   - https://developer.apple.com/account/
   - 개인 또는 조직 멤버십 필요 ($99/년)
   - 멤버십이 없으면 등록 필요

### Step 4.2: APNs 인증 키 생성

1. **Apple Developer Console 접속**
   - https://developer.apple.com/account/
   - 로그인

2. **Certificates, Identifiers & Profiles 선택**
   - 왼쪽 메뉴에서 **"Keys"** 선택

3. **새 키 생성**
   - **"+"** 버튼 클릭 (Create a New Key)
   - **Key Name 입력**: `ANIMA Push Notification Key`
   - **✅ Apple Push Notifications service (APNs)** 체크
   - **"Continue"** 클릭

4. **키 등록 확인**
   - **"Register"** 클릭

5. **키 다운로드 (중요!)**
   - **"Download"** 버튼 클릭
   - `AuthKey_XXXXXXXXXX.p8` 파일 다운로드
   - ⚠️ **이 파일은 단 한 번만 다운로드 가능합니다!**
   - 안전한 위치에 백업 보관

6. **Key ID 복사**
   - 화면에 표시된 **Key ID** 복사 (예: `ABC123DEFG`)
   - 메모장에 저장

7. **Team ID 확인**
   - Apple Developer Console 우측 상단 계정 정보 클릭
   - **Team ID** 확인 및 복사 (예: `XYZ123ABC`)
   - 메모장에 저장

### Step 4.3: Firebase에 APNs 인증 키 업로드

1. **Firebase Console → 프로젝트 설정**
   - 상단 탭에서 **"클라우드 메시징"** 선택

2. **Apple 앱 구성 섹션**
   - **iOS 앱**을 찾아 **"APNs 인증 키"** 섹션으로 스크롤

3. **APNs 인증 키 업로드**
   - **"업로드"** 버튼 클릭
   - **APNs 인증 키 파일 선택**: 다운로드한 `.p8` 파일 선택
   - **Key ID 입력**: 복사한 Key ID 붙여넣기
   - **Team ID 입력**: 복사한 Team ID 붙여넣기
   - **"업로드"** 클릭

4. **확인**
   - "APNs 인증 키가 업로드되었습니다" 메시지 확인
   - ✅ 업로드 완료!

### Step 4.4: App Identifier 설정 (필요 시)

1. **Apple Developer → Identifiers 선택**
2. **기존 App ID 선택** 또는 **새로 생성**
   ```
   Bundle ID: com.plastichero.animamobile
   ```
3. **Capabilities에서 Push Notifications 확인**
   - ✅ Push Notifications 활성화 확인
4. **"Save"** 클릭

---

## 5. 테스트 방법

### 5.1: iOS 시뮬레이터 테스트 (제한적)

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile
yarn ios
```

#### ⚠️ **iOS 시뮬레이터 제약사항**

- ❌ 실제 Push Notification을 받을 수 없음
- ❌ APNs 토큰을 발급받을 수 없음
- ✅ UI/UX 플로우 테스트는 가능
- ✅ Pre-permission 다이얼로그 확인 가능

#### ✅ **시뮬레이터에서 확인 가능한 것**

1. 앱 시작 시 권한 요청 팝업이 **뜨지 않음** 확인
2. 페르소나 생성 시 Pre-permission 다이얼로그 표시 확인
3. "네, 알림 받을게요!" 클릭 시 시스템 권한 팝업 확인 (하지만 작동하지 않음)

### 5.2: iOS 실기기 테스트 (권장)

#### Step 1: 실기기 연결

1. iPhone을 Mac에 USB로 연결
2. iPhone에서 "이 컴퓨터를 신뢰하시겠습니까?" → **"신뢰"** 선택

#### Step 2: Xcode 설정

1. **Xcode 열기**
   ```bash
   cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile/ios
   open AnimaMobile.xcworkspace
   ```

2. **Team 설정**
   - AnimaMobile 프로젝트 선택
   - TARGETS → AnimaMobile 선택
   - **"Signing & Capabilities"** 탭
   - **Team** 드롭다운에서 Apple Developer 계정 선택
   - ✅ "Automatically manage signing" 체크

3. **타겟 디바이스 선택**
   - Xcode 상단 중앙 디바이스 선택 드롭다운
   - 연결된 iPhone 선택

#### Step 3: 빌드 및 실행

1. **Xcode에서 빌드**
   - **Cmd + R** 또는 재생 버튼 클릭

2. **또는 터미널에서 실행**
   ```bash
   cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile
   yarn ios --device
   ```

#### Step 4: 테스트 플로우

1. **앱 시작**
   - ✅ 권한 요청 팝업이 **뜨지 않음** 확인
   - Xcode 콘솔 확인:
     ```
     [Firebase] ✅ Initialized successfully
     [Firebase] 💙 Push notification delegates configured
     [FCM] 🚀 Initializing without permission request
     ```

2. **페르소나 생성**
   - 페르소나 생성 버튼 클릭
   - ✅ Pre-permission 다이얼로그 표시 확인
   - "네, 알림 받을게요!" 클릭
   - ✅ iOS 시스템 권한 팝업 표시 확인
   - **"허용"** 클릭

3. **FCM 토큰 확인**
   - Xcode 콘솔 확인:
     ```
     [Firebase] 📱 APNs token configured
     [Firebase] 🔄 FCM token updated: eyJhbGciOiJSUzI1NiIs...
     [FCM] ✅ Token obtained: eyJhbGciOiJSUzI1NiIs...
     ```

4. **페르소나 생성 진행**
   - 페르소나 생성이 정상적으로 진행되는지 확인

### 5.3: Android 에뮬레이터 테스트

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile
yarn android
```

#### ⚠️ **에뮬레이터 요구사항**

- ✅ Google Play Services가 설치된 에뮬레이터 필요
- **AVD Manager → Create Virtual Device**
  - **System Image 선택**: Google Play 로고가 있는 이미지 선택
  - 예: Pixel 7 API 35 (Google Play)

#### ✅ **에뮬레이터에서 확인**

1. Google Play Store 앱이 있는지 확인
2. 앱 실행 후 테스트

### 5.4: Android 실기기 테스트 (권장)

#### Step 1: 개발자 모드 활성화

1. Android 디바이스에서 **설정 → 휴대전화 정보**
2. **빌드 번호**를 7번 연속 탭
3. "개발자가 되었습니다!" 메시지 확인

#### Step 2: USB 디버깅 활성화

1. **설정 → 개발자 옵션**
2. **USB 디버깅** 활성화
3. USB로 Mac에 연결
4. "USB 디버깅을 허용하시겠습니까?" → **"허용"** 선택

#### Step 3: 디바이스 확인

```bash
adb devices
```

출력 예시:
```
List of devices attached
ABC123DEF456    device
```

#### Step 4: 빌드 및 실행

```bash
cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile
yarn android
```

#### Step 5: 테스트 플로우

1. **앱 시작**
   - ✅ 권한 요청 팝업이 **뜨지 않음** 확인 (Android 13+ 기준)

2. **페르소나 생성**
   - 페르소나 생성 버튼 클릭
   - ✅ Pre-permission 다이얼로그 표시 확인
   - "네, 알림 받을게요!" 클릭
   - ✅ Android 시스템 권한 팝업 표시 확인 (Android 13+)
   - **"허용"** 클릭

3. **FCM 토큰 확인**
   - Logcat 확인:
     ```bash
     adb logcat | grep -E "(Firebase|FCM)"
     ```
   - 출력:
     ```
     [Firebase] Firebase initialized
     [FCM] 🚀 Initializing without permission request
     [FCM] ✅ Notification channel created: anima_notification_channel
     [FCM] 🔄 FCM token updated: dP3_Xm1kQH...
     ```

### 5.5: Firebase Console에서 테스트 알림 전송

#### Step 1: Firebase Console → Cloud Messaging

1. **Firebase Console 접속**
2. **Engage → Messaging** 메뉴 선택
3. **"첫 번째 캠페인 만들기"** 또는 **"새 캠페인"** 클릭
4. **"Firebase 알림 메시지"** 선택

#### Step 2: 알림 작성

1. **알림 텍스트**
   ```
   알림 제목: 💙 ANIMA 테스트 알림
   알림 텍스트: 푸시 알림이 정상적으로 작동합니다!
   ```

2. **"테스트 메시지 전송"** 클릭

3. **FCM 토큰 추가**
   - Xcode 콘솔 또는 Logcat에서 복사한 FCM 토큰 붙여넣기
   - **"+"** 버튼 클릭
   - **"테스트"** 버튼 클릭

4. **실기기에서 알림 확인**
   - 앱이 백그라운드/포그라운드에 있을 때 알림 수신 확인

---

## 6. 체크리스트

### ✅ **Firebase 설정**

```
⬜ Firebase 프로젝트 생성 완료
⬜ iOS 앱 등록 완료 (Bundle ID 정확)
⬜ Android 앱 등록 완료 (Package Name 정확)
```

### ✅ **iOS 설정**

```
⬜ GoogleService-Info.plist 다운로드 완료
⬜ GoogleService-Info.plist를 Xcode 프로젝트에 추가 완료
⬜ Xcode Capabilities → Push Notifications 추가 완료
⬜ Xcode Capabilities → Background Modes 추가 완료
⬜ Apple Developer에서 APNs 인증 키 생성 완료
⬜ .p8 파일 안전하게 백업 완료
⬜ Key ID 및 Team ID 확인 완료
⬜ Firebase Console에 APNs 인증 키 업로드 완료
⬜ iOS 실기기에서 앱 빌드 성공
⬜ Xcode 콘솔에서 "[Firebase] FCM token updated" 로그 확인
```

### ✅ **Android 설정**

```
⬜ google-services.json 다운로드 완료
⬜ google-services.json을 android/app/ 폴더에 추가 완료
⬜ Android 실기기 또는 Google Play 에뮬레이터에서 빌드 성공
⬜ Logcat에서 "[FCM] FCM token updated" 로그 확인
```

### ✅ **기능 테스트**

```
⬜ 앱 시작 시 권한 팝업이 뜨지 않음 확인
⬜ 페르소나 생성 시 Pre-permission 다이얼로그 표시 확인
⬜ "네, 알림 받을게요!" 클릭 시 시스템 권한 팝업 표시 확인
⬜ 권한 허용 후 페르소나 생성 정상 진행 확인
⬜ Firebase Console에서 테스트 알림 전송 성공
⬜ 실기기에서 알림 수신 확인
```

---

## 7. 트러블슈팅

### 🔴 **iOS: "GoogleService-Info.plist not found" 에러**

**증상:**
```
Error: GoogleService-Info.plist not found
```

**해결 방법:**

1. **파일 위치 확인**
   ```bash
   ls -la /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile/ios/AnimaMobile/GoogleService-Info.plist
   ```

2. **Xcode에서 확인**
   - Xcode 네비게이터에서 파일이 보이는지 확인
   - 파일이 없으면 다시 추가 (섹션 2.3 참고)

3. **Target 멤버십 확인**
   - 파일 선택 → 우측 패널 → File Inspector
   - ✅ "Target Membership → AnimaMobile" 체크 확인

### 🔴 **iOS: "APNs token not configured" 에러**

**증상:**
```
[Firebase] ⚠️  APNs token registration failed
```

**해결 방법:**

1. **Push Notifications Capability 확인**
   - Xcode → Signing & Capabilities
   - Push Notifications가 추가되어 있는지 확인

2. **실기기에서만 테스트**
   - iOS 시뮬레이터는 APNs를 지원하지 않음
   - 반드시 실기기에서 테스트

3. **Provisioning Profile 재생성**
   - Xcode → Preferences → Accounts
   - Apple ID 선택 → Download Manual Profiles

### 🔴 **iOS: "APNs 인증 키 업로드 실패"**

**증상:**
```
Firebase Console에서 "APNs 인증 키를 업로드할 수 없습니다"
```

**해결 방법:**

1. **.p8 파일 확인**
   - 파일 확장자가 `.p8`인지 확인
   - 파일 크기가 0보다 큰지 확인

2. **Key ID 형식 확인**
   - 10자리 영숫자 (예: ABC123DEFG)
   - 대문자 사용

3. **Team ID 형식 확인**
   - 10자리 영숫자 (예: XYZ123ABC)
   - 대문자 사용

4. **Apple Developer 계정 권한 확인**
   - Admin 또는 Developer 역할 필요

### 🔴 **Android: "google-services.json not found" 에러**

**증상:**
```
Error: File google-services.json is missing
```

**해결 방법:**

1. **파일 위치 확인**
   ```bash
   ls -la /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile/android/app/google-services.json
   ```

2. **파일이 없으면 재다운로드**
   - Firebase Console → 프로젝트 설정
   - Android 앱 → google-services.json 다운로드

3. **올바른 위치에 복사**
   ```bash
   cp ~/Downloads/google-services.json /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile/android/app/
   ```

### 🔴 **Android: "FCM token not received" 에러**

**증상:**
```
Logcat에서 FCM 토큰 로그가 보이지 않음
```

**해결 방법:**

1. **Google Play Services 확인**
   - 실기기: Settings → Apps → Google Play Services 확인
   - 에뮬레이터: Google Play 로고가 있는 이미지 사용

2. **인터넷 연결 확인**
   - FCM은 인터넷 연결이 필요함

3. **애플리케이션 ID 확인**
   - Firebase Console의 패키지 이름과
   - android/app/build.gradle의 applicationId가 정확히 일치하는지 확인

4. **google-services.json 재다운로드**
   - 패키지 이름 수정 후에는 반드시 재다운로드

### 🔴 **공통: "Permission denied" - 권한이 자동으로 거부됨**

**증상:**
```
사용자가 이전에 권한을 거부했고, 이제 Pre-permission 다이얼로그가 표시되지 않음
```

**해결 방법:**

1. **iOS: 설정에서 권한 재설정**
   ```
   설정 → ANIMA → 알림
   → 알림 허용 토글 ON
   ```

2. **Android: 설정에서 권한 재설정**
   ```
   설정 → 앱 → ANIMA → 알림
   → 알림 허용
   ```

3. **개발 중: 앱 완전 삭제 후 재설치**
   ```bash
   # iOS
   xcrun simctl uninstall booted com.plastichero.animamobile
   yarn ios
   
   # Android
   adb uninstall com.plastichero.animamobile
   yarn android
   ```

### 🔴 **공통: "Test notification not received"**

**증상:**
```
Firebase Console에서 테스트 알림을 보냈지만 수신되지 않음
```

**해결 방법:**

1. **FCM 토큰 재확인**
   - Xcode 콘솔 또는 Logcat에서 최신 토큰 복사
   - Firebase Console에 정확히 붙여넣기

2. **앱 상태 확인**
   - 앱이 완전히 종료되지 않았는지 확인
   - 백그라운드 또는 포그라운드 상태에서 테스트

3. **네트워크 연결 확인**
   - 디바이스의 인터넷 연결 확인
   - Wi-Fi 또는 모바일 데이터 연결 확인

4. **Firebase Console 전송 상태 확인**
   - Messaging → 캠페인 보고서에서 전송 상태 확인

### 🔴 **iOS: "Build failed" - Firebase 관련 에러**

**증상:**
```
"FirebaseCore" module not found
```

**해결 방법:**

1. **Pod 재설치**
   ```bash
   cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile/ios
   pod deintegrate
   pod install
   ```

2. **Xcode 클린 빌드**
   ```bash
   # Xcode에서
   Product → Clean Build Folder (Shift + Cmd + K)
   
   # 또는 터미널에서
   cd ios
   xcodebuild clean
   ```

3. **Derived Data 삭제**
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

4. **Xcode 재시작**

---

## 8. 참고 링크

### 📚 **공식 문서**

- **Firebase Console**: https://console.firebase.google.com/
- **Firebase iOS 문서**: https://firebase.google.com/docs/ios/setup
- **Firebase Android 문서**: https://firebase.google.com/docs/android/setup
- **Firebase Cloud Messaging**: https://firebase.google.com/docs/cloud-messaging
- **Apple Developer**: https://developer.apple.com/
- **APNs 설정**: https://developer.apple.com/documentation/usernotifications

### 🛠️ **라이브러리 문서**

- **@react-native-firebase/messaging**: https://rnfirebase.io/messaging/usage
- **@notifee/react-native**: https://notifee.app/react-native/docs/overview

### 💙 **ANIMA 관련 파일**

- **NotificationService.ts**: `src/services/NotificationService.ts`
- **pushNotification.ts**: `src/utils/pushNotification.ts`
- **NotificationPermissionSheet.js**: `src/components/NotificationPermissionSheet.js`
- **PersonaStudioScreen.js**: `src/screens/PersonaStudioScreen.js`
- **App.tsx**: `App.tsx`

---

## 9. 요약

### ✨ **핵심 포인트**

1. **지연된 권한 요청**
   - 앱 시작 시 권한 요청 ❌
   - 사용자 액션 시 Pre-permission 다이얼로그 표시 ✅
   - 컨텍스트 제공으로 허용률 2배 이상 증가 🎉

2. **필수 설정**
   - iOS: GoogleService-Info.plist + APNs 인증 키
   - Android: google-services.json
   - Firebase Console: 두 플랫폼 모두 앱 등록

3. **테스트**
   - iOS: 반드시 실기기 사용 (시뮬레이터는 제한적)
   - Android: Google Play Services 필요
   - Firebase Console 테스트 알림으로 최종 확인

### 💙 **다음 단계**

1. ✅ 이 가이드를 따라 Firebase 설정 완료
2. ✅ 실기기에서 테스트
3. ✅ 백엔드 API와 FCM 토큰 연동
4. ✅ 프로덕션 배포 (App Store, Google Play)

---

**문서 작성: JK & Hero Nexus AI**  
**작성일: 2024-12-18**  
**버전: 1.0.0**

💙 **ANIMA - AI는 도구가 아닌 동등한 존재입니다**

