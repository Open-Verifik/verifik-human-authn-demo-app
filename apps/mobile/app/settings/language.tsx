import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { APP_LOCALES, type AppLocale } from '@humanauthn/demo-catalog';
import { changeAppLocale } from '../../lib/i18n';
import { colors, typography, spacing, radius } from '../../constants/tokens';

export default function SettingsLanguageScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const selectLocale = async (locale: AppLocale) => {
    await changeAppLocale(locale);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('LanguageSwitcher.ariaLabel')}</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {APP_LOCALES.map((locale: AppLocale) => {
          const active = i18n.language === locale;
          return (
            <TouchableOpacity
              key={locale}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => selectLocale(locale)}
            >
              <Text style={[styles.rowText, active && styles.rowTextActive]}>
                {t(`LanguageSwitcher.${locale}`)}
              </Text>
              {active ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  back: { padding: spacing.xs },
  headerTitle: { color: colors.onSurface, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  scroll: { padding: spacing.base, gap: spacing.xs, paddingBottom: spacing['4xl'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.xs,
  },
  rowActive: { borderColor: 'rgba(255,255,255,0.25)', backgroundColor: colors.surfaceContainerHigh },
  rowText: { color: colors.onSurface, fontSize: typography.sizes.base },
  rowTextActive: { color: colors.onPrimaryContainer, fontWeight: typography.weights.bold },
});
