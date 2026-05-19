import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radius } from '../../constants/tokens';
import { DemoButton } from '../ui';

export type LivenessResultData = {
  isLive: boolean;
  confidence: number;
  message: string;
};

type Props = {
  result: LivenessResultData;
  onTryAgain: () => void;
};

export default function LivenessResultCard({ result, onTryAgain }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const ns = 'demos.liveness';

  return (
    <View style={[styles.card, result.isLive ? styles.cardPass : styles.cardFail]}>
      <View style={[styles.iconWrap, result.isLive ? styles.iconPass : styles.iconFail]}>
        <Ionicons
          name={result.isLive ? 'shield-checkmark' : 'alert-circle'}
          size={36}
          color={result.isLive ? colors.success : colors.error}
        />
      </View>
      <Text style={styles.title}>{result.isLive ? t(`${ns}.liveTitle`) : t(`${ns}.spoofTitle`)}</Text>
      <Text style={styles.message}>{result.message}</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{(result.confidence * 100).toFixed(1)}%</Text>
          <Text style={styles.statLabel}>{t(`${ns}.confidence`)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{result.isLive ? t(`${ns}.pass`) : t(`${ns}.fail`)}</Text>
          <Text style={styles.statLabel}>{t(`${ns}.verdict`)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <DemoButton label={t('demos.common.backToDemos')} onPress={() => router.push('/home')} fullWidth />
        <DemoButton label={t(`${ns}.tryAgain`)} onPress={onTryAgain} variant="secondary" fullWidth />
      </View>
    </View>
  );
}

export function LivenessProcessingView({ previewUri }: { previewUri: string | null }) {
  const { t } = useTranslation();
  const ns = 'demos.liveness';

  return (
    <View style={styles.processing}>
      <View style={styles.processingRing}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.processingImage} />
        ) : null}
      </View>
      <Text style={styles.processingTitle}>{t(`${ns}.analyzingTitle`)}</Text>
      <Text style={styles.processingSub}>{t(`${ns}.engineLine`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardPass: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  cardFail: {
    backgroundColor: 'rgba(147,0,10,0.15)',
    borderColor: 'rgba(255,180,171,0.2)',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconPass: { backgroundColor: 'rgba(34,197,94,0.12)' },
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
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  stats: { flexDirection: 'row', gap: spacing.md, width: '100%', marginBottom: spacing.xl },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: 'center',
  },
  statValue: { color: colors.onSurface, fontSize: typography.sizes.xl, fontWeight: typography.weights.black },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: { gap: spacing.md, width: '100%' },
  processing: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  processingRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceContainerHigh,
  },
  processingImage: { width: '100%', height: '100%', opacity: 0.7 },
  processingTitle: { color: colors.onSurface, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
  processingSub: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm, marginTop: spacing.sm, fontFamily: 'monospace' },
});
