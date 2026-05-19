import { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { searchPersons } from '@humanauthn/api-client';
import DemoScreenShell from '../../components/demos/DemoScreenShell';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoFaceCapturePanel, { demoErrorBannerStyles } from '../../components/demos/DemoFaceCapturePanel';
import DemoRelatedDocsSection from '../../components/demos/DemoRelatedDocsSection';
import SearchPersonResultCard from '../../components/demos/results/SearchPersonResultCard';
import CollectionPicker from '../../components/demos/CollectionPicker';
import DemoMinScoreControl from '../../components/demos/face-compare/DemoMinScoreControl';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
import {
  buildSearchRelatedDocs,
  DOCS_BASE,
  SEARCH_PERSON_RELATED_HREFS,
} from '../../lib/searchDemoMobile';
import { demoFieldBlockStyles } from '../../lib/demoFieldStyles';
import {
  demoStyles,
  DemoPrimaryCta,
  DemoProcessing,
  DemoChipGroup,
} from '../../lib/demoScreenStyles';

export default function SearchPersonScreen() {
  const { t } = useTranslation();
  const ns = 'demos.searchPerson';
  const { isLoading, isAuthenticated, session } = useMobileAuth();
  const [images, setImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0.75);
  const [searchMode, setSearchMode] = useState<'FAST' | 'ACCURATE'>('FAST');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const relatedDocs = useMemo(
    () => buildSearchRelatedDocs(t, ns, SEARCH_PERSON_RELATED_HREFS),
    [t],
  );

  const paramRows = useMemo(
    () => [
      { name: 'images', type: 'string[]', required: true, description: t(`${ns}.paramImagesDesc`) },
      { name: 'min_score', type: 'number', required: true, description: t(`${ns}.paramMinScoreDesc`) },
      { name: 'search_mode', type: 'string', required: true, description: t(`${ns}.paramSearchModeDesc`) },
      { name: 'collection_id', type: 'string', required: false, description: t(`${ns}.paramCollectionIdDesc`) },
      { name: 'max_results', type: 'number', required: false, description: t(`${ns}.paramMaxResultsDesc`) },
    ],
    [t],
  );

  const fetchExample = `await searchPersons(
  {
    images: ["<base64>", "<base64>"],
    min_score: ${minScore},
    search_mode: "${searchMode}",
    collection_id: "<optionalCollectionMongoId>",
  },
  accessToken,
);`;

  const appendImage = (uri: string, base64: string) => {
    setImages((p) => [...p, base64]);
    setPreviews((p) => [...p, uri]);
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
    res.assets.forEach((a) => {
      if (a.base64) appendImage(a.uri, a.base64);
    });
  };

  const submit = async () => {
    const token = session?.accessToken;
    if (!token || !images.length) return;
    setProcessing(true);
    setError('');
    const res = await searchPersons(
      {
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
    setResult((res.data as Record<string, unknown>) ?? null);
  };

  const reset = () => {
    setImages([]);
    setPreviews([]);
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
            docsUrl={`${DOCS_BASE}/biometrics/search`}
            docsLabel="docs.verifik.co/biometrics/search"
            endpoint={t(`${ns}.apiRefEndpoint`)}
            customParamRows={paramRows}
            fetchExample={fetchExample}
            bullets={['bulletApiClient', 'bulletSignature']}
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
              label={t(`${ns}.minScoreLabel`, { score: minScore.toFixed(2) })}
              value={minScore}
              onChange={setMinScore}
              min={0.2}
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
              previewUri={previews[previews.length - 1] ?? null}
              onCapture={({ uri, base64 }) => appendImage(uri, base64)}
              multiImage
              imageCount={images.length}
              onPickMultiple={pickMultiple}
              previews={previews}
              onSampleError={setError}
            />
            {!!error && (
              <View style={demoErrorBannerStyles.errorBanner}>
                <Text style={demoErrorBannerStyles.errorText}>{error}</Text>
              </View>
            )}
            <DemoPrimaryCta
              label={t(`${ns}.search`)}
              onPress={submit}
              disabled={!images.length}
            />
          </>
        )}

        <DemoRelatedDocsSection items={relatedDocs} />
      </ScrollView>
    </View>
  );
}
