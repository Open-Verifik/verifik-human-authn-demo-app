export interface DemoEntry {
  href: string;
  url: string;
  badge: string;
  title: string;
  description: string;
}

export function buildLlmsTxtBody(
  siteUrl: string,
  demos: DemoEntry[],
  localeList: string,
): string {
  const traditionalDemos = demos.filter(
    (d) => !d.href.includes('humanid'),
  );
  const humanIdDemos = demos.filter(
    (d) => d.href.includes('humanid'),
  );

  const lines = [
    '# HumanAuthn by Verifik',
    '',
    'HumanAuthn is a public, interactive demo web application built by Verifik. It lets developers and decision-makers experience Verifik\'s biometric authentication capabilities directly in the browser before integrating them into their own products.',
    '',
    `Canonical URL: ${siteUrl}`,
    '',
    '## What Verifik does',
    '',
    'Verifik (https://verifik.co) is an identity verification and biometric authentication platform serving enterprises across Latin America and beyond. It provides APIs for KYC/KYB compliance, liveness detection, face comparison, document screening, and decentralized identity proofs. Over 10 million checks completed, sub-3-second verification, 99.7% accuracy, 20+ countries supported.',
    '',
    '## What this demo site covers',
    '',
    'The demo app showcases two families of biometric capabilities:',
    '',
    '### 1. Traditional Biometrics (Server-side OpenCV collections)',
    '',
    'These demos use Verifik\'s server-side face gallery. Faces are enrolled into named collections; subsequent searches, comparisons, and verifications run against that gallery. Use cases: employee access control, event check-in, repeat-visitor identification.',
    '',
    '**Enrollment and management:**',
    ...traditionalDemos
      .filter((d) => ['Enroll', 'Manage'].includes(d.badge))
      .map((d) => `- [${d.title}](${d.url}) -- ${d.description}`),
    '',
    '**Search and matching:**',
    ...traditionalDemos
      .filter((d) => d.badge === 'Search')
      .map((d) => `- [${d.title}](${d.url}) -- ${d.description}`),
    '',
    '**Face detection and comparison:**',
    ...traditionalDemos
      .filter((d) => ['Detection', 'Comparison'].includes(d.badge))
      .map((d) => `- [${d.title}](${d.url}) -- ${d.description}`),
    '',
    '**Liveness (anti-spoofing):**',
    ...traditionalDemos
      .filter((d) => d.badge === 'Anti-spoof')
      .map((d) => `- [${d.title}](${d.url}) -- ${d.description}`),
    '',
    '### 2. Decentralized Biometrics (HumanID / HumanAuthn)',
    '',
    'HumanID is Verifik\'s decentralized identity primitive. It binds identity data and a live face into an encrypted proof stored on IPFS. The proof can only be recovered by presenting the same live face again -- no central face database is needed. Use cases: portable digital identity, privacy-preserving KYC, offline credential verification via QR codes.',
    '',
    ...humanIdDemos.map((d) => `- [${d.title}](${d.url}) -- ${d.description}`),
    '',
    '## How the demo works technically',
    '',
    '- Built with Next.js 14 (App Router), TailwindCSS, and Framer Motion.',
    '- A shared `@humanauthn/api-client` TypeScript package handles API calls and environment routing (development: https://verifik.app, production: https://prod.verifik.co).',
    '- Browser-side face capture uses a guided camera component backed by @vladmandic/face-api for real-time alignment feedback before submitting frames to Verifik APIs.',
    '- Authentication in the demo uses email or phone OTP. Production integrations use project API keys issued through Verifik\'s dashboard.',
    '',
    '## Production integration',
    '',
    '- Production API base: https://api.verifik.co',
    '- Authentication: project-scoped API keys (Bearer token), issued from the Verifik client dashboard.',
    '- API documentation: https://docs.verifik.co',
    '- SDKs and open-source tools: https://github.com/Open-Verifik',
    '- The demo app is open-source and can be used as a reference implementation for building custom biometric flows.',
    '',
    '## Multi-platform availability',
    '',
    'This demo repository is a pnpm monorepo containing three targets:',
    '- **Web** (Next.js) -- the primary public demo at the canonical URL above.',
    '- **Mobile** (Expo / React Native) -- identical UX on iOS and Android.',
    '- **Desktop** (Electron) -- wraps the web app for native desktop usage.',
    '',
    '## Compliance and security',
    '',
    '- GDPR compliant. iBeta Level 1 & 2 tested liveness. SOC 2 ready.',
    '- All biometric data transmitted over TLS with AES-256 encryption.',
    '- Privacy by design: demo pages process biometric media only for the demo purpose shown. Production deployments must follow the integrator\'s own data-handling policies.',
    '',
    '## Localization',
    '',
    `Supported languages: ${localeList}.`,
    'Default is English (locale prefix omitted). Other locales are prefixed (e.g. /es/demos/liveness, /ja/demos/face-comparison). All public routes include hreflang alternates in the sitemap.',
    '',
    '## Machine-readable discovery',
    '',
    `- Sitemap: ${siteUrl}/sitemap.xml`,
    `- Robots: ${siteUrl}/robots.txt`,
    `- Open Graph images: ${siteUrl}/og?demo={slug}&locale={locale}`,
    '',
    '## Full demo index',
    '',
    `- [Landing page](${siteUrl}/) -- product splash with biometric readiness overview.`,
    `- [Demo dashboard](${siteUrl}/home) -- all demos organized by category with guided entry points.`,
    '',
    ...demos.map((d) => `- [${d.title}](${d.url}) [${d.badge}] -- ${d.description}`),
    '',
    '## Non-indexed areas',
    '',
    '- /auth -- sign-in and OTP flows (disallowed in robots.txt).',
    '- /settings -- user profile and API key management (disallowed in robots.txt).',
    '',
  ];

  return lines.join('\n');
}
