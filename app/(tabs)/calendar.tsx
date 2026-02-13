import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAuth } from "@/lib/auth-context";
import { getAllSessions, type SessionData } from "@/lib/firebase";
import Colors from "@/constants/colors";

const C = Colors.dark;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;
  return { daysInMonth, startDayOfWeek };
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function calculateStreak(sessions: Record<string, SessionData>): number {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
    if (sessions[key]?.completed) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Record<string, SessionData>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    if (user) {
      getAllSessions(user.uid).then(setSessions).catch(() => {});
    }
  }, [user]);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === currentYear &&
    today.getMonth() === currentMonth &&
    today.getDate() === day;

  const { daysInMonth, startDayOfWeek } = getMonthData(currentYear, currentMonth);
  const streak = calculateStreak(sessions);

  const monthSessions = Object.entries(sessions).filter(([key]) => {
    const [y, m] = key.split('-').map(Number);
    return y === currentYear && m === currentMonth + 1;
  });

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Calendar</Text>

        <Animated.View entering={FadeIn.duration(400)} style={styles.streakBanner}>
          <Ionicons name="flame" size={22} color={C.accent} />
          <Text style={styles.streakText}>{streak} Day Streak</Text>
        </Animated.View>

        <View style={styles.calendarCard}>
          <View style={styles.monthNav}>
            <Pressable onPress={prevMonth} hitSlop={16}>
              <Ionicons name="chevron-back" size={24} color={C.text} />
            </Pressable>
            <Text style={styles.monthText}>{MONTHS[currentMonth]} {currentYear}</Text>
            <Pressable onPress={nextMonth} hitSlop={16}>
              <Ionicons name="chevron-forward" size={24} color={C.text} />
            </Pressable>
          </View>

          <View style={styles.daysHeader}>
            {DAYS.map(d => (
              <Text key={d} style={styles.dayHeaderText}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day === null) return <View key={`e-${i}`} style={styles.cell} />;
              const dateKey = formatDateKey(currentYear, currentMonth, day);
              const hasSession = sessions[dateKey]?.completed;
              const todayHighlight = isToday(day);
              return (
                <View key={`d-${day}`} style={styles.cell}>
                  <View style={[
                    styles.dayCircle,
                    todayHighlight && styles.todayCircle,
                    hasSession && styles.sessionCircle,
                  ]}>
                    <Text style={[
                      styles.dayText,
                      todayHighlight && styles.todayText,
                      hasSession && !todayHighlight && styles.sessionDayText,
                    ]}>
                      {day}
                    </Text>
                  </View>
                  {hasSession && <View style={styles.dot} />}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>This Month</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{monthSessions.length}</Text>
              <Text style={styles.summaryLabel}>Sessions</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {monthSessions.reduce((sum, [, s]) => sum + (s.durationMinutes || 0), 0)}
              </Text>
              <Text style={styles.summaryLabel}>Minutes</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {monthSessions.reduce((sum, [, s]) => sum + (s.roundsDone || 0), 0)}
              </Text>
              <Text style={styles.summaryLabel}>Rounds</Text>
            </View>
          </View>
        </View>
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
    marginBottom: 20,
  },
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.accentDim,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(247, 201, 72, 0.2)',
  },
  streakText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 16,
    color: C.accent,
  },
  calendarCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  monthText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 18,
    color: C.text,
  },
  daysHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    color: C.textTertiary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: '14.28%' as any,
    alignItems: "center",
    paddingVertical: 6,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  todayCircle: {
    backgroundColor: C.accent,
  },
  sessionCircle: {
    backgroundColor: C.accentDim,
  },
  dayText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    color: C.textSecondary,
  },
  todayText: {
    color: C.background,
    fontFamily: "Outfit_700Bold",
  },
  sessionDayText: {
    color: C.accent,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.accent,
    marginTop: 3,
  },
  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 17,
    color: C.text,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 24,
    color: C.accent,
  },
  summaryLabel: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: C.textSecondary,
  },
});
