import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  Image,
  Dimensions,
  ImageSourcePropType,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SCENE_HEIGHT = 300;

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
      {/* Full-scene character image (already includes path background) */}
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

      {/* Bottom gradient fade so the scene blends into the card below */}
      <LinearGradient
        colors={["transparent", Colors.background]}
        style={styles.sceneBottomFade}
        pointerEvents="none"
      />

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

      {/* Atmospheric label */}
      <View style={styles.sceneLabel}>
        <Text style={styles.sceneLabelText}>{scene.streakLabel}</Text>
      </View>
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

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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

  const celebStyle = useAnimatedStyle(() => ({
    opacity: celebOpacity.value,
    transform: [{ translateY: celebY.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad, paddingBottom: 120 },
        ]}
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.screenTitle}>Reclaim Yourself</Text>
            <Text style={styles.screenSubtitle}>Return to the path. One day at a time.</Text>
          </View>
          {user.freezePoints > 0 && (
            <View style={styles.freezeBadge}>
              <Ionicons name="snow-outline" size={13} color={Colors.sky} />
              <Text style={styles.freezeBadgeText}>{user.freezePoints}</Text>
            </View>
          )}
        </View>

        {/* ── Illustrated Journey Scene ── */}
        <JourneyScene streak={streak} />

        {/* ── Freeze info strip ── */}
        {user.freezePoints > 0 && (
          <View style={styles.freezeStrip}>
            <Ionicons name="snow-outline" size={14} color={Colors.sky} />
            <Text style={styles.freezeStripText}>
              {user.freezePoints} freeze {user.freezePoints === 1 ? "point" : "points"} — protects your streak if you miss a day.
            </Text>
          </View>
        )}

        {/* ── Daily Check-in Card ── */}
        <View style={styles.checkInCard}>
          <Text style={styles.checkInHeading}>Daily Check-in</Text>

          {todayChecked ? (
            <View style={styles.checkedState}>
              <View style={styles.checkedIconWrap}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.sage} />
              </View>
              <Text style={styles.checkedTitle}>
                {streak > 0 ? "You stayed strong today." : "You've logged today."}
              </Text>
              <Text style={styles.checkedSub}>Come back tomorrow.</Text>
              {user.longestStreak > 0 && (
                <View style={styles.bestRow}>
                  <Ionicons name="trophy-outline" size={13} color={Colors.primary} />
                  <Text style={styles.bestText}>
                    Best streak: {user.longestStreak} {user.longestStreak === 1 ? "day" : "days"}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <>
              <View style={styles.streakRow}>
                <Text style={styles.streakBig}>{streak}</Text>
                <View style={styles.streakMeta}>
                  <Text style={styles.streakUnit}>
                    {streak === 1 ? "Day" : "Days"} Resisted
                  </Text>
                  {user.longestStreak > 0 && (
                    <Text style={styles.streakBest}>
                      Best: {user.longestStreak} {user.longestStreak === 1 ? "day" : "days"}
                    </Text>
                  )}
                </View>
              </View>

              <Text style={styles.checkInQ}>Did you resist your bad habit today?</Text>

              <Pressable
                style={({ pressed }) => [styles.yesBtn, pressed && styles.yesBtnPressed]}
                onPress={handleYes}
                testID="btn-yes"
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
                testID="btn-no"
              >
                <Ionicons name="refresh-outline" size={16} color={Colors.textLight} />
                <Text style={styles.noBtnText}>No, I stumbled</Text>
              </Pressable>

              <Text style={styles.noBtnHint}>
                A stumble does not erase your progress.
              </Text>
            </>
          )}
        </View>

        {/* ── Milestone progress bar ── */}
        <View style={styles.milestoneCard}>
          <View style={styles.milestoneRow}>
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
                      size={14}
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
                  {i < 2 && (
                    <View
                      style={[
                        styles.milestoneLine,
                        done && streak >= (i === 0 ? 3 : 7)
                          ? styles.milestoneLineDone
                          : undefined,
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Celebration toast ── */}
      {showCelebration && (
        <Animated.View style={[styles.celebToast, celebStyle]}>
          <LinearGradient
            colors={[Colors.sage, Colors.sageDark]}
            style={styles.celebGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="sparkles" size={18} color={Colors.goldLight} />
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
            <Ionicons name="refresh-circle-outline" size={44} color={Colors.amber} />
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
  scrollContent: {
    gap: 0,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTextBlock: {
    flex: 1,
    gap: 2,
  },
  screenTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.textDark,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textLight,
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

  // Journey Scene
  sceneContainer: {
    width: SCREEN_WIDTH,
    height: SCENE_HEIGHT,
    overflow: "hidden",
    position: "relative",
    marginBottom: 0,
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
  sceneBottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  sceneBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(44, 26, 14, 0.52)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  sceneBadgeNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.white,
    lineHeight: 32,
    letterSpacing: -1,
  },
  sceneBadgeLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  checkpointBadge: {
    position: "absolute",
    top: 16,
    left: 16,
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
    fontSize: 11,
    color: Colors.white,
  },
  shrineBadge: {
    position: "absolute",
    top: 16,
    left: 16,
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
    fontSize: 11,
    color: Colors.textDark,
  },
  sceneLabel: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 80,
  },
  sceneLabelText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Freeze strip
  freezeStrip: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: Colors.skyPale,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.skyLight,
  },
  freezeStripText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.sky,
    flex: 1,
  },

  // Check-in card
  checkInCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    padding: 20,
    gap: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  checkInHeading: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  streakBig: {
    fontFamily: "Inter_700Bold",
    fontSize: 56,
    color: Colors.textDark,
    lineHeight: 60,
    letterSpacing: -2,
  },
  streakMeta: {
    gap: 2,
  },
  streakUnit: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textDark,
  },
  streakBest: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textLight,
  },
  checkInQ: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textDark,
    lineHeight: 23,
  },
  yesBtn: {
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: Colors.sage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
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
  },
  checkedState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  checkedIconWrap: {},
  checkedTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.textDark,
    textAlign: "center",
  },
  checkedSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textLight,
    textAlign: "center",
  },
  bestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  bestText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.primary,
  },

  // Milestone card
  milestoneCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  milestoneItem: {
    alignItems: "center",
    gap: 6,
    flex: 1,
    position: "relative",
  },
  milestoneCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
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
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
  },
  milestoneLabelDone: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.textDark,
  },
  milestoneLine: {
    position: "absolute",
    top: 17,
    left: "55%",
    right: "-55%",
    height: 2,
    backgroundColor: Colors.border,
    zIndex: -1,
  },
  milestoneLineDone: {
    backgroundColor: Colors.sage,
  },

  // Celebration toast
  celebToast: {
    position: "absolute",
    bottom: 130,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.sage,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  celebGradient: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    alignItems: "center",
  },
  celebText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.white,
    flex: 1,
    lineHeight: 20,
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
