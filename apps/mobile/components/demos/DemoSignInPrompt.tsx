import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radius, ghostBorderColor } from '../../constants/tokens';
import { DemoButton } from '../ui';

export default function DemoSignInPrompt() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {t('demos.common.signInRequiredTitle', { defaultValue: 'Sign in required' })}
      </Text>
      <Text style={styles.body}>
        {t('demos.common.signInRequiredBody', {
          defaultValue: 'Sign in from Home to run this demo with your Verifik session.',
        })}
      </Text>
      <DemoButton
        label={t('HomeHeader.signIn', { defaultValue: 'Sign In' })}
        onPress={() => router.push('/auth')}
        variant="primary"
        size="sm"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: ghostBorderColor,
    backgroundColor: colors.surfaceContainerLow,
    gap: spacing.md,
  },
  title: {
    color: colors.onSurface,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  body: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});
