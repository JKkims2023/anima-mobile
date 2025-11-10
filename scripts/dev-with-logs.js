#!/usr/bin/env node

/**
 * 🔥 ANIMA Mobile Development with Logs
 * 
 * This script starts Metro Bundler and automatically shows logs in terminal
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
console.log('\x1b[36m   ANIMA Mobile - Development with Logs\x1b[0m');
console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');

console.log('\x1b[33m📝 This will show logs in the terminal!\x1b[0m');
console.log('\x1b[33m💡 For better debugging, you can also press "j" to open DevTools\x1b[0m\n');

// First, run kill-servers.js to clean up
console.log('\x1b[33m🔥 Cleaning up existing processes...\x1b[0m\n');

const killScriptPath = path.join(__dirname, 'kill-servers.js');

try {
  const { spawnSync } = require('child_process');
  const result = spawnSync('node', [killScriptPath], {
    stdio: 'inherit',
    shell: true
  });

  if (result.status === 0) {
    console.log('\x1b[32m✅ Cleanup complete!\x1b[0m\n');
  } else {
    console.log('\x1b[33m⚠️  Some warnings during cleanup (safe to continue)\x1b[0m\n');
  }
} catch (e) {
  console.log('\x1b[33m⚠️  Cleanup error (safe to continue)\x1b[0m\n');
}

console.log('\x1b[36m⏳ Starting Metro Bundler with terminal logs...\x1b[0m\n');

// Detect platform
const platform = os.platform();
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';

// Start Metro with logs
const metroProcess = spawn('npx', ['react-native', 'start'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    // Try to force logs to terminal (may not work in 0.79+)
    RCT_METRO_PORT: '8081',
  }
});

metroProcess.on('error', (error) => {
  console.error('\x1b[31m❌ Metro error:\x1b[0m', error);
});

metroProcess.on('close', (code) => {
  console.log(`\n\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`);
  console.log(`\x1b[36m   Metro Bundler stopped (code: ${code})\x1b[0m`);
  console.log(`\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`);
  process.exit(code);
});

// Wait a bit for Metro to start, then show instructions
setTimeout(() => {
  console.log('\n\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[36m   📋 How to View Logs:\x1b[0m');
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
  
  console.log('\x1b[32m1️⃣  Press "j" key here to open DevTools (Chrome/Edge)\x1b[0m');
  console.log('   → Most powerful option with filtering & debugging\n');
  
  if (isMac) {
    console.log('\x1b[32m2️⃣  Open NEW terminal and run:\x1b[0m');
    console.log('   → npx react-native log-ios\n');
  } else {
    console.log('\x1b[32m2️⃣  Open NEW terminal and run:\x1b[0m');
    console.log('   → npx react-native log-android\n');
  }
  
  console.log('\x1b[33m💡 Keyboard shortcuts:\x1b[0m');
  console.log('   r - Reload app');
  console.log('   i - Run iOS');
  console.log('   a - Run Android');
  console.log('   d - Open dev menu');
  console.log('   j - Open DevTools (logs here!)');
  console.log('   q - Quit\n');
  
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
}, 3000);

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\x1b[33m⚠️  Shutting down...\x1b[0m');
  metroProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  metroProcess.kill('SIGTERM');
  process.exit(0);
});

