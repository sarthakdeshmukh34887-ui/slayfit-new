import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { UserProfile, UserAccount, LoginEvent } from '../types';
import { storageService } from '../services/storage';
import { supabase } from '../services/supabase';
import { generateId } from '../utils';
import { ADMIN_CREDENTIALS } from '../constants';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const GOOGLE_WEB_CLIENT_ID = '318547074855-5sfuo0rus3ni4se97c99qvj2l8a6fao1.apps.googleusercontent.com';

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: { id: string; name: string; email: string } | null;
  isInitialized: boolean;
  loading: boolean;
  authError: string | null;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  goal: UserProfile['goal'];
  weeklyTarget: number;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<any>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isAdmin: false,
    user: null,
    isInitialized: false,
    loading: true,
    authError: null,
  });

  const logLoginEvent = async (userId: string, userName: string, userEmail: string, type: LoginEvent['type']) => {
    try {
      const eventData = {
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        type: type,
        timestamp: new Date().toISOString(),
        device_info: Platform.OS,
      };

      console.log(`[AuthContext] Dispatching '${type}' payload directly to Supabase cloud table...`);

      // 1. Log directly to your Supabase cloud backend database table
      const { data, error } = await supabase
        .from('login_events')
        .insert([eventData])
        .select();

      if (error) {
        console.error('[AuthContext] Cloud Table Rejected Insert. Details:', JSON.stringify(error, null, 2));
      } else {
        console.log('[AuthContext] Verified Response confirmation from cloud table:', JSON.stringify(data, null, 2));
      }

      // 2. Local storage sync fallback
      await storageService.addLoginEvent({
        id: generateId(), 
        userId,
        userName,
        userEmail,
        type,
        timestamp: eventData.timestamp,
        deviceInfo: eventData.device_info,
      });
    } catch (err: any) {
      console.error('[AuthContext] Exception encountered during logging chain:', err.message);
    }
  };

  // Helper logic to ensure user account references exist in custom table structures
  const syncUserAccountTable = async (userId: string, name: string, email: string, isAdmin: boolean) => {
    try {
      let account = await storageService.getUserAccountByEmail(email);
      if (!account) {
        const newAccount: UserAccount = {
          id: userId,
          name,
          email,
          password: '',
          goal: 'general_fitness',
          weeklyTarget: 3,
          joinDate: new Date().toISOString(),
          isAdmin,
          lastLogin: new Date().toISOString(),
          status: 'active',
        };
        await storageService.addUserAccount(newAccount);
      } else {
        await storageService.addUserAccount({ 
          ...account, 
          lastLogin: new Date().toISOString() 
        });
      }

      // FIXED: Using .upsert with onConflict option to resolve the TS2339 property error
      await supabase
        .from('user_accounts')
        .upsert(
          [
            {
              id: userId,
              name,
              email,
              goal: 'general_fitness',
              weekly_target: 3,
              is_admin: isAdmin,
              last_login: new Date().toISOString(),
              status: 'active'
            }
          ], 
          { onConflict: 'email' }
        );

    } catch (e: any) {
      console.error('[AuthContext] Error syncing accounts table:', e.message);
    }
  };

  useEffect(() => {
    if (GoogleSignin?.configure) {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const email = session.user.email || '';
        const isAdmin = email === ADMIN_CREDENTIALS.email;
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];

        // Only auto-trigger fallback syncing from background deep links if state is completely empty
        if (event === 'SIGNED_IN' && !state.isAuthenticated) {
          await syncUserAccountTable(session.user.id, name, email, isAdmin);
        }

        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isAdmin,
          user: { id: session.user.id, name, email },
          isInitialized: true,
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isAdmin: false,
          user: null,
          isInitialized: true,
          loading: false,
        }));
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setState(prev => ({ ...prev, isInitialized: true, loading: false }));
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [state.isAuthenticated]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, authError: null }));
    try {
      const cleanEmail = email?.trim() || '';
      if (!cleanEmail || !password) {
        setState(prev => ({ ...prev, loading: false, authError: 'Please fill in all fields' }));
        return false;
      }

      let { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      
      if (error) {
        const account = await storageService.getUserAccountByEmail(cleanEmail);
        if (account && account.password === password) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: { data: { full_name: account.name } }
          });

          if (signUpError) {
            await logLoginEvent(account.id, account.name, cleanEmail, 'failed_login');
            setState(prev => ({ ...prev, loading: false, authError: signUpError.message }));
            return false;
          }
          
          if (!signUpData.session) {
             const retry = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
             data = retry.data;
             error = retry.error;
          } else {
             data = signUpData as any;
             error = null;
          }
        }

        if (error) {
          await logLoginEvent(account ? account.id : 'unknown', account ? account.name : 'Unknown', cleanEmail, 'failed_login');
          setState(prev => ({ ...prev, loading: false, authError: error?.message || 'Invalid email or password' }));
          return false;
        }
      }

      if (data?.user) {
        const emailStr = data.user.email || '';
        const nameStr = data.user.user_metadata?.full_name || emailStr.split('@')[0];
        const isAdminUser = emailStr === ADMIN_CREDENTIALS.email;
        
        await syncUserAccountTable(data.user.id, nameStr, emailStr, isAdminUser);
        await logLoginEvent(data.user.id, nameStr, emailStr, 'login');
      }

      return true;
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, authError: 'Login failed. Please try again.' }));
      return false;
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, authError: null }));
    try {
      const cleanEmail = data.email?.trim() || '';
      if (!data.name || !cleanEmail) {
        setState(prev => ({ ...prev, loading: false, authError: 'Please fill in name and email' }));
        return false;
      }
      
      const password = data.password?.trim() ? data.password : 'User@1234';
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: data.name } }
      });

      if (authError) {
        setState(prev => ({ ...prev, loading: false, authError: authError.message }));
        return false;
      }

      const userId = authData.user?.id;
      if (!userId) throw new Error("No user ID returned from Supabase Auth");

      const isAdmin = cleanEmail === ADMIN_CREDENTIALS.email;

      const account: UserAccount = {
        id: userId,
        name: data.name,
        email: cleanEmail,
        password: '',
        goal: data.goal,
        weeklyTarget: data.weeklyTarget,
        joinDate: new Date().toISOString(),
        isAdmin,
        lastLogin: new Date().toISOString(),
        status: 'active',
      };

      await storageService.addUserAccount(account);
      await syncUserAccountTable(userId, data.name, cleanEmail, isAdmin);
      await logLoginEvent(userId, data.name, cleanEmail, 'signup');
      return true;
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, authError: err?.message || 'Signup failed. Please try again.' }));
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<any> => {
    setState(prev => ({ ...prev, loading: true, authError: null }));
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const user = (response as any).data?.user || (response as any).user;
      const idToken = (response as any).data?.idToken || (response as any).idToken;

      if (!idToken) {
        throw new Error('Google sign-in failed: No ID token found in response');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;
      if (!data?.user) throw new Error("No user returned from Google Token handshake");

      const email = user?.email || data.user.email || '';
      const name = user?.name || data.user.user_metadata?.full_name || email.split('@')[0];
      const isAdmin = email === ADMIN_CREDENTIALS.email;

      await syncUserAccountTable(data.user.id, name, email, isAdmin);
      await logLoginEvent(data.user.id, name, email, 'login');

      let account = await storageService.getUserAccountByEmail(email);
      if (account) {
        return { exists: true };
      } else {
        setState(prev => ({ ...prev, loading: false }));
        return { exists: false, name, email, id: data.user.id };
      }
    } catch (err: any) {
      if (err?.code === statusCodes?.SIGN_IN_CANCELLED) {
        setState(prev => ({ ...prev, loading: false }));
      } else {
        setState(prev => ({ ...prev, loading: false, authError: err?.message || 'Google sign-in failed' }));
      }
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    const currentUser = state.user;
    if (currentUser) {
      await logLoginEvent(currentUser.id, currentUser.name, currentUser.email, 'logout');
    }

    try {
      // FORCE RESET: Clears the native identity caching on Android/iOS devices 
      // so the account choice modal explicitly prompts the user upon their next login.
      if (GoogleSignin?.signOut) {
        await GoogleSignin.signOut();
      }
    } catch (googleError) {
      console.error('[AuthContext] Handshake clearing native Google session error:', googleError);
    }

    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string, newPassword: string) => {
    try {
      const cleanEmail = email?.trim() || '';
      setState(prev => ({ ...prev, loading: true, authError: null }));
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      setState(prev => ({ ...prev, loading: false }));
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (err) {
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, message: 'Failed to reset password. Please try again.' };
    }
  };

  const clearError = () => setState(prev => ({ ...prev, authError: null }));

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, loginWithGoogle, resetPassword, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuthContext must be used within an AuthProvider');
  return context;
};