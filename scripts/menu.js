#!/usr/bin/env node

const inquirer = require('inquirer');
const { exec, execSync } = require('child_process');
const { spawn } = require('child_process');
const readline = require('readline');

let metroProcess = null;
let inquirerUi = null;
let keyboardEnabled = false;
let isExiting = false;
let isCommandRunning = false; // Flag to check if command is running

// Status message display function
function showStatus(message, isError = false) {
  // Clear current line
  process.stdout.write('\r\x1b[K');
  
  if (isError) {
    // Display error messages in red
    process.stdout.write('\x1b[31m' + message + '\x1b[0m\n');
  } else {
    // Display normal status messages in green
    process.stdout.write('\x1b[32m' + message + '\x1b[0m\n');
  }
}

// Keyboard input handling function
function setupKeyboardHandling() {
  if (keyboardEnabled) return;
  keyboardEnabled = true;
  
  // Set up listener for flow control before switching to raw mode
  process.on('SIGINT', () => {
    showStatus('\n프로그램을 종료합니다... (SIGINT)');
    safeExit();
  });
  
  // Additional event handling for forced termination
  process.on('SIGTERM', () => {
    showStatus('\n프로그램을 종료합니다... (SIGTERM)');
    safeExit();
  });
  
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(true);
    } catch (e) {
      showStatus('원시 모드 설정 실패: ' + e.message, true);
    }
  }
  
  // Display current status
  showCurrentStatus();
  
  process.stdin.on('keypress', (str, key) => {
    if (!key) return;
    
    // Exit (Ctrl+C or q)
    if ((key.ctrl && key.name === 'c') || key.name === 'q') {
      showStatus('\n프로그램을 종료합니다... (키보드)');
      safeExit();
      return;
    }
    
    // Ignore additional key input when command is running
    if (isCommandRunning) {
      showStatus('이미 명령이 실행 중입니다. 잠시만 기다려주세요...', true);
      return;
    }
    
    // Keyboard shortcut handling
    switch(key.name) {
      case 'r':
        showStatus('앱을 새로고침합니다...');
        process.stdout.write('r');
        break;
      case 'i':
        showStatus('iOS 앱을 실행합니다...');
        isCommandRunning = true;
        runIos();
        break;
      case 'a':
        showStatus('Android 앱을 실행합니다...');
        isCommandRunning = true;
        runAndroid();
        break;
      case 'd':
        showStatus('개발자 메뉴를 엽니다...');
        process.stdout.write('d');
        break;
      case 'j':
        showStatus('DevTools를 엽니다...');
        process.stdout.write('j');
        break;
      case 'h':
      case '?':
        // Display help
        showHelp();
        break;
      case 's':
        // Display current status
        showCurrentStatus();
        break;
    }
  });
  
  showHelp();
}

// Display help
function showHelp() {
  console.log(`
\x1b[36m사용 가능한 키보드 단축키:\x1b[0m
r - 앱 새로고침
i - iOS 앱 실행
a - Android 앱 실행
d - 개발자 메뉴 열기
\x1b[33mj - DevTools 열기 (🔥 여기서 모든 console.log 확인!)\x1b[0m
s - 현재 상태 확인
h/? - 도움말 표시
q - 종료
Ctrl+C - 종료

\x1b[32m💡 로그 확인: j 키를 누르면 Chrome/Edge에서 DevTools가 열립니다!\x1b[0m
\x1b[32m💡 [ANIMA] 접두사가 붙은 로그를 찾으세요!\x1b[0m
  `);
}

// Display current status
function showCurrentStatus() {
  showStatus('Metro 서버 실행 중 - 키보드 단축키 사용 가능');
  showStatus('명령 실행 상태: ' + (isCommandRunning ? '명령 실행 중...' : '준비됨'));
}

// iOS app execution function
function runIos() {
  showStatus('iOS 앱 빌드 및 설치 중... 잠시 기다려주세요.');
  
  exec('npx react-native run-ios', (error, stdout, stderr) => {
    isCommandRunning = false;
    
    if (error) {
      showStatus(`iOS 앱 실행 오류: ${error}`, true);
      console.error(stderr);
      return;
    }
    
    showStatus('iOS 앱이 성공적으로 실행되었습니다.');
    console.log(stdout);
  });
}

// Android app execution function
function runAndroid() {
  showStatus('Android 앱 실행 준비 중...');
  
  // First check connected Android devices
  exec('adb devices', (error, stdout, stderr) => {
    if (error) {
      showStatus(`adb 명령 실행 오류: ${error}`, true);
      isCommandRunning = false;
      runOnEmulator();
      return;
    }
    
    const deviceOutput = stdout.trim();
    const deviceLines = deviceOutput.split('\n');
    
    // Check for actually connected devices (excluding header line)
    let hasConnectedDevices = false;
    for (let i = 1; i < deviceLines.length; i++) {
      const line = deviceLines[i].trim();
      if (line && line.endsWith('device')) {
        hasConnectedDevices = true;
        break;
      }
    }
    
    if (!hasConnectedDevices) {
      showStatus('연결된 Android 디바이스가 없습니다. 에뮬레이터를 시작합니다...');
      runOnEmulator();
    } else {
      // If connected device exists, run on it
      showStatus('연결된 Android 디바이스에 설치합니다...');
      
      // Uninstall app before reinstalling (prevent downgrade issues)
      exec('adb uninstall com.animamobile', () => {
        showStatus('이전 앱 제거 후 새 버전 설치 중...');
        
        // Use command for React Native 0.79.2
        exec('npx react-native run-android', (runError, runStdout, runStderr) => {
          isCommandRunning = false;
          
          if (runError) {
            showStatus(`실행 오류: ${runError}`, true);
            showStatus('실디바이스 설치에 실패했습니다. 에뮬레이터로 시도합니다...', true);
            
            // Try emulator on error
            runOnEmulator();
            return;
          }
          
          showStatus('Android 앱이 실제 디바이스에 성공적으로 설치되었습니다.');
          console.log(runStdout);
        });
      });
    }
  });
}

// Run Android app on emulator
function runOnEmulator() {
  showStatus('에뮬레이터에서 실행합니다...');
  
  // Check emulator list
  exec('emulator -list-avds', (error, stdout, stderr) => {
    if (error || !stdout.trim()) {
      showStatus('사용 가능한 에뮬레이터가 없습니다. 기본 명령어로 실행합니다...', true);
      runAndroidDefault();
      return;
    }
    
    const avds = stdout.trim().split('\n');
    if (avds.length > 0) {
      const firstAvd = avds[0].trim();
      showStatus(`에뮬레이터 ${firstAvd}를 시작합니다...`);
      
      // Run emulator in background
      const emulatorProcess = exec(`emulator -avd ${firstAvd} &`, () => {});
      
      // Wait for emulator to start, then run app
      showStatus('에뮬레이터가 시작될 때까지 10초 대기합니다...');
      setTimeout(() => {
        runAndroidDefault();
      }, 10000);
    } else {
      runAndroidDefault();
    }
  });
}

// Default Android execution command
function runAndroidDefault() {
  showStatus('Android 앱 설치 중...');
  
  // Try to uninstall app (ignore errors)
  exec('adb uninstall com.animamobile', () => {
    exec('npx react-native run-android', (runError, runStdout, runStderr) => {
      isCommandRunning = false;
      
      if (runError) {
        showStatus(`실행 오류: ${runError}`, true);
        
        // Output more detailed logs on error
        console.log('======= 자세한 오류 정보 =======');
        console.log(runStderr || '오류 정보가 없습니다.');
        console.log('==================================');
        
        showStatus('문제 해결을 위한 추가 명령어:', true);
        console.log('cd android && ./gradlew clean && cd .. && npx react-native run-android --verbose');
        return;
      }
      
      showStatus('Android 앱이 성공적으로 설치되었습니다.');
      console.log(runStdout);
    });
  });
}

// Check and kill processes using port 8081
function killPortProcess() {
  try {
    showStatus('8081 포트 확인 중...');
    
    // Execute different commands based on OS
    const isWin = process.platform === 'win32';
    let killedPids = new Set(); // Track already killed PIDs
    
    if (isWin) {
      // Windows
      try {
        const output = execSync('netstat -ano | findstr :8081').toString();
        if (output) {
          const lines = output.split('\n');
          for (const line of lines) {
            const match = line.match(/\s+(\d+)$/);
            if (match && match[1]) {
              const pid = match[1];
              if (!killedPids.has(pid)) {
                try {
                  execSync(`taskkill /F /PID ${pid}`);
                  showStatus(`PID ${pid}를 성공적으로 종료했습니다.`);
                  killedPids.add(pid);
                } catch (e) {
                  showStatus(`PID ${pid} 종료 실패: ${e.message}`, true);
                }
              }
            }
          }
        }
      } catch (e) {
        // Ignore if netstat command fails
        showStatus('8081 포트를 사용 중인 프로세스가 없습니다.');
      }
    } else {
      // macOS / Linux
      try {
        // Check processes using port 8081 via lsof
        const output = execSync('lsof -i :8081').toString();
        if (output) {
          const lines = output.split('\n');
          for (let i = 1; i < lines.length; i++) { // Skip first line (header)
            const line = lines[i].trim();
            if (line) {
              const parts = line.split(/\s+/);
              if (parts.length > 1) {
                const pid = parts[1];
                if (!killedPids.has(pid)) {
                  try {
                    execSync(`kill -9 ${pid}`);
                    showStatus(`PID ${pid}를 성공적으로 종료했습니다.`);
                    killedPids.add(pid);
                  } catch (e) {
                    showStatus(`PID ${pid} 종료 실패: ${e.message}`, true);
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        // If lsof command fails (no processes), just proceed
        showStatus('8081 포트를 사용 중인 프로세스가 없습니다.');
      }
    }
    
    // Display summary of killed processes
    if (killedPids.size > 0) {
      showStatus(`총 ${killedPids.size}개의 프로세스를 종료했습니다.`);
    }
  } catch (error) {
    showStatus('포트 확인 중 오류가 발생했습니다: ' + error.message, true);
  }
}

// Metro server execution function
function startMetro() {
  // First kill previous server processes
  killPortProcess();
  
  // Wait briefly before starting Metro server (ensure previous processes are fully terminated)
  showStatus('Metro 서버를 시작합니다... (잠시 대기)');
  
  // Start server after 1 second wait
  setTimeout(() => {
    showStatus('Metro 서버 시작 중...');
    showStatus('💡 영어 locale으로 시작 (DevTools ko.json 에러 방지)');
    
    metroProcess = spawn('npx', ['react-native', 'start', '--reset-cache'], { 
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        LANG: 'en_US.UTF-8',
        LC_ALL: 'en_US.UTF-8',
      }
    });
    
    metroProcess.on('close', (code) => {
      if (code !== 0) {
        showStatus(`Metro 서버가 코드 ${code}로 종료되었습니다.`, true);
      }
    });
    
    // Set up keyboard handling after server starts (increased time)
    setTimeout(() => {
      setupKeyboardHandling();
    }, 5000);
  }, 1000);
}

// Application safe exit function
function safeExit() {
  // Prevent duplicate execution if already exiting
  if (isExiting) return;
  isExiting = true;
  
  showStatus('프로그램을 안전하게 종료합니다...');
  
  try {
    // Disable keyboard input mode
    if (process.stdin.isTTY && process.stdin.setRawMode) {
      try {
        process.stdin.setRawMode(false);
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Close inquirer if active
    if (inquirerUi && typeof inquirerUi.close === 'function') {
      try {
        inquirerUi.close();
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Kill Metro server
    if (metroProcess) {
      try {
        metroProcess.kill('SIGKILL');
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Clean up port 8081 processes
    try {
      killPortProcess();
    } catch (e) {
      // Ignore errors
    }
    
    // Add delay for terminal restoration
    setTimeout(() => {
      try {
        process.exit(0);
      } catch (e) {
        // Force kill
        process.kill(process.pid, 'SIGKILL');
      }
    }, 500);
  } catch (error) {
    // Force kill
    try {
      process.exit(1);
    } catch (e) {
      process.kill(process.pid, 'SIGKILL');
    }
  }
}

// Error event handling
process.on('uncaughtException', (error) => {
  // Ignore specific inquirer-related errors
  if (error.code === 'EIO' && error.syscall === 'setRawMode') {
    return;
  }
  showStatus('예상치 못한 오류 발생: ' + error.message, true);
  safeExit();
});

// Start script
showStatus('ANIMA Mobile 개발 환경을 시작합니다...', false);
startMetro();

