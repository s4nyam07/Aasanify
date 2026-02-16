import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { setOnboardingComplete } from '@/lib/onboarding-storage';
import { requestNotificationPermissions } from '@/lib/permissions';
import Colors from '@/constants/colors';

const C = Colors.dark;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Master Surya Namaskar',
    description: 'Learn the authentic 12-step sun salutation with guided voice instructions and beautiful visuals',
    icon: 'sunny' as const,
    color: '#F7C948',
  },
  {
    title: 'Track Your Progress',
    description: 'Monitor your daily practice with detailed analytics, streaks, and session history',
    icon: 'stats-chart' as const,
    color: '#64B5F6',
  },
  {
    title: 'Practice Offline',
    description: 'Download audio once and practice anytime, anywhere without internet connection',
    icon: 'cloud-download' as const,
    color: '#4ADE80',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
      translateX.value = withSpring(-(currentIndex + 1) * SCREEN_WIDTH);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      await requestNotificationPermissions();
      await setOnboardingComplete();
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = async () => {
    await requestNotificationPermissions();
    await setOnboardingComplete();
    router.replace('/(auth)/login');
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newTranslateX = -currentIndex * SCREEN_WIDTH + e.translationX;
      if (newTranslateX <= 0 && newTranslateX >= -(SLIDES.length - 1) * SCREEN_WIDTH) {
        translateX.value = newTranslateX;
      }
    })
    .onEnd((e) => {
      const shouldGoNext = e.translationX < -SCREEN_WIDTH / 3;
      const shouldGoPrev = e.translationX > SCREEN_WIDTH / 3;

      if (shouldGoNext && currentIndex < SLIDES.length - 1) {
        setCurrentIndex(currentIndex + 1);
        translateX.value = withSpring(-(currentIndex + 1) * SCREEN_WIDTH);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } else if (shouldGoPrev && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        translateX.value = withSpring(-(currentIndex - 1) * SCREEN_WIDTH);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } else {
        translateX.value = withSpring(-currentIndex * SCREEN_WIDTH);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Pressable onPress={handleSkip} hitSlop={16}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.slidesContainer, animatedStyle]}>
          {SLIDES.map((slide, index) => (
            <View key={index} style={styles.slide}>
              <Animated.View
                entering={FadeInDown.delay(200).duration(500)}
                style={[styles.iconBox, { backgroundColor: `${slide.color}20` }]}
              >
                <Ionicons name={slide.icon} size={80} color={slide.color} />
              </Animated.View>
              <Animated.Text
                entering={FadeInDown.delay(300).duration(500)}
                style={styles.title}
              >
                {slide.title}
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(400).duration(500)}
                style={styles.description}
              >
                {slide.description}
              </Animated.Text>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      <Animated.View
        entering={FadeInDown.delay(500).duration(500)}
        style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}
      >
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={C.background} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  skipText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: C.textSecondary,
  },
  slidesContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconBox: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: C.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.surfaceElevated,
  },
  dotActive: {
    width: 24,
    backgroundColor: C.accent,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 18,
  },
  buttonText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: C.background,
  },
});
