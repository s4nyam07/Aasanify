import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: ReturnType<typeof initializeAuth> | ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

const database = getDatabase(app);

export { auth, database };
export type { User };

export interface UserProfile {
  name: string;
  age: number;
  email: string;
  createdAt: string;
}

export interface SessionData {
  completed: boolean;
  durationMinutes: number;
  roundsDone: number;
  sessionType: string;
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  await set(ref(database, `users/${uid}/profile`), profile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await get(ref(database, `users/${uid}/profile`));
  return snapshot.val();
}

export async function saveSession(uid: string, date: string, data: SessionData): Promise<void> {
  await set(ref(database, `users/${uid}/sessions/${date}`), data);
}

export async function getAllSessions(uid: string): Promise<Record<string, SessionData>> {
  const snapshot = await get(ref(database, `users/${uid}/sessions`));
  return snapshot.val() || {};
}

export function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Invalid email address';
    case 'auth/user-disabled': return 'This account has been disabled';
    case 'auth/user-not-found': return 'No account found with this email';
    case 'auth/wrong-password': return 'Incorrect password';
    case 'auth/invalid-credential': return 'Invalid email or password';
    case 'auth/email-already-in-use': return 'An account already exists with this email';
    case 'auth/weak-password': return 'Password must be at least 6 characters';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later';
    default: return 'An error occurred. Please try again';
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
};
