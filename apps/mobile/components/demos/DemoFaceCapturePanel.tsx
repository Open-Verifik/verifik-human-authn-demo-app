import { View, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import DemoChooseOneCallout from './DemoChooseOneCallout';
import DemoScannerShell from './DemoScannerShell';
import DemoTestSamples from './DemoTestSamples';
import FaceGuidedCamera from './FaceGuidedCamera';
import DemoUploadImageButton from './DemoUploadImageButton';
import DemoCaptureOptionHeading, { DemoOrDivider } from './DemoCaptureOptionHeading';
import { LIVENESS_SAMPLE_SOURCES, loadSampleImageBase64 } from './livenessSampleAssets';
import { demoStyles, DemoPrimaryCta } from '../../lib/demoScreenStyles';
import { colors, spacing, radius } from '../../constants/tokens';

type CapturePayload = { uri: string; base64: string };

type DemoFaceCapturePanelProps = {
  ns: string;
  onCapture: (payload: CapturePayload) => void;
  previewUri: string | null;
  disabled?: boolean;
  /** Show multi-pick gallery button */
  multiImage?: boolean;
  imageCount?: number;
  onPickMultiple?: () => void;
  /** Thumbnail row below the panel */
  previews?: string[];
  onSampleError?: (message: string) => void;
};

export default function DemoFaceCapturePanel({
  ns,
  onCapture,
  previewUri,
  disabled = false,
  multiImage = false,
  imageCount = 0,
  onPickMultiple,
  previews,
  onSampleError,
}: DemoFaceCapturePanelProps) {
  const { t } = useTranslation();

  const uploadLabel =
    multiImage && imageCount > 0
      ? t('demos.common.imagesAddMore', { count: imageCount })
      : t('demos.common.uploadFaceImages', { defaultValue: t(`${ns}.uploadTitle`) });

  const runSample = async (index: number) => {
    try {
      const { uri, base64 } = await loadSampleImageBase64(index);
      onCapture({ uri, base64 });
    } catch {
      onSampleError?.(t('demos.liveness.sampleLoadError'));
    }
  };

  const handlePick = ({ uri, base64 }: { uri: string; base64?: string | null }) => {
    if (base64) onCapture({ uri, base64 });
  };

  return (
    <>
      <View style={styles.capturePanel}>
        <DemoChooseOneCallout description={t(`${ns}.chooseOneDescription`)} />

        <DemoCaptureOptionHeading
          label="A"
          title={t(`${ns}.cameraTitle`)}
          subtitle={t(`${ns}.cameraSubtitle`, {
            defaultValue: t('demos.liveness.cameraSubtitle', {
              defaultValue: 'Open the camera and capture a face image',
            }),
          })}
        />
        <DemoScannerShell minHeight={300}>
          <FaceGuidedCamera onCapture={onCapture} disabled={disabled} />
        </DemoScannerShell>

        <DemoOrDivider />
        <DemoCaptureOptionHeading
          label="B"
          title={t(`${ns}.uploadTitle`)}
          subtitle={t(`${ns}.uploadSubtitle`, {
            defaultValue: t('demos.liveness.uploadSubtitle', {
              defaultValue: 'Select an image file from your device',
            }),
          })}
        />
        <DemoUploadImageButton label={uploadLabel} previewUri={previewUri} onPick={handlePick} />
        {multiImage && onPickMultiple ? (
          <DemoPrimaryCta label={uploadLabel} onPress={onPickMultiple} />
        ) : null}

        <DemoTestSamples
          sources={[...LIVENESS_SAMPLE_SOURCES]}
          onSelect={runSample}
          disabled={disabled}
          ns="demos.liveness"
        />
      </View>

      {previews && previews.length > 0 ? (
        <View style={demoStyles.previewRow}>
          {previews.map((uri) => (
            <Image key={uri} source={{ uri }} style={demoStyles.previewThumb} />
          ))}
        </View>
      ) : null}
    </>
  );
}

export const demoErrorBannerStyles = StyleSheet.create({
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

const styles = StyleSheet.create({
  capturePanel: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.md,
  },
});
