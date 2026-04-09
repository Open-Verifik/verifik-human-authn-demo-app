import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, gradients } from '../../constants/tokens';
import { persistMobileAuthSession } from '../../lib/authSession';
import {
  authSession,
  getProjectLoginAccessToken,
  getValidationLoginToken,
  projectLogin,
  validateEmailOTP,
  validatePhoneOTP,
  verifikConfig,
} from '@humanauthn/api-client';

const PROJECT_ID = verifikConfig.projectId;
const PROJECT_FLOW = verifikConfig.loginProjectFlowId;

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const router = useRouter();
  const { mode, value, validationId } = useLocalSearchParams<{
    mode: 'email' | 'phone';
    value: string;
    validationId: string;
  }>();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Auto focus first input
    setTimeout(() => inputs.current[0]?.focus(), 300);
  }, []);

  const handleChange = (text: string, index: number) => {
    // Handle paste — if user pastes 6 chars at once
    if (text.length > 1) {
      const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
      const newDigits = [...Array(OTP_LENGTH).fill('')];
      cleaned.split('').forEach((c, i) => { newDigits[i] = c; });
      setDigits(newDigits);
      const nextIndex = Math.min(cleaned.length, OTP_LENGTH - 1);
      setActiveIndex(nextIndex);
      inputs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = text.replace(/\D/g, '');
    setDigits(newDigits);
    setError('');

    if (text && index < OTP_LENGTH - 1) {
      setActiveIndex(index + 1);
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      setActiveIndex(index - 1);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      setError('Please enter all 6 digits');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    setError('');

    const dbgTok = (label: string, t: string) => {
      const row: { length: number; preview: string; full?: string } = {
        length: t.length,
        preview: `${t.slice(0, 20)}…${t.slice(-16)}`,
      };
      if (__DEV__) row.full = t;
      console.log(`[HumanAuthn auth][mobile] ${label}`, row);
    };

    try {
      const payload = mode === 'email'
        ? {
            otp,
            email: value,
            project: PROJECT_ID,
            projectFlow: PROJECT_FLOW,
            type: 'login' as const,
            validationMethod: 'verificationCode' as const,
          }
        : {
            otp,
            phone: value,
            project: PROJECT_ID,
            projectFlow: PROJECT_FLOW,
            type: 'login' as const,
            validationMethod: 'verificationCode' as const,
          };

      console.log('[HumanAuthn auth][mobile] Step 1/4: POST email|phone validate', {
        mode,
        project: PROJECT_ID,
        projectFlow: PROJECT_FLOW,
      });

      const fn = mode === 'email' ? validateEmailOTP : validatePhoneOTP;
      const res = await fn(payload);
      if (res.error) {
        console.log('[HumanAuthn auth][mobile] Step 1/4: validate FAILED', { error: res.error, statusCode: res.statusCode });
        throw new Error(res.error);
      }

      console.log('[HumanAuthn auth][mobile] Step 1/4: validate OK', {
        topLevelKeys: res.data && typeof res.data === 'object' ? Object.keys(res.data as object) : [],
        innerKeys:
          res.data && typeof res.data === 'object' && 'data' in res.data
            ? Object.keys((res.data as { data: object }).data ?? {})
            : [],
      });

      const validationToken = getValidationLoginToken(res.data);
      if (!validationToken) {
        console.log('[HumanAuthn auth][mobile] Step 2/4: skipped — no validation JWT');
        throw new Error('Invalid login response');
      }

      dbgTok('Step 2/4: validation JWT (use with project-login)', validationToken);

      console.log('[HumanAuthn auth][mobile] Step 2/4: POST /auth/project-login …');
      const pl = await projectLogin(validationToken);
      if (pl.error) {
        console.log('[HumanAuthn auth][mobile] Step 2/4: project-login FAILED', { error: pl.error, statusCode: pl.statusCode });
        throw new Error(pl.error);
      }

      console.log('[HumanAuthn auth][mobile] Step 2/4: project-login OK', {
        status: (pl.data as { status?: string })?.status,
        dataKeys:
          pl.data && typeof pl.data === 'object' && 'data' in pl.data && (pl.data as { data: object }).data
            ? Object.keys((pl.data as { data: object }).data)
            : [],
      });

      const accessToken = getProjectLoginAccessToken(pl.data);
      if (!accessToken) {
        console.log('[HumanAuthn auth][mobile] Step 3/4: skipped — no accessToken');
        throw new Error('Could not complete sign-in');
      }

      dbgTok('Step 3/4: session access JWT (from project-login)', accessToken);

      console.log('[HumanAuthn auth][mobile] Step 3/4: GET /auth/session?origin=app …');
      const sess = await authSession(accessToken, { origin: 'app' });
      if (sess.error) {
        console.log('[HumanAuthn auth][mobile] Step 3/4: session FAILED', { error: sess.error, statusCode: sess.statusCode });
        throw new Error(sess.error);
      }

      const user = sess.data?.user;
      const userId = user?._id != null ? String(user._id) : null;
      const finalToken = sess.data?.accessToken ?? accessToken;
      const email = typeof user?.email === 'string' ? user.email : undefined;
      const name = typeof user?.name === 'string' ? user.name : undefined;

      console.log('[HumanAuthn auth][mobile] Step 3/4: session OK', {
        hasUser: Boolean(user),
        userId,
        userKeys: user && typeof user === 'object' ? Object.keys(user) : [],
        hasSettings: sess.data?.settings != null,
        rotatedAccessToken: Boolean(sess.data?.accessToken),
      });

      dbgTok('Step 4/4: final stored access JWT', finalToken);

      await persistMobileAuthSession({
        accessToken: finalToken,
        userId,
        email,
        name,
      });

      console.log('[HumanAuthn auth][mobile] Step 4/4: AsyncStorage updated → success UI', {
        userId,
        email,
        name,
      });

      setSuccess(true);
      setTimeout(() => router.replace('/home'), 1800);
    } catch (err: any) {
      console.log('[HumanAuthn auth][mobile] flow FAILED', { message: err?.message ?? err });
      setError(err.message ?? 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskValue = (v: string, m: 'email' | 'phone') => {
    if (!v) return '••••';
    if (m === 'email') {
      const [user, domain] = v.split('@');
      return `${user.slice(0, 3)}•••@${domain}`;
    }
    return `${v.slice(0, 4)} •••• ${v.slice(-4)}`;
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={40} color={colors.primary} />
        </View>
        <Text style={styles.successTitle}>Verified!</Text>
        <Text style={styles.successSub}>Authentication successful. Redirecting…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconRing}>
          <Ionicons name="mail-open-outline" size={28} color={colors.primary} />
        </View>

        {/* Labels */}
        <Text style={styles.breadcrumb}>HumanAuthn · Verifik</Text>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.valueHighlight}>{maskValue(value ?? '', mode ?? 'email')}</Text>
        </Text>

        {/* OTP Digits */}
        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[
                styles.digit,
                activeIndex === i && styles.digitActive,
                !!d && styles.digitFilled,
                !!error && styles.digitError,
              ]}
              value={d}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              onFocus={() => setActiveIndex(i)}
              keyboardType="number-pad"
              maxLength={6} // Allow paste
              caretHidden
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Separator dots */}
        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.separators}>
            {Array(3).fill(null).map((_, i) => (
              <View key={i} style={[styles.sep, i === 1 && styles.sepCenter]} />
            ))}
          </View>
        )}

        {/* Verify CTA */}
        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={handleVerify}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient
            colors={gradients.primaryCta}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.verifyGradient}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimaryContainer} />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.onPrimaryContainer} />
                <Text style={styles.verifyText}>VERIFY & SIGN IN</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity style={styles.resendBtn} activeOpacity={0.7}>
          <Text style={styles.resendText}>Didn't receive a code? </Text>
          <Text style={styles.resendAction}>Resend</Text>
        </TouchableOpacity>

        {/* Security metadata */}
        <View style={styles.meta}>
          {[
            { icon: 'lock-closed-outline', text: '256-bit encrypted' },
            { icon: 'timer-outline', text: 'Expires in 5 min' },
            { icon: 'ban-outline', text: 'Single use only' },
          ].map((m) => (
            <View key={m.text} style={styles.metaItem}>
              <Ionicons name={m.icon as any} size={12} color={colors.outline} />
              <Text style={styles.metaText}>{m.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const DIGIT_SIZE = 52;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  backBtn: { padding: spacing.base },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.base,
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.2)',
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  breadcrumb: {
    color: colors.outline,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.tracking.wide,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.onSurface,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.black,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  valueHighlight: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  digit: {
    width: DIGIT_SIZE,
    height: DIGIT_SIZE + 8,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.2)',
    borderRadius: radius.lg,
    color: colors.onSurface,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  digitActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(38,66,255,0.08)',
  },
  digitFilled: {
    backgroundColor: 'rgba(195,192,255,0.06)',
  },
  digitError: { borderColor: colors.error },
  separators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  sep: {
    width: 32,
    height: 2,
    backgroundColor: 'rgba(42,58,88,0.2)',
    borderRadius: 1,
  },
  sepCenter: { backgroundColor: colors.primary },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  errorText: { color: colors.error, fontSize: typography.sizes.sm },
  verifyBtn: { borderRadius: radius.full, overflow: 'hidden', marginTop: spacing.lg },
  verifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base + 2,
  },
  verifyText: {
    color: colors.onPrimaryContainer,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.black,
    letterSpacing: typography.tracking.widest,
  },
  resendBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  resendText: { color: colors.outlineVariant, fontSize: typography.sizes.sm },
  resendAction: { color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  meta: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.sm,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.1)',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { color: colors.outline, fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  // Success state
  successContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing['3xl'],
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: 'rgba(195,192,255,0.1)',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  successTitle: {
    color: colors.onSurface,
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.black,
    letterSpacing: -1,
  },
  successSub: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: 22,
  },
});
