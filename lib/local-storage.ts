import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, saveUserProfile, getAllSessions, saveSession, type UserProfile, type SessionData } from './firebase';

const USER_PROFILE_KEY = '@aasanify_user_profile';
const USER_CREDENTIALS_KEY = '@aasanify_user_credentials';
const SESSIONS_KEY = '@aasanify_sessions';
const PENDING_SYNC_KEY = '@aasanify_pending_sync';
const LAST_SYNC_KEY = '@aasanify_last_sync';

export interface LocalUser {
  uid: string;
  email: string;
  name: string;
}

export async function saveProfileLocally(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile locally:', e);
  }
}

export async function getLocalProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function saveUserCredentialsLocally(uid: string, email: string, name: string): Promise<void> {
  try {
    const credentials: LocalUser = { uid, email, name };
    await AsyncStorage.setItem(USER_CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (e) {
    console.error('Failed to save user credentials locally:', e);
  }
}

export async function getLocalUserCredentials(): Promise<LocalUser | null> {
  try {
    const data = await AsyncStorage.getItem(USER_CREDENTIALS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function saveSessionsLocally(sessions: Record<string, SessionData>): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions locally:', e);
  }
}

export async function getLocalSessions(): Promise<Record<string, SessionData>> {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function saveSessionLocally(date: string, session: SessionData): Promise<void> {
  try {
    const sessions = await getLocalSessions();
    sessions[date] = session;
    await saveSessionsLocally(sessions);
    // Mark this session as pending sync
    await addPendingSync('session', date);
  } catch (e) {
    console.error('Failed to save session locally:', e);
  }
}

export async function addPendingSync(type: 'session' | 'profile', identifier: string): Promise<void> {
  try {
    const pending = await getPendingSync();
    const key = `${type}:${identifier}`;
    if (!pending.includes(key)) {
      pending.push(key);
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
    }
  } catch (e) {
    console.error('Failed to add pending sync:', e);
  }
}

export async function getPendingSync(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function removePendingSync(type: 'session' | 'profile', identifier: string): Promise<void> {
  try {
    const pending = await getPendingSync();
    const key = `${type}:${identifier}`;
    const filtered = pending.filter(p => p !== key);
    if (pending.length > filtered.length) {
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Failed to remove pending sync:', e);
  }
}

export async function getLastSyncTime(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch {
    return 0;
  }
}

export async function setLastSyncTime(time: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SYNC_KEY, time.toString());
  } catch (e) {
    console.error('Failed to save sync time:', e);
  }
}

export async function syncWithFirebase(uid: string, isOnline: boolean): Promise<void> {
  if (!isOnline) return;

  try {
    console.log('Starting sync with Firebase for user:', uid);
    const pending = await getPendingSync();
    
    // Sync pending sessions
    const sessionDates = pending
      .filter(p => p.startsWith('session:'))
      .map(p => p.replace('session:', ''));

    if (sessionDates.length > 0) {
      const localSessions = await getLocalSessions();
      for (const date of sessionDates) {
        if (localSessions[date]) {
          try {
            await saveSession(uid, date, localSessions[date]);
            await removePendingSync('session', date);
            console.log('Synced session for date:', date);
          } catch (e) {
            console.error('Failed to sync session for date:', date, e);
          }
        }
      }
    }

    // Sync profile if pending
    if (pending.includes('profile:update')) {
      const localProfile = await getLocalProfile();
      if (localProfile) {
        try {
          await saveUserProfile(uid, localProfile);
          await removePendingSync('profile', 'update');
          console.log('Synced profile');
        } catch (e) {
          console.error('Failed to sync profile:', e);
        }
      }
    }

    // Pull latest data from remote
    try {
      const [remoteSessions, remoteProfile] = await Promise.all([
        getAllSessions(uid),
        getUserProfile(uid),
      ]);

      if (remoteProfile) {
        await saveProfileLocally(remoteProfile);
      }

      if (remoteSessions && Object.keys(remoteSessions).length > 0) {
        const localSessions = await getLocalSessions();
        const mergedSessions = { ...localSessions, ...remoteSessions };
        await saveSessionsLocally(mergedSessions);
      }
    } catch (e) {
      console.error('Failed to pull data from Firebase:', e);
    }

    await setLastSyncTime(Date.now());
    console.log('Sync completed');
  } catch (e) {
    console.error('Failed to sync with Firebase:', e);
  }
}
