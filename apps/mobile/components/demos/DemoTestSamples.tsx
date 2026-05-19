import { View, Text, StyleSheet, TouchableOpacity, Image, type ImageSourcePropType } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radius } from '../../constants/tokens';

export type SampleImageSource = ImageSourcePropType;

type Props = {
  sources: SampleImageSource[];
  onSelect: (index: number) => void;
  disabled?: boolean;
  titleKey?: string;
  descriptionKey?: string;
  ns?: string;
};

export default function DemoTestSamples({
  sources,
  onSelect,
  disabled,
  titleKey = 'samplesTitle',
  descriptionKey = 'samplesDescription',
  ns = 'demos.liveness',
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.dot} />
        <Text style={styles.title}>{t(`${ns}.${titleKey}`)}</Text>
      </View>
      <Text style={styles.description}>{t(`${ns}.${descriptionKey}`)}</Text>
      <View style={styles.grid}>
        {sources.map((src, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.thumb, disabled && styles.thumbDisabled]}
            onPress={() => onSelect(index)}
            disabled={disabled}
            accessibilityLabel={t(`${ns}.samplePortraitAria`, { n: index + 1 })}
          >
            <Image source={src} style={styles.image} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  title: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  description: { color: colors.onSurfaceVariant, fontSize: typography.sizes.xs, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  thumbDisabled: { opacity: 0.5 },
  image: { width: '100%', height: '100%' },
});
