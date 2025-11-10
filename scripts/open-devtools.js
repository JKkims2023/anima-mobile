#!/usr/bin/env node

/**
 * 🔧 Open DevTools with English locale (fix ko.json error)
 */

const { spawn } = require('child_process');

console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
console.log('\x1b[36m   🔧 Opening DevTools (English Mode)\x1b[0m');
console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');

console.log('\x1b[33m💡 This fixes the ko.json locale error\x1b[0m');
console.log('\x1b[33m💡 All logs will appear here!\x1b[0m\n');

// Force English locale for DevTools
const env = {
  ...process.env,
  LANG: 'en_US.UTF-8',
  LC_ALL: 'en_US.UTF-8',
};

// Open DevTools
const devtools = spawn('npx', ['react-native', 'devtools'], {
  env,
  stdio: 'inherit',
  shell: true
});

devtools.on('error', (error) => {
  console.error('\x1b[31m❌ Error:\x1b[0m', error.message);
  console.log('\n\x1b[33m💡 Make sure Metro is running!\x1b[0m');
  console.log('\x1b[33m💡 Run "npm run dev" first\x1b[0m\n');
  process.exit(1);
});

devtools.on('close', (code) => {
  console.log(`\n\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`);
  console.log(`\x1b[36m   DevTools closed (code: ${code})\x1b[0m`);
  console.log(`\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`);
  process.exit(code);
});

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\x1b[33m⚠️  Closing DevTools...\x1b[0m');
  devtools.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  devtools.kill('SIGTERM');
  process.exit(0);
});

