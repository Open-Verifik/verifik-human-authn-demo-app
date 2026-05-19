import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { CompareWithLivenessParsed } from '@humanauthn/api-client';
import { colors, typography, spacing, radius } from '../../../constants/tokens';
import DemoResultActions from '../DemoResultActions';

type Props = {
  ns: string;
  result: CompareWithLivenessParsed;
  compareMinScore: number;
  sourcePreview: string | null;
  targetPreview: string | null;
  onTryAgain: () => void;
};

const verified = (r: CompareWithLivenessParsed) => r.match && !r.livenessSkipped && r.livenessPassed;

const titleKey = (r: CompareWithLivenessParsed) => {
  if (verified(r)) return 'titleVerified';
  if (!r.match) return 'titleFaceMismatch';
  if (r.livenessSkipped) return 'titleLivenessNotRun';
  return 'titleLivenessBelow';
};

const messageFallback = (r: CompareWithLivenessParsed, t: (key: string) => string, ns: string) => {
  if (verified(r)) return t(`${ns}.msgVerified`);
  if (!r.match && r.livenessSkipped) return t(`${ns}.msgBelowSkip`);
  if (!r.match) return t(`${ns}.msgBelowMatch`);
  if (r.livenessSkipped) return t(`${ns}.msgLivenessSkipped`);
  return t(`${ns}.msgLivenessLow`);
};

const iconName = (r: CompareWithLivenessParsed): keyof typeof Ionicons.glyphMap => {
  if (verified(r)) return 'shield-checkmark';
  if (!r.match) return 'person-remove';
  if (r.livenessSkipped) return 'play-skip-forward';
  return 'shield-half';
};

export default function FaceCompareLivenessResultCard({
  ns,
  result,
  compareMinScore,
  sourcePreview,
  targetPreview,
  onTryAgain,
}: Props) {
  const { t } = useTranslation();
  const ok = verified(result);

  return (
    <View style={[styles.card, ok ? styles.cardPass : styles.cardFail]}>
      <View style={styles.previews}>
        {[sourcePreview, targetPreview].map((uri, i) => (
          <View key={i} style={styles.previewCol}>
            <View style={styles.avatar}>
              {uri ? <Image source={{ uri }} style={styles.image} /> : null}
            </View>
            <Text style={styles.caption}>{i === 0 ? t(`${ns}.slotSource`) : t(`${ns}.slotTarget`)}</Text>
          </View>
        ))}
        <View style={[styles.linkIcon, ok ? styles.linkPass : styles.linkFail]}>
          <Ionicons name={ok ? 'checkmark-circle' : 'alert-circle'} size={22} color={ok ? colors.primary : colors.error} />
        </View>
      </View>

      <View style={[styles.iconWrap, ok ? styles.iconPass : styles.iconFail]}>
        <Ionicons name={iconName(result)} size={40} color={ok ? colors.primary : colors.error} />
      </View>

      <Text style={styles.title}>{t(`${ns}.${titleKey(result)}`)}</Text>
      <Text style={styles.message}>{result.message || messageFallback(result, t, ns)}</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{(result.score * 100).toFixed(1)}%</Text>
          <Text style={styles.statLabel}>{t(`${ns}.similarityMin`, { score: compareMinScore.toFixed(2) })}</Text>
          <Text style={styles.statMeta}>{result.match ? t(`${ns}.pass`) : t(`${ns}.fail`)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {result.livenessSkipped
              ? t(`${ns}.na`)
              : result.livenessScore != null
                ? `${(result.livenessScore * 100).toFixed(1)}%`
                : t(`${ns}.na`)}
          </Text>
          <Text style={styles.statLabel}>
            {t(`${ns}.livenessMin`, { score: result.livenessMinScore.toFixed(2) })}
          </Text>
          <Text style={[styles.statMeta, result.livenessPassed && !result.livenessSkipped && styles.statMetaPass]}>
            {result.livenessSkipped
              ? t(`${ns}.skipped`)
              : result.livenessScore != null
                ? result.livenessPassed
                  ? t(`${ns}.pass`)
                  : t(`${ns}.fail`)
                : t(`${ns}.na`)}
          </Text>
        </View>
      </View>

      <DemoResultActions onReset={onTryAgain} tryAgainLabel={t(`${ns}.tryAgain`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: spacing.md,
  },
  cardPass: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: 'rgba(38,66,255,0.2)',
  },
  cardFail: {
    backgroundColor: 'rgba(147,0,10,0.12)',
    borderColor: 'rgba(255,180,171,0.2)',
  },
  previews: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  previewCol: { alignItems: 'center', gap: spacing.xs },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  image: { width: '100%', height: '100%' },
  caption: { fontSize: 10, color: colors.onSurfaceVariant },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkPass: { backgroundColor: 'rgba(38,66,255,0.15)' },
  linkFail: { backgroundColor: 'rgba(147,0,10,0.15)' },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconPass: { backgroundColor: 'rgba(38,66,255,0.12)' },
  iconFail: { backgroundColor: 'rgba(255,180,171,0.12)' },
  title: {
    color: colors.onSurface,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.black,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
    fontSize: typography.sizes.sm,
  },
  stats: { flexDirection: 'row', gap: spacing.md, width: '100%', marginBottom: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: 'center',
  },
  statValue: { color: colors.primary, fontSize: typography.sizes.xl, fontWeight: typography.weights.black },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  statMeta: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  statMetaPass: { color: colors.primary },
});
