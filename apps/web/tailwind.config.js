/**
 * Same behavior as `tailwindcss` v3 `src/util/flattenColorPalette` (used by `addVariablesForColors`).
 * Inlined so editors and tooling do not need to resolve deep `tailwindcss/lib/...` paths (pnpm / IntelliSense).
 */
const flattenColorPalette = (colors) =>
  Object.assign(
    {},
    ...Object.entries(colors ?? {}).flatMap(([color, values]) =>
      typeof values == "object"
        ? Object.entries(flattenColorPalette(values)).map(([number, hex]) => ({
            [color + (number === "DEFAULT" ? "" : `-${number}`)]: hex,
          }))
        : [{ [`${color}`]: values }],
    ),
  );

/** @type {import('tailwindcss').Config} */

// Inline design tokens — MUST stay aligned with packages/design-tokens/src/index.ts (colors, gradients, glow/shadow RGBA).
const colors = {
  'surface':                   '#010333',
  'surface-container-lowest':  '#00061f',
  'surface-container-low':     '#0a1538',
  'surface-container':         '#121f4a',
  'surface-container-high':    '#1c2c5c',
  'surface-container-highest': '#263a6e',
  'surface-bright':            '#30487e',
  'surface-dim':               '#010333',
  'surface-variant':           '#263a6e',
  'surface-tint':              '#00FFE0',
  'primary':                   '#8eb0ff',
  'primary-fixed':             '#e8ecff',
  'primary-fixed-dim':         '#c8d4ff',
  'primary-container':         '#2642FF',
  'on-primary':                '#010333',
  'on-primary-fixed':          '#010333',
  'on-primary-fixed-variant':  '#1a2f99',
  'on-primary-container':      '#F4F4F4',
  'inverse-primary':           '#1a32cc',
  'secondary':                 '#a8b4cc',
  'secondary-fixed':           '#dce1ee',
  'secondary-fixed-dim':       '#a8b4cc',
  'secondary-container':       '#3d4d6b',
  'on-secondary':              '#1a2233',
  'on-secondary-fixed':        '#0f141f',
  'on-secondary-fixed-variant':'#2a3548',
  'on-secondary-container':    '#c5ccdc',
  'tertiary':                  '#5ee8d8',
  'tertiary-fixed':            '#d4fff8',
  'tertiary-fixed-dim':        '#5ee8d8',
  'tertiary-container':        '#008a7a',
  'on-tertiary':               '#00221e',
  'on-tertiary-fixed':         '#001a17',
  'on-tertiary-fixed-variant': '#004d45',
  'on-tertiary-container':     '#F4F4F4',
  'background':                '#010333',
  'on-background':             '#F4F4F4',
  'on-surface':                '#F4F4F4',
  'on-surface-variant':        '#b8c4dc',
  'inverse-surface':           '#F4F4F4',
  'inverse-on-surface':        '#010333',
  'outline':                   '#5c6a8a',
  'outline-variant':           '#2a3a58',
  'frost':                     'rgba(142, 176, 255, 0.15)',
  'frost-variant':             'rgba(142, 176, 255, 0.08)',
  'error':                     '#ffb4ab',
  'error-container':           '#93000a',
  'on-error':                  '#690005',
  'on-error-container':        '#ffdad6',
};

module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors,
      borderRadius: {
        DEFAULT: '0.125rem',
        lg:      '0.25rem',
        xl:      '0.5rem',
        full:    '0.75rem',
        round:   '9999px',
      },
      fontFamily: {
        sans:     ["'Inter'", 'system-ui', 'sans-serif'],
        headline: ["'Inter'", 'system-ui', 'sans-serif'],
        body:     ["'Inter'", 'system-ui', 'sans-serif'],
        label:    ["'Inter'", 'system-ui', 'sans-serif'],
        mono:     ["'JetBrains Mono'", 'monospace'],
      },
      backgroundImage: {
        'primary-gradient':     'linear-gradient(135deg, #2642FF 0%, #1a2f99 100%)',
        'primary-gradient-rtl': 'linear-gradient(to right, #2642FF, #1a2f99)',
        'primary-gradient-ttb': 'linear-gradient(to bottom, #2642FF, #152266)',
        'auth-pulse-lg':        'radial-gradient(circle, rgba(38, 66, 255, 0.16) 0%, rgba(0, 255, 224, 0.06) 40%, rgba(1, 3, 51, 0) 70%)',
        'auth-pulse-sm':        'radial-gradient(circle, rgba(38, 66, 255, 0.10) 0%, rgba(1, 3, 51, 0) 60%)',
      },
      boxShadow: {
        ambient:    '0 8px 40px rgba(1, 3, 51, 0.25)',
        float:      '0 16px 60px rgba(1, 3, 51, 0.35)',
        glow:       '0 0 40px rgba(0, 255, 224, 0.12)',
        'scan-line':'0 0 15px rgba(0, 255, 224, 0.55)',
        primary:    '0 1px 2px rgba(38, 66, 255, 0.12), 0 4px 14px rgba(38, 66, 255, 0.16)',
        'ring-frost':'0 0 0 1px rgba(142, 176, 255, 0.15)',
      },
      animation: {
        'scan':       'scanAnim 3s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe':    'breathe 6s ease-in-out infinite',
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'aurora':     'aurora 60s linear infinite',
      },
      keyframes: {
        scanAnim: {
          '0%':   { top: '20%', opacity: '0' },
          '50%':  { opacity: '1' },
          '100%': { top: '80%', opacity: '0' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.05)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
      },
    },
  },
  plugins: [addVariablesForColors],
};

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}
