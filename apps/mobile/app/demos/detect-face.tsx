import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { detectFace, verifikConfig } from '@humanauthn/api-client';
import DemoScreenShell from '../../components/demos/DemoScreenShell';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoChooseOneCallout from '../../components/demos/DemoChooseOneCallout';
import DemoScannerShell from '../../components/demos/DemoScannerShell';
import DemoTestSamples from '../../components/demos/DemoTestSamples';
import FaceGuidedCamera from '../../components/demos/FaceGuidedCamera';
import DemoUploadImageButton from '../../components/demos/DemoUploadImageButton';
import DemoCaptureOptionHeading, { DemoOrDivider } from '../../components/demos/DemoCaptureOptionHeading';
import DemoResultCard from '../../components/demos/DemoResultCard';
import DemoResultActions from '../../components/demos/DemoResultActions';
import DemoRelatedDocsSection, { type RelatedDocItem } from '../../components/demos/DemoRelatedDocsSection';
import DemoMinScoreControl from '../../components/demos/face-compare/DemoMinScoreControl';
import { LIVENESS_SAMPLE_SOURCES, loadSampleImageBase64 } from '../../components/demos/livenessSampleAssets';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
import {
  demoStyles,
  DemoPrimaryCta,
  DemoProcessing,
  DemoChipGroup,
  countDetectedFaces,
} from '../../lib/demoScreenStyles';
import { colors, spacing, radius } from '../../constants/tokens';

const DOCS_BASE = 'https://docs.verifik.co';

const RELATED_DOC_HREFS = [
  `${DOCS_BASE}/biometrics/search`,
  `${DOCS_BASE}/biometrics/search-live-face`,
  `${DOCS_BASE}/biometrics/search-active-user`,
  `${DOCS_BASE}/biometrics/liveness`,
  `${DOCS_BASE}/biometrics/compare`,
  `${DOCS_BASE}/biometrics/compare-with-liveness`,
] as const;

export default function DetectFaceScreen() {
  const { t } = useTranslation();
  const ns = 'demos.detectFace';
  const { isLoading, isAuthenticated, session } = useMobileAuth();

  const [image, setImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0.75);
  const [searchMode, setSearchMode] = useState<'FAST' | 'ACCURATE'>('FAST');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [previewHighlighted, setPreviewHighlighted] = useState(false);
  const previewHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const relatedDocs = useMemo((): RelatedDocItem[] => {
    return RELATED_DOC_HREFS.map((href, i) => ({
      href,
      title: t(`${ns}.relatedDocs.${i}.title`),
      description: t(`${ns}.relatedDocs.${i}.description`),
      badge: t(`${ns}.relatedDocs.${i}.badge`),
    }));
  }, [t]);

  const paramRows = useMemo(
    () => [
      { name: 'image', type: 'string', required: true, description: t(`${ns}.paramImageDesc`) },
      { name: 'min_score', type: 'number', required: true, description: t(`${ns}.paramMinScoreDesc`) },
      { name: 'search_mode', type: 'string', required: true, description: t(`${ns}.paramSearchModeDesc`) },
      { name: 'collection_id', type: 'string', required: false, description: t(`${ns}.paramCollectionIdDesc`) },
      { name: 'max_results', type: 'number', required: false, description: t(`${ns}.paramMaxResultsDesc`) },
    ],
    [t],
  );

  const fetchExample = `await fetch("${verifikConfig.apiUrl}/v2/face-recognition/detect", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    image: "<base64>",
    min_score: ${minScore},
    search_mode: "${searchMode}",
  }),
});`;

  useEffect(
    () => () => {
      if (previewHighlightTimeoutRef.current) clearTimeout(previewHighlightTimeoutRef.current);
    },
    [],
  );

  const pulsePreview = () => {
    if (previewHighlightTimeoutRef.current) clearTimeout(previewHighlightTimeoutRef.current);
    setPreviewHighlighted(true);
    previewHighlightTimeoutRef.current = setTimeout(() => {
      setPreviewHighlighted(false);
      previewHighlightTimeoutRef.current = null;
    }, 2200);
  };

  const setCapture = (uri: string, base64: string) => {
    setImage(base64);
    setPreview(uri);
    setResult(null);
    setError('');
    pulsePreview();
  };

  const runSample = async (index: number) => {
    if (!isAuthenticated) return;
    try {
      const { uri, base64 } = await loadSampleImageBase64(index);
      setCapture(uri, base64);
    } catch {
      setError(t('demos.liveness.sampleLoadError'));
    }
  };

  const runDetect = async () => {
    const token = session?.accessToken;
    if (!token || !image) return;

    setProcessing(true);
    setError('');
    setResult(null);

    const res = await detectFace(
      { image, min_score: minScore, search_mode: searchMode },
      token,
    );

    setProcessing(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setResult(res.data);
  };

  const reset = () => {
    if (previewHighlightTimeoutRef.current) {
      clearTimeout(previewHighlightTimeoutRef.current);
      previewHighlightTimeoutRef.current = null;
    }
    setImage(null);
    setPreview(null);
    setResult(null);
    setError('');
    setPreviewHighlighted(false);
    setMinScore(0.75);
    setSearchMode('FAST');
  };

  const faceCount = result != null ? countDetectedFaces(result) : null;

  return (
    <View style={demoStyles.screen}>
      <DemoScreenShell title={t(`${ns}.headerTitle`)} />
      <ScrollView contentContainerStyle={demoStyles.scroll}>
        {result == null ? (
          <DemoApiReference
            ns={ns}
            docsUrl={`${DOCS_BASE}/verifik-biometrics-apis/liveness/face-detection`}
            docsLabel="docs.verifik.co/verifik-biometrics-apis/liveness/face-detection"
            endpoint={t(`${ns}.apiRefEndpoint`)}
            customParamRows={paramRows}
            fetchExample={fetchExample}
            bullets={['bulletApiClient', 'bulletSearch']}
          />
        ) : null}

        <Text style={demoStyles.heroTitle}>
          {result ? t(`${ns}.heroTitleComplete`) : t(`${ns}.heroTitleInitial`)}
        </Text>
        <Text style={demoStyles.heroSubtitle}>
          {result ? t(`${ns}.heroSubtitleComplete`) : t(`${ns}.heroSubtitleInitial`)}
        </Text>

        {isLoading ? (
          <DemoProcessing message={t('demos.common.loading', { defaultValue: 'Loading…' })} />
        ) : !isAuthenticated ? (
          <DemoSignInPrompt />
        ) : result != null ? (
          <>
            {faceCount != null ? (
              <Text style={styles.faceCount}>
                {t(`${ns}.faceCountLabel`, {
                  count: faceCount,
                  defaultValue: `Faces detected: ${faceCount}`,
                })}
              </Text>
            ) : null}
            <DemoResultCard title={t(`${ns}.resultTitle`)} data={result} />
            <DemoResultActions onReset={reset} tryAgainLabel={t(`${ns}.reset`)} />
          </>
        ) : (
          <>
            <DemoMinScoreControl
              label={t(`${ns}.minScoreLabel`, { score: minScore.toFixed(2) })}
              value={minScore}
              onChange={setMinScore}
              min={0.5}
              max={1}
            />

            <View style={styles.fieldBlock}>
              <Text style={demoStyles.label}>{t(`${ns}.searchModeLabel`)}</Text>
              <DemoChipGroup
                value={searchMode}
                onChange={setSearchMode}
                options={[
                  { value: 'FAST', label: 'FAST' },
                  { value: 'ACCURATE', label: 'ACCURATE' },
                ]}
              />
            </View>

            {!image ? (
              <View style={styles.capturePanel}>
                <DemoChooseOneCallout description={t(`${ns}.chooseOneDescription`)} />

                <DemoCaptureOptionHeading
                  label="A"
                  title={t(`${ns}.cameraTitle`)}
                  subtitle={t(`${ns}.cameraSubtitle`)}
                />
                <DemoScannerShell minHeight={300}>
                  <FaceGuidedCamera
                    onCapture={({ uri, base64 }) => setCapture(uri, base64)}
                    disabled={processing}
                  />
                </DemoScannerShell>

                <DemoOrDivider />
                <DemoCaptureOptionHeading
                  label="B"
                  title={t(`${ns}.uploadTitle`)}
                  subtitle={t(`${ns}.uploadSubtitle`)}
                />
                <DemoUploadImageButton
                  label={t(`${ns}.uploadPrimary`)}
                  onPick={({ uri, base64 }) => setCapture(uri, base64)}
                />

                <DemoTestSamples
                  sources={[...LIVENESS_SAMPLE_SOURCES]}
                  onSelect={runSample}
                  disabled={processing}
                  ns="demos.liveness"
                />
              </View>
            ) : null}

            {preview && image ? (
              <View style={[styles.previewWrap, previewHighlighted && styles.previewHighlighted]}>
                <Image
                  source={{ uri: preview }}
                  style={styles.previewImage}
                  accessibilityLabel={t(`${ns}.previewAlt`)}
                />
                <Text style={styles.changeLink} onPress={() => {
                  setImage(null);
                  setPreview(null);
                  setPreviewHighlighted(false);
                }}>
                  {t('demos.common.changeImage', { defaultValue: 'Change image' })}
                </Text>
              </View>
            ) : null}

            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {processing ? (
              <DemoProcessing message={t(`${ns}.detecting`)} />
            ) : image ? (
              <DemoPrimaryCta label={t(`${ns}.detectFaces`)} onPress={runDetect} disabled={!image} />
            ) : null}
          </>
        )}

        <DemoRelatedDocsSection items={relatedDocs} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: { marginTop: spacing.md },
  capturePanel: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.md,
  },
  previewWrap: {
    marginTop: spacing.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  previewHighlighted: {
    borderColor: 'rgba(74,222,128,0.5)',
    shadowColor: 'rgba(74,222,128,0.35)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceContainerHigh,
  },
  changeLink: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
    padding: spacing.sm,
    textAlign: 'center',
  },
  faceCount: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
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
