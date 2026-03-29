import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Speech from 'expo-speech';

import ChatBubble from '../components/ChatBubble';
import VoiceMicrophone from '../components/VoiceMicrophone';
import { queryFood } from '../services/ragService';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

const SUGGESTED_PROMPTS = [
  'List major food insecurity reasons in 2024',
  'Explain malnutrition in war zones',
  'Explain increase prices impact on food security',
  'Compare food insecurity reasons in 2023 and 2024',
  'Prevalence of undernourishment statistics',
];

export default function FoodSecurityScreen() {
  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant', content: 'Hello! I can answer questions about Food Security and Nutrition based on the FAO/WHO SOFI 2024-2025 reports. Ask me anything!' },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const { isRecording, isTranscribing, toggleRecording } = useVoiceRecorder(
    (text) => { setInputText(text); sendMessage(text); },
    (err) => Alert.alert('Voice Error', err)
  );

  const sendMessage = async (text) => {
    const question = (text || inputText).trim();
    if (!question) return;
    setInputText('');
    const userMsg = { id: Date.now().toString(), role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const { answer, imageUrls, sourcePages, sourceDocs } = await queryFood(question);
      const botMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: answer, imageUrls, sourcePages, sourceDocs };
      setMessages((prev) => [...prev, botMsg]);
      Speech.speak(answer.substring(0, 500), { rate: 0.9 });
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.message || 'Unknown error';
      const err = { id: (Date.now() + 1).toString(), role: 'assistant', content: `⚠️ Backend error: ${detail}` };
      setMessages((prev) => [...prev, err]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoBox}><Text style={styles.logoText}>FAO</Text></View>
          <Text style={styles.headerTitle}>Food Security</Text>
          <View style={styles.flagBox}><Text>🌍</Text></View>
        </View>
        <Text style={styles.headerSub}>SOFI 2024-2025 Reports • RAG-Powered</Text>
      </View>

      {/* Suggested prompts */}
      <View style={styles.suggestRow}>
        <FlatList
          data={SUGGESTED_PROMPTS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chip} onPress={() => sendMessage(item)}>
              <Text style={styles.chipText} numberOfLines={2}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        />
      </View>

      {/* Chat + Input */}
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
          style={styles.chatList}
          nestedScrollEnabled={true}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#4A80F0" />
            <Text style={styles.loadingText}>Searching documents...</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <VoiceMicrophone isListening={isRecording} isTranscribing={isTranscribing} onPress={toggleRecording} size={40} />
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about food security..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage()} disabled={loading}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  header: { backgroundColor: '#4A80F0', padding: 12, paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoBox: { backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  logoText: { color: '#4A80F0', fontWeight: '700', fontSize: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  flagBox: { width: 36, alignItems: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, textAlign: 'center', marginTop: 4 },
  suggestRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e0e7ff', backgroundColor: '#fff' },
  chip: { backgroundColor: '#e0e7ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 4, maxWidth: 160 },
  chipText: { color: '#4A80F0', fontSize: 11, fontWeight: '500' },
  flex1: { flex: 1 },
  chatList: { flex: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 16 },
  loadingText: { marginLeft: 8, color: '#555', fontSize: 13, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e7ff' },
  input: { flex: 1, backgroundColor: '#f0f4ff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 8, fontSize: 14, maxHeight: 80, color: '#333' },
  sendBtn: { backgroundColor: '#4A80F0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
