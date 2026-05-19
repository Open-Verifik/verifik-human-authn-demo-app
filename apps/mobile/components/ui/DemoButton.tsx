import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { button, typography, radius, spacing } from '../../constants/tokens';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

function DemoButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && { opacity: button.disabledOpacity },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? button.primaryText : button.secondaryText}
        />
      ) : (
        <Text style={[styles.label, labelStyles[variant], size === 'sm' && styles.labelSm]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: button.height,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  labelSm: {
    fontSize: typography.sizes.sm,
    paddingVertical: 0,
  },
});

const sizeStyles = StyleSheet.create({
  md: {
    minHeight: button.height,
    paddingVertical: 14,
  },
  sm: {
    minHeight: 36,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: button.primaryFill,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  secondary: {
    backgroundColor: button.secondaryFill,
    borderWidth: 1,
    borderColor: button.secondaryBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});

const labelStyles = StyleSheet.create({
  primary: {
    color: button.primaryText,
  },
  secondary: {
    color: button.secondaryText,
  },
  ghost: {
    color: button.ghostText,
  },
});

export default DemoButton;
export { DemoButton };
