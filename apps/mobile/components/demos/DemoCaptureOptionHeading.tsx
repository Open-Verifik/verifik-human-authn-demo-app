import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, ghostBorderColor } from '../../constants/tokens';

type Props = {
  label?: string;
  title?: string;
  subtitle?: string;
};

export default function DemoCaptureOptionHeading({ label, title, subtitle }: Props) {
  const resolvedTitle = title ?? label ?? '';
  if (!resolvedTitle && !subtitle) return null;

  return (
    <View style={styles.wrap}>
      {label && title ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
      {resolvedTitle ? <Text style={styles.title}>{resolvedTitle}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function DemoOrDivider() {
  return (
    <View style={styles.orRow}>
      <View style={styles.line} />
      <Text style={styles.or}>OR</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  badgeText: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: typography.weights.bold },
  title: {
    color: colors.onSurface,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: ghostBorderColor,
  },
  or: {
    color: colors.outline,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
});
