import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { spacing } from '../../constants/tokens';
import { DemoButton } from '../ui';

type Props = {
  onReset: () => void;
  tryAgainLabel?: string;
  resetLabel?: string;
};

export default function DemoResultActions({ onReset, tryAgainLabel, resetLabel }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.column}>
      <DemoButton
        label={t('demos.common.backToDemos')}
        onPress={() => router.push('/home')}
        variant="primary"
        fullWidth
      />
      <DemoButton
        label={tryAgainLabel ?? resetLabel ?? t('demos.common.createAnother', { defaultValue: 'Try again' })}
        onPress={onReset}
        variant="secondary"
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: spacing.md,
  },
});
