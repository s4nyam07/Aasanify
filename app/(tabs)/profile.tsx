import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { getAllSessions, type SessionData } from "@/lib/firebase";
import {
  isAudioDownloaded,
  downloadAudio,
  deleteAudio,
  getMediaSettings,
  saveMediaSettings,
  type MediaSettings,
} from "@/lib/media-manager";
import Colors from "@/constants/colors";

const C = Colors.dark;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, logout } = useAuth();
  const [sessions, setSessions] = useState<Record<string, SessionData>>({});
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [audioReady, setAudioReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [settings, setSettings] = useState<MediaSettings>({ ttsEnabled: true, bgAudioEnabled: true });

  const checkMedia = useCallback(async () => {
    const [downloaded, s] = await Promise.all([isAudioDownloaded(), getMediaSettings()]);
    setAudioReady(downloaded);
    setSettings(s);
  }, []);

  useFocusEffect(useCallback(() => { checkMedia(); }, [checkMedia]));

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

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadProgress(0);
    const ok = await downloadAudio((p) => setDownloadProgress(p));
    setDownloading(false);
    if (ok) {
      setAudioReady(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert("Download Failed", "Could not download audio. Please check your connection and try again.");
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      const ok = await deleteAudio();
      if (ok) {
        setAudioReady(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    };

    if (Platform.OS === 'web') {
      doDelete();
      return;
    }
    Alert.alert("Delete Audio", "Remove downloaded audio? You'll need to re-download before your next session.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: doDelete },
    ]);
  };

  const toggleSetting = async (key: keyof MediaSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await saveMediaSettings(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleSubscriptionClick = () => {
    if (Platform.OS === 'web') {
      alert('Subscriptions coming soon');
      return;
    }
    Alert.alert(
      "Subscriptions Coming Soon",
      "Premium features and subscription plans will be available soon. Stay tuned!",
      [{ text: "OK" }]
    );
  };

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

        <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.audioCard}>
          <View style={styles.audioHeader}>
            <Ionicons name="musical-notes" size={22} color={C.accent} />
            <Text style={styles.audioTitle}>Audio Library</Text>
          </View>

          <View style={styles.audioItem}>
            <View style={styles.audioItemLeft}>
              <View style={[styles.audioIcon, audioReady && styles.audioIconReady]}>
                <Ionicons name={audioReady ? "checkmark-circle" : "cloud-download-outline"} size={20} color={audioReady ? C.success : C.textSecondary} />
              </View>
              <View style={styles.audioItemInfo}>
                <Text style={styles.audioItemName}>Sun Salutation</Text>
                <Text style={styles.audioItemSub}>{audioReady ? "Downloaded" : "Not downloaded"}</Text>
              </View>
            </View>

            {downloading ? (
              <View style={styles.downloadingContainer}>
                <ActivityIndicator size="small" color={C.accent} />
                <Text style={styles.progressText}>{Math.round(downloadProgress * 100)}%</Text>
              </View>
            ) : audioReady ? (
              <Pressable onPress={handleDelete} hitSlop={10} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={C.error} />
              </Pressable>
            ) : (
              <Pressable
                onPress={handleDownload}
                style={({ pressed }) => [styles.dlBtn, pressed && { opacity: 0.8 }]}
              >
                <Ionicons name="download-outline" size={18} color={C.background} />
                <Text style={styles.dlBtnText}>Download</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.audioDivider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="volume-high-outline" size={20} color={C.textSecondary} />
              <Text style={styles.toggleLabel}>Background Audio</Text>
            </View>
            <Switch
              value={settings.bgAudioEnabled}
              onValueChange={() => toggleSetting('bgAudioEnabled')}
              trackColor={{ false: C.surfaceElevated, true: C.accentDim }}
              thumbColor={settings.bgAudioEnabled ? C.accent : C.textSecondary}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="mic-outline" size={20} color={C.textSecondary} />
              <Text style={styles.toggleLabel}>Voice (TTS) Guidance</Text>
            </View>
            <Switch
              value={settings.ttsEnabled}
              onValueChange={() => toggleSetting('ttsEnabled')}
              trackColor={{ false: C.surfaceElevated, true: C.accentDim }}
              thumbColor={settings.ttsEnabled ? C.accent : C.textSecondary}
            />
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

        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <Pressable
            style={({ pressed }) => [styles.subscriptionCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handleSubscriptionClick}
          >
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionIconBox}>
                <Ionicons name="star" size={24} color={C.accent} />
              </View>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionTitle}>Subscription</Text>
                <Text style={styles.subscriptionPlan}>Free</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={C.textTertiary} />
            </View>
            <View style={styles.subscriptionDivider} />
            <View style={styles.subscriptionFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={C.success} />
                <Text style={styles.featureText}>Basic Surya Namaskar</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={C.success} />
                <Text style={styles.featureText}>Session tracking</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="lock-closed" size={18} color={C.textTertiary} />
                <Text style={styles.featureTextLocked}>Premium features coming soon</Text>
              </View>
            </View>
            <View style={styles.upgradeHint}>
              <Text style={styles.upgradeText}>Tap to learn about upcoming premium plans</Text>
            </View>
          </Pressable>
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
  audioCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  audioHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  audioTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 17,
    color: C.text,
  },
  audioItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  audioItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  audioIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  audioIconReady: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  audioItemInfo: {
    gap: 2,
  },
  audioItemName: {
    fontFamily: "Outfit_500Medium",
    fontSize: 15,
    color: C.text,
  },
  audioItemSub: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: C.textSecondary,
  },
  downloadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 13,
    color: C.accent,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: "center",
    alignItems: "center",
  },
  dlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dlBtnText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
    color: C.background,
  },
  audioDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleLabel: {
    fontFamily: "Outfit_500Medium",
    fontSize: 15,
    color: C.text,
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
    textAlign: "right" as const,
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
  subscriptionCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  subscriptionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.accentDim,
    justifyContent: "center",
    alignItems: "center",
  },
  subscriptionInfo: {
    flex: 1,
    gap: 2,
  },
  subscriptionTitle: {
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    color: C.textSecondary,
  },
  subscriptionPlan: {
    fontFamily: "Outfit_700Bold",
    fontSize: 20,
    color: C.text,
  },
  subscriptionDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 16,
  },
  subscriptionFeatures: {
    gap: 10,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: C.text,
  },
  featureTextLocked: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: C.textTertiary,
  },
  upgradeHint: {
    backgroundColor: C.accentDim,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  upgradeText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 13,
    color: C.accentMuted,
  },
});
