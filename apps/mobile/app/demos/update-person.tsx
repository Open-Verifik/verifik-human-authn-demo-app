import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getPerson, updatePerson, type PersonListItem } from '@humanauthn/api-client';
import DemoScreenShell from '../../components/demos/DemoScreenShell';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoFormSection from '../../components/demos/DemoFormSection';
import DemoRelatedDocsSection, { type RelatedDocItem } from '../../components/demos/DemoRelatedDocsSection';
import { CreatePersonResultCard } from '../../components/demos/results/SearchPersonResultCard';
import PersonPicker from '../../components/demos/PersonPicker';
import CollectionPicker from '../../components/demos/CollectionPicker';
import { demoErrorBannerStyles } from '../../components/demos/DemoFaceCapturePanel';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
import { unwrapApiData } from '../../lib/demoHelpers';
import {
  demoStyles,
  DemoField,
  DemoPrimaryCta,
  DemoProcessing,
  DemoChipGroup,
} from '../../lib/demoScreenStyles';
const DOCS_BASE = 'https://docs.verifik.co';

const RELATED_DOC_HREFS = [
  `${DOCS_BASE}/resources/retrieve-a-person`,
  `${DOCS_BASE}/resources/persons/update-a-person`,
  `${DOCS_BASE}/resources/create-a-person`,
  `${DOCS_BASE}/resources/persons/delete-a-person`,
] as const;

type Step = 'form' | 'processing' | 'result';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const readPerson = (raw: unknown) => unwrapApiData(raw);

export default function UpdatePersonScreen() {
  const { t } = useTranslation();
  const ns = 'demos.updatePerson';
  const { isLoading, isAuthenticated, session } = useMobileAuth();

  const [step, setStep] = useState<Step>('form');
  const [person, setPerson] = useState<PersonListItem | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('');
  const [notes, setNotes] = useState('');
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [loadingPerson, setLoadingPerson] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
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
      { name: 'name', type: 'string', required: false, description: t(`${ns}.paramNameDesc`, { defaultValue: 'Display name' }) },
      { name: 'gender', type: 'string', required: false, description: t(`${ns}.paramGenderDesc`, { defaultValue: 'M or F' }) },
      {
        name: 'date_of_birth',
        type: 'string',
        required: false,
        description: t(`${ns}.paramDobDesc`, { defaultValue: 'YYYY-MM-DD' }),
      },
      {
        name: 'nationality',
        type: 'string',
        required: false,
        description: t(`${ns}.paramNationalityDesc`, { defaultValue: 'Optional country code or label' }),
      },
      {
        name: 'collections',
        type: 'string[]',
        required: false,
        description: t(`${ns}.paramCollectionsDesc`, {
          defaultValue: 'Array of collection _id strings',
        }),
      },
      { name: 'notes', type: 'string', required: false, description: t(`${ns}.paramNotesDesc`, { defaultValue: 'Free-form notes' }) },
    ],
    [t, ns],
  );

  const fetchExample = `await updatePerson(
  "<personMongoId>",
  {
    name: "${name.trim() || 'Jane Doe'}",
    gender: "${gender}",
    date_of_birth: "${dob || '1990-01-01'}",
    nationality: "${nationality.trim() || 'CO'}",
    notes: "${notes.trim() || 'Optional notes'}",
    collections: [${collectionIds.length ? `"${collectionIds[0]}"` : '"<collectionId>"'}],
  },
  accessToken,
);`;

  useEffect(() => {
    const token = session?.accessToken;
    const id = person?._id;
    if (!token || !id) {
      setName('');
      setGender('M');
      setDob('');
      setNationality('');
      setNotes('');
      setCollectionIds([]);
      setLoadError('');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingPerson(true);
      setLoadError('');
      const res = await getPerson(id, token);
      if (cancelled) return;
      setLoadingPerson(false);

      if (res.error) {
        setLoadError(res.error);
        return;
      }

      const p = readPerson(res.data);
      if (!p) {
        setLoadError(t(`${ns}.unexpectedResponseShape`));
        return;
      }

      if (typeof p.name === 'string') setName(p.name);
      if (p.gender === 'M' || p.gender === 'F') setGender(p.gender);
      if (typeof p.date_of_birth === 'string') setDob(p.date_of_birth.slice(0, 10));
      if (typeof p.nationality === 'string') setNationality(p.nationality);
      if (typeof p.notes === 'string') setNotes(p.notes);
      if (Array.isArray(p.collections)) {
        setCollectionIds(p.collections.filter((c): c is string => typeof c === 'string'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [person?._id, session?.accessToken, t, ns]);

  const handlePersonSelect = (next: PersonListItem | null) => {
    setPerson(next);
    setSubmitError('');
    if (!next) setLoadError('');
  };

  const submit = async () => {
    const token = session?.accessToken;
    const id = person?._id;
    if (!token || !id || !name.trim() || !dob || !collectionIds.length) return;

    setStep('processing');
    setSubmitError('');

    const res = await updatePerson(
      id,
      {
        name: name.trim(),
        gender,
        date_of_birth: dob,
        nationality: nationality.trim() || undefined,
        notes: notes.trim() || undefined,
        collections: collectionIds,
      },
      token,
    );

    if (res.error) {
      setSubmitError(res.error);
      setStep('form');
      return;
    }

    setResult(res.data);
    setStep('result');
  };

  const reset = () => {
    setStep('form');
    setPerson(null);
    setName('');
    setGender('M');
    setDob('');
    setNationality('');
    setNotes('');
    setCollectionIds([]);
    setLoadError('');
    setSubmitError('');
    setResult(null);
  };

  const token = session?.accessToken ?? '';
  const resultRecord = isRecord(result) ? result : null;
  const showForm = step === 'form';
  const canSave =
    Boolean(person?._id) &&
    Boolean(name.trim()) &&
    Boolean(dob) &&
    collectionIds.length > 0 &&
    !loadingPerson;

  return (
    <View style={demoStyles.screen}>
      <DemoScreenShell title={t(`${ns}.headerTitle`)} />
      <ScrollView contentContainerStyle={demoStyles.scroll}>
        {showForm ? (
          <DemoApiReference
            ns={ns}
            docsUrl={`${DOCS_BASE}/resources/persons/update-a-person`}
            docsLabel={t(`${ns}.apiRefLinkLabel`)}
            endpoint="PUT /v2/face-recognition/persons/:id"
            customParamRows={paramRows}
            fetchExample={fetchExample}
          />
        ) : null}

        <Text style={demoStyles.heroTitle}>
          {step === 'result' ? t(`${ns}.heroTitleResult`) : t(`${ns}.heroTitleForm`)}
        </Text>
        <Text style={demoStyles.heroSubtitle}>
          {step === 'result' ? t(`${ns}.heroSubtitleResult`) : t(`${ns}.heroSubtitleForm`)}
        </Text>

        {isLoading ? (
          <DemoProcessing message={t('demos.common.loading', { defaultValue: 'Loading…' })} />
        ) : !isAuthenticated ? (
          <DemoSignInPrompt />
        ) : step === 'processing' ? (
          <DemoProcessing message={t(`${ns}.processing`)} />
        ) : step === 'result' ? (
          <CreatePersonResultCard result={resultRecord} onReset={reset} mode="update" />
        ) : (
          <>
            <DemoFormSection
              stepLabel="1"
              title={t(`${ns}.personLabel`)}
              subtitle={t(`${ns}.personHint`)}
            >
              <PersonPicker
                accessToken={token}
                label={t(`${ns}.personLabel`)}
                selectedId={person?._id ?? null}
                onSelect={handlePersonSelect}
              />
              {loadingPerson ? (
                <DemoProcessing message={t(`${ns}.loadingProfile`)} />
              ) : null}
              {!!loadError && (
                <View style={demoErrorBannerStyles.errorBanner}>
                  <Text style={demoErrorBannerStyles.errorText}>{loadError}</Text>
                </View>
              )}
            </DemoFormSection>

            {person && !loadingPerson && !loadError ? (
              <DemoFormSection
                stepLabel="2"
                title={t(`${ns}.editSectionTitle`, { defaultValue: 'Profile & collections' })}
                subtitle={t(`${ns}.editSectionSubtitle`, {
                  defaultValue: 'Face enrollment images are not changed by this endpoint.',
                })}
              >
                <DemoField
                  label={t(`${ns}.fullNameLabel`)}
                  required
                  value={name}
                  onChangeText={setName}
                  placeholder={t('demos.createPerson.namePlaceholder', { defaultValue: 'Jane Doe' })}
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
                <DemoField
                  label={t(`${ns}.notesLabel`)}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  style={demoStyles.inputMultiline}
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
              </DemoFormSection>
            ) : null}

            {!!submitError && (
              <View style={demoErrorBannerStyles.errorBanner}>
                <Text style={demoErrorBannerStyles.errorText}>{submitError}</Text>
              </View>
            )}

            <DemoPrimaryCta
              label={t(`${ns}.saveChanges`)}
              onPress={submit}
              disabled={!canSave}
            />
          </>
        )}

        <DemoRelatedDocsSection items={relatedDocs} />
      </ScrollView>
    </View>
  );
}
