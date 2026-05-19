import { useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createHumanId } from '@humanauthn/api-client';
import DemoLayout from '../../components/demos/DemoLayout';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoChooseOneCallout from '../../components/demos/DemoChooseOneCallout';
import DemoScannerShell from '../../components/demos/DemoScannerShell';
import DemoTestSamples from '../../components/demos/DemoTestSamples';
import FaceGuidedCamera from '../../components/demos/FaceGuidedCamera';
import DemoUploadImageButton from '../../components/demos/DemoUploadImageButton';
import DemoCaptureOptionHeading, { DemoOrDivider } from '../../components/demos/DemoCaptureOptionHeading';
import DemoFormSection from '../../components/demos/DemoFormSection';
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

export default function HumanIdCreateScreen() {
  const { t } = useTranslation();
  const ns = 'demos.humanidCreate';
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

  const encryptParamRows = useMemo(() => buildHumanIdEncryptParamRows(t, ns), [t]);

  const toleranceOptions = useMemo(
    () => [
      { value: 'SOFT' as const, label: t(`${ns}.toleranceSoftLabel`) },
      { value: 'REGULAR' as const, label: t(`${ns}.toleranceRegularLabel`) },
      { value: 'HARDENED' as const, label: t(`${ns}.toleranceHardenedLabel`) },
    ],
    [t],
  );

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
    const res = await createHumanId(
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
    const data = unwrapApiData(res.data);
    setResult(data ?? (res.data as Record<string, unknown>));
    setStep('result');
  };

  const reset = () => {
    setStep('form');
    setFaceB64(null);
    setFacePreview(null);
    setResult(null);
    setError('');
    setErrorCode(null);
    setPublicData({ name: 'Jane Doe', documentNumber: '12345678' });
    setMetadata({ createdBy: 'demo' });
  };

  const heroTitle = step === 'result' ? t(`${ns}.heroTitleResult`) : t(`${ns}.heroTitleForm`);

  return (
    <DemoLayout
      title={t(`${ns}.headerTitle`)}
      footer={
        step === 'result' && result ? (
          <DemoResultActions
            onReset={reset}
            tryAgainLabel={t('demos.common.createAnother')}
          />
        ) : undefined
      }
    >
      {step !== 'result' ? (
        <DemoApiReference
          ns={ns}
          endpoint="POST /v2/human-id/encrypt"
          extraParagraphKey="apiIntro"
          customParamRows={encryptParamRows}
        />
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
          <HumanIdStructuredResult data={result} />
        </>
      ) : (
        <>
          <DemoFormSection
            stepLabel="1"
            title={t(`${ns}.step1Title`)}
            subtitle={t(`${ns}.step1Subtitle`)}
          >
            <DemoField
              label={t(`${ns}.identifierLabel`)}
              required
              value={identifier}
              onChangeText={setIdentifier}
              placeholder={t(`${ns}.identifierPlaceholder`)}
            />
            <Text style={styles.fieldHint}>{t(`${ns}.identifierHint`)}</Text>
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
          </DemoFormSection>

          <DemoFormSection
            stepLabel="2"
            title={t(`${ns}.step2Title`)}
            subtitle={t(`${ns}.step2Subtitle`)}
          >
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
          </DemoFormSection>

          <DemoFormSection
            stepLabel="3"
            title={t(`${ns}.step3Title`)}
            subtitle={t(`${ns}.step3Subtitle`)}
          >
            <View>
              <Text style={demoStyles.label}>{t(`${ns}.unlockLivenessSwitchTitle`)}</Text>
              <Text style={styles.fieldHint}>{t(`${ns}.unlockLivenessSwitchHint`)}</Text>
              <DemoChipGroup
                value={requireLiveness ? 'on' : 'off'}
                onChange={(v) => setRequireLiveness(v === 'on')}
                options={[
                  { value: 'on', label: t(`${ns}.unlockLivenessOn`) },
                  { value: 'off', label: t(`${ns}.unlockLivenessOff`) },
                ]}
              />
            </View>
            <View>
              <Text style={demoStyles.label}>{t(`${ns}.unlockToleranceTitle`)}</Text>
              <Text style={styles.fieldHint}>{t(`${ns}.unlockToleranceHint`)}</Text>
              <DemoChipGroup value={tolerance} onChange={setTolerance} options={toleranceOptions} />
            </View>
            <DemoField
              label={t(`${ns}.unlockPasswordTitle`)}
              value={password}
              onChangeText={setPassword}
              placeholder={t(`${ns}.passwordPlaceholder`)}
            />
            <Text style={styles.fieldHint}>{t(`${ns}.unlockPasswordHint`)}</Text>
          </DemoFormSection>

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
  capturePanel: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  successTitle: {
    color: colors.onSurface,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  fieldHint: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.xs,
    marginTop: -spacing.xs,
  },
  required: { color: colors.error },
  facePreview: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
  },
  changeLink: {
    color: colors.onSurfaceVariant,
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
  },
  errorTitle: { color: colors.error, fontWeight: typography.weights.semibold },
  errorBody: { color: colors.error, fontSize: typography.sizes.sm },
});
