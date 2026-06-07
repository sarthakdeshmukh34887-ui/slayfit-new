# FitAI Tracker - Complete Build Guide

## 📋 Prerequisites

- Node.js 18+ (check with `node -v`)
- npm or yarn
- Expo Go app on your phone (iOS/Android) OR Android Studio / Xcode
- Google Gemini API key (get free at https://aistudio.google.com/app/apikey)

---

## 🚀 Step-by-Step Setup

### Step 1: Extract the Project

```bash
# Extract the zip file
unzip FitAI-Tracker.zip
cd FitAI-Tracker
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your Gemini API key:
# EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyYourActualKeyHere
```

**Get your free Gemini API key:** https://aistudio.google.com/app/apikey

### Step 4: Start Development Server

```bash
npx expo start
```

This will:
- Start the Metro bundler
- Generate a QR code in the terminal
- Open the Expo Dev Tools in your browser

### Step 5: Run on Your Device

**Option A: Physical Device (Recommended)**
1. Install "Expo Go" from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in the terminal with your phone camera
3. The app will load automatically

**Option B: iOS Simulator (Mac only)**
```bash
# In the Expo CLI terminal, press:
i
```

**Option C: Android Emulator**
```bash
# In the Expo CLI terminal, press:
a
```

**Option D: Web Browser**
```bash
# In the Expo CLI terminal, press:
w
```

---

## 🔐 Admin Access (For You Only)

On the login screen, enter:
- **Email:** `admin@fitai.com`
- **Password:** `admin123`

No visible hint exists on the login screen — regular users won't know this exists.

---

## 🏗️ Production Build Commands

### Install EAS CLI (Expo Application Services)

```bash
npm install -g eas-cli
```

### Login to Expo

```bash
eas login
```

### Configure Build

```bash
eas build:configure
```

### Build for iOS (App Store / TestFlight)

```bash
eas build --platform ios
```

### Build for Android (Play Store / APK)

```bash
eas build --platform android
```

### Build for Both Platforms

```bash
eas build --platform all
```

---

## 📦 Local Build (Without EAS)

### Android APK (Local)

```bash
# Prebuild native Android project
npx expo prebuild --platform android

# Navigate to Android directory
cd android

# Build release APK
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

### iOS (Mac + Xcode Required)

```bash
# Prebuild native iOS project
npx expo prebuild --platform ios

# Open in Xcode
cd ios && open FitAITracker.xcworkspace

# In Xcode: Product → Archive → Distribute App
```

---

## 🧪 Testing & Debugging Commands

### TypeScript Type Check

```bash
npx tsc --noEmit
```

### Clear Expo Cache (Fix bundling issues)

```bash
npx expo start --clear
```

### Reset Everything (Nuclear Option)

```bash
# Remove all caches and node_modules
rm -rf node_modules package-lock.json .expo
npm install
npx expo start --clear
```

### View Logs

```bash
# iOS logs
npx expo start --ios --localhost

# Android logs
npx expo start --android --localhost
```

---

## 🗄️ Database / Storage Management

### Clear All App Data (AsyncStorage)

Add this temporarily to any screen's `useEffect`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// In useEffect:
AsyncStorage.clear().then(() => console.log('Storage cleared'));
```

### View Stored Data

```bash
# For iOS Simulator
# Data is stored in: ~/Library/Developer/CoreSimulator/Devices/[device-id]/data/Containers/Data/Application/[app-id]/Library/Application Support/RCTAsyncLocalStorage_V1

# For Android Emulator
# Use Android Studio → Device File Explorer → /data/data/com.fitai.tracker/shared_prefs
```

---

## 🔄 Common Issues & Fixes

### Issue: "Unable to resolve module"

```bash
npx expo start --clear
```

### Issue: "Metro bundler not starting"

```bash
# Kill any existing Metro processes
npx kill-port 8081
npx expo start
```

### Issue: "Gemini API key not working"

1. Verify `.env` file exists in project root
2. Check key format: `EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...`
3. Restart the dev server after adding the key
4. Ensure key has Generative Language API enabled in Google Cloud Console

### Issue: "App crashes on startup"

```bash
# Clear all caches
rm -rf node_modules .expo
npm install
npx expo start --clear
```

---

## 📱 Device-Specific Commands

### Run on Specific iOS Simulator

```bash
# List available simulators
xcrun simctl list devices

# Run on specific device
npx expo start --ios --device "iPhone 15 Pro"
```

### Run on Specific Android Device

```bash
# List connected devices
adb devices

# Run on specific device
npx expo start --android --device
```

### Run on Local Network (for physical device testing)

```bash
npx expo start --tunnel
# OR
npx expo start --lan
```

---

## 🌐 Web Deployment

```bash
# Build for web
npx expo export:web

# Serve locally
npx serve web-build

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --dir web-build --prod
```

---

## 📊 Performance Optimization

```bash
# Bundle analysis
npx expo export
npx source-map-explorer dist/_expo/static/js/android/*.js

# Hermes profiling (Android)
npx react-native profile-hermes
```

---

## 📝 File Structure Reference

```
FitAI-Tracker/
├── App.tsx                    # Entry point
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── babel.config.js            # Babel + module aliases
├── app.json                   # Expo config
├── .env                       # API keys (gitignored)
├── .env.example               # Template for env
├── src/
│   ├── components/            # Reusable UI (Button, Card, etc.)
│   ├── screens/               # All screens (11 total)
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── WorkoutLoggerScreen.tsx
│   │   ├── AICoachScreen.tsx
│   │   ├── ProgressScreen.tsx
│   │   ├── ExerciseLibraryScreen.tsx
│   │   ├── ExerciseDetailScreen.tsx
│   │   ├── WorkoutPlanScreen.tsx
│   │   ├── AdminDashboardScreen.tsx
│   │   └── UserDetailScreen.tsx
│   ├── navigation/            # Stack + Tab navigation
│   ├── hooks/                 # useAuth, useAdmin, useWorkouts, etc.
│   ├── services/              # storage.ts, ai.ts (Gemini)
│   ├── types/                 # TypeScript interfaces
│   ├── utils/                 # Helper functions
│   └── constants/             # Colors, exercises, prompts
└── assets/                    # Icons, splash images
```

---

## 🆘 Support

- **Expo Docs:** https://docs.expo.dev
- **Gemini API Docs:** https://ai.google.dev/gemini-api/docs
- **React Native Docs:** https://reactnative.dev

---

Built with ❤️ using React Native + Expo + Google Gemini
