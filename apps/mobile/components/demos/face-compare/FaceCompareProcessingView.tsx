import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radius } from '../../../constants/tokens';

type Props = {
  ns: string;
  sourcePreview: string | null;
  targetPreview: string | null;
  sourceLabel: string;
  targetLabel: string;
};

export default function FaceCompareProcessingView({
  ns,
  sourcePreview,
  targetPreview,
  sourceLabel,
  targetLabel,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View style={styles.previews}>
        {[sourcePreview, targetPreview].map((uri, i) => (
          <View key={i} style={styles.previewCol}>
            <View style={styles.ring}>
              {uri ? <Image source={{ uri }} style={styles.image} /> : null}
            </View>
            <Text style={styles.caption}>{i === 0 ? sourceLabel : targetLabel}</Text>
          </View>
        ))}
      </View>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      <Text style={styles.title}>{t(`${ns}.analyzing`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xl },
  previews: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  previewCol: { alignItems: 'center', gap: spacing.sm },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(38,66,255,0.35)',
    backgroundColor: colors.surfaceContainerHigh,
  },
  image: { width: '100%', height: '100%', opacity: 0.85 },
  caption: { fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  spinner: { marginBottom: spacing.md },
  title: { color: colors.onSurfaceVariant, fontSize: typography.sizes.base },
});
