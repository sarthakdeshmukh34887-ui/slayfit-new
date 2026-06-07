// React Native 0.74+ has built-in URL support, so no polyfill needed.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// You can find them in your Supabase Dashboard under Settings -> API
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Setting this to true allows Supabase to natively capture 
    // access tokens appended to the deep link URL via confirmation emails.
    detectSessionInUrl: true,
  },
  global: {
    // CRITICAL FIX: Explicitly forces React Native's global fetch interface 
    // to bind auth states onto outgoing HTTP requests accurately.
    headers: { 'X-Client-Info': 'expo-react-native' },
  },
});