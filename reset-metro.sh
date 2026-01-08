#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Metro 번들러 완전 리셋 스크립트
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "🧹 Metro 번들러 캐시 완전 삭제 시작..."
echo ""

# 1. Watchman 캐시 삭제
echo "1️⃣ Watchman 캐시 삭제..."
watchman watch-del-all
echo "   ✅ 완료"
echo ""

# 2. Metro 캐시 삭제
echo "2️⃣ Metro 캐시 삭제..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*
echo "   ✅ 완료"
echo ""

# 3. Node modules 캐시 삭제
echo "3️⃣ Node modules 캐시 삭제..."
rm -rf node_modules/.cache
echo "   ✅ 완료"
echo ""

# 4. React Native 캐시 삭제
echo "4️⃣ React Native 캐시 삭제..."
rm -rf $HOME/.rncache
echo "   ✅ 완료"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 캐시 삭제 완료!"
echo ""
echo "📱 다음 명령어로 Metro를 재시작하세요:"
echo "   yarn start --reset-cache"
echo ""
echo "   또는 새 터미널에서:"
echo "   cd /Users/jk/Desktop/React-Web-Only/idol-studio/AnimaMobile"
echo "   yarn start --reset-cache"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

