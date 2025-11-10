#!/usr/bin/env node

/**
 * 📝 Show iOS/Android Logs in Terminal
 * 
 * Run this in a SEPARATE terminal while Metro is running
 */

const { spawn } = require('child_process');
const os = require('os');

console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
console.log('\x1b[36m   📝 ANIMA Mobile - Terminal Logs\x1b[0m');
console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');

const platform = os.platform();
const isMac = platform === 'darwin';

let command, args;

if (isMac) {
  console.log('\x1b[32m🍎 Starting iOS logs...\x1b[0m\n');
  command = 'npx';
  args = ['react-native', 'log-ios'];
} else {
  console.log('\x1b[32m🤖 Starting Android logs...\x1b[0m\n');
  command = 'npx';
  args = ['react-native', 'log-android'];
}

console.log('\x1b[33m💡 Tip: This will show ALL console.log() output!\x1b[0m');
console.log('\x1b[33m💡 Look for [ANIMA] prefix for our logs\x1b[0m\n');
console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');

const logProcess = spawn(command, args, {
  stdio: 'inherit',
  shell: true
});

logProcess.on('error', (error) => {
  console.error('\x1b[31m❌ Error:\x1b[0m', error.message);
  console.log('\n\x1b[33m💡 Make sure the app is running first!\x1b[0m');
  console.log('\x1b[33m💡 Run "npm run dev" in another terminal\x1b[0m\n');
  process.exit(1);
});

logProcess.on('close', (code) => {
  console.log(`\n\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`);
  console.log(`\x1b[36m   Log viewer stopped (code: ${code})\x1b[0m`);
  console.log(`\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`);
  process.exit(code);
});

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\x1b[33m⚠️  Stopping log viewer...\x1b[0m');
  logProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logProcess.kill('SIGTERM');
  process.exit(0);
});

