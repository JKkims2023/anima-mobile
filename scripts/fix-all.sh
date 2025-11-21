#!/bin/bash

# 🛠️ AnimaMobile 완전 초기화 스크립트
# 모든 캐시를 삭제하고 처음부터 다시 시작합니다.

echo "🚀 AnimaMobile 완전 초기화 시작..."
echo ""

# 1. Node modules 삭제
echo "📦 Node modules 삭제 중..."
rm -rf node_modules
echo "  ✅ 완료"
echo ""

# 2. iOS 클린
echo "📱 iOS 클린 중..."
cd ios
rm -rf Pods Podfile.lock build
cd ..
echo "  ✅ 완료"
echo ""

# 3. Android 클린
echo "🤖 Android 클린 중..."
cd android
rm -rf .gradle build app/build
./gradlew clean 2>/dev/null || echo "  ℹ️  Gradle 클린 스킵"
cd ..
echo "  ✅ 완료"
echo ""

# 4. Xcode 캐시 삭제
echo "🗑️  Xcode 캐시 삭제 중..."
rm -rf ~/Library/Developer/Xcode/DerivedData
echo "  ✅ 완료"
echo ""

# 5. Watchman 클린
echo "👁️  Watchman 클린 중..."
watchman watch-del-all 2>/dev/null || echo "  ℹ️  Watchman 미설치 (스킵)"
echo "  ✅ 완료"
echo ""

# 6. Metro 캐시 삭제
echo "🚇 Metro 캐시 삭제 중..."
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
echo "  ✅ 완료"
echo ""

# 7. Node modules 재설치
echo "📦 Node modules 재설치 중..."
yarn install
echo "  ✅ 완료"
echo ""

# 8. iOS Pod 재설치
echo "📱 iOS Pod 재설치 중..."
cd ios
pod install
cd ..
echo "  ✅ 완료"
echo ""

echo "✨ 완전 초기화 완료!"
echo ""
echo "📋 다음 단계:"
echo "  1. 새 터미널을 열어주세요"
echo "  2. yarn ios  또는  yarn android  실행"
echo ""
echo "🎯 문제가 해결되었습니다!"

