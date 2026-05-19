import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { listCollections, type FaceCollectionListItem } from '@humanauthn/api-client';
import { colors, typography, spacing, radius } from '../../constants/tokens';

type Props = {
  accessToken: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  label?: string;
  multi?: boolean;
  selectedIds?: string[];
  onSelectMulti?: (ids: string[]) => void;
};

export default function CollectionPicker({
  accessToken,
  selectedId,
  onSelect,
  label = 'Collection',
  multi = false,
  selectedIds = [],
  onSelectMulti,
}: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<FaceCollectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      const res = await listCollections(accessToken);
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        setItems([]);
      } else {
        const data = res.data?.data;
        setItems(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const toggleMulti = (id: string) => {
    if (!onSelectMulti) return;
    if (selectedIds.includes(id)) {
      onSelectMulti(selectedIds.filter((x) => x !== id));
    } else {
      onSelectMulti([...selectedIds, id]);
    }
  };

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />;
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (!items.length) {
    return (
      <Text style={styles.empty}>
        {t('demos.createPerson.noCollectionsLead', { defaultValue: 'No collections yet.' })}{' '}
        {t('demos.createPerson.noCollectionsCta', { defaultValue: 'Create a collection' })}{' '}
        {t('demos.createPerson.noCollectionsTail', { defaultValue: 'first.' })}
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {items.map((item) => {
          const active = multi ? selectedIds.includes(item._id) : selectedId === item._id;
          return (
            <TouchableOpacity
              key={item._id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => (multi ? toggleMulti(item._id) : onSelect(item._id))}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    color: colors.onSurface,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  scroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginRight: spacing.sm,
    maxWidth: 180,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  chipText: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm },
  chipTextActive: { color: colors.onPrimaryContainer, fontWeight: typography.weights.bold },
  error: { color: colors.error, fontSize: typography.sizes.sm },
  empty: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm },
});
