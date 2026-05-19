import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { formatJsonPreview } from '../../lib/demoHelpers';
import { colors, typography, spacing, radius } from '../../constants/tokens';

type Props = {
  title?: string;
  data: unknown;
};

export default function DemoResultCard({ title, data }: Props) {
  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <ScrollView style={styles.scroll} nestedScrollEnabled>
        <Text style={styles.json}>{formatJsonPreview(data)}</Text>
      </ScrollView>
    </View>
  );
}

export function HumanIdStructuredResult({ data }: { data: Record<string, unknown> }) {
  const zelfProof = typeof data.zelfProof === 'string' ? data.zelfProof : null;
  const ipfs = typeof data.ipfsUrl === 'string' ? data.ipfsUrl : null;

  return (
    <View style={styles.wrap}>
      {zelfProof ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>zelfProof</Text>
          <Text style={styles.fieldValue} selectable numberOfLines={4}>
            {zelfProof}
          </Text>
        </View>
      ) : null}
      {ipfs ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>IPFS</Text>
          <Text style={styles.fieldValue} selectable>
            {ipfs}
          </Text>
        </View>
      ) : null}
      <DemoResultCard data={data} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.base,
    gap: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  scroll: { maxHeight: 320 },
  json: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.sizes.xs,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  field: { gap: spacing.xs },
  fieldLabel: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  fieldValue: {
    color: colors.onSurface,
    fontSize: typography.sizes.sm,
  },
});
