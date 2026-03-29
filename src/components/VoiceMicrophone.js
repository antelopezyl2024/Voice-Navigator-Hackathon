import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VoiceMicrophone({ isListening, isTranscribing = false, onPress, size = 80 }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      Animated.timing(pulse, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [isListening]);

  const bgColor = isListening ? '#CC2222' : isTranscribing ? '#F59E0B' : '#4A80F0';
  const outerColor = isListening
    ? 'rgba(204,34,34,0.2)'
    : isTranscribing
    ? 'rgba(245,158,11,0.2)'
    : 'rgba(74,128,240,0.2)';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={isTranscribing}>
      <Animated.View
        style={[
          styles.outer,
          {
            width: size + 24,
            height: size + 24,
            borderRadius: (size + 24) / 2,
            backgroundColor: outerColor,
            transform: [{ scale: pulse }],
          },
        ]}>
        <View
          style={[
            styles.inner,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bgColor,
            },
          ]}>
          {isTranscribing ? (
            <ActivityIndicator color="#fff" size={size * 0.3} />
          ) : (
            <Ionicons
              name={isListening ? 'stop' : 'mic'}
              size={size * 0.42}
              color="#fff"
            />
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center' },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
