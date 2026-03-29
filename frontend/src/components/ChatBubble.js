import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ImageViewer({ uri, onClose }) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
        <Text style={styles.tapClose}>Tap to close</Text>
      </TouchableOpacity>
    </Modal>
  );
}

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  const [selectedImage, setSelectedImage] = useState(null);
  const [failedUris, setFailedUris] = useState({});
  const imageUrls = (message.imageUrls || []).filter(u => !u.endsWith('.jpx'));
  const sourcePages = message.sourcePages || [];
  const sourceDocs = message.sourceDocs || [];

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>

        {!isUser && (sourceDocs.length > 0 || sourcePages.length > 0) && (
          <Text style={styles.sourceText}>
            {`📄 Source: ${sourceDocs.join(', ')}${sourcePages.length > 0 ? ` | Page${sourcePages.length > 1 ? 's' : ''} ${sourcePages.join(', ')}` : ''}`}
          </Text>
        )}

        {imageUrls.length > 0 && (
          <View style={styles.imagesRow}>
            {imageUrls.filter(uri => !failedUris[uri]).map((uri, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedImage(uri)} activeOpacity={0.8}>
                <Image
                  source={{ uri }}
                  style={styles.thumbnail}
                  resizeMode="contain"
                  onError={() => setFailedUris(prev => ({ ...prev, [uri]: true }))}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {selectedImage && (
        <ImageViewer uri={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 4, paddingHorizontal: 12 },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
  },
  userBubble: { backgroundColor: '#4A80F0', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#F0F4FF', borderBottomLeftRadius: 4 },
  text: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#fff' },
  assistantText: { color: '#1a1a2e' },
  sourceText: { fontSize: 11, color: '#6b7280', marginTop: 6, fontStyle: 'italic' },
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
  thumbnail: { width: 100, height: 80, borderRadius: 8, backgroundColor: '#e0e7ff', borderWidth: 1, borderColor: '#c7d2fe' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  fullImage: { width: SCREEN_WIDTH - 32, height: SCREEN_WIDTH - 32 },
  tapClose: { color: '#fff', marginTop: 12, fontSize: 13, opacity: 0.7 },
});
