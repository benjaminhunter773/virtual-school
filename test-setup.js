#!/usr/bin/env node

/**
 * Test Setup Verification Script
 * Run this to check if your environment is ready for testing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Mesh Messenger - Setup Verification');
console.log('=====================================\n');

const checks = [];

// Check Node.js version
function checkNodeVersion() {
  try {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      checks.push({ name: 'Node.js Version', status: 'PASS', details: version });
    } else {
      checks.push({ name: 'Node.js Version', status: 'FAIL', details: `${version} (Need 18+)` });
    }
  } catch (error) {
    checks.push({ name: 'Node.js Version', status: 'FAIL', details: error.message });
  }
}

// Check npm/yarn
function checkPackageManager() {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    checks.push({ name: 'npm', status: 'PASS', details: npmVersion });
  } catch (error) {
    checks.push({ name: 'npm', status: 'FAIL', details: 'Not found' });
  }
}

// Check React Native CLI
function checkReactNativeCLI() {
  try {
    execSync('npx react-native --version', { encoding: 'utf8', stdio: 'pipe' });
    checks.push({ name: 'React Native CLI', status: 'PASS', details: 'Available' });
  } catch (error) {
    checks.push({ name: 'React Native CLI', status: 'FAIL', details: 'Not found' });
  }
}

// Check Android SDK
function checkAndroidSDK() {
  try {
    const adbVersion = execSync('adb --version', { encoding: 'utf8', stdio: 'pipe' });
    checks.push({ name: 'Android SDK (adb)', status: 'PASS', details: 'Available' });
  } catch (error) {
    checks.push({ name: 'Android SDK (adb)', status: 'WARN', details: 'Not found (needed for Android testing)' });
  }
}

// Check connected devices
function checkConnectedDevices() {
  try {
    const devices = execSync('adb devices', { encoding: 'utf8', stdio: 'pipe' });
    const deviceLines = devices.split('\n').filter(line => 
      line.includes('device') && !line.includes('List of devices')
    );
    
    if (deviceLines.length > 0) {
      checks.push({ 
        name: 'Connected Android Devices', 
        status: 'PASS', 
        details: `${deviceLines.length} device(s) found` 
      });
    } else {
      checks.push({ 
        name: 'Connected Android Devices', 
        status: 'WARN', 
        details: 'No devices connected (connect via USB for testing)' 
      });
    }
  } catch (error) {
    checks.push({ 
      name: 'Connected Android Devices', 
      status: 'WARN', 
      details: 'Cannot check (adb not available)' 
    });
  }
}

// Check project files
function checkProjectFiles() {
  const requiredFiles = [
    'package.json',
    'src/App.js',
    'src/crypto/SignalProtocol.js',
    'src/network/MeshNetwork.js',
    'src/messaging/MessageRouter.js'
  ];
  
  let missingFiles = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file))) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length === 0) {
    checks.push({ name: 'Project Files', status: 'PASS', details: 'All core files present' });
  } else {
    checks.push({ 
      name: 'Project Files', 
      status: 'FAIL', 
      details: `Missing: ${missingFiles.join(', ')}` 
    });
  }
}

// Check dependencies
function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = Object.keys(packageJson.dependencies || {});
    const requiredDeps = [
      'react-native',
      'react-native-ble-manager',
      'libsignal-protocol-javascript'
    ];
    
    const missingDeps = requiredDeps.filter(dep => !deps.includes(dep));
    
    if (missingDeps.length === 0) {
      checks.push({ name: 'Dependencies', status: 'PASS', details: `${deps.length} dependencies listed` });
    } else {
      checks.push({ 
        name: 'Dependencies', 
        status: 'FAIL', 
        details: `Missing: ${missingDeps.join(', ')}` 
      });
    }
  } catch (error) {
    checks.push({ name: 'Dependencies', status: 'FAIL', details: error.message });
  }
}

// Check if node_modules exists
function checkNodeModules() {
  if (fs.existsSync('node_modules')) {
    checks.push({ name: 'Node Modules', status: 'PASS', details: 'Installed' });
  } else {
    checks.push({ name: 'Node Modules', status: 'FAIL', details: 'Run npm install first' });
  }
}

// Run all checks
function runAllChecks() {
  console.log('Running setup checks...\n');
  
  checkNodeVersion();
  checkPackageManager();
  checkReactNativeCLI();
  checkAndroidSDK();
  checkConnectedDevices();
  checkProjectFiles();
  checkDependencies();
  checkNodeModules();
  
  // Print results
  console.log('Setup Check Results:');
  console.log('===================\n');
  
  checks.forEach(check => {
    const statusIcon = {
      'PASS': '✅',
      'WARN': '⚠️ ',
      'FAIL': '❌'
    }[check.status];
    
    console.log(`${statusIcon} ${check.name}: ${check.details}`);
  });
  
  // Summary
  const passed = checks.filter(c => c.status === 'PASS').length;
  const warnings = checks.filter(c => c.status === 'WARN').length;
  const failed = checks.filter(c => c.status === 'FAIL').length;
  
  console.log('\n📊 Summary:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Warnings: ${warnings}`);
  console.log(`   Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Setup incomplete. Please fix the failed checks before testing.');
    console.log('\n🔧 Common fixes:');
    console.log('   - Run: npm install');
    console.log('   - Install Android Studio for Android testing');
    console.log('   - Connect devices via USB and enable USB debugging');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  Setup mostly complete. Warnings may limit testing capabilities.');
    console.log('\n🚀 You can proceed with testing, but some features may not work.');
  } else {
    console.log('\n🎉 Setup complete! Ready for testing.');
    console.log('\n🚀 Next steps:');
    console.log('   1. npm run android (or npm run ios)');
    console.log('   2. Follow the QUICK_TEST_GUIDE.md');
  }
}

// Run the checks
runAllChecks();