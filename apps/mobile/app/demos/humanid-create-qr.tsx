import { useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createHumanIdQr } from '@humanauthn/api-client';
import DemoLayout from '../../components/demos/DemoLayout';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoChooseOneCallout from '../../components/demos/DemoChooseOneCallout';
import DemoScannerShell from '../../components/demos/DemoScannerShell';
import DemoTestSamples from '../../components/demos/DemoTestSamples';
import FaceGuidedCamera from '../../components/demos/FaceGuidedCamera';
import DemoUploadImageButton from '../../components/demos/DemoUploadImageButton';
import DemoCaptureOptionHeading, { DemoOrDivider } from '../../components/demos/DemoCaptureOptionHeading';
import { HumanIdStructuredResult } from '../../components/demos/DemoResultCard';
import DemoResultActions from '../../components/demos/DemoResultActions';
import HumanIdJsonKeyValueField from '../../components/demos/HumanIdJsonKeyValueField';
import { LIVENESS_SAMPLE_SOURCES, loadSampleImageBase64 } from '../../components/demos/livenessSampleAssets';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
import { getBiometricOs, unwrapApiData } from '../../lib/demoHelpers';
import { buildHumanIdEncryptParamRows } from '../../lib/humanidDemoHelpers';
import {
  demoStyles,
  DemoField,
  DemoPrimaryCta,
  DemoProcessing,
  DemoChipGroup,
} from '../../lib/demoScreenStyles';
import { colors, spacing, radius, typography } from '../../constants/tokens';

type Step = 'form' | 'processing' | 'result';
type Tolerance = 'REGULAR' | 'SOFT' | 'HARDENED';

const extractZelfQr = (raw: Record<string, unknown> | null): string | null => {
  if (!raw) return null;
  if (typeof raw.zelfQR === 'string') return raw.zelfQR;
  const inner = raw.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const zelf = (inner as Record<string, unknown>).zelfQR;
    if (typeof zelf === 'string') return zelf;
  }
  return null;
};

export default function HumanIdCreateQrScreen() {
  const { t } = useTranslation();
  const ns = 'demos.humanidCreateQr';
  const { isLoading, isAuthenticated, session } = useMobileAuth();

  const [step, setStep] = useState<Step>('form');
  const [identifier, setIdentifier] = useState('');
  const [requireLiveness, setRequireLiveness] = useState(true);
  const [tolerance, setTolerance] = useState<Tolerance>('HARDENED');
  const [password, setPassword] = useState('');
  const [faceB64, setFaceB64] = useState<string | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [publicData, setPublicData] = useState<Record<string, string>>({
    name: 'Jane Doe',
    documentNumber: '12345678',
  });
  const [metadata, setMetadata] = useState<Record<string, string>>({ createdBy: 'demo' });
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const encryptParamRows = useMemo(() => buildHumanIdEncryptParamRows(t, ns), [t]);

  const setFaceCapture = (uri: string, base64: string) => {
    setFaceB64(base64);
    setFacePreview(uri);
    setError('');
  };

  const clearFaceCapture = () => {
    setFaceB64(null);
    setFacePreview(null);
  };

  const runSample = async (index: number) => {
    if (!isAuthenticated) return;
    try {
      const { uri, base64 } = await loadSampleImageBase64(index);
      setFaceCapture(uri, base64);
    } catch {
      setError(t('demos.liveness.sampleLoadError'));
    }
  };

  const submit = async () => {
    const token = session?.accessToken;
    if (!token || !faceB64 || !identifier.trim()) return;
    if (!Object.keys(publicData).length || !Object.keys(metadata).length) {
      setError(t(`${ns}.errorKeysRequired`));
      return;
    }
    setStep('processing');
    setError('');
    setErrorCode(null);
    const res = await createHumanIdQr(
      {
        publicData,
        faceBase64: faceB64,
        metadata,
        os: getBiometricOs(),
        identifier: identifier.trim(),
        requireLiveness,
        tolerance,
        password: password.trim() || undefined,
      },
      token,
    );
    if (res.error) {
      setErrorCode(res.code ?? null);
      setError(res.error);
      setStep('form');
      return;
    }
    const envelope = res.data as Record<string, unknown>;
    const inner = unwrapApiData(res.data);
    setQrDataUrl(extractZelfQr(inner) ?? extractZelfQr(envelope));
    setResult(envelope);
    setStep('result');
  };

  const reset = () => {
    setStep('form');
    setFaceB64(null);
    setFacePreview(null);
    setResult(null);
    setQrDataUrl(null);
    setError('');
    setErrorCode(null);
    setPublicData({ name: 'Jane Doe', documentNumber: '12345678' });
    setMetadata({ createdBy: 'demo' });
  };

  const heroTitle = step === 'result' ? t(`${ns}.heroTitleResult`) : t(`${ns}.heroTitleForm`);

  return (
    <DemoLayout title={t(`${ns}.headerTitle`)}>
      {step !== 'result' ? (
        <>
          <DemoApiReference
            ns={ns}
            endpoint="POST /v2/human-id/encrypt-qr-code"
            customParamRows={encryptParamRows}
          />
          <Text style={styles.apiIntro}>
            {t(`${ns}.apiIntroBefore`)}{' '}
            <Text style={styles.apiIntroCode}>encrypt</Text>. {t(`${ns}.apiIntroAfter`)}
          </Text>
        </>
      ) : null}

      <Text style={demoStyles.heroTitle}>{heroTitle}</Text>
      <Text style={demoStyles.heroSubtitle}>{t(`${ns}.heroSubtitle`)}</Text>

      {isLoading ? (
        <DemoProcessing message={t('demos.common.loading')} />
      ) : !isAuthenticated ? (
        <DemoSignInPrompt />
      ) : step === 'processing' ? (
        <DemoProcessing message={t(`${ns}.processing`)} />
      ) : step === 'result' && result ? (
        <>
          <Text style={styles.successTitle}>{t(`${ns}.resultSuccessTitle`)}</Text>
          <Text style={styles.successDesc}>{t(`${ns}.resultSuccessDescription`)}</Text>
          {qrDataUrl ? (
            <Image
              source={{ uri: qrDataUrl }}
              style={styles.qrImage}
              accessibilityLabel={t(`${ns}.facePreviewAlt`)}
            />
          ) : null}
          <HumanIdStructuredResult data={result} />
          <DemoResultActions
            onReset={reset}
            tryAgainLabel={t('demos.common.createAnother')}
          />
        </>
      ) : (
        <>
          <DemoField
            label={t(`${ns}.identifierLabel`)}
            required
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={t(`${ns}.identifierPlaceholder`)}
          />
          <View>
            <Text style={demoStyles.label}>{t(`${ns}.toleranceLabel`)}</Text>
            <DemoChipGroup
              value={tolerance}
              onChange={setTolerance}
              options={[
                { value: 'REGULAR', label: 'REGULAR' },
                { value: 'SOFT', label: 'SOFT' },
                { value: 'HARDENED', label: 'HARDENED' },
              ]}
            />
          </View>
          <DemoField
            label={t(`${ns}.passwordOptionalLabel`)}
            value={password}
            onChangeText={setPassword}
            placeholder={t(`${ns}.passwordPlaceholder`)}
          />
          <View>
            <Text style={demoStyles.label}>{t(`${ns}.requireLivenessLabel`)}</Text>
            <DemoChipGroup
              value={requireLiveness ? 'yes' : 'no'}
              onChange={(v) => setRequireLiveness(v === 'yes')}
              options={[
                { value: 'yes', label: t('demos.common.yes') },
                { value: 'no', label: t('demos.common.no') },
              ]}
            />
          </View>
          <HumanIdJsonKeyValueField
            label={t(`${ns}.publicDataLabel`)}
            hint={t(`${ns}.publicDataHint`)}
            required
            value={publicData}
            onChange={setPublicData}
          />
          <HumanIdJsonKeyValueField
            label={t(`${ns}.metadataLabel`)}
            hint={t(`${ns}.metadataHint`)}
            required
            value={metadata}
            onChange={setMetadata}
          />

          <Text style={demoStyles.label}>
            {t(`${ns}.faceImageLabel`)}
            <Text style={styles.required}> *</Text>
          </Text>
          {!faceB64 ? (
            <View style={styles.capturePanel}>
              <DemoChooseOneCallout description={t(`${ns}.chooseOneDescription`)} />
              <DemoCaptureOptionHeading
                label="A"
                title={t(`${ns}.cameraTitle`)}
                subtitle={t(`${ns}.cameraSubtitle`)}
              />
              <DemoScannerShell minHeight={300}>
                <FaceGuidedCamera onCapture={({ uri, base64 }) => setFaceCapture(uri, base64)} />
              </DemoScannerShell>
              <DemoOrDivider />
              <DemoCaptureOptionHeading
                label="B"
                title={t(`${ns}.uploadTitle`)}
                subtitle={t(`${ns}.uploadSubtitle`)}
              />
              <DemoUploadImageButton
                label={t(`${ns}.uploadPrimary`)}
                onPick={({ uri, base64 }) => setFaceCapture(uri, base64)}
              />
              <DemoTestSamples
                sources={[...LIVENESS_SAMPLE_SOURCES]}
                onSelect={runSample}
                ns="demos.liveness"
              />
            </View>
          ) : (
            <>
              {facePreview ? (
                <Image
                  source={{ uri: facePreview }}
                  style={styles.facePreview}
                  accessibilityLabel={t(`${ns}.facePreviewAlt`)}
                />
              ) : null}
              <TouchableOpacity onPress={clearFaceCapture}>
                <Text style={styles.changeLink}>{t(`${ns}.changeFaceImage`)}</Text>
              </TouchableOpacity>
            </>
          )}

          {!!error && (
            <View style={styles.errorBanner}>
              {errorCode === 'ERR_LIVENESS_FAILED' ? (
                <>
                  <Text style={styles.errorTitle}>{t(`${ns}.errorLivenessFailedTitle`)}</Text>
                  <Text style={styles.errorBody}>{t(`${ns}.errorLivenessFailedBody`)}</Text>
                </>
              ) : (
                <Text style={styles.errorBody}>{error}</Text>
              )}
            </View>
          )}

          <DemoPrimaryCta
            label={t(`${ns}.submitCta`)}
            onPress={submit}
            disabled={!faceB64 || !identifier.trim()}
          />
        </>
      )}
    </DemoLayout>
  );
}

const styles = StyleSheet.create({
  apiIntro: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  apiIntroCode: {
    fontFamily: 'monospace',
    color: colors.primary,
  },
  capturePanel: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  successTitle: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  successDesc: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  qrImage: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    marginBottom: spacing.md,
  },
  required: { color: colors.error },
  facePreview: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
  },
  changeLink: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    textDecorationLine: 'underline',
    marginTop: spacing.sm,
  },
  errorBanner: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(147,0,10,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.25)',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  errorTitle: { color: colors.error, fontWeight: typography.weights.semibold },
  errorBody: { color: colors.error, fontSize: typography.sizes.sm },
});
