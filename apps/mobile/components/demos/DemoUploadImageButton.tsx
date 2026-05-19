import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Pressable } from 'react-native';
import { useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, ghostBorderColor, button } from '../../constants/tokens';

type Props = {
  label: string;
  onPick: (payload: { uri: string; base64: string }) => void;
  previewUri?: string | null;
};

export default function DemoUploadImageButton({ label, onPick, previewUri }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const pickGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, base64: true });
    if (!res.canceled && res.assets[0]?.base64) {
      onPick({ uri: res.assets[0].uri, base64: res.assets[0].base64 });
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setCameraOpen(true);
  };

  const capture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85, base64: true });
    if (photo?.base64) {
      onPick({ uri: photo.uri, base64: photo.base64 });
      setCameraOpen(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.preview} />
      ) : null}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={pickGallery}>
          <Ionicons name="images-outline" size={18} color={colors.onSurface} />
          <Text style={styles.btnText}>{label}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={openCamera}>
          <Ionicons name="camera-outline" size={18} color={colors.onSurface} />
          <Text style={styles.btnText}>Camera</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={cameraOpen} animationType="slide">
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="front" />
          <View style={styles.cameraControls}>
            <Pressable onPress={() => setCameraOpen(false)} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={capture} style={styles.shutter}>
              <View style={styles.shutterInner} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: ghostBorderColor,
    backgroundColor: colors.surfaceContainerLow,
  },
  btnText: {
    color: colors.onSurface,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
  },
  cancel: { padding: spacing.md },
  cancelText: { color: colors.onSurface, fontWeight: typography.weights.semibold },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: button.primaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: button.primaryFill,
  },
});
