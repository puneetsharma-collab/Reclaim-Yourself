import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useUser();
  const [anonymousId, setAnonymousId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleLogin() {
    if (!anonymousId.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await login(anonymousId.trim(), password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || "Login failed.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  return (
    <LinearGradient
      colors={["#F7F3EC", "#EFE8D8"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: topPad + 24, paddingBottom: botPad + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Ionicons name="leaf-outline" size={28} color={Colors.sage} />
            </View>
            <Text style={styles.title}>Reclaim Yourself</Text>
            <Text style={styles.tagline}>Welcome back to the path.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.privacyNote}>
              Your identity stays anonymous.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Anonymous ID</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your ID"
                  placeholderTextColor={Colors.textMuted}
                  value={anonymousId}
                  onChangeText={setAnonymousId}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={Colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={Colors.amber} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.loginBtn,
                pressed && styles.loginBtnPressed,
                (isLoading) && styles.loginBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[Colors.primaryLight, Colors.primary]}
                style={styles.loginBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>Continue</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to the path?</Text>
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.footerLink}>Create account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.sagePale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.textDark,
    letterSpacing: -0.3,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMedium,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: Colors.textDark,
  },
  privacyNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.sage,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textMedium,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 8,
  },
  inputIcon: {},
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textDark,
    padding: 0,
  },
  eyeBtn: {
    padding: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.amberPale,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.amber,
    flex: 1,
  },
  loginBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  loginBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loginBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.white,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    alignItems: "center",
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMedium,
  },
  footerLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
});
