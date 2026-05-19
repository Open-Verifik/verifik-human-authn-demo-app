import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { initI18n } from '../lib/i18n';
import { colors } from '../constants/tokens';

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('[i18n] init timed out — rendering with fallback locale');
        setReady(true);
      }
    }, 12000);

    initI18n()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((error) => {
        console.error('[i18n] init failed', error);
        if (!cancelled) setReady(true);
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
