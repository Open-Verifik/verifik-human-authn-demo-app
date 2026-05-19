import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  type TextInputProps,
} from 'react-native';
import { colors, typography, spacing, radius, ghostBorderColor } from '../constants/tokens';

export const demoStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.xl, paddingBottom: spacing['3xl'], gap: spacing.lg },
  heroTitle: {
    color: colors.onSurface,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.black,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  label: {
    color: colors.onSurface,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: ghostBorderColor,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerHigh,
    fontSize: typography.sizes.base,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  error: { color: colors.error, fontSize: typography.sizes.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: ghostBorderColor,
  },
  chipActive: {
    borderColor: 'rgba(255,255,255,0.20)',
    backgroundColor: colors.surfaceContainerHigh,
  },
  chipText: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm },
  chipTextActive: { color: colors.onSurface, fontWeight: typography.weights.semibold },
  processing: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.md },
  processingText: { color: colors.onSurface, fontWeight: typography.weights.semibold },
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  previewThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerHigh,
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: ghostBorderColor,
  },
  secondaryBtnText: { color: colors.onSurface, fontWeight: typography.weights.semibold },
  successTitle: {
    color: colors.onSurface,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
});

type FieldProps = TextInputProps & { label: string; required?: boolean };

export const DemoField = ({ label, required, style, ...rest }: FieldProps) => (
  <View>
    <Text style={demoStyles.label}>
      {label}
      {required ? <Text style={{ color: colors.error }}> *</Text> : null}
    </Text>
    <TextInput
      placeholderTextColor={colors.outline}
      style={[demoStyles.input, style]}
      {...rest}
    />
  </View>
);

export { default as DemoPrimaryCta } from '../components/ui/DemoPrimaryCta';

export const DemoProcessing = ({ message }: { message: string }) => (
  <View style={demoStyles.processing}>
    <ActivityIndicator size="large" color={colors.onSurfaceVariant} />
    <Text style={demoStyles.processingText}>{message}</Text>
  </View>
);

type ChipOption<T extends string> = { value: T; label: string };

export const DemoChipGroup = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) => (
  <View style={demoStyles.row}>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[demoStyles.chip, active && demoStyles.chipActive]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[demoStyles.chipText, active && demoStyles.chipTextActive]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export const countDetectedFaces = (raw: unknown): number | null => {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const data = root.data;
  const inner =
    data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : root;
  if (Array.isArray(inner.faces)) return inner.faces.length;
  if (Array.isArray(inner.detections)) return inner.detections.length;
  if (typeof inner.faceCount === 'number') return inner.faceCount;
  if (typeof inner.count === 'number') return inner.count;
  return null;
};
