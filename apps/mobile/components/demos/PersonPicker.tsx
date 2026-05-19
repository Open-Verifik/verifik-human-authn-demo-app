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
import {
  getPersons,
  mapPersonDocsToListItems,
  normalizePersonsListPayload,
  type PersonListItem,
} from '@humanauthn/api-client';
import { colors, typography, spacing, radius } from '../../constants/tokens';

type Props = {
  accessToken: string;
  selectedId: string | null;
  onSelect: (person: PersonListItem | null) => void;
  label?: string;
};

export default function PersonPicker({ accessToken, selectedId, onSelect, label = 'Person' }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<PersonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getPersons(accessToken, { limit: 50 });
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        setItems([]);
      } else {
        const docs = normalizePersonsListPayload(res.data);
        setItems(mapPersonDocsToListItems(docs));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />;
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (!items.length) {
    return (
      <Text style={styles.empty}>
        {t('demos.updatePerson.noPeopleEmpty', { defaultValue: 'No people found. Enroll someone first in Create Person.' })}
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView style={styles.list} nestedScrollEnabled>
        {items.map((item) => {
          const active = selectedId === item._id;
          return (
            <TouchableOpacity
              key={item._id}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => onSelect(active ? null : item)}
            >
              <Text style={[styles.name, active && styles.nameActive]}>{item.name || item._id}</Text>
              <Text style={styles.id} numberOfLines={1}>
                {item._id}
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
  list: { maxHeight: 200 },
  row: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.xs,
  },
  rowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  name: { color: colors.onSurface, fontWeight: typography.weights.semibold },
  nameActive: { color: colors.onPrimaryContainer },
  id: { color: colors.outline, fontSize: typography.sizes.xs, marginTop: 2 },
  error: { color: colors.error, fontSize: typography.sizes.sm },
  empty: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm },
});
