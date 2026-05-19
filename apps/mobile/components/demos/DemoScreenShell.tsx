import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radius } from '../../constants/tokens';

type Props = {
  title: string;
  onBack?: () => void;
};

export default function DemoScreenShell({ title, onBack }: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView edges={['top']} style={styles.header}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={onBack ?? (() => router.back())}
          style={styles.backBtn}
          accessibilityLabel={t('demos.common.backAria', { defaultValue: 'Go back' })}
        >
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
    borderRadius: radius.md,
  },
  title: {
    flex: 1,
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
});
