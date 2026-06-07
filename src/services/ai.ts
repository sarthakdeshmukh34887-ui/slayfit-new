import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import { AI_PROMPTS } from '../constants';
import { Workout, Exercise, UserProfile, ChatMessage, Set } from '../types';
import { storageService } from './storage';

const getApiKey = () => {
  if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
    console.log('✅ SlayFit: API Key loaded from process.env (length: ' + process.env.EXPO_PUBLIC_GEMINI_API_KEY.length + ')');
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  }
  if (Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY) {
    console.log('✅ SlayFit: API Key loaded from app.json extra (length: ' + Constants.expoConfig.extra.EXPO_PUBLIC_GEMINI_API_KEY.length + ')');
    return Constants.expoConfig.extra.EXPO_PUBLIC_GEMINI_API_KEY;
  }
  console.warn('❌ SlayFit: No API Key found in process.env or app.json!');
  return '';
};

const GEMINI_API_KEY = getApiKey();

class AIService {
  private client: GoogleGenerativeAI;
  private readonly MODEL_NAME = 'gemini-flash-latest';

  constructor() {
    this.client = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  private async getWorkoutContext(): Promise<string> {
    const workouts = await storageService.getWorkouts();
    const profile = await storageService.getUserProfile();

    const last30Days = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return workoutDate >= thirtyDaysAgo;
    });

    const context = {
      profile: profile || { goal: 'general_fitness', weeklyTarget: 3 },
      recentWorkouts: last30Days.slice(0, 20).map(w => ({
        date: w.date,
        name: w.name,
        exercises: w.exercises.map((e: Exercise) => ({
          name: e.name,
          sets: e.sets.length,
          totalVolume: e.sets.reduce((sum: number, s: Set) => sum + (s.weight * s.reps), 0),
        })),
      })),
      totalWorkouts: workouts.length,
    };

    return JSON.stringify(context, null, 2);
  }

  private async callApi(prompt: string, systemInstruction?: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
    
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      ...(systemInstruction && { system_instruction: { parts: [{ text: systemInstruction }] } }),
    };

    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    try {
      const listRes = await fetch(listUrl);
      const listData = await listRes.json();
      console.log('📜 Available Models: ' + (listData.models?.map((m: any) => m.name).join(', ') || 'NONE FOUND'));
    } catch (e) {
      console.log('📜 Could not list models');
    }

    console.log('📡 [Step 1] Preparing fetch...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      console.log('📡 [Step 2] Sending request...');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📡 [Step 3] Response received: ' + response.status);
      
      const responseText = await response.text();
      console.log('📡 [Step 4] Raw Response: ' + responseText.substring(0, 100) + '...');
      
      const data = JSON.parse(responseText);
      console.log('📡 [Step 5] JSON parsed successfully');

      if (data?.error) throw new Error(data.error.message || 'API Error');
      
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.error('❌ [Step ERROR] Request timed out after 60 seconds');
        throw new Error('Connection timed out. Check your internet.');
      }
      console.error('❌ [Step ERROR] Fetch failed: ' + err.message);
      throw err;
    }
  }

  async generateDailyTip(): Promise<string> {
    const context = await this.getWorkoutContext();
    try {
      const prompt = `${AI_PROMPTS.DAILY_TIP}\n\nUser Context:\n${context}`;
      console.log('📡 FitAI: Fetching Daily Tip...');
      const tip = await this.callApi(prompt);
      
      if (tip) {
        console.log('✨ FitAI Tip Received!');
        await storageService.saveAITip(tip);
        return tip;
      }
      return 'Keep pushing! Consistency is key.';
    } catch (err: any) {
      if (err?.message?.includes('API key') || err?.message?.includes('quota')) {
        return `API Error: ${err.message.split('\n')[0]}`;
      }
      return 'Focus on progressive overload. Try to add weight or reps each session.';
    }
  }

  async *streamChatResponse(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    const context = await this.getWorkoutContext();

    try {
      console.log('📡 FitAI: Fetching Chat Response...');
      const systemInstruction = `You are FitAI, an expert fitness coach and workout analyst. Use this context: ${context}`;
      const lastMessage = messages[messages.length - 1].content;
      
      // We'll use the prompt to include previous history for now
      const historyText = messages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n');
      const prompt = `History:\n${historyText}\n\nUser: ${lastMessage}`;

      const response = await this.callApi(prompt, systemInstruction);
      
      if (response) {
        console.log('✨ FitAI Chat Response Received!');
        yield response;
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      yield 'Sorry, I am having trouble connecting right now: ' + (err?.message || 'Unknown error');
    }
  }

  async generateWorkoutPlan(goal: string, daysPerWeek: number, equipment: string[]): Promise<string> {
    try {
      const prompt = `${AI_PROMPTS.WORKOUT_PLAN}\nGoal: ${goal}\nDays: ${daysPerWeek}\nEquipment: ${equipment.join(', ')}`;
      return await this.callApi(prompt);
    } catch (error) {
      throw new Error('Failed to generate workout plan');
    }
  }

  async analyzeProgress(): Promise<string> {
    const context = await this.getWorkoutContext();
    try {
      const prompt = `${AI_PROMPTS.ANALYZE_PROGRESS}\n\nHistory:\n${context}`;
      return await this.callApi(prompt) || 'Unable to analyze progress at this time.';
    } catch (error) {
      return 'Unable to analyze progress. Make sure you have logged some workouts first!';
    }
  }

  async getFormTip(exerciseName: string): Promise<string> {
    try {
      const prompt = `${AI_PROMPTS.FORM_GUIDANCE}\nExercise: ${exerciseName}`;
      return await this.callApi(prompt) || 'Maintain proper form throughout the movement.';
    } catch (error) {
      return 'Focus on controlled movement and full range of motion.';
    }
  }

  async suggestWorkout(): Promise<string> {
    const context = await this.getWorkoutContext();
    try {
      const prompt = `${AI_PROMPTS.WHAT_TO_TRAIN}\n\nUser Context:\n${context}`;
      return await this.callApi(prompt) || 'Consider a full body workout today.';
    } catch (error) {
      return 'A balanced full-body session would be great today!';
    }
  }
}

export const aiService = new AIService();