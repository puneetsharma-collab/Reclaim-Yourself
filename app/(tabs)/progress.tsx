import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";
import { getTodayString, daysBetween } from "@/lib/storage";

const MILESTONES = [
  {
    id: "day1",
    day: 1,
    title: "First Step",
    desc: "Completed your first day",
    icon: "footsteps-outline" as const,
    color: Colors.sageLight,
    iconColor: Colors.sageDark,
  },
  {
    id: "checkpoint",
    day: 3,
    title: "Checkpoint",
    desc: "Day 3 — Freeze point earned",
    icon: "flag" as const,
    color: Colors.skyPale,
    iconColor: Colors.checkpointBlue,
  },
  {
    id: "day5",
    day: 5,
    title: "Halfway",
    desc: "Five days of discipline",
    icon: "trending-up-outline" as const,
    color: Colors.goldPale,
    iconColor: Colors.primary,
  },
  {
    id: "shrine",
    day: 7,
    title: "Shrine Reached",
    desc: "Seven days — full reclaim",
    icon: "sparkles" as const,
    color: Colors.goldPale,
    iconColor: Colors.shrineGold,
  },
];

function StatCard({
  label,
  value,
  subvalue,
  icon,
  color,
  iconColor,
}: {
  label: string;
  value: string | number;
  subvalue?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  iconColor: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: Colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subvalue ? <Text style={styles.statSub}>{subvalue}</Text> : null}
    </View>
  );
}

function MilestoneBadge({
  milestone,
  unlocked,
}: {
  milestone: typeof MILESTONES[0];
  unlocked: boolean;
}) {
  return (
    <View
      style={[
        styles.badgeCard,
        unlocked ? styles.badgeUnlocked : styles.badgeLocked,
      ]}
    >
      <View
        style={[
          styles.badgeIcon,
          { backgroundColor: unlocked ? milestone.color : Colors.surfaceAlt },
        ]}
      >
        <Ionicons
          name={milestone.icon}
          size={22}
          color={unlocked ? milestone.iconColor : Colors.textMuted}
        />
      </View>
      <View style={styles.badgeText}>
        <Text
          style={[
            styles.badgeTitle,
            !unlocked && styles.badgeTitleLocked,
          ]}
        >
          {milestone.title}
        </Text>
        <Text style={styles.badgeDesc}>{milestone.desc}</Text>
      </View>
      {unlocked && (
        <Ionicons name="checkmark-circle" size={18} color={Colors.sage} />
      )}
      {!unlocked && (
        <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />
      )}
    </View>
  );
}

function WeekBar({ day, filled }: { day: number; filled: boolean }) {
  return (
    <View style={styles.weekBarWrapper}>
      <View
        style={[
          styles.weekBar,
          { backgroundColor: filled ? Colors.sage : Colors.surfaceAlt },
          filled && styles.weekBarFilled,
        ]}
      />
      <Text style={styles.weekBarLabel}>D{day}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!user) return null;

  const streak = user.currentStreak;
  const totalDays = user.totalWins + user.totalRelapses;
  const winRate = totalDays > 0 ? Math.round((user.totalWins / totalDays) * 100) : 0;
  const daysOnJourney = user.joinDate
    ? daysBetween(user.joinDate, getTodayString()) + 1
    : 1;

  const weekDays = [1, 2, 3, 4, 5, 6, 7];
  const filledDays = Math.min(streak, 7);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: 120 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Progress</Text>
          <Text style={styles.screenSubtitle}>Every day counts.</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Current Streak"
            value={`${streak} ${streak === 1 ? "day" : "days"}`}
            icon="flame-outline"
            color={streak >= 3 ? Colors.sagePale : Colors.amberPale}
            iconColor={streak >= 3 ? Colors.sage : Colors.amber}
          />
          <StatCard
            label="Longest Streak"
            value={`${user.longestStreak} ${user.longestStreak === 1 ? "day" : "days"}`}
            icon="trophy-outline"
            color={Colors.goldPale}
            iconColor={Colors.primary}
          />
          <StatCard
            label="Total Wins"
            value={user.totalWins}
            subvalue="successful days"
            icon="checkmark-circle-outline"
            color={Colors.sagePale}
            iconColor={Colors.sage}
          />
          <StatCard
            label="Relapses"
            value={user.totalRelapses}
            subvalue="stumbles, not failures"
            icon="refresh-outline"
            color={Colors.amberPale}
            iconColor={Colors.amber}
          />
          <StatCard
            label="Freeze Points"
            value={user.freezePoints}
            subvalue="streak protectors"
            icon="snow-outline"
            color={Colors.skyPale}
            iconColor={Colors.sky}
          />
          <StatCard
            label="Win Rate"
            value={`${winRate}%`}
            subvalue={`${daysOnJourney} days on journey`}
            icon="analytics-outline"
            color={Colors.goldPale}
            iconColor={Colors.gold}
          />
        </View>

        <Text style={styles.sectionTitle}>Current Week</Text>
        <View style={styles.weekCard}>
          <View style={styles.weekRow}>
            {weekDays.map((d) => (
              <WeekBar key={d} day={d} filled={d <= filledDays} />
            ))}
          </View>
          <Text style={styles.weekSummary}>
            {filledDays === 7
              ? "Perfect week — shrine reached."
              : filledDays >= 3
              ? `${filledDays} of 7 days. Checkpoint reached.`
              : filledDays > 0
              ? `${filledDays} of 7 days strong.`
              : "Begin your check-ins to fill this chart."}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Milestones</Text>
        <View style={styles.milestonesCard}>
          {MILESTONES.map((m) => (
            <MilestoneBadge
              key={m.id}
              milestone={m}
              unlocked={user.longestStreak >= m.day}
            />
          ))}
        </View>

        <View style={styles.insightCard}>
          <LinearGradient
            colors={["#F0EBE0", "#E8DCC8"]}
            style={styles.insightGradient}
          >
            <Ionicons name="leaf-outline" size={20} color={Colors.sage} />
            <Text style={styles.insightText}>
              {streak === 0
                ? "Every journey begins with a single step. Today is yours."
                : streak < 3
                ? "You are building the foundation. Stay the course."
                : streak < 7
                ? "You have reached the checkpoint. The shrine awaits."
                : "You have reclaimed a part of yourself. The path continues."}
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  screenTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textLight,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    gap: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.textDark,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textMedium,
  },
  statSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textDark,
  },
  weekCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  weekRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  weekBarWrapper: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  weekBar: {
    width: "100%",
    height: 60,
    borderRadius: 8,
  },
  weekBarFilled: {
    shadowColor: Colors.sage,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  weekBarLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
  },
  weekSummary: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
  },
  milestonesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  badgeUnlocked: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeLocked: {
    backgroundColor: Colors.surfaceAlt,
    opacity: 0.65,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    flex: 1,
    gap: 2,
  },
  badgeTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textDark,
  },
  badgeTitleLocked: {
    color: Colors.textMuted,
  },
  badgeDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textLight,
  },
  insightCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  insightGradient: {
    flexDirection: "row",
    gap: 12,
    padding: 18,
    alignItems: "flex-start",
  },
  insightText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMedium,
    flex: 1,
    lineHeight: 20,
    fontStyle: "italic",
  },
});
