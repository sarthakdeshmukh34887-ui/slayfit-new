import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';

import Navigation from '@navigation';
import { COLORS } from '@constants';
import { AuthProvider } from './src/context/AuthContext';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { supabase } from './src/services/supabase';

export default function App() {
  useEffect(() => {
    // Helper function to extract and set session parameters from confirmation deep links
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      try {
        console.log('App intercepted deep link URL:', url);

        // Check if the URL contains the access token hash parameters from the confirmation email
        if (url.includes('#access_token=')) {
          const hashSplit = url.split('#')[1];
          const urlParams = new URLSearchParams(hashSplit);

          const access_token = urlParams.get('access_token');
          const refresh_token = urlParams.get('refresh_token');

          if (access_token && refresh_token) {
            console.log('Setting Supabase session from deep link tokens...');
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (error) {
              console.error('Error establishing session from link:', error.message);
            } else {
              console.log('Session successfully established via link confirmation!');
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to parse deep link routing tokens:', err.message);
      }
    };

    // 1. Handle deep link if the app was completely closed/killed and opened by clicking the link
    Linking.getInitialURL()
      .then((url) => {
        if (url) handleDeepLink(url);
      })
      .catch((err) => console.error('Error getting initial URL:', err));

    // 2. Handle deep link if the app was running in the background
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <WorkoutProvider>
            <StatusBar style="light" />
            <Navigation />
          </WorkoutProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});