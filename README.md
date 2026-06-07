# SlayFit Ai

An AI-powered workout tracking application built with React Native and Expo, powered by Google Gemini AI.

## Features

- **AI-Powered Coaching**: Integrated with Google Gemini for personalized workout plans, progress analysis, and form guidance
- **Workout Logging**: Log exercises, sets, reps, weight, and duration with rest timer and haptic feedback
- **Progress Tracking**: Visual charts showing volume trends, personal records, and weekly progress
- **Exercise Library**: 50+ exercises with AI-generated form tips
- **Dark-First Design**: Modern dark UI with electric blue accents
- **Admin Panel**: Hidden admin dashboard for monitoring users, login logs, and performance metrics

## Updated Authentication Flow

- Manual email/password login now authenticates directly against Supabase and ensures any previous Google session is cleared before proceeding.
- If a user logs in with Google, the flow remains unchanged, but the app now creates a local user record if one does not exist.
- Admin credentials are still hard‑coded for simplicity (admin@fitai.com / admin123).

## Tech Stack

- React Native with Expo SDK 51+
- TypeScript
- AsyncStorage for local persistence
- Google Gemini API (gemini-2.5-flash) for AI features
- React Navigation (bottom tabs + stack)
- Expo Vector Icons
- Victory Native for charts

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your Gemini API key from https://aistudio.google.com/app/apikey
```

3. Start the development server:
```bash
npx expo start
```

## Admin Access

The app includes a hidden admin panel. To access:
- Email: `admin@fitai.com`
- Password: `admin123`

Simply enter these credentials on the login screen (no visible hint exists for regular users).

## Project Structure & File Overview

### Root Files
- `.env`: Environment variables (API keys, Supabase URLs)
- `.gitignore`: Specifies intentionally untracked files that Git should ignore
- `app.json`: Core Expo application configuration and metadata
- `App.tsx`: Main entry point and root component of the React Native application
- `babel.config.js`: Babel compiler configuration for React Native/Expo
- `BUILD_GUIDE.md`: Detailed instructions for building, testing, and deploying the app
- `eas.json`: Expo Application Services (EAS) build profile configuration
- `metro.config.js`: Metro bundler configuration for React Native
- `package.json` & `package-lock.json`: NPM dependencies, scripts, and project metadata
- `README.md`: Project overview and documentation
- `setup.sh`: Utility bash script for setting up the initial development environment
- `tsconfig.json`: TypeScript compiler configuration

### Assets (`/assets`)
- `adaptive-icon.png`: Android adaptive app icon for the home screen
- `favicon.png`: Web favicon icon
- `icon.png`: Standard iOS and fallback application icon
- `splash.png`: Splash screen image displayed during application launch

### Source Code (`/src`)

**Components (`/src/components`)** - Reusable UI elements
- `Button.tsx`: Custom reusable button component with variant styling
- `Card.tsx`: Reusable card container component for grouping content
- `EmptyState.tsx`: UI component shown when lists or data sets are empty
- `Input.tsx`: Custom text input component with validation and formatting
- `Skeleton.tsx`: Loading skeleton placeholder animation for async data

**Constants (`/src/constants`)**
- `index.ts`: Centralized application constants including colors, theme, and layout metrics

**Context (`/src/context`)** - Global state management
- `AuthContext.tsx`: React Context provider for managing user authentication state
- `WorkoutContext.tsx`: React Context provider for managing active workout sessions and history

**Hooks (`/src/hooks`)**
- `index.ts`: Custom reusable React hooks for shared logic

**Navigation (`/src/navigation`)**
- `index.tsx`: Application routing, tab bar, and navigation stack configuration

**Screens (`/src/screens`)** - App views and pages
- `AdminDashboardScreen.tsx`: Hidden dashboard for administrators to monitor app usage
- `AICoachScreen.tsx`: Interactive chat interface for the Gemini AI workout coach
- `ExerciseDetailScreen.tsx`: Detailed view for a specific exercise including tips and history
- `ExerciseLibraryScreen.tsx`: Browseable and searchable library of all available exercises
- `ForgotPasswordScreen.tsx`: Password recovery and reset flow
- `HomeScreen.tsx`: Main dashboard showing workout progress, stats, and quick actions
- `LoginScreen.tsx`: User authentication and sign-in screen
- `ProgressScreen.tsx`: Charts and visualizations of long-term workout progress
- `SignupScreen.tsx`: New user registration flow
- `UserDetailScreen.tsx`: Administrator view for inspecting specific user details and metrics
- `WorkoutLoggerScreen.tsx`: Core interface for logging sets, reps, and weights during a workout
- `WorkoutPlanScreen.tsx`: Interface displaying AI-generated structured workout plans

**Services (`/src/services`)** - External integrations
- `ai.ts`: Integration with Google Gemini API for AI coaching and plan generation
- `storage.ts`: Local data persistence logic using AsyncStorage
- `supabase.ts`: Supabase backend client configuration and database interactions

**Types (`/src/types`)**
- `index.ts`: TypeScript interfaces and type definitions used across the app

**Utils (`/src/utils`)**
- `index.ts`: Helper utility functions for formatting, calculations, and data manipulation

## AI Features (Gemini API)

- **Daily Coaching Tip**: Contextual advice based on recent workout history
- **Workout Plan Generator**: Creates structured 4-week plans based on goals and equipment
- **Progress Analyzer**: Reads workout history and provides insights
- **Form Guidance**: On-demand coaching cues for any exercise
- **Chat Interface**: Streaming conversation with AI coach

## Data Model

All data is persisted locally using AsyncStorage:
- `workouts`: Array of workout sessions
- `userProfile`: User preferences and goals
- `exerciseLibrary`: Cached exercise data with AI tips
- `chatHistory`: Conversation history with AI coach
- `userAccounts`: Registered user accounts (admin tracking)
- `loginEvents`: Audit log of all login/signup/logout events

## License

MIT
