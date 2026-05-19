import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LIVENESS_STANDALONE_MIN_SCORE } from '@humanauthn/api-client';
import { useDemoDocs } from './DemoDocsProvider';
import { colors, typography, spacing, radius } from '../../constants/tokens';

type ParamRow = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

type Props = {
  ns: string;
  docsUrl?: string;
  docsLabel?: string;
  endpoint?: string;
  showLivenessParams?: boolean;
  customParamRows?: ParamRow[];
  extraParagraphKey?: string;
  fetchExample?: string;
  responseExample?: string;
  bullets?: Array<string | { key: string; params?: Record<string, string> }>;
};

export default function DemoApiReference({
  ns,
  docsUrl,
  docsLabel,
  endpoint = 'POST /v2/face-recognition/liveness',
  showLivenessParams = false,
  customParamRows,
  extraParagraphKey,
  fetchExample,
  responseExample,
  bullets = [],
}: Props) {
  const { t } = useTranslation();
  const { openDocLink } = useDemoDocs();
  const [open, setOpen] = useState(false);
  const resolvedEndpoint = endpoint ?? (t(`${ns}.apiRefEndpoint`, { defaultValue: '' }) || 'POST /v2/…');

  const livenessParamRows: ParamRow[] = showLivenessParams
    ? [
        { name: 'os', type: 'string', required: true, description: t(`${ns}.paramOsDesc`) },
        { name: 'image', type: 'string', required: true, description: t(`${ns}.paramImageDesc`) },
        { name: 'collection_id', type: 'string', required: false, description: t(`${ns}.paramCollectionDesc`) },
        {
          name: 'liveness_min_score',
          type: 'number',
          required: false,
          description: t(`${ns}.paramLivenessMinDesc`, { defaultMin: String(DEFAULT_LIVENESS_STANDALONE_MIN_SCORE) }),
        },
      ]
    : [];

  const paramRows = customParamRows ?? livenessParamRows;

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.summary} onPress={() => setOpen((v) => !v)} activeOpacity={0.85}>
        <View style={styles.summaryLeft}>
          <Ionicons name="book-outline" size={18} color={colors.primary} />
          <Text style={styles.summaryText}>{t(`${ns}.apiRefSummary`)}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.onSurfaceVariant} />
      </TouchableOpacity>

      {open ? (
        <ScrollView style={styles.body} nestedScrollEnabled>
          {docsUrl ? (
            <Text style={styles.paragraph}>
              {t('demos.common.officialDocsLead')}{' '}
              <Text
                style={styles.link}
                onPress={() => openDocLink(docsUrl, docsLabel ?? docsUrl)}
              >
                {docsLabel ?? docsUrl}
              </Text>
            </Text>
          ) : null}

          {t(`${ns}.apiRefBody`, { defaultValue: '' }) ? (
            <Text style={styles.small}>
              {t(`${ns}.apiRefBody`, { defaultMin: String(DEFAULT_LIVENESS_STANDALONE_MIN_SCORE) })}
            </Text>
          ) : null}

          {t(`${ns}.apiRefEndpointDesc`, { defaultValue: '' }) ? (
            <View style={styles.block}>
              <Text style={styles.mono}>{resolvedEndpoint}</Text>
              <Text style={styles.small}>{t(`${ns}.apiRefEndpointDesc`)}</Text>
            </View>
          ) : null}

          {extraParagraphKey && t(`${ns}.${extraParagraphKey}`, { defaultValue: '' }) ? (
            <Text style={styles.small}>{t(`${ns}.${extraParagraphKey}`)}</Text>
          ) : null}

          {paramRows.length > 0 ? (
            <View style={styles.table}>
              {paramRows.map((row) => (
                <View key={row.name} style={styles.tableRow}>
                  <Text style={styles.paramName}>{row.name}</Text>
                  <Text style={styles.small}>
                    {row.type} · {row.required ? t('demos.common.yes') : t('demos.common.no')}
                  </Text>
                  <Text style={styles.small}>{row.description}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {fetchExample ? <Text style={styles.code}>{fetchExample}</Text> : null}
          {responseExample ? <Text style={styles.code}>{responseExample}</Text> : null}

          {bullets.map((item) => {
            const bulletKey = typeof item === 'string' ? item : item.key;
            const bulletParams = typeof item === 'string' ? undefined : item.params;
            return (
              <Text key={bulletKey} style={styles.bullet}>
                • {t(`${ns}.${bulletKey}`, bulletParams)}
              </Text>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(10,21,56,0.5)',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  summaryText: { color: colors.primary, fontWeight: typography.weights.bold, fontSize: typography.sizes.sm },
  body: {
    maxHeight: 320,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  paragraph: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm, marginTop: spacing.md },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  small: { color: colors.onSurfaceVariant, fontSize: typography.sizes.xs, lineHeight: 18, marginTop: spacing.sm },
  block: { marginTop: spacing.md },
  mono: { fontFamily: 'monospace', fontSize: 11, color: colors.onSurface, marginBottom: spacing.xs },
  table: { marginTop: spacing.md, gap: spacing.sm },
  tableRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: spacing.sm,
  },
  paramName: { color: colors.primary, fontFamily: 'monospace', fontSize: 11 },
  code: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    lineHeight: 16,
  },
  bullet: { color: colors.onSurfaceVariant, fontSize: typography.sizes.xs, marginTop: spacing.xs },
});
