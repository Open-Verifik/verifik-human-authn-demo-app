import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useDemoDocs } from './DemoDocsProvider';
import { colors, typography, spacing, radius } from '../../constants/tokens';

export type RelatedDocItem = {
  href: string;
  title: string;
  description: string;
  badge?: string;
};

type Props = {
  items: RelatedDocItem[];
};

export default function DemoRelatedDocsSection({ items }: Props) {
  const { t } = useTranslation();
  const { openDocLink } = useDemoDocs();

  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('demos.common.relatedDocsTitle')}</Text>
      <Text style={styles.subtitle}>{t('demos.common.relatedDocsSubtitle')}</Text>
      {items.map((item) => (
        <TouchableOpacity
          key={item.href}
          style={styles.item}
          onPress={() => openDocLink(item.href, item.title)}
          activeOpacity={0.85}
        >
          <View style={styles.itemHeader}>
            {item.badge ? <Text style={styles.badge}>{item.badge}</Text> : null}
            <Ionicons name="open-outline" size={16} color={colors.primary} />
          </View>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDesc}>{item.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl, gap: spacing.sm },
  title: { color: colors.onSurface, fontWeight: typography.weights.bold, fontSize: typography.sizes.sm },
  subtitle: { color: colors.onSurfaceVariant, fontSize: typography.sizes.xs, marginBottom: spacing.sm },
  item: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  badge: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  itemTitle: { color: colors.onSurface, fontWeight: typography.weights.semibold },
  itemDesc: { color: colors.onSurfaceVariant, fontSize: typography.sizes.xs, marginTop: 4 },
});
