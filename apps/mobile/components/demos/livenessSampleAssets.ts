import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

const SAMPLE_MODULES = [
  require('../../assets/images/samples/ppic1.jpg'),
  require('../../assets/images/samples/ppic2.jpg'),
  require('../../assets/images/samples/ppic3.jpg'),
  require('../../assets/images/samples/ppic4.jpg'),
  require('../../assets/images/samples/ppic5.jpg'),
  require('../../assets/images/samples/ppic6.jpg'),
] as const;

export const LIVENESS_SAMPLE_SOURCES = SAMPLE_MODULES;

export const loadSampleImageBase64 = async (index: number): Promise<{ uri: string; base64: string }> => {
  const mod = SAMPLE_MODULES[index];
  if (!mod) throw new Error('Invalid sample index');

  const asset = Asset.fromModule(mod);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { uri, base64 };
};
