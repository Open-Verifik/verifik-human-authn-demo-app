import { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { searchLivePerson } from '@humanauthn/api-client';
import DemoScreenShell from '../../components/demos/DemoScreenShell';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoFaceCapturePanel, { demoErrorBannerStyles } from '../../components/demos/DemoFaceCapturePanel';
import DemoRelatedDocsSection from '../../components/demos/DemoRelatedDocsSection';
import SearchPersonResultCard from '../../components/demos/results/SearchPersonResultCard';
import CollectionPicker from '../../components/demos/CollectionPicker';
import DemoMinScoreControl from '../../components/demos/face-compare/DemoMinScoreControl';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
import { getBiometricOs } from '../../lib/demoHelpers';
import {
  buildSearchRelatedDocs,
  DOCS_BASE,
  SEARCH_LIVE_RELATED_HREFS,
} from '../../lib/searchDemoMobile';
import { demoFieldBlockStyles } from '../../lib/demoFieldStyles';
import {
  demoStyles,
  DemoPrimaryCta,
  DemoProcessing,
  DemoChipGroup,
} from '../../lib/demoScreenStyles';

export default function SearchLivePersonScreen() {
  const { t } = useTranslation();
  const ns = 'demos.searchLivePerson';
  const { isLoading, isAuthenticated, session } = useMobileAuth();
  const [image, setImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [livenessMinScore, setLivenessMinScore] = useState(0.65);
  const [minScore, setMinScore] = useState(0.8);
  const [searchMode, setSearchMode] = useState<'FAST' | 'ACCURATE'>('FAST');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const biometricOs = getBiometricOs();

  const relatedDocs = useMemo(
    () => buildSearchRelatedDocs(t, ns, SEARCH_LIVE_RELATED_HREFS),
    [t],
  );

  const paramRows = useMemo(
    () => [
      { name: 'image', type: 'string', required: true, description: t(`${ns}.paramImageDesc`) },
      { name: 'os', type: 'string', required: true, description: t(`${ns}.paramOsDesc`) },
      {
        name: 'liveness_min_score',
        type: 'number',
        required: true,
        description: t(`${ns}.paramLivenessMinDesc`),
      },
      { name: 'min_score', type: 'number', required: true, description: t(`${ns}.paramMinScoreDesc`) },
      { name: 'search_mode', type: 'string', required: true, description: t(`${ns}.paramSearchModeDesc`) },
      { name: 'collection_id', type: 'string', required: false, description: t(`${ns}.paramCollectionIdDesc`) },
    ],
    [t],
  );

  const fetchExample = `await searchLivePerson(
  {
    image: "<base64>",
    os: "${biometricOs}",
    liveness_min_score: ${livenessMinScore},
    min_score: ${minScore},
    search_mode: "${searchMode}",
    collection_id: "<optionalCollectionMongoId>",
  },
  accessToken,
);`;

  const setCapture = (uri: string, base64: string) => {
    setImage(base64);
    setPreview(uri);
    setResult(null);
    setError('');
  };

  const submit = async () => {
    const token = session?.accessToken;
    if (!token || !image) return;
    setProcessing(true);
    setError('');
    const res = await searchLivePerson(
      {
        image,
        os: biometricOs,
        liveness_min_score: livenessMinScore,
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
    setResult((res.data as Record<string, unknown>) ?? null);
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  const token = session?.accessToken ?? '';

  return (
    <View style={demoStyles.screen}>
      <DemoScreenShell title={t(`${ns}.headerTitle`)} />
      <ScrollView contentContainerStyle={demoStyles.scroll}>
        {result == null ? (
          <DemoApiReference
            ns={ns}
            docsUrl={`${DOCS_BASE}/biometrics/search-live-face`}
            docsLabel="docs.verifik.co/biometrics/search-live-face"
            endpoint={t(`${ns}.apiRefEndpoint`)}
            customParamRows={paramRows}
            fetchExample={fetchExample}
            bullets={['bulletApiClient', 'bulletLivenessFail']}
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
          <SearchPersonResultCard result={result} onReset={reset} />
        ) : processing ? (
          <DemoProcessing message={t(`${ns}.searching`)} />
        ) : (
          <>
            <CollectionPicker
              accessToken={token}
              label={t(`${ns}.collectionIdLabel`)}
              selectedId={collectionId}
              onSelect={setCollectionId}
            />
            <DemoMinScoreControl
              label={t(`${ns}.livenessMinLabel`, { score: livenessMinScore.toFixed(2) })}
              value={livenessMinScore}
              onChange={setLivenessMinScore}
              min={0.5}
              max={1}
            />
            <DemoMinScoreControl
              label={t(`${ns}.minScoreLabel`, { score: minScore.toFixed(2) })}
              value={minScore}
              onChange={setMinScore}
              min={0.5}
              max={1}
            />
            <View style={demoFieldBlockStyles.fieldBlock}>
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
            <DemoFaceCapturePanel
              ns={ns}
              previewUri={preview}
              onCapture={({ uri, base64 }) => setCapture(uri, base64)}
              previews={preview ? [preview] : []}
              onSampleError={setError}
            />
            {!!error && (
              <View style={demoErrorBannerStyles.errorBanner}>
                <Text style={demoErrorBannerStyles.errorText}>{error}</Text>
              </View>
            )}
            <DemoPrimaryCta
              label={t(`${ns}.searchLive`)}
              onPress={submit}
              disabled={!image}
            />
          </>
        )}

        <DemoRelatedDocsSection items={relatedDocs} />
      </ScrollView>
    </View>
  );
}
