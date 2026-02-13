import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";
import { getAllSessions, type SessionData } from "@/lib/firebase";
import Colors from "@/constants/colors";

const C = Colors.dark;

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calculateStreak(sessions: Record<string, SessionData>): number {
  let streak = 0;
  const today = new Date();
  const d = new Date(today);
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (sessions[key]?.completed) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<Record<string, SessionData>>({});
  const [loading, setLoading] = useState(true);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    if (user) {
      getAllSessions(user.uid)
        .then(setSessions)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const streak = calculateStreak(sessions);
  const todaySession = sessions[getToday()];
  const firstName = profile?.name?.split(' ')[0] || 'Yogi';

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.nameText}>{firstName}</Text>
          </View>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.headerLogo}
            contentFit="contain"
          />
        </Animated.View>

        {streak > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.streakCard}>
            <Ionicons name="flame" size={28} color={C.accent} />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.streakNumber}>{streak} Day Streak</Text>
              <Text style={styles.streakSub}>Keep it going!</Text>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Pressable
            style={({ pressed }) => [styles.quickStartCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/session");
            }}
          >
            <View style={styles.quickStartInner}>
              <View style={styles.quickStartIcon}>
                <Ionicons name="sunny" size={32} color={C.background} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.quickStartTitle}>Surya Namaskar</Text>
                <Text style={styles.quickStartSub}>Start your practice</Text>
              </View>
              <Ionicons name="play-circle" size={44} color={C.background} />
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.todayCard}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          {todaySession ? (
            <View style={styles.todayStats}>
              <View style={styles.todayStat}>
                <Ionicons name="checkmark-circle" size={24} color={C.success} />
                <Text style={styles.todayStatValue}>{todaySession.roundsDone}</Text>
                <Text style={styles.todayStatLabel}>Rounds</Text>
              </View>
              <View style={styles.todayDivider} />
              <View style={styles.todayStat}>
                <Ionicons name="time" size={24} color={C.accent} />
                <Text style={styles.todayStatValue}>{todaySession.durationMinutes}</Text>
                <Text style={styles.todayStatLabel}>Minutes</Text>
              </View>
              <View style={styles.todayDivider} />
              <View style={styles.todayStat}>
                <Ionicons name="fitness" size={24} color="#FF8A65" />
                <Text style={styles.todayStatValue}>{todaySession.sessionType}</Text>
                <Text style={styles.todayStatLabel}>Type</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noSession}>
              <Ionicons name="moon-outline" size={32} color={C.textTertiary} />
              <Text style={styles.noSessionText}>No session yet today</Text>
              <Text style={styles.noSessionSub}>Tap the button above to begin</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonBig}>More Features</Text>
          <Text style={styles.comingSoonBig2}>Coming Soon</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  greeting: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: C.textSecondary,
  },
  nameText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
    color: C.text,
    marginTop: 2,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  streakCard: {
    backgroundColor: C.accentDim,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(247, 201, 72, 0.2)',
  },
  streakNumber: {
    fontFamily: "Outfit_700Bold",
    fontSize: 20,
    color: C.accent,
  },
  streakSub: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: C.accentMuted,
    marginTop: 2,
  },
  quickStartCard: {
    backgroundColor: C.accent,
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
  },
  quickStartInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickStartIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: "center",
    alignItems: "center",
  },
  quickStartTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 20,
    color: C.background,
  },
  quickStartSub: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  todayCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 22,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 17,
    color: C.text,
    marginBottom: 18,
  },
  todayStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  todayStat: {
    alignItems: "center",
    gap: 6,
  },
  todayStatValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 22,
    color: C.text,
  },
  todayStatLabel: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: C.textSecondary,
  },
  todayDivider: {
    width: 1,
    height: 40,
    backgroundColor: C.border,
  },
  noSession: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
  },
  noSessionText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 15,
    color: C.textSecondary,
  },
  noSessionSub: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: C.textTertiary,
  },
  comingSoonContainer: {
    alignItems: "center",
    paddingVertical: 40,
    opacity: 0.08,
  },
  comingSoonBig: {
    fontFamily: "Outfit_700Bold",
    fontSize: 42,
    color: C.text,
    textTransform: "uppercase",
    letterSpacing: 4,
  },
  comingSoonBig2: {
    fontFamily: "Outfit_700Bold",
    fontSize: 42,
    color: C.text,
    textTransform: "uppercase",
    letterSpacing: 4,
  },
});
