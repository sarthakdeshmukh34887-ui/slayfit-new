import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@constants';
import { useChat, useUserProfile } from '@hooks';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { ChatMessage } from '@types';
import Markdown from 'react-native-markdown-display';

const PREBUILT_PROMPTS = [
  {
    icon: 'barbell' as const,
    title: 'Build me a workout plan',
    prompt: 'I want a personalized workout plan. My goal is to build muscle and I can train 4 days per week. I have access to a full gym.',
  },
  {
    icon: 'analytics' as const,
    title: 'Analyze my progress',
    prompt: 'Please analyze my workout history and tell me about my progress, strengths, weaknesses, and what I should focus on.',
  },
  {
    icon: 'help-circle' as const,
    title: 'What should I train today?',
    prompt: 'Based on my recent workouts and recovery, what should I focus on training today?',
  },
  {
    icon: 'bulb' as const,
    title: 'Nutrition advice',
    prompt: 'Give me some nutrition advice to support my fitness goals based on my workout history.',
  },
];

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.bubbleContainer, isUser ? styles.userBubble : styles.assistantBubble]}>
      <View style={[styles.bubble, isUser ? styles.userBubbleBg : styles.assistantBubbleBg]}>
        {isUser ? (
          <Text style={[styles.bubbleText, styles.userBubbleText]}>
            {message.content}
          </Text>
        ) : (
          <Markdown style={{
            body: { color: COLORS.text, fontSize: 15, lineHeight: 22 },
            heading1: { color: COLORS.text, marginTop: 8, marginBottom: 8, fontSize: 20 },
            heading2: { color: COLORS.text, marginTop: 8, marginBottom: 8, fontSize: 18 },
            heading3: { color: COLORS.text, marginTop: 8, marginBottom: 8, fontSize: 16 },
            paragraph: { color: COLORS.text, marginTop: 4, marginBottom: 4 },
            list_item: { color: COLORS.text, marginTop: 2, marginBottom: 2 },
            strong: { color: COLORS.text, fontWeight: 'bold' }
          }}>
            {message.content}
          </Markdown>
        )}
      </View>
      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
};

export default function AICoachScreen() {
  const { messages, loading, sendMessage, clearHistory } = useChat();
  const { profile } = useUserProfile();
  const [inputText, setInputText] = useState('');
  const [showPrompts, setShowPrompts] = useState(messages.length === 0);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || loading) return;

    const text = inputText.trim();
    setInputText('');
    setShowPrompts(false);
    await sendMessage(text);
  }, [inputText, loading, sendMessage]);

  const handlePrompt = useCallback(async (prompt: string) => {
    setShowPrompts(false);
    await sendMessage(prompt);
  }, [sendMessage]);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiAvatar}>
            <Ionicons name="flash" size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>SlayFit Coach</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, loading && styles.statusDotLoading]} />
              <Text style={styles.statusText}>
                {loading ? 'Thinking...' : 'Online'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {showPrompts ? (
        <ScrollView style={styles.promptsContainer} contentContainerStyle={styles.promptsContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>AI Fitness Coach</Text>
            <Text style={styles.welcomeSubtitle}>
              Hi {profile?.name || 'there'}! I'm your personal AI coach. I have access to your workout history and can help you with training plans, progress analysis, form tips, and more.
            </Text>
          </View>

          <Text style={styles.promptsTitle}>Quick Actions</Text>
          {PREBUILT_PROMPTS.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptCard}
              onPress={() => handlePrompt(prompt.prompt)}
            >
              <View style={styles.promptIcon}>
                <Ionicons name={prompt.icon} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.promptText}>{prompt.title}</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask your AI coach..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.text} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(79, 142, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  statusDotLoading: {
    backgroundColor: COLORS.warning,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  clearButton: {
    padding: 8,
  },
  promptsContainer: {
    flex: 1,
  },
  promptsContent: {
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  promptsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 142, 247, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  bubbleContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    padding: 14,
  },
  userBubbleBg: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubbleBg: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userBubbleText: {
    color: COLORS.text,
  },
  assistantBubbleText: {
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    color: COLORS.text,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
  },
});
