import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Workout, Exercise, ChatMessage, UserProfile, ExerciseLibraryItem, UserAccount, LoginEvent } from '../types';
import { storageService } from '../services/storage';
import { aiService } from '../services/ai';
import { generateId, getStreak, calculateWorkoutVolume } from '../utils';
import { EXERCISE_LIBRARY, ADMIN_CREDENTIALS } from '../constants';
import { useAuthContext } from '../context/AuthContext';
import { useWorkoutContext } from '../context/WorkoutContext';

// ==================== AUTH HOOK (with admin support) ====================

export const useAuth = () => {
  const context = useAuthContext();
  return {
    ...context,
    loginWithGoogle: context.loginWithGoogle as () => Promise<any>
  };
};


const logLoginEvent = async (userId: string, userName: string, userEmail: string, type: LoginEvent['type']) => {
  const event: LoginEvent = {
    id: generateId(),
    userId,
    userName,
    userEmail,
    type,
    timestamp: new Date().toISOString(),
    deviceInfo: Platform.OS,
  };
  await storageService.addLoginEvent(event);
};

// ==================== ADMIN HOOK ====================

export const useAdmin = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    const accounts = await storageService.getUserAccounts();
    const events = await storageService.getLoginEvents();
    setUsers(accounts);
    setLoginEvents(events);
    setLoading(false);
  };

  const getUserWorkouts = async (userId: string): Promise<Workout[]> => {
    return await storageService.getWorkouts();
  };

  const suspendUser = async (userId: string) => {
    const accounts = await storageService.getUserAccounts();
    const updated = accounts.map(a => 
      a.id === userId ? { ...a, status: 'suspended' as const } : a
    );
    await storageService.saveUserAccounts(updated);
    setUsers(updated);
  };

  const activateUser = async (userId: string) => {
    const accounts = await storageService.getUserAccounts();
    const updated = accounts.map(a => 
      a.id === userId ? { ...a, status: 'active' as const } : a
    );
    await storageService.saveUserAccounts(updated);
    setUsers(updated);
  };

  const deleteUser = async (userId: string) => {
    const accounts = await storageService.getUserAccounts();
    const updated = accounts.filter(a => a.id !== userId);
    await storageService.saveUserAccounts(updated);
    setUsers(updated);
  };

  return {
    users,
    loginEvents,
    loading,
    refresh: loadAdminData,
    getUserWorkouts,
    suspendUser,
    activateUser,
    deleteUser,
  };
};

// ==================== EXISTING HOOKS ====================

export const useWorkouts = () => {
  const { workouts, loading, addWorkout, updateWorkout, deleteWorkout, refresh } = useWorkoutContext();

  const getTodayWorkout = useCallback((): Workout | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return workouts.find(w => w.date.startsWith(today));
  }, [workouts]);

  const streak = getStreak(workouts);
  const totalWorkouts = workouts.length;

  return {
    workouts,
    loading,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    getTodayWorkout,
    streak,
    totalWorkouts,
    refresh,
  };
};

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await storageService.getUserProfile();
      if (!data) {
        const defaultProfile: UserProfile = {
          name: 'User',
          goal: 'general_fitness',
          weeklyTarget: 3,
          joinDate: new Date().toISOString(),
          equipment: ['barbell', 'dumbbell'],
        };
        await storageService.saveUserProfile(defaultProfile);
        setProfile(defaultProfile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadProfile().catch(err => {
      if (isMounted) {
        console.error('Fatal error loading profile:', err);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadProfile]);

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    const current = profile || await storageService.getUserProfile();
    const updated = { ...current, ...updates } as UserProfile;
    await storageService.saveUserProfile(updated);
    setProfile(updated);
  };

  return { profile, loading, updateProfile, refresh: loadProfile };
};

export const useAITip = () => {
  const [tip, setTip] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchTip = useCallback(async (force = false) => {
    if (!force) {
      try {
        const cached = await storageService.getAITip();
        if (cached) {
          setTip(cached);
          return;
        }
      } catch (e) {
        console.error('Error getting cached tip:', e);
      }
    }

    setLoading(true);
    try {
      const newTip = await aiService.generateDailyTip();
      setTip(newTip);
    } catch (error) {
      console.error('Error generating tip:', error);
      setTip('Stay consistent with your training. Small steps lead to big gains!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchTip().catch(err => {
      if (isMounted) {
        console.error('Fatal error fetching tip:', err);
        setTip('Stay consistent with your training. Small steps lead to big gains!');
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchTip]);

  return { tip, loading, refresh: () => fetchTip(true) };
};

export const useExerciseLibrary = () => {
  const [exercises, setExercises] = useState<ExerciseLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLibrary = useCallback(async () => {
    try {
      const cached = await storageService.getExerciseLibrary();
      if (cached && cached.length > 0) {
        setExercises(cached);
      } else {
        if (EXERCISE_LIBRARY && EXERCISE_LIBRARY.length > 0) {
          const library = EXERCISE_LIBRARY.map(e => ({ ...e, formTip: undefined }));
          await storageService.saveExerciseLibrary(library);
          setExercises(library);
        }
      }
    } catch (error) {
      console.error('Error loading exercise library:', error);
      if (EXERCISE_LIBRARY && EXERCISE_LIBRARY.length > 0) {
        const library = EXERCISE_LIBRARY.map(e => ({ ...e, formTip: undefined }));
        setExercises(library);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadLibrary().catch(err => {
      if (isMounted) {
        console.error('Fatal error loading library:', err);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadLibrary]);

  const searchExercises = (query: string, muscleGroup?: string): ExerciseLibraryItem[] => {
    return exercises.filter(e => {
      const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase());
      const matchesGroup = !muscleGroup || muscleGroup === 'All' || e.muscleGroup === muscleGroup;
      return matchesQuery && matchesGroup;
    });
  };

  const getFormTip = async (exerciseId: string): Promise<string | undefined> => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (exercise?.formTip) return exercise.formTip;

    if (exercise) {
      const tip = await aiService.getFormTip(exercise.name);
      const updated = exercises.map(e => 
        e.id === exerciseId ? { ...e, formTip: tip } : e
      );
      setExercises(updated);
      await storageService.saveExerciseLibrary(updated);
      return tip;
    }
    return undefined;
  };

  return { exercises, loading, searchExercises, getFormTip, refresh: loadLibrary };
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const history = await storageService.getChatHistory();
      setMessages(history || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadHistory().catch(err => {
      if (isMounted) {
        console.error('Fatal error loading chat history:', err);
        setMessages([]);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadHistory]);

  const sendMessage = async (content: string): Promise<void> => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages([...updatedMessages, assistantMessage]);

    try {
      let fullContent = '';
      for await (const chunk of aiService.streamChatResponse(updatedMessages)) {
        fullContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = fullContent;
          }
          return [...newMessages];
        });
      }

      const finalMessages = [...updatedMessages, { ...assistantMessage, content: fullContent }];
      await storageService.saveChatHistory(finalMessages);
    } catch (error) {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = 'Sorry, I encountered an error. Please try again.';
        }
        return [...newMessages];
      });
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async (): Promise<void> => {
    await storageService.saveChatHistory([]);
    setMessages([]);
  };

  return { messages, loading, sendMessage, clearHistory };
};

export const useRestTimer = (initialSeconds: number = 90) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback((newSeconds: number = initialSeconds) => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(newSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { seconds, isRunning, start, pause, reset };
};
