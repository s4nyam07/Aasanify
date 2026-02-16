import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const AUDIO_URL = 'https://gorbzonklzeidxivpseg.supabase.co/storage/v1/object/public/Audios/sunsalutation.mp3';
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

export async function getAudioUri(forceStream: boolean = false): Promise<string | null> {
  if (forceStream) {
    // Force streaming from URL
    return AUDIO_URL;
  }

  const downloaded = await isAudioDownloaded();
  if (downloaded) {
    return getAudioPath();
  }
  
  // Return URL for streaming if not downloaded
  return AUDIO_URL;
}

export async function downloadAudio(
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    // Check if already downloaded
    const alreadyDownloaded = await isAudioDownloaded();
    if (alreadyDownloaded) {
      onProgress?.(1);
      return true;
    }

    const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
      if (downloadProgress.totalBytesExpectedToWrite > 0) {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(progress);
      }
    };

    const audioPath = getAudioPath();
    
    // Ensure directory exists
    const dir = FileSystem.documentDirectory;
    if (!dir) {
      console.error('Document directory not available');
      return false;
    }

    const result = await FileSystem.downloadAsync(
      AUDIO_URL,
      audioPath,
      {
        progressCallback: callback,
        sessionId: 'aasanify-audio-download'
      }
    );

    if (result.status === 200) {
      console.log('Audio downloaded successfully:', audioPath);
      return true;
    } else {
      console.error('Download failed with status:', result.status);
      return false;
    }
  } catch (e) {
    console.error('Download audio failed:', e);
    // Clean up partial download
    try {
      const path = getAudioPath();
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists && info.size && info.size < 1000000) { // Less than 1MB likely incomplete
        await FileSystem.deleteAsync(path, { idempotent: true });
      }
    } catch {}
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
