import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';
import { routing, type AppLocale } from '@/i18n/routing';
import { mergeMessagesWithFallback } from '@/i18n/merge-messages-with-fallback';

export const runtime = 'nodejs';

const DEMO_SLUGS = [
  'create-collection',
  'create-person',
  'create-person-with-liveness',
  'update-person',
  'delete-person',
  'search-person',
  'search-live-person',
  'search-active-user',
  'search-crops',
  'detect-face',
  'face-comparison',
  'face-comparison-liveness',
  'verify-face',
  'liveness',
  'humanid',
  'humanid-create',
  'humanid-create-qr',
  'humanid-decrypt',
  'humanid-preview',
] as const;

type DemoSlug = (typeof DEMO_SLUGS)[number];

const isDemoSlug = (v: string): v is DemoSlug =>
  (DEMO_SLUGS as readonly string[]).includes(v);

async function loadMessages(locale: string) {
  const [enMod, localeMod] = await Promise.all([
    import(`@/messages/en.json`),
    import(`@/messages/${locale}.json`),
  ]);
  const en = enMod.default as Record<string, unknown>;
  const loc = localeMod.default as Record<string, unknown>;
  return locale === routing.defaultLocale
    ? loc
    : mergeMessagesWithFallback(en, loc);
}

function dig(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return '';
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : '';
}

function truncate(s: string, max: number) {
  return s.length <= max ? s : s.slice(0, max - 1) + '\u2026';
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawLocale = searchParams.get('locale') ?? routing.defaultLocale;
  const locale: AppLocale = (routing.locales as readonly string[]).includes(rawLocale)
    ? (rawLocale as AppLocale)
    : routing.defaultLocale;
  const demo = searchParams.get('demo');

  const messages = await loadMessages(locale);

  let title: string;
  let description: string;
  let badge = '';

  if (demo && isDemoSlug(demo)) {
    title = dig(messages, `home.demos.${demo}.title`);
    description = dig(messages, `home.demos.${demo}.description`);
    badge = dig(messages, `home.demos.${demo}.badge`);
    if (!title) title = demo;
  } else {
    title = dig(messages, 'RootLayout.ogTitle') || 'HumanAuthn';
    description = dig(messages, 'RootLayout.ogDescription') || '';
  }

  description = truncate(description, 180);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #141428 50%, #1a1a2e 100%)',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#ffffff',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: badge ? '32px' : '48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '24px',
              fontWeight: 600,
              color: '#a0a0c0',
              letterSpacing: '-0.02em',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#6366f1" />
              <path
                d="M10 16a6 6 0 1 1 12 0a6 6 0 0 1-12 0z"
                stroke="#fff"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="16" cy="16" r="2" fill="#fff" />
            </svg>
            <span>HumanAuthn</span>
            <span style={{ color: '#4a4a6a', margin: '0 4px' }}>·</span>
            <span style={{ color: '#6366f1' }}>Verifik</span>
          </div>
        </div>

        {/* Badge */}
        {badge && (
          <div
            style={{
              display: 'flex',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: '6px 18px',
                borderRadius: '20px',
                fontSize: '16px',
                fontWeight: 600,
                color: '#c4b5fd',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {badge}
            </div>
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: demo ? '56px' : '64px',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '24px',
            background: 'linear-gradient(90deg, #ffffff 0%, #c4b5fd 100%)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {title}
        </div>

        {/* Description */}
        {description && (
          <div
            style={{
              fontSize: '24px',
              lineHeight: 1.5,
              color: '#94a3b8',
              maxWidth: '900px',
            }}
          >
            {description}
          </div>
        )}

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: '40px',
            left: '80px',
            right: '80px',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '20px',
          }}
        >
          <div style={{ display: 'flex', gap: '24px', fontSize: '16px', color: '#64748b' }}>
            <span>verifik.co</span>
            <span>·</span>
            <span>Enterprise Biometrics</span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#6366f1',
            }}
          >
            <span>GDPR</span>
            <span>·</span>
            <span>AES-256</span>
            <span>·</span>
            <span>SOC 2</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  );
}
