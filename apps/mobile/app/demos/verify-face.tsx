import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { verifyFace, verifikConfig, type PersonListItem } from '@humanauthn/api-client';
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
import PersonPicker from '../../components/demos/PersonPicker';
import CollectionPicker from '../../components/demos/CollectionPicker';
import DemoMinScoreControl from '../../components/demos/face-compare/DemoMinScoreControl';
import { LIVENESS_SAMPLE_SOURCES, loadSampleImageBase64 } from '../../components/demos/livenessSampleAssets';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
import {
  demoStyles,
  DemoPrimaryCta,
  DemoProcessing,
  DemoChipGroup,
} from '../../lib/demoScreenStyles';
import { colors, spacing, radius } from '../../constants/tokens';

const DOCS_BASE = 'https://docs.verifik.co';

const RELATED_DOC_HREFS = [
  `${DOCS_BASE}/biometrics/compare`,
  `${DOCS_BASE}/biometrics/compare-live`,
  `${DOCS_BASE}/biometrics/compare-with-liveness`,
  `${DOCS_BASE}/biometrics/search`,
  `${DOCS_BASE}/biometrics/liveness`,
] as const;

export default function VerifyFaceScreen() {
  const { t } = useTranslation();
  const ns = 'demos.verifyFace';
  const { isLoading, isAuthenticated, session } = useMobileAuth();

  const [person, setPerson] = useState<PersonListItem | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0.75);
  const [searchMode, setSearchMode] = useState<'FAST' | 'ACCURATE'>('FAST');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);

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
      { name: 'id', type: 'string', required: true, description: t(`${ns}.paramIdDesc`) },
      { name: 'images', type: 'string[]', required: true, description: t(`${ns}.paramImagesDesc`) },
      { name: 'min_score', type: 'number', required: true, description: t(`${ns}.paramMinScoreDesc`) },
      { name: 'search_mode', type: 'string', required: true, description: t(`${ns}.paramSearchModeDesc`) },
      { name: 'collection_id', type: 'string', required: false, description: t(`${ns}.paramCollectionIdDesc`) },
    ],
    [t],
  );

  const fetchExample = `await verifyFace(
  {
    id: "<personMongoId>",
    images: ["<base64>", "<base64>"],
    min_score: ${minScore},
    search_mode: "${searchMode}",
    collection_id: "<optionalCollectionMongoId>",
  },
  accessToken,
);`;

  const appendImage = (uri: string, base64: string) => {
    setImages((prev) => [...prev, base64]);
    setPreviews((prev) => [...prev, uri]);
    setResult(null);
    setError('');
  };

  const pickMultiple = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.85,
      base64: true,
    });
    if (res.canceled) return;
    res.assets.forEach((asset) => {
      if (asset.base64) appendImage(asset.uri, asset.base64);
    });
  };

  const runSample = async (index: number) => {
    if (!isAuthenticated) return;
    try {
      const { uri, base64 } = await loadSampleImageBase64(index);
      appendImage(uri, base64);
    } catch {
      setError(t('demos.liveness.sampleLoadError'));
    }
  };

  const submit = async () => {
    const token = session?.accessToken;
    const id = person?._id;
    if (!token || !id || !images.length) return;

    setProcessing(true);
    setError('');
    setResult(null);

    const res = await verifyFace(
      {
        id,
        images,
        min_score: minScore,
        search_mode: searchMode,
        collection_id: collectionId ?? undefined,
      },
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
    setPerson(null);
    setCollectionId(null);
    setImages([]);
    setPreviews([]);
    setMinScore(0.75);
    setSearchMode('FAST');
    setResult(null);
    setError('');
  };

  const token = session?.accessToken ?? '';
  const uploadLabel =
    images.length > 0
      ? t('demos.common.imagesAddMore', { count: images.length })
      : t('demos.common.uploadFaceImages');

  return (
    <View style={demoStyles.screen}>
      <DemoScreenShell title={t(`${ns}.headerTitle`)} />
      <ScrollView contentContainerStyle={demoStyles.scroll}>
        {result == null ? (
          <DemoApiReference
            ns={ns}
            docsUrl={`${DOCS_BASE}/biometrics/verify-face`}
            docsLabel="docs.verifik.co/biometrics/verify-face"
            endpoint={t(`${ns}.apiRefEndpoint`)}
            customParamRows={paramRows}
            fetchExample={fetchExample}
            bullets={['bulletApiClient', 'bulletResponse']}
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
            <DemoResultCard title={t(`${ns}.resultTitle`)} data={result} />
            <DemoResultActions onReset={reset} tryAgainLabel={t(`${ns}.reset`)} />
          </>
        ) : processing ? (
          <DemoProcessing message={t(`${ns}.verifying`)} />
        ) : (
          <>
            <PersonPicker
              accessToken={token}
              label={t(`${ns}.personIdLabel`)}
              selectedId={person?._id ?? null}
              onSelect={setPerson}
            />

            <CollectionPicker
              accessToken={token}
              label={t(`${ns}.collectionIdLabel`)}
              selectedId={collectionId}
              onSelect={setCollectionId}
            />

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

            <View style={styles.capturePanel}>
              <DemoChooseOneCallout description={t(`${ns}.chooseOneDescription`)} />

              <DemoCaptureOptionHeading
                label="A"
                title={t(`${ns}.cameraTitle`)}
                subtitle={t(`${ns}.cameraSubtitle`)}
              />
              <DemoScannerShell minHeight={300}>
                <FaceGuidedCamera
                  onCapture={({ uri, base64 }) => appendImage(uri, base64)}
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
                label={uploadLabel}
                previewUri={previews[previews.length - 1] ?? null}
                onPick={({ uri, base64 }) => appendImage(uri, base64)}
              />
              <DemoPrimaryCta label={uploadLabel} onPress={pickMultiple} />

              <DemoTestSamples
                sources={[...LIVENESS_SAMPLE_SOURCES]}
                onSelect={runSample}
                disabled={processing}
                ns="demos.liveness"
              />
            </View>

            {previews.length > 0 ? (
              <View style={demoStyles.previewRow}>
                {previews.map((uri) => (
                  <Image key={uri} source={{ uri }} style={demoStyles.previewThumb} />
                ))}
              </View>
            ) : null}

            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <DemoPrimaryCta
              label={t(`${ns}.verify`)}
              onPress={submit}
              disabled={!person || !images.length}
            />
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
