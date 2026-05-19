import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../constants/tokens';

type Props = {
  stepLabel: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

/** Numbered form section matching web HumanID demo section cards. */
export default function DemoFormSection({ stepLabel, title, subtitle, children }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{stepLabel}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(23,23,23,0.6)',
    padding: spacing.base,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  badge: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,102,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  headerText: { flex: 1, gap: spacing.xs },
  title: {
    color: colors.onSurface,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  body: { gap: spacing.md },
});
