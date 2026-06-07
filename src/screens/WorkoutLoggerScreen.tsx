import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@constants';
import { useWorkouts, useExerciseLibrary, useRestTimer } from '@hooks';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { Exercise, Set as WorkoutSet, Workout } from '@types';
import { generateId, formatTime } from '@utils';
import { RootStackParamList } from '@navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'WorkoutLogger'>;

interface ExerciseRowProps {
  exercise: Exercise;
  onUpdate: (exercise: Exercise) => void;
  onDelete: () => void;
}

const ExerciseRow: React.FC<ExerciseRowProps> = ({ exercise, onUpdate, onDelete }) => {
  const [showNotes, setShowNotes] = useState(false);
  const { seconds, isRunning, start, pause, reset } = useRestTimer(exercise.restTimerSeconds || 90);

  const addSet = () => {
    const newSet: WorkoutSet = {
      id: generateId(),
      weight: exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1].weight : 0,
      reps: exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1].reps : 0,
      completed: false,
    };
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet] });
  };

  const updateSet = (setId: string, field: 'weight' | 'reps', value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedSets = exercise.sets.map(s =>
      s.id === setId ? { ...s, [field]: numValue } : s
    );
    onUpdate({ ...exercise, sets: updatedSets });
  };

  const toggleSetComplete = (setId: string) => {
    const updatedSets = exercise.sets.map(s =>
      s.id === setId ? { ...s, completed: !s.completed } : s
    );
    onUpdate({ ...exercise, sets: updatedSets });

    const set = updatedSets.find(s => s.id === setId);
    if (set?.completed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset(exercise.restTimerSeconds || 90);
      start();
    }
  };

  const deleteSet = (setId: string) => {
    const updatedSets = exercise.sets.filter(s => s.id !== setId);
    onUpdate({ ...exercise, sets: updatedSets });
  };

  return (
    <Card style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.exerciseActions}>
          <TouchableOpacity onPress={() => setShowNotes(!showNotes)}>
            <Ionicons name="create" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete}>
            <Ionicons name="trash" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Rest Timer */}
      {isRunning && (
        <View style={styles.timerContainer}>
          <Ionicons name="timer" size={16} color={COLORS.accent} />
          <Text style={styles.timerText}>{formatTime(seconds)}</Text>
          <TouchableOpacity onPress={pause}>
            <Text style={styles.timerAction}>Pause</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => reset(exercise.restTimerSeconds || 90)}>
            <Text style={styles.timerAction}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sets Header */}
      <View style={styles.setsHeader}>
        <Text style={styles.setHeaderText}>Set</Text>
        <Text style={styles.setHeaderText}>Weight</Text>
        <Text style={styles.setHeaderText}>Reps</Text>
        <Text style={styles.setHeaderText}></Text>
      </View>

      {/* Sets */}
      {exercise.sets.map((set, index) => (
        <View key={set.id} style={styles.setRow}>
          <Text style={styles.setNumber}>{index + 1}</Text>
          <TextInput
            style={styles.setInput}
            value={set.weight.toString()}
            onChangeText={(text) => updateSet(set.id, 'weight', text)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={COLORS.textMuted}
          />
          <TextInput
            style={styles.setInput}
            value={set.reps.toString()}
            onChangeText={(text) => updateSet(set.id, 'reps', text)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity
            onPress={() => toggleSetComplete(set.id)}
            style={[styles.checkButton, set.completed && styles.checkButtonActive]}
          >
            <Ionicons
              name={set.completed ? 'checkmark' : 'ellipse-outline'}
              size={20}
              color={set.completed ? COLORS.success : COLORS.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteSet(set.id)} style={styles.deleteSetButton}>
            <Ionicons name="close" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      ))}

      <Button
        title="Add Set"
        onPress={addSet}
        variant="secondary"
        size="sm"
        style={styles.addSetButton}
      />

      {/* Notes */}
      {showNotes && (
        <TextInput
          style={styles.notesInput}
          value={exercise.notes || ''}
          onChangeText={(text) => onUpdate({ ...exercise, notes: text })}
          placeholder="Add notes..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
        />
      )}
    </Card>
  );
};

export default function WorkoutLoggerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { addWorkout, updateWorkout, workouts } = useWorkouts();
  const { searchExercises, exercises: libraryExercises } = useExerciseLibrary();

  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(false);

  const existingWorkoutId = route.params?.workoutId;

  useEffect(() => {
    if (existingWorkoutId) {
      const existing = workouts.find(w => w.id === existingWorkoutId);
      if (existing) {
        setWorkoutName(existing.name);
        setExercises(existing.exercises);
        setStartTime(new Date(existing.date));
        setIsActive(true);
      }
    }
  }, [existingWorkoutId, workouts]);

  const muscleGroups = useMemo(() => {
    if (!libraryExercises || libraryExercises.length === 0) return [];
    const groups = libraryExercises.map(e => e.muscleGroup);
    return Array.from(new Set(groups)).sort();
  }, [libraryExercises]);

  const filteredExercises = selectedMuscle ? searchExercises(searchQuery, selectedMuscle) : [];

  const addExercise = (name: string, muscleGroup: string = 'General') => {
    const newExercise: Exercise = {
      id: generateId(),
      name,
      muscleGroup,
      sets: [],
      restTimerSeconds: 90,
    };
    setExercises([...exercises, newExercise]);
    setSearchQuery('');
    setShowSearch(false);
    setSelectedMuscle(null);

    if (!isActive) {
      setIsActive(true);
      setStartTime(new Date());
    }
  };

  const updateExercise = (updated: Exercise) => {
    setExercises(exercises.map(e => e.id === updated.id ? updated : e));
  };

  const deleteExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const saveWorkout = async () => {
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Add at least one exercise before saving.');
      return;
    }

    const duration = startTime 
      ? Math.round((new Date().getTime() - startTime.getTime()) / 60000) 
      : 0;

    const workoutData: Omit<Workout, 'id'> = {
      date: startTime?.toISOString() || new Date().toISOString(),
      name: workoutName || `Workout ${new Date().toLocaleDateString()}`,
      exercises,
      duration: Math.max(duration, 1),
      completed: true,
    };

    try {
      if (existingWorkoutId) {
        await updateWorkout({ ...workoutData, id: existingWorkoutId });
      } else {
        await addWorkout(workoutData);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  const discardWorkout = () => {
    Alert.alert(
      'Discard Workout?',
      'This will delete all your progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={discardWorkout}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <TextInput
            style={styles.workoutNameInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="Workout Name"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity onPress={saveWorkout}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Add Exercise Section */}
          <View style={styles.addSection}>
            {showSearch ? (
              <View>
                {selectedMuscle ? (
                  <>
                    <View style={styles.muscleHeader}>
                      <TouchableOpacity onPress={() => setSelectedMuscle(null)} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                      </TouchableOpacity>
                      <Text style={styles.muscleHeaderText}>{selectedMuscle} Exercises</Text>
                    </View>
                    <Input
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search exercises..."
                      autoFocus
                      icon={<Ionicons name="search" size={20} color={COLORS.textSecondary} />}
                    />
                    <ScrollView style={styles.searchResults} keyboardShouldPersistTaps="handled">
                      {filteredExercises.map(exercise => (
                        <TouchableOpacity
                          key={exercise.id}
                          style={styles.searchResult}
                          onPress={() => addExercise(exercise.name, exercise.muscleGroup)}
                        >
                          <View>
                            <Text style={styles.searchResultName}>{exercise.name}</Text>
                            <Text style={styles.searchResultGroup}>{exercise.muscleGroup}</Text>
                          </View>
                          <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                      ))}
                      {searchQuery.length > 0 && filteredExercises.length === 0 && (
                        <TouchableOpacity
                          style={styles.searchResult}
                          onPress={() => addExercise(searchQuery, selectedMuscle)}
                        >
                          <Text style={styles.searchResultName}>Add "{searchQuery}"</Text>
                          <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </>
                ) : (
                  <>
                    <Text style={styles.muscleSelectTitle}>Select Muscle Group</Text>
                    <ScrollView style={styles.searchResults} keyboardShouldPersistTaps="handled">
                      {muscleGroups.map(muscle => (
                        <TouchableOpacity
                          key={muscle}
                          style={styles.searchResult}
                          onPress={() => setSelectedMuscle(muscle)}
                        >
                          <Text style={styles.searchResultName}>{muscle}</Text>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}
                <Button
                  title="Cancel"
                  onPress={() => { setShowSearch(false); setSearchQuery(''); setSelectedMuscle(null); }}
                  variant="ghost"
                  size="sm"
                />
              </View>
            ) : (
              <Button
                title="Add Exercise"
                onPress={() => setShowSearch(true)}
                icon={<Ionicons name="add" size={18} color={COLORS.text} />}
              />
            )}
          </View>

          {/* Exercises */}
          {exercises.map(exercise => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              onUpdate={updateExercise}
              onDelete={() => deleteExercise(exercise.id)}
            />
          ))}

          {exercises.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="barbell" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Add exercises to start your workout</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  workoutNameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 12,
    padding: 8,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  addSection: {
    padding: 16,
  },
  searchResults: {
    maxHeight: 300,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  searchResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  searchResultGroup: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  muscleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  muscleHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  muscleSelectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  exerciseCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    gap: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
    flex: 1,
  },
  timerAction: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  setsHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  setHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  setNumber: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  setInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
    color: COLORS.text,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  checkButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  checkButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 8,
  },
  deleteSetButton: {
    padding: 4,
    marginLeft: 4,
  },
  addSetButton: {
    marginTop: 8,
  },
  notesInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    color: COLORS.text,
    fontSize: 14,
    textAlignVertical: 'top',
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
});
