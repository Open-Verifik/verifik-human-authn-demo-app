import React from 'react';
import DemoButton from './DemoButton';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
};

export default function DemoPrimaryCta({ label, onPress, disabled, fullWidth = true }: Props) {
  return (
    <DemoButton
      label={label}
      onPress={onPress}
      variant="primary"
      disabled={disabled}
      fullWidth={fullWidth}
    />
  );
}
