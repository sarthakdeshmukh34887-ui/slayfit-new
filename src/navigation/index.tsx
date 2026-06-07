import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import { COLORS } from '@constants';
import { useAuth } from '@hooks';

// Auth Screens
import LoginScreen from '@screens/LoginScreen';
import SignupScreen from '@screens/SignupScreen';
import ForgotPasswordScreen from '@screens/ForgotPasswordScreen';

// Main Screens
import HomeScreen from '@screens/HomeScreen';
import WorkoutLoggerScreen from '@screens/WorkoutLoggerScreen';
import AICoachScreen from '@screens/AICoachScreen';
import ProgressScreen from '@screens/ProgressScreen';
import ExerciseLibraryScreen from '@screens/ExerciseLibraryScreen';
import ExerciseDetailScreen from '@screens/ExerciseDetailScreen';
import WorkoutPlanScreen from '@screens/WorkoutPlanScreen';

// Admin Screens
import AdminDashboardScreen from '@screens/AdminDashboardScreen';
import UserDetailScreen from '@screens/UserDetailScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  WorkoutLogger: { workoutId?: string };
  ExerciseDetail: { exerciseId: string; exerciseName: string };
  WorkoutPlan: undefined;
  Admin: undefined;
  UserDetail: { userId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Progress: undefined;
  AICoach: undefined;
  Exercises: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ name, color, size = 24 }: { name: keyof typeof Ionicons.glyphMap; color: string; size?: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function AuthNavigator() {
  const [screen, setScreen] = useState<'login' | 'signup' | 'forgotPassword'>('login');
  const [googleData, setGoogleData] = useState<{ name: string; email: string } | null>(null);

  if (screen === 'forgotPassword') {
    return (
      <ForgotPasswordScreen onBack={() => setScreen('login')} />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {screen === 'login' ? (
        <LoginScreen 
          onNavigateToSignup={(data) => {
            if (data) setGoogleData(data);
            setScreen('signup');
          }} 
          onNavigateToForgotPassword={() => setScreen('forgotPassword')}
        />
      ) : (
        <SignupScreen 
          onNavigateToLogin={() => {
            setGoogleData(null);
            setScreen('login');
          }} 
          googleData={googleData}
        />
      )}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="trending-up" color={color} />,
          tabBarLabel: 'Progress',
        }}
      />
      <Tab.Screen
        name="AICoach"
        component={AICoachScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="flash" color={color} />,
          tabBarLabel: 'AI Coach',
        }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExerciseLibraryScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="library" color={color} />,
          tabBarLabel: 'Library',
        }}
      />
    </Tab.Navigator>
  );
}

// Admin Navigator
function AdminNavigator() {
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'userDetail'>('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  if (currentScreen === 'dashboard') {
    return (
      <AdminDashboardScreen
        onNavigateToUserDetail={(userId) => {
          setSelectedUserId(userId);
          setCurrentScreen('userDetail');
        }}
        onNavigateToLoginLogs={() => {}}
      />
    );
  }

  return (
    <UserDetailScreen
      userId={selectedUserId}
      onBack={() => setCurrentScreen('dashboard')}
    />
  );
}

export default function Navigation() {
  const { isAuthenticated, isAdmin, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="flash" size={48} color={COLORS.primary} />
        <Text style={styles.loadingText}>SlayFit</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: styles.header,
          headerTintColor: COLORS.text,
          headerTitleStyle: styles.headerTitle,
          cardStyle: { backgroundColor: COLORS.background },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : isAdmin ? (
          <>
            <Stack.Screen
              name="Admin"
              component={AdminNavigator}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="WorkoutLogger"
              component={WorkoutLoggerScreen}
              options={{ title: 'Log Workout' }}
            />
            <Stack.Screen
              name="ExerciseDetail"
              component={ExerciseDetailScreen}
              options={({ route }) => ({ title: route.params.exerciseName })}
            />
            <Stack.Screen
              name="WorkoutPlan"
              component={WorkoutPlanScreen}
              options={{ title: 'Workout Plan' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabItem: {
    paddingVertical: 4,
  },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.text,
  },
});
