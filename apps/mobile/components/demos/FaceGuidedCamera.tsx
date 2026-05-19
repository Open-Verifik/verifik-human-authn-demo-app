import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../constants/tokens';

export type FaceGuidedCapturePayload = {
  uri: string;
  base64: string;
};

type Props = {
  onCapture: (payload: FaceGuidedCapturePayload) => void;
  disabled?: boolean;
  hint?: string;
};

/**
 * Ring-guided front camera capture (Expo Camera). Manual shutter with oval overlay
 * matching web FaceGuidedCamera visual language.
 */
export default function FaceGuidedCamera({ onCapture, disabled, hint }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const start = async () => {
    if (disabled) return;
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setOpen(true);
  };

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: true });
      if (photo?.base64) {
        onCapture({ uri: photo.uri, base64: photo.base64 });
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={[styles.trigger, disabled && styles.triggerDisabled]} onPress={start}>
        <Ionicons name="scan-circle-outline" size={22} color={colors.primary} />
        <Text style={styles.triggerText}>Guided face capture</Text>
      </TouchableOpacity>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Modal visible={open} animationType="slide">
        <View style={styles.modal}>
          <CameraView ref={cameraRef} style={styles.camera} facing="front" mirror />
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.ring} />
            <Text style={styles.overlayHint}>Align your face in the ring</Text>
          </View>
          <View style={styles.controls}>
            <Pressable onPress={() => setOpen(false)} style={styles.controlBtn}>
              <Text style={styles.controlText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={capture} style={styles.shutter} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  triggerDisabled: { opacity: 0.5 },
  triggerText: {
    color: colors.onPrimaryContainer,
    fontWeight: typography.weights.bold,
  },
  hint: {
    marginTop: spacing.xs,
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  modal: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 260,
    height: 340,
    borderRadius: 130,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  overlayHint: {
    marginTop: spacing.lg,
    color: colors.white,
    fontWeight: typography.weights.semibold,
    textShadowColor: '#000',
    textShadowRadius: 6,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
  },
  controlBtn: { padding: spacing.md },
  controlText: { color: colors.onSurface, fontWeight: typography.weights.semibold },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
  },
});
