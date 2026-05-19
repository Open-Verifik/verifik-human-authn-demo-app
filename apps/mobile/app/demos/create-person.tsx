import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { createPerson } from '@humanauthn/api-client';
import DemoScreenShell from '../../components/demos/DemoScreenShell';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoFaceCapturePanel, { demoErrorBannerStyles } from '../../components/demos/DemoFaceCapturePanel';
import DemoRelatedDocsSection, { type RelatedDocItem } from '../../components/demos/DemoRelatedDocsSection';
import { CreatePersonResultCard } from '../../components/demos/results/SearchPersonResultCard';
import CollectionPicker from '../../components/demos/CollectionPicker';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
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
  '/demos/update-person',
  '/demos/delete-person',
] as const;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

export default function CreatePersonScreen() {
  const { t } = useTranslation();
  const ns = 'demos.createPerson';
  const { isLoading, isAuthenticated, session } = useMobileAuth();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('');
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
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
      badge: t(`${ns}.relatedDocs.${i}.badge`, { defaultValue: '' }) || undefined,
    })).filter((item) => Boolean(item.title));
  }, [t]);

  const appendImage = (uri: string, base64: string) => {
    setImages((p) => [...p, base64]);
    setPreviews((p) => [...p, uri]);
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
    if (!token || !name.trim() || !dob || !images.length || !collectionIds.length) return;
    setProcessing(true);
    setError('');
    const res = await createPerson(
      {
        name: name.trim(),
        images,
        gender,
        date_of_birth: dob,
        collections: collectionIds,
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
    setCollectionIds([]);
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
            docsUrl="https://docs.verifik.co/resources/create-a-person/"
            docsLabel={t(`${ns}.apiRefLinkLabel`)}
            endpoint={t(`${ns}.apiRefEndpoint`)}
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
              label={t(`${ns}.collectionsLabel`)}
              multi
              selectedIds={collectionIds}
              onSelectMulti={setCollectionIds}
              selectedId={null}
              onSelect={() => {}}
            />
            <Text style={demoStyles.label}>{t(`${ns}.faceImagesLabel`)}</Text>
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
              label={t(`${ns}.submit`)}
              onPress={submit}
              disabled={!name.trim() || !dob || !images.length || !collectionIds.length}
            />
          </>
        )}

        <DemoRelatedDocsSection items={relatedDocs} />
      </ScrollView>
    </View>
  );
}
