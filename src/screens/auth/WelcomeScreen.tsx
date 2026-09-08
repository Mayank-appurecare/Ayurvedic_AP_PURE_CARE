import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
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

const LOGO = require('../../../assets/logo-mark.png');

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
  // `checkReachable` sends NO OTP and never rejects.
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
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      {/* Blurred logo watermark. Sits behind everything and ignores touches so
          it can never intercept a tap on the buttons above it. */}
      <View style={styles.watermarkWrap} pointerEvents="none">
        <Image source={LOGO} style={styles.watermark} contentFit="contain" blurRadius={5} />
      </View>

      {/* Everything is vertically centred as one block. */}
      <View style={styles.content}>
        <Image
          source={LOGO}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="AP Pure Care"
        />
        <Text style={styles.brand}>AP Pure Care</Text>
        <Text style={styles.subtitle}>Pure, natural wellness — delivered with care.</Text>

        {apiUnreachable && (
          <View style={styles.apiNotice}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
            <Text style={styles.apiNoticeText}>
              Can&apos;t reach the server right now. Login may not work — you can still browse as a
              guest.
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
            <Text style={styles.guestText}>
              {guestLoading ? 'Please wait…' : 'Continue as Guest'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      // Centres the single content block instead of pushing a hero to the top
      // and the buttons to the bottom.
      justifyContent: 'center',
      alignItems: 'center',
      // The watermark below is deliberately wider than the screen; clipping here
      // stops it widening the page. On mobile web an overflow like that also
      // expands the layout viewport, which added a vertical scrollbar too.
      overflow: 'hidden',
    },
    watermarkWrap: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    // Oversized and soft, but still readable as the logo behind the content.
    watermark: { width: '150%', height: '75%', opacity: 0.2 },
    content: {
      width: '100%',
      maxWidth: 420,
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
    },
    logo: { width: 128, height: 128, marginBottom: spacing.sm },
    brand: { ...typography.h1, color: colors.textPrimary, textAlign: 'center' },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
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
