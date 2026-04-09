// HumanAuthn Design System — Verifik brand palette
// Reference: https://verifik.co/recursos-marca/

export const colors = {
  // ── Base Surface Hierarchy (anchored on #010333) ─────────
  surface:                  '#010333',
  surfaceContainerLowest:   '#00061f',
  surfaceContainerLow:      '#0a1538',
  surfaceContainer:         '#121f4a',
  surfaceContainerHigh:     '#1c2c5c',
  surfaceContainerHighest:  '#263a6e',
  surfaceBright:            '#30487e',
  surfaceDim:               '#010333',
  surfaceVariant:           '#263a6e',

  // ── Primary — Verifik blue (#2642FF) ─────────────────────
  primary:              '#8eb0ff',
  primaryFixed:         '#e8ecff',
  primaryFixedDim:      '#c8d4ff',
  primaryContainer:     '#2642FF',
  onPrimary:            '#010333',
  onPrimaryFixed:       '#010333',
  onPrimaryFixedVariant:'#1a2f99',
  onPrimaryContainer:   '#F4F4F4',
  inversePrimary:       '#1a32cc',
  surfaceTint:          '#00FFE0',

  // ── Secondary — cool neutrals on navy ───────────────────
  secondary:              '#a8b4cc',
  secondaryFixed:         '#dce1ee',
  secondaryFixedDim:      '#a8b4cc',
  secondaryContainer:     '#3d4d6b',
  onSecondary:            '#1a2233',
  onSecondaryFixed:       '#0f141f',
  onSecondaryFixedVariant:'#2a3548',
  onSecondaryContainer:   '#c5ccdc',

  // ── Tertiary — cyan accent channel (#00FFE0) ────────────
  tertiary:              '#5ee8d8',
  tertiaryFixed:         '#d4fff8',
  tertiaryFixedDim:      '#5ee8d8',
  tertiaryContainer:     '#008a7a',
  onTertiary:            '#00221e',
  onTertiaryFixed:       '#001a17',
  onTertiaryFixedVariant:'#004d45',
  onTertiaryContainer:   '#F4F4F4',

  // ── Backgrounds & On-Colors (#F4F4F4 ink on navy) ───────
  background:      '#010333',
  onBackground:    '#F4F4F4',
  onSurface:       '#F4F4F4',
  onSurfaceVariant:'#b8c4dc',
  inverseSurface:  '#F4F4F4',
  inverseOnSurface:'#010333',

  // ── Outlines ─────────────────────────────────────────────
  outline:        '#5c6a8a',
  outlineVariant: '#2a3a58',
  frost:          'rgba(142, 176, 255, 0.15)',
  frostVariant:   'rgba(142, 176, 255, 0.08)',

  // ── Error ────────────────────────────────────────────────
  error:           '#ffb4ab',
  errorContainer:  '#93000a',
  onError:         '#690005',
  onErrorContainer:'#ffdad6',
} as const;

export type ColorKey = keyof typeof colors;

// ── Typography Scale ───────────────────────────────────────
export const typography = {
  fontFamily: {
    sans: ["'Inter'", 'system-ui', 'sans-serif'],
  },
  tracking: {
    tight:    '-0.02em',
    tighter:  '-0.03em',
    wide:     '0.1em',
    wider:    '0.2em',
    widest:   '0.4em',
  },
  labelSm: '0.6875rem',
  labelMd: '0.75rem',
} as const;

// ── Border Radius ─────────────────────────────────────────
export const radius = {
  DEFAULT: '0.125rem',
  lg:      '0.25rem',
  xl:      '0.5rem',
  full:    '0.75rem',
  round:   '9999px',
} as const;

// ── Spacing ───────────────────────────────────────────────
export const spacing = {
  cardPadding:      '1.5rem',
  sectionGap:       '2rem',
  componentGap:     '1rem',
  microGap:         '0.5rem',
} as const;

// ── Shadows ───────────────────────────────────────────────
export const shadows = {
  ambient:  '0 8px 40px rgba(1, 3, 51, 0.25)',
  float:    '0 16px 60px rgba(1, 3, 51, 0.35)',
  glow:     '0 0 40px rgba(0, 255, 224, 0.12)',
  scanLine: '0 0 15px rgba(0, 255, 224, 0.55)',
} as const;

// ── Auth Pulse ───────────────────────────────────────────
export const authPulse = {
  lg: 'radial-gradient(circle, rgba(38, 66, 255, 0.16) 0%, rgba(0, 255, 224, 0.06) 40%, rgba(1, 3, 51, 0) 70%)',
  md: 'radial-gradient(circle, rgba(38, 66, 255, 0.12) 0%, rgba(0, 255, 224, 0.05) 45%, rgba(1, 3, 51, 0) 65%)',
  sm: 'radial-gradient(circle, rgba(38, 66, 255, 0.10) 0%, rgba(1, 3, 51, 0) 60%)',
} as const;

// ── Gradient Presets ──────────────────────────────────────
export const gradients = {
  primaryCta:   'linear-gradient(135deg, #2642FF 0%, #1a2f99 100%)',
  primaryCtaRtl:'linear-gradient(to right, #2642FF, #1a2f99)',
  primaryCtaTtb:'linear-gradient(to bottom, #2642FF, #152266)',
  glassOverlay: 'rgba(18, 31, 74, 0.6)',
} as const;

// ── Glassmorphism ─────────────────────────────────────────
export const glass = {
  backdropBlur: {
    sm: 'blur(12px)',
    md: 'blur(16px)',
    lg: 'blur(20px)',
  },
  border: `1px solid rgba(42, 58, 88, 0.2)`,
} as const;

// ── Tailwind-compatible token map ─────────────────────────
export const tailwindColors = {
  'surface':                  colors.surface,
  'surface-container-lowest': colors.surfaceContainerLowest,
  'surface-container-low':    colors.surfaceContainerLow,
  'surface-container':        colors.surfaceContainer,
  'surface-container-high':   colors.surfaceContainerHigh,
  'surface-container-highest':colors.surfaceContainerHighest,
  'surface-bright':           colors.surfaceBright,
  'surface-dim':              colors.surfaceDim,
  'surface-variant':          colors.surfaceVariant,
  'surface-tint':             colors.surfaceTint,
  'primary':                  colors.primary,
  'primary-fixed':            colors.primaryFixed,
  'primary-fixed-dim':        colors.primaryFixedDim,
  'primary-container':        colors.primaryContainer,
  'on-primary':               colors.onPrimary,
  'on-primary-fixed':         colors.onPrimaryFixed,
  'on-primary-fixed-variant': colors.onPrimaryFixedVariant,
  'on-primary-container':     colors.onPrimaryContainer,
  'inverse-primary':          colors.inversePrimary,
  'secondary':                colors.secondary,
  'secondary-fixed':          colors.secondaryFixed,
  'secondary-fixed-dim':      colors.secondaryFixedDim,
  'secondary-container':      colors.secondaryContainer,
  'on-secondary':             colors.onSecondary,
  'on-secondary-fixed':       colors.onSecondaryFixed,
  'on-secondary-fixed-variant':colors.onSecondaryFixedVariant,
  'on-secondary-container':   colors.onSecondaryContainer,
  'tertiary':                 colors.tertiary,
  'tertiary-fixed':           colors.tertiaryFixed,
  'tertiary-fixed-dim':       colors.tertiaryFixedDim,
  'tertiary-container':       colors.tertiaryContainer,
  'on-tertiary':              colors.onTertiary,
  'on-tertiary-fixed':        colors.onTertiaryFixed,
  'on-tertiary-fixed-variant':colors.onTertiaryFixedVariant,
  'on-tertiary-container':    colors.onTertiaryContainer,
  'background':               colors.background,
  'on-background':            colors.onBackground,
  'on-surface':               colors.onSurface,
  'on-surface-variant':       colors.onSurfaceVariant,
  'inverse-surface':          colors.inverseSurface,
  'inverse-on-surface':       colors.inverseOnSurface,
  'outline':                  colors.outline,
  'outline-variant':          colors.outlineVariant,
  'error':                    colors.error,
  'error-container':          colors.errorContainer,
  'on-error':                 colors.onError,
  'on-error-container':       colors.onErrorContainer,
} as const;

export const tailwindBorderRadius = {
  DEFAULT: radius.DEFAULT,
  lg:      radius.lg,
  xl:      radius.xl,
  full:    radius.full,
} as const;
