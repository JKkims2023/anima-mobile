#!/usr/bin/env node

/**
 * 🎨 Vector Icons 자동 설정 스크립트
 * 
 * iOS와 Android의 react-native-vector-icons 설정을 자동화합니다.
 * 
 * 실행 방법: yarn setup:icons
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Vector Icons 자동 설정 시작...\n');

// ============================================
// iOS 설정
// ============================================
console.log('📱 iOS 설정 중...');

const iosInfoPlistPath = path.join(__dirname, '../ios/AnimaMobile/Info.plist');

if (fs.existsSync(iosInfoPlistPath)) {
  let infoPlist = fs.readFileSync(iosInfoPlistPath, 'utf8');
  
  // UIAppFonts 키가 이미 있는지 확인
  if (!infoPlist.includes('UIAppFonts')) {
    // Info.plist에 폰트 추가
    const fontArray = `
	<key>UIAppFonts</key>
	<array>
		<string>AntDesign.ttf</string>
		<string>Entypo.ttf</string>
		<string>EvilIcons.ttf</string>
		<string>Feather.ttf</string>
		<string>FontAwesome.ttf</string>
		<string>FontAwesome5_Brands.ttf</string>
		<string>FontAwesome5_Regular.ttf</string>
		<string>FontAwesome5_Solid.ttf</string>
		<string>FontAwesome6_Brands.ttf</string>
		<string>FontAwesome6_Regular.ttf</string>
		<string>FontAwesome6_Solid.ttf</string>
		<string>Foundation.ttf</string>
		<string>Ionicons.ttf</string>
		<string>MaterialIcons.ttf</string>
		<string>MaterialCommunityIcons.ttf</string>
		<string>SimpleLineIcons.ttf</string>
		<string>Octicons.ttf</string>
		<string>Zocial.ttf</string>
		<string>Fontisto.ttf</string>
	</array>`;
    
    // </dict> 태그 바로 위에 삽입
    infoPlist = infoPlist.replace('</dict>\n</plist>', `${fontArray}\n</dict>\n</plist>`);
    
    fs.writeFileSync(iosInfoPlistPath, infoPlist);
    console.log('  ✅ Info.plist 업데이트 완료');
  } else {
    console.log('  ⏭️  Info.plist 이미 설정되어 있음');
  }
} else {
  console.log('  ⚠️  Info.plist를 찾을 수 없습니다');
}

// iOS Podfile 확인
const iosPodfilePath = path.join(__dirname, '../ios/Podfile');
if (fs.existsSync(iosPodfilePath)) {
  console.log('  ℹ️  Podfile 확인됨 - 나중에 "cd ios && pod install" 실행 필요');
}

// ============================================
// Android 설정
// ============================================
console.log('\n🤖 Android 설정 중...');

const androidBuildGradlePath = path.join(__dirname, '../android/app/build.gradle');

if (fs.existsSync(androidBuildGradlePath)) {
  let buildGradle = fs.readFileSync(androidBuildGradlePath, 'utf8');
  
  // react-native-vector-icons 설정이 이미 있는지 확인
  if (!buildGradle.includes('react-native-vector-icons')) {
    // build.gradle 맨 아래에 추가
    buildGradle += `\n// React Native Vector Icons
apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")
`;
    
    fs.writeFileSync(androidBuildGradlePath, buildGradle);
    console.log('  ✅ build.gradle 업데이트 완료');
  } else {
    console.log('  ⏭️  build.gradle 이미 설정되어 있음');
  }
} else {
  console.log('  ⚠️  build.gradle을 찾을 수 없습니다');
}

// ============================================
// 완료 메시지
// ============================================
console.log('\n✨ Vector Icons 설정 완료!\n');
console.log('📋 다음 단계:');
console.log('  1. cd ios && pod install && cd ..  (iOS Pod 설치)');
console.log('  2. yarn ios  또는  yarn android  (빌드 및 실행)\n');
console.log('💡 사용 예시:');
console.log('  import Icon from "react-native-vector-icons/Feather";');
console.log('  <Icon name="home" size={24} color="black" />\n');

