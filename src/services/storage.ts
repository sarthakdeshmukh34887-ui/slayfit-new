import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@constants';
import { Workout, UserProfile, ExerciseLibraryItem, ChatMessage, WorkoutPlan, UserAccount, LoginEvent } from '@types';
import { supabase } from './supabase';

class StorageService {
  // Dynamically populated upon a user's successful login
  private currentUserId: string | null = null;

  setUserId(userId: string) {
    this.currentUserId = userId;
  }

  // ============== WORKOUTS ==============
  async getWorkouts(): Promise<Workout[]> {
    try {
      if (!this.currentUserId) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
        return data ? JSON.parse(data) : [];
      }

      // Query table matching your jsonb column structure
      const { data, error } = await supabase
        .from('workouts')
        .select('data')
        .eq('user_id', this.currentUserId);

      if (error) throw error;
      return data ? data.map(row => row.data as Workout) : [];
    } catch (error) {
      console.error('Error getting workouts:', error);
      return [];
    }
  }

  async saveWorkouts(workouts: Workout[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));

      if (this.currentUserId) {
        // Formulates a payload fitting: id, user_id, data (jsonb)
        const payload = workouts.map(workout => ({
          id: workout.id,
          user_id: this.currentUserId,
          data: workout, 
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase.from('workouts').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving workouts:', error);
    }
  }

  async addWorkout(workout: Workout): Promise<void> {
    const workouts = await this.getWorkouts();
    workouts.unshift(workout);
    await this.saveWorkouts(workouts);
  }

  async updateWorkout(workout: Workout): Promise<void> {
    const workouts = await this.getWorkouts();
    const index = workouts.findIndex(w => w.id === workout.id);
    if (index !== -1) {
      workouts[index] = workout;
      await this.saveWorkouts(workouts);
    }
  }

  async deleteWorkout(id: string): Promise<void> {
    const workouts = await this.getWorkouts();
    const filtered = workouts.filter(w => w.id !== id);
    await this.saveWorkouts(filtered);

    if (this.currentUserId) {
      try {
        await supabase.from('workouts').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting remote workout:', err);
      }
    }
  }

  // ============== USER PROFILE ==============
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      if (!this.currentUserId) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        return data ? JSON.parse(data) : null;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile')
        .eq('user_id', this.currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return data ? (data.profile as UserProfile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));

      if (this.currentUserId) {
        const { error } = await supabase.from('user_profiles').upsert({
          user_id: this.currentUserId,
          profile: profile, // Fits the jsonb schema
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  // ============== EXERCISE LIBRARY ==============
  async getExerciseLibrary(): Promise<ExerciseLibraryItem[]> {
    try {
      if (!this.currentUserId) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_LIBRARY);
        return data ? JSON.parse(data) : [];
      }

      const { data, error } = await supabase
        .from('exercise_library')
        .select('item')
        .eq('user_id', this.currentUserId);

      if (error) throw error;
      return data ? data.map(row => row.item as ExerciseLibraryItem) : [];
    } catch (error) {
      console.error('Error getting exercise library:', error);
      return [];
    }
  }

  async saveExerciseLibrary(library: ExerciseLibraryItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_LIBRARY, JSON.stringify(library));

      if (this.currentUserId) {
        const payload = library.map(item => ({
          id: item.id,
          user_id: this.currentUserId,
          item: item, // Fits your item jsonb structure
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase.from('exercise_library').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving exercise library:', error);
    }
  }

  // ============== CHAT HISTORY ==============
  async getChatHistory(): Promise<ChatMessage[]> {
    try {
      if (!this.currentUserId) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
        return data ? JSON.parse(data) : [];
      }

      const { data, error } = await supabase
        .from('chat_history')
        .select('message')
        .eq('user_id', this.currentUserId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ? data.map(row => row.message as ChatMessage) : [];
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  async saveChatHistory(history: ChatMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));

      if (this.currentUserId) {
        const payload = history.map(msg => ({
          id: msg.id,
          user_id: this.currentUserId,
          message: msg, // Fits message jsonb
          created_at: msg.timestamp || new Date().toISOString()
        }));

        const { error } = await supabase.from('chat_history').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  // ============== WORKOUT PLANS ==============
  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    try {
      if (!this.currentUserId) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_PLANS);
        return data ? JSON.parse(data) : [];
      }

      const { data, error } = await supabase
        .from('workout_plans')
        .select('plan')
        .eq('user_id', this.currentUserId);

      if (error) throw error;
      return data ? data.map(row => row.plan as WorkoutPlan) : [];
    } catch (error) {
      console.error('Error getting workout plans:', error);
      return [];
    }
  }

  async saveWorkoutPlans(plans: WorkoutPlan[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PLANS, JSON.stringify(plans));

      if (this.currentUserId) {
        const payload = plans.map(plan => ({
          id: plan.id,
          user_id: this.currentUserId,
          plan: plan, // Fits plan jsonb
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase.from('workout_plans').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving workout plans:', error);
    }
  }

  // ============== AI TIP ==============
  async getAITip(): Promise<string | null> {
    try {
      if (!this.currentUserId) {
        return await AsyncStorage.getItem(STORAGE_KEYS.AI_TIP);
      }

      const { data, error } = await supabase
        .from('ai_tips')
        .select('tip')
        .eq('user_id', this.currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? data.tip : null;
    } catch (error) {
      console.error('Error getting AI tip:', error);
      return null;
    }
  }

  async saveAITip(tip: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AI_TIP, tip);

      if (this.currentUserId) {
        const { error } = await supabase.from('ai_tips').upsert({
          user_id: this.currentUserId,
          tip: tip,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving AI tip:', error);
    }
  }

  // ============== ADMIN: USER ACCOUNTS ==============
  async getUserAccounts(): Promise<UserAccount[]> {
    try {
      const { data, error } = await supabase.from('user_accounts').select('*');
      if (error) throw error;
      
      // FIX: Wrapped in arrow function to stop unhandled 'this' runtime exceptions
      return (data || []).map(record => this.mapDbToUserAccount(record));
    } catch (error) {
      console.error('Error getting user accounts from Supabase:', error);
      return [];
    }
  }

  async saveUserAccounts(accounts: UserAccount[]): Promise<void> {
    console.warn('saveUserAccounts is deprecated. Use individual updates in Supabase.');
  }

  async addUserAccount(account: UserAccount): Promise<void> {
    try {
      const { error } = await supabase.from('user_accounts').upsert({
        id: account.id,
        name: account.name,
        email: account.email,
        password: account.password,
        goal: account.goal,
        weekly_target: account.weeklyTarget,
        join_date: account.joinDate,
        is_admin: account.isAdmin,
        last_login: account.lastLogin,
        status: account.status,
      }, { onConflict: 'email' });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding user account to Supabase:', error);
    }
  }

  async getUserAccountByEmail(email: string): Promise<UserAccount | null> {
    try {
      const { data, error } = await supabase.from('user_accounts').select('*').eq('email', email).single();
      if (error && error.code !== 'PGRST116') throw error; 
      return data ? this.mapDbToUserAccount(data) : null;
    } catch (error) {
      console.error('Error getting user account by email from Supabase:', error);
      return null;
    }
  }

  // ============== ADMIN: LOGIN EVENTS ==============
  async getLoginEvents(): Promise<LoginEvent[]> {
    try {
      const { data, error } = await supabase.from('login_events').select('*').order('timestamp', { ascending: false }).limit(1000);
      if (error) throw error;
      
      // FIX: Wrapped in arrow function to preserve scope stability
      return (data || []).map(record => this.mapDbToLoginEvent(record));
    } catch (error) {
      console.error('Error getting login events from Supabase:', error);
      return [];
    }
  }

  async saveLoginEvents(events: LoginEvent[]): Promise<void> {
    console.warn('saveLoginEvents is deprecated.');
  }

  async addLoginEvent(event: LoginEvent): Promise<void> {
    try {
      const { error } = await supabase.from('login_events').insert({
        id: event.id,
        user_id: event.userId,
        user_name: event.userName,
        user_email: event.userEmail,
        type: event.type,
        timestamp: event.timestamp,
        device_info: event.deviceInfo,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding login event to Supabase:', error);
    }
  }

  async getLoginEventsForUser(userId: string): Promise<LoginEvent[]> {
    try {
      const { data, error } = await supabase.from('login_events').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
      if (error) throw error;
      
      // FIX: Inline mapping arrow wrap
      return (data || []).map(record => this.mapDbToLoginEvent(record));
    } catch (error) {
      console.error('Error getting login events for user from Supabase:', error);
      return [];
    }
  }

  async getLoginEventsForToday(): Promise<LoginEvent[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('login_events').select('*').gte('timestamp', `${today}T00:00:00Z`).order('timestamp', { ascending: false });
      if (error) throw error;
      
      // FIX: Inline mapping arrow wrap
      return (data || []).map(record => this.mapDbToLoginEvent(record));
    } catch (error) {
      console.error('Error getting login events for today from Supabase:', error);
      return [];
    }
  }

  // ============== USER: SESSION MANAGEMENT ==============
  async getUserSession(): Promise<{ id: string; name: string; email: string } | null> {
    try {
      const data = await AsyncStorage.getItem('@SlayFit:UserSession');
      if (data) {
        const parsed = JSON.parse(data);
        this.setUserId(parsed.id); // Bind the user ID on application startup
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  }

  async saveUserSession(session: { id: string; name: string; email: string }): Promise<void> {
    try {
      this.setUserId(session.id); // Dynamically switch targeting over to cloud sync mode
      await AsyncStorage.setItem('@SlayFit:UserSession', JSON.stringify(session));
    } catch (error) {
      console.error('Error saving user session:', error);
    }
  }

  async clearUserSession(): Promise<void> {
    try {
      this.currentUserId = null; // Unbind cloud variables safely
      await AsyncStorage.removeItem('@SlayFit:UserSession');
    } catch (error) {
      console.error('Error clearing user session:', error);
    }
  }

  // ============== HELPERS ==============
  private mapDbToUserAccount(dbRecord: any): UserAccount {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      email: dbRecord.email,
      password: dbRecord.password,
      goal: dbRecord.goal,
      weeklyTarget: dbRecord.weekly_target,
      joinDate: dbRecord.join_date,
      isAdmin: dbRecord.is_admin,
      lastLogin: dbRecord.last_login,
      status: dbRecord.status,
    };
  }

  private mapDbToLoginEvent(dbRecord: any): LoginEvent {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      userName: dbRecord.user_name,
      userEmail: dbRecord.user_email,
      type: dbRecord.type,
      timestamp: dbRecord.timestamp,
      deviceInfo: dbRecord.device_info,
    };
  }

  // ============== CLEAR ALL ==============
  async clearAll(): Promise<void> {
    try {
      this.currentUserId = null;
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export const storageService = new StorageService();