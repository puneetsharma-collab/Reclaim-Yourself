import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";

function ShrineScene({ unlocked }: { unlocked: boolean }) {
  const glow = useSharedValue(0.6);
  const float = useSharedValue(0);

  useEffect(() => {
    if (unlocked) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      float.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }
  }, [unlocked]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.95 + glow.value * 0.1 }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  if (!unlocked) {
    return (
      <View style={styles.shrineLockedScene}>
        <View style={styles.mistyBg} />
        <View style={styles.shrineLockedShape}>
          <View style={styles.shrineRoof} />
          <View style={styles.shrineWall}>
            <Ionicons name="lock-closed" size={28} color={Colors.textMuted} />
          </View>
        </View>
        <Text style={styles.shrineLockedLabel}>Shrine awaits at Day 7</Text>
      </View>
    );
  }

  return (
    <View style={styles.shrineUnlockedScene}>
      <LinearGradient
        colors={["#FBF5E6", "#EFE4C0", "#E8D5A0"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.shrineGlowOuter, glowStyle]} />
      <Animated.View style={[styles.shrineGlowInner, glowStyle]} />

      <Animated.View style={[styles.shrineStructure, floatStyle]}>
        <View style={styles.shrineRoofUnlocked}>
          <View style={styles.roofPeak} />
        </View>
        <View style={styles.shrineBodyUnlocked}>
          <Animated.View style={floatStyle}>
            <Ionicons name="sparkles" size={32} color={Colors.shrineGold} />
          </Animated.View>
        </View>
        <View style={styles.shrineSteps}>
          <View style={styles.step} />
          <View style={[styles.step, styles.stepWide]} />
        </View>
      </Animated.View>

      <View style={styles.particlesRow}>
        {[0, 1, 2, 3, 4].map((i) => (
          <ShrineParticle key={i} delay={i * 400} />
        ))}
      </View>
    </View>
  );
}

function ShrineParticle({ delay }: { delay: number }) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: delay }),
        withTiming(0.8, { duration: 800 }),
        withTiming(0, { duration: 800 })
      ),
      -1,
      false
    );
    y.value = withRepeat(
      withSequence(
        withTiming(0, { duration: delay }),
        withTiming(-24, { duration: 1600 })
      ),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={[styles.particle, style]}>
      <Ionicons name="star" size={8} color={Colors.shrineGold} />
    </Animated.View>
  );
}

function CharacterEvolution({ streakDay }: { streakDay: number }) {
  const stages = [
    {
      label: "Exhausted",
      desc: "Day 0",
      bodyColor: "#C4956A",
      opacity: 0.5,
      size: 18,
    },
    {
      label: "Awakening",
      desc: "Day 3",
      bodyColor: Colors.sage,
      opacity: 0.75,
      size: 22,
    },
    {
      label: "Reclaimed",
      desc: "Day 7",
      bodyColor: Colors.shrineGold,
      opacity: 1,
      size: 28,
    },
  ];

  const currentStage =
    streakDay >= 7 ? 2 : streakDay >= 3 ? 1 : 0;

  return (
    <View style={styles.evolutionRow}>
      {stages.map((stage, i) => (
        <View key={i} style={styles.evolutionItem}>
          <View
            style={[
              styles.evolutionFigure,
              i > currentStage && styles.evolutionFigureLocked,
            ]}
          >
            <View
              style={{
                width: stage.size,
                height: stage.size,
                borderRadius: stage.size / 2,
                backgroundColor: stage.bodyColor,
                opacity: i <= currentStage ? stage.opacity : 0.25,
                marginBottom: 3,
              }}
            />
            <View
              style={{
                width: stage.size * 0.75,
                height: stage.size * 1.2,
                borderRadius: 6,
                backgroundColor: stage.bodyColor,
                opacity: i <= currentStage ? stage.opacity * 0.8 : 0.2,
              }}
            />
          </View>
          <Text
            style={[
              styles.evolutionLabel,
              i <= currentStage && styles.evolutionLabelActive,
            ]}
          >
            {stage.label}
          </Text>
          <Text style={styles.evolutionDay}>{stage.desc}</Text>
          {i < stages.length - 1 && (
            <View
              style={[
                styles.evolutionArrow,
                i < currentStage && styles.evolutionArrowDone,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

export default function ShrineScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!user) return null;

  const unlocked = user.shrineUnlocked;
  const streak = user.currentStreak;

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
          <Text style={styles.screenTitle}>Shrine</Text>
          <Text style={styles.screenSubtitle}>
            {unlocked ? "You have reclaimed a part of yourself." : "The sacred destination."}
          </Text>
        </View>

        <View style={styles.shrineSceneCard}>
          <ShrineScene unlocked={unlocked} />
        </View>

        {unlocked && (
          <View style={styles.celebCard}>
            <LinearGradient
              colors={["#FBF5E6", "#EFE4C0"]}
              style={styles.celebGradient}
            >
              <Ionicons name="ribbon-outline" size={22} color={Colors.shrineGold} />
              <View style={styles.celebText}>
                <Text style={styles.celebTitle}>Seven Days Complete</Text>
                <Text style={styles.celebDesc}>
                  You have reclaimed a part of yourself. The discipline you have
                  built belongs to you now.
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {!unlocked && (
          <View style={styles.lockedCard}>
            <View style={styles.progressToShrine}>
              <Text style={styles.progressShrineText}>
                {Math.max(0, 7 - streak)} {Math.max(0, 7 - streak) === 1 ? "day" : "days"} to the shrine
              </Text>
              <View style={styles.progressBarTrack}>
                <LinearGradient
                  colors={[Colors.primaryLight, Colors.shrineGold]}
                  style={[
                    styles.progressBarFill,
                    { width: `${(Math.min(streak, 7) / 7) * 100}%` },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.progressShrineNote}>
                Complete your daily check-ins to reach the shrine.
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Character Evolution</Text>
        <View style={styles.evolutionCard}>
          <CharacterEvolution streakDay={unlocked ? 7 : streak} />
          <Text style={styles.evolutionNote}>
            {streak >= 7
              ? "Your character has been fully restored."
              : streak >= 3
              ? "Awakening has begun. Continue the path."
              : "The journey shapes who you become."}
          </Text>
        </View>

        <View style={styles.reflectionCard}>
          <Text style={styles.reflectionTitle}>Reflection</Text>
          <Text style={styles.reflectionText}>
            {unlocked
              ? "\"The shrine is not a destination — it is proof of what you are capable of. Each day you chose discipline over impulse, you built a stronger version of yourself. This is yours.\""
              : "\"The path to the shrine is walked one day at a time. Every morning you wake and choose discipline, you move closer. Stay the course.\""
            }
          </Text>
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
  shrineSceneCard: {
    borderRadius: 24,
    overflow: "hidden",
    height: 220,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  shrineLockedScene: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0EBE0",
    gap: 12,
  },
  mistyBg: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(240, 235, 224, 0.6)",
  },
  shrineLockedShape: {
    alignItems: "center",
    opacity: 0.45,
  },
  shrineRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 30,
    borderRightWidth: 30,
    borderBottomWidth: 40,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: Colors.textMuted,
  },
  shrineWall: {
    width: 52,
    height: 52,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  shrineLockedLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
  },
  shrineUnlockedScene: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shrineGlowOuter: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
  },
  shrineGlowInner: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(212, 175, 55, 0.25)",
  },
  shrineStructure: {
    alignItems: "center",
    zIndex: 2,
  },
  shrineRoofUnlocked: {
    alignItems: "center",
  },
  roofPeak: {
    width: 0,
    height: 0,
    borderLeftWidth: 36,
    borderRightWidth: 36,
    borderBottomWidth: 48,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: Colors.shrineGold,
  },
  shrineBodyUnlocked: {
    width: 64,
    height: 64,
    backgroundColor: "rgba(212, 175, 55, 0.25)",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.shrineGold,
    alignItems: "center",
    justifyContent: "center",
  },
  shrineSteps: {
    alignItems: "center",
    gap: 0,
  },
  step: {
    width: 56,
    height: 8,
    backgroundColor: Colors.goldLight,
    borderRadius: 2,
  },
  stepWide: {
    width: 80,
  },
  particlesRow: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    gap: 18,
    zIndex: 3,
  },
  particle: {
    alignItems: "center",
  },
  celebCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  celebGradient: {
    flexDirection: "row",
    gap: 14,
    padding: 18,
    alignItems: "flex-start",
  },
  celebText: {
    flex: 1,
    gap: 6,
  },
  celebTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textDark,
  },
  celebDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMedium,
    lineHeight: 20,
  },
  lockedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  progressToShrine: {
    gap: 10,
  },
  progressShrineText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textDark,
    textAlign: "center",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
    minWidth: 8,
  },
  progressShrineNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textDark,
  },
  evolutionCard: {
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
  evolutionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  evolutionItem: {
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  evolutionFigure: {
    alignItems: "center",
    height: 70,
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  evolutionFigureLocked: {
    opacity: 0.4,
  },
  evolutionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
  },
  evolutionLabelActive: {
    color: Colors.textDark,
  },
  evolutionDay: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
  },
  evolutionArrow: {
    position: "absolute",
    right: -26,
    top: "40%",
    width: 20,
    height: 2,
    backgroundColor: Colors.border,
  },
  evolutionArrowDone: {
    backgroundColor: Colors.sage,
  },
  evolutionNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
    fontStyle: "italic",
  },
  reflectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.shrineGold,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  reflectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textDark,
  },
  reflectionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMedium,
    lineHeight: 22,
    fontStyle: "italic",
  },
});
