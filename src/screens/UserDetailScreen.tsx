import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  VictoryChart,
  VictoryLine,
  VictoryBar,
  VictoryAxis,
  VictoryTheme,
  VictoryScatter,
} from 'victory-native';

import { COLORS } from '../constants';
import { useAdmin, useAuth } from '../hooks';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import { Workout, PersonalRecord, WeeklyVolume } from '../types';
import { calculateWorkoutVolume, getPersonalRecords, getWeeklyVolume } from '../utils';

const { width } = Dimensions.get('window');

const CHART_THEME = {
  axis: {
    style: {
      axis: { stroke: COLORS.border },
      tickLabels: { fill: COLORS.textSecondary, fontSize: 12, padding: 8 },
      grid: { stroke: COLORS.border, strokeDasharray: '4, 4' },
    },
  },
};

interface UserDetailScreenProps {
  userId: string;
  onBack: () => void;
}

export default function UserDetailScreen({ userId, onBack }: UserDetailScreenProps) {
  const { users, loginEvents, getUserWorkouts } = useAdmin();
  const { logout } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'logs'>('overview');

  const user = users.find(u => u.id === userId);
  const userLogs = loginEvents.filter(e => e.userId === userId);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    const userWorkouts = await getUserWorkouts(userId);
    setWorkouts(userWorkouts);
    setLoading(false);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>User not found</Text>
          <TouchableOpacity onPress={onBack} style={styles.errorBackButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalVolume = workouts.reduce((sum: number, w: Workout) => sum + calculateWorkoutVolume(w), 0);
  const personalRecords = getPersonalRecords(workouts);
  const weeklyVolume = getWeeklyVolume(workouts);

  const weeklyChartData = weeklyVolume.map((w: WeeklyVolume) => ({
    x: w.week,
    y: w.totalVolume,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={[styles.profileStatus, 
                user.status === 'active' ? styles.statusActive : 
                user.status === 'suspended' ? styles.statusSuspended : styles.statusInactive
              ]}>
                <Text style={styles.profileStatusText}>{user.status}</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Goal</Text>
              <Text style={styles.detailValue}>{user.goal}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weekly Target</Text>
              <Text style={styles.detailValue}>{user.weeklyTarget} days</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Joined</Text>
              <Text style={styles.detailValue}>{new Date(user.joinDate).toLocaleDateString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Login</Text>
              <Text style={styles.detailValue}>
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Performance Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{workouts.length}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{(totalVolume / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{personalRecords.length}</Text>
            <Text style={styles.statLabel}>PRs</Text>
          </Card>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {(['overview', 'workouts', 'logs'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {weeklyChartData.length > 0 && (
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>Weekly Volume</Text>
                <VictoryChart
                  width={width - 64}
                  height={220}
                  theme={CHART_THEME as any}
                  domainPadding={{ x: 20 }}
                >
                  <VictoryAxis
                    style={{
                      axis: { stroke: COLORS.border },
                      tickLabels: { fill: COLORS.textSecondary, fontSize: 10, angle: -45 },
                      grid: { stroke: 'transparent' },
                    }}
                  />
                  <VictoryAxis
                    dependentAxis
                    style={{
                      axis: { stroke: COLORS.border },
                      tickLabels: { fill: COLORS.textSecondary, fontSize: 11 },
                      grid: { stroke: COLORS.border, strokeDasharray: '4, 4' },
                    }}
                  />
                  <VictoryBar
                    data={weeklyChartData}
                    style={{ data: { fill: COLORS.admin, width: 18 } }}
                  />
                </VictoryChart>
              </Card>
            )}

            {/* Recent PRs */}
            {personalRecords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Records</Text>
                {personalRecords.slice(0, 5).map((pr: PersonalRecord, index: number) => (
                  <Card key={index} style={styles.prCard}>
                    <View style={styles.prRow}>
                      <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                      <Text style={styles.prValue}>{pr.weight} lbs × {pr.reps}</Text>
                    </View>
                    <Text style={styles.prDate}>{new Date(pr.date).toLocaleDateString()}</Text>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}

        {/* Workouts Tab */}
        {activeTab === 'workouts' && (
          <View style={styles.section}>
            {workouts.length > 0 ? (
              workouts.map(workout => (
                <Card key={workout.id} style={styles.workoutCard}>
                  <View style={styles.workoutHeader}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <Text style={styles.workoutDate}>{new Date(workout.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.workoutStats}>
                    <Text style={styles.workoutStat}>
                      {workout.exercises.length} exercises
                    </Text>
                    <Text style={styles.workoutStat}>
                      {workout.exercises.reduce((sum: number, e: any) => sum + e.sets.length, 0)} sets
                    </Text>
                    <Text style={styles.workoutStat}>
                      {calculateWorkoutVolume(workout).toLocaleString()} lbs
                    </Text>
                  </View>
                  {workout.exercises.map((exercise, idx) => (
                    <View key={idx} style={styles.exerciseRow}>
                      <Text style={styles.exerciseName}>• {exercise.name}</Text>
                      <Text style={styles.exerciseSets}>{exercise.sets.length} sets</Text>
                    </View>
                  ))}
                </Card>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="barbell" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No workouts logged</Text>
              </View>
            )}
          </View>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <View style={styles.section}>
            {userLogs.length > 0 ? (
              userLogs.map(log => (
                <Card key={log.id} style={styles.logCard}>
                  <View style={styles.logRow}>
                    <Ionicons 
                      name={
                        log.type === 'login' ? 'log-in' : 
                        log.type === 'signup' ? 'person-add' : 
                        log.type === 'logout' ? 'log-out' : 'alert-circle'
                      } 
                      size={18} 
                      color={
                        log.type === 'login' ? COLORS.success : 
                        log.type === 'signup' ? COLORS.primary : 
                        log.type === 'logout' ? COLORS.textSecondary : COLORS.error
                      } 
                    />
                    <View style={styles.logInfo}>
                      <Text style={styles.logType}>{log.type}</Text>
                      <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleString()}</Text>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="list" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No login events</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.admin,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileStatus: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  statusActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  statusSuspended: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
  },
  statusInactive: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  profileStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  profileDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.admin,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.admin,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  chartCard: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  prCard: {
    marginBottom: 8,
    padding: 12,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prExercise: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  prValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.admin,
  },
  prDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  workoutCard: {
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  workoutDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  workoutStat: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  exerciseName: {
    fontSize: 13,
    color: COLORS.text,
  },
  exerciseSets: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  logCard: {
    marginBottom: 8,
    padding: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logInfo: {
    flex: 1,
  },
  logType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  logTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorBackButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
