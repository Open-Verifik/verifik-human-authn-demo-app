import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../constants/tokens';

const DURATION_MS = 3000;

/** Matches web `.scan-line` / `@keyframes scanAnim` (3s vertical sweep). */
export default function ScanLine() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: DURATION_MS, easing: Easing.linear }),
      -1,
      false
    );
  }, [progress]);

  const lineStyle = useAnimatedStyle(() => {
    const topPct = 0.2 + progress.value * 0.6;
    let opacity = 1;
    if (progress.value < 0.2) {
      opacity = progress.value / 0.2;
    } else if (progress.value > 0.8) {
      opacity = (1 - progress.value) / 0.2;
    }
    return {
      top: `${topPct * 100}%`,
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.line, lineStyle]} pointerEvents="none">
      <Animated.View style={styles.glow} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    zIndex: 28,
    backgroundColor: colors.surfaceTint,
    shadowColor: colors.surfaceTint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 15,
    elevation: 8,
  },
  glow: {
    flex: 1,
    opacity: 0.9,
  },
});
