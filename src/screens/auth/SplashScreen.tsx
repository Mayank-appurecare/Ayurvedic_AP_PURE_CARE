import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const ONBOARDING_KEY = '@ojas_ayurveda/onboarding_complete';
const MIN_DISPLAY_MS = 1800;

export function SplashScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, isLoading } = useAuth();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Refs let the single navigation effect below read the latest auth values
  // without re-running (and re-navigating) every time they change.
  const isLoadingRef = useRef(isLoading);
  const userRef = useRef(user);
  isLoadingRef.current = isLoading;
  userRef.current = user;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  useEffect(() => {
    let cancelled = false;

    const navigateNext = async () => {
      const start = Date.now();

      // Wait for the auth session to finish resolving from AsyncStorage.
      while (!cancelled && isLoadingRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const elapsed = Date.now() - start;
      const remaining = Math.max(MIN_DISPLAY_MS - elapsed, 0);
      await new Promise((resolve) => setTimeout(resolve, remaining));
      if (cancelled) return;

      if (userRef.current) {
        navigation.replace('Main');
        return;
      }

      const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (cancelled) return;

      if (onboardingComplete === 'true') {
        navigation.replace('Welcome');
      } else {
        navigation.replace('Onboarding');
      }
    };

    navigateNext();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="leaf" size={48} color={colors.textOnPrimary} />
        </View>
        <Text style={styles.brand}>Ojas Ayurveda</Text>
        <Text style={styles.tagline}>Rooted in Nature. Trusted for Wellness.</Text>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center', gap: spacing.xs },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brand: { ...typography.h1, color: colors.textOnPrimary },
  tagline: { ...typography.body, color: colors.primarySurface, marginTop: spacing.xxs, textAlign: 'center' },
});
