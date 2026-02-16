import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.error('Failed to request notification permissions:', e);
    return false;
  }
}

export async function requestAudioDownloadPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  // On iOS and Android, the file system permissions are handled by the OS
  // For iOS, we just need to ensure the app can write to documentDirectory
  // For Android, permissions are defined in app.json and handled by the system
  
  // On Android 6.0+, dynamic permissions are requested by the system
  // The documentDirectory (app's private directory) doesn't require permissions
  
  try {
    // Just return true as expo-file-system handles this internally
    return true;
  } catch (e) {
    console.error('Failed to setup audio download permissions:', e);
    return false;
  }
}

