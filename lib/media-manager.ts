import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@aasanify_media_settings';

export interface MediaSettings {
  ttsEnabled: boolean;
}

const DEFAULT_SETTINGS: MediaSettings = {
  ttsEnabled: true,
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
