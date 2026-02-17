import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";
import { getAllSessions, type SessionData } from "@/lib/firebase";
import { getMediaSettings, saveMediaSettings, type MediaSettings } from "@/lib/media-manager";
import { getReminderSettings, saveReminderSettings, type ReminderSettings } from "@/lib/notifications";
import Colors from "@/constants/colors";

const C = Colors.dark;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, logout } = useAuth();
  const [sessions, setSessions] = useState<Record<string, SessionData>>({});
  const [settings, setSettings] = useState<MediaSettings>({ ttsEnabled: true });
  const [reminders, setReminders] = useState<ReminderSettings>({ enabled: false, hour: 7, minute: 0 });
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    const loadSettings = async () => {
      const [mediaSet, reminderSet] = await Promise.all([
        getMediaSettings(),
        getReminderSettings(),
      ]);
      setSettings(mediaSet);
      setReminders(reminderSet);
    };
    loadSettings();
  }, []);

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
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          logout();
        },
      },
    ]);
  };

  const toggleTTS = async () => {
    const next = { ...settings, ttsEnabled: !settings.ttsEnabled };
    setSettings(next);
    await saveMediaSettings(next);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleReminder = async () => {
    const next = { ...reminders, enabled: !reminders.enabled };
    setReminders(next);
    await saveReminderSettings(next);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', increase: boolean) => {
    const newReminders = { ...reminders };
    if (type === 'hour') {
      let newHour = reminders.hour + (increase ? 1 : -1);
      if (newHour < 0) newHour = 23;
      if (newHour > 23) newHour = 0;
      newReminders.hour = newHour;
    } else {
      let newMinute = reminders.minute + (increase ? 15 : -15);
      if (newMinute < 0) newMinute = 45;
      if (newMinute > 59) newMinute = 0;
      newReminders.minute = newMinute;
    }
    setReminders(newReminders);
    saveReminderSettings(newReminders);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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

  const formatTime = (hour: number, minute: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`;
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

        <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.settingsCard}>
          <View style={styles.settingsHeader}>
            <Ionicons name="settings-outline" size={22} color={C.accent} />
            <Text style={styles.settingsTitle}>Settings</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="mic-outline" size={20} color={C.textSecondary} />
              <Text style={styles.toggleLabel}>Voice Guidance (TTS)</Text>
            </View>
            <Switch
              value={settings.ttsEnabled}
              onValueChange={toggleTTS}
              trackColor={{ false: C.surfaceElevated, true: C.accentDim }}
              thumbColor={settings.ttsEnabled ? C.accent : C.textSecondary}
            />
          </View>

          <View style={styles.settingsDivider} />

          <View style={styles.reminderSection}>
            <View style={styles.reminderHeader}>
              <View style={styles.toggleInfo}>
                <Ionicons name="notifications-outline" size={20} color={C.textSecondary} />
                <Text style={styles.toggleLabel}>Daily Reminder</Text>
              </View>
              <Switch
                value={reminders.enabled}
                onValueChange={toggleReminder}
                trackColor={{ false: C.surfaceElevated, true: C.accentDim }}
                thumbColor={reminders.enabled ? C.accent : C.textSecondary}
              />
            </View>

            {reminders.enabled && (
              <View style={styles.timePickerContainer}>
                <Text style={styles.timePickerLabel}>Practice Time</Text>
                <View style={styles.timePicker}>
                  <View style={styles.timeControl}>
                    <Pressable
                      onPress={() => handleTimeChange('hour', true)}
                      style={styles.timeBtn}
                    >
                      <Ionicons name="chevron-up" size={20} color={C.text} />
                    </Pressable>
                    <Text style={styles.timeValue}>{String(reminders.hour % 12 || 12).padStart(2, '0')}</Text>
                    <Pressable
                      onPress={() => handleTimeChange('hour', false)}
                      style={styles.timeBtn}
                    >
                      <Ionicons name="chevron-down" size={20} color={C.text} />
                    </Pressable>
                  </View>
                  <Text style={styles.timeColon}>:</Text>
                  <View style={styles.timeControl}>
                    <Pressable
                      onPress={() => handleTimeChange('minute', true)}
                      style={styles.timeBtn}
                    >
                      <Ionicons name="chevron-up" size={20} color={C.text} />
                    </Pressable>
                    <Text style={styles.timeValue}>{String(reminders.minute).padStart(2, '0')}</Text>
                    <Pressable
                      onPress={() => handleTimeChange('minute', false)}
                      style={styles.timeBtn}
                    >
                      <Ionicons name="chevron-down" size={20} color={C.text} />
                    </Pressable>
                  </View>
                  <Text style={styles.timeAMPM}>{reminders.hour >= 12 ? 'PM' : 'AM'}</Text>
                </View>
                <Text style={styles.timeHint}>
                  You&apos;ll receive a reminder at {formatTime(reminders.hour, reminders.minute)} daily
                </Text>
              </View>
            )}
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
                <Text style={styles.featureText}>Surya Namaskar with TTS</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={C.success} />
                <Text style={styles.featureText}>Session tracking & analytics</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={C.success} />
                <Text style={styles.featureText}>Offline mode</Text>
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
  settingsCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  settingsTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 17,
    color: C.text,
  },
  settingsDivider: {
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
  reminderSection: {
    gap: 12,
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  timePickerContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  timePickerLabel: {
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    color: C.textSecondary,
    marginBottom: 12,
  },
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  timeControl: {
    alignItems: "center",
    gap: 6,
  },
  timeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  timeValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 32,
    color: C.accent,
    minWidth: 60,
    textAlign: "center",
  },
  timeColon: {
    fontFamily: "Outfit_700Bold",
    fontSize: 32,
    color: C.accent,
    marginBottom: 8,
  },
  timeAMPM: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 18,
    color: C.textSecondary,
    marginTop: 24,
  },
  timeHint: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: C.textTertiary,
    textAlign: "center",
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
