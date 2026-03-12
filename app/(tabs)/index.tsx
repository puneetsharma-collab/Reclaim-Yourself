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
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const LEVEL_IMAGES: Record<number, Record<number, ImageSourcePropType>> = {
  1: {
    0: require("../../assets/images/l1-day0.png"),
    1: require("../../assets/images/l1-day1.png"),
    2: require("../../assets/images/l1-day2.jpg"),
    3: require("../../assets/images/l1-day3.jpg"),
    4: require("../../assets/images/l1-day4.jpg"),
    5: require("../../assets/images/l1-day5.jpg"),
    6: require("../../assets/images/l1-day6.jpg"),
    7: require("../../assets/images/l1-day7.jpg"),
  },
  2: {
    0: require("../../assets/images/l2-day0.jpg"),
    1: require("../../assets/images/l2-day1.jpg"),
    2: require("../../assets/images/l2-day2.jpg"),
    3: require("../../assets/images/l2-day3.jpg"),
    4: require("../../assets/images/l2-day4.jpg"),
    5: require("../../assets/images/l2-day5.jpg"),
    6: require("../../assets/images/l2-day6.jpg"),
    7: require("../../assets/images/l2-day7.jpg"),
    8: require("../../assets/images/l2-day8.jpg"),
    9: require("../../assets/images/l2-day9.jpg"),
    10: require("../../assets/images/l2-day10.jpg"),
  },
};

const IMG_CHECKPOINT = require("../../assets/images/checkpoint-scene.jpg");
const IMG_L1_FINAL = require("../../assets/images/l1-final.jpg");
const IMG_L2_FINAL = require("../../assets/images/l2-final.jpg");

const BLESSING_KEY_PREFIX = "reclaim_l1_blessing_";
const BLESSING_L2_KEY_PREFIX = "reclaim_l2_blessing_";

// ─── Helper: derive scene state from dayIndex + level ────────────────────────
function getSceneState(dayIndex: number, level: number = 1): {
  characterImage: ImageSourcePropType;
  showCheckpoint: boolean;
  showShrine: boolean;
  streakLabel: string;
} {
  const levelImages = LEVEL_IMAGES[level] ?? LEVEL_IMAGES[1];
  const maxDay = level === 2 ? 10 : 7;
  const clampedDay = Math.min(dayIndex, maxDay);
  const characterImage = levelImages[clampedDay] ?? levelImages[0];

  if (level === 2) {
    return {
      characterImage,
      showCheckpoint: dayIndex >= 3,
      showShrine: dayIndex >= 10,
      streakLabel:
        dayIndex === 0
          ? "A new journey begins."
          : dayIndex <= 2
          ? "You have entered the water."
          : dayIndex <= 9
          ? "Swimming toward the horizon."
          : "You have crossed the water.",
    };
  }

  return {
    characterImage,
    showCheckpoint: dayIndex >= 3,
    showShrine: dayIndex >= 7,
    streakLabel:
      dayIndex === 0
        ? "The path begins here."
        : dayIndex <= 2
        ? "The journey has started."
        : dayIndex <= 6
        ? "The checkpoint is behind you."
        : "You have reclaimed a part of yourself.",
  };
}

// ─── Animated scene component ─────────────────────────────────────────────────
function JourneyScene({
  dayIndex,
  streak,
  level,
  blessingClaimed,
  l2BlessingClaimed,
}: {
  dayIndex: number;
  streak: number;
  level: number;
  blessingClaimed: boolean;
  l2BlessingClaimed: boolean;
}) {
  const scene = getSceneState(dayIndex, level);

  let displayImage: ImageSourcePropType = scene.characterImage;
  if (level === 2 && l2BlessingClaimed && dayIndex >= 10) {
    displayImage = IMG_L2_FINAL;
  } else if (level === 1 && blessingClaimed && dayIndex >= 7) {
    displayImage = IMG_L1_FINAL;
  }

  const fadeAnim = useSharedValue(1);
  const prevDayRef = useRef(dayIndex);
  const prevBlessingRef = useRef(blessingClaimed || l2BlessingClaimed);
  const prevLevelRef = useRef(level);

  useEffect(() => {
    const changed =
      prevDayRef.current !== dayIndex ||
      prevLevelRef.current !== level ||
      prevBlessingRef.current !== (blessingClaimed || l2BlessingClaimed);
    if (changed) {
      prevDayRef.current = dayIndex;
      prevLevelRef.current = level;
      prevBlessingRef.current = blessingClaimed || l2BlessingClaimed;
      fadeAnim.value = withSequence(
        withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) })
      );
    }
  }, [dayIndex, level, blessingClaimed, l2BlessingClaimed]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  return (
    <View style={styles.sceneContainer}>
      {/* Animated character fills the full background */}
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <Image
          source={displayImage}
          style={styles.sceneImage}
          resizeMode="cover"
        />
      </Animated.View>

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
  const { user, canCheckInToday, checkInSuccess, checkInRelapse, moveToLevel2 } = useUser();
  const [showConfirmRelapse, setShowConfirmRelapse] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebMsg, setCelebMsg] = useState("");
  const [previewDay, setPreviewDay] = useState<number | null>(null);
  const [previewLevel, setPreviewLevel] = useState<number | null>(null);
  const [titleTapCount, setTitleTapCount] = useState(0);
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false);
  const [showMoveToLevel2Modal, setShowMoveToLevel2Modal] = useState(false);
  const [showLevel2CompleteModal, setShowLevel2CompleteModal] = useState(false);
  const [blessingClaimed, setBlessingClaimed] = useState(false);
  const [l2BlessingClaimed, setL2BlessingClaimed] = useState(false);
  const celebOpacity = useSharedValue(0);
  const celebY = useSharedValue(20);
  const celebStyle = useAnimatedStyle(() => ({
    opacity: celebOpacity.value,
    transform: [{ translateY: celebY.value }],
  }));

  useEffect(() => {
    if (user?.username) {
      AsyncStorage.getItem(BLESSING_KEY_PREFIX + user.username).then((val) => {
        if (val === "claimed") setBlessingClaimed(true);
      });
      AsyncStorage.getItem(BLESSING_L2_KEY_PREFIX + user.username).then((val) => {
        if (val === "claimed") setL2BlessingClaimed(true);
      });
    }
  }, [user?.username]);

  if (!user) return null;

  const streak = user.currentStreak;
  const journeyPos = user.journeyPosition ?? 0;
  const currentLevel = user.currentLevel ?? 1;
  const displayLevel = previewLevel ?? currentLevel;
  const maxDaysForLevel = displayLevel === 2 ? 10 : 7;
  const todayChecked = !canCheckInToday;
  const displayDayIndex = previewDay !== null ? previewDay : journeyPos;

  function handleTitleTap() {
    const next = titleTapCount + 1;
    setTitleTapCount(next);
    if (next >= 5) {
      setTitleTapCount(0);
      if (previewDay === null) {
        setPreviewDay(0);
        setPreviewLevel(currentLevel);
      } else {
        setPreviewDay(null);
        setPreviewLevel(null);
      }
    }
  }

  async function handleYes() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await checkInSuccess();

    const newStreak = streak + 1;
    const newJourneyPos = journeyPos + 1;

    // Level 1 completion
    if (currentLevel === 1 && newJourneyPos >= 7 && !blessingClaimed) {
      setShowLevelCompleteModal(true);
      return;
    }

    // Level 2 completion
    if (currentLevel === 2 && newJourneyPos >= 10 && !l2BlessingClaimed) {
      setShowLevel2CompleteModal(true);
      return;
    }

    const msg =
      newStreak === 3
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

  async function handleClaimBlessing() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(BLESSING_KEY_PREFIX + user.username, "claimed");
    setBlessingClaimed(true);
    setShowLevelCompleteModal(false);
  }

  async function handleMoveToLevel2() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await moveToLevel2();
    setShowMoveToLevel2Modal(false);
  }

  async function handleClaimL2Blessing() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(BLESSING_L2_KEY_PREFIX + user.username, "claimed");
    setL2BlessingClaimed(true);
    setShowLevel2CompleteModal(false);
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

  const topPad = Platform.OS === "web" ? 20 : insets.top + 40;
  const tabBarHeight = 80;

  return (
    <View style={styles.container}>
      {/* Full-screen journey scene */}
      <JourneyScene
        dayIndex={displayDayIndex}
        streak={streak}
        level={displayLevel}
        blessingClaimed={showLevelCompleteModal || blessingClaimed}
        l2BlessingClaimed={showLevel2CompleteModal || l2BlessingClaimed}
      />

      {/* Preview mode controls */}
      {previewDay !== null && (
        <View style={styles.previewPanel}>
          {/* Row 1: day navigation */}
          <View style={styles.previewNavRow}>
            <Pressable
              style={styles.previewArrow}
              onPress={() => setPreviewDay(Math.max(0, previewDay - 1))}
            >
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </Pressable>
            <View style={styles.previewLabel}>
              <Text style={styles.previewLabelText}>
                L{displayLevel} · Day {previewDay} / {maxDaysForLevel}
              </Text>
            </View>
            <Pressable
              style={styles.previewArrow}
              onPress={() => setPreviewDay(Math.min(maxDaysForLevel, previewDay + 1))}
            >
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </Pressable>
          </View>

          {/* Row 2: level toggle + modal test buttons */}
          <View style={styles.previewActionsRow}>
            <Pressable
              style={[
                styles.previewChip,
                displayLevel === 1 ? styles.previewChipActive : styles.previewChipInactive,
              ]}
              onPress={() => {
                setPreviewLevel(1);
                setPreviewDay(0);
              }}
            >
              <Text style={styles.previewChipText}>Lv 1</Text>
            </Pressable>
            <Pressable
              style={[
                styles.previewChip,
                displayLevel === 2 ? styles.previewChipActive : styles.previewChipInactive,
              ]}
              onPress={() => {
                setPreviewLevel(2);
                setPreviewDay(0);
              }}
            >
              <Text style={styles.previewChipText}>Lv 2</Text>
            </Pressable>
            <Pressable
              style={styles.previewChip}
              onPress={() => setShowLevelCompleteModal(true)}
            >
              <Text style={styles.previewChipText}>L1 Blessing</Text>
            </Pressable>
            <Pressable
              style={styles.previewChip}
              onPress={() => setShowMoveToLevel2Modal(true)}
            >
              <Text style={styles.previewChipText}>→ Lv2</Text>
            </Pressable>
            <Pressable
              style={styles.previewChip}
              onPress={() => setShowLevel2CompleteModal(true)}
            >
              <Text style={styles.previewChipText}>L2 Blessing</Text>
            </Pressable>
            <Pressable
              style={[styles.previewChip, styles.previewChipExit]}
              onPress={() => { setPreviewDay(null); setPreviewLevel(null); }}
            >
              <Text style={styles.previewChipText}>Exit</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Header overlay at top - moved down to avoid notch */}
      <View style={[styles.headerOverlay, { paddingTop: topPad, marginTop: insets.top + 24 }]}>
        <View style={styles.headerContent}>
          <Pressable style={styles.headerTextBlock} onPress={handleTitleTap}>
            <Text style={styles.screenTitle}>Reclaim Yourself</Text>
          </Pressable>
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

        {/* Journey Days Progress - level-aware */}
        <View style={styles.journeyDaysContainer}>
          {Array.from({ length: maxDaysForLevel }, (_, i) => i + 1).map((day) => (
            <View key={day} style={styles.dayDotWrapper}>
              <View
                style={[
                  styles.dayDot,
                  journeyPos >= day && styles.dayDotActive,
                  day === 3 && styles.dayDotCheckpoint,
                  displayLevel === 2 && day === 10 && styles.dayDotShrine,
                ]}
              >
                <Text style={[styles.dayDotText, maxDaysForLevel === 10 && styles.dayDotTextSmall]}>{day}</Text>
              </View>
              {day === 3 && (
                <View style={styles.checkpointLabel}>
                  <Ionicons name="flag" size={10} color={Colors.checkpointBlue} />
                  <Text style={styles.checkpointLabelText}>CP</Text>
                </View>
              )}
            </View>
          ))}
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
          {(displayLevel === 2
            ? [
                { day: 1, label: "Day 1", icon: "water-outline" as const },
                { day: 3, label: "Checkpoint", icon: "flag" as const },
                { day: 5, label: "Day 5", icon: "navigate-outline" as const },
                { day: 10, label: "Horizon", icon: "sparkles" as const },
              ]
            : [
                { day: 1, label: "Day 1", icon: "footsteps-outline" as const },
                { day: 3, label: "Checkpoint", icon: "flag" as const },
                { day: 7, label: "Shrine", icon: "sparkles" as const },
              ]
          ).map((m) => {
            const done = journeyPos >= m.day;
            const isFinal = displayLevel === 2 ? m.day === 10 : m.day === 7;
            return (
              <View key={m.day} style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneCircle,
                    done ? styles.milestoneCircleDone : undefined,
                    isFinal && done ? styles.milestoneCircleShrine : undefined,
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

      {/* ── Level One Complete modal ── */}
      <Modal
        visible={showLevelCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.levelCompleteOverlay}>
          <View style={styles.levelCompleteCard}>
            <View style={styles.levelCompleteIconRow}>
              <Ionicons name="sparkles" size={20} color={Colors.shrineGold} />
              <Ionicons name="sparkles" size={28} color={Colors.shrineGold} />
              <Ionicons name="sparkles" size={20} color={Colors.shrineGold} />
            </View>
            <Text style={styles.levelCompleteTitle}>Level One</Text>
            <Text style={styles.levelCompleteTitleAccent}>Complete</Text>
            <View style={styles.levelCompleteDivider} />
            <Text style={styles.levelCompleteBody}>
              You have walked the path.{"\n"}Your blessing awaits.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.claimBtn,
                pressed && styles.claimBtnPressed,
              ]}
              onPress={handleClaimBlessing}
            >
              <LinearGradient
                colors={["#D4AF37", "#B8860B"]}
                style={styles.claimBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="gift-outline" size={18} color="#fff" />
                <Text style={styles.claimBtnText}>Claim Your Blessing</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Begin Level 2 floating button (top-right, shown after L1 blessing) ── */}
      {(blessingClaimed && currentLevel === 1 && !showLevelCompleteModal) || showMoveToLevel2Modal ? (
        <Pressable
          style={({ pressed }) => [
            styles.beginL2Btn,
            { top: insets.top + (Platform.OS === "web" ? 68 : 72) },
            pressed && styles.beginL2BtnPressed,
          ]}
          onPress={handleMoveToLevel2}
        >
          <LinearGradient
            colors={["#2980B9", "#1A5276"]}
            style={styles.beginL2Gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="water-outline" size={13} color="#fff" />
            <Text style={styles.beginL2Text}>Begin L2</Text>
            <Ionicons name="arrow-forward" size={13} color="#fff" />
          </LinearGradient>
        </Pressable>
      ) : null}

      {/* ── Level Two Complete modal ── */}
      <Modal
        visible={showLevel2CompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.l2CompleteOverlay}>
          <View style={styles.l2CompleteCard}>
            <View style={styles.levelCompleteIconRow}>
              <Ionicons name="water" size={16} color="#4AA8D8" />
              <Ionicons name="sparkles" size={28} color={Colors.shrineGold} />
              <Ionicons name="water" size={16} color="#4AA8D8" />
            </View>
            <Text style={styles.l2CompleteTitle}>Level Two</Text>
            <Text style={styles.l2CompleteTitleAccent}>Complete</Text>
            <View style={styles.l2CompleteDivider} />
            <Text style={styles.levelCompleteBody}>
              You have crossed the water.{"\n"}Your blessing awaits.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.claimBtn,
                pressed && styles.claimBtnPressed,
              ]}
              onPress={handleClaimL2Blessing}
            >
              <LinearGradient
                colors={["#D4AF37", "#2980B9"]}
                style={styles.claimBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="gift-outline" size={18} color="#fff" />
                <Text style={styles.claimBtnText}>Claim Your Blessing</Text>
              </LinearGradient>
            </Pressable>
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

  // Journey days progress tracker
  journeyDaysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 0,
    marginTop: 12,
  },
  dayDotWrapper: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayDotActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
  },
  dayDotCheckpoint: {
    backgroundColor: Colors.checkpointBlue,
    borderColor: Colors.checkpointBlue,
    borderWidth: 2,
  },
  dayDotText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.white,
  },
  checkpointLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    backgroundColor: "rgba(66, 135, 245, 0.2)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  checkpointLabelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 8,
    color: Colors.checkpointBlue,
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
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 16,
    padding: 16,
  },

  // Check-in content
  checkInContent: {
    gap: 12,
  },
  checkInQ: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#000000",
    lineHeight: 24,
    marginBottom: 6,
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
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#000000",
  },
  noBtnHint: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#333333",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 3,
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

  previewPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    zIndex: 100,
  },
  previewNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewArrow: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  previewLabel: {
    flex: 1,
    alignItems: "center",
  },
  previewLabelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.white,
    letterSpacing: 0.2,
  },
  previewActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  previewChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  previewChipActive: {
    backgroundColor: "rgba(255,215,80,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,215,80,0.6)",
  },
  previewChipInactive: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  previewChipExit: {
    backgroundColor: "rgba(255,80,80,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.4)",
  },
  previewChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.white,
  },
  previewExit: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,80,80,0.3)",
  },
  previewExitText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#ff6b6b",
  },

  // Level One Complete modal
  levelCompleteOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 6, 2, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  levelCompleteCard: {
    backgroundColor: "#1A1208",
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    gap: 10,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.4)",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  levelCompleteIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  levelCompleteTitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "rgba(212, 175, 55, 0.75)",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  levelCompleteTitleAccent: {
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    color: "#D4AF37",
    letterSpacing: -1,
    lineHeight: 42,
    marginTop: -4,
  },
  levelCompleteDivider: {
    width: 60,
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.3)",
    marginVertical: 6,
  },
  levelCompleteBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 6,
  },
  claimBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  claimBtnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  claimBtnGradient: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  claimBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0.3,
  },

  // Level 2 day dot adjustments
  dayDotTextSmall: {
    fontSize: 9,
  },
  dayDotShrine: {
    backgroundColor: "#2980B9",
    borderColor: "#2980B9",
  },

  // Small floating "Begin L2" button
  beginL2Btn: {
    position: "absolute",
    right: 16,
    zIndex: 200,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#2980B9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  beginL2BtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  beginL2Gradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  beginL2Text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#fff",
    letterSpacing: 0.3,
  },

  // Move to Level 2 modal (kept for style references)
  moveToL2Card: {
    backgroundColor: "#0A1628",
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1.5,
    borderColor: "rgba(74, 168, 216, 0.5)",
    shadowColor: "#4AA8D8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  moveToL2IconRow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(74, 168, 216, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  moveToL2Subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(74, 168, 216, 0.7)",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  moveToL2Title: {
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    color: "#4AA8D8",
    letterSpacing: -1,
    lineHeight: 42,
    marginTop: -2,
  },
  moveToL2Divider: {
    width: 60,
    height: 1,
    backgroundColor: "rgba(74, 168, 216, 0.3)",
    marginVertical: 6,
  },
  moveToL2Body: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.65)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 6,
  },

  // Level 2 Complete modal
  l2CompleteOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 15, 30, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  l2CompleteCard: {
    backgroundColor: "#071020",
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    gap: 10,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1.5,
    borderColor: "rgba(74, 168, 216, 0.4)",
    shadowColor: "#4AA8D8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  l2CompleteTitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "rgba(74, 168, 216, 0.75)",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  l2CompleteTitleAccent: {
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    color: "#4AA8D8",
    letterSpacing: -1,
    lineHeight: 42,
    marginTop: -4,
  },
  l2CompleteDivider: {
    width: 60,
    height: 1,
    backgroundColor: "rgba(74, 168, 216, 0.3)",
    marginVertical: 6,
  },
});
