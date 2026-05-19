import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const PULSE_SIZE = 600;

/** Subtle neutral glow for splash/auth hero. */
export default function AuthPulseGlow() {
  return (
    <View style={styles.wrapper} pointerEvents="none">
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)', 'rgba(10,10,10,0)']}
        locations={[0, 0.4, 0.7]}
        style={styles.outer}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.04)', 'rgba(10,10,10,0)']}
        locations={[0, 0.6]}
        style={styles.inner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: -PULSE_SIZE * 0.15,
    left: width / 2 - PULSE_SIZE / 2,
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PULSE_SIZE / 2,
    opacity: 0.85,
  },
  inner: {
    width: PULSE_SIZE * 0.7,
    height: PULSE_SIZE * 0.7,
    borderRadius: (PULSE_SIZE * 0.7) / 2,
    opacity: 0.6,
  },
});
