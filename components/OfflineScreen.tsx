import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";

const C = Colors.dark;

export function OfflineScreen() {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-offline-outline" size={80} color={C.textTertiary} />
        </View>
        <Text style={styles.title}>You&apos;re Offline</Text>
        <Text style={styles.message}>
          For security reasons, we need you to be connected to the internet to help us authenticate.
        </Text>
        <Text style={styles.subtitle}>
          Please check your connection and try again.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
    color: C.text,
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: C.textTertiary,
    textAlign: "center",
    lineHeight: 21,
  },
});
