import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Speech from 'expo-speech';

import ChatBubble from '../components/ChatBubble';
import VoiceMicrophone from '../components/VoiceMicrophone';
import { queryDMV } from '../services/ragService';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

const SUGGESTED_PROMPTS = [
  'What are signaling signs?',
  'What are Blood Alcohol Concentration limits?',
  'What are speed limits in school zones?',
  'What are right-of-way rules at intersections?',
  'What documents do I need for a license?',
];

const CarGraphic = () => (
  <View style={styles.carContainer}>
    <View style={styles.carBody}>
      <View style={styles.carTop} />
      <View style={styles.carBottom}>
        <View style={styles.headlight} />
        <View style={styles.micSlot}>
          <Text style={styles.micIcon}>🎙️</Text>
        </View>
        <View style={styles.headlight} />
      </View>
    </View>
  </View>
);

export default function DMVScreen() {
  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant', content: "Hello! I'm your California DMV Knowledge Test assistant. Ask me anything about the California Driver's Handbook — traffic laws, signs, safety rules, and more!" },
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
      const { answer, imageUrls } = await queryDMV(question);
      const botMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: answer, imageUrls };
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
          <View style={styles.logoBox}><Text style={styles.logoText}>DMV</Text></View>
          <Text style={styles.headerTitle}>CA DMV Knowledge Test</Text>
          <View style={styles.flagBox}><Text>🏛️</Text></View>
        </View>
        <Text style={styles.headerSub}>California Driver's Handbook • RAG-Powered</Text>
      </View>

      {/* Car graphic with mic */}
      <View style={styles.carSection}>
        <CarGraphic />
        <VoiceMicrophone isListening={isRecording} isTranscribing={isTranscribing} onPress={toggleRecording} size={50} />
        <Text style={styles.voiceHint}>{isTranscribing ? 'Transcribing...' : isRecording ? 'Recording — tap to stop' : 'Tap to ask by voice'}</Text>
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
            <ActivityIndicator size="small" color="#1a6b3c" />
            <Text style={styles.loadingText}>Looking up handbook...</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about CA driving rules..."
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
  safe: { flex: 1, backgroundColor: '#f0f8f4' },
  header: { backgroundColor: '#1a6b3c', padding: 12, paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoBox: { backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  logoText: { color: '#1a6b3c', fontWeight: '700', fontSize: 12 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  flagBox: { width: 36, alignItems: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, textAlign: 'center', marginTop: 4 },
  carSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#c8e6c9', gap: 16 },
  carContainer: { alignItems: 'center' },
  carBody: { alignItems: 'center' },
  carTop: { width: 60, height: 24, backgroundColor: '#1a6b3c', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  carBottom: { width: 90, height: 30, backgroundColor: '#2e7d52', borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  headlight: { width: 12, height: 12, backgroundColor: '#fff', borderRadius: 6 },
  micSlot: { width: 24, height: 24, backgroundColor: '#4A80F0', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  micIcon: { fontSize: 12 },
  voiceHint: { color: '#555', fontSize: 12, marginTop: 4 },
  suggestRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#c8e6c9', backgroundColor: '#fff' },
  chip: { backgroundColor: '#e8f5e9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 4, maxWidth: 160 },
  chipText: { color: '#1a6b3c', fontSize: 11, fontWeight: '500' },
  flex1: { flex: 1 },
  chatList: { flex: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 16 },
  loadingText: { marginLeft: 8, color: '#555', fontSize: 13, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#c8e6c9' },
  input: { flex: 1, backgroundColor: '#e8f5e9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, fontSize: 14, maxHeight: 80, color: '#333' },
  sendBtn: { backgroundColor: '#1a6b3c', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
