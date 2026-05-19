import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radius } from '../../../constants/tokens';
import DemoResultActions from '../DemoResultActions';

const isObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const thumbUri = (b64: string): string => {
  const t = b64.trim();
  if (t.startsWith('data:')) return t;
  const mime = t.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${t}`;
};

type Props = {
  result: Record<string, unknown> | null;
  onReset: () => void;
};

export default function SearchPersonResultCard({ result, onReset }: Props) {
  const { t } = useTranslation();
  const ns = 'demos.searchPersonResult';

  const matches = Array.isArray(result?.data)
    ? (result.data as unknown[]).filter(isObject)
    : [];

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t(`${ns}.title`, { defaultValue: 'Search results' })}</Text>
      <Text style={styles.sub}>
        {t(`${ns}.matchCount`, { count: matches.length, defaultValue: `${matches.length} match(es)` })}
      </Text>
      <ScrollView style={styles.list} nestedScrollEnabled>
        {matches.map((person, idx) => {
          const name = typeof person.name === 'string' ? person.name : `Person ${idx + 1}`;
          const score = typeof person.score === 'number' ? person.score : null;
          const thumbs = Array.isArray(person.thumbnails) ? person.thumbnails : [];
          const firstThumb = thumbs.find(isObject);
          const b64 = firstThumb && typeof firstThumb.thumbnail === 'string' ? firstThumb.thumbnail : null;

          return (
            <View key={idx} style={styles.card}>
              {b64 ? <Image source={{ uri: thumbUri(b64) }} style={styles.thumb} /> : null}
              <View style={styles.meta}>
                <Text style={styles.name}>{name}</Text>
                {score != null ? (
                  <Text style={styles.score}>{(score * 100).toFixed(1)}%</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <DemoResultActions onReset={onReset} tryAgainLabel={t(`${ns}.searchAgain`, { defaultValue: 'Search again' })} />
    </View>
  );
}

export function CreatePersonResultCard({
  result,
  onReset,
  mode = 'create',
}: {
  result: Record<string, unknown> | null;
  onReset: () => void;
  mode?: 'create' | 'update' | 'delete';
}) {
  const { t } = useTranslation();
  const ns = 'demos.personResult';
  const data = isObject(result?.data) ? result.data : result;
  const name = data && typeof data.name === 'string' ? data.name : null;
  const id = data && (typeof data._id === 'string' ? data._id : typeof data.id === 'string' ? data.id : null);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {t(`${ns}.${mode}SuccessTitle`, { defaultValue: 'Success' })}
      </Text>
      {name ? <Text style={styles.name}>{name}</Text> : null}
      {id ? <Text style={styles.id}>{id}</Text> : null}
      <DemoResultActions
        onReset={onReset}
        tryAgainLabel={t('demos.common.createAnother', { defaultValue: 'Create another' })}
      />
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
    marginTop: spacing.md,
  },
  title: { color: colors.onSurface, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  sub: { color: colors.onSurfaceVariant, marginTop: spacing.xs, marginBottom: spacing.md },
  list: { maxHeight: 360 },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.md },
  meta: { flex: 1, justifyContent: 'center' },
  name: { color: colors.onSurface, fontWeight: typography.weights.semibold },
  score: { color: colors.primary, marginTop: 4 },
  id: { color: colors.onSurfaceVariant, fontSize: typography.sizes.xs, fontFamily: 'monospace', marginTop: spacing.sm },
});
