import { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createCollection } from '@humanauthn/api-client';
import DemoScreenShell from '../../components/demos/DemoScreenShell';
import DemoSignInPrompt from '../../components/demos/DemoSignInPrompt';
import DemoApiReference from '../../components/demos/DemoApiReference';
import DemoRelatedDocsSection, { type RelatedDocItem } from '../../components/demos/DemoRelatedDocsSection';
import DemoResultCard from '../../components/demos/DemoResultCard';
import DemoResultActions from '../../components/demos/DemoResultActions';
import { demoErrorBannerStyles } from '../../components/demos/DemoFaceCapturePanel';
import { useMobileAuth } from '../../lib/hooks/useMobileAuth';
import { demoStyles, DemoField, DemoPrimaryCta, DemoProcessing } from '../../lib/demoScreenStyles';

const DOCS_BASE = 'https://docs.verifik.co';

const RELATED_DOC_HREFS = [
  `${DOCS_BASE}/resources/the-collection-object`,
  `${DOCS_BASE}/resources/list-all-collections`,
  `${DOCS_BASE}/resources/retrieve-a-collection`,
  `${DOCS_BASE}/resources/update-a-collection`,
  `${DOCS_BASE}/resources/delete-a-collection`,
] as const;

export default function CreateCollectionScreen() {
  const { t } = useTranslation();
  const ns = 'demos.createCollection';
  const { isLoading, isAuthenticated, session } = useMobileAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
      { name: 'name', type: 'string', required: true, description: t(`${ns}.paramNameDesc`) },
      { name: 'description', type: 'string', required: false, description: t(`${ns}.paramDescriptionDesc`) },
    ],
    [t],
  );

  const fetchExample = `await createCollection(
  {
    name: "${name.trim() || 'Employees 2025'}",
    description: "${description.trim() || 'Optional description'}",
  },
  accessToken,
);`;

  const submit = async () => {
    const token = session?.accessToken;
    if (!token || !name.trim()) return;
    setProcessing(true);
    setError('');
    setResult(null);
    const res = await createCollection(
      { name: name.trim(), description: description.trim() || undefined },
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
    setDescription('');
    setResult(null);
    setError('');
  };

  return (
    <View style={demoStyles.screen}>
      <DemoScreenShell title={t(`${ns}.headerTitle`)} />
      <ScrollView contentContainerStyle={demoStyles.scroll}>
        {!result ? (
          <DemoApiReference
            ns={ns}
            docsUrl={`${DOCS_BASE}/resources/create-a-collection`}
            docsLabel={t(`${ns}.apiRefLinkLabel`)}
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
          <>
            <DemoResultCard title={t(`${ns}.successTitle`)} data={result} />
            <DemoResultActions
              onReset={reset}
              tryAgainLabel={t(`${ns}.createAnother`)}
            />
          </>
        ) : (
          <>
            <DemoField
              label={t(`${ns}.nameLabel`)}
              required
              value={name}
              onChangeText={setName}
              placeholder={t(`${ns}.namePlaceholder`)}
            />
            <DemoField
              label={t(`${ns}.descLabel`)}
              value={description}
              onChangeText={setDescription}
              placeholder={t(`${ns}.descPlaceholder`)}
              multiline
              style={demoStyles.inputMultiline}
            />
            {!!error && (
              <View style={demoErrorBannerStyles.errorBanner}>
                <Text style={demoErrorBannerStyles.errorText}>{error}</Text>
              </View>
            )}
            <DemoPrimaryCta
              label={t(`${ns}.submit`)}
              onPress={submit}
              disabled={!name.trim()}
            />
          </>
        )}

        <DemoRelatedDocsSection items={relatedDocs} />
      </ScrollView>
    </View>
  );
}
