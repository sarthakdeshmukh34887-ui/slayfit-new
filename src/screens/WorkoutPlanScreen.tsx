import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@constants';
import { useUserProfile } from '@hooks';
import { aiService } from '@services/ai';
import { storageService } from '@services/storage';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { WorkoutPlan } from '@types';
import { generateId } from '@utils';

type GoalType = 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_fitness';

const GOALS: { id: GoalType; label: string; icon: any }[] = [
  { id: 'strength', label: 'Strength', icon: 'barbell' },
  { id: 'hypertrophy', label: 'Muscle Growth', icon: 'body' },
  { id: 'endurance', label: 'Endurance', icon: 'pulse' },
  { id: 'weight_loss', label: 'Weight Loss', icon: 'trending-down' },
  { id: 'general_fitness', label: 'General Fitness', icon: 'fitness' },
];

const EQUIPMENT = [
  'Barbell', 'Dumbbell', 'Kettlebell', 'Cable Machine', 'Smith Machine',
  'Leg Press', 'Treadmill', 'Stationary Bike', 'Pull-up Bar', 'Bench',
  'Resistance Bands', 'Medicine Ball', 'Foam Roller',
];

const DAYS_OPTIONS = [2, 3, 4, 5, 6];

export default function WorkoutPlanScreen() {
  const { profile } = useUserProfile();
  const [goal, setGoal] = useState<GoalType>((profile?.goal as GoalType) || 'general_fitness');
  const [daysPerWeek, setDaysPerWeek] = useState(profile?.weeklyTarget || 3);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(profile?.equipment || ['Barbell', 'Dumbbell']);
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);

  const toggleEquipment = (item: string) => {
    if (selectedEquipment.includes(item)) {
      setSelectedEquipment(selectedEquipment.filter(e => e !== item));
    } else {
      setSelectedEquipment([...selectedEquipment, item]);
    }
  };

  const generatePlan = async () => {
    if (selectedEquipment.length === 0) {
      Alert.alert('Select Equipment', 'Please select at least one piece of equipment.');
      return;
    }

    setLoading(true);
    try {
      const response = await aiService.generateWorkoutPlan(goal, daysPerWeek, selectedEquipment);

      // Parse the JSON response from Claude
      const planData = JSON.parse(response);
      const plan: WorkoutPlan = {
        id: generateId(),
        name: planData.name || 'AI Generated Plan',
        weeks: planData.weeks || [],
        createdAt: new Date().toISOString(),
      };

      setGeneratedPlan(plan);

      // Save to storage
      const existingPlans = await storageService.getWorkoutPlans();
      await storageService.saveWorkoutPlans([plan, ...existingPlans]);
    } catch (error) {
      console.error('Error generating plan:', error);
      Alert.alert('Error', 'Failed to generate workout plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>AI Workout Plan Generator</Text>
        <Text style={styles.subtitle}>
          Let SlayFit create a personalized 4-week plan based on your goals
        </Text>

        {/* Goal Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's your goal?</Text>
          <View style={styles.goalsGrid}>
            {GOALS.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[styles.goalCard, goal === g.id && styles.goalCardActive]}
                onPress={() => setGoal(g.id)}
              >
                <Ionicons
                  name={g.icon}
                  size={24}
                  color={goal === g.id ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={[styles.goalText, goal === g.id && styles.goalTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Days Per Week */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Days per week</Text>
          <View style={styles.daysRow}>
            {DAYS_OPTIONS.map(day => (
              <TouchableOpacity
                key={day}
                style={[styles.dayButton, daysPerWeek === day && styles.dayButtonActive]}
                onPress={() => setDaysPerWeek(day)}
              >
                <Text style={[styles.dayText, daysPerWeek === day && styles.dayTextActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Equipment</Text>
          <View style={styles.equipmentGrid}>
            {EQUIPMENT.map(item => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.equipmentChip,
                  selectedEquipment.includes(item) && styles.equipmentChipActive,
                ]}
                onPress={() => toggleEquipment(item)}
              >
                <Text
                  style={[
                    styles.equipmentText,
                    selectedEquipment.includes(item) && styles.equipmentTextActive,
                  ]}
                >
                  {item}
                </Text>
                {selectedEquipment.includes(item) && (
                  <Ionicons name="checkmark" size={14} color={COLORS.text} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <Button
          title={loading ? 'Generating Plan...' : 'Generate Workout Plan'}
          onPress={generatePlan}
          loading={loading}
          size="lg"
          style={styles.generateButton}
        />

        {/* Generated Plan */}
        {generatedPlan && (
          <View style={styles.planSection}>
            <View style={styles.planHeader}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.planTitle}>{generatedPlan.name}</Text>
            </View>

            {generatedPlan.weeks.map((week, weekIndex) => (
              <Card key={weekIndex} style={styles.weekCard}>
                <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
                {week.days.map((day, dayIndex) => (
                  <View key={dayIndex} style={styles.dayPlan}>
                    <Text style={styles.dayName}>{day.day}</Text>
                    {day.exercises.map((exercise, exIndex) => (
                      <View key={exIndex} style={styles.exercisePlan}>
                        <Text style={styles.exercisePlanName}>• {exercise.name}</Text>
                        <Text style={styles.exercisePlanDetail}>
                          {exercise.sets} sets × {exercise.reps} | Rest: {exercise.rest}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goalCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(79, 142, 247, 0.1)',
  },
  goalText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  goalTextActive: {
    color: COLORS.primary,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dayButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(79, 142, 247, 0.1)',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dayTextActive: {
    color: COLORS.primary,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  equipmentChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  equipmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  equipmentTextActive: {
    color: COLORS.text,
  },
  checkIcon: {
    marginLeft: 4,
  },
  generateButton: {
    marginBottom: 24,
  },
  planSection: {
    marginTop: 8,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
  weekCard: {
    marginBottom: 12,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
  },
  dayPlan: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  exercisePlan: {
    marginLeft: 8,
    marginBottom: 4,
  },
  exercisePlanName: {
    fontSize: 14,
    color: COLORS.text,
  },
  exercisePlanDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 10,
    marginTop: 2,
  },
});
