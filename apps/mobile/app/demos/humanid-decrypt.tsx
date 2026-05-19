import React, { useMemo, useState } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { decryptHumanId, previewZelfIdQr } from '@humanauthn/api-client';
import DemoLayout from '../../components/demos/DemoLayout';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoChooseOneCallout from '../../components/demos/DemoChooseOneCallout';
import DemoScannerShell from '../../components/demos/DemoScannerShell';
import DemoTestSamples from '../../components/demos/DemoTestSamples';
import FaceGuidedCamera from '../../components/demos/FaceGuidedCamera';
import DemoUploadImageButton from '../../components/demos/DemoUploadImageButton';
import DemoCaptureOptionHeading, { DemoOrDivider } from '../../components/demos/DemoCaptureOptionHeading';
import { LIVENESS_SAMPLE_SOURCES, loadSampleImageBase64 } from '../../components/demos/livenessSampleAssets';
import DemoRelatedDocsSection, { type RelatedDocItem } from '../../components/demos/DemoRelatedDocsSection';
import DemoResultCard from '../../components/demos/DemoResultCard';
import DemoResultActions from '../../components/demos/DemoResultActions';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
import { getBiometricOs } from '../../lib/demoHelpers';
import {
  DOCS_HUMANID_DECRYPT,
  HUMANID_DECRYPT_RELATED_HREFS,
} from '../../lib/humanidDemoHelpers';
import {
  demoStyles,
  DemoField,
  DemoPrimaryCta,
  DemoProcessing,
  DemoChipGroup,
} from '../../lib/demoScreenStyles';
import { colors, spacing, radius, typography } from '../../constants/tokens';

type Step = 'form' | 'processing' | 'result';
type ProofMode = 'paste' | 'qr';

export default function HumanIdDecryptScreen() {
  const { t } = useTranslation();
  const ns = 'demos.humanidDecrypt';
  const { isLoading, isAuthenticated, session } = useMobileAuth();

  const [step, setStep] = useState<Step>('form');
  const [proofMode, setProofMode] = useState<ProofMode>('paste');
  const [zelfProof, setZelfProof] = useState('');
  const [password, setPassword] = useState('');
  const [faceB64, setFaceB64] = useState<string | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrExtracting, setQrExtracting] = useState(false);
  const [qrExtractMessage, setQrExtractMessage] = useState<string | null>(null);

  const relatedDocs = useMemo((): RelatedDocItem[] => {
    return HUMANID_DECRYPT_RELATED_HREFS.map((href, i) => ({
      href,
      title: t(`${ns}.relatedDocs.${i}.title`),
      description: t(`${ns}.relatedDocs.${i}.description`),
      badge: t(`${ns}.relatedDocs.${i}.badge`),
    })).filter((item) => Boolean(item.title));
  }, [t]);

  const decryptParamRows = useMemo(
    () => [
      { name: 'faceBase64', type: 'string', required: true, description: t(`${ns}.paramFaceBase64Desc`) },
      { name: 'os', type: 'string', required: true, description: t(`${ns}.paramOsDesc`) },
      { name: 'zelfProof', type: 'string', required: true, description: t(`${ns}.paramZelfProofDesc`) },
      { name: 'password', type: 'string', required: false, description: t(`${ns}.paramPasswordDesc`) },
      { name: 'verifierKey', type: 'string', required: false, description: t(`${ns}.paramVerifierKeyDesc`) },
    ],
    [t],
  );

  const setProofModeAndReset = (mode: ProofMode) => {
    setProofMode(mode);
    setError('');
    setQrExtractMessage(null);
    if (mode === 'paste') {
      setQrPreview(null);
      setZelfProof('');
    } else {
      setZelfProof('');
    }
  };

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

  const pickQrImage = async () => {
    const token = session?.accessToken;
    if (!token) {
      setError(t('demos.common.mustBeSignedIn'));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.9,
      base64: true,
    });
    if (res.canceled || !res.assets[0]?.base64) return;

    const asset = res.assets[0];
    setError('');
    setQrExtractMessage(null);
    setQrPreview(asset.uri);
    setQrExtracting(true);

    try {
      const mime = asset.mimeType?.startsWith('image/') ? asset.mimeType : 'image/png';
      const zelfProofQRCode = `data:${mime};base64,${asset.base64}`;
      const apiRes = await previewZelfIdQr({ zelfProofQRCode }, token);
      if (apiRes.error) {
        setZelfProof('');
        setError(apiRes.error);
        return;
      }
      const envelope = apiRes.data as { data?: { zelfProof?: string } } | undefined;
      const extracted = envelope?.data?.zelfProof;
      if (!extracted || typeof extracted !== 'string') {
        setZelfProof('');
        setError(t(`${ns}.errorReadProof`));
        return;
      }
      setZelfProof(extracted);
      setQrExtractMessage(t(`${ns}.qrExtractSuccess`));
    } finally {
      setQrExtracting(false);
    }
  };

  const submit = async () => {
    const token = session?.accessToken;
    if (!token || !faceB64 || !zelfProof.trim()) return;
    setStep('processing');
    setError('');
    const res = await decryptHumanId(
      {
        faceBase64: faceB64,
        os: getBiometricOs(),
        zelfProof: zelfProof.trim(),
        password: password.trim() || undefined,
      },
      token,
    );
    if (res.error) {
      setError(res.error);
      setStep('form');
      return;
    }
    setResult(res.data ?? null);
    setStep('result');
  };

  const reset = () => {
    setStep('form');
    setFaceB64(null);
    setFacePreview(null);
    setResult(null);
    setError('');
    setZelfProof('');
    setQrExtractMessage(null);
    setQrPreview(null);
    setProofMode('paste');
  };

  const canDecrypt = Boolean(faceB64 && zelfProof.trim() && !qrExtracting);
  const heroTitle = step === 'result' ? t(`${ns}.heroTitleResult`) : t(`${ns}.heroTitle`);

  return (
    <DemoLayout title={t(`${ns}.headerTitle`)}>
      <Text style={demoStyles.heroTitle}>{heroTitle}</Text>
      <Text style={demoStyles.heroSubtitle}>{t(`${ns}.heroSubtitle`)}</Text>

      {step !== 'result' ? (
        <DemoApiReference
          ns={ns}
          docsUrl={DOCS_HUMANID_DECRYPT}
          docsLabel={t(`${ns}.apiDecryptLinkText`)}
          endpoint="POST /v2/human-id/decrypt"
          extraParagraphKey="apiDecryptEndpointDesc"
          customParamRows={decryptParamRows}
          bullets={['apiBullet1', 'apiBullet2', 'apiBullet3']}
        />
      ) : null}

      {isLoading ? (
        <DemoProcessing message={t('demos.common.loading')} />
      ) : !isAuthenticated ? (
        <DemoSignInPrompt />
      ) : step === 'processing' ? (
        <DemoProcessing message={t(`${ns}.processing`)} />
      ) : step === 'result' ? (
        <>
          <DemoResultCard data={result} />
          <DemoResultActions onReset={reset} tryAgainLabel={t('demos.humanIdDecryptResult.tryAgain')} />
        </>
      ) : (
        <>
          <View>
            <Text style={demoStyles.label}>{t(`${ns}.humanIdModeLabel`)}</Text>
            <DemoChipGroup
              value={proofMode}
              onChange={setProofModeAndReset}
              options={[
                { value: 'paste', label: t(`${ns}.pasteString`) },
                { value: 'qr', label: t(`${ns}.uploadQrImage`) },
              ]}
            />
          </View>

          {proofMode === 'paste' ? (
            <DemoField
              label={t(`${ns}.proofLabel`)}
              required
              value={zelfProof}
              onChangeText={(text) => {
                setZelfProof(text);
                setQrExtractMessage(null);
              }}
              multiline
              style={demoStyles.inputMultiline}
              placeholder={t(`${ns}.proofPlaceholder`)}
            />
          ) : (
            <View style={styles.qrBlock}>
              <Text style={styles.qrHelp}>{t(`${ns}.qrUploadHelp`)}</Text>
              <View style={styles.qrRow}>
                <DemoPrimaryCta
                  label={qrExtracting ? t(`${ns}.readingQr`) : t(`${ns}.chooseQrImage`)}
                  onPress={pickQrImage}
                  disabled={qrExtracting}
                />
                {qrExtracting ? <ActivityIndicator color={colors.primary} /> : null}
              </View>
              {qrPreview ? (
                <Image source={{ uri: qrPreview }} style={styles.qrPreview} accessibilityLabel={t(`${ns}.qrPreviewAlt`)} />
              ) : null}
              {zelfProof && proofMode === 'qr' ? (
                <View style={styles.extractedBox}>
                  <Text style={styles.extractedHeading}>{t(`${ns}.extractedHeading`)}</Text>
                  <Text style={styles.extractedValue} numberOfLines={4} selectable>
                    {zelfProof}
                  </Text>
                </View>
              ) : null}
              {qrExtractMessage ? (
                <Text style={styles.extractSuccess}>{qrExtractMessage}</Text>
              ) : null}
            </View>
          )}

          <DemoField
            label={t(`${ns}.passwordOptional`)}
            value={password}
            onChangeText={setPassword}
            placeholder={t(`${ns}.passwordPlaceholder`)}
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
            <View>
              {facePreview ? (
                <Image source={{ uri: facePreview }} style={styles.facePreview} accessibilityLabel={t(`${ns}.facePreviewAlt`)} />
              ) : null}
              <TouchableOpacity onPress={clearFaceCapture}>
                <Text style={styles.changeLink}>{t(`${ns}.changeFaceImage`)}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!!error && <Text style={demoStyles.error}>{error}</Text>}
          <DemoPrimaryCta label={t(`${ns}.decryptCta`)} onPress={submit} disabled={!canDecrypt} />
        </>
      )}

      <DemoRelatedDocsSection items={relatedDocs} />
    </DemoLayout>
  );
}

const styles = StyleSheet.create({
  capturePanel: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  required: { color: colors.error },
  qrBlock: { gap: spacing.sm },
  qrHelp: { color: colors.onSurfaceVariant, fontSize: typography.sizes.xs },
  qrRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qrPreview: {
    maxHeight: 160,
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
  },
  extractedBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,102,255,0.3)',
    backgroundColor: 'rgba(23,23,23,0.6)',
    padding: spacing.md,
    gap: spacing.xs,
  },
  extractedHeading: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  extractedValue: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: colors.onSurface,
  },
  extractSuccess: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  facePreview: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    marginBottom: spacing.sm,
  },
  changeLink: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    textDecorationLine: 'underline',
  },
});
