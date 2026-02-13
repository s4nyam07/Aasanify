import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "@/lib/auth-context";
import { getAllSessions, type SessionData } from "@/lib/firebase";
import Colors from "@/constants/colors";

const C = Colors.dark;

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return dates;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function calculateStreak(sessions: Record<string, SessionData>): number {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (sessions[key]?.completed) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string | number;
  delay: number;
}

function StatCard({ icon, iconColor, label, value, delay }: StatCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={styles.statCard}>
      <View style={[styles.statIconBox, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Record<string, SessionData>>({});
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    if (user) {
      getAllSessions(user.uid).then(setSessions).catch(() => {});
    }
  }, [user]);

  const streak = calculateStreak(sessions);

  const weekDates = getWeekDates();
  const weekMinutes = weekDates.reduce((sum, date) => sum + (sessions[date]?.durationMinutes || 0), 0);

  const currentMonthKey = getMonthKey(new Date());
  const monthSessions = Object.entries(sessions).filter(([key]) => key.startsWith(currentMonthKey));
  const monthSessionCount = monthSessions.length;

  const totalRounds = Object.values(sessions).reduce((sum, s) => sum + (s.roundsDone || 0), 0);
  const totalMinutes = Object.values(sessions).reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  const maxWeekMin = Math.max(...weekDates.map(d => sessions[d]?.durationMinutes || 0), 1);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Analytics</Text>

        <View style={styles.statsGrid}>
          <StatCard icon="flame" iconColor="#FF8A65" label="Day Streak" value={streak} delay={100} />
          <StatCard icon="time" iconColor="#64B5F6" label="Week Minutes" value={weekMinutes} delay={200} />
          <StatCard icon="calendar" iconColor="#CE93D8" label="Month Sessions" value={monthSessionCount} delay={300} />
          <StatCard icon="refresh" iconColor="#4ADE80" label="Total Rounds" value={totalRounds} delay={400} />
        </View>

        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.chartCard}>
          <Text style={styles.chartTitle}>This Week</Text>
          <View style={styles.barChart}>
            {weekDates.map((date, i) => {
              const mins = sessions[date]?.durationMinutes || 0;
              const heightPct = maxWeekMin > 0 ? (mins / maxWeekMin) * 100 : 0;
              const isToday = date === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
              return (
                <View key={date} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.bar,
                      { height: `${Math.max(heightPct, 4)}%` as any },
                      isToday && styles.barToday,
                      mins === 0 && styles.barEmpty,
                    ]} />
                  </View>
                  <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                    {WEEKDAY_LABELS[i]}
                  </Text>
                  {mins > 0 && <Text style={styles.barValue}>{mins}m</Text>}
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.totalCard}>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{totalMinutes}</Text>
              <Text style={styles.totalLabel}>Total Minutes</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{Object.keys(sessions).length}</Text>
              <Text style={styles.totalLabel}>Total Sessions</Text>
            </View>
          </View>
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    width: '47%' as any,
    borderWidth: 1,
    borderColor: C.border,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  statValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
    color: C.text,
  },
  statLabel: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  chartTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 17,
    color: C.text,
    marginBottom: 20,
  },
  barChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    width: 28,
    height: 100,
    backgroundColor: C.surfaceElevated,
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: {
    width: '100%' as any,
    backgroundColor: C.accent,
    borderRadius: 8,
  },
  barToday: {
    backgroundColor: C.accent,
  },
  barEmpty: {
    backgroundColor: C.surfaceElevated,
  },
  barLabel: {
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    color: C.textTertiary,
  },
  barLabelToday: {
    color: C.accent,
    fontFamily: "Outfit_700Bold",
  },
  barValue: {
    fontFamily: "Outfit_500Medium",
    fontSize: 10,
    color: C.textSecondary,
  },
  totalCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: C.border,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  totalValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
    color: C.accent,
  },
  totalLabel: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: C.textSecondary,
  },
  totalDivider: {
    width: 1,
    height: 50,
    backgroundColor: C.border,
  },
});
