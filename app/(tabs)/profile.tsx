import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";
import { daysBetween, getTodayString } from "@/lib/storage";

function MenuRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  iconBg,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuRow,
        pressed && onPress ? styles.menuRowPressed : undefined,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.menuIcon,
          { backgroundColor: iconBg || Colors.surfaceAlt },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={iconColor || (destructive ? Colors.amber : Colors.textMedium)}
        />
      </View>
      <Text
        style={[
          styles.menuLabel,
          destructive && styles.menuLabelDestructive,
        ]}
      >
        {label}
      </Text>
      {value ? (
        <Text style={styles.menuValue}>{value}</Text>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, resetJourney } = useUser();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!user) return null;

  const daysOnJourney = user.joinDate
    ? daysBetween(user.joinDate, getTodayString()) + 1
    : 1;

  const currentLevel = user.shrineUnlocked ? "Shrine Bearer" : user.checkpointUnlocked ? "Path Walker" : "Seeker";

  async function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowResetModal(false);
    await resetJourney();
  }

  async function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLogoutModal(false);
    await logout();
  }

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
          <Text style={styles.screenTitle}>Profile</Text>
          <Text style={styles.screenSubtitle}>Private. Anonymous. Yours.</Text>
        </View>

        <View style={styles.avatarCard}>
          <LinearGradient
            colors={
              user.shrineUnlocked
                ? [Colors.goldPale, Colors.primaryDim]
                : user.checkpointUnlocked
                ? [Colors.sagePale, Colors.sageLight]
                : [Colors.background, Colors.surfaceAlt]
            }
            style={styles.avatarGradient}
          >
            <View style={styles.avatarCircle}>
              <Ionicons
                name={
                  user.shrineUnlocked
                    ? "sparkles"
                    : user.checkpointUnlocked
                    ? "leaf-outline"
                    : "person-outline"
                }
                size={32}
                color={
                  user.shrineUnlocked
                    ? Colors.shrineGold
                    : user.checkpointUnlocked
                    ? Colors.sage
                    : Colors.textMedium
                }
              />
            </View>
            <View style={styles.avatarInfo}>
              <Text style={styles.avatarId}>{user.anonymousId}</Text>
              <View style={styles.levelTag}>
                <Text style={styles.levelTagText}>{currentLevel}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Journey Info</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="calendar-outline"
              label="Joined"
              value={user.joinDate || "—"}
              iconBg={Colors.sagePale}
              iconColor={Colors.sage}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="time-outline"
              label="Days on Journey"
              value={`${daysOnJourney} ${daysOnJourney === 1 ? "day" : "days"}`}
              iconBg={Colors.skyPale}
              iconColor={Colors.sky}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="flame-outline"
              label="Current Streak"
              value={`${user.currentStreak} ${user.currentStreak === 1 ? "day" : "days"}`}
              iconBg={Colors.amberPale}
              iconColor={Colors.amber}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="trophy-outline"
              label="Longest Streak"
              value={`${user.longestStreak} ${user.longestStreak === 1 ? "day" : "days"}`}
              iconBg={Colors.goldPale}
              iconColor={Colors.primary}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="snow-outline"
              label="Freeze Points"
              value={`${user.freezePoints}`}
              iconBg={Colors.skyPale}
              iconColor={Colors.sky}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.privacyBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.sage} />
            <Text style={styles.privacyText}>
              Your account uses an anonymous ID. No email, phone number, or real identity is stored. All data is kept on this device only.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="refresh-circle-outline"
              label="Reset Journey"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowResetModal(true);
              }}
              destructive
              iconBg={Colors.amberPale}
              iconColor={Colors.amber}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="log-out-outline"
              label="Log Out"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowLogoutModal(true);
              }}
              iconBg={Colors.surfaceAlt}
              iconColor={Colors.textMedium}
            />
          </View>
        </View>

        <Text style={styles.footerNote}>
          Reclaim Yourself — a private journey toward discipline.
        </Text>
      </ScrollView>

      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="refresh-circle-outline" size={44} color={Colors.amber} />
            <Text style={styles.modalTitle}>Reset Journey?</Text>
            <Text style={styles.modalBody}>
              This will clear your current streak, freeze points, and journey progress. Your win/relapse history will also reset. This cannot be undone.
            </Text>
            <View style={styles.modalBtns}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.modalCancelText}>Keep Journey</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={handleReset}>
                <Text style={styles.modalConfirmText}>Reset</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="log-out-outline" size={40} color={Colors.textMedium} />
            <Text style={styles.modalTitle}>Log Out?</Text>
            <Text style={styles.modalBody}>
              Your progress is saved. You can log back in with your anonymous ID and password.
            </Text>
            <View style={styles.modalBtns}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Stay</Text>
              </Pressable>
              <Pressable style={[styles.modalConfirmBtn, styles.modalLogoutBtn]} onPress={handleLogout}>
                <Text style={styles.modalConfirmText}>Log Out</Text>
              </Pressable>
            </View>
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
  avatarCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarInfo: {
    flex: 1,
    gap: 6,
  },
  avatarId: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.textDark,
    letterSpacing: -0.3,
  },
  levelTag: {
    backgroundColor: "rgba(44, 26, 14, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  levelTagText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textMedium,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textMedium,
    paddingLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuRowPressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.textDark,
    flex: 1,
  },
  menuLabelDestructive: {
    color: Colors.amber,
  },
  menuValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textLight,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 64,
  },
  privacyBox: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: Colors.sagePale,
    borderRadius: 16,
    padding: 16,
  },
  privacyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.sageDark,
    flex: 1,
    lineHeight: 20,
  },
  footerNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
    paddingBottom: 8,
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
  modalLogoutBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
  },
  modalConfirmText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.amber,
  },
});
