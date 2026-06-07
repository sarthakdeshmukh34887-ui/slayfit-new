import { ExerciseLibraryItem } from '../types';
export const COLORS = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceLight: '#252525',
  surfaceLighter: '#333333',
  primary: '#4F8EF7',
  primaryDark: '#3A6FD4',
  primaryLight: '#7AABF9',
  accent: '#00D9FF',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#666666',
  border: '#2A2A2A',
  borderLight: '#3A3A3A',
  admin: '#FF6B35',
  adminLight: '#FF8C61',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const STORAGE_KEYS = {
  WORKOUTS: '@fitai_workouts',
  USER_PROFILE: '@fitai_user_profile',
  EXERCISE_LIBRARY: '@fitai_exercise_library',
  CHAT_HISTORY: '@fitai_chat_history',
  WORKOUT_PLANS: '@fitai_workout_plans',
  AI_TIP: '@fitai_ai_tip',
  LAST_SYNC: '@fitai_last_sync',
  AUTH_STATE: '@fitai_auth_state',
  // Admin keys
  USER_ACCOUNTS: '@fitai_user_accounts',
  LOGIN_EVENTS: '@fitai_login_events',
  ADMIN_SESSION: '@fitai_admin_session',
};

export const EXERCISE_LIBRARY = [
  { id: '1', name: 'Barbell Squat', muscleGroup: 'Legs', category: 'Compound' },
  { id: '2', name: 'Deadlift', muscleGroup: 'Back', category: 'Compound' },
  { id: '3', name: 'Bench Press', muscleGroup: 'Chest', category: 'Compound' },
  { id: '4', name: 'Overhead Press', muscleGroup: 'Shoulders', category: 'Compound' },
  { id: '5', name: 'Barbell Row', muscleGroup: 'Back', category: 'Compound' },
  { id: '6', name: 'Pull-Up', muscleGroup: 'Back', category: 'Bodyweight' },
  { id: '7', name: 'Dip', muscleGroup: 'Chest', category: 'Bodyweight' },
  { id: '8', name: 'Leg Press', muscleGroup: 'Legs', category: 'Machine' },
  { id: '9', name: 'Leg Curl', muscleGroup: 'Legs', category: 'Isolation' },
  { id: '10', name: 'Leg Extension', muscleGroup: 'Legs', category: 'Isolation' },
  { id: '11', name: 'Calf Raise', muscleGroup: 'Legs', category: 'Isolation' },
  { id: '12', name: 'Incline Bench Press', muscleGroup: 'Chest', category: 'Compound' },
  { id: '13', name: 'Dumbbell Fly', muscleGroup: 'Chest', category: 'Isolation' },
  { id: '14', name: 'Cable Crossover', muscleGroup: 'Chest', category: 'Isolation' },
  { id: '15', name: 'Lat Pulldown', muscleGroup: 'Back', category: 'Compound' },
  { id: '16', name: 'Seated Cable Row', muscleGroup: 'Back', category: 'Compound' },
  { id: '17', name: 'Face Pull', muscleGroup: 'Shoulders', category: 'Isolation' },
  { id: '18', name: 'Lateral Raise', muscleGroup: 'Shoulders', category: 'Isolation' },
  { id: '19', name: 'Front Raise', muscleGroup: 'Shoulders', category: 'Isolation' },
  { id: '20', name: 'Rear Delt Fly', muscleGroup: 'Shoulders', category: 'Isolation' },
  { id: '21', name: 'Bicep Curl', muscleGroup: 'Arms', category: 'Isolation' },
  { id: '22', name: 'Hammer Curl', muscleGroup: 'Arms', category: 'Isolation' },
  { id: '23', name: 'Preacher Curl', muscleGroup: 'Arms', category: 'Isolation' },
  { id: '24', name: 'Tricep Pushdown', muscleGroup: 'Arms', category: 'Isolation' },
  { id: '25', name: 'Skull Crusher', muscleGroup: 'Arms', category: 'Isolation' },
  { id: '26', name: 'Overhead Tricep Extension', muscleGroup: 'Arms', category: 'Isolation' },
  { id: '27', name: 'Close-Grip Bench Press', muscleGroup: 'Arms', category: 'Compound' },
  { id: '28', name: 'Romanian Deadlift', muscleGroup: 'Back', category: 'Compound' },
  { id: '29', name: 'Good Morning', muscleGroup: 'Back', category: 'Compound' },
  { id: '30', name: 'Hyperextension', muscleGroup: 'Back', category: 'Isolation' },
  { id: '31', name: 'Plank', muscleGroup: 'Core', category: 'Bodyweight' },
  { id: '32', name: 'Crunch', muscleGroup: 'Core', category: 'Bodyweight' },
  { id: '33', name: 'Leg Raise', muscleGroup: 'Core', category: 'Bodyweight' },
  { id: '34', name: 'Russian Twist', muscleGroup: 'Core', category: 'Bodyweight' },
  { id: '35', name: 'Ab Wheel Rollout', muscleGroup: 'Core', category: 'Bodyweight' },
  { id: '36', name: 'Hanging Leg Raise', muscleGroup: 'Core', category: 'Bodyweight' },
  { id: '37', name: 'Treadmill Run', muscleGroup: 'Cardio', category: 'Cardio' },
  { id: '38', name: 'Stationary Bike', muscleGroup: 'Cardio', category: 'Cardio' },
  { id: '39', name: 'Rowing Machine', muscleGroup: 'Cardio', category: 'Cardio' },
  { id: '40', name: 'Elliptical', muscleGroup: 'Cardio', category: 'Cardio' },
  { id: '41', name: 'StairMaster', muscleGroup: 'Cardio', category: 'Cardio' },
  { id: '42', name: 'Box Jump', muscleGroup: 'Legs', category: 'Plyometric' },
  { id: '43', name: 'Burpee', muscleGroup: 'Full Body', category: 'Bodyweight' },
  { id: '44', name: 'Kettlebell Swing', muscleGroup: 'Full Body', category: 'Free Weight' },
  { id: '45', name: 'Turkish Get-Up', muscleGroup: 'Full Body', category: 'Free Weight' },
  { id: '46', name: "Farmer's Walk", muscleGroup: 'Full Body', category: 'Free Weight' },
  { id: '47', name: 'Sled Push', muscleGroup: 'Full Body', category: 'Strongman' },
  { id: '48', name: 'Tire Flip', muscleGroup: 'Full Body', category: 'Strongman' },
  { id: '49', name: 'Clean and Press', muscleGroup: 'Full Body', category: 'Olympic' },
  { id: '50', name: 'Snatch', muscleGroup: 'Full Body', category: 'Olympic' },
  { id: '51', name: 'Push Press', muscleGroup: 'Shoulders', category: 'Olympic' },
  { id: '52', name: 'Front Squat', muscleGroup: 'Legs', category: 'Compound' },
  { id: '53', name: 'Hack Squat', muscleGroup: 'Legs', category: 'Machine' },
  { id: '54', name: 'Goblet Squat', muscleGroup: 'Legs', category: 'Free Weight' },
  { id: '55', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', category: 'Free Weight' },
];

export const MUSCLE_GROUPS = [
  'All', 'Legs', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body',
];

export const AI_PROMPTS = {
  WORKOUT_PLAN: `Generate a structured 4-week workout plan. Return ONLY JSON.`,
  ANALYZE_PROGRESS: `Analyze workout history. Focus on volume trends, PRs, balance, weaknesses.`,
  DAILY_TIP: `Short actionable fitness tip based on recent workout history.`,
  FORM_GUIDANCE: `3-4 concise form cues for the exercise.`,
  WHAT_TO_TRAIN: `Suggest what to train today based on recent history.`,
};

export const ADMIN_CREDENTIALS = {
  email: 'admin@fitai.com',
  password: 'admin123',
};
