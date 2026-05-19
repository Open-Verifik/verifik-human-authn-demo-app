import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { DemoButton } from '../../components/ui';
import {
  authSession,
  getUpdatedClientFromPutResponse,
  updateClient,
} from '@humanauthn/api-client';
import { colors, typography, spacing, radius } from '../../constants/tokens';
import { getMobileAuthSession, persistMobileAuthSession } from '../../lib/authSession';

type FormState = {
  name: string;
  email: string;
  company: string;
  address: string;
  phone: string;
};

export default function SettingsProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    company: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await getMobileAuthSession();
      if (!session?.accessToken) {
        if (!cancelled) {
          setLoadError(t('settingsProfile.errorNotSignedIn'));
          setLoaded(true);
        }
        return;
      }
      setToken(session.accessToken);
      setUserId(session.userId);
      const sess = await authSession(session.accessToken, { origin: 'app' });
      if (cancelled) return;
      if (sess.error) {
        setLoadError(sess.error);
        setLoaded(true);
        return;
      }
      const user = sess.data?.user;
      if (!user || typeof user !== 'object') {
        setLoadError(t('settingsProfile.errorLoadProfile'));
        setLoaded(true);
        return;
      }
      const u = user as Record<string, unknown>;
      setForm({
        name: typeof u.name === 'string' ? u.name : '',
        email: typeof u.email === 'string' ? u.email : '',
        company: typeof u.company === 'string' ? u.company : '',
        address: typeof u.address === 'string' ? u.address : '',
        phone: typeof u.phone === 'string' ? u.phone : '',
      });
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const onSubmit = async () => {
    if (!token || !userId) {
      setSaveError(t('settingsProfile.errorNotSignedIn'));
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    const res = await updateClient(token, userId, {
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim() || undefined,
      address: form.address.trim() || undefined,
    });
    setSaving(false);
    if (res.error) {
      setSaveError(res.error);
      return;
    }
    const updated = getUpdatedClientFromPutResponse(res.data);
    const session = await getMobileAuthSession();
    if (session) {
      await persistMobileAuthSession({
        ...session,
        name: typeof updated?.name === 'string' ? updated.name : form.name,
        email: typeof updated?.email === 'string' ? updated.email : form.email,
        credits:
          typeof updated?.credits === 'number'
            ? updated.credits
            : session.credits ?? null,
      });
    }
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 3000);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settingsProfile.title')}</Text>
      </SafeAreaView>

      {!loaded ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : loadError ? (
        <Text style={styles.error}>{loadError}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.subtitle}>{t('settingsProfile.subtitle')}</Text>
          <Text style={styles.label}>{t('settingsProfile.labelFullName')}</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          />
          <Text style={styles.label}>{t('settingsProfile.labelEmail')}</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>{t('settingsProfile.labelPhone')}</Text>
          <TextInput style={[styles.input, styles.readonly]} value={form.phone} editable={false} />
          <Text style={styles.label}>{t('settingsProfile.labelCompany')}</Text>
          <TextInput
            style={styles.input}
            value={form.company}
            onChangeText={(v) => setForm((f) => ({ ...f, company: v }))}
          />
          <Text style={styles.label}>{t('settingsProfile.labelAddress')}</Text>
          <TextInput
            style={styles.input}
            value={form.address}
            onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
          />
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          {saveOk ? <Text style={styles.ok}>{t('settingsProfile.saveSuccess')}</Text> : null}
          <DemoButton
            label={saving ? t('settingsProfile.saveSaving') : t('settingsProfile.save')}
            onPress={onSubmit}
            disabled={saving}
            loading={saving}
            fullWidth
          />
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/settings/api-key')}>
            <Text style={styles.link}>{t('settingsApiKey.pageTitle')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/settings/language')}>
            <Text style={styles.link}>{t('LanguageSwitcher.ariaLabel')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      )}
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
  scroll: { padding: spacing.base, gap: spacing.sm, paddingBottom: spacing['4xl'] },
  subtitle: { color: colors.onSurfaceVariant, marginBottom: spacing.md },
  label: { color: colors.onSurface, fontWeight: typography.weights.semibold, fontSize: typography.sizes.sm },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    marginBottom: spacing.sm,
  },
  readonly: { opacity: 0.7 },
  error: { color: colors.error, marginVertical: spacing.sm },
  ok: { color: colors.primary, marginVertical: spacing.sm },
  cta: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  ctaText: { color: colors.white, fontWeight: typography.weights.bold },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    marginTop: spacing.md,
  },
  link: { color: colors.primary, fontWeight: typography.weights.semibold },
});
