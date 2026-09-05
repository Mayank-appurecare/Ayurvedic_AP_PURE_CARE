import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { continueAsGuest } = useAuth();
  const [guestLoading, setGuestLoading] = useState(false);
  const [apiUnreachable, setApiUnreachable] = useState(false);

  // Ask the auth API whether it is up as soon as the app lands here, so a dead
  // backend is visible before the user types a number on the next screen.
  // `checkReachable` sends NO OTP and never rejects; a healthy backend renders
  // nothing at all, leaving this screen exactly as designed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const reachable = await authService.checkReachable();
      if (!cancelled) setApiUnreachable(!reachable);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGuest = async () => {
    setGuestLoading(true);
    try {
      await continueAsGuest();
      navigation.replace('Main');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1611071536236-4be69f0e5f1c?w=800' }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.iconCircle}>
          <Ionicons name="leaf" size={28} color={colors.textOnPrimary} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.brand}>Ojas Ayurveda</Text>
        <Text style={styles.subtitle}>Pure, natural wellness — delivered with care.</Text>

        {apiUnreachable && (
          <View style={styles.apiNotice}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
            <Text style={styles.apiNoticeText}>
              Can&apos;t reach the server right now. Login may not work — you can still browse as a guest.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <PrimaryButton label="Login" onPress={() => navigation.navigate('Login')} />
          <Pressable
            onPress={handleGuest}
            disabled={guestLoading}
            style={styles.guestBtn}
            accessibilityRole="button"
            accessibilityLabel="Continue as guest"
          >
            <Text style={styles.guestText}>{guestLoading ? 'Please wait…' : 'Continue as Guest'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between' },
  hero: { alignItems: 'center', paddingHorizontal: spacing.xl },
  heroImage: { width: '100%', height: 220, borderRadius: 24, backgroundColor: colors.surfaceMuted },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 4,
    borderColor: colors.background,
  },
  content: { paddingHorizontal: spacing.xl, alignItems: 'center' },
  brand: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.md },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  // Only rendered when the auth API cannot be reached; invisible otherwise.
  apiNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: '100%',
    backgroundColor: colors.warningSurface,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  apiNoticeText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  actions: { width: '100%', gap: spacing.sm },
  guestBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  guestText: { ...typography.bodyMedium, color: colors.primary },
});
