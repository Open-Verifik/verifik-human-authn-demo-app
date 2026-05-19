import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { DemoButton } from '../../components/ui';
import {
  authSessionRefresh,
  getAccessTokenFromSessionBody,
  getTokenFromRenewAndRevoke,
  renewAndRevokeToken,
} from '@humanauthn/api-client';
import { colors, typography, spacing, radius, ghostBorderColor } from '../../constants/tokens';
import DemoConfirmModal from '../../components/demos/DemoConfirmModal';
import {
  getMobileAuthSession,
  updateMobileSessionToken,
} from '../../lib/authSession';

const EXPIRATION_MONTHS = [1, 2, 3, 6, 12, 24, 36] as const;

const maskToken = (token: string): string => {
  if (!token) return '';
  const visible = 12;
  if (token.length <= visible * 2) return '•'.repeat(token.length);
  return `${token.slice(0, visible)}${'•'.repeat(12)}${token.slice(-visible)}`;
};

export default function SettingsApiKeyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [token, setToken] = useState<string | null>(null);
  const [hideToken, setHideToken] = useState(true);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showRenew, setShowRenew] = useState(false);
  const [showRevoke, setShowRevoke] = useState(false);
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getMobileAuthSession().then((s) => setToken(s?.accessToken ?? null));
  }, []);

  const display = newToken ?? token ?? '';

  const copyToken = async () => {
    const value = newToken ?? token;
    if (!value) return;
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renew = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    const res = await authSessionRefresh(token, months);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    const next = getAccessTokenFromSessionBody(res.data);
    if (!next) {
      setError(t('settingsApiKey.errorNoToken'));
      return;
    }
    await updateMobileSessionToken(next);
    setToken(next);
    setNewToken(next);
    setHideToken(false);
    setShowRenew(false);
  };

  const revoke = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    const res = await renewAndRevokeToken(token);
    setBusy(false);
    setShowRevoke(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    const next = getTokenFromRenewAndRevoke(res.data);
    if (!next) {
      setError(t('settingsApiKey.errorNoToken'));
      return;
    }
    await updateMobileSessionToken(next);
    setToken(next);
    setNewToken(next);
    setHideToken(false);
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settingsApiKey.pageTitle')}</Text>
        </SafeAreaView>
        <Text style={styles.prompt}>{t('settingsApiKey.signInPrompt')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settingsApiKey.pageTitle')}</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>{t('settingsApiKey.pageSubtitle')}</Text>

        <View style={styles.tokenBox}>
          <Text style={styles.token} selectable>
            {hideToken ? maskToken(display) : display}
          </Text>
          <View style={styles.tokenActions}>
            <TouchableOpacity onPress={() => setHideToken((h) => !h)}>
              <Ionicons
                name={hideToken ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={copyToken}>
              <Ionicons name="copy-outline" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>
        {copied ? <Text style={styles.ok}>{t('settingsApiKey.copied')}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!showRenew ? (
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowRenew(true)}>
            <Text style={styles.outlineBtnText}>{t('settingsApiKey.extendValidity')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('settingsApiKey.expiration')}</Text>
            <View style={styles.monthRow}>
              {EXPIRATION_MONTHS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.monthChip, months === m && styles.monthChipActive]}
                  onPress={() => setMonths(m)}
                >
                  <Text style={[styles.monthText, months === m && styles.monthTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <DemoButton
              label={t('settingsApiKey.renewNow')}
              onPress={renew}
              disabled={busy}
              loading={busy}
              fullWidth
            />
          </View>
        )}

        <TouchableOpacity style={styles.dangerBtn} onPress={() => setShowRevoke(true)}>
          <Text style={styles.dangerBtnText}>{t('settingsApiKey.revokeAction')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <DemoConfirmModal
        visible={showRevoke}
        title={t('settingsApiKey.revokeTitle')}
        message={t('settingsApiKey.revokeWarning')}
        confirmLabel={t('settingsApiKey.confirmRevoke')}
        destructive
        onCancel={() => setShowRevoke(false)}
        onConfirm={revoke}
      />
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
  scroll: { padding: spacing.base, gap: spacing.md, paddingBottom: spacing['4xl'] },
  subtitle: { color: colors.onSurfaceVariant },
  prompt: { color: colors.onSurfaceVariant, padding: spacing.base },
  tokenBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  token: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.sizes.xs,
    color: colors.onSurface,
    lineHeight: 18,
  },
  tokenActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  ok: { color: colors.primary, fontSize: typography.sizes.sm },
  error: { color: colors.error },
  outlineBtn: {
    borderWidth: 1,
    borderColor: ghostBorderColor,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  outlineBtnText: { color: colors.onSurface, fontWeight: typography.weights.bold },
  panel: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  panelTitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  monthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  monthChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  monthChipActive: { borderColor: 'rgba(255,255,255,0.25)', backgroundColor: colors.surfaceContainerHigh },
  monthText: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm },
  monthTextActive: { color: colors.onSurface, fontWeight: typography.weights.bold },
  cta: { paddingVertical: spacing.md, borderRadius: radius.lg, alignItems: 'center' },
  ctaText: { color: colors.white, fontWeight: typography.weights.bold },
  dangerBtn: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerBtnText: { color: colors.error, fontWeight: typography.weights.bold },
});
