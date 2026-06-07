import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@constants';
import { Button } from '@components/Button';
import { useAuth } from '@hooks';

interface SignupScreenProps {
  onNavigateToLogin: () => void;
  googleData?: { name: string; email: string } | null;
}

const GOALS = [
  { id: 'strength', label: 'Strength' },
  { id: 'hypertrophy', label: 'Muscle Growth' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'weight_loss', label: 'Weight Loss' },
  { id: 'general_fitness', label: 'General Fitness' },
];

export default function SignupScreen({ onNavigateToLogin, googleData }: SignupScreenProps) {
  const [name, setName] = useState(googleData?.name || '');
  const [email, setEmail] = useState(googleData?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [goal, setGoal] = useState('general_fitness');
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [step, setStep] = useState(googleData ? 2 : 1);


  const { signup, loading, authError } = useAuth();

  // Update if googleData changes (rare but good for consistency)
  React.useEffect(() => {
    if (googleData) {
      setName(googleData.name);
      setEmail(googleData.email);
    }
  }, [googleData]);

  const handleNext = () => {
    if (step === 1) {
      if (googleData) {
        // Skip password fields for Google sign‑up
        setStep(2);
        return;
      }
      if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }
      setStep(2);
    } else {
      handleSignup();
    }
  };

  const handleSignup = async () => {
    await signup({
      name: name.trim(),
      email: email.trim(),
      password,
      goal: goal as any,
      weeklyTarget,
    });
  };

  const renderStep1 = () => (
    <>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="flash" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your fitness journey</Text>
      </View>

      <View style={styles.form}>
        {authError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={COLORS.error} />
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="person" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full Name"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="mail" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

{!googleData && (
        <>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>
        </>
      )}
      <Button
        title="Continue"
        onPress={handleNext}
        size="lg"
        style={styles.continueButton}
      />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Your Goals</Text>
        <Text style={styles.subtitle}>Help us personalize your experience</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionLabel}>What's your primary goal?</Text>
        <View style={styles.goalsGrid}>
          {GOALS.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[styles.goalCard, goal === g.id && styles.goalCardActive]}
              onPress={() => setGoal(g.id)}
            >
              <Text style={[styles.goalText, goal === g.id && styles.goalTextActive]}>
                {g.label}
              </Text>
              {goal === g.id && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Training days per week</Text>
        <View style={styles.daysRow}>
          {[2, 3, 4, 5, 6].map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, weeklyTarget === day && styles.dayButtonActive]}
              onPress={() => setWeeklyTarget(day)}
            >
              <Text style={[styles.dayText, weeklyTarget === day && styles.dayTextActive]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.stepButtons}>
          <Button
            title="Back"
            onPress={() => setStep(1)}
            variant="secondary"
            size="md"
            style={styles.backButton}
          />
          <Button
            title={loading ? 'Creating...' : 'Create Account'}
            onPress={handleNext}
            loading={loading}
            size="md"
            style={styles.createButton}
          />
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          </View>

          {step === 1 ? renderStep1() : renderStep2()}

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(79, 142, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  form: {
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  continueButton: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  goalsGrid: {
    gap: 10,
    marginBottom: 20,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goalCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(79, 142, 247, 0.1)',
  },
  goalText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  goalTextActive: {
    color: COLORS.text,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
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
  stepButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  createButton: {
    flex: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
