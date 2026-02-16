import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, saveUserProfile, getAllSessions, saveSession, type UserProfile, type SessionData } from './firebase';

const USER_PROFILE_KEY = '@aasanify_user_profile';
const SESSIONS_KEY = '@aasanify_sessions';
const LAST_SYNC_KEY = '@aasanify_last_sync';

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
  } catch (e) {
    console.error('Failed to save session locally:', e);
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
    const [localSessions, remoteSessions, localProfile, remoteProfile] = await Promise.all([
      getLocalSessions(),
      getAllSessions(uid),
      getLocalProfile(),
      getUserProfile(uid),
    ]);

    const mergedSessions = { ...remoteSessions, ...localSessions };

    await Promise.all([
      saveSessionsLocally(mergedSessions),
      ...Object.entries(localSessions).map(([date, session]) =>
        saveSession(uid, date, session)
      ),
    ]);

    if (localProfile && remoteProfile) {
      const newerProfile = new Date(localProfile.createdAt) > new Date(remoteProfile.createdAt)
        ? localProfile
        : remoteProfile;
      await saveProfileLocally(newerProfile);
      await saveUserProfile(uid, newerProfile);
    }

    await setLastSyncTime(Date.now());
  } catch (e) {
    console.error('Failed to sync with Firebase:', e);
  }
}
