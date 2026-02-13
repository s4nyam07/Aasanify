import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const C = Colors.dark;

interface GuideCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  delay: number;
  comingSoon?: boolean;
  onPress?: () => void;
  image?: any;
}

function GuideCard({ title, subtitle, icon, iconColor, delay, comingSoon, onPress, image }: GuideCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)}>
      <Pressable
        style={({ pressed }) => [
          styles.guideCard,
          comingSoon && styles.guideCardDim,
          pressed && !comingSoon && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => {
          if (!comingSoon && onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
          }
        }}
        disabled={comingSoon}
      >
        <View style={styles.guideCardContent}>
          {image ? (
            <Image source={image} style={styles.guideImage} contentFit="cover" />
          ) : (
            <View style={[styles.guideIconBox, { backgroundColor: `${iconColor}20` }]}>
              <Ionicons name={icon} size={32} color={iconColor} />
            </View>
          )}
          <View style={styles.guideInfo}>
            <Text style={styles.guideTitle}>{title}</Text>
            <Text style={styles.guideSub}>{subtitle}</Text>
          </View>
          {comingSoon ? (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={22} color={C.textTertiary} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function GuidesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={styles.title}>Guides</Text>
          <Text style={styles.subtitle}>Choose your practice</Text>
        </Animated.View>

        <View style={styles.guidesList}>
          <GuideCard
            title="Surya Namaskar"
            subtitle="12-step sun salutation flow"
            icon="sunny"
            iconColor="#F7C948"
            delay={200}
            onPress={() => router.push("/session")}
            image={require("@/assets/images/sun-salutation/pose1.png")}
          />

          <GuideCard
            title="Sudarshan Kriya"
            subtitle="Rhythmic breathing technique"
            icon="cloud"
            iconColor="#64B5F6"
            delay={300}
            comingSoon
          />

          <GuideCard
            title="Chandra Namaskar"
            subtitle="Moon salutation sequence"
            icon="moon"
            iconColor="#CE93D8"
            delay={400}
            comingSoon
          />
        </View>

        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.tipCard}>
          <Ionicons name="sparkles" size={20} color={C.accent} />
          <Text style={styles.tipText}>
            Practice Surya Namaskar daily for best results. Start with 3 rounds and gradually increase.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 16 },
  title: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
    color: C.text,
  },
  subtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: C.textSecondary,
    marginTop: 4,
    marginBottom: 28,
  },
  guidesList: {
    gap: 14,
    marginBottom: 28,
  },
  guideCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  guideCardDim: {
    opacity: 0.6,
  },
  guideCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  guideImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: C.surfaceElevated,
  },
  guideIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  guideInfo: {
    flex: 1,
    marginLeft: 16,
  },
  guideTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 17,
    color: C.text,
  },
  guideSub: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 3,
  },
  comingSoonBadge: {
    backgroundColor: C.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  comingSoonText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    color: C.textSecondary,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.accentDim,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(247, 201, 72, 0.2)',
  },
  tipText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: C.accentMuted,
    flex: 1,
    lineHeight: 21,
  },
});
