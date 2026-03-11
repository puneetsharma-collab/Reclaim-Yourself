import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";

const PATH_NODES = [
  { day: 0, label: "Start", type: "start" },
  { day: 1, label: "Day 1", type: "node" },
  { day: 2, label: "Day 2", type: "node" },
  { day: 3, label: "Checkpoint", type: "checkpoint" },
  { day: 4, label: "Day 4", type: "node" },
  { day: 5, label: "Day 5", type: "node" },
  { day: 6, label: "Day 6", type: "node" },
  { day: 7, label: "Shrine", type: "shrine" },
];

function PathNode({ node, isActive, isCompleted }: { node: typeof PATH_NODES[0]; isActive: boolean; isCompleted: boolean }) {
  const scale = useSharedValue(isActive ? 1.2 : 1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bg =
    node.type === "shrine"
      ? isCompleted ? Colors.shrineGold : Colors.surfaceAlt
      : node.type === "checkpoint"
      ? isCompleted ? Colors.checkpointBlue : Colors.surfaceAlt
      : node.type === "start"
      ? Colors.sageLight
      : isCompleted
      ? Colors.sage
      : isActive
      ? Colors.primaryLight
      : Colors.surfaceAlt;

  const borderColor =
    node.type === "shrine"
      ? Colors.shrineGold
      : node.type === "checkpoint"
      ? Colors.checkpointBlue
      : isCompleted || isActive
      ? Colors.sage
      : Colors.border;

  return (
    <Animated.View style={[styles.nodeWrapper, anim]}>
      <View
        style={[
          styles.node,
          { backgroundColor: bg, borderColor },
          node.type === "shrine" && styles.nodeShrine,
          node.type === "checkpoint" && styles.nodeCheckpoint,
          isActive && styles.nodeActive,
        ]}
      >
        {node.type === "shrine" ? (
          <Ionicons
            name={isCompleted ? "sparkles" : "diamond-outline"}
            size={node.type === "shrine" ? 20 : 14}
            color={isCompleted ? Colors.white : Colors.textMuted}
          />
        ) : node.type === "checkpoint" ? (
          <Ionicons
            name={isCompleted ? "flag" : "flag-outline"}
            size={16}
            color={isCompleted ? Colors.white : Colors.textMuted}
          />
        ) : node.type === "start" ? (
          <Ionicons name="footsteps-outline" size={14} color={Colors.sageDark} />
        ) : isCompleted ? (
          <Ionicons name="checkmark" size={14} color={Colors.white} />
        ) : isActive ? (
          <Ionicons name="ellipse" size={10} color={Colors.primary} />
        ) : (
          <View style={styles.nodeDot} />
        )}
      </View>
      <Text
        style={[
          styles.nodeLabel,
          isActive && styles.nodeLabelActive,
          isCompleted && styles.nodeLabelDone,
          node.type === "shrine" && styles.nodeLabelShrine,
        ]}
      >
        {node.label}
      </Text>
    </Animated.View>
  );
}

function CharacterFigure({ streakDay }: { streakDay: number }) {
  const progress = Math.min(streakDay / 7, 1);
  const bodyOpacity = 0.5 + progress * 0.5;
  const headSize = 22 + progress * 8;
  const bodyHeight = 30 + progress * 14;
  const glowOpacity = streakDay >= 7 ? 0.6 : 0;

  const energyColor =
    streakDay >= 7
      ? Colors.shrineGold
      : streakDay >= 3
      ? Colors.sage
      : Colors.amber;

  return (
    <View style={styles.characterContainer}>
      {streakDay >= 7 && (
        <View style={[styles.characterGlow, { opacity: glowOpacity }]} />
      )}
      <View
        style={[
          styles.charHead,
          {
            width: headSize,
            height: headSize,
            borderRadius: headSize / 2,
            backgroundColor: energyColor,
            opacity: bodyOpacity,
          },
        ]}
      />
      <View
        style={[
          styles.charBody,
          {
            width: headSize * 0.75,
            height: bodyHeight,
            backgroundColor: energyColor,
            opacity: bodyOpacity * 0.85,
            borderRadius: 8,
            transform: [{ scaleY: streakDay < 3 ? 0.85 : 1 }],
          },
        ]}
      />
      {streakDay >= 7 && (
        <View style={styles.charAura}>
          <Ionicons name="sparkles" size={14} color={Colors.shrineGold} />
        </View>
      )}
    </View>
  );
}

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const { user, canCheckInToday, checkInSuccess, checkInRelapse } = useUser();
  const [showConfirmRelapse, setShowConfirmRelapse] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const celebScale = useSharedValue(0.8);
  const celebOpacity = useSharedValue(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!user) return null;

  const streak = user.currentStreak;
  const journeyPos = Math.min(streak, 7);

  async function handleYes() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await checkInSuccess();
    setCheckedInToday(true);
    setShowCelebration(true);
    celebOpacity.value = withTiming(1, { duration: 300 });
    celebScale.value = withSequence(
      withSpring(1.1, { damping: 10 }),
      withDelay(2000, withTiming(0.8, { duration: 400 }))
    );
    celebOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(2000, withTiming(0, { duration: 400 }))
    );
    setTimeout(() => setShowCelebration(false), 2800);
  }

  function handleNoPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowConfirmRelapse(true);
  }

  async function confirmRelapse() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowConfirmRelapse(false);
    await checkInRelapse();
  }

  const celebStyle = useAnimatedStyle(() => ({
    opacity: celebOpacity.value,
    transform: [{ scale: celebScale.value }],
  }));

  const todayChecked = !canCheckInToday;

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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>Your Journey</Text>
            <Text style={styles.screenSubtitle}>Return to the path. Reclaim yourself.</Text>
          </View>
          {user.freezePoints > 0 && (
            <View style={styles.freezeBadge}>
              <Ionicons name="snow-outline" size={13} color={Colors.sky} />
              <Text style={styles.freezeBadgeText}>{user.freezePoints}</Text>
            </View>
          )}
        </View>

        <View style={styles.streakCard}>
          <LinearGradient
            colors={streak >= 7 ? ["#C4962A", "#D4AF37"] : streak >= 3 ? ["#7A9970", "#5A7A5A"] : ["#C4956A", "#B07050"]}
            style={styles.streakGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.streakLeft}>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>
                {streak === 1 ? "Day Resisted" : "Days Resisted"}
              </Text>
              {streak >= 3 && (
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>
                    {streak >= 7 ? "Shrine Reached" : streak >= 3 ? "Checkpoint" : "Level 1"}
                  </Text>
                </View>
              )}
            </View>
            <CharacterFigure streakDay={streak} />
          </LinearGradient>
        </View>

        {user.freezePoints > 0 && (
          <View style={styles.freezeInfoCard}>
            <Ionicons name="snow-outline" size={16} color={Colors.sky} />
            <View style={styles.freezeInfoText}>
              <Text style={styles.freezeInfoTitle}>
                {user.freezePoints} Freeze {user.freezePoints === 1 ? "Point" : "Points"} Available
              </Text>
              <Text style={styles.freezeInfoDesc}>
                Protects your streak if you miss a day. Used automatically.
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>The Path</Text>
        <View style={styles.pathCard}>
          <View style={styles.levelRow}>
            <View style={[styles.levelMarker, { backgroundColor: Colors.sagePale }]}>
              <Text style={styles.levelMarkerText}>Level 1: Days 0–3</Text>
            </View>
            <View style={[styles.levelMarker, { backgroundColor: Colors.goldPale }]}>
              <Text style={styles.levelMarkerText}>Level 2: Days 4–7</Text>
            </View>
          </View>
          <View style={styles.pathRow}>
            {PATH_NODES.map((node, i) => (
              <React.Fragment key={node.day}>
                <PathNode
                  node={node}
                  isActive={journeyPos === node.day && node.day !== 0}
                  isCompleted={journeyPos > node.day || (node.day === 0)}
                />
                {i < PATH_NODES.length - 1 && (
                  <View
                    style={[
                      styles.pathLine,
                      journeyPos > node.day && styles.pathLineDone,
                      i === 2 && styles.pathLineDivider,
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Daily Check-in</Text>
        <View style={styles.checkInCard}>
          {todayChecked ? (
            <View style={styles.checkedInState}>
              <View style={styles.checkedIcon}>
                <Ionicons name="checkmark-circle" size={36} color={Colors.sage} />
              </View>
              <Text style={styles.checkedTitle}>
                {streak > 0 ? "You stayed strong today." : "You've logged in today."}
              </Text>
              <Text style={styles.checkedSubtitle}>Come back tomorrow to continue.</Text>
              {user.longestStreak > 0 && (
                <Text style={styles.bestStreak}>
                  Best: {user.longestStreak} {user.longestStreak === 1 ? "day" : "days"}
                </Text>
              )}
            </View>
          ) : (
            <>
              <Text style={styles.checkInTitle}>Did you resist your bad habit today?</Text>
              <Text style={styles.checkInStreak}>
                Current: {streak} {streak === 1 ? "day" : "days"} resisted
              </Text>

              <Pressable
                style={({ pressed }) => [styles.yesBtn, pressed && styles.yesBtnPressed]}
                onPress={handleYes}
              >
                <LinearGradient
                  colors={[Colors.sage, Colors.sageDark]}
                  style={styles.yesBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="shield-checkmark" size={18} color={Colors.white} />
                  <Text style={styles.yesBtnText}>Yes, I stayed strong</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.noBtn, pressed && styles.noBtnPressed]}
                onPress={handleNoPress}
              >
                <Ionicons name="refresh-outline" size={17} color={Colors.textLight} />
                <Text style={styles.noBtnText}>No, I stumbled</Text>
              </Pressable>

              <Text style={styles.noBtnHint}>
                A stumble does not erase your progress. Return to the path.
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      {showCelebration && (
        <Animated.View style={[styles.celebOverlay, celebStyle]}>
          <LinearGradient
            colors={[Colors.sage, Colors.sageDark]}
            style={styles.celebCard}
          >
            <Ionicons name="sparkles" size={28} color={Colors.goldLight} />
            <Text style={styles.celebText}>
              {user.currentStreak >= 7
                ? "You have reclaimed a part of yourself."
                : user.currentStreak >= 3
                ? "Checkpoint reached. A freeze point earned."
                : "You stayed strong today."}
            </Text>
          </LinearGradient>
        </Animated.View>
      )}

      <Modal
        visible={showConfirmRelapse}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmRelapse(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="refresh-circle-outline" size={40} color={Colors.amber} />
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Text style={styles.modalBody}>
              This will reset your streak to 0. Your freeze points will not protect you here.
            </Text>
            <View style={styles.modalBtns}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmRelapse(false)}
              >
                <Text style={styles.modalCancelText}>Go back</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={confirmRelapse}>
                <Text style={styles.modalConfirmText}>Reset streak</Text>
              </Pressable>
            </View>
            <Text style={styles.modalNote}>
              A stumble does not erase your progress. You can always return.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
    marginTop: 2,
  },
  freezeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.skyPale,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  freezeBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.sky,
  },
  streakCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  streakGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  streakLeft: {
    gap: 4,
  },
  streakNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 52,
    color: Colors.white,
    lineHeight: 56,
    letterSpacing: -2,
  },
  streakLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  levelBadge: {
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  levelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.white,
  },
  characterContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 80,
    position: "relative",
  },
  characterGlow: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.goldLight,
    top: -5,
  },
  charHead: {
    marginBottom: 3,
  },
  charBody: {},
  charAura: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  freezeInfoCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.skyPale,
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: Colors.skyLight,
  },
  freezeInfoText: {
    flex: 1,
    gap: 2,
  },
  freezeInfoTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.sky,
  },
  freezeInfoDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 17,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textDark,
  },
  pathCard: {
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
  levelRow: {
    flexDirection: "row",
    gap: 8,
  },
  levelMarker: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
  },
  levelMarkerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.textMedium,
  },
  pathRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nodeWrapper: {
    alignItems: "center",
    gap: 4,
  },
  node: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeShrine: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  nodeCheckpoint: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  nodeActive: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  nodeLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: "center",
  },
  nodeLabelActive: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  nodeLabelDone: {
    color: Colors.sage,
  },
  nodeLabelShrine: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.shrineGold,
  },
  pathLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginBottom: 14,
    marginHorizontal: -2,
  },
  pathLineDone: {
    backgroundColor: Colors.sage,
  },
  pathLineDivider: {
    borderStyle: "dashed",
  },
  checkInCard: {
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
  checkInTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.textDark,
    lineHeight: 24,
  },
  checkInStreak: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textLight,
  },
  yesBtn: {
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: Colors.sage,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  yesBtnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  yesBtnGradient: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  yesBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.white,
  },
  noBtn: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  noBtnPressed: {
    opacity: 0.7,
  },
  noBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textLight,
  },
  noBtnHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 16,
  },
  checkedInState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  checkedIcon: {},
  checkedTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.textDark,
    textAlign: "center",
  },
  checkedSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textLight,
    textAlign: "center",
  },
  bestStreak: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  celebOverlay: {
    position: "absolute",
    bottom: 130,
    left: 20,
    right: 20,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 10,
    shadowColor: Colors.sage,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  celebCard: {
    flexDirection: "row",
    gap: 12,
    padding: 18,
    alignItems: "center",
  },
  celebText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.white,
    flex: 1,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(44, 26, 14, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 340,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.textDark,
  },
  modalBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMedium,
    textAlign: "center",
    lineHeight: 21,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textMedium,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.amberPale,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.amberLight,
  },
  modalConfirmText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.amber,
  },
  modalNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 16,
  },
});
