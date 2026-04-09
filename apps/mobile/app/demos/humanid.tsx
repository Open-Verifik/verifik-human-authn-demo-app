import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, gradients } from '../../constants/tokens';

type FlowState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

export default function HumanIDScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<FlowState>('idle');
  const [confidence, setConfidence] = useState(0);

  const startScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setState('scanning');

    // Simulate liveness processing (replace with real biometric SDK call)
    setTimeout(() => setState('processing'), 3500);
    setTimeout(() => {
      setConfidence(Math.round(92 + Math.random() * 7));
      setState('success');
    }, 6000);
  };

  const reset = () => { setState('idle'); setConfidence(0); };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="finger-print" size={18} color={colors.primary} />
            <Text style={styles.headerTitle}>HumanID</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <Text style={styles.breadcrumb}>HumanAuthn · Verifik</Text>
        <Text style={styles.title}>
          {state === 'idle' ? 'HumanID\nBiometric Login' :
           state === 'scanning' ? 'Hold Steady…' :
           state === 'processing' ? 'Processing…' :
           state === 'success' ? 'Identity\nVerified' : 'Verification\nFailed'}
        </Text>

        {/* Circular Viewfinder */}
        <View style={styles.viewfinderWrapper}>
          {/* Outer scanning ring */}
          <View style={[
            styles.ring,
            state === 'scanning' && styles.ringScan,
            state === 'success' && styles.ringSuccess,
          ]}>
            {/* Camera or placeholder */}
            <View style={styles.viewfinder}>
              {(state === 'scanning' || state === 'processing') && permission?.granted ? (
                <CameraView style={styles.camera} facing="front" />
              ) : (
                <View style={styles.viewfinderPlaceholder}>
                  {state === 'idle' && (
                    <Ionicons name="person-outline" size={64} color={colors.outlineVariant} style={{ opacity: 0.3 }} />
                  )}
                  {state === 'success' && (
                    <Ionicons name="checkmark" size={64} color={colors.primary} />
                  )}
                  {state === 'error' && (
                    <Ionicons name="close" size={64} color={colors.error} />
                  )}
                  {state === 'processing' && (
                    <ActivityIndicator size="large" color={colors.primary} />
                  )}
                </View>
              )}
            </View>
          </View>

          {/* HUD dots — decorative */}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <View key={deg} style={[styles.hudDot, {
              transform: [
                { rotate: `${deg}deg` },
                { translateY: -115 },
              ],
            }]} />
          ))}
        </View>

        {/* Status text */}
        <Text style={styles.statusText}>
          {state === 'idle' ? 'Center your face in the ring' :
           state === 'scanning' ? 'Slow blink to confirm liveness' :
           state === 'processing' ? 'Comparing biometric signature…' :
           state === 'success' ? `Confidence: ${confidence}%` :
           'Please try again in better lighting'}
        </Text>

        {/* Confidence bar — only on success */}
        {state === 'success' && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${confidence}%` as any }]} />
          </View>
        )}

        {/* CTA */}
        {state === 'idle' && (
          <TouchableOpacity style={styles.cta} onPress={startScan} activeOpacity={0.85}>
            <LinearGradient colors={gradients.primaryCta} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.ctaGradient}>
              <Ionicons name="scan-circle-outline" size={20} color={colors.onPrimaryContainer} />
              <Text style={styles.ctaText}>BEGIN HUMANID SCAN</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {state === 'success' && (
          <>
            <TouchableOpacity style={styles.successCta} onPress={() => router.replace('/home')} activeOpacity={0.85}>
              <LinearGradient colors={gradients.primaryCta} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.ctaGradient}>
                <Text style={styles.ctaText}>CONTINUE TO APP</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.onPrimaryContainer} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} style={styles.retryLink}>
              <Text style={styles.retryText}>Scan again</Text>
            </TouchableOpacity>
          </>
        )}

        {state === 'error' && (
          <TouchableOpacity style={styles.cta} onPress={reset} activeOpacity={0.8}>
            <View style={styles.retryBtn}>
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={styles.retryBtnText}>Try Again</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Security badges */}
        {state === 'idle' && (
          <View style={styles.badges}>
            {['ISO 30107-3', 'Level 2 PAD', 'AES-256'].map((b) => (
              <View key={b} style={styles.badge}>
                <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
                <Text style={styles.badgeText}>{b}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const RING = 220;
const VIEWPORT = 180;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing.base },
  backBtn: { padding: spacing.base },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginRight: spacing['3xl'] },
  headerTitle: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.md,
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
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.black,
    letterSpacing: -1,
    textAlign: 'center',
    lineHeight: typography.sizes['4xl'] * 1.05,
  },
  viewfinderWrapper: {
    width: RING + 20,
    height: RING + 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderColor: 'rgba(42,58,88,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScan: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  ringSuccess: {
    borderColor: '#4ade80',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  viewfinder: {
    width: VIEWPORT,
    height: VIEWPORT,
    borderRadius: VIEWPORT / 2,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
  },
  viewfinderPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: { flex: 1 },
  hudDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    opacity: 0.4,
    top: '50%',
    left: '50%',
    marginLeft: -2.5,
    marginTop: -2.5,
  },
  statusText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.full,
  },
  cta: { width: '100%', borderRadius: radius.full, overflow: 'hidden' },
  successCta: { width: '100%', borderRadius: radius.full, overflow: 'hidden' },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base + 2,
  },
  ctaText: {
    color: colors.onPrimaryContainer,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.black,
    letterSpacing: typography.tracking.wide,
  },
  retryLink: { paddingVertical: spacing.sm },
  retryText: { color: colors.outlineVariant, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(42,58,88,0.15)',
  },
  retryBtnText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs, borderRadius: radius.md,
  },
  badgeText: { color: colors.onSurface, fontSize: 9, fontWeight: typography.weights.semibold, letterSpacing: 0.5, textTransform: 'uppercase' },
});
