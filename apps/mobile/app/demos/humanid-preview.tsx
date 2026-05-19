import { useMemo, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { previewHumanId, previewZelfIdQr, verifikConfig } from '@humanauthn/api-client';
import DemoLayout from '../../components/demos/DemoLayout';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoUploadImageButton from '../../components/demos/DemoUploadImageButton';
import DemoRelatedDocsSection, { type RelatedDocItem } from '../../components/demos/DemoRelatedDocsSection';
import DemoResultCard from '../../components/demos/DemoResultCard';
import DemoResultActions from '../../components/demos/DemoResultActions';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
import {
  DOCS_HUMANID_PREVIEW,
  HUMANID_PREVIEW_RELATED_HREFS,
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

export default function HumanIdPreviewScreen() {
  const { t } = useTranslation();
  const ns = 'demos.humanidPreview';
  const { isLoading, isAuthenticated, session } = useMobileAuth();

  const [step, setStep] = useState<Step>('form');
  const [proofMode, setProofMode] = useState<ProofMode>('paste');
  const [zelfProof, setZelfProof] = useState('');
  const [verifierKey, setVerifierKey] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrExtracting, setQrExtracting] = useState(false);
  const [qrExtractMessage, setQrExtractMessage] = useState<string | null>(null);

  const relatedDocs = useMemo((): RelatedDocItem[] => {
    return HUMANID_PREVIEW_RELATED_HREFS.map((href, i) => ({
      href,
      title: t(`${ns}.relatedDocs.${i}.title`),
      description: t(`${ns}.relatedDocs.${i}.description`),
      badge: t(`${ns}.relatedDocs.${i}.badge`),
    })).filter((item) => Boolean(item.title));
  }, [t]);

  const previewParamRows = useMemo(
    () => [
      { name: 'zelfProof', type: 'string', required: true, description: t(`${ns}.paramZelfProofDesc`) },
      { name: 'verifierKey', type: 'string', required: false, description: t(`${ns}.paramVerifierKeyDesc`) },
    ],
    [t],
  );

  const fetchExample = `await fetch("${verifikConfig.apiUrl}/v2/human-id/preview", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    zelfProof: "<human id string>",
  }),
});`;

  const qrFetchExample = `await fetch("${verifikConfig.apiUrl}/v2/human-id/preview-zelf-id-qr", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    zelfProofQRCode: "data:image/png;base64,<...>",
  }),
});`;

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

  const extractQrFromAsset = async (uri: string, base64: string, mimeType?: string | null) => {
    const token = session?.accessToken;
    if (!token) {
      setError(t('demos.common.mustBeSignedIn'));
      return;
    }

    setError('');
    setQrExtractMessage(null);
    setQrPreview(uri);
    setQrExtracting(true);

    try {
      const mime = mimeType?.startsWith('image/') ? mimeType : 'image/png';
      const zelfProofQRCode = `data:${mime};base64,${base64}`;
      const apiRes = await previewZelfIdQr(
        { zelfProofQRCode, verifierKey: verifierKey.trim() || undefined },
        token,
      );
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

  const pickQrImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.9,
      base64: true,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    const base64 = asset.base64;
    if (!base64) return;
    await extractQrFromAsset(asset.uri, base64, asset.mimeType);
  };

  const submit = async () => {
    const token = session?.accessToken;
    if (!token || !zelfProof.trim()) return;
    setStep('processing');
    setError('');
    const res = await previewHumanId(
      { zelfProof: zelfProof.trim(), verifierKey: verifierKey.trim() || undefined },
      token,
    );
    if (res.error) {
      setError(res.error);
      setStep('form');
      return;
    }
    setResult(res.data);
    setStep('result');
  };

  const reset = () => {
    setStep('form');
    setZelfProof('');
    setVerifierKey('');
    setResult(null);
    setError('');
    setQrExtractMessage(null);
    setQrPreview(null);
    setProofMode('paste');
  };

  const canPreview = Boolean(zelfProof.trim() && !qrExtracting);
  const heroTitle = step === 'result' ? t(`${ns}.heroTitleResult`) : t(`${ns}.heroTitle`);

  return (
    <DemoLayout title={t(`${ns}.headerTitle`)}>
      <Text style={demoStyles.heroTitle}>{heroTitle}</Text>
      <Text style={demoStyles.heroSubtitle}>{t(`${ns}.heroSubtitle`)}</Text>

      {step !== 'result' ? (
        <DemoApiReference
          ns={ns}
          docsUrl={DOCS_HUMANID_PREVIEW}
          docsLabel={t(`${ns}.apiOfficialLinkLabel`)}
          endpoint="POST /v2/human-id/preview"
          extraParagraphKey="apiPreviewEndpointDesc"
          customParamRows={previewParamRows}
          fetchExample={fetchExample}
          responseExample={qrFetchExample}
          bullets={['apiBullet1', 'apiBullet2']}
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
          <DemoResultCard title={t(`${ns}.heroTitleResult`)} data={result} />
          <DemoResultActions
            onReset={reset}
            tryAgainLabel={t('demos.humanIdPreviewResult.previewAnother')}
          />
        </>
      ) : (
        <>
          <View style={styles.formPanel}>
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
                  <DemoUploadImageButton
                    label={qrExtracting ? t(`${ns}.readingQr`) : t(`${ns}.chooseQrImage`)}
                    previewUri={qrPreview}
                    onPick={({ uri, base64 }) => {
                      if (base64) extractQrFromAsset(uri, base64);
                    }}
                  />
                  {qrExtracting ? <ActivityIndicator color={colors.primary} /> : null}
                </View>
                {!qrExtracting ? (
                  <DemoPrimaryCta label={t(`${ns}.chooseQrImage`)} onPress={pickQrImage} />
                ) : null}
                {zelfProof && proofMode === 'qr' ? (
                  <View style={styles.extractedBox}>
                    <Text style={styles.extractedHeading}>{t(`${ns}.extractedHeading`)}</Text>
                    <Text style={styles.extractedValue} numberOfLines={6} selectable>
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
              label={t(`${ns}.verifierKeyOptional`)}
              value={verifierKey}
              onChangeText={setVerifierKey}
              placeholder={t(`${ns}.verifierKeyPlaceholder`)}
            />
          </View>

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <DemoPrimaryCta label={t(`${ns}.previewCta`)} onPress={submit} disabled={!canPreview} />
        </>
      )}

      <DemoRelatedDocsSection items={relatedDocs} />
    </DemoLayout>
  );
}

const styles = StyleSheet.create({
  formPanel: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  qrBlock: { gap: spacing.sm },
  qrHelp: { color: colors.onSurfaceVariant, fontSize: typography.sizes.xs },
  qrRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
  errorBanner: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(147,0,10,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.25)',
  },
  errorText: { color: colors.error, fontSize: 14 },
});
