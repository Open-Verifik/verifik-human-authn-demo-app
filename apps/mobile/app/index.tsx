import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, gradients } from '../constants/tokens';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* ── Auth Pulse BG glow ──────────────────────────── */}
      <View style={styles.pulseGlow} pointerEvents="none" />

      {/* ── Hero image with HUD overlay ─────────────────── */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfmJQC0Xpka4crIYxjI6Dta1wZKYOC3NetOpAIWsnR8CI07aOICUI0zrYPJAvYCJ1hYMPHUV7IY5QO1n0HLJRLjum3d9MqvhVobgtRE7eK6MLw6IA5H2aLpDPxaaFl_PTd3zwMfhfnNB6I2FRnze3T7cMcSb2dw2H6NBVBtPKHGMPSV2Z_Vw_9lGYouvrK7u54dT6j936Hz--LNGujRL4hII3NQeS0Zx9MpEIirboEOU2ZsIAV7qGhKxwfj-WR6Nmr90aU9mtx0c8' }}
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* Gradient overlay bottom → transparent */}
        <LinearGradient
          colors={['rgba(1,3,51,0)', 'rgba(1,3,51,0.7)', '#010333']}
          style={styles.heroGradient}
        />

        {/* HUD Scanner corners */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Biometric Readiness badge */}
        <View style={styles.readinessBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.readinessText}>BIOMETRIC READINESS: ACTIVE</Text>
        </View>
      </View>

      {/* ── Content ─────────────────────────────────────── */}
      <SafeAreaView style={styles.content} edges={['bottom']}>
        {/* Pill badge */}
        <View style={styles.pillBadge}>
          <Text style={styles.pillText}>Verifik · HumanAuthn</Text>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>Human{'\n'}Authn</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Securely authenticate with liveness detection.{'\n'}The gold standard for digital access.
        </Text>

        {/* CTAs */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={() => router.push('/auth')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={gradients.primaryCta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryCtaGradient}
            >
              <Text style={styles.primaryCtaText}>GET STARTED</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onPrimaryContainer} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={() => router.push('/home')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryCtaText}>EXPLORE DEMOS  →</Text>
          </TouchableOpacity>
        </View>

        {/* Trust indicators */}
        <View style={styles.trust}>
          {['shield-checkmark-outline', 'finger-print', 'eye-outline', 'person-circle-outline'].map((icon) => (
            <Ionicons key={icon} name={icon as any} size={22} color={colors.outlineVariant} style={{ opacity: 0.4 }} />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const CORNER_SIZE = 22;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  pulseGlow: {
    position: 'absolute',
    top: -100,
    left: width / 2 - 200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(38,66,255,0.10)',
    // RN doesn't have CSS blur — approximated with large radius
  },
  heroContainer: {
    width: '100%',
    height: height * 0.5,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  // Scanner corners
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.surfaceTint,
  },
  cornerTL: {
    top: 28, left: 28,
    borderTopWidth: 2, borderLeftWidth: 2,
  },
  cornerTR: {
    top: 28, right: 28,
    borderTopWidth: 2, borderRightWidth: 2,
  },
  cornerBL: {
    bottom: 48, left: 28,
    borderBottomWidth: 2, borderLeftWidth: 2,
    opacity: 0.4,
  },
  cornerBR: {
    bottom: 48, right: 28,
    borderBottomWidth: 2, borderRightWidth: 2,
    opacity: 0.4,
  },
  readinessBadge: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(1,3,51,0.6)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.2)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceTint,
  },
  readinessText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.tracking.wide,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
    gap: spacing.lg,
  },
  pillBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.2)',
  },
  pillText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.tracking.wide,
    textTransform: 'uppercase',
  },
  headline: {
    color: colors.white,
    fontSize: typography.sizes['5xl'],
    fontWeight: typography.weights.black,
    letterSpacing: typography.tracking.editorial,
    lineHeight: typography.sizes['5xl'] * 1.0,
  },
  tagline: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.md,
    lineHeight: 24,
    fontWeight: typography.weights.medium,
  },
  ctaContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryCta: {
    borderRadius: radius.full,
    overflow: 'hidden',
    shadowColor: '#2642FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryCtaGradient: {
    paddingVertical: spacing.base + 2,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryCtaText: {
    color: colors.onPrimaryContainer,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.black,
    letterSpacing: typography.tracking.widest,
  },
  secondaryCta: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryCtaText: {
    color: colors.outlineVariant,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.tracking.widest,
  },
  trust: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.sm,
  },
});
