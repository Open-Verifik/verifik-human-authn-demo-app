import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radius, ghostBorderColor } from '../../constants/tokens';

type Props = {
  description: string;
  title?: string;
};

export default function DemoChooseOneCallout({ description, title }: Props) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('demos.common.chooseOneDefaultTitle');

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{resolvedTitle}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: ghostBorderColor,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
