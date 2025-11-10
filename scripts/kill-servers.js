#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('\x1b[33m🔥 모든 React Native 관련 프로세스를 강제 종료합니다...\x1b[0m\n');

const isWin = process.platform === 'win32';
let totalKilled = 0;

// Kill Metro bundler processes
function killMetroProcesses() {
  try {
    console.log('📦 Metro Bundler 프로세스 종료 중...');
    
    if (isWin) {
      // Windows
      try {
        execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq react-native*"', { stdio: 'ignore' });
        console.log('   ✅ Metro Bundler 종료됨 (Windows)');
        totalKilled++;
      } catch (e) {
        console.log('   ℹ️  실행 중인 Metro Bundler 없음');
      }
    } else {
      // macOS / Linux
      try {
        execSync('pkill -f "react-native start"', { stdio: 'ignore' });
        console.log('   ✅ Metro Bundler 종료됨');
        totalKilled++;
      } catch (e) {
        console.log('   ℹ️  실행 중인 Metro Bundler 없음');
      }
      
      try {
        execSync('pkill -f "metro"', { stdio: 'ignore' });
        console.log('   ✅ Metro 관련 프로세스 종료됨');
        totalKilled++;
      } catch (e) {
        // Ignore
      }
    }
  } catch (error) {
    console.log('   ⚠️  Metro 프로세스 정리 중 일부 오류 발생 (무시됨)');
  }
}

// Kill processes using port 8081
function killPort8081() {
  try {
    console.log('\n🔌 8081 포트 사용 프로세스 종료 중...');
    
    if (isWin) {
      // Windows
      try {
        const output = execSync('netstat -ano | findstr :8081', { encoding: 'utf8' });
        if (output) {
          const pids = new Set();
          const lines = output.split('\n');
          
          for (const line of lines) {
            const match = line.match(/\s+(\d+)$/);
            if (match && match[1]) {
              pids.add(match[1]);
            }
          }
          
          for (const pid of pids) {
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              console.log(`   ✅ PID ${pid} 종료됨`);
              totalKilled++;
            } catch (e) {
              console.log(`   ⚠️  PID ${pid} 종료 실패 (이미 종료됨)`);
            }
          }
        }
      } catch (e) {
        console.log('   ℹ️  8081 포트 사용 중인 프로세스 없음');
      }
    } else {
      // macOS / Linux
      try {
        const output = execSync('lsof -i :8081 -t', { encoding: 'utf8' });
        const pids = output.trim().split('\n').filter(pid => pid);
        
        if (pids.length > 0) {
          for (const pid of pids) {
            try {
              execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
              console.log(`   ✅ PID ${pid} 종료됨`);
              totalKilled++;
            } catch (e) {
              console.log(`   ⚠️  PID ${pid} 종료 실패 (이미 종료됨)`);
            }
          }
        } else {
          console.log('   ℹ️  8081 포트 사용 중인 프로세스 없음');
        }
      } catch (e) {
        console.log('   ℹ️  8081 포트 사용 중인 프로세스 없음');
      }
    }
  } catch (error) {
    console.log('   ⚠️  포트 정리 중 일부 오류 발생 (무시됨)');
  }
}

// Kill React Native related node processes
function killReactNativeNodes() {
  try {
    console.log('\n📱 React Native 관련 Node 프로세스 종료 중...');
    
    if (isWin) {
      // Windows - node processes related to React Native
      try {
        execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
        console.log('   ✅ Node 프로세스 종료됨 (Windows)');
        totalKilled++;
      } catch (e) {
        console.log('   ℹ️  실행 중인 Node 프로세스 없음');
      }
    } else {
      // macOS / Linux
      try {
        execSync('pkill -f "node.*AnimaMobile"', { stdio: 'ignore' });
        console.log('   ✅ AnimaMobile Node 프로세스 종료됨');
        totalKilled++;
      } catch (e) {
        console.log('   ℹ️  실행 중인 AnimaMobile Node 프로세스 없음');
      }
      
      // Kill watchman if running
      try {
        execSync('pkill -f watchman', { stdio: 'ignore' });
        console.log('   ✅ Watchman 프로세스 종료됨');
        totalKilled++;
      } catch (e) {
        console.log('   ℹ️  실행 중인 Watchman 프로세스 없음');
      }
    }
  } catch (error) {
    console.log('   ⚠️  Node 프로세스 정리 중 일부 오류 발생 (무시됨)');
  }
}

// Kill Android related processes (Gradle daemon)
function killAndroidProcesses() {
  try {
    console.log('\n🤖 Android Gradle 데몬 종료 중...');
    
    try {
      execSync('cd android && ./gradlew --stop', { stdio: 'ignore', cwd: process.cwd() });
      console.log('   ✅ Gradle 데몬 종료됨');
      totalKilled++;
    } catch (e) {
      console.log('   ℹ️  실행 중인 Gradle 데몬 없음');
    }
    
    // Kill Java processes on macOS/Linux
    if (!isWin) {
      try {
        execSync('pkill -f "java.*gradle"', { stdio: 'ignore' });
        console.log('   ✅ Gradle Java 프로세스 종료됨');
        totalKilled++;
      } catch (e) {
        console.log('   ℹ️  실행 중인 Gradle Java 프로세스 없음');
      }
    }
  } catch (error) {
    console.log('   ⚠️  Android 프로세스 정리 중 일부 오류 발생 (무시됨)');
  }
}

// Kill iOS Simulator related processes
function killiOSProcesses() {
  if (isWin) {
    // iOS is not available on Windows
    return;
  }
  
  try {
    console.log('\n🍎 iOS Simulator 관련 프로세스 정리 중...');
    
    try {
      // Don't kill the simulator itself, just clean up connections
      execSync('xcrun simctl shutdown all', { stdio: 'ignore' });
      console.log('   ✅ 모든 시뮬레이터 종료됨');
      totalKilled++;
    } catch (e) {
      console.log('   ℹ️  실행 중인 시뮬레이터 없음');
    }
  } catch (error) {
    console.log('   ⚠️  iOS 프로세스 정리 중 일부 오류 발생 (무시됨)');
  }
}

// Clear watchman cache
function clearWatchmanCache() {
  if (isWin) {
    return;
  }
  
  try {
    console.log('\n👁️  Watchman 캐시 정리 중...');
    
    try {
      execSync('watchman watch-del-all', { stdio: 'ignore' });
      console.log('   ✅ Watchman 캐시 정리됨');
    } catch (e) {
      console.log('   ℹ️  Watchman이 설치되지 않았거나 실행 중이 아님');
    }
  } catch (error) {
    console.log('   ⚠️  Watchman 캐시 정리 실패 (무시됨)');
  }
}

// Main execution
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   ANIMA Mobile 서버 정리 스크립트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  killMetroProcesses();
  killPort8081();
  killReactNativeNodes();
  killAndroidProcesses();
  killiOSProcesses();
  clearWatchmanCache();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\x1b[32m✨ 정리 완료! (총 ${totalKilled}개 작업 수행)\x1b[0m`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('\x1b[36m💡 이제 다음 명령어로 개발 서버를 시작하세요:\x1b[0m');
  console.log('   npm run dev\n');
}

main().catch(error => {
  console.error('\x1b[31m❌ 오류 발생:\x1b[0m', error.message);
  process.exit(1);
});

