import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { useAuth } from "@/lib/auth-context";
import { saveSession } from "@/lib/firebase";
import { SURYA_NAMASKAR_POSES, getPoseImage } from "@/constants/poses";
import { isAudioDownloaded, getAudioUri, getMediaSettings, type MediaSettings } from "@/lib/media-manager";
import Colors from "@/constants/colors";

const C = Colors.dark;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RING_SIZE = 200;
const RING_RADIUS = 82;
const RING_STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function safeSpeakStop() {
  try { Speech.stop(); } catch {}
}

function safeSpeak(text: string, opts?: Speech.SpeechOptions) {
  try { Speech.speak(text, opts); } catch {}
}

type Phase = 'config' | 'active' | 'rest' | 'complete';
type Mode = 'rounds' | 'minutes';

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Stepper({ value, onValueChange, min, max, label, unit }: {
  value: number;
  onValueChange: (v: number) => void;
  min: number;
  max: number;
  label: string;
  unit: string;
}) {
  return (
    <View style={configStyles.stepperRow}>
      <Text style={configStyles.stepperLabel}>{label}</Text>
      <View style={configStyles.stepperControls}>
        <Pressable
          onPress={() => { if (value > min) { onValueChange(value - 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
          style={[configStyles.stepperBtn, value <= min && { opacity: 0.3 }]}
          disabled={value <= min}
        >
          <Ionicons name="remove" size={20} color={C.text} />
        </Pressable>
        <Text style={configStyles.stepperValue}>{value} {unit}</Text>
        <Pressable
          onPress={() => { if (value < max) { onValueChange(value + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
          style={[configStyles.stepperBtn, value >= max && { opacity: 0.3 }]}
          disabled={value >= max}
        >
          <Ionicons name="add" size={20} color={C.text} />
        </Pressable>
      </View>
    </View>
  );
}

function ConfigView({ onStart }: { onStart: (config: { mode: Mode; rounds: number; minutes: number; holdSeconds: number; restSeconds: number }) => void }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('rounds');
  const [rounds, setRounds] = useState(3);
  const [minutes, setMinutes] = useState(10);
  const [holdSeconds, setHoldSeconds] = useState(15);
  const [restSeconds, setRestSeconds] = useState(5);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    isAudioDownloaded().then(ok => {
      setAudioAvailable(ok);
      setChecking(false);
    });
  }, []);

  const handleStartPress = () => {
    if (!audioAvailable) {
      Alert.alert(
        "Audio Required",
        "Please download the Sun Salutation audio from your Profile before starting a session.",
        [{ text: "OK" }]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onStart({ mode, rounds, minutes, holdSeconds, restSeconds });
  };

  return (
    <View style={[configStyles.container, { paddingTop: topPad + 16 }]}>
      <View style={configStyles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="close" size={28} color={C.text} />
        </Pressable>
        <Text style={configStyles.headerTitle}>Surya Namaskar</Text>
        <View style={{ width: 28 }} />
      </View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={configStyles.content}>
        <Image
          source={getPoseImage(1)}
          style={configStyles.heroImage}
          contentFit="contain"
        />

        <View style={configStyles.modeToggle}>
          <Pressable
            style={[configStyles.modeBtn, mode === 'rounds' && configStyles.modeBtnActive]}
            onPress={() => { setMode('rounds'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[configStyles.modeBtnText, mode === 'rounds' && configStyles.modeBtnTextActive]}>Rounds</Text>
          </Pressable>
          <Pressable
            style={[configStyles.modeBtn, mode === 'minutes' && configStyles.modeBtnActive]}
            onPress={() => { setMode('minutes'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[configStyles.modeBtnText, mode === 'minutes' && configStyles.modeBtnTextActive]}>Minutes</Text>
          </Pressable>
        </View>

        <View style={configStyles.steppers}>
          {mode === 'rounds' ? (
            <Stepper value={rounds} onValueChange={setRounds} min={1} max={12} label="Rounds" unit="rounds" />
          ) : (
            <Stepper value={minutes} onValueChange={setMinutes} min={5} max={60} label="Duration" unit="min" />
          )}
          <Stepper value={holdSeconds} onValueChange={setHoldSeconds} min={5} max={60} label="Hold Time" unit="sec" />
          <Stepper value={restSeconds} onValueChange={setRestSeconds} min={2} max={20} label="Rest Time" unit="sec" />
        </View>

        {!checking && !audioAvailable && (
          <Animated.View entering={FadeIn.duration(300)} style={configStyles.warningBox}>
            <Ionicons name="warning-outline" size={18} color={C.accent} />
            <Text style={configStyles.warningText}>Download audio from Profile to start</Text>
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={[configStyles.bottomArea, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            configStyles.startBtn,
            !audioAvailable && configStyles.startBtnDisabled,
            pressed && audioAvailable && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleStartPress}
        >
          <Ionicons name="play" size={24} color={audioAvailable ? C.background : C.textSecondary} />
          <Text style={[configStyles.startBtnText, !audioAvailable && { color: C.textSecondary }]}>Start Session</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function PoseView({ pose, timeRemaining, holdSeconds, breathScale }: {
  pose: typeof SURYA_NAMASKAR_POSES[0];
  timeRemaining: number;
  holdSeconds: number;
  breathScale: any;
}) {
  const progress = holdSeconds > 0 ? timeRemaining / holdSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  return (
    <View style={activeStyles.poseContainer}>
      <Animated.View style={animatedStyle}>
        <Image
          source={getPoseImage(pose.imageIndex)}
          style={activeStyles.poseImage}
          contentFit="contain"
        />
      </Animated.View>

      <View style={activeStyles.timerRingContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={C.surfaceElevated}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={C.accent}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={activeStyles.timerCenter}>
          <Text style={activeStyles.timerText}>{timeRemaining}</Text>
          <Text style={activeStyles.timerUnit}>sec</Text>
        </View>
      </View>
    </View>
  );
}

function ActiveView({ config, onComplete }: {
  config: { mode: Mode; rounds: number; minutes: number; holdSeconds: number; restSeconds: number };
  onComplete: (rounds: number, elapsed: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'active' | 'rest'>('active');
  const [currentStep, setCurrentStep] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(config.holdSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [mediaSettings, setMediaSettings] = useState<MediaSettings>({ ttsEnabled: true, bgAudioEnabled: true });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const breathScale = useSharedValue(1);

  useEffect(() => {
    getMediaSettings().then(setMediaSettings);
  }, []);

  useEffect(() => {
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const uri = await getAudioUri();
        if (!uri || !mounted) return;

        const settings = await getMediaSettings();
        if (!settings.bgAudioEnabled || !mounted) return;

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { isLooping: true, volume: 0.4, shouldPlay: true }
        );
        if (mounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (e) {
        console.error('Audio load error:', e);
      }
    };

    loadAudio();

    return () => {
      mounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const currentPose = SURYA_NAMASKAR_POSES[currentStep];

  const speakPose = useCallback((step: number) => {
    if (!mediaSettings.ttsEnabled) return;
    const pose = SURYA_NAMASKAR_POSES[step];
    safeSpeakStop();
    safeSpeak(`Step ${pose.step}. ${pose.sanskrit}. ${pose.name}.`, {
      language: 'en-US',
      rate: 0.85,
    });
  }, [mediaSettings.ttsEnabled]);

  useEffect(() => {
    speakPose(currentStep);
  }, []);

  const moveToNextPose = useCallback(() => {
    const nextStep = currentStep + 1;

    if (nextStep >= 12) {
      if (config.mode === 'rounds' && currentRound >= config.rounds) {
        setPhase('active');
        onComplete(currentRound, totalElapsed);
        return;
      }
      if (config.mode === 'minutes' && totalElapsed >= config.minutes * 60) {
        onComplete(currentRound, totalElapsed);
        return;
      }
      setCurrentRound(r => r + 1);
      setCurrentStep(0);
      setPhase('rest');
      setTimeRemaining(config.restSeconds);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      setCurrentStep(nextStep);
      setPhase('rest');
      setTimeRemaining(config.restSeconds);
    }
  }, [currentStep, currentRound, config, totalElapsed, onComplete]);

  const handleRestComplete = useCallback(() => {
    setPhase('active');
    setTimeRemaining(config.holdSeconds);
    speakPose(currentStep);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [config.holdSeconds, currentStep, speakPose]);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (soundRef.current) soundRef.current.setStatusAsync({ shouldPlay: false }).catch(() => {});
      return;
    }

    if (soundRef.current) soundRef.current.setStatusAsync({ shouldPlay: true }).catch(() => {});

    intervalRef.current = setInterval(() => {
      setTotalElapsed(e => e + 1);
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (phase === 'active') {
            moveToNextPose();
          } else {
            handleRestComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, phase, moveToNextPose, handleRestComplete]);

  const cleanup = useCallback(() => {
    safeSpeakStop();
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (soundRef.current) {
      soundRef.current.stopAsync().catch(() => {});
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
  }, []);

  const goNext = () => {
    if (phase === 'rest') {
      handleRestComplete();
    } else {
      moveToNextPose();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
      setPhase('active');
      setTimeRemaining(config.holdSeconds);
      speakPose(currentStep - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const totalSteps = config.mode === 'rounds' ? config.rounds * 12 : Infinity;
  const completedSteps = (currentRound - 1) * 12 + currentStep;
  const progressPct = config.mode === 'rounds'
    ? (completedSteps / totalSteps) * 100
    : Math.min((totalElapsed / (config.minutes * 60)) * 100, 100);

  return (
    <View style={[activeStyles.container, { paddingTop: topPad }]}>
      <View style={activeStyles.topBar}>
        <Pressable onPress={() => {
          cleanup();
          router.back();
        }} hitSlop={16}>
          <Ionicons name="close" size={26} color={C.text} />
        </Pressable>
        <View style={activeStyles.topInfo}>
          <Text style={activeStyles.roundText}>Round {currentRound}{config.mode === 'rounds' ? ` / ${config.rounds}` : ''}</Text>
          <Text style={activeStyles.elapsedText}>{formatTime(totalElapsed)}</Text>
        </View>
        <Text style={activeStyles.stepText}>Step {currentPose.step}/12</Text>
      </View>

      {phase === 'rest' ? (
        <Animated.View entering={FadeIn.duration(300)} style={activeStyles.restContainer}>
          <Text style={activeStyles.restLabel}>Rest</Text>
          <Text style={activeStyles.restTimer}>{timeRemaining}</Text>
          <Text style={activeStyles.restSub}>Next: {SURYA_NAMASKAR_POSES[currentStep].sanskrit}</Text>
        </Animated.View>
      ) : (
        <View style={activeStyles.mainContent}>
          <PoseView
            pose={currentPose}
            timeRemaining={timeRemaining}
            holdSeconds={config.holdSeconds}
            breathScale={breathScale}
          />
          <Text style={activeStyles.poseSanskrit}>{currentPose.sanskrit}</Text>
          <Text style={activeStyles.poseName}>{currentPose.name}</Text>
        </View>
      )}

      <View style={[activeStyles.controls, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 8 }]}>
        <View style={activeStyles.progressBarContainer}>
          <View style={[activeStyles.progressBar, { width: `${Math.min(progressPct, 100)}%` as any }]} />
        </View>

        <View style={activeStyles.controlRow}>
          <Pressable onPress={goPrev} style={activeStyles.controlBtn}>
            <Ionicons name="play-skip-back" size={28} color={C.text} />
          </Pressable>
          <Pressable
            onPress={() => { setIsPaused(!isPaused); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            style={activeStyles.pauseBtn}
          >
            <Ionicons name={isPaused ? "play" : "pause"} size={32} color={C.background} />
          </Pressable>
          <Pressable onPress={goNext} style={activeStyles.controlBtn}>
            <Ionicons name="play-skip-forward" size={28} color={C.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CompleteView({ rounds, elapsed, onSave }: { rounds: number; elapsed: number; onSave: () => void }) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const mins = Math.ceil(elapsed / 60);

  return (
    <View style={[completeStyles.container, { paddingTop: topPad }]}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={completeStyles.content}>
        <View style={completeStyles.checkCircle}>
          <Ionicons name="checkmark" size={48} color={C.background} />
        </View>
        <Text style={completeStyles.title}>Session Complete</Text>
        <Text style={completeStyles.subtitle}>Namaste! Great practice today.</Text>

        <View style={completeStyles.statsRow}>
          <View style={completeStyles.statItem}>
            <Text style={completeStyles.statValue}>{rounds}</Text>
            <Text style={completeStyles.statLabel}>Rounds</Text>
          </View>
          <View style={completeStyles.statDivider} />
          <View style={completeStyles.statItem}>
            <Text style={completeStyles.statValue}>{mins}</Text>
            <Text style={completeStyles.statLabel}>Minutes</Text>
          </View>
          <View style={completeStyles.statDivider} />
          <View style={completeStyles.statItem}>
            <Text style={completeStyles.statValue}>{rounds * 12}</Text>
            <Text style={completeStyles.statLabel}>Poses</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={[completeStyles.bottom, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [completeStyles.saveBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={onSave}
        >
          <Ionicons name="checkmark-circle" size={24} color={C.background} />
          <Text style={completeStyles.saveBtnText}>Save & Exit</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function SessionScreen() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('config');
  const [sessionConfig, setSessionConfig] = useState<any>(null);
  const [completionData, setCompletionData] = useState<{ rounds: number; elapsed: number } | null>(null);

  const handleStart = (config: any) => {
    setSessionConfig(config);
    setPhase('active');
  };

  const handleComplete = (rounds: number, elapsed: number) => {
    setCompletionData({ rounds, elapsed });
    setPhase('complete');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    safeSpeak("Session complete. Namaste.", { language: 'en-US', rate: 0.85 });
  };

  const handleSave = async () => {
    if (user && completionData) {
      try {
        await saveSession(user.uid, getToday(), {
          completed: true,
          durationMinutes: Math.ceil(completionData.elapsed / 60),
          roundsDone: completionData.rounds,
          sessionType: 'Surya Namaskar',
        });
      } catch (e) {
        console.error('Failed to save session:', e);
      }
    }
    safeSpeakStop();
    router.back();
  };

  if (phase === 'config') return <ConfigView onStart={handleStart} />;
  if (phase === 'active' && sessionConfig) return <ActiveView config={sessionConfig} onComplete={handleComplete} />;
  if (phase === 'complete' && completionData) return <CompleteView rounds={completionData.rounds} elapsed={completionData.elapsed} onSave={handleSave} />;
  return null;
}

const configStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 20,
    color: C.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  heroImage: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.5,
    marginBottom: 28,
    borderRadius: 20,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.border,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modeBtnActive: {
    backgroundColor: C.accent,
  },
  modeBtnText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
    color: C.textSecondary,
  },
  modeBtnTextActive: {
    color: C.background,
  },
  steppers: {
    width: '100%',
    gap: 12,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  stepperLabel: {
    fontFamily: "Outfit_500Medium",
    fontSize: 15,
    color: C.text,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperValue: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 16,
    color: C.accent,
    minWidth: 60,
    textAlign: "center",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.accentDim,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    width: '100%',
  },
  warningText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 13,
    color: C.accent,
    flex: 1,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 18,
  },
  startBtnDisabled: {
    backgroundColor: C.surfaceElevated,
  },
  startBtnText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    color: C.background,
  },
});

const activeStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topInfo: {
    alignItems: "center",
  },
  roundText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
    color: C.text,
  },
  elapsedText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  stepText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    color: C.textSecondary,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  poseContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  poseImage: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 20,
    marginBottom: 20,
  },
  timerRingContainer: {
    position: "relative",
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  timerCenter: {
    position: "absolute",
    alignItems: "center",
  },
  timerText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 44,
    color: C.text,
  },
  timerUnit: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    marginTop: -4,
  },
  poseSanskrit: {
    fontFamily: "Outfit_700Bold",
    fontSize: 24,
    color: C.accent,
    textAlign: "center",
  },
  poseName: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: C.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  restContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  restLabel: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 18,
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 3,
    marginBottom: 8,
  },
  restTimer: {
    fontFamily: "Outfit_700Bold",
    fontSize: 64,
    color: C.accent,
  },
  restSub: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: C.textTertiary,
    marginTop: 12,
  },
  controls: {
    paddingHorizontal: 24,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: C.surfaceElevated,
    borderRadius: 2,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBar: {
    height: '100%' as any,
    backgroundColor: C.accent,
    borderRadius: 2,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  pauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.accent,
    justifyContent: "center",
    alignItems: "center",
  },
});

const completeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
    color: C.text,
  },
  subtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: C.textSecondary,
    marginTop: 8,
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
    color: C.accent,
  },
  statLabel: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: C.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: C.border,
  },
  bottom: {
    paddingHorizontal: 24,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 18,
  },
  saveBtnText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    color: C.background,
  },
});
