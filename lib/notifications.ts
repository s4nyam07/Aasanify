import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REMINDER_KEY = '@aasanify_reminder_settings';

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 7,
  minute: 0,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_KEY);
    if (raw) return { ...DEFAULT_REMINDER, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_REMINDER;
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
    await scheduleReminder(settings);
  } catch (e) {
    console.error('Save reminder settings failed:', e);
  }
}

export async function scheduleReminder(settings: ReminderSettings): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.enabled) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for Yoga',
        body: 'Start your Surya Namaskar practice today',
        sound: true,
      },
      trigger: {
        hour: settings.hour,
        minute: settings.minute,
        repeats: true,
      },
    });
  } catch (e) {
    console.error('Failed to schedule notification:', e);
  }
}

export async function initializeReminders(): Promise<void> {
  if (Platform.OS === 'web') return;

  const settings = await getReminderSettings();
  if (settings.enabled) {
    await scheduleReminder(settings);
  }
}
