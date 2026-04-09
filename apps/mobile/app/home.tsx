import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, gradients } from '../constants/tokens';
import {
  getMobileAuthSession,
  signOutMobile,
  type MobileAuthSession,
} from '../lib/authSession';

const { width } = Dimensions.get('window');
const CARD_W = (width - spacing.xl * 2 - spacing.md) / 2;

const demos = [
  {
    id: 'face-comparison',
    route: '/demos/face-comparison',
    icon: 'scan-circle-outline',
    version: 'v2.4.0',
    title: 'Face Comparison',
    desc: 'Two photos, same person or not. Handy for onboarding and ID checks.',
    accent: colors.primaryContainer,
  },
  {
    id: 'face-comparison-liveness',
    route: '/demos/face-comparison-liveness',
    icon: 'people-circle-outline',
    version: 'SEQ',
    title: 'Compare with liveness',
    desc: 'Match a reference to a live selfie. Liveness runs after the match looks good.',
    accent: colors.primaryContainer,
  },
  {
    id: 'liveness',
    route: '/demos/liveness',
    icon: 'shield-checkmark-outline',
    version: 'Active',
    title: 'Liveness Detection',
    desc: 'Prove a real person is there, not a photo or replay.',
    accent: colors.primaryContainer,
  },
  {
    id: 'humanid',
    route: '/demos/humanid',
    icon: 'finger-print',
    version: 'HumanID',
    title: 'HumanID Login',
    desc: 'Sign in with your face in a ring guide, liveness included.',
    accent: colors.primaryContainer,
  },
  {
    id: 'face-detection',
    route: '/demos/face-detection',
    icon: 'eye-outline',
    version: 'Live',
    title: 'Face Detection',
    desc: 'Live highlights when faces show up in the camera.',
    accent: colors.primaryContainer,
  },
] as const;

function initials(name: string | undefined, email: string | undefined): string {
  const s = (name || email || '?').trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return s.slice(0, 2).toUpperCase();
}

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [session, setSession] = useState<MobileAuthSession | null | undefined>(undefined);
  const [accountOpen, setAccountOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const s = await getMobileAuthSession();
        if (!cancelled) setSession(s);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const displayName =
    session?.name?.trim() || session?.email?.trim() || 'Account';

  const handleSignOut = async () => {
    setAccountOpen(false);
    await signOutMobile();
    setSession(null);
  };

  const authSlot = () => {
    if (session === undefined) {
      return (
        <View style={styles.authSkeleton} accessibilityLabel="Loading account" />
      );
    }
    if (!session) {
      return (
        <TouchableOpacity
          style={styles.signInBtn}
          onPress={() => router.push('/auth')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradients.primaryCtaTtb}
            style={styles.signInGradient}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={styles.accountTrigger}
        onPress={() => setAccountOpen(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Account menu"
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initials(session.name, session.email)}
          </Text>
        </View>
        <Text style={styles.accountName} numberOfLines={1}>
          {displayName}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Top Nav ────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <Ionicons name="finger-print" size={22} color={colors.primary} />
            <Text style={styles.logoText}>HumanAuthn</Text>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>by Verifik</Text>
            </View>
          </View>
          {authSlot()}
        </View>
      </SafeAreaView>

      <Modal
        visible={accountOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setAccountOpen(false)}>
          <Pressable style={styles.menuPanel} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuName} numberOfLines={2}>
              {displayName}
            </Text>
            {session?.email ? (
              <Text style={styles.menuEmail} numberOfLines={2}>
                {session.email}
              </Text>
            ) : null}
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                setAccountOpen(false);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={18} color={colors.onSurfaceVariant} />
              <Text style={styles.menuRowLabel}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuRowSignOut}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={styles.menuRowSignOutLabel}>Sign out</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ────────────────────────────────────── */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Biometric Sandbox · Verifik APIs</Text>
          <Text style={styles.heroHeadline}>
            Precision{' '}
            <Text style={styles.heroGradientText}>Authentication</Text>
            {'\n'}Demos
          </Text>
          <Text style={styles.heroBody}>
            Experience the next generation of identity verification.
            Our biometric platform provides high-fidelity tools for secure,
            frictionless human authentication.
          </Text>
        </View>

        {/* ── Bento Demo Grid ──────────────────────────── */}
        <View style={styles.grid}>
          {demos.map((demo) => (
            <TouchableOpacity
              key={demo.id}
              style={styles.demoCard}
              onPress={() => router.push(demo.route as any)}
              activeOpacity={0.8}
            >
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={styles.iconBg}>
                  <Ionicons name={demo.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={styles.cardVersion}>{demo.version}</Text>
              </View>
              {/* Card body */}
              <Text style={styles.cardTitle}>{demo.title}</Text>
              <Text style={styles.cardDesc}>{demo.desc}</Text>
              <View style={styles.cardCta}>
                <Text style={styles.cardCtaText}>RUN DEMO</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Enterprise Banner ─────────────────────────── */}
        <View style={styles.enterprise}>
          <LinearGradient
            colors={['rgba(38,66,255,0.14)', 'rgba(1,3,51,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.enterpriseGradient}
          >
            <Text style={styles.enterpriseLabel}>Verifik Platform</Text>
            <Text style={styles.enterpriseTitle}>Enterprise Grade Security</Text>
            <Text style={styles.enterpriseBody}>
              End-to-end encryption, GDPR compliant, AES-256 — built for production-grade identity deployments.
            </Text>
            <View style={styles.enterpriseBadges}>
              {['GDPR', 'AES-256', 'SOC 2'].map((badge) => (
                <View key={badge} style={styles.badge}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: spacing['4xl'] }} />
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomInset} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: 'rgba(1,3,51,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42,58,88,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    letterSpacing: -0.5,
  },
  logoBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  logoBadgeText: {
    color: colors.outline,
    fontSize: 9,
    fontWeight: typography.weights.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  signInBtn: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  signInGradient: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  signInText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  authSkeleton: {
    width: 96,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerHigh,
  },
  accountTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: '52%',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.2)',
    backgroundColor: colors.surfaceContainerHigh,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.onPrimaryContainer,
  },
  accountName: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.onSurface,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingTop: 56,
    alignItems: 'flex-end',
    paddingRight: spacing.base,
  },
  menuPanel: {
    minWidth: 260,
    borderRadius: radius.xl,
    padding: spacing.base,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.15)',
  },
  menuName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.onSurface,
  },
  menuEmail: {
    marginTop: 4,
    fontSize: typography.sizes.xs,
    color: colors.onSurfaceVariant,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(42,58,88,0.2)',
    marginVertical: spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  menuRowLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.onSurface,
  },
  menuRowSignOut: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  menuRowSignOutLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.error,
  },
  scroll: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  hero: {
    marginBottom: spacing['2xl'],
    gap: spacing.md,
  },
  heroLabel: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.tracking.wider,
    textTransform: 'uppercase',
  },
  heroHeadline: {
    color: colors.onSurface,
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.black,
    letterSpacing: -1,
    lineHeight: typography.sizes['4xl'] * 1.1,
  },
  heroGradientText: {
    color: colors.primary,
  },
  heroBody: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  demoCard: {
    width: CARD_W,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconBg: {
    width: 40,
    height: 40,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardVersion: {
    color: colors.outline,
    fontSize: typography.sizes.xs - 1,
    fontFamily: typography.fontFamily.mono,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTitle: {
    color: colors.onSurface,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.3,
  },
  cardDesc: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  cardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  cardCtaText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.tracking.wide,
  },
  enterprise: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.15)',
  },
  enterpriseGradient: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  enterpriseLabel: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.tracking.wider,
    textTransform: 'uppercase',
  },
  enterpriseTitle: {
    color: colors.onSurface,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
  },
  enterpriseBody: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  enterpriseBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  badgeText: {
    color: colors.onSurface,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bottomInset: {
    backgroundColor: 'rgba(1,3,51,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(42,58,88,0.1)',
  },
});
