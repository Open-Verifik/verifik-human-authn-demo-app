import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../../constants/tokens';

type Slot = { preview: string | null };

type Props = {
  source: Slot;
  target: Slot;
  sourceLabel: string;
  targetLabel: string;
  highlight?: 'source' | 'target' | null;
};

export default function FaceCompareSlotPreviews({ source, target, sourceLabel, targetLabel, highlight }: Props) {
  if (!source.preview && !target.preview) return null;

  return (
    <View style={styles.row}>
      {[
        { slot: source, label: sourceLabel, key: 'source' as const },
        { slot: target, label: targetLabel, key: 'target' as const },
      ].map(({ slot, label, key }) => {
        const isHighlighted = highlight === key;
        return (
          <View key={key} style={styles.item}>
            <View style={[styles.avatar, isHighlighted && styles.avatarHighlight]}>
              {slot.preview ? (
                <Image source={{ uri: slot.preview }} style={styles.image} />
              ) : (
                <Ionicons name="person-outline" size={28} color={colors.onSurfaceVariant} />
              )}
              {isHighlighted ? (
                <View style={styles.badge}>
                  <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
                </View>
              ) : null}
            </View>
            <Text style={[styles.caption, isHighlighted && styles.captionHighlight]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginBottom: spacing.lg },
  item: { alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHighlight: {
    borderColor: 'rgba(74,222,128,0.5)',
    transform: [{ scale: 1.05 }],
  },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', bottom: 2, alignSelf: 'center' },
  caption: { fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  captionHighlight: { color: '#86efac' },
});
