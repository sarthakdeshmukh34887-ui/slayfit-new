import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@constants';
import { useWorkouts, useUserProfile, useAITip, useAuth } from '@hooks';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Skeleton, SkeletonCard } from '@components/Skeleton';
import { EmptyState } from '@components/EmptyState';
import { formatDate, calculateWorkoutVolume, getStreak } from '@utils';
import { RootStackParamList } from '@navigation';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { workouts, loading, getTodayWorkout, streak, totalWorkouts, refresh } = useWorkouts();
  const { profile } = useUserProfile();
  const { tip, loading: tipLoading, refresh: refreshTip } = useAITip();
  const { logout, user } = useAuth();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    await refreshTip();
    setRefreshing(false);
  }, [refresh, refreshTip]);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const todayWorkout = getTodayWorkout();
  const recentWorkouts = workouts.slice(0, 5);

  const getWeeklyProgress = () => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisWeekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart);
    return {
      completed: thisWeekWorkouts.length,
      target: profile?.weeklyTarget || 3,
    };
  };

  const weeklyProgress = getWeeklyProgress();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name || profile?.name || 'Athlete'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Streak Card */}
        <Card style={styles.streakCard} variant="elevated">
          <View style={styles.streakContent}>
            <View style={styles.streakIcon}>
              <Ionicons name="flame" size={28} color={COLORS.warning} />
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
            <View style={styles.weeklyProgress}>
              <Text style={styles.weeklyText}>
                {weeklyProgress.completed}/{weeklyProgress.target} this week
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((weeklyProgress.completed / weeklyProgress.target) * 100, 100)}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Quick Start */}
        <Button
          title={todayWorkout ? 'Continue Workout' : 'Start New Workout'}
          onPress={() => navigation.navigate('WorkoutLogger', { workoutId: todayWorkout?.id })}
          size="lg"
          icon={<Ionicons name="add" size={20} color={COLORS.text} />}
          style={styles.quickStartButton}
        />

        {/* AI Tip */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={18} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>AI Tip of the Day</Text>
          </View>
          <Card style={styles.tipCard}>
            {tipLoading ? (
              <Skeleton width="100%" height={60} />
            ) : (
              <>
                <Text style={styles.tipText}>{tip}</Text>
                <TouchableOpacity onPress={refreshTip} style={styles.refreshTip}>
                  <Text style={styles.refreshTipText}>Get new tip</Text>
                  <Ionicons name="refresh" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            )}
          </Card>
        </View>

        {/* Today's Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          {todayWorkout ? (
            <Card>
              <View style={styles.workoutSummary}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{todayWorkout.exercises.length}</Text>
                    <Text style={styles.summaryLabel}>Exercises</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {todayWorkout.exercises.reduce((sum, e) => sum + e.sets.length, 0)}
                    </Text>
                    <Text style={styles.summaryLabel}>Sets</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {calculateWorkoutVolume(todayWorkout).toLocaleString()}
                    </Text>
                    <Text style={styles.summaryLabel}>Volume</Text>
                  </View>
                </View>
              </View>
            </Card>
          ) : (
            <Card style={styles.emptyToday}>
              <Text style={styles.emptyTodayText}>No workout logged today</Text>
              <Text style={styles.emptyTodaySubtext}>Tap above to get started!</Text>
            </Card>
          )}
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : recentWorkouts.length > 0 ? (
            recentWorkouts.map(workout => (
              <TouchableOpacity key={workout.id} onPress={() => navigation.navigate('WorkoutLogger', { workoutId: workout.id })}>
                <Card style={styles.workoutCard}>
                  <View style={styles.workoutHeader}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                  </View>
                  <View style={styles.workoutStats}>
                    <View style={styles.workoutStat}>
                      <Ionicons name="barbell" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.workoutStatText}>{workout.exercises.length} exercises</Text>
                    </View>
                    <View style={styles.workoutStat}>
                      <Ionicons name="time" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.workoutStatText}>{workout.duration} min</Text>
                    </View>
                    <View style={styles.workoutStat}>
                      <Ionicons name="trending-up" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.workoutStatText}>
                        {calculateWorkoutVolume(workout).toLocaleString()} lbs
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState
              icon="fitness"
              title="No workouts yet"
              subtitle="Start your fitness journey by logging your first workout"
              actionTitle="Start Workout"
              onAction={() => navigation.navigate('WorkoutLogger', { workoutId: undefined })}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  logoutButton: {
    padding: 8,
  },
  streakCard: {
    marginBottom: 16,
    backgroundColor: COLORS.surface,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  streakLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  weeklyProgress: {
    alignItems: 'flex-end',
  },
  weeklyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  progressBar: {
    width: 100,
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  quickStartButton: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  tipCard: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  tipText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  refreshTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  refreshTipText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  workoutSummary: {
    paddingVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  emptyToday: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTodayText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyTodaySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  workoutCard: {
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  workoutDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 16,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
