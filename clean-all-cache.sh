#!/bin/bash
echo "🧹 Cleaning all caches..."

# 1. Watchman 캐시 클리어
echo "1. Watchman cache..."
watchman watch-del-all

# 2. Metro Bundler 캐시 클리어
echo "2. Metro bundler cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# 3. React Native 캐시 클리어
echo "3. React Native cache..."
rm -rf ~/.rncache

# 4. Gradle 캐시 클리어 (Android)
echo "4. Gradle cache..."
cd android && ./gradlew clean && cd ..

# 5. node_modules 재설치
echo "5. node_modules..."
rm -rf node_modules
yarn install

echo "✅ All caches cleared! Now run: yarn start --reset-cache"
