import { Workout, Exercise, PersonalRecord } from '@types';

export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const calculateVolume = (exercise: Exercise): number => {
  return exercise.sets.reduce((total, set) => total + (set.weight * set.reps), 0);
};

export const calculateWorkoutVolume = (workout: Workout): number => {
  return workout.exercises.reduce((total, exercise) => total + calculateVolume(exercise), 0);
};

export const getPersonalRecords = (workouts: Workout[]): PersonalRecord[] => {
  const records: Map<string, PersonalRecord> = new Map();

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        const key = `${exercise.name}-${set.reps}`;
        const current = records.get(key);

        if (!current || set.weight > current.weight) {
          records.set(key, {
            exerciseName: exercise.name,
            weight: set.weight,
            reps: set.reps,
            date: workout.date,
          });
        }
      });
    });
  });

  return Array.from(records.values()).sort((a, b) => b.weight - a.weight);
};

export const getWeeklyVolume = (workouts: Workout[]): { week: string; totalVolume: number }[] => {
  const weeklyData: Map<string, number> = new Map();

  workouts.forEach(workout => {
    const date = new Date(workout.date);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    const volume = calculateWorkoutVolume(workout);

    weeklyData.set(weekKey, (weeklyData.get(weekKey) || 0) + volume);
  });

  return Array.from(weeklyData.entries())
    .map(([week, totalVolume]) => ({ week, totalVolume }))
    .sort((a, b) => a.week.localeCompare(b.week));
};

export const getVolumeByExercise = (workouts: Workout[], exerciseName: string): { date: string; volume: number }[] => {
  return workouts
    .filter(w => w.exercises.some(e => e.name === exerciseName))
    .map(w => ({
      date: w.date,
      volume: w.exercises
        .filter(e => e.name === exerciseName)
        .reduce((sum, e) => sum + calculateVolume(e), 0),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getStreak = (workouts: Workout[]): number => {
  if (workouts.length === 0) return 0;

  const sorted = [...workouts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const workout of sorted) {
    const workoutDate = new Date(workout.date);
    workoutDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      streak++;
      currentDate = workoutDate;
    } else if (diffDays > streak) {
      break;
    }
  }

  return streak;
};

export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const getMuscleGroupVolume = (workouts: Workout[]): { muscleGroup: string; volume: number }[] => {
  const muscleGroups: Map<string, number> = new Map();

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      // Simple mapping - in real app, you'd have muscle group data per exercise
      const volume = calculateVolume(exercise);
      muscleGroups.set(exercise.muscleGroup, (muscleGroups.get(exercise.muscleGroup) || 0) + volume);
    });
  });

  return Array.from(muscleGroups.entries())
    .map(([muscleGroup, volume]) => ({ muscleGroup, volume }))
    .sort((a, b) => b.volume - a.volume);
};
