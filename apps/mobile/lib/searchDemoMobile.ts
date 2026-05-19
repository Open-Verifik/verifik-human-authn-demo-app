import type { TFunction } from 'i18next';
import type { RelatedDocItem } from '../components/demos/DemoRelatedDocsSection';

export const DOCS_BASE = 'https://docs.verifik.co';

export const SEARCH_PERSON_RELATED_HREFS = [
  `${DOCS_BASE}/resources/the-person-object`,
  `${DOCS_BASE}/resources/list-all-persons`,
  `${DOCS_BASE}/resources/retrieve-a-person`,
  `${DOCS_BASE}/resources/persons/update-a-person`,
  `${DOCS_BASE}/resources/persons/delete-a-person`,
  `${DOCS_BASE}/biometrics/search`,
] as const;

export const SEARCH_LIVE_RELATED_HREFS = [
  `${DOCS_BASE}/resources/the-person-object`,
  `${DOCS_BASE}/resources/list-all-persons`,
  `${DOCS_BASE}/resources/retrieve-a-person`,
  `${DOCS_BASE}/resources/persons/update-a-person`,
  `${DOCS_BASE}/resources/persons/delete-a-person`,
  `${DOCS_BASE}/biometrics/search-live-face`,
] as const;

export const SEARCH_ACTIVE_RELATED_HREFS = [
  `${DOCS_BASE}/resources/the-person-object`,
  `${DOCS_BASE}/resources/list-all-persons`,
  `${DOCS_BASE}/resources/retrieve-a-person`,
  `${DOCS_BASE}/resources/persons/update-a-person`,
  `${DOCS_BASE}/resources/persons/delete-a-person`,
  `${DOCS_BASE}/biometrics/search-active-user`,
] as const;

export const SEARCH_CROPS_RELATED_HREFS = [
  `${DOCS_BASE}/biometrics/search`,
  `${DOCS_BASE}/biometrics/search-live-face`,
  `${DOCS_BASE}/biometrics/search-active-user`,
  `${DOCS_BASE}/biometrics/verify-face`,
  `${DOCS_BASE}/verifik-biometrics-apis/liveness/face-detection`,
  `${DOCS_BASE}/resources/list-all-persons`,
] as const;

export const buildSearchRelatedDocs = (
  t: TFunction,
  ns: string,
  hrefs: readonly string[],
): RelatedDocItem[] =>
  hrefs.map((href, i) => ({
    href,
    title: t(`${ns}.relatedDocs.${i}.title`),
    description: t(`${ns}.relatedDocs.${i}.description`),
    badge: t(`${ns}.relatedDocs.${i}.badge`),
  }));
