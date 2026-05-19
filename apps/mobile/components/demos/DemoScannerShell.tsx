import { View, StyleSheet, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { colors, radius, spacing } from '../../constants/tokens';
import ScanLine from '../splash/ScanLine';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  minHeight?: number;
};

const CORNER = 32;

export default function DemoScannerShell({ children, style, minHeight = 360 }: Props) {
  return (
    <View style={[styles.shell, { minHeight }, style]}>
      <View style={styles.gridBg} pointerEvents="none" />
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />
      <ScanLine />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
    overflow: 'hidden',
    position: 'relative',
  },
  gridBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceContainerLowest,
    opacity: 0.35,
  },
  inner: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
    zIndex: 20,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.surfaceTint,
    zIndex: 30,
  },
  tl: {
    top: spacing.lg,
    left: spacing.lg,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    opacity: 0.6,
  },
  tr: {
    top: spacing.lg,
    right: spacing.lg,
    borderTopWidth: 2,
    borderRightWidth: 2,
    opacity: 0.6,
  },
  bl: {
    bottom: spacing.lg,
    left: spacing.lg,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    opacity: 0.3,
  },
  br: {
    bottom: spacing.lg,
    right: spacing.lg,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    opacity: 0.3,
  },
});
