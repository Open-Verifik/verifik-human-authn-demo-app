import type { TFunction } from 'i18next';

export type HumanIdEncryptParamRow = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

const ENCRYPT_PARAM_KEYS = [
  ['publicData', true, 'paramPublicData'],
  ['faceBase64', true, 'paramFaceBase64'],
  ['metadata', true, 'paramMetadata'],
  ['os', true, 'paramOs'],
  ['identifier', true, 'paramIdentifier'],
  ['requireLiveness', true, 'paramRequireLiveness'],
  ['tolerance', false, 'paramTolerance'],
  ['password', false, 'paramPassword'],
] as const;

/** API reference rows shared by HumanID encrypt demos. */
export const buildHumanIdEncryptParamRows = (t: TFunction, ns: string): HumanIdEncryptParamRow[] =>
  ENCRYPT_PARAM_KEYS.map(([name, required, descKey]) => ({
    name,
    type: 'string',
    required,
    description: t(`${ns}.${descKey}`),
  }));

export const DOCS_HUMANID_DECRYPT = 'https://docs.verifik.co/functions/decrypt-zelfproof';
export const DOCS_HUMANID_PREVIEW = 'https://docs.verifik.co/api/tags/preview-zelfproof';

export const HUMANID_DECRYPT_RELATED_HREFS = [
  DOCS_HUMANID_DECRYPT,
  'https://docs.verifik.co/functions/create-zelfproof',
  'https://docs.verifik.co/api/tags/preview-zelfproof',
  'https://docs.verifik.co/functions/create-qr-zelfproof',
  'https://docs.verifik.co/biometrics/liveness',
] as const;

export const HUMANID_PREVIEW_RELATED_HREFS = [
  DOCS_HUMANID_PREVIEW,
  'https://docs.verifik.co/functions/create-zelfproof',
  DOCS_HUMANID_DECRYPT,
  'https://docs.verifik.co/functions/create-qr-zelfproof',
  'https://docs.verifik.co/biometrics/liveness',
] as const;
