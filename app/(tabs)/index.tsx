import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
  Image,
  Dimensions,
  ImageSourcePropType,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Asset imports ───────────────────────────────────────────────────────────
const IMG_DAY0 = require("../../assets/images/arin-day0.png");
const IMG_DAY1 = require("../../assets/images/arin-day1.png");
const IMG_DAY5 = require("../../assets/images/arin-day5.jpg");
const IMG_DAY7 = require("../../assets/images/arin-day7.jpg");
const IMG_PATH_BG = require("../../assets/images/path-bg.jpg");
const IMG_CHECKPOINT = require("../../assets/images/checkpoint-scene.jpg");
const IMG_SHRINE = require("../../assets/images/shrine-scene.jpg");

// ─── Helper: derive scene state from streak ──────────────────────────────────
function getSceneState(streak: number): {
  characterImage: ImageSourcePropType;
  showCheckpoint: boolean;
  showShrine: boolean;
  streakLabel: string;
} {
  let characterImage: ImageSourcePropType;

  if (streak === 0) {
    characterImage = IMG_DAY0;
  } else if (streak <= 2) {
    characterImage = IMG_DAY1;
  } else if (streak <= 6) {
    characterImage = IMG_DAY5;
  } else {
    characterImage = IMG_DAY7;
  }

  return {
    characterImage,
    showCheckpoint: streak >= 3,
    showShrine: streak >= 7,
    streakLabel:
      streak === 0
        ? "The path begins here."
        : streak <= 2
        ? "The journey has started."
        : streak <= 6
        ? "The checkpoint is behind you."
        : "You have reclaimed a part of yourself.",
  };
}

// ─── Animated scene component ─────────────────────────────────────────────────
function JourneyScene({ streak }: { streak: number }) {
  const scene = getSceneState(streak);
  const fadeAnim = useSharedValue(1);
  const prevStreakRef = useRef(streak);

  useEffect(() => {
    if (prevStreakRef.current !== streak) {
      prevStreakRef.current = streak;
      // Fade out → swap → fade in
      fadeAnim.value = withSequence(
        withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) })
      );
    }
  }, [streak]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  return (
    <View style={styles.sceneContainer}>
      {/* Full-screen path background */}
      <Image
        source={IMG_PATH_BG}
        style={styles.sceneBackground}
        resizeMode="cover"
      />

      {/* Animated character on top of background */}
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <Image
          source={scene.characterImage}
          style={styles.sceneImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* When shrine is unlocked, blend in the shrine scene at top half */}
      {scene.showShrine && (
        <Animated.View
          style={[styles.shrineOverlay, { opacity: 0.45 }]}
          pointerEvents="none"
        >
          <Image
            source={IMG_SHRINE}
            style={styles.shrineOverlayImage}
            resizeMode="cover"
          />
        </Animated.View>
      )}

      {/* Streak badge floating on scene */}
      <View style={styles.sceneBadge}>
        <Text style={styles.sceneBadgeNumber}>{streak}</Text>
        <Text style={styles.sceneBadgeLabel}>
          {streak === 1 ? "day" : "days"}
        </Text>
      </View>

      {/* Checkpoint indicator */}
      {scene.showCheckpoint && !scene.showShrine && (
        <View style={styles.checkpointBadge}>
          <Ionicons name="flag" size={11} color={Colors.white} />
          <Text style={styles.checkpointBadgeText}>Checkpoint</Text>
        </View>
      )}

      {/* Shrine indicator */}
      {scene.showShrine && (
        <View style={styles.shrineBadge}>
          <Ionicons name="sparkles" size={11} color={Colors.shrineGold} />
          <Text style={styles.shrineBadgeText}>Shrine Reached</Text>
        </View>
      )}

      {/* Atmospheric label at bottom */}
      <View style={styles.sceneLabel}>
        <Text style={styles.sceneLabelText}>{scene.streakLabel}</Text>
      </View>
    </View>
  );
}

// ─── Check-in content component ──────────────────────────────────────────────
function CheckInContent({
  streak,
  todayChecked,
  onYes,
  onNoPress,
  user,
}: {
  streak: number;
  todayChecked: boolean;
  onYes: () => void;
  onNoPress: () => void;
  user: any;
}) {
  if (todayChecked) {
    return (
      <View style={styles.checkInCheckedState}>
        <View style={styles.checkedIconWrap}>
          <Ionicons name="checkmark-circle" size={32} color={Colors.sage} />
        </View>
        <Text style={styles.checkedTitle}>
          {streak > 0 ? "You stayed strong today." : "You've logged today."}
        </Text>
        <Text style={styles.checkedSub}>Come back tomorrow.</Text>
        {user.longestStreak > 0 && (
          <View style={styles.bestRow}>
            <Ionicons name="trophy-outline" size={11} color={Colors.primary} />
            <Text style={styles.bestText}>
              Best: {user.longestStreak} {user.longestStreak === 1 ? "day" : "days"}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.checkInContent}>
      <Text style={styles.checkInQ}>Did you resist your bad habit today?</Text>

      <Pressable
        style={({ pressed }) => [styles.yesBtn, pressed && styles.yesBtnPressed]}
        onPress={onYes}
        testID="btn-yes"
      >
        <LinearGradient
          colors={[Colors.sage, Colors.sageDark]}
          style={styles.yesBtnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="shield-checkmark" size={16} color={Colors.white} />
          <Text style={styles.yesBtnText}>Yes, I stayed strong</Text>
        </LinearGradient>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.noBtn, pressed && styles.noBtnPressed]}
        onPress={onNoPress}
        testID="btn-no"
      >
        <Ionicons name="refresh-outline" size={14} color={Colors.textLight} />
        <Text style={styles.noBtnText}>No, I stumbled</Text>
      </Pressable>

      <Text style={styles.noBtnHint}>
        A stumble does not erase your progress.
      </Text>
    </View>
  );
}

// ─── Main Journey Screen ──────────────────────────────────────────────────────
export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const { user, canCheckInToday, checkInSuccess, checkInRelapse } = useUser();
  const [showConfirmRelapse, setShowConfirmRelapse] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebMsg, setCelebMsg] = useState("");
  const celebOpacity = useSharedValue(0);
  const celebY = useSharedValue(20);
  const celebStyle = useAnimatedStyle(() => ({
    opacity: celebOpacity.value,
    transform: [{ translateY: celebY.value }],
  }));

  if (!user) return null;

  const streak = user.currentStreak;
  const todayChecked = !canCheckInToday;

  async function handleYes() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await checkInSuccess();

    const newStreak = streak + 1;
    const msg =
      newStreak >= 7
        ? "You have reclaimed a part of yourself."
        : newStreak === 3
        ? "Checkpoint reached. Freeze point earned."
        : "You stayed strong today.";
    setCelebMsg(msg);
    setShowCelebration(true);

    celebOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(2200, withTiming(0, { duration: 400 }))
    );
    celebY.value = withSequence(
      withSpring(0, { damping: 14 }),
      withDelay(2200, withTiming(20, { duration: 400 }))
    );
    setTimeout(() => setShowCelebration(false), 3000);
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

  const topPad = Platform.OS === "web" ? 20 : insets.top + 12;
  const tabBarHeight = 80;

  function getMilestoneLabel(s: number): string {
    if (s === 0) return "Day 0 - Start";
    if (s <= 2) return `Day ${s}`;
    if (s === 3) return "Day 3 - Checkpoint";
    if (s <= 6) return `Day ${s}`;
    return "Day 7 - Shrine";
  }

  return (
    <View style={styles.container}>
      {/* Full-screen journey scene */}
      <JourneyScene streak={streak} />

      {/* Journey Progress Label - on top of image */}
      <View style={styles.journeyLabelTop}>
        <Text style={styles.journeyLabelText}>{getMilestoneLabel(streak)}</Text>
      </View>

      {/* Header overlay at top */}
      <View style={[styles.headerOverlay, { paddingTop: topPad, marginTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.screenTitle}>Reclaim Yourself</Text>
            <Text style={styles.screenSubtitle}>Return to the path.</Text>
          </View>
          {user.freezePoints > 0 && (
            <View style={styles.freezeBadge}>
              <Ionicons name="snow-outline" size={12} color={Colors.sky} />
              <Text style={styles.freezeBadgeText}>{user.freezePoints}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Floating check-in box at bottom - above tab bar */}
      <View style={[styles.checkInBoxWrapper, { paddingBottom: tabBarHeight }]}>
        {/* Freeze info if needed */}
        {user.freezePoints > 0 && (
          <View style={styles.freezeInfoBox}>
            <Ionicons name="snow-outline" size={12} color={Colors.sky} />
            <Text style={styles.freezeInfoText}>
              {user.freezePoints} freeze {user.freezePoints === 1 ? "point" : "points"} available
            </Text>
          </View>
        )}

        {/* Transparent check-in box */}
        <View style={styles.checkInBox}>
          <CheckInContent
            streak={streak}
            todayChecked={todayChecked}
            onYes={handleYes}
            onNoPress={handleNoPress}
            user={user}
          />
        </View>
      </View>

      {/* Milestone progress - scrollable section at very bottom */}
      <View style={styles.milestoneWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.milestoneScrollContent}
          scrollEventThrottle={16}
        >
          {[
            { day: 1, label: "Day 1", icon: "footsteps-outline" as const },
            { day: 3, label: "Checkpoint", icon: "flag" as const },
            { day: 7, label: "Shrine", icon: "sparkles" as const },
          ].map((m, i) => {
            const done = streak >= m.day;
            return (
              <View key={m.day} style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneCircle,
                    done ? styles.milestoneCircleDone : undefined,
                    m.day === 7 && done ? styles.milestoneCircleShrine : undefined,
                  ]}
                >
                  <Ionicons
                    name={m.icon}
                    size={12}
                    color={done ? Colors.white : Colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.milestoneLabel,
                    done && styles.milestoneLabelDone,
                  ]}
                >
                  {m.label}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Celebration toast ── */}
      {showCelebration && (
        <Animated.View style={[styles.celebToast, celebStyle]}>
          <LinearGradient
            colors={[Colors.sage, Colors.sageDark]}
            style={styles.celebGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="sparkles" size={16} color={Colors.goldLight} />
            <Text style={styles.celebText}>{celebMsg}</Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* ── Relapse confirmation modal ── */}
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
              This will reset your streak to 0. Freeze points will not protect against an active reset.
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
              A stumble does not erase your progress. Return to the path.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    position: "relative",
  },

  // Full-screen journey scene
  sceneContainer: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  sceneBackground: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  sceneImage: {
    width: "100%",
    height: "100%",
  },
  shrineOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  shrineOverlayImage: {
    width: "100%",
    height: "100%",
  },
  sceneBadge: {
    position: "absolute",
    top: 100,
    right: 20,
    backgroundColor: "rgba(44, 26, 14, 0.6)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  sceneBadgeNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.white,
    lineHeight: 28,
    letterSpacing: -1,
  },
  sceneBadgeLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
  },
  checkpointBadge: {
    position: "absolute",
    top: 100,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.checkpointBlue,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  checkpointBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.white,
  },
  shrineBadge: {
    position: "absolute",
    top: 100,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(212, 175, 55, 0.9)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shrineBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.textDark,
  },
  sceneLabel: {
    position: "absolute",
    bottom: 200,
    left: 20,
    right: 20,
  },
  sceneLabelText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    textAlign: "center",
  },

  // Journey label on top of image
  journeyLabelTop: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    zIndex: 15,
  },
  journeyLabelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.white,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Header overlay
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextBlock: {
    flex: 1,
    gap: 1,
  },
  screenTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.white,
    letterSpacing: -0.3,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  screenSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  freezeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(148, 210, 255, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  freezeBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.sky,
  },

  // Check-in box wrapper and positioning
  checkInBoxWrapper: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  freezeInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(148, 210, 255, 0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  freezeInfoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.sky,
  },
  checkInBox: {
    backgroundColor: "rgba(240, 235, 230, 0.85)",
    borderRadius: 16,
    padding: 16,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    backdropFilter: "blur(20px)",
  },

  // Check-in content
  checkInContent: {
    gap: 12,
  },
  checkInQ: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textDark,
    lineHeight: 21,
    marginBottom: 4,
  },
  yesBtn: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: Colors.sage,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  yesBtnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  yesBtnGradient: {
    flexDirection: "row",
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  yesBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.white,
  },
  noBtn: {
    flexDirection: "row",
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(44, 26, 14, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  noBtnPressed: {
    opacity: 0.7,
  },
  noBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textDark,
  },
  noBtnHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textLight,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 2,
  },

  // Checked state
  checkInCheckedState: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  checkedIconWrap: {
    marginBottom: 2,
  },
  checkedTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textDark,
    textAlign: "center",
  },
  checkedSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
  },
  bestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  bestText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.primary,
  },

  // Milestone wrapper at bottom
  milestoneWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 5,
  },
  milestoneScrollContent: {
    paddingHorizontal: 20,
    gap: 20,
    alignItems: "center",
    paddingVertical: 12,
  },
  milestoneItem: {
    alignItems: "center",
    gap: 4,
  },
  milestoneCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneCircleDone: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
  },
  milestoneCircleShrine: {
    backgroundColor: Colors.shrineGold,
    borderColor: Colors.shrineGold,
  },
  milestoneLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
  milestoneLabelDone: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },

  // Celebration toast
  celebToast: {
    position: "absolute",
    bottom: 320,
    left: 16,
    right: 16,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: Colors.sage,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 30,
  },
  celebGradient: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    alignItems: "center",
  },
  celebText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.white,
    flex: 1,
    lineHeight: 18,
  },

  // Modal
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
