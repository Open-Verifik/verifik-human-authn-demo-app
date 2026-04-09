import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, gradients } from '../../constants/tokens';
import { verifikConfig } from '@humanauthn/api-client';

const VERIFIK_BASE = `${verifikConfig.apiUrl}/v2`;
const PROJECT_ID = verifikConfig.projectId;
const PROJECT_FLOW = verifikConfig.loginProjectFlowId;

type AuthMode = 'email' | 'phone';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('email');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    setError('');
    if (!value.trim()) {
      setError(mode === 'email' ? 'Enter a valid email address' : 'Enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === 'email'
        ? `${VERIFIK_BASE}/email-validations`
        : `${VERIFIK_BASE}/phone-validations`;

      const body = mode === 'email'
        ? { email: value.trim(), project: PROJECT_ID, projectFlow: PROJECT_FLOW, type: 'login', validationMethod: 'verificationCode', language: 'en' }
        : { phone: value.trim(), project: PROJECT_ID, projectFlow: PROJECT_FLOW, type: 'login', validationMethod: 'verificationCode', language: 'en' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to send code');

      // Navigate to OTP, passing identifiers
      router.push({ pathname: '/auth/otp', params: { mode, value: value.trim(), validationId: data?._id ?? '' } });
    } catch (err: any) {
      setError(err.message ?? 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.iconHeader}>
          <View style={styles.iconRing}>
            <Ionicons name="lock-closed-outline" size={28} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.breadcrumb}>HumanAuthn · Verifik</Text>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>
          Enter your {mode === 'email' ? 'email' : 'phone number'} to receive a secure verification code.
        </Text>

        {/* Mode Toggle */}
        <View style={styles.toggle}>
          {(['email', 'phone'] as AuthMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
              onPress={() => { setMode(m); setValue(''); setError(''); }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={m === 'email' ? 'mail-outline' : 'call-outline'}
                size={16}
                color={mode === m ? colors.white : colors.outline}
              />
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                {m === 'email' ? 'Email' : 'Phone'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {mode === 'email' ? 'Email Address' : 'Phone Number'}
          </Text>
          <TextInput
            style={[styles.input, !!error && styles.inputError]}
            value={value}
            onChangeText={(t) => { setValue(t); setError(''); }}
            placeholder={mode === 'email' ? 'you@company.com' : '+1 (555) 000-0000'}
            placeholderTextColor={colors.outline}
            keyboardType={mode === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          {!!error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient
            colors={gradients.primaryCta}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sendGradient}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimaryContainer} />
            ) : (
              <>
                <Text style={styles.sendText}>Send Verification Code</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.onPrimaryContainer} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or authenticate with biometrics</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Biometric CTA */}
        <TouchableOpacity
          style={styles.biometricBtn}
          onPress={() => router.push('/demos/humanid')}
          activeOpacity={0.8}
        >
          <Ionicons name="scan-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.biometricText}>Continue with HumanID</Text>
        </TouchableOpacity>

        {/* Footer metadata */}
        <View style={styles.footer}>
          {[
            { label: 'Encryption', value: 'AES-256' },
            { label: 'Powered by', value: 'Verifik' },
            { label: 'Protocol', value: 'HumanAuthn v1' },
          ].map((item) => (
            <View key={item.label} style={styles.footerItem}>
              <Text style={styles.footerLabel}>{item.label}</Text>
              <Text style={styles.footerValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  safeTop: { backgroundColor: colors.surface },
  backBtn: { padding: spacing.base },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'] },
  iconHeader: { alignItems: 'flex-start', marginBottom: spacing.base },
  iconRing: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.2)',
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breadcrumb: {
    color: colors.outline,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.tracking.wide,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.black,
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.xl,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryContainer,
  },
  toggleText: {
    color: colors.outline,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  toggleTextActive: { color: colors.white },
  inputGroup: { gap: spacing.sm, marginBottom: spacing.xl },
  inputLabel: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.2)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    color: colors.onSurface,
    fontSize: typography.sizes.md,
  },
  inputError: { borderColor: colors.error },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  errorText: { color: colors.error, fontSize: typography.sizes.sm },
  sendBtn: { borderRadius: radius.full, overflow: 'hidden', marginBottom: spacing.xl },
  sendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base + 2,
  },
  sendText: {
    color: colors.onPrimaryContainer,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(42,58,88,0.2)' },
  dividerText: { color: colors.outlineVariant, fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.15)',
    marginBottom: spacing['2xl'],
  },
  biometricText: { color: colors.onSurface, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.1)',
  },
  footerItem: { alignItems: 'center', gap: 2 },
  footerLabel: { color: colors.outline, fontSize: typography.sizes.xs - 1, letterSpacing: 0.5, textTransform: 'uppercase' },
  footerValue: { color: colors.onSurface, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
});
