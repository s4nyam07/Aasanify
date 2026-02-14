import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUDIO_URL = 'https://gorbzonklzeidxivpseg.supabase.co/storage/v1/object/public/Audios/sunsalutation.mp3';
const AUDIO_FILENAME = 'sunsalutation.mp3';
const SETTINGS_KEY = '@aasanify_media_settings';

function getAudioPath(): string {
  return `${FileSystem.documentDirectory}${AUDIO_FILENAME}`;
}

export async function isAudioDownloaded(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(getAudioPath());
    return info.exists;
  } catch {
    return false;
  }
}

export async function getAudioUri(): Promise<string | null> {
  const downloaded = await isAudioDownloaded();
  if (downloaded) return getAudioPath();
  return null;
}

export async function downloadAudio(
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
      if (downloadProgress.totalBytesExpectedToWrite > 0) {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(progress);
      }
    };

    const downloadResumable = FileSystem.createDownloadResumable(
      AUDIO_URL,
      getAudioPath(),
      {},
      callback
    );

    const result = await downloadResumable.downloadAsync();
    return !!result?.uri;
  } catch (e) {
    console.error('Download audio failed:', e);
    return false;
  }
}

export async function deleteAudio(): Promise<boolean> {
  try {
    const path = getAudioPath();
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      await FileSystem.deleteAsync(path);
    }
    return true;
  } catch (e) {
    console.error('Delete audio failed:', e);
    return false;
  }
}

export interface MediaSettings {
  ttsEnabled: boolean;
  bgAudioEnabled: boolean;
}

const DEFAULT_SETTINGS: MediaSettings = {
  ttsEnabled: true,
  bgAudioEnabled: true,
};

export async function getMediaSettings(): Promise<MediaSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export async function saveMediaSettings(settings: MediaSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Save settings failed:', e);
  }
}
