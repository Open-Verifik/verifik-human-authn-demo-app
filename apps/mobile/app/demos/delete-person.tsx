import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  deletePerson,
  getPerson,
  listCollections,
  type FaceCollectionListItem,
  type PersonListItem,
} from '@humanauthn/api-client';
import DemoScreenShell from '../../components/demos/DemoScreenShell';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoFormSection from '../../components/demos/DemoFormSection';
import DemoRelatedDocsSection, { type RelatedDocItem } from '../../components/demos/DemoRelatedDocsSection';
import DemoResultCard from '../../components/demos/DemoResultCard';
import DemoResultActions from '../../components/demos/DemoResultActions';
import DemoConfirmModal from '../../components/demos/DemoConfirmModal';
import PersonPicker from '../../components/demos/PersonPicker';
import { CreatePersonResultCard } from '../../components/demos/results/SearchPersonResultCard';
import { demoErrorBannerStyles } from '../../components/demos/DemoFaceCapturePanel';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
import { unwrapApiData } from '../../lib/demoHelpers';
import { demoStyles, DemoProcessing } from '../../lib/demoScreenStyles';
import { colors, spacing, radius, typography } from '../../constants/tokens';

const DOCS_BASE = 'https://docs.verifik.co';

const RELATED_DOC_HREFS = [
  `${DOCS_BASE}/resources/the-person-object`,
  `${DOCS_BASE}/resources/list-all-persons`,
  `${DOCS_BASE}/resources/retrieve-a-person`,
  `${DOCS_BASE}/resources/persons/delete-a-person`,
  `${DOCS_BASE}/resources/create-a-person`,
  `${DOCS_BASE}/resources/create-a-person-with-liveness`,
  `${DOCS_BASE}/resources/persons/update-a-person`,
  `${DOCS_BASE}/resources/persons`,
] as const;

type DeleteMode = 'full' | 'collection';
type Step = 'form' | 'processing' | 'result';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

type DeleteModeOptionProps = {
  selected: boolean;
  title: string;
  hint: string;
  onPress: () => void;
};

const DeleteModeOption = ({ selected, title, hint, onPress }: DeleteModeOptionProps) => (
  <TouchableOpacity
    style={[styles.modeRow, selected && styles.modeRowActive]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.radio, selected && styles.radioActive]}>
      {selected ? <View style={styles.radioDot} /> : null}
    </View>
    <View style={styles.modeText}>
      <Text style={styles.modeTitle}>{title}</Text>
      <Text style={styles.modeHint}>{hint}</Text>
    </View>
  </TouchableOpacity>
);

export default function DeletePersonScreen() {
  const { t } = useTranslation();
  const ns = 'demos.deletePerson';
  const { isLoading, isAuthenticated, session } = useMobileAuth();

  const [step, setStep] = useState<Step>('form');
  const [person, setPerson] = useState<PersonListItem | null>(null);
  const [mode, setMode] = useState<DeleteMode>('full');
  const [selectedCollectionCode, setSelectedCollectionCode] = useState<string | null>(null);
  const [allCollections, setAllCollections] = useState<FaceCollectionListItem[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsError, setCollectionsError] = useState('');
  const [personMemberCodes, setPersonMemberCodes] = useState<string[]>([]);
  const [loadingPersonDetail, setLoadingPersonDetail] = useState(false);
  const [loadPersonDetailError, setLoadPersonDetailError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<unknown>(null);

  const token = session?.accessToken ?? '';

  const relatedDocs = useMemo((): RelatedDocItem[] => {
    return RELATED_DOC_HREFS.map((href, i) => ({
      href,
      title: t(`${ns}.relatedDocs.${i}.title`),
      description: t(`${ns}.relatedDocs.${i}.description`),
      badge: t(`${ns}.relatedDocs.${i}.badge`),
    }));
  }, [t]);

  const fetchExample = `await deletePerson(
  "<personMongoId>",
  accessToken,
  // Optional — remove from one collection only:
  { collection: "<collectionCodeUuid>" },
);`;

  const collectionsForPicker = useMemo(() => {
    if (!personMemberCodes.length) return [];
    const memberSet = new Set(personMemberCodes);
    return allCollections.filter((c) => memberSet.has(c.code) || memberSet.has(c._id));
  }, [allCollections, personMemberCodes]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setCollectionsLoading(true);
      setCollectionsError('');
      const res = await listCollections(token);
      if (cancelled) return;
      setCollectionsLoading(false);
      if (res.error) {
        setCollectionsError(res.error);
        setAllCollections([]);
        return;
      }
      const data = res.data?.data;
      setAllCollections(Array.isArray(data) ? data : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const id = person?._id;
    if (!token || !id) {
      setPersonMemberCodes([]);
      setSelectedCollectionCode(null);
      setLoadPersonDetailError('');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingPersonDetail(true);
      setLoadPersonDetailError('');
      setSelectedCollectionCode(null);
      const res = await getPerson(id, token);
      if (cancelled) return;
      setLoadingPersonDetail(false);

      if (res.error) {
        setLoadPersonDetailError(res.error);
        setPersonMemberCodes([]);
        return;
      }

      const p = unwrapApiData(res.data);
      const cols =
        p && Array.isArray(p.collections)
          ? p.collections.filter((c): c is string => typeof c === 'string')
          : [];
      setPersonMemberCodes(cols);
    })();

    return () => {
      cancelled = true;
    };
  }, [person?._id, token]);

  const handleModeChange = (next: DeleteMode) => {
    setMode(next);
    if (next === 'full') setSelectedCollectionCode(null);
  };

  const handlePersonSelect = (next: PersonListItem | null) => {
    setPerson(next);
    setSubmitError('');
    if (!next) {
      setLoadPersonDetailError('');
      setPersonMemberCodes([]);
    }
  };

  const openConfirm = () => {
    if (!person?._id) return;
    if (mode === 'collection' && !selectedCollectionCode?.trim()) {
      setSubmitError(t(`${ns}.errSelectCollection`));
      return;
    }
    setSubmitError('');
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    const id = person?._id;
    if (!token || !id) return;

    setConfirmOpen(false);
    setStep('processing');
    setSubmitError('');

    const res = await deletePerson(
      id,
      token,
      mode === 'collection' && selectedCollectionCode
        ? { collection: selectedCollectionCode.trim() }
        : {},
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
    setMode('full');
    setSelectedCollectionCode(null);
    setPersonMemberCodes([]);
    setLoadPersonDetailError('');
    setSubmitError('');
    setConfirmOpen(false);
    setResult(null);
  };

  const resultRecord = isRecord(result) ? result : null;
  const resultData =
    resultRecord && 'data' in resultRecord ? resultRecord.data : undefined;
  const hasPersonPayload = isRecord(resultData);

  const confirmTitle =
    mode === 'full' ? t(`${ns}.confirmTitleFull`) : t(`${ns}.confirmTitleCollection`);
  const confirmMessage =
    mode === 'full' ? t(`${ns}.confirmDescFull`) : t(`${ns}.confirmDescCollection`);
  const confirmLabel =
    mode === 'full' ? t(`${ns}.confirmSubmitFull`) : t(`${ns}.confirmSubmitCollection`);

  const submitLabel = mode === 'full' ? t(`${ns}.submitFull`) : t(`${ns}.submitCollection`);

  const canSubmit =
    Boolean(person?._id) &&
    !loadingPersonDetail &&
    !loadPersonDetailError &&
    !collectionsLoading &&
    (mode === 'full' || Boolean(selectedCollectionCode?.trim()));

  const collectionEmptyMessage = loadingPersonDetail
    ? t(`${ns}.emptyPickerLoading`)
    : !person
      ? t(`${ns}.emptyPickerSelectPerson`)
      : collectionsForPicker.length === 0
        ? t(`${ns}.emptyPickerNoMatch`)
        : t(`${ns}.emptyPickerNoLoaded`);

  return (
    <View style={demoStyles.screen}>
      <DemoScreenShell title={t(`${ns}.headerTitle`)} />
      <ScrollView contentContainerStyle={demoStyles.scroll}>
        {step === 'form' ? (
          <DemoApiReference
            ns={ns}
            docsUrl={`${DOCS_BASE}/resources/persons/delete-a-person`}
            docsLabel={t(`${ns}.apiRefLinkLabel`)}
            endpoint="DELETE /v2/face-recognition/persons/:id"
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
          hasPersonPayload ? (
            <CreatePersonResultCard result={resultRecord} onReset={reset} mode="delete" />
          ) : (
            <View style={styles.resultFallback}>
              <Text style={styles.resultFallbackTitle}>{t(`${ns}.resultNoPersonDocTitle`)}</Text>
              <Text style={styles.resultFallbackBody}>{t(`${ns}.resultNoPersonDocBody`)}</Text>
              {resultRecord ? (
                <DemoResultCard title={t('demos.common.rawResponse', { defaultValue: 'Response' })} data={result} />
              ) : null}
              <DemoResultActions
                onReset={reset}
                tryAgainLabel={t('demos.personResult.anotherAction', { defaultValue: 'Another action' })}
              />
            </View>
          )
        ) : (
          <>
            <View style={styles.infoPanel}>
              <Text style={styles.infoText}>
                <Text style={styles.infoStrong}>{t(`${ns}.modeFullTitle`)}: </Text>
                {t(`${ns}.modeFullHint`)}
              </Text>
              <Text style={[styles.infoText, styles.infoTextSpaced]}>
                <Text style={styles.infoStrong}>{t(`${ns}.modeCollectionTitle`)}: </Text>
                {t(`${ns}.modeCollectionHint`)}
              </Text>
            </View>

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
              {loadingPersonDetail ? (
                <DemoProcessing message={t(`${ns}.loadingPersonCollections`)} />
              ) : null}
              {!!loadPersonDetailError && (
                <View style={demoErrorBannerStyles.errorBanner}>
                  <Text style={demoErrorBannerStyles.errorText}>{loadPersonDetailError}</Text>
                </View>
              )}
            </DemoFormSection>

            <DemoFormSection
              stepLabel="2"
              title={t(`${ns}.modeLegend`)}
              subtitle={t(`${ns}.heroSubtitleForm`)}
            >
              <DeleteModeOption
                selected={mode === 'full'}
                title={t(`${ns}.modeFullTitle`)}
                hint={t(`${ns}.modeFullHint`)}
                onPress={() => handleModeChange('full')}
              />
              <DeleteModeOption
                selected={mode === 'collection'}
                title={t(`${ns}.modeCollectionTitle`)}
                hint={t(`${ns}.modeCollectionHint`)}
                onPress={() => handleModeChange('collection')}
              />
            </DemoFormSection>

            {mode === 'collection' ? (
              <DemoFormSection
                stepLabel="3"
                title={t(`${ns}.collectionLabel`)}
                subtitle={t(`${ns}.modeCollectionHint`)}
              >
                {!!collectionsError && (
                  <View style={demoErrorBannerStyles.errorBanner}>
                    <Text style={demoErrorBannerStyles.errorText}>{collectionsError}</Text>
                  </View>
                )}
                {collectionsLoading || loadingPersonDetail ? (
                  <DemoProcessing message={t(`${ns}.emptyPickerLoading`)} />
                ) : collectionsForPicker.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectionScroll}>
                    {collectionsForPicker.map((item) => {
                      const active = selectedCollectionCode === item.code;
                      return (
                        <TouchableOpacity
                          key={item._id}
                          style={[styles.collectionChip, active && styles.collectionChipActive]}
                          onPress={() => setSelectedCollectionCode(item.code)}
                        >
                          <Text
                            style={[styles.collectionChipText, active && styles.collectionChipTextActive]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Text style={styles.emptyHint}>{collectionEmptyMessage}</Text>
                )}
              </DemoFormSection>
            ) : null}

            {!!submitError && (
              <View style={demoErrorBannerStyles.errorBanner}>
                <Text style={demoErrorBannerStyles.errorText}>{submitError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.destructiveCta, !canSubmit && styles.destructiveCtaDisabled]}
              onPress={openConfirm}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.destructiveCtaText}>{submitLabel}</Text>
            </TouchableOpacity>
          </>
        )}

        <DemoRelatedDocsSection items={relatedDocs} />
      </ScrollView>

      <DemoConfirmModal
        visible={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        cancelLabel={t('demos.common.cancel', { defaultValue: 'Cancel' })}
        destructive
        onCancel={() => setConfirmOpen(false)}
        onConfirm={performDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  infoPanel: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  infoText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  infoTextSpaced: { marginTop: spacing.sm },
  infoStrong: {
    color: colors.onSurface,
    fontWeight: typography.weights.semibold,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  modeRowActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0,102,255,0.08)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.onSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioActive: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  modeText: { flex: 1 },
  modeTitle: {
    color: colors.onSurface,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  modeHint: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  collectionScroll: { flexGrow: 0 },
  collectionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginRight: spacing.sm,
    maxWidth: 200,
  },
  collectionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  collectionChipText: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm },
  collectionChipTextActive: {
    color: colors.onPrimaryContainer,
    fontWeight: typography.weights.bold,
  },
  emptyHint: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm },
  destructiveCta: {
    marginTop: spacing.sm,
    paddingVertical: spacing.base + 2,
    borderRadius: radius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  destructiveCtaDisabled: { opacity: 0.5 },
  destructiveCtaText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.black,
    letterSpacing: typography.tracking.wide,
  },
  resultFallback: { gap: spacing.md },
  resultFallbackTitle: {
    color: colors.onSurface,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  resultFallbackBody: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});
