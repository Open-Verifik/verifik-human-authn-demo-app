export type DemoId =
  | 'create-collection'
  | 'create-person'
  | 'create-person-with-liveness'
  | 'update-person'
  | 'delete-person'
  | 'search-person'
  | 'search-live-person'
  | 'search-active-user'
  | 'detect-face'
  | 'search-crops'
  | 'face-comparison'
  | 'face-comparison-liveness'
  | 'verify-face'
  | 'liveness'
  | 'humanid-create'
  | 'humanid-create-qr'
  | 'humanid-decrypt'
  | 'humanid-preview';

export type DemoSectionId = 'enroll' | 'manage' | 'search' | 'detection' | 'comparison';

export type MobileDemoRoute =
  | '/demos/create-collection'
  | '/demos/create-person'
  | '/demos/create-person-with-liveness'
  | '/demos/update-person'
  | '/demos/delete-person'
  | '/demos/search-person'
  | '/demos/search-live-person'
  | '/demos/search-active-user'
  | '/demos/detect-face'
  | '/demos/search-crops'
  | '/demos/face-comparison'
  | '/demos/face-comparison-liveness'
  | '/demos/verify-face'
  | '/demos/liveness'
  | '/demos/humanid-create'
  | '/demos/humanid-create-qr'
  | '/demos/humanid-decrypt'
  | '/demos/humanid-preview';

export type DemoCatalogEntry = {
  id: DemoId;
  /** Expo Router path under /demos */
  mobileRoute: MobileDemoRoute;
  /** Web path segment under /demos */
  webPath: string;
  stepNumber?: number;
};

export type DemoSection = {
  id: DemoSectionId;
  demoIds: DemoId[];
};

const TRADITIONAL_STEP_ORDER: DemoId[] = [
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

export const TRADITIONAL_SECTIONS: DemoSection[] = [
  { id: 'enroll', demoIds: ['create-collection', 'create-person', 'create-person-with-liveness'] },
  { id: 'manage', demoIds: ['update-person', 'delete-person'] },
  { id: 'search', demoIds: ['search-person', 'search-live-person', 'search-active-user'] },
  { id: 'detection', demoIds: ['detect-face', 'search-crops'] },
  { id: 'comparison', demoIds: ['face-comparison', 'face-comparison-liveness', 'verify-face'] },
];

export const HUMAN_AUTHN_DEMO_IDS: DemoId[] = [
  'liveness',
  'humanid-create',
  'humanid-create-qr',
  'humanid-decrypt',
  'humanid-preview',
];

const webPathById: Record<DemoId, string> = {
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

const mobileRouteById: Record<DemoId, MobileDemoRoute> = {
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

const stepIndex = (id: DemoId): number | undefined => {
  const i = TRADITIONAL_STEP_ORDER.indexOf(id);
  return i >= 0 ? i + 1 : undefined;
};

export const getDemoCatalogEntry = (id: DemoId): DemoCatalogEntry => ({
  id,
  mobileRoute: mobileRouteById[id],
  webPath: webPathById[id],
  stepNumber: stepIndex(id),
});

export const getAllDemoEntries = (): DemoCatalogEntry[] =>
  [...TRADITIONAL_STEP_ORDER, ...HUMAN_AUTHN_DEMO_IDS].map(getDemoCatalogEntry);

export const APP_LOCALES = [
  'en',
  'es',
  'pt',
  'fr',
  'hi',
  'zh',
  'ko',
  'ja',
  'de',
  'id',
  'vi',
  'tr',
  'ar',
] as const;

export type AppLocale = (typeof APP_LOCALES)[number];
