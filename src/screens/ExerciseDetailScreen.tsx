import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@constants';
import { useExerciseLibrary } from '@hooks';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Skeleton } from '@components/Skeleton';
import { RootStackParamList } from '@navigation';

type RouteProps = RouteProp<RootStackParamList, 'ExerciseDetail'>;

export default function ExerciseDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { exerciseId, exerciseName } = route.params;
  const { exercises, getFormTip } = useExerciseLibrary();

  const [formTip, setFormTip] = useState<string | undefined>(undefined);
  const [loadingTip, setLoadingTip] = useState(false);

  const exercise = exercises.find(e => e.id === exerciseId);

  useEffect(() => {
    loadFormTip();
  }, [exerciseId]);

  const loadFormTip = async () => {
    if (exercise?.formTip) {
      setFormTip(exercise.formTip);
      return;
    }

    setLoadingTip(true);
    const tip = await getFormTip(exerciseId);
    setFormTip(tip);
    setLoadingTip(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{exerciseName}</Text>
            {exercise && (
              <View style={styles.tagContainer}>
                <View style={[styles.tag, styles.muscleTag]}>
                  <Text style={styles.tagText}>{exercise.muscleGroup}</Text>
                </View>
                <View style={[styles.tag, styles.categoryTag]}>
                  <Text style={styles.tagText}>{exercise.category}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* AI Form Tip */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={18} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>AI Form Guidance</Text>
          </View>
          <Card style={styles.tipCard}>
            {loadingTip ? (
              <Skeleton width="100%" height={100} />
            ) : formTip ? (
              <Text style={styles.tipText}>{formTip}</Text>
            ) : (
              <View style={styles.emptyTip}>
                <Text style={styles.emptyTipText}>No form tip available</Text>
                <Button
                  title="Generate AI Tip"
                  onPress={loadFormTip}
                  variant="outline"
                  size="sm"
                  style={styles.generateButton}
                />
              </View>
            )}
          </Card>
        </View>

        {/* Quick Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Button
            title="Log This Exercise"
            onPress={() => {
              // Navigate to workout logger with this exercise pre-selected
              // This would require state management or navigation params
              navigation.goBack();
            }}
            icon={<Ionicons name="add" size={18} color={COLORS.text} />}
          />
        </View>

        {/* Exercise Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Card>
            <View style={styles.infoRow}>
              <Ionicons name="body" size={20} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Primary Muscles</Text>
                <Text style={styles.infoValue}>{exercise?.muscleGroup || 'General'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="layers" size={20} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{exercise?.category || 'General'}</Text>
              </View>
            </View>
          </Card>
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
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  muscleTag: {
    backgroundColor: 'rgba(79, 142, 247, 0.15)',
  },
  categoryTag: {
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
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
    marginBottom: 12,
  },
  tipCard: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  tipText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
  },
  emptyTip: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  generateButton: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
