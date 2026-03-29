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
    bitRate: 64000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat?.MPEG4AAC ?? 'aac ',
    audioQuality: Audio.IOSAudioQuality?.HIGH ?? 0x60,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
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

      const response = await axios.post(`${BASE_URL}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 20000,
      });

      const text = response.data?.text?.trim();
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
