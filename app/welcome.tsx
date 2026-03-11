import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { markWelcomeSeen } = useUser();

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const pathOpacity = useSharedValue(0);
  const btnScale = useSharedValue(0.85);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    titleY.value = withDelay(300, withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) }));
    subtitleOpacity.value = withDelay(700, withTiming(1, { duration: 700 }));
    pathOpacity.value = withDelay(500, withTiming(1, { duration: 900 }));
    btnScale.value = withDelay(1100, withSpring(1, { damping: 14, stiffness: 120 }));
    btnOpacity.value = withDelay(1100, withTiming(1, { duration: 500 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const pathStyle = useAnimatedStyle(() => ({
    opacity: pathOpacity.value,
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ scale: btnScale.value }],
  }));

  function handleBegin() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markWelcomeSeen();
    router.replace("/(tabs)");
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <LinearGradient
      colors={["#F7F3EC", "#EFE8D8", "#E8DCC8"]}
      style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}
    >
      <View style={styles.inner}>
        <Animated.View style={[styles.titleBlock, titleStyle]}>
          <Text style={styles.brand}>Reclaim Yourself</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            Rebuild discipline, one day at a time.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.pathScene, pathStyle]}>
          <PathIllustration />
        </Animated.View>

        <Animated.View style={[styles.bottomBlock, subtitleStyle]}>
          <Text style={styles.quote}>
            "Every step forward is a step toward yourself."
          </Text>
        </Animated.View>

        <Animated.View style={[styles.btnWrapper, btnStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.beginBtn,
              pressed && styles.beginBtnPressed,
            ]}
            onPress={handleBegin}
          >
            <LinearGradient
              colors={[Colors.primaryLight, Colors.primary]}
              style={styles.beginBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.beginBtnText}>Begin My Journey</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

function PathIllustration() {
  return (
    <View style={styles.scene}>
      <View style={styles.sky}>
        <View style={styles.sunGlow} />
        <View style={styles.sun} />
      </View>
      <View style={styles.hills}>
        <View style={[styles.hill, styles.hillBack]} />
        <View style={[styles.hill, styles.hillFront]} />
      </View>
      <View style={styles.pathContainer}>
        <View style={[styles.pathSegment, { bottom: 0, width: 60, left: "50%", marginLeft: -30 }]} />
        <View style={[styles.pathSegment, { bottom: 20, width: 55, left: "50%", marginLeft: -27, transform: [{ rotate: "-3deg" }] }]} />
        <View style={[styles.pathSegment, { bottom: 44, width: 50, left: "50%", marginLeft: -22, transform: [{ rotate: "-6deg" }] }]} />
        <View style={[styles.pathDot, { bottom: 70, left: "50%", marginLeft: -8 }]} />
        <View style={[styles.pathDot, { bottom: 90, left: "50%", marginLeft: -5 }]} />
        <View style={[styles.pathDot, { bottom: 108, left: "50%", marginLeft: -3 }]} />
      </View>
      <View style={styles.character}>
        <View style={styles.charHead} />
        <View style={styles.charBody} />
      </View>
      <View style={styles.shrineHint}>
        <View style={styles.shrineTop} />
        <View style={styles.shrineBase} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  titleBlock: {
    alignItems: "center",
    gap: 10,
    marginTop: 24,
  },
  brand: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: Colors.textDark,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: Colors.primaryLight,
    borderRadius: 2,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textMedium,
    textAlign: "center",
    lineHeight: 22,
  },
  pathScene: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  scene: {
    width: 280,
    height: 220,
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
  },
  sky: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "#FBEBD0",
    overflow: "hidden",
  },
  sunGlow: {
    position: "absolute",
    top: -30,
    left: "50%",
    marginLeft: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(228, 175, 80, 0.25)",
  },
  sun: {
    position: "absolute",
    top: 18,
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8B84B",
    opacity: 0.8,
  },
  hills: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  hill: {
    position: "absolute",
    borderRadius: 200,
  },
  hillBack: {
    width: 280,
    height: 100,
    bottom: 40,
    left: -20,
    backgroundColor: "#9DC49A",
    opacity: 0.7,
  },
  hillFront: {
    width: 320,
    height: 80,
    bottom: 0,
    left: -20,
    backgroundColor: "#7A9970",
    opacity: 0.9,
  },
  pathContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  pathSegment: {
    position: "absolute",
    height: 18,
    backgroundColor: "#C4956A",
    borderRadius: 9,
    opacity: 0.85,
  },
  pathDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#D4A76A",
    opacity: 0.7,
  },
  character: {
    position: "absolute",
    bottom: 38,
    left: "50%",
    marginLeft: -10,
    alignItems: "center",
  },
  charHead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.amber,
    marginBottom: 2,
  },
  charBody: {
    width: 12,
    height: 18,
    borderRadius: 6,
    backgroundColor: Colors.amberLight,
  },
  shrineHint: {
    position: "absolute",
    top: 55,
    left: "50%",
    marginLeft: -18,
    alignItems: "center",
    opacity: 0.6,
  },
  shrineTop: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 22,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#D4AF37",
  },
  shrineBase: {
    width: 28,
    height: 18,
    backgroundColor: "#D4AF37",
    borderRadius: 4,
  },
  bottomBlock: {
    paddingHorizontal: 16,
  },
  quote: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textLight,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 20,
  },
  btnWrapper: {
    width: "100%",
    marginBottom: 8,
  },
  beginBtn: {
    borderRadius: 18,
    overflow: "hidden",
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  beginBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  beginBtnGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  beginBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.white,
    letterSpacing: 0.2,
  },
});
