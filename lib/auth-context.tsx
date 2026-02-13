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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const prof = await getUserProfile(firebaseUser.uid);
          setProfile(prof);
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const prof = await getUserProfile(credential.user.uid);
      setProfile(prof);
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
      await saveUserProfile(credential.user.uid, newProfile);
      setProfile(newProfile);
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
      const prof = await getUserProfile(user.uid);
      setProfile(prof);
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
