import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, typography, spacing, radius } from '../../constants/tokens';
import ScanLine from './ScanLine';

const CORNER_SIZE = 32;
const HERO_IMAGE = require('../../assets/images/splash-hero.jpg');

type SplashHeroFrameProps = {
  readinessLabel: string;
};

const PulsingDot = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false
    );
  }, [opacity]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.activeDot, dotStyle]} />;
};

export default function SplashHeroFrame({ readinessLabel }: SplashHeroFrameProps) {
  const { width } = useWindowDimensions();
  const heroHeight = width * 0.75;

  return (
    <View style={[styles.container, { height: heroHeight }]}>
      <View style={styles.imageClip}>
        <Image
          source={HERO_IMAGE}
          style={styles.heroImage}
          contentFit="cover"
          contentPosition="center"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.grayscaleOverlay} pointerEvents="none" />

        <LinearGradient
          colors={['rgba(1,3,51,0)', 'rgba(1,3,51,0.55)', colors.surface]}
          locations={[0.5, 0.75, 1]}
          style={styles.maskGradient}
          pointerEvents="none"
        />

        <View style={styles.overlay} pointerEvents="none">
          <ScanLine />
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      <View style={styles.readinessBadge}>
        <PulsingDot />
        <Text style={styles.readinessText}>{readinessLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.base,
    marginBottom: -spacing.xl,
  },
  imageClip: {
    flex: 1,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
    transform: [{ scale: 1.1 }],
  },
  grayscaleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(1,3,51,0.35)',
  },
  maskGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.surfaceTint,
  },
  cornerTL: {
    top: spacing.lg,
    left: spacing.lg,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    opacity: 0.6,
  },
  cornerTR: {
    top: spacing.lg,
    right: spacing.lg,
    borderTopWidth: 2,
    borderRightWidth: 2,
    opacity: 0.6,
  },
  cornerBL: {
    bottom: spacing.lg,
    left: spacing.lg,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    opacity: 0.3,
  },
  cornerBR: {
    bottom: spacing.lg,
    right: spacing.lg,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    opacity: 0.3,
  },
  readinessBadge: {
    position: 'absolute',
    bottom: spacing['2xl'],
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(23,23,23,0.6)',
    paddingHorizontal: spacing.base + 4,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  readinessText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.tracking.wide,
    textTransform: 'uppercase',
  },
});
