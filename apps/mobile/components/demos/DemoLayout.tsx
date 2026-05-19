import { View, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import DemoScreenShell from './DemoScreenShell';
import DemoStepper from './DemoStepper';
import { demoStyles } from '../../lib/demoScreenStyles';
import { colors, spacing, ghostBorderColor } from '../../constants/tokens';

type Step = { label: string };

type Props = {
  title: string;
  children: ReactNode;
  steps?: readonly Step[];
  currentStep?: number;
  onBack?: () => void;
  contentStyle?: ViewStyle;
  footer?: ReactNode;
};

export default function DemoLayout({
  title,
  children,
  steps,
  currentStep = 1,
  onBack,
  contentStyle,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={demoStyles.screen}>
      <DemoScreenShell title={title} onBack={onBack} />
      <ScrollView contentContainerStyle={[demoStyles.scroll, contentStyle]}>
        {steps && steps.length > 0 ? <DemoStepper steps={steps} current={currentStep} /> : null}
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.base) },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderTopColor: ghostBorderColor,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
});
