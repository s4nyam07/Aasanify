import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";
import { getAllSessions, type SessionData } from "@/lib/firebase";
import Colors from "@/constants/colors";

const C = Colors.dark;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, logout } = useAuth();
  const [sessions, setSessions] = useState<Record<string, SessionData>>({});
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    if (user) {
      getAllSessions(user.uid).then(setSessions).catch(() => {});
    }
  }, [user]);

  const totalSessions = Object.keys(sessions).length;
  const totalMinutes = Object.values(sessions).reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const totalRounds = Object.values(sessions).reduce((sum, s) => sum + (s.roundsDone || 0), 0);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      logout();
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          logout();
        },
      },
    ]);
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{profile?.name || 'Yogi'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || user?.email || ''}</Text>
          {profile?.age && (
            <View style={styles.ageBadge}>
              <Ionicons name="person-outline" size={14} color={C.textSecondary} />
              <Text style={styles.ageText}>Age {profile.age}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Journey</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={22} color={C.accent} />
              <Text style={styles.statValue}>{totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time" size={22} color="#64B5F6" />
              <Text style={styles.statValue}>{totalMinutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="refresh" size={22} color="#4ADE80" />
              <Text style={styles.statValue}>{totalRounds}</Text>
              <Text style={styles.statLabel}>Rounds</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={C.textSecondary} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{profile?.email || user?.email || '-'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={C.textSecondary} />
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={C.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 16 },
  title: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
    color: C.text,
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
    color: C.background,
  },
  profileName: {
    fontFamily: "Outfit_700Bold",
    fontSize: 22,
    color: C.text,
  },
  profileEmail: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 4,
  },
  ageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  ageText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 13,
    color: C.textSecondary,
  },
  statsCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  statsTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 17,
    color: C.text,
    marginBottom: 18,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 24,
    color: C.text,
  },
  statLabel: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: C.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: C.border,
  },
  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  infoLabel: {
    fontFamily: "Outfit_500Medium",
    fontSize: 15,
    color: C.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: C.text,
    maxWidth: '50%' as any,
    textAlign: "right",
  },
  infoDivider: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 32,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  logoutText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 16,
    color: C.error,
  },
});
