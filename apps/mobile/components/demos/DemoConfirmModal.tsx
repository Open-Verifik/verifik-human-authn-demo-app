import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing, radius, ghostBorderColor } from '../../constants/tokens';
import { DemoButton } from '../ui';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DemoConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <DemoButton label={cancelLabel} onPress={onCancel} variant="secondary" size="sm" />
            <DemoButton
              label={confirmLabel}
              onPress={onConfirm}
              variant="primary"
              size="sm"
              style={destructive ? styles.destructiveBtn : undefined}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  panel: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: ghostBorderColor,
    gap: spacing.md,
  },
  title: {
    color: colors.onSurface,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  message: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  destructiveBtn: { backgroundColor: colors.errorContainer },
});
