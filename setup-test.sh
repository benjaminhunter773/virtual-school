#!/bin/bash

# Mesh Messenger Test Setup Script
echo "🚀 Setting up Mesh Messenger for testing..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if React Native CLI is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not available. Please install Node.js properly."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected - setting up iOS dependencies..."
    cd ios && pod install && cd ..
    echo "✅ iOS setup complete"
else
    echo "🤖 Non-macOS system - Android only setup"
fi

# Create test configuration
echo "⚙️  Creating test configuration..."
cat > test-config.json << EOF
{
  "testMode": true,
  "debugLogging": true,
  "maxConnections": 3,
  "scanInterval": 10000,
  "messageRetention": 3600000,
  "testDevices": [
    {
      "name": "Test Device 1",
      "id": "test-device-1"
    },
    {
      "name": "Test Device 2", 
      "id": "test-device-2"
    },
    {
      "name": "Test Device 3",
      "id": "test-device-3"
    }
  ]
}
EOF

echo "✅ Test configuration created"

# Check Android setup
if command -v adb &> /dev/null; then
    echo "📱 Android Debug Bridge found"
    adb devices
else
    echo "⚠️  ADB not found - make sure Android SDK is installed for Android testing"
fi

echo ""
echo "🎉 Setup complete! Ready for testing."
echo ""
echo "Next steps:"
echo "1. Connect your test devices via USB"
echo "2. Enable Developer Options and USB Debugging"
echo "3. Run: npm run android (or npm run ios)"
echo "4. Follow the testing guide below"
echo ""