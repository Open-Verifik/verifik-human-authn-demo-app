import { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createPersonWithLiveness } from '@humanauthn/api-client';
import DemoScreenShell from '../../components/demos/DemoScreenShell';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoFaceCapturePanel, { demoErrorBannerStyles } from '../../components/demos/DemoFaceCapturePanel';
import DemoRelatedDocsSection, { type RelatedDocItem } from '../../components/demos/DemoRelatedDocsSection';
import { CreatePersonResultCard } from '../../components/demos/results/SearchPersonResultCard';
import CollectionPicker from '../../components/demos/CollectionPicker';
import DemoMinScoreControl from '../../components/demos/face-compare/DemoMinScoreControl';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
import { demoFieldBlockStyles } from '../../lib/demoFieldStyles';
import {
  demoStyles,
  DemoField,
  DemoPrimaryCta,
  DemoProcessing,
  DemoChipGroup,
} from '../../lib/demoScreenStyles';

const DOCS_BASE = 'https://docs.verifik.co';

const RELATED_DOC_HREFS = [
  `${DOCS_BASE}/resources/the-person-object`,
  `${DOCS_BASE}/resources/list-all-persons`,
  `${DOCS_BASE}/resources/retrieve-a-person`,
  `${DOCS_BASE}/resources/persons/update-a-person`,
  `${DOCS_BASE}/resources/persons/delete-a-person`,
  `${DOCS_BASE}/resources/create-a-person-with-liveness`,
  '/demos/update-person',
  '/demos/delete-person',
] as const;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

export default function CreatePersonWithLivenessScreen() {
  const { t } = useTranslation();
  const ns = 'demos.createPersonWithLiveness';
  const { isLoading, isAuthenticated, session } = useMobileAuth();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [livenessMinScore, setLivenessMinScore] = useState(0.65);
  const [minScore, setMinScore] = useState(0.8);
  const [searchMode, setSearchMode] = useState<'FAST' | 'ACCURATE'>('FAST');
  const [images, setImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);

  const relatedDocs = useMemo((): RelatedDocItem[] => {
    return RELATED_DOC_HREFS.map((href, i) => ({
      href,
      title: t(`${ns}.relatedDocs.${i}.title`),
      description: t(`${ns}.relatedDocs.${i}.description`),
      badge: t(`${ns}.relatedDocs.${i}.badge`),
    })).filter((item) => Boolean(item.title));
  }, [t]);

  const paramRows = useMemo(
    () => [
      { name: 'name', type: 'string', required: true, description: t(`${ns}.paramNameDesc`) },
      { name: 'images', type: 'string[]', required: true, description: t(`${ns}.paramImagesDesc`) },
      { name: 'gender', type: 'string', required: true, description: t(`${ns}.paramGenderDesc`) },
      { name: 'date_of_birth', type: 'string', required: true, description: t(`${ns}.paramDobDesc`) },
      { name: 'collection_id', type: 'string', required: true, description: t(`${ns}.paramCollectionIdDesc`) },
      {
        name: 'liveness_min_score',
        type: 'number',
        required: true,
        description: t(`${ns}.paramLivenessMinDesc`),
      },
      { name: 'min_score', type: 'number', required: true, description: t(`${ns}.paramMinScoreDesc`) },
      { name: 'search_mode', type: 'string', required: true, description: t(`${ns}.paramSearchModeDesc`) },
      { name: 'nationality', type: 'string', required: false, description: t(`${ns}.paramNationalityDesc`) },
    ],
    [t],
  );

  const fetchExample = `await createPersonWithLiveness(
  {
    name: "${name.trim() || 'Jane Doe'}",
    images: ["<base64>"],
    gender: "${gender}",
    date_of_birth: "${dob || '1990-01-01'}",
    collection_id: "<collectionMongoId>",
    liveness_min_score: ${livenessMinScore},
    min_score: ${minScore},
    search_mode: "${searchMode}",
  },
  accessToken,
);`;

  const appendImage = (uri: string, base64: string) => {
    setImages([base64]);
    setPreviews([uri]);
  };

  const submit = async () => {
    const token = session?.accessToken;
    if (!token || !name.trim() || !dob || !images.length || !collectionId) return;
    setProcessing(true);
    setError('');
    const res = await createPersonWithLiveness(
      {
        name: name.trim(),
        images,
        gender,
        date_of_birth: dob,
        collection_id: collectionId,
        liveness_min_score: livenessMinScore,
        min_score: minScore,
        search_mode: searchMode,
        nationality: nationality.trim() || undefined,
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
    setName('');
    setDob('');
    setNationality('');
    setCollectionId(null);
    setImages([]);
    setPreviews([]);
    setResult(null);
    setError('');
  };

  const token = session?.accessToken ?? '';
  const resultRecord = isRecord(result) ? result : null;

  return (
    <View style={demoStyles.screen}>
      <DemoScreenShell title={t(`${ns}.headerTitle`)} />
      <ScrollView contentContainerStyle={demoStyles.scroll}>
        {!result ? (
          <DemoApiReference
            ns={ns}
            docsUrl={`${DOCS_BASE}/resources/create-a-person-with-liveness`}
            docsLabel={t(`${ns}.apiRefDocsEnLink`)}
            endpoint={t(`${ns}.apiRefEndpoint`)}
            customParamRows={paramRows}
            fetchExample={fetchExample}
            bullets={['bullet1', 'bullet2']}
          />
        ) : null}

        <Text style={demoStyles.heroTitle}>
          {result ? t(`${ns}.heroTitleResult`) : t(`${ns}.heroTitleForm`)}
        </Text>
        <Text style={demoStyles.heroSubtitle}>
          {result ? t(`${ns}.heroSubtitleResult`) : t(`${ns}.heroSubtitleForm`)}
        </Text>

        {isLoading ? (
          <DemoProcessing message={t('demos.common.loading', { defaultValue: 'Loading…' })} />
        ) : !isAuthenticated ? (
          <DemoSignInPrompt />
        ) : processing ? (
          <DemoProcessing message={t(`${ns}.processing`)} />
        ) : result ? (
          <CreatePersonResultCard result={resultRecord} onReset={reset} mode="create" />
        ) : (
          <>
            <DemoField
              label={t(`${ns}.fullNameLabel`)}
              required
              value={name}
              onChangeText={setName}
              placeholder={t(`${ns}.namePlaceholder`)}
            />
            <View>
              <Text style={demoStyles.label}>{t(`${ns}.genderLabel`)}</Text>
              <DemoChipGroup
                value={gender}
                onChange={setGender}
                options={[
                  { value: 'M', label: t('demos.common.male', { defaultValue: 'Male' }) },
                  { value: 'F', label: t('demos.common.female', { defaultValue: 'Female' }) },
                ]}
              />
            </View>
            <DemoField
              label={t(`${ns}.dobLabel`)}
              required
              value={dob}
              onChangeText={setDob}
              placeholder="YYYY-MM-DD"
            />
            <DemoField
              label={t(`${ns}.nationalityLabel`)}
              value={nationality}
              onChangeText={setNationality}
              placeholder={t(`${ns}.nationalityPlaceholder`)}
            />
            <CollectionPicker
              accessToken={token}
              label={t(`${ns}.collectionIdLabel`)}
              selectedId={collectionId}
              onSelect={setCollectionId}
            />
            <DemoMinScoreControl
              label={t(`${ns}.livenessMinLabel`, { value: livenessMinScore.toFixed(2) })}
              value={livenessMinScore}
              onChange={setLivenessMinScore}
              min={0.5}
              max={1}
            />
            <DemoMinScoreControl
              label={t(`${ns}.matchMinLabel`, { value: minScore.toFixed(2) })}
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
            <Text style={demoStyles.label}>{t(`${ns}.faceImagesLabel`)}</Text>
            <DemoFaceCapturePanel
              ns={ns}
              previewUri={previews[0] ?? null}
              onCapture={({ uri, base64 }) => appendImage(uri, base64)}
              previews={previews}
              onSampleError={setError}
            />
            {!!error && (
              <View style={demoErrorBannerStyles.errorBanner}>
                <Text style={demoErrorBannerStyles.errorText}>{error}</Text>
              </View>
            )}
            <DemoPrimaryCta
              label={t(`${ns}.submit`)}
              onPress={submit}
              disabled={!name.trim() || !dob || !images.length || !collectionId}
            />
          </>
        )}

        <DemoRelatedDocsSection items={relatedDocs} />
      </ScrollView>
    </View>
  );
}
