import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import * as Speech from 'expo-speech';

import VoiceMicrophone from '../components/VoiceMicrophone';
import { LineChartDisplay, PieChartDisplay } from '../components/ChartDisplay';
import { fetchGDP, fetchCO2, fetchAgriLand, DOW_TOP_10, CO2_DESCRIPTION } from '../services/worldBankAPI';
import { parseVoiceCommand, COMMANDS } from '../services/voiceParser';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

const TABS = ['GDP', 'CO2', 'Agri. Land'];

export default function APIScreen() {
  const [activeTab, setActiveTab] = useState('GDP');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [showPie, setShowPie] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Tap mic or a button to load data');

  const { isRecording, isTranscribing, toggleRecording } = useVoiceRecorder(
    (text) => handleVoiceCommand(text),
    (err) => setStatusMsg(`Voice error: ${err}`)
  );

  const loadData = useCallback(async (type) => {
    setLoading(true);
    setDescription('');
    setShowPie(false);
    setStatusMsg('Loading data...');
    try {
      let data, label, unit;
      if (type === 'GDP') {
        data = await fetchGDP(); label = 'World GDP Growth (% annual)'; unit = '%';
      } else if (type === 'CO2') {
        data = await fetchCO2(); label = 'CO₂ Emissions from Agriculture (Thousand metric tons)'; unit = '';
      } else {
        data = await fetchAgriLand(); label = 'Agricultural Land (% of land area)'; unit = '%';
      }
      setChartData({ data, label, unit });
      setActiveTab(type === 'GDP' ? 'GDP' : type === 'CO2' ? 'CO2' : 'Agri. Land');
      setStatusMsg(`Showing ${label}`);
    } catch (e) {
      Alert.alert('API Error', 'Failed to fetch World Bank data. Check your internet connection.');
      setStatusMsg('Error loading data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVoiceCommand = useCallback((text) => {
    const { command } = parseVoiceCommand(text);
    setStatusMsg(`Voice: "${text}"`);
    switch (command) {
      case COMMANDS.SHOW_GDP: loadData('GDP'); break;
      case COMMANDS.SHOW_CO2: loadData('CO2'); break;
      case COMMANDS.SHOW_AGRI: loadData('AGRI'); break;
      case COMMANDS.DESCRIBE_CO2:
        setDescription(CO2_DESCRIPTION);
        setChartData(null);
        Speech.speak(CO2_DESCRIPTION.substring(0, 300));
        break;
      case COMMANDS.SHOW_DOW:
        setShowPie(true);
        setChartData(null);
        setStatusMsg('Top 10 DOW Stocks by market weight');
        break;
      default:
        setStatusMsg(`Command not recognized: "${text}". Try "Show GDP Graph" or "Show CO2 graph"`);
    }
  }, [loadData]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Market Research</Text>
        <Text style={styles.headerSub}>Voice Navigator</Text>
      </View>

      {/* Tab buttons */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              const key = tab === 'GDP' ? 'GDP' : tab === 'CO2' ? 'CO2' : 'AGRI';
              loadData(key);
            }}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status */}
        <Text style={styles.status}>{statusMsg}</Text>

        {/* Chart area */}
        {loading && <ActivityIndicator size="large" color="#4A80F0" style={{ marginTop: 40 }} />}
        {!loading && chartData && (
          <LineChartDisplay data={chartData.data} label={chartData.label} unit={chartData.unit} />
        )}
        {!loading && showPie && (
          <PieChartDisplay data={DOW_TOP_10} label="DIA (Dow 30) Top 10 by Weight" />
        )}
        {!loading && description !== '' && (
          <View style={styles.descBox}>
            <Text style={styles.descText}>{description}</Text>
          </View>
        )}

        {/* Mic */}
        <View style={styles.micContainer}>
          <VoiceMicrophone isListening={isRecording} isTranscribing={isTranscribing} onPress={toggleRecording} size={80} />
          <Text style={styles.micHint}>
            {isTranscribing ? 'Transcribing...' : isRecording ? 'Recording — tap to stop' : 'Tap to speak'}
          </Text>
        </View>

        {/* Quick command hints */}
        <View style={styles.hintsBox}>
          <Text style={styles.hintsTitle}>Try saying:</Text>
          {['"Show GDP Graph"', '"Show CO2 graph"', '"Show Agri Land Graph"', '"Describe CO2 Emissions"', '"Top 10 Stocks of DOW"'].map((h) => (
            <Text key={h} style={styles.hintItem}>• {h}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  header: { backgroundColor: '#4A80F0', padding: 16, paddingTop: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' },
  tabRow: { flexDirection: 'row', margin: 12, backgroundColor: '#e0e7ff', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#4A80F0' },
  tabText: { color: '#4A80F0', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  scroll: { padding: 16, paddingBottom: 40 },
  status: { color: '#555', fontSize: 13, textAlign: 'center', marginBottom: 8, fontStyle: 'italic' },
  micContainer: { alignItems: 'center', marginVertical: 24 },
  micHint: { marginTop: 8, color: '#555', fontSize: 13 },
  descBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, marginTop: 8 },
  descText: { color: '#333', fontSize: 14, lineHeight: 22 },
  hintsBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  hintsTitle: { fontWeight: '700', color: '#333', marginBottom: 6 },
  hintItem: { color: '#555', fontSize: 13, marginVertical: 2 },
});
