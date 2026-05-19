import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { isAllowedDocWebViewUrl, resolveDemoDocHref } from '../../lib/resolveDemoDocHref';
import { colors, spacing, radius, typography } from '../../constants/tokens';

type DocViewerState = {
  url: string;
  title: string;
};

type DemoDocsContextValue = {
  openDocLink: (href: string, title?: string) => void;
  closeDocViewer: () => void;
};

const DemoDocsContext = createContext<DemoDocsContextValue | null>(null);

type WebViewModalProps = {
  visible: boolean;
  url: string;
  title: string;
  onClose: () => void;
};

const DemoDocsWebViewModal = ({ visible, url, title, onClose }: WebViewModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const handleClose = () => {
    setLoading(true);
    onClose();
  };

  if (!visible || !url) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={t('demos.common.backAria', { defaultValue: 'Back' })}
          >
            <Ionicons name="close" size={22} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.webWrap}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null}
          <WebView
            source={{ uri: url }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            startInLoadingState
            setSupportMultipleWindows={false}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export const DemoDocsProvider = ({ children }: { children: ReactNode }) => {
  const [viewer, setViewer] = useState<DocViewerState | null>(null);

  const closeDocViewer = useCallback(() => {
    setViewer(null);
  }, []);

  const openDocLink = useCallback((href: string, title?: string) => {
    const resolved = resolveDemoDocHref(href);
    if (resolved.kind === 'internal') {
      router.push(resolved.path as Href);
      return;
    }

    if (!isAllowedDocWebViewUrl(resolved.url)) {
      return;
    }

    setViewer({
      url: resolved.url,
      title: title ?? resolved.url.replace(/^https?:\/\//, ''),
    });
  }, []);

  const value = useMemo(
    () => ({ openDocLink, closeDocViewer }),
    [openDocLink, closeDocViewer],
  );

  return (
    <DemoDocsContext.Provider value={value}>
      {children}
      <DemoDocsWebViewModal
        visible={viewer != null}
        url={viewer?.url ?? ''}
        title={viewer?.title ?? ''}
        onClose={closeDocViewer}
      />
    </DemoDocsContext.Provider>
  );
};

export const useDemoDocs = (): DemoDocsContextValue => {
  const ctx = useContext(DemoDocsContext);
  if (!ctx) {
    throw new Error('useDemoDocs must be used within DemoDocsProvider');
  }
  return ctx;
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    backgroundColor: colors.surfaceContainerLow,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: colors.onSurface,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerSpacer: { width: 40 },
  webWrap: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    zIndex: 1,
  },
});
