#!/usr/bin/env node

const { spawn, execSync, spawnSync } = require('child_process');
const path = require('path');

console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
console.log('\x1b[36m   ANIMA Mobile 개발 환경을 시작합니다\x1b[0m');
console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');

// First, run kill-servers.js to clean up all processes
console.log('\x1b[33m🔥 기존 서버 프로세스를 정리합니다...\x1b[0m\n');

const killScriptPath = path.join(__dirname, 'kill-servers.js');

try {
  // Run kill-servers.js synchronously (wait for it to complete)
  const result = spawnSync('node', [killScriptPath], {
    stdio: 'inherit',
    shell: true
  });
  
  if (result.status === 0) {
    console.log('\x1b[32m✅ 서버 정리 완료!\x1b[0m\n');
  } else {
    console.log('\x1b[33m⚠️  서버 정리 중 일부 경고 발생 (무시하고 진행)\x1b[0m\n');
  }
} catch (e) {
  console.log('\x1b[33m⚠️  서버 정리 중 오류 발생 (무시하고 진행)\x1b[0m\n');
  console.error(e.message);
}

// Wait briefly before starting menu script (ensure all processes are fully terminated)
console.log('\x1b[36m⏳ 잠시 후 개발 메뉴를 시작합니다...\x1b[0m\n');

setTimeout(() => {
  // Set script path
  const menuScriptPath = path.join(__dirname, 'menu.js');
  
  // Run menu script
  const menuProcess = spawn('node', [menuScriptPath], {
    stdio: 'inherit',
    shell: true
  });
  
  menuProcess.on('close', (code) => {
    console.log(`\n\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`);
    console.log(`\x1b[36m   ANIMA Mobile 개발 환경이 종료되었습니다\x1b[0m`);
    console.log(`\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`);
  });
}, 2000); // Increased wait time to 2 seconds

