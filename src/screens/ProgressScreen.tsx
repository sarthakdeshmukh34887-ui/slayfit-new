import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  VictoryChart,
  VictoryLine,
  VictoryBar,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryScatter,
} from 'victory-native';

import { COLORS } from '../constants';
import { useWorkouts } from '../hooks';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  getPersonalRecords,
  getWeeklyVolume,
  getVolumeByExercise,
  calculateWorkoutVolume,
} from '../utils';
import { Workout, Exercise, WeeklyVolume, PersonalRecord } from '../types';

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

export default function ProgressScreen() {
  const { workouts, loading } = useWorkouts();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'volume' | 'prs' | 'weekly'>('volume');

  const personalRecords = useMemo(() => getPersonalRecords(workouts), [workouts]);
  const weeklyVolume = useMemo(() => getWeeklyVolume(workouts), [workouts]);

  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    workouts.forEach((w: Workout) => w.exercises.forEach((e: Exercise) => names.add(e.name)));
    return Array.from(names);
  }, [workouts]);

  const exerciseVolumeData = useMemo(() => {
    if (!selectedExercise) return [];
    return getVolumeByExercise(workouts, selectedExercise).map((d: { date: string; volume: number }) => ({
      x: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      y: d.volume,
    }));
  }, [workouts, selectedExercise]);

  const weeklyChartData = useMemo(() => {
    return weeklyVolume.map((w: WeeklyVolume) => ({
      x: w.week,
      y: w.totalVolume,
    }));
  }, [weeklyVolume]);

  const totalVolume = workouts.reduce((sum: number, w: Workout) => sum + calculateWorkoutVolume(w), 0);
  const avgVolume = workouts.length > 0 ? Math.round(totalVolume / workouts.length) : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Skeleton width="60%" height={28} style={styles.marginBottom} />
          <Skeleton width="100%" height={250} style={styles.marginBottom} />
          <Skeleton width="100%" height={200} style={styles.marginBottom} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (workouts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="trending-up"
          title="No progress data yet"
          subtitle="Log your first workout to see your progress charts and personal records"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{workouts.length}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{(totalVolume / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{personalRecords.length}</Text>
            <Text style={styles.statLabel}>Personal Records</Text>
          </Card>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {(['volume', 'weekly', 'prs'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'volume' ? 'Exercise Volume' : tab === 'weekly' ? 'Weekly Volume' : 'PRs'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Volume Chart */}
        {activeTab === 'volume' && (
          <View>
            {/* Exercise Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.exerciseSelector}
              contentContainerStyle={styles.exerciseSelectorContent}
            >
              {exerciseNames.map(name => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.exerciseChip,
                    selectedExercise === name && styles.exerciseChipActive,
                  ]}
                  onPress={() => setSelectedExercise(name)}
                >
                  <Text
                    style={[
                      styles.exerciseChipText,
                      selectedExercise === name && styles.exerciseChipTextActive,
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedExercise && exerciseVolumeData.length > 0 ? (
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>{selectedExercise} Volume</Text>
                <VictoryChart
                  width={width - 64}
                  height={250}
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
                  <VictoryLine
                    data={exerciseVolumeData}
                    style={{
                      data: { stroke: COLORS.primary, strokeWidth: 3 },
                    }}
                    animate={{
                      duration: 500,
                      onLoad: { duration: 500 },
                    }}
                  />
                  <VictoryScatter
                    data={exerciseVolumeData}
                    size={5}
                    style={{
                      data: { fill: COLORS.accent },
                    }}
                  />
                </VictoryChart>
              </Card>
            ) : (
              <Card style={styles.selectPrompt}>
                <Text style={styles.selectPromptText}>
                  Select an exercise above to view volume trends
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Weekly Volume Chart */}
        {activeTab === 'weekly' && (
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Weekly Volume</Text>
            {weeklyChartData.length > 0 ? (
              <VictoryChart
                width={width - 64}
                height={250}
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
                  style={{
                    data: { fill: COLORS.primary, width: 20 },
                  }}
                  animate={{
                    duration: 500,
                    onLoad: { duration: 500 },
                  }}
                />
              </VictoryChart>
            ) : (
              <Text style={styles.noDataText}>Not enough data for weekly chart</Text>
            )}
          </Card>
        )}

        {/* Personal Records */}
        {activeTab === 'prs' && (
          <View>
            <Text style={styles.sectionTitle}>Personal Records</Text>
            {personalRecords.slice(0, 10).map((pr: PersonalRecord, index: number) => (
              <Card key={`${pr.exerciseName}-${pr.reps}`} style={styles.prCard}>
                <View style={styles.prContent}>
                  <View style={styles.prRank}>
                    <Text style={styles.prRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.prInfo}>
                    <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                    <Text style={styles.prDetail}>
                      {pr.weight} lbs × {pr.reps} reps
                    </Text>
                    <Text style={styles.prDate}>
                      {new Date(pr.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.prBadge}>
                    <Ionicons name="trophy" size={20} color={COLORS.warning} />
                  </View>
                </View>
              </Card>
            ))}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  marginBottom: {
    marginBottom: 16,
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
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
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
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.text,
  },
  exerciseSelector: {
    marginBottom: 16,
  },
  exerciseSelectorContent: {
    paddingRight: 16,
    gap: 8,
  },
  exerciseChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  exerciseChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  exerciseChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  exerciseChipTextActive: {
    color: COLORS.text,
  },
  chartCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  selectPrompt: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  selectPromptText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    paddingVertical: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  prCard: {
    marginBottom: 10,
  },
  prContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(79, 142, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  prRankText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  prDetail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  prDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  prBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
