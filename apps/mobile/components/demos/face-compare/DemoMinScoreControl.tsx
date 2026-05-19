import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../../../constants/tokens';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
};

/** Stepped numeric control (mobile substitute for web range sliders). */
export default function DemoMinScoreControl({ label, value, onChange, min, max, step = 0.01 }: Props) {
  const adjust = (delta: number) => {
    const next = Math.round((value + delta) * 100) / 100;
    onChange(Math.min(max, Math.max(min, next)));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => adjust(-step)} accessibilityRole="button">
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.value}>{value.toFixed(2)}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => adjust(step)} accessibilityRole="button">
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  label: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  btnText: { color: colors.onSurface, fontSize: 22, fontWeight: typography.weights.bold },
  value: {
    color: colors.primary,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.black,
    minWidth: 64,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
