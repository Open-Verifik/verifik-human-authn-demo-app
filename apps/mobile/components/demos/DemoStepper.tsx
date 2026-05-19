import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, button, ghostBorderColor } from '../../constants/tokens';

type Step = { label: string };

type Props = {
  steps: readonly Step[];
  current: number;
};

export default function DemoStepper({ steps, current }: Props) {
  return (
    <View style={styles.row}>
      {steps.map((step, index) => {
        const n = index + 1;
        const isActive = current === n;
        const isDone = current > n;
        return (
          <View key={step.label} style={styles.stepWrap}>
            <View style={styles.stepCol}>
              <View style={[styles.circle, isActive && styles.circleActive, isDone && styles.circleDone]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color={colors.onSurface} />
                ) : (
                  <Text style={[styles.num, (isActive || isDone) && styles.numActive]}>{n}</Text>
                )}
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{step.label}</Text>
            </View>
            {index < steps.length - 1 ? (
              <View style={[styles.connector, current > n && styles.connectorDone]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  stepWrap: { flexDirection: 'row', alignItems: 'flex-start' },
  stepCol: { alignItems: 'center', minWidth: 72 },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ghostBorderColor,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: button.primaryFill,
    borderColor: button.primaryFill,
  },
  circleDone: {
    backgroundColor: colors.surfaceContainerHighest,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  num: { color: colors.outline, fontWeight: typography.weights.bold, fontSize: typography.sizes.sm },
  numActive: { color: button.primaryText },
  label: {
    marginTop: spacing.sm,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(161,161,170,0.5)',
  },
  labelActive: { color: colors.onSurface },
  connector: {
    width: 48,
    height: 2,
    backgroundColor: ghostBorderColor,
    marginTop: 20,
    marginHorizontal: spacing.xs,
  },
  connectorDone: { backgroundColor: 'rgba(255,255,255,0.25)' },
});
