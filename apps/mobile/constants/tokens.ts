// ─── HumanAuthn Design Tokens — React Native (Verifik brand) ─────────────────
// Mirrors packages/design-tokens; keep in sync.

import { StyleSheet } from 'react-native';

export const colors = {
  surface:                  '#010333',
  surfaceContainerLowest:   '#00061f',
  surfaceContainerLow:      '#0a1538',
  surfaceContainer:         '#121f4a',
  surfaceContainerHigh:     '#1c2c5c',
  surfaceContainerHighest:  '#263a6e',
  surfaceBright:            '#30487e',

  primary:              '#8eb0ff',
  primaryFixed:         '#e8ecff',
  primaryContainer:     '#2642FF',
  onPrimary:            '#010333',
  onPrimaryContainer:   '#F4F4F4',
  inversePrimary:       '#1a32cc',
  surfaceTint:          '#00FFE0',

  secondary:              '#a8b4cc',
  secondaryContainer:     '#3d4d6b',
  onSecondary:            '#1a2233',
  onSecondaryContainer:   '#c5ccdc',

  background:      '#010333',
  onBackground:    '#F4F4F4',
  onSurface:       '#F4F4F4',
  onSurfaceVariant:'#b8c4dc',

  outline:        '#5c6a8a',
  outlineVariant: '#2a3a58',

  error:           '#ffb4ab',
  errorContainer:  '#93000a',
  onError:         '#690005',
  onErrorContainer:'#ffdad6',

  success: '#22c55e',

  white:  '#ffffff',
  black:  '#000000',
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    bold:    'System',
    mono:    'monospace',
  },
  sizes: {
    xs:   11,
    sm:   12,
    base: 14,
    md:   16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
  },
  weights: {
    light:      '300' as const,
    regular:    '400' as const,
    medium:     '500' as const,
    semibold:   '600' as const,
    bold:       '700' as const,
    black:      '900' as const,
  },
  tracking: {
    tight:   -0.5,
    normal:   0,
    wide:     1.5,
    wider:    3,
    widest:   5,
    editorial:-1,
  },
} as const;

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
  card: 24,
} as const;

export const radius = {
  xs:   2,
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  '2xl': 24,
  full: 9999,
} as const;

export const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
  },
  cardLow: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.card,
  },
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    padding: spacing.card,
  },
  cardHigh: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.xl,
    padding: spacing.card,
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: 'rgba(42, 58, 88, 0.2)',
  },
  headline: {
    color: colors.onSurface,
    fontWeight: typography.weights.black,
    letterSpacing: typography.tracking.editorial,
  },
  body: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  labelMeta: {
    color: colors.outline,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.tracking.wider,
    textTransform: 'uppercase',
  },
  primaryBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: spacing.sm,
    shadowColor: '#2642FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.tracking.wide,
  },
  secondaryBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(42, 58, 88, 0.2)',
  },
  secondaryBtnText: {
    color: colors.onSurface,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  scannerCorner: {
    position: 'absolute' as const,
    width: 24,
    height: 24,
  },
});

export const gradients = {
  primaryCta:   ['#2642FF', '#1a2f99'] as const,
  primaryCtaTtb:['#2642FF', '#152266'] as const,
  authPulse:    ['rgba(38,66,255,0.14)', 'rgba(1,3,51,0)'] as const,
  surfaceOverlay: ['rgba(1,3,51,0)', 'rgba(1,3,51,0.95)'] as const,
  card:         ['rgba(18,31,74,0.8)',  'rgba(1,3,51,0)'] as const,
} as const;

export type ColorsType = typeof colors;
