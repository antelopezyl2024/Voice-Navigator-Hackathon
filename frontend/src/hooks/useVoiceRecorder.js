import { useState, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';

const BASE_URL = 'http://10.0.2.2:8000';

const RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat?.MPEG_4 ?? 2,
    audioEncoder: Audio.AndroidAudioEncoder?.AAC ?? 3,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat?.MPEG4AAC ?? 'aac ',
    audioQuality: Audio.IOSAudioQuality?.MAX ?? 0x7f,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

export function useVoiceRecorder(onTranscript, onError) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef(null);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission required', 'Microphone access is needed for voice input.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e) {
      console.error('Start recording error:', e);
      onError?.('Could not start recording: ' + e.message);
    }
  };

  const stopRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      // Delay so the last word isn't cut off
      await new Promise(r => setTimeout(r, 1200));
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error('No audio URI after recording');

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      });

      let json = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);
          const response = await fetch(`${BASE_URL}/transcribe`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`Server error: ${response.status}`);
          json = await response.json();
          break;
        } catch (retryErr) {
          if (attempt === 3) throw retryErr;
          await new Promise(r => setTimeout(r, 2000 * attempt));
        }
      }
      const text = json?.text?.trim();
      if (text) {
        onTranscript(text);
      } else {
        onError?.('No speech detected. Please try again.');
      }
    } catch (e) {
      console.error('Stop/transcribe error:', e);
      onError?.('Transcription failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return { isRecording, isTranscribing, toggleRecording };
}
