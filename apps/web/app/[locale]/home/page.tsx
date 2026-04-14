import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import HomeHeader from './HomeHeader';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

interface DemoCard {
  id: string;
  href: string;
  icon?: string;
  stepNumber?: number;
  badge: string;
  title: string;
  description: string;
}

type TraditionalSection = {
  id: string;
  label: string;
  demos: DemoCard[];
};

const traditionalStructure: { id: string; demoIds: string[] }[] = [
  { id: 'enroll', demoIds: ['create-collection', 'create-person', 'create-person-with-liveness'] },
  { id: 'manage', demoIds: ['update-person', 'delete-person'] },
  {
    id: 'search',
    demoIds: ['search-person', 'search-live-person', 'search-active-user'],
  },
  { id: 'detection', demoIds: ['detect-face', 'search-crops'] },
  {
    id: 'comparison',
    demoIds: ['face-comparison', 'face-comparison-liveness', 'verify-face'],
  },
];

const humanAuthnDemoIds = [
  'liveness',
  'humanid-create',
  'humanid-create-qr',
  'humanid-decrypt',
  'humanid-preview',
];

function hrefForDemoId(id: string): string {
  const map: Record<string, string> = {
    'create-collection': '/demos/create-collection',
    'create-person': '/demos/create-person',
    'create-person-with-liveness': '/demos/create-person-with-liveness',
    'update-person': '/demos/update-person',
    'delete-person': '/demos/delete-person',
    'search-person': '/demos/search-person',
    'search-live-person': '/demos/search-live-person',
    'search-active-user': '/demos/search-active-user',
    'detect-face': '/demos/detect-face',
    'search-crops': '/demos/search-crops',
    'face-comparison': '/demos/face-comparison',
    'face-comparison-liveness': '/demos/face-comparison-liveness',
    'verify-face': '/demos/verify-face',
    liveness: '/demos/liveness',
    'humanid-create': '/demos/humanid-create',
    'humanid-create-qr': '/demos/humanid-create-qr',
    'humanid-decrypt': '/demos/humanid-decrypt',
    'humanid-preview': '/demos/humanid-preview',
  };
  return map[id] ?? `/demos/${id}`;
}

function stepNumberForDemoId(id: string): number | undefined {
  const order = [
    'create-collection',
    'create-person',
    'create-person-with-liveness',
    'update-person',
    'delete-person',
    'search-person',
    'search-live-person',
    'search-active-user',
    'detect-face',
    'search-crops',
    'face-comparison',
    'face-comparison-liveness',
    'verify-face',
  ];
  const i = order.indexOf(id);
  return i >= 0 ? i + 1 : undefined;
}

function stepNumberHumanAuthn(index: number): number {
  return index + 1;
}

export default async function HomePage() {
  const t = await getTranslations('home');

  const demoCard = (id: string, step?: number): DemoCard => ({
    id,
    href: hrefForDemoId(id),
    stepNumber: step,
    badge: t(`demos.${id}.badge`),
    title: t(`demos.${id}.title`),
    description: t(`demos.${id}.description`),
  });

  const traditionalSections: TraditionalSection[] = traditionalStructure.map((section) => ({
    id: section.id,
    label: t(`sections.${section.id}`),
    demos: section.demoIds.map((demoId) => demoCard(demoId, stepNumberForDemoId(demoId))),
  }));

  const humanAuthnDemos: DemoCard[] = humanAuthnDemoIds.map((id, index) =>
    demoCard(id, stepNumberHumanAuthn(index)),
  );

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <HomeHeader />

      <main className="flex-grow pt-32 pb-40 px-6 max-w-6xl mx-auto w-full">
        <section className="mb-24 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="max-w-2xl">
              <p className="text-primary text-[0.75rem] font-semibold tracking-widest uppercase mb-6">
                {t('heroEyebrow')}
              </p>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-on-surface mb-8 leading-[1.05]">
                {t('heroTitle')}
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed max-w-xl">{t('heroBody')}</p>
            </div>

            <div className="hidden md:flex relative flex-shrink-0">
              <div className="relative p-6 rounded-2xl border border-frost bg-white/[0.01] shadow-ambient">
                <span
                  className="material-symbols-outlined text-primary text-4xl opacity-80"
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  shield_person
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20 animate-slide-up">
          <div className="flex items-end gap-4 mb-8">
            <div>
              <p className="text-primary text-[0.6875rem] font-bold tracking-widest uppercase mb-1">
                {t('traditionalEyebrow')}
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-on-surface">{t('traditionalTitle')}</h2>
            </div>
          </div>
          <div className="space-y-14">
            {traditionalSections.map((section) => (
              <div key={section.id}>
                <h3 className="text-xs font-bold tracking-widest uppercase text-primary mb-4">{section.label}</h3>
                <DemoGrid demos={section.demos} runCta={t('demoCta')} />
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20 animate-slide-up">
          <div className="flex items-end gap-4 mb-8">
            <div>
              <p className="text-primary text-[0.6875rem] font-bold tracking-widest uppercase mb-1">
                {t('decentralizedEyebrow')}
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-on-surface">{t('decentralizedTitle')}</h2>
            </div>
          </div>
          <DemoGrid demos={humanAuthnDemos} runCta={t('demoCta')} />
        </section>

        <section className="mt-16 rounded-3xl border border-frost bg-transparent overflow-hidden relative min-h-[340px] flex items-center shadow-ambient">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
          <div className="absolute inset-0 blueprint-grid opacity-[0.15]" />

          <div className="relative z-10 p-10 md:p-16 max-w-2xl">
            <p className="text-primary text-[0.75rem] font-semibold tracking-widest uppercase mb-4">
              {t('enterpriseEyebrow')}
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-white mb-6">{t('enterpriseTitle')}</h2>
            <p className="text-on-surface-variant text-lg leading-relaxed mb-10">{t('enterpriseBody')}</p>
            <div className="flex flex-wrap gap-4">
              <div className="border border-frost bg-white/[0.02] px-4 py-2 rounded-full flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base leading-none">verified</span>
                <span className="text-[0.6875rem] font-semibold tracking-wider uppercase text-on-surface-variant">
                  {t('pillGdpr')}
                </span>
              </div>
              <div className="border border-frost bg-white/[0.02] px-4 py-2 rounded-full flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base leading-none">lock</span>
                <span className="text-[0.6875rem] font-semibold tracking-wider uppercase text-on-surface-variant">
                  {t('pillAes')}
                </span>
              </div>
              <div className="border border-frost bg-white/[0.02] px-4 py-2 rounded-full flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base leading-none">shield</span>
                <span className="text-[0.6875rem] font-semibold tracking-wider uppercase text-on-surface-variant">
                  {t('pillSoc2')}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <nav
        className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center
                      px-4 pb-safe bg-surface/90 backdrop-blur-xl z-50 border-t border-frost"
      >
        <Link
          href="/home"
          id="nav-identity"
          className="flex flex-col items-center justify-center text-primary pt-4 pb-2 flex-1 active:scale-95 duration-150 relative"
        >
          <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full" />
          <span className="material-symbols-outlined mb-1">face</span>
          <span className="text-[10px] font-medium tracking-wide">{t('navIdentity')}</span>
        </Link>
        <Link
          href="/home"
          id="nav-security"
          className="flex flex-col items-center justify-center text-on-surface-variant/80 pt-4 pb-2 flex-1 active:scale-95 duration-150 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined mb-1">verified_user</span>
          <span className="text-[10px] font-medium tracking-wide">{t('navSecurity')}</span>
        </Link>
        <Link
          href="/settings/profile"
          id="nav-settings"
          className="flex flex-col items-center justify-center text-on-surface-variant/80 pt-4 pb-2 flex-1 active:scale-95 duration-150 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined mb-1">settings</span>
          <span className="text-[10px] font-medium tracking-wide">{t('navSettings')}</span>
        </Link>
      </nav>
    </div>
  );
}

function DemoGrid({ demos, runCta }: { demos: DemoCard[]; runCta: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {demos.map((demo) => (
        <Link
          key={demo.id}
          href={demo.href}
          id={`demo-card-${demo.id}`}
          className="group relative flex min-h-[240px] w-full flex-col items-stretch text-left overflow-hidden rounded-2xl border border-frost bg-transparent p-6
                         transition-all duration-300 hover:border-primary/40 hover:bg-white/[0.02] hover:shadow-ring-frost"
        >
          <div className="mb-5 flex w-full shrink-0 justify-between items-start">
            {demo.stepNumber != null ? (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-frost bg-primary/5 text-lg font-bold tabular-nums leading-none text-primary group-hover:bg-primary/10 transition-colors"
                aria-hidden
              >
                {demo.stepNumber}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg border border-frost bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-xl leading-none block">{demo.icon}</span>
              </div>
            )}
            <span className="text-[10px] font-medium text-on-surface-variant border border-frost rounded-full px-2.5 py-1">
              {demo.badge}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col items-start text-left">
            <h3 className="text-lg font-semibold text-on-surface mb-3 tracking-tight">{demo.title}</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">{demo.description}</p>
          </div>

          <div className="mt-auto flex w-full shrink-0 items-center justify-start pt-6 text-primary text-sm font-medium gap-1.5 group-hover:gap-2 transition-all">
            {runCta}
            <span className="material-symbols-outlined text-base leading-none">arrow_forward</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
