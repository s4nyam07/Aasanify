import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import {
  auth,
  type User,
  type UserProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  saveUserProfile,
  getUserProfile,
  getFirebaseErrorMessage,
} from '@/lib/firebase';
import { saveProfileLocally, getLocalProfile, saveUserCredentialsLocally, getLocalUserCredentials, syncWithFirebase } from '@/lib/local-storage';
import { useNetwork } from '@/lib/network-context';
import { downloadAudio, isAudioDownloaded } from '@/lib/media-manager';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, age: number) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, isInternetReachable, onOnline, offOnline } = useNetwork();

  // Register sync callback with network context
  useEffect(() => {
    if (user) {
      const syncCallback = async () => {
        console.log('Syncing user data for:', user.uid);
        await syncWithFirebase(user.uid, true);
      };

      onOnline(syncCallback);

      return () => {
        offOnline(syncCallback);
      };
    }
  }, [user, onOnline, offOnline]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const isOnline = isConnected && isInternetReachable;
          let prof: UserProfile | null = null;

          if (isOnline) {
            // Try to fetch from Firebase
            prof = await getUserProfile(firebaseUser.uid);
            if (prof) {
              await saveProfileLocally(prof);
              // Save credentials for offline access
              await saveUserCredentialsLocally(firebaseUser.uid, prof.email, prof.name);
            }
            await syncWithFirebase(firebaseUser.uid, true);
          } else {
            // Load from local storage
            prof = await getLocalProfile();
          }

          setProfile(prof);
        } catch (e) {
          console.error('Failed to load profile:', e);
          const localProf = await getLocalProfile();
          setProfile(localProf);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, [isConnected, isInternetReachable]);

  useEffect(() => {
    if (user && isConnected && isInternetReachable) {
      syncWithFirebase(user.uid, true);
    }
  }, [user, isConnected, isInternetReachable]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      let prof: UserProfile | null = null;

      try {
        prof = await getUserProfile(credential.user.uid);
        if (prof) {
          await saveProfileLocally(prof);
          // Save credentials for offline access
          await saveUserCredentialsLocally(credential.user.uid, prof.email, prof.name);
        }
      } catch (e) {
        console.error('Failed to fetch profile from Firebase:', e);
        // Try local version
        prof = await getLocalProfile();
      }

      setProfile(prof);

      const audioExists = await isAudioDownloaded();
      if (!audioExists) {
        downloadAudio().catch(() => {});
      }
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, age: number) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const newProfile: UserProfile = {
        name,
        age,
        email,
        createdAt: new Date().toISOString(),
      };

      // Try to save to Firebase
      try {
        await saveUserProfile(credential.user.uid, newProfile);
      } catch (e) {
        console.error('Failed to save profile to Firebase:', e);
        // Continue anyway, will sync when online
      }

      // Always save locally
      await saveProfileLocally(newProfile);
      await saveUserCredentialsLocally(credential.user.uid, email, name);
      setProfile(newProfile);

      const audioExists = await isAudioDownloaded();
      if (!audioExists) {
        downloadAudio().catch(() => {});
      }
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  }, []);

  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      try {
        const prof = await getUserProfile(user.uid);
        if (prof) {
          await saveProfileLocally(prof);
          await saveUserCredentialsLocally(user.uid, prof.email, prof.name);
          setProfile(prof);
        }
      } catch {
        const localProf = await getLocalProfile();
        setProfile(localProf);
      }
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    profile,
    isLoading,
    login,
    signup,
    logout,
    refreshProfile,
  }), [user, profile, isLoading, login, signup, logout, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
