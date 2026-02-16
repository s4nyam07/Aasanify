import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';

const C = Colors.dark;

interface AudioRequiredModalProps {
  visible: boolean;
  onDownload: () => void;
  onStream: () => void;
  onCancel: () => void;
  downloading?: boolean;
  downloadProgress?: number;
}

export function AudioRequiredModal({
  visible,
  onDownload,
  onStream,
  onCancel,
  downloading = false,
  downloadProgress = 0,
}: AudioRequiredModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300)} style={styles.modal}>
          <View style={styles.iconContainer}>
            <Ionicons name="musical-notes" size={48} color={C.accent} />
          </View>

          <Text style={styles.title}>Audio Required</Text>
          <Text style={styles.description}>
            This session requires audio guidance. You can download it for offline use or stream it now with an active connection.
          </Text>

          {downloading ? (
            <View style={styles.downloadingContainer}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={styles.progressText}>
                Downloading... {Math.round(downloadProgress * 100)}%
              </Text>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={onDownload}
              >
                <Ionicons name="download" size={20} color={C.background} />
                <Text style={styles.primaryButtonText}>Download Now</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={onStream}
              >
                <Ionicons name="wifi" size={20} color={C.text} />
                <Text style={styles.secondaryButtonText}>Stream (Requires Connection)</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modal: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: C.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  downloadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  progressText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: C.accent,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: C.background,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: C.text,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: C.textTertiary,
  },
});
