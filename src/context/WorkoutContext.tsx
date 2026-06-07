import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Workout } from '../types';
import { storageService } from '../services/storage';
import { generateId } from '../utils';

interface WorkoutContextType {
  workouts: Workout[];
  loading: boolean;
  addWorkout: (workout: Omit<Workout, 'id'>) => Promise<Workout>;
  updateWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    const data = await storageService.getWorkouts();
    setWorkouts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const addWorkout = async (workout: Omit<Workout, 'id'>): Promise<Workout> => {
    const newWorkout: Workout = { ...workout, id: generateId() };
    await storageService.addWorkout(newWorkout);
    setWorkouts(prev => [newWorkout, ...prev]);
    return newWorkout;
  };

  const updateWorkout = async (workout: Workout): Promise<void> => {
    await storageService.updateWorkout(workout);
    setWorkouts(prev => prev.map(w => w.id === workout.id ? workout : w));
  };

  const deleteWorkout = async (id: string): Promise<void> => {
    await storageService.deleteWorkout(id);
    setWorkouts(prev => prev.filter(w => w.id !== id));
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        loading,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        refresh: loadWorkouts,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkoutContext = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkoutContext must be used within a WorkoutProvider');
  }
  return context;
};
