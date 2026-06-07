export interface Set {
  id: string;
  weight: number;
  reps: number;
  duration?: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: Set[];
  notes?: string;
  restTimerSeconds?: number;
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  exercises: Exercise[];
  duration: number;
  completed: boolean;
}

export interface UserProfile {
  name: string;
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_fitness';
  weeklyTarget: number;
  joinDate: string;
  equipment: string[];
}

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  muscleGroup: string;
  category: string;
  formTip?: string;
}

export interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

export interface WeeklyVolume {
  week: string;
  totalVolume: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  weeks: WeekPlan[];
  createdAt: string;
}

export interface WeekPlan {
  weekNumber: number;
  days: DayPlan[];
}

export interface DayPlan {
  day: string;
  exercises: { name: string; sets: number; reps: string; rest: string }[];
}

// ==================== ADMIN TYPES ====================

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  goal: UserProfile['goal'];
  weeklyTarget: number;
  joinDate: string;
  isAdmin: boolean;
  lastLogin?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface LoginEvent {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'login' | 'signup' | 'logout' | 'failed_login';
  timestamp: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface UserPerformance {
  userId: string;
  userName: string;
  userEmail: string;
  totalWorkouts: number;
  totalVolume: number;
  personalRecords: number;
  currentStreak: number;
  lastWorkoutDate?: string;
  weeklyAverage: number;
  joinDate: string;
  status: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalWorkoutsAllUsers: number;
  totalLoginsToday: number;
  averageWorkoutsPerUser: number;
}
