#!/usr/bin/env node

/**
 * 🚀 BootSplash 자동 설정 스크립트
 * 
 * iOS와 Android의 react-native-bootsplash 설정을 자동화합니다.
 * 
 * 실행 방법: yarn setup:splash
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 BootSplash 자동 설정 시작...\n');

// ============================================
// Logo 이미지 확인
// ============================================
console.log('🎨 로고 이미지 확인 중...');

const logoPath = path.join(__dirname, '../assets/logo.png');
const hasLogo = fs.existsSync(logoPath);

if (!hasLogo) {
  console.log('  ⚠️  assets/logo.png를 찾을 수 없습니다');
  console.log('  💡 로고 이미지를 준비한 후 다음 명令어를 실행하세요:\n');
  console.log('     npx react-native generate-bootsplash assets/logo.png \\');
  console.log('       --background-color=0F172A \\');
  console.log('       --logo-width=200 \\');
  console.log('       --assets-output=src/assets/bootsplash \\');
  console.log('       --flavor=main\n');
} else {
  console.log('  ✅ 로고 이미지 발견!\n');
  
  // ============================================
  // BootSplash 자동 생성
  // ============================================
  console.log('🎨 BootSplash 리소스 생성 중...');
  
  try {
    execSync(
      'npx react-native generate-bootsplash assets/logo.png ' +
      '--background-color=0F172A ' +
      '--logo-width=200 ' +
      '--assets-output=src/assets/bootsplash ' +
      '--flavor=main',
      { stdio: 'inherit', cwd: path.join(__dirname, '..') }
    );
    console.log('  ✅ BootSplash 리소스 생성 완료!\n');
  } catch (error) {
    console.log('  ⚠️  BootSplash 생성 실패');
    console.log('  💡 수동으로 실행하세요:\n');
    console.log('     npx react-native generate-bootsplash assets/logo.png \\');
    console.log('       --background-color=0F172A \\');
    console.log('       --logo-width=200 \\');
    console.log('       --assets-output=src/assets/bootsplash \\');
    console.log('       --flavor=main\n');
  }
}

// ============================================
// AppDelegate 확인
// ============================================
console.log('📱 iOS AppDelegate 확인 중...');

const iosAppDelegatePath = path.join(__dirname, '../ios/AnimaMobile/AppDelegate.swift');

if (fs.existsSync(iosAppDelegatePath)) {
  let appDelegate = fs.readFileSync(iosAppDelegatePath, 'utf8');
  
  // RNBootSplash import 확인
  if (!appDelegate.includes('RNBootSplash')) {
    console.log('  ⚠️  AppDelegate.swift에 RNBootSplash 설정이 필요합니다');
    console.log('  💡 ReactNativeDelegate의 customize 메서드에 추가하세요:\n');
    console.log('     override func customize(_ rootView: RCTRootView) {');
    console.log('       super.customize(rootView)');
    console.log('       RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)');
    console.log('     }\n');
  } else {
    console.log('  ✅ AppDelegate.swift 이미 설정되어 있음');
  }
} else {
  console.log('  ⚠️  AppDelegate.swift를 찾을 수 없습니다');
}

// ============================================
// 완료 메시지
// ============================================
console.log('\n✨ BootSplash 설정 완료!\n');
console.log('📋 다음 단계:');
console.log('  1. assets/logo.png 준비 (없는 경우)');
console.log('  2. npx react-native generate-bootsplash 실행 (로고 있는 경우)');
console.log('  3. AppDelegate.swift customize 메서드 확인');
console.log('  4. cd ios && pod install && cd ..');
console.log('  5. yarn ios  또는  yarn android\n');
console.log('💡 BootSplash는 Native Splash로 즉시 표시되고,');
console.log('   JS가 로드되면 AnimatedSplashScreen (Lottie)가 이어집니다!\n');

